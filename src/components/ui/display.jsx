import React, { useCallback, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { avatarColor, initials, CURRENCIES, MONTHS } from "./utils";
import { Modal } from "./modal";
import { Input, Select } from "./inputs";

export function Avatar({ name, size = 40, fontSize = 14 }) {
  return (
    <div className="avatar-circle" style={{ width: size, height: size, fontSize, background: avatarColor(name), color: "#0C0C10" }}>
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ pct, color }) {
  return (
    <div className="progress-bar-track">
      <motion.div
        className="progress-bar-fill"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct || 0)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
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

export function MonthNav({ year, month, onChange, viewMode = "month", onViewModeChange }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isCurrentYear = year === currentYear;
  const isYearDisabled = viewMode === "year" && isCurrentYear;

  const prev = () => {
    if (viewMode === "month") {
      let nextMonth = month - 1;
      let nextYear = year;
      if (nextMonth < 0) { nextMonth = 11; nextYear -= 1; }
      onChange(nextYear, nextMonth);
    } else {
      onChange(year - 1, month);
    }
  };

  const next = () => {
    if (viewMode === "month") {
      if (isCurrentMonth) return;
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
      onChange(nextYear, nextMonth);
    } else {
      if (year === currentYear) return;
      onChange(year + 1, month);
    }
  };

  const navBtnStyle = (disabled) => ({
    width: 28,
    height: 28,
    borderRadius: 8,
    background: disabled ? "var(--surface-high)44" : "var(--surface-high)",
    border: "1px solid var(--border)",
    color: disabled ? "var(--text-dim)" : "var(--text)",
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.5 : 1,
    transition: "all var(--transition-fast)"
  });

  const nextDisabled = (isCurrentMonth && viewMode === "month") || isYearDisabled;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={prev} style={navBtnStyle(false)}>{"◀"}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--text)", minWidth: viewMode === "month" ? 84 : 40, textAlign: "center", fontWeight: 600 }}>
          {viewMode === "month" ? `${MONTHS[month]} ${year}` : year}
        </span>
        <div style={{ display: "flex", background: "var(--surface-high)", borderRadius: 8, padding: 3 }}>
          {["month", "year"].map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange?.(mode)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: viewMode === mode ? 700 : 500,
                color: viewMode === mode ? "var(--text)" : "var(--text-dim)",
                background: viewMode === mode ? "var(--surface)" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                textTransform: "capitalize"
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <button onClick={next} disabled={nextDisabled} style={navBtnStyle(nextDisabled)}>{"▶"}</button>
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
        {from}–{to} of {totalItems} {itemLabel}
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

export function DeleteBtn({ onDelete }) {
  return (
    <motion.button
      className="delete-btn"
      onClick={onDelete}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.1 }}
    >
      ✕
    </motion.button>
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
      <Input placeholder="Search currencies…" value={search} onChange={event => setSearch(event.target.value)} style={{ marginBottom: 16 }} />
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
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#0C0C10", fontWeight: 800 }}>
                    ✓
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

/**
 * Button that automatically manages loading state for async onClick handlers.
 * Disables and shows a spinner while the async operation runs.
 */
export function LoadingButton({ onClick, children, className = "btn-primary", style, disabled, loadingLabel, ...props }) {
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleClick = useCallback(async (e) => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      await Promise.resolve(onClick?.(e));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [disabled, isLoading, onClick]);

  return (
    <motion.button
      className={className}
      style={style}
      onClick={handleClick}
      disabled={isLoading || disabled}
      whileTap={!isLoading && !disabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <span className="btn-spinner" />
          {loadingLabel || "Loading…"}
        </span>
      ) : children}
    </motion.button>
  );
}
