import React, { useState, useEffect } from "react";
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
  getFinancialInvoices,
  getInvoiceDiscount,
  getInvoiceDueMessage,
  getInvoiceStatus,
  getInvoiceStatusColor,
  getInvoiceStatusLabel,
  getNextInvoiceNumber,
  getNextQuoteNumber,
  getInvoiceTaxBreakdown,
  invoiceGrandTotal
} from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isPositiveAmount, isValidDateValue, isValidGstin } from "../utils/validator";
import { canUseFeature, getUpgradeCopy } from "../utils/subscription";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";

const APARTMENT_INVOICE_TYPE_LABELS = {
  collections: "Maintenance Collection",
  expenses: "Society Expense"
};
const TODAY = new Date().toISOString().slice(0, 10);

function emptyItem() {
  return { id: uid(), desc: "", subDesc: "", hsn: "", qty: 1, rate: "", taxRate: 18 };
}

function getDocumentStatus(invoice, isQuote) {
  if (!isQuote) return getInvoiceStatus(invoice);
  return String(invoice?.status || "draft").toLowerCase();
}

function getDocumentStatusLabel(status, isQuote) {
  if (!isQuote) return getInvoiceStatusLabel(status);
  if (status === "sent") return "Sent";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Draft";
}

function getDocumentStatusColor(status, isQuote) {
  if (!isQuote) return getInvoiceStatusColor(status);
  if (status === "approved") return "var(--accent)";
  if (status === "rejected") return "var(--danger)";
  if (status === "sent") return "var(--blue)";
  return "var(--gold)";
}

