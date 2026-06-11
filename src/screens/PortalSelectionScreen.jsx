import React, { useState } from "react";
import { Building2, ChevronRight, Home, Loader, LogOut, Mail, Plus, RefreshCw } from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { membersApi } from "../lib/api";
import { getUserData } from "../utils/storage";
import { APP_NAME } from "../utils/brand";
import { getOrgConfig, getOrgType } from "../utils/orgTypes";
import { showGlobalToast } from "../context/ToastContext";

export default function PortalSelectionScreen({ onSelectPortal }) {
  const { user, pendingSetup, completeSetup, logout, refreshUserProfile } = useAuth();

  const isNewUser = Boolean(pendingSetup && !user);
  const userId = user?.id || pendingSetup?.firebaseUser?.uid;
  const displayEmail = user?.email || pendingSetup?.email || "";
  const displayName = user?.name || pendingSetup?.name || "";
  const firstName = displayName.split(" ")[0] || "";

  // Owned orgs from cached profile — available without DataContext
  const cachedProfile = userId ? (getUserData(userId, "profile") || {}) : {};
  const ownedOrgs = (Array.isArray(cachedProfile.organizations) ? cachedProfile.organizations : [])
    .filter(o => (o.name || "").trim());

  // Shared orgs from auth user state
  const sharedOrgMap = user?.sharedOrgs || {};
  const sharedOrgs = Object.entries(sharedOrgMap).map(([key, info]) => ({ key, ...info }));

  // Invitation finder state
  const [showInviteFinder, setShowInviteFinder] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState(null); // null = not fetched
  const [acceptingId, setAcceptingId] = useState(null);
  const [profileCreating, setProfileCreating] = useState(false);

  async function openInviteFinder() {
    // New user needs a DB profile before calling authenticated APIs
    if (isNewUser) {
      setProfileCreating(true);
      const res = await completeSetup({ residentPath: true });
      setProfileCreating(false);
      if (res?.error) {
        showGlobalToast(res.error || "Setup failed. Please try again.", "error");
        return;
      }
    }
    setShowInviteFinder(true);
    fetchInvites();
  }

  async function fetchInvites() {
    setInviteLoading(true);
    setInvites(null);
    try {
      const result = await membersApi.getPending();
      setInvites(Array.isArray(result) ? result : []);
    } catch {
      setInvites([]);
      showGlobalToast("Couldn't load invitations.", "error");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleAccept(invite) {
    setAcceptingId(invite.id);
    try {
      await membersApi.acceptInvite(invite.id);
      // Refresh auth user so sharedOrgs gets the new membership
      await refreshUserProfile?.();
      const ownerId = invite.ownerId || invite.ownerUid;
      const orgId = invite.orgId;
      onSelectPortal("resident", ownerId && orgId
        ? { sharedOrgKey: `${ownerId}_${orgId}`, ownerId, orgId }
        : null
      );
    } catch {
      showGlobalToast("Failed to accept invitation. Please try again.", "error");
      setAcceptingId(null);
    }
  }

  function handleAdminSelect(orgId) {
    onSelectPortal("admin", orgId ? { orgId } : null);
  }

  function handleResidentSelect(org) {
    onSelectPortal("resident", { sharedOrgKey: org.key, ownerId: org.ownerId, orgId: org.orgId });
  }

  // ── Shared style helpers ───────────────────────────────────────────────────
  const cardStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14
  };

  function iconBubble(color) {
    return {
      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
      background: `color-mix(in srgb, ${color} 12%, var(--surface-high))`,
      display: "flex", alignItems: "center", justifyContent: "center"
    };
  }

  const orgRowBase = {
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: 10,
    padding: "11px 12px", borderRadius: 12, marginTop: 8,
    cursor: "pointer", textAlign: "left", boxSizing: "border-box"
  };

  const ctaRow = (color) => ({
    ...orgRowBase,
    border: "1.5px dashed var(--border)", background: "transparent",
    color, fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", gap: 10,
    justifyContent: "flex-start"
  });

  function badge(color) {
    return {
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
      background: `color-mix(in srgb, ${color} 14%, var(--surface-high))`,
      color, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap"
    };
  }

  // ── Invitation finder view ─────────────────────────────────────────────────
  if (showInviteFinder) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setShowInviteFinder(false)}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            ← Back
          </button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Your Invitations</div>
        </div>

        <div style={{ flex: 1, padding: "20px", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {inviteLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 0", gap: 14 }}>
              <Loader size={24} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
              <div style={{ fontSize: 14, color: "var(--text-sec)" }}>Checking for invitations…</div>
            </div>
          ) : invites && invites.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 4, lineHeight: 1.6 }}>
                {invites.length === 1 ? "1 pending invitation" : `${invites.length} pending invitations`}. Tap to accept.
              </div>
              {invites.map(invite => (
                <div key={invite.id} style={{ ...cardStyle, marginBottom: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>
                    {invite.orgName || invite.khataName || "Shared Khata"}
                  </div>
                  {(invite.ownerName || invite.inviterName) && (
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 14 }}>
                      Invited by {invite.ownerName || invite.inviterName}
                    </div>
                  )}
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={Boolean(acceptingId)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 12, border: "none",
                      background: acceptingId === invite.id ? "var(--surface-high)" : "var(--accent)",
                      color: acceptingId === invite.id ? "var(--text-sec)" : "#fff",
                      fontSize: 14, fontWeight: 700,
                      cursor: acceptingId ? "not-allowed" : "pointer",
                      opacity: acceptingId && acceptingId !== invite.id ? 0.5 : 1,
                      transition: "opacity 0.15s"
                    }}
                  >
                    {acceptingId === invite.id ? "Accepting…" : "Accept & Join →"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 16px" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Mail size={24} color="var(--text-dim)" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>No invitations found</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, maxWidth: 280, marginBottom: 16 }}>
                Ask your society admin to invite you using this email address.
              </div>
              {displayEmail && (
                <div style={{ padding: "10px 16px", background: "var(--surface-high)", borderRadius: 10, fontSize: 13, color: "var(--text-dim)", fontWeight: 600, letterSpacing: 0.2 }}>
                  {displayEmail}
                </div>
              )}
              <button
                onClick={fetchInvites}
                style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, background: "none", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                <RefreshCw size={14} />
                Check again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main portal selection ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandLogo compact showTagline={false} />
        <button
          onClick={logout}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px solid var(--border)", color: "var(--text-sec)", borderRadius: 10, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "28px 20px calc(env(safe-area-inset-bottom, 0px) + 32px)", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* Greeting */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
            {isNewUser ? "Getting started" : "Welcome back"}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", lineHeight: 1.2, marginBottom: 6 }}>
            {firstName ? `Hi, ${firstName}` : APP_NAME}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6 }}>
            Choose how you'd like to continue.
          </div>
        </div>

        {/* Admin Portal */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
            <div style={iconBubble("var(--accent)")}>
              <Building2 size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Admin Portal</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, lineHeight: 1.5 }}>
                Manage income, expenses, invoices &amp; your team
              </div>
            </div>
          </div>

          {ownedOrgs.length > 0 ? (
            ownedOrgs.map(org => {
              const cfg = getOrgConfig(getOrgType(org.organizationType));
              return (
                <button
                  key={org.id}
                  onClick={() => handleAdminSelect(org.id)}
                  style={{ ...orgRowBase, border: "1px solid var(--border)", background: "var(--surface-high)" }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                    {org.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={badge("var(--accent)")}>{cfg.label || "Khata"}</span>
                    <ChevronRight size={15} color="var(--text-dim)" />
                  </div>
                </button>
              );
            })
          ) : (
            <button onClick={() => handleAdminSelect(null)} style={ctaRow("var(--accent)")}>
              <Plus size={15} />
              {isNewUser ? "Create your first Khata" : "Create a new Khata"}
            </button>
          )}
        </div>

        {/* Resident Portal */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
            <div style={iconBubble("var(--blue)")}>
              <Home size={20} color="var(--blue)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Resident Portal</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, lineHeight: 1.5 }}>
                View your dues, track payments &amp; chat with your committee
              </div>
            </div>
          </div>

          {sharedOrgs.length > 0 ? (
            sharedOrgs.map(org => (
              <button
                key={org.key}
                onClick={() => handleResidentSelect(org)}
                style={{ ...orgRowBase, border: "1px solid var(--border)", background: "var(--surface-high)" }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                  {org.name || "Shared Khata"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={badge(org.role === "admin" ? "var(--accent)" : "var(--blue)")}>
                    {org.role === "admin" ? "Co-admin" : "Resident"}
                  </span>
                  <ChevronRight size={15} color="var(--text-dim)" />
                </div>
              </button>
            ))
          ) : (
            <button
              onClick={openInviteFinder}
              disabled={profileCreating}
              style={ctaRow(profileCreating ? "var(--text-dim)" : "var(--blue)")}
            >
              {profileCreating
                ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} />
                : <Mail size={15} />
              }
              {profileCreating ? "Setting up…" : "Find my invitation"}
            </button>
          )}
        </div>

        {/* Hint for brand-new users */}
        {isNewUser && (
          <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.7, marginTop: 4 }}>
            New owners get a 30-day Pro trial automatically.
          </div>
        )}
      </div>
    </div>
  );
}
