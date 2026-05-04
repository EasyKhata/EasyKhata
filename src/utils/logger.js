import { auth } from "../firebase";

const isDev = import.meta.env.DEV;

// Cloud Function URL — set VITE_LOG_ENDPOINT in .env to the recordClientLog URL.
// Falls back to no-op if not configured so dev/CI builds are unaffected.
const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT || "";
const EVENT_ENDPOINT =
  import.meta.env.VITE_EVENT_ENDPOINT ||
  (LOG_ENDPOINT ? LOG_ENDPOINT.replace("recordclientlog", "recordclientevent") : "");

function getClientContext() {
  return {
    userId: auth.currentUser?.uid ?? null,
    userEmail: auth.currentUser?.email ?? null,
    route: typeof window !== "undefined" ? window.location.pathname : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    platform: typeof navigator !== "undefined" ? navigator.platform : null,
    appVersion: import.meta.env.VITE_APP_VERSION ?? null
  };
}

async function writeLog(level, label, error, ctx) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const stack   = error instanceof Error ? (error.stack || "").slice(0, 2000) : "";
  const payload = {
    level,
    label,
    message,
    stack,
    errorCode: error?.code ?? null,
    ...getClientContext(),
    ctx: ctx ? JSON.stringify(ctx).slice(0, 500) : null,
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

export function logEvent(event, ctx) {
  if (isDev || !EVENT_ENDPOINT) return;
  const payload = {
    event: String(event || "unknown").slice(0, 100),
    ...getClientContext(),
    ctx: ctx ? JSON.stringify(ctx).slice(0, 500) : null
  };

  fetch(EVENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {
    // Never let event logging affect the app.
  });
}
