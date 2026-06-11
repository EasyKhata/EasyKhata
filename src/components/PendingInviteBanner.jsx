import React, { useEffect, useState } from "react";
import { membersApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

/**
 * Shown at the top of MainApp when the logged-in user has pending org invitations.
 * One banner per pending invite; each can be accepted or declined independently.
 */
export default function PendingInviteBanner() {
  const { user, setUser } = useAuth();
  const data = useData();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [processing, setProcessing] = useState({});
  const [inviteError, setInviteError] = useState({});

  function fetchInvites() {
    if (!user?.email) return;
    membersApi.getPending()
      .then(invites => setPendingInvites(Array.isArray(invites) ? invites : []))
      .catch(() => {});
  }

  // Initial fetch on mount / user change.
  useEffect(() => { fetchInvites(); }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when the user manually triggers a check from the header dropdown,
  // or when the app returns to the foreground (covers invitations sent while
  // the user was in a background tab or another app).
  useEffect(() => {
    function onCheckInvites() { fetchInvites(); }
    function onVisibility() { if (document.visibilityState === "visible") fetchInvites(); }
    window.addEventListener("ledger:check-invites", onCheckInvites);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("ledger:check-invites", onCheckInvites);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

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
        organizationType: invite.orgType || "freelancer",
        role,
        acceptedAt: new Date().toISOString()
      };

      const refreshed = await data.refreshSharedMemberships?.();
      if (!refreshed) {
        // Fallback: update local user state so the org switcher appears immediately.
        setUser(prev => prev ? ({
          ...prev,
          sharedOrgs: {
            ...(prev.sharedOrgs || {}),
            [`${ownerId}_${orgId}`]: sharedOrgEntry
          }
        }) : prev);
      }

      setPendingInvites(prev => prev.filter(i => i.id !== invite.id));

      // Land the member straight in the Member Portal for the khata they just
      // joined instead of leaving them on their own (often empty) admin khata.
      data.switchToSharedOrg?.(`${ownerId}_${orgId}`)?.catch?.(() => {});
    } catch {
      setProcessing(prev => ({ ...prev, [invite.id]: false }));
      setInviteError(prev => ({ ...prev, [invite.id]: "Could not accept invite. Please try again." }));
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
              Resident Portal invite{" "}
            </span>
            <span style={{ fontSize: 13, color: "var(--text)" }}>
              — <strong>{invite.orgName || "a society"}</strong> added you as{" "}
              <strong style={{ textTransform: "capitalize" }}>{invite.role === "viewer" ? "Resident" : invite.role}</strong>
            </span>
            {inviteError[invite.id] && (
              <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>{inviteError[invite.id]}</div>
            )}
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
