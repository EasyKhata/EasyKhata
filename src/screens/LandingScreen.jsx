import React, { useState, useEffect, useRef } from "react";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";

// ── DATA ─────────────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id: "household", label: "Household", color: "var(--accent)",
    orgName: "Sharma Family", badge: "Free Forever",
    income: 85000, expense: 42300, net: 42700,
    chart: [55, 42, 68, 52, 78, 65, 85, 72, 90, 82, 85, 70],
    transactions: [
      { label: "Salary – Rahul", amt: 65000, type: "in", cat: "Income" },
      { label: "Grocery – DMart", amt: 4200, type: "out", cat: "Food" },
      { label: "Rent Payment", amt: 18000, type: "out", cat: "Housing" },
      { label: "Freelance Side Work", amt: 20000, type: "in", cat: "Income" },
      { label: "Electricity Bill", amt: 1800, type: "out", cat: "Utilities" },
    ],
    points: [
      "Track family income & household expenses",
      "Manage EMIs and loan schedules",
      "Set monthly savings goals",
      "Monitor spending by category",
    ],
  },
  {
    id: "freelancer", label: "Freelancer", color: "var(--blue)",
    orgName: "Priya Design Co.", badge: "Rs 69/month",
    income: 124000, expense: 18600, net: 105400,
    chart: [40, 80, 55, 95, 60, 110, 75, 120, 85, 105, 124, 98],
    transactions: [
      { label: "Invoice – TechCorp #042", amt: 45000, type: "in", cat: "Invoice" },
      { label: "Adobe Creative Suite", amt: 5000, type: "out", cat: "Software" },
      { label: "Invoice – StartupXYZ", amt: 32000, type: "in", cat: "Invoice" },
      { label: "Co-working Space", amt: 8000, type: "out", cat: "Office" },
      { label: "Invoice – Retail Brand", amt: 47000, type: "in", cat: "Invoice" },
    ],
    points: [
      "Create and send client invoices",
      "Track project payments & pending dues",
      "Log billable & non-billable expenses",
      "Know your monthly net earnings",
    ],
  },
  {
    id: "business", label: "Small Biz", color: "var(--gold)",
    orgName: "Karim Stores", badge: "Coming Soon", comingSoon: true,
    income: 342000, expense: 189000, net: 153000,
    chart: [220, 280, 310, 260, 340, 295, 380, 342, 360, 310, 342, 320],
    transactions: [
      { label: "Walk-in Sales", amt: 24000, type: "in", cat: "Sales" },
      { label: "Inventory Restock", amt: 45000, type: "out", cat: "Stock" },
      { label: "Online Orders", amt: 18500, type: "in", cat: "Sales" },
      { label: "Staff Salary", amt: 62000, type: "out", cat: "Payroll" },
      { label: "GST Invoice #INV042", amt: 38000, type: "in", cat: "Invoice" },
    ],
    points: [
      "Sales, expenses & GST invoices",
      "Manage team payouts and vendors",
      "Customer ledger & payment history",
      "Profit & loss at a glance",
    ],
  },
  {
    id: "apartment", label: "Apartment", color: "var(--purple)",
    orgName: "Sunrise Heights CHS", badge: "Rs 69/month",
    income: 184000, expense: 62400, net: 121600,
    chart: [160, 175, 168, 180, 172, 184, 178, 190, 182, 185, 184, 176],
    transactions: [
      { label: "Maintenance – A Wing", amt: 72000, type: "in", cat: "Maintenance" },
      { label: "Security Salary", amt: 22000, type: "out", cat: "Staff" },
      { label: "Maintenance – B Wing", amt: 56000, type: "in", cat: "Maintenance" },
      { label: "Lift AMC", amt: 18000, type: "out", cat: "Maintenance" },
      { label: "Sinking Fund", amt: 56000, type: "in", cat: "Fund" },
    ],
    points: [
      "Collect and track maintenance fees",
      "Manage flat records & residents",
      "Society expense transparency",
      "Generate receipts for residents",
    ],
  },
];

