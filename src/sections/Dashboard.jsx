import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, MONTHS, DashboardSkeleton, EmptyState } from "../components/UI";
import {
  calculateApartmentDashboard,
  calculateApartmentYearlyDashboard,
  calculateDashboard,
  calculateFreelancerDashboard,
  calculateFreelancerYearlyDashboard,
  calculatePersonalDashboard,
  calculatePersonalYearlyDashboard,
  calculateRetailDashboard,
  calculateRetailYearlyDashboard,
  calculateSmallBusinessDashboard,
  calculateSmallBusinessYearlyDashboard,
  calculateYearlyDashboard,
  getPersonalEmiDueDay,
  getInvoiceStatusColor,
  getInvoiceStatusLabel
} from "../utils/analytics";
import { useAuth } from "../context/AuthContext";
import { PLANS, canUseFeature, formatSubscriptionDate, getUserPlan, isReviewAccessEnabled } from "../utils/subscription";
import OnboardingGuide from "../components/OnboardingGuide";
import Collapsible from "../components/Collapsible";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

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

function PersonalUsagePie({ stats, sym, viewMode }) {
  const segments = [
    { label: "Spending", value: Math.max(0, Number(stats.totalExpense || 0)), color: "var(--danger)" },
    { label: "EMI", value: Math.max(0, Number(stats.totalEmi || 0)), color: "var(--gold)" },
    {
      label: (stats.netAfterEmi || 0) >= 0 ? "Remaining" : "Shortfall",
      value: Math.abs(Number(stats.netAfterEmi || 0)),
      color: (stats.netAfterEmi || 0) >= 0 ? "var(--accent)" : "var(--purple)"
    }
  ].filter(item => item.value > 0);

  const total = segments.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return (
      <div className="card" style={{ padding: 18, marginBottom: 22 }}>
        <EmptyState
          title="No earnings usage yet"
          message={`Add earnings, spendings, or EMI entries to see how money is being used for this ${viewMode === "month" ? "month" : "year"}.`}
          accentColor="var(--blue)"
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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 190px) minmax(0, 1fr)", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Earnings usage pie chart">
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
              <div key={segment.label} className="card-row" style={{ padding: 0, border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 999, background: segment.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{segment.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{pct}% of tracked usage</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmtMoney(segment.value, sym)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ year, month, viewMode: propViewMode, onNav }) {
  const data = useData();
  const { user, updateProfile } = useAuth();
  const sym = data.currency?.symbol || "Rs";
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [viewMode, setViewMode] = useState(propViewMode || "month"); // "month" or "year"

  // Show setup guide for normal users on first visit
  useEffect(() => {
    setViewMode(propViewMode || "month");
  }, [propViewMode]);

  useEffect(() => {
    if (!data.loaded || !user?.id || user?.onboardingSeenAt) return;
    setShowSetupGuide(true);
  }, [data.loaded, user?.id, user?.onboardingSeenAt]);

  if (!data.loaded) {
    return <DashboardSkeleton />;
  }

  const orgType = getOrgType(data.account?.organizationType || user?.organizationType);
  const isApartmentOrg = orgType === ORG_TYPES.APARTMENT;
  const isFreelancerOrg = orgType === ORG_TYPES.FREELANCER;
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = orgType === ORG_TYPES.SMALL_BUSINESS;
  const isRetailOrg = orgType === ORG_TYPES.RETAIL;
  const stats = isApartmentOrg
    ? (viewMode === "month" ? calculateApartmentDashboard(data, year, month) : calculateApartmentYearlyDashboard(data, year))
    : isFreelancerOrg
      ? (viewMode === "month" ? calculateFreelancerDashboard(data, year, month) : calculateFreelancerYearlyDashboard(data, year))
      : isRetailOrg
        ? (viewMode === "month" ? calculateRetailDashboard(data, year, month) : calculateRetailYearlyDashboard(data, year))
    : isSmallBusinessOrg
      ? (viewMode === "month" ? calculateSmallBusinessDashboard(data, year, month) : calculateSmallBusinessYearlyDashboard(data, year))
    : isPersonalOrg
      ? (viewMode === "month" ? calculatePersonalDashboard(data, year, month) : calculatePersonalYearlyDashboard(data, year))
    : (viewMode === "month" ? calculateDashboard(data, year, month) : calculateYearlyDashboard(data, year));
  const showAdvanced = canUseFeature(user, "advancedAnalytics");
  const currentPlan = getUserPlan(user);
  const isTrial = user?.subscriptionStatus === "trial";
  const reviewAccessEnabled = isReviewAccessEnabled();

  const heroTone = stats.profit >= 0 ? "var(--accent)" : "var(--danger)";
  const heroSub = isRetailOrg
    ? (viewMode === "month"
      ? ((stats.supplierBalanceTotal || 0) > 0
        ? `${fmtMoney(stats.supplierBalanceTotal || 0, sym)} is still pending across supplier balances this month.`
        : stats.profit >= 0
          ? "Daily sales are covering shop purchases and running costs this month."
          : "Purchases and shop costs are ahead of sales this month.")
      : ((stats.supplierBalanceTotal || 0) > 0
        ? `${fmtMoney(stats.supplierBalanceTotal || 0, sym)} is still open across supplier balances this year.`
        : stats.profit >= 0
          ? "The shop stayed ahead of purchases and costs across the year."
          : "Purchases and shop costs are ahead of sales across the year."))
    : isSmallBusinessOrg
    ? (viewMode === "month"
      ? (stats.pendingInvoiceTotal > 0
        ? `${fmtMoney(stats.pendingInvoiceTotal, sym)} is still awaiting collection from customers this month.`
        : stats.profit >= 0
          ? "Client work and collections are staying ahead of business costs this month."
          : "Expenses are ahead of business receipts this month.")
      : (stats.partnerBalanceTotal > 0
        ? `${fmtMoney(stats.partnerBalanceTotal, sym)} is still due across partner balances this year.`
        : stats.profit >= 0
          ? "The business stayed profitable across the year."
          : "Expenses are ahead of receipts across the year."))
    : viewMode === "month" 
    ? (stats.profit >= 0 ? "You are staying profitable this month." : "Expenses are ahead of receipts this month.")
    : (stats.profit >= 0 ? "You're profitable for the year." : "Expenses exceed receipts for the year.");
  
  const maxCashFlow = viewMode === "month" 
    ? Math.max(1, ...stats.cashFlow.map(item => Math.max(item.income, item.expenses)))
    : Math.max(1, ...stats.monthlyBreakdown.map(item => Math.max(item.income, item.expenses)));

  const Tile = ({ label, value, color, sub, onClick }) => (
    <div onClick={onClick} style={{ background: "var(--surface)", border: `1px solid ${color}33`, borderRadius: 18, padding: "18px 16px", cursor: onClick ? "pointer" : "default", boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, color, letterSpacing: -0.5, marginBottom: sub ? 5 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{sub}</div>}
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
          console.error("Account update error:", err);
          alert("Failed to save account details. Please try again.");
        }
      }}
    />
  );

  if (isApartmentOrg) {
    const apartmentHeroSub = viewMode === "month"
      ? (stats.profit >= 0 ? "Collections are covering society expenses this month." : "Society expenses are ahead of collections this month.")
      : (stats.profit >= 0 ? "Collections are covering society expenses this year." : "Society expenses are ahead of collections this year.");
    const apartmentCashFlow = viewMode === "month" ? stats.cashFlow : stats.monthlyBreakdown;
    const apartmentMaxCashFlow = Math.max(1, ...apartmentCashFlow.map(item => Math.max(item.income, item.expenses)));

    return (
      <div style={{ paddingBottom: 20 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Society Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
            {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{apartmentHeroSub}</div>
        </div>

        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <Tile label={viewMode === "month" ? "Collections" : "Total Collections"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "Recorded maintenance collections" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={() => onNav("income")} />
            <Tile label={viewMode === "month" ? "Society Expenses" : "Total Expenses"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Bills, utilities, repairs, and services" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={() => onNav("expenses")} />
            <Tile label={viewMode === "month" ? "Monthly Reserve" : "Latest Month Reserve"} value={fmtMoney(stats.monthlyReserve || 0, sym)} color={(stats.monthlyReserve || 0) >= 0 ? "var(--blue)" : "var(--danger)"} sub={viewMode === "month" ? "Collections minus expenses for this month" : "Net result of the latest month in this year"} />
            <Tile label="Total Reserve" value={fmtMoney(stats.totalReserve || 0, sym)} color={(stats.totalReserve || 0) >= 0 ? "var(--accent)" : "var(--danger)"} sub={viewMode === "month" ? "Running reserve up to this month" : "Collections minus expenses for the year"} />
            <Tile label="Residents / Flats" value={String(stats.flatsCount || 0)} color="var(--gold)" sub={`${stats.residentsCount || 0} owner / tenant names linked in Settings`} onClick={() => onNav("settings")} />
          </div>

          <Collapsible title="Collection Status" icon="🏠" color="var(--blue)" count={viewMode === "month" ? stats.unpaidFlats.length : stats.flatsCount || 0} defaultOpen>
            <div className="card">
              {viewMode === "month" && stats.flatsCount === 0 ? (
                <EmptyState title="Add flats first" message="Create your flat list in Settings so maintenance collections can be tracked unit by unit." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--blue)" />
              ) : viewMode === "month" && stats.unpaidFlats.length === 0 ? (
                <EmptyState title="All tracked flats are covered" message="Every flat in Settings has a recorded collection for this month." accentColor="var(--accent)" />
              ) : viewMode === "month" ? (
                stats.unpaidFlats.map(flat => (
                  <div key={flat.id || flat.flatNumber} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{flat.flatNumber || "Flat"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {[flat.ownerName || flat.tenantName || "No resident assigned", flat.phone || "No phone number added"]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>Pending</span>
                  </div>
                ))
              ) : (
                <div className="card-row">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Flat records tracked</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Use monthly view to see which flat numbers have a recorded collection.</div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{stats.flatsCount || 0}</span>
                </div>
              )}
            </div>
          </Collapsible>

          <Collapsible title="Recent Collections" icon="⬇" color="var(--accent)" count={viewMode === "month" ? stats.recentCollections.length : 0} defaultOpen={viewMode === "month" && stats.recentCollections.length > 0}>
            <div className="card">
              {viewMode !== "month" ? (
                <EmptyState title="Switch to monthly view" message="Recent collection activity is shown in monthly view so you can track which flats paid this month." accentColor="var(--accent)" />
              ) : stats.recentCollections.length === 0 ? (
                <EmptyState title="No collections recorded" message="Add maintenance collections from the Income tab after creating residents and flats in Settings." actionLabel="Go to Collections" onAction={() => onNav("income")} accentColor="var(--accent)" />
              ) : (
                stats.recentCollections.map(item => (
                  <div key={item.id} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.flatNumber || "Flat"} · {item.residentName || "Resident"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {[item.collectionType || "Collection", item.collectionMonth || item.month || "", item.date || ""].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(item.amount, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Society Alerts" icon="🚨" color="var(--gold)" count={stats.alertItems.length} defaultOpen={stats.alertItems.length > 0}>
            <div className="card">
              {stats.alertItems.length === 0 ? (
                <EmptyState title="No society alerts right now" message="Collections and expenses look stable for the selected period." accentColor="var(--accent)" />
              ) : (
                stats.alertItems.map((alert, index) => {
                  const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                  return (
                    <div key={`${alert.title}-${index}`} className="card-row">
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginRight: 12, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{alert.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{alert.message}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Collapsible>

          <Collapsible title="Expense Categories" icon="💰" color="var(--danger)" count={stats.topExpenseCategories.length} defaultOpen={stats.topExpenseCategories.length > 0}>
            <div className="card">
              {stats.topExpenseCategories.length === 0 ? (
                <EmptyState title="No society expenses yet" message="Record utility bills, repairs, and other society expenses from the Expenses tab." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} accentColor="var(--danger)" />
              ) : (
                stats.topExpenseCategories.map(category => (
                  <div key={category.category} className="card-row">
                    <span style={{ fontSize: 15, color: "var(--text)" }}>{category.category}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(category.amount, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Collection Trend" icon="📊" color="var(--blue)" defaultOpen={false}>
            <div className="card" style={{ padding: "18px" }}>
              {!showAdvanced ? (
                <EmptyState title="Trend view is on Pro" message="Upgrade to Pro to compare society collections and expenses over time." accentColor="var(--blue)" />
              ) : viewMode === "month" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, alignItems: "end", height: 180 }}>
                  {stats.cashFlow.map(item => (
                    <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "end", gap: 4, height: 132 }}>
                        <div style={{ width: 12, height: `${Math.max(10, (item.income / apartmentMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                        <div style={{ width: 12, height: `${Math.max(10, (item.expenses / apartmentMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>{item.shortLabel}</div>
                      <div style={{ fontSize: 11, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, alignItems: "end", height: 180 }}>
                  {stats.monthlyBreakdown.map(item => (
                    <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "end", gap: 2, height: 132 }}>
                        <div style={{ width: 8, height: `${Math.max(8, (item.income / apartmentMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                        <div style={{ width: 8, height: `${Math.max(8, (item.expenses / apartmentMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-dim)" }}>{item.label.slice(0, 1)}</div>
                      <div style={{ fontSize: 10, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Collapsible>
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
      <div style={{ paddingBottom: 20 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--gold-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Household Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: stats.netAfterEmi >= 0 ? "var(--accent)" : "var(--danger)", letterSpacing: -1, lineHeight: 1 }}>
            {stats.netAfterEmi < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.netAfterEmi || 0), sym)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{personalHeroSub}</div>
        </div>

        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <Tile label={viewMode === "month" ? "Earnings" : "Total Earnings"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "All household earnings" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={() => onNav("income")} />
            <Tile label={viewMode === "month" ? "Spending" : "Total Spending"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Household spending entries" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={() => onNav("expenses")} />
            <Tile label={viewMode === "month" ? "EMI Due" : "Total EMI"} value={fmtMoney(stats.totalEmi, sym)} color="var(--gold)" sub={viewMode === "month" ? `${stats.activeLoansCount || 0} active loan(s)` : `Avg ${fmtMoney(stats.avgMonthlyEmi, sym)}/month`} onClick={() => onNav("emi")} />
            <Tile label={viewMode === "month" ? "Net After EMI" : "Yearly Net After EMI"} value={fmtMoney(stats.netAfterEmi || 0, sym)} color={(stats.netAfterEmi || 0) >= 0 ? "var(--accent)" : "var(--danger)"} sub={viewMode === "month" ? "Cash left after spending and EMI" : "Yearly cash left after spending and EMI"} />
            <Tile label="People" value={String(stats.peopleCount || 0)} color="var(--purple)" sub="From Org and tagged household entries" onClick={() => onNav({ tab: "org", screen: "customers" })} />
            <Tile label="Spending Ratio" value={`${Math.round(stats.spendingRatio || 0)}%`} color={(stats.spendingRatio || 0) >= 100 ? "var(--danger)" : "var(--gold)"} sub="Spending as a share of earnings" />
          </div>

          <PersonalUsagePie stats={stats} sym={sym} viewMode={viewMode} />

          <Collapsible title="EMI Tracker" icon="◎" color="var(--gold)" count={stats.upcomingEmis.length} defaultOpen>
            <div className="card">
              {stats.upcomingEmis.length === 0 ? (
                <EmptyState title="No EMI records yet" message="Add your active EMIs to track due dates and balances." actionLabel="Go to EMIs" onAction={() => onNav("emi")} accentColor="var(--gold)" />
              ) : (
                stats.upcomingEmis.map(emi => (
                  <div key={emi.id || emi.loanName} className="card-row">
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
                <EmptyState title="No spending tracked yet" message="Add spending entries to see where the household budget is going." actionLabel="Go to Spending" onAction={() => onNav("expenses")} accentColor="var(--danger)" />
              ) : (
                stats.topExpenseCategories.map(category => (
                  <div key={category.category} className="card-row">
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
                <div key={`${tip.title}-${index}`} className="card-row">
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
    const freelancerCashFlow = viewMode === "month" ? stats.cashFlow : stats.monthlyBreakdown;
    const freelancerMaxCashFlow = Math.max(1, ...freelancerCashFlow.map(item => Math.max(item.income, item.expenses)));

    return (
      <div style={{ paddingBottom: 20 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Freelancer Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
            {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{freelancerHeroSub}</div>
        </div>

        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
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
                <EmptyState title="No invoice follow-up right now" message="Your open client invoices are either paid or not near their due date yet." accentColor="var(--accent)" />
              ) : (
                [...stats.overdueInvoices, ...stats.dueSoonInvoices.filter(invoice => !stats.overdueInvoices.some(overdue => overdue.id === invoice.id))].slice(0, 6).map(invoice => (
                  <div key={invoice.id} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{invoice.number || "Invoice"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {[invoice.customer?.name || invoice.billTo?.name || "No client", invoice.dueDate ? `Due ${invoice.dueDate}` : "No due date"].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: getInvoiceStatusColor(invoice.status || invoice.computedStatus || "pending") }}>{fmtMoney(invoice.total || 0, sym)}</div>
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
                <EmptyState title="Client insights are on Pro" message="Upgrade to Pro to see your strongest clients and outstanding balances in one place." accentColor="var(--blue)" />
              ) : stats.topCustomers.length === 0 ? (
                <EmptyState title="No client billing yet" message="Create invoices or log client payments to see who brings in the most work." actionLabel="Go to Invoices" onAction={() => onNav("invoices")} accentColor="var(--blue)" />
              ) : (
                stats.topCustomers.map(client => (
                  <div key={client.name} className="card-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={client.name} size={38} fontSize={13} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{client.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Open balance {fmtMoney(client.balance, sym)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(client.revenue, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Freelancer Alerts" icon="🚨" color="var(--gold)" count={showAdvanced ? stats.alertItems.length : 0} defaultOpen={showAdvanced && stats.alertItems.length > 0}>
            {!showAdvanced ? (
              <div className="card">
                <EmptyState title="Freelancer alerts are on Pro" message="Upgrade to Pro for overdue invoice alerts, spending spikes, and payment follow-up reminders." accentColor="var(--gold)" />
              </div>
            ) : stats.alertItems.length === 0 ? (
              <div className="card">
                <EmptyState title="No freelancer alerts right now" message="Payments, open invoices, and spending look steady for the selected period." accentColor="var(--accent)" />
              </div>
            ) : (
              <div className="card">
                {stats.alertItems.map((alert, index) => {
                  const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                  return (
                    <div key={`${alert.title}-${index}`} className="card-row">
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginRight: 12, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{alert.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{alert.message}</div>
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
                <EmptyState title="Cash flow trend is on Pro" message={viewMode === "month" ? "Upgrade to Pro to see your six-month freelancer cash flow trend." : "Upgrade to Pro to see your yearly freelancer cash flow trend."} accentColor="var(--blue)" />
              ) : viewMode === "month" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, alignItems: "end", height: 180 }}>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, alignItems: "end", height: 180 }}>
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
        </div>

        {onboardingGuide}
      </div>
    );
  }

  if (isRetailOrg) {
    const retailHeroSub = viewMode === "month"
      ? (stats.profit >= 0 ? "Sales are covering purchases and shop running costs this month." : "Purchases and shop costs are ahead of sales this month.")
      : (stats.profit >= 0 ? "Sales stayed ahead of purchases and shop costs this year." : "Purchases and shop costs are ahead of sales this year.");
    const retailCashFlow = viewMode === "month" ? stats.cashFlow : stats.monthlyBreakdown;
    const retailMaxCashFlow = Math.max(1, ...retailCashFlow.map(item => Math.max(item.income, item.expenses)));

    return (
      <div style={{ paddingBottom: 20 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Retail Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
            {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{retailHeroSub}</div>
        </div>

        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <Tile label={viewMode === "month" ? "Sales" : "Total Sales"} value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={viewMode === "month" ? "Recorded daily sales" : `Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} onClick={() => onNav("income")} />
            <Tile label={viewMode === "month" ? "Purchases & Expenses" : "Total Purchases & Expenses"} value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={viewMode === "month" ? "Stock buying plus shop costs" : `Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} onClick={() => onNav("expenses")} />
            <Tile label="Stock Value" value={fmtMoney(stats.inventoryValue || 0, sym)} color="var(--blue)" sub={`${stats.inventoryCount || 0} product(s) tracked`} onClick={() => onNav("settings")} />
            <Tile label="Supplier Dues" value={fmtMoney(stats.supplierBalanceTotal || 0, sym)} color="var(--gold)" sub={`${stats.suppliersWithBalance.length || 0} supplier account(s) open`} onClick={() => onNav("settings")} />
            <Tile label="Stock Purchases" value={fmtMoney(stats.stockPurchaseTotal || 0, sym)} color="var(--purple)" sub={viewMode === "month" ? "Inventory bought this period" : "Stock buying across the year"} onClick={() => onNav("expenses")} />
            <Tile label="Low Stock" value={String(stats.lowStockItems.length || 0)} color={(stats.lowStockItems.length || 0) > 0 ? "var(--danger)" : "var(--accent)"} sub="Products needing refill soon" onClick={() => onNav("settings")} />
          </div>

          <Collapsible title="Inventory Snapshot" icon="📦" color="var(--blue)" count={stats.inventoryCount || 0} defaultOpen>
            <div className="card">
              {stats.inventoryCount === 0 ? (
                <EmptyState title="No inventory added yet" message="Add your shop products in Settings so stock and sales become easier to track." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--blue)" />
              ) : (
                (stats.topProducts || []).slice(0, 6).map(item => (
                  <div key={item.productName} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.productName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {[`${item.stock} in stock`, item.expiryDate ? `Exp ${item.expiryDate}` : "No expiry date"].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(item.inventoryValue || 0, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Low Stock Watch" icon="⚠" color="var(--danger)" count={stats.lowStockItems.length || 0} defaultOpen={stats.lowStockItems.length > 0}>
            <div className="card">
              {stats.lowStockItems.length === 0 ? (
                <EmptyState title="No low-stock alerts" message="Tracked inventory levels look healthy right now." accentColor="var(--accent)" />
              ) : (
                stats.lowStockItems.slice(0, 6).map(item => (
                  <div key={item.productName} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.productName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{item.expiryDate ? `Expiry ${item.expiryDate}` : "No expiry date added"}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{item.stock}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Supplier Balances" icon="🏷" color="var(--gold)" count={stats.suppliersWithBalance.length || 0} defaultOpen={stats.suppliersWithBalance.length > 0}>
            <div className="card">
              {stats.suppliersCount === 0 ? (
                <EmptyState title="No suppliers added yet" message="Add suppliers in Settings to track balances and contacts." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--gold)" />
              ) : stats.suppliersWithBalance.length === 0 ? (
                <EmptyState title="Supplier balances are clear" message="No outstanding supplier credit is recorded right now." accentColor="var(--accent)" />
              ) : (
                stats.suppliersWithBalance.slice(0, 6).map(supplier => (
                  <div key={supplier.supplierName} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{supplier.supplierName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{supplier.contact || "No contact added"}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(supplier.creditBalance || 0, sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="Shop Alerts" icon="🚨" color="var(--gold)" count={stats.alertItems.length} defaultOpen={stats.alertItems.length > 0}>
            <div className="card">
              {stats.alertItems.length === 0 ? (
                <EmptyState title="No shop alerts right now" message="Sales, stock, and supplier balances look stable for the selected period." accentColor="var(--accent)" />
              ) : (
                stats.alertItems.map((alert, index) => {
                  const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                  return (
                    <div key={`${alert.title}-${index}`} className="card-row">
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginRight: 12, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{alert.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{alert.message}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Collapsible>

          <Collapsible title="Sales Trend" icon="📊" color="var(--blue)" defaultOpen={false}>
            <div className="card" style={{ padding: "18px" }}>
              {!showAdvanced ? (
                <EmptyState title="Trend view is on Pro" message="Upgrade to Pro to compare shop sales and expenses over time." accentColor="var(--blue)" />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${viewMode === "month" ? 6 : 12}, 1fr)`, gap: viewMode === "month" ? 8 : 6, alignItems: "end", height: 180 }}>
                  {retailCashFlow.map(item => (
                    <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "end", gap: viewMode === "month" ? 4 : 2, height: 132 }}>
                        <div style={{ width: viewMode === "month" ? 12 : 8, height: `${Math.max(viewMode === "month" ? 10 : 8, (item.income / retailMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                        <div style={{ width: viewMode === "month" ? 12 : 8, height: `${Math.max(viewMode === "month" ? 10 : 8, (item.expenses / retailMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: viewMode === "month" ? 11 : 10, fontWeight: 600, color: "var(--text-dim)" }}>{viewMode === "month" ? item.shortLabel : item.label.slice(0, 1)}</div>
                      <div style={{ fontSize: 10, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {onboardingGuide}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          {isSmallBusinessOrg ? "Small Business Dashboard" : "Smart Dashboard"} · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
          {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{heroSub}</div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        {(reviewAccessEnabled || currentPlan === PLANS.FREE || isTrial) && (
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
              {reviewAccessEnabled ? "Full access" : currentPlan === PLANS.FREE ? "Rs 49/mo" : ""}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          {viewMode === "month" ? (
            <>
          <Tile label="Receipts" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={isSmallBusinessOrg ? "Client payments, advances, and paid invoices" : "Manual + invoice receipts"} onClick={() => onNav("income")} />
              <Tile label="Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub="Recurring and one-time costs" onClick={() => onNav("expenses")} />
              <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
              {isSmallBusinessOrg ? (
                <Tile label="Services" value={String(stats.servicesCount || 0)} color="var(--blue)" sub={`${stats.teamCount || 0} team member(s) configured`} onClick={() => onNav("settings")} />
              ) : showAdvanced ? (
                <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days`} color="var(--blue)" sub={stats.burnRateDays === null ? "Add expenses to unlock this metric" : "Estimated runway from this month's free cash"} />
              ) : (
                <Tile label="Advanced Metrics" value="Pro" color="var(--blue)" sub="Upgrade to unlock burn rate & more" onClick={() => {}} />
              )}
            </>
          ) : (
            <>
              <Tile label="Total Receipts" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={`Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} />
              <Tile label="Total Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={`Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} />
              {isSmallBusinessOrg ? (
                <>
                  <Tile label="Partner Dues" value={fmtMoney(stats.partnerBalanceTotal || 0, sym)} color="var(--gold)" sub={`${stats.partnersWithBalance.length || 0} partner account(s) still open`} onClick={() => onNav("settings")} />
                  <Tile label="Team Payout Plan" value={fmtMoney(stats.monthlyPayoutEstimate || 0, sym)} color="var(--blue)" sub={`${stats.teamCount || 0} team member(s) tracked`} onClick={() => onNav("settings")} />
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

        {isSmallBusinessOrg && (
          <>
            <Collapsible 
              title="Service Catalog" 
              icon="📦" 
              color="var(--blue)"
              count={stats.servicesCount || 0}
              defaultOpen
            >
              <div className="card">
                {stats.servicesCount === 0 ? (
                  <EmptyState title="No services added yet" message="Add your main services or packages in Settings so quotes, receipts, and invoices stay simple and consistent." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--blue)" />
                ) : (stats.topServices || []).slice(0, 5).map(item => (
                  <div key={item.serviceName} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.serviceName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {[item.packageName || "Custom work", item.notes || "No extra notes"].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>
                      {item.defaultAmount ? fmtMoney(item.defaultAmount, sym) : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </Collapsible>

            <Collapsible 
              title="Partner Balances" 
              icon="🏷" 
              color="var(--gold)"
              count={stats.partnersWithBalance.length || 0}
              defaultOpen={stats.partnersWithBalance.length > 0}
            >
              <div className="card">
                {stats.partnersCount === 0 ? (
                  <EmptyState title="No partners added yet" message="Add outside partners, freelancers, venues, or vendors in Settings to track what is still payable." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--gold)" />
                ) : stats.partnersWithBalance.length === 0 ? (
                  <EmptyState title="Partner balances are clear" message="No outstanding partner or vendor dues are recorded right now." accentColor="var(--accent)" />
                ) : (
                  stats.partnersWithBalance.slice(0, 5).map(partner => (
                    <div key={partner.partnerName} className="card-row">
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{partner.partnerName}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{partner.contact || "No contact added"}</div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(partner.balanceDue, sym)}</span>
                    </div>
                  ))
                )}
              </div>
            </Collapsible>

            <Collapsible 
              title="Team Snapshot" 
              icon="👥" 
              color="var(--purple)"
              count={stats.teamCount || 0}
              defaultOpen={stats.teamCount > 0}
            >
              <div className="card">
                {stats.teamCount === 0 ? (
                  <EmptyState title="No team records yet" message="Add up to 5-10 team members in Settings to keep roles and payout plans visible on the dashboard." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--purple)" />
                ) : (
                  (stats.teamMembers || []).slice(0, 5).map(member => (
                    <div key={member.name} className="card-row">
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{member.role || "Role not added"}</div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--purple)" }}>{member.payout ? fmtMoney(member.payout, sym) : "--"}</span>
                    </div>
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
              <EmptyState title="Upgrade to unlock smart alerts" message="Pro plan adds due reminders, budget warnings, spending spikes, and stronger financial guidance." accentColor="var(--gold)" />
            </div>
          ) : stats.alertItems.length === 0 ? (
            <div className="card">
              <EmptyState title="All clear for now" message="No urgent alerts right now. Your cash flow and collections look steady." />
            </div>
          ) : (
            <div className="card">
              {stats.alertItems.map((alert, index) => {
                const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                return (
                  <div key={`${alert.title}-${index}`} className="card-row">
                    <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginRight: 12, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color }}>{alert.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>{alert.message}</div>
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
              <EmptyState title="Cash flow trend is on Pro" message={viewMode === "month" ? "Upgrade to Pro to see your six-month cash flow trend and business runway insights." : "Upgrade to Pro to see your yearly cash flow trend and business runway insights."} accentColor="var(--blue)" />
            ) : viewMode === "month" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, alignItems: "end", height: 180 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, alignItems: "end", height: 180 }}>
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
              <EmptyState title="Category insights are on Pro" message="Upgrade to Pro to see top expense categories and smarter spending analysis." accentColor="var(--danger)" />
            ) : stats.topExpenseCategories.length === 0 ? (
              <EmptyState title="No expenses yet" message="Add your first expense entry to unlock category insights and spending trends." actionLabel="Go to Expenses" onAction={() => onNav("expenses")} accentColor="var(--danger)" />
            ) : (
              stats.topExpenseCategories.map(category => (
                <div key={category.category} className="card-row">
                  <span style={{ fontSize: 15, color: "var(--text)" }}>{category.category}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(category.amount, sym)}</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>

        <Collapsible 
          title="Top Customers" 
          icon="⭐" 
          color="var(--blue)"
          count={showAdvanced ? stats.topCustomers.length : 0}
          defaultOpen={showAdvanced && stats.topCustomers.length > 0}
        >
          <div className="card">
            {!showAdvanced ? (
              <EmptyState title="Customer intelligence is on Pro" message="Upgrade to Pro to see top customers, open balances, and payment patterns." accentColor="var(--blue)" />
            ) : stats.topCustomers.length === 0 ? (
              <EmptyState title="No customer revenue yet" message="Create invoices for your customers to see top accounts and open balances here." actionLabel="Go to Invoices" onAction={() => onNav("invoices")} accentColor="var(--blue)" />
            ) : (
              stats.topCustomers.map(customer => (
                <div key={customer.name} className="card-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={customer.name} size={38} fontSize={13} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{customer.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Open balance {fmtMoney(customer.balance, sym)}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(customer.revenue, sym)}</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>

        <Collapsible 
          title="High-Risk Customers" 
          icon="⚠️" 
          color="var(--gold)"
          count={showAdvanced ? stats.highRiskCustomers.length : 0}
          defaultOpen={false}
        >
          <div className="card">
            {!showAdvanced ? (
              <EmptyState title="Risk scoring is on Pro" message="Upgrade to Pro to flag frequent late payers and reduce collection risk." accentColor="var(--gold)" />
            ) : stats.highRiskCustomers.length === 0 ? (
              <EmptyState title="Healthy payment behaviour" message="No late-payment risk detected so far. Keep invoices updated to maintain this view." accentColor="var(--accent)" />
            ) : (
              stats.highRiskCustomers.map(customer => (
                <div key={customer.name} className="card-row">
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{customer.overdueCount} overdue invoice(s)</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>{Math.round(customer.lateRatio * 100)}% late</span>
                </div>
              ))
            )}
          </div>
        </Collapsible>

        <Collapsible 
          title="Pending Invoice Queue" 
          icon="⏰" 
          color="var(--gold)"
          count={stats.pendingInvoices.length}
          defaultOpen={stats.pendingInvoices.length > 0}
        >
          <div className="card">
            {stats.pendingInvoices.length === 0 ? (
              <EmptyState title="Nothing pending" message="All invoices are currently paid up. New reminders will appear here automatically." accentColor="var(--accent)" />
            ) : (
              stats.pendingInvoices.slice(0, 4).map(invoice => {
                const color = getInvoiceStatusColor(invoice.computedStatus);
                return (
                  <div key={invoice.id} className="card-row" onClick={() => onNav("invoices")} style={{ cursor: "pointer" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} · {invoice.dueMessage || "Awaiting payment"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoice.total, sym)}</div>
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
