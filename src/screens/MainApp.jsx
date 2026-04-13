import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import { Modal, MONTHS, SectionSkeleton } from "../components/UI";
import BrandLogo, { BrandMark } from "../components/BrandLogo";
import OrganizationSwitcherModal from "../components/OrganizationSwitcherModal";
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
    <div className="header-date-picker" style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={prev}
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface-high)",
          color: "var(--text)",
          fontSize: 18,
          cursor: "pointer"
        }}
      >
        {"<"}
      </button>

      <button
        onClick={() => setOpen(current => !current)}
        style={{
          minWidth: 138,
          padding: "10px 14px",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-high) 100%)",
          color: "var(--text)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          boxShadow: "var(--card-shadow)"
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8 }}>
          {viewMode === "month" ? "Current month" : "Current year"}
        </span>
        <span style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--text)", lineHeight: 1.1, marginTop: 4 }}>
          {viewMode === "month" ? `${MONTHS[month]} ${year}` : year}
        </span>
      </button>

      <button
        onClick={next}
        disabled={nextDisabled}
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: nextDisabled ? "var(--surface-high)" : "var(--surface-high)",
          color: nextDisabled ? "var(--text-dim)" : "var(--text)",
          fontSize: 18,
          cursor: nextDisabled ? "not-allowed" : "pointer",
          opacity: nextDisabled ? 0.5 : 1
        }}
      >
        {">"}
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
  const { theme, toggle } = useTheme();
  const data = useData();
  const { account, organizations = [], activeOrgId, switchOrganization, deleteOrganization, isReadOnlyFreeMode } = data;
  const [tab, setTab] = useState("dashboard");
  const [settingsNavigation, setSettingsNavigation] = useState(null);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [viewMode, setViewMode] = useState("month"); // "month" or "year"
  const [showReminders, setShowReminders] = useState(false);
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedReminderIds(user?.id));
  const [readOnlyNotice, setReadOnlyNotice] = useState(null);

  function handleNavigate(target) {
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
    if (!readOnlyNotice) return undefined;
    const timeout = window.setTimeout(() => setReadOnlyNotice(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [readOnlyNotice]);

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
    { id: "dashboard", icon: isAdmin ? "★" : "⌂", label: isAdmin ? "Admin" : "Dashboard" },
    ...(isAdmin ? [{ id: "users", icon: "◎", label: "Users" }] : []),
    ...(user?.role !== "admin" ? [
      { id: "org", icon: "▣", label: currentOrgLabel },
      { id: "income", icon: "↑", label: orgConfig.incomeLabel },
      { id: "expenses", icon: "↓", label: orgConfig.expensesLabel },
      ...(isPersonalOrg ? [{ id: "emi", icon: "◎", label: "EMIs" }] : []),
    ] : []),
    ...(!isAdmin && !hideInvoices && isSmallBusinessOrg ? [{ id: "khata", icon: "◇", label: "Khata" }] : []),
    ...(!hideInvoices ? [{ id: "invoices", icon: "■", label: isAdmin ? "Subscriptions" : orgConfig.invoicesLabel }] : []),
    { id: "settings", icon: "⚙", label: "Settings" }
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

  const activeColor = tabColor[tab];

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

  async function handleSwitchOrganization(orgId) {
    const res = await switchOrganization(orgId);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setTab("dashboard");
    setShowOrgSwitcher(false);
  }

  async function handleDeleteOrganization(orgId) {
    const res = await deleteOrganization(orgId);
    if (res?.error) {
      alert(res.error);
      return;
    }
    setTab("dashboard");
    setShowOrgSwitcher(false);
  }

  function renderTabContent() {
    const fallback = tab === "settings" || (isAdmin && tab === "users")
      ? <SectionSkeleton rows={5} showHero={false} />
      : <SectionSkeleton rows={4} />;

    return (
      <Suspense fallback={fallback}>
        {tab === "dashboard" && (isAdmin ? <AdminPanel year={year} month={month} /> : <Dashboard year={year} month={month} viewMode={viewMode} onNav={handleNavigate} />)}
        {tab === "users" && isAdmin && <AdminUsersSection />}
        {tab === "org" && !isAdmin && <OrgSection navigationTarget={settingsNavigation} sectionMode="org" />}
        {tab === "income" && <IncomeSection year={year} month={month} orgType={currentOrgType} />}
        {tab === "expenses" && <ExpensesSection year={year} month={month} orgType={currentOrgType} />}
        {tab === "emi" && isPersonalOrg && <EmiSection year={year} month={month} orgType={currentOrgType} />}
        {tab === "khata" && !isAdmin && isSmallBusinessOrg && <KhataSection orgType={currentOrgType} />}
        {tab === "invoices" && !hideInvoices && <InvoicesSection year={year} month={month} orgType={currentOrgType} />}
        {tab === "settings" && <SettingsSection navigationTarget={settingsNavigation} />}
      </Suspense>
    );
  }

  return (
    <div className="app-shell" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 0", fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: "var(--text)" }}>
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div style={{ transform: "scale(0.86)", transformOrigin: "center", opacity: 0.98 }}>
          <BrandLogo compact showTagline={false} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowReminders(true)}
            title="Open reminders"
            style={{ width: 34, height: 34, borderRadius: 17, border: "1px solid var(--border)", background: "var(--surface-high)", color: inboxReminders.length ? "var(--gold)" : "var(--text-sec)", cursor: "pointer", position: "relative", fontSize: 16 }}
          >
            !
            {inboxReminders.length > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger)", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {inboxReminders.length}
              </span>
            )}
          </button>
          <button className="theme-toggle" onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrandMark size={32} />
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--text)", lineHeight: 1 }}>
              {TABS.find(item => item.id === tab)?.label}
            </div>
            {!isAdmin && (
              <button
                onClick={() => setShowOrgSwitcher(true)}
                style={{
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "var(--surface-high)",
                  color: activeColor,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  cursor: "pointer",
                  fontFamily: "var(--font)"
                }}
              >
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentOrgLabel}</span>
                <span style={{ color: "var(--text-dim)" }}>v</span>
              </button>
            )}
          </div>
        </div>
        {tab !== "settings" && tab !== "org" && !(isAdmin && tab === "users") && (
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
        )}
        {(tab === "settings" || tab === "org") && (
          <span style={{ fontSize: 13, color: "var(--text-sec)", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name}
          </span>
        )}
      </div>

      {isReadOnlyFreeMode && !isAdmin && (
        <div style={{ margin: "10px 16px 0", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--gold)", background: "var(--gold-deep)", color: "var(--gold)", fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
          Free Plan (Read-only): You can view existing records and download reports. Create, edit, and delete actions require Pro.
        </div>
      )}

      {!isAdmin && user?.subscriptionStatus === "trial" && trialActive && (
        <div style={{ margin: "10px 16px 0", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--accent)", background: "var(--accent-deep)", color: "var(--accent)", fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>
          Pro Trial Active{trialEndLabel ? ` until ${trialEndLabel}` : ""}. You currently have full editing access. Upgrade before trial end to avoid moving to Free read-only mode.
        </div>
      )}

      {readOnlyNotice && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 86, zIndex: 140, display: "flex", justifyContent: "center" }}>
          <div style={{ maxWidth: 520, width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--gold)", background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13, fontWeight: 700, boxShadow: "0 10px 24px rgba(0,0,0,0.25)" }}>
            {readOnlyNotice.message}
          </div>
        </div>
      )}

      <div className="content-scroll">
        {renderTabContent()}
      </div>

      <div className="tab-bar">
        {TABS.map(item => {
          const active = tab === item.id;
          const color = tabColor[item.id];
          return (
            <button key={item.id} className="tab-btn" onClick={() => setTab(item.id)}>
              <span style={{ fontSize: 18, color: active ? color : "var(--text-dim)", transition: "color 0.2s" }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: active ? color : "var(--text-dim)", letterSpacing: 0.4, textTransform: "uppercase" }}>{item.label}</span>
              {active && <div style={{ width: 16, height: 2, borderRadius: 1, background: color }} />}
            </button>
          );
        })}
      </div>

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

      {!isAdmin && (
        <OrganizationSwitcherModal
          open={showOrgSwitcher}
          onClose={() => setShowOrgSwitcher(false)}
          organizations={organizations}
          activeOrgId={activeOrgId}
          onSwitch={handleSwitchOrganization}
          onDelete={handleDeleteOrganization}
        />
      )}
    </div>
  );
}