function getDocumentDueMessage(invoice, isQuote) {
  if (!isQuote) return getInvoiceDueMessage(invoice);
  if (!invoice?.dueDate) return "";
  return `Valid until ${fmtDate(invoice.dueDate)}`;
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

export default function InvoicesSection({ year, month, documentType = "invoice" }) {
  const d = useData();
  const { user } = useAuth();
  const config = getOrgConfig(user?.organizationType);
  const isApartmentOrg = getOrgType(user?.organizationType) === ORG_TYPES.APARTMENT;
  const isSmallBusinessOrg = getOrgType(user?.organizationType) === ORG_TYPES.SMALL_BUSINESS;
  const isQuote = documentType === "quote";
  const documentLabel = isQuote ? "Quote" : config.invoiceEntryLabel;
  const documentCollectionLabel = isQuote ? "Quotes" : config.invoicesLabel;
  const societyName = String(d.account?.name || "").trim();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const [showForm, setShowForm] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [detail, setDetail] = useState(null);
  const [formError, setFormError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const isAdmin = user?.role === "admin";
  const [users, setUsers] = useState([]);
  const serviceOptions = (d.orgRecords?.services || []).map(service => ({
    id: service.id,
    name: service.serviceName || "",
    label: [service.serviceName || "", service.packageName || "", service.defaultAmount ? `${sym} ${service.defaultAmount}` : ""].filter(Boolean).join(" - "),
    packageName: service.packageName || "",
    defaultAmount: Number(service.defaultAmount) || 0,
    notes: service.notes || ""
  })).filter(service => service.name);
  const apartmentFlatOptions = [
    ...(societyName ? [{ id: "__building__", flatNumber: societyName, ownerName: "Common Building", tenantName: "", phone: "", isBuilding: true }] : []),
    ...(d.customers || []).map(flat => ({
      id: flat.id,
      flatNumber: flat.name || "",
      ownerName: flat.ownerName || "",
      tenantName: flat.tenantName || "",
      phone: flat.phone || "",
      isBuilding: false
    })).filter(item => item.flatNumber)
  ];

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        })));
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const blankForm = () => ({
    ...((config.invoiceFields || []).reduce((acc, field) => ({ ...acc, [field.key]: field.type === "select" ? field.options?.[0] || "" : "" }), {})),
    documentType,
    apartmentInvoiceType: isApartmentOrg ? "collections" : "",
    number: isQuote ? getNextQuoteNumber(d.invoices) : getNextInvoiceNumber(d.invoices),
    customerId: "",
    billTo: { name: "", address: "", gstin: "" },
    shipTo: { name: "", address: "" },
    shipSameAsBill: true,
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    dueDate: "",
    status: isQuote ? "draft" : isApartmentOrg ? "paid" : "pending",
    paidDate: "",
    taxMode: "split",
    items: [emptyItem()],
    notes: isQuote ? "Quote prepared for your review." : isAdmin ? "Invoice for subscription payment." : isApartmentOrg ? "Payment record for society accounting." : "Thanks for your business.",
    terms: isQuote ? "Pricing is based on the current scope and may be updated if requirements change." : isAdmin ? "Payment processed via UPI." : isApartmentOrg ? "This document is generated for society records." : "Payment is due within the agreed billing cycle."
  });

  const [form, setForm] = useState(null);

  const monthInv = d.invoices
    .filter(invoice => String(invoice.documentType || "invoice") === documentType)
    .filter(invoice => invoice.date?.slice(0, 7) === mk)
    .map(invoice => ({
      ...invoice,
      computedStatus: getDocumentStatus(invoice, isQuote),
      dueMessage: getDocumentDueMessage(invoice, isQuote),
      total: invoiceGrandTotal(invoice),
      apartmentLabel: APARTMENT_INVOICE_TYPE_LABELS[invoice.apartmentInvoiceType] || "Document"
    }));
  const total = monthInv.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingCount = monthInv.filter(invoice => invoice.computedStatus !== (isQuote ? "approved" : "paid")).length;

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    if (!canUseFeature(user, "invoiceCreate", { invoiceCount: getFinancialInvoices(d.invoices).length })) {
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

  function openDuplicate(invoice) {
    if (!canUseFeature(user, "invoiceCreate", { invoiceCount: getFinancialInvoices(d.invoices).length })) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate"));
      return;
    }

    setForm({
      ...invoice,
      documentType,
      number: isQuote ? getNextQuoteNumber(d.invoices) : getNextInvoiceNumber(d.invoices),
      customerId: invoice.customerId || invoice.customer?.id || "",
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      dueDate: "",
      status: isQuote ? "draft" : "pending",
      paidDate: "",
      items: (invoice.items || []).map(item => ({
        ...item,
        id: uid(),
        taxRate: Number(item.taxRate ?? item.igst) || 0
      })),
      shipSameAsBill: invoice.shipSameAsBill ?? true
    });
    setEditInv(null);
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
    const entity = isAdmin
      ? users.find(u => u.id === currentForm.customerId)
      : d.customers.find(c => c.id === currentForm.customerId);
    const selectedFlat = isApartmentOrg ? apartmentFlatOptions.find(item => item.id === currentForm.customerId) : null;
    const isApartmentExpense = isApartmentOrg && currentForm.apartmentInvoiceType === "expenses";
    const resolvedBillTo = currentForm.customerId && (entity || selectedFlat) && !isApartmentExpense
      ? {
        name: isApartmentOrg ? selectedFlat?.tenantName || selectedFlat?.ownerName || selectedFlat?.flatNumber || "" : entity.name || entity.email || "",
        address: isApartmentOrg ? (selectedFlat?.phone ? `Phone: ${selectedFlat.phone}` : "") : entity?.address || "",
        gstin: isApartmentOrg ? "" : String(entity?.gstin || "").trim().toUpperCase()
      }
      : { ...currentForm.billTo, gstin: String(currentForm.billTo?.gstin || "").trim().toUpperCase() };
    const resolvedShipTo = currentForm.shipSameAsBill
      ? { name: resolvedBillTo.name, address: resolvedBillTo.address }
      : currentForm.shipTo;

    const payload = {
      ...currentForm,
      number: String(currentForm.number || "").trim(),
      customer: entity || null,
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
    if (isApartmentOrg && currentForm.apartmentInvoiceType === "collections" && !payload.billingPeriod) {
      payload.billingPeriod = currentForm.date?.slice(0, 7) || "";
    }
    (config.invoiceFields || []).forEach(field => {
      payload[field.key] = String(currentForm[field.key] || "").trim();
    });
    return payload;
  }

  function removeApartmentLinkedEntries(invoiceId) {
    const linkedIncome = (d.income || []).find(item => item.sourceInvoiceId === invoiceId);
    const linkedExpense = (d.expenses || []).find(item => item.sourceInvoiceId === invoiceId);
    if (linkedIncome?.id) d.removeIncome(linkedIncome.id);
    if (linkedExpense?.id) d.removeExpense(linkedExpense.id);
  }

  function syncApartmentLinkedEntries(invoice) {
    removeApartmentLinkedEntries(invoice.id);
    if (!isApartmentOrg) return;
  }

  function saveInv() {
    if (!form) return;

    if (!hasMinLength(form.number, 3)) {
      setFormError(`Use a valid ${documentLabel.toLowerCase()} number.`);
      return;
    }
    const normalizedNumber = String(form.number || "").trim();
    const duplicateNumber = d.invoices.find(invoice => String(invoice.number || "").trim() === normalizedNumber && invoice.id !== editInv?.id);
    if (duplicateNumber) {
      setFormError(`This ${documentLabel.toLowerCase()} number is already in use. Please use a unique number.`);
      return;
    }
    if (!isValidDateValue(form.date)) {
      setFormError("Choose a valid invoice date.");
      return;
    }
    if (isFutureDateValue(form.date)) {
      setFormError("Future dates are not allowed for records.");
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
    if (!isQuote && form.status === "paid" && form.paidDate && !isValidDateValue(form.paidDate)) {
      setFormError("Choose a valid paid date.");
      return;
    }
    if (!isQuote && form.status === "paid" && form.paidDate && isFutureDateValue(form.paidDate)) {
      setFormError("Future dates are not allowed for records.");
      return;
    }
    if (!isQuote && form.status === "paid" && form.paidDate && form.paidDate < form.date) {
      setFormError("Paid date must be on or after the invoice date.");
      return;
    }
    if (isApartmentOrg && form.apartmentInvoiceType === "collections" && !form.customerId) {
      setFormError("Select a flat record from Settings so collection details can auto-populate.");
      return;
    }
    if (isApartmentOrg && form.apartmentInvoiceType === "expenses" && !hasMinLength(form.billTo?.name, 2)) {
      setFormError("Enter who received this payment, such as a staff member or repair vendor.");
      return;
    }
    if (!form.customerId && !hasMinLength(form.billTo?.name, 2)) {
      setFormError(`Select a ${config.customerEntryLabel.toLowerCase()} or enter the bill-to name.`);
      return;
    }
    if (!isValidGstin(form.billTo?.gstin)) {
      setFormError("Enter a valid bill-to GSTIN or leave it empty.");
      return;
    }
    if (!form.shipSameAsBill && !hasMinLength(form.shipTo?.name, 2)) {
      setFormError("Enter the ship-to name or use the billing address.");
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
    if (editInv) {
      d.updateInvoice(invoice);
      syncApartmentLinkedEntries(invoice);
    } else {
      const createdInvoice = { ...invoice, id: uid() };
      d.addInvoice(createdInvoice);
      syncApartmentLinkedEntries(createdInvoice);
    }

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
    const entity = isAdmin
      ? users.find(u => u.id === id)
      : d.customers.find(c => c.id === id);
    const flatRecord = apartmentFlatOptions.find(item => item.id === id);
    setForm(current => ({
      ...current,
      customerId: id,
      residentName: isApartmentOrg ? flatRecord?.tenantName || flatRecord?.ownerName || current.residentName || "" : current.residentName,
      flatNumber: isApartmentOrg ? flatRecord?.flatNumber || current.flatNumber || "" : current.flatNumber,
      billTo: isApartmentOrg && current.apartmentInvoiceType === "expenses"
        ? current.billTo
        : (entity || flatRecord)
          ? {
            name: isApartmentOrg ? flatRecord?.tenantName || flatRecord?.ownerName || flatRecord?.flatNumber || "" : entity.name || entity.email || "",
            address: isApartmentOrg ? (flatRecord?.phone ? `Phone: ${flatRecord.phone}` : "") : entity?.address || "",
            gstin: isApartmentOrg ? "" : entity?.gstin || ""
          }
          : current.billTo,
      shipTo: isApartmentOrg && current.apartmentInvoiceType === "expenses"
        ? current.shipTo
        : (entity || flatRecord)
          ? {
            name: isApartmentOrg ? flatRecord?.tenantName || flatRecord?.ownerName || flatRecord?.flatNumber || "" : entity.name || entity.email || "",
            address: isApartmentOrg ? (flatRecord?.phone ? `Phone: ${flatRecord.phone}` : "") : entity?.address || ""
          }
          : current.shipTo
    }));
  }

  function updateInvoiceStatus(invoice, status) {
    const nextInvoice = {
      ...invoice,
      status,
      paidDate: !isQuote && status === "paid" ? invoice.paidDate || new Date().toISOString().slice(0, 10) : ""
    };
    d.updateInvoice(nextInvoice);
    syncApartmentLinkedEntries(nextInvoice);
    setDetail({ ...nextInvoice, computedStatus: getDocumentStatus(nextInvoice, isQuote), total: invoiceGrandTotal(nextInvoice) });
  }

  return (
    <div style={{ paddingBottom: 100 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            {isAdmin ? "Subscription Invoices" : documentCollectionLabel} · {MONTHS[month]} {year}
          </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--blue)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {monthInv.length} {documentLabel.toLowerCase()}(s) · {pendingCount} {isQuote ? "open" : "pending"}
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="card">
          {monthInv.length === 0 ? (
            <EmptyState title={isAdmin ? "No subscription invoices this month" : `No ${documentCollectionLabel.toLowerCase()} this month`} message={isAdmin ? "Create invoices for subscription payments." : isQuote ? "Create your first quote to prepare pricing before sending an invoice." : `Create your first ${config.invoiceEntryLabel.toLowerCase()} to start tracking revenue, reminders, and history.`} actionLabel={isQuote ? "Create Quote" : config.invoiceActionLabel} onAction={openNew} accentColor="var(--blue)" />
          ) : (
            monthInv.map(invoice => (
              <div key={invoice.id} className="card-row" onClick={() => setDetail(invoice)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={40} fontSize={14} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name || "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} · {fmtDate(invoice.date)}</div>
                    {isApartmentOrg && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{invoice.apartmentInvoiceType === "collections" ? "Collection" : invoice.apartmentInvoiceType === "expenses" ? "Expense" : invoice.apartmentLabel}</div>}
                    {invoice.dueMessage && (
                      <div style={{ fontSize: 11, color: getDocumentStatusColor(invoice.computedStatus, isQuote), marginTop: 3 }}>
                        {invoice.dueMessage}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoice.total, sym)}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getDocumentStatusColor(invoice.computedStatus, isQuote), marginTop: 4 }}>
                    {getDocumentStatusLabel(invoice.computedStatus, isQuote)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick & Full Invoice Actions */}
      <div style={{ position: "fixed", bottom: 100, right: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 40 }}>
        <button
          onClick={openNew}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: "var(--accent)",
            color: "#0C0C10",
            fontSize: 24,
            fontWeight: 700,
            cursor: "pointer",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(255, 183, 77, 0.3)",
            fontFamily: "var(--font)",
            transition: "all 0.2s"
          }}
          title={`Create ${documentLabel}`}
          onMouseEnter={e => {
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={e => {
            e.target.style.transform = "scale(1)";
          }}
        >
          ⚡
        </button>
        <FAB bg="var(--blue)" shadow="rgba(103,178,255,0.35)" onClick={openNew} />
      </div>

      {detail && (() => {
        const invoice = d.invoices.find(item => item.id === detail.id) || detail;
        const computedStatus = getDocumentStatus(invoice, isQuote);
        const tax = getInvoiceTaxBreakdown(invoice);
        const grandTotal = invoiceGrandTotal(invoice);
        const dueMessage = getDocumentDueMessage(invoice, isQuote);
        return (
          <Modal title={invoice.number} onClose={() => setDetail(null)} onSave={() => openEdit(invoice)} saveLabel="Edit" accentColor="var(--blue)">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={52} fontSize={20} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {isQuote ? "Prepared" : "Issued"} {fmtDate(invoice.date)}{invoice.dueDate ? ` · ${isQuote ? "Valid until" : "Due"} ${fmtDate(invoice.dueDate)}` : ""}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 38, color: "var(--blue)" }}>{fmtMoney(grandTotal, sym)}</div>
                {dueMessage && <div style={{ fontSize: 13, color: getDocumentStatusColor(computedStatus, isQuote) }}>{dueMessage}</div>}
              </div>
              <div style={{ padding: "7px 12px", borderRadius: 999, background: `${getDocumentStatusColor(computedStatus, isQuote)}22`, color: getDocumentStatusColor(computedStatus, isQuote), fontSize: 12, fontWeight: 700 }}>
                {getDocumentStatusLabel(computedStatus, isQuote)}
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
                  <span>Subtotal</span>
                  <span>{fmtMoney(tax.subtotal, sym)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>Discount</span>
                  <span>-{fmtMoney(getInvoiceDiscount(invoice), sym)}</span>
                </div>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
              <button onClick={() => updateInvoiceStatus(invoice, isQuote ? (computedStatus === "draft" ? "sent" : computedStatus === "sent" ? "approved" : "draft") : computedStatus === "paid" ? "pending" : "paid")} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: isQuote ? "var(--gold-deep)" : computedStatus === "paid" ? "var(--gold-deep)" : "var(--accent)", color: isQuote ? "var(--gold)" : computedStatus === "paid" ? "var(--gold)" : "#0C0C10" }}>
                {isQuote ? (computedStatus === "draft" ? "Mark Sent" : computedStatus === "sent" ? "Mark Approved" : "Mark Draft") : computedStatus === "paid" ? "Mark Pending" : "Mark Paid"}
              </button>
              <button onClick={() => openDuplicate(invoice)} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "var(--surface-high)", color: "var(--text)" }}>
                Duplicate
              </button>
              <button onClick={() => handleDownloadPdf(invoice)} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "var(--blue)", color: "#fff" }}>
                Download PDF
              </button>
            </div>

            <button onClick={() => { if (window.confirm(`Delete this ${documentLabel.toLowerCase()}?`)) { removeApartmentLinkedEntries(invoice.id); d.removeInvoice(invoice.id); setDetail(null); } }} style={{ width: "100%", border: "1px solid var(--danger)44", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--danger-deep)", color: "var(--danger)" }}>
              Delete {documentLabel}
            </button>
          </Modal>
        );
      })()}

      {showForm && form && (() => {
        const previewInvoice = buildInvoicePayload(form);
        const tax = getInvoiceTaxBreakdown(previewInvoice);
        const previewTotal = invoiceGrandTotal(previewInvoice);
        return (
          <Modal title={editInv ? `Edit ${documentLabel}` : isQuote ? "Create Quote" : config.invoiceActionLabel} onClose={closeForm} onSave={saveInv} canSave={!!(form.customerId || form.billTo?.name)} accentColor="var(--blue)">
            {formError && (
              <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <Field label={`${documentLabel} Number`}>
              <Input value={form.number} onChange={event => setForm(current => ({ ...current, number: event.target.value }))} />
            </Field>

            {isApartmentOrg && (
              <Field label="Document Type">
                <Select value={form.apartmentInvoiceType || "collections"} onChange={event => setForm(current => ({
                  ...current,
                  apartmentInvoiceType: event.target.value,
                  customerId: event.target.value === "expenses" ? "" : current.customerId,
                  dueDate: event.target.value === "collections" ? "" : current.dueDate,
                  status: event.target.value === "collections" ? "paid" : current.status,
                  paidDate: event.target.value === "collections" ? (current.paidDate || current.date) : current.paidDate
                }))}>
                  <option value="collections">Collections</option>
                  <option value="expenses">Expenses</option>
                </Select>
              </Field>
            )}

            <Field label={isAdmin ? "User" : isApartmentOrg && form.apartmentInvoiceType === "expenses" ? "Flat Record (optional)" : config.customerEntryLabel} hint={isAdmin ? "Select a user who made the payment." : isApartmentOrg && form.apartmentInvoiceType === "expenses" ? "Leave this empty for salaries, repairs, and vendor payments, or select a flat or the building for common expenses." : `Select an existing ${config.customerEntryLabel.toLowerCase()} to auto-fill flat details.`}>
              <Select value={form.customerId} onChange={event => selectCustomer(event.target.value)}>
                <option value="">{isAdmin ? "-- Select user --" : `-- Select ${config.customerEntryLabel.toLowerCase()} --`}</option>
                {(isAdmin ? users : (isApartmentOrg ? apartmentFlatOptions : d.customers)).map(entity => (
                  <option key={entity.id} value={entity.id}>{isApartmentOrg ? [entity.flatNumber, entity.ownerName || entity.tenantName || "", !entity.isBuilding ? societyName : ""].filter(Boolean).join(" - ") : entity.name || entity.email}</option>
                ))}
              </Select>
            </Field>

            {(!form.customerId || (isApartmentOrg && form.apartmentInvoiceType === "expenses")) && (
              <>
                <Field label={isApartmentOrg && form.apartmentInvoiceType === "expenses" ? "Paid To" : "Bill To Name"} required>
                  <Input placeholder={config.customerNamePlaceholder} value={form.billTo?.name || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, name: event.target.value } }))} />
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
                <Input type="date" max={TODAY} value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} />
              </Field>
              <Field label={isQuote ? "Valid Until" : "Due Date"}>
                <Input type="date" value={form.dueDate || ""} min={form.date} max={TODAY} onChange={event => setForm(current => ({ ...current, dueDate: event.target.value }))} />
              </Field>
            </div>

            {isApartmentOrg && form.apartmentInvoiceType === "expenses" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Resident Name">
                  <Input value={form.residentName || ""} placeholder="Auto-filled from flat record" readOnly />
                </Field>
                <Field label="Flat Number">
                  <Input value={form.flatNumber || ""} placeholder="A-101" readOnly />
                </Field>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Status">
                <Select value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value, paidDate: !isQuote && event.target.value === "paid" ? current.paidDate || current.date : "" }))}>
                  {isQuote ? (
                    <>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </>
                  )}
                </Select>
              </Field>
              <Field label="GST Type">
                <Select value={form.taxMode} onChange={event => setForm(current => ({ ...current, taxMode: event.target.value }))}>
                  <option value="split">CGST + SGST</option>
                  <option value="igst">IGST</option>
                </Select>
              </Field>
            </div>

            {!isQuote && form.status === "paid" && (
              <Field label="Paid Date">
                <Input type="date" value={form.paidDate || ""} min={form.date} max={TODAY} onChange={event => setForm(current => ({ ...current, paidDate: event.target.value }))} />
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
                {isSmallBusinessOrg && (
                  <Select value={item.serviceId || ""} onChange={event => {
                    const service = serviceOptions.find(option => option.id === event.target.value);
                    setForm(current => ({
                      ...current,
                      items: current.items.map(entry => entry.id === item.id ? {
                        ...entry,
                        serviceId: event.target.value,
                        desc: service?.name || entry.desc,
                        subDesc: service?.packageName || service?.notes || entry.subDesc,
                        rate: service?.defaultAmount ? String(service.defaultAmount) : entry.rate
                      } : entry)
                    }));
                  }} style={{ marginBottom: 8 }}>
                    <option value="">{serviceOptions.length ? "Select saved service" : "Add services in Settings first"}</option>
                    {serviceOptions.map(service => (
                      <option key={service.id} value={service.id}>{service.label}</option>
                    ))}
                  </Select>
                )}
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
                <span>Subtotal</span>
                <span>{fmtMoney(tax.subtotal, sym)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                <span>Discount</span>
                <span>-{fmtMoney(getInvoiceDiscount(previewInvoice), sym)}</span>
              </div>
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

            {(isApartmentOrg && form.apartmentInvoiceType === "collections" ? [] : (config.invoiceFields || [])).map(field => (
              <Field key={field.key} label={field.label}>
                {renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
              </Field>
            ))}

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
