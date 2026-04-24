import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, MONTHS, DashboardSkeleton, WorkflowActionStrip, WorkflowSetupCard } from "../components/UI";
import { logError } from "../utils/logger";
import {
  getPersonalEmiDueDay,
  getInvoiceStatusColor,
  getInvoiceStatusLabel
} from "../utils/analytics";
import { orgsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { PLANS, canUseFeature, formatSubscriptionDate, getUserPlan, isReviewAccessEnabled } from "../utils/subscription";
import OnboardingGuide from "../components/OnboardingGuide";
import Collapsible from "../components/Collapsible";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function PersonalUsagePie({ stats, sym, viewMode, isMobile = false }) {
  const totalIncome = Math.max(0, Number(stats.totalIncome || 0));
  const totalExpense = Math.max(0, Number(stats.totalExpense || 0));
  const totalEmi = Math.max(0, Number(stats.totalEmi || 0));
  const shortfall = Math.max(0, totalExpense + totalEmi - totalIncome);
  const segments = [
    { label: "Spending", value: totalExpense, color: "var(--danger)" },
    { label: "EMI", value: totalEmi, color: "var(--gold)" },
    ...(shortfall > 0 ? [] : [{
      label: "Remaining",
      value: Math.max(0, totalIncome - totalExpense - totalEmi),
      color: "var(--accent)"
    }])
  ].filter(item => item.value > 0);

  const total = segments.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return (
      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <WorkflowSetupCard
          title="No earnings usage yet"
          description={`Add earnings, spendings, or EMI entries to see how money is being used for this ${viewMode === "month" ? "month" : "year"}.`}
          tone="info"
        />
      </div>
    );
  }

  let startAngle = 0;

  return (
    <div className="card" style={{ padding: 18, marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Earnings Usage</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
            {viewMode === "month" ? "How this month’s earnings are being used." : "How this year’s earnings are being used."}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
          Total tracked {fmtMoney(total, sym)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 190px) minmax(0, 1fr)", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width={isMobile ? "156" : "190"} height={isMobile ? "156" : "190"} viewBox="0 0 190 190" role="img" aria-label="Earnings usage pie chart">
            <circle cx="95" cy="95" r="78" fill="var(--surface-high)" />
            {segments.map(segment => {
              const angle = (segment.value / total) * 360;
              const endAngle = startAngle + angle;
              const path = describeArc(95, 95, 78, startAngle, endAngle);
              startAngle = endAngle;
              return <path key={segment.label} d={path} fill={segment.color} stroke="var(--bg)" strokeWidth="2" />;
            })}
            <circle cx="95" cy="95" r="42" fill="var(--bg)" />
            <text x="95" y="90" textAnchor="middle" style={{ fontSize: 12, fill: "var(--text-dim)", fontWeight: 700 }}>Net</text>
            <text x="95" y="108" textAnchor="middle" style={{ fontSize: 13, fill: "var(--text)", fontWeight: 700 }}>
              {fmtMoney(stats.netAfterEmi || 0, sym)}
            </text>
          </svg>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {segments.map(segment => {
            const pct = Math.round((segment.value / total) * 100);
            return (
              <div key={segment.label} className="ledger-feed-row" style={{ paddingInline: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: segment.color, flexShrink: 0 }} />
                  <div className="ledger-feed-main">
                    <div className="ledger-feed-title">{segment.label}</div>
                    <div className="ledger-feed-meta">{pct}% of tracked usage</div>
                  </div>
                </div>
                <div className="ledger-feed-side">
                  <span className="ledger-feed-amount">{fmtMoney(segment.value, sym)}</span>
                </div>
              </div>
            );
          })}
          {shortfall > 0 && (
            <div className="ledger-feed-row" style={{ paddingInline: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: "var(--purple)", flexShrink: 0 }} />
                <div className="ledger-feed-main">
                  <div className="ledger-feed-title">Shortfall</div>
                  <div className="ledger-feed-meta">Extra outflow beyond earnings this period</div>
                </div>
              </div>
              <div className="ledger-feed-side">
                <span className="ledger-feed-amount" style={{ color: "var(--purple)" }}>{fmtMoney(shortfall, sym)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApartmentUsagePie({ stats, sym, viewMode, isMobile = false }) {
  const totalCollected = Math.max(0, Number(stats.totalIncome || 0));
  const totalSpent = Math.max(0, Number(stats.totalExpense || 0));
  const netAmount = Number(stats.profit || 0);
  const pendingDueAmount = Math.max(0, Number(stats.pendingDuesAmount || 0));
  const expenseShare = totalCollected > 0 ? Math.min(100, Math.round((totalSpent / totalCollected) * 100)) : 0;
  const netShare = totalCollected > 0 ? Math.min(100, Math.round((Math.abs(netAmount) / totalCollected) * 100)) : 0;
  const collectionEfficiency = Math.max(0, Math.round(stats.collectionRate || 0));
  const segments = [
    { label: "Money Spent", value: totalSpent, color: "var(--danger)" },
    {
      label: (stats.profit || 0) >= 0 ? "Balance Left" : "Shortfall",
      value: Math.abs(netAmount),
      color: (stats.profit || 0) >= 0 ? "var(--accent)" : "var(--gold)"
    }
  ].filter(item => item.value > 0);

  const total = segments.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return (
      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <WorkflowSetupCard
          title="No society usage yet"
          description={`Add collections and society expenses to see how funds are being used for this ${viewMode === "month" ? "month" : "year"}.`}
          tone="info"
        />
      </div>
    );
  }

  let startAngle = 0;

  return (
    <div className="card" style={{ padding: 14, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Collections Usage</div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
            {viewMode === "month" ? "How this month’s collections are being used." : "How this year’s collections are being used."}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
          Total collected {fmtMoney(totalCollected, sym)}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, padding: 10, background: "color-mix(in srgb, var(--surface-high) 92%, transparent)" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Collection</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{collectionEfficiency}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Spent</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>{expenseShare}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>{netAmount >= 0 ? "Balance" : "Shortfall"}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: netAmount >= 0 ? "var(--accent)" : "var(--gold)" }}>{netShare}%</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-dim)" }}>Pending Dues</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: pendingDueAmount > 0 ? "var(--gold)" : "var(--text)" }}>{fmtMoney(pendingDueAmount, sym)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 176px) minmax(0, 1fr)", gap: 14, alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width={isMobile ? "148" : "176"} height={isMobile ? "148" : "176"} viewBox="0 0 190 190" role="img" aria-label="Collections usage pie chart">
            <circle cx="95" cy="95" r="78" fill="var(--surface-high)" />
            {segments.map(segment => {
              const angle = (segment.value / total) * 360;
              const endAngle = startAngle + angle;
              const path = describeArc(95, 95, 78, startAngle, endAngle);
              startAngle = endAngle;
              return <path key={segment.label} d={path} fill={segment.color} stroke="var(--bg)" strokeWidth="2" />;
            })}
            <circle cx="95" cy="95" r="42" fill="var(--bg)" />
            <text x="95" y="90" textAnchor="middle" style={{ fontSize: 12, fill: "var(--text-dim)", fontWeight: 700 }}>Net</text>
            <text x="95" y="108" textAnchor="middle" style={{ fontSize: 12, fill: "var(--text)", fontWeight: 700 }}>
              {fmtMoney(stats.profit || 0, sym)}
            </text>
          </svg>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          {segments.map(segment => {
            const pct = Math.round((segment.value / total) * 100);
            return (
              <div key={segment.label} className="ledger-feed-row" style={{ paddingInline: 0, paddingBlock: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: segment.color, flexShrink: 0 }} />
                  <div className="ledger-feed-main">
                    <div className="ledger-feed-title">{segment.label}</div>
                    <div className="ledger-feed-meta">{pct}% of tracked usage</div>
                  </div>
                </div>
                <div className="ledger-feed-side">
                  <span className="ledger-feed-amount">{fmtMoney(segment.value, sym)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function SavingsGoalCard({ goals, sym, onNav }) {
  const target = Number(goals?.targetAmount || 0);
  const saved = Number(goals?.savedAmount || 0);
  const targetDate = String(goals?.targetDate || "");
  const note = String(goals?.note || "");
  const hasGoal = target > 0;
  const progress = hasGoal ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  const remaining = Math.max(0, target - saved);

  return (
    <div className="card" style={{ padding: 18, marginBottom: 22, borderLeft: "4px solid var(--gold)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Savings Goal</div>
          {note && <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{note}</div>}
        </div>
        <button className="btn-secondary" type="button" style={{ padding: "6px 10px", fontSize: 11 }} onClick={() => onNav({ tab: "org", screen: "savings-goal" })}>
          Edit Goal
        </button>
      </div>
      {hasGoal ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "var(--text-sec)" }}>Saved: <strong style={{ color: "var(--accent)" }}>{fmtMoney(saved, sym)}</strong></span>
            <span style={{ fontSize: 13, color: "var(--text-sec)" }}>Target: <strong style={{ color: "var(--gold)" }}>{fmtMoney(target, sym)}</strong></span>
          </div>
          <div className="progress-bar-track" style={{ marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: progress >= 100 ? "var(--accent)" : "var(--gold)", borderRadius: 999, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{progress}% complete</span>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {remaining > 0 ? `${fmtMoney(remaining, sym)} to go` : "Goal reached!"}
              {targetDate ? ` · By ${targetDate}` : ""}
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: "8px 0" }}>
          No savings goal set.{" "}
          <button type="button" style={{ background: "none", border: "none", color: "var(--gold)", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }} onClick={() => onNav({ tab: "org", screen: "savings-goal" })}>
            Set a goal
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ year, month, viewMode: propViewMode, onNav, headerDatePicker }) {
  const data = useData();
  const { activeSharedOrgKey, collectionFetched, isViewerMode } = data;
  const { user, updateProfile } = useAuth();
  const sym = data.currency?.symbol || "Rs";
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [viewMode, setViewMode] = useState(propViewMode || "month"); // "month" or "year"
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));

  // Show setup guide for normal users on first visit
  useEffect(() => {
    setViewMode(propViewMode || "month");
  }, [propViewMode]);

  // Never show the setup guide when viewing a shared org — it belongs to the member's own account
  useEffect(() => {
    if (activeSharedOrgKey || !data.loaded || !user?.id || user?.onboardingSeenAt) return;
    setShowSetupGuide(true);
  }, [activeSharedOrgKey, data.loaded, user?.id, user?.onboardingSeenAt]);

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
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = orgType === ORG_TYPES.SMALL_BUSINESS;
  const orgConfig = getOrgConfig(orgType);
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
    let cancelled = false;
    setStatsLoading(true);
    const sharedInfo = data.activeSharedOrgKey ? user?.sharedOrgs?.[data.activeSharedOrgKey] : null;
    const dashboardUserId = sharedInfo?.ownerId || user?.id;
    orgsApi.getDashboard(dashboardUserId, data.activeOrgId, year, month, viewMode)
      .then(result => { if (!cancelled) setStats(normalizeStats(result)); })
      .catch(err => logError("dashboard fetch", err))
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, [data.loaded, data.activeOrgId, user?.id, year, month, viewMode]);
  const showAdvanced = canUseFeature(user, "advancedAnalytics");
  const hasPosSystem = isSmallBusinessOrg && canUseFeature(user, "posSystem");
  const currentPlan = getUserPlan(user);
  const isTrial = user?.subscriptionStatus === "trial";
  const reviewAccessEnabled = isReviewAccessEnabled();
  const hasCustomerRecord = (data.customers || []).length > 0;
  const hasInvoiceRecord = (data.invoices || []).some(item => String(item?.documentType || "invoice") === "invoice");
  const hasIncomeRecord = (data.income || []).length > 0;

  const heroTone = stats.profit >= 0 ? "var(--accent)" : "var(--danger)";
  const heroSub = isSmallBusinessOrg
    ? (viewMode === "month"
      ? (stats.pendingSalesTotal > 0
        ? `${fmtMoney(stats.pendingSalesTotal, sym)} is still awaiting collection from customers this month.`
        : stats.profit >= 0
          ? hasPosSystem
            ? "Customer work and collections are staying ahead of business costs this month."
            : "Cash coming in is ahead of what you are spending this month."
          : hasPosSystem ? "Expenses are ahead of sales this month." : "You are spending more than you are collecting this month.")
      : (stats.partnerBalanceTotal > 0
        ? `${fmtMoney(stats.partnerBalanceTotal, sym)} is still due across partner balances this year.`
        : stats.profit >= 0
          ? "The business stayed profitable across the year."
          : "Expenses are ahead of sales across the year."))
    : viewMode === "month" 
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

  const personalActions = hasCustomerRecord
    ? [
        { label: "Add income", onClick: () => onNav("income"), tone: "accent", dot: true },
        { label: "Add spending", onClick: () => onNav("expenses"), tone: "danger" },
        { label: "EMI tracker", onClick: () => onNav("emi"), tone: "gold" }
      ]
    : [
        { label: "Add first person", onClick: () => onNav({ tab: "org", screen: "customers" }), tone: "accent", dot: true },
        { label: "Open Khata", onClick: () => onNav("settings") }
      ];
  const personalSummary = !hasCustomerRecord
    ? {
        title: "Set up your household workspace",
        subtitle: "Add one family member first, then record income, spending, and EMIs against the right person."
      }
    : !hasIncomeRecord
      ? {
          title: "Record this month’s first earning",
          subtitle: "Start with income so the dashboard can explain what is left after spending and EMI commitments."
        }
      : stats.netAfterEmi < 0
        ? {
            title: "Cash flow needs attention",
            subtitle: `${fmtMoney(Math.abs(stats.netAfterEmi || 0), sym)} more is going out than coming in ${viewMode === "month" ? "this month" : "this year"}.`
          }
        : {
            title: "Household is on track",
            subtitle: stats.totalEmi > 0
              ? `${stats.activeLoansCount || 0} EMI record(s) are being tracked alongside spending and earnings.`
              : "Income, spending, and goals are ready for planning."
          };
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
      style={{ borderColor: `${color}18`,border: "2px solid var(--gold)", background: "color-mix(in srgb, var(--surface) 96%, transparent)" }}
    >
      <div className="ledger-summary-label" style={{ color }}>{label}</div>
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
      data={data}
      onNavigate={onNav}
      user={user}
      account={data.account}
      onUpdateAccount={async (accountInfo) => {
        try {
          data.saveAccount({
            ...data.account,
            ...accountInfo,
            organizationType: accountInfo.organizationType || data.account?.organizationType || user?.organizationType
          });
        } catch (err) {
          logError("Account update error", err);
          alert("Failed to save account details. Please try again.");
        }
      }}
    />
  );

  if (isApartmentOrg) {
    const selectedMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthCollections = (data.income || []).filter(item => (item.collectionMonth || item.month || item.date?.slice(0, 7) || "") === selectedMonthKey);
    const openingBalanceCollectionsForMonth = monthCollections.reduce((sum, item) => (
      String(item?.collectionType || "").trim().toLowerCase() === "opening balance"
        ? sum + Number(item?.amount || 0)
        : sum
    ), 0);
    const openingBalanceCollectionsForYear = (data.income || []).reduce((sum, item) => {
      const itemMonth = item.collectionMonth || item.month || item.date?.slice(0, 7) || "";
      if (!itemMonth.startsWith(String(year))) return sum;
      return String(item?.collectionType || "").trim().toLowerCase() === "opening balance"
        ? sum + Number(item?.amount || 0)
        : sum;
    }, 0);
    const overallBalance = Number(stats.totalReserve || 0);
    const monthlyBalance = Number(stats.monthlyReserve || 0);
    const openingBalance = viewMode === "month"
      ? (overallBalance - monthlyBalance + openingBalanceCollectionsForMonth)
      : openingBalanceCollectionsForYear;
    const formatSignedMoney = value => `${value < 0 ? "-" : ""}${fmtMoney(Math.abs(value), sym)}`;
    const apartmentHeroSub = viewMode === "month"
      ? `Overall balance till ${MONTHS[month]} ${year}.`
      : `Overall balance for ${year}.`;

    return (
      <div className="ledger-screen">
        <div className="ledger-block">
          <WorkflowActionStrip title={apartmentSummary.title} subtitle={apartmentSummary.subtitle} actions={apartmentActions} />

          <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--accent)", ...statsStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                  Society Summary · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: heroTone }}>
                  {overallBalance < 0 ? "-" : ""}{fmtMoney(Math.abs(overallBalance), sym)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{apartmentHeroSub}</div>
              </div>
              {headerDatePicker && <div>{headerDatePicker}</div>}
            </div>
          </div>
          <div className="ledger-summary-grid">
            <Tile label={viewMode === "month" ? "Money Collected" : "Total Collected"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "Maintenance payments received this month" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={!isViewerMode ? () => onNav("income") : undefined} />
            <Tile label={viewMode === "month" ? "Money Spent" : "Total Spent"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Bills, repairs, utilities, and services" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={!isViewerMode ? () => onNav("expenses") : undefined} />
            <Tile label="Opening Balance" value={formatSignedMoney(openingBalance)} color={openingBalance >= 0 ? "var(--accent)" : "var(--danger)"} sub={viewMode === "month" ? `Balance at start of ${MONTHS[month]} ${year}` : `Balance brought into ${year}`} />
            <Tile
              label="Flats"
              value={String(stats.flatsCount || 0)}
              color="var(--gold)"
              sub={`${stats.unpaidFlats?.length || 0} pending in ${viewMode === "month" ? "this month" : "the latest month"} · open Org flats`}
              onClick={!isViewerMode ? () => onNav({ tab: "org", screen: "customers" }) : undefined}
            />
          </div>

          <ApartmentUsagePie stats={stats} sym={sym} viewMode={viewMode} isMobile={isMobile} />

          <div style={{ padding: "0 18px" }}>
            <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--danger)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
              <div className="card">
                {top5Expenses.length === 0 ? (
                  <WorkflowSetupCard title="No expenses this period" description="Add society expense entries to see the biggest costs here." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
                ) : (
                  top5Expenses.map((expense, index) => (
                    <div key={expense.id || index} className="ledger-feed-row">
                      <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                        <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                      </div>
                      <span className="ledger-feed-amount" style={{ color: "var(--danger)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                    </div>
                  ))
                )}
              </div>
            </Collapsible>
          </div>

        </div>

        {onboardingGuide}
      </div>
    );
  }

  if (isPersonalOrg) {
    const personalHeroSub = viewMode === "month"
      ? (stats.netAfterEmi >= 0 ? "Your earnings are covering spending and EMI commitments this month." : "Household cash flow is under pressure this month.")
      : (stats.netAfterEmi >= 0 ? "Your household stayed ahead of spending and EMI commitments this year." : "Household cash flow is under pressure this year.");
    return (
      <div className="ledger-screen">
        <div className="ledger-block">
          <WorkflowActionStrip title={personalSummary.title} subtitle={personalSummary.subtitle} actions={personalActions} />
          <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--gold)", ...statsStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                  Household Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: stats.netAfterEmi >= 0 ? "var(--accent)" : "var(--danger)" }}>
                  {stats.netAfterEmi < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.netAfterEmi || 0), sym)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{personalHeroSub}</div>
              </div>
              {headerDatePicker && <div>{headerDatePicker}</div>}
            </div>
          </div>
          <div className="ledger-summary-grid">
            <Tile label={viewMode === "month" ? "Earnings" : "Total Earnings"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "All household earnings" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={() => onNav("income")} />
            <Tile label={viewMode === "month" ? "Spending" : "Total Spending"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Household spending entries" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={() => onNav("expenses")} />
            <Tile label={viewMode === "month" ? "EMI Due" : "Total EMI"} value={fmtMoney(stats.totalEmi, sym)} color="var(--gold)" sub={viewMode === "month" ? `${stats.activeLoansCount || 0} active loan(s)` : `Avg ${fmtMoney(stats.avgMonthlyEmi, sym)}/month`} onClick={() => onNav("emi")} />
            <Tile label="Spending Ratio" value={`${Math.round(stats.spendingRatio || 0)}%`} color={(stats.spendingRatio || 0) >= 100 ? "var(--danger)" : "var(--gold)"} sub="Spending as a share of earnings" />
          </div>

          <PersonalUsagePie stats={stats} sym={sym} viewMode={viewMode} isMobile={isMobile} />

          <SavingsGoalCard goals={data.goals} sym={sym} onNav={onNav} />

          <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--danger)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
            <div className="card">
              {top5Expenses.length === 0 ? (
                <WorkflowSetupCard title="No expenses this period" description="Add spending entries to see your biggest expenses here." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
              ) : (
                top5Expenses.map((expense, index) => (
                  <div key={expense.id || index} className="ledger-feed-row">
                    <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                      <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="EMI Tracker" icon="◎" color="var(--gold)" count={stats.upcomingEmis.length} defaultOpen>
            <div className="card">
              {stats.upcomingEmis.length === 0 ? (
                <WorkflowSetupCard title="No EMI records yet" description="Add your active EMIs to track due dates and balances." actionLabel="Go to EMIs" onAction={() => onNav("emi")} tone="warning" />
              ) : (
                stats.upcomingEmis.map(emi => (
                  <div key={emi.id || emi.loanName} className="ledger-feed-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{emi.loanName || "EMI"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[emi.lender || "", getPersonalEmiDueDay(emi) ? `Due on ${getPersonalEmiDueDay(emi)}` : "No due date", emi.endDate ? `Ends ${emi.endDate}` : ""].filter(Boolean).join(" · ")}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(emi.monthlyEmi, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Spending Mix" icon="💸" color="var(--danger)" count={stats.topExpenseCategories.length} defaultOpen={stats.topExpenseCategories.length > 0}>
            <div className="card">
              {stats.topExpenseCategories.length === 0 ? (
                <WorkflowSetupCard title="No spending tracked yet" description="Add spending entries to see where the household budget is going." actionLabel="Go to Spending" onAction={() => onNav("expenses")} tone="danger" />
              ) : (
                stats.topExpenseCategories.map(category => (
                  <div key={category.category} className="ledger-feed-row">
                    <span style={{ fontSize: 15, color: "var(--text)" }}>{category.category}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(category.amount, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Smart Suggestions" icon="◎" color="var(--blue)" count={stats.actionTips.length} defaultOpen>
            <div className="card">
              {stats.actionTips.map((tip, index) => (
                <div key={`${tip.title}-${index}`} className="ledger-feed-row">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{tip.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{tip.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>
        </div>

        {onboardingGuide}
      </div>
    );
  }

  if (isFreelancerOrg) {
    const freelancerHeroSub = viewMode === "month"
      ? (stats.pendingInvoiceTotal > 0
        ? `You have ${fmtMoney(stats.pendingInvoiceTotal, sym)} awaiting from clients this month.`
        : stats.profit >= 0
          ? "Collected work is covering freelancer costs this month."
          : "Expenses are ahead of collected work this month.")
      : (stats.pendingInvoiceTotal > 0
        ? `You still have ${fmtMoney(stats.pendingInvoiceTotal, sym)} open across this year's invoices.`
        : stats.profit >= 0
          ? "Your freelance work stayed cash-positive this year."
          : "Expenses are ahead of collected work this year.");
    const freelancerCashFlow = viewMode === "month" ? (stats.cashFlow || []) : (stats.monthlyBreakdown || []);
    const freelancerMaxCashFlow = Math.max(1, ...freelancerCashFlow.map(item => Math.max(item.income, item.expenses)));

    return (
      <div className="ledger-screen">
        <div className="ledger-block">
          <WorkflowActionStrip title={freelancerSummary.title} subtitle={freelancerSummary.subtitle} actions={freelancerActions} />

          <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--blue)", ...statsStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                  Freelancer Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: heroTone }}>
                  {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{freelancerHeroSub}</div>
              </div>
              {headerDatePicker && <div>{headerDatePicker}</div>}
            </div>
          </div>
          <div className="ledger-summary-grid">
            <Tile label={viewMode === "month" ? "Collected" : "Total Collected"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "Payments logged plus paid client invoices" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={() => onNav("income")} />
            <Tile label={viewMode === "month" ? "Expenses" : "Total Expenses"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Tools, travel, subscriptions, and delivery costs" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={() => onNav("expenses")} />
            <Tile label="Awaiting Payments" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} client invoice(s) still open`} onClick={() => onNav("invoices")} />
            <Tile label="Overdue Invoices" value={String(stats.overdueInvoices.length || 0)} color="var(--blue)" sub="Client invoices that need immediate follow-up" onClick={() => onNav("invoices")} />
            <Tile label="Billable Costs" value={fmtMoney(stats.billableExpenseTotal || 0, sym)} color="var(--purple)" sub="Expenses marked to recharge to clients" onClick={() => onNav("expenses")} />
            <Tile label="Clients" value={String(stats.trackedClientsCount || 0)} color="var(--blue)" sub="Across client records, payments, and invoices" onClick={() => onNav("settings")} />
          </div>

          <Collapsible title="Invoice Follow-up" icon="◎" color="var(--blue)" count={(stats.overdueInvoices.length || 0) + (stats.dueSoonInvoices.length || 0)} defaultOpen>
            <div className="card">
              {stats.overdueInvoices.length === 0 && stats.dueSoonInvoices.length === 0 ? (
                <WorkflowSetupCard title="No invoice follow-up right now" description="Your open client invoices are either paid or not near their due date yet." tone="success" />
              ) : (
                [...stats.overdueInvoices, ...stats.dueSoonInvoices.filter(invoice => !stats.overdueInvoices.some(overdue => overdue.id === invoice.id))].slice(0, 6).map(invoice => (
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

          <Collapsible title="Client Snapshot" icon="⭐" color="var(--blue)" count={showAdvanced ? stats.topCustomers.length : 0} defaultOpen={showAdvanced && stats.topCustomers.length > 0}>
            <div className="card">
              {!showAdvanced ? (
                <WorkflowSetupCard title="Client insights are on Pro" description="Upgrade to Pro to see your strongest clients and outstanding balances in one place." tone="info" />
              ) : stats.topCustomers.length === 0 ? (
                <WorkflowSetupCard title="No client billing yet" description="Create invoices or log client payments to see who brings in the most work." actionLabel="Go to Invoices" onAction={() => onNav("invoices")} tone="info" />
              ) : (
                stats.topCustomers.map(client => (
                  <div key={client.name} className="ledger-feed-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={client.name} size={38} fontSize={13} />
                      <div className="ledger-feed-main">
                        <div className="ledger-feed-title">{client.name}</div>
                        <div className="ledger-feed-meta">Open balance {fmtMoney(client.balance, sym)}</div>
                      </div>
                    </div>
                    <span className="ledger-feed-amount" style={{ color: "var(--blue)" }}>{fmtMoney(client.revenue, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Freelancer Alerts" icon="🚨" color="var(--gold)" count={showAdvanced ? stats.alertItems.length : 0} defaultOpen={showAdvanced && stats.alertItems.length > 0}>
            {!showAdvanced ? (
              <div className="card">
                <WorkflowSetupCard title="Freelancer alerts are on Pro" description="Upgrade to Pro for overdue invoice alerts, spending spikes, and payment follow-up reminders." tone="warning" />
              </div>
            ) : stats.alertItems.length === 0 ? (
              <div className="card">
                <WorkflowSetupCard title="No freelancer alerts right now" description="Payments, open invoices, and spending look steady for the selected period." tone="success" />
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

          <Collapsible title="Cash Flow Trend" icon="📊" color="var(--blue)" defaultOpen={false}>
            <div className="card" style={{ padding: "18px" }}>
              {!showAdvanced ? (
                <WorkflowSetupCard title="Cash flow trend is on Pro" description={viewMode === "month" ? "Upgrade to Pro to see your six-month freelancer cash flow trend." : "Upgrade to Pro to see your yearly freelancer cash flow trend."} tone="info" />
              ) : viewMode === "month" ? (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(6, minmax(42px, 1fr))" : "repeat(6, 1fr)", gap: 8, alignItems: "end", height: 180 }}>
                  {stats.cashFlow.map(item => (
                    <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "end", gap: 4, height: 132 }}>
                        <div style={{ width: 12, height: `${Math.max(10, (item.income / freelancerMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                        <div style={{ width: 12, height: `${Math.max(10, (item.expenses / freelancerMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>{item.shortLabel}</div>
                      <div style={{ fontSize: 11, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(12, minmax(28px, 1fr))" : "repeat(12, 1fr)", gap: 6, alignItems: "end", height: 180 }}>
                  {stats.monthlyBreakdown.map(item => (
                    <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "end", gap: 2, height: 132 }}>
                        <div style={{ width: 8, height: `${Math.max(8, (item.income / freelancerMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                        <div style={{ width: 8, height: `${Math.max(8, (item.expenses / freelancerMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)" }}>{item.label.slice(0, 1)}</div>
                      <div style={{ fontSize: 10, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Collapsible>

          <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--danger)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
            <div className="card">
              {top5Expenses.length === 0 ? (
                <WorkflowSetupCard title="No expenses this period" description="Add expense entries to see your biggest costs here." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
              ) : (
                top5Expenses.map((expense, index) => (
                  <div key={expense.id || index} className="ledger-feed-row">
                    <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                      <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                    </div>
                    <span className="ledger-feed-amount" style={{ color: "var(--danger)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>
        </div>

        {onboardingGuide}
      </div>
    );
  }

  return (
    <div className="ledger-screen">
      <div className="ledger-block">
        <WorkflowActionStrip title={businessSummary.title} subtitle={businessSummary.subtitle} actions={businessActions} />
        <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: `4px solid ${heroTone}`, ...statsStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: heroTone, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                {isSmallBusinessOrg ? "Small Business Dashboard" : "Smart Dashboard"} · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: heroTone }}>
                {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{heroSub}</div>
            </div>
            {headerDatePicker && <div>{headerDatePicker}</div>}
          </div>
        </div>
        {!activeSharedOrgKey && (reviewAccessEnabled || currentPlan === PLANS.FREE || isTrial) && (
          <div style={{ marginBottom: 18, padding: "12px 14px", background: reviewAccessEnabled ? "var(--blue-deep)" : currentPlan === PLANS.FREE ? "var(--gold-deep)" : "var(--accent-deep)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--blue)" : currentPlan === PLANS.FREE ? "var(--gold)" : "var(--accent)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                {reviewAccessEnabled ? "Review Access Enabled" : currentPlan === PLANS.FREE ? "Upgrade to Pro" : "Pro Trial Active"}
              </div>
              <div style={{ fontSize: 12, color: reviewAccessEnabled ? "var(--blue)" : currentPlan === PLANS.FREE ? "var(--gold-text)" : "var(--accent-text)", marginTop: 2 }}>
                {reviewAccessEnabled ? "All premium features are unlocked right now and upgrade prompts are turned off." : currentPlan === PLANS.FREE ? "Unlock reports, PDF exports, alerts, and a 30-day free trial" : isTrial && user?.subscriptionEndsAt ? `Ends ${formatSubscriptionDate(user.subscriptionEndsAt)}` : "All Pro features active"}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--blue)" : currentPlan === PLANS.FREE ? "var(--gold)" : "var(--accent)", whiteSpace: "nowrap" }}>
              {reviewAccessEnabled ? "Full access" : currentPlan === PLANS.FREE ? "Rs 69/mo" : ""}
            </div>
          </div>
        )}

        <div className="ledger-summary-grid">
          {viewMode === "month" ? (
            <>
          <Tile label={isSmallBusinessOrg && !hasPosSystem ? "Cash In" : "Sales"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={isSmallBusinessOrg && !hasPosSystem ? "Payments and collections received" : isSmallBusinessOrg ? "Customer payments, advances, and paid invoices" : "Manual + invoice sales"} onClick={() => onNav("income")} />
              <Tile label={isSmallBusinessOrg && !hasPosSystem ? "Cash Out" : "Expenses"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={isSmallBusinessOrg && !hasPosSystem ? "Supplies, rent, and bills" : "Recurring and one-time costs"} onClick={() => onNav("expenses")} />
              {isSmallBusinessOrg && !hasPosSystem ? (
                <>
                  <Tile label="Paisa Baaki — Owed to Me" value={fmtMoney(stats.pendingSalesTotal || 0, sym)} color="var(--gold)" sub={`${stats.pendingSalesCount || 0} pending collection(s)`} onClick={() => onNav("income")} />
                  <Tile label="I Owe" value={fmtMoney(stats.partnerBalanceTotal || 0, sym)} color="var(--blue)" sub={`${(stats.partnersWithBalance || []).length} supplier / vendor due`} onClick={() => onNav("settings")} />
                </>
              ) : isSmallBusinessOrg ? (
                <>
                  <Tile label="Pending Collections" value={fmtMoney(stats.pendingSalesTotal || 0, sym)} color="var(--gold)" sub={`${stats.pendingSalesCount || 0} pending sale(s)`} onClick={() => onNav("income")} />
                  <Tile label="Refunds Issued" value={fmtMoney(stats.refundedSalesTotal || 0, sym)} color="var(--danger)" sub={`${stats.refundedSalesCount || 0} refunded sale(s)`} onClick={() => onNav("income")} />
                  <Tile label="Low Stock (<threshold)" value={String((stats.lowStockProducts || []).length)} color={(stats.lowStockProducts || []).length ? "var(--gold)" : "var(--accent)"} sub={`${stats.totalProductsCount || 0} product(s) tracked`} onClick={() => onNav("settings")} />
                </>
              ) : (
                <>
                  <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
                  {showAdvanced ? (
                    <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days`} color="var(--blue)" sub={stats.burnRateDays === null ? "Add expenses to unlock this metric" : "Estimated runway from this month's free cash"} />
                  ) : (
                    <Tile label="Advanced Metrics" value="Pro" color="var(--blue)" sub="Upgrade to unlock burn rate & more" onClick={() => {}} />
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Tile label="Total Sales" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={`Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} />
              <Tile label="Total Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={`Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} />
              {isSmallBusinessOrg && !hasPosSystem ? (
                <>
                  <Tile label="Pending Collections" value={fmtMoney(stats.pendingSalesTotal || 0, sym)} color="var(--gold)" sub={`${stats.pendingSalesCount || 0} awaiting payment this year`} onClick={() => onNav("income")} />
                  <Tile label="Partner Dues" value={fmtMoney(stats.partnerBalanceTotal || 0, sym)} color="var(--blue)" sub={`${(stats.partnersWithBalance || []).length} supplier(s) outstanding`} onClick={() => onNav("settings")} />
                </>
              ) : isSmallBusinessOrg ? (
                <>
                  <Tile label="Partner Dues" value={fmtMoney(stats.partnerBalanceTotal || 0, sym)} color="var(--gold)" sub={`${(stats.partnersWithBalance || []).length} partner account(s) still open`} onClick={() => onNav("settings")} />
                  <Tile label="Refunded Sales" value={fmtMoney(stats.refundedSalesTotal || 0, sym)} color="var(--danger)" sub={`${stats.refundedSalesCount || 0} refunded sale(s)`} onClick={() => onNav("income")} />
                </>
              ) : (
                <>
                  <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
                  <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${Math.floor(stats.burnRateDays / 12)} months`} color="var(--blue)" sub="Estimated yearly runway" />
                </>
              )}
            </>
          )}
        </div>

        {isSmallBusinessOrg && !hasPosSystem && (
          <Collapsible
            title="Paisa Baaki"
            icon="🪙"
            color="var(--gold)"
            count={(stats.pendingCustomers || []).length + (stats.partnersWithBalance || []).length}
            defaultOpen={(stats.pendingCustomers || []).length > 0 || (stats.partnersWithBalance || []).length > 0}
          >
            <div className="card">
              {(stats.pendingCustomers || []).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 14px 4px" }}>
                    Owed to Me
                  </div>
                  {stats.pendingCustomers.slice(0, 5).map(customer => (
                    <FeedRow key={customer.name} title={customer.name} amount={fmtMoney(customer.amount, sym)} amountColor="var(--gold)" />
                  ))}
                </>
              )}
              {(stats.partnersWithBalance || []).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 14px 4px" }}>
                    I Owe
                  </div>
                  {stats.partnersWithBalance.slice(0, 5).map(partner => (
                    <FeedRow
                      key={partner.partnerName}
                      title={partner.partnerName}
                      meta={partner.contact || "No contact added"}
                      amount={fmtMoney(partner.balanceDue, sym)}
                      amountColor="var(--blue)"
                    />
                  ))}
                </>
              )}
              {(stats.pendingCustomers || []).length === 0 && (stats.partnersWithBalance || []).length === 0 && (
                  <WorkflowSetupCard title="All clear" description="No pending collections and no outstanding dues to suppliers or vendors this month." tone="success" />
              )}
            </div>
          </Collapsible>
        )}

        {isSmallBusinessOrg && hasPosSystem && (
          <>
            <Collapsible
              title="Partner Balances"
              icon="🏷"
              color="var(--gold)"
              count={stats.partnersWithBalance.length || 0}
              defaultOpen={stats.partnersWithBalance.length > 0}
            >
              <div className="card">
                {stats.partnersCount === 0 ? (
                  <WorkflowSetupCard title="No partners added yet" description="Add outside partners, freelancers, venues, or vendors in Settings to track what is still payable." actionLabel="Open Settings" onAction={() => onNav("settings")} tone="warning" />
                ) : stats.partnersWithBalance.length === 0 ? (
                  <WorkflowSetupCard title="Partner balances are clear" description="No outstanding partner or vendor dues are recorded right now." tone="success" />
                ) : (
                  stats.partnersWithBalance.slice(0, 5).map(partner => (
                    <FeedRow
                      key={partner.partnerName}
                      title={partner.partnerName}
                      meta={partner.contact || "No contact added"}
                      amount={fmtMoney(partner.balanceDue, sym)}
                      amountColor="var(--gold)"
                    />
                  ))
                )}
              </div>
            </Collapsible>
          </>
        )}


        <Collapsible 
          title="Smart Alerts" 
          icon="🚨" 
          count={showAdvanced ? stats.alertItems.length : 0}
          defaultOpen={showAdvanced && stats.alertItems.length > 0}
        >
          {!showAdvanced ? (
            <div className="card">
              <WorkflowSetupCard title="Upgrade to unlock smart alerts" description="Pro plan adds due reminders, budget warnings, spending spikes, and stronger financial guidance." tone="warning" />
            </div>
          ) : stats.alertItems.length === 0 ? (
            <div className="card">
              <WorkflowSetupCard title="All clear for now" description="No urgent alerts right now. Your cash flow and collections look steady." tone="success" />
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

        <Collapsible 
          title="Cash Flow Trend" 
          icon="📊" 
          color="var(--blue)"
          defaultOpen={false}
        >
          <div className="card" style={{ padding: "18px" }}>
            {!showAdvanced ? (
              <WorkflowSetupCard title="Cash flow trend is on Pro" description={viewMode === "month" ? "Upgrade to Pro to see your six-month cash flow trend and business runway insights." : "Upgrade to Pro to see your yearly cash flow trend and business runway insights."} tone="info" />
            ) : viewMode === "month" ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(6, minmax(42px, 1fr))" : "repeat(6, 1fr)", gap: 8, alignItems: "end", height: 180 }}>
              {stats.cashFlow.map(item => (
                <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "end", gap: 4, height: 132 }}>
                    <div style={{ width: 12, height: `${Math.max(10, (item.income / maxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                    <div style={{ width: 12, height: `${Math.max(10, (item.expenses / maxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>{item.shortLabel}</div>
                  <div style={{ fontSize: 11, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                </div>
              ))}
            </div>
            ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(12, minmax(28px, 1fr))" : "repeat(12, 1fr)", gap: 6, alignItems: "end", height: 180 }}>
              {stats.monthlyBreakdown.map(item => (
                <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "end", gap: 2, height: 132 }}>
                    <div style={{ width: 8, height: `${Math.max(8, (item.income / maxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                    <div style={{ width: 8, height: `${Math.max(8, (item.expenses / maxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)" }}>{item.label.slice(0, 1)}</div>
                  <div style={{ fontSize: 10, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                </div>
              ))}
            </div>
            )}
          </div>
        </Collapsible>

        <Collapsible 
          title="Top Expense Categories" 
          icon="💰" 
          color="var(--danger)"
          count={showAdvanced ? stats.topExpenseCategories.length : 0}
          defaultOpen={showAdvanced && stats.topExpenseCategories.length > 0}
        >
          <div className="card">
            {!showAdvanced ? (
              <WorkflowSetupCard title="Category insights are on Pro" description="Upgrade to Pro to see top expense categories and smarter spending analysis." tone="danger" />
            ) : stats.topExpenseCategories.length === 0 ? (
              <WorkflowSetupCard title="No expenses yet" description="Add your first expense entry to unlock category insights and spending trends." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
            ) : (
              stats.topExpenseCategories.map(category => (
                <FeedRow key={category.category} title={category.category} amount={fmtMoney(category.amount, sym)} amountColor="var(--danger)" />
              ))
            )}
          </div>
        </Collapsible>

        {!isSmallBusinessOrg && (
        <Collapsible 
          title="High-Risk Customers" 
          icon="⚠️" 
          color="var(--gold)"
          count={showAdvanced ? stats.highRiskCustomers.length : 0}
          defaultOpen={false}
        >
          <div className="card">
            {!showAdvanced ? (
              <WorkflowSetupCard title="Risk scoring is on Pro" description="Upgrade to Pro to flag frequent late payers and reduce collection risk." tone="warning" />
            ) : stats.highRiskCustomers.length === 0 ? (
              <WorkflowSetupCard title="Healthy payment behaviour" description="No late-payment risk detected so far. Keep invoices updated to maintain this view." tone="success" />
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
        )}

        {!isSmallBusinessOrg && (
        <Collapsible 
          title="Pending Invoice Queue" 
          icon="⏰" 
          color="var(--gold)"
          count={stats.pendingInvoices.length}
          defaultOpen={stats.pendingInvoices.length > 0}
        >
          <div className="card">
            {stats.pendingInvoices.length === 0 ? (
              <WorkflowSetupCard title="Nothing pending" description="All invoices are currently paid up. New reminders will appear here automatically." tone="success" />
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
                      <div className="ledger-feed-amount" style={{ color: "var(--blue)" }}>{fmtMoney(invoice.total, sym)}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color }}>{getInvoiceStatusLabel(invoice.computedStatus)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Collapsible>
        )}

        <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--danger)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
          <div className="card">
            {top5Expenses.length === 0 ? (
              <WorkflowSetupCard title="No expenses this period" description="Add expense entries to see your biggest costs here." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} tone="danger" />
            ) : (
              top5Expenses.map((expense, index) => (
                <div key={expense.id || index} className="ledger-feed-row">
                  <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                    <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expense.note || expense.category || "Expense"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[expense.category, expense.date].filter(Boolean).join(" · ")}</div>
                  </div>
                  <span className="ledger-feed-amount" style={{ color: "var(--danger)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>
      </div>

      {onboardingGuide}
    </div>
  );
}
