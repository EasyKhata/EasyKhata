import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, ProgressBar, SectionSkeleton, fmtMoney } from "../components/UI";
import { logError } from "../utils/logger";
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
  const [globalSnapshot, setGlobalSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [exporting, setExporting] = useState("");

  async function fetchAdminData() {
    setLoading(true);
    setAdminError("");
    try {
      const [usersResult, requests, tickets] = await Promise.all([
        adminApi.listUsers(1, 500),
        adminApi.listPaymentRequests().catch(() => []),
        adminApi.listSupportTickets().catch(() => [])
      ]);

      setUsers(usersResult.users || []);
      setPaymentRequests(
        (requests || []).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      );
      setSupportTickets(
        (tickets || []).map(t => ({
          ...t,
          messages: Array.isArray(t.messages) ? t.messages : (t.message ? [{
            id: `${t.id}-initial`, senderRole: "user", senderId: t.userId || "",
            senderName: t.userName || "User", message: t.message, createdAt: t.createdAt || ""
          }] : [])
        })).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      );
    } catch (err) {
      logError("Admin panel load error", err);
      setAdminError("Failed to load admin data. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") {
      setLoading(false);
      return;
    }
    fetchAdminData();
  }, [user?.role]);


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
      // organizations is an array from the new backend (with _count)
      const orgList = Array.isArray(item.organizations) ? item.organizations : [];
      const organizations = orgList.length > 0
        ? orgList.map(org => {
            const incomeCount = Number(org._count?.income || 0);
            const expenseCount = Number(org._count?.expenses || 0);
            const invoiceCount = Number(org._count?.invoices || 0);
            const customerCount = Number(org._count?.customers || 0);
            const orgRecordCount = Number(org._count?.orgRecords || 0);
            const orgType = getOrgType(org.organizationType || item.organizationType);
            const parsedOrgLocation = parseLocationFields(org.location || org.address || "");
            return {
              id: org.id,
              name: String(org.name || "").trim() || ORG_TYPE_LABELS[orgType] || "Organization",
              orgType,
              orgTypeLabel: ORG_TYPE_LABELS[orgType] || orgType,
              location: normalizeLocationLabel(
                buildLocationLabel({
                  city: org.city || parsedOrgLocation.city,
                  state: org.state || parsedOrgLocation.state,
                  country: org.country || parsedOrgLocation.country
                })
              ),
              sessionMs: 0,
              incomeCount,
              expenseCount,
              invoiceCount,
              customerCount,
              orgRecordCount,
              totalEntries: incomeCount + expenseCount + invoiceCount + customerCount + orgRecordCount
            };
          })
        : [{
            id: item.activeOrgId || "org_primary",
            name: ORG_TYPE_LABELS[getOrgType(item.organizationType)] || "Organization",
            orgType: getOrgType(item.organizationType),
            orgTypeLabel: ORG_TYPE_LABELS[getOrgType(item.organizationType)] || item.organizationType,
            location: "",
            sessionMs: 0,
            incomeCount: 0,
            expenseCount: 0,
            invoiceCount: 0,
            customerCount: 0,
            orgRecordCount: 0,
            totalEntries: 0
          }];

      const activityAt = item.lastActivityAt || item.updatedAt || item.onboardingSeenAt || item.createdAt || "";
      const daysSinceActivity = getDaysSince(activityAt, now);
      const totalEntries = organizations.reduce((sum, org) => sum + org.totalEntries, 0);
      const totalSessionMs = 0; // session analytics not yet tracked in new backend
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
    let residentPortalUsers = 0;
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
      if (entry.societyPortalId) residentPortalUsers += 1;
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
        residentPortalUsers,
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

  const snapshotStats = globalSnapshot?.stats || null;
  const snapshotCurrentMonth = globalSnapshot?.periods?.currentMonth || null;
  const snapshotDerivations = globalSnapshot?.derivations || null;
  const snapshotDistributions = globalSnapshot?.distributions || null;
  const snapshotReadiness = globalSnapshot?.readiness || null;
  const snapshotGeneratedAt = globalSnapshot?.generatedAt ? new Date(globalSnapshot.generatedAt) : null;
  const isCurrentMonthSelected = monthKey === new Date().toISOString().slice(0, 7);
  const areOrgDerivationsReady = Boolean(snapshotDerivations?.orgCollectionsReady);
  const executiveStats = {
    totalUsers: Number(snapshotStats?.totalUsers ?? analytics.stats.totalUsers),
    activeUsers: Number(snapshotStats?.activeUsers ?? analytics.stats.activeUsers),
    premiumUsers: Number(snapshotStats?.premiumUsers ?? analytics.stats.premiumUsers),
    totalOrganizations: areOrgDerivationsReady ? Number(snapshotStats?.totalOrganizations ?? analytics.stats.totalOrganizations) : analytics.stats.totalOrganizations,
    multiOrgUsers: areOrgDerivationsReady ? Number(snapshotStats?.multiOrgUsers ?? analytics.stats.multiOrgUsers) : analytics.stats.multiOrgUsers,
    pendingRequests: Number(snapshotStats?.pendingRequests ?? analytics.stats.pendingRequests),
    premiumShare:
      Number(snapshotStats?.totalUsers || 0) > 0
        ? Math.round((Number(snapshotStats?.premiumUsers || 0) / Number(snapshotStats?.totalUsers || 1)) * 100)
        : analytics.stats.premiumShare
  };
  const collaborationStats = {
    residentPortalUsers: areOrgDerivationsReady ? Number(snapshotStats?.residentPortalUsers ?? analytics.stats.residentPortalUsers) : analytics.stats.residentPortalUsers
  };
  const distributionStats = {
    planMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.planMix) ? snapshotDistributions.planMix : analytics.distributions.planMix,
    statusMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.statusMix) ? snapshotDistributions.statusMix : analytics.distributions.statusMix,
    orgTypeMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.orgTypeMix) ? snapshotDistributions.orgTypeMix : analytics.distributions.orgTypeMix,
    locationMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.locationMix) ? snapshotDistributions.locationMix : analytics.distributions.locationMix,
    genderMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.genderMix) ? snapshotDistributions.genderMix : analytics.distributions.genderMix,
    ageMix: areOrgDerivationsReady && Array.isArray(snapshotDistributions?.ageMix) ? snapshotDistributions.ageMix : analytics.distributions.ageMix
  };
  const readinessStats = {
    locationCoverage: areOrgDerivationsReady ? Number(snapshotReadiness?.locationCoverage ?? analytics.readiness.locationCoverage) : analytics.readiness.locationCoverage,
    genderCoverage: areOrgDerivationsReady ? Number(snapshotReadiness?.genderCoverage ?? analytics.readiness.genderCoverage) : analytics.readiness.genderCoverage,
    ageCoverage: areOrgDerivationsReady ? Number(snapshotReadiness?.ageCoverage ?? analytics.readiness.ageCoverage) : analytics.readiness.ageCoverage,
    sessionCoverage: areOrgDerivationsReady ? Number(snapshotReadiness?.sessionCoverage ?? analytics.readiness.sessionCoverage) : analytics.readiness.sessionCoverage
  };
  const currentPeriodStats = {
    approvedAmount:
      isCurrentMonthSelected && snapshotCurrentMonth?.key === monthKey
        ? Number(snapshotCurrentMonth?.approvedAmount ?? analytics.stats.monthlyApprovedAmount)
        : analytics.stats.monthlyApprovedAmount,
    newUsers:
      isCurrentMonthSelected && snapshotCurrentMonth?.key === monthKey
        ? Number(snapshotCurrentMonth?.newUsers ?? analytics.stats.newUsersThisMonth)
        : analytics.stats.newUsersThisMonth,
    newPremiumUsers:
      isCurrentMonthSelected && snapshotCurrentMonth?.key === monthKey
        ? Number(snapshotCurrentMonth?.newPremiumUsers ?? analytics.stats.newPremiumUsersThisMonth)
        : analytics.stats.newPremiumUsersThisMonth
  };

  if (loading) {
    return <SectionSkeleton rows={6} showHero={false} />;
  }

  if (user?.role !== "admin") {
    return <div style={{ padding: 20 }}>Access denied.</div>;
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
              onClick={async () => {
                setExporting("pdf");
                try {
                  await downloadAdminMonthlyReport({ users, paymentRequests }, year, month, "Rs");
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
              : `Selected period: ${selectedPeriodLabel}. Analytics are based on the latest sampled users, payment requests, and support tickets for fast admin response.`}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
            {snapshotGeneratedAt
              ? `Executive totals${areOrgDerivationsReady ? ", workspace counts, and audience distributions," : ""}${isCurrentMonthSelected && snapshotCurrentMonth?.key === monthKey ? " plus current-month billing cards" : ""} are sourced from precomputed aggregates (updated ${snapshotGeneratedAt.toLocaleString("en-IN")}).`
              : "Executive totals currently use sampled live data until the admin aggregate snapshot is generated."}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>Executive Snapshot</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Total Users" value={executiveStats.totalUsers} sub={`${executiveStats.activeUsers} currently active accounts`} color="var(--blue)" />
            <MetricTile label="Paid Accounts" value={executiveStats.premiumUsers} sub={`${executiveStats.premiumShare}% of the user base`} color="var(--accent)" />
            <MetricTile label="Workspaces" value={executiveStats.totalOrganizations} sub={`${executiveStats.multiOrgUsers} multi-org users`} color="var(--purple)" />
            <MetricTile label="Tracked Time" value={analytics.totalSessionLabel} sub="True foreground session time" color="var(--gold)" />
            <MetricTile label="Pending Payments" value={executiveStats.pendingRequests} sub={`${analytics.stats.requestBacklog} older than 7 days`} color="var(--danger)" />
            <MetricTile label="Approved This Period" value={fmtMoney(currentPeriodStats.approvedAmount, "Rs ")} sub={selectedPeriodLabel} color="var(--accent)" />
          </div>
        </div>
      </div>

      <div className="section-label">Subscription Intelligence</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Subscription Funnel</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="New Users" value={currentPeriodStats.newUsers} sub={selectedPeriodLabel} color="var(--blue)" />
            <MetricTile label="New Premium" value={currentPeriodStats.newPremiumUsers} sub="New paid signups or assignments" color="var(--accent)" />
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
          items={distributionStats.planMix}
          emptyMessage="No user plans have been recorded yet."
          accentColor="var(--blue)"
        />
      </div>

      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <DistributionCard
          title="Subscription Status"
          subtitle="Useful for separating healthy accounts from trials and paused subscriptions."
          items={distributionStats.statusMix}
          emptyMessage="No subscription statuses are available yet."
          accentColor="var(--accent)"
        />

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Billing Pulse</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <MetricTile label="Pending Value" value={fmtMoney(analytics.stats.monthlyPendingAmount, "Rs ")} sub={`${analytics.stats.pendingRequests} submissions awaiting review`} color="var(--gold)" />
              <MetricTile label="Rejected Requests" value={analytics.stats.rejectedRequests} sub="Needs manual follow-up" color="var(--danger)" />
              <MetricTile label="Dormant Paid" value={analytics.stats.paidAtRisk} sub="Retention risk in paid users" color="var(--danger)" />
              <MetricTile label="Resident Portals" value={collaborationStats.residentPortalUsers} sub="Apartment portal adoption signal" color="var(--purple)" />
            </div>
        </div>
      </div>

      <div className="section-label">Strategy Playbook</div>
      <div className="desktop-grid-2" style={{ gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Growth & Product Priorities</div>
          <div className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Acquire better users</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              Focus campaigns on top markets and org types where conversion is strongest. Combine plan-mix + subscription-funnel signals to choose where ad spend should go first.
            </div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Improve retention</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              Watch inactive paid users and trial users near expiry. Run proactive support + reminder nudges before churn happens.
            </div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Improve user experience</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 }}>
              Use support queue aging tickets as UX pain signals. Repeated ticket topics should directly drive feature simplification and onboarding updates.
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Quick Market Signals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            <MetricTile label="Top Market Coverage" value={`${readinessStats.locationCoverage}%`} sub="Users with structured location" color="var(--blue)" />
            <MetricTile label="Activation Rate" value={`${analytics.stats.activationRate}%`} sub="Users with meaningful activity" color="var(--accent)" />
            <MetricTile label="Dormant Paid Users" value={analytics.stats.paidAtRisk} sub="Highest retention priority" color="var(--danger)" />
            <MetricTile label="Support Aging" value={analytics.stats.supportAging} sub="Open > 3 days" color="var(--gold)" />
          </div>
        </div>
      </div>

      <div className="section-label">Strategic Signals</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 18 }}>
        {analytics.insights.map(insight => (
          <InsightCard key={`${insight.eyebrow}-${insight.title}`} eyebrow={insight.eyebrow} title={insight.title} body={insight.body} tone={insight.tone} />
        ))}
      </div>

    </div>
  );
}
