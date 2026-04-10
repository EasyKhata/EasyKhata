import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { EmptyState, ProgressBar, SectionSkeleton, fmtMoney } from "../components/UI";
import { buildLocationLabel, formatDuration, getAgeGroupFromDateOfBirth, parseLocationFields } from "../utils/profile";
import { PAYMENT_REQUEST_STATUS, PLANS, SUBSCRIPTION_STATUS, formatSubscriptionDate } from "../utils/subscription";
import { downloadAdminMonthlyReport, downloadAdminUsersCsv, downloadAdminRequestsCsv } from "../utils/reportGen";
import { ORG_TYPE_OPTIONS, getOrgType } from "../utils/orgTypes";

const ORG_TYPE_LABELS = ORG_TYPE_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysSince(value, now = new Date()) {
  const parsed = value instanceof Date ? value : toDate(value);
  if (!parsed) return null;
  return Math.max(0, Math.floor((now.getTime() - parsed.getTime()) / 86400000));
}

function getDaysUntil(value, now = new Date()) {
  const parsed = value instanceof Date ? value : toDate(value);
  if (!parsed) return null;
  return Math.ceil((parsed.getTime() - now.getTime()) / 86400000);
}

function countOrgRecords(orgRecords = {}) {
  return Object.values(orgRecords || {}).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
}

function normalizeLocationLabel(value = "") {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const parts = clean
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
  const label = parts.length >= 2 ? parts.slice(-2).join(", ") : clean;
  return label.length > 28 ? `${label.slice(0, 28)}...` : label;
}

function pushCount(bucket, label, amount = 1) {
  if (!label) return;
  bucket[label] = (bucket[label] || 0) + amount;
}

function toDistribution(bucket, total) {
  return Object.entries(bucket)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: total ? Math.round((count / total) * 100) : 0
    }));
}

function describeActivity(daysSinceActivity) {
  if (daysSinceActivity === null) return "No signal yet";
  if (daysSinceActivity <= 7) return "Active this week";
  if (daysSinceActivity <= 30) return "Active this month";
  if (daysSinceActivity <= 60) return "Cooling";
  return "Dormant";
}

function formatPlanLabel(plan) {
  if (plan === PLANS.BUSINESS) return "Business";
  if (plan === PLANS.PRO) return "Pro";
  return "Free";
}

function formatSubscriptionLabel(status) {
  if (status === SUBSCRIPTION_STATUS.TRIAL) return "Trial";
  if (status === SUBSCRIPTION_STATUS.ACTIVE) return "Active";
  return "Inactive";
}

