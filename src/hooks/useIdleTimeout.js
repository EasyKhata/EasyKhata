import { useCallback, useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"];
const POLL_INTERVAL_MS = 15_000; // wall-clock check cadence

/**
 * Idle auto-logout hook.
 *
 * Uses wall-clock comparison (Date.now() - lastActivity) instead of setTimeout so
 * that time spent with the app backgrounded counts toward the idle window. JS
 * timers freeze when the Android WebView is paused, so a pure setTimeout-based
 * timer would never fire while the user has the app in the background — we'd
 * either log them out at wall-clock T (correct) or at active-time T (too lenient).
 *
 * @param {object} options
 * @param {number}   options.idleMinutes      - Total idle minutes before forced logout (default 15)
 * @param {number}   options.warningMinutes   - Minutes before logout to show the warning (default 2)
 * @param {Function} options.onWarn           - Called when warning countdown starts; receives remaining seconds
 * @param {Function} options.onLogout         - Called when idle period expires
 * @param {boolean}  options.enabled          - Whether the hook is active (default true)
 */
export default function useIdleTimeout({
  idleMinutes = 15,
  warningMinutes = 2,
  onWarn,
  onLogout,
  enabled = true
} = {}) {
  const logoutMs = idleMinutes * 60 * 1000;
  const warnMs = (idleMinutes - warningMinutes) * 60 * 1000;

  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);
  const firedRef = useRef(false);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warnedRef.current = false;
    firedRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    function check() {
      if (firedRef.current) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= logoutMs) {
        firedRef.current = true;
        onLogout?.();
        return;
      }
      if (elapsed >= warnMs && !warnedRef.current) {
        warnedRef.current = true;
        const remainingSec = Math.max(1, Math.ceil((logoutMs - elapsed) / 1000));
        onWarn?.(remainingSec);
      }
    }

    // Re-check on resume too — Android may pause the interval while backgrounded,
    // and the user could have been gone past the threshold without us firing.
    function handleVisibility() {
      if (document.visibilityState === "visible") check();
    }

    const intervalId = window.setInterval(check, POLL_INTERVAL_MS);
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    let nativeListener;
    import("@capacitor/app").then(({ App: CapApp }) => {
      nativeListener = CapApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) check();
      });
    }).catch(() => {});

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (nativeListener) nativeListener.then(h => h.remove()).catch(() => {});
    };
  }, [enabled, logoutMs, warnMs, onLogout, onWarn, handleActivity]);

  return { resetTimer: handleActivity };
}
