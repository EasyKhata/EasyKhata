import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getUserData, setUserData } from "../utils/storage";

const DataContext = createContext();

function uid() { return Math.random().toString(36).slice(2, 9); }

const EMPTY_DATA = {
  income: [],
  expenses: [],
  invoices: [],
  customers: [],
  account: null,
  currency: { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
};

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [data, setData] = useState(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  // Load data
  useEffect(() => {
    if (!user) return;

    const stored = getUserData(user.id, "appData");
    setData(stored ? { ...EMPTY_DATA, ...stored } : EMPTY_DATA);
    setLoaded(true);
  }, [user?.id]);

  // Save data
  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === "function"
        ? updater(prev)
        : { ...prev, ...updater };

      setUserData(user.id, "appData", next);
      return next;
    });
  }, [user?.id]);

  // Currency
  const setCurrency = (cur) => update(d => ({ ...d, currency: cur }));

  // Account
  const saveAccount = (acc) => update(d => ({ ...d, account: acc }));

  // Customers
  const addCustomer = (c) => update(d => ({ ...d, customers: [...d.customers, { ...c, id: uid() }] }));
  const updateCustomer = (c) => update(d => ({ ...d, customers: d.customers.map(x => x.id === c.id ? c : x) }));
  const removeCustomer = (id) => update(d => ({ ...d, customers: d.customers.filter(c => c.id !== id) }));

  // Income
  const addIncome = (i) => update(d => ({ ...d, income: [{ ...i, id: uid() }, ...d.income] }));
  const removeIncome = (id) => update(d => ({ ...d, income: d.income.filter(i => i.id !== id) }));

  // Expenses
  const addExpense = (e) => update(d => ({ ...d, expenses: [{ ...e, id: uid() }, ...d.expenses] }));
  const removeExpense = (id) => update(d => ({ ...d, expenses: d.expenses.filter(e => e.id !== id) }));

  // Invoices
  const addInvoice = (inv) => update(d => ({ ...d, invoices: [{ ...inv, id: uid() }, ...d.invoices] }));
  const updateInvoice = (inv) => update(d => ({ ...d, invoices: d.invoices.map(i => i.id === inv.id ? inv : i) }));
  const removeInvoice = (id) => update(d => ({ ...d, invoices: d.invoices.filter(i => i.id !== id) }));

  return (
    <DataContext.Provider value={{
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
      removeIncome,
      expenses: data.expenses,
      addExpense,
      removeExpense,
      invoices: data.invoices,
      addInvoice,
      updateInvoice,
      removeInvoice,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}