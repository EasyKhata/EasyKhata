import React,{ useState } from "react";

export function uid() { return Math.random().toString(36).slice(2, 9); }

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const CURRENCIES = [
  { code:"USD", symbol:"$", name:"US Dollar", flag:"🇺🇸" },
  { code:"EUR", symbol:"€", name:"Euro", flag:"🇪🇺" },
  { code:"GBP", symbol:"£", name:"British Pound", flag:"🇬🇧" },
  { code:"INR", symbol:"₹", name:"Indian Rupee", flag:"🇮🇳" },
  { code:"AED", symbol:"د.إ", name:"UAE Dirham", flag:"🇦🇪" },
  { code:"CAD", symbol:"CA$", name:"Canadian Dollar", flag:"🇨🇦" },
  { code:"AUD", symbol:"A$", name:"Australian Dollar", flag:"🇦🇺" },
  { code:"SGD", symbol:"S$", name:"Singapore Dollar", flag:"🇸🇬" },
  { code:"JPY", symbol:"¥", name:"Japanese Yen", flag:"🇯🇵" },
  { code:"CHF", symbol:"Fr", name:"Swiss Franc", flag:"🇨🇭" },
  { code:"NGN", symbol:"₦", name:"Nigerian Naira", flag:"🇳🇬" },
  { code:"ZAR", symbol:"R", name:"South African Rand", flag:"🇿🇦" },
];

export function fmtMoney(n, sym) {
  return `${sym}${Math.abs(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function monthKey(y, m) { return `${y}-${String(m + 1).padStart(2, "0")}`; }

export function invoiceTotal(items) {
  return (items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
}

export function avatarColor(s) {
  const cs = ["#7EE8A2","#67B2FF","#F6C94E","#C084FC","#FF6E6E","#FB923C","#22D3EE"];
  let h = 0;
  for (let i = 0; i < (s||"").length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return cs[h % cs.length];
}

export function initials(s) {
  return (s || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, onSave, saveLabel = "Save", canSave = true, accentColor, children }) {
  const btnBg = accentColor || "var(--accent)";
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-header">
        <button onClick={onClose} className="btn-secondary" style={{ padding: "9px 16px", fontSize: 14 }}>✕ Cancel</button>
        <span style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--text)" }}>{title}</span>
        <button onClick={() => canSave && onSave()} disabled={!canSave}
          style={{ background: canSave ? btnBg : "var(--surface-high)", border: "none", borderRadius: 12, padding: "9px 18px", fontSize: 14, fontWeight: 700, color: canSave ? "#0C0C10" : "var(--text-dim)", cursor: canSave ? "pointer" : "not-allowed", fontFamily: "var(--font)", transition: "all 0.2s" }}>
          {saveLabel}
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
export function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8, display: "block" }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────────
export function Input({ style, ...props }) {
  return <input className="input-field" style={style} {...props} />;
}

export function Textarea({ style, ...props }) {
  return <textarea className="input-field" style={{ minHeight: 88, resize: "vertical", ...style }} {...props} />;
}

export function Select({ style, children, ...props }) {
  return <select className="input-field" style={{ cursor: "pointer", ...style }} {...props}>{children}</select>;
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ value, onChange, options }) {
  return (
    <div className="toggle-switch">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`toggle-option${value === o.value ? " active" : ""}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color }) {
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct || 0)}%`, background: color }} />
    </div>
  );
}

// ── Month Navigator ───────────────────────────────────────────────────────────
export function MonthNav({ year, month, onChange }) {
  const prev = () => { let m = month - 1, y = year; if (m < 0) { m = 11; y--; } onChange(y, m); };
  const next = () => { let m = month + 1, y = year; if (m > 11) { m = 0; y++; } onChange(y, m); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={prev} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface-high)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
      <span style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--text)", minWidth: 98, textAlign: "center" }}>{MONTHS[month]} {year}</span>
      <button onClick={next} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface-high)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
    </div>
  );
}

// ── FAB ───────────────────────────────────────────────────────────────────────
export function FAB({ bg, shadow, onClick }) {
  return (
    <button className="fab" onClick={onClick} style={{ background: bg, boxShadow: `0 4px 24px ${shadow}` }}>+</button>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 40, fontSize = 14 }) {
  return (
    <div className="avatar-circle" style={{ width: size, height: size, fontSize, background: avatarColor(name), color: "#0C0C10" }}>
      {initials(name)}
    </div>
  );
}

// ── Delete Button ─────────────────────────────────────────────────────────────
export function DeleteBtn({ onDelete }) {
  return <button className="delete-btn" onClick={onDelete}>✕</button>;
}

// ── Currency Picker ───────────────────────────────────────────────────────────
export function CurrencyPicker({ value, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Modal title="Select Currency" onClose={onClose} onSave={onClose} saveLabel="Done">
      <Input placeholder="🔍  Search currencies…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
      <div className="card">
        {filtered.map((cur, idx) => {
          const active = value?.code === cur.code;
          return (
            <div key={cur.code} onClick={() => { onSelect(cur); }} className="card-row"
              style={{ cursor: "pointer", background: active ? "var(--accent-deep)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 24 }}>{cur.flag}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: active ? "var(--accent)" : "var(--text)" }}>{cur.code}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{cur.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: active ? "var(--accent)" : "var(--text-dim)" }}>{cur.symbol}</span>
                {active && <div style={{ width: 20, height: 20, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#0C0C10", fontWeight: 800 }}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}