const FEATURES = [
  { icon: "📊", color: "var(--accent)", title: "Income & Expense Tracking", desc: "Log every rupee — salary, rent, groceries, EMIs. Know exactly where your money goes." },
  { icon: "🧾", color: "var(--blue)", title: "Professional GST Invoices", desc: "Create GST-ready invoices in seconds. Send to clients and get paid faster." },
  { icon: "📈", color: "var(--gold)", title: "Smart Dashboard", desc: "Real-time charts, monthly trends, and savings goals — your finances at a glance." },
  { icon: "🤝", color: "var(--purple)", title: "Udhaar & Credit Records", desc: "Track money lent and borrowed from family or friends. Never forget who owes what." },
  { icon: "🏢", color: "var(--accent)", title: "Multi-Org Support", desc: "Run your household and business from one account. Switch between Khatas effortlessly." },
  { icon: "🔔", color: "var(--gold)", title: "Smart Reminders", desc: "Get notified for overdue invoices, EMI due dates, and budget limits." },
];

const TICKER_ITEMS = [
  "Invoice #042 paid · Rs 45,000",
  "Maintenance collected · 24 flats",
  "Salary credited · Rs 65,000",
  "EMI reminder sent · Rs 18,500",
  "GST invoice generated in 10 sec",
  "Udhaar recovered · Rs 8,000",
  "New client added · TechCorp",
  "Monthly report ready · April",
  "Profit this month · Rs 53,400",
  "Budget goal reached · Savings",
];

const STATS = [
  { value: "Rs 0", label: "to start — Household is free forever" },
  { value: "2 min", label: "to set up your first Khata" },
  { value: "100%", label: "data ownership, always yours" },
  { value: "GST", label: "ready invoices, built right in" },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function fmtK(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function fmtINR(n) {
  return "Rs " + Number(n).toLocaleString("en-IN");
}

// ── MINI BAR CHART ────────────────────────────────────────────────────────────

function MiniChart({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <svg
      viewBox={`0 0 ${data.length * 14} 40`}
      width="100%"
      height="36"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * 36);
        return (
          <rect
            key={i}
            x={i * 14 + 2}
            y={40 - h}
            width={10}
            height={h}
            rx="3"
            fill={`color-mix(in srgb, ${color} ${i === data.length - 1 ? "100%" : "40%"}, transparent)`}
          />
        );
      })}
    </svg>
  );
}

// ── PHONE MOCKUP ──────────────────────────────────────────────────────────────