function MetricTile({ label, value, sub, color = "var(--blue)" }) {
  return (
    <div className="card" style={{ padding: "14px 12px", borderColor: `${color}33`, marginBottom: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function DistributionCard({ title, subtitle, items, emptyMessage, accentColor = "var(--blue)", formatValue }) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 12 }}>{subtitle}</div>}
      {!items.length ? (
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>{emptyMessage}</div>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 0 }}>
          {items.map((item, index) => (
            <div key={`${title}-${item.label}`} style={{ padding: index === items.length - 1 ? "0" : "0 0 12px", marginBottom: index === items.length - 1 ? 0 : 12, borderBottom: index === items.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{formatValue ? formatValue(item) : `${item.count} · ${item.pct}%`}</div>
              </div>
              <ProgressBar pct={item.pct} color={accentColor} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({ eyebrow, title, body, tone = "var(--blue)" }) {
  return (
    <div className="card" style={{ padding: 16, borderLeft: `4px solid ${tone}`, marginBottom: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tone, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{eyebrow}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>{body}</div>
    </div>
  );
}

function formatTicketStatus(status) {
  if (status === "resolved") return "Resolved";
  if (status === "in_progress") return "In Progress";
  return "Open";
}

function TopUsersCard({ users }) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Most Engaged Accounts</div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 12 }}>
        Ranked using true tracked foreground session time, then refined with workspace breadth and recent activity.
      </div>
      {!users.length ? (
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>No activity signal has been captured yet.</div>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 0 }}>
          {users.map((entry, index) => (
            <div key={entry.id} style={{ padding: index === users.length - 1 ? "0" : "0 0 12px", marginBottom: index === users.length - 1 ? 0 : 12, borderBottom: index === users.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{entry.name || entry.email || "Unnamed user"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.6 }}>
                    {entry.planLabel} · {entry.orgCount} workspace{entry.orgCount === 1 ? "" : "s"} · {entry.primaryOrgTypeLabel}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{formatDuration(entry.totalSessionMs)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{entry.totalEntries} records · {describeActivity(entry.daysSinceActivity)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopWorkspacesCard({ items }) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Top Workspaces By Time Spent</div>
      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 12 }}>
        Shows which org workspaces are absorbing the most real user time across the product.
      </div>
      {!items.length ? (
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>No tracked workspace session time is available yet.</div>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 0 }}>
          {items.map((entry, index) => (
            <div key={`${entry.userId}-${entry.orgId}`} style={{ padding: index === items.length - 1 ? "0" : "0 0 12px", marginBottom: index === items.length - 1 ? 0 : 12, borderBottom: index === items.length - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{entry.orgName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.6 }}>
                    {entry.ownerName} · {entry.orgTypeLabel}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{formatDuration(entry.sessionMs)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{entry.totalEntries} records</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel({ year, month }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [paymentRequestsEnabled, setPaymentRequestsEnabled] = useState(true);
  const [supportTicketsEnabled, setSupportTicketsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [exporting, setExporting] = useState("");

  if (user?.role !== "admin") {
    return <div style={{ padding: 20 }}>Access denied.</div>;
  }

  async function fetchAdminData() {
    setLoading(true);
    setAdminError("");
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(
        usersSnapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }))
      );

      try {
        const requestsSnapshot = await getDocs(collection(db, "payment_requests"));
        const nextRequests = requestsSnapshot.docs
          .map(item => ({
            id: item.id,
            ...item.data()
          }))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        setPaymentRequests(nextRequests);
        setPaymentRequestsEnabled(true);
      } catch (err) {
        console.error("Payment request load error:", err);
        setPaymentRequests([]);
        setPaymentRequestsEnabled(false);
      }

      try {
        const ticketsSnapshot = await getDocs(collection(db, "support_tickets"));
        setSupportTickets(
          ticketsSnapshot.docs
            .map(item => ({ id: item.id, ...item.data() }))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        );
        setSupportTicketsEnabled(true);
      } catch (err) {
        console.error("Support ticket load error:", err);
        setSupportTickets([]);
        setSupportTicketsEnabled(false);
      }
    } catch (err) {
      console.error("Admin panel load error:", err);
      setAdminError("Failed to load admin data. Please check your Firestore permissions and try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function updateSupportTicketStatus(ticket, status) {
    setAdminError("");
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, "support_tickets", ticket.id), {
        status,
        updatedAt: nowIso,
        resolvedAt: status === "resolved" ? nowIso : "",
        adminNote: status === "resolved" ? "Resolved by admin" : ticket.adminNote || "",
        reviewedBy: user.id
      });
      setSupportTickets(current => current.map(item => item.id === ticket.id ? { ...item, status, updatedAt: nowIso, resolvedAt: status === "resolved" ? nowIso : item.resolvedAt, reviewedBy: user.id } : item));
    } catch (err) {
      console.error("Support ticket status update error:", err);
      setAdminError("Unable to update the support ticket. Please try again.");
    }
  }

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const selectedPeriodLabel = new Date(year, month, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  const analytics = useMemo(() => {
    const now = new Date();
    const approvedRequests = paymentRequests.filter(item => (item.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.APPROVED);
    const pendingRequests = paymentRequests.filter(item => (item.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.PENDING);
    const rejectedRequests = paymentRequests.filter(item => (item.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.REJECTED);
    const openSupportTickets = supportTickets.filter(item => (item.status || "open") === "open");
    const inProgressSupportTickets = supportTickets.filter(item => (item.status || "open") === "in_progress");
    const resolvedSupportTickets = supportTickets.filter(item => (item.status || "open") === "resolved");

    const userRecords = users.map(item => {
      const parsedProfileLocation = parseLocationFields(item.location || "");
      const profileLocation = normalizeLocationLabel(
        buildLocationLabel({
          city: item.city || parsedProfileLocation.city,
          state: item.state || parsedProfileLocation.state,
          country: item.country || parsedProfileLocation.country
        })
      );
      const sessionAnalytics = item.analytics || {};
      const orgSessionMap = sessionAnalytics.byOrg || {};
      const orgSource = item?.orgs && typeof item.orgs === "object" && Object.keys(item.orgs).length > 0
        ? item.orgs
        : {
            [item.activeOrgId || "org_primary"]: {
              income: [],
              expenses: [],
              invoices: [],
              customers: [],
              orgRecords: {},
              account: {
                name: "",
                address: "",
                organizationType: item.organizationType || "small_business"
              }
            }
          };

      const organizations = Object.entries(orgSource).map(([orgId, orgValue]) => {
        const incomeCount = Array.isArray(orgValue?.income) ? orgValue.income.length : 0;
        const expenseCount = Array.isArray(orgValue?.expenses) ? orgValue.expenses.length : 0;
        const invoiceCount = Array.isArray(orgValue?.invoices) ? orgValue.invoices.length : 0;
        const customerCount = Array.isArray(orgValue?.customers) ? orgValue.customers.length : 0;
        const orgRecordCount = countOrgRecords(orgValue?.orgRecords);
        const orgType = getOrgType(orgValue?.account?.organizationType || item.organizationType);
        const parsedOrgLocation = parseLocationFields(orgValue?.account?.location || orgValue?.account?.address || "");
        return {
          id: orgId,
          name: String(orgValue?.account?.name || "").trim() || ORG_TYPE_LABELS[orgType] || "Organization",
          orgType,
          orgTypeLabel: ORG_TYPE_LABELS[orgType] || orgType,
          location: normalizeLocationLabel(
            buildLocationLabel({
              city: orgValue?.account?.city || parsedOrgLocation.city,
              state: orgValue?.account?.state || parsedOrgLocation.state,
              country: orgValue?.account?.country || parsedOrgLocation.country
            })
          ),
          sessionMs: Number(orgSessionMap?.[orgId]?.totalSessionMs || 0),
          incomeCount,
          expenseCount,
          invoiceCount,
          customerCount,
          orgRecordCount,
          totalEntries: incomeCount + expenseCount + invoiceCount + customerCount + orgRecordCount
        };
      });

      const activityAt = item.lastActivityAt || item.updatedAt || item.onboardingSeenAt || item.createdAt || "";
      const daysSinceActivity = getDaysSince(activityAt, now);
      const totalEntries = organizations.reduce((sum, org) => sum + org.totalEntries, 0);
      const totalSessionMs = Number(sessionAnalytics.totalSessionMs || 0);
      const activityScore = Math.round(totalSessionMs / 60000) + totalEntries + organizations.length * 4 + (daysSinceActivity === null ? 0 : Math.max(0, 30 - Math.min(daysSinceActivity, 30)));
      const primaryOrg = organizations[0] || null;

      return {
        ...item,
        orgCount: organizations.length,
        organizations,
        totalEntries,
        totalSessionMs,
        activityScore,
        daysSinceActivity,
        activityAt,
        location: profileLocation,
        gender: String(item.gender || "").trim(),
        ageGroup: String(item.ageGroup || getAgeGroupFromDateOfBirth(item.dateOfBirth) || "").trim(),
        planLabel: formatPlanLabel(item.plan),
        subscriptionLabel: formatSubscriptionLabel(item.subscriptionStatus),
        primaryOrgTypeLabel: primaryOrg?.orgTypeLabel || ORG_TYPE_LABELS[getOrgType(item.organizationType)] || "Organization",
        isPaid: item.plan === PLANS.PRO || item.plan === PLANS.BUSINESS
      };
    });

    const orgTypeCounts = {};
    const planCounts = {};
    const statusCounts = {};
    const genderCounts = {};
    const ageCounts = {};
    const locationCounts = {};

    let totalOrganizations = 0;
    let totalEntries = 0;
    let totalSessionMs = 0;
    let totalInvoices = 0;
    let totalCustomers = 0;
    let totalIncomeEntries = 0;
    let totalExpenseEntries = 0;
    let totalOrgRecords = 0;
    let activatedUsers = 0;
    let multiOrgUsers = 0;
    let sharedLedgerUsers = 0;
    let onboardingCompletedUsers = 0;
    let activeSevenDays = 0;
    let activeThirtyDays = 0;
    let dormantUsers = 0;
    let powerUsers = 0;
    let paidAtRisk = 0;
    let locationCoverageUsers = 0;
    let genderCoverageUsers = 0;
    let ageCoverageUsers = 0;
    let sessionCoverageUsers = 0;

    userRecords.forEach(entry => {
      totalOrganizations += entry.orgCount;
      totalEntries += entry.totalEntries;
      totalSessionMs += entry.totalSessionMs;
      if (entry.totalEntries > 0) activatedUsers += 1;
      if (entry.orgCount > 1) multiOrgUsers += 1;
      if (entry.sharedLedgerId) sharedLedgerUsers += 1;
      if (entry.onboardingSeenAt) onboardingCompletedUsers += 1;
      if (entry.daysSinceActivity !== null && entry.daysSinceActivity <= 7) activeSevenDays += 1;
      if (entry.daysSinceActivity !== null && entry.daysSinceActivity <= 30) activeThirtyDays += 1;
      if (entry.daysSinceActivity !== null && entry.daysSinceActivity > 30) dormantUsers += 1;
      if (entry.totalEntries >= 20) powerUsers += 1;
      if (entry.isPaid && entry.daysSinceActivity !== null && entry.daysSinceActivity > 30 && !entry.blocked) paidAtRisk += 1;
      if (entry.location || entry.organizations.some(org => org.location)) locationCoverageUsers += 1;
      if (entry.gender) genderCoverageUsers += 1;
      if (entry.ageGroup) ageCoverageUsers += 1;
      if (entry.totalSessionMs > 0) sessionCoverageUsers += 1;

      pushCount(planCounts, entry.planLabel);
      pushCount(statusCounts, entry.subscriptionLabel);
      if (entry.gender) pushCount(genderCounts, entry.gender);
      if (entry.ageGroup) pushCount(ageCounts, entry.ageGroup);

      entry.organizations.forEach(org => {
        totalInvoices += org.invoiceCount;
        totalCustomers += org.customerCount;
        totalIncomeEntries += org.incomeCount;
        totalExpenseEntries += org.expenseCount;
        totalOrgRecords += org.orgRecordCount;
        pushCount(orgTypeCounts, org.orgTypeLabel);
        pushCount(locationCounts, entry.location || org.location);
      });
    });

    const paymentApprovalRate = paymentRequests.length ? Math.round((approvedRequests.length / paymentRequests.length) * 100) : 0;
    const monthlyApprovedAmount = approvedRequests
      .filter(item => (item.updatedAt || item.createdAt || "").slice(0, 7) === monthKey)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const monthlyPendingAmount = pendingRequests.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const requestBacklog = pendingRequests.filter(item => getDaysSince(item.updatedAt || item.createdAt, now) > 7).length;

    const expiringSoon = userRecords
      .filter(entry => {
        const daysUntilEnd = getDaysUntil(entry.subscriptionEndsAt, now);
        return daysUntilEnd !== null && daysUntilEnd >= 0 && daysUntilEnd <= 14;
      })
      .sort((a, b) => (getDaysUntil(a.subscriptionEndsAt, now) || 9999) - (getDaysUntil(b.subscriptionEndsAt, now) || 9999));

    const topUsers = [...userRecords]
      .sort((a, b) => b.totalSessionMs - a.totalSessionMs || b.activityScore - a.activityScore || (a.daysSinceActivity ?? 9999) - (b.daysSinceActivity ?? 9999))
      .slice(0, 5);

    const topWorkspaces = userRecords
      .flatMap(entry =>
        entry.organizations.map(org => ({
          userId: entry.id,
          ownerName: entry.name || entry.email || "Unnamed user",
          orgId: org.id,
          orgName: org.name,
          orgTypeLabel: org.orgTypeLabel,
          sessionMs: org.sessionMs,
          totalEntries: org.totalEntries
        }))
      )
      .filter(entry => entry.sessionMs > 0)
      .sort((a, b) => b.sessionMs - a.sessionMs)
      .slice(0, 6);

    const totalUsers = users.length;
    const premiumUsers = userRecords.filter(entry => entry.isPaid).length;
    const trialUsers = userRecords.filter(entry => entry.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL).length;
    const activeUsers = userRecords.filter(entry => !entry.blocked).length;
    const blockedUsers = userRecords.filter(entry => entry.blocked).length;
    const newUsersThisMonth = userRecords.filter(entry => entry.createdAt?.slice(0, 7) === monthKey).length;
    const newPremiumUsersThisMonth = userRecords.filter(entry => entry.isPaid && entry.createdAt?.slice(0, 7) === monthKey).length;
    const premiumShare = totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0;
    const activationRate = totalUsers ? Math.round((activatedUsers / totalUsers) * 100) : 0;
    const multiOrgShare = totalUsers ? Math.round((multiOrgUsers / totalUsers) * 100) : 0;

    const staleSupportTickets = openSupportTickets.filter(item => getDaysSince(item.updatedAt || item.createdAt, now) > 3).length;
    const insights = [];
    if (requestBacklog > 0) {
      insights.push({
        eyebrow: "Revenue Ops",
        title: `${requestBacklog} payment request${requestBacklog === 1 ? "" : "s"} need escalation`,
        body: `There are ${pendingRequests.length} pending payment submissions and ${requestBacklog} have been waiting for more than 7 days. Tightening this queue will improve conversion and trust.`,
        tone: "var(--gold)"
      });
    }
    if (staleSupportTickets > 0) {
      insights.push({
        eyebrow: "Support Ops",
        title: `${staleSupportTickets} support ticket${staleSupportTickets === 1 ? " is" : "s are"} aging`,
        body: `${openSupportTickets.length} support tickets are still open and ${staleSupportTickets} have not moved for more than 3 days. This is the clearest support backlog signal in the app right now.`,
        tone: "var(--gold)"
      });
    }
    if (paidAtRisk > 0) {
      insights.push({
        eyebrow: "Retention",
        title: `${paidAtRisk} paid account${paidAtRisk === 1 ? " is" : "s are"} going quiet`,
        body: `These users still hold Pro or Business access but have no recent activity signal in the last 30 days. They are the best audience for win-back nudges or onboarding help.`,
        tone: "var(--danger)"
      });
    }
    if (expiringSoon.length > 0) {
      insights.push({
        eyebrow: "Conversion",
        title: `${expiringSoon.length} subscription${expiringSoon.length === 1 ? "" : "s"} expire soon`,
        body: `The next renewal checkpoint is ${formatSubscriptionDate(expiringSoon[0]?.subscriptionEndsAt) || "coming up"}. Use the Subscriptions tab to prioritise manual follow-up before access lapses.`,
        tone: "var(--blue)"
      });
    }
    if (locationCoverageUsers < totalUsers || genderCoverageUsers < totalUsers || ageCoverageUsers < totalUsers) {
      insights.push({
        eyebrow: "Audience Data",
        title: "Demographic coverage is still partial",
        body: `Location is captured for ${totalUsers ? Math.round((locationCoverageUsers / totalUsers) * 100) : 0}% of users, gender for ${totalUsers ? Math.round((genderCoverageUsers / totalUsers) * 100) : 0}%, and age groups for ${totalUsers ? Math.round((ageCoverageUsers / totalUsers) * 100) : 0}%. Encourage profile completion to sharpen marketing decisions.`,
        tone: "var(--purple)"
      });
    }
    if (multiOrgUsers > 0) {
      insights.push({
        eyebrow: "Expansion",
        title: `${multiOrgUsers} users already manage multiple workspaces`,
        body: `Multi-org adoption is at ${multiOrgShare}% of the user base. This segment is ideal for premium upsell messaging, cross-sell campaigns, and heavier automation features.`,
        tone: "var(--accent)"
      });
    }

    while (insights.length < 4) {
      insights.push({
        eyebrow: "Strategy",
        title: "More insight quality will come from better profile completion",
        body: "The dashboard now exposes product usage and org depth. To unlock stronger audience segmentation, continue driving users to complete location, age group, and gender in their personal profile.",
        tone: "var(--blue)"
      });
    }

    return {
      approvedRequests,
      pendingRequests,
      rejectedRequests,
      stats: {
        totalUsers,
        premiumUsers,
        trialUsers,
        activeUsers,
        blockedUsers,
        newUsersThisMonth,
        newPremiumUsersThisMonth,
        pendingRequests: pendingRequests.length,
        approvedRequests: approvedRequests.length,
        rejectedRequests: rejectedRequests.length,
        paymentApprovalRate,
        monthlyApprovedAmount,
        monthlyPendingAmount,
        premiumShare,
        activationRate,
        multiOrgUsers,
        multiOrgShare,
        totalOrganizations,
        totalEntries,
        totalSessionMs,
        totalInvoices,
        totalCustomers,
        totalIncomeEntries,
        totalExpenseEntries,
        totalOrgRecords,
        activeSevenDays,
        activeThirtyDays,
        dormantUsers,
        powerUsers,
        paidAtRisk,
        sharedLedgerUsers,
        onboardingCompletedUsers,
        requestBacklog,
        supportOpen: openSupportTickets.length,
        supportInProgress: inProgressSupportTickets.length,
        supportResolved: resolvedSupportTickets.length,
        supportAging: staleSupportTickets,
        expiringSoonCount: expiringSoon.length,
        averageSessionPerUserMs: totalUsers ? Math.round(totalSessionMs / totalUsers) : 0
      },
      distributions: {
        planMix: toDistribution(planCounts, totalUsers),
        statusMix: toDistribution(statusCounts, totalUsers),
        orgTypeMix: toDistribution(orgTypeCounts, Math.max(1, totalOrganizations)).slice(0, 5),
        locationMix: toDistribution(locationCounts, Math.max(1, totalOrganizations)).slice(0, 6),
        genderMix: toDistribution(genderCounts, totalUsers),
        ageMix: toDistribution(ageCounts, totalUsers)
      },
      readiness: {
        locationCoverage: totalUsers ? Math.round((locationCoverageUsers / totalUsers) * 100) : 0,
        genderCoverage: totalUsers ? Math.round((genderCoverageUsers / totalUsers) * 100) : 0,
        ageCoverage: totalUsers ? Math.round((ageCoverageUsers / totalUsers) * 100) : 0,
        sessionCoverage: totalUsers ? Math.round((sessionCoverageUsers / totalUsers) * 100) : 0
      },
      topUsers,
      topWorkspaces,
      insights: insights.slice(0, 4),
      nextExpiryLabel: expiringSoon[0]?.subscriptionEndsAt ? formatSubscriptionDate(expiringSoon[0].subscriptionEndsAt) : "No end dates recorded yet",
      averageOrganizationsPerUser: totalUsers ? (totalOrganizations / totalUsers).toFixed(1) : "0.0",
      averageEntriesPerUser: totalUsers ? Math.round(totalEntries / totalUsers) : 0,
      averageEntriesPerOrg: totalOrganizations ? Math.round(totalEntries / totalOrganizations) : 0,
      averageSessionPerUserLabel: formatDuration(totalUsers ? Math.round(totalSessionMs / totalUsers) : 0),
      totalSessionLabel: formatDuration(totalSessionMs)
    };
  }, [monthKey, paymentRequests, supportTickets, users]);

  if (loading) {
    return <SectionSkeleton rows={6} showHero={false} />;
  }

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <div className="section-label">Admin Overview</div>
      {adminError && (
        <div className="card" style={{ padding: 16, marginBottom: 18, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--danger)" }}>Admin access warning</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>{adminError}</div>
        </div>
      )}

      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 20, borderLeft: "4px solid var(--gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Company intelligence center</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, maxWidth: 620 }}>
                Use this view to understand how subscriptions are converting, which organizations are driving depth, where your strongest markets are, and which user segments deserve retention or marketing attention.
              </div>
            </div>
            <button
              className="btn-secondary"
              type="button"
              style={{ padding: "10px 14px", fontSize: 12, minWidth: 140 }}
              onClick={fetchAdminData}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button
              className="btn-secondary"
              type="button"
              style={{ padding: "10px 14px", fontSize: 12 }}
              onClick={() => {
                setExporting("pdf");
                try {
                  downloadAdminMonthlyReport({ users, paymentRequests }, year, month, "Rs");
                } finally {
                  setExporting("");
                }
              }}
              disabled={Boolean(exporting)}
            >
              {exporting === "pdf" ? "Generating report..." : "Download Admin PDF"}
            </button>
            <button
              className="btn-secondary"
              type="button"
              style={{ padding: "10px 14px", fontSize: 12 }}
              onClick={() => {
                setExporting("users");
                try {
                  downloadAdminUsersCsv(users);
                } finally {
                  setExporting("");
                }
              }}
              disabled={Boolean(exporting) || !users.length}
            >
              {exporting === "users" ? "Exporting users..." : "Export Users CSV"}
            </button>
            <button
              className="btn-secondary"
              type="button"
              style={{ padding: "10px 14px", fontSize: 12 }}
              onClick={() => {
                setExporting("requests");
                try {
                  downloadAdminRequestsCsv(paymentRequests);
                } finally {
                  setExporting("");
                }
              }}
              disabled={Boolean(exporting) || !paymentRequests.length}
            >
              {exporting === "requests" ? "Exporting requests..." : "Export Requests CSV"}
            </button>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 14 }}>
            {exporting
              ? "Preparing your export, please wait..."
              : `Selected period: ${selectedPeriodLabel}. Refresh anytime to recalculate subscription, audience, and workspace analytics.`}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>Executive Snapshot</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Total Users" value={analytics.stats.totalUsers} sub={`${analytics.stats.activeUsers} currently active accounts`} color="var(--blue)" />
            <MetricTile label="Paid Accounts" value={analytics.stats.premiumUsers} sub={`${analytics.stats.premiumShare}% of the user base`} color="var(--accent)" />
            <MetricTile label="Workspaces" value={analytics.stats.totalOrganizations} sub={`${analytics.stats.multiOrgUsers} multi-org users`} color="var(--purple)" />
            <MetricTile label="Tracked Time" value={analytics.totalSessionLabel} sub="True foreground session time" color="var(--gold)" />
            <MetricTile label="Pending Payments" value={analytics.stats.pendingRequests} sub={`${analytics.stats.requestBacklog} older than 7 days`} color="var(--danger)" />
            <MetricTile label="Approved This Period" value={fmtMoney(analytics.stats.monthlyApprovedAmount, "Rs ")} sub={selectedPeriodLabel} color="var(--accent)" />
          </div>
        </div>
      </div>

      <div className="section-label">Support Operations</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Support Queue Snapshot</div>
          {!supportTicketsEnabled ? (
            <EmptyState title="Support tickets are locked by rules" message="Add rules for support_tickets to manage customer issues here." accentColor="var(--gold)" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricTile label="Open Tickets" value={analytics.stats.supportOpen} sub="Needs triage" color="var(--gold)" />
              <MetricTile label="In Progress" value={analytics.stats.supportInProgress} sub="Currently being handled" color="var(--blue)" />
              <MetricTile label="Resolved" value={analytics.stats.supportResolved} sub="Closed by admin" color="var(--accent)" />
              <MetricTile label="Aging Tickets" value={analytics.stats.supportAging} sub="Open for more than 3 days" color="var(--danger)" />
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Latest Support Tickets</div>
          {!supportTicketsEnabled ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>Support tickets are not readable yet.</div>
          ) : !supportTickets.length ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>No support tickets have been submitted yet.</div>
          ) : (
            <div className="card" style={{ padding: 14, marginBottom: 0 }}>
              {supportTickets.slice(0, 8).map((ticket, index) => (
                <div key={ticket.id} style={{ padding: index === supportTickets.slice(0, 8).length - 1 ? "0" : "0 0 12px", marginBottom: index === supportTickets.slice(0, 8).length - 1 ? 0 : 12, borderBottom: index === supportTickets.slice(0, 8).length - 1 ? "none" : "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{ticket.subject || "Support ticket"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{ticket.userName || ticket.userEmail || "Unknown user"} · {ticket.topic || "other"}</div>
                    </div>
                    <span className="pill" style={{ background: ticket.status === "resolved" ? "var(--accent-deep)" : ticket.status === "in_progress" ? "var(--blue-deep)" : "var(--gold-deep)", color: ticket.status === "resolved" ? "var(--accent)" : ticket.status === "in_progress" ? "var(--blue)" : "var(--gold)" }}>
                      {formatTicketStatus(ticket.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 8 }}>{ticket.message}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 10 }}>Updated {new Date(ticket.updatedAt || ticket.createdAt || Date.now()).toLocaleDateString("en-IN")}</div>
                  {(ticket.status || "open") !== "resolved" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(ticket.status || "open") !== "in_progress" && (
                        <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12, color: "var(--blue)" }} onClick={() => updateSupportTicketStatus(ticket, "in_progress")}>
                          Mark In Progress
                        </button>
                      )}
                      <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12, color: "var(--accent)" }} onClick={() => updateSupportTicketStatus(ticket, "resolved")}>
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section-label">Subscription Intelligence</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Subscription Funnel</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="New Users" value={analytics.stats.newUsersThisMonth} sub={selectedPeriodLabel} color="var(--blue)" />
            <MetricTile label="New Premium" value={analytics.stats.newPremiumUsersThisMonth} sub="New paid signups or assignments" color="var(--accent)" />
            <MetricTile label="Trial Users" value={analytics.stats.trialUsers} sub={`${analytics.stats.expiringSoonCount} ending within 14 days`} color="var(--gold)" />
            <MetricTile label="Approval Rate" value={`${analytics.stats.paymentApprovalRate}%`} sub={`${analytics.stats.approvedRequests} approved requests`} color="var(--purple)" />
          </div>
          <div className="card" style={{ padding: 14, marginTop: 12, marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "var(--text)" }}>Next subscription end date</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{analytics.nextExpiryLabel}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              Use this to prioritise trial conversion nudges and manual renewals before accounts fall inactive.
            </div>
          </div>
        </div>

        <DistributionCard
          title="Plan Mix"
          subtitle="How the current customer base is distributed across subscription tiers."
          items={analytics.distributions.planMix}
          emptyMessage="No user plans have been recorded yet."
          accentColor="var(--blue)"
        />
      </div>

      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <DistributionCard
          title="Subscription Status"
          subtitle="Useful for separating healthy accounts from trials and paused subscriptions."
          items={analytics.distributions.statusMix}
          emptyMessage="No subscription statuses are available yet."
          accentColor="var(--accent)"
        />

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Billing Pulse</div>
          {!paymentRequestsEnabled ? (
            <EmptyState title="Payment requests are locked by rules" message="User data is loading, but payment_requests is not readable yet. Add rules for payment_requests to unlock billing analytics." accentColor="var(--gold)" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricTile label="Pending Value" value={fmtMoney(analytics.stats.monthlyPendingAmount, "Rs ")} sub={`${analytics.stats.pendingRequests} submissions awaiting review`} color="var(--gold)" />
              <MetricTile label="Rejected Requests" value={analytics.stats.rejectedRequests} sub="Needs manual follow-up" color="var(--danger)" />
              <MetricTile label="Dormant Paid" value={analytics.stats.paidAtRisk} sub="Retention risk in paid users" color="var(--danger)" />
              <MetricTile label="Shared Ledgers" value={analytics.stats.sharedLedgerUsers} sub="Collaboration usage signal" color="var(--purple)" />
            </div>
          )}
        </div>
      </div>

      <div className="section-label">Session Analytics</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <TopUsersCard users={analytics.topUsers} />
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Time Spent Summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Total Time" value={analytics.totalSessionLabel} sub="Across all users and orgs" color="var(--accent)" />
            <MetricTile label="Avg/User" value={analytics.averageSessionPerUserLabel} sub="Average tracked time per user" color="var(--blue)" />
            <MetricTile label="Active 30 Days" value={analytics.stats.activeThirtyDays} sub="Recent saved activity" color="var(--purple)" />
            <MetricTile label="Session Coverage" value={`${analytics.readiness.sessionCoverage}%`} sub="Users with tracked session time" color="var(--gold)" />
          </div>
          <div className="card" style={{ padding: 14, marginTop: 12, marginBottom: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>How session time works</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              Session time is now captured from real foreground usage, batched locally, and flushed to Firestore during org switches, visibility changes, and timed syncs. This is much closer to true time spent than the previous inferred activity model.
            </div>
          </div>
        </div>
      </div>

      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <TopWorkspacesCard items={analytics.topWorkspaces} />

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Engagement Signals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Active 7 Days" value={analytics.stats.activeSevenDays} sub="Strong weekly usage" color="var(--accent)" />
            <MetricTile label="Active 30 Days" value={analytics.stats.activeThirtyDays} sub="Monthly returning users" color="var(--blue)" />
            <MetricTile label="Dormant Users" value={analytics.stats.dormantUsers} sub="No recent product signal" color="var(--danger)" />
            <MetricTile label="Power Users" value={analytics.stats.powerUsers} sub="20+ workspace records" color="var(--gold)" />
          </div>
        </div>
      </div>

      <div className="section-label">Usage And Organizations</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Workspace Depth</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Activation Rate" value={`${analytics.stats.activationRate}%`} sub="Users with saved org activity" color="var(--accent)" />
            <MetricTile label="Avg Orgs Per User" value={analytics.averageOrganizationsPerUser} sub="Workspace expansion depth" color="var(--blue)" />
            <MetricTile label="Avg Entries Per User" value={analytics.averageEntriesPerUser} sub="Overall usage intensity" color="var(--purple)" />
            <MetricTile label="Avg Entries Per Org" value={analytics.averageEntriesPerOrg} sub="Tenant-level activity density" color="var(--gold)" />
            <MetricTile label="Invoices Logged" value={analytics.stats.totalInvoices} sub="Cross-workspace invoice usage" color="var(--blue)" />
            <MetricTile label="Customers Managed" value={analytics.stats.totalCustomers} sub="Customer-directory adoption" color="var(--accent)" />
          </div>
        </div>

        <DistributionCard
          title="Organization Mix"
          subtitle="Shows which business categories are driving the product footprint today."
          items={analytics.distributions.orgTypeMix}
          emptyMessage="No organizations have been created yet."
          accentColor="var(--purple)"
        />
      </div>

      <div className="section-label">Audience Intelligence</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginBottom: 18 }}>
        <DistributionCard
          title="Top Markets"
          subtitle={`${analytics.readiness.locationCoverage}% of users have structured city/state/country data or a workspace address signal.`}
          items={analytics.distributions.locationMix}
          emptyMessage="No location signals are captured yet. Ask users to fill city, state, and country in Personal Profile or keep workspace addresses updated."
          accentColor="var(--blue)"
        />

        <DistributionCard
          title="Gender Mix"
          subtitle={`${analytics.readiness.genderCoverage}% of users have shared gender data.`}
          items={analytics.distributions.genderMix}
          emptyMessage="Gender data is optional and has not been captured yet."
          accentColor="var(--accent)"
        />

        <DistributionCard
          title="Age Groups"
          subtitle={`${analytics.readiness.ageCoverage}% of users have shared age-group data.`}
          items={analytics.distributions.ageMix}
          emptyMessage="Age-group data is optional and has not been captured yet."
          accentColor="var(--purple)"
        />
      </div>

      <div className="section-label">Strategic Signals</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 18 }}>
        {analytics.insights.map(insight => (
          <InsightCard key={`${insight.eyebrow}-${insight.title}`} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} />
        ))}
      </div>

      <div className="section-label">Data Readiness</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Insight Coverage</div>
          {[
            ["Location coverage", analytics.readiness.locationCoverage, "Profile location or workspace address"],
            ["Gender coverage", analytics.readiness.genderCoverage, "Optional personal-profile field"],
            ["Age-group coverage", analytics.readiness.ageCoverage, "Derived from date of birth"],
            ["Session-duration coverage", analytics.readiness.sessionCoverage, "Tracked foreground session time"]
          ].map(([label, value, hint]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text)" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{hint}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{value}%</div>
              </div>
              <ProgressBar pct={value} color="var(--accent)" />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>What to improve next</div>
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>1. Complete audience fields</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              The app now supports structured city, state, country, date of birth, gender, and phone country code in Personal Profile. Driving adoption there will make campaign targeting and regional planning much stronger.
            </div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>2. Increase session coverage</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              Session time is now tracked, but coverage still depends on users running the latest app version and remaining online long enough to flush local batches. As this version rolls out, the time-spent metrics will become more complete.
            </div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>3. Watch paid quiet users</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              {analytics.stats.paidAtRisk > 0
                ? `${analytics.stats.paidAtRisk} paid users have cooled off recently. A retention sequence or check-in campaign would likely outperform a broad message.`
                : "No paid inactivity risk is obvious right now, which is a good sign for retention."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
