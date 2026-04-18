import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getUserData, setUserData } from "../utils/storage";
import { getMaxOrganizations, isFreeReadOnlyMode, isPaidActive } from "../utils/subscription";
import { getOrgType } from "../utils/orgTypes";
import { buildLocationLabel, normalizeSupportedCountry, parseLocationFields } from "../utils/profile";
import { ORG_COLLECTION_KEYS, buildOrgSummary, sortOrgCollectionRecords } from "../utils/orgCollections";
import { orgsApi, usersApi, membersApi } from "../lib/api";

const EMPTY_SUMMARY = {
  currentMonth: "",
  currentYear: 0,
  monthIncomeTotal: 0,
  monthExpenseTotal: 0,
  monthNet: 0,
  ytdIncomeTotal: 0,
  ytdExpenseTotal: 0,
  ytdNet: 0,
  overdueCount: 0,
  overdueAmount: 0,
  budgetAlerts: [],
  computedAt: ""
};
import { useAuth } from "./AuthContext";
import { logError } from "../utils/logger";

const DataContext = createContext();
const DEFAULT_ORG_ID = "org_primary";

// ── API shape ↔ DataContext shape mappers ─────────────────────────────────────

// Flat API response → nested DataContext org object
function fromApiOrg(apiOrg, collections = {}) {
  return {
    account: {
      name: apiOrg.name || "",
      email: apiOrg.email || "",
      phone: apiOrg.phone || "",
      addressLine: apiOrg.addressLine || "",
      city: apiOrg.city || "",
      state: apiOrg.state || "",
      country: apiOrg.country || "",
      location: apiOrg.location || "",
      address: apiOrg.address || "",
      gstin: apiOrg.gstin || "",
      showHSN: apiOrg.showHsn || false,
      organizationType: apiOrg.organizationType || "small_business"
    },
    currency: {
      code: apiOrg.currencyCode || "INR",
      symbol: apiOrg.currencySymbol || "Rs",
      name: apiOrg.currencyName || "Indian Rupee",
      flag: apiOrg.currencyFlag || "IN"
    },
    goals: {
      monthlySavings: apiOrg.goalsMonthlySavings || 0,
      targetAmount: apiOrg.goalsTargetAmount || 0,
      targetDate: apiOrg.goalsTargetDate || "",
      savedAmount: apiOrg.goalsSavedAmount || 0,
      note: apiOrg.goalsNote || ""
    },
    budgets: apiOrg.budgets || {},
    notificationPrefs: { ...EMPTY_ORG_DATA.notificationPrefs, ...(apiOrg.notificationPrefs || {}) },
    income: collections.income || apiOrg.income || [],
    expenses: collections.expenses || apiOrg.expenses || [],
    invoices: collections.invoices || apiOrg.invoices || [],
    customers: collections.customers || apiOrg.customers || [],
    orgRecords: collections.orgRecords || apiOrg.orgRecords || {}
  };
}

// Nested DataContext org → flat API update payload
function toApiOrgUpdate(orgData) {
  const acc = orgData.account || {};
  const cur = orgData.currency || {};
  const goals = orgData.goals || {};
  return {
    name: acc.name || "",
    email: acc.email || "",
    phone: acc.phone || "",
    addressLine: acc.addressLine || "",
    city: acc.city || "",
    state: acc.state || "",
    country: acc.country || "",
    location: acc.location || "",
    address: acc.address || "",
    gstin: acc.gstin || "",
    showHsn: Boolean(acc.showHSN),
    organizationType: acc.organizationType || "small_business",
    currencyCode: cur.code || "INR",
    currencySymbol: cur.symbol || "Rs",
    currencyName: cur.name || "Indian Rupee",
    currencyFlag: cur.flag || "IN",
    goalsMonthlySavings: Number(goals.monthlySavings) || 0,
    goalsTargetAmount: Number(goals.targetAmount) || 0,
    goalsTargetDate: goals.targetDate || "",
    goalsSavedAmount: Number(goals.savedAmount) || 0,
    goalsNote: goals.note || "",
    budgets: orgData.budgets || {},
    notificationPrefs: orgData.notificationPrefs || {}
  };
}
const SESSION_STORAGE_PREFIX = "ledger-session-analytics:";
const SESSION_FLUSH_INTERVAL_MS = 30000;
const SESSION_MIN_FLUSH_MS = 1000;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Incremental load helpers ──────────────────────────────────────────────────
// Full syncs older than this threshold are re-run to pick up server-side deletions.
const INCREMENTAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getSyncedAt(userId, orgId) {
  return getUserData(userId, `syncedAt:${orgId}`) || null;
}
function setSyncedAt(userId, orgId, ts) {
  setUserData(userId, `syncedAt:${orgId}`, ts);
}

// Merge an array of updated/new records into an existing array, keyed by id.
function mergeRecords(base, delta) {
  if (!delta || delta.length === 0) return base;
  const map = new Map((base || []).map(r => [r.id, r]));
  for (const r of delta) { if (r?.id) map.set(r.id, r); }
  return Array.from(map.values());
}

// ── Delta write helpers ───────────────────────────────────────────────────────
// Build a baseline Map<id, serialized> for a collection so we can diff later.
function buildBaseline(records) {
  return new Map(
    (records || []).filter(r => r?.id).map(r => [r.id, JSON.stringify(r)])
  );
}

// Compare current records against a baseline and return { upsert, deleteIds }.
// Returns null if no baseline exists (caller should fall back to full sync).
function computeSyncDelta(baselineMap, current) {
  if (!baselineMap) return null;
  const upsert = [];
  const deleteIds = [];
  const currentMap = new Map();
  for (const record of (current || [])) {
    if (!record?.id) continue;
    currentMap.set(record.id, record);
    if (baselineMap.get(record.id) !== JSON.stringify(record)) {
      upsert.push(record); // new or changed
    }
  }
  for (const id of baselineMap.keys()) {
    if (!currentMap.has(id)) deleteIds.push(id);
  }
  return { upsert, deleteIds };
}

function withId(record = {}) {
  return { ...record, id: record.id || uid() };
}

