import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const isDev = import.meta.env.DEV;

async function writeLog(level, label, error, ctx) {
  try {
    await addDoc(collection(db, "app_logs"), {
      level,
      label,
      message: error instanceof Error ? error.message : String(error ?? ""),
      errorCode: error?.code ?? null,
      userId: auth.currentUser?.uid ?? null,
      ctx: ctx ? JSON.stringify(ctx).slice(0, 500) : null,
      platform: typeof navigator !== "undefined" ? navigator.platform : null,
      ts: serverTimestamp()
    });
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
  }
}
