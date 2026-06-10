import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getUserData, setUserData } from "../utils/storage";
import { canCreatePaidOrg, getMaxOrganizations, isFreeReadOnlyMode, isPaidActive, isSubscriptionActive } from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";
import { buildLocationLabel, normalizeSupportedCountry, parseLocationFields } from "../utils/profile";
import { ORG_COLLECTION_KEYS, buildOrgSummary, sortOrgCollectionRecords } from "../utils/orgCollections";
import { orgsApi, usersApi, membersApi, warmupBackend } from "../lib/api";
import { showGlobalToast } from "./ToastContext";
import { clearPendingSync, hasPendingSync, listPendingSyncs, markPendingSync } from "../utils/pendingSyncs";

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
import { logError, logWarn } from "../utils/logger";

const DataContext = createContext();
const DEFAULT_ORG_ID = "org_primary";
const PENDING_ORG_TYPE_CLEAR_KEY = "pendingOrgTypeClears";

function isDeviceOffline() {
  return typeof navigator !== "undefined" && "onLine" in navigator && navigator.onLine === false;
}

function isNetworkLikeError(err) {
  const message = String(err?.message || "");
  return err?.status === 0 || err?.code === "NETWORK_ERROR" || err?.code === "NETWORK_TIMEOUT" || /failed to fetch|network|load failed|timeout/i.test(message);
}

// ── API shape ↔ DataContext shape mappers ─────────────────────────────────────

// Flat API response → nested DataContext org object
function unwrapRecords(payload, key = "") {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const directCandidates = [
    payload.records,
    payload.items,
    payload.rows,
    payload.data,
    key ? payload[key] : null,
    key ? payload.collections?.[key] : null,
    key ? payload.org?.[key] : null,
    key ? payload.organization?.[key] : null
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = unwrapRecords(candidate, key);
      if (nested.length) return nested;
    }
  }

  return [];
}

function pickApiRecords(primary, fallback = [], key = "") {
  if (Array.isArray(primary)) return primary;
  const unwrapped = unwrapRecords(primary, key);
  if (unwrapped.length) return unwrapped;
  return Array.isArray(fallback) ? fallback : [];
}

