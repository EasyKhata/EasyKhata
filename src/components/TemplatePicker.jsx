import React from "react";
import { INVOICE_TEMPLATES, REPORT_TEMPLATES } from "../utils/pdfThemes";

function rgb(arr) {
  return `rgb(${arr[0]},${arr[1]},${arr[2]})`;
}

function InvoicePreview({ theme }) {
  const isMinimal = theme.layout === "minimal";
  const accent = rgb(theme.headerBg);
  return (
    <div style={{ width: 68, height: 90, background: "#fff", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
      {isMinimal ? (
        <>
          <div style={{ background: accent, height: 3 }} />
          <div style={{ padding: "5px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ width: 30, height: 4, background: accent, borderRadius: 1, opacity: 0.85 }} />
              <div style={{ width: 20, height: 3, background: accent, borderRadius: 1, opacity: 0.3 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
              <div style={{ width: 22, height: 4, background: "#2a2a32", borderRadius: 1, opacity: 0.7 }} />
              <div style={{ width: 16, height: 3, background: "#aaa", borderRadius: 1, opacity: 0.5 }} />
            </div>
          </div>
          <div style={{ margin: "5px 3px 0", borderTop: `1px solid ${accent}`, opacity: 0.2 }} />
          <div style={{ display: "flex", gap: 2, padding: "4px 3px 0" }}>
            <div style={{ flex: 1, height: 9, border: `0.8px solid ${accent}`, borderRadius: 2, opacity: 0.7 }} />
            <div style={{ flex: 1, height: 9, border: `0.8px solid ${accent}`, borderRadius: 2, opacity: 0.7 }} />
          </div>
          <div style={{ margin: "5px 3px 0", borderBottom: `1px solid ${rgb(theme.tableHeaderBg)}`, paddingBottom: 2, display: "flex", gap: 3 }}>
            <div style={{ flex: 2, height: 3, background: rgb(theme.tableHeaderBg), borderRadius: 1, opacity: 0.6 }} />
            <div style={{ flex: 1, height: 3, background: rgb(theme.tableHeaderBg), borderRadius: 1, opacity: 0.6 }} />
          </div>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ margin: "2px 3px 0", height: 3, background: "transparent" }} />
          ))}
          <div style={{ margin: "4px 3px 0", display: "flex", justifyContent: "flex-end", gap: 3, alignItems: "center" }}>
            <div style={{ width: 16, height: 3, background: "#aaa", borderRadius: 1, opacity: 0.5 }} />
            <div style={{ width: 22, height: 4, background: accent, borderRadius: 1, opacity: 0.8 }} />
          </div>
        </>
      ) : (
        <>
          <div style={{ background: rgb(theme.headerBg), height: 17 }} />
          <div style={{ display: "flex", gap: 2, padding: "3px 3px 0" }}>
            <div style={{ flex: 1, height: 9, background: rgb(theme.infoBg), borderRadius: 2 }} />
            <div style={{ flex: 1, height: 9, background: rgb(theme.infoBg), borderRadius: 2 }} />
          </div>
          <div style={{ padding: "2px 3px 0" }}>
            <div style={{ height: 7, background: rgb(theme.billToBg), borderRadius: 2 }} />
          </div>
          <div style={{ margin: "3px 3px 0", background: rgb(theme.tableHeaderBg), height: 6, borderRadius: 1 }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ margin: "1.5px 3px 0", height: 4, background: i % 2 === 0 ? rgb(theme.rowAltBg) : "transparent", borderRadius: 1 }} />
          ))}
          <div style={{ margin: "4px 3px 0", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 28, height: 7, background: rgb(theme.totalBg), borderRadius: 2 }} />
          </div>
        </>
      )}
    </div>
  );
}

function ReportPreview({ theme }) {
  return (
    <div style={{ width: 68, height: 90, background: "#fff", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
      <div style={{ background: rgb(theme.header), height: 19 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 4px 0" }}>
        <div style={{ width: 3, height: 7, background: rgb(theme.header), borderRadius: 2 }} />
        <div style={{ height: 3, flex: 1, background: rgb(theme.row), borderRadius: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 2, padding: "3px 4px 0" }}>
        {[0, 1].map(i => (
          <div key={i} style={{ flex: 1, height: 14, background: rgb(theme.row), borderRadius: 2, borderLeft: `3px solid ${rgb(theme.header)}` }} />
        ))}
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ margin: "2px 4px 0", height: 4, background: i % 2 === 0 ? rgb(theme.row) : "transparent", borderRadius: 1 }} />
      ))}
    </div>
  );
}

export default function TemplatePicker({ type = "invoice", selected, onChange }) {
  const templates = type === "report" ? REPORT_TEMPLATES : INVOICE_TEMPLATES;

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {templates.map(t => {
        const isSelected = selected === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div style={{
              borderRadius: 7,
              padding: 3,
              border: `2.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
              background: isSelected ? "color-mix(in srgb, var(--accent) 6%, var(--surface-high))" : "var(--surface-high)",
              transition: "border-color 0.15s",
            }}>
              {type === "report"
                ? <ReportPreview theme={t} />
                : <InvoicePreview theme={t} />}
            </div>
            <div style={{ fontSize: 10, fontWeight: isSelected ? 800 : 600, color: isSelected ? "var(--accent)" : "var(--text-sec)" }}>
              {t.name}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: -3 }}>
              {t.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
