import React, { useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, Toggle, FAB, DeleteBtn, fmtMoney, fmtDate, monthKey, MONTHS } from "../components/UI";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";

const CATS = ["Operations", "Tools", "Marketing", "Payroll", "Utilities", "Travel", "Other"];

const blankForm = (year, month) => ({
  label: "",
  amount: "",
  category: "Operations",
  recurring: false,
  date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
  endDate: "",
  note: ""
});

export default function ExpensesSection({ year, month }) {
  const d = useData();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(blankForm(year, month));

  const active = d.expenses.filter(e => {
    if (!e.recurring) return e.month === mk;
    const started = e.startMonth <= mk;
    const notEnded = !e.endMonth || e.endMonth >= mk;
    return started && notEnded;
  });
  const total = active.reduce((s, e) => s + Number(e.amount), 0);
  const recurring = active.filter(e => e.recurring);
  const oneTime = active.filter(e => !e.recurring);

  function openNew() {
    setEditId(null);
    setForm(blankForm(year, month));
    setFormError("");
    setShowForm(true);
  }

  function openEdit(expense) {
    setEditId(expense.id);
    setForm({
      label: expense.label || "",
      amount: String(expense.amount ?? ""),
      category: expense.category || "Operations",
      recurring: Boolean(expense.recurring),
      date: expense.date || `${year}-${String(month + 1).padStart(2, "0")}-01`,
      endDate: expense.endDate || "",
      note: expense.note || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setEditId(null);
    setShowForm(false);
    setFormError("");
    setForm(blankForm(year, month));
  }

  function validateForm() {
    if (!hasMinLength(form.label, 2)) {
      return "Add a short expense title so it is easy to identify later.";
    }
    if (!isPositiveAmount(form.amount)) {
      return "Enter an amount greater than 0.";
    }
    if (!isValidDateValue(form.date)) {
      return "Choose the expense date.";
    }
    if (form.recurring && form.endDate && !isValidDateValue(form.endDate)) {
      return "Choose a valid recurring end date or leave it empty.";
    }
    if (form.recurring && form.endDate && form.endDate < form.date) {
      return "Recurring end date must be on or after the start date.";
    }
    return "";
  }

  function save() {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    const payload = {
      label: form.label.trim(),
      amount: Number(form.amount),
      category: form.category,
      note: form.note.trim(),
      date: form.date,
      recurring: form.recurring
    };

    if (form.recurring) {
      payload.startMonth = form.date.slice(0, 7);
      payload.endDate = form.endDate || "";
      payload.endMonth = form.endDate ? form.endDate.slice(0, 7) : "";
    } else {
      payload.month = form.date.slice(0, 7);
      payload.endDate = "";
      payload.endMonth = "";
    }

    if (editId) d.updateExpense({ ...payload, id: editId });
    else d.addExpense(payload);

    closeForm();
  }

  const ExpRow = ({ expense }) => (
    <div className="card-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{expense.label}</span>
          {expense.recurring && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>Recurring</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
          {expense.category}
          {expense.date ? ` - ${fmtDate(expense.date)}` : ""}
          {expense.recurring && expense.endDate ? ` - ends ${fmtDate(expense.endDate)}` : ""}
          {expense.note ? ` - ${expense.note}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(expense.amount, sym)}</span>
        <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(expense)}>Edit</button>
        <DeleteBtn onDelete={() => d.removeExpense(expense.id)} />
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--danger-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Total Expenses - {MONTHS[month]} {year}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--danger)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {recurring.length > 0 && (
          <>
            <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Recurring</span><span style={{ color: "var(--danger)" }}>{fmtMoney(recurring.reduce((s, e) => s + Number(e.amount), 0), sym)}</span>
            </div>
            <div className="card" style={{ marginBottom: 22 }}>{recurring.map(e => <ExpRow key={e.id} expense={e} />)}</div>
          </>
        )}
        <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>One-Time</span><span style={{ color: "var(--danger)" }}>{fmtMoney(oneTime.reduce((s, e) => s + Number(e.amount), 0), sym)}</span>
        </div>
        <div className="card">
          {oneTime.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No one-time expenses recorded for this month.</div>
          ) : (
            oneTime.map(e => <ExpRow key={e.id} expense={e} />)
          )}
        </div>
      </div>

      <FAB bg="var(--danger)" shadow="rgba(255,110,110,0.35)" onClick={openNew} />

      {showForm && (
        <Modal title={editId ? "Edit Expense" : "Add Expense"} onClose={closeForm} onSave={save} saveLabel={editId ? "Update" : "Save"} canSave={!!form.label.trim() && Number(form.amount) > 0} accentColor="var(--danger)">
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
            <Field label="Description" required><Input placeholder="e.g. Office rent" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></Field>
            <Field label={`Amount (${sym})`} required hint="Enter how much you spent."><Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></Field>
            <Field label="Category"><Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Expense Date" required><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></Field>
          </div>

          <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
            <Field label="Type">
              <Toggle value={form.recurring ? "recurring" : "once"} onChange={v => setForm(f => ({ ...f, recurring: v === "recurring", endDate: v === "recurring" ? f.endDate : "" }))} options={[{ value: "once", label: "One-Time" }, { value: "recurring", label: "Recurring Monthly" }]} />
            </Field>
            {form.recurring && (
              <>
                <div style={{ background: "var(--blue-deep)", border: "1px solid var(--blue)33", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "var(--blue)", marginBottom: 16 }}>
                  This expense will repeat every month starting from {fmtDate(form.date)}.
                </div>
                <Field label="Recurring End Date" hint="Optional. Leave empty if this expense should continue until you stop it manually.">
                  <Input type="date" value={form.endDate} min={form.date} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </Field>
              </>
            )}
            <Field label="Note"><Input placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
