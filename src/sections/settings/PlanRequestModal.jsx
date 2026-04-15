import React from "react";
import { Modal, Field, Textarea } from "../../components/UI";
import { BILLING_CYCLES, UPI_CONFIG } from "../../utils/subscription";

/**
 * Subscription upgrade modal — handles Pro plan billing cycle selection
 * and initiates Razorpay checkout.
 *
 * Props:
 *   form         { billingCycle, note }
 *   onFormChange (updater: prev => next) — same signature as setState updater
 *   onSubmit     async () => void
 *   submitting   boolean
 *   onClose      () => void
 */
export default function PlanRequestModal({ form, onFormChange, onSubmit, submitting, onClose }) {
  const billingCycle = form.billingCycle || BILLING_CYCLES.MONTHLY;
  const isMonthly = billingCycle === BILLING_CYCLES.MONTHLY;
  const amount = isMonthly ? UPI_CONFIG.monthlyAmount : UPI_CONFIG.yearlyAmount;

  return (
    <Modal
      title="Upgrade Subscription"
      onClose={onClose}
      onSave={onSubmit}
      saveLabel={submitting ? "Starting..." : "Pay Securely"}
      canSave={!submitting}
    >
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 12 }}>
          Pro plan includes advanced analytics, reminders, and exports.
        </div>

        <Field label="Billing Cycle" required hint="Select the cycle you are paying for.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              [BILLING_CYCLES.MONTHLY, `Monthly - Rs ${UPI_CONFIG.monthlyAmount}`],
              [BILLING_CYCLES.YEARLY, `Yearly - Rs ${UPI_CONFIG.yearlyAmount}`]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="btn-secondary"
                onClick={() => onFormChange(current => ({ ...current, billingCycle: value }))}
                style={{
                  padding: "12px 14px",
                  background: billingCycle === value ? "var(--surface-pop)" : "var(--surface-high)",
                  borderColor: billingCycle === value ? "var(--accent)" : "var(--border)",
                  color: billingCycle === value ? "var(--text)" : "var(--text-sec)"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Payment Details" required hint="You will be redirected to secure Razorpay checkout for this amount.">
          <div className="card" style={{ padding: 14, background: "var(--surface-high)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Payee: {UPI_CONFIG.payeeName}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
              Gateway: Razorpay (UPI, Cards, Netbanking, Wallets, Pay Later)
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>Amount to pay: Rs {amount}</div>
          </div>
        </Field>

        <Field label="Notes" hint="Optional note for your own payment record.">
          <Textarea
            placeholder="Example: Payment from company card or personal UPI."
            value={form.note || ""}
            onChange={event => onFormChange(current => ({ ...current, note: event.target.value }))}
          />
        </Field>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          How activation works
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
          After a successful payment, your subscription is updated automatically. If activation does not
          reflect immediately, wait a moment and refresh the app.
        </div>
      </div>
    </Modal>
  );
}
