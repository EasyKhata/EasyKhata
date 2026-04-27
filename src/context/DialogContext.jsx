import React, { createContext, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  function confirm(message, options = {}) {
    const { title = "Confirm", confirmLabel = "Confirm", cancelLabel = "Cancel", danger = true } = options;
    return new Promise(resolve => {
      resolveRef.current = resolve;
      setDialog({ message, title, confirmLabel, cancelLabel, danger });
    });
  }

  function handleConfirm() {
    setDialog(null);
    resolveRef.current?.(true);
  }

  function handleCancel() {
    setDialog(null);
    resolveRef.current?.(false);
  }

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.52)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "0 16px calc(env(safe-area-inset-bottom, 0px) + 20px)",
              zIndex: 9999
            }}
            onClick={handleCancel}
          >
            <motion.div
              initial={{ y: 64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 64, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                background: "var(--bg)",
                borderRadius: 20,
                padding: "24px 20px",
                width: "min(100%, 400px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.28)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
                {dialog.title}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 24 }}>
                {dialog.message}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn-secondary"
                  onClick={handleCancel}
                  style={{ flex: 1, padding: "13px 16px", fontSize: 14, fontWeight: 600 }}
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    flex: 1,
                    padding: "13px 16px",
                    fontSize: 14,
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 12,
                    background: dialog.danger ? "var(--danger)" : "var(--accent)",
                    color: "#fff",
                    cursor: "pointer"
                  }}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useConfirm must be used within DialogProvider");
  return ctx.confirm;
}
