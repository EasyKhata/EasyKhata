// Push-notification client wiring.
//
// What this does:
//   • Lazily loads @capacitor-firebase/messaging on native only (no web bundle hit).
//   • Asks for POST_NOTIFICATIONS at a moment the caller chooses, not at app launch.
//   • Registers the FCM token with our backend so server-side senders can target this device.
//   • Creates a default notification channel ("easykhata-default") so foreground
//     notifications get the right look on Android 8+.
//   • Re-registers on token rotation events.
//   • Routes taps on notifications via window.dispatchEvent('app:push-route') so
//     MainApp can deep-link to the right screen.
//
// What this DOESN'T do:
//   • Actually send notifications — that's server-side.
//   • Display foreground notifications natively (Android suppresses by default
//     when app is foregrounded). Instead we re-dispatch as an in-app toast.

import { isNative, isAndroid } from "./native";
import { logError, logEvent } from "./logger";

const DEFAULT_CHANNEL = {
  id: "easykhata-default",
  name: "EazyKhata reminders",
  description: "EMI dues, payment reminders, budget alerts, and account updates.",
  importance: 4,         // IMPORTANCE_HIGH — buzzes, shows in status bar
  visibility: 1,         // VISIBILITY_PUBLIC — show full content on lock screen
  lights: true,
  vibration: true
};

let pluginPromise = null;
function loadPlugin() {
  if (!isNative) return Promise.resolve(null);
  if (!pluginPromise) {
    pluginPromise = import("@capacitor-firebase/messaging")
      .then(m => m.FirebaseMessaging)
      .catch(err => {
        logError("push_plugin_load_failed", err);
        return null;
      });
  }
  return pluginPromise;
}

// One-shot listener setup. Wires foreground notifications → custom DOM event,
// and tap-notifications → another custom event so the host app can decide what
// to do (toast, navigate, mark read, etc.). Calling twice is a no-op.
let listenersInstalled = false;
async function installListeners() {
  if (listenersInstalled) return;
  const Messaging = await loadPlugin();
  if (!Messaging) return;
  listenersInstalled = true;

  // Foreground: notification arrived while the user has the app open. Android
  // doesn't show the system banner in this case, so we forward to the in-app
  // toast layer.
  Messaging.addListener("notificationReceived", (event) => {
    const notification = event?.notification || {};
    window.dispatchEvent(new CustomEvent("app:push-foreground", { detail: notification }));
  });

  // User tapped a notification (foreground or from the tray). The host wires
  // this to navigate to the right screen using notification.data.route.
  Messaging.addListener("notificationActionPerformed", (event) => {
    const notification = event?.notification || {};
    window.dispatchEvent(new CustomEvent("app:push-route", { detail: notification }));
    logEvent("push_tap", { messageId: notification.id || null });
  });

  // Token rotation — FCM rotates tokens periodically. Re-register the new one.
  Messaging.addListener("tokenReceived", async (event) => {
    const token = event?.token;
    if (!token) return;
    window.dispatchEvent(new CustomEvent("app:push-token", { detail: { token } }));
  });
}

// Request POST_NOTIFICATIONS at a meaningful moment (caller picks when).
// Returns one of: "granted" | "denied" | "prompt-allowed" | "skipped" (web).
export async function requestPushPermission() {
  if (!isNative) return "skipped";
  const Messaging = await loadPlugin();
  if (!Messaging) return "skipped";

  try {
    const current = await Messaging.checkPermissions();
    if (current?.receive === "granted") return "granted";
    if (current?.receive === "denied")  return "denied";

    const result = await Messaging.requestPermissions();
    if (result?.receive === "granted") return "granted";
    return "denied";
  } catch (err) {
    logError("push_permission_request_failed", err);
    return "denied";
  }
}

// Create the default notification channel on Android. Calling on a channel
// that exists is a no-op so it's safe to call on every app start.
async function ensureChannel() {
  if (!isAndroid) return;
  const Messaging = await loadPlugin();
  if (!Messaging?.createChannel) return;
  try {
    await Messaging.createChannel(DEFAULT_CHANNEL);
  } catch {
    // Channel-already-exists errors are non-fatal; suppress.
  }
}

// Get the FCM token if permission is already granted. Returns "" if not.
// Callers should NOT use this to prompt — use requestPushPermission first.
export async function getCurrentPushToken() {
  if (!isNative) return "";
  const Messaging = await loadPlugin();
  if (!Messaging) return "";
  try {
    const { token } = await Messaging.getToken();
    return token || "";
  } catch (err) {
    logError("push_token_fetch_failed", err);
    return "";
  }
}

// Initialise listeners + channel. Safe to call repeatedly.
export async function initPush() {
  if (!isNative) return;
  await ensureChannel();
  await installListeners();
}

// Subscribe to a topic for fan-out broadcasts (we'll use this in Phase 5 for
// "all users", "pro users" etc. — server-side broadcasts publish to a topic
// instead of iterating every token, which scales much better).
export async function subscribeToTopic(topic) {
  if (!isNative || !topic) return;
  const Messaging = await loadPlugin();
  if (!Messaging?.subscribeToTopic) return;
  try {
    await Messaging.subscribeToTopic({ topic });
  } catch (err) {
    logError("push_subscribe_failed", err, { topic });
  }
}

export async function unsubscribeFromTopic(topic) {
  if (!isNative || !topic) return;
  const Messaging = await loadPlugin();
  if (!Messaging?.unsubscribeFromTopic) return;
  try {
    await Messaging.unsubscribeFromTopic({ topic });
  } catch (err) {
    logError("push_unsubscribe_failed", err, { topic });
  }
}

// Drop the token from FCM's records. Called from logout so a future device
// recipient doesn't keep receiving notifications meant for the previous user.
export async function deleteCurrentPushToken() {
  if (!isNative) return;
  const Messaging = await loadPlugin();
  if (!Messaging?.deleteToken) return;
  try {
    await Messaging.deleteToken();
  } catch (err) {
    logError("push_token_delete_failed", err);
  }
}
