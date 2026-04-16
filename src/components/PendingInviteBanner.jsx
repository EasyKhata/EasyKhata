import React, { useEffect, useState } from "react";
import { collection, deleteField, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Shown at the top of MainApp when the logged-in user has pending org invitations.
 * One banner per pending invite; each can be accepted or declined independently.
 */
export default function PendingInviteBanner() {
  const { user, setUser } = useAuth();
  const [pendingInvites, setPendingInvites] = useState([]);
  const [processing, setProcessing] = useState({}); // inviteKey → true while saving

  // Load pending invites for this user's email once on mount
  useEffect(() => {
    if (!user?.email) return;

    async function loadPendingInvites() {
      try {
        const q = query(
          collection(db, "pendingInvites"),
          where("email", "==", user.email.toLowerCase()),
          where("status", "==", "invited")
        );
        const snap = await getDocs(q);
        const invites = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
        setPendingInvites(invites);
      } catch {
        // Silently ignore — don't break the app if this fails
      }
    }

    loadPendingInvites();
  }, [user?.email]);

  if (!pendingInvites.length) return null;

  async function handleAccept(invite) {
    setProcessing(prev => ({ ...prev, [invite._id]: true }));
    const now = new Date().toISOString();
    const { ownerId, orgId, orgName, ownerName, role, organizationType } = invite;
    const sanitizedEmail = (user.email || "").replace(/[^a-z0-9]/gi, "_");
    const memberKey = `${orgId}_${user.id}`;

    try {
      // 1. Write orgMembers entry — this is what Security Rules check for data access
      await setDoc(doc(db, "users", ownerId, "orgMembers", memberKey), {
        memberUid: user.id,
        role,
        status: "accepted",
        ownerId,
        orgId,
        orgName: orgName || "",
        organizationType: organizationType || "small_business",
        ownerName: ownerName || "",
        acceptedAt: now
      });

      // 2. Update pendingInvites status
      await updateDoc(doc(db, "pendingInvites", invite._id), {
        status: "accepted",
        memberUid: user.id,
        acceptedAt: now
      });

      // 3. Update owner's invitations list so the owner sees "Active"
      await updateDoc(
        doc(db, "users", ownerId, "orgs", orgId, "invitations", sanitizedEmail),
        { status: "accepted", memberUid: user.id, acceptedAt: now }
      ).catch(() => {}); // non-critical if invite doc key differs

      // 4. Write sharedOrgs into member's own user doc
      const sharedOrgEntry = {
        ownerId,
        orgId,
        orgName: orgName || "Organization",
        ownerName: ownerName || "",
        organizationType: organizationType || "small_business",
        role,
        acceptedAt: now
      };

      await updateDoc(doc(db, "users", user.id), {
        [`sharedOrgs.${ownerId}_${orgId}`]: sharedOrgEntry
      });

      // 5. Update local user state so the org switcher appears immediately
      setUser(prev => prev ? ({
        ...prev,
        sharedOrgs: {
          ...(prev.sharedOrgs || {}),
          [`${ownerId}_${orgId}`]: sharedOrgEntry
        }
      }) : prev);

      // Remove from banner
      setPendingInvites(prev => prev.filter(i => i._id !== invite._id));
    } catch {
      setProcessing(prev => ({ ...prev, [invite._id]: false }));
      alert("Could not accept invite. Please try again.");
    }
  }

  async function handleDecline(invite) {
    setProcessing(prev => ({ ...prev, [invite._id]: true }));
    try {
      await updateDoc(doc(db, "pendingInvites", invite._id), { status: "declined" });
      const sanitizedEmail = (user.email || "").replace(/[^a-z0-9]/gi, "_");
      await updateDoc(
        doc(db, "users", invite.ownerId, "orgs", invite.orgId, "invitations", sanitizedEmail),
        { status: "declined" }
      ).catch(() => {});
      setPendingInvites(prev => prev.filter(i => i._id !== invite._id));
    } catch {
      setProcessing(prev => ({ ...prev, [invite._id]: false }));
    }
  }

  return (
    <div style={{ position: "relative", zIndex: 10 }}>
      {pendingInvites.map(invite => (
        <div
          key={invite._id}
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
              <strong>{invite.ownerName || "Someone"}</strong> invited you to{" "}
              <strong>{invite.orgName || "their organization"}</strong> as{" "}
              <strong style={{ textTransform: "capitalize" }}>{invite.role}</strong>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => handleAccept(invite)}
              disabled={processing[invite._id]}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: processing[invite._id] ? "not-allowed" : "pointer",
                opacity: processing[invite._id] ? 0.6 : 1
              }}
            >
              {processing[invite._id] ? "…" : "Accept"}
            </button>
            <button
              onClick={() => handleDecline(invite)}
              disabled={processing[invite._id]}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-sec)",
                fontSize: 12,
                fontWeight: 700,
                cursor: processing[invite._id] ? "not-allowed" : "pointer",
                opacity: processing[invite._id] ? 0.6 : 1
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
