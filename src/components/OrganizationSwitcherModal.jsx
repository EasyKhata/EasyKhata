import React from "react";
import { Modal, LoadingButton } from "./UI";
import { useConfirm } from "../context/DialogContext";

export default function OrganizationSwitcherModal({
  open,
  onClose,
  organizations = [],
  activeOrgId,
  activeSharedOrgKey,
  onSwitch,
  onDelete
}) {
  const confirm = useConfirm();
  if (!open) return null;

  const canDelete = organizations.filter(org => org.isOwned !== false).length > 1;

  return (
    <Modal title="Manage Khatas" onClose={onClose}>
      <div className="ledger-feed-card">
        {organizations.map(org => {
          const isActiveOrg = org.isShared
            ? org.switchKey === activeSharedOrgKey
            : (!activeSharedOrgKey && org.id === activeOrgId);
          const canDeleteOrg = canDelete && org.isOwned !== false && !activeSharedOrgKey;
          const meta = isActiveOrg
            ? "Currently open"
            : org.isShared
              ? `${org.role === "admin" ? "Admin access" : "View access"}${org.ownerName ? ` from ${org.ownerName}` : ""}`
              : "Tap Switch to move into this Khata";

          return (
            <div key={org.isShared ? org.switchKey : org.id} className="ledger-feed-row" style={{ gap: 12 }}>
              <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {org.name}
                </div>
                <div className="ledger-feed-meta">{meta}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {isActiveOrg ? (
                  <span className="pill" style={{ background: "var(--accent-deep)", color: "var(--accent)" }}>Active</span>
                ) : (
                  <LoadingButton className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => onSwitch?.(org)} loadingLabel="Switching...">
                    Switch
                  </LoadingButton>
                )}

                <LoadingButton
                  className="btn-secondary"
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    opacity: canDeleteOrg ? 1 : 0.45,
                    cursor: canDeleteOrg ? "pointer" : "not-allowed",
                    color: canDeleteOrg ? "var(--danger)" : "var(--text-dim)"
                  }}
                  disabled={!canDeleteOrg}
                  onClick={async () => {
                    if (!canDeleteOrg) return;
                    if (await confirm(`Delete ${org.name}? This will permanently remove that Khata and all its data.`, { title: "Delete Khata", confirmLabel: "Delete" })) {
                      await onDelete?.(org.id);
                    }
                  }}
                  loadingLabel="Deleting..."
                >
                  Delete
                </LoadingButton>
              </div>
            </div>
          );
        })}
      </div>

      {!canDelete && (
        <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
          You need at least one owned Khata, so the last one cannot be deleted.
        </div>
      )}
    </Modal>
  );
}
