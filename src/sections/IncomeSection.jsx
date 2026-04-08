import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, FAB, DeleteBtn, fmtMoney, fmtDate, invoiceTotal, monthKey, MONTHS, Avatar, EmptyState, SectionSkeleton } from "../components/UI";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";

const blankForm = (year, month) => ({
  label: "",
  amount: "",
  date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
  note: ""
});

export default function IncomeSection({ year, month }) {
  const d = useData();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(blankForm(year, month));
  const [formError, setFormError] = useState("");

  const invIncome = d.invoices.filter(i => i.date?.slice(0, 7) === mk);
  const manIncome = d.income.filter(i => i.month === mk);
  const totalInv = invIncome.reduce((s, i) => s + invoiceTotal(i.items), 0);
  const totalMan = manIncome.reduce((s, i) => s + Number(i.amount), 0);

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    setEditId(null);
    setForm(blankForm(year, month));
    setFormError("");
    setShowForm(true);
  }

  function openEdit(income) {
    setEditId(income.id);
    setForm({
      label: income.label || "",
      amount: String(income.amount ?? ""),
      date: income.date || `${year}-${String(month + 1).padStart(2, "0")}-01`,
      note: income.note || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(blankForm(year, month));
    setFormError("");
  }

  function save() {
    if (!hasMinLength(form.label, 2)) {
      setFormError("Add a clear income description so you can recognize it later.");
      return;
    }
    if (!isPositiveAmount(form.amount)) {
      setFormError("Enter an amount greater than 0.");
      return;
    }
    if (!isValidDateValue(form.date)) {
      setFormError("Choose the date when this income was received.");
      return;
    }

    const payload = {
      label: form.label.trim(),
      amount: Number(form.amount),
      date: form.date,
      month: form.date.slice(0, 7),
      note: form.note.trim()
    };

    if (editId) d.updateIncome({ ...payload, id: editId });
    else d.addIncome(payload);

    closeForm();
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Total Income - {MONTHS[month]} {year}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--accent)", letterSpacing: -0.5 }}>{fmtMoney(totalInv + totalMan, sym)}</div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>From Invoices</span><span style={{ color: "var(--accent)" }}>{fmtMoney(totalInv, sym)}</span>
        </div>
        <div className="card" style={{ marginBottom: 22 }}>
          {invIncome.length === 0 ? (
            <EmptyState title="No invoice income yet" message="Invoices you raise this month will appear here automatically." actionLabel="Open Invoices" onAction={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: "invoices" }))} accentColor="var(--blue)" />
          ) : (
            invIncome.map(inv => (
              <div key={inv.id} className="card-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={inv.customer?.name || "?"} size={34} fontSize={12} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{inv.customer?.name || inv.billTo?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{inv.number} - {fmtDate(inv.date)}</div>
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(invoiceTotal(inv.items), sym)}</span>
              </div>
            ))
          )}
        </div>

        <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Manual Income</span><span style={{ color: "var(--accent)" }}>{fmtMoney(totalMan, sym)}</span>
        </div>
        <div className="card">
          {manIncome.length === 0 ? (
            <EmptyState title="No manual income yet" message="Track offline payments, cash receipts, or owner deposits here." actionLabel="Add Income" onAction={openNew} accentColor="var(--accent)" />
          ) : (
            manIncome.map(i => (
              <div key={i.id} className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{i.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(i.date)}{i.note ? ` - ${i.note}` : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(i.amount, sym)}</span>
                  <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(i)}>Edit</button>
                  <DeleteBtn onDelete={() => d.removeIncome(i.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <FAB bg="var(--accent)" shadow="rgba(126,232,162,0.35)" onClick={openNew} />

      {showForm && (
        <Modal title={editId ? "Edit Income" : "Add Income"} onClose={closeForm} onSave={save} saveLabel={editId ? "Update" : "Save"} canSave={!!form.label.trim() && Number(form.amount) > 0}>
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          <Field label="Description" required><Input placeholder="e.g. Consulting fee" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></Field>
          <Field label={`Amount (${sym})`} required hint="Enter the amount received."><Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Date Received" required><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Note"><Input placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></Field>
        </Modal>
      )}
    </div>
  );
}
