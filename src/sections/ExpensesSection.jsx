import React,{ useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, Toggle, FAB, DeleteBtn, fmtMoney, fmtDate, monthKey, MONTHS } from "../components/UI";

const CATS = ["Operations","Tools","Marketing","Payroll","Utilities","Travel","Other"];

export default function ExpensesSection({ year, month }) {
  const d = useData();
  const sym = d.currency?.symbol || "₹";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label:"", amount:"", category:"Operations", recurring:false, date:`${year}-${String(month+1).padStart(2,"0")}-01`, note:"" });

  const active = d.expenses.filter(e => e.recurring ? e.startMonth <= mk : e.month === mk);
  const total = active.reduce((s, e) => s + Number(e.amount), 0);
  const recurring = active.filter(e => e.recurring);
  const oneTime = active.filter(e => !e.recurring);

  function save() {
    const exp = { label: form.label, amount: Number(form.amount), category: form.category, note: form.note, date: form.date };
    if (form.recurring) { exp.recurring = true; exp.startMonth = mk; }
    else { exp.recurring = false; exp.month = mk; }
    d.addExpense(exp);
    setForm({ label:"", amount:"", category:"Operations", recurring:false, date:`${year}-${String(month+1).padStart(2,"0")}-01`, note:"" });
    setShowForm(false);
  }

  const ExpRow = ({ e }) => (
    <div className="card-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{e.label}</span>
          {e.recurring && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>Recurring</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{e.category}{e.date ? ` · ${fmtDate(e.date)}` : ""}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(e.amount, sym)}</span>
        <DeleteBtn onDelete={() => d.removeExpense(e.id)} />
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--danger-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Total Expenses · {MONTHS[month]} {year}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--danger)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {recurring.length > 0 && (
          <>
            <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Recurring</span><span style={{ color: "var(--danger)" }}>{fmtMoney(recurring.reduce((s,e)=>s+Number(e.amount),0), sym)}</span>
            </div>
            <div className="card" style={{ marginBottom: 22 }}>{recurring.map(e => <ExpRow key={e.id} e={e} />)}</div>
          </>
        )}
        <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>One-Time</span><span style={{ color: "var(--danger)" }}>{fmtMoney(oneTime.reduce((s,e)=>s+Number(e.amount),0), sym)}</span>
        </div>
        <div className="card">
          {oneTime.length === 0
            ? <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No one-time expenses this month</div>
            : oneTime.map(e => <ExpRow key={e.id} e={e} />)
          }
        </div>
      </div>

      <FAB bg="var(--danger)" shadow="rgba(255,110,110,0.35)" onClick={() => setShowForm(true)} />

      {showForm && (
        <Modal title="Add Expense" onClose={() => setShowForm(false)} onSave={save} canSave={!!form.label.trim() && !!form.amount} accentColor="var(--danger)">
          <Field label="Description" required><Input placeholder="e.g. Office Rent" value={form.label} onChange={e => setForm(f=>({...f,label:e.target.value}))} /></Field>
          <Field label={`Amount (${sym})`} required><Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} /></Field>
          <Field label="Category"><Select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</Select></Field>
          <Field label="Date" required><Input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></Field>
          <Field label="Type">
            <Toggle value={form.recurring?"recurring":"once"} onChange={v=>setForm(f=>({...f,recurring:v==="recurring"}))} options={[{value:"once",label:"One-Time"},{value:"recurring",label:"Recurring Monthly"}]} />
          </Field>
          {form.recurring && (
            <div style={{ background:"var(--blue-deep)", border:"1px solid var(--blue)33", borderRadius:12, padding:"12px 14px", fontSize:13, color:"var(--blue)", marginBottom:16 }}>
              Applies every month from {MONTHS[month]} {year} onward.
            </div>
          )}
          <Field label="Note (optional)"><Input placeholder="Any note" value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} /></Field>
        </Modal>
      )}
    </div>
  );
}