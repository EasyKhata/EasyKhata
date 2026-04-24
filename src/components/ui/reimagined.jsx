import React, { useEffect, useRef, useState } from "react";

// ── RupeeDisplay ──────────────────────────────────────────────────────────────
// Typographic hero rupee amount with optional count-up animation
export function RupeeDisplay({ amount = 0, color = "var(--jade)", size = 52, animate = false }) {
  const [displayed, setDisplayed] = useState(animate ? 0 : amount);

  useEffect(() => {
    if (!animate) { setDisplayed(amount); return; }
    let start = null;
    const duration = 1100;
    const raf = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplayed(Math.round(ease * amount));
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [amount, animate]);

  const isNeg = displayed < 0;
  const abs = Math.abs(displayed);
  const formatted = abs >= 10000000
    ? `${(abs / 10000000).toFixed(1)}Cr`
    : abs >= 100000
      ? `${(abs / 100000).toFixed(1)}L`
      : abs.toLocaleString("en-IN");

  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 2 }}>
      {isNeg && (
        <span style={{ fontFamily: "var(--serif)", fontSize: size * 0.55, color, lineHeight: 1, opacity: 0.7 }}>−</span>
      )}
      <span style={{ fontFamily: "var(--serif)", fontSize: size * 0.42, color, lineHeight: 1, opacity: 0.65, marginRight: 1 }}>₹</span>
      <span style={{ fontFamily: "var(--serif)", fontSize: size, color, lineHeight: 1, fontWeight: 700, letterSpacing: -1.5 }}>{formatted}</span>
    </span>
  );
}

// ── HealthArc ─────────────────────────────────────────────────────────────────
// SVG arc gauge showing a percentage (0–100)
export function HealthArc({ pct = 0, size = 120, color = "var(--saffron)" }) {
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    let start = null;
    const dur = 900;
    const raf = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimPct(ease * pct);
      if (p < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [pct]);

  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210;
  const sweep = 240;
  const angle = startAngle + (sweep * animPct / 100);

  const toXY = (a) => ({
    x: cx + r * Math.cos((a * Math.PI) / 180),
    y: cy + r * Math.sin((a * Math.PI) / 180),
  });

  const s = toXY(startAngle);
  const e = toXY(angle);
  const large = (sweep * animPct / 100) > 180 ? 1 : 0;
  const trackEnd = toXY(startAngle + sweep);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none"
        stroke="color-mix(in srgb, var(--cream) 7%, transparent)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      {animPct > 0 && (
        <path
          d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      )}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        style={{ fontSize: 18, fill: color, fontFamily: "var(--serif)", fontWeight: 700 }}
      >
        {Math.round(animPct)}%
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        style={{ fontSize: 8, fill: "var(--cream-3)", fontFamily: "var(--font)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}
      >
        of goal
      </text>
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
// Mini area sparkline chart
export function Sparkline({ data = [], color = "var(--jade)", height = 40 }) {
  const id = useRef(`sp-${Math.random().toString(36).slice(2)}`).current;
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = data.length;
  const pts = data.map((v, i) => `${(i / Math.max(w - 1, 1)) * 100},${height - (v / max) * height}`).join(" ");

  return (
    <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${pts} 100,${height}`}
        fill={`url(#${id})`}
      />
    </svg>
  );
}

// ── ProgressLine ──────────────────────────────────────────────────────────────
// Animated horizontal progress bar
export function ProgressLine({ value = 0, max = 100, color = "var(--jade)" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.min(100, (value / Math.max(max, 1)) * 100)), 80);
    return () => clearTimeout(t);
  }, [value, max]);

  return (
    <div style={{ height: 5, background: "color-mix(in srgb, var(--cream) 7%, transparent)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        width: `${w}%`,
        background: color,
        borderRadius: 3,
        transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: `0 0 8px color-mix(in srgb, ${color} 60%, transparent)`
      }} />
    </div>
  );
}