const EMPTY_ORG_DATA = {
  income: [],
  expenses: [],
  invoices: [],
  customers: [],
  orgRecords: {},
  summary: {
    incomeCount: 0,
    expenseCount: 0,
    invoiceCount: 0,
    customerCount: 0,
    orgRecordCount: 0,
    totalEntries: 0,
    updatedAt: ""
  },
  account: {
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    country: "",
    location: "",
    address: "",
    gstin: "",
    showHSN: false,
    organizationType: "small_business"
  },
  goals: { monthlySavings: 0, targetAmount: 0, targetDate: "", savedAmount: 0, note: "" },
  budgets: {},
  notificationPrefs: {
    browserEnabled: false,
    invoiceDue: true,
    overdueInvoices: true,
    budgetAlerts: true,
    lowBalance: true,
    spendingSpike: true
  },
  currency: { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" }
};

const EMPTY_DATA = {
  ...EMPTY_ORG_DATA,
  orgs: {},
  activeOrgId: "",
  sharedLedger: null
};

function createEmptyAccount(overrides = {}) {
  const parsedLocation = parseLocationFields(overrides.location || overrides.address || "");
  const addressLine = String(overrides.addressLine || parsedLocation.addressLine || "").trim();
  const city = String(overrides.city || parsedLocation.city || "").trim();
  const state = String(overrides.state || parsedLocation.state || "").trim();
  const rawCountry = String(overrides.country || parsedLocation.country || EMPTY_ORG_DATA.account.country || "").trim();
  const country = rawCountry ? normalizeSupportedCountry(rawCountry) : "";
  const location = buildLocationLabel({ city, state, country });
  const address = buildLocationLabel({ addressLine, city, state, country });
  return {
    ...EMPTY_ORG_DATA.account,
    ...overrides,
    addressLine,
    city,
    state,
    country,
    location,
    address,
    organizationType: getOrgType(overrides.organizationType || EMPTY_ORG_DATA.account.organizationType)
  };
}

function normalizeOrgData(source = {}, fallback = {}) {
  const sourceGoals = source.goals || {};
  const fallbackAccount = fallback.account || {};
  const sourceAccount = source.account || {};
  const parsedSourceLocation = parseLocationFields(sourceAccount.location || sourceAccount.address || source.location || source.address || "");
  const parsedFallbackLocation = parseLocationFields(fallbackAccount.location || fallbackAccount.address || fallback.location || fallback.address || "");
  const normalizedAddressLine = String(sourceAccount.addressLine || source.addressLine || parsedSourceLocation.addressLine || fallbackAccount.addressLine || fallback.addressLine || parsedFallbackLocation.addressLine || "").trim();
  const normalizedCity = String(sourceAccount.city || source.city || parsedSourceLocation.city || fallbackAccount.city || fallback.city || parsedFallbackLocation.city || "").trim();
  const normalizedState = String(sourceAccount.state || source.state || parsedSourceLocation.state || fallbackAccount.state || fallback.state || parsedFallbackLocation.state || "").trim();
  const rawCountry = String(sourceAccount.country || source.country || parsedSourceLocation.country || fallbackAccount.country || fallback.country || parsedFallbackLocation.country || EMPTY_ORG_DATA.account.country || "").trim();
  const normalizedCountry = rawCountry ? normalizeSupportedCountry(rawCountry) : "";
  const normalizedLocation = buildLocationLabel({ city: normalizedCity, state: normalizedState, country: normalizedCountry });
  const normalizedAddress = buildLocationLabel({ addressLine: normalizedAddressLine, city: normalizedCity, state: normalizedState, country: normalizedCountry });
  const normalizedCollections = {
    income: sortOrgCollectionRecords("income", source.income || []),
    expenses: sortOrgCollectionRecords("expenses", source.expenses || []),
    invoices: sortOrgCollectionRecords("invoices", source.invoices || []),
    customers: source.customers || [],
    orgRecords: source.orgRecords || {}
  };
  return {
    ...normalizedCollections,
    summary: {
      ...EMPTY_ORG_DATA.summary,
      ...(source.summary || {}),
      ...buildOrgSummary(normalizedCollections)
    },
    goals: {
      ...EMPTY_ORG_DATA.goals,
      ...sourceGoals,
      targetAmount: Number(sourceGoals.targetAmount ?? sourceGoals.monthlySavings) || 0,
      targetDate: String(sourceGoals.targetDate || ""),
      savedAmount: Number(sourceGoals.savedAmount) || 0,
      note: String(sourceGoals.note || "")
    },
    budgets: source.budgets || EMPTY_ORG_DATA.budgets,
    notificationPrefs: { ...EMPTY_ORG_DATA.notificationPrefs, ...(source.notificationPrefs || {}) },
    currency: source.currency || EMPTY_ORG_DATA.currency,
    account: createEmptyAccount(
      sourceAccount || {
        name: source.name || fallbackAccount.name || "",
        email: source.email || fallbackAccount.email || "",
        phone: source.phone || fallbackAccount.phone || "",
        addressLine: normalizedAddressLine,
        city: normalizedCity,
        state: normalizedState,
        country: normalizedCountry,
        location: normalizedLocation,
        address: normalizedAddress,
        gstin: source.gstin || fallbackAccount.gstin || "",
        showHSN: source.showHSN || fallbackAccount.showHSN || false,
        organizationType: source.organizationType || source.account?.organizationType || fallbackAccount.organizationType || "small_business"
      }
    )
  };
}

function normalizeOrgCollection(source = {}, fallback = {}) {
  if (source.orgs && typeof source.orgs === "object" && Object.keys(source.orgs).length > 0) {
    return Object.entries(source.orgs).reduce((acc, [orgId, orgValue]) => {
      acc[orgId] = normalizeOrgData(orgValue, fallback);
      return acc;
    }, {});
  }

  return {
    [source.activeOrgId || DEFAULT_ORG_ID]: normalizeOrgData(source, fallback)
  };
}

function mergeMissingCollectionRecords(collectionKey, primaryRecords = [], secondaryRecords = []) {
  const primary = sortOrgCollectionRecords(collectionKey, primaryRecords || []);
  const secondary = sortOrgCollectionRecords(collectionKey, secondaryRecords || []);
  const primaryIds = new Set(primary.map(item => item?.id).filter(Boolean));
  const missing = secondary.filter(item => item?.id && !primaryIds.has(item.id));
  if (!missing.length) {
    return { records: primary, mergedCount: 0 };
  }
  return {
    records: sortOrgCollectionRecords(collectionKey, [...primary, ...missing]),
    mergedCount: missing.length
  };
}

function mergeOrgCollectionsFromLocal(primaryOrgs = {}, localOrgs = {}, collectionKeys = ORG_COLLECTION_KEYS) {
  const mergedOrgs = { ...(primaryOrgs || {}) };
  const backfillTargets = [];

  Object.entries(localOrgs || {}).forEach(([orgId, localOrg]) => {
    const primaryOrg = mergedOrgs[orgId] || {};
    const nextOrg = { ...primaryOrg };
    let orgTouched = false;

    collectionKeys.forEach(collectionKey => {
      const { records, mergedCount } = mergeMissingCollectionRecords(
        collectionKey,
        primaryOrg?.[collectionKey] || [],
        localOrg?.[collectionKey] || []
      );
      nextOrg[collectionKey] = records;
      if (mergedCount > 0) {
        orgTouched = true;
      }
    });

    if (orgTouched) {
      backfillTargets.push(...collectionKeys.map(collectionKey => ({ orgId, collectionKey, records: nextOrg[collectionKey] || [] })));
    }

    mergedOrgs[orgId] = nextOrg;
  });

  return { orgs: mergedOrgs, backfillTargets };
}

function buildStateFromOrganizations({ orgs = {}, activeOrgId = "", sharedLedger = null }) {
  const nextOrgs = Object.keys(orgs || {}).length > 0 ? orgs : { [DEFAULT_ORG_ID]: normalizeOrgData() };
  const resolvedActiveOrgId = nextOrgs[activeOrgId] ? activeOrgId : Object.keys(nextOrgs)[0];
  const activeOrg = nextOrgs[resolvedActiveOrgId] || normalizeOrgData();
  return {
    ...EMPTY_DATA,
    ...activeOrg,
    orgs: nextOrgs,
    activeOrgId: resolvedActiveOrgId,
    sharedLedger
  };
}

function extractActiveOrg(state = {}) {
  return normalizeOrgData({
    income: state.income,
    expenses: state.expenses,
    invoices: state.invoices,
    customers: state.customers,
    orgRecords: state.orgRecords,
    summary: buildOrgSummary(state),
    account: state.account,
    goals: state.goals,
    budgets: state.budgets,
    notificationPrefs: state.notificationPrefs,
    currency: state.currency
  });
}

function extractOrgMetadataOnly(state = {}) {
  return normalizeOrgData({
    income: [],
    expenses: [],
    invoices: [],
    customers: [],
    orgRecords: {},
    summary: state.summary || buildOrgSummary(state),
    account: state.account,
    goals: state.goals,
    budgets: state.budgets,
    notificationPrefs: state.notificationPrefs,
    currency: state.currency
  });
}

function buildMetadataOrgMap(orgs = {}) {
  return Object.entries(orgs || {}).reduce((acc, [orgId, orgValue]) => {
    acc[orgId] = extractOrgMetadataOnly(orgValue || {});
    return acc;
  }, {});
}

function buildResetData(currentData, nextAccount) {
  return {
    ...currentData,
    income: [],
    expenses: [],
    invoices: [],
    customers: [],
    orgRecords: {},
    goals: { ...EMPTY_ORG_DATA.goals },
    budgets: { ...EMPTY_ORG_DATA.budgets },
    account: nextAccount
  };
}

function getSessionStorageKey(userId) {
  return `${SESSION_STORAGE_PREFIX}${userId}`;
}

function readSessionDraft(userId) {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = window.localStorage.getItem(getSessionStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSessionDraft(userId, draft) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(getSessionStorageKey(userId), JSON.stringify(draft));
}

function clearSessionDraft(userId) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.removeItem(getSessionStorageKey(userId));
}


export function DataProvider({ children }) {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [orgSummary, setOrgSummary] = useState(EMPTY_SUMMARY);
  const [loaded, setLoaded] = useState(false);
  // Tracks which collections have been fetched from the server this session.
  // Customers are loaded eagerly; income/expenses/invoices are loaded on demand.
  const [collectionFetched, setCollectionFetched] = useState({ income: false, expenses: false, invoices: false, customers: false });
  const collectionFetchedRef = useRef({ income: false, expenses: false, invoices: false, customers: false });
  const collectionFetchingRef = useRef({});
  const [activeSharedOrgKey, setActiveSharedOrgKey] = useState(null);
  const [activeSharedOrgRole, setActiveSharedOrgRole] = useState(null); // live role from orgMembers snapshot
  const [ownDataReloadKey, setOwnDataReloadKey] = useState(0);
  const activeSharedOrgRef = useRef(null); // mirrors activeSharedOrgKey for use in callbacks
  const readOnlyFreeMode = isFreeReadOnlyMode(user);
  const sessionRef = useRef(null);
  const flushInFlightRef = useRef(false);
  const readOnlyNoticeAtRef = useRef(0);
  const collectionSyncRef = useRef({});
  // Delta write baseline: { [orgId]: { income: Map<id,serialized>, expenses: ..., ... } }
  // Initialized after each full load; updated after each successful delta sync.
  const lastSyncedRef = useRef({});

  // Derived: shared orgs list and viewer-mode flag
  const sharedOrgs = useMemo(() =>
    Object.entries(user?.sharedOrgs || {}).map(([key, info]) => ({ key, ...info })),
    [user?.sharedOrgs]
  );

  // Poll membership status every 30s while viewing a shared org
  // Replaces the Firestore onSnapshot live-role listener
  useEffect(() => {
    if (!activeSharedOrgKey || !user?.id) {
      setActiveSharedOrgRole(null);
      return undefined;
    }
    const sharedInfo = user?.sharedOrgs?.[activeSharedOrgKey];
    if (!sharedInfo?.ownerId || !sharedInfo?.orgId) {
      setActiveSharedOrgRole(null);
      return undefined;
    }

    async function checkMembership() {
      try {
        const memberships = await orgsApi.getMemberships(user.id);
        const match = memberships.find(
          m => m.ownerId === sharedInfo.ownerId && m.orgId === sharedInfo.orgId
        );
        if (!match) {
          // Removed — revoke access
          const staleKey = `${sharedInfo.ownerId}_${sharedInfo.orgId}`;
          setUser(prev => {
            if (!prev) return prev;
            const next = { ...(prev.sharedOrgs || {}) };
            delete next[staleKey];
            return { ...prev, sharedOrgs: next };
          });
          activeSharedOrgRef.current = null;
          setActiveSharedOrgKey(null);
          setActiveSharedOrgRole(null);
          setOwnDataReloadKey(k => k + 1);
          return;
        }
        // Role may have changed
        const liveRole = match.role || "viewer";
        setActiveSharedOrgRole(liveRole);
        if (activeSharedOrgRef.current) {
          activeSharedOrgRef.current = { ...activeSharedOrgRef.current, role: liveRole, isViewer: liveRole === "viewer" };
        }
      } catch (err) {
        logError("membership poll failed", err);
      }
    }

    checkMembership();
    const intervalId = setInterval(checkMembership, 30000);
    return () => clearInterval(intervalId);
  }, [activeSharedOrgKey, user?.id, user?.sharedOrgs, setUser]);

  const isViewerMode = useMemo(() => {
    if (!activeSharedOrgKey) return false;
    const role = activeSharedOrgRole ?? user?.sharedOrgs?.[activeSharedOrgKey]?.role ?? "viewer";
    return role === "viewer";
  }, [activeSharedOrgKey, activeSharedOrgRole, user?.sharedOrgs]);

  const syncActiveOrgCollections = useCallback(async (nextState) => {
    if (!user?.id || !nextState?.activeOrgId) return;
    const orgId = nextState.activeOrgId;
    await Promise.allSettled([
      ...ORG_COLLECTION_KEYS.map(async key => {
        const current = nextState[key] || [];
        const fetched  = collectionFetchedRef.current[key];
        const baseline = lastSyncedRef.current[orgId]?.[key] ?? null;
        const delta    = computeSyncDelta(baseline, current);

        if (!fetched && !baseline) {
          // Collection not yet loaded from server — upsert local records only, never delete.
          // A full sync here would wipe server rows we haven't loaded yet.
          if (current.length > 0) {
            await orgsApi.syncDelta(user.id, orgId, key, { upsert: current, delete: [] });
          }
          return; // Don't update baseline until we know the full server state
        }

        if (!delta) {
          // Baseline exists in fetched state but computeSyncDelta returned null (shouldn't happen)
          await orgsApi.syncCollection(user.id, orgId, key, current);
        } else if (delta.upsert.length > 0 || delta.deleteIds.length > 0) {
          await orgsApi.syncDelta(user.id, orgId, key, { upsert: delta.upsert, delete: delta.deleteIds });
        }
        // Update baseline after successful write
        if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
        lastSyncedRef.current[orgId][key] = buildBaseline(current);
      }),
      Object.keys(nextState.orgRecords || {}).length > 0
        ? orgsApi.syncOrgRecords(user.id, orgId, nextState.orgRecords)
        : Promise.resolve()
    ]);
  }, [user?.id]);

  const syncSharedOrgCollections = useCallback(async (nextState, sharedInfo) => {
    if (!sharedInfo?.ownerId || !sharedInfo?.orgId) return;
    const orgId = sharedInfo.orgId;
    await Promise.allSettled(
      ORG_COLLECTION_KEYS.map(async key => {
        const current = nextState[key] || [];
        const baseline = lastSyncedRef.current[orgId]?.[key] ?? null;
        const delta = computeSyncDelta(baseline, current);

        if (!delta) {
          await orgsApi.syncCollection(sharedInfo.ownerId, orgId, key, current);
        } else if (delta.upsert.length > 0 || delta.deleteIds.length > 0) {
          await orgsApi.syncDelta(sharedInfo.ownerId, orgId, key, { upsert: delta.upsert, delete: delta.deleteIds });
        }
        if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
        lastSyncedRef.current[orgId][key] = buildBaseline(current);
      })
    );
  }, []);

  const persistSessionDraft = useCallback(() => {
    if (!user?.id || !sessionRef.current) return;
    writeSessionDraft(user.id, sessionRef.current);
  }, [user?.id]);

  const captureSessionTick = useCallback(() => {
    if (!user?.id || !sessionRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    const nowMs = Date.now();
    const currentOrgId = sessionRef.current.currentOrgId || data.activeOrgId || DEFAULT_ORG_ID;
    const lastTickAt = sessionRef.current.lastTickAt || nowMs;
    const deltaMs = Math.max(0, nowMs - lastTickAt);

    sessionRef.current.lastTickAt = nowMs;
    sessionRef.current.currentOrgId = currentOrgId;

    if (deltaMs <= 0) {
      persistSessionDraft();
      return;
    }

    sessionRef.current.pendingTotalMs = (sessionRef.current.pendingTotalMs || 0) + deltaMs;
    sessionRef.current.pendingByOrg = {
      ...(sessionRef.current.pendingByOrg || {}),
      [currentOrgId]: (sessionRef.current.pendingByOrg?.[currentOrgId] || 0) + deltaMs
    };

    const orgData = data.orgs?.[currentOrgId];
    sessionRef.current.orgMeta = {
      ...(sessionRef.current.orgMeta || {}),
      [currentOrgId]: {
        name: orgData?.account?.name || "",
        organizationType: getOrgType(orgData?.account?.organizationType || user?.organizationType)
      }
    };

    persistSessionDraft();
  }, [data.activeOrgId, data.orgs, persistSessionDraft, user?.id, user?.organizationType]);

  const registerSessionVisit = useCallback(
    async orgId => {
      if (!user?.id || !orgId) return;
      if (!sessionRef.current) return;

      const nextOrgId = orgId || DEFAULT_ORG_ID;
      const orgData = data.orgs?.[nextOrgId];
      const orgType = getOrgType(orgData?.account?.organizationType || user?.organizationType);
      const nowIso = new Date().toISOString();
      const updates = {
        updatedAt: nowIso,
        lastActivityAt: nowIso,
        "analytics.lastSessionStartedAt": sessionRef.current.startedAt || nowIso,
        [`analytics.byOrg.${nextOrgId}.lastSessionStartedAt`]: nowIso,
        [`analytics.byOrg.${nextOrgId}.organizationType`]: orgType,
        [`analytics.byOrg.${nextOrgId}.name`]: orgData?.account?.name || "Organization"
      };

      if (!sessionRef.current.sessionRegistered) {
        updates["analytics.sessionCount"] = (updates["analytics.sessionCount"] || 0) + 1;
        sessionRef.current.sessionRegistered = true;
      }

      if (!sessionRef.current.orgVisits?.[nextOrgId]) {
        updates[`analytics.byOrg.${nextOrgId}.sessionCount`] = 1;
        sessionRef.current.orgVisits = { ...(sessionRef.current.orgVisits || {}), [nextOrgId]: true };
      }

      sessionRef.current.orgMeta = {
        ...(sessionRef.current.orgMeta || {}),
        [nextOrgId]: {
          name: orgData?.account?.name || "",
          organizationType: orgType
        }
      };
      persistSessionDraft();
      await usersApi.update(user.id, updates).catch(err => logError("Session org change flush failed", err));
    },
    [data.orgs, persistSessionDraft, user?.id, user?.organizationType]
  );

  const flushSessionAnalytics = useCallback(
    async ({ force = false } = {}) => {
      if (!user?.id || !sessionRef.current || flushInFlightRef.current) return;

      captureSessionTick();

      const totalMs = Math.round(sessionRef.current.pendingTotalMs || 0);
      if (totalMs < (force ? SESSION_MIN_FLUSH_MS : SESSION_FLUSH_INTERVAL_MS)) {
        persistSessionDraft();
        return;
      }

      const byOrg = { ...(sessionRef.current.pendingByOrg || {}) };
      sessionRef.current.pendingTotalMs = 0;
      sessionRef.current.pendingByOrg = {};
      persistSessionDraft();

      const nowIso = new Date().toISOString();
      // analytics.* fields are not in server PROFILE_FIELDS — only update activity timestamp
      const updates = {
        updatedAt: nowIso,
        lastActivityAt: nowIso
      };

      flushInFlightRef.current = true;
      try {
        await usersApi.update(user.id, updates);
        setUser(prev => (prev ? { ...prev, lastActivityAt: nowIso } : prev));
      } catch (err) {
        sessionRef.current.pendingTotalMs = (sessionRef.current.pendingTotalMs || 0) + totalMs;
        sessionRef.current.pendingByOrg = Object.entries(byOrg).reduce((acc, [orgId, orgMs]) => {
          acc[orgId] = (sessionRef.current.pendingByOrg?.[orgId] || 0) + orgMs;
          return acc;
        }, { ...(sessionRef.current.pendingByOrg || {}) });
      } finally {
        flushInFlightRef.current = false;
        persistSessionDraft();
      }
    },
    [captureSessionTick, persistSessionDraft, setUser, user?.id]
  );

  const persistState = useCallback(
    nextState => {
      if (!user?.id) return;

      // In shared org (admin) mode: sync collections to owner's path only
      const sharedInfo = activeSharedOrgRef.current;
      if (sharedInfo) {
        if (!sharedInfo.isViewer) {
          syncSharedOrgCollections(nextState, sharedInfo);
        }
        return;
      }

      // Optimistic local cache
      setUserData(user.id, "appData", nextState);

      // Fire-and-forget API writes (non-blocking)
      const orgId = nextState.activeOrgId;
      orgsApi.update(user.id, orgId, toApiOrgUpdate(nextState)).catch(err => logError("org update failed", err));
      syncActiveOrgCollections(nextState).catch(err => logError("collection sync failed", err));
      usersApi.update(user.id, { activeOrgId: orgId, organizationType: nextState.account?.organizationType || "small_business" })
        .catch(err => logError("user update failed", err));

      setUser(prev =>
        prev
          ? {
              ...prev,
              activeOrgId: orgId,
              organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
            }
          : prev
      );
    },
    [setUser, syncActiveOrgCollections, syncSharedOrgCollections, user?.id]
  );

  useEffect(() => {
    async function loadData() {
      if (activeSharedOrgRef.current) return;

      if (!user?.id) {
        collectionSyncRef.current = {};
        lastSyncedRef.current = {};
        setData(EMPTY_DATA);
        setOrgSummary(EMPTY_SUMMARY);
        setLoaded(true);
        return;
      }

      setLoaded(false);

      try {
        // Cold-start strategy: fetch org metadata + customers eagerly; defer the large
        // collections (income, expenses, invoices) until the user navigates to them.
        // This cuts the initial payload from potentially thousands of rows down to just
        // org settings + orgRecords + customers.
        const activeOrgId = user.activeOrgId || DEFAULT_ORG_ID;

        // Reset per-session collection fetch flags for this load
        const freshFetched = { income: false, expenses: false, invoices: false, customers: false };
        collectionFetchedRef.current = freshFetched;
        setCollectionFetched(freshFetched);

        // Read local cache — income/expenses/invoices come from here until lazily refreshed
        const localData = getUserData(user.id, "appData") || EMPTY_DATA;
        const localOrg  = localData.orgs?.[activeOrgId] || {};

        const [allOrgs, activeOrgMeta, customersPage, summary] = await Promise.all([
          orgsApi.list(user.id),
          orgsApi.getFull(user.id, activeOrgId, null, { metaOnly: true }),
          orgsApi.getCollection(user.id, activeOrgId, "customers").catch(() => null),
          orgsApi.getSummary(user.id, activeOrgId).catch(() => EMPTY_SUMMARY)
        ]);

        // getCollection returns { records, hasMore, nextCursor } — unwrap the first page.
        const customers = Array.isArray(customersPage?.records) ? customersPage.records : null;

        // Build orgs map: metadata-only for non-active orgs; full local cache + fresh
        // customers + server metadata for the active org.
        const orgsMap = {};
        (allOrgs || []).forEach(apiOrg => {
          orgsMap[apiOrg.id] = normalizeOrgData(fromApiOrg(apiOrg));
        });
        if (activeOrgMeta) {
          // Org settings + orgRecords come from server; large collections from local cache.
          // Customers are fresh from server (usually small, always needed for dropdowns).
          orgsMap[activeOrgId] = normalizeOrgData(fromApiOrg(activeOrgMeta, {
            income:     localOrg.income    || [],
            expenses:   localOrg.expenses  || [],
            invoices:   localOrg.invoices  || [],
            customers:  customers          ?? localOrg.customers ?? [],
            // orgRecords comes from activeOrgMeta directly (not overridden here)
          }));
        }

        if (!orgsMap[activeOrgId]) {
          orgsMap[DEFAULT_ORG_ID] = normalizeOrgData({});
        }

        const nextState = buildStateFromOrganizations({
          orgs: orgsMap,
          activeOrgId: activeOrgMeta?.id || activeOrgId,
          sharedLedger: null
        });

        setData(nextState);

        // Establish delta-write baseline for customers (fetched fresh above).
        // income/expenses/invoices baselines are set when lazily loaded.
        const loadedOrgId = activeOrgMeta?.id || activeOrgId;
        if (!lastSyncedRef.current[loadedOrgId]) lastSyncedRef.current[loadedOrgId] = {};
        if (customers !== null) {
          lastSyncedRef.current[loadedOrgId].customers = buildBaseline(customers);
          collectionFetchedRef.current = { ...collectionFetchedRef.current, customers: true };
          setCollectionFetched(prev => ({ ...prev, customers: true }));

          // Stream remaining pages in background if first page was full
          if (customersPage?.hasMore) {
            (async () => {
              let cursor = customersPage.nextCursor;
              let allRecords = [...customers];
              while (cursor) {
                const next = await orgsApi.getCollection(user.id, loadedOrgId, "customers", cursor).catch(() => null);
                const batch = Array.isArray(next?.records) ? next.records : [];
                if (batch.length === 0) break;
                allRecords = [...allRecords, ...batch];
                setData(prev => {
                  const prevOrg = prev.orgs?.[loadedOrgId];
                  if (!prevOrg) return prev;
                  const merged = normalizeOrgData({ ...prevOrg, customers: mergeRecords(prevOrg.customers || [], batch) });
                  return buildStateFromOrganizations({ orgs: { ...prev.orgs, [loadedOrgId]: merged }, activeOrgId: prev.activeOrgId, sharedLedger: prev.sharedLedger });
                });
                cursor = next?.nextCursor ?? null;
              }
              lastSyncedRef.current[loadedOrgId].customers = buildBaseline(allRecords);
            })();
          }
        }

        setOrgSummary(summary || EMPTY_SUMMARY);
        setUserData(user.id, "appData", nextState);
        setUser(prev =>
          prev ? {
            ...prev,
            activeOrgId: nextState.activeOrgId,
            organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
          } : prev
        );

        // Reconcile sharedOrgs with server OrgMember rows:
        // • Prune revoked memberships
        // • Add any accepted memberships not yet in sharedOrgs (e.g. after page refresh)
        const memberships = await orgsApi.getMemberships(user.id).catch(() => null);
        if (memberships !== null) {
          const currentSharedOrgs = user?.sharedOrgs || {};
          const validKeys = new Set(memberships.map(m => `${m.ownerId}_${m.orgId}`));
          const invalidKeys = Object.keys(currentSharedOrgs).filter(k => !validKeys.has(k));
          const newEntries = memberships
            .filter(m => !currentSharedOrgs[`${m.ownerId}_${m.orgId}`])
            .reduce((acc, m) => {
              acc[`${m.ownerId}_${m.orgId}`] = {
                ownerId: m.ownerId,
                orgId: m.orgId,
                orgName: m.orgName || "",
                ownerName: m.owner?.name || "",
                organizationType: m.organizationType || "small_business",
                role: m.role || "viewer",
                acceptedAt: m.acceptedAt || ""
              };
              return acc;
            }, {});
          if (invalidKeys.length > 0 || Object.keys(newEntries).length > 0) {
            setUser(prev => {
              if (!prev) return prev;
              const next = { ...(prev.sharedOrgs || {}) };
              invalidKeys.forEach(k => delete next[k]);
              Object.assign(next, newEntries);
              return { ...prev, sharedOrgs: next };
            });
          }
        }
      } catch (err) {
        logError("loadData failed, using local cache", err);
        const localData = getUserData(user.id, "appData") || EMPTY_DATA;
        const nextState = buildStateFromOrganizations({
          orgs: normalizeOrgCollection(localData, {
            account: { email: user?.email || "", phone: user?.phone || "", organizationType: user?.organizationType }
          }),
          activeOrgId: localData.activeOrgId || DEFAULT_ORG_ID,
          sharedLedger: null
        });
        setData(nextState);
      } finally {
        setLoaded(true);
      }
    }

    loadData();
  }, [setUser, user?.email, user?.id, user?.organizationType, user?.phone, ownDataReloadKey]);

  useEffect(() => {
    if (!user?.id || !loaded) {
      sessionRef.current = null;
      return undefined;
    }

    const nowMs = Date.now();
    const existingDraft = readSessionDraft(user.id);
    const initialOrgId = data.activeOrgId || DEFAULT_ORG_ID;
    const shouldResetSession = existingDraft && nowMs - Number(existingDraft.lastTickAt || 0) > SESSION_FLUSH_INTERVAL_MS * 10;

    sessionRef.current = !existingDraft || shouldResetSession ? {
      startedAt: new Date(nowMs).toISOString(),
      currentOrgId: initialOrgId,
      lastTickAt: typeof document !== "undefined" && document.visibilityState === "hidden" ? 0 : nowMs,
      pendingTotalMs: 0,
      pendingByOrg: {},
      orgVisits: {},
      orgMeta: {},
      sessionRegistered: false
    } : existingDraft;

    sessionRef.current.currentOrgId = initialOrgId;
    if (typeof document !== "undefined" && document.visibilityState !== "hidden") {
      sessionRef.current.lastTickAt = nowMs;
    }
    persistSessionDraft();

    registerSessionVisit(initialOrgId);
    flushSessionAnalytics({ force: true });

    return () => {
      if (typeof document !== "undefined" && document.visibilityState !== "hidden") {
        captureSessionTick();
      }
      persistSessionDraft();
    };
  }, [captureSessionTick, flushSessionAnalytics, loaded, persistSessionDraft, registerSessionVisit, user?.id]);

  useEffect(() => {
    if (!user?.id || !loaded || !sessionRef.current) return undefined;

    const nextOrgId = data.activeOrgId || DEFAULT_ORG_ID;
    if (sessionRef.current.currentOrgId === nextOrgId) return undefined;

    captureSessionTick();
    flushSessionAnalytics({ force: true });
    sessionRef.current.currentOrgId = nextOrgId;
    sessionRef.current.lastTickAt = typeof document !== "undefined" && document.visibilityState === "hidden" ? 0 : Date.now();
    persistSessionDraft();
    registerSessionVisit(nextOrgId);
    return undefined;
  }, [captureSessionTick, data.activeOrgId, flushSessionAnalytics, loaded, persistSessionDraft, registerSessionVisit, user?.id]);

  useEffect(() => {
    if (!user?.id || !loaded) return undefined;

    function handleVisibilityChange() {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "hidden") {
        captureSessionTick();
        flushSessionAnalytics({ force: true });
        if (sessionRef.current) {
          sessionRef.current.lastTickAt = 0;
        }
        persistSessionDraft();
        return;
      }

      if (sessionRef.current) {
        sessionRef.current.lastTickAt = Date.now();
      }
      persistSessionDraft();
      registerSessionVisit(data.activeOrgId || DEFAULT_ORG_ID);
    }

    function handlePageHide() {
      captureSessionTick();
      persistSessionDraft();
    }

    const intervalId = window.setInterval(() => {
      captureSessionTick();
      flushSessionAnalytics();
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [captureSessionTick, data.activeOrgId, flushSessionAnalytics, loaded, persistSessionDraft, registerSessionVisit, user?.id]);

  const update = useCallback(
    updater => {
      if (!user?.id) return;
      // Viewer-mode members cannot write
      if (activeSharedOrgRef.current?.isViewer) return;
      if (readOnlyFreeMode) {
        if (typeof window !== "undefined") {
          const nowMs = Date.now();
          if (nowMs - readOnlyNoticeAtRef.current > 1200) {
            readOnlyNoticeAtRef.current = nowMs;
            window.dispatchEvent(
              new CustomEvent("ledger:readonly-blocked", {
                detail: {
                  tone: "warning",
                  message: "Free plan is read-only. Upgrade to Pro to create, edit, or delete records."
                }
              })
            );
          }
        }
        return;
      }

      let nextState;

      setData(prev => {
        const proposed = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
        const nextActiveOrgId = proposed.activeOrgId || prev.activeOrgId || DEFAULT_ORG_ID;
        nextState = buildStateFromOrganizations({
          orgs: {
            ...proposed.orgs,
            [nextActiveOrgId]: extractActiveOrg({ ...proposed, activeOrgId: nextActiveOrgId })
          },
          activeOrgId: nextActiveOrgId,
          sharedLedger: null
        });
        return nextState;
      });

      if (nextState) {
        persistState(nextState);
      }
    },
    [persistState, readOnlyFreeMode, user?.id]
  );

  const setCurrency = cur => update(d => ({ ...d, currency: cur }));
  const saveAccount = acc => update(d => ({ ...d, account: acc }));
  const resetForOrgTypeChange = (nextAccount) => {
    update(d => buildResetData(d, nextAccount));
    // Clear server-side orgRecords — the sync endpoint only upserts so empty orgRecords
    // in client state would never delete stale server records (e.g. EMI loans).
    const orgId = data.activeOrgId;
    if (user?.id && orgId) {
      orgsApi.clearOrgRecords(user.id, orgId).catch(err => logError("clearOrgRecords failed", err));
    }
  };
  const saveGoals = goals => update(d => ({ ...d, goals: { ...d.goals, ...goals } }));
  const saveBudgets = budgets => update(d => ({ ...d, budgets: { ...budgets } }));
  const saveNotificationPrefs = notificationPrefs => update(d => ({ ...d, notificationPrefs: { ...d.notificationPrefs, ...notificationPrefs } }));
  const addCustomer = c => update(d => ({ ...d, customers: [...d.customers, withId(c)] }));
  const updateCustomer = c => update(d => ({ ...d, customers: d.customers.map(x => (x.id === c.id ? c : x)) }));
  const removeCustomer = id => update(d => ({ ...d, customers: d.customers.filter(c => c.id !== id) }));
  const saveOrgRecords = (key, items) => update(d => ({ ...d, orgRecords: { ...d.orgRecords, [key]: items } }));
  const addOrgRecord = (key, record) =>
    update(d => ({ ...d, orgRecords: { ...d.orgRecords, [key]: [withId(record), ...(d.orgRecords?.[key] || [])] } }));
  const updateOrgRecord = (key, record) =>
    update(d => ({
      ...d,
      orgRecords: {
        ...d.orgRecords,
        [key]: (d.orgRecords?.[key] || []).map(item => (item.id === record.id ? record : item))
      }
    }));
  const removeOrgRecord = (key, id) =>
    update(d => ({
      ...d,
      orgRecords: {
        ...d.orgRecords,
        [key]: (d.orgRecords?.[key] || []).filter(item => item.id !== id)
      }
    }));
  const withAudit = record => ({
    ...record,
    createdBy: record.createdBy || user?.id || "",
    createdByName: record.createdByName || user?.name || user?.email || "Unknown",
    createdAt: record.createdAt || new Date().toISOString()
  });
  const addIncome = i => update(d => ({ ...d, income: sortOrgCollectionRecords("income", [withId(withAudit(i)), ...d.income]) }));
  const updateIncome = income => update(d => ({ ...d, income: sortOrgCollectionRecords("income", d.income.map(i => (i.id === income.id ? income : i))) }));
  const removeIncome = id => update(d => ({ ...d, income: d.income.filter(i => i.id !== id) }));
  const addExpense = e => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", [withId(withAudit(e)), ...d.expenses]) }));
  const updateExpense = expense => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", d.expenses.map(e => (e.id === expense.id ? expense : e))) }));
  const removeExpense = id => update(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) }));
  const addInvoice = inv => update(d => ({ ...d, invoices: sortOrgCollectionRecords("invoices", [withId(withAudit(inv)), ...d.invoices]) }));
  const updateInvoice = inv => update(d => ({ ...d, invoices: sortOrgCollectionRecords("invoices", d.invoices.map(i => (i.id === inv.id ? inv : i))) }));
  const removeInvoice = id => update(d => ({ ...d, invoices: d.invoices.filter(i => i.id !== id) }));

  async function switchOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (!data.orgs?.[orgId]) return { error: "That organization was not found." };

    const nextState = buildStateFromOrganizations({
      orgs: data.orgs,
      activeOrgId: orgId,
      sharedLedger: null
    });

    setData(nextState);
    persistState(nextState);
    setOwnDataReloadKey(k => k + 1);
    return { success: true };
  }

  async function createOrganization(accountInput = {}) {
    if (!user?.id) return { error: "No active user found." };
    if (readOnlyFreeMode) return { error: "Free plan is read-only. Upgrade to edit data." };

    const orgCount = Object.keys(data.orgs || {}).length;
    const maxOrganizations = getMaxOrganizations(user);
    if (orgCount >= maxOrganizations) {
      return { error: `Your account can use up to ${maxOrganizations} Khatas (one of each type).` };
    }

    // Creating a 2nd+ org requires an active paid plan — trial gives only 1 org free
    if (orgCount >= 1 && !isPaidActive(user)) {
      return { error: "UPGRADE_REQUIRED" };
    }

    // One org per type — no duplicates
    const requestedType = getOrgType(accountInput.organizationType || user?.organizationType);
    const alreadyHasType = organizations.some(o => o.organizationType === requestedType);
    if (alreadyHasType) {
      const label = requestedType.replace(/_/g, " ");
      return { error: `You already have a ${label} Khata. Each plan allows one of each type.` };
    }

    const nextOrgId = `org_${uid()}${uid()}`;
    const nextOrg = normalizeOrgData(
      {
        account: {
          ...createEmptyAccount({
            email: accountInput.email || user.email || "",
            phone: accountInput.phone || user.phone || "",
            organizationType: accountInput.organizationType || user.organizationType
          }),
          ...accountInput,
          organizationType: getOrgType(accountInput.organizationType || user.organizationType)
        }
      },
      {
        account: {
          email: user.email || "",
          phone: user.phone || "",
          organizationType: accountInput.organizationType || user.organizationType
        }
      }
    );

    try {
      await orgsApi.create(user.id, nextOrgId, {
        organizationType: getOrgType(accountInput.organizationType || user.organizationType),
        email: accountInput.email || user.email || "",
        phone: accountInput.phone || user.phone || ""
      });
    } catch (err) {
      return { error: err.message || "Could not create organization." };
    }

    const nextState = buildStateFromOrganizations({
      orgs: { ...data.orgs, [nextOrgId]: nextOrg },
      activeOrgId: nextOrgId,
      sharedLedger: null
    });

    setData(nextState);
    persistState(nextState);
    return { success: true, orgId: nextOrgId };
  }

  async function deleteOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (readOnlyFreeMode) return { error: "Free plan is read-only. Upgrade to edit data." };
    if (!data.orgs?.[orgId]) return { error: "That organization was not found." };

    const orgIds = Object.keys(data.orgs || {});
    if (orgIds.length <= 1) {
      return { error: "At least one organization workspace must remain." };
    }

    try {
      const result = await orgsApi.delete(user.id, orgId);
      const nextActiveOrgId = result.newActiveOrgId || (orgIds.find(id => id !== orgId)) || DEFAULT_ORG_ID;

      const nextOrgs = { ...data.orgs };
      delete nextOrgs[orgId];

      const nextState = buildStateFromOrganizations({
        orgs: nextOrgs,
        activeOrgId: nextActiveOrgId,
        sharedLedger: null
      });

      setData(nextState);
      setUserData(user.id, "appData", nextState);
      return { success: true, activeOrgId: nextActiveOrgId };
    } catch (err) {
      return { error: err.message || "We couldn't finish deleting that organization right now." };
    }
  }

  const organizations = Object.entries(data.orgs || {}).map(([orgId, orgValue]) => ({
    id: orgId,
    name: orgValue.account?.name || "Untitled Organization",
    organizationType: getOrgType(orgValue.account?.organizationType),
    hasData: Boolean(
      orgValue.customers?.length ||
      orgValue.income?.length ||
      orgValue.expenses?.length ||
      orgValue.invoices?.length ||
      Object.keys(orgValue.orgRecords || {}).length
    )
  }));
  const maxOrganizations = getMaxOrganizations(user);

  async function switchToSharedOrg(key) {
    const sharedInfo = user?.sharedOrgs?.[key];
    if (!sharedInfo) return;

    const { ownerId, orgId } = sharedInfo;
    setLoaded(false);
    setActiveSharedOrgRole(null);
    activeSharedOrgRef.current = { ...sharedInfo, isViewer: sharedInfo.role === "viewer" };
    setActiveSharedOrgKey(key);

    try {
      // Step 1: verify membership + fetch org metadata only (fast)
      const [memberships, orgMeta, customersResult] = await Promise.all([
        orgsApi.getMemberships(user.id),
        orgsApi.getFull(ownerId, orgId, null, { metaOnly: true }),
        orgsApi.getCollection(ownerId, orgId, "customers").catch(() => null)
      ]);

      const membership = memberships.find(m => m.ownerId === ownerId && m.orgId === orgId);

      if (!membership) {
        // Removed — revoke access
        activeSharedOrgRef.current = null;
        setActiveSharedOrgKey(null);
        setActiveSharedOrgRole(null);
        setUser(prev => {
          if (!prev) return prev;
          const next = { ...(prev.sharedOrgs || {}) };
          delete next[`${ownerId}_${orgId}`];
          return { ...prev, sharedOrgs: next };
        });
        return;
      }

      const effectiveRole = membership.role || sharedInfo.role || "viewer";
      activeSharedOrgRef.current = { ...activeSharedOrgRef.current, role: effectiveRole, isViewer: effectiveRole === "viewer" };
      setActiveSharedOrgRole(effectiveRole);

      const customers = Array.isArray(customersResult?.records) ? customersResult.records
        : Array.isArray(customersResult) ? customersResult : [];

      const nextState = buildStateFromOrganizations({
        orgs: { [orgId]: normalizeOrgData(fromApiOrg(orgMeta, { customers })) },
        activeOrgId: orgId
      });

      setData(nextState);

      // Customers are loaded; income/expenses/invoices will lazy-load on section visit.
      // ensureCollectionLoaded uses activeSharedOrgRef.current.ownerId for the API path.
      const freshFetched = { income: false, expenses: false, invoices: false, customers: true };
      collectionFetchedRef.current = freshFetched;
      setCollectionFetched(freshFetched);

      // Baseline for customers only
      if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
      lastSyncedRef.current[orgId].customers = buildBaseline(customers);
    } catch (err) {
      logError("switchToSharedOrg failed", err);
      activeSharedOrgRef.current = null;
      setActiveSharedOrgKey(null);
      setActiveSharedOrgRole(null);
    } finally {
      setLoaded(true);
    }
  }

  function switchToOwnOrg() {
    activeSharedOrgRef.current = null;
    // Mark as loading immediately so components don't render with stale shared-org data
    setLoaded(false);
    setData(EMPTY_DATA);
    setActiveSharedOrgKey(null);
    setActiveSharedOrgRole(null);
    // Increment reload key to force the own-data useEffect to re-run
    setOwnDataReloadKey(k => k + 1);
  }

  // Fetch a collection from the server if it hasn't been loaded this session yet.
  // Safe to call multiple times — subsequent calls are no-ops once the collection is fetched.
  const ensureCollectionLoaded = useCallback(async (key) => {
    if (collectionFetchedRef.current[key]) return;
    if (collectionFetchingRef.current[key]) return; // already in-flight
    if (!user?.id) return;

    collectionFetchingRef.current[key] = true;
    const orgId = data.activeOrgId;
    // For shared orgs the API path uses the org owner's ID, not the current user's ID
    const apiUserId = activeSharedOrgRef.current?.ownerId || user.id;

    try {
      // Page 1 — render the UI as soon as the first page arrives
      const page1 = await orgsApi.getCollection(apiUserId, orgId, key);
      const firstBatch = Array.isArray(page1?.records) ? page1.records
        : Array.isArray(page1) ? page1  // backward-compat if server returns flat array
        : [];

      const mergeIntoState = (incoming, replace = false) => {
        setData(prev => {
          const aid = prev.activeOrgId;
          const prevOrg = prev.orgs?.[aid];
          if (!prevOrg) return prev;
          const base = replace ? incoming : mergeRecords(prevOrg[key] || [], incoming);
          const updatedOrg = normalizeOrgData({ ...prevOrg, [key]: base });
          return buildStateFromOrganizations({
            orgs: { ...prev.orgs, [aid]: updatedOrg },
            activeOrgId: aid,
            sharedLedger: prev.sharedLedger
          });
        });
      };

      mergeIntoState(firstBatch, true); // replace on first page

      // Mark as fetched so the section renders and syncs can proceed
      collectionFetchedRef.current = { ...collectionFetchedRef.current, [key]: true };
      setCollectionFetched(prev => ({ ...prev, [key]: true }));

      // Fetch remaining pages in the background without blocking the UI
      let cursor = page1?.nextCursor ?? null;
      let allRecords = [...firstBatch];

      while (cursor) {
        const nextPage = await orgsApi.getCollection(apiUserId, orgId, key, cursor);
        const batch = Array.isArray(nextPage?.records) ? nextPage.records : [];
        if (batch.length === 0) break;
        allRecords = [...allRecords, ...batch];
        mergeIntoState(batch, false); // merge each subsequent page
        cursor = nextPage?.nextCursor ?? null;
      }

      // Update delta baseline once all pages are loaded
      if (orgId) {
        if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
        lastSyncedRef.current[orgId][key] = buildBaseline(allRecords);
      }
    } catch (err) {
      logError(`ensureCollectionLoaded(${key}) failed`, err);
    } finally {
      collectionFetchingRef.current[key] = false;
    }
  }, [user?.id, data.activeOrgId]);

  async function createSharedLedger(name) {
    return { error: "Shared ledger has been retired from the app." };
  }

  async function joinSharedLedger(code) {
    return { error: "Shared ledger has been retired from the app." };
  }

  async function leaveSharedLedger() {
    return { error: "Shared ledger has been retired from the app." };
  }

  async function regenerateLedgerInvite() {
    return { error: "Shared ledger has been retired from the app." };
  }

  const contextValue = useMemo(() => ({
    ...data,
    loaded,
    orgSummary,
    isReadOnlyFreeMode: readOnlyFreeMode,
    isViewerMode,
    activeSharedOrgRole,
    sharedOrgs,
    activeSharedOrgKey,
    switchToSharedOrg,
    switchToOwnOrg,
    organizations,
    activeOrgId: data.activeOrgId,
    maxOrganizations,
    canCreateOrganization: organizations.length < maxOrganizations,
    switchOrganization,
    createOrganization,
    deleteOrganization,
    setCurrency,
    saveAccount,
    resetForOrgTypeChange,
    goals: data.goals,
    saveGoals,
    budgets: data.budgets,
    saveBudgets,
    notificationPrefs: data.notificationPrefs,
    saveNotificationPrefs,
    sharedLedger: data.sharedLedger,
    createSharedLedger,
    joinSharedLedger,
    leaveSharedLedger,
    regenerateLedgerInvite,
    customers: data.customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    orgRecords: data.orgRecords,
    saveOrgRecords,
    addOrgRecord,
    updateOrgRecord,
    removeOrgRecord,
    income: data.income,
    addIncome,
    updateIncome,
    removeIncome,
    expenses: data.expenses,
    addExpense,
    updateExpense,
    removeExpense,
    invoices: data.invoices,
    addInvoice,
    updateInvoice,
    removeInvoice,
    collectionFetched,
    ensureCollectionLoaded
  }), [
    addCustomer,
    addExpense,
    addIncome,
    addInvoice,
    addOrgRecord,
    createOrganization,
    createSharedLedger,
    data,
    orgSummary,
    deleteOrganization,
    joinSharedLedger,
    leaveSharedLedger,
    loaded,
    maxOrganizations,
    organizations,
    readOnlyFreeMode,
    regenerateLedgerInvite,
    removeCustomer,
    removeExpense,
    removeIncome,
    removeInvoice,
    removeOrgRecord,
    resetForOrgTypeChange,
    saveAccount,
    saveBudgets,
    saveGoals,
    saveNotificationPrefs,
    saveOrgRecords,
    setCurrency,
    switchOrganization,
    switchToSharedOrg,
    switchToOwnOrg,
    updateCustomer,
    updateExpense,
    updateIncome,
    updateInvoice,
    updateOrgRecord,
    isViewerMode,
    sharedOrgs,
    activeSharedOrgKey,
    activeSharedOrgRole,
    collectionFetched,
    ensureCollectionLoaded
  ]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
