import React, { useEffect, useState } from "react";
import { paymentsApi } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { logError } from "../../utils/logger";
import { SectionSkeleton } from "../../components/UI";
import { PLAN_LABELS, PLANS, formatSubscriptionDate } from "../../utils/subscription";

const STATUS_CONFIG = {
  approved: { label: "Approved", bg: "var(--green-deep)", color: "var(--green)" },
  rejected: { label: "Rejected", bg: "var(--danger-deep)", color: "var(--danger)" },
  pending:  { label: "Pending",  bg: "var(--gold-deep)",   color: "var(--gold)" }
};

const CYCLE_LABELS = { monthly: "Monthly", yearly: "Yearly" };

function generateReceiptPDF(record) {
  const planLabel = PLAN_LABELS[record.requestedPlan] || record.requestedPlan || "Pro";
  const cycle = CYCLE_LABELS[record.billingCycle] || record.billingCycle || "";
  const date = record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const amount = record.amount != null ? `Rs ${Number(record.amount).toFixed(2)}` : "—";
  const orderId = record.id || "—";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>EazyKhata Receipt - ${orderId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #111; font-size: 14px; }
    .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header .subtitle { color: #555; font-size: 13px; margin-top: 4px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .label { color: #555; }
    .value { font-weight: 600; }
    .total { border-top: 2px solid #111; padding-top: 14px; margin-top: 14px; font-size: 16px; }
    .footer { margin-top: 40px; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EazyKhata</h1>
    <div class="subtitle">Subscription Receipt</div>
  </div>
  <div class="row"><span class="label">Order ID</span><span class="value">${orderId}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
  <div class="row"><span class="label">Plan</span><span class="value">${planLabel}</span></div>
  <div class="row"><span class="label">Billing Cycle</span><span class="value">${cycle}</span></div>
  <div class="row total"><span class="label">Amount Paid</span><span class="value">${amount}</span></div>
  <div class="footer">Thank you for subscribing to EazyKhata. This receipt is auto-generated.</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
  }
}

export default function SubscriptionHistoryScreen({ onBack }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    paymentsApi.list(user.id)
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(err => {
        logError("Billing history load error", err);
        setError("Could not load billing history. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div style={{ padding: "16px 16px 110px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={onBack}>
          ← Back
        </button>
        <div className="section-label" style={{ marginBottom: 0 }}>Billing History</div>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      {loading ? (
        <SectionSkeleton rows={4} showHero={false} />
      ) : records.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>No payment history</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)" }}>Your subscription payment records will appear here once you make a payment.</div>
        </div>
      ) : (
        <div className="card">
          {records.map((rec, idx) => {
            const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.pending;
            const planLabel = PLAN_LABELS[rec.requestedPlan] || rec.requestedPlan || "Pro";
            const cycle = CYCLE_LABELS[rec.billingCycle] || rec.billingCycle || "";
            const date = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
            const amount = rec.amount != null ? `Rs ${Number(rec.amount).toFixed(0)}` : "—";
            const isApproved = rec.status === "approved";

            return (
              <div
                key={rec.id || idx}
                className="card-row"
                style={{ padding: "12px 14px", alignItems: "flex-start", gap: 12, borderBottom: idx < records.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {planLabel}{cycle ? ` · ${cycle}` : ""}
                    </span>
                    <span className="pill" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
                    {date}{rec.id ? ` · ${rec.id}` : ""}
                    {rec.rejectionReason ? ` · Reason: ${rec.rejectionReason}` : ""}
                    {rec.note && !rec.rejectionReason ? ` · ${rec.note}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{amount}</span>
                  {isApproved && (
                    <button
                      className="btn-secondary"
                      style={{ padding: "5px 10px", fontSize: 11 }}
                      onClick={() => generateReceiptPDF(rec)}
                    >
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
        Only approved payments show a downloadable receipt.
      </div>
    </div>
  );
}
