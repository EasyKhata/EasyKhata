import { useEffect, useRef, useState } from "react";

// Pull-to-refresh hook for a scrollable element on touch devices.
//
// Why custom: Capacitor's WebView doesn't ship a native pull-to-refresh, and
// browser-level reload isn't appropriate (we want to refetch app data, not
// nuke React state). This hook tracks finger movement at scrollTop=0, applies
// a rubber-band pull, and fires onRefresh once the user releases past the
// threshold. Vertical-only — horizontal swipes (used by the row swipe-to-delete
// gesture) pass through untouched because we bail out the moment a gesture
// looks more horizontal than vertical.
//
// Usage:
//   const { containerRef, indicatorStyle, status } = usePullToRefresh({
//     onRefresh: async () => { await reloadData(); }
//   });
//   <div ref={containerRef} style={{ overflow: "auto" }}>
//     <PullIndicator status={status} {...indicatorStyle} />
//     {/* content */}
//   </div>
//
// `status` is "idle" | "pulling" | "armed" | "refreshing".

const THRESHOLD = 64;            // distance after which the action is armed
const MAX_PULL = 110;            // hard cap on visual stretch
const RUBBER_BAND = 0.5;         // damping factor — actual translate = delta * this

export default function usePullToRefresh({ onRefresh, enabled = true } = {}) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const trackingRef = useRef(false);
  const lockedAxisRef = useRef(null); // "y" | "x" | null
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState("idle");
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    function onTouchStart(event) {
      if (refreshingRef.current) return;
      // Only arm when scrolled to the top — otherwise pull-down is just normal
      // scrolling and we don't want to interfere.
      if (el.scrollTop > 0) return;
      const touch = event.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
      startXRef.current = touch.clientX;
      trackingRef.current = true;
      lockedAxisRef.current = null;
    }

    function onTouchMove(event) {
      if (!trackingRef.current || refreshingRef.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dy = touch.clientY - startYRef.current;
      const dx = touch.clientX - startXRef.current;

      // Lock the gesture to one axis after a small initial movement so that
      // horizontal swipes (row swipe-to-delete) and vertical scrolls don't
      // both grab the same gesture.
      if (lockedAxisRef.current == null) {
        if (Math.abs(dy) > 6 || Math.abs(dx) > 6) {
          lockedAxisRef.current = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
        } else {
          return;
        }
      }
      if (lockedAxisRef.current !== "y") return;

      // Only pull when moving downward and still at the top of the scroll.
      if (dy <= 0 || el.scrollTop > 0) {
        if (pullDistance !== 0) setPullDistance(0);
        if (status !== "idle") setStatus("idle");
        return;
      }

      // Rubber-band — visual translate is a damped fraction of the finger
      // distance, capped so the indicator never flies off-screen.
      const damped = Math.min(MAX_PULL, dy * RUBBER_BAND);
      setPullDistance(damped);
      setStatus(damped >= THRESHOLD ? "armed" : "pulling");

      // Once we know it's a pull, prevent the page from also scrolling.
      if (event.cancelable) event.preventDefault();
    }

    async function onTouchEnd() {
      if (!trackingRef.current) return;
      trackingRef.current = false;
      const armed = pullDistance >= THRESHOLD;
      lockedAxisRef.current = null;

      if (armed && typeof onRefresh === "function") {
        refreshingRef.current = true;
        setStatus("refreshing");
        setPullDistance(THRESHOLD);
        try { await onRefresh(); } catch { /* swallow — caller logs */ }
        refreshingRef.current = false;
      }
      setPullDistance(0);
      setStatus("idle");
    }

    // passive:false on touchmove because we may call preventDefault() to
    // suppress the page scroll while pulling.
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });
    el.addEventListener("touchcancel", onTouchEnd,  { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, onRefresh, pullDistance, status]);

  // Style for the indicator. Caller spreads onto a div positioned at the top
  // of the scroll container.
  const progress = Math.min(1, pullDistance / THRESHOLD);
  const indicatorStyle = {
    transform: `translate3d(0, ${pullDistance}px, 0)`,
    opacity: status === "idle" ? 0 : 1,
    transition: status === "refreshing" || trackingRef.current
      ? "none"
      : "transform 0.22s cubic-bezier(0.32,0.72,0.32,1), opacity 0.22s ease"
  };

  return { containerRef, indicatorStyle, status, progress };
}