function PhoneMockup({ persona }) {
  const [txList, setTxList] = useState(persona.transactions.slice(0, 4));
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setTxList(persona.transactions.slice(0, 4));
    setAnimKey(k => k + 1);
    const iv = setInterval(() => {
      const all = persona.transactions;
      setTxList(prev => {
        const next = [...prev];
        next[next.length - 1] = all[Math.floor(Math.random() * all.length)];
        return next;
      });
      setAnimKey(k => k + 1);
    }, 2400);
    return () => clearInterval(iv);
  }, [persona.id]);

  return (
    <div style={{
      width: 248, flexShrink: 0,
      borderRadius: 32,
      background: "var(--surface)",
      border: "1.5px solid var(--border)",
      boxShadow: "0 28px 72px rgba(0,0,0,0.45), 0 0 0 1px color-mix(in srgb, var(--border) 60%, transparent)",
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      animation: "ekPhoneBob 4s ease-in-out infinite",
    }}>
      {/* Status bar */}
      <div style={{ height: 26, background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "var(--text-dim)" }}>9:41</span>
        <span style={{ fontSize: 9, color: "var(--text-dim)" }}>● ▲</span>
      </div>

      {/* App header */}
      <div style={{ padding: "10px 12px 8px", background: "var(--surface-high)", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{persona.orgName}</div>
            <div style={{ fontSize: 8, color: "var(--text-dim)", marginTop: 1 }}>April 2026 ▾</div>
          </div>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: persona.color, opacity: 0.25 }} />
        </div>
      </div>

      {/* Balance mini-cards */}
      <div style={{ padding: "8px 8px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, flexShrink: 0 }}>
        {[
          { label: "Income", val: persona.income, c: "var(--accent)" },
          { label: "Expense", val: persona.expense, c: "var(--danger)" },
        ].map(({ label, val, c }) => (
          <div key={label} style={{ background: "var(--surface-pop)", borderRadius: 8, padding: "6px 8px", border: `1px solid color-mix(in srgb, ${c} 20%, transparent)` }}>
            <div style={{ fontSize: 7, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c, marginTop: 2 }}>Rs {fmtK(val)}</div>
          </div>
        ))}
      </div>

      {/* Net + chart */}
      <div style={{ margin: "6px 8px", background: "var(--surface-pop)", borderRadius: 10, padding: "8px 10px", border: `1px solid color-mix(in srgb, ${persona.color} 25%, transparent)`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 7, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.4 }}>Net Balance</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: persona.color, marginTop: 1 }}>Rs {fmtK(persona.net)}</div>
          </div>
          <div style={{ fontSize: 8, color: "var(--accent)", background: "var(--accent-deep)", padding: "2px 7px", borderRadius: 6, fontWeight: 700 }}>+12%</div>
        </div>
        <MiniChart data={persona.chart} color={persona.color} />
      </div>

      {/* Transactions */}
      <div style={{ flex: 1, padding: "0 8px 8px", overflow: "hidden" }}>
        <div style={{ fontSize: 7, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>Recent</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {txList.map((tx, i) => (
            <div key={`${animKey}-${i}`} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--surface-pop)", borderRadius: 7, padding: "5px 7px",
              animation: i === txList.length - 1 ? "ekEntryIn 0.35s ease" : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 8, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.label}</div>
                <div style={{ fontSize: 7, color: "var(--text-dim)", marginTop: 1 }}>{tx.cat}</div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: tx.type === "in" ? "var(--accent)" : "var(--danger)", marginLeft: 6, flexShrink: 0 }}>
                {tx.type === "in" ? "+" : "−"}Rs {fmtK(tx.amt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ height: 34, background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 8px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        {["🏠", "💰", "📊", "🧾", "⚙"].map((icon, i) => (
          <div key={i} style={{ fontSize: i === 0 ? 11 : 9, color: i === 0 ? persona.color : "var(--text-dim)" }}>{icon}</div>
        ))}
      </div>
    </div>
  );
}

// ── TICKER ────────────────────────────────────────────────────────────────────

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "11px 0", background: "var(--surface)" }}>
      <div style={{ display: "flex", gap: 48, animation: "ekTicker 30s linear infinite", width: "max-content" }}>
        {items.map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, display: "inline-block", opacity: 0.7 }} />
            <span style={{ fontSize: 12, color: "var(--text-sec)", fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FEATURE CARD ──────────────────────────────────────────────────────────────

function FeatureCard({ icon, color, title, desc }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="ekReveal card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "22px 18px",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "transform 0.2s, border-color 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        borderColor: hovered ? `color-mix(in srgb, ${color} 40%, transparent)` : undefined,
        cursor: "default",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

// ── PERSONA TAB ───────────────────────────────────────────────────────────────

function PersonaTab({ persona, active, onClick }) {
  return (
    <button
      onClick={persona.comingSoon ? undefined : onClick}
      style={{
        background: active ? `color-mix(in srgb, ${persona.color} 18%, transparent)` : "var(--surface)",
        border: `1px solid ${active ? `color-mix(in srgb, ${persona.color} 50%, transparent)` : "var(--border)"}`,
        borderRadius: 10, padding: "9px 20px",
        fontSize: 13, fontWeight: 600,
        color: active ? persona.color : persona.comingSoon ? "var(--text-dim)" : "var(--text-sec)",
        cursor: persona.comingSoon ? "default" : "pointer",
        transition: "all 0.18s",
        fontFamily: "var(--font)",
        opacity: persona.comingSoon ? 0.6 : 1,
        position: "relative",
      }}
    >
      {persona.label}
      {persona.comingSoon && (
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--gold) 40%, transparent)", borderRadius: 4, padding: "1px 5px", marginLeft: 6, letterSpacing: 0.5, verticalAlign: "middle" }}>
          SOON
        </span>
      )}
    </button>
  );
}

// ── REVEAL HOOK ───────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".ekReveal");
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("ekRevealVisible"); });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── LANDING SCREEN ────────────────────────────────────────────────────────────

