import React from "react";
import { Modal, Field, Select, Textarea } from "../../components/UI";
import { BILLING_CYCLES, PLANS, UPI_CONFIG, getBillingAmount, isPaidActive } from "../../utils/subscription";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../../utils/orgTypes";
import { isNative } from "../../utils/native";

export default function PlanRequestModal({
  form,
  onFormChange,
  onSubmit,
  submitting,
  onClose,
  orgType = ORG_TYPES.FREELANCER,
  orgName = "",
  orgId = "",
  user = null,
  organizations = [],
  selectedOrgId = "",
  onSelectedOrgIdChange,
  lockedOrgSelection = false
}) {
  const selectedOrg = organizations.find(org => org.id === selectedOrgId) || null;
  const normalizedOrgType = getOrgType(selectedOrg?.organizationType || orgType);
  const orgConfig = getOrgConfig(normalizedOrgType);
  const displayOrgName = String(selectedOrg?.name || orgName || "Current Khata").trim();
  const displayOrgId = selectedOrg?.id || orgId;
  const selectedOrgActive = Boolean(selectedOrg && isPaidActive(user, { account: selectedOrg, organizationType: selectedOrg.organizationType }));
  const billingCycle = form.billingCycle || BILLING_CYCLES.MONTHLY;
  const monthlyAmount = getBillingAmount(BILLING_CYCLES.MONTHLY, PLANS.PRO, normalizedOrgType);
  const yearlyAmount  = getBillingAmount(BILLING_CYCLES.YEARLY,  PLANS.PRO, normalizedOrgType);
  const amount = billingCycle === BILLING_CYCLES.MONTHLY ? monthlyAmount : yearlyAmount;

  return (
    <Modal
      title="Upgrade This Khata"
      onClose={onClose}
      onSave={onSubmit}
      saveLabel={selectedOrgActive ? "Already Active" : submitting ? "Starting..." : isNative ? "Upgrade on Website" : "Pay Securely"}
      canSave={!submitting && !selectedOrgActive}
    >
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 12 }}>
          Pro will be activated only for the Khata shown below. Other Khatas keep their own plan and billing status.
        </div>

        {organizations.length > 1 && !lockedOrgSelection && (
          <Field label="Select Khata" required hint="Choose exactly which Khata this payment should activate.">
            <Select value={selectedOrgId || displayOrgId} onChange={event => onSelectedOrgIdChange?.(event.target.value)}>
              {organizations.map(org => {
                const cfg = getOrgConfig(org.organizationType);
                const active = isPaidActive(user, { account: org, organizationType: org.organizationType });
                return (
                  <option key={org.id} value={org.id}>
                    {org.name} - {cfg.typeLabel}{active ? " - Pro active" : ""}
                  </option>
                );
              })}
            </Select>
          </Field>
        )}

        <div style={{ padding: 14, background: "var(--surface-high)", border: "1px solid var(--accent)", borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>
            Paying for
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.25 }}>
            {displayOrgName}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4 }}>
            {orgConfig.typeLabel} Khata{displayOrgId ? ` • ${displayOrgId}` : ""}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, lineHeight: 1.45 }}>
            {selectedOrgActive ? "This Khata already has an active Pro plan." : "Payment will unlock Pro features for this Khata only."}
          </div>
        </div>

        <Field label="Billing Cycle" required hint="Select the cycle you are paying for.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              [BILLING_CYCLES.MONTHLY, `Monthly - Rs ${monthlyAmount}`],
              [BILLING_CYCLES.YEARLY,  `Yearly - Rs ${yearlyAmount}`]
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
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Amount to pay: Rs {amount}<br />
              Activation target: {displayOrgName}
            </div>
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
          After a successful payment, Pro is applied to this Khata automatically. If you switch to another
          Khata, that Khata may still show a different plan until it is paid separately.
        </div>
      </div>
    </Modal>
  );
}
