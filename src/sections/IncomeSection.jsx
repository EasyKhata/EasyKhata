import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, FAB, DeleteBtn, fmtMoney, fmtDate, invoiceTotal, monthKey, MONTHS, Avatar } from "../components/UI";

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

  const invIncome = d.invoices.filter(i => i.date?.slice(0, 7) === mk);
  const manIncome = d.income.filter(i => i.month === mk);
  const totalInv = invIncome.reduce((s, i) => s + invoiceTotal(i.items), 0);
  const totalMan = manIncome.reduce((s, i) => s + Number(i.amount), 0);

  function openNew() {
    setEditId(null);
    setForm(blankForm(year, month));
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
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(blankForm(year, month));
  }

  function save() {
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
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No invoice income recorded for this month.</div>
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
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No manual income added yet. Tap + to add one.</div>
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
        <Modal title={editId ? "Edit Income" : "Add Income"} onClose={closeForm} onSave={save} canSave={!!form.label.trim() && Number(form.amount) > 0}>
          <Field label="Description" required><Input placeholder="e.g. Consulting fee" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></Field>
          <Field label={`Amount (${sym})`} required hint="Enter the amount received."><Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Date Received" required><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          <Field label="Note"><Input placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></Field>
        </Modal>
      )}
    </div>
  );
}
