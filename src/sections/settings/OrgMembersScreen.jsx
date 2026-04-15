import React, { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { Input, Field } from "../../components/UI";

const ROLES = [
  { value: "admin",  label: "Admin",  desc: "Can add, edit, and delete records" },
  { value: "viewer", label: "Viewer", desc: "Can view records and download reports only" }
];

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getMembersDocRef(ownerId, orgId) {
  return doc(db, "users", ownerId, "orgs", orgId, "settings", "members");
}

function getInvitationsCollectionRef(ownerId, orgId) {
  return collection(db, "users", ownerId, "orgs", orgId, "invitations");
}

function getPendingInviteRef(ownerId, orgId, sanitizedEmail) {
  return doc(db, "pendingInvites", `${ownerId}_${orgId}_${sanitizedEmail}`);
}

function getOrgMemberRef(ownerId, orgId, memberUid) {
  return doc(db, "users", ownerId, "orgMembers", `${orgId}_${memberUid}`);
}

export default function OrgMembersScreen({ onBack }) {
  const { user } = useAuth();
  const data = useData();
  const orgId = data.activeOrgId || "org_primary";
  const orgName = data.account?.name || "Your Organization";

  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Load members from Firestore in real-time
  useEffect(() => {
    if (!user?.id || !orgId) return;
    const ref = getInvitationsCollectionRef(user.id, orgId);
    const unsub = onSnapshot(ref, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.invitedAt || "").localeCompare(String(a.invitedAt || "")));
      setMembers(list);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user?.id, orgId]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleInvite = useCallback(async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (email === (user?.email || "").toLowerCase()) {
      setError("You cannot invite yourself.");
      return;
    }
    if (members.some(m => (m.email || "").toLowerCase() === email)) {
      setError("This email already has access.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const sanitized = email.replace(/[^a-z0-9]/gi, "_");
      const invitedAt = new Date().toISOString();
      const payload = {
        email,
        role: inviteRole,
        status: "invited",
        orgId,
        orgName,
        ownerId: user.id,
        ownerName: user.name || user.email || "",
        invitedAt
      };
      // Write to owner's invitations list (for member management UI)
      await setDoc(doc(getInvitationsCollectionRef(user.id, orgId), sanitized), payload);
      // Write to root pendingInvites so the invitee can discover it on login
      await setDoc(getPendingInviteRef(user.id, orgId, sanitized), payload);
      setInviteEmail("");
      setSuccessMsg(`Invite sent to ${email}`);
    } catch {
      setError("Failed to send invite. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [inviteEmail, inviteRole, members, orgId, orgName, user?.email, user?.id, user?.name]);

  const handleRoleChange = useCallback(async (member, newRole) => {
    if (!user?.id) return;
    try {
      await setDoc(
        doc(getInvitationsCollectionRef(user.id, orgId), member.id),
        { ...member, role: newRole },
        { merge: true }
      );
    } catch {
      setError("Failed to update role.");
    }
  }, [orgId, user?.id]);

  const handleRemove = useCallback(async member => {
    if (!window.confirm(`Remove ${member.email} from this organization?`)) return;
    if (!user?.id) return;
    try {
      const sanitized = (member.email || "").replace(/[^a-z0-9]/gi, "_");
      // Remove from owner's invitations list
      await deleteDoc(doc(getInvitationsCollectionRef(user.id, orgId), member.id));
      // Remove from pendingInvites (stops showing banner if not yet accepted)
      await deleteDoc(getPendingInviteRef(user.id, orgId, sanitized)).catch(() => {});
      // Remove from orgMembers — this immediately revokes Firestore access
      if (member.memberUid) {
        await deleteDoc(getOrgMemberRef(user.id, orgId, member.memberUid)).catch(() => {});
      }
    } catch {
      setError("Failed to remove member.");
    }
  }, [orgId, user?.id]);

  const statusColor = status => status === "accepted" ? "var(--accent)" : status === "declined" ? "var(--danger)" : "var(--gold)";
  const statusLabel = status => status === "accepted" ? "Active" : status === "declined" ? "Declined" : "Invited";

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 0", marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
        >
          ‹
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Team Members</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Share access to {orgName}</div>
        </div>
      </div>

      <div style={{ padding: "0 18px" }}>

        {/* Invite form */}
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>
            Invite a Member
          </div>
          <Field label="Email address" hint="They will receive access once they sign into EasyKhata with this email.">
            <Input
              type="email"
              placeholder="committee@society.com"
              value={inviteEmail}
              onChange={e => { setInviteEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
            />
          </Field>
          <Field label="Role" hint={ROLES.find(r => r.value === inviteRole)?.desc}>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setInviteRole(r.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: `2px solid ${inviteRole === r.value ? "var(--accent)" : "var(--border)"}`,
                    background: inviteRole === r.value ? "var(--accent-deep)" : "var(--surface)",
                    color: inviteRole === r.value ? "var(--accent)" : "var(--text)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>
          {error && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10, fontWeight: 600 }}>{error}</div>
          )}
          {successMsg && (
            <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 10, fontWeight: 600 }}>✓ {successMsg}</div>
          )}
          <button
            className="btn-secondary"
            onClick={handleInvite}
            disabled={saving || !inviteEmail.trim()}
            style={{ color: "var(--accent)", fontWeight: 700, width: "100%" }}
          >
            {saving ? "Sending…" : "Send Invite"}
          </button>
        </div>

        {/* Members list */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          Current Members
        </div>

        <div className="card" style={{ marginBottom: 18 }}>
          {/* Owner (yourself) */}
          <div className="card-row" style={{ alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {user?.name || user?.email || "You"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{user?.email}</div>
            </div>
            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 8, background: "var(--accent-deep)", color: "var(--accent)", fontWeight: 700 }}>
              Owner
            </span>
          </div>

          {loading && (
            <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-dim)" }}>Loading members…</div>
          )}

          {!loading && members.length === 0 && (
            <div style={{ padding: "16px 20px", fontSize: 13, color: "var(--text-dim)" }}>
              No members invited yet. Use the form above to invite committee members.
            </div>
          )}

          {members.map(member => (
            <div key={member.id} className="card-row" style={{ alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", wordBreak: "break-all" }}>{member.email}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                  Invited {member.invitedAt ? new Date(member.invitedAt).toLocaleDateString("en-IN") : ""}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleRoleChange(member, r.value)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: `1px solid ${member.role === r.value ? "var(--accent)" : "var(--border)"}`,
                        background: member.role === r.value ? "var(--accent-deep)" : "transparent",
                        color: member.role === r.value ? "var(--accent)" : "var(--text-dim)",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 8, background: `color-mix(in srgb, ${statusColor(member.status)} 15%, transparent)`, color: statusColor(member.status), fontWeight: 700 }}>
                  {statusLabel(member.status)}
                </span>
                <button
                  onClick={() => handleRemove(member)}
                  style={{ background: "none", border: "none", color: "var(--danger)", fontSize: 11, cursor: "pointer", fontWeight: 700, padding: 0 }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-sec)" }}>How it works:</strong> Invited members sign in to EasyKhata with their own account. Once they accept, they can access this organization's data based on their role. Admins can add and edit records; Viewers can only view and export.
          </div>
        </div>
      </div>
    </div>
  );
}
