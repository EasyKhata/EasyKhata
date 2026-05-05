import React from "react";
import { Modal, Field, Textarea } from "../../components/UI";
import {
  BILLING_CYCLES,
  PLANS,
  PLAN_LABELS,
  UPI_CONFIG,
  canCreatePaidOrg,
  getBillingAmount,
  getOwnedPaidOrgCount,
  getPaidOrgLimit,
  isPaidActive
} from "../../utils/subscription";
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
  user = null,
  organizations = [],
  lockedOrgSelection = false
}) {
  const targetPlan = form.targetPlan || PLANS.PRO;
  const billingCycle = form.billingCycle || BILLING_CYCLES.MONTHLY;
  const normalizedOrgType = getOrgType(orgType);
  const orgConfig = getOrgConfig(normalizedOrgType);
  const displayOrgName = String(orgName || "").trim();
  const paidOrgCount = getOwnedPaidOrgCount(organizations);
  const currentActive = isPaidActive(user);
  const creatingNewKhata = Boolean(lockedOrgSelection && displayOrgName);
  const planOptions = [
    {
      id: PLANS.PRO,
      title: "Pro",
      subtitle: "1 free Household + 2 paid Khatas",
      monthly: getBillingAmount(BILLING_CYCLES.MONTHLY, PLANS.PRO),
      yearly: getBillingAmount(BILLING_CYCLES.YEARLY, PLANS.PRO)
    },
    {
      id: PLANS.BUSINESS,
      title: "Business",
      subtitle: "1 free Household + 5 paid Khatas",
      monthly: getBillingAmount(BILLING_CYCLES.MONTHLY, PLANS.BUSINESS),
      yearly: getBillingAmount(BILLING_CYCLES.YEARLY, PLANS.BUSINESS)
    }
  ];
  const amount = getBillingAmount(billingCycle, targetPlan);
  const selectedLimit = getPaidOrgLimit(targetPlan);
  const canUseSelectedPlan = !creatingNewKhata || canCreatePaidOrg(user, organizations, targetPlan);

  return (
    <Modal
      title={creatingNewKhata ? "Choose Plan to Create Khata" : "Manage Subscription"}
      onClose={onClose}
      onSave={onSubmit}
      saveLabel={submitting ? "Starting..." : isNative ? "Upgrade on Website" : `Pay Rs ${amount}`}
      canSave={!submitting && canUseSelectedPlan}
    >
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 12 }}>
          Subscription now applies to your account, not one specific Khata. Household remains free and does not use a paid slot.
        </div>

        {creatingNewKhata && (
          <div style={{ padding: 14, background: "var(--surface-high)", border: "1px solid var(--accent)", borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>
              Creating
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", lineHeight: 1.25 }}>
              {displayOrgName}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 4 }}>
              {orgConfig.typeLabel} Khata
            </div>
          </div>
        )}

        <Field label="Select Plan" required hint={`You are using ${paidOrgCount} paid Khata${paidOrgCount === 1 ? "" : "s"} right now.`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {planOptions.map(option => {
              const selected = targetPlan === option.id;
              const disabled = creatingNewKhata && !canCreatePaidOrg(user, organizations, option.id);
              const price = billingCycle === BILLING_CYCLES.YEARLY ? option.yearly : option.monthly;
              return (
                <button
                  key={option.id}
                  type="button"
                  className="btn-secondary"
                  disabled={disabled}
                  onClick={() => onFormChange(current => ({ ...current, targetPlan: option.id }))}
                  style={{
                    padding: "13px 14px",
                    textAlign: "left",
                    opacity: disabled ? 0.48 : 1,
                    background: selected ? "var(--surface-pop)" : "var(--surface-high)",
                    borderColor: selected ? "var(--accent)" : "var(--border)",
                    color: selected ? "var(--text)" : "var(--text-sec)"
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{option.title}</div>
                  <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>{option.subtitle}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent)", marginTop: 8 }}>Rs {price}</div>
                  {disabled && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>Not enough Khata slots</div>}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Billing Cycle" required>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              [BILLING_CYCLES.MONTHLY, `Monthly - Rs ${getBillingAmount(BILLING_CYCLES.MONTHLY, targetPlan)}`],
              [BILLING_CYCLES.YEARLY, `Yearly - Rs ${getBillingAmount(BILLING_CYCLES.YEARLY, targetPlan)}`]
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
              Plan: {PLAN_LABELS[targetPlan]} - {selectedLimit} paid Khatas<br />
              Current usage: {paidOrgCount}/{selectedLimit} paid Khatas{currentActive ? "" : " after activation"}
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
          After payment, your selected plan unlocks paid Khata slots for your account. Shared admin or viewer Khatas do not count against your limit.
        </div>
      </div>
    </Modal>
  );
}