// ── StatChip ──────────────────────────────────────────────────────────────────
// Compact stat display chip with label + value + optional sub
export function StatChip({ label, value, color = "var(--jade)", sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: `color-mix(in srgb, ${color} 8%, var(--card))`,
        border: `1px solid color-mix(in srgb, ${color} 20%, var(--line-2))`,
        borderRadius: 14,
        padding: "12px 14px",
        flex: 1,
        minWidth: 0,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={onClick ? e => e.currentTarget.style.transform = "translateY(-1px)" : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.transform = "" : undefined}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cream-3)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "var(--serif)", letterSpacing: -0.5, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color, marginTop: 4, fontWeight: 600, opacity: 0.7 }}>{sub}</div>
      )}
    </div>
  );
}

// ── TimelineEntry ─────────────────────────────────────────────────────────────
// A transaction row in timeline style with category-colored icon
const CAT_COLORS = {
  Income: "var(--jade)", Salary: "var(--jade)", Invoice: "var(--sky)", Payment: "var(--sky)",
  Groceries: "var(--saffron)", Food: "var(--saffron)", Rent: "var(--orchid)", Housing: "var(--orchid)",
  EMI: "var(--saffron)", Utilities: "var(--sky)", Entertainment: "var(--ember)",
  Transport: "var(--sky)", Education: "var(--orchid)", Healthcare: "var(--ember)",
  Shopping: "var(--saffron)", Staff: "var(--orchid)", Maintenance: "var(--jade)",
  Sales: "var(--jade)", Payroll: "var(--ember)", Operations: "var(--sky)",
  Software: "var(--sky)", default: "var(--cream-2)",
};

export function getCatColor(cat) {
  return CAT_COLORS[cat] || CAT_COLORS.default;
}

export function TimelineEntry({ label, amount, type = "out", category, date, isLast = false, delay = 0 }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const color = getCatColor(category);
  const isIn = type === "in";
  const initial = (category || "?")[0].toUpperCase();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 0",
      borderBottom: isLast ? "none" : "1px solid color-mix(in srgb, var(--line) 70%, transparent)",
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateX(10px)",
      transition: "opacity 0.3s ease, transform 0.3s ease",
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        flexShrink: 0,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        color,
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cream)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "var(--cream-3)", marginTop: 2 }}>
          {[category, date].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: isIn ? "var(--jade)" : "var(--ember)",
        fontFamily: "var(--serif)",
        letterSpacing: -0.3,
        flexShrink: 0,
      }}>
        {isIn ? "+" : "−"}₹{Math.abs(amount) >= 100000
          ? `${(Math.abs(amount) / 100000).toFixed(1)}L`
          : Math.abs(amount) >= 1000
            ? `${(Math.abs(amount) / 1000).toFixed(1)}k`
            : Math.abs(amount).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

// ── OrgAvatar ─────────────────────────────────────────────────────────────────
// Organization avatar with colored initials
export function OrgAvatar({ name = "", color = "var(--saffron)", size = 32 }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `color-mix(in srgb, ${color} 22%, var(--raised))`,
      border: `1.5px solid color-mix(in srgb, ${color} 35%, transparent)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.36,
      fontWeight: 800,
      color,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── MiniBarChart ──────────────────────────────────────────────────────────────
// Simple SVG bar chart
export function MiniBarChart({ data = [], color = "var(--jade)", height = 48 }) {
  const max = Math.max(...data, 1);
  const w = data.length * 14;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} aria-hidden="true" style={{ display: "block" }}>
      {data.map((v, i) => {
        const h = Math.max(3, (v / max) * (height - 4));
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={i * 14 + 2}
            y={height - h}
            width={10}
            height={h}
            rx="3"
            fill={color}
            opacity={isLast ? 1 : 0.3 + (i / data.length) * 0.5}
          />
        );
      })}
    </svg>
  );
}
