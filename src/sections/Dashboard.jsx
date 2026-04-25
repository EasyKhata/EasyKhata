import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, MONTHS, DashboardSkeleton, WorkflowActionStrip, WorkflowSetupCard } from "../components/UI";
import { RupeeDisplay, HealthArc, Sparkline, ProgressLine, StatChip, TimelineEntry } from "../components/ui/reimagined";
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

    return (
      <div className="ledger-screen">
        <div className="ledger-block">

          {/* Hero card */}
          <div className="card-leather anim-fade-up" style={{ margin: "0 0 14px", padding: "22px 22px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                  {MONTHS[month]} {year} · Society Fund
                </div>
                <div style={{ marginBottom: 4 }}>
                  <RupeeDisplay amount={overallBalance} color={overallBalance >= 0 ? "var(--orchid)" : "var(--ember)"} size={48} animate />
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                  {overallBalance >= 0 ? "Society fund surplus" : "Fund in deficit"}
                </div>
              </div>
              <HealthArc pct={collectionRate} size={84} color={healthColor} />
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
          </div>

          {/* Pending alert */}
          {pendingCount > 0 && !isViewerMode && (
            <div
              className="anim-fade-up-2"
              onClick={() => onNav({ tab: "org", screen: "customers" })}
              style={{
                background: "color-mix(in srgb, var(--ember) 7%, var(--canvas))",
                border: "1px solid color-mix(in srgb, var(--ember) 20%, var(--line-2))",
                borderRadius: 14,
                padding: "12px 16px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ember)", marginBottom: 2 }}>
                  ⚠ {pendingCount} flat{pendingCount !== 1 ? "s" : ""} pending
                </div>
                <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                  {sym}{(pendingCount * (stats.totalIncome > 0 ? Math.round(stats.totalIncome / Math.max(paidFlats, 1)) : 0)).toLocaleString("en-IN")} estimated outstanding
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ember)", background: "color-mix(in srgb, var(--ember) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--ember) 25%, transparent)", borderRadius: 8, padding: "6px 12px" }}>
                View →
              </span>
            </div>
          )}

          {/* Stat chips */}
          <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <StatChip
              label={viewMode === "month" ? "Collected" : "Total Collected"}
              value={fmtMoney(stats.totalIncome, sym)}
              color="var(--orchid)"
              sub={viewMode === "month" ? "This month" : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("income") : undefined}
            />
            <StatChip
              label={viewMode === "month" ? "Expenses" : "Total Expenses"}
              value={fmtMoney(stats.totalExpense, sym)}
              color="var(--ember)"
              sub={viewMode === "month" ? "Maintenance costs" : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("expenses") : undefined}
            />
          </div>

          {/* Trend sparkline */}
          {trendData.length >= 3 && (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="section-eyebrow">Collection Trend</div>
                {headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>}
              </div>
              <Sparkline data={trendData} color="var(--orchid)" height={40} />
            </div>
          )}
          {trendData.length < 3 && headerDatePicker && (
            <div className="ledger-card-month-picker ledger-card-month-picker-inline">{headerDatePicker}</div>
          )}

          {/* Recent transactions */}
          <div className="anim-fade-up-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="section-eyebrow">Recent Activity</div>
              {!isViewerMode && (
                <button onClick={() => onNav("income")} style={{ fontSize: 11, color: "var(--orchid)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>
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
              <WorkflowSetupCard title="No entries yet" description="Add maintenance collections and society expenses to see recent activity here." actionLabel={!isViewerMode ? "Add Collection" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
            )}
          </div>

          {/* Top Expenses collapsible */}
          {top5Expenses.length > 0 && (
            <div className="anim-fade-up-5" style={{ marginTop: 14 }}>
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

  if (isPersonalOrg) {
    const netAfterEmi = Number(stats.netAfterEmi || 0);
    const spendPct = Math.min(100, Math.round(stats.spendingRatio || 0));
    const savingsGoal = Object.values(data.goals || {}).find(g => g.goalType === "savings" || g.type === "savings");
    const savingsPct = savingsGoal ? Math.min(100, Math.round((Number(savingsGoal.currentAmount || 0) / Math.max(Number(savingsGoal.targetAmount || 1), 1)) * 100)) : 0;
    const healthColor = savingsPct >= 80 ? "var(--jade)" : savingsPct >= 40 ? "var(--saffron)" : spendPct >= 90 ? "var(--ember)" : "var(--saffron)";

    const recentIncomes = (data.income || []).slice(0, 3).map(item => ({ label: item.description || item.source || "Income", amount: Number(item.amount || 0), type: "in", category: item.category || "Income", date: item.date || "" }));
    const recentExpenses = (data.expenses || []).slice(0, 3).map(item => ({ label: item.note || item.category || "Expense", amount: Number(item.amount || 0), type: "out", category: item.category || "Spending", date: item.date || "" }));
    const recentTxns = [...recentIncomes, ...recentExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
    const trendData = (stats.monthlyBreakdown || stats.cashFlow || []).map(item => item.income || 0).filter(v => v > 0);

    return (
      <div className="ledger-screen">
        <div className="ledger-block">

          {/* Hero card */}
          <div className="card-leather anim-fade-up" style={{ margin: "0 0 14px", padding: "22px 22px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                  {MONTHS[month]} {year} · Household Hisaab
                </div>
                <div style={{ marginBottom: 4 }}>
                  <RupeeDisplay amount={netAfterEmi} color={netAfterEmi >= 0 ? "var(--jade)" : "var(--ember)"} size={48} animate />
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                  {netAfterEmi >= 0 ? "Net after EMI obligations" : "Household cash flow under pressure"}
                </div>
              </div>
              {savingsGoal ? (
                <HealthArc pct={savingsPct} size={84} color={healthColor} />
              ) : (
                headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "var(--cream-3)", fontWeight: 600 }}>
                  Spending {spendPct}% of earnings
                </span>
                <span style={{ fontSize: 10, color: "var(--cream-3)" }}>
                  {sym}{(Number(stats.totalExpense || 0) / 1000).toFixed(1)}k / {sym}{(Number(stats.totalIncome || 0) / 1000).toFixed(1)}k
                </span>
              </div>
              <ProgressLine value={Number(stats.totalExpense || 0)} max={Math.max(Number(stats.totalIncome || 0), 1)} color={spendPct < 65 ? "var(--jade)" : spendPct < 85 ? "var(--saffron)" : "var(--ember)"} />
            </div>
          </div>

          {/* Stat chips */}
          <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <StatChip label={viewMode === "month" ? "Earnings" : "Total Earned"} value={fmtMoney(stats.totalIncome, sym)} color="var(--jade)" sub={viewMode === "month" ? "All household income" : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`} onClick={() => onNav("income")} />
            <StatChip label={viewMode === "month" ? "EMI Due" : "Total EMI"} value={fmtMoney(stats.totalEmi, sym)} color="var(--saffron)" sub={`${stats.activeLoansCount || 0} active loan(s)`} onClick={() => onNav("emi")} />
          </div>

          {/* Trend sparkline */}
          {trendData.length >= 3 && (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="section-eyebrow">Income Trend</div>
                {savingsGoal && headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>}
              </div>
              <Sparkline data={trendData} color="var(--jade)" height={40} />
            </div>
          )}

          {/* EMI alert */}
          {stats.upcomingEmis?.length > 0 && (
            <div
              className="anim-fade-up-3"
              onClick={() => onNav("emi")}
              style={{ background: "color-mix(in srgb, var(--saffron) 7%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--saffron) 22%, var(--line-2))", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)", marginBottom: 2 }}>
                  {stats.upcomingEmis.length} EMI{stats.upcomingEmis.length !== 1 ? "s" : ""} due
                </div>
                <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                  {stats.upcomingEmis[0]?.loanName || "EMI"} · Due {getPersonalEmiDueDay(stats.upcomingEmis[0]) || "this month"}
                </div>
              </div>
              <RupeeDisplay amount={Number(stats.totalEmi || 0)} color="var(--saffron)" size={20} />
            </div>
          )}

          {/* Recent transactions */}
          <div className="anim-fade-up-4">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="section-eyebrow">Aaj Ka Hisaab</div>
              <button onClick={() => onNav("income")} style={{ fontSize: 11, color: "var(--saffron)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font)" }}>See all →</button>
            </div>
            {recentTxns.length > 0 ? (
              <div className="card-leather" style={{ padding: "0 16px" }}>
                {recentTxns.map((tx, i) => (
                  <TimelineEntry key={i} {...tx} isLast={i === recentTxns.length - 1} delay={i * 50} />
                ))}
              </div>
            ) : (
              <WorkflowSetupCard title="No entries yet" description="Add salary, expenses, or EMIs to see your household cashflow here." actionLabel="Add Income" onAction={() => onNav("income")} tone="warning" />
            )}
          </div>

          {/* Savings goal */}
          <SavingsGoalCard goals={data.goals} sym={sym} onNav={onNav} />


        </div>
        {onboardingGuide}
      </div>
    );
  }

  if (isFreelancerOrg) {
    const netEarnings = Number(stats.profit || 0);
    const collected = Number(stats.totalIncome || 0);
    const expenses = Number(stats.totalExpense || 0);
    const earningsPct = Math.min(100, Math.round((collected / Math.max(collected + expenses, 1)) * 100));
    const freelancerTrendData = (stats.cashFlow || stats.monthlyBreakdown || []).map(item => item.income || 0).filter(v => v > 0);

    const freelancerRecentIncomes = (data.income || []).slice(0, 3).map(item => ({ label: item.description || item.source || "Payment", amount: Number(item.amount || 0), type: "in", category: item.category || "Income", date: item.date || "" }));
    const freelancerRecentExpenses = (data.expenses || []).slice(0, 3).map(item => ({ label: item.note || item.category || "Expense", amount: Number(item.amount || 0), type: "out", category: item.category || "Operations", date: item.date || "" }));
    const freelancerRecentTxns = [...freelancerRecentIncomes, ...freelancerRecentExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

    return (
      <div className="ledger-screen">
        <div className="ledger-block">

          {/* Hero card */}
          <div className="card-leather anim-fade-up" style={{ margin: "0 0 14px", padding: "22px 22px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="section-eyebrow" style={{ marginBottom: 6 }}>
                  {MONTHS[month]} {year} · Freelancer Earnings
                </div>
                <div style={{ marginBottom: 4 }}>
                  <RupeeDisplay amount={netEarnings} color={netEarnings >= 0 ? "var(--sky)" : "var(--ember)"} size={48} animate />
                </div>
                <div style={{ fontSize: 12, color: "var(--cream-3)" }}>
                  {netEarnings >= 0 ? "Net after expenses" : "Expenses ahead of collected work"}
                </div>
              </div>
              <HealthArc pct={earningsPct} size={84} color="var(--sky)" />
            </div>
            {headerDatePicker && <div className="ledger-card-month-picker ledger-card-month-picker-inline">{headerDatePicker}</div>}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "var(--cream-3)", fontWeight: 600 }}>Collected vs Expenses</span>
                <span style={{ fontSize: 10, color: "var(--cream-3)" }}>{sym}{(collected / 1000).toFixed(1)}k in · {sym}{(expenses / 1000).toFixed(1)}k out</span>
              </div>
              <ProgressLine value={collected} max={Math.max(collected + expenses, 1)} color="var(--sky)" />
            </div>
          </div>

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
              sub={viewMode === "month" ? "Tools, travel, subscriptions" : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
              onClick={!isViewerMode ? () => onNav("expenses") : undefined}
            />
          </div>

          {/* Trend sparkline */}
          {freelancerTrendData.length >= 3 && (
            <div className="card-leather anim-fade-up-3" style={{ padding: "14px 16px", marginBottom: 14 }}>
              <div className="section-eyebrow" style={{ marginBottom: 10 }}>Earnings Trend</div>
              <Sparkline data={freelancerTrendData} color="var(--sky)" height={40} />
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
              <WorkflowSetupCard title="No entries yet" description="Add client payments and work expenses to see your freelancer cashflow here." actionLabel={!isViewerMode ? "Log Payment" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
            )}
          </div>

          {/* Invoice Follow-up */}
          <div className="anim-fade-up-5" style={{ marginTop: 14 }}>
            <Collapsible title="Invoice Follow-up" icon="◎" color="var(--sky)" count={(stats.overdueInvoices?.length || 0) + (stats.dueSoonInvoices?.length || 0)} defaultOpen>
              <div className="card">
                {(stats.overdueInvoices?.length || 0) === 0 && (stats.dueSoonInvoices?.length || 0) === 0 ? (
                  <WorkflowSetupCard title="No invoice follow-up right now" description="Your open client invoices are either paid or not near their due date yet." tone="success" />
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
                {MONTHS[month]} {year} · {isSmallBusinessOrg ? "Business Overview" : "Smart Dashboard"}
              </div>
              <div style={{ marginBottom: 4 }}>
                <RupeeDisplay amount={Number(stats.profit || 0)} color={Number(stats.profit || 0) >= 0 ? "var(--jade)" : "var(--ember)"} size={48} animate />
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

        {/* Plan / review access banner */}
        {!activeSharedOrgKey && (reviewAccessEnabled || currentPlan === PLANS.FREE || isTrial) && (
          <div style={{ marginBottom: 14, padding: "12px 14px", background: reviewAccessEnabled ? "color-mix(in srgb, var(--sky) 8%, var(--canvas))" : currentPlan === PLANS.FREE ? "color-mix(in srgb, var(--saffron) 8%, var(--canvas))" : "color-mix(in srgb, var(--jade) 8%, var(--canvas))", borderRadius: 14, border: `1px solid color-mix(in srgb, ${reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)"} 22%, var(--line-2))`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>
                {reviewAccessEnabled ? "Review Access Enabled" : currentPlan === PLANS.FREE ? "Upgrade to Pro" : "Pro Trial Active"}
              </div>
              <div style={{ fontSize: 11, color: "var(--cream-3)" }}>
                {reviewAccessEnabled ? "All premium features are unlocked right now." : currentPlan === PLANS.FREE ? "Unlock reports, PDF exports, alerts, and a 30-day free trial" : isTrial && user?.subscriptionEndsAt ? `Ends ${formatSubscriptionDate(user.subscriptionEndsAt)}` : "All Pro features active"}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: reviewAccessEnabled ? "var(--sky)" : currentPlan === PLANS.FREE ? "var(--saffron)" : "var(--jade)", whiteSpace: "nowrap" }}>
              {reviewAccessEnabled ? "Full access" : currentPlan === PLANS.FREE ? "Rs 69/mo" : ""}
            </div>
          </div>
        )}

        {/* Stat chips */}
        <div className="anim-fade-up-2" style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <StatChip
            label={isSmallBusinessOrg && !hasPosSystem ? (viewMode === "month" ? "Cash In" : "Total Cash In") : (viewMode === "month" ? "Sales" : "Total Sales")}
            value={fmtMoney(stats.totalIncome, sym)}
            color="var(--jade)"
            sub={viewMode === "month" ? (isSmallBusinessOrg && !hasPosSystem ? "Payments received" : "Revenue collected") : `Avg ${fmtMoney(stats.avgMonthlyIncome || 0, sym)}/mo`}
            onClick={!isViewerMode ? () => onNav("income") : undefined}
          />
          <StatChip
            label={isSmallBusinessOrg && !hasPosSystem ? (viewMode === "month" ? "Cash Out" : "Total Cash Out") : (viewMode === "month" ? "Expenses" : "Total Expenses")}
            value={fmtMoney(stats.totalExpense, sym)}
            color="var(--ember)"
            sub={viewMode === "month" ? (isSmallBusinessOrg && !hasPosSystem ? "Supplies, rent, bills" : "Recurring and one-time costs") : `Avg ${fmtMoney(stats.avgMonthlyExpense || 0, sym)}/mo`}
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

        {/* Pending dues callout */}
        {isSmallBusinessOrg && !hasPosSystem && (stats.pendingSalesTotal || 0) > 0 && (
          <div
            className="anim-fade-up-3"
            onClick={() => onNav("income")}
            style={{ background: "color-mix(in srgb, var(--saffron) 7%, var(--canvas))", border: "1px solid color-mix(in srgb, var(--saffron) 22%, var(--line-2))", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--saffron)", marginBottom: 2 }}>
                {stats.pendingSalesCount || 0} collection{(stats.pendingSalesCount || 0) !== 1 ? "s" : ""} pending
              </div>
              <div style={{ fontSize: 11, color: "var(--cream-3)" }}>Tap to see and follow up</div>
            </div>
            <RupeeDisplay amount={Number(stats.pendingSalesTotal || 0)} color="var(--saffron)" size={20} />
          </div>
        )}

        {/* Pending invoices callout for non-small-business */}
        {!isSmallBusinessOrg && (stats.pendingInvoiceTotal || 0) > 0 && (
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
                <WorkflowSetupCard title="No entries yet" description="Add sales and expenses to see your business cashflow here." actionLabel={!isViewerMode ? "Add Entry" : undefined} onAction={!isViewerMode ? () => onNav("income") : undefined} tone="info" />
              )}
            </div>
          );
        })()}

        {isSmallBusinessOrg && !hasPosSystem && (
          <Collapsible
            title="Paisa Baaki"
            icon="🪙"
            color="var(--saffron)"
            count={(stats.pendingCustomers || []).length + (stats.partnersWithBalance || []).length}
            defaultOpen={(stats.pendingCustomers || []).length > 0 || (stats.partnersWithBalance || []).length > 0}
          >
            <div className="card">
              {(stats.pendingCustomers || []).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 14px 4px" }}>
                    Owed to Me
                  </div>
                  {stats.pendingCustomers.slice(0, 5).map(customer => (
                    <FeedRow key={customer.name} title={customer.name} amount={fmtMoney(customer.amount, sym)} amountColor="var(--saffron)" />
                  ))}
                </>
              )}
              {(stats.partnersWithBalance || []).length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sky)", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 14px 4px" }}>
                    I Owe
                  </div>
                  {stats.partnersWithBalance.slice(0, 5).map(partner => (
                    <FeedRow
                      key={partner.partnerName}
                      title={partner.partnerName}
                      meta={partner.contact || "No contact added"}
                      amount={fmtMoney(partner.balanceDue, sym)}
                      amountColor="var(--sky)"
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
          <Collapsible
            title="Partner Balances"
            icon="🏷"
            color="var(--saffron)"
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
                    amountColor="var(--saffron)"
                  />
                ))
              )}
            </div>
          </Collapsible>
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

        <Collapsible title={`Top Expenses · ${viewMode === "month" ? MONTHS[month] : year}`} icon="◎" color="var(--ember)" count={top5Expenses.length} defaultOpen={top5Expenses.length > 0}>
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
                  <span className="ledger-feed-amount" style={{ color: "var(--ember)", flexShrink: 0 }}>{fmtMoney(Number(expense.amount || 0), sym)}</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>

        {!isSmallBusinessOrg && (
          <Collapsible
            title="High-Risk Customers"
            icon="⚠️"
            color="var(--saffron)"
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
            color="var(--saffron)"
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
                        <div className="ledger-feed-amount" style={{ color: "var(--sky)" }}>{fmtMoney(invoice.total, sym)}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color }}>{getInvoiceStatusLabel(invoice.computedStatus)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Collapsible>
        )}

      </div>

      {onboardingGuide}
    </div>
  );
}
