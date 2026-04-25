import React from "react";
import { Modal, LoadingButton } from "./UI";

export default function OrganizationSwitcherModal({
  open,
  onClose,
  organizations = [],
  activeOrgId,
  onSwitch,
  onDelete
}) {
  if (!open) return null;

  const canDelete = organizations.length > 1;

  return (
    <Modal title="Manage Khatas" onClose={onClose}>
      <div className="ledger-feed-card">
        {organizations.map(org => {
          const isActiveOrg = org.id === activeOrgId;
          return (
            <div key={org.id} className="ledger-feed-row" style={{ gap: 12 }}>
              <div className="ledger-feed-main" style={{ minWidth: 0 }}>
                <div className="ledger-feed-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {org.name}
                </div>
                <div className="ledger-feed-meta">{isActiveOrg ? "Currently open" : "Tap Switch to move into this Khata"}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {isActiveOrg ? (
                  <span className="pill" style={{ background: "var(--accent-deep)", color: "var(--accent)" }}>Active</span>
                ) : (
                  <LoadingButton className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => onSwitch?.(org.id)} loadingLabel="Switching…">
                    Switch
                  </LoadingButton>
                )}

                <LoadingButton
                  className="btn-secondary"
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    opacity: canDelete && org.organizationType !== "personal" ? 1 : 0.45,
                    cursor: canDelete && org.organizationType !== "personal" ? "pointer" : "not-allowed",
                    color: canDelete && org.organizationType !== "personal" ? "var(--danger)" : "var(--text-dim)"
                  }}
                  disabled={!canDelete || org.organizationType === "personal"}
                  onClick={async () => {
                    if (!canDelete || org.organizationType === "personal") return;
                    if (window.confirm(`Delete ${org.name}? This will remove that Khata and its data.`)) {
                      await onDelete?.(org.id);
                    }
                  }}
                  loadingLabel="Deleting…"
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
          You need at least one Khata, so the last one cannot be deleted.
        </div>
      )}
    </Modal>
  );
}
