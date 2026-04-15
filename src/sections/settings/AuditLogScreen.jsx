import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { fmtMoney, MONTHS } from "../../components/UI";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

const TYPE_META = {
  income:   { label: "Income",   color: "var(--accent)",  dot: "var(--accent)" },
  expense:  { label: "Expense",  color: "var(--danger)",  dot: "var(--danger)" },
  invoice:  { label: "Invoice",  color: "var(--blue)",    dot: "var(--blue)" }
};

export default function AuditLogScreen({ onBack }) {
  const data = useData();
  const sym = data.currency?.symbol || "Rs";
  const [filterType, setFilterType] = useState("all");
  const [filterUser, setFilterUser] = useState("all");

  const allEntries = useMemo(() => {
    const income = (data.income || []).map(r => ({ ...r, _type: "income" }));
    const expenses = (data.expenses || []).map(r => ({ ...r, _type: "expense" }));
    const invoices = (data.invoices || []).map(r => ({ ...r, _type: "invoice" }));
    return [...income, ...expenses, ...invoices]
      .filter(r => r.createdAt)
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [data.income, data.expenses, data.invoices]);

  const uniqueUsers = useMemo(() => {
    const seen = new Map();
    allEntries.forEach(r => {
      if (r.createdBy && !seen.has(r.createdBy)) {
        seen.set(r.createdBy, r.createdByName || r.createdBy);
      }
    });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [allEntries]);

  const filtered = useMemo(() => {
    return allEntries.filter(r => {
      if (filterType !== "all" && r._type !== filterType) return false;
      if (filterUser !== "all" && r.createdBy !== filterUser) return false;
      return true;
    }).slice(0, 200);
  }, [allEntries, filterType, filterUser]);

  const hasAuditData = allEntries.length > 0;

  function getEntryLabel(r) {
    if (r._type === "income")  return r.label || r.description || "Income entry";
    if (r._type === "expense") return r.label || r.category  || "Expense entry";
    if (r._type === "invoice") return r.number || r.clientName || "Invoice";
    return "Entry";
  }

  function getEntryAmount(r) {
    if (r._type === "invoice") {
      const total = r.items?.reduce((s, item) => s + Number(item.total || item.amount || 0), 0) || r.total || 0;
      return fmtMoney(total, sym);
    }
    return fmtMoney(r.amount || 0, sym);
  }

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 0", marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
        >
          ‹
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Audit Log</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Who added what and when</div>
        </div>
      </div>

      <div style={{ padding: "0 18px" }}>
        {!hasAuditData ? (
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
              Audit data is recorded for all new entries going forward.<br />
              Existing entries added before this feature was enabled will not have an audit trail.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="input-field"
                style={{ padding: "7px 10px", fontSize: 12, width: "auto" }}
              >
                <option value="all">All types</option>
                <option value="income">Income only</option>
                <option value="expense">Expenses only</option>
                <option value="invoice">Invoices only</option>
              </select>
              {uniqueUsers.length > 1 && (
                <select
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="input-field"
                  style={{ padding: "7px 10px", fontSize: 12, width: "auto" }}
                >
                  <option value="all">All members</option>
                  {uniqueUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
              <div style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", marginLeft: 4 }}>
                {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
              </div>
            </div>

            <div className="card">
              {filtered.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
                  No entries match this filter.
                </div>
              ) : (
                filtered.map((r, index) => {
                  const meta = TYPE_META[r._type] || TYPE_META.income;
                  return (
                    <div
                      key={r.id || index}
                      className="card-row"
                      style={{ alignItems: "flex-start", gap: 12 }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: meta.dot, flexShrink: 0, marginTop: 6 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                            {getEntryLabel(r)}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, flexShrink: 0 }}>
                            {getEntryAmount(r)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 6, background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color, fontWeight: 700 }}>
                            {meta.label}
                          </span>
                          {r.date && (
                            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                              {fmtDateShort(r.date)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                          Added by <span style={{ color: "var(--text-sec)", fontWeight: 600 }}>{r.createdByName || r.createdBy || "Unknown"}</span>
                          {" · "}
                          {fmtDate(r.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
