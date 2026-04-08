import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "US" },
  { code: "EUR", symbol: "EUR", name: "Euro", flag: "EU" },
  { code: "GBP", symbol: "GBP", name: "British Pound", flag: "GB" },
  { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "AE" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "SG" },
  { code: "JPY", symbol: "JPY", name: "Japanese Yen", flag: "JP" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "CH" },
  { code: "NGN", symbol: "NGN", name: "Nigerian Naira", flag: "NG" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "ZA" }
];

export function fmtMoney(n, sym) {
  return `${sym}${Math.abs(Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function fmtDate(iso) {
  if (!iso) return "--";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function monthKey(y, m) {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function invoiceTotal(items) {
  return (items || []).reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
}

export function avatarColor(s) {
  const colors = ["#7EE8A2", "#67B2FF", "#F6C94E", "#C084FC", "#FF6E6E", "#FB923C", "#22D3EE"];
  let hash = 0;
  for (let i = 0; i < (s || "").length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return colors[hash % colors.length];
}

export function initials(s) {
  return (s || "?")
    .split(" ")
    .map(word => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Modal({ title, onClose, onSave, saveLabel = "Save", canSave = true, accentColor, children }) {
  const btnBg = accentColor || "var(--accent)";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalNode = (
    <div className="modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="modal-header">
        <button onClick={onClose} className="btn-secondary" style={{ padding: "9px 16px", fontSize: 14 }}>
          x Cancel
        </button>
        <span style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--text)" }}>{title}</span>
        <button
          onClick={() => canSave && onSave()}
          disabled={!canSave}
          style={{
            background: canSave ? btnBg : "var(--surface-high)",
            border: "none",
            borderRadius: 12,
            padding: "9px 18px",
            fontSize: 14,
            fontWeight: 700,
            color: canSave ? "#0C0C10" : "var(--text-dim)",
            cursor: canSave ? "pointer" : "not-allowed",
            fontFamily: "var(--font)",
            transition: "all 0.2s"
          }}
        >
          {saveLabel}
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

export function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-sec)",
          textTransform: "uppercase",
          letterSpacing: 0.7,
          marginBottom: 8,
          display: "block"
        }}
      >
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return <input className="input-field" style={style} {...props} />;
}

export function Textarea({ style, ...props }) {
  return <textarea className="input-field" style={{ minHeight: 88, resize: "vertical", ...style }} {...props} />;
}

export function Select({ style, children, ...props }) {
  return (
    <select className="input-field" style={{ cursor: "pointer", ...style }} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ value, onChange, options }) {
  return (
    <div className="toggle-switch">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`toggle-option${value === option.value ? " active" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ pct, color }) {
  return (
    <div className="progress-bar-track">
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct || 0)}%`, background: color }} />
    </div>
  );
}

export function MonthNav({ year, month, onChange }) {
  const prev = () => {
    let nextMonth = month - 1;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    onChange(nextYear, nextMonth);
  };

  const next = () => {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    onChange(nextYear, nextMonth);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={prev}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "var(--surface-high)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {"<"}
      </button>
      <span style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--text)", minWidth: 98, textAlign: "center" }}>
        {MONTHS[month]} {year}
      </span>
      <button
        onClick={next}
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: "var(--surface-high)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {">"}
      </button>
    </div>
  );
}

export function FAB({ bg, shadow, onClick }) {
  return (
    <button className="fab" onClick={onClick} style={{ background: bg, boxShadow: `0 4px 24px ${shadow}` }}>
      +
    </button>
  );
}

export function Avatar({ name, size = 40, fontSize = 14 }) {
  return (
    <div className="avatar-circle" style={{ width: size, height: size, fontSize, background: avatarColor(name), color: "#0C0C10" }}>
      {initials(name)}
    </div>
  );
}

export function DeleteBtn({ onDelete }) {
  return (
    <button className="delete-btn" onClick={onDelete}>
      x
    </button>
  );
}

export function CurrencyPicker({ value, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(search.toLowerCase()) || currency.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title="Select Currency" onClose={onClose} onSave={onClose} saveLabel="Done">
      <Input placeholder="Search currencies..." value={search} onChange={event => setSearch(event.target.value)} style={{ marginBottom: 16 }} />
      <div className="card">
        {filtered.map(currency => {
          const active = value?.code === currency.code;
          return (
            <div
              key={currency.code}
              onClick={() => onSelect(currency)}
              className="card-row"
              style={{ cursor: "pointer", background: active ? "var(--accent-deep)" : "transparent" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, minWidth: 26 }}>{currency.flag}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: active ? "var(--accent)" : "var(--text)" }}>{currency.code}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{currency.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: active ? "var(--accent)" : "var(--text-dim)" }}>{currency.symbol}</span>
                {active && (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#0C0C10",
                      fontWeight: 800
                    }}
                  >
                    OK
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
