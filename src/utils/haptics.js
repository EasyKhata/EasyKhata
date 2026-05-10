// Tiny haptic feedback wrapper. Lazy-loads @capacitor/haptics so the web bundle
// doesn't pull the native plugin code. Silent no-op on web and on platforms
// where the plugin call rejects (e.g. devices with vibration disabled).
//
// All four helpers are fire-and-forget: callers don't await them. Errors are
// swallowed because haptics is a "nice to have" — we never want a failed
// vibration to block UI feedback.

import { isNative } from "./native";

let pluginPromise = null;
function loadPlugin() {
  if (!isNative) return Promise.resolve(null);
  if (!pluginPromise) {
    pluginPromise = import("@capacitor/haptics")
      .then(mod => ({ Haptics: mod.Haptics, ImpactStyle: mod.ImpactStyle, NotificationType: mod.NotificationType }))
      .catch(() => null);
  }
  return pluginPromise;
}

// Light tap — for selections, toggles, tab changes.
export async function hapticLight() {
  const m = await loadPlugin();
  if (!m?.Haptics) return;
  try { await m.Haptics.impact({ style: m.ImpactStyle.Light }); } catch { /* ignore */ }
}

// Medium tap — for confirmations (save, submit).
export async function hapticMedium() {
  const m = await loadPlugin();
  if (!m?.Haptics) return;
  try { await m.Haptics.impact({ style: m.ImpactStyle.Medium }); } catch { /* ignore */ }
}

// Success notification pattern — for "saved successfully", "payment recorded".
export async function hapticSuccess() {
  const m = await loadPlugin();
  if (!m?.Haptics) return;
  try { await m.Haptics.notification({ type: m.NotificationType.Success }); } catch { /* ignore */ }
}

// Error notification pattern — for validation failures, blocked actions.
export async function hapticError() {
  const m = await loadPlugin();
  if (!m?.Haptics) return;
  try { await m.Haptics.notification({ type: m.NotificationType.Error }); } catch { /* ignore */ }
}
