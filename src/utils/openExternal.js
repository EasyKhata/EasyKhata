// Open links from inside the Capacitor WebView without breaking it.
//
// Why this exists:
//   • window.location.href = "mailto:..." inside the WebView navigates the WebView
//     itself. On some Android versions this leaves a blank page with no way back.
//   • window.open(url, "_blank") on Android Capacitor 8 sometimes silently no-ops
//     because there's no popup window concept inside the WebView.
//
// Strategy:
//   • mailto: / tel: / sms: / whatsapp: / intent: / market: → fire as a native intent
//     via @capacitor/app's App.openUrl (the OS picks the right handler).
//   • http(s) → open in an in-app Custom Tab via @capacitor/browser so the user can
//     come back without losing app state.
//   • On web (non-native), fall back to window.open with safe link relations.
import { isNative } from "./native";

const NATIVE_INTENT_RE = /^(mailto:|tel:|sms:|whatsapp:|intent:|market:|geo:)/i;

export async function openExternal(url) {
  if (!url) return;
  const target = String(url).trim();
  if (!target) return;

  if (!isNative) {
    // Browser path — same behavior as before for non-app users.
    try { window.open(target, "_blank", "noopener,noreferrer"); } catch { /* ignore */ }
    return;
  }

  try {
    if (NATIVE_INTENT_RE.test(target)) {
      const { App: CapApp } = await import("@capacitor/app");
      await CapApp.openUrl({ url: target });
      return;
    }
    // http/https on native — use the in-app browser so the user keeps app state.
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: target, presentationStyle: "popover" });
  } catch (err) {
    // Last-ditch fallback so a missing plugin doesn't drop the user into a dead end.
    try { window.open(target, "_blank", "noopener,noreferrer"); } catch { /* ignore */ }
  }
}
