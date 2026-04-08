import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import { Modal, MonthNav } from "../components/UI";
import Dashboard from "../sections/Dashboard";
import IncomeSection from "../sections/IncomeSection";
import ExpensesSection from "../sections/ExpensesSection";
import InvoicesSection from "../sections/InvoicesSection";
import SettingsSection from "../sections/SettingsSection";
import AdminPanel from "../sections/AdminPanel";
import {
  buildReminders,
  filterRemindersByPrefs,
  getDismissedReminderIds,
  getSentBrowserReminderIds,
  saveDismissedReminderIds,
  saveSentBrowserReminderIds
} from "../utils/reminders";

const now = new Date();

export default function MainApp() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const data = useData();
  const [tab, setTab] = useState("dashboard");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showReminders, setShowReminders] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => getDismissedReminderIds(user?.id));

  useEffect(() => {
    const handleNavigate = event => {
      if (event?.detail) setTab(event.detail);
    };
    window.addEventListener("ledger:navigate", handleNavigate);
    return () => window.removeEventListener("ledger:navigate", handleNavigate);
  }, []);

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

  const TABS = [
    { id: "dashboard", icon: "⌂", label: "Home" },
    { id: "income", icon: "↑", label: "Income" },
    { id: "expenses", icon: "↓", label: "Expenses" },
    { id: "invoices", icon: "■", label: "Invoices" },
    { id: "settings", icon: "⚙", label: "Settings" },
    ...(user?.role === "admin" ? [{ id: "admin", icon: "🛡", label: "Admin" }] : [])
  ];

  const tabColor = {
    dashboard: "var(--accent)",
    income: "var(--accent)",
    expenses: "var(--danger)",
    invoices: "var(--blue)",
    settings: "var(--purple)",
    admin: "var(--purple)"
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
    setTab(reminder.tab || "dashboard");
    dismissReminder(reminder.id);
    setShowReminders(false);
  }

  return (
    <div className="app-shell" style={{ minHeight: "100vh", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 0", fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: "var(--text)" }}>
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: activeColor, letterSpacing: 0.5 }}>Ledger</span>
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
        <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "var(--text)" }}>
          {TABS.find(item => item.id === tab)?.label}
        </div>
        {tab !== "settings" && <MonthNav year={year} month={month} onChange={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }} />}
        {tab === "settings" && (
          <span style={{ fontSize: 13, color: "var(--text-sec)", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name}
          </span>
        )}
      </div>

      <div className="content-scroll">
        {tab === "dashboard" && <Dashboard year={year} month={month} onNav={setTab} />}
        {tab === "income" && <IncomeSection year={year} month={month} />}
        {tab === "expenses" && <ExpensesSection year={year} month={month} />}
        {tab === "invoices" && <InvoicesSection year={year} month={month} />}
        {tab === "settings" && <SettingsSection />}
        {tab === "admin" && <AdminPanel />}
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
    </div>
  );
}
