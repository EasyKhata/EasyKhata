import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, onSave, saveLabel = "Save", canSave = true, accentColor, children }) {
  const btnBg = accentColor || "var(--accent)";
  const [isSaving, setIsSaving] = useState(false);
  const surfaceRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  // Auto-focus first focusable element once on open
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const firstFocusable = surface.querySelector(FOCUSABLE);
    firstFocusable?.focus();
  }, []);

  // Escape key + Tab cycling — keyboard handler only, never steals focus
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return undefined;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(surface.querySelectorAll(FOCUSABLE));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await Promise.resolve(onSave?.());
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isSaving, onSave]);

  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) onClose?.();
  }, [onClose]);

  const modalNode = (
    <motion.div
      className="modal-overlay"
      onClick={handleOverlayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        ref={surfaceRef}
        className="modal-surface modal-fm"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 30, stiffness: 320, mass: 0.8 }}
      >
        <div className="modal-header">
          <span style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text)" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", padding: "4px 8px",
              fontSize: 18, color: "var(--text-sec)", cursor: "pointer",
              lineHeight: 1, borderRadius: 8, fontFamily: "var(--font)",
              transition: "color var(--transition-fast)"
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {onSave && (
          <div style={{ padding: "12px 20px 20px", display: "flex", gap: 10, borderTop: "1px solid var(--border)" }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: "12px", fontSize: 14 }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || isSaving}
              style={{
                flex: 2,
                background: canSave && !isSaving ? btnBg : "var(--surface-high)",
                border: "none",
                borderRadius: 12,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                color: canSave && !isSaving ? "#0C0C10" : "var(--text-dim)",
                cursor: canSave && !isSaving ? "pointer" : "not-allowed",
                fontFamily: "var(--font)",
                transition: "all var(--transition-fast)"
              }}
            >
              {isSaving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span className="btn-spinner" />
                  Saving…
                </span>
              ) : saveLabel}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modalNode, document.body);
}
