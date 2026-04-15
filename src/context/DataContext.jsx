import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, getDoc, getDocs, increment, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { getUserData, setUserData } from "../utils/storage";
import { getMaxOrganizations, isFreeReadOnlyMode } from "../utils/subscription";
import { getOrgType } from "../utils/orgTypes";
import { buildLocationLabel, normalizeSupportedCountry, parseLocationFields } from "../utils/profile";
import { ORG_COLLECTION_KEYS, buildOrgSummary, deleteOrgCollectionDocs, sortOrgCollectionRecords, syncOrgCollection, hydrateUserOrgCollections } from "../utils/firestoreOrgCollections";
import { useAuth } from "./AuthContext";
import { logError } from "../utils/logger";

const DataContext = createContext();
const DEFAULT_ORG_ID = "org_primary";
const SESSION_STORAGE_PREFIX = "ledger-session-analytics:";
const SESSION_FLUSH_INTERVAL_MS = 30000;
const SESSION_MIN_FLUSH_MS = 1000;

function uid() {
  return Math.random().toString(36).slice(2, 9);
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

function sanitizeForFirestore(value) {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, entry]) => {
      const cleaned = sanitizeForFirestore(entry);
      if (cleaned !== undefined) {
        acc[key] = cleaned;
      }
      return acc;
    }, {});
  }

  return value;
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

function getOrgInvoicesCollection(userId, orgId) {
  return collection(db, "users", userId, "orgs", orgId, "invoices");
}

function getOrgInvoiceDoc(userId, orgId, invoiceId) {
  return doc(db, "users", userId, "orgs", orgId, "invoices", invoiceId);
}

