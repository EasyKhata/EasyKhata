import { auth } from "../firebase";

const isDev = import.meta.env.DEV;

// Cloud Function URL — set VITE_LOG_ENDPOINT in .env to the recordClientLog URL.
// Falls back to no-op if not configured so dev/CI builds are unaffected.
const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT || "";

async function writeLog(level, label, error, ctx) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const stack   = error instanceof Error ? (error.stack || "").slice(0, 2000) : "";
  const payload = {
    level,
    label,
    message,
    stack,
    errorCode: error?.code ?? null,
    userId: auth.currentUser?.uid ?? null,
    ctx: ctx ? JSON.stringify(ctx).slice(0, 500) : null,
    route: typeof window !== "undefined" ? window.location.pathname : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    platform: typeof navigator !== "undefined" ? navigator.platform : null,
    appVersion: import.meta.env.VITE_APP_VERSION ?? null
  };

  // Primary: Cloud Function — works even when unauthenticated (auth errors, cold start)
  if (LOG_ENDPOINT) {
    try {
      await fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      });
      return;
    } catch {
      // fall through to Firestore fallback
    }
  }

  // Fallback: direct Firestore write (requires auth + permissive rules)
  try {
    const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("../firebase");
    await addDoc(collection(db, "app_logs"), { ...payload, ts: serverTimestamp() });
  } catch {
    // Never let logging break the app
  }
}

export function logError(label, error, ctx) {
  if (isDev) {
    ctx !== undefined ? console.error(`[${label}]`, error, ctx) : console.error(`[${label}]`, error);
    return;
  }
  writeLog("error", label, error, ctx);
}

export function logWarn(label, ctx) {
  if (isDev) {
    ctx !== undefined ? console.warn(`[${label}]`, ctx) : console.warn(`[${label}]`);
    return;
  }
  writeLog("warn", label, null, ctx);
}
