import React, { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc, startAfter, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar, EmptyState, SectionSkeleton } from "../components/UI";
import { buildLocationLabel, formatDuration, getAgeGroupFromDateOfBirth, parseLocationFields } from "../utils/profile";
import {
  PLAN_LABELS,
  PLANS,
  SUBSCRIPTION_STATUS,
  formatSubscriptionDate,
  getTrialEndDate
} from "../utils/subscription";

export default function AdminUsersSection() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastUserDoc, setLastUserDoc] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [adminError, setAdminError] = useState("");
  const USERS_PAGE_SIZE = 60;

  function sortUsersByCreatedAt(list = []) {
    return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async function fetchAdminData({ append = false } = {}) {
    if (append) {
      if (!hasMoreUsers || loadingMore) return;
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setAdminError("");
    try {
      const usersRef = collection(db, "users");
      const usersQuery = append && lastUserDoc
        ? query(usersRef, orderBy("createdAt", "desc"), startAfter(lastUserDoc), limit(USERS_PAGE_SIZE))
        : query(usersRef, orderBy("createdAt", "desc"), limit(USERS_PAGE_SIZE));

      const usersSnapshot = await getDocs(usersQuery);
      const fetchedUsers = usersSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      setUsers(prev => (append ? sortUsersByCreatedAt([...prev, ...fetchedUsers]) : sortUsersByCreatedAt(fetchedUsers)));
      setLastUserDoc(usersSnapshot.docs.length ? usersSnapshot.docs[usersSnapshot.docs.length - 1] : (append ? lastUserDoc : null));
      setHasMoreUsers(usersSnapshot.docs.length === USERS_PAGE_SIZE);
    } catch (err) {
      console.error("Admin users load error:", err);
      setAdminError("Failed to load admin user activity. Please check your Firestore permissions and try again.");
      if (!append) {
        setUsers([]);
        setLastUserDoc(null);
        setHasMoreUsers(false);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(member => {
      const parsedLocation = parseLocationFields(member.location || "");
      const locationLabel = buildLocationLabel({
        city: member.city || parsedLocation.city,
        state: member.state || parsedLocation.state,
        country: member.country || parsedLocation.country
      });
      const haystack = `${member.name || ""} ${member.email || ""} ${member.phone || ""} ${locationLabel}`.toLowerCase();
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

  const recentActivity = useMemo(() => {
    return users
      .filter(member => member.createdAt)
      .map(member => ({
        time: new Date(member.createdAt).getTime(),
        label: `${member.name || member.email || "Unknown"} joined`,
        detail: [member.plan || "free", member.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE, member.blocked ? "blocked" : "active"]
          .filter(Boolean)
          .join(" · ")
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 12);
  }, [users]);

  async function toggleBlock(id, blocked) {
    if (id === user.id) {
      alert("You cannot block your own account.");
      return;
    }

    setAdminError("");
    try {
      await updateDoc(doc(db, "users", id), { blocked: !blocked });
      fetchAdminData();
    } catch (err) {
      console.error("Block/unblock error:", err);
      setAdminError("Unable to update the user's block status. Please try again.");
      alert(err?.message || "Unable to update the user's block status. Please try again.");
    }
  }

  async function deleteUserRecord(member) {
    if (member.id === user.id) {
      alert("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm("This will remove the user's Firestore profile and queue an Authentication cleanup request. Continue?");
    if (!confirmed) return;

    setAdminError("");
    try {
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

      await deleteDoc(doc(db, "payment_requests", member.id));
      await deleteDoc(doc(db, "users", member.id));
      fetchAdminData();
      alert("User profile removed from Firestore and auth cleanup has been queued.");
    } catch (err) {
      console.error("Delete user error:", err);
      setAdminError("Unable to delete the user profile right now. Please try again.");
      alert(err?.message || "Unable to delete the user profile right now. Please try again.");
    }
  }

  async function updateUserPlan(member, plan) {
    setAdminError("");
    try {
      const updates = {
        plan,
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE
      };

      if (plan === PLANS.FREE) {
        updates.subscriptionEndsAt = "";
      }

      await updateDoc(doc(db, "users", member.id), updates);
      fetchAdminData();
    } catch (err) {
      console.error("Update plan error:", err);
      setAdminError("Unable to update the user's plan. Please try again.");
      alert(err?.message || "Unable to update the user's plan. Please try again.");
    }
  }

  async function updateSubscriptionStatus(member, subscriptionStatus) {
    setAdminError("");
    try {
      const updates = { subscriptionStatus };
      if (subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL) {
        updates.subscriptionEndsAt = getTrialEndDate();
      }
      if (subscriptionStatus !== SUBSCRIPTION_STATUS.TRIAL) {
        updates.subscriptionEndsAt = "";
      }
      await updateDoc(doc(db, "users", member.id), updates);
      fetchAdminData();
    } catch (err) {
      console.error("Update subscription status error:", err);
      setAdminError("Unable to update the user's subscription status. Please try again.");
      alert(err?.message || "Unable to update the user's subscription status. Please try again.");
    }
  }

  async function updatePaymentRequestStatus(request, status) {
    setAdminError("");
    try {
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
    } catch (err) {
      console.error("Payment request status update error:", err);
      setAdminError("Unable to update the payment request. Please try again.");
      alert(err?.message || "Unable to update the payment request. Please try again.");
    }
  }

  if (loading) {
    return <SectionSkeleton rows={6} showHero={false} />;
  }

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <div className="section-label">User Activity</div>
      {adminError && (
        <div className="card" style={{ padding: 16, marginBottom: 18, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--danger)" }}>Admin access warning</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>{adminError}</div>
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 18, borderLeft: "4px solid var(--blue)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>Users</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, maxWidth: 620 }}>
              Review signups, adjust plan access, and block or remove user accounts from one place.
            </div>
          </div>
          <button className="btn-secondary" type="button" style={{ padding: "10px 14px", fontSize: 12, minWidth: 140 }} onClick={fetchAdminData}>
            Refresh activity
          </button>
        </div>
      </div>

      <div className="section-label">Recent User Activity</div>
      <div className="card" style={{ marginBottom: 18, padding: 14 }}>
        {recentActivity.length === 0 ? (
          <div style={{ padding: 18, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>No recent user activity found yet.</div>
        ) : (
          recentActivity.map((event, index) => (
            <div key={`${event.time}-${index}`} className="card-row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{event.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{event.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-sec)" }}>{new Date(event.time).toLocaleString("en-IN")}</div>
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
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.6 }}>
                  {buildLocationLabel({
                    city: member.city || parseLocationFields(member.location || "").city,
                    state: member.state || parseLocationFields(member.location || "").state,
                    country: member.country || parseLocationFields(member.location || "").country
                  }) || "Location not set"}
                  {member.gender ? ` · ${member.gender}` : ""}
                  {(member.ageGroup || getAgeGroupFromDateOfBirth(member.dateOfBirth)) ? ` · ${member.ageGroup || getAgeGroupFromDateOfBirth(member.dateOfBirth)}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 3, lineHeight: 1.6 }}>
                  Time spent: {formatDuration(member.analytics?.totalSessionMs || 0)}
                  {member.lastActivityAt ? ` · Last active ${new Date(member.lastActivityAt).toLocaleString("en-IN")}` : ""}
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

      <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => fetchAdminData({ append: true })}
          disabled={!hasMoreUsers || loadingMore}
          style={{ minWidth: 180 }}
        >
          {loadingMore ? "Loading more users..." : hasMoreUsers ? "Load More Users" : "No More Users"}
        </button>
      </div>

      <div className="card" style={{ marginTop: 18, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>User admin actions</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
          Use this section for account-level actions only: review new users, adjust plans, manage trial status, and block or remove accounts when needed.
        </div>
      </div>
    </div>
  );
}
