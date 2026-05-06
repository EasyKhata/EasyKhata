import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ToastNotice } from "../components/ui/feedback";

const ToastContext = createContext(null);
const TOAST_DEDUPE_MS = 10_000;
let lastGlobalToast = { key: "", at: 0 };

// Non-React code (DataContext, API layers) can fire toasts via:
// window.dispatchEvent(new CustomEvent("app:toast", { detail: { title, message, tone } }))
export function showGlobalToast(detail) {
  const key = `${detail?.tone || ""}|${detail?.title || ""}|${detail?.message || ""}`;
  const now = Date.now();
  if (key && lastGlobalToast.key === key && now - lastGlobalToast.at < TOAST_DEDUPE_MS) return;
  lastGlobalToast = { key, at: now };
  window.dispatchEvent(new CustomEvent("app:toast", { detail }));
}

export function ToastProvider({ children }) {
  const [notice, setNotice] = useState(null);

  const showToast = useCallback(({ title, message, tone = "danger" }) => {
    setNotice({ title, message, tone });
  }, []);

  const clearToast = useCallback(() => {
    setNotice(null);
  }, []);

  useEffect(() => {
    function handleWindowToast(e) {
      if (e.detail) showToast(e.detail);
    }
    window.addEventListener("app:toast", handleWindowToast);
    return () => window.removeEventListener("app:toast", handleWindowToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotice notice={notice} onClose={clearToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
