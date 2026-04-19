import React, { useState, useEffect } from "react";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";

const FEATURES = [
  {
    icon: "📊",
    title: "Income & Expense Tracking",
    desc: "Log every rupee — salary, rent, groceries, EMIs. Know exactly where your money goes."
  },
  {
    icon: "🧾",
    title: "Professional Invoices",
    desc: "Create GST-ready invoices in seconds. Send to clients and get paid faster."
  },
  {
    icon: "📈",
    title: "Smart Dashboard",
    desc: "Real-time charts, monthly trends, and savings goals — your finances at a glance."
  },
  {
    icon: "💬",
    title: "Udhaar & Credit Records",
    desc: "Track money lent and borrowed from family or friends. Never forget who owes what."
  },
  {
    icon: "🏢",
    title: "Multi-Org Support",
    desc: "Run your household and business from one account. Switch between Khatas effortlessly."
  },
  {
    icon: "🔔",
    title: "Smart Reminders",
    desc: "Get notified for overdue invoices, EMI due dates, and budget limits before it's too late."
  }
];

const USE_CASES = [
  {
    emoji: "🏠",
    label: "Household",
    color: "#7ee8a2",
    title: "Family & Personal Finance",
    points: [
      "Track family income & household expenses",
      "Manage EMIs and loan schedules",
      "Set monthly savings goals",
      "Monitor spending by category"
    ],
    badge: "Free Forever"
  },
  {
    emoji: "💼",
    label: "Freelancer",
    color: "#77b6ff",
    title: "Freelancers & Consultants",
    points: [
      "Create and send client invoices",
      "Track project payments & pending dues",
      "Log billable & non-billable expenses",
      "Know your monthly net earnings"
    ],
    badge: "Rs 69/month"
  },
  {
    emoji: "🏪",
    label: "Small Business",
    color: "#f6c94e",
    title: "Small Businesses",
    points: [
      "Sales, expenses & GST invoices",
      "Manage team payouts and vendors",
      "Customer ledger & payment history",
      "Profit & loss at a glance"
    ],
    badge: "Rs 69/month"
  },
  {
    emoji: "🏗️",
    label: "Apartment",
    color: "#c59aff",
    title: "Apartment Societies",
    points: [
      "Collect and track maintenance fees",
      "Manage flat records & residents",
      "Society expense transparency",
      "Generate receipts for residents"
    ],
    badge: "Rs 69/month"
  }
];

