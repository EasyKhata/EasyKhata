import React,{ useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { MonthNav } from "../components/UI";
import Dashboard from "../sections/Dashboard";
import IncomeSection from "../sections/IncomeSection";
import ExpensesSection from "../sections/ExpensesSection";
import InvoicesSection from "../sections/InvoicesSection";
import SettingsSection from "../sections/SettingsSection";
import AdminPanel from "../sections/AdminPanel";

const now = new Date();

export default function MainApp() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState("dashboard");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const TABS = [
    { id: "dashboard", icon: "⊞", label: "Home" },
    { id: "income",    icon: "↑",  label: "Income" },
    { id: "expenses",  icon: "↓",  label: "Expenses" },
    { id: "invoices",  icon: "◻",  label: "Invoices" },
    { id: "settings",  icon: "⚙",  label: "Settings" },
    ...(user?.role === "admin"
    ? [{ id: "admin", icon: "🛡", label: "Admin" }]
    : [])
  ];

  const tabColor = {
    dashboard: "var(--accent)", income: "var(--accent)", expenses: "var(--danger)",
    invoices: "var(--blue)", settings: "var(--purple)", admin: "var(--purple)"
  };

  const activeColor = tabColor[tab];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      {/* Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 0", fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: "var(--text)" }}>
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: activeColor, letterSpacing: 0.5 }}>Ledger</span>
        <button className="theme-toggle" onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} />
      </div>

      {/* Top Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "var(--text)" }}>
          {TABS.find(t => t.id === tab)?.label}
        </div>
        {tab !== "settings" && (
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        )}
        {tab === "settings" && (
          <span style={{ fontSize: 13, color: "var(--text-sec)", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="content-scroll">
        {tab === "dashboard"  && <Dashboard  year={year} month={month} onNav={setTab} />}
        {tab === "income"     && <IncomeSection   year={year} month={month} />}
        {tab === "expenses"   && <ExpensesSection  year={year} month={month} />}
        {tab === "invoices"   && <InvoicesSection  year={year} month={month} />}
        {tab === "settings"   && <SettingsSection  />}
        {tab === "admin" && <AdminPanel />}
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map(t => {
          const active = tab === t.id;
          const col = tabColor[t.id];
          return (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 18, color: active ? col : "var(--text-dim)", transition: "color 0.2s" }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: active ? col : "var(--text-dim)", letterSpacing: 0.4, textTransform: "uppercase" }}>{t.label}</span>
              {active && <div style={{ width: 16, height: 2, borderRadius: 1, background: col }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}