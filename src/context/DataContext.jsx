import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { getUserData, setUserData } from "../utils/storage";
import { useAuth } from "./AuthContext";

const DataContext = createContext();

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function inviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const EMPTY_DATA = {
  income: [],
  expenses: [],
  invoices: [],
  customers: [],
  account: null,
  goals: { monthlySavings: 0 },
  budgets: {},
  notificationPrefs: {
    browserEnabled: false,
    invoiceDue: true,
    overdueInvoices: true,
    budgetAlerts: true,
    lowBalance: true,
    spendingSpike: true
  },
  sharedLedger: null,
  currency: { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" }
};

function normalizeAppData(source = {}) {
  return {
    income: source.income || [],
    expenses: source.expenses || [],
    invoices: source.invoices || [],
    customers: source.customers || [],
    goals: source.goals || EMPTY_DATA.goals,
    budgets: source.budgets || EMPTY_DATA.budgets,
    notificationPrefs: { ...EMPTY_DATA.notificationPrefs, ...(source.notificationPrefs || {}) },
    currency: source.currency || EMPTY_DATA.currency,
    account: source.account || {
      name: source.name || "",
      email: source.email || "",
      phone: source.phone || "",
      address: source.address || "",
      gstin: source.gstin || "",
      showHSN: source.showHSN || false
    }
  };
}

export function DataProvider({ children }) {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

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
        const personalData = normalizeAppData(userDoc);

        if (userDoc.sharedLedgerId) {
          const ledgerSnap = await getDoc(doc(db, "shared_ledgers", userDoc.sharedLedgerId));
          if (ledgerSnap.exists()) {
            const ledgerDoc = ledgerSnap.data();
            setData({
              ...normalizeAppData(ledgerDoc),
              sharedLedger: {
                id: ledgerSnap.id,
                name: ledgerDoc.name || "Shared Ledger",
                ownerId: ledgerDoc.ownerId || "",
                inviteCode: ledgerDoc.inviteCode || "",
                members: ledgerDoc.members || [],
                role: userDoc.sharedLedgerRole || "member"
              }
            });
            setLoaded(true);
            return;
          }
        }

        setData({
          ...personalData,
          sharedLedger: null
        });
      } catch (err) {
        console.log("Firebase error, using local:", err);
        const localData = getUserData(user.id, "appData") || EMPTY_DATA;
        setData(localData);
      } finally {
        setLoaded(true);
      }
    }

    loadData();
  }, [user?.id]);

  const update = useCallback(
    updater => {
      if (!user?.id) return;

      setData(prev => {
        const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
        setUserData(user.id, "appData", next);
        const targetCollection = next.sharedLedger?.id ? "shared_ledgers" : "users";
        const targetId = next.sharedLedger?.id || user.id;
        const payload = {
          income: next.income,
          expenses: next.expenses,
          invoices: next.invoices,
          customers: next.customers,
          account: next.account,
          goals: next.goals,
          budgets: next.budgets,
          notificationPrefs: next.notificationPrefs,
          currency: next.currency
        };
        setDoc(doc(db, targetCollection, targetId), payload, { merge: true });
        return next;
      });
    },
    [user?.id]
  );

  const setCurrency = cur => update(d => ({ ...d, currency: cur }));
  const saveAccount = acc => update(d => ({ ...d, account: acc }));
  const saveGoals = goals => update(d => ({ ...d, goals: { ...d.goals, ...goals } }));
  const saveBudgets = budgets => update(d => ({ ...d, budgets: { ...budgets } }));
  const saveNotificationPrefs = notificationPrefs => update(d => ({ ...d, notificationPrefs: { ...d.notificationPrefs, ...notificationPrefs } }));
  const addCustomer = c => update(d => ({ ...d, customers: [...d.customers, { ...c, id: uid() }] }));
  const updateCustomer = c => update(d => ({ ...d, customers: d.customers.map(x => (x.id === c.id ? c : x)) }));
  const removeCustomer = id => update(d => ({ ...d, customers: d.customers.filter(c => c.id !== id) }));
  const addIncome = i => update(d => ({ ...d, income: [{ ...i, id: uid() }, ...d.income] }));
  const updateIncome = income => update(d => ({ ...d, income: d.income.map(i => (i.id === income.id ? income : i)) }));
  const removeIncome = id => update(d => ({ ...d, income: d.income.filter(i => i.id !== id) }));
  const addExpense = e => update(d => ({ ...d, expenses: [{ ...e, id: uid() }, ...d.expenses] }));
  const updateExpense = expense => update(d => ({ ...d, expenses: d.expenses.map(e => (e.id === expense.id ? expense : e)) }));
  const removeExpense = id => update(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) }));
  const addInvoice = inv => update(d => ({ ...d, invoices: [{ ...inv, id: uid() }, ...d.invoices] }));
  const updateInvoice = inv => update(d => ({ ...d, invoices: d.invoices.map(i => (i.id === inv.id ? inv : i)) }));
  const removeInvoice = id => update(d => ({ ...d, invoices: d.invoices.filter(i => i.id !== id) }));

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
        ...normalizeAppData(data)
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
      setData({
        ...normalizeAppData(ledgerDoc),
        sharedLedger: {
          id: ledgerRef.id,
          name: ledgerDoc.name || "Shared Ledger",
          ownerId: ledgerDoc.ownerId || "",
          inviteCode: ledgerDoc.inviteCode || "",
          members: nextMembers,
          role: "member"
        }
      });

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
      setData({
        ...normalizeAppData(userSnap.exists() ? userSnap.data() : {}),
        sharedLedger: null
      });

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
        setCurrency,
        saveAccount,
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