function sortInvoices(invoices = []) {
  return [...(invoices || [])].sort((left, right) => {
    const dateCompare = String(right?.date || "").localeCompare(String(left?.date || ""));
    if (dateCompare !== 0) return dateCompare;

    const updatedCompare = String(right?.updatedAt || right?.createdAt || "").localeCompare(String(left?.updatedAt || left?.createdAt || ""));
    if (updatedCompare !== 0) return updatedCompare;

    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function buildInvoiceSyncSignature(invoices = []) {
  return JSON.stringify(sortInvoices(invoices).map(invoice => sanitizeForFirestore(invoice)));
}

export function DataProvider({ children }) {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const readOnlyFreeMode = isFreeReadOnlyMode(user);
  const sessionRef = useRef(null);
  const flushInFlightRef = useRef(false);
  const readOnlyNoticeAtRef = useRef(0);
  const collectionSyncRef = useRef({});
  const invoiceSyncRef = useRef({});

  const syncActiveOrgCollections = useCallback(async (nextState, { force = false } = {}) => {
    if (!user?.id || !nextState?.activeOrgId) return;

    await Promise.allSettled(
      ORG_COLLECTION_KEYS.map(collectionKey =>
        syncOrgCollection({
          db,
          userId: user.id,
          orgId: nextState.activeOrgId,
          collectionKey,
          records: nextState[collectionKey] || [],
          signatureStore: collectionSyncRef.current,
          force
        })
      )
    );
  }, [user?.id]);

  const deleteOrgCollectionsForOrg = useCallback(async (userId, orgId) => {
    if (!userId || !orgId) return;

    await Promise.allSettled(
      ORG_COLLECTION_KEYS.map(collectionKey =>
        deleteOrgCollectionDocs({
          db,
          userId,
          orgId,
          collectionKey,
          signatureStore: collectionSyncRef.current
        })
      )
    );
  }, []);

  const syncOrgInvoices = useCallback(async (userId, orgId, invoices = [], { force = false } = {}) => {
    if (!userId || !orgId) return;

    const syncKey = `${userId}:${orgId}`;
    const normalizedInvoices = sortInvoices((invoices || []).map(invoice => ({ ...invoice, id: invoice.id || uid() })));
    const nextSignature = buildInvoiceSyncSignature(normalizedInvoices);

    if (!force && invoiceSyncRef.current[syncKey] === nextSignature) {
      return;
    }

    try {
      const invoicesCollection = getOrgInvoicesCollection(userId, orgId);
      const snapshot = await getDocs(invoicesCollection);
      const existingDocs = new Map(snapshot.docs.map(item => [item.id, item.data()]));
      const nextIds = new Set();
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      normalizedInvoices.forEach(invoice => {
        const invoiceId = invoice.id || uid();
        const existingInvoice = existingDocs.get(invoiceId) || {};
        nextIds.add(invoiceId);
        batch.set(
          getOrgInvoiceDoc(userId, orgId, invoiceId),
          sanitizeForFirestore({
            ...invoice,
            id: invoiceId,
            orgId,
            createdAt: invoice.createdAt || existingInvoice.createdAt || nowIso,
            updatedAt: nowIso
          })
        );
      });

      snapshot.docs.forEach(item => {
        if (!nextIds.has(item.id)) {
          batch.delete(item.ref);
        }
      });

      await batch.commit();
      invoiceSyncRef.current[syncKey] = nextSignature;
    } catch (err) {
      logError(`Invoice subcollection sync failed for ${orgId}`, err);
    }
  }, []);

  const deleteOrgInvoiceCollection = useCallback(async (userId, orgId) => {
    if (!userId || !orgId) return;

    try {
      const snapshot = await getDocs(getOrgInvoicesCollection(userId, orgId));
      if (snapshot.empty) {
        delete invoiceSyncRef.current[`${userId}:${orgId}`];
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(item => batch.delete(item.ref));
      await batch.commit();
      delete invoiceSyncRef.current[`${userId}:${orgId}`];
    } catch (err) {
      logError(`Invoice subcollection cleanup failed for ${orgId}`, err);
    }
  }, []);

  const hydrateOrgInvoices = useCallback(async (userId, orgs = {}) => {
    const orgEntries = Object.entries(orgs || {});
    if (!userId || !orgEntries.length) {
      return { orgs, orgIdsToBackfill: [] };
    }

    const results = await Promise.all(
      orgEntries.map(async ([orgId, orgValue]) => {
        try {
          const snapshot = await getDocs(getOrgInvoicesCollection(userId, orgId));
          if (snapshot.empty) {
            const embeddedInvoices = sortInvoices(orgValue?.invoices || []);
            invoiceSyncRef.current[`${userId}:${orgId}`] = buildInvoiceSyncSignature(embeddedInvoices);
            return {
              orgId,
              orgValue: { ...orgValue, invoices: embeddedInvoices },
              shouldBackfill: embeddedInvoices.length > 0
            };
          }

          const subcollectionInvoices = sortInvoices(
            snapshot.docs.map(item => ({
              id: item.id,
              ...item.data()
            }))
          );
          invoiceSyncRef.current[`${userId}:${orgId}`] = buildInvoiceSyncSignature(subcollectionInvoices);
          return {
            orgId,
            orgValue: { ...orgValue, invoices: subcollectionInvoices },
            shouldBackfill: false
          };
        } catch (err) {
          logError(`Invoice subcollection load failed for ${orgId}`, err);
          const embeddedInvoices = sortInvoices(orgValue?.invoices || []);
          invoiceSyncRef.current[`${userId}:${orgId}`] = buildInvoiceSyncSignature(embeddedInvoices);
          return {
            orgId,
            orgValue: { ...orgValue, invoices: embeddedInvoices },
            shouldBackfill: false
          };
        }
      })
    );

    const nextOrgs = {};
    const orgIdsToBackfill = [];

    results.forEach(result => {
      nextOrgs[result.orgId] = result.orgValue;
      if (result.shouldBackfill) {
        orgIdsToBackfill.push(result.orgId);
      }
    });

    return { orgs: nextOrgs, orgIdsToBackfill };
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
        updates["analytics.sessionCount"] = increment(1);
        sessionRef.current.sessionRegistered = true;
      }

      if (!sessionRef.current.orgVisits?.[nextOrgId]) {
        updates[`analytics.byOrg.${nextOrgId}.sessionCount`] = increment(1);
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
      await updateDoc(doc(db, "users", user.id), updates);
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
      const updates = {
        updatedAt: nowIso,
        lastActivityAt: nowIso,
        "analytics.totalSessionMs": increment(totalMs),
        "analytics.lastSessionAt": nowIso,
        "analytics.lastSessionDurationMs": totalMs
      };

      Object.entries(byOrg).forEach(([orgId, orgMs]) => {
        const rounded = Math.round(orgMs || 0);
        if (rounded < SESSION_MIN_FLUSH_MS) return;
        const meta = sessionRef.current.orgMeta?.[orgId] || {};
        updates[`analytics.byOrg.${orgId}.totalSessionMs`] = increment(rounded);
        updates[`analytics.byOrg.${orgId}.lastActivityAt`] = nowIso;
        if (meta.name) updates[`analytics.byOrg.${orgId}.name`] = meta.name;
        if (meta.organizationType) updates[`analytics.byOrg.${orgId}.organizationType`] = meta.organizationType;
      });

      flushInFlightRef.current = true;
      try {
        await updateDoc(doc(db, "users", user.id), updates);
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
      const activityAt = new Date().toISOString();

      setUserData(user.id, "appData", nextState);

      setDoc(
        doc(db, "users", user.id),
        sanitizeForFirestore({
          updatedAt: activityAt,
          lastActivityAt: activityAt,
          activeOrgId: nextState.activeOrgId,
          organizationType: nextState.account?.organizationType || user?.organizationType || "small_business",
          // Keep only lightweight org metadata in user root document.
          // High-volume records stay in org subcollections.
          orgs: buildMetadataOrgMap({
            ...nextState.orgs,
            [nextState.activeOrgId]: extractOrgMetadataOnly(nextState)
          })
        }),
        { merge: true }
      );

      syncActiveOrgCollections(nextState);

      setUser(prev =>
        prev
          ? {
              ...prev,
              activeOrgId: nextState.activeOrgId,
              organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
            }
          : prev
      );
    },
    [setUser, syncActiveOrgCollections, user?.id, user?.organizationType]
  );

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        collectionSyncRef.current = {};
        invoiceSyncRef.current = {};
        setData(EMPTY_DATA);
        setLoaded(true);
        return;
      }

      setLoaded(false);

      try {
        const userSnap = await getDoc(doc(db, "users", user.id));
        const userDoc = userSnap.exists() ? userSnap.data() : {};

        const fallback = {
          account: {
            email: userDoc.email || user.email || "",
            phone: userDoc.phone || user.phone || "",
            organizationType: userDoc.organizationType || user.organizationType
          }
        };
        const normalizedOrgs = normalizeOrgCollection(userDoc, fallback);
        const localData = getUserData(user.id, "appData") || EMPTY_DATA;
        const localOrgs = normalizeOrgCollection(localData, fallback);
        const { orgs, backfillTargets } = await hydrateUserOrgCollections({
          db,
          userId: user.id,
          orgs: normalizedOrgs,
          collectionKeys: ORG_COLLECTION_KEYS,
          signatureStore: collectionSyncRef.current
        });
        const mergedFromLocal = mergeOrgCollectionsFromLocal(orgs, localOrgs, ORG_COLLECTION_KEYS);
        const mergedOrgs = mergedFromLocal.orgs;
        const mergedBackfillTargets = [...backfillTargets, ...mergedFromLocal.backfillTargets];
        const nextState = buildStateFromOrganizations({
          orgs: mergedOrgs,
          activeOrgId: userDoc.activeOrgId || Object.keys(mergedOrgs)[0] || DEFAULT_ORG_ID,
          sharedLedger: null
        });

        setData(nextState);
        setUser(prev =>
          prev
            ? {
                ...prev,
                activeOrgId: nextState.activeOrgId,
                organizationType: getOrgType(nextState.account?.organizationType || prev.organizationType)
              }
            : prev
        );

        if (!userDoc.orgs || !userDoc.activeOrgId) {
          setDoc(
            doc(db, "users", user.id),
            sanitizeForFirestore({
              activeOrgId: nextState.activeOrgId,
              organizationType: nextState.account?.organizationType || userDoc.organizationType || "small_business",
              orgs: buildMetadataOrgMap(nextState.orgs)
            }),
            { merge: true }
          );
        }

        if (mergedBackfillTargets.length) {
          Promise.allSettled(
            mergedBackfillTargets.map(target =>
              syncOrgCollection({
                db,
                userId: user.id,
                orgId: target.orgId,
                collectionKey: target.collectionKey,
                records: target.records,
                signatureStore: collectionSyncRef.current,
                force: true,
                deleteMissing: false
              })
            )
          );
        }
      } catch (err) {
        console.log("Firebase error, using local:", err);
        const localData = getUserData(user.id, "appData") || EMPTY_DATA;
        const nextState = buildStateFromOrganizations({
          orgs: normalizeOrgCollection(localData, {
            account: {
              email: user?.email || "",
              phone: user?.phone || "",
              organizationType: user?.organizationType
            }
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
  }, [setUser, user?.email, user?.id, user?.organizationType, user?.phone]);

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
  const resetForOrgTypeChange = nextAccount => update(d => buildResetData(d, nextAccount));
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
  const addIncome = i => update(d => ({ ...d, income: sortOrgCollectionRecords("income", [withId(i), ...d.income]) }));
  const updateIncome = income => update(d => ({ ...d, income: sortOrgCollectionRecords("income", d.income.map(i => (i.id === income.id ? income : i))) }));
  const removeIncome = id => update(d => ({ ...d, income: d.income.filter(i => i.id !== id) }));
  const addExpense = e => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", [withId(e), ...d.expenses]) }));
  const updateExpense = expense => update(d => ({ ...d, expenses: sortOrgCollectionRecords("expenses", d.expenses.map(e => (e.id === expense.id ? expense : e))) }));
  const removeExpense = id => update(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) }));
  const addInvoice = inv => update(d => ({ ...d, invoices: sortOrgCollectionRecords("invoices", [withId(inv), ...d.invoices]) }));
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
    return { success: true };
  }

  async function createOrganization(accountInput = {}) {
    if (!user?.id) return { error: "No active user found." };
    if (readOnlyFreeMode) return { error: "Free plan is read-only. Upgrade to edit data." };

    const orgCount = Object.keys(data.orgs || {}).length;
    const maxOrganizations = getMaxOrganizations(user);
    if (orgCount >= maxOrganizations) {
      return { error: `Your account can use up to ${maxOrganizations} organization workspace${maxOrganizations > 1 ? "s" : ""}.` };
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

    const nextState = buildStateFromOrganizations({
      orgs: {
        ...data.orgs,
        [nextOrgId]: nextOrg
      },
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

    const nextOrgs = { ...data.orgs };
    delete nextOrgs[orgId];

    const nextActiveOrgId = data.activeOrgId === orgId ? Object.keys(nextOrgs)[0] : data.activeOrgId;
    const nextState = buildStateFromOrganizations({
      orgs: nextOrgs,
      activeOrgId: nextActiveOrgId,
      sharedLedger: null
    });

    setData(nextState);
    persistState(nextState);
    deleteOrgCollectionsForOrg(user.id, orgId);
    deleteDoc(doc(db, "users", user.id, "orgs", orgId));

    try {
      await updateDoc(doc(db, "users", user.id), {
        activeOrgId: nextActiveOrgId,
        organizationType: nextState.account?.organizationType || user?.organizationType || "small_business",
        orgs: sanitizeForFirestore(buildMetadataOrgMap(nextState.orgs))
      });
    } catch (err) {
      return { error: err.message || "We couldn't finish deleting that organization right now." };
    }

    return { success: true, activeOrgId: nextActiveOrgId };
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
    isReadOnlyFreeMode: readOnlyFreeMode,
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
    removeInvoice
  }), [
    addCustomer,
    addExpense,
    addIncome,
    addInvoice,
    addOrgRecord,
    createOrganization,
    createSharedLedger,
    data,
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
    updateCustomer,
    updateExpense,
    updateIncome,
    updateInvoice,
    updateOrgRecord
  ]);

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
