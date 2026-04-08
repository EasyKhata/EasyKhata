import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getUserData, setUserData } from "../utils/storage";
import { useAuth } from "./AuthContext";

const DataContext = createContext();

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const EMPTY_DATA = {
  income: [],
  expenses: [],
  invoices: [],
  customers: [],
  account: null,
  currency: { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" }
};

export function DataProvider({ children }) {
  const { user } = useAuth();
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
        const snap = await getDoc(doc(db, "users", user.id));
        if (snap.exists()) {
          const dbData = snap.data();
          setData({
            income: dbData.income || [],
            expenses: dbData.expenses || [],
            invoices: dbData.invoices || [],
            customers: dbData.customers || [],
            currency: dbData.currency || EMPTY_DATA.currency,
            account: dbData.account || {
              name: dbData.name || "",
              email: dbData.email || "",
              phone: dbData.phone || "",
              address: dbData.address || "",
              gstin: dbData.gstin || "",
              showHSN: dbData.showHSN || false
            }
          });
        } else {
          setData(getUserData(user.id, "appData") || EMPTY_DATA);
        }
      } catch (err) {
        console.log("Firebase error, using local:", err);
        setData(getUserData(user.id, "appData") || EMPTY_DATA);
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
        setDoc(doc(db, "users", user.id), next, { merge: true });
        return next;
      });
    },
    [user?.id]
  );

  const setCurrency = cur => update(d => ({ ...d, currency: cur }));
  const saveAccount = acc => update(d => ({ ...d, account: acc }));
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

  return (
    <DataContext.Provider
      value={{
        ...data,
        loaded,
        setCurrency,
        saveAccount,
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
