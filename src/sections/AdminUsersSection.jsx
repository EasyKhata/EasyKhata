import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api";
import { logError } from "../utils/logger";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/DialogContext";
import { Avatar, SectionSkeleton, WorkflowSetupCard } from "../components/UI";
import { buildLocationLabel, getAgeGroupFromDateOfBirth, parseLocationFields } from "../utils/profile";
import {
  PLAN_LABELS,
  PLANS,
  SUBSCRIPTION_STATUS,
  formatSubscriptionDate,
  getTrialEndDate
} from "../utils/subscription";

function isPaidPlan(plan) {
  return plan === PLANS.PRO || plan === PLANS.PRO_PLUS || plan === "business";
}

export default function AdminUsersSection() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
      const page = append ? currentPage + 1 : 1;
      const { users: fetchedUsers, hasMore } = await adminApi.listUsers(page, USERS_PAGE_SIZE);

      setUsers(prev => (append ? sortUsersByCreatedAt([...prev, ...fetchedUsers]) : sortUsersByCreatedAt(fetchedUsers)));
      setHasMoreUsers(hasMore);
      if (append) setCurrentPage(page);
      else setCurrentPage(1);
    } catch (err) {
      logError("Admin users load error", err);
      setAdminError("Failed to load users. Please try again.");
      if (!append) setUsers([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const now = new Date();
    const rows = users.filter(member => {
      const parsedLocation = parseLocationFields(member.location || "");
      const locationLabel = buildLocationLabel({
        city: member.city || parsedLocation.city,
        state: member.state || parsedLocation.state,
        country: member.country || parsedLocation.country
      });
      const orgCount = Array.isArray(member.organizations) ? member.organizations.length : 0;
      const records = (member.organizations || []).reduce((sum, org) => sum + Number(org._count?.income || 0) + Number(org._count?.expenses || 0) + Number(org._count?.invoices || 0) + Number(org._count?.customers || 0) + Number(org._count?.orgRecords || 0), 0);
      const lastActivity = member.lastActivityAt ? new Date(member.lastActivityAt) : null;
      const inactiveDays = lastActivity && !Number.isNaN(lastActivity.getTime()) ? Math.floor((now - lastActivity) / 86400000) : null;
      const haystack = `${member.name || ""} ${member.email || ""} ${member.phone || ""} ${locationLabel}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesFilter =
        userFilter === "all" ||
        (userFilter === "blocked" && member.blocked) ||
        (userFilter === "active" && !member.blocked) ||
        (userFilter === "premium" && isPaidPlan(member.plan)) ||
        (userFilter === "trial" && member.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL) ||
        (userFilter === "dormant" && inactiveDays !== null && inactiveDays > 30) ||
        (userFilter === "multi_org" && orgCount > 1) ||
        (userFilter === "activated" && records > 0);
      return matchesSearch && matchesFilter;
    });
    return rows.sort((a, b) => {
      const aRecords = (a.organizations || []).reduce((sum, org) => sum + Number(org._count?.income || 0) + Number(org._count?.expenses || 0) + Number(org._count?.invoices || 0) + Number(org._count?.customers || 0) + Number(org._count?.orgRecords || 0), 0);
      const bRecords = (b.organizations || []).reduce((sum, org) => sum + Number(org._count?.income || 0) + Number(org._count?.expenses || 0) + Number(org._count?.invoices || 0) + Number(org._count?.customers || 0) + Number(org._count?.orgRecords || 0), 0);
      if (sortMode === "activity") return new Date(b.lastActivityAt || b.updatedAt || 0) - new Date(a.lastActivityAt || a.updatedAt || 0);
      if (sortMode === "records") return bRecords - aRecords;
      if (sortMode === "orgs") return (b.organizations?.length || 0) - (a.organizations?.length || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [search, sortMode, userFilter, users]);

  const userStats = useMemo(() => {
    const now = new Date();
    return users.reduce((acc, member) => {
      const orgCount = Array.isArray(member.organizations) ? member.organizations.length : 0;
      const records = (member.organizations || []).reduce((sum, org) => sum + Number(org._count?.income || 0) + Number(org._count?.expenses || 0) + Number(org._count?.invoices || 0) + Number(org._count?.customers || 0) + Number(org._count?.orgRecords || 0), 0);
      const lastActivity = member.lastActivityAt ? new Date(member.lastActivityAt) : null;
      const inactiveDays = lastActivity && !Number.isNaN(lastActivity.getTime()) ? Math.floor((now - lastActivity) / 86400000) : null;
      acc.total += 1;
      if (!member.blocked) acc.active += 1;
      if (member.blocked) acc.blocked += 1;
      if (isPaidPlan(member.plan)) acc.premium += 1;
      if (member.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL) acc.trial += 1;
      if (orgCount > 1) acc.multiOrg += 1;
      if (records > 0) acc.activated += 1;
      if (inactiveDays !== null && inactiveDays > 30) acc.dormant += 1;
      return acc;
    }, { total: 0, active: 0, blocked: 0, premium: 0, trial: 0, multiOrg: 0, activated: 0, dormant: 0 });
  }, [users]);

  // Patch a user in local state instead of refetching all loaded pages. The previous
  // implementation called fetchAdminData() after every action, which reset to page 1
  // and discarded any extra pages the admin had loaded — annoying when triaging a
  // long list. Optimistic patches keep their place in the list intact.
  function patchUserLocally(userId, updates) {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
  }

  async function toggleBlock(id, blocked) {
    if (id === user.id) {
      setAdminError("You cannot block your own account.");
      return;
    }
    const target = users.find(u => u.id === id);
    const verb = blocked ? "Unblock" : "Block";
    const confirmed = await confirm(
      `${verb} ${target?.name || target?.email || "this user"}?${blocked ? "" : " They will be signed out and unable to access their account."}`,
      { title: `${verb} user`, confirmLabel: verb, danger: !blocked }
    );
    if (!confirmed) return;

    setAdminError("");
    const next = !blocked;
    patchUserLocally(id, { blocked: next });
    try {
      await adminApi.updateUser(id, { blocked: next });
    } catch (err) {
      // Roll back optimistic update on failure.
      patchUserLocally(id, { blocked });
      logError("Block/unblock error", err);
      setAdminError(err?.message || "Unable to update the user's block status. Please try again.");
    }
  }

  async function deleteUserRecord(member) {
    if (member.id === user.id) {
      setAdminError("You cannot delete your own admin account.");
      return;
    }
    const confirmed = await confirm(`Delete ${member.name || member.email}? This will permanently remove their account and all data.`, { title: "Delete User", confirmLabel: "Delete Permanently", danger: true });
    if (!confirmed) return;

    setAdminError("");
    try {
      await adminApi.deleteUser(member.id);
      // Remove just this user — keep the rest of the loaded list intact.
      setUsers(prev => prev.filter(u => u.id !== member.id));
    } catch (err) {
      logError("Delete user error", err);
      setAdminError(err?.message || "Unable to delete the user profile right now. Please try again.");
    }
  }

  async function updateUserPlan(member, plan) {
    if (plan === member.plan) return;
    const planLabel = plan === PLANS.PRO || plan === PLANS.PRO_PLUS || plan === "business" ? "Pro" : "Free";
    const isDowngrade = (member.plan === PLANS.PRO && plan === PLANS.FREE)
      || (isPaidPlan(member.plan) && plan === PLANS.FREE);
    const confirmed = await confirm(
      `Change ${member.name || member.email}'s plan to ${planLabel}?${isDowngrade ? " This will immediately downgrade their access." : ""}`,
      { title: "Change plan", confirmLabel: `Set ${planLabel}`, danger: isDowngrade }
    );
    if (!confirmed) return;

    setAdminError("");
    const updates = { plan, subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE };
    if (plan === PLANS.FREE) updates.subscriptionEndsAt = "";
    const before = { plan: member.plan, subscriptionStatus: member.subscriptionStatus, subscriptionEndsAt: member.subscriptionEndsAt };
    patchUserLocally(member.id, updates);
    try {
      await adminApi.updateUser(member.id, updates);
    } catch (err) {
      patchUserLocally(member.id, before);
      logError("Update plan error", err);
      setAdminError(err?.message || "Unable to update the user's plan. Please try again.");
    }
  }

  async function updateSubscriptionStatus(member, subscriptionStatus) {
    if (subscriptionStatus === member.subscriptionStatus) return;
    const confirmed = await confirm(
      `Set ${member.name || member.email}'s subscription to ${subscriptionStatus}?`,
      { title: "Change subscription status", confirmLabel: "Update" }
    );
    if (!confirmed) return;

    setAdminError("");
    const updates = { subscriptionStatus };
    if (subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL) updates.subscriptionEndsAt = getTrialEndDate();
    if (subscriptionStatus !== SUBSCRIPTION_STATUS.TRIAL) updates.subscriptionEndsAt = "";
    const before = { subscriptionStatus: member.subscriptionStatus, subscriptionEndsAt: member.subscriptionEndsAt };
    patchUserLocally(member.id, updates);
    try {
      await adminApi.updateUser(member.id, updates);
    } catch (err) {
      patchUserLocally(member.id, before);
      logError("Update subscription status error", err);
      setAdminError(err?.message || "Unable to update the user's subscription status. Please try again.");
    }
  }

  if (loading) {
    return <SectionSkeleton rows={6} showHero={false} />;
  }

  return (
    <div style={{ padding: "16px 16px 110px" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Users — {users.length} total</div>
        <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12 }} onClick={fetchAdminData}>
          Refresh
        </button>
      </div>

      {adminError && (
        <div className="card" style={{ padding: 14, marginBottom: 14, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>Error</div>
          <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4 }}>{adminError}</div>
        </div>
      )}

      <div style={{ marginBottom: 6, fontSize: 11, color: "var(--text-dim)" }}>
        {hasMoreUsers
          ? `Counts below reflect the ${users.length} loaded user${users.length === 1 ? "" : "s"} — load more to see full totals.`
          : `Counts below cover all ${users.length} user${users.length === 1 ? "" : "s"}.`}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 12 }}>
        {[
          ["Active", userStats.active, "var(--accent)"],
          ["Premium", userStats.premium, "var(--gold)"],
          ["Trial", userStats.trial, "var(--blue)"],
          ["Activated", userStats.activated, "var(--purple)"],
          ["Multi-org", userStats.multiOrg, "var(--green)"],
          ["Dormant", userStats.dormant, "var(--danger)"]
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: 12, marginBottom: 0, borderColor: `${color}44` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
            <div style={{ fontSize: 22, fontFamily: "var(--serif)", color: "var(--text)", marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          className="input-field"
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={event => setSearch(event.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select
          className="input-field"
          value={sortMode}
          onChange={event => setSortMode(event.target.value)}
          style={{ width: "auto", minWidth: 140, padding: "8px 12px", fontSize: 12 }}
        >
          <option value="newest">Newest first</option>
          <option value="activity">Recent activity</option>
          <option value="records">Most records</option>
          <option value="orgs">Most orgs</option>
        </select>
        {[["all", "All"], ["active", "Active"], ["premium", "Premium"], ["trial", "Trial"], ["activated", "Activated"], ["multi_org", "Multi-org"], ["dormant", "Dormant"], ["blocked", "Blocked"]].map(([value, label]) => (
          <button
            key={value}
            className="btn-secondary"
            style={{ padding: "8px 12px", fontSize: 12, background: userFilter === value ? "var(--surface-pop)" : "var(--surface-high)", color: userFilter === value ? "var(--text)" : "var(--text-sec)", flexShrink: 0 }}
            onClick={() => setUserFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="card">
        {filteredUsers.length === 0 ? (
          <WorkflowSetupCard title="No matching users" message="Try changing the search or filter to find the account you want." tone="info" />
        ) : (
          filteredUsers.map(member => (
            <div key={member.id} className="card-row" style={{ alignItems: "flex-start", gap: 12, padding: "12px 14px" }}>
              <Avatar name={member.name || member.email || "?"} size={36} fontSize={13} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{member.name || "Unnamed User"}</span>
                  {member.role === "admin" && <span className="pill" style={{ background: "var(--purple-deep)", color: "var(--purple)" }}>Admin</span>}
                  {member.role !== "admin" && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>{PLAN_LABELS[member.plan || PLANS.FREE] || "Free"}</span>}
                  {member.blocked && <span className="pill" style={{ background: "var(--danger-deep)", color: "var(--danger)" }}>Blocked</span>}
                  {member.subscriptionStatus === SUBSCRIPTION_STATUS.TRIAL && (
                    <span className="pill" style={{ background: "var(--gold-deep)", color: "var(--gold)" }}>
                      Trial{member.subscriptionEndsAt ? ` · ${formatSubscriptionDate(member.subscriptionEndsAt)}` : ""}
                    </span>
                  )}
                </div>
                {/* Row 2: contact + meta */}
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.5 }}>
                  {member.email || "No email"}
                  {member.phone ? ` · ${member.phone}` : ""}
                  {" · "}{member.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE}
                  {Array.isArray(member.organizations) ? ` · ${member.organizations.length} org${member.organizations.length === 1 ? "" : "s"}` : ""}
                  {member.lastActivityAt ? ` · Active ${new Date(member.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  {(() => {
                    const loc = buildLocationLabel({ city: member.city || parseLocationFields(member.location || "").city, state: member.state || parseLocationFields(member.location || "").state, country: member.country || parseLocationFields(member.location || "").country });
                    return loc ? ` · ${loc}` : "";
                  })()}
                </div>
                {/* Row 3: controls (own account has no controls) */}
                {member.id !== user.id && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      className="input-field"
                      value={(member.plan === "business" || member.plan === PLANS.PRO_PLUS) ? PLANS.PRO : (member.plan || PLANS.FREE)}
                      onChange={event => updateUserPlan(member, event.target.value)}
                      style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, width: "auto" }}
                    >
                      <option value={PLANS.FREE}>Free</option>
                      <option value={PLANS.PRO}>Pro</option>
                    </select>
                    <select
                      className="input-field"
                      value={member.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE}
                      onChange={event => updateSubscriptionStatus(member, event.target.value)}
                      style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, width: "auto" }}
                    >
                      <option value={SUBSCRIPTION_STATUS.ACTIVE}>Active</option>
                      <option value={SUBSCRIPTION_STATUS.INACTIVE}>Inactive</option>
                      <option value={SUBSCRIPTION_STATUS.TRIAL}>Trial</option>
                    </select>
                    <button className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12, color: member.blocked ? "var(--accent)" : "var(--danger)" }} onClick={() => toggleBlock(member.id, member.blocked)}>
                      {member.blocked ? "Unblock" : "Block"}
                    </button>
                    <button className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)44" }} onClick={() => deleteUserRecord(member)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {hasMoreUsers && (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <button className="btn-secondary" type="button" onClick={() => fetchAdminData({ append: true })} disabled={loadingMore} style={{ minWidth: 160, fontSize: 12 }}>
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
