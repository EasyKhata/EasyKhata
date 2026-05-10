import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandMark } from "./BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";

// One-shot launch animation that plays on cold start of the app. Renders as a
// full-screen overlay over whatever's mounting behind it, so the actual app
// (LandingScreen / MainApp) loads in parallel — the user feels a polished intro
// while real work happens off-screen.
//
// Sequence (~1100 ms total):
//   0–250 ms : brand mark scales up from 0.6 → 1.0 with a small bounce, fades in
//   250–550 ms: app name slides up and fades in
//   550–850 ms: tagline fades in
//   850–1100 ms: whole overlay fades out, revealing the app
//
// Skips itself entirely if the user has prefers-reduced-motion enabled — they
// get the static splash → app handoff without the JS bridge.
const SHOW_MS = 1100;

export default function LaunchIntro({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Honor reduced motion: skip the intro and finish immediately.
    if (typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      onDone?.();
      return;
    }
    const t = setTimeout(() => {
      setVisible(false);
    }, SHOW_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  // Hide the native Capacitor splash as soon as our JS intro is ready, so the
  // two don't overlap awkwardly. Lazy-imported so the web bundle stays clean.
  useEffect(() => {
    let cancelled = false;
    import("@capacitor/splash-screen")
      .then(mod => {
        if (cancelled) return;
        // Brief delay so the native splash has time to fade naturally before
        // the JS layer takes over — avoids a flash of the bare bg colour.
        setTimeout(() => mod.SplashScreen.hide?.({ fadeOutDuration: 220 }).catch(() => {}), 60);
      })
      .catch(() => { /* not native — no-op */ });
    return () => { cancelled = true; };
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="launch-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: "easeOut" } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "linear-gradient(160deg, #0C0C10 0%, color-mix(in srgb, var(--accent) 8%, #0C0C10) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 18,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            paddingTop: "env(safe-area-inset-top, 0px)",
            color: "#fff"
          }}
        >
          {/* Brand mark — bounces in. Spring overshoot gives the "weight" feel
              that flat fades don't. */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, mass: 0.9 }}
          >
            <BrandMark size={84} pulse />
          </motion.div>

          {/* App name — slides up after the mark settles. */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.32, ease: "easeOut" }}
            style={{
              fontFamily: "var(--serif)",
              fontSize: 32,
              letterSpacing: -0.5,
              fontWeight: 700,
              color: "#fff"
            }}
          >
            {APP_NAME}
          </motion.div>

          {/* Tagline — last to arrive, faintest on the screen. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.78 }}
            transition={{ delay: 0.55, duration: 0.32, ease: "easeOut" }}
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)"
            }}
          >
            {APP_TAGLINE}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
