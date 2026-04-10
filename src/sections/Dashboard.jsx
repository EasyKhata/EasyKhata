import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { fmtMoney, Avatar, ProgressBar, MONTHS, DashboardSkeleton, EmptyState } from "../components/UI";
import {
  calculateApartmentDashboard,
  calculateApartmentYearlyDashboard,
  calculateDashboard,
  calculatePersonalDashboard,
  calculatePersonalYearlyDashboard,
  calculateYearlyDashboard,
  getInvoiceStatusColor,
  getInvoiceStatusLabel
} from "../utils/analytics";
import { useAuth } from "../context/AuthContext";
import { PLANS, canUseFeature, formatSubscriptionDate, getUserPlan } from "../utils/subscription";
import OnboardingGuide from "../components/OnboardingGuide";
import Collapsible from "../components/Collapsible";
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  PLAN_LABELS,
  PLANS as SUB_PLANS,
  SUBSCRIPTION_STATUS,
  UPI_CONFIG,
  getBillingDuration,
  getSubscriptionEndDate,
  getTrialEndDate
} from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

export default function Dashboard({ year, month, viewMode: propViewMode, onNav }) {
  const data = useData();
  const { user, updateProfile } = useAuth();
  const sym = data.currency?.symbol || "Rs";
  const isAdmin = user?.role === "admin";
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [viewMode, setViewMode] = useState(propViewMode || "month"); // "month" or "year"

  const [adminData, setAdminData] = useState({ users: [], paymentRequests: [] });
  const [adminLoading, setAdminLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [requestFilter, setRequestFilter] = useState(PAYMENT_REQUEST_STATUS.PENDING);

  // Show setup guide for normal users on first visit
  useEffect(() => {
    setViewMode(propViewMode || "month");
  }, [propViewMode]);

  useEffect(() => {
    if (isAdmin || !data.loaded) return;
    
    const hasCompletedSetup = localStorage.getItem(`setup-guide-${user?.id}`);
    const accountNameSet = !!(data.account?.name && data.account.name.trim());
    const hasCustomers = data.customers?.length > 0;
    const hasInvoices = data.invoices?.length > 0;
    const hasExpenses = data.expenses?.length > 0;

    // Show setup guide if account not set or no activity yet
    if (!hasCompletedSetup && (!accountNameSet || (!hasCustomers && !hasInvoices && !hasExpenses))) {
      setShowSetupGuide(true);
    }
  }, [user?.id, data.loaded, isAdmin, data.account?.name, data.customers?.length, data.invoices?.length, data.expenses?.length]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchAdminData = async () => {
      setAdminLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));

        const requestsSnapshot = await getDocs(collection(db, "payment_requests"));
        const paymentRequests = requestsSnapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));

        setAdminData({ users, paymentRequests });
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminData();
  }, [isAdmin]);

  if (!data.loaded || (isAdmin && adminLoading)) {
    return <DashboardSkeleton />;
  }

  if (isAdmin) {
    const { users, paymentRequests } = adminData;
    const totalUsers = users.length;
    const premiumUsers = users.filter(item => item.plan === SUB_PLANS.PRO || item.plan === SUB_PLANS.BUSINESS).length;
    const pendingRequests = paymentRequests.filter(item => item.status === "pending").length;
    const totalRevenue = paymentRequests.filter(item => item.status === "approved").reduce((sum, req) => sum + (req.amount || 0), 0);

    const filteredUsers = users.filter(member => {
      const haystack = `${member.name || ""} ${member.email || ""} ${member.phone || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesFilter =
        userFilter === "all" ||
        (userFilter === "blocked" && member.blocked) ||
        (userFilter === "active" && !member.blocked) ||
        (userFilter === "shared" && member.sharedLedgerId) ||
        (userFilter === "premium" && (member.plan === SUB_PLANS.PRO || member.plan === SUB_PLANS.BUSINESS));
      return matchesSearch && matchesFilter;
    });

    const filteredRequests = paymentRequests.filter(item => requestFilter === "all" || (item.status || PAYMENT_REQUEST_STATUS.PENDING) === requestFilter);

    const stats = {
      totalUsers,
      premiumUsers,
      blockedUsers: users.filter(item => item.blocked).length,
      pendingRequests
    };

    async function toggleBlock(id, blocked) {
      if (id === user.id) {
        alert("You cannot block your own account.");
        return;
      }

      await updateDoc(doc(db, "users", id), { blocked: !blocked });
      // Refresh data
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = usersSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setAdminData(prev => ({ ...prev, users: updatedUsers }));
    }

    async function deleteUserRecord(member) {
      if (member.id === user.id) {
        alert("You cannot delete your own admin account.");
        return;
      }

      const confirmed = window.confirm("This will remove the user's Firestore profile and queue an Authentication cleanup request. Continue?");
      if (!confirmed) return;

      const ledgersSnapshot = await getDocs(collection(db, "shared_ledgers"));
      await Promise.all(
        ledgersSnapshot.docs.map(async ledgerDoc => {
          const ledger = ledgerDoc.data();
          const members = (ledger.members || []).filter(item => item.userId !== member.id);
          if (members.length !== (ledger.members || []).length) {
            await updateDoc(ledgerDoc.ref, { members });
          }
        })
      );

      await setDoc(doc(db, "admin_cleanup_queue", member.id), {
        uid: member.id,
        email: member.email || "",
        name: member.name || "",
        requestedBy: user.id,
        requestedAt: new Date().toISOString(),
        status: "pending_auth_cleanup",
        note: "Client app cannot delete Firebase Authentication users directly. Complete this request with Admin SDK or Cloud Functions."
      });

      await deleteDoc(doc(db, "users", member.id));
      // Refresh data
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = usersSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setAdminData(prev => ({ ...prev, users: updatedUsers }));
      alert("User profile removed from Firestore and auth cleanup has been queued.");
    }

    async function updateUserPlan(member, plan) {
      const updates = {
        plan,
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
      };

      if (plan === SUB_PLANS.FREE) {
        updates.subscriptionEndsAt = "";
      }

      await updateDoc(doc(db, "users", member.id), updates);
      // Refresh data
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = usersSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setAdminData(prev => ({ ...prev, users: updatedUsers }));
    }

    async function updateSubscriptionStatus(member, subscriptionStatus) {
      const updates = { subscriptionStatus };
      if (subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL) {
        updates.subscriptionEndsAt = getTrialEndDate();
      }
      if (subscriptionStatus !== SUBSCRIPTION_STATUS.TRIAL) {
        updates.subscriptionEndsAt = "";
      }
      await updateDoc(doc(db, "users", member.id), updates);
      // Refresh data
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = usersSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setAdminData(prev => ({ ...prev, users: updatedUsers }));
    }

    async function updatePaymentRequestStatus(request, status) {
      const requestRef = doc(db, "payment_requests", request.id);
      const updates = {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (status === PAYMENT_REQUEST_STATUS.APPROVED) {
        await updateDoc(doc(db, "users", request.userId), {
          plan: request.requestedPlan || SUB_PLANS.PRO,
          subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
          subscriptionEndsAt: getSubscriptionEndDate(getBillingDuration(request.billingCycle || BILLING_CYCLES.MONTHLY))
        });
      }

      if (status === PAYMENT_REQUEST_STATUS.REJECTED) {
        updates.rejectionReason = "Payment proof not approved";
      }

      await setDoc(requestRef, updates, { merge: true });
      // Refresh data
      const requestsSnapshot = await getDocs(collection(db, "payment_requests"));
      const updatedRequests = requestsSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setAdminData(prev => ({ ...prev, paymentRequests: updatedRequests }));
    }

    return (
      <div style={{ paddingBottom: 20 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Admin Dashboard
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: "var(--blue)", letterSpacing: -1, lineHeight: 1 }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>Total registered users</div>
        </div>

        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--blue)33", borderRadius: 18, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Premium Users</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--blue)", letterSpacing: -0.5 }}>{premiumUsers}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>Active Pro/Business subscribers</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--gold)33", borderRadius: 18, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Pending Payments</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--gold)", letterSpacing: -0.5 }}>{pendingRequests}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>Awaiting approval</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--accent)33", borderRadius: 18, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Total Revenue</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--accent)", letterSpacing: -0.5 }}>Rs {totalRevenue}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>From approved payments</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--danger)33", borderRadius: 18, padding: "18px 16px", boxShadow: "var(--card-shadow)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Free Users</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, color: "var(--danger)", letterSpacing: -0.5 }}>{totalUsers - premiumUsers}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>Using free plan</div>
            </div>
          </div>

          <Collapsible 
            title="Payment Verification" 
            icon="💳" 
            color="var(--gold)"
            count={filteredRequests.length}
            defaultOpen={pendingRequests > 0}
          >
            <div className="card" style={{ padding: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  [PAYMENT_REQUEST_STATUS.PENDING, "Pending"],
                  [PAYMENT_REQUEST_STATUS.APPROVED, "Approved"],
                  [PAYMENT_REQUEST_STATUS.REJECTED, "Rejected"],
                  ["all", "All"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className="btn-secondary"
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      background: requestFilter === value ? "var(--surface-pop)" : "var(--surface-high)",
                      color: requestFilter === value ? "var(--text)" : "var(--text-sec)"
                    }}
                    onClick={() => setRequestFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              {filteredRequests.length === 0 ? (
                <EmptyState
                  title="No payment requests"
                  message="Customer UPI payment submissions will appear here for admin verification."
                  accentColor="var(--gold)"
                />
              ) : (
                filteredRequests.map(request => (
                  <div key={request.id} className="card-row" style={{ alignItems: "flex-start", gap: 14 }}>
                    <Avatar name={request.userName || request.userEmail || "?"} size={42} fontSize={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{request.userName || "Unnamed User"}</span>
                        <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>
                          {request.requestedPlan === SUB_PLANS.BUSINESS ? "Business (Coming Soon)" : `${PLAN_LABELS[request.requestedPlan || SUB_PLANS.PRO] || "Pro"} ${request.billingCycle === BILLING_CYCLES.YEARLY ? "Yearly" : "Monthly"}`}
                        </span>
                        <span
                          className="pill"
                          style={{
                            background:
                              (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.APPROVED
                                ? "var(--accent-deep)"
                                : (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.REJECTED
                                  ? "var(--danger-deep)"
                                  : "var(--gold-deep)",
                            color:
                              (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.APPROVED
                                ? "var(--accent)"
                                : (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.REJECTED
                                  ? "var(--danger)"
                                  : "var(--gold)"
                          }}
                        >
                          {request.status || PAYMENT_REQUEST_STATUS.PENDING}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 4 }}>{request.userEmail || "No email"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        Amount Rs {request.amount || 0} - UPI {request.transactionId || "--"} - Submitted {formatSubscriptionDate(request.createdAt) || "--"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        Payee {request.upiPayeeName || UPI_CONFIG.payeeName} - UPI ID {request.upiId || UPI_CONFIG.upiId}
                      </div>

                      {request.note && (
                        <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, background: "var(--surface-high)", borderRadius: 12, padding: "10px 12px" }}>
                          {request.note}
                        </div>
                      )}

                      {request.screenshotUrl && (
                        <a
                          href={request.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ display: "inline-flex", marginTop: 12, padding: "8px 12px", fontSize: 12, textDecoration: "none", color: "var(--blue)" }}
                        >
                          View Payment Screenshot
                        </a>
                      )}

                      {(request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.PENDING && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                          <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, color: "var(--accent)" }} onClick={() => updatePaymentRequestStatus(request, PAYMENT_REQUEST_STATUS.APPROVED)}>
                            Approve Payment
                          </button>
                          <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, color: "var(--danger)" }} onClick={() => updatePaymentRequestStatus(request, PAYMENT_REQUEST_STATUS.REJECTED)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible 
            title="User Management" 
            icon="👥" 
            color="var(--blue)"
            count={filteredUsers.length}
            defaultOpen={false}
          >
            <div className="card" style={{ padding: 14, marginBottom: 18 }}>
              <input
                className="input-field"
                placeholder="Search by name, email, or phone"
                value={search}
                onChange={event => setSearch(event.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  ["all", "All"],
                  ["active", "Unblocked"],
                  ["blocked", "Blocked"],
                  ["premium", "Premium"],
                  ["shared", "Shared"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className="btn-secondary"
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      background: userFilter === value ? "var(--surface-pop)" : "var(--surface-high)",
                      color: userFilter === value ? "var(--text)" : "var(--text-sec)"
                    }}
                    onClick={() => setUserFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              {filteredUsers.length === 0 ? (
                <EmptyState title="No matching users" message="Try changing the search or filter to find the account you want." accentColor="var(--blue)" />
              ) : (
                filteredUsers.map(member => (
                  <div key={member.id} className="card-row" style={{ alignItems: "flex-start", gap: 12 }}>
                    <Avatar name={member.name || member.email || "?"} size={42} fontSize={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{member.name || "Unnamed User"}</span>
                        {member.role === "admin" && <span className="pill" style={{ background: "var(--purple-deep)", color: "var(--purple)" }}>Admin</span>}
                        {member.role !== "admin" && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>{PLAN_LABELS[member.plan || SUB_PLANS.FREE] || "Free"}</span>}
                        {member.blocked && <span className="pill" style={{ background: "var(--danger-deep)", color: "var(--danger)" }}>Blocked</span>}
                        {member.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL && (
                          <span className="pill" style={{ background: "var(--gold-deep)", color: "var(--gold)" }}>
                            Trial {member.subscriptionEndsAt ? `until ${formatSubscriptionDate(member.subscriptionEndsAt)}` : ""}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 4 }}>{member.email || "No email"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                        {member.phone || "No phone"} - {(member.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE)} access
                        {member.sharedLedgerId ? ` - Shared ledger ${member.sharedLedgerId}` : ""}
                      </div>
                      {member.id !== user.id && (
                        <div className="desktop-grid-3" style={{ marginTop: 12 }}>
                          <select
                            className="input-field"
                            value={member.plan || SUB_PLANS.FREE}
                            onChange={event => updateUserPlan(member, event.target.value)}
                            style={{ padding: "10px 12px", fontSize: 13, borderRadius: 10, marginBottom: 8 }}
                          >
                            <option value={SUB_PLANS.FREE}>Free</option>
                            <option value={SUB_PLANS.PRO}>Pro</option>
                            <option value={SUB_PLANS.BUSINESS}>Business (Internal)</option>
                          </select>
                          <select
                            className="input-field"
                            value={member.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE}
                            onChange={event => updateSubscriptionStatus(member, event.target.value)}
                            style={{ padding: "10px 12px", fontSize: 13, borderRadius: 10, marginBottom: 8 }}
                          >
                            <option value={SUBSCRIPTION_STATUS.ACTIVE}>Active</option>
                            <option value={SUBSCRIPTION_STATUS.INACTIVE}>Inactive</option>
                            <option value={SUBSCRIPTION_STATUS.TRIAL}>Trial</option>
                          </select>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: "8px 12px", fontSize: 12, color: member.blocked ? "var(--accent)" : "var(--danger)" }}
                              onClick={() => toggleBlock(member.id, member.blocked)}
                            >
                              {member.blocked ? "Unblock" : "Block"}
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ padding: "8px 12px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)44" }}
                              onClick={() => deleteUserRecord(member)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <div className="card" style={{ marginTop: 18, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>How payment verification works</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
              Customers now pay to your UPI ID ({UPI_CONFIG.upiId}), upload a screenshot, and submit the transaction reference from Settings. You verify the proof here and approve the subscription to activate it automatically.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orgType = getOrgType(user?.organizationType || data.account?.organizationType);
  const isApartmentOrg = orgType === ORG_TYPES.APARTMENT;
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;
  const stats = isApartmentOrg
    ? (viewMode === "month" ? calculateApartmentDashboard(data, year, month) : calculateApartmentYearlyDashboard(data, year))
    : isPersonalOrg
      ? (viewMode === "month" ? calculatePersonalDashboard(data, year, month) : calculatePersonalYearlyDashboard(data, year))
    : (viewMode === "month" ? calculateDashboard(data, year, month) : calculateYearlyDashboard(data, year));
  const showAdvanced = canUseFeature(user, "advancedAnalytics");
  const currentPlan = getUserPlan(user);
  const isTrial = user?.subscriptionStatus === "trial";

  const heroTone = stats.profit >= 0 ? "var(--accent)" : "var(--danger)";
  const heroSub = viewMode === "month" 
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
      onComplete={() => {
        localStorage.setItem(`setup-guide-${user?.id}`, "true");
        setShowSetupGuide(false);
      }}
      data={data}
      onNavigate={onNav}
      user={user}
      account={data.account}
      onUpdateAccount={async (accountInfo) => {
        try {
          await updateProfile({
            name: accountInfo.name || "",
            email: accountInfo.email || "",
            phone: accountInfo.phone || "",
            address: accountInfo.address || "",
            gstin: accountInfo.gstin || "",
            showHSN: Boolean(accountInfo.showHSN),
            organizationType: accountInfo.organizationType || user?.organizationType,
            account: {
              name: accountInfo.name || "",
              email: accountInfo.email || "",
              phone: accountInfo.phone || "",
              address: accountInfo.address || "",
              gstin: accountInfo.gstin || "",
              showHSN: Boolean(accountInfo.showHSN),
              organizationType: accountInfo.organizationType || user?.organizationType
            }
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
    const personalCashFlow = viewMode === "month" ? stats.cashFlow : stats.monthlyBreakdown;
    const personalMaxCashFlow = Math.max(1, ...personalCashFlow.map(item => Math.max(item.income, item.expenses)));

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
            <Tile label={viewMode === "month" ? "Left for Goals" : "Available for Goals"} value={fmtMoney(stats.goalContribution || stats.netAfterEmi || 0, sym)} color={(stats.netAfterEmi || 0) >= 0 ? "var(--accent)" : "var(--danger)"} sub={viewMode === "month" ? "Cash left after spending and EMI" : "Yearly cash left after spending and EMI"} />
            <Tile label={viewMode === "month" ? "Goal Gap" : "Yearly Goal Gap"} value={stats.monthlySavingsGoal > 0 ? fmtMoney(stats.goalLeft || 0, sym) : "--"} color={stats.goalLeft > 0 ? "var(--gold)" : "var(--blue)"} sub={stats.monthlySavingsGoal > 0 ? stats.goalStatus : "Set a savings goal in Settings"} onClick={() => onNav("settings")} />
            <Tile label="Outstanding Loans" value={fmtMoney(stats.totalOutstanding || 0, sym)} color="var(--blue)" sub="Current open EMI balances" onClick={() => onNav("emi")} />
            <Tile label="People" value={String(stats.peopleCount || 0)} color="var(--purple)" sub="From Settings and tagged household entries" onClick={() => onNav("settings")} />
            <Tile label="Spending Ratio" value={`${Math.round(stats.spendingRatio || 0)}%`} color={(stats.spendingRatio || 0) >= 100 ? "var(--danger)" : "var(--gold)"} sub="Spending as a share of earnings" />
          </div>

          <div style={{ marginBottom: 22 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stats.goalStatus}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                    {stats.monthlySavingsGoal > 0
                      ? `Target ${fmtMoney(stats.goalTargetAmount || stats.monthlySavingsGoal, sym)} · Saved ${fmtMoney(stats.goalSavedAmount || 0, sym)}${stats.goalTargetDate ? ` · By ${stats.goalTargetDate}` : ""}`
                      : "Set a savings goal in Settings to track how much money is still free for goals."}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: stats.goalLeft > 0 ? "var(--gold)" : "var(--accent)" }}>
                  {stats.monthlySavingsGoal > 0 ? `${Math.round(stats.goalProgress || 0)}%` : "--"}
                </div>
              </div>
              <ProgressBar pct={stats.goalProgress || 0} color={stats.goalLeft > 0 ? "var(--gold)" : "var(--accent)"} />
            </div>
          </div>

          <Collapsible title="Household Members" icon="👥" color="var(--purple)" count={viewMode === "month" ? stats.memberTotals.length : stats.peopleCount || 0} defaultOpen>
            <div className="card">
              {viewMode !== "month" ? (
                <EmptyState title="Switch to monthly view" message="Member-wise earnings and spending are shown in monthly view." accentColor="var(--purple)" />
              ) : stats.memberTotals.length === 0 ? (
                <EmptyState title="No people activity yet" message="Add people in Settings and tag earnings or spending against them." actionLabel="Open Settings" onAction={() => onNav("settings")} accentColor="var(--purple)" />
              ) : (
                stats.memberTotals.map(person => (
                  <div key={person.name} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{person.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {person.hasActivity
                          ? `Earnings ${fmtMoney(person.income, sym)} · Spending ${fmtMoney(person.spending, sym)}`
                          : "No tagged activity this month yet"}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: person.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{person.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(person.net), sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Collapsible>

          <Collapsible title="EMI Tracker" icon="◎" color="var(--gold)" count={stats.upcomingEmis.length} defaultOpen>
            <div className="card">
              {stats.upcomingEmis.length === 0 ? (
                <EmptyState title="No EMI records yet" message="Add your active EMIs to track due dates and balances." actionLabel="Go to EMIs" onAction={() => onNav("emi")} accentColor="var(--gold)" />
              ) : (
                stats.upcomingEmis.map(emi => (
                  <div key={emi.id || emi.loanName} className="card-row">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{emi.loanName || "EMI"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{[emi.lender || "", emi.scheduledDate ? `Due ${emi.scheduledDate}` : emi.dueDate ? `Due ${emi.dueDate}` : "No due date", emi.endDate ? `Ends ${emi.endDate}` : "", emi.outstandingBalance ? `Outstanding ${fmtMoney(emi.outstandingBalance, sym)}` : ""].filter(Boolean).join(" · ")}</div>
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

          <Collapsible title="Household Alerts" icon="🚨" color="var(--gold)" count={stats.alertItems.length} defaultOpen={stats.alertItems.length > 0}>
            <div className="card">
              {stats.alertItems.length === 0 ? (
                <EmptyState title="No household alerts right now" message="Your earnings, spending, and EMI commitments look stable for the selected period." accentColor="var(--accent)" />
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

          <Collapsible title="Spending Pressure" icon="💡" color="var(--danger)" count={2} defaultOpen={viewMode === "month"}>
            <div className="card">
              <div className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Essential vs non-essential</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Focus on non-essential cuts first when spending is rising.</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(stats.nonEssentialSpending || 0, sym)}</span>
              </div>
              <div className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Current overspend pressure</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>How much spending and EMI are above earnings for the selected period.</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: stats.spendingPressure > 0 ? "var(--danger)" : "var(--accent)" }}>{fmtMoney(stats.spendingPressure || 0, sym)}</span>
              </div>
            </div>
          </Collapsible>

          <Collapsible title="Cash Flow Trend" icon="📊" color="var(--blue)" defaultOpen={false}>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${viewMode === "month" ? 6 : 12}, 1fr)`, gap: viewMode === "month" ? 8 : 6, alignItems: "end", height: 180 }}>
                {personalCashFlow.map(item => (
                  <div key={item.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "end", gap: viewMode === "month" ? 4 : 2, height: 132 }}>
                      <div style={{ width: viewMode === "month" ? 12 : 8, height: `${Math.max(viewMode === "month" ? 10 : 8, (item.income / personalMaxCashFlow) * 120)}px`, background: "var(--accent)", borderRadius: 999 }} />
                      <div style={{ width: viewMode === "month" ? 12 : 8, height: `${Math.max(viewMode === "month" ? 10 : 8, (item.expenses / personalMaxCashFlow) * 120)}px`, background: "var(--danger)", borderRadius: 999 }} />
                    </div>
                    <div style={{ fontSize: viewMode === "month" ? 11 : 10, fontWeight: 700, color: "var(--text-dim)" }}>{viewMode === "month" ? item.shortLabel : item.label.slice(0, 1)}</div>
                    <div style={{ fontSize: 10, color: item.net >= 0 ? "var(--accent)" : "var(--danger)" }}>{item.net >= 0 ? "+" : "-"}{fmtMoney(Math.abs(item.net), sym)}</div>
                  </div>
                ))}
              </div>
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
          Smart Dashboard · {viewMode === "month" ? `${MONTHS[month]} ${year}` : `${year}`}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 44, color: heroTone, letterSpacing: -1, lineHeight: 1 }}>
          {stats.profit < 0 ? "-" : ""}{fmtMoney(Math.abs(stats.profit), sym)}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 8 }}>{heroSub}</div>
      </div>

      <div style={{ padding: "20px 18px 0" }}>
        {(currentPlan === PLANS.FREE || isTrial) && (
          <div style={{ marginBottom: 18, padding: "12px 14px", background: currentPlan === PLANS.FREE ? "var(--gold-deep)" : "var(--accent-deep)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: currentPlan === PLANS.FREE ? "var(--gold)" : "var(--accent)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                {currentPlan === PLANS.FREE ? "📌 Upgrade to Pro" : "✨ Pro Trial Active"}
              </div>
              <div style={{ fontSize: 12, color: currentPlan === PLANS.FREE ? "var(--gold-text)" : "var(--accent-text)", marginTop: 2 }}>
                {currentPlan === PLANS.FREE ? "Unlock reports, PDF exports, alerts, and a 30-day free trial" : isTrial && user?.subscriptionEndsAt ? `Ends ${formatSubscriptionDate(user.subscriptionEndsAt)}` : "All Pro features active"}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: currentPlan === PLANS.FREE ? "var(--gold)" : "var(--accent)", whiteSpace: "nowrap" }}>
              {currentPlan === PLANS.FREE ? "Rs 49/mo" : ""}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          {viewMode === "month" ? (
            <>
          <Tile label="Receipts" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub="Manual + invoice receipts" onClick={() => onNav("income")} />
              <Tile label="Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub="Recurring and one-time costs" onClick={() => onNav("expenses")} />
              <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
              {showAdvanced ? (
                <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days`} color="var(--blue)" sub={stats.burnRateDays === null ? "Add expenses to unlock this metric" : "Estimated runway from this month's free cash"} />
              ) : (
                <Tile label="Advanced Metrics" value="Pro" color="var(--blue)" sub="Upgrade to unlock burn rate & more" onClick={() => {}} />
              )}
            </>
          ) : (
            <>
              <Tile label="Total Receipts" value={fmtMoney(stats.totalIncome, sym)} color="var(--accent)" sub={`Avg ${fmtMoney(stats.avgMonthlyIncome, sym)}/month`} />
              <Tile label="Total Expenses" value={fmtMoney(stats.totalExpense, sym)} color="var(--danger)" sub={`Avg ${fmtMoney(stats.avgMonthlyExpense, sym)}/month`} />
              <Tile label="Pending Invoices" value={fmtMoney(stats.pendingInvoiceTotal, sym)} color="var(--gold)" sub={`${stats.pendingInvoices.length} awaiting payment`} onClick={() => onNav("invoices")} />
              <Tile label="Burn Rate" value={stats.burnRateDays === null ? "--" : `${Math.floor(stats.burnRateDays / 12)} months`} color="var(--blue)" sub="Estimated yearly runway" />
            </>
          )}
        </div>


        {showAdvanced && (
          <div style={{ marginBottom: 22 }}>
            <div className="section-label">Savings Goal</div>
            <div className="card" style={{ padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stats.goalStatus}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                    {stats.monthlySavingsGoal > 0
                      ? `Target ${fmtMoney(stats.goalTargetAmount || stats.monthlySavingsGoal, sym)} · Saved ${fmtMoney(stats.goalSavedAmount || 0, sym)}${stats.goalTargetDate ? ` · By ${stats.goalTargetDate}` : ""}`
                      : "Set a savings goal in Settings with target amount, target date, and saved till date."}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: stats.goalStatus === "On track" ? "var(--accent)" : "var(--gold)" }}>
                  {stats.monthlySavingsGoal > 0 ? `${Math.round(stats.goalProgress)}%` : "--"}
                </div>
              </div>
              <ProgressBar pct={stats.goalProgress} color={stats.goalStatus === "On track" ? "var(--accent)" : "var(--gold)"} />
            </div>
          </div>
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
