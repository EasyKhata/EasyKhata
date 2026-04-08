import React, { useState } from "react";
import { useData } from "../context/DataContext";
import {
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  FAB,
  Avatar,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  uid,
  EmptyState,
  SectionSkeleton
} from "../components/UI";
import { UpgradeModal } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { downloadInvoice } from "../utils/invoiceGen";
import {
  getInvoiceDueMessage,
  getInvoiceStatus,
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  getNextInvoiceNumber,
  invoiceGrandTotal
} from "../utils/analytics";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { canUseFeature, getUpgradeCopy } from "../utils/subscription";

function emptyItem() {
  return { id: uid(), desc: "", subDesc: "", hsn: "", qty: 1, rate: "", taxRate: 18 };
}

function getTaxBreakdown(invoice) {
  return (invoice?.items || []).reduce(
    (totals, item) => {
      const taxable = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const rate = Number(item.taxRate ?? item.igst) || 0;
      const taxAmount = (taxable * rate) / 100;

      totals.taxable += taxable;
      if (invoice?.taxMode === "split") {
        totals.cgst += taxAmount / 2;
        totals.sgst += taxAmount / 2;
      } else {
        totals.igst += taxAmount;
      }

      return totals;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  );
}

export default function InvoicesSection({ year, month }) {
  const d = useData();
  const { user } = useAuth();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [detail, setDetail] = useState(null);
  const [formError, setFormError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState(null);

  const blankForm = () => ({
    number: getNextInvoiceNumber(d.invoices),
    customerId: "",
    billTo: { name: "", address: "", gstin: "" },
    shipTo: { name: "", address: "" },
    shipSameAsBill: true,
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    dueDate: "",
    status: "pending",
    paidDate: "",
    taxMode: "split",
    items: [emptyItem()],
    notes: "Thanks for your business.",
    terms: "Payment is due within the agreed billing cycle."
  });

  const [form, setForm] = useState(null);

  const monthInv = d.invoices
    .filter(invoice => invoice.date?.slice(0, 7) === mk)
    .map(invoice => ({
      ...invoice,
      computedStatus: getInvoiceStatus(invoice),
      dueMessage: getInvoiceDueMessage(invoice),
      total: invoiceGrandTotal(invoice)
    }));
  const total = monthInv.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingCount = monthInv.filter(invoice => invoice.computedStatus !== "paid").length;

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    if (!canUseFeature(user, "invoiceCreate", { invoiceCount: d.invoices.length })) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate"));
      return;
    }
    setForm(blankForm());
    setEditInv(null);
    setDetail(null);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(invoice) {
    setForm({
      ...invoice,
      status: invoice.status || getInvoiceStatus(invoice),
      paidDate: invoice.paidDate || "",
      taxMode: invoice.taxMode || "split",
      items: invoice.items.map(item => ({
        ...item,
        taxRate: Number(item.taxRate ?? item.igst) || 0
      })),
      shipSameAsBill: invoice.shipSameAsBill ?? true
    });
    setEditInv(invoice);
    setDetail(null);
    setFormError("");
    setShowForm(true);
  }

  function handleDownloadPdf(invoice) {
    if (!canUseFeature(user, "invoicePdf")) {
      setUpgradeInfo(getUpgradeCopy("invoicePdf"));
      return;
    }
    downloadInvoice(invoice, d.account, sym);
  }

  function closeForm() {
    setShowForm(false);
    setForm(null);
    setEditInv(null);
    setFormError("");
  }

  function buildInvoicePayload(currentForm) {
    const customer = d.customers.find(c => c.id === currentForm.customerId);
    const resolvedBillTo = currentForm.customerId && customer
      ? { name: customer.name, address: customer.address, gstin: customer.gstin }
      : currentForm.billTo;
    const resolvedShipTo = currentForm.shipSameAsBill
      ? { name: resolvedBillTo.name, address: resolvedBillTo.address }
      : currentForm.shipTo;

    return {
      ...currentForm,
      customer,
      billTo: resolvedBillTo,
      shipTo: resolvedShipTo,
      items: currentForm.items.map(item => ({
        ...item,
        qty: Number(item.qty),
        rate: Number(item.rate),
        taxRate: Number(item.taxRate ?? item.igst) || 0
      })),
      paidDate: currentForm.status === "paid" ? currentForm.paidDate || currentForm.date : "",
      shipSameAsBill: Boolean(currentForm.shipSameAsBill)
    };
  }

  function saveInv() {
    if (!form) return;

    if (!hasMinLength(form.number, 3)) {
      setFormError("Use a valid invoice number.");
      return;
    }
    if (!isValidDateValue(form.date)) {
      setFormError("Choose a valid invoice date.");
      return;
    }
    if (form.dueDate && !isValidDateValue(form.dueDate)) {
      setFormError("Choose a valid due date or leave it empty.");
      return;
    }
    if (form.dueDate && form.dueDate < form.date) {
      setFormError("Due date must be on or after the invoice date.");
      return;
    }
    if (form.status === "paid" && form.paidDate && !isValidDateValue(form.paidDate)) {
      setFormError("Choose a valid paid date.");
      return;
    }
    if (!form.customerId && !hasMinLength(form.billTo?.name, 2)) {
      setFormError("Select a customer or enter the bill-to name.");
      return;
    }
    if (!form.items.length) {
      setFormError("Add at least one line item.");
      return;
    }

    const invalidItem = form.items.find(
      item =>
        !hasMinLength(item.desc, 2) ||
        !isPositiveAmount(item.qty) ||
        !isPositiveAmount(item.rate) ||
        Number(item.taxRate ?? item.igst) < 0
    );
    if (invalidItem) {
      setFormError("Each line item needs a description, quantity, rate, and a valid GST rate.");
      return;
    }

    const invoice = buildInvoicePayload(form);
    if (editInv) d.updateInvoice(invoice);
    else d.addInvoice(invoice);

    closeForm();
  }

  function addItem() {
    setForm(current => ({ ...current, items: [...current.items, emptyItem()] }));
  }

  function removeItem(id) {
    setForm(current => ({ ...current, items: current.items.filter(item => item.id !== id) }));
  }

  function setItem(id, key, value) {
    setForm(current => ({
      ...current,
      items: current.items.map(item => (item.id === id ? { ...item, [key]: value } : item))
    }));
  }

  function selectCustomer(id) {
    const customer = d.customers.find(item => item.id === id);
    setForm(current => ({
      ...current,
      customerId: id,
      billTo: customer
        ? { name: customer.name, address: customer.address, gstin: customer.gstin }
        : current.billTo,
      shipTo: customer ? { name: customer.name, address: customer.address } : current.shipTo
    }));
  }

  function updateInvoiceStatus(invoice, status) {
    const nextInvoice = {
      ...invoice,
      status,
      paidDate: status === "paid" ? invoice.paidDate || new Date().toISOString().slice(0, 10) : ""
    };
    d.updateInvoice(nextInvoice);
    setDetail({ ...nextInvoice, computedStatus: getInvoiceStatus(nextInvoice), total: invoiceGrandTotal(nextInvoice) });
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Invoice Total · {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--blue)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {monthInv.length} invoice(s) · {pendingCount} pending
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="card">
          {monthInv.length === 0 ? (
            <EmptyState title="No invoices this month" message="Create your first invoice to start tracking revenue, reminders, and customer history." actionLabel="Create Invoice" onAction={openNew} accentColor="var(--blue)" />
          ) : (
            monthInv.map(invoice => (
              <div key={invoice.id} className="card-row" onClick={() => setDetail(invoice)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={40} fontSize={14} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name || "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} · {fmtDate(invoice.date)}</div>
                    {invoice.dueMessage && (
                      <div style={{ fontSize: 11, color: getInvoiceStatusColor(invoice.computedStatus), marginTop: 3 }}>
                        {invoice.dueMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoice.total, sym)}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getInvoiceStatusColor(invoice.computedStatus), marginTop: 4 }}>
                    {getInvoiceStatusLabel(invoice.computedStatus)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <FAB bg="var(--blue)" shadow="rgba(103,178,255,0.35)" onClick={openNew} />

      {detail && (() => {
        const invoice = d.invoices.find(item => item.id === detail.id) || detail;
        const computedStatus = getInvoiceStatus(invoice);
        const tax = getTaxBreakdown(invoice);
        const grandTotal = tax.taxable + tax.cgst + tax.sgst + tax.igst;
        const dueMessage = getInvoiceDueMessage(invoice);
        return (
          <Modal title={invoice.number} onClose={() => setDetail(null)} onSave={() => openEdit(invoice)} saveLabel="Edit" accentColor="var(--blue)">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={52} fontSize={20} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  Issued {fmtDate(invoice.date)}{invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ""}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 38, color: "var(--blue)" }}>{fmtMoney(grandTotal, sym)}</div>
                {dueMessage && <div style={{ fontSize: 13, color: getInvoiceStatusColor(computedStatus) }}>{dueMessage}</div>}
              </div>
              <div style={{ padding: "7px 12px", borderRadius: 999, background: `${getInvoiceStatusColor(computedStatus)}22`, color: getInvoiceStatusColor(computedStatus), fontSize: 12, fontWeight: 700 }}>
                {getInvoiceStatusLabel(computedStatus)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[["Bill To", invoice.billTo], ["Ship To", invoice.shipTo]].map(([label, block]) => (
                <div key={label} style={{ background: "var(--surface-high)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{block?.name || "--"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, lineHeight: 1.6 }}>{(block?.address || "").replace(/\n/g, ", ")}</div>
                  {block?.gstin && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>GSTIN: {block.gstin}</div>}
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              {invoice.items.map(item => (
                <div key={item.id} className="card-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.desc || "Item"}</div>
                    {item.subDesc && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{item.subDesc}</div>}
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                      {item.hsn ? `HSN ${item.hsn} · ` : ""}{item.qty} × {fmtMoney(item.rate, sym)} · GST {Number(item.taxRate ?? item.igst ?? 0)}%
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmtMoney((Number(item.qty) || 0) * (Number(item.rate) || 0), sym)}</span>
                </div>
              ))}
              <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--text-sec)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Taxable Value</span>
                  <span>{fmtMoney(tax.taxable, sym)}</span>
                </div>
                {invoice.taxMode === "split" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>CGST</span>
                      <span>{fmtMoney(tax.cgst, sym)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>SGST</span>
                      <span>{fmtMoney(tax.sgst, sym)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span>IGST</span>
                    <span>{fmtMoney(tax.igst, sym)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--blue)" }}>{fmtMoney(grandTotal, sym)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && <div className="card" style={{ padding: "14px 18px", fontSize: 14, color: "var(--text-sec)", marginBottom: 14, lineHeight: 1.6 }}><strong style={{ color: "var(--text)" }}>Notes:</strong> {invoice.notes}</div>}
            {invoice.terms && <div className="card" style={{ padding: "14px 18px", fontSize: 13, color: "var(--text-sec)", marginBottom: 18, lineHeight: 1.6 }}><strong style={{ color: "var(--text)" }}>Terms:</strong> {invoice.terms}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => updateInvoiceStatus(invoice, computedStatus === "paid" ? "pending" : "paid")} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: computedStatus === "paid" ? "var(--gold-deep)" : "var(--accent)", color: computedStatus === "paid" ? "var(--gold)" : "#0C0C10" }}>
                {computedStatus === "paid" ? "Mark Pending" : "Mark Paid"}
              </button>
              <button onClick={() => handleDownloadPdf(invoice)} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "var(--blue)", color: "#fff" }}>
                Download PDF
              </button>
            </div>

            <button onClick={() => { if (window.confirm("Delete this invoice?")) { d.removeInvoice(invoice.id); setDetail(null); } }} style={{ width: "100%", border: "1px solid var(--danger)44", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--danger-deep)", color: "var(--danger)" }}>
              Delete Invoice
            </button>
          </Modal>
        );
      })()}

      {showForm && form && (() => {
        const previewInvoice = buildInvoicePayload(form);
        const tax = getTaxBreakdown(previewInvoice);
        const previewTotal = tax.taxable + tax.cgst + tax.sgst + tax.igst;
        return (
          <Modal title={editInv ? "Edit Invoice" : "New Invoice"} onClose={closeForm} onSave={saveInv} canSave={!!(form.customerId || form.billTo?.name)} accentColor="var(--blue)">
            {formError && (
              <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <Field label="Invoice Number">
              <Input value={form.number} onChange={event => setForm(current => ({ ...current, number: event.target.value }))} />
            </Field>

            <Field label="Customer" hint="Select an existing customer or fill in bill-to details below.">
              <Select value={form.customerId} onChange={event => selectCustomer(event.target.value)}>
                <option value="">-- Select customer --</option>
                {d.customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </Select>
            </Field>

            {!form.customerId && (
              <>
                <Field label="Bill To Name" required>
                  <Input placeholder="Client or company name" value={form.billTo?.name || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, name: event.target.value } }))} />
                </Field>
                <Field label="Bill To Address">
                  <Textarea placeholder="Full billing address" value={form.billTo?.address || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, address: event.target.value } }))} />
                </Field>
                <Field label="Bill To GSTIN">
                  <Input placeholder="GSTIN (optional)" value={form.billTo?.gstin || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, gstin: event.target.value } }))} />
                </Field>
              </>
            )}

            <Field label="Shipping Address">
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => setForm(current => ({ ...current, shipSameAsBill: true }))} style={{ flex: 1, border: "none", borderRadius: 10, padding: "10px", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, cursor: "pointer", background: form.shipSameAsBill ? "var(--blue-deep)" : "var(--surface-high)", color: form.shipSameAsBill ? "var(--blue)" : "var(--text-sec)" }}>
                  Same as Bill To
                </button>
                <button onClick={() => setForm(current => ({ ...current, shipSameAsBill: false }))} style={{ flex: 1, border: "none", borderRadius: 10, padding: "10px", fontFamily: "var(--font)", fontSize: 13, fontWeight: 600, cursor: "pointer", background: !form.shipSameAsBill ? "var(--blue-deep)" : "var(--surface-high)", color: !form.shipSameAsBill ? "var(--blue)" : "var(--text-sec)" }}>
                  Different Address
                </button>
              </div>
              {!form.shipSameAsBill && (
                <>
                  <Input placeholder="Ship-to name" value={form.shipTo?.name || ""} onChange={event => setForm(current => ({ ...current, shipTo: { ...current.shipTo, name: event.target.value } }))} style={{ marginBottom: 10 }} />
                  <Textarea placeholder="Ship-to address" value={form.shipTo?.address || ""} onChange={event => setForm(current => ({ ...current, shipTo: { ...current.shipTo, address: event.target.value } }))} />
                </>
              )}
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Invoice Date" required>
                <Input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} />
              </Field>
              <Field label="Due Date">
                <Input type="date" value={form.dueDate || ""} min={form.date} onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Payment Status">
                <Select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value, paidDate: event.target.value === "paid" ? current.paidDate || current.date : "" }))}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Select>
              </Field>
              <Field label="GST Type">
                <Select value={form.taxMode} onChange={event => setForm(current => ({ ...current, taxMode: event.target.value }))}>
                  <option value="split">CGST + SGST</option>
                  <option value="igst">IGST</option>
                </Select>
              </Field>
            </div>

            {form.status === "paid" && (
              <Field label="Paid Date">
                <Input type="date" value={form.paidDate || ""} min={form.date} onChange={event => setForm(current => ({ ...current, paidDate: event.target.value }))} />
              </Field>
            )}

            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.7, display: "block", marginBottom: 10 }}>
              Line Items
            </label>
            {form.items.map((item, index) => (
              <div key={item.id} className="card" style={{ marginBottom: 12, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-sec)" }}>Item {index + 1}</span>
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} style={{ background: "var(--danger-deep)", border: "none", borderRadius: 8, color: "var(--danger)", fontSize: 12, fontWeight: 600, padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font)" }}>
                      Remove
                    </button>
                  )}
                </div>
                <Input placeholder="Description" value={item.desc} onChange={event => setItem(item.id, "desc", event.target.value)} style={{ marginBottom: 8 }} />
                <Input placeholder="Sub-description (optional)" value={item.subDesc || ""} onChange={event => setItem(item.id, "subDesc", event.target.value)} style={{ marginBottom: 8, fontSize: 14 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>HSN / SAC</label>
                    <Input placeholder="998314" value={item.hsn || ""} onChange={event => setItem(item.id, "hsn", event.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>GST Rate %</label>
                    <Input type="number" min="0" placeholder="18" value={item.taxRate ?? item.igst ?? ""} onChange={event => setItem(item.id, "taxRate", event.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Qty</label>
                    <Input type="number" min="1" value={item.qty} onChange={event => setItem(item.id, "qty", event.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Rate ({sym})</label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.rate} onChange={event => setItem(item.id, "rate", event.target.value)} />
                  </div>
                </div>
                <div style={{ textAlign: "right", marginTop: 10, fontSize: 16, fontWeight: 700, color: "var(--blue)" }}>
                  {fmtMoney((Number(item.qty) || 0) * (Number(item.rate) || 0), sym)}
                </div>
              </div>
            ))}

            <button onClick={addItem} style={{ width: "100%", border: "1px solid var(--blue)44", borderRadius: 13, padding: "13px", fontFamily: "var(--font)", fontSize: 15, fontWeight: 600, cursor: "pointer", background: "var(--blue-deep)", color: "var(--blue)", marginBottom: 16 }}>
              + Add Line Item
            </button>

            <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                <span>Taxable Value</span>
                <span>{fmtMoney(tax.taxable, sym)}</span>
              </div>
              {previewInvoice.taxMode === "split" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                    <span>CGST</span>
                    <span>{fmtMoney(tax.cgst, sym)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                    <span>SGST</span>
                    <span>{fmtMoney(tax.sgst, sym)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                  <span>IGST</span>
                  <span>{fmtMoney(tax.igst, sym)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, color: "var(--text)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span>Total</span>
                <span style={{ color: "var(--blue)" }}>{fmtMoney(previewTotal, sym)}</span>
              </div>
            </div>

            <Field label="Notes">
              <Textarea placeholder="Any message for the customer" value={form.notes || ""} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} />
            </Field>
            <Field label="Terms & Conditions">
              <Textarea placeholder="Payment terms, delivery notes, or GST wording" value={form.terms || ""} onChange={event => setForm(current => ({ ...current, terms: event.target.value }))} />
            </Field>
          </Modal>
        );
      })()}

      <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
    </div>
  );
}
