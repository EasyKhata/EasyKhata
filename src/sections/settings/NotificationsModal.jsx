import React from "react";
import { Modal } from "../../components/UI";

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="card-row">
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.3s",
          background: checked ? "var(--accent)" : "var(--border)"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? undefined : 3,
            right: checked ? 3 : undefined,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: "#fff",
            transition: "all 0.3s"
          }}
        />
      </button>
    </div>
  );
}

/**
 * Notification preferences modal.
 *
 * Props:
 *   form         notification preferences object
 *   onFormChange (updater: prev => next)
 *   onSave       () => void
 *   onClose      () => void
 *   orgConfig    org config object (controls which toggles are shown)
 */
export default function NotificationsModal({ form, onFormChange, onSave, onClose, orgConfig }) {
  return (
    <Modal title="Notifications" onClose={onClose} onSave={onSave} saveLabel="Save">
      <div className="card">
        <ToggleRow
          label="Browser Notifications"
          sub="Show system popups for important reminders when your browser allows it."
          checked={Boolean(form?.browserEnabled)}
          onChange={() => onFormChange(current => ({ ...current, browserEnabled: !current.browserEnabled }))}
        />
        {orgConfig.hideInvoices !== true && (
          <>
            <ToggleRow
              label="Due Soon Invoices"
              sub="Warn when invoices are due within the next 3 days."
              checked={Boolean(form?.invoiceDue)}
              onChange={() => onFormChange(current => ({ ...current, invoiceDue: !current.invoiceDue }))}
            />
            <ToggleRow
              label="Overdue Invoices"
              sub="Highlight invoices that have passed their due date."
              checked={Boolean(form?.overdueInvoices)}
              onChange={() => onFormChange(current => ({ ...current, overdueInvoices: !current.overdueInvoices }))}
            />
          </>
        )}
        {orgConfig.enableBudgets !== false && (
          <ToggleRow
            label="Budget Alerts"
            sub="Alert when category budgets are fully used."
            checked={Boolean(form?.budgetAlerts)}
            onChange={() => onFormChange(current => ({ ...current, budgetAlerts: !current.budgetAlerts }))}
          />
        )}
        <ToggleRow
          label="Low Balance"
          sub="Warn when the current month is running at a loss."
          checked={Boolean(form?.lowBalance)}
          onChange={() => onFormChange(current => ({ ...current, lowBalance: !current.lowBalance }))}
        />
        <ToggleRow
          label="High Spending"
          sub="Alert when this month is sharply above your recent spending average."
          checked={Boolean(form?.spendingSpike)}
          onChange={() => onFormChange(current => ({ ...current, spendingSpike: !current.spendingSpike }))}
        />
      </div>
    </Modal>
  );
}
