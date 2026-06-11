import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, MONTHS, DashboardSkeleton, WorkflowActionStrip, WorkflowSetupCard } from "../components/UI";
import { RupeeDisplay, HealthArc, Sparkline, ProgressLine, StatChip, TimelineEntry } from "../components/ui/reimagined";
import Tilt3D from "../components/Tilt3D";
import { logError } from "../utils/logger";
import {
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  invoiceGrandTotal
} from "../utils/analytics";
import { orgsApi, messagesApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/DialogContext";
import { showGlobalToast } from "../context/ToastContext";
import { PLANS, canUseFeature, formatSubscriptionDate, getUserPlan, isReviewAccessEnabled } from "../utils/subscription";
import OnboardingGuide from "../components/OnboardingGuide";
import Collapsible from "../components/Collapsible";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";
import AdCarousel from "../components/AdCarousel";

// Build a wa.me deep link with a pre-filled dues reminder. Indian 10-digit
// numbers get the 91 country code; anything else passes through as digits.
function buildWhatsAppReminderLink({ phone, ownerName, flatName, amount, monthLabel, societyName, monthsPending }) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  const target = digits.length === 10 ? `91${digits}` : digits;
  const greeting = ownerName ? `Hi ${ownerName},` : "Hi,";
  const amountText = amount ? `of Rs ${Number(amount).toLocaleString("en-IN")} ` : "";
  const overdueText = monthsPending > 1 ? ` Dues are pending for ${monthsPending} months.` : "";
  const message = `${greeting} a gentle reminder from ${societyName || "your society"} — maintenance ${amountText}for ${monthLabel} is pending for flat ${flatName}.${overdueText} Kindly pay at the earliest. Thank you!`;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

function CollectionStatusGrid({ flats, income, sym, month, year, onNav, societyName, isViewerMode, onMarkPaid, onPostSummary }) {
  const [expandedFlat, setExpandedFlat] = useState(null);
  const [showPaid, setShowPaid] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [shareState, setShareState] = useState(""); // "" | "posting" | "copied"

  if (!flats.length) return null;

  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;

  const incomeByMonth = {};
  (income || []).forEach(item => {
    if (String(item.collectionType || "Monthly Maintenance").trim().toLowerCase() !== "monthly maintenance") return;
    const itemMk = item.collectionMonth || item.month || (item.date ? item.date.slice(0, 7) : "");
    const flatNum = String(item.flatNumber || "").trim().toLowerCase();
    if (!itemMk || !flatNum) return;
    if (!incomeByMonth[itemMk]) incomeByMonth[itemMk] = new Set();
    incomeByMonth[itemMk].add(flatNum);
  });

  // Earliest month any maintenance was collected — months before this are N/A, not defaulted
  const allMonthKeys = Object.keys(incomeByMonth).sort();
  const startMonthKey = allMonthKeys[0] || mk;

  const paidSet = incomeByMonth[mk] || new Set();

  const last12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, month - (11 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]
    };
  });

  // Only flats with monthlyMaintenance > 0 are tracked as pending/paid (matches API logic)
  const flatData = flats.map(flat => {
    const flatKey = String(flat.name || "").trim().toLowerCase();
    const hasMaintenance = Number(flat.monthlyMaintenance || 0) > 0;
    const isPaid = hasMaintenance && paidSet.has(flatKey);
    const isPending = hasMaintenance && !isPaid;
    let missedRecent = 0;
    if (isPending) {
      for (let i = 1; i <= 3; i++) {
        const d = new Date(year, month - i, 1);
        const pastMk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (pastMk < startMonthKey) continue; // months before collection started don't count as missed
        if (!incomeByMonth[pastMk]?.has(flatKey)) missedRecent++;
      }
    }
    const isChronic = isPending && missedRecent >= 2;
    return { flat, flatKey, isPaid, isPending, isChronic, hasMaintenance };
  });

  const chronic = flatData.filter(f => f.isChronic);
  const pending = flatData.filter(f => f.isPending && !f.isChronic);
  const paid = flatData.filter(f => f.isPaid);
  const noAmount = flatData.filter(f => !f.hasMaintenance);
  const expandedData = expandedFlat ? flatData.find(f => f.flatKey === expandedFlat) : null;

  function FlatChip({ fd }) {
    const { flat, flatKey, isPaid, isChronic } = fd;
    const isExpanded = expandedFlat === flatKey;
    const dotColor = isChronic ? "var(--danger)" : isPaid ? "var(--jade)" : "var(--saffron)";
    return (
      <button
        type="button"
        onClick={() => setExpandedFlat(isExpanded ? null : flatKey)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 9px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${isExpanded ? "var(--accent)" : "var(--border)"}`,
          background: isExpanded ? "color-mix(in srgb, var(--accent) 8%, var(--bg))"
            : isPaid ? "color-mix(in srgb, var(--jade) 5%, var(--bg))"
            : isChronic ? "color-mix(in srgb, var(--danger) 6%, var(--bg))"
            : "color-mix(in srgb, var(--saffron) 5%, var(--bg))"
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{flat.name || "—"}</span>
        {isChronic && <span style={{ fontSize: 10, fontWeight: 800, color: "var(--danger)", lineHeight: 1 }}>!</span>}
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Collection Status · {MONTHS[month]}</div>
          <div style={{ fontSize: 11, marginTop: 3 }}>
            <span style={{ color: "var(--jade)", fontWeight: 700 }}>{paid.length} paid</span>
            {(pending.length + chronic.length) > 0 && <span style={{ color: "var(--saffron)", fontWeight: 700 }}> · {pending.length + chronic.length} pending</span>}
            {chronic.length > 0 && <span style={{ color: "var(--danger)", fontWeight: 800 }}> · {chronic.length} long overdue</span>}
            {noAmount.length > 0 && <span style={{ color: "var(--text-dim)" }}> · {noAmount.length} no amount set</span>}
          </div>
        </div>
        <button type="button" onClick={() => onNav("income")}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", fontWeight: 700, padding: 0 }}>
          Manage →
        </button>
      </div>

      {/* All clear */}
      {chronic.length === 0 && pending.length === 0 && paid.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--jade)", fontWeight: 700, marginBottom: 10 }}>
          ✓ All maintenance collected for {MONTHS[month]}
        </div>
      )}

      {/* Long-overdue — always visible */}
      {chronic.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Overdue 3+ months</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chronic.map(fd => <FlatChip key={fd.flatKey} fd={fd} />)}
          </div>
        </div>
      )}

      {/* Pending — always visible */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {chronic.length > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Pending</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pending.map(fd => <FlatChip key={fd.flatKey} fd={fd} />)}
          </div>
        </div>
      )}

      {/* Paid — collapsed by default */}
      {paid.length > 0 && (
        <div style={{ marginTop: chronic.length === 0 && pending.length === 0 ? 0 : 4 }}>
          <button type="button" onClick={() => setShowPaid(v => !v)}
            style={{ background: "none", border: "none", fontSize: 12, color: "var(--text-dim)", cursor: "pointer", padding: "2px 0", fontWeight: 600 }}>
            {showPaid ? `▴ Hide ${paid.length} paid` : `▾ Show ${paid.length} paid`}
          </button>
          {showPaid && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {paid.map(fd => <FlatChip key={fd.flatKey} fd={fd} />)}
            </div>
          )}
        </div>
      )}

      {/* 12-month history panel */}
      {expandedData && (() => {
        const monthsPending = last12.filter(({ key }) => key <= mk && key >= startMonthKey && !incomeByMonth[key]?.has(expandedData.flatKey)).length;
        const reminderPhone = expandedData.flat.phone || expandedData.flat.ownerPhone || expandedData.flat.tenantPhone || "";
        const reminderLink = !expandedData.isPaid ? buildWhatsAppReminderLink({
          phone: reminderPhone,
          ownerName: expandedData.flat.ownerName || expandedData.flat.tenantName || "",
          flatName: expandedData.flat.name || "",
          amount: Number(expandedData.flat.monthlyMaintenance || 0),
          monthLabel: `${MONTHS[month]} ${year}`,
          societyName,
          monthsPending
        }) : "";
        return (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--surface-high)", borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{expandedData.flat.name}</div>
                {expandedData.flat.ownerName && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{expandedData.flat.ownerName}</div>}
                {expandedData.isChronic && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--danger)", marginTop: 3 }}>Overdue for 3+ months</div>}
              </div>
              {expandedData.flat.monthlyMaintenance && (
                <div style={{ fontSize: 12, color: "var(--text-dim)", flexShrink: 0 }}>
                  {sym}{Number(expandedData.flat.monthlyMaintenance).toLocaleString("en-IN")}/mo
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {last12.map(({ key, label }) => {
                const isFuture = key > mk;
                const isBeforeStart = key < startMonthKey;
                const wasPaid = !isFuture && !isBeforeStart && incomeByMonth[key]?.has(expandedData.flatKey);
                const dotBg = (isFuture || isBeforeStart) ? "var(--border)" : wasPaid ? "var(--jade)" : "var(--saffron)";
                const dotOpacity = isFuture ? 0.25 : isBeforeStart ? 0.3 : 1;
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: dotBg, opacity: dotOpacity }} />
                    <span style={{ fontSize: 9, color: "var(--text-dim)", fontWeight: 600, opacity: isBeforeStart ? 0.4 : 1 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            {/* The actions that actually collect money: record the payment in
                one tap, or chase it on WhatsApp. Hidden for viewers and paid flats. */}
            {!isViewerMode && !expandedData.isPaid && (
              <>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  {onMarkPaid && Number(expandedData.flat.monthlyMaintenance || 0) > 0 && (
                    <button
                      type="button"
                      disabled={markingPaid}
                      onClick={async () => {
                        setMarkingPaid(true);
                        try { await onMarkPaid(expandedData); } finally { setMarkingPaid(false); }
                      }}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 14px", borderRadius: 12, background: "var(--accent)", color: "#06251C", fontSize: 13, fontWeight: 800, border: 0, cursor: markingPaid ? "wait" : "pointer", opacity: markingPaid ? 0.6 : 1 }}
                    >
                      {markingPaid ? "Recording..." : "Mark as Paid"}
                    </button>
                  )}
                  {reminderLink && (
                    <a
                      href={reminderLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 14px", borderRadius: 12, background: "#25D366", color: "#06251C", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                    >
                      <MessageCircle size={15} strokeWidth={2.4} />
                      Remind
                    </a>
                  )}
                </div>
                {!reminderLink && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)", textAlign: "center" }}>
                    Add a phone number to this flat to send WhatsApp reminders.
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Share the month's dues summary — post to the in-app group chat (the
          digital notice board) or copy for an external WhatsApp group. */}
      {!isViewerMode && (pending.length + chronic.length) > 0 && (() => {
        const totalTracked = paid.length + pending.length + chronic.length;
        const summaryLines = [
          `${societyName || "Society"} — ${MONTHS[month]} ${year} maintenance update`,
          `Paid: ${paid.length}/${totalTracked} flats`
        ];
        if (pending.length) summaryLines.push(`Pending: ${pending.map(f => f.flat.name).join(", ")}`);
        if (chronic.length) summaryLines.push(`Overdue 3+ months: ${chronic.map(f => f.flat.name).join(", ")}`);
        summaryLines.push("Request all residents to clear dues at the earliest. Thank you!");
        const summaryText = summaryLines.join("\n");
        return (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {onPostSummary && (
              <button
                type="button"
                disabled={shareState === "posting"}
                onClick={async () => {
                  setShareState("posting");
                  try { await onPostSummary(summaryText); } finally { setShareState(""); }
                }}
                className="btn-secondary"
                style={{ flex: 1, fontSize: 12, fontWeight: 700, opacity: shareState === "posting" ? 0.6 : 1 }}
              >
                {shareState === "posting" ? "Posting..." : "Post summary to chat"}
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(summaryText);
                  setShareState("copied");
                  setTimeout(() => setShareState(""), 2000);
                } catch { /* clipboard unavailable — ignore */ }
              }}
              className="btn-secondary"
              style={{ flex: 1, fontSize: 12, fontWeight: 700 }}
            >
              {shareState === "copied" ? "Copied ✓" : "Copy summary"}
            </button>
          </div>
        );
      })()}

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        {[["var(--jade)", "Paid"], ["var(--saffron)", "Pending"], ["var(--danger)", "Overdue 3+ mo"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function toLocalDateKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentFinancialYearWindow(date = new Date()) {
  const currentYear = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? currentYear : currentYear - 1;
  return {
    start: `${startYear}-04-01`,
    end: toLocalDateKey(date),
    label: `FY ${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`
  };
}

function getRecordDateKey(record) {
  if (!record) return "";
  if (record.date) return String(record.date).slice(0, 10);
  if (record.paidDate) return String(record.paidDate).slice(0, 10);
  if (record.month) return `${String(record.month).slice(0, 7)}-01`;
  return "";
}

function isBetweenDateKeys(dateKey, start, end) {
  return Boolean(dateKey) && dateKey >= start && dateKey <= end;
}

function sumDatedRecords(records, window, getAmount = record => Number(record?.amount || 0)) {
  return (records || []).reduce((sum, record) => {
    const dateKey = getRecordDateKey(record);
    if (!isBetweenDateKeys(dateKey, window.start, window.end)) return sum;
    return sum + Number(getAmount(record) || 0);
  }, 0);
}

function buildFinancialYearSummary(data, window, { includePaidInvoices = false } = {}) {
  const incomeTotal = sumDatedRecords(data.income, window);
  const expenseTotal = sumDatedRecords(data.expenses, window);
  const paidInvoiceTotal = includePaidInvoices
    ? sumDatedRecords(
        (data.invoices || []).filter(invoice => (
          String(invoice?.documentType || "invoice") === "invoice"
          && String(invoice?.status || "").toLowerCase() === "paid"
        )),
        window,
        invoice => Number(invoice?.grandTotal || invoiceGrandTotal(invoice) || invoice?.total || 0)
      )
    : 0;
  const totalIncome = incomeTotal + paidInvoiceTotal;

  return {
    ...window,
    income: totalIncome,
    expenses: expenseTotal,
    balance: totalIncome - expenseTotal
  };
}

function FinancialYearSummaryCard({ summary, sym, incomeLabel = "Income", expenseLabel = "Expenses" }) {
  const balanceColor = Number(summary.balance || 0) >= 0 ? "var(--jade)" : "var(--ember)";
  const items = [
    { label: incomeLabel, value: summary.income, color: "var(--jade)" },
    { label: expenseLabel, value: summary.expenses, color: "var(--ember)" },
    { label: "Balance", value: summary.balance, color: balanceColor }
  ];

  return (
    <div className="card-leather anim-fade-up-2" style={{ padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div className="section-eyebrow" style={{ marginBottom: 5 }}>{summary.label} · Till today</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Financial year so far</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <RupeeDisplay amount={summary.balance} color={balanceColor} size={22} />
          <div style={{ fontSize: 10, color: "var(--cream-3)", marginTop: 2 }}>Net</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ minWidth: 0, padding: "10px 8px", borderRadius: 10, border: "1px solid var(--line-2)", background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </div>
            <div style={{ fontSize: "clamp(13px, 3.4vw, 17px)", fontWeight: 900, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {fmtMoney(Number(item.value || 0), sym)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ year, month, viewMode: propViewMode, onNav, headerDatePicker }) {
  const data = useData();
  const { activeSharedOrgKey, collectionFetched, isViewerMode } = data;
  const { user, updateProfile } = useAuth();
  const confirm = useConfirm();
  const sym = data.currency?.symbol || "Rs";
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [viewMode, setViewMode] = useState(propViewMode || "month"); // "month" or "year"
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const dashboardCache = useRef(new Map());

  // Eagerly load all collections so dashboard cards and analytics reflect real data
  // without requiring the user to visit each section tab first.
  useEffect(() => {
    if (!data.loaded || !data.activeOrgId) return;
    let cancelled = false;
    (async () => {
      for (const key of ["income", "expenses", "invoices"]) {
        if (cancelled) return;
        await data.ensureCollectionLoaded?.(key);
      }
    })();
    return () => { cancelled = true; };
  }, [data.ensureCollectionLoaded, data.loaded, data.activeOrgId]);

  // Show setup guide for normal users on first visit
  useEffect(() => {
    setViewMode(propViewMode || "month");
  }, [propViewMode]);

  // Never show the setup guide when viewing a shared org — it belongs to the member's own account
  useEffect(() => {
    if (activeSharedOrgKey || !data.loaded || data.offlineMode || !user?.id || user?.offlineProfile || user?.onboardingSeenAt) {
      setShowSetupGuide(false);
      return;
    }
    const ownedOrganizations = Array.isArray(data.organizations) ? data.organizations : [];
    setShowSetupGuide(ownedOrganizations.length === 1);
  }, [activeSharedOrgKey, data.loaded, data.offlineMode, data.organizations, user?.id, user?.offlineProfile, user?.onboardingSeenAt]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const orgType = getOrgType(data.account?.organizationType || user?.organizationType);
  const isApartmentOrg = orgType === ORG_TYPES.APARTMENT;
  const isFreelancerOrg = orgType === ORG_TYPES.FREELANCER;
  const orgConfig = getOrgConfig(orgType);
  const financialYearWindow = useMemo(() => getCurrentFinancialYearWindow(), []);
  const financialYearSummary = useMemo(() => (
    buildFinancialYearSummary(data, financialYearWindow, {
      includePaidInvoices: isFreelancerOrg
    })
  ), [data.income, data.expenses, data.invoices, financialYearWindow, isFreelancerOrg]);
  const EMPTY_STATS = {
    profit: 0, netAfterEmi: 0, totalIncome: 0, totalExpense: 0,
    cashFlow: [], monthlyBreakdown: [],
    pendingInvoices: [], overdueInvoices: [], dueSoonInvoices: [],
    topExpenseCategories: [], topCustomers: [], highRiskCustomers: [],
    alertItems: [], upcomingEmis: [], actionTips: [],
    unpaidFlats: [], pendingCustomers: [], partnersWithBalance: [],
    lowStockProducts: []
  };
  const normalizeStats = (result) => ({
    ...EMPTY_STATS,
    ...result,
    cashFlow: Array.isArray(result?.cashFlow) ? result.cashFlow : [],
    monthlyBreakdown: Array.isArray(result?.monthlyBreakdown) ? result.monthlyBreakdown : [],
    pendingInvoices: Array.isArray(result?.pendingInvoices) ? result.pendingInvoices : [],
    overdueInvoices: Array.isArray(result?.overdueInvoices) ? result.overdueInvoices : [],
    dueSoonInvoices: Array.isArray(result?.dueSoonInvoices) ? result.dueSoonInvoices : [],
    topExpenseCategories: Array.isArray(result?.topExpenseCategories) ? result.topExpenseCategories : [],
    topCustomers: Array.isArray(result?.topCustomers) ? result.topCustomers : [],
    highRiskCustomers: Array.isArray(result?.highRiskCustomers) ? result.highRiskCustomers : [],
    alertItems: Array.isArray(result?.alertItems) ? result.alertItems : [],
    upcomingEmis: Array.isArray(result?.upcomingEmis) ? result.upcomingEmis : [],
    actionTips: Array.isArray(result?.actionTips) ? result.actionTips : [],
    unpaidFlats: Array.isArray(result?.unpaidFlats) ? result.unpaidFlats : [],
    pendingCustomers: Array.isArray(result?.pendingCustomers) ? result.pendingCustomers : [],
    partnersWithBalance: Array.isArray(result?.partnersWithBalance) ? result.partnersWithBalance : [],
    lowStockProducts: Array.isArray(result?.lowStockProducts) ? result.lowStockProducts : []
  });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // Reset stale stats when loading starts so old shared-org data doesn't render
    if (!data.loaded) { setStats(EMPTY_STATS); return; }
    if (!user?.id || !data.activeOrgId) return;
    const sharedInfo = data.activeSharedOrgKey
      ? (data.sharedOrgs || []).find(org => org.key === data.activeSharedOrgKey)
      : null;
    const dashboardUserId = sharedInfo?.ownerId || user?.id;
    const cacheKey = `${dashboardUserId}-${data.activeOrgId}-${year}-${month}-${viewMode}`;
    const cached = dashboardCache.current.get(cacheKey);
    if (cached) {
      setStats(cached);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    orgsApi.getDashboard(dashboardUserId, data.activeOrgId, year, month, viewMode)
      .then(result => {
        if (!cancelled) {
          const normalized = normalizeStats(result);
          dashboardCache.current.set(cacheKey, normalized);
          setStats(normalized);
        }
      })
      .catch(err => logError("dashboard fetch", err))
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [data.loaded, data.activeOrgId, data.activeSharedOrgKey, data.sharedOrgs, user?.id, year, month, viewMode]);
  const showAdvanced = canUseFeature(user, "advancedAnalytics");
  const currentPlan = getUserPlan(user);
  const isTrial = user?.subscriptionStatus === "trial";
  const reviewAccessEnabled = isReviewAccessEnabled();
  const hasCustomerRecord = (data.customers || []).length > 0;
  const hasInvoiceRecord = (data.invoices || []).some(item => String(item?.documentType || "invoice") === "invoice");
  const hasIncomeRecord = (data.income || []).length > 0;

  const heroTone = stats.profit >= 0 ? "var(--accent)" : "var(--danger)";
  const heroSub = viewMode === "month"
    ? (stats.profit >= 0 ? "You are staying profitable this month." : "Expenses are ahead of receipts this month.")
    : (stats.profit >= 0 ? "You're profitable for the year." : "Expenses exceed receipts for the year.");
  
  const maxCashFlow = useMemo(() => (
    viewMode === "month"
      ? Math.max(1, ...(stats.cashFlow || []).map(item => Math.max(item.income, item.expenses)))
      : Math.max(1, ...(stats.monthlyBreakdown || []).map(item => Math.max(item.income, item.expenses)))
  ), [stats.cashFlow, stats.monthlyBreakdown, viewMode]);

  const top5Expenses = useMemo(() => {
    if (!collectionFetched?.expenses && Array.isArray(stats.topExpenseCategories) && stats.topExpenseCategories.length > 0) {
      return stats.topExpenseCategories.slice(0, 5).map(category => ({
        id: `category_${category.category}`,
        category: category.category,
        note: category.category,
        amount: category.amount,
        isCategorySummary: true
      }));
    }
    const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
    return (data.expenses || [])
      .filter(e => {
        if (viewMode === "month") {
          const em = e.month || (e.date ? e.date.slice(0, 7) : "");
          return em === mk;
        }
        const ey = e.month ? e.month.slice(0, 4) : (e.date ? e.date.slice(0, 4) : "");
        return ey === String(year);
      })
      .slice()
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
      .slice(0, 5);
  }, [collectionFetched?.expenses, data.expenses, month, stats.topExpenseCategories, year, viewMode]);

  const apartmentActions = isViewerMode ? [] : [
    { label: "Add collection", onClick: () => onNav("income"), tone: "accent", dot: true },
    { label: "Add expense", onClick: () => onNav("expenses"), tone: "danger" },
    { label: "Residents", onClick: () => onNav({ tab: "org", screen: "customers" }), tone: "gold" }
  ];
  const apartmentSummary = (stats.unpaidFlats?.length || 0) > 0
    ? {
        title: "Pending flats need follow-up",
        subtitle: `${stats.unpaidFlats.length} flat(s) are still unpaid${stats.pendingDuesAmount > 0 ? ` · ${fmtMoney(stats.pendingDuesAmount, sym)} still due` : ""}.`
      }
    : stats.totalExpense > stats.totalIncome
      ? {
          title: "Spending is ahead of collections",
          subtitle: `${fmtMoney(stats.totalExpense - stats.totalIncome, sym)} more has gone out than has been collected for the selected period.`
        }
      : {
          title: "Society operations are stable",
          subtitle: "Collections, expenses, and reserve movement are all visible from one place."
        };
  const freelancerActions = [
    { label: "Log payment", onClick: () => onNav("income"), tone: "accent", dot: true },
    { label: "New invoice", onClick: () => onNav("invoices"), tone: "gold" },
    { label: "Add expense", onClick: () => onNav("expenses"), tone: "danger" }
  ];
  const freelancerSummary = stats.overdueInvoices.length > 0
    ? {
        title: "Invoices need follow-up",
        subtitle: `${stats.overdueInvoices.length} overdue invoice(s) are ready for action in the billing queue.`
      }
    : !hasInvoiceRecord
      ? {
          title: "Start with a client invoice",
          subtitle: "Create the first invoice so collections, follow-up, and cash flow all become visible."
        }
      : {
          title: "Freelancer workflow is in motion",
          subtitle: stats.pendingInvoices.length > 0
            ? `${stats.pendingInvoices.length} invoice(s) are still awaiting payment.`
            : "Collections, costs, and client billing are all lined up for this period."
        };
  const businessActions = [
    { label: "Add sale", onClick: () => onNav("income"), tone: "accent", dot: true },
    { label: "New invoice", onClick: () => onNav("invoices"), tone: "gold" },
    { label: "Add expense", onClick: () => onNav("expenses"), tone: "danger" }
  ];
  const businessSummary = stats.pendingSalesTotal > 0
    ? {
        title: "Collections are still pending",
        subtitle: `${fmtMoney(stats.pendingSalesTotal, sym)} is still waiting to be collected from customers.`
      }
    : stats.alertItems.length > 0
      ? {
          title: "There are business alerts to review",
          subtitle: `${stats.alertItems.length} smart alert(s) are available for the selected period.`
        }
      : {
          title: "Business cash flow is steady",
          subtitle: "Sales, expenses, and reminders are in a good state for quick review."
        };

  if (!data.loaded) {
    return <DashboardSkeleton />;
  }

  // Overlay a subtle pulsing opacity while analytics are being fetched from the server
  const statsStyle = statsLoading ? { opacity: 0.55, pointerEvents: "none", transition: "opacity 0.2s" } : {};

  const Tile = ({ label, value, color, sub, onClick }) => (
    <div
      onClick={onClick}
      className={`ledger-summary-card${onClick ? " interactive" : ""}`}
      style={{ background: "var(--surface)" }}
    >
      <div className="ledger-summary-label">{label}</div>
      <div className="ledger-summary-value" style={{ color, fontSize: "clamp(17px, 4.4vw, 21px)" }}>{value}</div>
      {sub && <div className="ledger-summary-sub">{sub}</div>}
    </div>
  );

  const FeedGroup = ({ title, caption, children }) => (
    <div className="ledger-block">
      <div className="ledger-block-header">
        <div>
          <div className="ledger-block-title">{title}</div>
          {caption && <div className="ledger-block-caption">{caption}</div>}
        </div>
      </div>
      <div className="card">{children}</div>
    </div>
  );

  const FeedRow = ({ title, meta, amount, amountColor = "var(--text)", children }) => (
    <div className="ledger-feed-row">
      <div className="ledger-feed-main">
        <div className="ledger-feed-title">{title}</div>
        {meta && <div className="ledger-feed-meta">{meta}</div>}
      </div>
      <div className="ledger-feed-side">
        {children}
        {amount !== undefined && (
          <span className="ledger-feed-amount" style={{ color: amountColor }}>
            {amount}
          </span>
        )}
      </div>
    </div>
  );

  const onboardingGuide = (
    <OnboardingGuide
      isOpen={showSetupGuide}
      onComplete={async () => {
        setShowSetupGuide(false);
        await updateProfile({ onboardingSeenAt: new Date().toISOString() });
      }}
      onNavigate={onNav}
      account={data.account}
      onUpdateAccount={async (accountInfo) => {
        try {
          const nextAccount = { ...data.account, ...accountInfo };
          const currentType = getOrgType(data.account?.organizationType || user?.organizationType);
          const nextType = getOrgType(accountInfo.organizationType || currentType);
          if (nextType !== currentType) {
            data.resetForOrgTypeChange(nextAccount);
          } else {
            data.saveAccount(nextAccount);
          }
        } catch (err) {
          logError("Account update error", err);
        }
      }}
      onCreateOrganization={data.createOrganization}
    />
  );
  const dashboardAds = !isViewerMode ? <AdCarousel placement="dashboard_carousel" /> : null;

  if (isApartmentOrg) {
    const overallBalance = Number(stats.totalReserve || 0);
    const paidFlats = Math.max(0, (stats.flatsCount || 0) - (stats.unpaidFlats?.length || 0));
    const totalFlats = stats.flatsCount || 0;
    const collectionRate = totalFlats > 0 ? Math.round((paidFlats / totalFlats) * 100) : 0;
    const pendingCount = stats.unpaidFlats?.length || 0;
    const healthColor = collectionRate >= 85 ? "var(--jade)" : collectionRate >= 60 ? "var(--saffron)" : "var(--ember)";

    const recentIncomes = (data.income || [])
      .slice(0, 3)
      .map(item => ({ label: item.description || item.collectionType || "Collection", amount: Number(item.amount || 0), type: "in", category: item.category || "Maintenance", date: item.date || "" }));
    const recentExpenses = (data.expenses || [])
      .slice(0, 3)
      .map(item => ({ label: item.note || item.category || "Expense", amount: Number(item.amount || 0), type: "out", category: item.category || "Operations", date: item.date || "" }));
    const recentTxns = [...recentIncomes, ...recentExpenses]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);

    const trendData = (stats.monthlyBreakdown || stats.cashFlow || []).map(item => item.income || 0).filter(v => v > 0);

    // One-tap collection: record the maintenance entry straight from the
    // dashboard (same payload shape the Dues screen creates).
    const dashMk = `${year}-${String(month + 1).padStart(2, "0")}`;
    const markFlatPaid = async (fd) => {
      const amount = Number(fd?.flat?.monthlyMaintenance || 0);
      if (!(amount > 0)) return;
      const ok = await confirm(
        `Record ${sym}${amount.toLocaleString("en-IN")} maintenance from ${fd.flat.name} for ${MONTHS[month]} ${year}?`,
        { title: "Mark as Paid", confirmLabel: "Mark Paid" }
      );
      if (!ok) return;
      await data.addIncome({
        label: `Monthly Maintenance - ${fd.flat.name}`,
        amount,
        date: toLocalDateKey(),
        month: dashMk,
        note: "",
        flatNumber: fd.flat.name,
        collectionType: "Monthly Maintenance",
        residentName: fd.flat.ownerName || "",
        collectionMonth: dashMk
      });
      await data.refreshActiveOrgData?.({ collections: ["income"], includeOrgRecords: true });
      showGlobalToast({ tone: "success", title: "Payment recorded", message: `${fd.flat.name} marked paid for ${MONTHS[month]}.` });
    };

    // Post the month's dues summary into the khata group chat — the digital
    // notice board. Works for owners and shared-org admins.
    const sharedInfo = activeSharedOrgKey ? (data.sharedOrgs || []).find(o => o.key === activeSharedOrgKey) : null;
    const postDuesSummary = async (text) => {
      try {
        await messagesApi.send(sharedInfo?.ownerId || user?.id, sharedInfo?.orgId || data.activeOrgId, {
          id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          senderId: user?.id,
          senderName: user?.name || user?.email?.split("@")[0] || "Owner",
          senderRole: sharedInfo ? (sharedInfo.role || "admin") : "owner",
          sentAt: new Date().toISOString(),
          messageType: "chat",
          text
        });
        showGlobalToast({ tone: "success", title: "Posted to group chat", message: "The dues summary is now visible to everyone in this khata." });
      } catch (err) {
        logError("dues_summary_post_failed", err);
        showGlobalToast({ tone: "danger", title: "Couldn't post summary", message: "Please try again in a moment." });
      }
    };

    return (
      <div className="ledger-screen">
        <div className="ledger-block">

          {/* Hero card — wrapped in Tilt3D so the whole apartment hero responds
              to pointer motion. Tilt is local to the card (pointermove/leave on
              the wrapper) so vertical scrolling on touch is unaffected. */}
          <Tilt3D
            className="card-leather hero-presence anim-fade-up"
            style={{
              margin: "0 0 14px",
              padding: "22px 22px 18px",
              "--hero-glow": overallBalance >= 0 ? "var(--accent)" : "var(--ember)",
              borderRadius: "var(--radius-lg, 18px)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                  {MONTHS[month]} {year} · Society Fund
                </div>
                <div style={{ marginBottom: 4 }}>
                  <RupeeDisplay amount={overallBalance} color={overallBalance >= 0 ? "rgba(255,255,255,0.96)" : "var(--ember)"} size={48} animate />
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                  {overallBalance >= 0 ? "Society fund surplus" : "Fund in deficit"}
                </div>
              </div>
              {/* The HealthArc gauge duplicated the collection-rate progress
                  line below it — one number, one representation. */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                {headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "var(--cream-3)", fontWeight: 600 }}>
                  Collection rate · {paidFlats}/{totalFlats} flats
                </span>
                <span style={{ fontSize: 10, color: healthColor, fontWeight: 700 }}>{collectionRate}%</span>
              </div>
              <ProgressLine value={paidFlats} max={Math.max(totalFlats, 1)} color={healthColor} />
            </div>
          </Tilt3D>

          {dashboardAds}

          {/* Stat chips */}
          <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <StatChip
              label={viewMode === "month" ? "Collected" : "Total Collected"}
              value={fmtMoney(stats.totalIncome, sym)}
              color="var(--accent)"
              sub={viewMode === "month" ? "This month" : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("income") : undefined}
            />
            <StatChip
              label={viewMode === "month" ? "Expenses" : "Total Expenses"}
              value={fmtMoney(stats.totalExpense, sym)}
              color="var(--text)"
              sub={viewMode === "month" ? "Maintenance costs" : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("expenses") : undefined}
            />
          </div>

          {/* Collection status grid */}
          <div className="anim-fade-up-3">
            <CollectionStatusGrid
              flats={data.customers || []}
              income={data.income || []}
              sym={sym}
              month={month}
              year={year}
              onNav={onNav}
              societyName={data.account?.name || ""}
              isViewerMode={isViewerMode}
              onMarkPaid={!isViewerMode ? markFlatPaid : undefined}
              onPostSummary={!isViewerMode ? postDuesSummary : undefined}
            />
          </div>

          {/* Trend sparkline */}
          {trendData.length >= 3 && (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <div className="section-eyebrow">Collection Trend</div>
              </div>
              <Sparkline data={trendData} color="var(--accent)" height={40} />
            </div>
          )}


          {/* Recent transactions */}
          <div className="anim-fade-up-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="section-eyebrow">Recent Activity</div>
              {!isViewerMode && (
                <button onClick={() => onNav("income")} style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>
                  All →
                </button>
              )}
            </div>
            {recentTxns.length > 0 ? (
              <div className="card-leather" style={{ padding: "0 16px" }}>
                {recentTxns.map((tx, i) => (
                  <TimelineEntry key={i} {...tx} isLast={i === recentTxns.length - 1} delay={i * 50} />
                ))}
              </div>
            ) : (
              <WorkflowSetupCard title="No entries yet" message="Use the button below to record your first maintenance collection or society expense." actionLabel={!isViewerMode ? "Add Collection" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
            )}
          </div>

        </div>
        {onboardingGuide}
      </div>
    );
  }

  if (isFreelancerOrg) {
    const netEarnings = Number(stats.profit || 0);
    const collected = Number(stats.totalIncome || 0);
    const expenses = Number(stats.totalExpense || 0);
    const isEmptyOrg = (data.income || []).length === 0 && (data.expenses || []).length === 0 && (data.invoices || []).length === 0;
    const profitMarginPct = collected > 0 ? Math.max(0, Math.min(100, Math.round((netEarnings / collected) * 100))) : 0;
    const freelancerTrendData = (stats.cashFlow || stats.monthlyBreakdown || []).map(item => item.income || 0).filter(v => v > 0);
    const flMk = `${year}-${String(month + 1).padStart(2, "0")}`;
    const flInPeriod = (item) => {
      if (viewMode === "month") return (item.month || (item.date || "").slice(0, 7)) === flMk;
      return ((item.month || "").slice(0, 4) || (item.date || "").slice(0, 4)) === String(year);
    };
    const flPeriodIncome = (data.income || []).filter(flInPeriod).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const flPeriodExpenses = (data.expenses || []).filter(flInPeriod).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    // Paid invoices in the current period
    const flPeriodPaidInvoices = (data.invoices || []).filter(inv => {
      if (String(inv.documentType || "invoice") !== "invoice") return false;
      if (String(inv.status || "").toLowerCase() !== "paid") return false;
      const paidMk = (inv.paidDate || inv.date || "").slice(0, 7);
      if (viewMode === "month") return paidMk === flMk;
      return paidMk.slice(0, 4) === String(year);
    });

    const freelancerRecentIncomes = flPeriodIncome.map(item => ({ label: item.description || item.source || "Payment", amount: Number(item.amount || 0), type: "in", category: item.clientName || item.category || "Income", date: item.date || "" }));
    const freelancerRecentInvoices = flPeriodPaidInvoices.map(inv => ({ label: `Invoice ${inv.invoiceNumber || ""}`.trim() || "Invoice paid", amount: Number(inv.grandTotal || invoiceGrandTotal(inv) || 0), type: "in", category: String(inv.customer?.name || inv.billTo?.name || "Client").trim(), date: inv.paidDate || inv.date || "" }));
    const freelancerRecentExpenses = flPeriodExpenses.map(item => ({ label: item.note || item.category || "Expense", amount: Number(item.amount || 0), type: "out", category: item.category || "Operations", date: item.date || "" }));
    const freelancerRecentTxns = [...freelancerRecentIncomes, ...freelancerRecentInvoices, ...freelancerRecentExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

    const flClientMap = {};
    flPeriodIncome.forEach(item => {
      const client = String(item.clientName || "").trim() || "Unassigned";
      flClientMap[client] = (flClientMap[client] || 0) + Number(item.amount || 0);
    });
    flPeriodPaidInvoices.forEach(inv => {
      const client = String(inv.customer?.name || inv.billTo?.name || "").trim() || "Unassigned";
      const amount = Number(inv.grandTotal || invoiceGrandTotal(inv) || 0);
      flClientMap[client] = (flClientMap[client] || 0) + amount;
    });
    const flTopClients = Object.entries(flClientMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const flBillableTotal = flPeriodExpenses.reduce((sum, e) => sum + (String(e.billable) === "Yes" ? Number(e.amount || 0) : 0), 0);
    const flBillableCount = flPeriodExpenses.filter(e => String(e.billable) === "Yes").length;
    const flPaidCount = (data.invoices || []).filter(inv => String(inv.documentType || "invoice") === "invoice" && String(inv.status || "").toLowerCase() === "paid").length;
    const flPendingCount = (stats.pendingInvoices || []).length;
    const flOverdueCount = (stats.overdueInvoices || []).length;
    const flPayrollExpenses = flPeriodExpenses.filter(e => String(e.category || "") === "Payroll");
    const flPayrollTotal = flPayrollExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const flPayrollStaffCount = new Set(flPayrollExpenses.map(e => e.staffMemberName).filter(Boolean)).size;
    const flNonPayrollExpenses = expenses - flPayrollTotal;

    return (
      <div className="ledger-screen">
        <div className="ledger-block">

          {/* Hero card */}
          <Tilt3D
            className="card-leather hero-presence anim-fade-up"
            style={{
              margin: "0 0 14px",
              padding: "22px 22px 18px",
              "--hero-glow": netEarnings >= 0 ? "var(--sky)" : "var(--ember)",
              borderRadius: "var(--radius-lg, 18px)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                  {MONTHS[month]} {year} · Business Earnings
                </div>
                <div style={{ marginBottom: 4 }}>
                  <RupeeDisplay amount={netEarnings} color={netEarnings >= 0 ? "rgba(255,255,255,0.96)" : "var(--ember)"} size={48} animate />
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                  {netEarnings >= 0 ? `Net after expenses · ${profitMarginPct}% margin` : "Expenses ahead of collected work"}
                </div>
              </div>
              <HealthArc pct={profitMarginPct} size={84} color="var(--sky)" />
            </div>
            {headerDatePicker && <div className="ledger-card-month-picker ledger-card-month-picker-inline">{headerDatePicker}</div>}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "var(--cream-3)", fontWeight: 600 }}>Collected vs Expenses</span>
                <span style={{ fontSize: 10, color: "var(--cream-3)" }}>{sym}{(collected / 1000).toFixed(1)}k in · {sym}{(expenses / 1000).toFixed(1)}k out{flPayrollTotal > 0 ? ` (incl. ${sym}${(flPayrollTotal / 1000).toFixed(1)}k payroll)` : ""}</span>
              </div>
              <ProgressLine value={collected} max={Math.max(collected + expenses, 1)} color="var(--sky)" />
            </div>
          </Tilt3D>

          {dashboardAds}

          {/* Outstanding invoices callout */}
          {stats.pendingInvoiceTotal > 0 && (
            <div
              className="anim-fade-up"
              onClick={() => onNav("invoices")}
              style={{ background: "color-mix(in srgb, var(--saffron) 7%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--saffron) 22%, var(--line-2))", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)", marginBottom: 2 }}>
                  {stats.pendingInvoices.length} invoice{stats.pendingInvoices.length !== 1 ? "s" : ""} awaiting payment
                </div>
                <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                  {stats.overdueInvoices?.length > 0 ? `${stats.overdueInvoices.length} overdue · ` : ""}Tap to follow up
                </div>
              </div>
              <RupeeDisplay amount={Number(stats.pendingInvoiceTotal || 0)} color="var(--saffron)" size={20} />
            </div>
          )}

          {/* Stat chips */}
          <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <StatChip
              label={viewMode === "month" ? "Collected" : "Total Collected"}
              value={fmtMoney(stats.totalIncome, sym)}
              color="var(--sky)"
              sub={viewMode === "month" ? "Payments & paid invoices" : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("income") : undefined}
            />
            <StatChip
              label={viewMode === "month" ? "Expenses" : "Total Expenses"}
              value={fmtMoney(stats.totalExpense, sym)}
              color="var(--ember)"
              sub={viewMode === "month" ? (flPayrollTotal > 0 ? "Ops + payroll costs" : "Tools, travel & ops") : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("expenses") : undefined}
            />
          </div>

          <FinancialYearSummaryCard
            summary={financialYearSummary}
            sym={sym}
            incomeLabel="Revenue"
            expenseLabel="Expenses"
          />

          {/* First-use onboarding CTA */}
          {isEmptyOrg && (
            <div className="anim-fade-up-2">
              <WorkflowSetupCard
                eyebrow="Get started"
                title="Record your first entry"
                message="Tap below to log a payment in Payments, or jump to Invoices to raise your first invoice."
                actionLabel="Log Payment →"
                onAction={() => onNav("income")}
                secondaryActionLabel="New Invoice"
                onSecondaryAction={() => onNav("invoices")}
                tone="info"
              />
            </div>
          )}

          {/* Payroll summary */}
          {flPayrollTotal > 0 && (
            <div
              className="anim-fade-up-2"
              onClick={() => onNav("expenses")}
              style={{ background: "color-mix(in srgb, var(--purple) 7%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--purple) 22%, var(--line-2))", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", marginBottom: 2 }}>
                  Payroll · {flPayrollStaffCount > 0 ? `${flPayrollStaffCount} staff` : `${flPayrollExpenses.length} entr${flPayrollExpenses.length === 1 ? "y" : "ies"}`}{flNonPayrollExpenses > 0 ? ` · ${fmtMoney(flNonPayrollExpenses, sym)} ops` : ""}
                </div>
                <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                  {viewMode === "month" ? MONTHS[month] : year} payroll expense · Tap to view
                </div>
              </div>
              <RupeeDisplay amount={flPayrollTotal} color="var(--purple)" size={20} />
            </div>
          )}

          {/* Invoice status + billable expenses strip */}
          {(flPaidCount > 0 || flPendingCount > 0 || flBillableCount > 0) && (
            <div className="anim-fade-up-3" style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {(flPaidCount > 0 || flPendingCount > 0) && (
                <div style={{ flex: 1, minWidth: 72, padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--jade) 9%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--jade) 22%, var(--line-2))" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--jade)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Paid</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--jade)" }}>{flPaidCount}</div>
                  <div style={{ fontSize: 10, color: "var(--cream-3)" }}>invoice{flPaidCount !== 1 ? "s" : ""}</div>
                </div>
              )}
              {flPendingCount > 0 && (
                <div onClick={() => onNav("invoices")} style={{ flex: 1, minWidth: 72, padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--saffron) 9%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--saffron) 22%, var(--line-2))", cursor: "pointer" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--saffron)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Pending</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--saffron)" }}>{flPendingCount}</div>
                  <div style={{ fontSize: 10, color: "var(--cream-3)" }}>invoice{flPendingCount !== 1 ? "s" : ""}</div>
                </div>
              )}
              {flOverdueCount > 0 && (
                <div onClick={() => onNav("invoices")} style={{ flex: 1, minWidth: 72, padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--ember) 9%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--ember) 22%, var(--line-2))", cursor: "pointer" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--ember)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Overdue</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ember)" }}>{flOverdueCount}</div>
                  <div style={{ fontSize: 10, color: "var(--cream-3)" }}>invoice{flOverdueCount !== 1 ? "s" : ""}</div>
                </div>
              )}
              {flBillableCount > 0 && (
                <div onClick={() => onNav("expenses")} style={{ flex: 1, minWidth: 96, padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--sky) 9%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--sky) 22%, var(--line-2))", cursor: "pointer" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sky)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Billable</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--sky)" }}>{fmtMoney(flBillableTotal, sym)}</div>
                  <div style={{ fontSize: 10, color: "var(--cream-3)" }}>{flBillableCount} exp.</div>
                </div>
              )}
            </div>
          )}

          {/* Trend sparkline */}
          {freelancerTrendData.length >= 3 && (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>Earnings Trend</div>
              <Sparkline data={freelancerTrendData} color="var(--sky)" height={40} />
            </div>
          )}

          {/* Revenue by client */}
          {flTopClients.length > 0 && (
            <div className="anim-fade-up-4" style={{ marginBottom: 14 }}>
              <Collapsible title="Revenue by Client" icon="◎" color="var(--sky)" count={flTopClients.length} defaultOpen>
                <div className="card">
                  {flTopClients.map(([client, revenue]) => {
                    const pct = collected > 0 ? Math.round((revenue / collected) * 100) : 0;
                    return (
                      <div key={client} className="ledger-feed-row">
                        <div className="ledger-feed-main" style={{ minWidth: 0, flex: 1 }}>
                          <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client}</div>
                          <div style={{ marginTop: 5, height: 3, borderRadius: 99, background: "var(--line-2)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "var(--sky)", borderRadius: 99, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 10 }}>
                          <div className="ledger-feed-amount" style={{ color: "var(--sky)" }}>{fmtMoney(revenue, sym)}</div>
                          <div style={{ fontSize: 10, color: "var(--cream-3)" }}>{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Collapsible>
            </div>
          )}

          {/* Staff Payroll breakdown */}
          {flPayrollExpenses.length > 0 && (
            <div className="anim-fade-up-4" style={{ marginBottom: 14 }}>
              <Collapsible title="Staff Payroll" icon="◎" color="var(--purple)" count={flPayrollExpenses.length} defaultOpen={false}>
                <div className="card">
                  {flPayrollExpenses.map(e => {
                    const pct = flPayrollTotal > 0 ? Math.round((Number(e.amount || 0) / flPayrollTotal) * 100) : 0;
                    return (
                      <div key={e.id} className="ledger-feed-row">
                        <div className="ledger-feed-main" style={{ minWidth: 0, flex: 1 }}>
                          <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.staffMemberName || e.label || "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--cream-3)", marginTop: 2 }}>
                            {e.date ? new Date(`${e.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                          </div>
                          <div style={{ marginTop: 5, height: 3, borderRadius: 99, background: "var(--line-2)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "var(--purple)", borderRadius: 99, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: 10 }}>
                          <div className="ledger-feed-amount" style={{ color: "var(--purple)" }}>{fmtMoney(e.amount || 0, sym)}</div>
                          <div style={{ fontSize: 10, color: "var(--cream-3)" }}>{pct}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Collapsible>
            </div>
          )}

          {/* Recent transactions */}
          <div className="anim-fade-up-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="section-eyebrow">Recent Activity</div>
              {!isViewerMode && (
                <button onClick={() => onNav("income")} style={{ fontSize: 11, color: "var(--sky)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>All →</button>
              )}
            </div>
            {freelancerRecentTxns.length > 0 ? (
              <div className="card-leather" style={{ padding: "0 16px" }}>
                {freelancerRecentTxns.map((tx, i) => (
                  <TimelineEntry key={i} {...tx} isLast={i === freelancerRecentTxns.length - 1} delay={i * 50} />
                ))}
              </div>
            ) : (
              <WorkflowSetupCard title="No entries yet" message="Add client payments and work expenses to see your business cashflow here." actionLabel={!isViewerMode ? "Log Payment" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
            )}
          </div>

          {/* Invoice Follow-up */}
          <div className="anim-fade-up-5" style={{ marginTop: 14 }}>
            <Collapsible title="Invoice Follow-up" icon="◎" color="var(--sky)" count={(stats.overdueInvoices?.length || 0) + (stats.dueSoonInvoices?.length || 0)} defaultOpen>
              <div className="card">
                {(stats.overdueInvoices?.length || 0) === 0 && (stats.dueSoonInvoices?.length || 0) === 0 ? (
                  <WorkflowSetupCard title="No invoice follow-up right now" message="Your open client invoices are either paid or not near their due date yet." tone="success" />
                ) : (
                  [...(stats.overdueInvoices || []), ...(stats.dueSoonInvoices || []).filter(inv => !(stats.overdueInvoices || []).some(o => o.id === inv.id))].slice(0, 6).map(invoice => (
                    <div key={invoice.id} className="ledger-feed-row">
                      <div className="ledger-feed-main">
                        <div className="ledger-feed-title">{invoice.number || "Invoice"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {[invoice.customer?.name || invoice.billTo?.name || "No client", invoice.dueDate ? `Due ${invoice.dueDate}` : "No due date"].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="ledger-feed-side">
                        <div className="ledger-feed-amount" style={{ color: getInvoiceStatusColor(invoice.status || invoice.computedStatus || "pending") }}>{fmtMoney(invoice.total || 0, sym)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{getInvoiceStatusLabel(invoice.status || invoice.computedStatus || "pending")}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Collapsible>
          </div>

          {/* Top Expenses */}
          {top5Expenses.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--ember)" count={top5Expenses.length} defaultOpen={false}>
                <div className="card">
                  {top5Expenses.map((expense, index) => (
                    <div key={expense.id || index} className="ledger-feed-row">
                      <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                        <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span className="ledger-feed-amount" style={{ color: "var(--ember)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                    </div>
                  ))}
                </div>
              </Collapsible>
            </div>
          )}

        </div>
        {onboardingGuide}
      </div>
    );
  }

  return (
    <div className="ledger-screen">
      <div className="ledger-block">

        {/* Hero card */}
        <div className="card-leather anim-fade-up" style={{ margin: "0 0 14px", padding: "22px 22px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                {MONTHS[month]} {year} · Smart Dashboard
              </div>
              <div style={{ marginBottom: 4 }}>
                <RupeeDisplay amount={Number(stats.profit || 0)} color={Number(stats.profit || 0) >= 0 ? "rgba(255,255,255,0.96)" : "var(--ember)"} size={48} animate />
              </div>
              <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                {Number(stats.profit || 0) >= 0 ? "Net business profit" : "Expenses ahead of revenue"}
              </div>
            </div>
            <HealthArc pct={Math.min(100, Math.round((Number(stats.totalIncome || 0) / Math.max(Number(stats.totalIncome || 0) + Number(stats.totalExpense || 0), 1)) * 100))} size={84} color="var(--jade)" />
          </div>
          {headerDatePicker && <div className="ledger-card-month-picker ledger-card-month-picker-inline">{headerDatePicker}</div>}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "var(--cream-3)", fontWeight: 600 }}>Revenue vs Expenses</span>
              <span style={{ fontSize: 10, color: "var(--cream-3)" }}>{sym}{(Number(stats.totalIncome || 0) / 1000).toFixed(1)}k in · {sym}{(Number(stats.totalExpense || 0) / 1000).toFixed(1)}k out</span>
            </div>
            <ProgressLine value={Number(stats.totalIncome || 0)} max={Math.max(Number(stats.totalIncome || 0) + Number(stats.totalExpense || 0), 1)} color={Number(stats.profit || 0) >= 0 ? "var(--jade)" : "var(--ember)"} />
          </div>
        </div>

        {dashboardAds}

        {/* Plan / review access banner */}
        {!activeSharedOrgKey && (reviewAccessEnabled || currentPlan === PLANS.FREE || isTrial) && (
          <div style={{ marginBottom: 14, padding: "12px 14px", background: reviewAccessEnabled ? "color-mix(in srgb, var(--sky) 8%, var(--canvas))" : currentPlan === PLANS.FREE ? "color-mix(in srgb, var(--saffron) 8%, var(--canvas))" : "color-mix(in srgb, var(--jade) 8%, var(--canvas))", borderRadius: 14, border: `1px solid color-mix(in srgb, ${reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)"} 22%, var(--line-2))`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>
                {reviewAccessEnabled ? "Review Access Enabled" : currentPlan === PLANS.FREE ? "Choose a Plan" : "Pro Active"}
              </div>
              <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                {reviewAccessEnabled ? "All premium features are unlocked right now." : currentPlan === PLANS.FREE ? "Pro gives one owned Khata for Rs 99/month or Rs 999/year" : isTrial && user?.subscriptionEndsAt ? `Ends ${formatSubscriptionDate(user.subscriptionEndsAt)}` : "Paid features active"}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)", whiteSpace: "nowrap" }}>
              {reviewAccessEnabled ? "Full access" : currentPlan === PLANS.FREE ? "From Rs 99/mo" : ""}
            </div>
          </div>
        )}

        {/* Stat chips */}
        <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <StatChip
            label={viewMode === "month" ? "Sales" : "Total Sales"}
            value={fmtMoney(stats.totalIncome, sym)}
            color="var(--jade)"
            sub={viewMode === "month" ? "Revenue collected" : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`}
            onClick={!isViewerMode ? () => onNav("income") : undefined}
          />
          <StatChip
            label={viewMode === "month" ? "Expenses" : "Total Expenses"}
            value={fmtMoney(stats.totalExpense, sym)}
            color="var(--ember)"
            sub={viewMode === "month" ? "Recurring and one-time costs" : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
            onClick={!isViewerMode ? () => onNav("expenses") : undefined}
          />
        </div>

        {/* Trend sparkline */}
        {(() => {
          const bizTrendData = (stats.cashFlow || stats.monthlyBreakdown || []).map(item => item.income || 0).filter(v => v > 0);
          return bizTrendData.length >= 3 ? (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>Revenue Trend</div>
              <Sparkline data={bizTrendData} color="var(--jade)" height={40} />
            </div>
          ) : null;
        })()}

        {/* Pending invoices callout */}
        {(stats.pendingInvoiceTotal || 0) > 0 && (
          <div
            className="anim-fade-up-3"
            onClick={() => onNav("invoices")}
            style={{ background: "color-mix(in srgb, var(--saffron) 7%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--saffron) 22%, var(--line-2))", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)", marginBottom: 2 }}>
                {stats.pendingInvoices?.length || 0} invoice{(stats.pendingInvoices?.length || 0) !== 1 ? "s" : ""} awaiting payment
              </div>
              <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                {stats.overdueInvoices?.length > 0 ? `${stats.overdueInvoices.length} overdue · ` : ""}Tap to follow up
              </div>
            </div>
            <RupeeDisplay amount={Number(stats.pendingInvoiceTotal || 0)} color="var(--saffron)" size={20} />
          </div>
        )}

        {/* Recent transactions */}
        {(() => {
          const bizRecentIncomes = (data.income || []).slice(0, 3).map(item => ({ label: item.description || item.source || "Income", amount: Number(item.amount || 0), type: "in", category: item.category || "Sales", date: item.date || "" }));
          const bizRecentExpenses = (data.expenses || []).slice(0, 3).map(item => ({ label: item.note || item.category || "Expense", amount: Number(item.amount || 0), type: "out", category: item.category || "Operations", date: item.date || "" }));
          const bizRecentTxns = [...bizRecentIncomes, ...bizRecentExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
          return (
            <div className="anim-fade-up-4">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div className="section-eyebrow">Recent Activity</div>
                {!isViewerMode && (
                  <button onClick={() => onNav("income")} style={{ fontSize: 11, color: "var(--jade)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>All →</button>
                )}
              </div>
              {bizRecentTxns.length > 0 ? (
                <div className="card-leather" style={{ padding: "0 16px" }}>
                  {bizRecentTxns.map((tx, i) => (
                    <TimelineEntry key={i} {...tx} isLast={i === bizRecentTxns.length - 1} delay={i * 50} />
                  ))}
                </div>
              ) : (
                <WorkflowSetupCard title="No entries yet" message="Add sales and expenses to see your business cashflow here." actionLabel={!isViewerMode ? "Add Entry" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
              )}
            </div>
          );
        })()}

        <Collapsible
          title="Smart Alerts"
          icon="🚨"
          count={showAdvanced ? stats.alertItems.length : 0}
          defaultOpen={showAdvanced && stats.alertItems.length > 0}
        >
          {!showAdvanced ? (
            <div className="card">
              <WorkflowSetupCard title="Upgrade to unlock smart alerts" message="Pro plan adds due reminders, budget warnings, spending spikes, and stronger financial guidance." tone="warning" />
            </div>
          ) : stats.alertItems.length === 0 ? (
            <div className="card">
              <WorkflowSetupCard title="All clear for now" message="No urgent alerts right now. Your cash flow and collections look steady." tone="success" />
            </div>
          ) : (
            <div className="card">
              {stats.alertItems.map((alert, index) => {
                const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                return (
                  <div key={`${alert.title}-${index}`} className="ledger-feed-row">
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginTop: 6, flexShrink: 0 }} />
                    <div className="ledger-feed-main">
                      <div className="ledger-feed-title" style={{ color }}>{alert.title}</div>
                      <div className="ledger-feed-meta">{alert.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Collapsible>

        <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--ember)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
          <div className="card">
            {top5Expenses.length === 0 ? (
              <WorkflowSetupCard title="No expenses this period" message="Add expense entries to see your biggest costs here." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
            ) : (
              top5Expenses.map((expense, index) => (
                <div key={expense.id || index} className="ledger-feed-row">
                  <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                    <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className="ledger-feed-amount" style={{ color: "var(--ember)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>

        <Collapsible
          title="High-Risk Customers"
          icon="⚠️"
          color="var(--saffron)"
          count={showAdvanced ? stats.highRiskCustomers.length : 0}
          defaultOpen={false}
        >
          <div className="card">
            {!showAdvanced ? (
              <WorkflowSetupCard title="Risk scoring is on Pro" message="Upgrade to Pro to flag frequent late payers and reduce collection risk." tone="warning" />
            ) : stats.highRiskCustomers.length === 0 ? (
              <WorkflowSetupCard title="Healthy payment behaviour" message="No late-payment risk detected so far. Keep invoices updated to maintain this view." tone="success" />
            ) : (
              stats.highRiskCustomers.map(customer => (
                <FeedRow
                  key={customer.name}
                  title={customer.name}
                  meta={`${customer.overdueCount} overdue invoice(s)`}
                  amount={`${Math.round(customer.lateRatio * 100)}% late`}
                  amountColor="var(--danger)"
                />
              ))
            )}
          </div>
        </Collapsible>

        <Collapsible
          title="Pending Invoice Queue"
          icon="⏰"
          color="var(--saffron)"
          count={stats.pendingInvoices.length}
          defaultOpen={stats.pendingInvoices.length > 0}
        >
          <div className="card">
            {stats.pendingInvoices.length === 0 ? (
              <WorkflowSetupCard title="Nothing pending" message="All invoices are currently paid up. New reminders will appear here automatically." tone="success" />
            ) : (
              stats.pendingInvoices.slice(0, 4).map(invoice => {
                const color = getInvoiceStatusColor(invoice.computedStatus);
                return (
                  <div key={invoice.id} className="ledger-feed-row" onClick={() => onNav("invoices")} style={{ cursor: "pointer" }}>
                    <div className="ledger-feed-main">
                      <div className="ledger-feed-title">{invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} · {invoice.dueMessage || "Awaiting payment"}</div>
                    </div>
                    <div className="ledger-feed-side">
                      <div className="ledger-feed-amount" style={{ color: "var(--sky)" }}>{fmtMoney(invoice.total, sym)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color }}>{getInvoiceStatusLabel(invoice.computedStatus)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Collapsible>

      </div>

      {onboardingGuide}
    </div>
  );
}
