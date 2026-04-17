import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import useIdleTimeout from "../hooks/useIdleTimeout";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import { BrandMark } from "../components/BrandLogo";
import PendingInviteBanner from "../components/PendingInviteBanner";
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
  settings: "var(--purple)",
  adminDashboard: "var(--gold)",
  adminSupport: "var(--blue)"
};
const TAB_ICON_GLYPHS = {
  dashboard: "◉",
  users: "◎",
  income: "↑",
  expenses: "↓",
  emi: "◌",
  khata: "¤",
  invoices: "▣",
  org: "◍",
  settings: "◈",
  adminSupport: "?"
};

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
          width: 32,
          height: 32,
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
        <div style={{ minWidth: 112, maxWidth: 128, padding: "5px 8px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", flexShrink: 1 }}>
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
            style={{ width: "100%", border: "none", background: "transparent", color: "var(--blue)", fontFamily: "var(--serif)", fontSize: 13, lineHeight: 1.2, padding: 0 }}
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
            minWidth: 96,
            maxWidth: 118,
            padding: "6px 9px",
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
          <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6 }}>
            {viewMode === "month" ? "Month" : "Year"}
          </span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--blue)", lineHeight: 1.1, marginTop: 1, whiteSpace: "nowrap" }}>
            {viewMode === "month" ? `${MONTHS[month].slice(0, 3)} ${year}` : year}
          </span>
        </button>
      )}

      <button
        onClick={next}
        disabled={nextDisabled}
        style={{
          width: 32,
          height: 32,
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
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const orgSwitcherRef = useRef(null);
  // Banner visibility state (must be before usage)
  const [showFreeBanner, setShowFreeBanner] = useState(true);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [settingsNavigation, setSettingsNavigation] = useState(null);
  const [quickstartIntent, setQuickstartIntent] = useState(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState("month"); // "month" or "year"
  const [showReminders, setShowReminders] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedReminderIds(user?.id));
  const [readOnlyNotice, setReadOnlyNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(120);
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

    if (nextTarget?.quickstart) {
      setQuickstartIntent({ action: nextTarget.quickstart, token: Date.now() });
    }

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
      const msg = event?.detail?.message || "Free plan is read-only. Upgrade to Pro to continue.";
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

  useEffect(() => {
    if (!successNotice) return undefined;
    const timeout = window.setTimeout(() => setSuccessNotice(null), 6200);
    return () => window.clearTimeout(timeout);
  }, [successNotice]);

  useEffect(() => {
    setDismissedIds(getDismissedReminderIds(user?.id));
  }, [user?.id]);

  const liveReminders = useMemo(() => {
    const currentDate = new Date();
    const reminders = buildReminders(data, currentDate.getFullYear(), currentDate.getMonth());
    return filterRemindersByPrefs(reminders, data.notificationPrefs || {});
  }, [data]);

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
  const orgConfig = getOrgConfig(currentOrgType);
  const isPersonalOrg = currentOrgType === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = currentOrgType === ORG_TYPES.SMALL_BUSINESS;
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
    ...(!isAdmin && !activeSharedOrgKey ? [{ id: "org", icon: "OR", label: currentOrgLabel }] : []),
    ...(isAdmin ? [] : [])
  ]), [activeSharedOrgKey, currentOrgLabel, hideInvoices, isAdmin, isPersonalOrg, isSmallBusinessOrg, orgConfig.expensesLabel, orgConfig.incomeLabel, orgConfig.invoicesLabel, user?.role]);

  const activeDashboardColor = isAdmin ? TAB_COLOR.adminDashboard : TAB_COLOR.dashboard;
  const handleDateChange = useCallback((nextYear, nextMonth) => {
    setYear(nextYear);
    setMonth(nextMonth);
  }, []);
  const handleQuickstartHandled = useCallback(() => {
    setQuickstartIntent(null);
  }, []);
  const openUpgradeFlow = useCallback(() => {
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
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            quickstartIntent={quickstartIntent}
            onQuickstartHandled={handleQuickstartHandled}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "expenses" && <ExpensesSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "emi" && isPersonalOrg && <EmiSection year={year} month={month} orgType={currentOrgType} headerDatePicker={datePickerNode} />}
        {tab === "khata" && !isAdmin && isSmallBusinessOrg && <KhataSection orgType={currentOrgType} />}
        {tab === "invoices" && !hideInvoices && (
          <InvoicesSection
            year={year}
            month={month}
            orgType={currentOrgType}
            quickstartIntent={quickstartIntent}
            onQuickstartHandled={handleQuickstartHandled}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "settings" && <SettingsSection navigationTarget={settingsNavigation} />}
      </Suspense>
    );
  }, [currentOrgType, datePickerNode, handleNavigate, handleQuickstartHandled, hideInvoices, isAdmin, isPersonalOrg, isSmallBusinessOrg, month, quickstartIntent, settingsNavigation, tab, viewMode, year]);


  const footerTabs = useMemo(() => {
    const baseTabOrder = isAdmin
      ? ["dashboard", "users", "adminSupport", "invoices"]
      : ["dashboard", "income", "expenses", "emi", "invoices", "org"];
    const baseTabs = baseTabOrder
      .filter(tabId => TABS.some(item => item.id === tabId))
      .map(tabId => TABS.find(item => item.id === tabId))
      .filter(Boolean);
    if (baseTabs.some(item => item.id === tab) || !TABS.some(item => item.id === tab)) {
      return baseTabs;
    }
    const fallbackTab = TABS.find(item => item.id === tab);
    return fallbackTab ? [...baseTabs, fallbackTab] : baseTabs;
  }, [TABS, isAdmin, tab]);
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
              gap: 8
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
                onClick={() => setShowTrialBanner(false)}
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
              pointerEvents: 'auto'
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
                onClick={() => setShowTrialBanner(false)}
              >×</button>
            </div>
          )
        )}
      </div>
      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="menu-glass" style={{ position: "sticky", top: 0, zIndex: 110, background: "var(--bg)", borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)", paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : undefined }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "center" : "flex-start", padding: isMobile ? "10px 12px" : "12px 20px 12px", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setTab("dashboard")}
                title="Go to dashboard"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  background: "var(--surface-high)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  padding: 0,
                  marginTop: 2
                }}
              >
                <BrandMark size={22} />
              </button>
              <div style={{ minWidth: 0, paddingRight: isMobile ? 4 : 0 }}>
                <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isAdmin ? "Admin" : (account?.name || currentOrgLabel || "My Khata")}
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 16 : 24, color: "var(--text)", lineHeight: 1.15, marginTop: isMobile ? 2 : 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {TABS.find(item => item.id === tab)?.label}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Org switcher — only shown when user has shared orgs */}
              {sharedOrgs.length > 0 && (
                <div style={{ position: "relative" }} ref={orgSwitcherRef}>
                  <button
                    onClick={() => setShowOrgSwitcher(v => !v)}
                    title="Switch Khata"
                    style={{ height: isMobile ? 34 : 36, borderRadius: 10, border: `1px solid ${activeSharedOrgKey ? "var(--accent)" : "var(--border)"}`, background: activeSharedOrgKey ? "var(--accent-deep)" : "var(--surface-high)", color: activeSharedOrgKey ? "var(--accent)" : "var(--text-sec)", cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, padding: "0 10px", flexShrink: 0 }}
                  >
                    {activeSharedOrgKey
                      ? (sharedOrgs.find(o => o.key === activeSharedOrgKey)?.orgName || "Shared Khata")
                      : "My Khata"} ▾
                  </button>
                  {showOrgSwitcher && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 200, overflow: "hidden" }}>
                      <button
                        onClick={() => { switchToOwnOrg(); setShowOrgSwitcher(false); }}
                        style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: !activeSharedOrgKey ? "var(--accent-deep)" : "transparent", border: "none", color: !activeSharedOrgKey ? "var(--accent)" : "var(--text)", fontSize: 13, fontWeight: !activeSharedOrgKey ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                      >
                        {!activeSharedOrgKey && <span style={{ fontSize: 10 }}>✓</span>}
                        {account?.name || "My Organization"}
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-dim)", fontWeight: 600 }}>Owner</span>
                      </button>
                      <div style={{ height: 1, background: "var(--border)", margin: "0 12px" }} />
                      {sharedOrgs.map(org => (
                        <button
                          key={org.key}
                          onClick={() => { switchToSharedOrg(org.key); setShowOrgSwitcher(false); }}
                          style={{ width: "100%", padding: "11px 14px", textAlign: "left", background: activeSharedOrgKey === org.key ? "var(--accent-deep)" : "transparent", border: "none", color: activeSharedOrgKey === org.key ? "var(--accent)" : "var(--text)", fontSize: 13, fontWeight: activeSharedOrgKey === org.key ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                        >
                          {activeSharedOrgKey === org.key && <span style={{ fontSize: 10 }}>✓</span>}
                          {org.orgName || "Organization"}
                          <span style={{ marginLeft: "auto", fontSize: 10, color: activeSharedOrgKey === org.key ? "var(--accent)" : "var(--text-dim)", fontWeight: 600, textTransform: "capitalize" }}>{org.role}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => handleNavigate({ tab: "settings", screen: "main" })}
                title="Open profile settings"
                style={{
                  width: isMobile ? 34 : 36,
                  height: isMobile ? 34 : 36,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-high)",
                  color: "var(--text-sec)",
                  cursor: "pointer",
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                ⚙
              </button>
              <button
                onClick={() => setShowReminders(true)}
                title="Open reminders"
                style={{ width: isMobile ? 34 : 36, height: isMobile ? 34 : 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: inboxReminders.length ? "var(--gold)" : "var(--text-sec)", cursor: "pointer", position: "relative", fontSize: isMobile ? 14 : 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                🔔
                {inboxReminders.length > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {inboxReminders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => { if (window.confirm("Sign out of EasyKhata?")) logout(); }}
                title="Sign out"
                style={{ width: isMobile ? 34 : 36, height: isMobile ? 34 : 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", cursor: "pointer", fontSize: isMobile ? 14 : 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                ⏻
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
            <div style={{ background: "var(--surface-high)", borderBottom: "1px solid var(--border)", padding: "7px 18px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <span style={{ color: "var(--text-dim)" }}>Viewing</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>{org.orgName}</span>
              {(() => { const liveRole = activeSharedOrgRole ?? org.role ?? "viewer"; return (
              <span style={{ padding: "2px 8px", borderRadius: 6, background: liveRole === "admin" ? "var(--accent-deep)" : "var(--surface)", color: liveRole === "admin" ? "var(--accent)" : "var(--text-dim)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{liveRole}</span>
              ); })()}
              <button onClick={() => { switchToOwnOrg(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-sec)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>← Back to my org</button>
            </div>
          ) : null;
        })()}

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "10px 8px calc(env(safe-area-inset-bottom, 0px) + 92px)" : "14px 18px 104px" }}>
          {renderTabContent()}
        </div>
      </div>

      <div
        className="app-bottom-nav menu-glass"
        style={{ gridTemplateColumns: `repeat(${Math.max(footerTabs.length, 1)}, minmax(0, 1fr))` }}
      >
          {footerTabs.map(tabItem => {
            const active = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                className={`app-bottom-nav-btn${active ? " active" : ""}`}
                onClick={() => setTab(tabItem.id)}
              >
                <span className="app-bottom-nav-icon">{TAB_ICON_GLYPHS[tabItem.id] || "•"}</span>
                <span className="app-bottom-nav-label">{tabItem.label}</span>
              </button>
            );
          })}
      </div>

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

