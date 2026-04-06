import React,{ useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Textarea, Select, FAB, Avatar, DeleteBtn, fmtMoney, fmtDate, invoiceTotal, monthKey, MONTHS, uid } from "../components/UI";
import { downloadInvoice } from "../utils/invoiceGen";

export default function InvoicesSection({ year, month }) {
  const d = useData();
  const sym = d.currency?.symbol || "₹";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [detail, setDetail] = useState(null);

  const blankForm = () => ({
    number: `INV-${String(d.invoices.length + 1).padStart(3, "0")}`,
    customerId: "",
    billTo: { name: "", address: "", gstin: "" },
    shipTo: { name: "", address: "" },
    shipSameAsBill: true,
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    dueDate: "",
    items: [{ id: uid(), desc: "", subDesc: "", hsn: "", qty: 1, rate: "", igst: 0 }],
    notes: "Thanks for your business.",
    terms: "Supply meant for export under LUT without payment of IGST. Place of Supply: Outside India",
  });

  const [form, setForm] = useState(null);

  const monthInv = d.invoices.filter(i => i.date?.slice(0, 7) === mk);
  const total = monthInv.reduce((s, i) => s + invoiceTotal(i.items), 0);

  function openNew() { setForm(blankForm()); setEditInv(null); setShowForm(true); }
  function openEdit(inv) { setForm({ ...inv, items: inv.items.map(i => ({ ...i })), shipSameAsBill: inv.shipSameAsBill ?? true }); setEditInv(inv); setDetail(null); setShowForm(true); }

  function saveInv() {
    if (!form) return;
    const customer = d.customers.find(c => c.id === form.customerId);
    const inv = {
      ...form,
      customer,
      billTo: form.customerId && customer ? { name: customer.name, address: customer.address, gstin: customer.gstin } : form.billTo,
      shipTo: form.shipSameAsBill
        ? (form.customerId && customer ? { name: customer.name, address: customer.address } : form.billTo)
        : form.shipTo,
    };
    if (editInv) d.updateInvoice(inv);
    else d.addInvoice(inv);
    setShowForm(false); setForm(null); setEditInv(null);
  }

  function addItem() { setForm(f => ({ ...f, items: [...f.items, { id: uid(), desc: "", subDesc: "", hsn: "", qty: 1, rate: "", igst: 0 }] })); }
  function removeItem(id) { setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) })); }
  function setItem(id, k, v) { setForm(f => ({ ...f, items: f.items.map(i => i.id === id ? { ...i, [k]: v } : i) })); }

  function selectCustomer(id) {
    const c = d.customers.find(x => x.id === id);
    setForm(f => ({
      ...f,
      customerId: id,
      billTo: c ? { name: c.name, address: c.address, gstin: c.gstin } : f.billTo,
      shipTo: c ? { name: c.name, address: c.address } : f.shipTo,
    }));
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Invoice Total · {MONTHS[month]} {year}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--blue)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>{monthInv.length} invoice(s)</div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="card">
          {monthInv.length === 0
            ? <div style={{ padding: "40px 24px", textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 14 }}>📄</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-sec)" }}>No invoices this month</div></div>
            : monthInv.map((inv, idx) => (
              <div key={inv.id} className="card-row" onClick={() => setDetail(inv)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={inv.customer?.name || inv.billTo?.name || "?"} size={40} fontSize={14} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{inv.customer?.name || inv.billTo?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{inv.number} · {fmtDate(inv.date)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoiceTotal(inv.items), sym)}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 18 }}>›</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <FAB bg="var(--blue)" shadow="rgba(103,178,255,0.35)" onClick={openNew} />

      {/* Detail */}
      {detail && (() => {
        const inv = d.invoices.find(i => i.id === detail.id) || detail;
        const igstTotal = inv.items.reduce((s, it) => s + (Number(it.qty)||0)*(Number(it.rate)||0)*(Number(it.igst)||0)/100, 0);
        return (
          <Modal title={inv.number} onClose={() => setDetail(null)} onSave={() => openEdit(inv)} saveLabel="Edit" accentColor="var(--blue)">
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22 }}>
              <Avatar name={inv.customer?.name || inv.billTo?.name || "?"} size={52} fontSize={20} />
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:"var(--text)" }}>{inv.customer?.name || inv.billTo?.name}</div>
                <div style={{ fontSize:13, color:"var(--text-dim)" }}>{inv.customer?.email || ""}</div>
              </div>
            </div>
            <div style={{ fontFamily:"var(--serif)", fontSize:40, color:"var(--blue)", marginBottom:4 }}>{fmtMoney(invoiceTotal(inv.items) + igstTotal, sym)}</div>
            <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:22 }}>Issued {fmtDate(inv.date)}{inv.dueDate ? ` · Due ${fmtDate(inv.dueDate)}` : ""}</div>

            {/* Bill/Ship */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[["Bill To", inv.billTo], ["Ship To", inv.shipTo]].map(([label, addr]) => (
                <div key={label} style={{ background:"var(--surface-high)", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{addr?.name || "—"}</div>
                  <div style={{ fontSize:12, color:"var(--text-sec)", marginTop:2, lineHeight:1.6 }}>{(addr?.address || "").replace(/\n/g, ", ")}</div>
                  {addr?.gstin && <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:2 }}>GSTIN: {addr.gstin}</div>}
                </div>
              ))}
            </div>

            {/* Line items */}
            <div className="card" style={{ marginBottom:16 }}>
              {inv.items.map((it, idx, arr) => (
                <div key={it.id} className="card-row">
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:500, color:"var(--text)" }}>{it.desc || "Item"}</div>
                    {it.subDesc && <div style={{ fontSize:12, color:"var(--text-dim)" }}>{it.subDesc}</div>}
                    <div style={{ fontSize:12, color:"var(--text-dim)", marginTop:2 }}>
                      {it.hsn && `HSN: ${it.hsn} · `}{it.qty} × {fmtMoney(it.rate, sym)} · IGST {it.igst || 0}%
                    </div>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{fmtMoney((Number(it.qty)||0)*(Number(it.rate)||0), sym)}</span>
                </div>
              ))}
              <div style={{ padding:"12px 18px", borderTop:"1px solid var(--border)", fontSize:13, color:"var(--text-sec)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span>Taxable Value</span><span>{fmtMoney(invoiceTotal(inv.items), sym)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><span>IGST</span><span>{fmtMoney(igstTotal, sym)}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:17, color:"var(--text)" }}><span>Total</span><span style={{ color:"var(--blue)" }}>{fmtMoney(invoiceTotal(inv.items) + igstTotal, sym)}</span></div>
              </div>
            </div>

            {inv.notes && <div className="card" style={{ padding:"14px 18px", fontSize:14, color:"var(--text-sec)", marginBottom:14, lineHeight:1.6 }}><strong style={{ color:"var(--text)" }}>Notes:</strong> {inv.notes}</div>}
            {inv.terms && <div className="card" style={{ padding:"14px 18px", fontSize:13, color:"var(--text-sec)", marginBottom:20, lineHeight:1.6 }}><strong style={{ color:"var(--text)" }}>Terms:</strong> {inv.terms}</div>}

            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => downloadInvoice(inv, d.account, sym)} style={{ flex:2, border:"none", borderRadius:14, padding:"15px", fontFamily:"var(--font)", fontSize:15, fontWeight:700, cursor:"pointer", background:"var(--blue)", color:"#fff" }}>⬇ Download</button>
              <button onClick={() => { if (window.confirm("Delete this invoice?")) { d.removeInvoice(inv.id); setDetail(null); }}} style={{ flex:1, border:"1px solid var(--danger)44", borderRadius:14, padding:"15px", fontFamily:"var(--font)", fontSize:15, fontWeight:600, cursor:"pointer", background:"var(--danger-deep)", color:"var(--danger)" }}>Delete</button>
            </div>
          </Modal>
        );
      })()}

      {/* Create/Edit Form */}
      {showForm && form && (
        <Modal title={editInv ? "Edit Invoice" : "New Invoice"} onClose={() => { setShowForm(false); setForm(null); setEditInv(null); }} onSave={saveInv} canSave={!!(form.customerId || form.billTo?.name)} accentColor="var(--blue)">
          <Field label="Invoice Number"><Input value={form.number} onChange={e => setForm(f=>({...f,number:e.target.value}))} /></Field>

          {/* Customer */}
          <Field label="Customer" hint="Select from your customers list">
            <Select value={form.customerId} onChange={e => selectCustomer(e.target.value)}>
              <option value="">— Select customer —</option>
              {d.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>

          {!form.customerId && (
            <>
              <div style={{ fontSize:13, color:"var(--text-sec)", marginBottom:14, padding:"10px 14px", background:"var(--surface-high)", borderRadius:10 }}>
                Or enter bill-to details manually:
              </div>
              <Field label="Bill To — Name"><Input placeholder="Client / Company" value={form.billTo?.name||""} onChange={e=>setForm(f=>({...f,billTo:{...f.billTo,name:e.target.value}}))} /></Field>
              <Field label="Bill To — Address"><Textarea placeholder="Full address" value={form.billTo?.address||""} onChange={e=>setForm(f=>({...f,billTo:{...f.billTo,address:e.target.value}}))} /></Field>
              <Field label="Bill To — GSTIN (optional)"><Input placeholder="GSTIN" value={form.billTo?.gstin||""} onChange={e=>setForm(f=>({...f,billTo:{...f.billTo,gstin:e.target.value}}))} /></Field>
            </>
          )}

          {/* Ship To */}
          <Field label="Ship To">
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <button onClick={()=>setForm(f=>({...f,shipSameAsBill:true}))} style={{ flex:1, border:"none", borderRadius:10, padding:"10px", fontFamily:"var(--font)", fontSize:13, fontWeight:600, cursor:"pointer", background:form.shipSameAsBill?"var(--blue-deep)":"var(--surface-high)", color:form.shipSameAsBill?"var(--blue)":"var(--text-sec)" }}>Same as Bill To</button>
              <button onClick={()=>setForm(f=>({...f,shipSameAsBill:false}))} style={{ flex:1, border:"none", borderRadius:10, padding:"10px", fontFamily:"var(--font)", fontSize:13, fontWeight:600, cursor:"pointer", background:!form.shipSameAsBill?"var(--blue-deep)":"var(--surface-high)", color:!form.shipSameAsBill?"var(--blue)":"var(--text-sec)" }}>Different Address</button>
            </div>
            {!form.shipSameAsBill && (
              <>
                <Input placeholder="Name" value={form.shipTo?.name||""} onChange={e=>setForm(f=>({...f,shipTo:{...f.shipTo,name:e.target.value}}))} style={{ marginBottom:10 }} />
                <Textarea placeholder="Ship-to address" value={form.shipTo?.address||""} onChange={e=>setForm(f=>({...f,shipTo:{...f.shipTo,address:e.target.value}}))} />
              </>
            )}
          </Field>

          <Field label="Invoice Date"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></Field>
          <Field label="Due Date (optional)"><Input type="date" value={form.dueDate||""} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} /></Field>

          {/* Line Items */}
          <label style={{ fontSize:12, fontWeight:700, color:"var(--text-sec)", textTransform:"uppercase", letterSpacing:0.7, display:"block", marginBottom:10 }}>Line Items</label>
          {form.items.map((item, idx) => (
            <div key={item.id} className="card" style={{ marginBottom:12, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--text-sec)" }}>Item {idx + 1}</span>
                {form.items.length > 1 && <button onClick={() => removeItem(item.id)} style={{ background:"var(--danger-deep)", border:"none", borderRadius:8, color:"var(--danger)", fontSize:12, fontWeight:600, padding:"4px 10px", cursor:"pointer", fontFamily:"var(--font)" }}>Remove</button>}
              </div>
              <Input placeholder="Description (e.g. Cyber Security Services)" value={item.desc} onChange={e=>setItem(item.id,"desc",e.target.value)} style={{ marginBottom:8 }} />
              <Input placeholder="Sub-description (optional)" value={item.subDesc||""} onChange={e=>setItem(item.id,"subDesc",e.target.value)} style={{ marginBottom:8, fontSize:14 }} />
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", display:"block", marginBottom:4 }}>HSN/SAC</label><Input placeholder="998314" value={item.hsn||""} onChange={e=>setItem(item.id,"hsn",e.target.value)} /></div>
                <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", display:"block", marginBottom:4 }}>IGST %</label><Input type="number" placeholder="0" value={item.igst||""} onChange={e=>setItem(item.id,"igst",e.target.value)} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", display:"block", marginBottom:4 }}>Qty</label><Input type="number" min="1" value={item.qty} onChange={e=>setItem(item.id,"qty",e.target.value)} /></div>
                <div><label style={{ fontSize:11, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", display:"block", marginBottom:4 }}>Rate ({sym})</label><Input type="number" placeholder="0.00" value={item.rate} onChange={e=>setItem(item.id,"rate",e.target.value)} /></div>
              </div>
              <div style={{ textAlign:"right", marginTop:10, fontSize:16, fontWeight:700, color:"var(--blue)" }}>
                {fmtMoney((Number(item.qty)||0)*(Number(item.rate)||0), sym)}
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{ width:"100%", border:"1px solid var(--blue)44", borderRadius:13, padding:"13px", fontFamily:"var(--font)", fontSize:15, fontWeight:600, cursor:"pointer", background:"var(--blue-deep)", color:"var(--blue)", marginBottom:16 }}>+ Add Line Item</button>

          {/* Totals preview */}
          <div className="card" style={{ padding:"14px 18px", marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:14, color:"var(--text-sec)" }}>
              <span>Taxable Value</span>
              <span>{fmtMoney(invoiceTotal(form.items), sym)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:17, color:"var(--text)", marginTop:8, paddingTop:8, borderTop:"1px solid var(--border)" }}>
              <span>Total</span>
              <span style={{ color:"var(--blue)" }}>{fmtMoney(invoiceTotal(form.items), sym)}</span>
            </div>
          </div>

          <Field label="Notes"><Textarea placeholder="e.g. Thanks for your business." value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></Field>
          <Field label="Terms & Conditions"><Textarea placeholder="e.g. Supply meant for export under LUT…" value={form.terms||""} onChange={e=>setForm(f=>({...f,terms:e.target.value}))} /></Field>
        </Modal>
      )}
    </div>
  );
}