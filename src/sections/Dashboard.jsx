import React from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, ProgressBar, MONTHS, DashboardSkeleton, EmptyState } from "../components/UI";
import { calculateDashboard, getInvoiceStatusColor, getInvoiceStatusLabel } from "../utils/analytics";
import { useAuth } from "../context/AuthContext";
import { PLANS, canUseFeature, formatSubscriptionDate, getUserPlan } from "../utils/subscription";

export default function Dashboard({ year, month, onNav }) {
  const data = useData();
  const { user } = useAuth();
  const sym = data.currency?.symbol || "Rs";

  if (!data.loaded) {
    return <DashboardSkeleton />;
  }

  const stats = calculateDashboard(data, year, month);
  const showAdvanced = canUseFeature(user, "smartDashboard");
  const currentPlan = getUserPlan(user);
  const isTrial = user?.subscriptionStatus === "trial";

  const heroTone = stats.profit >= 0 ? "var(--accent)" : "var(--danger)";
  const heroSub = stats.profit >= 0 ? "You are staying profitable this month." : "Expenses are ahead of income this month.";
  const maxCashFlow = Math.max(1, ...stats.cashFlow.map(item => Math.max(item.income, item.expenses)));

  const Tile = ({ label, value, color, sub, onClick }) => (
    <div onClick={onClick} style={{ background: "var(--surface)", border: `1px solid ${color}33`, borderRadius: 18, padding: "18px 16px", cursor: onClick ? "pointer" : "default", boxShadow: "var(--card-shadow)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, color, letterSpacing: -0.5, marginBottom: sub ? 5 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ paddingBottom: 20 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Smart Dashboard · {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
          {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{heroSub}</div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        {(currentPlan === PLANS.FREE || isTrial) && (
          <div style={{ marginBottom: 22 }}>
            <div className="section-label">Subscription</div>
            <div className="card" style={{ padding: "16px 18px", borderColor: currentPlan === PLANS.FREE ? "var(--gold)33" : "var(--accent)33" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                    {currentPlan === PLANS.FREE ? "Upgrade unlocks the full business toolkit" : "Your Pro trial is active"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginTop: 6 }}>
                    {currentPlan === PLANS.FREE
                      ? "Free users get basic bookkeeping. Pro adds reports, PDF exports, smart alerts, backup tools, and advanced business insights."
                      : `You can currently use reports, PDF exports, alerts, advanced dashboard insights, and backups.${user?.subscriptionEndsAt ? ` Trial ends on ${formatSubscriptionDate(user.subscriptionEndsAt)}.` : ""}`}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: currentPlan === PLANS.FREE ? "var(--gold)" : "var(--accent)", whiteSpace: "nowrap" }}>
                  {currentPlan === PLANS.FREE ? "Rs 99/mo" : "Pro Trial"}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  "PDF invoices and reports",
                  "Smart alerts and reminders",
                  "Advanced dashboard insights",
                  "Backup import and export"
                ].map(item => (
                  <div key={item} style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5, background: "var(--surface-high)", borderRadius: 12, padding: "10px 12px" }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <Tile label="Income" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub="Manual + invoice earnings" onClick={() => onNav("income")} />
          <Tile label="Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub="Recurring and one-time costs" onClick={() => onNav("expenses")} />
          <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
          <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days`} color="var(--blue)" sub={stats.burnRateDays === null ? "Add expenses to unlock this metric" : "Estimated runway from this month's free cash"} />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div className="section-label">Savings Goal</div>
          <div className="card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stats.goalStatus}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                  {stats.monthlySavingsGoal > 0
                    ? `Target ${fmtMoney(stats.monthlySavingsGoal, sym)} this month`
                    : "Set a monthly savings goal in Settings to track progress."}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: stats.goalStatus === "On track" ? "var(--accent)" : "var(--gold)" }}>
                {stats.monthlySavingsGoal > 0 ? `${Math.round(stats.goalProgress)}%` : "--"}
              </div>
            </div>
            <ProgressBar pct={stats.goalProgress} color={stats.goalStatus === "On track" ? "var(--accent)" : "var(--gold)"} />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div className="section-label">Smart Alerts</div>
          <div className="card">
            {!showAdvanced ? (
              <EmptyState title="Upgrade to unlock smart alerts" message="Pro plan adds due reminders, budget warnings, spending spikes, and stronger financial guidance." accentColor="var(--gold)" />
            ) : stats.alertItems.length === 0 ? (
              <EmptyState title="All clear for now" message="No urgent alerts right now. Your cash flow and collections look steady." />
            ) : (
              stats.alertItems.map((alert, index) => {
                const color = alert.tone === "danger" ? "var(--danger)" : "var(--gold)";
                const bg = alert.tone === "danger" ? "var(--danger-deep)" : "var(--gold-deep)";
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
        </div>

        <div style={{ marginBottom: 22 }}>
          <div className="section-label">Cash Flow Trend</div>
          <div className="card" style={{ padding: "18px" }}>
            {!showAdvanced ? (
              <EmptyState title="Cash flow trend is on Pro" message="Upgrade to Pro to see your six-month cash flow trend and business runway insights." accentColor="var(--blue)" />
            ) : (
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
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 22 }}>
          <div>
            <div className="section-label">Top Expense Categories</div>
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
          </div>

          <div>
            <div className="section-label">Top Customers</div>
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
          </div>

          <div>
            <div className="section-label">High-Risk Customers</div>
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
          </div>

          <div>
            <div className="section-label">Pending Invoice Queue</div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
