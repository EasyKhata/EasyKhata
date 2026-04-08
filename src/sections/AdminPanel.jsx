import React, { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Avatar, EmptyState, SectionSkeleton } from "../components/UI";
import { PLAN_LABELS, PLANS } from "../utils/subscription";

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  if (user?.role !== "admin") {
    return <div style={{ padding: 20 }}>Access denied.</div>;
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const list = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      setUsers(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(member => {
      const haystack = `${member.name || ""} ${member.email || ""} ${member.phone || ""}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "blocked" && member.blocked) ||
        (filter === "active" && !member.blocked) ||
        (filter === "shared" && member.sharedLedgerId);
      return matchesSearch && matchesFilter;
    });
  }, [filter, search, users]);

  const stats = {
    total: users.length,
    blocked: users.filter(member => member.blocked).length,
    shared: users.filter(member => member.sharedLedgerId).length,
    admins: users.filter(member => member.role === "admin").length
  };

  async function toggleBlock(id, blocked) {
    if (id === user.id) {
      alert("You cannot block your own account.");
      return;
    }

    await updateDoc(doc(db, "users", id), {
      blocked: !blocked
    });

    fetchUsers();
  }

  async function deleteUserRecord(member) {
    if (member.id === user.id) {
      alert("You cannot delete your own admin account.");
      return;
    }

    const confirmed = window.confirm(
      "This will remove the user's Firestore profile and queue an Authentication cleanup request. Continue?"
    );
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
    fetchUsers();
    alert("User profile removed from Firestore and auth cleanup has been queued.");
  }

  async function updateUserPlan(member, plan) {
    await updateDoc(doc(db, "users", member.id), {
      plan,
      subscriptionStatus: "active"
    });
    fetchUsers();
  }

  async function updateSubscriptionStatus(member, subscriptionStatus) {
    await updateDoc(doc(db, "users", member.id), { subscriptionStatus });
    fetchUsers();
  }

  if (loading) {
    return <SectionSkeleton rows={5} showHero={false} />;
  }

  return (
    <div style={{ padding: "20px 18px 100px" }}>
      <div className="section-label">Admin Overview</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {[
          ["Users", stats.total, "var(--blue)"],
          ["Blocked", stats.blocked, "var(--danger)"],
          ["Shared", stats.shared, "var(--gold)"],
          ["Admins", stats.admins, "var(--accent)"]
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: "16px 14px", borderColor: `${color}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 26, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>

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
            ["active", "Active"],
            ["blocked", "Blocked"],
            ["shared", "Shared"]
          ].map(([value, label]) => (
            <button
              key={value}
              className="btn-secondary"
              style={{
                padding: "8px 12px",
                fontSize: 12,
                background: filter === value ? "var(--surface-pop)" : "var(--surface-high)",
                color: filter === value ? "var(--text)" : "var(--text-sec)"
              }}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="section-label">User Management</div>
      <div className="card">
        {filteredUsers.length === 0 ? (
          <EmptyState title="No matching users" message="Try changing the search or filter to find the account you want." accentColor="var(--blue)" />
        ) : (
          filteredUsers.map(member => (
            <div key={member.id} className="card-row" style={{ alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <Avatar name={member.name || member.email || "?"} size={42} fontSize={14} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{member.name || "Unnamed User"}</span>
                    {member.role === "admin" && <span className="pill" style={{ background: "var(--purple-deep)", color: "var(--purple)" }}>Admin</span>}
                    {member.role !== "admin" && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>{PLAN_LABELS[member.plan || PLANS.FREE] || "Free"}</span>}
                    {member.blocked && <span className="pill" style={{ background: "var(--danger-deep)", color: "var(--danger)" }}>Blocked</span>}
                    {member.sharedLedgerId && <span className="pill" style={{ background: "var(--gold-deep)", color: "var(--gold)" }}>Shared Ledger</span>}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 4 }}>{member.email || "No email"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                    {member.phone || "No phone"} · {(member.subscriptionStatus || "active")} plan{member.sharedLedgerId ? ` · Ledger ${member.sharedLedgerId}` : ""}
                  </div>
                </div>
              </div>
              {member.id !== user.id && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <select
                    className="input-field"
                    value={member.plan || PLANS.FREE}
                    onChange={event => updateUserPlan(member, event.target.value)}
                    style={{ width: 100, padding: "8px 10px", fontSize: 12, borderRadius: 10 }}
                  >
                    <option value={PLANS.FREE}>Free</option>
                    <option value={PLANS.PRO}>Pro</option>
                    <option value={PLANS.BUSINESS}>Business</option>
                  </select>
                  <select
                    className="input-field"
                    value={member.subscriptionStatus || "active"}
                    onChange={event => updateSubscriptionStatus(member, event.target.value)}
                    style={{ width: 110, padding: "8px 10px", fontSize: 12, borderRadius: 10 }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="trial">Trial</option>
                  </select>
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
              )}
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: 18, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Authentication cleanup note</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6 }}>
          This panel can remove Firestore profile data and queue a cleanup request, but deleting a user from Firebase Authentication still requires an admin backend such as Cloud Functions or the Firebase Admin SDK.
        </div>
      </div>
    </div>
  );
}
