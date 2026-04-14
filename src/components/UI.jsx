import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildDateFromParts,
  buildMonthValue,
  COUNTRY_OPTIONS,
  getDayOptions,
  getStateProvinceOptions,
  getYearOptions,
  MONTH_OPTIONS,
  parseDateParts,
  parseMonthParts
} from "../utils/profile";

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await Promise.resolve(onSave?.());
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isSaving, onSave]);

  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }, [onClose]);

  const modalNode = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-surface">
        <div className="modal-header">
          <button onClick={onClose} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }}>
            x Cancel
          </button>
          <span style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text)", textAlign: "center" }}>{title}</span>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            style={{
              background: canSave && !isSaving ? btnBg : "var(--surface-high)",
              border: "none",
              borderRadius: 12,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: canSave && !isSaving ? "#0C0C10" : "var(--text-dim)",
              cursor: canSave && !isSaving ? "pointer" : "not-allowed",
              fontFamily: "var(--font)",
              transition: "all 0.2s"
            }}
          >
            {isSaving ? "Saving..." : saveLabel}
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

export function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 11,
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
      {hint && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export function Input({ style, ...props }) {
  return <input className="input-field" style={style} {...props} />;
}

export function Textarea({ style, ...props }) {
  return <textarea className="input-field" style={{ minHeight: 76, resize: "vertical", ...style }} {...props} />;
}

export function Select({ style, children, ...props }) {
  return (
    <select className="input-field" style={{ cursor: "pointer", ...style }} {...props}>
      {children}
    </select>
  );
}

export function PhoneNumberInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  countryOptions = [],
  phonePlaceholder = "9876543210"
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(132px, 172px) minmax(0, 1fr)", gap: 10 }}>
      <Select value={countryCode} onChange={event => onCountryCodeChange(event.target.value)}>
        {countryOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input type="tel" autoComplete="tel-national" placeholder={phonePlaceholder} value={phoneNumber} onChange={event => onPhoneNumberChange(event.target.value)} />
    </div>
  );
}