function fromApiOrg(apiOrg, collections = {}) {
  return {
    account: {
      name: apiOrg.name || "",
      email: apiOrg.email || "",
      phone: apiOrg.phone || "",
      addressLine: apiOrg.addressLine || "",
      city: apiOrg.city || "",
      state: apiOrg.state || "",
      district: apiOrg.district || "",
      pincode: apiOrg.pincode || "",
      country: apiOrg.country || "",
      location: apiOrg.location || "",
      address: apiOrg.address || "",
      gstin: apiOrg.gstin || "",
      showHSN: apiOrg.showHsn || false,
      organizationType: apiOrg.organizationType || ORG_TYPES.SMALL_BUSINESS,
      plan: apiOrg.plan || "",
      subscriptionStatus: apiOrg.subscriptionStatus || "",
      subscriptionEndsAt: apiOrg.subscriptionEndsAt || "",
      billingCycle: apiOrg.billingCycle || "",
      trialStartedAt: apiOrg.trialStartedAt || ""
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
    income: pickApiRecords(collections.income ?? apiOrg.income ?? apiOrg.collections?.income, [], "income"),
    expenses: pickApiRecords(collections.expenses ?? apiOrg.expenses ?? apiOrg.collections?.expenses, [], "expenses"),
    invoices: pickApiRecords(collections.invoices ?? apiOrg.invoices ?? apiOrg.collections?.invoices, [], "invoices"),
    customers: pickApiRecords(collections.customers ?? apiOrg.customers ?? apiOrg.collections?.customers, [], "customers"),
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
    district: acc.district || "",
    pincode: acc.pincode || "",
    country: acc.country || "",
    location: acc.location || "",
    address: acc.address || "",
    gstin: acc.gstin || "",
    showHsn: Boolean(acc.showHSN),
    organizationType: acc.organizationType || ORG_TYPES.SMALL_BUSINESS,
    plan: acc.plan || "",
    subscriptionStatus: acc.subscriptionStatus || "",
    subscriptionEndsAt: acc.subscriptionEndsAt || "",
    billingCycle: acc.billingCycle || "",
    trialStartedAt: acc.trialStartedAt || "",
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
  return crypto.randomUUID();
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

function mergeOrgRecordsForLoad(serverRecords = {}, localRecords = {}) {
  const merged = { ...(serverRecords || {}) };
  Object.entries(localRecords || {}).forEach(([key, localItems]) => {
    const serverItems = Array.isArray(merged[key]) ? merged[key] : [];
    const byId = new Map(serverItems.filter(item => item?.id).map(item => [item.id, item]));
    (Array.isArray(localItems) ? localItems : []).forEach(localItem => {
      if (!localItem?.id) return;
      const serverItem = byId.get(localItem.id);
      if (!serverItem) {
        byId.set(localItem.id, localItem);
        return;
      }
      const serverUpdated = Date.parse(serverItem.updatedAt || serverItem.createdAt || "") || 0;
      const localUpdated = Date.parse(localItem.updatedAt || localItem.createdAt || "") || 0;
      const paidMonths = [
        ...new Set([
          ...(Array.isArray(serverItem.paidMonths) ? serverItem.paidMonths : []),
          ...(Array.isArray(localItem.paidMonths) ? localItem.paidMonths : [])
        ])
      ];
      byId.set(localItem.id, {
        ...(localUpdated >= serverUpdated ? serverItem : localItem),
        ...(localUpdated >= serverUpdated ? localItem : serverItem),
        ...(paidMonths.length ? { paidMonths } : {})
      });
    });
    merged[key] = Array.from(byId.values());
  });
  return merged;
}

function buildSharedOrgEntries(memberships = []) {
  return (memberships || []).reduce((acc, m) => {
    if (!m?.ownerId || !m?.orgId) return acc;
    acc[`${m.ownerId}_${m.orgId}`] = {
      ownerId: m.ownerId,
      orgId: m.orgId,
      orgName: m.orgName || "",
      ownerName: m.owner?.name || "",
      organizationType: m.organizationType || ORG_TYPES.SMALL_BUSINESS,
      role: m.role || "viewer",
      acceptedAt: m.acceptedAt || ""
    };
    return acc;
  }, {});
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
    district: "",
    pincode: "",
    country: "",
    location: "",
    address: "",
    gstin: "",
    showHSN: false,
    organizationType: ORG_TYPES.SMALL_BUSINESS,
    plan: "free",
    subscriptionStatus: "active",
    subscriptionEndsAt: "",
    billingCycle: "",
    trialStartedAt: ""
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
  const district = String(overrides.district || parsedLocation.district || "").trim();
  const pincode = String(overrides.pincode || parsedLocation.pincode || "").trim();
  const rawCountry = String(overrides.country || parsedLocation.country || EMPTY_ORG_DATA.account.country || "").trim();
  const country = rawCountry ? normalizeSupportedCountry(rawCountry) : "";
  const location = buildLocationLabel({ city, district, state, pincode, country });
  const address = buildLocationLabel({ addressLine, city, district, state, pincode, country });
  return {
    ...EMPTY_ORG_DATA.account,
    ...overrides,
    addressLine,
    city,
    state,
    district,
    pincode,
    country,
    location,
    address,
    organizationType: getOrgType(overrides.organizationType || EMPTY_ORG_DATA.account.organizationType)
  };
}

function normalizeOrgData(source = {}, fallback = {}, profileDefaults = {}) {
  const sourceGoals = source.goals || {};
  const fallbackAccount = fallback.account || {};
  const sourceAccount = source.account || {};
  const parsedSourceLocation = parseLocationFields(sourceAccount.location || sourceAccount.address || source.location || source.address || "");
  const parsedFallbackLocation = parseLocationFields(fallbackAccount.location || fallbackAccount.address || fallback.location || fallback.address || "");
  const normalizedAddressLine = String(sourceAccount.addressLine || source.addressLine || parsedSourceLocation.addressLine || fallbackAccount.addressLine || fallback.addressLine || parsedFallbackLocation.addressLine || "").trim();
  const normalizedCity = String(sourceAccount.city || source.city || parsedSourceLocation.city || fallbackAccount.city || fallback.city || parsedFallbackLocation.city || "").trim();
  const normalizedState = String(sourceAccount.state || source.state || parsedSourceLocation.state || fallbackAccount.state || fallback.state || parsedFallbackLocation.state || "").trim();
  const normalizedDistrict = String(sourceAccount.district || source.district || parsedSourceLocation.district || fallbackAccount.district || fallback.district || parsedFallbackLocation.district || "").trim();
  const normalizedPincode = String(sourceAccount.pincode || source.pincode || parsedSourceLocation.pincode || fallbackAccount.pincode || fallback.pincode || parsedFallbackLocation.pincode || "").trim();
  const rawCountry = String(sourceAccount.country || source.country || parsedSourceLocation.country || fallbackAccount.country || fallback.country || parsedFallbackLocation.country || EMPTY_ORG_DATA.account.country || "").trim();
  const normalizedCountry = rawCountry ? normalizeSupportedCountry(rawCountry) : "";
  const normalizedLocation = buildLocationLabel({ city: normalizedCity, district: normalizedDistrict, state: normalizedState, pincode: normalizedPincode, country: normalizedCountry });
  const normalizedAddress = buildLocationLabel({ addressLine: normalizedAddressLine, city: normalizedCity, district: normalizedDistrict, state: normalizedState, pincode: normalizedPincode, country: normalizedCountry });
  const normalizedCollections = {
    income: sortOrgCollectionRecords("income", source.income || []),
    expenses: sortOrgCollectionRecords("expenses", source.expenses || []),
    invoices: sortOrgCollectionRecords("invoices", source.invoices || []),
    customers: source.customers || [],
    orgRecords: source.orgRecords || {}
  };
  const normalizedOrg = {
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
        district: normalizedDistrict,
        pincode: normalizedPincode,
        country: normalizedCountry,
        location: normalizedLocation,
        address: normalizedAddress,
        gstin: source.gstin || fallbackAccount.gstin || "",
        showHSN: source.showHSN || fallbackAccount.showHSN || false,
        organizationType: source.organizationType || source.account?.organizationType || fallbackAccount.organizationType || ORG_TYPES.SMALL_BUSINESS,
        plan: sourceAccount.plan || source.plan || fallbackAccount.plan || "",
        subscriptionStatus: sourceAccount.subscriptionStatus || source.subscriptionStatus || fallbackAccount.subscriptionStatus || "",
        subscriptionEndsAt: sourceAccount.subscriptionEndsAt || source.subscriptionEndsAt || fallbackAccount.subscriptionEndsAt || "",
        billingCycle: sourceAccount.billingCycle || source.billingCycle || fallbackAccount.billingCycle || "",
        trialStartedAt: sourceAccount.trialStartedAt || source.trialStartedAt || fallbackAccount.trialStartedAt || ""
      }
    )
  };
  return normalizedOrg;
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
  const dataRef = useRef(EMPTY_DATA);
  const [orgSummary, setOrgSummary] = useState(EMPTY_SUMMARY);
  const [loaded, setLoaded] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [ownedOrganizations, setOwnedOrganizations] = useState([]);
  // Tracks which collections have been fetched from the server this session.
  // Customers are loaded eagerly; income/expenses/invoices are loaded on demand.
  const [collectionFetched, setCollectionFetched] = useState({ income: false, expenses: false, invoices: false, customers: false });
  const collectionFetchedRef = useRef({ income: false, expenses: false, invoices: false, customers: false });
  const collectionFetchingRef = useRef({});
  const [activeSharedOrgKey, setActiveSharedOrgKey] = useState(null);
  const [activeSharedOrgRole, setActiveSharedOrgRole] = useState(null); // live role from orgMembers snapshot
  const [sharedOrgsByKey, setSharedOrgsByKey] = useState({});
  const [ownDataReloadKey, setOwnDataReloadKey] = useState(0);
  const activeSharedOrgRef = useRef(null); // mirrors activeSharedOrgKey for use in callbacks
  const activeOrgType = getOrgType(data.account?.organizationType || user?.organizationType);
  const readOnlyFreeMode = isFreeReadOnlyMode(user, activeOrgType, data.account);
  const sessionRef = useRef(null);
  const flushInFlightRef = useRef(false);
  const readOnlyNoticeAtRef = useRef(0);
  const collectionSyncRef = useRef({});
  const activeOrgSyncQueueRef = useRef({});
  const activeMutationQueueRef = useRef(Promise.resolve());
  // Delta write baseline: { [orgId]: { income: Map<id,serialized>, expenses: ..., ... } }
  // Initialized after each full load; updated after each successful delta sync.
  const lastSyncedRef = useRef({});
  const requestedOwnOrgIdRef = useRef("");
  // Tracks whether we've already auto-retried the bootstrap load for the current user
  // after a transient network-timeout, so we don't loop on persistent failures.
  const bootstrapRetriedRef = useRef(null);
  const sharedOrgsUserIdRef = useRef("");
  // Wall-clock timestamp of the last successful bootstrap load. Used by the resume
  // listener to decide if we need to refresh after the user returns from background.
  const lastLoadedAtRef = useRef(0);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const mapOwnedOrganizations = useCallback((orgsMap = {}) => Object.entries(orgsMap || {}).map(([orgId, orgValue]) => ({
    id: orgId,
    name: orgValue.account?.name || "Untitled Organization",
    organizationType: getOrgType(orgValue.account?.organizationType),
    ownerId: user?.id || "",
    isOwned: true,
    plan: orgValue.account?.plan || "",
    subscriptionStatus: orgValue.account?.subscriptionStatus || "",
    subscriptionEndsAt: orgValue.account?.subscriptionEndsAt || "",
    billingCycle: orgValue.account?.billingCycle || "",
    hasData: Boolean(
      orgValue.customers?.length ||
      orgValue.income?.length ||
      orgValue.expenses?.length ||
      orgValue.invoices?.length ||
      Object.keys(orgValue.orgRecords || {}).length
    )
  })), [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      sharedOrgsUserIdRef.current = "";
      setSharedOrgsByKey({});
      return;
    }

    const userSharedOrgs = user.sharedOrgs || {};
    if (sharedOrgsUserIdRef.current !== user.id) {
      sharedOrgsUserIdRef.current = user.id;
      setSharedOrgsByKey(userSharedOrgs);
      return;
    }

    if (Object.keys(userSharedOrgs).length) {
      setSharedOrgsByKey(prev => ({ ...prev, ...userSharedOrgs }));
    }
  }, [user?.id, user?.sharedOrgs]);

  // Derived: shared orgs list and viewer-mode flag
  const sharedOrgs = useMemo(() =>
    Object.entries(sharedOrgsByKey || {}).map(([key, info]) => ({ key, ...info })),
    [sharedOrgsByKey]
  );

  // Poll membership status every 30s while viewing a shared org
  // Replaces the Firestore onSnapshot live-role listener
  useEffect(() => {
    if (!activeSharedOrgKey || !user?.id) {
      setActiveSharedOrgRole(null);
      return undefined;
    }
    const sharedInfo = sharedOrgsByKey?.[activeSharedOrgKey];
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
          setSharedOrgsByKey(prev => {
            const next = { ...(prev || {}) };
            delete next[staleKey];
            return next;
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
    let intervalId = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState !== "hidden") {
        checkMembership();
      }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [activeSharedOrgKey, sharedOrgsByKey, user?.id, setUser]);

  const isViewerMode = useMemo(() => {
    if (!activeSharedOrgKey) return false;
    const role = activeSharedOrgRole ?? sharedOrgsByKey?.[activeSharedOrgKey]?.role ?? "viewer";
    return role === "viewer";
  }, [activeSharedOrgKey, activeSharedOrgRole, sharedOrgsByKey]);

  const syncActiveOrgCollections = useCallback(async (nextState) => {
    if (!user?.id || !nextState?.activeOrgId) return;
    const orgId = nextState.activeOrgId;
    const results = await Promise.allSettled([
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
      orgsApi.syncOrgRecords(user.id, orgId, nextState.orgRecords || {})
    ]);
    const failed = results.filter(result => result.status === "rejected");
    if (failed.length) {
      // Mark this org as having unsynced local changes — drainPendingSyncs() will
      // retry on the next resume / online event so changes don't sit forever on
      // device when the user goes offline mid-edit.
      markPendingSync(user.id, orgId);
      const error = new Error("Collection sync failed");
      error.code = failed.some(result => isNetworkLikeError(result.reason)) ? "NETWORK_ERROR" : "COLLECTION_SYNC_FAILED";
      error.failures = failed.map(result => result.reason);
      throw error;
    }
    // All collection writes succeeded — clear the persistent retry flag.
    clearPendingSync(user.id, orgId);
  }, [user?.id]);

  const queueActiveOrgSync = useCallback((nextState) => {
    const orgId = nextState?.activeOrgId;
    if (!orgId) return Promise.resolve();
    const previous = activeOrgSyncQueueRef.current[orgId] || Promise.resolve();
    const task = previous
      .catch(() => {})
      .then(() => syncActiveOrgCollections(nextState));
    const trackedTask = task.finally(() => {
      if (activeOrgSyncQueueRef.current[orgId] === trackedTask) {
        delete activeOrgSyncQueueRef.current[orgId];
      }
    });
    activeOrgSyncQueueRef.current[orgId] = trackedTask;
    return trackedTask;
  }, [syncActiveOrgCollections]);

  const syncSharedOrgCollections = useCallback(async (nextState, sharedInfo) => {
    if (!sharedInfo?.ownerId || !sharedInfo?.orgId) return;
    const orgId = sharedInfo.orgId;
    const results = await Promise.allSettled([
      ...ORG_COLLECTION_KEYS.map(async key => {
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
      }),
      orgsApi.syncOrgRecords(sharedInfo.ownerId, orgId, nextState.orgRecords || {})
    ]);
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
      const nowIso = new Date().toISOString();
      const updates = {
        updatedAt: nowIso,
        lastActivityAt: nowIso
      };

      if (!sessionRef.current.orgVisits?.[nextOrgId]) {
        sessionRef.current.orgVisits = { ...(sessionRef.current.orgVisits || {}), [nextOrgId]: true };
      }

      sessionRef.current.orgMeta = {
        ...(sessionRef.current.orgMeta || {}),
        [nextOrgId]: {
          name: orgData?.account?.name || "",
          organizationType: getOrgType(orgData?.account?.organizationType || user?.organizationType)
        }
      };
      persistSessionDraft();
      await usersApi.update(user.id, updates).catch(err => logError("Session org change flush failed", err));
      setUser(prev => (prev ? { ...prev, lastActivityAt: nowIso } : prev));
    },
    [data.orgs, persistSessionDraft, setUser, user?.id, user?.organizationType]
  );

  const flushSessionAnalytics = useCallback(
    async ({ force = false } = {}) => {
      if (!user?.id || !sessionRef.current || flushInFlightRef.current) return;

      captureSessionTick();
      const sessionDraft = sessionRef.current;
      if (!sessionDraft) return;

      const totalMs = Math.round(sessionDraft.pendingTotalMs || 0);
      if (totalMs < (force ? SESSION_MIN_FLUSH_MS : SESSION_FLUSH_INTERVAL_MS)) {
        persistSessionDraft();
        return;
      }

      const byOrg = { ...(sessionDraft.pendingByOrg || {}) };
      sessionDraft.pendingTotalMs = 0;
      sessionDraft.pendingByOrg = {};
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
        const currentSession = sessionRef.current;
        if (!currentSession) return;
        currentSession.pendingTotalMs = (currentSession.pendingTotalMs || 0) + totalMs;
        currentSession.pendingByOrg = Object.entries(byOrg).reduce((acc, [orgId, orgMs]) => {
          acc[orgId] = (currentSession.pendingByOrg?.[orgId] || 0) + orgMs;
          return acc;
        }, { ...(currentSession.pendingByOrg || {}) });
      } finally {
        flushInFlightRef.current = false;
        if (sessionRef.current) persistSessionDraft();
      }
    },
    [captureSessionTick, persistSessionDraft, setUser, user?.id]
  );

  const persistState = useCallback(
    nextState => {
      if (!user?.id) return Promise.resolve();

      // In shared org (admin) mode: sync collections to owner's path only
      const sharedInfo = activeSharedOrgRef.current;
      if (sharedInfo) {
        if (!sharedInfo.isViewer) {
          return syncSharedOrgCollections(nextState, sharedInfo);
        }
        return Promise.resolve();
      }

      // Optimistic local cache
      setUserData(user.id, "appData", nextState);
      setSyncStatus("syncing");

      // Fire-and-forget API writes (non-blocking)
      const orgId = nextState.activeOrgId;
      const writes = Promise.allSettled([
        orgsApi.update(user.id, orgId, toApiOrgUpdate(nextState)),
        queueActiveOrgSync(nextState),
        usersApi.update(user.id, { activeOrgId: orgId, organizationType: nextState.account?.organizationType || ORG_TYPES.SMALL_BUSINESS })
      ]).then(results => {
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            const label = ["org update", "collection sync", "user update"][index];
            logError(`${label} failed`, result.reason);
          }
        });
        const rejected = results.filter(result => result.status === "rejected");
        if (rejected.length) {
          const networkFailure = rejected.some(result => isNetworkLikeError(result.reason));
          setOfflineMode(networkFailure);
          setSyncStatus(networkFailure ? "offline" : "error");
        } else {
          setOfflineMode(false);
          setSyncStatus("synced");
        }
      });

      setUser(prev =>
        prev
          ? {
              ...prev,
              activeOrgId: orgId,
              organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
            }
          : prev
      );

      return writes;
    },
    [queueActiveOrgSync, setUser, syncSharedOrgCollections, user?.id]
  );

  const refreshSharedMemberships = useCallback(async () => {
    if (!user?.id) return null;
    try {
      const memberships = await orgsApi.getMemberships(user.id);
      const nextSharedOrgs = buildSharedOrgEntries(Array.isArray(memberships) ? memberships : []);
      setSharedOrgsByKey(nextSharedOrgs);
      setUser(prev => (prev ? { ...prev, sharedOrgs: nextSharedOrgs } : prev));
      return nextSharedOrgs;
    } catch (err) {
      logError("refreshSharedMemberships failed", err);
      return null;
    }
  }, [setUser, user?.id]);

  useEffect(() => {
    if (!user?.id || user?.role === "admin") return;
    refreshSharedMemberships();
  }, [refreshSharedMemberships, user?.id, user?.role]);

  useEffect(() => {
    async function loadData() {
      if (activeSharedOrgRef.current) return;

      if (!user?.id) {
        collectionSyncRef.current = {};
        lastSyncedRef.current = {};
        setData(EMPTY_DATA);
        setOrgSummary(EMPTY_SUMMARY);
        setOfflineMode(false);
        setSyncStatus("idle");
        setLoaded(true);
        return;
      }

      const localData = getUserData(user.id, "appData") || EMPTY_DATA;
      const hasLocalOrgs = Boolean(localData?.orgs && Object.keys(localData.orgs || {}).length);
      if (hasLocalOrgs) {
        const cachedState = buildStateFromOrganizations({
          orgs: normalizeOrgCollection(localData, {
            account: { email: user?.email || "", phone: user?.phone || "", organizationType: user?.organizationType }
          }),
          activeOrgId: localData.activeOrgId || user.activeOrgId || DEFAULT_ORG_ID,
          sharedLedger: null
        });
        setOwnedOrganizations(mapOwnedOrganizations(cachedState.orgs));
        dataRef.current = cachedState;
        setData(cachedState);
        setOrgSummary(cachedState.summary || EMPTY_SUMMARY);
        setLoaded(true);
        setOfflineMode(Boolean(user?.offlineProfile));
        setSyncStatus(user?.offlineProfile ? "offline" : "syncing");
      } else {
        setLoaded(false);
        setSyncStatus("syncing");
      }

      try {
        // Load the active org with its core records. Income/expenses are first-screen
        // product data, and deferring them made tabs disagree with dashboard summaries.
        const requestedActiveOrgId = requestedOwnOrgIdRef.current || user.activeOrgId || DEFAULT_ORG_ID;
        requestedOwnOrgIdRef.current = "";

        // Reset per-session collection fetch flags for this load
        const freshFetched = { income: false, expenses: false, invoices: false, customers: false };
        collectionFetchedRef.current = freshFetched;
        setCollectionFetched(freshFetched);

        // Read local cache — income/expenses/invoices come from here until lazily refreshed
        let allOrgs = await orgsApi.list(user.id);
        let effectiveActiveOrgId = requestedActiveOrgId;

        if ((allOrgs || []).length === 0) {
          const memberships = await orgsApi.getMemberships(user.id).catch(() => null);
          if (memberships !== null) {
            const nextSharedOrgs = buildSharedOrgEntries(Array.isArray(memberships) ? memberships : []);
            setSharedOrgsByKey(nextSharedOrgs);
            setUser(prev => (prev ? { ...prev, sharedOrgs: nextSharedOrgs } : prev));
          }
          const emptyState = buildStateFromOrganizations({ orgs: {}, activeOrgId: "", sharedLedger: null });
          dataRef.current = emptyState;
          setData(emptyState);
          setOwnedOrganizations([]);
          setOrgSummary(EMPTY_SUMMARY);
          setUserData(user.id, "appData", emptyState);
          setOfflineMode(false);
          setSyncStatus("synced");
          setLoaded(true);
          return;
        }

        const resolvedActiveOrgId = (allOrgs || []).some(org => org.id === effectiveActiveOrgId)
          ? effectiveActiveOrgId
          : (allOrgs?.[0]?.id || DEFAULT_ORG_ID);
        if (resolvedActiveOrgId !== requestedActiveOrgId && (allOrgs || []).some(org => org.id === resolvedActiveOrgId)) {
          const resolvedOrg = (allOrgs || []).find(org => org.id === resolvedActiveOrgId);
          usersApi.update(user.id, {
            activeOrgId: resolvedActiveOrgId,
            organizationType: getOrgType(resolvedOrg?.organizationType || user.organizationType)
          }).catch(err => logError("activeOrgId repair failed", err, {
            requestedActiveOrgId,
            resolvedActiveOrgId
          }));
        }
        const localOrg = localData.orgs?.[resolvedActiveOrgId] || {};
        const hasLocalActiveOrg = Boolean(
          localOrg && (
            (Array.isArray(localOrg.income)    && localOrg.income.length)    ||
            (Array.isArray(localOrg.expenses)  && localOrg.expenses.length)  ||
            (Array.isArray(localOrg.invoices)  && localOrg.invoices.length)  ||
            (Array.isArray(localOrg.customers) && localOrg.customers.length) ||
            (localOrg.orgRecords && Object.keys(localOrg.orgRecords).length)
          )
        );

        // Pick the cheapest /full call we can. /full is the heaviest endpoint — sending
        // *every* income/expense/invoice/customer back to the client is what makes the
        // bootstrap fragile on slow networks. Two reductions:
        //   1) Returning user with local cache → pass since=lastSyncedAt so the server
        //      only ships records changed since then. Usually 0 records, ~1 KB payload.
        //   2) New device with no cache → use ?meta=1 to skip collections entirely on
        //      this call, then load each collection paginated in parallel below.
        // Either way we avoid the 100 KB+ monolithic JSON that kept timing out.
        const cachedSyncedAt = getSyncedAt(user.id, resolvedActiveOrgId);
        const useIncremental = hasLocalActiveOrg && cachedSyncedAt;
        const fullOpts = useIncremental ? { metaOnly: false } : { metaOnly: true };
        const sinceParam = useIncremental ? cachedSyncedAt : null;

        let getFullError = null;
        const collectionFetches = useIncremental
          ? [Promise.resolve(null), Promise.resolve(null), Promise.resolve(null)]
          : [
              orgsApi.getCollection(user.id, resolvedActiveOrgId, "income").catch(() => null),
              orgsApi.getCollection(user.id, resolvedActiveOrgId, "expenses").catch(() => null),
              orgsApi.getCollection(user.id, resolvedActiveOrgId, "invoices").catch(() => null)
            ];

        const [activeOrgMeta, customersPage, summary, incomePage, expensesPage, invoicesPage] = await Promise.all([
          orgsApi.getFull(user.id, resolvedActiveOrgId, sinceParam, fullOpts).catch(err => { getFullError = err; return null; }),
          orgsApi.getCollection(user.id, resolvedActiveOrgId, "customers").catch(() => null),
          orgsApi.getSummary(user.id, resolvedActiveOrgId).catch(() => EMPTY_SUMMARY),
          ...collectionFetches
        ]);

        // If /full failed and we have nothing cached for this org, propagate the error so
        // the outer catch can run its retry / offline-toast logic. Showing a half-empty
        // screen with no transactions is a worse UX than an honest "couldn't load" state.
        if (!activeOrgMeta && !hasLocalActiveOrg) {
          throw getFullError || new Error("Failed to load active org data.");
        }

        // getCollection returns { records, hasMore, nextCursor } — unwrap the first page.
        const customers = customersPage ? unwrapRecords(customersPage, "customers") : null;

        // Build orgs map: metadata-only for non-active orgs; full local cache + fresh
        // customers + server metadata for the active org.
        const orgsMap = {};
        (allOrgs || []).forEach(apiOrg => {
          orgsMap[apiOrg.id] = normalizeOrgData(fromApiOrg(apiOrg));
        });
        if (activeOrgMeta) {
          // Three response shapes to handle:
          //   • isPartial=true  → /full?since=… returned only deltas; merge into local cache.
          //   • isMetaOnly=true → /full?meta=1 returned settings only; collections come from
          //     the parallel /collection calls (or local cache if a page failed).
          //   • neither (legacy full payload) → server returned everything; replace.
          const isPartial  = Boolean(activeOrgMeta.isPartial);
          const isMetaOnly = Boolean(activeOrgMeta.isMetaOnly);

          const resolveCollection = (key, deltaFromMeta, paginatedPage) => {
            const local = Array.isArray(localOrg[key]) ? localOrg[key] : [];
            if (isPartial) {
              // Server sent only changed records — merge them on top of cached arrays.
              const delta = Array.isArray(deltaFromMeta) ? deltaFromMeta : [];
              return mergeRecords(local, delta);
            }
            if (isMetaOnly) {
              // Settings-only response — use the paginated collection page; if that
              // failed, fall back to local cache so the screen isn't empty.
              if (paginatedPage) {
                const records = unwrapRecords(paginatedPage, key);
                return records.length ? records : local;
              }
              return local;
            }
            // Legacy full payload — primary wins, local is fallback.
            return pickApiRecords(deltaFromMeta ?? activeOrgMeta.collections?.[key] ?? activeOrgMeta, local, key);
          };

          orgsMap[resolvedActiveOrgId] = normalizeOrgData(fromApiOrg(activeOrgMeta, {
            income:     resolveCollection("income",    activeOrgMeta.income,    incomePage),
            expenses:   resolveCollection("expenses",  activeOrgMeta.expenses,  expensesPage),
            invoices:   resolveCollection("invoices",  activeOrgMeta.invoices,  invoicesPage),
            customers:  customers          ?? localOrg.customers ?? [],
            orgRecords: mergeOrgRecordsForLoad(activeOrgMeta.orgRecords || {}, localOrg.orgRecords || {})
          }));

          // Persist the new sync watermark for the next incremental fetch.
          if (activeOrgMeta.syncedAt) {
            setSyncedAt(user.id, resolvedActiveOrgId, activeOrgMeta.syncedAt);
          }
        } else {
          // /full failed but we have a local cache for this org — keep the user in the app
          // with cached data instead of a blank screen. The metadata from list() is preserved
          // (org name, currency, etc.), only the collections come from cache.
          const apiOrgEntry = (allOrgs || []).find(o => o.id === resolvedActiveOrgId);
          orgsMap[resolvedActiveOrgId] = normalizeOrgData(fromApiOrg(apiOrgEntry || {}, {
            income:     Array.isArray(localOrg.income)     ? localOrg.income     : [],
            expenses:   Array.isArray(localOrg.expenses)   ? localOrg.expenses   : [],
            invoices:   Array.isArray(localOrg.invoices)   ? localOrg.invoices   : [],
            customers:  customers ?? (Array.isArray(localOrg.customers) ? localOrg.customers : []),
            orgRecords: localOrg.orgRecords || {}
          }));
          showGlobalToast({
            tone: "warning",
            title: "Connection slow",
            message: "Showing cached data — couldn't refresh from server. Your latest changes will sync once the connection improves."
          });
          // Schedule a single background retry — by then the cold backend has likely warmed
          // up and the user shouldn't have to manually pull-to-refresh.
          if (bootstrapRetriedRef.current !== user?.id) {
            bootstrapRetriedRef.current = user?.id;
            setTimeout(() => setOwnDataReloadKey(k => k + 1), 6_000);
          }
        }

        if (!orgsMap[resolvedActiveOrgId]) {
          orgsMap[DEFAULT_ORG_ID] = normalizeOrgData({});
        }

        const nextState = buildStateFromOrganizations({
          orgs: orgsMap,
          activeOrgId: activeOrgMeta?.id || resolvedActiveOrgId,
          sharedLedger: null
        });

        setOwnedOrganizations(mapOwnedOrganizations(orgsMap));
        dataRef.current = nextState;
        setData(nextState);

        // Establish delta-write baseline for loaded active-org collections.
        const loadedOrgId = activeOrgMeta?.id || resolvedActiveOrgId;
        if (!lastSyncedRef.current[loadedOrgId]) lastSyncedRef.current[loadedOrgId] = {};
        ["income", "expenses", "invoices"].forEach(key => {
          const records = orgsMap[loadedOrgId]?.[key];
          if (Array.isArray(records)) {
            lastSyncedRef.current[loadedOrgId][key] = buildBaseline(records);
            collectionFetchedRef.current = { ...collectionFetchedRef.current, [key]: true };
          }
        });
        setCollectionFetched(prev => ({
          ...prev,
          income: Array.isArray(orgsMap[loadedOrgId]?.income),
          expenses: Array.isArray(orgsMap[loadedOrgId]?.expenses),
          invoices: Array.isArray(orgsMap[loadedOrgId]?.invoices)
        }));
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
                const batch = unwrapRecords(next, "customers");
                if (batch.length === 0) break;
                allRecords = [...allRecords, ...batch];
                setData(prev => {
                  const prevOrg = prev.orgs?.[loadedOrgId];
                  if (!prevOrg) return prev;
                  const merged = normalizeOrgData({ ...prevOrg, customers: mergeRecords(prevOrg.customers || [], batch) });
                  const nextState = buildStateFromOrganizations({ orgs: { ...prev.orgs, [loadedOrgId]: merged }, activeOrgId: prev.activeOrgId, sharedLedger: prev.sharedLedger });
                  dataRef.current = nextState;
                  return nextState;
                });
                cursor = next?.nextCursor ?? null;
              }
              lastSyncedRef.current[loadedOrgId].customers = buildBaseline(allRecords);
            })();
          }
        }

        setOrgSummary(summary || EMPTY_SUMMARY);
        setUserData(user.id, "appData", nextState);
        setOfflineMode(false);
        setSyncStatus("synced");
        bootstrapRetriedRef.current = null;
        lastLoadedAtRef.current = Date.now();
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
          const nextSharedOrgs = buildSharedOrgEntries(Array.isArray(memberships) ? memberships : []);
          setSharedOrgsByKey(nextSharedOrgs);
          const currentSharedOrgs = user?.sharedOrgs || {};
          if (JSON.stringify(currentSharedOrgs) !== JSON.stringify(nextSharedOrgs)) {
            setUser(prev => (prev ? { ...prev, sharedOrgs: nextSharedOrgs } : prev));
          }
        }
      } catch (err) {
        logError("loadData failed, using local cache", err);
        // Distinguish three failure modes so the user gets an honest message and we
        // can auto-retry the right cases:
        //   1) Device truly offline → tell them to reconnect, fall back to cache.
        //   2) Online but request timed out and we have NO cached data → most likely a
        //      cold backend or flaky link. Auto-retry once after a short delay before
        //      surfacing an "offline" state, since the empty-data screen is misleading.
        //   3) Online and we already have cached data → show cache, advise we'll retry
        //      in the background.
        const deviceOffline = isDeviceOffline();
        const timedOut      = err?.code === "NETWORK_TIMEOUT" || /timeout/i.test(String(err?.message || ""));

        if (!deviceOffline && timedOut && !hasLocalOrgs && bootstrapRetriedRef.current !== user?.id) {
          // First-time login on a slow/flaky network with a cold backend. Don't drop into
          // offline mode yet — try once more after the backend has had time to wake.
          bootstrapRetriedRef.current = user?.id;
          showGlobalToast({ tone: "info", title: "Connecting…", message: "Server is taking a moment to wake up. Retrying…" });
          setTimeout(() => setOwnDataReloadKey(k => k + 1), 4_000);
          return;
        }

        showGlobalToast(
          deviceOffline
            ? { tone: "warning", title: "You're offline", message: "Showing locally cached data." }
            : hasLocalOrgs
              ? { tone: "warning", title: "Couldn't reach server", message: "Showing cached data — we'll keep trying in the background." }
              : { tone: "warning", title: "Connection slow", message: "Couldn't reach the server. Pull down to retry once your connection improves." }
        );
        const nextState = buildStateFromOrganizations({
          orgs: normalizeOrgCollection(localData, {
            account: { email: user?.email || "", phone: user?.phone || "", organizationType: user?.organizationType }
          }),
          activeOrgId: localData.activeOrgId || DEFAULT_ORG_ID,
          sharedLedger: null
        });
        setOwnedOrganizations(mapOwnedOrganizations(nextState.orgs));
        dataRef.current = nextState;
        setData(nextState);
        setOfflineMode(true);
        setSyncStatus("offline");
      } finally {
        setLoaded(true);
      }
    }

    loadData();
  }, [mapOwnedOrganizations, setUser, user?.activeOrgId, user?.email, user?.id, user?.offlineProfile, user?.organizationType, user?.phone, ownDataReloadKey]);

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

  // Drain any pending sync flags that survived an app restart. A user who went
  // offline mid-edit, closed the app, and came back online has unsynced local
  // changes — the data is safe in localStorage but never reached the server.
  // We replay the sync using the current (already-restored) local state.
  const drainPendingSyncs = useCallback(() => {
    if (!user?.id || !loaded) return;
    const orgs = listPendingSyncs(user.id);
    if (orgs.length === 0) return;
    const state = dataRef.current;
    if (!state?.activeOrgId) return;
    if (orgs.includes(state.activeOrgId)) {
      // Re-fire the existing sync path — it computes deltas from current state and
      // clears the pending flag itself on success / re-marks on failure.
      queueActiveOrgSync(state).catch(() => {});
    }
    // Non-active orgs with pending changes will drain when the user switches to
    // them (the org-switch path also calls queueActiveOrgSync). No extra work here.
  }, [user?.id, loaded, queueActiveOrgSync]);

  // Refresh stale data when the user returns to the app after background.
  //
  // On Android, an active session can sit in the background for hours while the
  // user is in another app. Without this, the dashboard shows yesterday's totals
  // until they manually pull-to-refresh. We bump the reload key (which re-runs
  // loadData with the since=lastSyncedAt path → tiny incremental payload) when:
  //   • The native appStateChange event reports isActive=true, OR
  //   • document.visibilitychange flips back to "visible",
  // AND the last successful load was more than RESUME_REFRESH_THRESHOLD_MS ago.
  // The threshold avoids hammering the API for quick app switches.
  useEffect(() => {
    if (!user?.id || !loaded) return undefined;

    const RESUME_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 min

    async function maybeRefresh() {
      // Always try to drain unsynced local changes — they're cheap to retry and
      // the user expects their offline edits to land as soon as connectivity is back.
      drainPendingSyncs();
      const last = lastLoadedAtRef.current;
      if (!last) return;
      if (Date.now() - last < RESUME_REFRESH_THRESHOLD_MS) return;
      // Warm up the backend before reloading data — Railway containers can go cold
      // while the app is backgrounded. Without this the reload fires immediately
      // and all 3 retries exhaust before the container is ready.
      await warmupBackend();
      setOwnDataReloadKey(k => k + 1);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") maybeRefresh();
    }

    function handleOnline() {
      // The browser/WebView reports the connection came back — drain immediately
      // even if the app was already foregrounded.
      drainPendingSyncs();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    let nativeListener;
    import("@capacitor/app").then(({ App: CapApp }) => {
      nativeListener = CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) maybeRefresh();
      });
    }).catch(() => {});

    // Also try once on mount — covers the "edited offline → app killed → reopened" case.
    drainPendingSyncs();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      if (nativeListener) nativeListener.then(h => h.remove()).catch(() => {});
    };
  }, [user?.id, loaded, drainPendingSyncs]);

  const update = useCallback(
    updater => {
      if (!user?.id) return Promise.resolve();
      // Viewer-mode members cannot write
      if (activeSharedOrgRef.current?.isViewer) return Promise.resolve();
      if (readOnlyFreeMode) {
        if (typeof window !== "undefined") {
          const nowMs = Date.now();
          if (nowMs - readOnlyNoticeAtRef.current > 1200) {
            readOnlyNoticeAtRef.current = nowMs;
            window.dispatchEvent(
              new CustomEvent("ledger:readonly-blocked", {
                detail: {
                  tone: "warning",
                  message: "Your subscription is inactive. Go to Settings > Manage Subscription to choose Pro."
                }
              })
            );
          }
        }
        return Promise.resolve();
      }

      const prev = dataRef.current || data || EMPTY_DATA;
      const proposed = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      const nextActiveOrgId = proposed.activeOrgId || prev.activeOrgId || DEFAULT_ORG_ID;
      const nextState = buildStateFromOrganizations({
        orgs: {
          ...proposed.orgs,
          [nextActiveOrgId]: extractActiveOrg({ ...proposed, activeOrgId: nextActiveOrgId })
        },
        activeOrgId: nextActiveOrgId,
        sharedLedger: null
      });

      dataRef.current = nextState;
      setData(nextState);

      const previousWrite = activeMutationQueueRef.current || Promise.resolve();
      const writeTask = previousWrite
        .catch(() => {})
        .then(() => persistState(nextState));
      activeMutationQueueRef.current = writeTask;
      return writeTask;
    },
    [data, persistState, readOnlyFreeMode, user?.id]
  );

  const setCurrency = cur => update(d => ({ ...d, currency: cur }));
  const saveAccount = acc => update(d => ({ ...d, account: acc }));
  const readPendingOrgTypeClears = useCallback(() => {
    if (!user?.id) return [];
    const pending = getUserData(user.id, PENDING_ORG_TYPE_CLEAR_KEY);
    return Array.isArray(pending) ? pending : [];
  }, [user?.id]);

  const writePendingOrgTypeClears = useCallback((items) => {
    if (!user?.id) return;
    setUserData(user.id, PENDING_ORG_TYPE_CLEAR_KEY, Array.isArray(items) ? items : []);
  }, [user?.id]);

  const enqueueOrgTypeClear = useCallback((orgId) => {
    if (!user?.id || !orgId) return;
    const pending = readPendingOrgTypeClears();
    const exists = pending.some(item => item?.orgId === orgId);
    if (!exists) {
      writePendingOrgTypeClears([...pending, { orgId, queuedAt: new Date().toISOString() }]);
    }
  }, [readPendingOrgTypeClears, user?.id, writePendingOrgTypeClears]);

  const clearOrgTypeCollections = useCallback(async (orgId) => {
    if (!user?.id || !orgId) return;
    const operations = [
      ["income", () => orgsApi.syncCollection(user.id, orgId, "income", [])],
      ["expenses", () => orgsApi.syncCollection(user.id, orgId, "expenses", [])],
      ["invoices", () => orgsApi.syncCollection(user.id, orgId, "invoices", [])],
      ["customers", () => orgsApi.syncCollection(user.id, orgId, "customers", [])],
      ["orgRecords", () => orgsApi.clearOrgRecords(user.id, orgId)]
    ];
    const results = await Promise.allSettled(operations.map(([, run]) => run()));
    const failed = results
      .map((result, index) => result.status === "rejected" ? { op: operations[index][0], reason: result.reason } : null)
      .filter(Boolean);
    if (failed.length) {
      const error = new Error(`Org type clear failed for ${failed.map(item => item.op).join(", ")}`);
      error.code = failed.some(item => isNetworkLikeError(item.reason)) ? "NETWORK_ERROR" : "ORG_TYPE_CLEAR_FAILED";
      error.failures = failed.map(item => item.op);
      throw error;
    }
  }, [user?.id]);

  const flushPendingOrgTypeClears = useCallback(async () => {
    if (!user?.id || isDeviceOffline()) return;
    const pending = readPendingOrgTypeClears();
    if (!pending.length) return;

    const remaining = [];
    for (const item of pending) {
      try {
        await clearOrgTypeCollections(item.orgId);
      } catch (err) {
        remaining.push(item);
        if (!isNetworkLikeError(err)) {
          logError("Pending org type clear failed", err, { orgId: item.orgId });
        }
      }
    }
    writePendingOrgTypeClears(remaining);
  }, [clearOrgTypeCollections, readPendingOrgTypeClears, user?.id, writePendingOrgTypeClears]);

  const resetForOrgTypeChange = (nextAccount) => {
    update(d => buildResetData(d, nextAccount));
    const orgId = data.activeOrgId;
    if (user?.id && orgId) {
      if (isDeviceOffline()) {
        enqueueOrgTypeClear(orgId);
        showGlobalToast({
          tone: "warning",
          title: "Offline mode",
          message: "Changes are saved locally and will sync when you're back online."
        });
        return;
      }
      clearOrgTypeCollections(orgId)
        .catch(err => {
          enqueueOrgTypeClear(orgId);
          const ctx = { orgId, code: err?.code, failures: err?.failures || [] };
          if (isNetworkLikeError(err)) {
            logWarn("resetForOrgTypeChange queued clear retry", ctx);
          } else {
            logError("resetForOrgTypeChange queued clear retry", err, ctx);
          }
        });
    }
  };
  useEffect(() => {
    if (!user?.id) return undefined;
    flushPendingOrgTypeClears();
    if (typeof window === "undefined") return undefined;
    const onOnline = () => flushPendingOrgTypeClears();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flushPendingOrgTypeClears, user?.id]);

  const saveGoals = goals => update(d => ({ ...d, goals: { ...d.goals, ...goals } }));
  const saveBudgets = budgets => update(d => ({ ...d, budgets: { ...budgets } }));
  const saveNotificationPrefs = notificationPrefs => update(d => ({ ...d, notificationPrefs: { ...d.notificationPrefs, ...notificationPrefs } }));
  const withAudit = record => ({
    ...record,
    createdBy: record.createdBy || user?.id || "",
    createdByName: record.createdByName || user?.name || user?.email || "Unknown",
    createdAt: record.createdAt || new Date().toISOString(),
    updatedBy: user?.id || "",
    updatedByName: user?.name || user?.email || "Unknown",
    updatedAt: new Date().toISOString()
  });
  const showProtectedRecordNotice = () => {
    showGlobalToast({
      tone: "warning",
      title: "Record protected",
      message: "Admins can edit or delete only records they created. Owner and other admin records are locked."
    });
  };
  const canManageRecord = record => {
    if (!activeSharedOrgRef.current) return true;
    if (activeSharedOrgRef.current.isViewer) return false;
    if (!record?.id) return true;
    return String(record?.createdBy || "").trim() === String(user?.id || "").trim();
  };
  const preserveAuditForUpdate = (record, existing) => withAudit({
    ...record,
    createdBy: existing?.createdBy || record.createdBy || user?.id || "",
    createdByName: existing?.createdByName || record.createdByName || user?.name || user?.email || "Unknown",
    createdAt: existing?.createdAt || record.createdAt || new Date().toISOString()
  });
  const addCustomer = c => update(d => ({ ...d, customers: [...d.customers, withId(withAudit(c))] }));
  const updateCustomer = c => update(d => ({
    ...d,
    customers: d.customers.map(existing => {
      if (existing.id !== c.id) return existing;
      if (!canManageRecord(existing)) {
        showProtectedRecordNotice();
        return existing;
      }
      return withAudit({ ...c, createdBy: existing.createdBy, createdByName: existing.createdByName, createdAt: existing.createdAt });
    })
  }));
  const removeCustomer = id => update(d => {
    const existing = d.customers.find(customer => customer?.id === id);
    if (existing && !canManageRecord(existing)) {
      showProtectedRecordNotice();
      return d;
    }
    return { ...d, customers: d.customers.filter(c => c.id !== id) };
  });
  const saveOrgRecords = (key, items) => update(d => ({ ...d, orgRecords: { ...d.orgRecords, [key]: items } }));
  const addOrgRecord = (key, record) =>
    update(d => ({ ...d, orgRecords: { ...d.orgRecords, [key]: [withId(withAudit(record)), ...(d.orgRecords?.[key] || [])] } }));
  const updateOrgRecord = (key, record) =>
    update(d => ({
      ...d,
      orgRecords: {
        ...d.orgRecords,
        [key]: (d.orgRecords?.[key] || []).map(item => {
          if (item.id !== record.id) return item;
          if (!canManageRecord(item)) {
            showProtectedRecordNotice();
            return item;
          }
          return withAudit({ ...item, ...record, createdBy: item.createdBy, createdByName: item.createdByName, createdAt: item.createdAt });
        })
      }
    }));
  const removeOrgRecord = (key, id) =>
    update(d => {
      const existing = (d.orgRecords?.[key] || []).find(item => item.id === id);
      if (existing && !canManageRecord(existing)) {
        showProtectedRecordNotice();
        return d;
      }
      return {
        ...d,
        orgRecords: {
          ...d.orgRecords,
          [key]: (d.orgRecords?.[key] || []).filter(item => item.id !== id)
        }
      };
    });
  const addIncome = i => update(d => ({ ...d, income: sortOrgCollectionRecords("income", [withId(withAudit(i)), ...d.income]) }));
  const updateIncome = income => update(d => ({ ...d, income: sortOrgCollectionRecords("income", d.income.map(i => {
    if (i.id !== income.id) return i;
    if (!canManageRecord(i)) {
      showProtectedRecordNotice();
      return i;
    }
    return preserveAuditForUpdate(income, i);
  })) }));
  const removeIncome = id => update(d => {
    const existing = d.income.find(i => i.id === id);
    if (existing && !canManageRecord(existing)) {
      showProtectedRecordNotice();
      return d;
    }
    return { ...d, income: d.income.filter(i => i.id !== id) };
  });
  const addExpense = e => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", [withId(withAudit(e)), ...d.expenses]) }));
  const updateExpense = expense => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", d.expenses.map(e => {
    if (e.id !== expense.id) return e;
    if (!canManageRecord(e)) {
      showProtectedRecordNotice();
      return e;
    }
    return preserveAuditForUpdate(expense, e);
  })) }));
  const removeExpense = id => update(d => {
    const existing = d.expenses.find(e => e.id === id);
    if (existing && !canManageRecord(existing)) {
      showProtectedRecordNotice();
      return d;
    }
    return { ...d, expenses: d.expenses.filter(e => e.id !== id) };
  });
  const addInvoice = inv => update(d => ({ ...d, invoices: sortOrgCollectionRecords("invoices", [withId(withAudit(inv)), ...d.invoices]) }));
  const updateInvoice = inv => update(d => ({ ...d, invoices: sortOrgCollectionRecords("invoices", d.invoices.map(i => {
    if (i.id !== inv.id) return i;
    if (!canManageRecord(i)) {
      showProtectedRecordNotice();
      return i;
    }
    return preserveAuditForUpdate(inv, i);
  })) }));
  const removeInvoice = id => update(d => {
    const existing = d.invoices.find(i => i.id === id);
    if (existing && !canManageRecord(existing)) {
      showProtectedRecordNotice();
      return d;
    }
    return { ...d, invoices: d.invoices.filter(i => i.id !== id) };
  });

  async function switchOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (!data.orgs?.[orgId]) return { error: "That organization was not found." };
    setLoaded(false);
    const freshFetched = { income: false, expenses: false, invoices: false, customers: false };
    collectionFetchedRef.current = freshFetched;
    setCollectionFetched(freshFetched);

    try {
      const localData = getUserData(user.id, "appData") || EMPTY_DATA;
      const localOrg = localData.orgs?.[orgId] || data.orgs?.[orgId] || {};
      const [activeOrgFull, summary] = await Promise.all([
        orgsApi.getFull(user.id, orgId).catch(() => null),
        orgsApi.getSummary(user.id, orgId).catch(() => EMPTY_SUMMARY)
      ]);

      const pickCollection = (serverRecords, localRecords = []) => {
        if (Array.isArray(serverRecords) && (serverRecords.length > 0 || !Array.isArray(localRecords) || localRecords.length === 0)) {
          return serverRecords;
        }
        return Array.isArray(localRecords) ? localRecords : [];
      };

      const income = pickCollection(activeOrgFull?.income, localOrg.income);
      const expenses = pickCollection(activeOrgFull?.expenses, localOrg.expenses);
      const invoices = pickCollection(activeOrgFull?.invoices, localOrg.invoices);
      const customers = pickCollection(activeOrgFull?.customers, localOrg.customers);
      const orgRecords = mergeOrgRecordsForLoad(
        activeOrgFull?.orgRecords && typeof activeOrgFull.orgRecords === "object" ? activeOrgFull.orgRecords : {},
        localOrg.orgRecords || {}
      );

      const nextOrgs = { ...data.orgs };
      nextOrgs[orgId] = normalizeOrgData(fromApiOrg(activeOrgFull || localOrg, {
        income,
        expenses,
        invoices,
        customers,
        orgRecords
      }));

        const nextState = buildStateFromOrganizations({
          orgs: nextOrgs,
          activeOrgId: orgId,
          sharedLedger: null
        });

        dataRef.current = nextState;
        setData(nextState);
      setOrgSummary(summary || EMPTY_SUMMARY);
      setUserData(user.id, "appData", nextState);
      setUser(prev =>
        prev
          ? {
              ...prev,
              activeOrgId: orgId,
              organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
            }
          : prev
      );

      if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
      lastSyncedRef.current[orgId].customers = buildBaseline(customers);
      collectionFetchedRef.current = { ...collectionFetchedRef.current, customers: true };
      setCollectionFetched(prev => ({ ...prev, customers: true }));

      return { success: true };
    } catch (err) {
      logError("switchOrganization failed, falling back to cached state", err);
      const nextState = buildStateFromOrganizations({
        orgs: data.orgs,
        activeOrgId: orgId,
        sharedLedger: null
      });
      dataRef.current = nextState;
      setData(nextState);
      persistState(nextState);
      setOwnDataReloadKey(k => k + 1);
      return { success: true };
    } finally {
      setLoaded(true);
    }
  }

  async function createOrganization(accountInput = {}) {
    if (!user?.id) return { error: "No active user found." };
    const { planOverride, ...cleanAccountInput } = accountInput || {};
    const requestedType = getOrgType(cleanAccountInput.organizationType || user?.organizationType);
    if (![ORG_TYPES.FREELANCER, ORG_TYPES.APARTMENT].includes(requestedType)) {
      return { error: "Khata type must be Small Business or Apartment." };
    }
    if (!canCreatePaidOrg(user, currentOwnedOrganizations, planOverride || null, requestedType)) {
      return { error: "UPGRADE_REQUIRED" };
    }

    const nextOrgId = cleanAccountInput.orgId || `org_${uid()}${uid()}`;
    const nextOrg = normalizeOrgData(
        {
          account: {
            ...createEmptyAccount({
              email: cleanAccountInput.email || user.email || "",
              phone: cleanAccountInput.phone || user.phone || "",
              organizationType: cleanAccountInput.organizationType || user.organizationType
            }),
            ...cleanAccountInput,
            organizationType: getOrgType(cleanAccountInput.organizationType || user.organizationType)
          }
        },
      {
        account: {
          email: user.email || "",
          phone: user.phone || "",
          organizationType: cleanAccountInput.organizationType || user.organizationType
        }
      }
    );

    try {
      await orgsApi.create(user.id, nextOrgId, {
        organizationType: getOrgType(cleanAccountInput.organizationType || user.organizationType),
        name: cleanAccountInput.name || "",
        email: cleanAccountInput.email || user.email || "",
        phone: cleanAccountInput.phone || user.phone || "",
        addressLine: cleanAccountInput.addressLine || "",
        city: cleanAccountInput.city || "",
        state: cleanAccountInput.state || "",
        district: cleanAccountInput.district || "",
        pincode: cleanAccountInput.pincode || "",
        country: cleanAccountInput.country || "India",
        location: cleanAccountInput.location || "",
        address: cleanAccountInput.address || ""
      });
    } catch (err) {
      return { error: err.message || "Could not create organization." };
    }

    const nextState = buildStateFromOrganizations({
      orgs: { ...data.orgs, [nextOrgId]: nextOrg },
      activeOrgId: nextOrgId,
      sharedLedger: null
    });

    setOwnedOrganizations(mapOwnedOrganizations(nextState.orgs));
    setData(nextState);
    persistState(nextState);
    return { success: true, orgId: nextOrgId };
  }

  async function deleteOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (!data.orgs?.[orgId]) return { error: "That organization was not found." };

    const orgIds = Object.keys(data.orgs || {});
    if (orgIds.length <= 1) {
      return { error: "At least one organization workspace must remain." };
    }

    try {
      const result = await orgsApi.delete(user.id, orgId);
      const nextActiveOrgId = result.newActiveOrgId || (orgIds.find(id => id !== orgId)) || DEFAULT_ORG_ID;

      // Reset collection flags so sections re-fetch fresh data for the fallback org
      const freshFetched = { income: false, expenses: false, invoices: false, customers: false };
      collectionFetchedRef.current = freshFetched;
      collectionFetchingRef.current = {};
      setCollectionFetched(freshFetched);

      const nextOrgs = { ...data.orgs };
      delete nextOrgs[orgId];

      // The fallback org's collections (income/expenses/invoices) were never lazy-loaded
      // this session (user was on the deleted org). Rescue them from the existing local
      // cache so we don't overwrite good cached data with empty arrays.
      const existingCache = getUserData(user.id, "appData") || EMPTY_DATA;
      const cachedFallbackOrg = existingCache.orgs?.[nextActiveOrgId] || {};
      if (nextOrgs[nextActiveOrgId]) {
        const live = nextOrgs[nextActiveOrgId];
        nextOrgs[nextActiveOrgId] = normalizeOrgData({
          ...live,
          income:   live.income?.length   ? live.income   : (cachedFallbackOrg.income   || []),
          expenses: live.expenses?.length ? live.expenses : (cachedFallbackOrg.expenses || []),
          invoices: live.invoices?.length ? live.invoices : (cachedFallbackOrg.invoices || []),
        });
      }

      const nextState = buildStateFromOrganizations({
        orgs: nextOrgs,
        activeOrgId: nextActiveOrgId,
        sharedLedger: null
      });

      setOwnedOrganizations(mapOwnedOrganizations(nextState.orgs));
      dataRef.current = nextState;
      setData(nextState);
      setUserData(user.id, "appData", nextState);
      return { success: true, activeOrgId: nextActiveOrgId };
    } catch (err) {
      return { error: err.message || "We couldn't finish deleting that organization right now." };
    }
  }

  const currentOwnedOrganizations = activeSharedOrgKey && ownedOrganizations.length
    ? ownedOrganizations
    : mapOwnedOrganizations(data.orgs || {});
  const sharedOrganizationOptions = sharedOrgs.map(info => ({
    id: info.orgId,
    key: info.key,
    switchKey: info.key,
    name: info.orgName || "Shared Khata",
    organizationType: getOrgType(info.organizationType),
    ownerId: info.ownerId || "",
    ownerName: info.ownerName || "",
    role: info.role || "viewer",
    isOwned: false,
    isShared: true,
    plan: "",
    subscriptionStatus: "",
    subscriptionEndsAt: "",
    billingCycle: "",
    hasData: false
  }));
  const organizations = [...currentOwnedOrganizations, ...sharedOrganizationOptions];
  const maxOrganizations = getMaxOrganizations(user);

  async function switchToSharedOrg(key) {
    const sharedInfo = sharedOrgsByKey?.[key];
    if (!sharedInfo) return;

    const { ownerId, orgId } = sharedInfo;
    setLoaded(false);
    setActiveSharedOrgRole(null);
    activeSharedOrgRef.current = { ...sharedInfo, isViewer: sharedInfo.role === "viewer" };
    setActiveSharedOrgKey(key);

    try {
      // Verify membership and load the shared org with its visible records.
      const [memberships, orgMeta, customersResult] = await Promise.all([
        orgsApi.getMemberships(user.id),
        orgsApi.getFull(ownerId, orgId),
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
        setSharedOrgsByKey(prev => {
          const next = { ...(prev || {}) };
          delete next[`${ownerId}_${orgId}`];
          return next;
        });
        return;
      }

      const effectiveRole = membership.role || sharedInfo.role || "viewer";
      activeSharedOrgRef.current = { ...activeSharedOrgRef.current, role: effectiveRole, isViewer: effectiveRole === "viewer" };
      setActiveSharedOrgRole(effectiveRole);

      const customers = unwrapRecords(customersResult, "customers");

      const nextState = buildStateFromOrganizations({
        orgs: { [orgId]: normalizeOrgData(fromApiOrg(orgMeta, {
          income: pickApiRecords(orgMeta?.income ?? orgMeta?.collections?.income ?? orgMeta, [], "income"),
          expenses: pickApiRecords(orgMeta?.expenses ?? orgMeta?.collections?.expenses ?? orgMeta, [], "expenses"),
          invoices: pickApiRecords(orgMeta?.invoices ?? orgMeta?.collections?.invoices ?? orgMeta, [], "invoices"),
          customers
        })) },
        activeOrgId: orgId
      });

      dataRef.current = nextState;
      setData(nextState);

      const freshFetched = { income: true, expenses: true, invoices: true, customers: true };
      collectionFetchedRef.current = freshFetched;
      setCollectionFetched(freshFetched);

      if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
      lastSyncedRef.current[orgId].customers = buildBaseline(customers);
      lastSyncedRef.current[orgId].income = buildBaseline(pickApiRecords(orgMeta?.income ?? orgMeta?.collections?.income ?? orgMeta, [], "income"));
      lastSyncedRef.current[orgId].expenses = buildBaseline(pickApiRecords(orgMeta?.expenses ?? orgMeta?.collections?.expenses ?? orgMeta, [], "expenses"));
      lastSyncedRef.current[orgId].invoices = buildBaseline(pickApiRecords(orgMeta?.invoices ?? orgMeta?.collections?.invoices ?? orgMeta, [], "invoices"));
    } catch (err) {
      logError("switchToSharedOrg failed", err);
      activeSharedOrgRef.current = null;
      setActiveSharedOrgKey(null);
      setActiveSharedOrgRole(null);
    } finally {
      setLoaded(true);
    }
  }

  function switchToOwnOrg(orgId = "") {
    requestedOwnOrgIdRef.current = orgId || "";
    activeSharedOrgRef.current = null;
    // Mark as loading immediately so components don't render with stale shared-org data
    setLoaded(false);
    dataRef.current = EMPTY_DATA;
    setData(EMPTY_DATA);
    setActiveSharedOrgKey(null);
    setActiveSharedOrgRole(null);
    // Increment reload key to force the own-data useEffect to re-run
    setOwnDataReloadKey(k => k + 1);
  }

  // Member leaves a shared khata they were invited to. Server-side this calls
  // POST /users/:ownerId/orgs/:orgId/members/leave which removes the OrgMember
  // row and cleans up the matching Invitation. Locally we mirror the same
  // cleanup the polling path does when access is revoked from the other side:
  // drop the shared-org entry, clear the active key, and fall back to the
  // user's own org.
  const leaveSharedOrg = useCallback(async (ownerId, orgId) => {
    if (!user?.id) return { error: "Not signed in." };
    if (!ownerId || !orgId) return { error: "Missing organization details." };
    if (ownerId === user.id) {
      return { error: "You own this khata. Transfer ownership or delete the khata instead." };
    }
    try {
      await membersApi.leave(ownerId, orgId);
    } catch (err) {
      logError("leaveSharedOrg failed", err, { ownerId, orgId });
      return { error: err?.message || "Could not leave the khata. Please try again." };
    }

    const key = `${ownerId}_${orgId}`;
    activeSharedOrgRef.current = null;
    setActiveSharedOrgKey(null);
    setActiveSharedOrgRole(null);
    setSharedOrgsByKey(prev => {
      const next = { ...(prev || {}) };
      delete next[key];
      return next;
    });
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...(prev.sharedOrgs || {}) };
      delete next[key];
      return { ...prev, sharedOrgs: next };
    });
    // Force the own-data load so the dashboard reflects the user's own org.
    switchToOwnOrg();
    return { success: true };
  }, [setUser, user?.id]);

  const refreshActiveOrgData = useCallback(async ({ collections = [], includeOrgRecords = true } = {}) => {
    if (!user?.id) return { error: "No active user found." };
    const current = dataRef.current || data || EMPTY_DATA;
    const orgId = current.activeOrgId;
    if (!orgId) return { error: "No active organization found." };

    const sharedInfo = activeSharedOrgRef.current;
    const apiUserId = sharedInfo?.ownerId || user.id;
    const uniqueCollections = [...new Set((collections || []).filter(key => ORG_COLLECTION_KEYS.includes(key)))];

    try {
      const [orgMeta, summary, ...collectionResults] = await Promise.all([
        includeOrgRecords
          ? orgsApi.getFull(apiUserId, orgId, null, { metaOnly: true }).catch(() => null)
          : Promise.resolve(null),
        orgsApi.getSummary(apiUserId, orgId).catch(() => EMPTY_SUMMARY),
        ...uniqueCollections.map(async key => {
          const records = [];
          let cursor;
          do {
            const page = await orgsApi.getCollection(apiUserId, orgId, key, cursor);
            const batch = unwrapRecords(page, key);
            records.push(...batch);
            cursor = page?.nextCursor ?? null;
          } while (cursor);
          return [key, records];
        })
      ]);

      const base = dataRef.current || current;
      const prevOrg = base.orgs?.[orgId] || {};
      const collectionUpdates = Object.fromEntries(collectionResults);
      const refreshedOrg = normalizeOrgData(fromApiOrg(orgMeta || prevOrg, {
        income: collectionUpdates.income ?? prevOrg.income ?? [],
        expenses: collectionUpdates.expenses ?? prevOrg.expenses ?? [],
        invoices: collectionUpdates.invoices ?? prevOrg.invoices ?? [],
        customers: collectionUpdates.customers ?? prevOrg.customers ?? [],
        orgRecords: includeOrgRecords
          ? (orgMeta?.orgRecords || prevOrg.orgRecords || {})
          : (prevOrg.orgRecords || {})
      }));
      const nextState = buildStateFromOrganizations({
        orgs: { ...base.orgs, [orgId]: refreshedOrg },
        activeOrgId: orgId,
        sharedLedger: null
      });

      dataRef.current = nextState;
      setData(nextState);
      setOrgSummary(summary || EMPTY_SUMMARY);
      if (!sharedInfo) {
        setUserData(user.id, "appData", nextState);
      }
      uniqueCollections.forEach(key => {
        if (!lastSyncedRef.current[orgId]) lastSyncedRef.current[orgId] = {};
        lastSyncedRef.current[orgId][key] = buildBaseline(collectionUpdates[key] || []);
        collectionFetchedRef.current = { ...collectionFetchedRef.current, [key]: true };
      });
      if (uniqueCollections.length) {
        setCollectionFetched(prev => uniqueCollections.reduce((acc, key) => ({ ...acc, [key]: true }), prev));
      }
      return { success: true };
    } catch (err) {
      logError("refreshActiveOrgData failed", err);
      showGlobalToast({ tone: "danger", title: "Sync error", message: "Saved, but the latest data could not be reloaded. Please try again." });
      return { error: err.message || "Refresh failed." };
    }
  }, [data, user?.id]);

  // Fetch a collection from the server if it hasn't been loaded this session yet.
  // Safe to call multiple times — subsequent calls are no-ops once the collection is fetched.
  const ensureCollectionLoaded = useCallback(async (key) => {
    if (!user?.id) return;

    const current = dataRef.current || data || EMPTY_DATA;
    const orgId = current.activeOrgId;
    if (!orgId) return;
    const fetchKey = `${orgId}:${key}`;
    if (collectionFetchedRef.current[key]) return;
    if (collectionFetchingRef.current[fetchKey]) return; // already in-flight for this org

    collectionFetchingRef.current[fetchKey] = true;
    // For shared orgs the API path uses the org owner's ID, not the current user's ID
    const apiUserId = activeSharedOrgRef.current?.ownerId || user.id;

    try {
      // Page 1 — render the UI as soon as the first page arrives
      const page1 = await orgsApi.getCollection(apiUserId, orgId, key);
      let firstBatch = unwrapRecords(page1, key);
      if (firstBatch.length === 0) {
        const fullOrg = await orgsApi.getFull(apiUserId, orgId).catch(() => null);
        firstBatch = pickApiRecords(fullOrg?.[key] ?? fullOrg?.collections?.[key] ?? fullOrg, [], key);
      }

      const mergeIntoState = (incoming, replace = false) => {
        setData(prev => {
          if (prev.activeOrgId !== orgId) return prev;
          const prevOrg = prev.orgs?.[orgId];
          if (!prevOrg) return prev;
          const base = replace ? incoming : mergeRecords(prevOrg[key] || [], incoming);
          const updatedOrg = normalizeOrgData({ ...prevOrg, [key]: base });
          const nextState = buildStateFromOrganizations({
            orgs: { ...prev.orgs, [orgId]: updatedOrg },
            activeOrgId: orgId,
            sharedLedger: prev.sharedLedger
          });
          dataRef.current = nextState;
          return nextState;
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
        const batch = unwrapRecords(nextPage, key);
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
      // Reset fetched flag so the next mount or org-switch can retry
      collectionFetchedRef.current = { ...collectionFetchedRef.current, [key]: false };
      setCollectionFetched(prev => ({ ...prev, [key]: false }));
      if (isNetworkLikeError(err)) {
        // Network error — server might be cold-starting after a deploy or idle period.
        // Warm up and trigger a full data reload after 10 s instead of asking the user
        // to manually refresh. Silent: no error toast since this resolves on its own.
        warmupBackend().then(() => {
          setTimeout(() => setOwnDataReloadKey(k => k + 1), 10_000);
        });
      } else {
        showGlobalToast({ tone: "danger", title: "Sync error", message: "Some records couldn't be loaded. Please try again." });
      }
    } finally {
      collectionFetchingRef.current[fetchKey] = false;
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
    offlineMode,
    syncStatus,
    orgSummary,
    isReadOnlyFreeMode: readOnlyFreeMode,
    isViewerMode,
    canManageRecord,
    activeSharedOrgRole,
    sharedOrgs,
    activeSharedOrgKey,
    refreshActiveOrgData,
    refreshSharedMemberships,
    switchToSharedOrg,
    switchToOwnOrg,
    leaveSharedOrg,
    organizations,
    ownedOrganizations,
    activeOrgId: data.activeOrgId,
    maxOrganizations,
    canCreateOrganization: canCreatePaidOrg(user, currentOwnedOrganizations, null, dataRef.current?.account?.organizationType),
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
    offlineMode,
    syncStatus,
    maxOrganizations,
    organizations,
    ownedOrganizations,
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
    refreshSharedMemberships,
    refreshActiveOrgData,
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
    canManageRecord,
    ensureCollectionLoaded
  ]); 

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
