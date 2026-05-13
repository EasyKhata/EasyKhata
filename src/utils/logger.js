import { auth } from "../firebase";
import { isNative } from "./native";

function captureWithSentry(error, label) {
  try {
    // Lazy import so Sentry is only pulled in when an error actually occurs
    import("@sentry/react").then(({ captureException, withScope }) => {
      withScope(scope => {
        scope.setTag("label", label);
        scope.setUser({ id: auth.currentUser?.uid ?? undefined });
        captureException(error instanceof Error ? error : new Error(String(error ?? label)));
      });
    }).catch(() => {});
  } catch { /* never let Sentry break the app */ }
}

const isDev = import.meta.env.DEV;

// Lazy-loaded Crashlytics handle. We import dynamically so the web build doesn't
// pull the native plugin into the chunk graph.
let crashlyticsPromise = null;
function getCrashlytics() {
  if (!isNative) return Promise.resolve(null);
  if (!crashlyticsPromise) {
    crashlyticsPromise = import("@capacitor-firebase/crashlytics")
      .then(m => m.FirebaseCrashlytics)
      .catch(() => null);
  }
  return crashlyticsPromise;
}

async function reportToCrashlytics(level, label, error, ctx) {
  if (isDev || !isNative) return;
  const Crashlytics = await getCrashlytics();
  if (!Crashlytics) return;
  try {
    const message = error instanceof Error ? error.message : String(error ?? label);
    const stack   = error instanceof Error ? error.stack : "";
    const summary = `[${level}] ${label}: ${message}`;
    // recordException accepts a stacktrace; log() adds context for the next crash.
    if (ctx) {
      try { await Crashlytics.log({ message: `${label}: ${JSON.stringify(ctx).slice(0, 500)}` }); } catch { /* ignore */ }
    }
    await Crashlytics.recordException({
      message: summary,
      stacktrace: stack ? [{ fileName: "", lineNumber: 0, methodName: stack.slice(0, 1000) }] : undefined
    });
  } catch {
    // Crashlytics must never break the app.
  }
}

// Set the Crashlytics user identifier so a crash report can be tied to the
// account that hit it. Call this from AuthContext after sign-in.
export async function setCrashUser(userId) {
  if (isDev || !isNative) return;
  const Crashlytics = await getCrashlytics();
  if (!Crashlytics) return;
  try {
    if (userId) await Crashlytics.setUserId({ userId });
  } catch { /* ignore */ }
}

// Cloud Function URL — set VITE_LOG_ENDPOINT in .env to the recordClientLog URL.
// Falls back to no-op if not configured so dev/CI builds are unaffected.
const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT || "";
const EVENT_ENDPOINT =
  import.meta.env.VITE_EVENT_ENDPOINT ||
  (LOG_ENDPOINT ? LOG_ENDPOINT.replace("recordclientlog", "recordclientevent") : "");
const LOG_DEDUPE_MS = 60_000;
const recentLogs = new Map();

function getClientContext() {
  return {
    userId: auth.currentUser?.uid ?? null,
    userEmail: auth.currentUser?.email ?? null,
    route: typeof window !== "undefined" ? window.location.pathname : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    platform: typeof navigator !== "undefined" ? navigator.platform : null,
    online: typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : null,
    appVersion: import.meta.env.VITE_APP_VERSION ?? null
  };
}

function shouldSuppressLog(level, label, error, ctx) {
  const code = error?.code || ctx?.code || "";
  const status = error?.status ?? ctx?.status ?? "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const path = ctx?.path || error?.path || "";
  const method = ctx?.method || error?.method || "";
  const isNetworkNoise =
    status === 0 ||
    code === "NETWORK_ERROR" ||
    /failed to fetch|network|load failed|abort|timeout/i.test(message);

  if (!isNetworkNoise) return false;

  const key = [level, label, code, status, method, path].join("|");
  const now = Date.now();
  const last = recentLogs.get(key) || 0;
  if (now - last < LOG_DEDUPE_MS) return true;
  recentLogs.set(key, now);
  return false;
}

async function writeLog(level, label, error, ctx) {
  if (shouldSuppressLog(level, label, error, ctx)) return;

  const message = error instanceof Error ? error.message : String(error ?? "");
  const stack   = error instanceof Error ? (error.stack || "").slice(0, 2000) : "";
  const payload = {
    level,
    label,
    message,
    stack,
    errorCode: error?.code ?? null,
    errorMeta: error && typeof error === "object" ? JSON.stringify({
      status: error.status ?? null,
      method: error.method ?? null,
      path: error.path ?? null,
      durationMs: error.durationMs ?? null,
      attempt: error.attempt ?? null,
      attempts: error.attempts ?? null,
      online: error.online ?? null,
      timeoutMs: error.timeoutMs ?? null
    }).slice(0, 500) : null,
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
  reportToCrashlytics("error", label, error, ctx);
  if (import.meta.env.VITE_SENTRY_DSN) captureWithSentry(error, label);
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
