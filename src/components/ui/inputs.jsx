import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "../../utils/profile";

export function Field({ label, hint, error, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: error ? "var(--danger)" : "var(--text-sec)",
          textTransform: "uppercase",
          letterSpacing: 0.7,
          marginBottom: 8,
          display: "block",
          transition: "color var(--transition-fast)"
        }}
      >
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {error && (
        <div className="field-error">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
            <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}
      {!error && hint && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export function Input({ style, onWheel, onKeyDown, error, success, ...props }) {
  const isNumber = props.type === "number";
  const handleWheel = isNumber
    ? (e) => { e.target.blur(); onWheel?.(e); }
    : onWheel;
  const handleKeyDown = isNumber
    ? (e) => { if (["e", "E", "+"].includes(e.key)) e.preventDefault(); onKeyDown?.(e); }
    : onKeyDown;

  const extraClass = error ? " input-error" : success ? " input-success" : "";
  return (
    <input
      className={`input-field${extraClass}`}
      style={style}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export function Textarea({ style, error, success, ...props }) {
  const extraClass = error ? " input-error" : success ? " input-success" : "";
  return (
    <textarea
      className={`input-field${extraClass}`}
      style={{ minHeight: 76, resize: "vertical", ...style }}
      {...props}
    />
  );
}

export function Select({ style, children, error, success, ...props }) {
  const extraClass = error ? " input-error" : success ? " input-success" : "";
  return (
    <select className={`input-field${extraClass}`} style={{ cursor: "pointer", ...style }} {...props}>
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
      <Input
        type="tel"
        autoComplete="tel-national"
        placeholder={phonePlaceholder}
        value={phoneNumber}
        onChange={event => onPhoneNumberChange(event.target.value)}
      />
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
        <Input
          placeholder={addressPlaceholder}
          value={addressLine || ""}
          onChange={event => onAddressLineChange?.(event.target.value)}
          autoComplete="address-line1"
        />
      </Field>
      <div className="desktop-grid-2">
        <Field label={cityLabel} required={required} hint={cityHint}>
          <Input
            placeholder={cityPlaceholder}
            value={city || ""}
            onChange={event => onCityChange(event.target.value)}
            autoComplete="address-level2"
          />
        </Field>
        <Field label={countryLabel} required={required}>
          <Select value={country || "India"} onChange={event => onCountryChange(event.target.value)}>
            {COUNTRY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={stateLabel} required={required}>
        <Select value={state || ""} onChange={event => onStateChange(event.target.value)}>
          <option value="">Select state / province</option>
          {stateOptions.map(option => (
            <option key={option} value={option}>{option}</option>
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
    if (min && normalizedValue < min) { onChange?.(""); return; }
    if (max && normalizedValue > max) { onChange?.(""); return; }
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
        {dayOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </Select>
      <Select value={parts.month} onChange={event => updateParts({ month: event.target.value })}>
        <option value="">{allowEmpty ? "Month" : "Select month"}</option>
        {monthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      <Select value={parts.year} onChange={event => updateParts({ year: event.target.value })}>
        <option value="">{allowEmpty ? "Year" : "Select year"}</option>
        {yearOptions.map(option => <option key={option} value={option}>{option}</option>)}
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
    if (!normalized.month || !normalized.year) { onChange?.(""); return; }
    if (min && normalizedValue < min) { onChange?.(""); return; }
    if (max && normalizedValue > max) { onChange?.(""); return; }
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
        {monthOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </Select>
      <Select value={parts.year} onChange={event => updateParts({ year: event.target.value })}>
        <option value="">{allowEmpty ? "Year" : "Select year"}</option>
        {yearOptions.map(option => <option key={option} value={option}>{option}</option>)}
      </Select>
    </div>
  );
}
