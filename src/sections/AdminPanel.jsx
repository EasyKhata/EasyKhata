import React, { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar, EmptyState, SectionSkeleton } from "../components/UI";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  PLAN_LABELS,
  PLANS,
  SUBSCRIPTION_STATUS,
  UPI_CONFIG,
  formatSubscriptionDate,
  getBillingDuration,
  getSubscriptionEndDate,
  getTrialEndDate
} from "../utils/subscription";

const REQUEST_FILTERS = [
  [PAYMENT_REQUEST_STATUS.PENDING, "Pending"],
  [PAYMENT_REQUEST_STATUS.APPROVED, "Approved"],
  [PAYMENT_REQUEST_STATUS.REJECTED, "Rejected"],
  ["all", "All"]
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentRequestsEnabled, setPaymentRequestsEnabled] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [requestFilter, setRequestFilter] = useState(PAYMENT_REQUEST_STATUS.PENDING);
  const [loading, setLoading] = useState(true);

  if (user?.role !== "admin") {
    return <div style={{ padding: 20 }}>Access denied.</div>;
  }

  async function fetchAdminData() {
    setLoading(true);
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
    } catch (err) {
      console.error("Admin panel load error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(member => {
      const haystack = `${member.name || ""} ${member.email || ""} ${member.phone || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesFilter =
        userFilter === "all" ||
        (userFilter === "blocked" && member.blocked) ||
        (userFilter === "active" && !member.blocked) ||
        (userFilter === "shared" && member.sharedLedgerId) ||
        (userFilter === "premium" && (member.plan === PLANS.PRO || member.plan === PLANS.BUSINESS));
      return matchesSearch && matchesFilter;
    });
  }, [search, userFilter, users]);

  const filteredRequests = useMemo(() => {
    return paymentRequests.filter(item => requestFilter === "all" || (item.status || PAYMENT_REQUEST_STATUS.PENDING) === requestFilter);
  }, [paymentRequests, requestFilter]);

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter(item => item.plan === PLANS.PRO || item.plan === PLANS.BUSINESS).length,
    blockedUsers: users.filter(item => item.blocked).length,
    pendingRequests: paymentRequests.filter(item => (item.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.PENDING).length
  };

  async function toggleBlock(id, blocked) {
    if (id === user.id) {
      alert("You cannot block your own account.");
      return;
    }

    await updateDoc(doc(db, "users", id), { blocked: !blocked });
    fetchAdminData();
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
    fetchAdminData();
    alert("User profile removed from Firestore and auth cleanup has been queued.");
  }

  async function updateUserPlan(member, plan) {
    const updates = {
      plan,
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
    };

    if (plan === PLANS.FREE) {
      updates.subscriptionEndsAt = "";
    }

    await updateDoc(doc(db, "users", member.id), updates);
    fetchAdminData();
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
    fetchAdminData();
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
        plan: request.requestedPlan || PLANS.PRO,
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
        subscriptionEndsAt: getSubscriptionEndDate(getBillingDuration(request.billingCycle || BILLING_CYCLES.MONTHLY))
      });
    }

    if (status === PAYMENT_REQUEST_STATUS.REJECTED) {
      updates.rejectionReason = "Payment proof not approved";
    }

    await setDoc(requestRef, updates, { merge: true });
    fetchAdminData();
  }

  if (loading) {
    return <SectionSkeleton rows={6} showHero={false} />;
  }

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <div className="section-label">Admin Overview</div>
      <div className="desktop-grid-2" style={{ marginBottom: 18 }}>
        {[
          ["Total Users", stats.totalUsers, "var(--blue)"],
          ["Premium Users", stats.premiumUsers, "var(--accent)"],
          ["Blocked Users", stats.blockedUsers, "var(--danger)"],
          ["Pending Payments", stats.pendingRequests, "var(--gold)"]
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: "16px 14px", borderColor: `${color}33`, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Payment Verification</div>
      <div className="card" style={{ padding: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {REQUEST_FILTERS.map(([value, label]) => (
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

      <div className="card" style={{ marginBottom: 24 }}>
        {!paymentRequestsEnabled ? (
          <EmptyState
            title="Payment requests are locked by rules"
            message="User data is still loading, but the payment_requests collection is not readable yet. Add rules for payment_requests to enable this section."
            accentColor="var(--gold)"
          />
        ) : filteredRequests.length === 0 ? (
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
                    {request.requestedPlan === PLANS.BUSINESS ? "Business (Coming Soon)" : `${PLAN_LABELS[request.requestedPlan || PLANS.PRO] || "Pro"} ${request.billingCycle === BILLING_CYCLES.YEARLY ? "Yearly" : "Monthly"}`}
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

      <div className="section-label">User Management</div>
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
                  {member.role !== "admin" && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>{PLAN_LABELS[member.plan || PLANS.FREE] || "Free"}</span>}
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
                      value={member.plan || PLANS.FREE}
                      onChange={event => updateUserPlan(member, event.target.value)}
                      style={{ padding: "10px 12px", fontSize: 13, borderRadius: 10, marginBottom: 8 }}
                    >
                      <option value={PLANS.FREE}>Free</option>
                      <option value={PLANS.PRO}>Pro</option>
                      <option value={PLANS.BUSINESS}>Business (Internal)</option>
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

      <div className="card" style={{ marginTop: 18, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>How payment verification works</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
          Customers now pay to your UPI ID ({UPI_CONFIG.upiId}), upload a screenshot, and submit the transaction reference from Settings. You verify the proof here and approve the subscription to activate it automatically.
        </div>
      </div>
    </div>
  );
}
