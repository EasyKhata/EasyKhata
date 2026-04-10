import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, increment, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { getUserData, setUserData } from "../utils/storage";
import { getMaxOrganizations } from "../utils/subscription";
import { getOrgType } from "../utils/orgTypes";
import { buildLocationLabel, normalizeSupportedCountry, parseLocationFields } from "../utils/profile";
import { useAuth } from "./AuthContext";

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

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const EMPTY_ORG_DATA = {
  income: [],
  expenses: [],
  invoices: [],
  customers: [],
  orgRecords: {},
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
  return {
    income: source.income || [],
    expenses: source.expenses || [],
    invoices: source.invoices || [],
    customers: source.customers || [],
    orgRecords: source.orgRecords || {},
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
    account: state.account,
    goals: state.goals,
    budgets: state.budgets,
    notificationPrefs: state.notificationPrefs,
    currency: state.currency
  });
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

export function DataProvider({ children }) {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const sessionRef = useRef(null);
  const flushInFlightRef = useRef(false);

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

      if (nextState.sharedLedger?.id) {
        const payload = {
          income: nextState.income,
          expenses: nextState.expenses,
          invoices: nextState.invoices,
          customers: nextState.customers,
          orgRecords: nextState.orgRecords,
          account: nextState.account,
          goals: nextState.goals,
          budgets: nextState.budgets,
          notificationPrefs: nextState.notificationPrefs,
          currency: nextState.currency
        };
        setDoc(doc(db, "shared_ledgers", nextState.sharedLedger.id), sanitizeForFirestore(payload), { merge: true });
        setDoc(
          doc(db, "users", user.id),
          sanitizeForFirestore({ updatedAt: activityAt, lastActivityAt: activityAt }),
          { merge: true }
        );
        return;
      }

      setDoc(
        doc(db, "users", user.id),
        sanitizeForFirestore({
          updatedAt: activityAt,
          lastActivityAt: activityAt,
          activeOrgId: nextState.activeOrgId,
          organizationType: nextState.account?.organizationType || user?.organizationType || "small_business",
          orgs: {
            ...nextState.orgs,
            [nextState.activeOrgId]: extractActiveOrg(nextState)
          }
        }),
        { merge: true }
      );

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
    [setUser, user?.id, user?.organizationType]
  );

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setData(EMPTY_DATA);
        setLoaded(true);
        return;
      }

      setLoaded(false);

      try {
        const userSnap = await getDoc(doc(db, "users", user.id));
        const userDoc = userSnap.exists() ? userSnap.data() : {};

        if (userDoc.sharedLedgerId) {
          const ledgerSnap = await getDoc(doc(db, "shared_ledgers", userDoc.sharedLedgerId));
          if (ledgerSnap.exists()) {
            const ledgerDoc = ledgerSnap.data();
            setData(
              buildStateFromOrganizations({
                orgs: {
                  [DEFAULT_ORG_ID]: normalizeOrgData(ledgerDoc, {
                    account: {
                      email: userDoc.email || user.email || "",
                      phone: userDoc.phone || user.phone || "",
                      organizationType: ledgerDoc.account?.organizationType || userDoc.organizationType
                    }
                  })
                },
                activeOrgId: DEFAULT_ORG_ID,
                sharedLedger: {
                  id: ledgerSnap.id,
                  name: ledgerDoc.name || "Shared Ledger",
                  ownerId: ledgerDoc.ownerId || "",
                  inviteCode: ledgerDoc.inviteCode || "",
                  members: ledgerDoc.members || [],
                  role: userDoc.sharedLedgerRole || "member"
                }
              })
            );
            setLoaded(true);
            return;
          }
        }

        const fallback = {
          account: {
            email: userDoc.email || user.email || "",
            phone: userDoc.phone || user.phone || "",
            organizationType: userDoc.organizationType || user.organizationType
          }
        };
        const orgs = normalizeOrgCollection(userDoc, fallback);
        const nextState = buildStateFromOrganizations({
          orgs,
          activeOrgId: userDoc.activeOrgId || Object.keys(orgs)[0] || DEFAULT_ORG_ID,
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
              orgs: nextState.orgs
            }),
            { merge: true }
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
          sharedLedger: localData.sharedLedger || null
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

      setData(prev => {
        const proposed = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
        const nextActiveOrgId = proposed.activeOrgId || prev.activeOrgId || DEFAULT_ORG_ID;
        const nextState = buildStateFromOrganizations({
          orgs: {
            ...proposed.orgs,
            [nextActiveOrgId]: extractActiveOrg({ ...proposed, activeOrgId: nextActiveOrgId })
          },
          activeOrgId: nextActiveOrgId,
          sharedLedger: proposed.sharedLedger
        });
        persistState(nextState);
        return nextState;
      });
    },
    [persistState, user?.id]
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
  const addIncome = i => update(d => ({ ...d, income: [withId(i), ...d.income] }));
  const updateIncome = income => update(d => ({ ...d, income: d.income.map(i => (i.id === income.id ? income : i)) }));
  const removeIncome = id => update(d => ({ ...d, income: d.income.filter(i => i.id !== id) }));
  const addExpense = e => update(d => ({ ...d, expenses: [withId(e), ...d.expenses] }));
  const updateExpense = expense => update(d => ({ ...d, expenses: d.expenses.map(e => (e.id === expense.id ? expense : e)) }));
  const removeExpense = id => update(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) }));
  const addInvoice = inv => update(d => ({ ...d, invoices: [withId(inv), ...d.invoices] }));
  const updateInvoice = inv => update(d => ({ ...d, invoices: d.invoices.map(i => (i.id === inv.id ? inv : i)) }));
  const removeInvoice = id => update(d => ({ ...d, invoices: d.invoices.filter(i => i.id !== id) }));

  async function switchOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (data.sharedLedger?.id) return { error: "Org switching is not available inside a shared ledger." };
    if (!data.orgs?.[orgId]) return { error: "That organization was not found." };

    const nextState = buildStateFromOrganizations({
      orgs: data.orgs,
      activeOrgId: orgId,
      sharedLedger: data.sharedLedger
    });

    setData(nextState);
    persistState(nextState);
    return { success: true };
  }

  async function createOrganization(accountInput = {}) {
    if (!user?.id) return { error: "No active user found." };
    if (data.sharedLedger?.id) return { error: "Org creation is not available inside a shared ledger." };

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
      sharedLedger: data.sharedLedger
    });

    setData(nextState);
    persistState(nextState);
    return { success: true, orgId: nextOrgId };
  }

  async function deleteOrganization(orgId) {
    if (!user?.id) return { error: "No active user found." };
    if (data.sharedLedger?.id) return { error: "Org deletion is not available inside a shared ledger." };
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
      sharedLedger: data.sharedLedger
    });

    setData(nextState);
    persistState(nextState);

    try {
      await updateDoc(doc(db, "users", user.id), {
        activeOrgId: nextActiveOrgId,
        organizationType: nextState.account?.organizationType || user?.organizationType || "small_business",
        orgs: sanitizeForFirestore(nextState.orgs)
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
    if (!user?.id) return { error: "No active user found." };
    if (data.sharedLedger?.id) return { error: "You are already inside a shared ledger." };

    try {
      const ledgerId = uid() + uid();
      const nextInviteCode = inviteCode();
      const members = [
        {
          userId: user.id,
          name: user.name || "",
          email: user.email || "",
          role: "owner",
          status: "active",
          joinedAt: new Date().toISOString()
        }
      ];

      await setDoc(doc(db, "shared_ledgers", ledgerId), {
        name: name.trim(),
        ownerId: user.id,
        inviteCode: nextInviteCode,
        members,
        ...extractActiveOrg(data)
      });

      await updateDoc(doc(db, "users", user.id), {
        sharedLedgerId: ledgerId,
        sharedLedgerRole: "owner"
      });

      setUser(prev => (prev ? { ...prev, sharedLedgerId: ledgerId, sharedLedgerRole: "owner" } : prev));
      setData(prev => ({
        ...prev,
        sharedLedger: {
          id: ledgerId,
          name: name.trim(),
          ownerId: user.id,
          inviteCode: nextInviteCode,
          members,
          role: "owner"
        }
      }));

      const snap = await getDoc(doc(db, "shared_ledgers", ledgerId));
      if (snap.exists()) {
        const ledgerDoc = snap.data();
        setData(prev => ({
          ...prev,
          sharedLedger: {
            id: ledgerId,
            name: ledgerDoc.name,
            ownerId: ledgerDoc.ownerId,
            inviteCode: ledgerDoc.inviteCode,
            members: ledgerDoc.members || [],
            role: "owner"
          }
        }));
      }

      return { success: true };
    } catch (err) {
      return { error: err.message || "We couldn't create the shared ledger right now." };
    }
  }

  async function joinSharedLedger(code) {
    if (!user?.id) return { error: "No active user found." };
    if (data.sharedLedger?.id) return { error: "Leave the current shared ledger before joining another one." };

    try {
      const q = query(collection(db, "shared_ledgers"), where("inviteCode", "==", code.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        return { error: "Invite code not found. Please check and try again." };
      }

      const ledgerRef = snap.docs[0].ref;
      const ledgerDoc = snap.docs[0].data();
      const members = ledgerDoc.members || [];
      const exists = members.find(member => member.userId === user.id);
      const nextMembers = exists
        ? members.map(member => (member.userId === user.id ? { ...member, status: "active" } : member))
        : [
            ...members,
            {
              userId: user.id,
              name: user.name || "",
              email: user.email || "",
              role: "member",
              status: "active",
              joinedAt: new Date().toISOString()
            }
          ];

      await updateDoc(ledgerRef, { members: nextMembers });
      await updateDoc(doc(db, "users", user.id), {
        sharedLedgerId: ledgerRef.id,
        sharedLedgerRole: "member"
      });

      setUser(prev => (prev ? { ...prev, sharedLedgerId: ledgerRef.id, sharedLedgerRole: "member" } : prev));
      setData(
        buildStateFromOrganizations({
          orgs: {
            [DEFAULT_ORG_ID]: normalizeOrgData(ledgerDoc)
          },
          activeOrgId: DEFAULT_ORG_ID,
          sharedLedger: {
            id: ledgerRef.id,
            name: ledgerDoc.name || "Shared Ledger",
            ownerId: ledgerDoc.ownerId || "",
            inviteCode: ledgerDoc.inviteCode || "",
            members: nextMembers,
            role: "member"
          }
        })
      );

      return { success: true };
    } catch (err) {
      return { error: err.message || "We couldn't join that shared ledger right now." };
    }
  }

  async function leaveSharedLedger() {
    if (!user?.id || !data.sharedLedger?.id) return { error: "You are not in a shared ledger." };
    if (data.sharedLedger.role === "owner") return { error: "Transfer ownership or remove the ledger before the owner leaves." };

    try {
      const ledgerRef = doc(db, "shared_ledgers", data.sharedLedger.id);
      const snap = await getDoc(ledgerRef);
      if (snap.exists()) {
        const ledgerDoc = snap.data();
        const nextMembers = (ledgerDoc.members || []).filter(member => member.userId !== user.id);
        await updateDoc(ledgerRef, { members: nextMembers });
      }

      await updateDoc(doc(db, "users", user.id), {
        sharedLedgerId: "",
        sharedLedgerRole: ""
      });

      setUser(prev => (prev ? { ...prev, sharedLedgerId: "", sharedLedgerRole: "" } : prev));

      const userSnap = await getDoc(doc(db, "users", user.id));
      const nextDoc = userSnap.exists() ? userSnap.data() : {};
      setData(
        buildStateFromOrganizations({
          orgs: normalizeOrgCollection(nextDoc, {
            account: {
              email: nextDoc.email || user.email || "",
              phone: nextDoc.phone || user.phone || "",
              organizationType: nextDoc.organizationType || user.organizationType
            }
          }),
          activeOrgId: nextDoc.activeOrgId || DEFAULT_ORG_ID,
          sharedLedger: null
        })
      );

      return { success: true };
    } catch (err) {
      return { error: err.message || "We couldn't leave the shared ledger right now." };
    }
  }

  async function regenerateLedgerInvite() {
    if (!data.sharedLedger?.id || data.sharedLedger.role !== "owner") {
      return { error: "Only the ledger owner can refresh the invite code." };
    }

    try {
      const nextCode = inviteCode();
      await updateDoc(doc(db, "shared_ledgers", data.sharedLedger.id), { inviteCode: nextCode });
      setData(prev => ({
        ...prev,
        sharedLedger: prev.sharedLedger ? { ...prev.sharedLedger, inviteCode: nextCode } : prev.sharedLedger
      }));
      return { success: true, inviteCode: nextCode };
    } catch (err) {
      return { error: err.message || "We couldn't refresh the invite code right now." };
    }
  }

  return (
    <DataContext.Provider
      value={{
        ...data,
        loaded,
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
