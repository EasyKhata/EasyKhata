import React, { useRef, useState } from "react";
import { uid } from "../../components/UI";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsvLine(line = "") {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text = "") {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    .split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
  const rows = lines.slice(1).map((line, i) => {
    const vals = parseCsvLine(line);
    const rec = {};
    headers.forEach((h, ci) => { rec[h] = String(vals[ci] || "").trim(); });
    return { rowNumber: i + 2, raw: rec };
  });
  return { headers, rows };
}

function isValidDate(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "").trim()) && !isNaN(Date.parse(v));
}

function csvBlob(rows) {
  return new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
}

function downloadTemplate(filename, rows) {
  const url = URL.createObjectURL(csvBlob(rows));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Templates ────────────────────────────────────────────────────────────────

const INCOME_TEMPLATE = [
  "date,amount,description,category,client_name",
  "2024-01-15,25000,Website project payment,Project,Rajesh Kumar",
  "2024-01-20,12000,Monthly retainer,Retainer,ABC Corp",
];

const EXPENSE_TEMPLATE = [
  "date,amount,description,category,client_name,billable",
  "2024-01-10,2500,Cloud hosting,Tools,ABC Corp,Yes",
  "2024-01-12,800,Office supplies,Office,,No",
];

const INVOICE_TEMPLATE = [
  "customer_name,date,amount,due_date,status,invoice_number,description",
  "Rajesh Kumar,2024-01-15,25000,2024-01-30,paid,INV-001,Website development",
  "ABC Corp,2024-01-20,12000,2024-02-20,pending,INV-002,Monthly retainer",
];

// ─── Validators ───────────────────────────────────────────────────────────────

function validateIncomeRow({ raw }, i) {
  const errors = [];
  if (!isValidDate(raw.date)) errors.push(`Row ${i + 2}: invalid date (use YYYY-MM-DD)`);
  if (!raw.amount || isNaN(Number(raw.amount)) || Number(raw.amount) <= 0) errors.push(`Row ${i + 2}: amount must be a positive number`);
  if (!String(raw.description || "").trim()) errors.push(`Row ${i + 2}: description is required`);
  return errors;
}

function validateExpenseRow({ raw }, i) {
  const errors = [];
  if (!isValidDate(raw.date)) errors.push(`Row ${i + 2}: invalid date (use YYYY-MM-DD)`);
  if (!raw.amount || isNaN(Number(raw.amount)) || Number(raw.amount) <= 0) errors.push(`Row ${i + 2}: amount must be a positive number`);
  if (!String(raw.description || "").trim()) errors.push(`Row ${i + 2}: description is required`);
  return errors;
}

function validateInvoiceRow({ raw }, i) {
  const errors = [];
  if (!String(raw.customer_name || "").trim()) errors.push(`Row ${i + 2}: customer_name is required`);
  if (!isValidDate(raw.date)) errors.push(`Row ${i + 2}: invalid date (use YYYY-MM-DD)`);
  if (!raw.amount || isNaN(Number(raw.amount)) || Number(raw.amount) <= 0) errors.push(`Row ${i + 2}: amount must be a positive number`);
  if (raw.due_date && !isValidDate(raw.due_date)) errors.push(`Row ${i + 2}: due_date must be YYYY-MM-DD or empty`);
  return errors;
}

// ─── Row builders ─────────────────────────────────────────────────────────────

function buildIncomeRow({ raw }) {
  const date = raw.date;
  return {
    description: raw.description,
    source: raw.description,
    label: raw.description,
    amount: Number(raw.amount),
    category: raw.category || "Other",
    date,
    month: date.slice(0, 7),
    clientName: raw.client_name || "",
  };
}

function buildExpenseRow({ raw }) {
  const date = raw.date;
  return {
    label: raw.description,
    amount: Number(raw.amount),
    category: raw.category || "Other",
    date,
    month: date.slice(0, 7),
    note: "",
    recurring: false,
    clientName: raw.client_name || "",
    billable: raw.billable || "No",
    teamMemberName: "",
    partnerName: "",
    startMonth: "",
    endDate: "",
    endMonth: "",
  };
}

let invoiceCounter = 1;
function buildInvoiceRow({ raw }, existingInvoices = []) {
  const date = raw.date;
  const statusRaw = String(raw.status || "pending").toLowerCase();
  const status = ["paid", "pending", "sent", "draft"].includes(statusRaw) ? statusRaw : "pending";
  const number = raw.invoice_number || `IMP-${String(invoiceCounter++).padStart(3, "0")}`;
  const amount = Number(raw.amount);
  return {
    number,
    documentType: "invoice",
    customerId: "",
    billTo: {
      name: raw.customer_name,
      phone: "",
      addressLine: "",
      city: "",
      state: "",
      country: "India",
      location: "",
      address: "",
      gstin: "",
    },
    shipTo: null,
    shipSameAsBill: true,
    date,
    dueDate: raw.due_date || "",
    status,
    paidDate: status === "paid" ? (raw.due_date || date) : "",
    taxMode: "split",
    placeOfSupply: "",
    items: [{ id: uid(), desc: raw.description || "Imported item", subDesc: "", hsn: "", qty: 1, rate: amount, taxRate: 0 }],
    notes: "",
    terms: "",
    currencyCode: "INR",
    currencySymbol: "₹",
  };
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "income",   label: "Payments / Income",  color: "var(--jade)" },
  { key: "expenses", label: "Spends / Expenses",   color: "var(--ember)" },
  { key: "invoices", label: "Invoices",             color: "var(--blue)" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessImportScreen({ onClose, addIncome, addExpense, addInvoice, invoices = [], currency }) {
  const [tab, setTab] = useState("income");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null);
  const fileRef = useRef(null);

  const activeTab = TABS.find(t => t.key === tab);
  const sym = currency?.symbol || "₹";

  function reset() {
    setCsvText("");
    setPreview(null);
    setDone(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function switchTab(key) {
    setTab(key);
    reset();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => buildPreview(String(ev.target?.result || ""));
    reader.readAsText(file);
  }

  function buildPreview(text) {
    setCsvText(text);
    const { rows } = parseCsv(text);
    const errors = [];
    const valid = [];

    rows.forEach((row, i) => {
      let rowErrors = [];
      if (tab === "income") rowErrors = validateIncomeRow(row, i);
      else if (tab === "expenses") rowErrors = validateExpenseRow(row, i);
      else rowErrors = validateInvoiceRow(row, i);
      if (rowErrors.length) errors.push(...rowErrors);
      else valid.push(row);
    });

    setPreview({ total: rows.length, valid, errors });
    setDone(null);
  }

  function doImport() {
    if (!preview?.valid?.length) return;
    setImporting(true);
    invoiceCounter = (invoices?.length || 0) + 1;
    try {
      preview.valid.forEach(row => {
        if (tab === "income") addIncome?.(buildIncomeRow(row));
        else if (tab === "expenses") addExpense?.(buildExpenseRow(row));
        else addInvoice?.(buildInvoiceRow(row, invoices));
      });
      setDone(preview.valid.length);
      setPreview(null);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setImporting(false);
    }
  }

  function dlTemplate() {
    if (tab === "income") downloadTemplate("income-template.csv", INCOME_TEMPLATE);
    else if (tab === "expenses") downloadTemplate("expenses-template.csv", EXPENSE_TEMPLATE);
    else downloadTemplate("invoices-template.csv", INVOICE_TEMPLATE);
  }

  const accentColor = activeTab?.color || "var(--accent)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: 4 }}>
          ‹ Back
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Import Data</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Import from CSV</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", marginBottom: 14 }}>Export from your POS or website and import here. Download the template to see the required format.</div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {TABS.map(t => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                style={{
                  flex: 1, padding: "9px 6px", borderRadius: 12, border: `1px solid ${active ? `color-mix(in srgb, ${t.color} 40%, var(--border))` : "var(--border)"}`,
                  background: active ? `color-mix(in srgb, ${t.color} 14%, var(--surface-high))` : "var(--surface-high)",
                  color: active ? t.color : "var(--text-dim)", fontSize: 11, fontWeight: 800, cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 24px" }}>

        {/* Success state */}
        {done !== null && (
          <div style={{ padding: "20px 16px", borderRadius: 14, background: "color-mix(in srgb, var(--jade) 12%, var(--surface-high))", border: "1px solid color-mix(in srgb, var(--jade) 30%, var(--border))", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--jade)" }}>Imported {done} record{done !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 4 }}>Your data has been added. Import another file or go back.</div>
            <button onClick={reset} style={{ marginTop: 14, background: "var(--jade)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Import Another</button>
          </div>
        )}

        {done === null && (
          <>
            {/* Template + Upload */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <button
                onClick={dlTemplate}
                style={{ flex: 1, padding: "12px 10px", borderRadius: 12, border: "1.5px dashed var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                ↓ Download Template
              </button>
              <label style={{ flex: 1 }}>
                <div style={{ padding: "12px 10px", borderRadius: 12, border: `1.5px solid ${accentColor}`, background: `color-mix(in srgb, ${accentColor} 10%, var(--surface-high))`, color: accentColor, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center" }}>
                  ↑ Upload CSV
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleFile} />
              </label>
            </div>

            {/* Required columns hint */}
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-high)", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>Required columns</div>
              <div style={{ fontSize: 11, color: "var(--text-sec)", fontFamily: "monospace" }}>
                {tab === "income" && "date · amount · description"}
                {tab === "expenses" && "date · amount · description"}
                {tab === "invoices" && "customer_name · date · amount"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                {tab === "income" && "Optional: category, client_name"}
                {tab === "expenses" && "Optional: category, client_name, billable"}
                {tab === "invoices" && "Optional: due_date, status, invoice_number, description"}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div>
                {/* Summary row */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Total rows", value: preview.total, color: "var(--text)" },
                    { label: "Valid", value: preview.valid.length, color: "var(--jade)" },
                    { label: "Errors", value: preview.errors.length, color: preview.errors.length ? "var(--danger)" : "var(--text-dim)" },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, background: "var(--surface-high)", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Errors */}
                {preview.errors.length > 0 && (
                  <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 10, background: "color-mix(in srgb, var(--danger) 8%, var(--surface-high))", border: "1px solid color-mix(in srgb, var(--danger) 20%, var(--border))" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--danger)", marginBottom: 6 }}>Issues found ({preview.errors.length})</div>
                    {preview.errors.slice(0, 5).map((e, i) => (
                      <div key={i} style={{ fontSize: 11, color: "var(--danger)", marginBottom: 2 }}>• {e}</div>
                    ))}
                    {preview.errors.length > 5 && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>+{preview.errors.length - 5} more issues</div>}
                  </div>
                )}

                {/* Valid rows preview */}
                {preview.valid.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>Preview (first 5 valid rows)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {preview.valid.slice(0, 5).map((row, i) => {
                        const r = row.raw;
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface-high)", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 18, flexShrink: 0 }}>
                              {tab === "income" ? "↑" : tab === "expenses" ? "↓" : "📄"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.description || r.customer_name || "—"}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-sec)" }}>
                                {r.date}{r.category ? ` · ${r.category}` : ""}{r.client_name ? ` · ${r.client_name}` : ""}{r.customer_name && tab === "invoices" ? ` · ${r.customer_name}` : ""}
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: tab === "income" ? "var(--jade)" : tab === "expenses" ? "var(--ember)" : "var(--blue)", flexShrink: 0 }}>
                              {sym}{Number(r.amount || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        );
                      })}
                      {preview.valid.length > 5 && (
                        <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: "6px 0" }}>
                          +{preview.valid.length - 5} more valid rows
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Import button */}
                {preview.valid.length > 0 && (
                  <button
                    onClick={doImport}
                    disabled={importing}
                    style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: accentColor, color: "#fff", fontSize: 15, fontWeight: 800, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1 }}
                  >
                    {importing ? "Importing…" : `Import ${preview.valid.length} Record${preview.valid.length !== 1 ? "s" : ""} →`}
                  </button>
                )}
                {preview.valid.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--danger)", fontWeight: 700, textAlign: "center", padding: "12px 0" }}>
                    No valid rows to import. Fix the errors above and re-upload.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