export default function LandingScreen({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [personaId, setPersonaId] = useState("household");
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);
  const persona = PERSONAS.find(p => p.id === personaId);
  useReveal();

  useEffect(() => {
    const el = document.getElementById("ek-landing-scroll");
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes ekPhoneBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ekEntryIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ekTicker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ekFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ekPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .ekReveal { opacity:0; transform:translateY(24px); transition:opacity 0.55s ease,transform 0.55s ease; }
        .ekRevealVisible { opacity:1; transform:translateY(0); }
        .ekReveal:nth-child(2){transition-delay:0.08s}
        .ekReveal:nth-child(3){transition-delay:0.16s}
        .ekReveal:nth-child(4){transition-delay:0.24s}
        .ekReveal:nth-child(5){transition-delay:0.32s}
        .ekReveal:nth-child(6){transition-delay:0.40s}
        .ek-cta-btn:hover { transform: translateY(-2px); }
      `}</style>

      <div
        id="ek-landing-scroll"
        style={{ minHeight: "100dvh", overflowY: "auto", overflowX: "hidden", background: "var(--bg)", position: "relative" }}
      >
        {/* NAV */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px",
          background: scrolled ? "color-mix(in srgb, var(--bg) 90%, transparent)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
          transition: "all 0.25s",
        }}>
          <BrandLogo compact showTagline={false} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onGetStarted} className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>Sign In →</button>
          </div>
        </nav>

        <main style={{ position: "relative" }}>

          {/* HERO */}
          <section style={{
            maxWidth: 1100, margin: "0 auto",
            padding: "64px 24px 60px",
            display: "flex", alignItems: "center", gap: 48,
            flexWrap: "wrap",
          }}>
            {/* Left copy */}
            <div style={{ flex: "1 1 340px", minWidth: 0, animation: "ekFadeUp 0.65s ease both" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "var(--accent-deep)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                borderRadius: 20, padding: "5px 14px",
                fontSize: 12, fontWeight: 700, color: "var(--accent-text)", letterSpacing: 0.5,
                marginBottom: 22,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "ekPulse 2s infinite", display: "inline-block" }} />
                India's smartest khata app
              </div>

              <h1 style={{
                fontFamily: "var(--serif)",
                fontSize: "clamp(32px, 5vw, 54px)",
                color: "var(--text)", lineHeight: 1.1, letterSpacing: -1.2,
                marginBottom: 18,
              }}>
                {APP_NAME} —<br />
                <span style={{
                  background: "linear-gradient(135deg, var(--accent), var(--blue))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {APP_TAGLINE}
                </span>
              </h1>

              <p style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.75, marginBottom: 28, maxWidth: 440 }}>
                Track income, expenses, invoices, and loans — for your family, freelance work, or apartment society. All in one beautiful app.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                <button onClick={onGetStarted} className="btn-primary ek-cta-btn" style={{
                  padding: "14px 30px", fontSize: 15,
                  boxShadow: "0 4px 24px color-mix(in srgb, var(--accent) 32%, transparent)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                  Get Started Free →
                </button>
                <a href="#personas" className="btn-secondary ek-cta-btn" style={{
                  padding: "14px 22px", fontSize: 15, textDecoration: "none",
                  display: "inline-flex", alignItems: "center",
                  transition: "transform 0.15s",
                }}>
                  See it in action →
                </a>
              </div>

              <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 28 }}>
                No credit card · Household plan is free forever
              </div>

              {/* Persona quick-switch */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {PERSONAS.map(p => (
                  <PersonaTab key={p.id} persona={p} active={personaId === p.id} onClick={() => setPersonaId(p.id)} />
                ))}
              </div>
            </div>

            {/* Right — phone mockup */}
            <div style={{
              flex: "0 0 auto",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              animation: "ekFadeUp 0.75s ease 0.15s both",
            }}>
              <PhoneMockup persona={persona} />
              <div style={{ fontSize: 11, color: "var(--text-sec)", textAlign: "center" }}>
                Switch tabs above to see each Khata type
              </div>
            </div>
          </section>

          {/* TICKER */}
          <Ticker />

          {/* STATS */}
          <section ref={statsRef} style={{
            background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
            padding: "48px 24px",
          }}>
            <div style={{
              maxWidth: 800, margin: "0 auto",
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 28, textAlign: "center",
            }}>
              {STATS.map((s, i) => (
                <div key={i}>
                  <div style={{
                    fontFamily: "var(--serif)", fontSize: 34, color: "var(--accent)", lineHeight: 1,
                    opacity: statsVisible ? 1 : 0,
                    transform: statsVisible ? "none" : "translateY(10px)",
                    transition: `opacity 0.6s ${i * 0.12}s ease, transform 0.6s ${i * 0.12}s ease`,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 8, lineHeight: 1.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* PERSONA DEEP DIVE */}
          <section id="personas" style={{ maxWidth: 1060, margin: "0 auto", padding: "80px 24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="ekReveal" style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Made For Everyone</div>
              <h2 className="ekReveal" style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)", lineHeight: 1.2, marginBottom: 12 }}>One App, Every Kind of Khata</h2>
              <p className="ekReveal" style={{ fontSize: 15, color: "var(--text-sec)", maxWidth: 440, margin: "0 auto" }}>
                EazyKhata adapts its sections, labels, and features to your workspace type.
              </p>
            </div>

            {/* Tabs */}
            <div className="ekReveal" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
              {PERSONAS.map(p => (
                <PersonaTab key={p.id} persona={p} active={personaId === p.id} onClick={() => setPersonaId(p.id)} />
              ))}
            </div>

            {/* Content panel */}
            <div className="ekReveal card" style={{
              padding: "28px 24px",
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28,
              alignItems: "start",
              borderColor: `color-mix(in srgb, ${persona.color} 28%, transparent)`,
              transition: "border-color 0.3s",
            }}>
              {/* Transactions column */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: persona.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: persona.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{persona.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{persona.orgName}</div>
                  </div>
                  <div style={{
                    marginLeft: "auto",
                    fontSize: 11, fontWeight: 700, color: persona.color,
                    background: `color-mix(in srgb, ${persona.color} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${persona.color} 35%, transparent)`,
                    borderRadius: 20, padding: "3px 10px",
                  }}>{persona.badge}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {persona.transactions.slice(0, 4).map((tx, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "var(--surface-high)", borderRadius: 10, padding: "10px 14px",
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{tx.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{tx.cat}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tx.type === "in" ? "var(--accent)" : "var(--danger)" }}>
                        {tx.type === "in" ? "+" : "−"}{fmtINR(tx.amt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary + chart column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "var(--surface-high)", borderRadius: 14, padding: "18px" }}>
                  <div className="section-label">Monthly Summary</div>
                  {[
                    { label: "Total Income", val: fmtINR(persona.income), c: "var(--accent)" },
                    { label: "Total Expense", val: fmtINR(persona.expense), c: "var(--danger)" },
                    { label: "Net Balance", val: fmtINR(persona.net), c: persona.color },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: row.c }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--surface-high)", borderRadius: 14, padding: "14px 18px" }}>
                  <div className="section-label">12-Month Trend</div>
                  <MiniChart data={persona.chart} color={persona.color} />
                </div>

                <div style={{ background: "var(--surface-high)", borderRadius: 14, padding: "14px 18px" }}>
                  <div className="section-label">What's Included</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {persona.points.map(pt => (
                      <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: persona.color, fontWeight: 700, fontSize: 11, marginTop: 2 }}>✓</span>
                        <span style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.5 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={onGetStarted} className="btn-primary" style={{ width: "100%", padding: "13px" }}>
                  Start your {persona.label} Khata →
                </button>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="ekReveal" style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Everything You Need</div>
              <h2 className="ekReveal" style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)", lineHeight: 1.2 }}>
                Powerful Features, Simple Interface
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section style={{ maxWidth: 640, margin: "80px auto 0", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="ekReveal" style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Get Started in Minutes</div>
              <h2 className="ekReveal" style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)", lineHeight: 1.2 }}>
                Up and running in 3 steps
              </h2>
            </div>
            {[
              { n: "1", title: "Sign in with Google", desc: "No passwords, no hassle. One tap and you're in — secure and instant." },
              { n: "2", title: "Pick your Khata type", desc: "Choose from Household, Freelancer, or Apartment Society. Small Business coming soon." },
              { n: "3", title: "Start tracking", desc: "Add your first income or expense. Your dashboard updates instantly." },
            ].map((step, i, arr) => (
              <div key={i} className="ekReveal" style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, var(--accent), var(--blue))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "var(--bg)",
                  }}>{step.n}</div>
                  {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: "var(--border)", minHeight: 32, margin: "4px 0" }} />}
                </div>
                <div style={{ paddingBottom: 36, paddingTop: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </section>

          {/* PRICING */}
          <section id="pricing" style={{ maxWidth: 760, margin: "80px auto 0", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="ekReveal" style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>Simple Pricing</div>
              <h2 className="ekReveal" style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)", lineHeight: 1.2, marginBottom: 12 }}>
                Start Free. Upgrade When Ready.
              </h2>
              <p className="ekReveal" style={{ fontSize: 15, color: "var(--text-sec)", maxWidth: 420, margin: "0 auto" }}>
                Household accounts are free forever. Freelancers and apartment societies get a 30-day trial, then Rs 69/month.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
              {[
                {
                  label: "Household", price: "Free", sub: "Forever · No card needed", color: "var(--accent)",
                  points: ["Income & expense tracking", "EMI & loan tracking", "Monthly savings goals", "Single organisation"],
                  cta: "Get Started Free →", primary: false,
                },
                {
                  label: "Pro", price: "Rs 69", sub: "per month · 30-day free trial", color: "var(--gold)",
                  points: ["Everything in Household", "GST invoices & quotes", "Udhaar / khata records", "Multi-org support", "CSV & PDF exports"],
                  cta: "Start Free Trial →", primary: true,
                },
              ].map(plan => (
                <div key={plan.label} className="ekReveal card" style={{
                  padding: "26px 22px",
                  borderColor: `color-mix(in srgb, ${plan.color} 28%, transparent)`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>{plan.label}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 34, color: "var(--text)", lineHeight: 1, marginBottom: 4 }}>{plan.price}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 20 }}>{plan.sub}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                    {plan.points.map(pt => (
                      <div key={pt} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: plan.color, fontWeight: 700, fontSize: 11 }}>✓</span>
                        <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={onGetStarted}
                    className={plan.primary ? "btn-primary" : "btn-secondary"}
                    style={{ width: "100%", padding: "12px", fontSize: 14 }}
                  >{plan.cta}</button>
                </div>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section style={{ maxWidth: 680, margin: "80px auto 0", padding: "0 24px" }}>
            <div className="ekReveal card" style={{
              padding: "56px 36px", textAlign: "center",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--blue) 7%, var(--surface)))",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -60, right: -60, width: 200, height: 200,
                background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
                pointerEvents: "none",
              }} />
              <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(24px, 4vw, 38px)", color: "var(--text)", lineHeight: 1.2, marginBottom: 14 }}>
                Your finances,<br />finally under control.
              </h2>
              <p style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 30px" }}>
                Join thousands of households, freelancers, and apartment societies who trust {APP_NAME} to keep their khata clean.
              </p>
              <button
                onClick={onGetStarted}
                className="btn-primary ek-cta-btn"
                style={{ padding: "16px 44px", fontSize: 16, boxShadow: "0 6px 28px color-mix(in srgb, var(--accent) 35%, transparent)", transition: "transform 0.15s" }}
              >
                Get Started Free →
              </button>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 14 }}>
                Sign in with Google · Takes 2 minutes
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{
            maxWidth: 960, margin: "56px auto 0",
            padding: "22px 24px 40px",
            borderTop: "1px solid var(--border)",
            display: "flex", flexWrap: "wrap", alignItems: "center",
            justifyContent: "space-between", gap: 16,
          }}>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { label: "Terms", href: LEGAL_PATHS.terms },
                { label: "Privacy", href: LEGAL_PATHS.privacy },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                  style={{ fontSize: 13, color: "var(--text-sec)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text-sec)"}
                >{l.label}</a>
              ))}
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
