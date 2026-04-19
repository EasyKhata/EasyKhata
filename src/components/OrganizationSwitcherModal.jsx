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
    <Modal title="Switch Khata" onClose={onClose} onSave={onClose} saveLabel="Close" canSave>
      <div className="card">
        {organizations.map(org => {
          const isActiveOrg = org.id === activeOrgId;
          return (
            <div key={org.id} className="card-row" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {org.name}
                </div>
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
                    opacity: canDelete ? 1 : 0.45,
                    cursor: canDelete ? "pointer" : "not-allowed",
                    color: canDelete ? "var(--danger)" : "var(--text-dim)"
                  }}
                  disabled={!canDelete}
                  onClick={async () => {
                    if (!canDelete) return;
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