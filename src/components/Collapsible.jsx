import React, { useState } from "react";

/**
 * Collapsible - Compact disclosure component for reducing screen space
 * Used for alerts, budgets, payment details, etc.
 */
export default function Collapsible({
  title,
  count,
  defaultOpen = false,
  children,
  icon = "📋",
  color = "var(--text)",
  onToggle
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onToggle?.(!isOpen);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={handleToggle}
        style={{
          width: "100%",
          background: "var(--surface-high)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontFamily: "var(--font)",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--text)",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "var(--surface)";
          e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "var(--surface-high)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div style={{ textAlign: "left" }}>
            <div>{title}</div>
            {count !== undefined && (
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400, marginTop: 2 }}>
                {count} item{count !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 16,
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: 8,
            animation: "slideDown 0.2s ease-out"
          }}
        >
          {children}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
