import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  IndianRupee,
  Sparkles,
  Users
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_SUPPORT_EMAIL } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";
import { useAuth } from "../context/AuthContext";

const PORTALS = [
  {
    title: "Owner Access",
    label: "Manage the khata",
    desc: "Collections, expenses, reports, members, and settings stay with the owner/admin.",
    Icon: Building2
  },
  {
    title: "Shared Access",
    label: "View-only where needed",
    desc: "Residents, staff, or partners open only the khata shared with them.",
    Icon: Users
  }
];

const FEATURES = [
  { title: "Maintenance dues", desc: "Track flat-wise paid, pending, and overdue amounts.", Icon: IndianRupee },
  { title: "Society expenses", desc: "Record bills, salaries, repairs, and monthly reports.", Icon: BarChart3 },
  { title: "Resident visibility", desc: "Share view access without handing over controls.", Icon: FileText }
];

function ProductPreview() {
  return (
    <div className="landing-preview" aria-hidden="true">
      <div className="landing-phone">
        <div className="landing-phone-top">
          <span>June balance</span>
          <strong>Rs 1,84,250</strong>
        </div>
        <div className="landing-metric-row">
          <div>
            <span>Collected</span>
            <strong>Rs 92k</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>Rs 18k</strong>
          </div>
        </div>
        <div className="landing-card-stack">
          <div>
            <span>Flat B-204</span>
            <strong>Maintenance paid</strong>
          </div>
          <CheckCircle2 size={18} />
        </div>
        <div className="landing-card-stack">
          <div>
            <span>Invoice #1082</span>
            <strong>Due tomorrow</strong>
          </div>
          <IndianRupee size={18} />
        </div>
        <div className="landing-mini-chart">
          <span style={{ height: "42%" }} />
          <span style={{ height: "70%" }} />
          <span style={{ height: "54%" }} />
          <span style={{ height: "88%" }} />
          <span style={{ height: "64%" }} />
        </div>
      </div>
    </div>
  );
}

export default function LandingScreen({ onGetStarted }) {
  const { signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignIn = useCallback(async () => {
    if (signingIn) return;
    setSignInError("");
    setSigningIn(true);
    try {
      onGetStarted?.();
      const res = await signInWithGoogle();
      if (res?.error) setSignInError(res.error);
    } finally {
      setSigningIn(false);
    }
  }, [onGetStarted, signInWithGoogle, signingIn]);

  return (
    <div className="landing-page">
      <nav className={`landing-nav${scrolled ? " landing-nav-scrolled" : ""}`}>
        <BrandLogo compact showTagline={false} />
        <button onClick={handleSignIn} disabled={signingIn} className="btn-primary landing-nav-cta">
          {signingIn ? "Signing in" : "Sign in"}
        </button>
      </nav>

      <main className="landing-main">
        <section className="landing-hero">
          <ProductPreview />
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <Sparkles size={14} aria-hidden="true" />
              Apartment-first khata app
            </div>
            <h1>Run apartment maintenance without messy spreadsheets.</h1>
            <p>
              EasyKhata helps apartment owners and committees track maintenance collections, society expenses,
              resident access, and reports from the phone.
            </p>
            <div className="landing-hero-actions">
              <button onClick={handleSignIn} disabled={signingIn} className="btn-primary landing-primary-cta">
                {signingIn ? "Signing in" : "Build my apartment khata"}
                {!signingIn && <ArrowRight size={17} aria-hidden="true" />}
              </button>
              <span>30-day trial · Rs 99/month</span>
            </div>
            {signInError && (
              <div role="alert" className="landing-error">
                {signInError}
              </div>
            )}
          </div>
        </section>

        <section className="landing-compact-grid" aria-label="Apartment khata highlights">
          {FEATURES.map(({ title, desc, Icon }) => (
            <article key={title} className="premium-card landing-feature">
              <Icon size={21} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </section>

        <section className="landing-compact-grid landing-access-grid" aria-label="Access options">
          {PORTALS.map(({ title, label, desc, Icon }) => (
            <article key={title} className="premium-card landing-card">
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </section>

        <footer className="landing-footer">
          <div>
            <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer">Terms</a>
            <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer">Privacy</a>
            {LEGAL_PATHS.refunds && <a href={LEGAL_PATHS.refunds} target="_blank" rel="noreferrer">Refunds</a>}
            <a href={`mailto:${APP_SUPPORT_EMAIL}`}>Support</a>
          </div>
          <span>{new Date().getFullYear()} {APP_NAME}</span>
        </footer>
      </main>
    </div>
  );
}
