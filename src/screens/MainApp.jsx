import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, BookOpen, Building2, CreditCard, FileText,
  HeadphonesIcon, LayoutDashboard, LogOut, MessageSquare, MoreHorizontal, Settings,
  TrendingDown, TrendingUp, Users
} from "lucide-react";
import { isNative } from "../utils/native";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import useIdleTimeout from "../hooks/useIdleTimeout";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import { BrandMark } from "../components/BrandLogo";
import PendingInviteBanner from "../components/PendingInviteBanner";
import { societyApi } from "../lib/api";
import { APP_UPGRADE_URL } from "../utils/brand";
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
  const { account, isReadOnlyFreeMode, isViewerMode, activeSharedOrgRole, sharedOrgs, activeSharedOrgKey, switchToSharedOrg, switchToOwnOrg } = data;
  const ownOrgNameRef = useRef(null);
  if (!activeSharedOrgKey && account?.name) ownOrgNameRef.current = account.name;
  const ownOrgName = ownOrgNameRef.current || account?.name || "My Organization";
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const orgSwitcherRef = useRef(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);
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

  useEffect(() => {
    function handleDocumentClick(event) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
    };
  }, []);

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
      ? ["users", "__fab__", "adminSupport"]
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
  }, [TABS, isAdmin, isApartmentOrg, isFreelancerOrg, isPersonalOrg, isSmallBusinessOrg]);
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
              onClick={() => { setTab("dashboard"); setShowOrgSwitcher(false); }}
              title="Go to dashboard"
              style={{ display: "flex", alignItems: "center", gap: isCompactMobile ? 8 : 10, minWidth: 0, flex: 1, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
            >
              {/* OrgAvatar */}
              {(() => {
                const orgName = isAdmin ? "Admin" : (activeSharedOrgKey ? (sharedOrgs.find(o => o.key === activeSharedOrgKey)?.orgName || "Org") : (account?.name || "K"));
                const initials = orgName.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "K";
                const avatarColor = isApartmentOrg ? "var(--orchid)" : isFreelancerOrg ? "var(--sky)" : isPersonalOrg ? "var(--saffron)" : "var(--jade)";
                const sz = isCompactMobile ? 30 : 34;
                return (
                  <span style={{ width: sz, height: sz, borderRadius: sz * 0.28, background: `color-mix(in srgb, ${avatarColor} 22%, var(--raised))`, border: `1.5px solid color-mix(in srgb, ${avatarColor} 35%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz * 0.36, fontWeight: 800, color: avatarColor, flexShrink: 0, fontFamily: "var(--font)" }}>
                    {initials}
                  </span>
                );
              })()}
              {/* Org name + type badge */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
                  <span style={{ fontSize: isCompactMobile ? 13 : 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--serif)" }}>
                    {isAdmin ? "Admin" : (activeSharedOrgKey ? (sharedOrgs.find(o => o.key === activeSharedOrgKey)?.orgName || "Organization") : (account?.name || currentOrgLabel || "My Khata"))}
                  </span>
                  {!isAdmin && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: isApartmentOrg ? "var(--orchid)" : isFreelancerOrg ? "var(--sky)" : isPersonalOrg ? "var(--saffron)" : "var(--jade)", background: `color-mix(in srgb, ${isApartmentOrg ? "var(--orchid)" : isFreelancerOrg ? "var(--sky)" : isPersonalOrg ? "var(--saffron)" : "var(--jade)"} 14%, var(--raised))`, border: `1px solid color-mix(in srgb, ${isApartmentOrg ? "var(--orchid)" : isFreelancerOrg ? "var(--sky)" : isPersonalOrg ? "var(--saffron)" : "var(--jade)"} 30%, transparent)`, borderRadius: 6, padding: "2px 6px", flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {isApartmentOrg ? "Apartment" : isFreelancerOrg ? "Freelance" : isPersonalOrg ? "Household" : "Business"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: isCompactMobile ? 9 : 10, color: "var(--text-dim)", marginTop: 1, fontWeight: 500 }}>
                  {MONTHS[month]} {year} {activeSharedOrgKey ? `· ${(activeSharedOrgRole ?? sharedOrgs.find(o => o.key === activeSharedOrgKey)?.role ?? "viewer")}` : ""}
                </div>
              </div>
            </button>

            {/* Right: Org switcher (always when multiple orgs) + Bell + More */}
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
                        onClick={() => { switchToOwnOrg(); setShowOrgSwitcher(false); }}
                        style={{ width: "100%", padding: "12px 14px", textAlign: "left", background: !activeSharedOrgKey ? "color-mix(in srgb, var(--jade) 8%, var(--raised))" : "transparent", border: "none", color: "var(--cream)", fontSize: 12, fontWeight: !activeSharedOrgKey ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <span style={{ width: 28, height: 28, borderRadius: 8, background: "color-mix(in srgb, var(--jade) 18%, var(--raised))", border: "1px solid color-mix(in srgb, var(--jade) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "var(--jade)", flexShrink: 0 }}>
                          {(ownOrgName || "K").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "K"}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ownOrgName}</span>
                        <span style={{ fontSize: 9, color: "var(--jade)", fontWeight: 700, background: "color-mix(in srgb, var(--jade) 12%, transparent)", borderRadius: 5, padding: "2px 5px", flexShrink: 0 }}>Owner</span>
                        {!activeSharedOrgKey && <span style={{ fontSize: 12, color: "var(--jade)", flexShrink: 0 }}>✓</span>}
                      </button>
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

              <div style={{ position: "relative" }} ref={headerMenuRef}>
                <button
                  onClick={() => setShowHeaderMenu(value => !value)}
                  title="More options"
                  style={{ width: isCompactMobile ? 30 : 34, height: isCompactMobile ? 30 : 34, borderRadius: isCompactMobile ? 9 : 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >
                  <MoreHorizontal size={isCompactMobile ? 13 : 14} strokeWidth={2} />
                </button>
                {showHeaderMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 168, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 10px 24px rgba(0,0,0,0.18)", overflow: "hidden", zIndex: 220 }}>
                    <button onClick={() => { setShowHeaderMenu(false); handleNavigate({ tab: "settings", screen: "main" }); }} style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: "transparent", border: "none", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                      <Settings size={15} strokeWidth={2} /> Settings
                    </button>
                    <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                    <button onClick={() => { setShowHeaderMenu(false); if (window.confirm("Sign out of EazyKhata?")) logout(); }} style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: "transparent", border: "none", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                      <LogOut size={15} strokeWidth={2} /> Sign out
                    </button>
                  </div>
                )}
              </div>
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
                zIndex: 131,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              <QuickAddSheet
                onClose={() => setShowFab(false)}
                isPersonalOrg={isPersonalOrg}
                isApartmentOrg={isApartmentOrg}
                isFreelancerOrg={isFreelancerOrg}
                isReadOnlyFreeMode={isReadOnlyFreeMode}
                isViewerMode={isViewerMode}
                addIncome={data.addIncome}
                addExpense={data.addExpense}
                currentMonth={month}
                currentYear={year}
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
