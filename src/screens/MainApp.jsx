import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, Building2, CreditCard, FileText,
  HeadphonesIcon, LayoutDashboard, LogOut, MessageSquare, Power, Settings,
  TrendingDown, TrendingUp, User, Users
} from "lucide-react";
import { isNative } from "../utils/native";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import useIdleTimeout from "../hooks/useIdleTimeout";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import { BrandMark } from "../components/BrandLogo";
import PendingInviteBanner from "../components/PendingInviteBanner";
import { societyApi } from "../lib/api";
import { APP_NAME, APP_UPGRADE_URL } from "../utils/brand";
import {
  buildReminders,
  filterRemindersByPrefs,
  getDismissedReminderIds,
  getSentBrowserReminderIds,
  saveDismissedReminderIds,
  saveSentBrowserReminderIds
} from "../utils/reminders";
import { formatSubscriptionDate, isReviewAccessEnabled, isTrialActive } from "../utils/subscription";
import { getOrgConfig, getOrgType, ORG_TYPES } from "../utils/orgTypes";

const Dashboard = lazy(() => import("../sections/Dashboard"));
const IncomeSection = lazy(() => import("../sections/IncomeSection"));
const ExpensesSection = lazy(() => import("../sections/ExpensesSection"));
const EmiSection = lazy(() => import("../sections/EmiSection"));
const InvoicesSection = lazy(() => import("../sections/InvoicesSection"));
const KhataSection = lazy(() => import("../sections/KhataSection"));
const SettingsSection = lazy(() => import("../sections/SettingsSection"));
const OrgSection = lazy(() => import("../sections/SettingsSection"));
const AdminPanel = lazy(() => import("../sections/AdminPanel"));
const AdminUsersSection = lazy(() => import("../sections/AdminUsersSection"));
const AdminSupportSection = lazy(() => import("../sections/AdminSupportSection"));
const DiscussionsSection = lazy(() => import("../sections/DiscussionsSection"));

const now = new Date();
const TAB_COLOR = {
  dashboard: "var(--accent)",
  users: "var(--blue)",
  org: "var(--blue)",
  income: "var(--accent)",
  expenses: "var(--danger)",
  emi: "var(--gold)",
  khata: "var(--gold)",
  invoices: "var(--blue)",
  discussions: "var(--blue)",
  settings: "var(--purple)",
  adminDashboard: "var(--gold)",
  adminSupport: "var(--blue)"
};
const TAB_ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  income: TrendingUp,
  expenses: TrendingDown,
  emi: CreditCard,
  khata: BookOpen,
  invoices: FileText,
  discussions: MessageSquare,
  org: Building2,
  settings: Settings,
  adminSupport: HeadphonesIcon,
  adminDashboard: LayoutDashboard
};

