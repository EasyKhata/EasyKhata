import { useCallback, useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

/**
 * Idle auto-logout hook.
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

  const logoutTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    if (!enabled) return;

    warnTimerRef.current = setTimeout(() => {
      onWarn?.(warningMinutes * 60);
    }, warnMs);

    logoutTimerRef.current = setTimeout(() => {
      onLogout?.();
    }, logoutMs);
  }, [clearTimers, enabled, logoutMs, warnMs, onWarn, onLogout, warningMinutes]);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return undefined;
    }

    scheduleTimers();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [enabled, scheduleTimers, handleActivity, clearTimers]);

  return { resetTimer: handleActivity };
}
