import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import BrandLogo from "../components/BrandLogo";
import {
  buildReminders,
  filterRemindersByPrefs,
  getDismissedReminderIds,
  getSentBrowserReminderIds,
  saveDismissedReminderIds,
  saveSentBrowserReminderIds
} from "../utils/reminders";
import { formatSubscriptionDate, isTrialActive } from "../utils/subscription";
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

const now = new Date();

function HeaderDatePicker({ year, month, onChange, viewMode, onViewModeChange }) {
  const [open, setOpen] = useState(false);
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

      <button
        onClick={() => setOpen(current => !current)}
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

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
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
  const { user } = useAuth();
  const data = useData();
  const { account, isReadOnlyFreeMode } = data;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));

  function handleNavigate(target) {
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
  }

  useEffect(() => {
    const handleAppNavigate = event => {
      if (event?.detail) {
        handleNavigate(event.detail);
      }
    };
    window.addEventListener("ledger:navigate", handleAppNavigate);
    return () => window.removeEventListener("ledger:navigate", handleAppNavigate);
  }, []);

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

  const inboxReminders = liveReminders.filter(item => !dismissedIds.includes(item.id));

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
  const trialActive = isTrialActive(user);
  const trialEndLabel = formatSubscriptionDate(user?.subscriptionEndsAt);
  const currentOrgType = getOrgType(account?.organizationType || user?.organizationType);
  const orgConfig = getOrgConfig(currentOrgType);
  const isPersonalOrg = currentOrgType === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = currentOrgType === ORG_TYPES.SMALL_BUSINESS;
  const hideInvoices = !isAdmin && orgConfig.hideInvoices;
  const currentOrgLabel = account?.name?.trim() || "Organization";
  const TABS = [
    { id: "dashboard", icon: isAdmin ? "AD" : "DB", label: isAdmin ? "Admin" : "Dashboard" },
    ...(isAdmin ? [{ id: "users", icon: "US", label: "Users" }] : []),
    ...(user?.role !== "admin" ? [
      { id: "income", icon: "IN", label: orgConfig.incomeLabel },
      { id: "expenses", icon: "EX", label: orgConfig.expensesLabel },
      ...(isPersonalOrg ? [{ id: "emi", icon: "EM", label: "EMIs" }] : []),
    ] : []),
    ...(!isAdmin && !hideInvoices && isSmallBusinessOrg ? [{ id: "khata", icon: "KH", label: "Khata" }] : []),
    ...(!hideInvoices ? [{ id: "invoices", icon: "IV", label: isAdmin ? "Subscriptions" : orgConfig.invoicesLabel }] : []),
    ...(!isAdmin ? [{ id: "org", icon: "OR", label: currentOrgLabel }] : []),
    ...(isAdmin ? [{ id: "settings", icon: "ST", label: "Settings" }] : [])
  ];

  const tabColor = {
    dashboard: isAdmin ? "var(--gold)" : "var(--accent)",
    users: "var(--blue)",
    org: "var(--blue)",
    income: "var(--accent)",
    expenses: "var(--danger)",
    emi: "var(--gold)",
    khata: "var(--gold)",
    invoices: "var(--blue)",
    settings: "var(--purple)"
  };

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

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function renderTabContent() {
    const fallback = tab === "settings" || (isAdmin && tab === "users")
      ? <SectionSkeleton rows={5} showHero={false} />
      : <SectionSkeleton rows={4} />;

    const datePickerNode = (
      <HeaderDatePicker
        year={year}
        month={month}
        onChange={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    );

    return (
      <Suspense fallback={fallback}>
        {tab === "dashboard" && (isAdmin ? <AdminPanel year={year} month={month} /> : <Dashboard year={year} month={month} viewMode={viewMode} onNav={handleNavigate} headerDatePicker={datePickerNode} />)}
        {tab === "users" && isAdmin && <AdminUsersSection />}
        {tab === "org" && !isAdmin && <OrgSection navigationTarget={settingsNavigation} sectionMode="org" />}
        {tab === "income" && (
          <IncomeSection
            year={year}
            month={month}
            orgType={currentOrgType}
            quickstartIntent={quickstartIntent}
            onQuickstartHandled={() => setQuickstartIntent(null)}
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
            onQuickstartHandled={() => setQuickstartIntent(null)}
            headerDatePicker={datePickerNode}
          />
        )}
        {tab === "settings" && <SettingsSection navigationTarget={settingsNavigation} />}
      </Suspense>
    );
  }


  const showSidebarLabels = isMobile || sidebarOpen;
  const desktopSidebarWidth = sidebarOpen ? 180 : 60;
  const drawerWidth = showSidebarLabels ? 180 : 60;
  const sidebarWidth = isMobile ? 0 : desktopSidebarWidth;

  return (
    <div className="app-shell" style={{ minHeight: "100vh", position: "relative", display: "flex" }}>

      {/* Fixed banners at the top, above sidebar/content */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, pointerEvents: 'none' }}>
        {isReadOnlyFreeMode && !isAdmin && showFreeBanner && (
          <div style={{
            margin: '0 auto',
            marginTop: 12,
            maxWidth: 700,
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
            <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 6, fontWeight: 500 }}>
              <span role="img" aria-label="info">⚠️</span> Password reset and registration emails may go to your spam folder. Please check spam if not found in inbox.
            </div>
            <button
              style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--gold)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
              aria-label="Dismiss"
              onClick={() => setShowFreeBanner(false)}
            >×</button>
          </div>
        )}
        {!isAdmin && user?.subscriptionStatus === "trial" && trialActive && showTrialBanner && (
          <div style={{
            margin: '0 auto',
            marginTop: 12,
            maxWidth: 700,
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
            <button
              style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: 'var(--accent)', fontSize: 18, cursor: 'pointer', fontWeight: 900 }}
              aria-label="Dismiss"
              onClick={() => setShowTrialBanner(false)}
            >×</button>
          </div>
        )}
      </div>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(12, 12, 16, 0.34)", zIndex: 120 }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: drawerWidth,
        position: "fixed",
        top: 0,
        left: 0,
        height: "100dvh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: showSidebarLabels ? "flex-start" : "center",
        padding: "12px 0",
        transition: "transform 0.22s ease, width 0.2s ease",
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
        boxShadow: isMobile && sidebarOpen ? "0 14px 40px rgba(0,0,0,0.24)" : "none",
        zIndex: 130
      }}>
        <button
          onClick={() => setSidebarOpen(open => !open)}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            margin: showSidebarLabels ? "0 0 18px 16px" : "0 0 18px 0",
            cursor: "pointer",
            color: "var(--text-dim)"
          }}
          title={sidebarOpen ? "Collapse menu" : "Expand menu"}
        >
          &#9776;
        </button>
        <div style={{ width: "100%", overflowY: "auto", overflowX: "hidden" }}>
          {TABS.map(tabItem => (
            <button
              key={tabItem.id}
              onClick={() => {
                setTab(tabItem.id);
                if (isMobile) setSidebarOpen(false);
              }}
              title={tabItem.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: showSidebarLabels ? "flex-start" : "center",
                gap: showSidebarLabels ? 14 : 0,
                width: showSidebarLabels ? 160 : 44,
                margin: showSidebarLabels ? "6px 0 6px 10px" : "6px auto",
                padding: showSidebarLabels ? "10px 14px" : "10px 0",
                border: "none",
                borderRadius: 10,
                background: tab === tabItem.id ? "var(--surface-pop)" : "transparent",
                color: tabColor[tabItem.id] || "var(--text)",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s"
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  lineHeight: 1,
                  background: tab === tabItem.id ? "var(--surface-high)" : "transparent",
                  border: "1px solid var(--border)"
                }}
              >
                {tabItem.icon}
              </span>
              {showSidebarLabels && <span style={{ fontSize: 15, fontWeight: 600 }}>{tabItem.label}</span>}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", width: "100%", paddingTop: 10 }}>
          <button
            onClick={() => {
              handleNavigate({ tab: "settings", screen: "main" });
              if (isMobile) setSidebarOpen(false);
            }}
            title="Profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: showSidebarLabels ? 10 : 0,
              width: showSidebarLabels ? 160 : 44,
              margin: showSidebarLabels ? "0 0 10px 10px" : "0 auto 10px",
              padding: showSidebarLabels ? "10px 12px" : "10px 0",
              border: "none",
              borderRadius: 10,
              background: tab === "settings" ? "var(--surface-pop)" : "transparent",
              color: "var(--text-sec)",
              cursor: "pointer"
            }}
          >
            <span style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {String(user?.name || user?.email || "U").trim().charAt(0).toUpperCase() || "U"}
            </span>
            {showSidebarLabels && <span style={{ fontSize: 14, fontWeight: 700 }}>Profile</span>}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, minWidth: 0, marginLeft: sidebarWidth, height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 110, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: isMobile ? "10px 14px 12px 14px" : "10px 24px 12px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  title="Open menu"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface-high)",
                    color: "var(--text-sec)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  &#9776;
                </button>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isAdmin ? "Admin Workspace" : (account?.name || currentOrgLabel || "Organization")}
                </div>
                <div style={{ fontFamily: "var(--serif)", fontSize: isMobile ? 18 : 24, color: "var(--text)", lineHeight: 1.15, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {TABS.find(item => item.id === tab)?.label}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setShowReminders(true)}
                title="Open reminders"
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: inboxReminders.length ? "var(--gold)" : "var(--text-sec)", cursor: "pointer", position: "relative", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                🔔
                {inboxReminders.length > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {inboxReminders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "12px 10px 24px" : "12px 16px 24px" }}>
          {renderTabContent()}
        </div>
      </div>


      {readOnlyNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 86, zIndex: 140, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 520, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--gold)", background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13, fontWeight: 700, boxShadow: "0 10px 24px rgba(0,0,0,0.25)" }}>
            {readOnlyNotice.message}
          </div>
        </div>
      )}

      {successNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: readOnlyNotice ? 150 : 86, zIndex: 142, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 560, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent)", background: "var(--accent-deep)", color: "var(--accent)", boxShadow: "0 10px 24px rgba(0,0,0,0.25)", display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{successNotice.title}</div>
              <div style={{ fontSize: 12, marginTop: 3, color: "var(--text-sec)", lineHeight: 1.45 }}>{successNotice.message}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {successNotice.target && (
                <button
                  className="btn-secondary"
                  type="button"
                  style={{ padding: "8px 10px", fontSize: 12, color: "var(--accent)" }}
                  onClick={() => {
                    handleNavigate(successNotice.target);
                    setSuccessNotice(null);
                  }}
                >
                  {successNotice.actionLabel}
                </button>
              )}
              <button className="btn-secondary" type="button" style={{ padding: "8px 10px", fontSize: 12 }} onClick={() => setSuccessNotice(null)}>
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
                <div key={reminder.id} className="card-row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)", marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: reminder.tone === "danger" ? "var(--danger)" : "var(--gold)" }}>{reminder.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4, lineHeight: 1.5 }}>{reminder.message}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => openReminder(reminder)}>Open</button>
                      <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => dismissReminder(reminder.id)}>Dismiss</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}