export function StructuredLocationFields({
  addressLine,
  city,
  state,
  country,
  onAddressLineChange,
  onCityChange,
  onStateChange,
  onCountryChange,
  addressLabel = "Address Line",
  cityLabel = "City",
  countryLabel = "Country",
  stateLabel = "State / Province",
  addressPlaceholder = "House no, street, road",
  cityPlaceholder = "Hyderabad",
  addressHint,
  cityHint,
  required = false
}) {
  const stateOptions = getStateProvinceOptions(country || "India");

  return (
    <>
      <Field label={addressLabel} hint={addressHint}>
        <Input placeholder={addressPlaceholder} value={addressLine || ""} onChange={event => onAddressLineChange?.(event.target.value)} autoComplete="address-line1" />
      </Field>
      <div className="desktop-grid-2">
        <Field label={cityLabel} required={required} hint={cityHint}>
          <Input placeholder={cityPlaceholder} value={city || ""} onChange={event => onCityChange(event.target.value)} autoComplete="address-level2" />
        </Field>
        <Field label={countryLabel} required={required}>
          <Select value={country || "India"} onChange={event => onCountryChange(event.target.value)}>
            {COUNTRY_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={stateLabel} required={required}>
        <Select value={state || ""} onChange={event => onStateChange(event.target.value)}>
          <option value="">Select state / province</option>
          {stateOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

export function DateSelectInput({ value, onChange, min, max, allowEmpty = true, yearOrder = "desc" }) {
  const [parts, setParts] = useState(() => parseDateParts(value));
  const [useNativePicker, setUseNativePicker] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setUseNativePicker(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const nextValue = String(value || "").trim();
    const currentValue = buildDateFromParts(parts);
    if (nextValue && nextValue !== currentValue) {
      setParts(parseDateParts(nextValue));
      return;
    }
    if (!nextValue && currentValue && !value) {
      setParts({ day: "", month: "", year: "" });
    }
  }, [value]);

  const minParts = useMemo(() => parseDateParts(min), [min]);
  const maxParts = useMemo(() => parseDateParts(max), [max]);
  const nowYear = new Date().getFullYear();
  const selectedYear = Number(parts.year || 0);
  const selectedMonth = Number(parts.month || 0);
  const startYear = Number(minParts.year || parts.year || nowYear - 20);
  const endYear = Number(maxParts.year || parts.year || nowYear + 10);
  const yearOptions = useMemo(
    () => getYearOptions({ startYear, endYear, descending: yearOrder !== "asc" }),
    [endYear, startYear, yearOrder]
  );
  const monthOptions = useMemo(() => MONTH_OPTIONS.filter(option => {
    if (!selectedYear) return true;
    if (Number(minParts.year || 0) === selectedYear && option.value < minParts.month) return false;
    if (Number(maxParts.year || 0) === selectedYear && option.value > maxParts.month) return false;
    return true;
  }), [maxParts.month, maxParts.year, minParts.month, minParts.year, selectedYear]);
  const validDayOptions = useMemo(() => getDayOptions(parts.month, parts.year), [parts.month, parts.year]);
  const dayOptions = useMemo(() => validDayOptions.filter(option => {
    if (!selectedYear || !selectedMonth) return true;
    if (Number(minParts.year || 0) === selectedYear && Number(minParts.month || 0) === selectedMonth && option < minParts.day) return false;
    if (Number(maxParts.year || 0) === selectedYear && Number(maxParts.month || 0) === selectedMonth && option > maxParts.day) return false;
    return true;
  }), [maxParts.day, maxParts.month, maxParts.year, minParts.day, minParts.month, minParts.year, selectedMonth, selectedYear, validDayOptions]);

  const updateParts = useCallback((nextParts) => {
    const normalized = { ...parts, ...nextParts };
    if (normalized.day && normalized.month && normalized.year && !getDayOptions(normalized.month, normalized.year).includes(normalized.day)) {
      normalized.day = "";
    }
    const normalizedValue = buildDateFromParts(normalized);
    setParts(normalized);
    if (!normalized.day || !normalized.month || !normalized.year) {
      onChange?.("");
      return;
    }
    if (min && normalizedValue < min) {
      onChange?.("");
      return;
    }
    if (max && normalizedValue > max) {
      onChange?.("");
      return;
    }
    onChange?.(normalizedValue);
  }, [max, min, onChange, parts]);

  if (useNativePicker) {
    return (
      <Input
        type="date"
        value={value || ""}
        min={min || undefined}
        max={max || undefined}
        onChange={event => onChange?.(event.target.value)}
      />
    );
  }

  return (
    <div className="desktop-grid-3">
      <Select value={parts.day} onChange={event => updateParts({ day: event.target.value })}>
        <option value="">{allowEmpty ? "Day" : "Select day"}</option>
        {dayOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
      <Select value={parts.month} onChange={event => updateParts({ month: event.target.value })}>
        <option value="">{allowEmpty ? "Month" : "Select month"}</option>
        {monthOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Select value={parts.year} onChange={event => updateParts({ year: event.target.value })}>
        <option value="">{allowEmpty ? "Year" : "Select year"}</option>
        {yearOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function MonthSelectInput({ value, onChange, min, max, allowEmpty = true, yearOrder = "desc" }) {
  const [parts, setParts] = useState(() => parseMonthParts(value));
  const [useNativePicker, setUseNativePicker] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setUseNativePicker(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const nextValue = String(value || "").trim();
    const currentValue = buildMonthValue(parts);
    if (nextValue && nextValue !== currentValue) {
      setParts(parseMonthParts(nextValue));
      return;
    }
    if (!nextValue && currentValue && !value) {
      setParts({ month: "", year: "" });
    }
  }, [value]);

  const minParts = useMemo(() => parseMonthParts(min), [min]);
  const maxParts = useMemo(() => parseMonthParts(max), [max]);
  const nowYear = new Date().getFullYear();
  const selectedYear = Number(parts.year || 0);
  const startYear = Number(minParts.year || parts.year || nowYear - 20);
  const endYear = Number(maxParts.year || parts.year || nowYear + 10);
  const yearOptions = useMemo(
    () => getYearOptions({ startYear, endYear, descending: yearOrder !== "asc" }),
    [endYear, startYear, yearOrder]
  );
  const monthOptions = useMemo(() => MONTH_OPTIONS.filter(option => {
    if (!selectedYear) return true;
    if (Number(minParts.year || 0) === selectedYear && option.value < minParts.month) return false;
    if (Number(maxParts.year || 0) === selectedYear && option.value > maxParts.month) return false;
    return true;
  }), [maxParts.month, maxParts.year, minParts.month, minParts.year, selectedYear]);

  const updateParts = useCallback((nextParts) => {
    const normalized = { ...parts, ...nextParts };
    const normalizedValue = buildMonthValue(normalized);
    setParts(normalized);
    if (!normalized.month || !normalized.year) {
      onChange?.("");
      return;
    }
    if (min && normalizedValue < min) {
      onChange?.("");
      return;
    }
    if (max && normalizedValue > max) {
      onChange?.("");
      return;
    }
    onChange?.(normalizedValue);
  }, [max, min, onChange, parts]);

  if (useNativePicker) {
    return (
      <Input
        type="month"
        value={value || ""}
        min={min || undefined}
        max={max || undefined}
        onChange={event => onChange?.(event.target.value)}
      />
    );
  }

  return (
    <div className="desktop-grid-2">
      <Select value={parts.month} onChange={event => updateParts({ month: event.target.value })}>
        <option value="">{allowEmpty ? "Month" : "Select month"}</option>
        {monthOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Select value={parts.year} onChange={event => updateParts({ year: event.target.value })}>
        <option value="">{allowEmpty ? "Year" : "Select year"}</option>
        {yearOptions.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function Toggle({ value, onChange, options = [] }) {
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

export function Skeleton({ width = "100%", height = 14, radius = 10, style }) {
  return <div className="skeleton shimmer" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SectionSkeleton({ rows = 3, showHero = true }) {
  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      {showHero && (
        <div className="section-hero">
          <Skeleton width="42%" height={12} style={{ marginBottom: 12 }} />
          <Skeleton width="58%" height={44} radius={16} />
          <Skeleton width="36%" height={12} style={{ marginTop: 12 }} />
        </div>
      )}
      <div style={{ padding: "20px 18px 0" }}>
        <div className="card" style={{ padding: 18 }}>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: index === rows - 1 ? "none" : "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <Skeleton width={index % 2 === 0 ? "58%" : "46%"} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width={index % 2 === 0 ? "34%" : "42%"} height={11} />
              </div>
              <Skeleton width={72} height={18} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      <div className="section-hero">
        <Skeleton width="44%" height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="56%" height={46} radius={16} />
        <Skeleton width="38%" height={12} style={{ marginTop: 12 }} />
      </div>
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card" style={{ padding: 18 }}>
              <Skeleton width="42%" height={10} style={{ marginBottom: 12 }} />
              <Skeleton width="64%" height={24} style={{ marginBottom: 10 }} />
              <Skeleton width="78%" height={11} />
            </div>
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ marginBottom: 22 }}>
            <Skeleton width="28%" height={10} style={{ marginBottom: 10 }} />
            <div className="card" style={{ padding: 18 }}>
              {Array.from({ length: index === 1 ? 1 : 3 }).map((__, rowIndex) => (
                <div key={rowIndex} style={{ padding: "10px 0", borderBottom: rowIndex === 2 || index === 1 ? "none" : "1px solid var(--border)" }}>
                  <Skeleton width={index === 1 ? "100%" : rowIndex % 2 === 0 ? "72%" : "58%"} height={index === 1 ? 120 : 14} style={{ marginBottom: index === 1 ? 0 : 8 }} />
                  {index !== 1 && <Skeleton width="38%" height={11} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, accentColor = "var(--accent)" }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-orb" style={{ background: `${accentColor}22`, color: accentColor }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, maxWidth: 260 }}>{message}</div>
      {actionLabel && onAction && (
        <button className="btn-secondary" style={{ marginTop: 16, padding: "10px 16px", color: accentColor, borderColor: `${accentColor}44` }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function PaginatedListControls({
  totalItems = 0,
  page = 1,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "items"
}) {
  const safePageSize = Math.max(1, Number(pageSize) || 25);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const to = Math.min(totalItems, safePage * safePageSize);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
        {from}-{to} of {totalItems} {itemLabel}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Select value={String(safePageSize)} onChange={event => onPageSizeChange?.(Number(event.target.value))} style={{ marginBottom: 0, minWidth: 78 }}>
          {pageSizeOptions.map(option => (
            <option key={option} value={option}>{option} / page</option>
          ))}
        </Select>
        <button className="btn-secondary" type="button" style={{ padding: "7px 10px", fontSize: 12 }} disabled={safePage <= 1} onClick={() => onPageChange?.(safePage - 1)}>
          Prev
        </button>
        <span style={{ fontSize: 12, color: "var(--text-sec)", minWidth: 72, textAlign: "center" }}>
          Page {safePage}/{totalPages}
        </span>
        <button className="btn-secondary" type="button" style={{ padding: "7px 10px", fontSize: 12 }} disabled={safePage >= totalPages} onClick={() => onPageChange?.(safePage + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function UpgradeModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <Modal title={title || "Upgrade Required"} onClose={onClose} onSave={onClose} saveLabel="Close" accentColor="var(--gold)">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Premium Feature</div>
        <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.7 }}>
          {message || "This feature is not available on your current plan. Contact admin to upgrade your account."}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13 }}>
          Subscription access is assigned manually by admin during testing.
        </div>
      </div>
    </Modal>
  );
}

export function ToastNotice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;

    const timeout = window.setTimeout(() => {
      onClose?.();
    }, 4200);

    return () => window.clearTimeout(timeout);
  }, [notice, onClose]);

  if (!notice) return null;

  const tone = notice.tone || "danger";
  const palette = {
    success: {
      border: "var(--accent)",
      background: "var(--accent-deep)",
      text: "var(--accent)"
    },
    warning: {
      border: "var(--gold)",
      background: "var(--gold-deep)",
      text: "var(--gold)"
    },
    danger: {
      border: "var(--danger)",
      background: "var(--danger-deep)",
      text: "var(--danger)"
    },
    info: {
      border: "var(--blue)",
      background: "var(--blue-deep)",
      text: "var(--blue)"
    }
  }[tone] || {
    border: "var(--danger)",
    background: "var(--danger-deep)",
    text: "var(--danger)"
  };

  return createPortal(
    <div style={{ position: "fixed", left: 16, right: 16, bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)", zIndex: 2200, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ width: "min(560px, 100%)", pointerEvents: "auto", borderRadius: 16, border: `1px solid ${palette.border}55`, background: palette.background, boxShadow: "0 18px 40px rgba(0,0,0,0.28)", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: 999, marginTop: 6, background: palette.border, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {notice.title && <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 4 }}>{notice.title}</div>}
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{notice.message}</div>
        </div>
        <button onClick={() => onClose?.()} style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

export function MonthNav({ year, month, onChange, viewMode = "month", onViewModeChange }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;

  const prev = () => {
    if (viewMode === "month") {
      let nextMonth = month - 1;
      let nextYear = year;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      }
      onChange(nextYear, nextMonth);
    } else {
      onChange(year - 1, month);
    }
  };

  const next = () => {
    if (viewMode === "month") {
      // Prevent navigating to future months
      if (isCurrentMonth) return;
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      onChange(nextYear, nextMonth);
    } else {
      if (year === currentYear) return; // Don't allow future years
      onChange(year + 1, month);
    }
  };

  const isCurrentYear = year === currentYear;
  const isYearDisabled = viewMode === "year" && isCurrentYear;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={prev}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--surface-high)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s"
        }}
      >
        {"◀"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--text)", minWidth: viewMode === "month" ? 84 : 40, textAlign: "center", fontWeight: 600 }}>
          {viewMode === "month" ? `${MONTHS[month]} ${year}` : year}
        </span>
        <div style={{ display: "flex", background: "var(--surface-high)", borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => onViewModeChange?.("month")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: viewMode === "month" ? 700 : 500,
              color: viewMode === "month" ? "var(--text)" : "var(--text-dim)",
              background: viewMode === "month" ? "var(--surface)" : "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Month
          </button>
          <button
            onClick={() => onViewModeChange?.("year")}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: viewMode === "year" ? 700 : 500,
              color: viewMode === "year" ? "var(--text)" : "var(--text-dim)",
              background: viewMode === "year" ? "var(--surface)" : "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Year
          </button>
        </div>
      </div>

      <button
        onClick={next}
        disabled={isCurrentMonth && viewMode === "month" || isYearDisabled}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: (isCurrentMonth && viewMode === "month" || isYearDisabled) ? "var(--surface-high)44" : "var(--surface-high)",
          border: "1px solid var(--border)",
          color: (isCurrentMonth && viewMode === "month" || isYearDisabled) ? "var(--text-dim)" : "var(--text)",
          fontSize: 15,
          cursor: (isCurrentMonth && viewMode === "month" || isYearDisabled) ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: (isCurrentMonth && viewMode === "month" || isYearDisabled) ? 0.5 : 1,
          transition: "all 0.2s"
        }}
      >
        {"▶"}
      </button>
    </div>
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
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(normalizedSearch) || currency.code.toLowerCase().includes(normalizedSearch)
  ), [normalizedSearch]);
  const handleSelectCurrency = useCallback((currency) => {
    onSelect?.(currency);
  }, [onSelect]);

  return (
    <Modal title="Select Currency" onClose={onClose} onSave={onClose} saveLabel="Done">
      <Input placeholder="Search currencies..." value={search} onChange={event => setSearch(event.target.value)} style={{ marginBottom: 16 }} />
      <div className="card">
        {filtered.map(currency => {
          const active = value?.code === currency.code;
          return (
            <div
              key={currency.code}
              onClick={() => handleSelectCurrency(currency)}
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

export function SubscriptionBanner({ title, message, onClose }) {
  const [showBanner, setShowBanner] = useState(true);
  if (!showBanner) return null;
  return (
    <div className="subscription-banner">
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, maxWidth: 260 }}>{message}</div>
      <button className="close-banner" onClick={() => setShowBanner(false)}>×</button>
    </div>
  );
}

// On relogin or page refresh, reset showBanner to true
// ...existing code...