function QuickAddSheet({ onClose, isPersonalOrg, isApartmentOrg, isFreelancerOrg, isReadOnlyFreeMode, isViewerMode, addIncome, addExpense, currentMonth, currentYear }) {
  const [entryType, setEntryType] = React.useState("expense");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const amountRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const expenseCategories = isPersonalOrg
    ? ["Food", "Transport", "Bills", "Health", "Shopping", "Other"]
    : isApartmentOrg
      ? ["Maintenance", "Repair", "Utilities", "Salary", "Admin", "Other"]
      : isFreelancerOrg
        ? ["Tools", "Travel", "Marketing", "Office", "Other"]
        : ["Rent", "Salaries", "Supplies", "Marketing", "Ops", "Other"];

  const incomeCategories = isPersonalOrg
    ? ["Salary", "Freelance", "Gift", "Investment", "Other"]
    : isApartmentOrg
      ? ["Maint. Fee", "Penalty", "Event", "Other"]
      : isFreelancerOrg
        ? ["Project", "Consulting", "Retainer", "Other"]
        : ["Sales", "Service", "Consulting", "Other"];

  const categories = entryType === "expense" ? expenseCategories : incomeCategories;
  const accentColor = entryType === "income" ? "var(--jade)" : "var(--ember)";

  function handleSave() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (isViewerMode || isReadOnlyFreeMode) {
      setError("Your plan doesn't allow adding entries");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (entryType === "income") {
        addIncome({
          description: description || "Income",
          source: description || "Income",
          amount: Number(amount),
          category: category || "Other",
          date: today,
          month: monthStr,
        });
      } else {
        addExpense({
          label: description || "Expense",
          amount: Number(amount),
          category: category || "Other",
          note: "",
          date: today,
          month: monthStr,
          recurring: false,
          teamMemberName: "",
          partnerName: "",
          startMonth: "",
          endDate: "",
          endMonth: "",
        });
      }
      onClose();
    } catch {
      setError("Failed to save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "var(--card)", borderRadius: "20px 20px 0 0", padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Drag handle */}
      <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border)", margin: "0 auto 4px" }} />

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", fontFamily: "var(--serif)" }}>New Entry</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
      </div>

      {/* Expense / Income toggle */}
      <div style={{ display: "flex", gap: 8, background: "var(--surface-high)", borderRadius: 12, padding: 4 }}>
        {["expense", "income"].map(type => (
          <button
            key={type}
            onClick={() => { setEntryType(type); setCategory(""); setError(null); }}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: entryType === type
                ? (type === "income" ? "color-mix(in srgb, var(--jade) 20%, var(--raised))" : "color-mix(in srgb, var(--ember) 20%, var(--raised))")
                : "transparent",
              color: entryType === type ? (type === "income" ? "var(--jade)" : "var(--ember)") : "var(--text-dim)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {type === "income" ? "Income" : "Expense"}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-high)", borderRadius: 14, padding: "12px 16px", border: `1.5px solid color-mix(in srgb, ${accentColor} 30%, var(--border))` }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: accentColor, lineHeight: 1, flexShrink: 0 }}>₹</span>
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => { setAmount(e.target.value); setError(null); }}
          style={{ flex: 1, border: "none", background: "transparent", color: "var(--text)", fontSize: 28, fontWeight: 800, outline: "none", width: "100%", fontFamily: "var(--font)" }}
        />
      </div>

      {/* Description */}
      <input
        type="text"
        placeholder={entryType === "expense" ? "What did you spend on?" : "What did you earn from?"}
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "var(--font)", width: "100%", boxSizing: "border-box" }}
      />

      {/* Category chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat === category ? "" : cat)}
            style={{
              padding: "6px 13px",
              borderRadius: 20,
              border: `1.5px solid ${cat === category ? accentColor : "var(--border)"}`,
              background: cat === category ? `color-mix(in srgb, ${accentColor} 15%, var(--raised))` : "var(--surface-high)",
              color: cat === category ? accentColor : "var(--text-sec)",
              fontSize: 12,
              fontWeight: cat === category ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600, textAlign: "center" }}>{error}</div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: accentColor, color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "var(--font)" }}
      >
        {saving ? "Saving…" : `Save ${entryType === "income" ? "Income" : "Expense"}`}
      </button>
    </div>
  );
}

function QuickActionSheet({ onClose, actions = [], isReadOnlyFreeMode, isViewerMode }) {
  const blocked = isViewerMode || isReadOnlyFreeMode;

  return (
    <div style={{ background: "var(--card)", borderRadius: "20px 20px 0 0", padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 20px)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ width: 36, height: 4, borderRadius: 4, background: "var(--border)", margin: "0 auto 4px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", fontFamily: "var(--serif)" }}>New Entry</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
        Choose the type below. The full original form opens immediately with all its fields.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(actions.length || 1, 3)}, minmax(0, 1fr))`, gap: 10 }}>
        {actions.map(action => (
          <button
            key={action.key}
            type="button"
            onClick={() => {
              if (blocked) return;
              action.onClick?.();
            }}
            disabled={blocked}
            style={{
              width: "100%",
              textAlign: "center",
              border: `1px solid color-mix(in srgb, ${action.color} 34%, var(--border))`,
              background: `color-mix(in srgb, ${action.color} 10%, var(--surface-high))`,
              color: blocked ? "var(--text-dim)" : "var(--text)",
              borderRadius: 14,
              padding: "14px 12px",
              cursor: blocked ? "not-allowed" : "pointer",
              opacity: blocked ? 0.65 : 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: action.color }}>{action.label}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.35 }}>{action.description}</div>
          </button>
        ))}
      </div>
      {blocked && <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600, textAlign: "center" }}>Your current access does not allow creating new records here.</div>}
    </div>
  );
}

function QuickEntrySheet({
  onClose,
  orgType,
  customers = [],
  currencySymbol = "Rs",
  currentMonth,
  currentYear,
  isReadOnlyFreeMode,
  isViewerMode,
  addIncome,
  addExpense,
  addOrgRecord
}) {
  const resolvedOrgType = getOrgType(orgType);
  const config = getOrgConfig(resolvedOrgType) || getOrgConfig(ORG_TYPES.SMALL_BUSINESS);
  const isPersonalOrg = resolvedOrgType === ORG_TYPES.PERSONAL;
  const isFreelancerOrg = resolvedOrgType === ORG_TYPES.FREELANCER;
  const isApartmentOrg = resolvedOrgType === ORG_TYPES.APARTMENT;
  const tabs = [
    { key: "income", label: isApartmentOrg ? "Collection" : config.incomeEntryLabel, color: "var(--accent)" },
    { key: "expense", label: config.expensesEntryLabel, color: "var(--danger)" },
    ...(isPersonalOrg ? [{ key: "emi", label: "EMI", color: "var(--gold)" }] : [])
  ];
  const [entryType, setEntryType] = useState(tabs[0]?.key || "income");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef(null);
  const isCompactSheet = typeof window !== "undefined" ? window.innerWidth <= 440 : false;
  const twoColLayout = isCompactSheet ? "1fr" : "minmax(0, 1fr) minmax(0, 1fr)";
  const today = new Date().toISOString().split("T")[0];
  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const currentMonthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const sym = currencySymbol === "Rs" ? "₹" : currencySymbol;
  const expenseCategories = config.expenseCategories || ["Other"];
  const householdPeople = useMemo(() => customers.map(item => String(item?.name || item?.ownerName || item?.personName || "").trim()).filter(Boolean), [customers]);
  const freelancerClients = useMemo(() => customers.map(item => String(item?.name || item?.company || item?.clientName || "").trim()).filter(Boolean), [customers]);
  const apartmentFlats = useMemo(() => customers.map(item => ({ flat: String(item?.name || item?.flatNumber || "").trim(), resident: String(item?.ownerName || item?.residentName || "").trim() })).filter(item => item.flat), [customers]);
  const hasHouseholdPeople = householdPeople.length > 0;
  const hasFreelancerClients = freelancerClients.length > 0;
  const hasApartmentFlats = apartmentFlats.length > 0;
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: today,
    category: expenseCategories[0] || "Other",
    personName: "",
    incomeType: "Salary",
    clientName: "",
    billable: "No",
    flatNumber: "",
    residentName: "",
    collectionType: "Monthly Maintenance",
    collectionMonth: monthStr,
    serviceProvider: "",
    billReference: "",
    lender: "",
    dueDay: "1",
    endDate: ""
  });

  useEffect(() => {
    const timer = setTimeout(() => amountRef.current?.focus(), 70);
    return () => clearTimeout(timer);
  }, [entryType]);

  function updateField(key, value) {
    if (isApartmentOrg && key === "flatNumber") {
      const matchedFlat = apartmentFlats.find(item => item.flat === value);
      setForm(current => ({
        ...current,
        [key]: value,
        residentName: matchedFlat?.resident || current.residentName
      }));
      setError("");
      return;
    }
    setForm(current => ({ ...current, [key]: value }));
    setError("");
  }

  function switchType(nextType) {
    setEntryType(nextType);
    setError("");
    setForm(current => ({
      ...current,
      description: "",
      amount: "",
      date: today,
      category: expenseCategories[0] || "Other",
      collectionMonth: monthStr
    }));
  }

  function validate() {
    if (isViewerMode || isReadOnlyFreeMode) return "Your current access does not allow creating new records here.";
    if (!form.amount || Number(form.amount) <= 0) return "Enter a valid amount.";
    if (!String(form.description || "").trim()) return "Enter a description.";
    if (entryType === "income") {
      if (isPersonalOrg && !hasHouseholdPeople) return "Add a household member in Khata first.";
      if (isPersonalOrg && !String(form.personName || "").trim()) return "Select a family member.";
      if (isFreelancerOrg && !hasFreelancerClients) return "Add a client in Khata first.";
      if (isFreelancerOrg && !String(form.clientName || "").trim()) return "Select a client.";
      if (isApartmentOrg && !hasApartmentFlats) return "Add a flat in Khata first.";
      if (isApartmentOrg && !String(form.flatNumber || "").trim()) return "Enter a flat number.";
    }
    if (entryType === "expense") {
      if (!String(form.category || "").trim()) return "Choose a category.";
      if (isPersonalOrg && !hasHouseholdPeople) return "Add a household member in Khata first.";
      if (isPersonalOrg && !String(form.personName || "").trim()) return "Select a family member.";
      if (isFreelancerOrg && !hasFreelancerClients) return "Add a client in Khata first.";
    }
    if (entryType === "emi") {
      if (!hasHouseholdPeople) return "Add a household member in Khata first.";
      if (!String(form.lender || "").trim()) return "Enter the lender name.";
      if (!String(form.endDate || "").trim()) return "Choose an end date.";
    }
    return "";
  }

  function handleSave() {
    const nextError = validate();
    if (nextError) {
      setError(nextError);
      return;
    }
    setSaving(true);
    try {
      if (entryType === "income") {
        const payload = {
          description: String(form.description || "").trim(),
          label: String(form.description || "").trim(),
          source: String(form.description || "").trim(),
          amount: Number(form.amount),
          category: isApartmentOrg ? String(form.collectionType || "Monthly Maintenance").trim() : String(form.incomeType || "Other").trim(),
          date: form.date || today,
          month: monthStr
        };
        if (isPersonalOrg) {
          payload.personName = String(form.personName || "").trim();
          payload.incomeType = String(form.incomeType || "Salary").trim();
        } else if (isFreelancerOrg) {
          payload.clientName = String(form.clientName || "").trim();
        } else if (isApartmentOrg) {
          payload.flatNumber = String(form.flatNumber || "").trim();
          payload.residentName = String(form.residentName || "").trim();
          payload.collectionType = String(form.collectionType || "Monthly Maintenance").trim();
          payload.collectionMonth = form.collectionMonth || monthStr;
        }
        addIncome?.(payload);
      } else if (entryType === "expense") {
        const payload = {
          label: String(form.description || "").trim(),
          amount: Number(form.amount),
          category: String(form.category || expenseCategories[0] || "Other").trim(),
          date: form.date || today,
          month: monthStr,
          note: "",
          recurring: false,
          teamMemberName: "",
          partnerName: "",
          startMonth: "",
          endDate: "",
          endMonth: ""
        };
        if (isPersonalOrg) payload.personName = String(form.personName || "").trim();
        if (isFreelancerOrg) {
          payload.clientName = String(form.clientName || "").trim();
          payload.billable = String(form.billable || "No").trim();
        }
        if (isApartmentOrg) {
          payload.serviceProvider = String(form.serviceProvider || "").trim();
          payload.billReference = String(form.billReference || "").trim();
        }
        addExpense?.(payload);
      } else if (entryType === "emi") {
        addOrgRecord?.("loans", {
          loanName: String(form.description || "").trim(),
          personName: String(form.personName || "").trim(),
          lender: String(form.lender || "").trim(),
          monthlyEmi: String(form.amount || "").trim(),
          dueDay: String(form.dueDay || "1").trim(),
          endDate: String(form.endDate || "").trim(),
          startDate: currentMonthStart
        });
      }
      onClose();
    } catch (saveError) {
      setError(saveError?.message || "Failed to save. Try again.");
      setSaving(false);
    }
  }

  const activeTab = tabs.find(item => item.key === entryType) || tabs[0];
  const accentColor = activeTab?.color || "var(--accent)";
  const showPeopleSetupHint = (entryType === "income" || entryType === "expense" || entryType === "emi") && isPersonalOrg && !hasHouseholdPeople;
  const showClientSetupHint = (entryType === "income" || entryType === "expense") && isFreelancerOrg && !hasFreelancerClients;
  const showFlatSetupHint = entryType === "income" && isApartmentOrg && !hasApartmentFlats;
  const sheetSelectStyle = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "var(--surface-high)",
    color: "var(--text)",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none"
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: "22px 22px 0 0", padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 -12px 36px rgba(0,0,0,0.34)", maxHeight: "min(84dvh, 760px)", overflow: "hidden", overscrollBehavior: "contain" }}>
      <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)", margin: "0 auto 2px" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", fontFamily: "var(--serif)" }}>New Entry</span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "2px 6px" }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`, gap: 8, flexShrink: 0 }}>
        {tabs.map(option => {
          const selected = option.key === entryType;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => switchType(option.key)}
              style={{
                borderRadius: 14,
                border: `1px solid ${selected ? `color-mix(in srgb, ${option.color} 40%, var(--border))` : "var(--border)"}`,
                background: selected ? `color-mix(in srgb, ${option.color} 14%, var(--surface-high))` : "var(--surface-high)",
                color: selected ? option.color : "var(--text-dim)",
                fontSize: 13,
                fontWeight: 800,
                padding: "12px 10px",
                cursor: "pointer"
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 16, border: `1px solid color-mix(in srgb, ${accentColor} 26%, var(--border))`, background: "var(--surface-high)", padding: "12px 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{sym}</span>
        <input ref={amountRef} type="number" inputMode="decimal" value={form.amount} placeholder="0" onChange={event => updateField("amount", event.target.value)} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 30, fontWeight: 800, color: "var(--text)", fontFamily: "var(--serif)" }} />
      </div>
      <div style={{ display: "grid", gap: 12, overflowY: "auto", paddingRight: 2 }}>
        {showPeopleSetupHint && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--accent) 26%, var(--border))", background: "color-mix(in srgb, var(--accent) 10%, var(--surface-high))" }}>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>Add a household member in Khata before creating this entry.</div>
            <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } })); }} className="btn-secondary" style={{ padding: "8px 10px", fontSize: 12, color: "var(--accent)", flexShrink: 0 }}>Open People</button>
          </div>
        )}
        {showClientSetupHint && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--blue) 26%, var(--border))", background: "color-mix(in srgb, var(--blue) 10%, var(--surface-high))" }}>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>Add a client in Khata before recording freelance payments or expenses.</div>
            <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } })); }} className="btn-secondary" style={{ padding: "8px 10px", fontSize: 12, color: "var(--blue)", flexShrink: 0 }}>Open Clients</button>
          </div>
        )}
        {showFlatSetupHint && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid color-mix(in srgb, var(--gold) 26%, var(--border))", background: "color-mix(in srgb, var(--gold) 10%, var(--surface-high))" }}>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>Add a flat in Khata before recording apartment collections.</div>
            <button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } })); }} className="btn-secondary" style={{ padding: "8px 10px", fontSize: 12, color: "var(--gold)", flexShrink: 0 }}>Open Flats</button>
          </div>
        )}
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Description</div>
          <input type="text" value={form.description} placeholder={entryType === "expense" ? "e.g. Grocery run" : entryType === "emi" ? "e.g. Home loan" : isApartmentOrg ? "e.g. Maintenance payment" : "e.g. Salary"} onChange={event => updateField("description", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
        </div>
        {entryType !== "emi" && (
          <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Date</div>
              <input type="date" value={form.date} onChange={event => updateField("date", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>{entryType === "income" && !isApartmentOrg ? "Type" : "Category"}</div>
              {entryType === "income" && !isApartmentOrg ? (
                <select value={form.incomeType} onChange={event => updateField("incomeType", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }}>
                  {(config.incomeFields?.find(field => field.key === "incomeType")?.options || ["Salary", "Other"]).map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <select value={entryType === "income" && isApartmentOrg ? form.collectionType : form.category} onChange={event => updateField(entryType === "income" && isApartmentOrg ? "collectionType" : "category", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }}>
                  {(entryType === "income" && isApartmentOrg ? (config.incomeFields?.find(field => field.key === "collectionType")?.options || ["Monthly Maintenance", "Other"]) : expenseCategories).map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              )}
            </div>
          </div>
        )}
        {entryType === "income" && isPersonalOrg && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Family Member</div>
            <select value={form.personName} onChange={event => updateField("personName", event.target.value)} style={sheetSelectStyle} disabled={!hasHouseholdPeople}>
              <option value="">{hasHouseholdPeople ? "Select family member" : "Add family member first"}</option>
              {householdPeople.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        )}
        {entryType === "income" && isFreelancerOrg && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Client</div>
            <select value={form.clientName} onChange={event => updateField("clientName", event.target.value)} style={sheetSelectStyle} disabled={!hasFreelancerClients}>
              <option value="">{hasFreelancerClients ? "Select client" : "Add client first"}</option>
              {freelancerClients.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        )}
        {entryType === "income" && isApartmentOrg && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Flat Number</div>
                <select value={form.flatNumber} onChange={event => updateField("flatNumber", event.target.value)} style={sheetSelectStyle} disabled={!hasApartmentFlats}>
                  <option value="">{hasApartmentFlats ? "Select flat" : "Add flat first"}</option>
                  {apartmentFlats.map(item => <option key={item.flat} value={item.flat}>{item.flat}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Resident Name</div>
                <input value={form.residentName} onChange={event => updateField("residentName", event.target.value)} placeholder="Resident name" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Collection Month</div>
              <input type="month" value={form.collectionMonth} onChange={event => updateField("collectionMonth", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
            </div>
          </>
        )}
        {entryType === "expense" && isPersonalOrg && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Family Member</div>
            <select value={form.personName} onChange={event => updateField("personName", event.target.value)} style={sheetSelectStyle} disabled={!hasHouseholdPeople}>
              <option value="">{hasHouseholdPeople ? "Select family member" : "Add family member first"}</option>
              {householdPeople.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        )}
        {entryType === "expense" && isFreelancerOrg && (
          <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Client</div>
              <select value={form.clientName} onChange={event => updateField("clientName", event.target.value)} style={sheetSelectStyle} disabled={!hasFreelancerClients}>
                <option value="">{hasFreelancerClients ? "Select client" : "Add client first"}</option>
                {freelancerClients.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Billable</div>
              <select value={form.billable} onChange={event => updateField("billable", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }}><option value="No">No</option><option value="Yes">Yes</option></select>
            </div>
          </div>
        )}
        {entryType === "expense" && isApartmentOrg && (
          <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Service Provider</div>
              <input value={form.serviceProvider} onChange={event => updateField("serviceProvider", event.target.value)} placeholder="Vendor or contractor name" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Bill Reference</div>
              <input value={form.billReference} onChange={event => updateField("billReference", event.target.value)} placeholder="Invoice or receipt number" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
            </div>
          </div>
        )}
        {entryType === "emi" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Lender</div>
                <input value={form.lender} onChange={event => updateField("lender", event.target.value)} placeholder="Bank or person name" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Family Member</div>
                <select value={form.personName} onChange={event => updateField("personName", event.target.value)} style={sheetSelectStyle} disabled={!hasHouseholdPeople}>
                  <option value="">{hasHouseholdPeople ? "Select family member" : "Add family member first"}</option>
                  {householdPeople.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: twoColLayout, gap: 10 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>Due Day</div>
                <select value={form.dueDay} onChange={event => updateField("dueDay", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }}>{Array.from({ length: 31 }, (_, index) => String(index + 1)).map(option => <option key={option} value={option}>{option}</option>)}</select>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.7 }}>End Date</div>
                <input type="date" value={form.endDate} onChange={event => updateField("endDate", event.target.value)} style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", padding: "12px 14px", fontSize: 14, outline: "none" }} />
              </div>
            </div>
          </>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 700, textAlign: "center" }}>{error}</div>}
      <button type="button" onClick={handleSave} disabled={saving} style={{ width: "100%", border: "none", borderRadius: 16, background: accentColor, color: "#fff", fontSize: 16, fontWeight: 800, padding: "16px 18px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: `0 12px 28px color-mix(in srgb, ${accentColor} 28%, transparent)`, flexShrink: 0 }}>
        {saving ? "Saving..." : `Save ${activeTab?.label || "Entry"} →`}
      </button>
    </div>
  );
}

function HeaderDatePicker({ year, month, onChange, viewMode, onViewModeChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const [useNativeMonthPicker, setUseNativeMonthPicker] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isCurrentYear = year === currentYear;
  const yearOptions = Array.from({ length: 8 }, (_, index) => currentYear - (7 - index));
  const compactPicker = typeof window !== "undefined" ? window.innerWidth <= 420 : false;

  useEffect(() => {
    if (!open) return undefined;

    function handleClick(event) {
      if (!event.target.closest(".header-date-picker")) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setUseNativeMonthPicker(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!useNativeMonthPicker) return;
    if (viewMode !== "month") {
      onViewModeChange("month");
    }
    setOpen(false);
  }, [onViewModeChange, useNativeMonthPicker, viewMode]);

  function prev() {
    if (viewMode === "month") {
      let nextMonth = month - 1;
      let nextYear = year;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      }
      onChange(nextYear, nextMonth);
      return;
    }
    onChange(year - 1, month);
  }

  function next() {
    if (viewMode === "month") {
      if (isCurrentMonth) return;
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      onChange(nextYear, nextMonth);
      return;
    }

    if (isCurrentYear) return;
    onChange(year + 1, month);
  }

  const nextDisabled = viewMode === "month" ? isCurrentMonth : isCurrentYear;
  const monthInputValue = `${year}-${String(month + 1).padStart(2, "0")}`;

  return (
    <div className="header-date-picker" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, width: "fit-content", maxWidth: "100%", marginLeft: "auto" }}>
      <button
        onClick={prev}
        style={{
          width: compactPicker ? 30 : 32,
          height: compactPicker ? 30 : 32,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text-sec)",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0
        }}
      >
        {"‹"}
      </button>

      {useNativeMonthPicker ? (
        <div style={{ minWidth: compactPicker ? 102 : 112, maxWidth: compactPicker ? 120 : 128, padding: compactPicker ? "4px 7px" : "5px 8px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", flexShrink: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>
            Month
          </div>
          <input
            type="month"
            value={monthInputValue}
            max={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`}
            onChange={event => {
              const nextValue = String(event.target.value || "");
              if (!nextValue) return;
              const [nextYearRaw, nextMonthRaw] = nextValue.split("-");
              const nextYear = Number(nextYearRaw);
              const nextMonth = Number(nextMonthRaw) - 1;
              if (Number.isNaN(nextYear) || Number.isNaN(nextMonth) || nextMonth < 0 || nextMonth > 11) return;
              onChange(nextYear, nextMonth);
            }}
            style={{ width: "100%", border: "none", background: "transparent", color: "var(--blue)", fontFamily: "var(--serif)", fontSize: compactPicker ? 12 : 13, lineHeight: 1.2, padding: 0 }}
          />
        </div>
      ) : (
        <button
          ref={triggerRef}
          onClick={() => {
            if (triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              setDropdownPos({ top: rect.bottom + 10, right: window.innerWidth - rect.right });
            }
            setOpen(current => !current);
          }}
          style={{
            minWidth: compactPicker ? 86 : 96,
            maxWidth: compactPicker ? 112 : 118,
            padding: compactPicker ? "5px 8px" : "6px 9px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            flexShrink: 1
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.55 }}>
            {viewMode === "month" ? "Month" : "Year"}
          </span>
          <span style={{ fontFamily: "var(--serif)", fontSize: compactPicker ? 12 : 13, color: "var(--blue)", lineHeight: 1.1, marginTop: 1, whiteSpace: "nowrap" }}>
            {viewMode === "month" ? `${MONTHS[month].slice(0, 3)} ${year}` : year}
          </span>
        </button>
      )}

      <button
        onClick={next}
        disabled={nextDisabled}
        style={{
          width: compactPicker ? 30 : 32,
          height: compactPicker ? 30 : 32,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: nextDisabled ? "var(--text-dim)" : "var(--text)",
          fontSize: 16,
          fontWeight: 700,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          opacity: nextDisabled ? 0.5 : 1,
          flexShrink: 0
        }}
      >
        {"›"}
      </button>

      {open && !useNativeMonthPicker && (
        <div
          style={{
            position: "fixed",
            top: dropdownPos.top,
            right: dropdownPos.right,
            width: 280,
            maxWidth: "calc(100vw - 32px)",
            padding: 14,
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.24)",
            zIndex: 120
          }}
        >
          <div style={{ display: "flex", background: "var(--surface-high)", borderRadius: 12, padding: 4, marginBottom: 14 }}>
            <button
              onClick={() => onViewModeChange("month")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: viewMode === "month" ? "var(--surface-pop)" : "transparent",
                color: viewMode === "month" ? "var(--text)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Month
            </button>
            <button
              onClick={() => onViewModeChange("year")}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: viewMode === "year" ? "var(--surface-pop)" : "transparent",
                color: viewMode === "year" ? "var(--text)" : "var(--text-dim)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Year
            </button>
          </div>

          {viewMode === "month" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {MONTHS.map((label, index) => (
                (() => {
                  const monthDisabled = year === currentYear && index > currentMonth;
                  return (
                <button
                  key={label}
                  onClick={() => {
                    if (monthDisabled) return;
                    onChange(year, index);
                    setOpen(false);
                  }}
                  disabled={monthDisabled}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: index === month ? "var(--accent-deep)" : "var(--surface-high)",
                    color: monthDisabled ? "var(--text-dim)" : index === month ? "var(--accent)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: monthDisabled ? "not-allowed" : "pointer",
                    opacity: monthDisabled ? 0.45 : 1
                  }}
                >
                  {label}
                </button>
                  );
                })()
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {yearOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option, month);
                    setOpen(false);
                  }}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: option === year ? "var(--blue-deep)" : "var(--surface-high)",
                    color: option === year ? "var(--blue)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MainApp() {
  const { user, logout } = useAuth();
  const data = useData();
  const {
    account,
    isReadOnlyFreeMode,
    isViewerMode,
    activeSharedOrgRole,
    sharedOrgs,
    activeSharedOrgKey,
    switchToSharedOrg,
    switchToOwnOrg,
    organizations = [],
    switchOrganization,
    activeOrgId,
    addIncome,
    addExpense,
    addOrgRecord,
    customers = [],
    currency
  } = data;
  const ownOrgNameRef = useRef(null);
  if (!activeSharedOrgKey && account?.name) ownOrgNameRef.current = account.name;
  const ownOrgName = ownOrgNameRef.current || account?.name || "My Organization";
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const orgSwitcherRef = useRef(null);
  // Banner visibility state (must be before usage)
  const [showFreeBanner, setShowFreeBanner] = useState(true);
  const [trialBannerVisible, setTrialBannerVisible] = useState(true);
  const [trialBannerOpacity, setTrialBannerOpacity] = useState(1);
  const showTrialBanner = trialBannerVisible;
  const dismissTrialBanner = React.useCallback(() => {
    setTrialBannerOpacity(0);
    setTimeout(() => setTrialBannerVisible(false), 400);
  }, []);
  React.useEffect(() => {
    if (!trialBannerVisible) return;
    const fadeTimer = setTimeout(() => setTrialBannerOpacity(0), 5000);
    const hideTimer = setTimeout(() => setTrialBannerVisible(false), 5400);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [trialBannerVisible]);
  const [tab, setTab] = useState("dashboard");
  const [settingsNavigation, setSettingsNavigation] = useState(null);
  const [showFab, setShowFab] = useState(false);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState("month"); // "month" or "year"
  const [showReminders, setShowReminders] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedReminderIds(user?.id));
  const [readOnlyNotice, setReadOnlyNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [isCompactMobile, setIsCompactMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 420 : false));
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(120);
  const [residentMemberView, setResidentMemberView] = useState(null);
  const idleCountdownRef = useRef(null);
  const historyMountedRef = useRef(false);
  const isPopStateRef = useRef(false);

  const handleIdleWarn = useCallback((remainingSeconds) => {
    setIdleCountdown(remainingSeconds);
    setIdleWarning(true);
  }, []);

  const handleIdleLogout = useCallback(async () => {
    setIdleWarning(false);
    await logout();
  }, [logout]);

  const { resetTimer: resetIdle } = useIdleTimeout({
    idleMinutes: 15,
    warningMinutes: 2,
    onWarn: handleIdleWarn,
    onLogout: handleIdleLogout,
    enabled: Boolean(user)
  });

  // Dismiss idle warning when user acts
  const handleStayLoggedIn = useCallback(() => {
    setIdleWarning(false);
    resetIdle();
  }, [resetIdle]);

  // Countdown tick while warning is visible
  useEffect(() => {
    if (!idleWarning) {
      if (idleCountdownRef.current) clearInterval(idleCountdownRef.current);
      return undefined;
    }
    idleCountdownRef.current = setInterval(() => {
      setIdleCountdown(prev => {
        if (prev <= 1) {
          clearInterval(idleCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(idleCountdownRef.current);
  }, [idleWarning]);

  const handleNavigate = useCallback((target) => {
    const nextTarget = typeof target === "string" ? { tab: target } : target;
    const routedTab = nextTarget?.tab || "dashboard";
    const nextTab = routedTab === "settings" && ["account", "customers", "create-org", "org-records"].includes(nextTarget?.screen)
      ? "org"
      : routedTab;

    setTab(nextTab);

    if (nextTab === "settings" || nextTab === "org") {
      setSettingsNavigation({
        screen: nextTarget?.screen || "main",
        orgSectionKey: nextTarget?.orgSectionKey || "",
        token: Date.now()
      });
      return;
    }

    setSettingsNavigation(null);
  }, []);

  // Handle #upgrade deep link — open the plan-request screen automatically
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#upgrade") {
      window.history.replaceState({}, "", window.location.pathname);
      setTab("org");
      setSettingsNavigation({ screen: "plan-request", token: Date.now() });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tab → browser history so back/forward work
  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    if (!historyMountedRef.current) {
      historyMountedRef.current = true;
      window.history.replaceState({ tab }, "", window.location.pathname);
      return;
    }
    window.history.pushState({ tab }, "", window.location.pathname);
  }, [tab]);

  // Handle browser back/forward button
  useEffect(() => {
    function handlePopState(event) {
      const nextTab = event.state?.tab;
      if (nextTab) {
        isPopStateRef.current = true;
        setTab(nextTab);
        setSettingsNavigation(null);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleAppNavigate = event => {
      if (event?.detail) {
        handleNavigate(event.detail);
      }
    };
    window.addEventListener("ledger:navigate", handleAppNavigate);
    return () => window.removeEventListener("ledger:navigate", handleAppNavigate);
  }, []);

  // Close org switcher dropdown on outside click
  useEffect(() => {
    if (!showOrgSwitcher) return;
    function handleClickOutside(e) {
      if (orgSwitcherRef.current && !orgSwitcherRef.current.contains(e.target)) {
        setShowOrgSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOrgSwitcher]);

  useEffect(() => {
    const handleReadOnlyBlocked = event => {
      const msg = event?.detail?.message || "Your trial has ended. Upgrade to Pro (Rs 69/month) to continue.";
      setReadOnlyNotice({ message: msg, key: Date.now() });
    };
    window.addEventListener("ledger:readonly-blocked", handleReadOnlyBlocked);
    return () => window.removeEventListener("ledger:readonly-blocked", handleReadOnlyBlocked);
  }, []);

  useEffect(() => {
    const handleFirstSuccess = event => {
      const detail = event?.detail || {};
      if (!detail?.title || !detail?.message) return;
      setSuccessNotice({
        title: detail.title,
        message: detail.message,
        actionLabel: detail.actionLabel || "Open",
        target: detail.target || null,
        key: Date.now()
      });
    };

    window.addEventListener("ledger:first-success", handleFirstSuccess);
    return () => window.removeEventListener("ledger:first-success", handleFirstSuccess);
  }, []);

  useEffect(() => {
    const handleSecondSuccess = event => {
      const detail = event?.detail || {};
      if (!detail?.title || !detail?.message) return;
      setSuccessNotice({
        title: detail.title,
        message: detail.message,
        actionLabel: detail.actionLabel || "Open",
        target: detail.target || null,
        key: Date.now()
      });
    };

    window.addEventListener("ledger:second-success", handleSecondSuccess);
    return () => window.removeEventListener("ledger:second-success", handleSecondSuccess);
  }, []);

  useEffect(() => {
    if (!readOnlyNotice) return undefined;
    const timeout = window.setTimeout(() => setReadOnlyNotice(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [readOnlyNotice]);

  // Android hardware back button — go back within app instead of exiting
  useEffect(() => {
    if (!isNative) return undefined;
    let cleanup = () => {};
    import("@capacitor/app").then(({ App: CapApp }) => {
      const listener = CapApp.addListener("backButton", () => {
        if (tab !== "dashboard") {
          setTab("dashboard");
        }
        // If already on dashboard, do nothing (don't exit)
      });
      cleanup = () => listener.then(h => h.remove()).catch(() => {});
    }).catch(() => {});
    return () => cleanup();
  }, [tab]);

  useEffect(() => {
    if (!successNotice) return undefined;
    const timeout = window.setTimeout(() => setSuccessNotice(null), 6200);
    return () => window.clearTimeout(timeout);
  }, [successNotice]);

  useEffect(() => {
    setDismissedIds(getDismissedReminderIds(user?.id));
  }, [user?.id]);

  const hasResidentPortalAccess = Boolean(user?.societyPortalId && user?.societyPortalRole === "member");

  const liveReminders = useMemo(() => {
    if (hasResidentPortalAccess) {
      const flatDue = residentMemberView?.flatDue || null;
      const pendingAmount = Number(flatDue?.pendingAmount || 0);
      if (pendingAmount <= 0) return [];

      const period = String(flatDue?.period || new Date().toISOString().slice(0, 7));
      const [yearPart, monthPart] = period.split("-");
      const monthNumber = Number(monthPart);
      const monthLabel = monthNumber >= 1 && monthNumber <= 12
        ? `${MONTHS[monthNumber - 1]} ${yearPart}`
        : period;

      return [
        {
          id: `resident-due-${residentMemberView?.portal?.id || user?.societyPortalId || "portal"}-${period}`,
          type: "pendingCollections",
          tab: "org",
          tone: "gold",
          title: `Pending due for Flat ${flatDue?.flatNumber || user?.societyFlatNumber || "-"}`,
          message: `${monthLabel} still has ${pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending. Open the resident access section to review your dues.`
        }
      ];
    }

    const currentDate = new Date();
    const reminders = buildReminders(data, currentDate.getFullYear(), currentDate.getMonth());
    return filterRemindersByPrefs(reminders, data.notificationPrefs || {});
  }, [data, hasResidentPortalAccess, residentMemberView, user?.societyFlatNumber, user?.societyPortalId]);

  const inboxReminders = useMemo(
    () => liveReminders.filter(item => !dismissedIds.includes(item.id)),
    [dismissedIds, liveReminders]
  );

  useEffect(() => {
    if (!user?.id || typeof window === "undefined" || !("Notification" in window)) return;
    if (!data.notificationPrefs?.browserEnabled || Notification.permission !== "granted") return;

    const sentIds = getSentBrowserReminderIds(user.id);
    const nextSentIds = [...sentIds];

    liveReminders.forEach(reminder => {
      if (sentIds.includes(reminder.id) || dismissedIds.includes(reminder.id)) return;

      new Notification(reminder.title, {
        body: reminder.message,
        tag: reminder.id
      });
      nextSentIds.push(reminder.id);
    });

    if (nextSentIds.length !== sentIds.length) {
      saveSentBrowserReminderIds(user.id, nextSentIds);
    }
  }, [dismissedIds, liveReminders, data.notificationPrefs?.browserEnabled, user?.id]);

  const isAdmin = user?.role === "admin";
  const reviewAccessEnabled = isReviewAccessEnabled();
  const trialActive = isTrialActive(user);
  const trialEndLabel = formatSubscriptionDate(user?.subscriptionEndsAt);
  const currentOrgType = getOrgType(account?.organizationType || user?.organizationType);
  const orgConfig = getOrgConfig(currentOrgType) || getOrgConfig(ORG_TYPES.SMALL_BUSINESS);
  const isPersonalOrg = currentOrgType === ORG_TYPES.PERSONAL;
  const isFreelancerOrg = currentOrgType === ORG_TYPES.FREELANCER;
  const isSmallBusinessOrg = currentOrgType === ORG_TYPES.SMALL_BUSINESS;
  const isApartmentOrg = currentOrgType === ORG_TYPES.APARTMENT;
  const hideInvoices = !isAdmin && orgConfig.hideInvoices;

  const handleQuickAddAction = useCallback((target) => {
    setShowFab(false);
    handleNavigate({ tab: target.tab });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ledger:open-add", { detail: { section: target.tab, kind: target.kind } }));
    }, 70);
  }, [handleNavigate]);

  const quickAddActions = useMemo(() => {
    if (isAdmin) return [];
    const actions = [
      {
        key: "income",
        label: orgConfig.incomeActionLabel,
        description: `Open the full ${orgConfig.incomeLabel.toLowerCase()} form.`,
        color: "var(--jade)",
        tab: "income",
        kind: "income"
      },
      {
        key: "expense",
        label: orgConfig.expensesActionLabel,
        description: `Open the full ${orgConfig.expensesLabel.toLowerCase()} form.`,
        color: "var(--ember)",
        tab: "expenses",
        kind: "expense"
      }
    ];

    if (isPersonalOrg) {
      actions.push({
        key: "emi",
        label: "Add EMI",
        description: "Open the EMI form with all loan fields.",
        color: "var(--gold)",
        tab: "emi",
        kind: "emi"
      });
    }

    return actions.map(action => ({
      ...action,
      onClick: () => handleQuickAddAction(action)
    }));
  }, [handleQuickAddAction, isAdmin, isPersonalOrg, orgConfig.expensesActionLabel, orgConfig.expensesLabel, orgConfig.incomeActionLabel, orgConfig.incomeLabel]);
  const currentOrgLabel = account?.name?.trim() || "Khata";
  const TABS = useMemo(() => ([
    { id: "dashboard", icon: isAdmin ? "AD" : "DB", label: isAdmin ? "Admin" : "Dashboard" },
    ...(isAdmin ? [{ id: "users", icon: "US", label: "Users" }, { id: "adminSupport", icon: "SP", label: "Support Ops" }] : []),
    ...(user?.role !== "admin" ? [
      { id: "income", icon: "IN", label: orgConfig.incomeLabel },
      { id: "expenses", icon: "EX", label: orgConfig.expensesLabel },
      ...(isPersonalOrg ? [{ id: "emi", icon: "EM", label: "EMIs" }] : [])
    ] : []),
    ...(!isAdmin && !hideInvoices && isSmallBusinessOrg ? [{ id: "khata", icon: "KH", label: "Khata" }] : []),
    ...(!hideInvoices && !activeSharedOrgKey ? [{ id: "invoices", icon: "IV", label: isAdmin ? "Subscriptions" : orgConfig.invoicesLabel }] : []),
    ...(!isAdmin && isApartmentOrg ? [{ id: "discussions", icon: "DS", label: "Chat" }] : []),
    ...(!isAdmin && !activeSharedOrgKey ? [{ id: "org", icon: "OR", label: "Khata" }] : []),
    ...(isAdmin ? [] : [])
  ]), [activeSharedOrgKey, currentOrgLabel, hideInvoices, isAdmin, isApartmentOrg, isPersonalOrg, isSmallBusinessOrg, orgConfig.expensesLabel, orgConfig.incomeLabel, orgConfig.invoicesLabel, user?.role]);

  const activeDashboardColor = isAdmin ? TAB_COLOR.adminDashboard : TAB_COLOR.dashboard;
  const handleDateChange = useCallback((nextYear, nextMonth) => {
    setYear(nextYear);
    setMonth(nextMonth);
  }, []);

  const openUpgradeFlow = useCallback(() => {
    // On Android we cannot use in-app payments (Play Store policy).
    // Send users to the website to upgrade there.
    if (isNative) {
      import("@capacitor/browser").then(({ Browser }) => {
        Browser.open({ url: APP_UPGRADE_URL });
      }).catch(() => {
        window.open(APP_UPGRADE_URL, "_blank");
      });
      return;
    }
    handleNavigate({ tab: "settings", screen: reviewAccessEnabled ? "main" : "plan-request" });
  }, [handleNavigate, reviewAccessEnabled]);
  const datePickerNode = useMemo(() => (
    <HeaderDatePicker
      year={year}
      month={month}
      onChange={handleDateChange}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  ), [handleDateChange, month, viewMode, year]);

  function dismissReminder(id) {
    const nextIds = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(nextIds);
    saveDismissedReminderIds(user?.id, nextIds);
  }

  function clearAllReminders() {
    const nextIds = Array.from(new Set([...dismissedIds, ...liveReminders.map(item => item.id)]));
    setDismissedIds(nextIds);
    saveDismissedReminderIds(user?.id, nextIds);
  }

  function openReminder(reminder) {
    const nextTab = reminder.tab === "invoices" && hideInvoices ? "income" : reminder.tab || "dashboard";
    setTab(nextTab);
    dismissReminder(reminder.id);
    setShowReminders(false);
  }

  useEffect(() => {
    if (hideInvoices && tab === "invoices") {
      setTab("income");
    }
  }, [hideInvoices, tab]);

  // When switching into a shared org, leave owner-only tabs
  useEffect(() => {
    if (activeSharedOrgKey && (tab === "org" || tab === "invoices")) {
      setTab("dashboard");
    }
  }, [activeSharedOrgKey, tab]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsCompactMobile(window.innerWidth <= 420);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!hasResidentPortalAccess) {
      setResidentMemberView(null);
      return undefined;
    }

    let cancelled = false;
    const period = new Date().toISOString().slice(0, 7);

    async function loadResidentMemberView() {
      try {
        const result = await societyApi.getMemberView(period);
        if (!cancelled) {
          setResidentMemberView(result || null);
        }
      } catch {
        if (!cancelled) {
          setResidentMemberView(null);
        }
      }
    }

    loadResidentMemberView();
    return () => {
      cancelled = true;
    };
  }, [hasResidentPortalAccess, user?.societyPortalId, user?.societyFlatNumber]);

  const renderTabContent = useCallback(() => {
    const fallback = tab === "settings" || (isAdmin && tab === "users")
      ? <SectionSkeleton rows={5} showHero={false} />
      : <SectionSkeleton rows={4} />;

    return (
      <Suspense fallback={fallback}>
        {tab === "dashboard" && (isAdmin ? <AdminPanel year={year} month={month} /> : <Dashboard year={year} month={month} viewMode={viewMode} onNav={handleNavigate} headerDatePicker={datePickerNode} />)}
        {tab === "users" && isAdmin && <AdminUsersSection />}
        {tab === "adminSupport" && isAdmin && <AdminSupportSection />}
        {tab === "org" && !isAdmin && <OrgSection navigationTarget={settingsNavigation} sectionMode="org" />}
        {tab === "income" && (
          <IncomeSection
            year={year}
            month={month}
            orgType={currentOrgType}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "expenses" && <ExpensesSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "emi" && isPersonalOrg && <EmiSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "discussions" && isApartmentOrg && <DiscussionsSection />}
        {tab === "khata" && !isAdmin && isSmallBusinessOrg && <KhataSection orgType={currentOrgType} />}
        {tab === "invoices" && !hideInvoices && (
          <InvoicesSection
            year={year}
            month={month}
            orgType={currentOrgType}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "settings" && <SettingsSection navigationTarget={settingsNavigation} />}
      </Suspense>
    );
  }, [currentOrgType, datePickerNode, handleNavigate, hideInvoices, isAdmin, isApartmentOrg, isPersonalOrg, isSmallBusinessOrg, month, settingsNavigation, tab, viewMode, year]);


  const footerTabs = useMemo(() => {
    // No "dashboard" — navigated via header logo. Invoices hidden from apartment nav.
    const baseTabOrder = isAdmin
      ? ["dashboard", "users", "adminSupport"]
      : isViewerMode
        ? isApartmentOrg
          ? ["dashboard", "income", "expenses", "discussions", "org"]
          : isPersonalOrg
            ? ["dashboard", "income", "expenses", "emi", "org"]
            : ["dashboard", "income", "expenses", ...(hideInvoices ? [] : ["invoices"]), "org"]
        : isApartmentOrg
          ? ["income", "expenses", "__fab__", "discussions", "org"]
          : isPersonalOrg
            ? ["income", "expenses", "__fab__", "emi", "org"]
            : ["income", "expenses", "__fab__", "invoices", "org"];
    return baseTabOrder.map(tabId => {
      if (tabId === "__fab__") return { id: "__fab__", label: "", icon: null };
      const found = TABS.find(item => item.id === tabId);
      if (!found) return null;
      const label =
        tabId === "dashboard" ? "Home" :
        tabId === "income" && isApartmentOrg ? "Maint." :
        tabId === "income" && isFreelancerOrg ? "Payments" :
        tabId === "expenses" ? "Spend" :
        tabId === "invoices" && (isFreelancerOrg || isSmallBusinessOrg) ? "Invoices" :
        tabId === "discussions" ? "Chat" :
        tabId === "org" ? "Khata" :
        tabId === "adminSupport" ? "Support" :
        tabId === "users" ? "Users" :
        found.label;
      return { ...found, label };
    }).filter(Boolean);
  }, [TABS, hideInvoices, isAdmin, isApartmentOrg, isFreelancerOrg, isPersonalOrg, isSmallBusinessOrg, isViewerMode]);
  const bottomNoticeBase = "calc(env(safe-area-inset-bottom, 0px) + 92px)";

  return (
    <div className="app-shell" style={{ minHeight: "100vh", position: "relative", display: "flex" }}>

      {/* Fixed banners at the top, above sidebar/content */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, pointerEvents: 'none' }}>
        {isReadOnlyFreeMode && !isAdmin && showFreeBanner && (
          <div style={{
            margin: '0 auto',
            marginTop: 12,
            width: "min(calc(100% - 16px), 760px)",
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--gold)',
            background: 'var(--gold-deep)',
            color: 'var(--gold)',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.5,
            position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            pointerEvents: 'auto'
          }}>
            Free Plan (Read-only): You can view existing records and download reports. Create, edit, and delete actions require Pro.
            {!reviewAccessEnabled && (
              <button
                className="btn-secondary"
                type="button"
                onClick={openUpgradeFlow}
                style={{ marginTop: 8, padding: "7px 10px", fontSize: 11, color: "var(--gold)", borderColor: "var(--gold)" }}
              >
                Upgrade to Pro
              </button>
            )}
            <button
              style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--gold)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
              aria-label="Dismiss"
              onClick={() => setShowFreeBanner(false)}
            >×</button>
          </div>
        )}
        {!isAdmin && user?.subscriptionStatus === "trial" && trialActive && showTrialBanner && (
          isMobile ? (
            <div style={{
              margin: '8px 12px 0',
              padding: '6px 10px',
              borderRadius: 20,
              border: '1px solid var(--accent)',
              background: 'var(--accent-deep)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              opacity: trialBannerOpacity,
              transition: 'opacity 0.4s ease'
            }}>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Trial active{trialEndLabel ? ` · ends ${trialEndLabel}` : ""}
              </span>
              {!reviewAccessEnabled && (
                <button
                  type="button"
                  onClick={openUpgradeFlow}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Upgrade
                </button>
              )}
              <button
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 16, cursor: 'pointer', fontWeight: 900, lineHeight: 1, flexShrink: 0, padding: '0 2px' }}
                aria-label="Dismiss"
                onClick={dismissTrialBanner}
              >×</button>
            </div>
          ) : (
            <div style={{
              margin: '0 auto',
              marginTop: 12,
              width: "min(calc(100% - 16px), 760px)",
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--accent)',
              background: 'var(--accent-deep)',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.5,
              position: 'relative',
              boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              pointerEvents: 'auto',
              opacity: trialBannerOpacity,
              transition: 'opacity 0.4s ease'
            }}>
              <span style={{ fontWeight: 800 }}>
                Pro Trial Active{trialEndLabel ? ` until ${trialEndLabel}` : ""}.
              </span> You currently have full editing access. Upgrade before trial end to avoid moving to Free read-only mode.
              {!reviewAccessEnabled && (
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={openUpgradeFlow}
                  style={{ marginTop: 8, padding: "7px 10px", fontSize: 11, color: "var(--accent)", borderColor: "var(--accent)" }}
                >
                  Manage Subscription
                </button>
              )}
              <button
                style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
                aria-label="Dismiss"
                onClick={dismissTrialBanner}
              >×</button>
            </div>
          )
        )}
      </div>
      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="menu-glass" style={{ position: "sticky", top: 0, zIndex: 110, background: "var(--bg)", borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)", paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? (isCompactMobile ? "8px 10px" : "9px 12px") : "10px 20px", gap: isCompactMobile ? 6 : 8 }}>

            {/* Left: OrgAvatar + Org Name + Type badge — tappable to go to dashboard */}
            <button
              onClick={() => handleNavigate({ tab: "settings", screen: "profile" })}
              title="Open profile"
              style={{ width: isCompactMobile ? 30 : 34, height: isCompactMobile ? 30 : 34, borderRadius: isCompactMobile ? 10 : 11, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <User size={isCompactMobile ? 14 : 16} strokeWidth={2.1} />
            </button>
            <button
              onClick={() => { handleNavigate({ tab: "dashboard" }); setShowOrgSwitcher(false); }}
              title="Go to dashboard"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minWidth: 0, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <BrandMark size={isCompactMobile ? 22 : 26} />
              <span style={{ fontSize: isCompactMobile ? 14 : 16, fontWeight: 800, color: "var(--text)", fontFamily: "var(--serif)", whiteSpace: "nowrap" }}>
                {APP_NAME}
              </span>
            </button>

            {/* Right: Org switcher (always when multiple orgs) + Bell + Sign out */}
            <div style={{ display: "flex", alignItems: "center", gap: isCompactMobile ? 6 : 8, flexShrink: 0 }}>
              {/* Org switcher — always shown for non-admin users */}
              {!isAdmin && (
                <div style={{ position: "relative" }} ref={orgSwitcherRef}>
                  <button
                    onClick={() => setShowOrgSwitcher(v => !v)}
                    title="Switch Khata"
                    style={{ height: isCompactMobile ? 30 : 34, borderRadius: isCompactMobile ? 10 : 11, border: `1px solid color-mix(in srgb, var(--saffron) 40%, var(--border))`, background: activeSharedOrgKey ? "color-mix(in srgb, var(--saffron) 12%, var(--raised))" : "color-mix(in srgb, var(--saffron) 7%, var(--raised))", color: "var(--saffron)", cursor: "pointer", fontSize: isCompactMobile ? 9 : 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, padding: isCompactMobile ? "0 9px" : "0 12px", flexShrink: 0 }}
                  >
                    <span style={{ fontSize: 12 }}>⇄</span>
                    <span>{isCompactMobile ? "Orgs" : "Switch Org"}</span>
                  </button>
                  {showOrgSwitcher && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, minWidth: isCompactMobile ? 200 : 230, boxShadow: "0 16px 40px rgba(0,0,0,0.35)", zIndex: 200, overflow: "hidden" }}>
                      {/* Own org row */}
                      <button
                        onClick={() => { switchToOwnOrg(); handleNavigate({ tab: "dashboard" }); setShowOrgSwitcher(false); }}
                        style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: !activeSharedOrgKey ? "color-mix(in srgb, var(--jade) 8%, var(--raised))" : "transparent", border: "none", color: "var(--cream)", fontSize: 12, fontWeight: !activeSharedOrgKey ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "color-mix(in srgb, var(--jade) 18%, var(--raised))", border: "1px solid color-mix(in srgb, var(--jade) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--jade)", flexShrink: 0 }}>
                          {(ownOrgName || "K").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "K"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownOrgName}</span>
                        <span style={{ fontSize: 9, color: "var(--jade)", fontWeight: 700, background: "color-mix(in srgb, var(--jade) 12%, transparent)", borderRadius: 5, padding: "2px 5px", flexShrink: 0 }}>Owner</span>
                        {!activeSharedOrgKey && <span style={{ fontSize: 12, color: "var(--jade)", flexShrink: 0 }}>✓</span>}
                      </button>
                      {organizations.filter(org => org.id !== activeOrgId).map(org => (
                        <React.Fragment key={org.id}>
                          <div style={{ height: 1, background: "var(--line)", margin: "0 14px" }} />
                          <button
                            onClick={async () => {
                              await switchOrganization(org.id);
                              handleNavigate({ tab: "dashboard" });
                              setShowOrgSwitcher(false);
                            }}
                            style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: "transparent", border: "none", color: "var(--cream)", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                          >
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: "color-mix(in srgb, var(--jade) 18%, var(--raised))", border: "1px solid color-mix(in srgb, var(--jade) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--jade)", flexShrink: 0 }}>
                              {(org.name || "K").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "K"}
                            </span>
                            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name || "My Organization"}</span>
                            <span style={{ fontSize: 9, color: "var(--jade)", fontWeight: 700, background: "color-mix(in srgb, var(--jade) 12%, transparent)", borderRadius: 5, padding: "2px 5px", flexShrink: 0 }}>Owner</span>
                          </button>
                        </React.Fragment>
                      ))}
                      {sharedOrgs.length > 0 ? (
                        <>
                          <div style={{ height: 1, background: "var(--line)", margin: "0 14px" }} />
                          {sharedOrgs.map(org => {
                            const isActive = activeSharedOrgKey === org.key;
                            const role = org.role || "viewer";
                            const roleColor = role === "admin" ? "var(--jade)" : role === "owner" ? "var(--saffron)" : "var(--sky)";
                            const initials = (org.orgName || "O").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "O";
                            return (
                              <button
                                key={org.key}
                                onClick={() => { switchToSharedOrg(org.key); setShowOrgSwitcher(false); }}
                                style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: isActive ? `color-mix(in srgb, ${roleColor} 8%, var(--raised))` : "transparent", border: "none", color: "var(--cream)", fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                              >
                                <span style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${roleColor} 18%, var(--raised))`, border: `1px solid color-mix(in srgb, ${roleColor} 30%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: roleColor, flexShrink: 0 }}>{initials}</span>
                                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.orgName || "Organization"}</span>
                                <span style={{ fontSize: 9, color: roleColor, fontWeight: 700, background: `color-mix(in srgb, ${roleColor} 12%, transparent)`, borderRadius: 5, padding: "2px 5px", flexShrink: 0, textTransform: "capitalize" }}>{role}</span>
                                {isActive && <span style={{ fontSize: 12, color: roleColor, flexShrink: 0 }}>✓</span>}
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <div style={{ height: 1, background: "var(--line)", margin: "0 14px" }} />
                          <div style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.5 }}>
                            No shared orgs yet.<br />
                            <span style={{ color: "var(--text-sec)" }}>Ask the org owner to invite you via Settings → Members.</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowReminders(true)}
                title="Open reminders"
                style={{ width: isCompactMobile ? 30 : 34, height: isCompactMobile ? 30 : 34, borderRadius: isCompactMobile ? 9 : 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: inboxReminders.length ? "var(--gold)" : "var(--text-sec)", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Bell size={isCompactMobile ? 13 : 14} strokeWidth={2} />
                {inboxReminders.length > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 15, height: 15, borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {inboxReminders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { if (window.confirm("Sign out of EazyKhata?")) logout(); }}
                title="Sign out"
                style={{ width: isCompactMobile ? 30 : 34, height: isCompactMobile ? 30 : 34, borderRadius: isCompactMobile ? 9 : 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Power size={isCompactMobile ? 13 : 14} strokeWidth={2} />
              </button>
            </div>

          </div>
        </div>

        {/* Invite banners — shown when pending invitations exist */}
        <PendingInviteBanner />

        {/* Shared-org context strip — shown when viewing someone else's org */}
        {activeSharedOrgKey && (() => {
          const org = sharedOrgs.find(o => o.key === activeSharedOrgKey);
          return org ? (
            <div style={{ background: "var(--surface-high)", borderBottom: "1px solid var(--border)", padding: isCompactMobile ? "6px 10px" : "7px 18px", display: "flex", alignItems: "center", gap: isCompactMobile ? 8 : 10, fontSize: isCompactMobile ? 11 : 12 }}>
              <span style={{ color: "var(--text-dim)" }}>Viewing</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{org.orgName}</span>
              {(() => { const liveRole = activeSharedOrgRole ?? org.role ?? "viewer"; return (
              <span style={{ padding: "2px 8px", borderRadius: 6, background: liveRole === "admin" ? "var(--accent-deep)" : "var(--surface)", color: liveRole === "admin" ? "var(--accent)" : "var(--text-dim)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{liveRole}</span>
              ); })()}
              <button onClick={() => { switchToOwnOrg(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-sec)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>← Back to my org</button>
            </div>
          ) : null;
        })()}

        <div style={{ flex: 1, minHeight: 0, overflowY: tab === "discussions" ? "hidden" : "auto", overflowX: "hidden", padding: tab === "discussions" ? "0 0 calc(env(safe-area-inset-bottom, 0px) + 62px)" : (isMobile ? (isCompactMobile ? "8px 6px calc(env(safe-area-inset-bottom, 0px) + 82px)" : "10px 8px calc(env(safe-area-inset-bottom, 0px) + 92px)") : "14px 18px 104px"), ...(tab === "discussions" ? { display: "flex", flexDirection: "column" } : {}) }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              style={tab === "discussions" ? { height: "100%", display: "flex", flexDirection: "column" } : {}}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {!showFab && (
      <div
        className="app-bottom-nav menu-glass"
        style={{ gridTemplateColumns: `repeat(${Math.max(footerTabs.length, 1)}, minmax(0, 1fr))` }}
      >
        {footerTabs.map(tabItem => {
          if (tabItem.id === "__fab__") {
            return (
              <button
                key="__fab__"
                type="button"
                onClick={() => setShowFab(v => !v)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0 2px",
                  position: "relative",
                }}
              >
                <motion.span
                  animate={showFab ? { rotate: 45, scale: 1.1 } : { rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--saffron)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 300,
                    color: "#0C0908",
                    boxShadow: "0 4px 16px color-mix(in srgb, var(--saffron) 50%, transparent)",
                    marginBottom: 2,
                  }}
                >
                  +
                </motion.span>
              </button>
            );
          }

          const active = tab === tabItem.id;
          const activeColor = TAB_COLOR[tabItem.id] || "var(--accent)";
          const IconComponent = TAB_ICONS[tabItem.id];

          return (
            <button
              key={tabItem.id}
              type="button"
              className={`app-bottom-nav-btn${active ? " active" : ""}`}
              onClick={() =>
                tabItem.id === "org" || tabItem.id === "settings"
                  ? handleNavigate({ tab: tabItem.id, screen: "main" })
                  : handleNavigate({ tab: tabItem.id })
              }
              style={active ? { color: activeColor } : undefined}
            >
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: activeColor, display: "block", opacity: active ? 1 : 0, transition: "opacity 0.2s ease", marginBottom: 1 }} />
              <motion.span
                className="app-bottom-nav-icon"
                animate={active ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                style={active ? { color: activeColor, borderColor: `color-mix(in srgb, ${activeColor} 35%, var(--border))`, background: `color-mix(in srgb, ${activeColor} 13%, var(--surface-high))`, boxShadow: `0 0 10px color-mix(in srgb, ${activeColor} 26%, transparent)`, borderRadius: 8 } : { color: "var(--text-dim)", background: "transparent", border: "1px solid transparent", borderRadius: 8 }}
              >
                {IconComponent ? <IconComponent size={active ? 15 : 14} strokeWidth={active ? 2.4 : 1.8} /> : "•"}
              </motion.span>
              <span className="app-bottom-nav-label" style={{ fontSize: active ? 9 : 8, fontWeight: active ? 800 : 600, color: active ? activeColor : "var(--text-dim)", transition: "color 0.2s, font-size 0.15s" }}>
                {tabItem.label}
              </span>
            </button>
          );
        })}
      </div>
      )}

      {tab !== "dashboard" && !showFab && tab !== "discussions" && !isViewerMode && (
        <button
          type="button"
          onClick={() => handleNavigate({ tab: "dashboard" })}
          title="Back to dashboard"
          style={{
            position: "fixed",
            right: isCompactMobile ? 12 : 16,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
            zIndex: 132,
            width: isCompactMobile ? 44 : 48,
            height: isCompactMobile ? 44 : 48,
            borderRadius: 16,
            border: "1px solid color-mix(in srgb, var(--accent) 24%, var(--border))",
            background: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
            cursor: "pointer"
          }}
        >
          <LayoutDashboard size={20} strokeWidth={2.2} />
        </button>
      )}

      {/* FAB quick-add sheet */}
      <AnimatePresence>
        {showFab && (
          <>
            <motion.div
              key="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setShowFab(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(12,9,8,0.65)", zIndex: 130 }}
            />
            <motion.div
              key="fab-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 180,
                maxWidth: 560,
                margin: "0 auto",
                maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 8px)",
              }}
            >
              <QuickEntrySheet
                onClose={() => setShowFab(false)}
                orgType={currentOrgType}
                customers={customers}
                currencySymbol={currency?.symbol || "Rs"}
                currentMonth={month}
                currentYear={year}
                isReadOnlyFreeMode={isReadOnlyFreeMode}
                isViewerMode={isViewerMode}
                addIncome={addIncome}
                addExpense={addExpense}
                addOrgRecord={addOrgRecord}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {readOnlyNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: bottomNoticeBase, zIndex: 140, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 520, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--gold)", background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13, fontWeight: 700, boxShadow: "0 10px 24px rgba(0,0,0,0.25)" }}>
            {readOnlyNotice.message}
          </div>
        </div>
      )}

      {successNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: readOnlyNotice ? "calc(env(safe-area-inset-bottom, 0px) + 156px)" : bottomNoticeBase, zIndex: 142, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 560, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent)", background: "var(--accent-deep)", color: "var(--accent)", boxShadow: "0 10px 24px rgba(0,0,0,0.25)", display: "flex", gap: 10, alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{successNotice.title}</div>
              <div style={{ fontSize: 12, marginTop: 3, color: "var(--text-sec)", lineHeight: 1.45 }}>{successNotice.message}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, width: isMobile ? "100%" : "auto" }}>
              {successNotice.target && (
                <button
                  className="btn-secondary"
                  type="button"
                  style={{ padding: "8px 10px", fontSize: 12, color: "var(--accent)", flex: isMobile ? 1 : "unset" }}
                  onClick={() => {
                    handleNavigate(successNotice.target);
                    setSuccessNotice(null);
                  }}
                >
                  {successNotice.actionLabel}
                </button>
              )}
              <button className="btn-secondary" type="button" style={{ padding: "8px 10px", fontSize: 12, flex: isMobile ? 1 : "unset" }} onClick={() => setSuccessNotice(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}



      {showReminders && (
        <Modal title="Reminders" onClose={() => setShowReminders(false)} onSave={clearAllReminders} saveLabel="Clear All" canSave={liveReminders.length > 0} accentColor="var(--gold)">
          <div className="card">
            {inboxReminders.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No unread reminders right now.</div>
            ) : (
              inboxReminders.map(reminder => (
                <div key={reminder.id} className="card-row" style={{ alignItems: "flex-start", gap: 12, cursor: "pointer" }} onClick={() => openReminder(reminder)}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)" }}>{reminder.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.5 }}>{reminder.message}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={event => { event.stopPropagation(); dismissReminder(reminder.id); }}>Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {idleWarning && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--surface)", borderRadius: 18, padding: "32px 28px", maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Session Expiring</div>
            <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 24 }}>
              You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{" "}
              <span style={{ fontWeight: 800, color: "var(--danger)" }}>{idleCountdown}s</span>.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleIdleLogout}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Sign Out
              </button>
              <button
                onClick={handleStayLoggedIn}
                style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
