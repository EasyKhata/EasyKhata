import React, { useEffect, useState } from "react";
import { membersApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * Shown at the top of MainApp when the logged-in user has pending org invitations.
 * One banner per pending invite; each can be accepted or declined independently.
 */
export default function PendingInviteBanner() {
  const { user, setUser } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [processing, setProcessing] = useState({}); // inviteId → true while saving

  useEffect(() => {
    if (!user?.email) return;
    membersApi.getPending()
      .then(invites => setPendingInvites(Array.isArray(invites) ? invites : []))
      .catch(() => {}); // Silently ignore — don't break the app if this fails
  }, [user?.email]);

  if (!pendingInvites.length) return null;

  async function handleAccept(invite) {
    setProcessing(prev => ({ ...prev, [invite.id]: true }));
    try {
      const result = await membersApi.acceptInvite(invite.id);
      const { ownerId, orgId, role } = result;

      const sharedOrgEntry = {
        ownerId,
        orgId,
        orgName: invite.orgName || "Organization",
        ownerName: "",
        organizationType: invite.orgType || "small_business",
        role,
        acceptedAt: new Date().toISOString()
      };

      // Update local user state so the org switcher appears immediately
      setUser(prev => prev ? ({
        ...prev,
        sharedOrgs: {
          ...(prev.sharedOrgs || {}),
          [`${ownerId}_${orgId}`]: sharedOrgEntry
        }
      }) : prev);

      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch {
      setProcessing(prev => ({ ...prev, [invite.id]: false }));
      alert("Could not accept invite. Please try again.");
    }
  }

  async function handleDecline(invite) {
    setProcessing(prev => ({ ...prev, [invite.id]: true }));
    try {
      // The API doesn't have a dedicated decline endpoint yet;
      // simply remove from the banner locally (server keeps status as pending until owner removes)
      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));
    } catch {
      setProcessing(prev => ({ ...prev, [invite.id]: false }));
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      {pendingInvites.map(invite => (
        <div
          key={invite.id}
          style={{
            background: "var(--accent-deep)",
            borderBottom: "1px solid var(--accent)",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
              Org invite:{" "}
            </span>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              You've been invited to{" "}
              <strong>{invite.orgName || "an organization"}</strong> as{" "}
              <strong style={{ textTransform: "capitalize" }}>{invite.role}</strong>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => handleAccept(invite)}
              disabled={processing[invite.id]}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: processing[invite.id] ? "not-allowed" : "pointer",
                opacity: processing[invite.id] ? 0.6 : 1
              }}
            >
              {processing[invite.id] ? "…" : "Accept"}
            </button>
            <button
              onClick={() => handleDecline(invite)}
              disabled={processing[invite.id]}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-sec)",
                fontSize: 12,
                fontWeight: 700,
                cursor: processing[invite.id] ? "not-allowed" : "pointer",
                opacity: processing[invite.id] ? 0.6 : 1
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