const STATS = [
  { value: "₹0", label: "to start — Free for Households" },
  { value: "2 min", label: "to create your first Khata" },
  { value: "100%", label: "data ownership, always yours" },
  { value: "GST", label: "ready invoices built in" }
];

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      transition: "border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function UseCaseCard({ emoji, label, color, title, points, badge }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      padding: "28px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}88, ${color}22)`
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>{emoji}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{title}</div>
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color,
          background: `${color}18`, border: `1px solid ${color}44`,
          borderRadius: 20, padding: "4px 10px", whiteSpace: "nowrap"
        }}>{badge}</div>
      </div>
      <ul style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
        {points.map((p, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5 }}>
            <span style={{ color, marginTop: 2, flexShrink: 0, fontSize: 11 }}>✓</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingScreen({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("landing-scroll");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      id="landing-scroll"
      style={{
        minHeight: "100dvh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--bg)",
        position: "relative"
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: -200, left: -200, width: 600, height: 600,
        background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "fixed", top: -100, right: -150, width: 500, height: 500,
        background: "radial-gradient(circle, color-mix(in srgb, var(--purple) 10%, transparent), transparent 70%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Sticky nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px",
        background: scrolled ? "color-mix(in srgb, var(--bg) 88%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.25s"
      }}>
        <BrandLogo compact showTagline={false} />
        <button
          onClick={onGetStarted}
          style={{
            background: "var(--accent)", color: "#0C0C10",
            border: "none", borderRadius: 10,
            padding: "9px 20px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", letterSpacing: 0.2
          }}
        >
          Sign In
        </button>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* HERO */}
        <section style={{
          maxWidth: 680, margin: "0 auto",
          padding: "72px 24px 64px",
          textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 24
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            borderRadius: 20, padding: "6px 14px",
            fontSize: 12, fontWeight: 700, color: "var(--accent-text)", letterSpacing: 0.5
          }}>
            <span>✦</span> India's simplest khata app
          </div>

          <h1 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(36px, 8vw, 58px)",
            lineHeight: 1.1,
            color: "var(--text)",
            letterSpacing: -1
          }}>
            {APP_NAME} —<br />
            <span style={{
              background: "linear-gradient(135deg, var(--accent), var(--blue))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>
              Apka Khata, Apka Control
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 2.5vw, 17px)",
            color: "var(--text-sec)", lineHeight: 1.7,
            maxWidth: 520
          }}>
            Track income, expenses, invoices, and loans — for your family, freelance work, small business, or apartment society. All in one beautiful app.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={onGetStarted}
              style={{
                background: "var(--accent)", color: "#0C0C10",
                border: "none", borderRadius: 14,
                padding: "15px 32px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", letterSpacing: 0.3,
                boxShadow: "0 4px 24px color-mix(in srgb, var(--accent) 35%, transparent)",
                transition: "transform 0.15s, box-shadow 0.15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px color-mix(in srgb, var(--accent) 45%, transparent)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px color-mix(in srgb, var(--accent) 35%, transparent)"; }}
            >
              Get Started Free →
            </button>
            <a
              href="#features"
              style={{
                background: "var(--surface-high)", color: "var(--text)",
                border: "1px solid var(--border)", borderRadius: 14,
                padding: "15px 28px", fontSize: 15, fontWeight: 600,
                cursor: "pointer", textDecoration: "none",
                transition: "border-color 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-mid)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              See Features
            </a>
          </div>

          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
            No credit card · Household plan is free forever
          </div>
        </section>

        {/* STATS STRIP */}
        <section style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "28px 24px"
        }}>
          <div style={{
            maxWidth: 800, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 24, textAlign: "center"
          }}>
            {STATS.map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--accent)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO IS IT FOR */}
        <section style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Made For Everyone</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(26px, 5vw, 38px)", color: "var(--text)", lineHeight: 1.2 }}>
              One App, Every Kind of Khata
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-sec)", marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
              Whether you're tracking family expenses or running a business, EasyKhata adapts to you.
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20
          }}>
            {USE_CASES.map((uc, i) => <UseCaseCard key={i} {...uc} />)}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Everything You Need</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(26px, 5vw, 38px)", color: "var(--text)", lineHeight: 1.2 }}>
              Powerful Features, Simple Interface
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16
          }}>
            {FEATURES.map((f, i) => <FeatureCard key={i} {...f} />)}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ maxWidth: 720, margin: "72px auto 0", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Get Started in Minutes</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(26px, 5vw, 38px)", color: "var(--text)", lineHeight: 1.2 }}>
              Up and running in 3 steps
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { n: "1", title: "Sign in with Google", desc: "No passwords, no hassle. One tap and you're in." },
              { n: "2", title: "Pick your Khata type", desc: "Choose from Household, Freelancer, Small Business, or Apartment Society." },
              { n: "3", title: "Start tracking", desc: "Add your first income or expense. Your dashboard updates instantly." }
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 20, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), var(--blue))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "#0C0C10", flexShrink: 0
                  }}>{step.n}</div>
                  {i < 2 && <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 40, margin: "4px 0" }} />}
                </div>
                <div style={{ paddingBottom: 36, paddingTop: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING TEASER */}
        <section style={{ maxWidth: 720, margin: "72px auto 0", padding: "0 24px" }}>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 24, padding: "40px 32px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Simple Pricing</div>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(22px, 4vw, 32px)", color: "var(--text)", lineHeight: 1.3, marginBottom: 12 }}>
              Start Free. Upgrade When You Need More.
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 32, maxWidth: 460, margin: "0 auto 32px" }}>
              Household accounts are permanently free. Freelancers, businesses, and apartment societies get a 14-day free trial, then Rs 69/month.
            </p>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32
            }}>
              {[
                { label: "Household", price: "Free", sub: "Forever, no card needed", color: "var(--accent)" },
                { label: "Pro (All others)", price: "Rs 69", sub: "per month · 14-day free trial", color: "var(--gold)" }
              ].map((p, i) => (
                <div key={i} style={{
                  background: "var(--surface-high)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: "20px 16px"
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{p.label}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 30, color: "var(--text)", lineHeight: 1 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 6 }}>{p.sub}</div>
                </div>
              ))}
            </div>
            <button
              onClick={onGetStarted}
              style={{
                background: "var(--accent)", color: "#0C0C10",
                border: "none", borderRadius: 14,
                padding: "14px 36px", fontSize: 15, fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent)"
              }}
            >
              Start Free with Google →
            </button>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{
          maxWidth: 680, margin: "72px auto 0", padding: "0 24px",
          textAlign: "center"
        }}>
          <div style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, var(--surface)), color-mix(in srgb, var(--blue) 8%, var(--surface)))",
            border: "1px solid var(--border)",
            borderRadius: 28, padding: "56px 32px",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: -60, right: -60, width: 200, height: 200,
              background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%)",
              pointerEvents: "none"
            }} />
            <h2 style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(26px, 5vw, 40px)",
              color: "var(--text)", lineHeight: 1.2, marginBottom: 16
            }}>
              Your finances,<br />finally under control.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
              Join thousands of households, freelancers, and businesses who trust {APP_NAME} to keep their khata clean.
            </p>
            <button
              onClick={onGetStarted}
              style={{
                background: "var(--accent)", color: "#0C0C10",
                border: "none", borderRadius: 14,
                padding: "16px 40px", fontSize: 16, fontWeight: 700,
                cursor: "pointer", letterSpacing: 0.3,
                boxShadow: "0 6px 28px color-mix(in srgb, var(--accent) 40%, transparent)",
                transition: "transform 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Get Started Free →
            </button>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 14 }}>
              Sign in with Google · Takes 2 minutes
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          maxWidth: 960, margin: "56px auto 0",
          padding: "24px 24px 40px",
          borderTop: "1px solid var(--border)",
          display: "flex", flexWrap: "wrap", alignItems: "center",
          justifyContent: "space-between", gap: 16
        }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Terms", href: LEGAL_PATHS.terms },
              { label: "Privacy", href: LEGAL_PATHS.privacy }
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                style={{ fontSize: 13, color: "var(--text-dim)", textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-sec)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
              >
                {l.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
