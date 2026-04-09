import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  FAB,
  DeleteBtn,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  Avatar,
  EmptyState,
  SectionSkeleton
} from "../components/UI";
import { getInvoiceStatus, invoiceGrandTotal } from "../utils/analytics";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { getOrgConfig } from "../utils/orgTypes";

function buildBlankForm(year, month, config) {
  const base = {
    label: "",
    amount: "",
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    note: ""
  };

  (config.incomeFields || []).forEach(field => {
    base[field.key] = field.type === "select" ? field.options?.[0] || "" : "";
  });

  return base;
}

function renderDynamicField(field, value, onChange) {
  const commonProps = {
    value: value || "",
    onChange: event => onChange(event.target.value),
    placeholder: field.placeholder || ""
  };

  if (field.type === "select") {
    return (
      <Select {...commonProps}>
        {(field.options || []).map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "textarea") {
    return <Textarea {...commonProps} />;
  }

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "0.01" : undefined} />;
}

export default function IncomeSection({ year, month, orgType }) {
  const d = useData();
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(buildBlankForm(year, month, config));
  const [formError, setFormError] = useState("");

  const invIncome = config.hideInvoices ? [] : d.invoices.filter(invoice => getInvoiceStatus(invoice) === "paid" && invoice.paidDate?.slice(0, 7) === mk);
  const manualIncome = d.income.filter(item => item.month === mk);
  const totalInv = invIncome.reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0);
  const totalManual = manualIncome.reduce((sum, item) => sum + Number(item.amount), 0);

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
    setFormError("");
    setShowForm(true);
  }

  function openEdit(income) {
    const next = buildBlankForm(year, month, config);
    next.label = income.label || "";
    next.amount = String(income.amount ?? "");
    next.date = income.date || next.date;
    next.note = income.note || "";
    (config.incomeFields || []).forEach(field => {
      next[field.key] = income[field.key] || (field.type === "select" ? field.options?.[0] || "" : "");
    });
    setEditId(income.id);
    setForm(next);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
    setFormError("");
  }

  function save() {
    if (!hasMinLength(form.label, 2)) {
      setFormError(`Add a clear ${config.incomeEntryLabel.toLowerCase()} description so you can recognize it later.`);
      return;
    }
    if (!isPositiveAmount(form.amount)) {
      setFormError("Enter an amount greater than 0.");
      return;
    }
    if (!isValidDateValue(form.date)) {
      setFormError(`Choose the date when this ${config.incomeEntryLabel.toLowerCase()} was received.`);
      return;
    }

    const payload = {
      label: form.label.trim(),
      amount: Number(form.amount),
      date: form.date,
      month: form.date.slice(0, 7),
      note: form.note.trim()
    };

    (config.incomeFields || []).forEach(field => {
      payload[field.key] = String(form[field.key] || "").trim();
    });

    if (editId) d.updateIncome({ ...payload, id: editId });
    else d.addIncome(payload);

    closeForm();
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Total {config.incomeLabel} - {MONTHS[month]} {year}
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {!config.hideInvoices && (
          <>
            <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>From {config.invoicesLabel}</span>
              <span style={{ color: "var(--accent)" }}>{fmtMoney(totalInv, sym)}</span>
            </div>
            <div className="card" style={{ marginBottom: 22 }}>
              {invIncome.length === 0 ? (
                <EmptyState
                  title={`No ${config.invoicesLabel.toLowerCase()} collected yet`}
                  message={`Paid ${config.invoicesLabel.toLowerCase()} received this month will appear here automatically.`}
                  actionLabel={`Open ${config.invoicesLabel}`}
                  onAction={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: "invoices" }))}
                  accentColor="var(--blue)"
                />
              ) : (
                invIncome.map(invoice => (
                  <div key={invoice.id} className="card-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={invoice.customer?.name || "?"} size={34} fontSize={12} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} - Paid on {fmtDate(invoice.paidDate || invoice.date)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(invoiceGrandTotal(invoice), sym)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Manual {config.incomeLabel}</span>
          <span style={{ color: "var(--accent)" }}>{fmtMoney(totalManual, sym)}</span>
        </div>
        <div className="card">
          {manualIncome.length === 0 ? (
            <EmptyState
              title={`No ${config.incomeLabel.toLowerCase()} yet`}
              message={`Track cash, transfers, or direct ${config.incomeEntryLabel.toLowerCase()} entries here.`}
              actionLabel={config.incomeActionLabel}
              onAction={openNew}
              accentColor="var(--accent)"
            />
          ) : (
            manualIncome.map(item => (
              <div key={item.id} className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {fmtDate(item.date)}
                    {item.note ? ` - ${item.note}` : ""}
                    {(config.incomeFields || []).map(field => item[field.key] ? ` - ${item[field.key]}` : "").join("")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(item.amount, sym)}</span>
                  <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(item)}>Edit</button>
                  <DeleteBtn onDelete={() => d.removeIncome(item.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <FAB bg="var(--accent)" shadow="rgba(126,232,162,0.35)" onClick={openNew} />

      {showForm && (
        <Modal
          title={editId ? `Edit ${config.incomeEntryLabel}` : config.incomeActionLabel}
          onClose={closeForm}
          onSave={save}
          saveLabel={editId ? "Update" : "Save"}
          canSave={!!form.label.trim() && Number(form.amount) > 0}
        >
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          <Field label="Description" required>
            <Input placeholder={`e.g. ${config.incomeEntryLabel}`} value={form.label} onChange={e => setForm(current => ({ ...current, label: e.target.value }))} />
          </Field>
          <Field label={`Amount (${sym})`} required hint={`Enter the ${config.incomeEntryLabel.toLowerCase()} amount.`}>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(current => ({ ...current, amount: e.target.value }))} />
          </Field>
          <Field label="Date Received" required>
            <Input type="date" value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} />
          </Field>
          {(config.incomeFields || []).map(field => (
            <Field key={field.key} label={field.label}>
              {renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
            </Field>
          ))}
          <Field label="Note">
            <Input placeholder="Optional note" value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
