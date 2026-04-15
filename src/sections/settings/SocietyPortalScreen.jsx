import React from "react";
import { Modal, Field, Input, Select, Textarea, MonthSelectInput } from "../../components/UI";

/**
 * Society portal screens (admin view + member access view).
 *
 * Props:
 *   screen                     "society-portal" | "society-member-access"
 *   user                       auth user object
 *   customers                  flat list (for select options)
 *   societyPortalLoading       boolean
 *   societyPortalInvites       array of invite objects
 *   memberInviteForm           { email, flatNumber }
 *   onMemberInviteFormChange   (updater) => void
 *   societyPortalForm          { month, notice }
 *   onSocietyPortalFormChange  (updater) => void
 *   societyJoinForm            { inviteCode }
 *   onSocietyJoinFormChange    (updater) => void
 *   hasMemberPortalAccess      boolean
 *   onCreateMemberInvite       () => void
 *   onDeactivateMemberInvite   (id) => void
 *   onPublish                  () => void
 *   onJoin                     () => void
 *   onLeave                    () => void
 *   normalizeInviteCode        (code) => string
 *   onClose                    () => void
 */
export default function SocietyPortalScreen({
  screen,
  user,
  customers,
  societyPortalLoading,
  societyPortalInvites,
  memberInviteForm,
  onMemberInviteFormChange,
  societyPortalForm,
  onSocietyPortalFormChange,
  societyJoinForm,
  onSocietyJoinFormChange,
  hasMemberPortalAccess,
  onCreateMemberInvite,
  onDeactivateMemberInvite,
  onPublish,
  onJoin,
  onLeave,
  normalizeInviteCode,
  onClose
}) {
  if (screen === "society-portal") {
    return (
      <Modal
        title="Resident Read-Only Access"
        onClose={onClose}
        onSave={onPublish}
        saveLabel="Publish Records"
        canSave={!societyPortalLoading}
        accentColor="var(--blue)"
      >
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
            Share common monthly records with residents without exposing full society data. Flat mapping is controlled by owner-approved invite codes.
          </div>
        </div>

        <Field label="Create Member Invite" required hint="Map a resident email to a flat. Resident can only join this mapped flat.">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 160px) auto", gap: 8 }}>
            <Input
              value={memberInviteForm.email}
              onChange={event => onMemberInviteFormChange(current => ({ ...current, email: event.target.value }))}
              placeholder="resident@email.com"
            />
            <Select
              value={memberInviteForm.flatNumber}
              onChange={event => onMemberInviteFormChange(current => ({ ...current, flatNumber: event.target.value }))}
            >
              <option value="">Select flat</option>
              {(customers || []).map(flat => (
                <option key={flat.id} value={String(flat.name || "").trim().toUpperCase()}>{flat.name}</option>
              ))}
            </Select>
            <button type="button" className="btn-secondary" onClick={onCreateMemberInvite}>Create Invite</button>
          </div>
        </Field>

        <div className="card" style={{ marginBottom: 14 }}>
          {societyPortalInvites.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>No member invites yet.</div>
          ) : (
            societyPortalInvites.slice(0, 8).map(invite => (
              <div key={invite.id} className="card-row" style={{ alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{invite.id}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {invite.allowedEmail || "--"} · Flat {invite.flatNumber || "--"} · {invite.isActive ? "Active" : `Claimed by ${invite.claimedBy || "resident"}`}
                  </div>
                </div>
                {invite.isActive && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: "7px 10px", fontSize: 12 }}
                    onClick={() => onDeactivateMemberInvite(invite.id)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <Field label="Month to Publish" required hint="Publishes common summary and flat-wise dues for this month.">
          <MonthSelectInput
            value={societyPortalForm.month}
            max={new Date().toISOString().slice(0, 7)}
            onChange={value => onSocietyPortalFormChange(current => ({ ...current, month: value }))}
          />
        </Field>

        <Field label="Notice (optional)" hint="Example: Please clear dues by 10th of this month.">
          <Textarea
            value={societyPortalForm.notice}
            onChange={event => onSocietyPortalFormChange(current => ({ ...current, notice: event.target.value }))}
            placeholder="Maintenance payment last date..."
          />
        </Field>
      </Modal>
    );
  }

  if (screen === "society-member-access") {
    return (
      <Modal
        title="Resident Access"
        onClose={onClose}
        onSave={hasMemberPortalAccess ? onLeave : onJoin}
        saveLabel={hasMemberPortalAccess ? "Leave Access" : "Join Access"}
        canSave
        accentColor="var(--blue)"
      >
        {hasMemberPortalAccess ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Access Active</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
              You are connected to resident read-only records for Flat {user?.societyFlatNumber || "-"}. Use the Resident View tab to track your common records and dues.
            </div>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
                Enter the invite code shared by your apartment admin to enable read-only tracking.
              </div>
            </div>
            <Field label="Invite Code" required>
              <Input
                value={societyJoinForm.inviteCode}
                onChange={event => onSocietyJoinFormChange(current => ({ ...current, inviteCode: normalizeInviteCode(event.target.value) }))}
                placeholder="AB12CD34"
              />
            </Field>
          </>
        )}
      </Modal>
    );
  }

  return null;
}
