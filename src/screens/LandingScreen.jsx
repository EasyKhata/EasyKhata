import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  HeadphonesIcon,
  IndianRupee,
  LockKeyhole,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_SUPPORT_EMAIL } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";
import { useAuth } from "../context/AuthContext";

const SEGMENTS = [
  { id: "business", label: "Small Business", desc: "Customers, invoices, payments, daily expenses.", Icon: ReceiptText },
  { id: "apartment", label: "Apartment", desc: "Flats, maintenance dues, resident reports.", Icon: Building2 }
];

const PORTALS = [
  {
    title: "Owner / Admin",
    label: "Full khata control",
    desc: "Manage collections, expenses, invoices, members, reports, settings, and access.",
    Icon: ShieldCheck
  },
  {
    title: "Viewer / Resident",
    label: "Shared access only",
    desc: "Residents, partners, or staff see only the records you choose to share with them.",
    Icon: Users
  }
];

const FLOW_STEPS = [
  "Sign in and create one Business or Apartment khata.",
  "Invite admins, staff, partners, viewers, or residents.",
  "Everyone opens the right view automatically based on access."
];

const FEATURES = [
  { title: "Daily money clarity", desc: "Income, expenses, dues, invoices, and trends in one place.", Icon: BarChart3 },
  { title: "Professional records", desc: "Invoices, receipts, resident statements, and reports that are easy to share.", Icon: FileText },
  { title: "Simple Pro pricing", desc: "30-day trial, then Rs 99/month or Rs 999/year for one owned khata.", Icon: CreditCard }
];

const TRUST = [
  { title: "Secure by design", desc: "Encrypted access and protected cloud storage.", Icon: LockKeyhole },
  { title: "Made for India", desc: "Built around Indian businesses, apartments, and rupee workflows.", Icon: MapPin },
  { title: "Human support", desc: APP_SUPPORT_EMAIL, Icon: HeadphonesIcon }
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
              Built for Indian khatas
            </div>
            <h1>Run your business or apartment khata with confidence.</h1>
            <p>
              EasyKhata helps owners track money, invoices, dues, and shared records from the phone. Invite residents,
              staff, or partners without giving away admin control.
            </p>
            <div className="landing-hero-actions">
              <button onClick={handleSignIn} disabled={signingIn} className="btn-primary landing-primary-cta">
                {signingIn ? "Signing in" : "Continue with Google"}
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

        <section className="landing-section">
          <div className="landing-section-head">
            <span>Access that feels simple</span>
            <h2>Owner controls stay separate from viewer access.</h2>
          </div>
          <div className="landing-grid landing-grid-two">
            {PORTALS.map(({ title, label, desc, Icon }) => (
              <article key={title} className="premium-card landing-card">
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-grid landing-grid-two">
          <div className="premium-card landing-flow">
            <span className="landing-card-label">How it works</span>
            {FLOW_STEPS.map((step, index) => (
              <div key={step} className="landing-flow-row">
                <b>{index + 1}</b>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="premium-card landing-flow">
            <span className="landing-card-label">Made for</span>
            {SEGMENTS.map(({ id, label, desc, Icon }) => (
              <div key={id} className="landing-segment-row">
                <Icon size={20} aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-head">
            <span>Premium, practical tools</span>
            <h2>Everything needed for day-to-day khata work.</h2>
          </div>
          <div className="landing-grid landing-grid-three">
            {FEATURES.map(({ title, desc, Icon }) => (
              <article key={title} className="premium-card landing-feature">
                <Icon size={21} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-trust">
          {TRUST.map(({ title, desc, Icon }) => (
            <div key={title}>
              <Icon size={18} aria-hidden="true" />
              <strong>{title}</strong>
              {title === "Human support" ? (
                <a href={`mailto:${APP_SUPPORT_EMAIL}`}>{desc}</a>
              ) : (
                <span>{desc}</span>
              )}
            </div>
          ))}
        </section>

        <section className="premium-card landing-final-cta">
          <div>
            <span className="landing-card-label">Start with one khata</span>
            <h2>Create your owner khata, then invite the right people.</h2>
          </div>
          <button onClick={handleSignIn} disabled={signingIn} className="btn-primary landing-primary-cta">
            {signingIn ? "Signing in" : "Start setup"}
            {!signingIn && <CheckCircle2 size={17} aria-hidden="true" />}
          </button>
        </section>

        <footer className="landing-footer">
          <div>
            <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer">Terms</a>
            <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer">Privacy</a>
            {LEGAL_PATHS.refunds && <a href={LEGAL_PATHS.refunds} target="_blank" rel="noreferrer">Refunds</a>}
          </div>
          <span>{new Date().getFullYear()} {APP_NAME}</span>
        </footer>
      </main>
    </div>
  );
}
