import React, { useState, useEffect, useCallback } from "react";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_SUPPORT_EMAIL } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";
import { useAuth } from "../context/AuthContext";

// Concise landing screen. The previous version was a five-section marketing
// page (phone mockup, animated stats, pricing, etc.) — overbuilt for an app
// where the entire sign-up flow is one tap. This version is the minimum to:
//   • Communicate what the app does (one headline, one sub-line).
//   • Show who it's for (three persona pills).
//   • Surface 3 features so casual visitors get a sense of value.
//   • Get them signed in (CTA at top and bottom).
// Everything else lives inside the app itself.

const PERSONAS = [
  { id: "household", label: "Household",     icon: "🏠", desc: "Family income, expenses, EMIs & savings.", color: "var(--accent)" },
  { id: "business",  label: "Small Business", icon: "💼", desc: "Customers, invoices, payments, expenses.", color: "var(--blue)" },
  { id: "apartment", label: "Apartment",     icon: "🏢", desc: "Maintenance, flats, society expenses.",      color: "var(--purple)" }
];

const FEATURES = [
  { icon: "📊", title: "Track every rupee",    desc: "Income, expenses, EMIs and budgets — categorised automatically." },
  { icon: "🧾", title: "GST-ready invoices",   desc: "Create and share professional invoices in seconds." },
  { icon: "📈", title: "Real-time dashboard",  desc: "Monthly totals, trends, savings goals — at a glance." }
];

export default function LandingScreen({ onGetStarted }) {
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Subtle: shadow under the nav once the user scrolls a few pixels — small
  // signal that there's more below without committing to a long page.
  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignIn = useCallback(async () => {
    if (signingIn) return;
    setSignInError("");
    setSigningIn(true);
    try {
      // onGetStarted is kept as an optional analytics hook for the host app.
      onGetStarted?.();
      const res = await signInWithGoogle();
      if (res?.error) setSignInError(res.error);
    } finally {
      setSigningIn(false);
    }
  }, [onGetStarted, signInWithGoogle, signingIn]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, var(--bg)) 0%, var(--bg) 320px)",
        color: "var(--text)",
        paddingTop: "env(safe-area-inset-top, 0px)"
      }}
    >
      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: scrolled ? "color-mix(in srgb, var(--bg) 92%, transparent)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          transition: "background 0.2s ease, border-color 0.2s ease"
        }}
      >
        <BrandLogo compact showTagline={false} />
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="btn-primary"
          style={{ padding: "8px 16px", fontSize: 13, opacity: signingIn ? 0.7 : 1, cursor: signingIn ? "wait" : "pointer" }}
        >
          {signingIn ? "…" : "Sign in"}
        </button>
      </nav>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 40px" }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ textAlign: "center", marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(28px, 7vw, 38px)",
              lineHeight: 1.15,
              margin: "0 0 14px",
              letterSpacing: -0.6
            }}
          >
            Your khata,{" "}
            <span style={{ color: "var(--accent)" }}>finally simple.</span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-sec)",
              lineHeight: 1.55,
              margin: "0 auto 24px",
              maxWidth: 380
            }}
          >
            Track income, expenses, invoices and EMIs — for your family,
            business or society. One app, one minute to set up.
          </p>

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="btn-primary"
            style={{
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 700,
              boxShadow: "0 6px 24px color-mix(in srgb, var(--accent) 32%, transparent)",
              opacity: signingIn ? 0.7 : 1,
              cursor: signingIn ? "wait" : "pointer"
            }}
          >
            {signingIn ? "Signing in…" : "Continue with Google →"}
          </button>

          {signInError && (
            <div role="alert" style={{ fontSize: 13, color: "var(--danger)", marginTop: 14, lineHeight: 1.5 }}>
              {signInError}
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 14 }}>
            Household plan is free forever · No credit card
          </div>
        </section>

        {/* ── PERSONAS ─────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 36 }}>
          <div className="section-label" style={{ textAlign: "center", marginBottom: 14 }}>
            Built for
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {PERSONAS.map(p => (
              <div
                key={p.id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  marginBottom: 0,
                  borderColor: `color-mix(in srgb, ${p.color} 28%, var(--border))`
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: `color-mix(in srgb, ${p.color} 14%, var(--surface-high))`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                >
                  {p.icon}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, lineHeight: 1.4 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 36 }}>
          <div className="section-label" style={{ textAlign: "center", marginBottom: 14 }}>
            What you get
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {FEATURES.map(f => (
              <div
                key={f.title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--surface-high)",
                  border: "1px solid var(--border)"
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }} aria-hidden="true">{f.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.45 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST ────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: "🔒", title: "Encrypted", desc: "All data is encrypted in transit (TLS) and at rest via Firebase & Railway." },
              { icon: "🇮🇳", title: "Built in India", desc: "Data stored on Indian servers. Designed for Indian accounting formats." },
              { icon: "💳", title: "Secure payments", desc: "Subscriptions processed by Razorpay. We never store card details." },
              { icon: "✉️", title: "Real support", desc: <><a href={`mailto:${APP_SUPPORT_EMAIL}`} style={{ color: "var(--accent)" }}>{APP_SUPPORT_EMAIL}</a> — reply within 24 hours.</> }
            ].map(t => (
              <div
                key={t.title}
                style={{
                  padding: "12px 13px",
                  borderRadius: 12,
                  background: "var(--surface-high)",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 4 }} aria-hidden="true">{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-sec)", lineHeight: 1.45 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
        <section
          style={{
            textAlign: "center",
            padding: "26px 20px",
            borderRadius: 18,
            background: "color-mix(in srgb, var(--accent) 7%, var(--surface-high))",
            border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
            marginBottom: 28
          }}
        >
          <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Ready in 2 minutes
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 18, lineHeight: 1.5 }}>
            Sign in, pick what you're tracking, and start adding entries.
          </div>
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="btn-primary"
            style={{ padding: "12px 24px", fontSize: 14, fontWeight: 700, opacity: signingIn ? 0.7 : 1, cursor: signingIn ? "wait" : "pointer" }}
          >
            {signingIn ? "Signing in…" : "Continue with Google →"}
          </button>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", lineHeight: 1.7, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
            <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer" style={{ color: "var(--text-sec)", textDecoration: "none" }}>Terms</a>
            <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer" style={{ color: "var(--text-sec)", textDecoration: "none" }}>Privacy</a>
            {LEGAL_PATHS.refunds && (
              <a href={LEGAL_PATHS.refunds} target="_blank" rel="noreferrer" style={{ color: "var(--text-sec)", textDecoration: "none" }}>Refunds</a>
            )}
          </div>
          <div>© {new Date().getFullYear()} {APP_NAME}</div>
        </footer>
      </main>
    </div>
  );
}
