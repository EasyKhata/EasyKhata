import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  DateSelectInput,
  Modal,
  Field,
  Input,
  PhoneNumberInput,
  StructuredLocationFields,
  Textarea,
  Select,
  Avatar,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  uid,
  EmptyState,
  SectionSkeleton,
  WorkflowSetupCard,
  WorkflowRecordCard
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
import { buildLocationLabel, buildPhoneNumber, DEFAULT_PHONE_COUNTRY_CODE, isValidUserPhoneNumber, PHONE_COUNTRY_OPTIONS, parseLocationFields, sanitizePhoneDigits, splitPhoneNumber } from "../utils/profile";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  PLAN_LABELS,
  PLANS,
  SUBSCRIPTION_STATUS,
  canUseFeature,
  formatSubscriptionDate,
  getBillingDuration,
  getSubscriptionEndDate,
  getUpgradeCopy
} from "../utils/subscription";
import { adminApi } from "../lib/api";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";
import { logError } from "../utils/logger";

const REQUEST_FILTERS = [
  [PAYMENT_REQUEST_STATUS.PENDING, "Pending"],
  [PAYMENT_REQUEST_STATUS.APPROVED, "Approved"],
  [PAYMENT_REQUEST_STATUS.REJECTED, "Rejected"],
  ["all", "All"]
];
const TODAY = new Date().toISOString().slice(0, 10);

function emptyItem(defaultTaxRate = 18) {
  return { id: uid(), desc: "", subDesc: "", hsn: "", qty: 1, rate: "", taxRate: defaultTaxRate };
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

function buildContactFormState(contact = {}, fallbackCountry = "India") {
  const parsedLocation = parseLocationFields(contact?.location || contact?.address || "");
  const country = contact?.country || parsedLocation.country || fallbackCountry;
  const phoneParts = splitPhoneNumber(contact?.phone || "", contact?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const addressLine = contact?.addressLine || parsedLocation.addressLine || "";
  const city = contact?.city || parsedLocation.city || "";
  const state = contact?.state || parsedLocation.state || "";
  const location = contact?.location || buildLocationLabel({ city, state, country });
  return {
    ...contact,
    name: contact?.name || "",
    phone: contact?.phone || "",
    phoneCountryCode: contact?.phoneCountryCode || phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNumber: phoneParts.phoneNumber,
    addressLine,
    city,
    state,
    country,
    location,
    address: contact?.address || buildLocationLabel({ addressLine, city, state, country }),
    gstin: contact?.gstin || ""
  };
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

  if (field.type === "date") {
    return <DateSelectInput value={value || ""} onChange={onChange} />;
  }

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} step={field.type === "number" ? "0.01" : undefined} />;
}

export default function InvoicesSection({ year, month, documentType = "invoice", orgType, quickstartIntent, onQuickstartHandled, headerDatePicker }) {
  const d = useData();
  const isViewerMode = d.isViewerMode;
  const { user } = useAuth();

  // Lazy-load invoices collection the first time this section mounts
  useEffect(() => { d.ensureCollectionLoaded?.("invoices"); }, [d.ensureCollectionLoaded]);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const isAdmin = user?.role === "admin";
  const effectiveOrgType = getOrgType(orgType || user?.organizationType);
  const config = isAdmin
    ? {
        invoicesLabel: "Subscription Invoices",
        invoiceEntryLabel: "Subscription Invoice",
        invoiceActionLabel: "Create Subscription Invoice",
        customerEntryLabel: "User",
        customerNamePlaceholder: "User name"
      }
    : getOrgConfig(effectiveOrgType);
  const isApartmentOrg = !isAdmin && effectiveOrgType === ORG_TYPES.APARTMENT;
  const showTaxFields = !isApartmentOrg;
  const isSmallBusinessOrg = !isAdmin && effectiveOrgType === ORG_TYPES.SMALL_BUSINESS;
  const isFreelancerOrg = !isAdmin && effectiveOrgType === ORG_TYPES.FREELANCER;
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
  const [errors, setErrors] = useState({});
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentRequestsEnabled, setPaymentRequestsEnabled] = useState(true);
  const [requestFilter, setRequestFilter] = useState(PAYMENT_REQUEST_STATUS.PENDING);
  const [adminRequestError, setAdminRequestError] = useState("");
  const [guidedField, setGuidedField] = useState("");
  const serviceOptions = useMemo(() => (d.orgRecords?.services || []).map(service => ({
    id: service.id,
    name: service.serviceName || "",
    label: [service.serviceName || "", service.packageName || "", service.defaultAmount ? `${sym} ${service.defaultAmount}` : ""].filter(Boolean).join(" - "),
    packageName: service.packageName || "",
    defaultAmount: Number(service.defaultAmount) || 0,
    notes: service.notes || ""
  })).filter(service => service.name), [d.orgRecords?.services, sym]);
  const apartmentFlatOptions = useMemo(() => ([
    ...(societyName ? [{ id: "__building__", flatNumber: societyName, ownerName: "Common Building", tenantName: "", phone: "", isBuilding: true }] : []),
    ...(d.customers || []).map(flat => ({
      id: flat.id,
      flatNumber: flat.name || "",
      ownerName: flat.ownerName || "",
      tenantName: flat.tenantName || "",
      phone: flat.phone || "",
      isBuilding: false
    })).filter(item => item.flatNumber)
  ]), [d.customers, societyName]);
  const apartmentDocumentOptions = apartmentFlatOptions;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        const { users: fetchedUsers } = await adminApi.listUsers(1, 100);
        setUsers(fetchedUsers);
      } catch (err) {
        logError("Fetch users error", err);
      }

      try {
        const requests = await adminApi.listPaymentRequests();
        setPaymentRequests(
          requests.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        );
        setPaymentRequestsEnabled(true);
      } catch (err) {
        logError("Fetch payment requests error", err);
        setPaymentRequests([]);
        setPaymentRequestsEnabled(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const filteredRequests = useMemo(() => (
    paymentRequests.filter(item => requestFilter === "all" || (item.status || PAYMENT_REQUEST_STATUS.PENDING) === requestFilter)
  ), [paymentRequests, requestFilter]);

  const DocumentCard = ({ invoice }) => (
    <WorkflowRecordCard
      avatar={<Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={40} fontSize={14} />}
      title={invoice.customer?.name || invoice.billTo?.name || "--"}
      meta={[
        invoice.number,
        invoice.date ? fmtDate(invoice.date) : "",
        !isApartmentOrg && invoice.dueMessage ? invoice.dueMessage : ""
      ].filter(Boolean).join(" · ")}
      amount={fmtMoney(invoice.total, sym)}
      amountTone="var(--blue)"
      badges={!isApartmentOrg ? [{
        label: getDocumentStatusLabel(invoice.computedStatus, isQuote),
        tone:
          invoice.computedStatus === "paid" || invoice.computedStatus === "approved"
            ? "accent"
            : invoice.computedStatus === "pending" || invoice.computedStatus === "draft"
              ? "gold"
              : invoice.computedStatus === "sent"
                ? "blue"
                : "danger"
      }] : []}
      onClick={() => setDetail(invoice)}
    />
  );

  async function updatePaymentRequestStatus(request, status) {
    setAdminRequestError("");
    try {
      const updated = await adminApi.updatePaymentRequest(request.id, { status });
      setPaymentRequests(current =>
        current.map(item => item.id === request.id ? { ...item, ...updated } : item)
      );
    } catch (err) {
      logError("Payment request status update error", err);
      setAdminRequestError("Unable to update the payment request. Please try again.");
    }
  }

  const blankForm = () => ({
    ...((config.invoiceFields || []).reduce((acc, field) => ({ ...acc, [field.key]: field.type === "select" ? field.options?.[0] || "" : "" }), {})),
    documentType,
    number: isQuote ? getNextQuoteNumber(d.invoices) : getNextInvoiceNumber(d.invoices),
    customerId: "",
    billTo: buildContactFormState({}, d.account?.country || "India"),
    shipTo: buildContactFormState({}, d.account?.country || "India"),
    shipSameAsBill: true,
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    dueDate: "",
    status: isQuote ? "draft" : isApartmentOrg ? "paid" : "pending",
    paidDate: "",
    taxMode: "split",
    items: [emptyItem(showTaxFields ? 18 : 0)],
    notes: isQuote ? "Quote prepared for your review." : isAdmin ? "Invoice for subscription payment." : isApartmentOrg ? "Payment record for society accounting." : "Thanks for your business.",
    terms: isQuote ? "Pricing is based on the current scope and may be updated if requirements change." : isAdmin ? "Payment processed via UPI." : isApartmentOrg ? "This document is generated for society records." : "Payment is due within the agreed billing cycle."
  });

  const [form, setForm] = useState(null);

  const monthInv = useMemo(() => (
    d.invoices
      .filter(invoice => String(invoice.documentType || "invoice") === documentType)
      .filter(invoice => invoice.date?.slice(0, 7) === mk)
      .map(invoice => ({
        ...invoice,
        computedStatus: getDocumentStatus(invoice, isQuote),
        dueMessage: isApartmentOrg ? "" : getDocumentDueMessage(invoice, isQuote),
        total: invoiceGrandTotal(invoice),
      }))
  ), [d.invoices, documentType, isApartmentOrg, isQuote, mk]);
  const total = useMemo(() => monthInv.reduce((sum, invoice) => sum + invoice.total, 0), [monthInv]);
  const pendingCount = useMemo(() => (
    isApartmentOrg ? 0 : monthInv.filter(invoice => invoice.computedStatus !== (isQuote ? "approved" : "paid")).length
  ), [isApartmentOrg, isQuote, monthInv]);
  const filteredMonthInv = useMemo(() => monthInv.filter(invoice => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return true;

    const fields = [
      invoice.customer?.name,
      invoice.billTo?.name,
      invoice.number,
      invoice.date,
      invoice.dueDate,
      invoice.flatNumber,
      invoice.residentName,
      invoice.expenseCategory,
      invoice.total
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return fields.includes(needle);
  }), [monthInv, searchQuery]);

  useEffect(() => {
    if (!d.loaded) return;
    if (!quickstartIntent?.action) return;
    if (quickstartIntent.action !== "first-invoice") return;
    if (isQuote || isApartmentOrg) return;

    setGuidedField("customerId");
    openNew();
    onQuickstartHandled?.();
  }, [d.loaded, isApartmentOrg, isQuote, onQuickstartHandled, quickstartIntent?.action, quickstartIntent?.token]);

  useEffect(() => {
    if (!guidedField) return undefined;
    const timeout = window.setTimeout(() => setGuidedField(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [guidedField]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    if (!canUseFeature(user, "invoiceCreate", {}, effectiveOrgType)) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate", effectiveOrgType));
      return;
    }
    if (isFreelancerOrg && !(d.customers || []).some(c => String(c?.name || "").trim())) {
      window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));
      return;
    }
    setForm(blankForm());
    setEditInv(null);
    setDetail(null);
    setFormError(""); setErrors({});;
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
        taxRate: showTaxFields ? Number(item.taxRate ?? item.igst) || 0 : 0,
        hsn: showTaxFields ? item.hsn || "" : ""
      })),
      billTo: buildContactFormState(invoice.billTo || invoice.customer || {}, d.account?.country || "India"),
      shipTo: buildContactFormState(invoice.shipTo || {}, d.account?.country || "India"),
      shipSameAsBill: invoice.shipSameAsBill ?? true
    });
    setEditInv(invoice);
    setDetail(null);
    setFormError(""); setErrors({});;
    setShowForm(true);
  }

  function openDuplicate(invoice) {
    if (!canUseFeature(user, "invoiceCreate", {}, effectiveOrgType)) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate", effectiveOrgType));
      return;
    }

    setForm({
      ...invoice,
      documentType,
      number: isQuote ? getNextQuoteNumber(d.invoices) : getNextInvoiceNumber(d.invoices),
      customerId: invoice.customerId || invoice.customer?.id || "",
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      dueDate: isApartmentOrg ? "" : invoice.dueDate || "",
      status: isQuote ? "draft" : isApartmentOrg ? "paid" : "pending",
      paidDate: "",
      items: (invoice.items || []).map(item => ({
        ...item,
        id: uid(),
        taxRate: showTaxFields ? Number(item.taxRate ?? item.igst) || 0 : 0,
        hsn: showTaxFields ? item.hsn || "" : ""
      })),
      billTo: buildContactFormState(invoice.billTo || invoice.customer || {}, d.account?.country || "India"),
      shipTo: buildContactFormState(invoice.shipTo || {}, d.account?.country || "India"),
      shipSameAsBill: invoice.shipSameAsBill ?? true
    });
    setEditInv(null);
    setDetail(null);
    setFormError(""); setErrors({});;
    setShowForm(true);
  }

  async function handleDownloadPdf(invoice) {
    if (!canUseFeature(user, "invoicePdf")) {
      setUpgradeInfo(getUpgradeCopy("invoicePdf"));
      return;
    }
    await downloadInvoice(invoice, d.account, sym, { isApartment: isApartmentOrg });
  }

  function closeForm() {
    setShowForm(false);
    setForm(null);
    setEditInv(null);
    setFormError(""); setErrors({});;
  }

  function buildInvoicePayload(currentForm) {
    const entity = isAdmin
      ? users.find(u => u.id === currentForm.customerId)
      : d.customers.find(c => c.id === currentForm.customerId);
    const selectedFlat = isApartmentOrg ? apartmentFlatOptions.find(item => item.id === currentForm.customerId) : null;
    const resolvedBillTo = currentForm.customerId && (entity || selectedFlat)
      ? buildContactFormState({
        name: isApartmentOrg ? selectedFlat?.tenantName || selectedFlat?.ownerName || selectedFlat?.flatNumber || "" : entity.name || entity.email || "",
        addressLine: isApartmentOrg ? "" : entity?.addressLine || "",
        address: isApartmentOrg ? "" : buildLocationLabel({ addressLine: entity?.addressLine, city: entity?.city, state: entity?.state, country: entity?.country }) || entity?.address || "",
        phone: isApartmentOrg ? selectedFlat?.phone || "" : entity?.phone || "",
        phoneCountryCode: isApartmentOrg ? "" : entity?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
        city: isApartmentOrg ? "" : entity?.city || "",
        state: isApartmentOrg ? "" : entity?.state || "",
        country: isApartmentOrg ? "" : entity?.country || d.account?.country || "India",
        gstin: isApartmentOrg ? "" : String(entity?.gstin || "").trim().toUpperCase()
      }, d.account?.country || "India")
      : buildContactFormState({ ...currentForm.billTo, gstin: String(currentForm.billTo?.gstin || "").trim().toUpperCase() }, d.account?.country || "India");
    const resolvedShipTo = isApartmentOrg
      ? buildContactFormState({}, d.account?.country || "India")
      : currentForm.shipSameAsBill
        ? buildContactFormState(resolvedBillTo, d.account?.country || "India")
        : buildContactFormState(currentForm.shipTo, d.account?.country || "India");
    const resolvedStatus = isQuote ? String(currentForm.status || "draft").toLowerCase() : (isApartmentOrg ? "paid" : currentForm.status);

    const payload = {
      ...currentForm,
      number: String(currentForm.number || "").trim(),
      status: resolvedStatus,
      customer: entity || null,
      billTo: {
        ...resolvedBillTo,
        phone: buildPhoneNumber(resolvedBillTo.phoneCountryCode, sanitizePhoneDigits(resolvedBillTo.phoneNumber || resolvedBillTo.phone)),
        location: isApartmentOrg ? "" : buildLocationLabel({ city: resolvedBillTo.city, state: resolvedBillTo.state, country: resolvedBillTo.country }),
        address: isApartmentOrg ? "" : buildLocationLabel({ addressLine: resolvedBillTo.addressLine, city: resolvedBillTo.city, state: resolvedBillTo.state, country: resolvedBillTo.country }) || resolvedBillTo.address || ""
      },
      shipTo: isApartmentOrg ? null : {
        ...resolvedShipTo,
        phone: buildPhoneNumber(resolvedShipTo.phoneCountryCode, sanitizePhoneDigits(resolvedShipTo.phoneNumber || resolvedShipTo.phone)),
        location: buildLocationLabel({ city: resolvedShipTo.city, state: resolvedShipTo.state, country: resolvedShipTo.country }),
        address: buildLocationLabel({ addressLine: resolvedShipTo.addressLine, city: resolvedShipTo.city, state: resolvedShipTo.state, country: resolvedShipTo.country }) || resolvedShipTo.address || ""
      },
      items: currentForm.items.map(item => ({
        ...item,
        qty: Number(item.qty),
        rate: Number(item.rate),
        taxRate: Number(item.taxRate ?? item.igst) || 0
      })),
      dueDate: isApartmentOrg ? "" : currentForm.dueDate || "",
      paidDate: isApartmentOrg ? currentForm.date : (currentForm.status === "paid" ? currentForm.paidDate || currentForm.date : ""),
      shipSameAsBill: isApartmentOrg ? true : Boolean(currentForm.shipSameAsBill)
    };
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
      setErrors(prev => ({ ...prev, number: `Use a valid ${documentLabel.toLowerCase()} number (min 3 characters).` }));
      return;
    }
    const normalizedNumber = String(form.number || "").trim();
    const duplicateNumber = d.invoices.find(invoice => String(invoice.number || "").trim() === normalizedNumber && invoice.id !== editInv?.id);
    if (duplicateNumber) {
      setErrors(prev => ({ ...prev, number: `This number is already in use. Please use a unique ${documentLabel.toLowerCase()} number.` }));
      return;
    }
    if (!isValidDateValue(form.date)) {
      setErrors(prev => ({ ...prev, date: "Choose a valid invoice date." }));
      return;
    }
    if (isFutureDateValue(form.date)) {
      setErrors(prev => ({ ...prev, date: "Future dates are not allowed for records." }));
      return;
    }
    if (!isApartmentOrg && form.dueDate && !isValidDateValue(form.dueDate)) {
      setErrors(prev => ({ ...prev, dueDate: "Choose a valid due date or leave it empty." }));
      return;
    }
    if (!isApartmentOrg && form.dueDate && form.dueDate < form.date) {
      setErrors(prev => ({ ...prev, dueDate: "Due date must be on or after the invoice date." }));
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && !isValidDateValue(form.paidDate)) {
      setErrors(prev => ({ ...prev, paidDate: "Choose a valid paid date." }));
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && isFutureDateValue(form.paidDate)) {
      setErrors(prev => ({ ...prev, paidDate: "Future dates are not allowed." }));
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && form.paidDate < form.date) {
      setErrors(prev => ({ ...prev, paidDate: "Paid date must be on or after the invoice date." }));
      return;
    }
    if (sanitizePhoneDigits(form.billTo?.phoneNumber || "") && !isValidUserPhoneNumber(sanitizePhoneDigits(form.billTo?.phoneNumber || ""))) {
      setErrors(prev => ({ ...prev, billToPhone: "Enter a valid phone number or leave it empty." }));
      return;
    }
    if (!isApartmentOrg && !form.shipSameAsBill && sanitizePhoneDigits(form.shipTo?.phoneNumber || "") && !isValidUserPhoneNumber(sanitizePhoneDigits(form.shipTo?.phoneNumber || ""))) {
      setFormError("Enter a valid ship-to phone number or leave it empty.");
      return;
    }
    if (!form.customerId && !hasMinLength(form.billTo?.name, 2)) {
      setErrors(prev => ({ ...prev, billToName: `Select a ${config.customerEntryLabel.toLowerCase()} or enter the bill-to name.` }));
      return;
    }
    if (showTaxFields && !isValidGstin(form.billTo?.gstin)) {
      setErrors(prev => ({ ...prev, billToGstin: "Enter a valid GSTIN or leave it empty." }));
      return;
    }
    if (!isApartmentOrg && !form.customerId && (!String(form.billTo?.city || "").trim() || !String(form.billTo?.state || "").trim() || !String(form.billTo?.country || "").trim())) {
      setFormError("Enter bill-to city, state, and country.");
      return;
    }
    if (!isApartmentOrg && !form.shipSameAsBill && !hasMinLength(form.shipTo?.name, 2)) {
      setFormError("Enter the ship-to name or use the billing address.");
      return;
    }
    if (!isApartmentOrg && !form.shipSameAsBill && (!String(form.shipTo?.city || "").trim() || !String(form.shipTo?.state || "").trim() || !String(form.shipTo?.country || "").trim())) {
      setFormError("Enter ship-to city, state, and country or use the billing address.");
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
        (showTaxFields ? Number(item.taxRate ?? item.igst) < 0 : false)
    );
    if (invalidItem) {
      setFormError(showTaxFields ? "Each line item needs a description, quantity, rate, and a valid GST rate." : "Each line item needs a description, quantity, and rate.");
      return;
    }

    if (!editInv && isFreelancerOrg && form.customerId) {
      const invoiceMonth = (form.date || "").slice(0, 7);
      const invoiceCountForCustomer = (d.invoices || []).filter(
        inv => inv.customerId === form.customerId && (inv.date || "").slice(0, 7) === invoiceMonth
      ).length;
      if (!canUseFeature(user, "invoiceCreate", { invoiceCountForCustomer }, effectiveOrgType)) {
        setFormError(getUpgradeCopy("invoiceCreate", effectiveOrgType).message);
        return;
      }
    }

    const invoice = buildInvoicePayload(form);
    if (editInv) {
      d.updateInvoice(invoice);
      syncApartmentLinkedEntries(invoice);
    } else {
      const hadAnyInvoice = (d.invoices || []).some(item => String(item?.documentType || "invoice") === "invoice");
      const createdInvoice = { ...invoice, id: uid() };
      d.addInvoice(createdInvoice);
      syncApartmentLinkedEntries(createdInvoice);
      if (!hadAnyInvoice && !isQuote && !isApartmentOrg) {
        window.dispatchEvent(new CustomEvent("ledger:first-success", {
          detail: {
            title: "First invoice created",
            message: "Great start. Next, record one expense to unlock a useful profit snapshot.",
            actionLabel: "Open Expenses",
            target: { tab: "expenses" }
          }
        }));
      }
    }

    closeForm();
  }

  function addItem() {
    setForm(current => ({ ...current, items: [...current.items, emptyItem(showTaxFields ? 18 : 0)] }));
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
      billTo: (entity || flatRecord)
          ? buildContactFormState({
            name: isApartmentOrg ? flatRecord?.tenantName || flatRecord?.ownerName || flatRecord?.flatNumber || "" : entity.name || entity.email || "",
            addressLine: isApartmentOrg ? "" : entity?.addressLine || "",
            address: isApartmentOrg ? "" : buildLocationLabel({ addressLine: entity?.addressLine, city: entity?.city, state: entity?.state, country: entity?.country }) || entity?.address || "",
            phone: isApartmentOrg ? flatRecord?.phone || "" : entity?.phone || "",
            phoneCountryCode: isApartmentOrg ? "" : entity?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
            city: isApartmentOrg ? "" : entity?.city || "",
            state: isApartmentOrg ? "" : entity?.state || "",
            country: isApartmentOrg ? "" : entity?.country || d.account?.country || "India",
            gstin: isApartmentOrg ? "" : entity?.gstin || ""
          }, d.account?.country || "India")
          : current.billTo,
      shipTo: isApartmentOrg
        ? current.shipTo
        : (entity || flatRecord)
          ? buildContactFormState({
            name: entity.name || entity.email || "",
            addressLine: entity?.addressLine || "",
            address: buildLocationLabel({ addressLine: entity?.addressLine, city: entity?.city, state: entity?.state, country: entity?.country }) || entity?.address || "",
            phone: entity?.phone || "",
            phoneCountryCode: entity?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
            city: entity?.city || "",
            state: entity?.state || "",
            country: entity?.country || d.account?.country || "India"
          }, d.account?.country || "India")
          : current.shipTo
    }));
  }

  function updateInvoiceStatus(invoice, status) {
    if (isApartmentOrg) return;
    const nextInvoice = {
      ...invoice,
      status,
      paidDate: !isQuote && status === "paid" ? invoice.paidDate || new Date().toISOString().slice(0, 10) : ""
    };
    d.updateInvoice(nextInvoice);
    syncApartmentLinkedEntries(nextInvoice);
    setDetail({ ...nextInvoice, computedStatus: getDocumentStatus(nextInvoice, isQuote), dueMessage: getDocumentDueMessage(nextInvoice, isQuote), total: invoiceGrandTotal(nextInvoice) });
  }

  return (
    <div className="ledger-screen">
        <div className="ledger-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 65%)" }}>
          <div className="ledger-hero-meta">
            <div className="ledger-overline" style={{ color: "var(--blue)", marginBottom: 6 }}>
              {isAdmin ? "Subscription Invoices" : documentCollectionLabel} · {MONTHS[month]} {year}
            </div>
            <div className="ledger-hero-value" style={{ color: "var(--blue)" }}>{fmtMoney(total, sym)}</div>
            <div className="ledger-hero-sub">
              {monthInv.length} {documentLabel.toLowerCase()}(s){!isApartmentOrg ? ` · ${pendingCount} ${isQuote ? "open" : "pending"}` : ""}
            </div>
          </div>
          <div className="ledger-hero-actions">
            <div style={{ flex: isMobile ? "1 1 100%" : "0 0 auto", minWidth: isMobile ? "100%" : 0 }}>{headerDatePicker}</div>
            {!isAdmin && !isViewerMode && (
              <button className="btn-secondary" onClick={openNew} style={{ minWidth: isMobile ? "100%" : 180, whiteSpace: "nowrap" }}>
                + New {documentLabel}
              </button>
            )}
          </div>
        </div>

      {isViewerMode && (
        <div style={{ margin: "0 18px", marginTop: 14, padding: "9px 14px", borderRadius: 10, background: "var(--surface-high)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>
          View only · Contact the org owner to add or edit records
        </div>
      )}

      <div className="ledger-block">
        {monthInv.length > 0 && (
          <div className="ledger-feed-card ledger-search-card" style={{ marginBottom: 18 }}>
            <Field label={`Search ${documentCollectionLabel}`} hint="Find records by name, flat, number, date, amount, or type.">
              <Input placeholder={`Search ${documentCollectionLabel.toLowerCase()}...`} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
            </Field>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {filteredMonthInv.length} of {monthInv.length} {documentLabel.toLowerCase()}(s) shown for {MONTHS[month]} {year}
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            <div className="ledger-block-header" style={{ marginBottom: 10 }}>
              <div>
                <div className="ledger-block-title">Payment Requests</div>
                <div className="ledger-block-caption">Review payment proofs and subscription approvals in one queue.</div>
              </div>
            </div>
            <div className="ledger-feed-card" style={{ padding: 14, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {REQUEST_FILTERS.map(([value, label]) => (
                  <button
                    key={value}
                    className="btn-secondary"
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      background: requestFilter === value ? "var(--surface-pop)" : "var(--surface-high)",
                      color: requestFilter === value ? "var(--text)" : "var(--text-sec)"
                    }}
                    onClick={() => setRequestFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 12, lineHeight: 1.7 }}>
                Keep payment proofs and subscription approvals together in this subscriptions workspace.
              </div>
              {adminRequestError && <div style={{ marginTop: 12, fontSize: 12, color: "var(--danger)" }}>{adminRequestError}</div>}
            </div>

            <div className="ledger-feed-card" style={{ marginBottom: 18 }}>
              {!paymentRequestsEnabled ? (
                <EmptyState title="Payment requests are locked by rules" message="The payment_requests collection is not readable yet. Add rules for payment_requests to manage approvals here." accentColor="var(--gold)" />
              ) : filteredRequests.length === 0 ? (
                <EmptyState title="No payment requests" message="Customer UPI payment submissions will appear here for admin verification." accentColor="var(--gold)" />
              ) : (
                filteredRequests.map(request => (
                  <div key={request.id} className="ledger-feed-row" style={{ alignItems: "flex-start", gap: 14 }}>
                    <Avatar name={request.userName || request.userEmail || "?"} size={42} fontSize={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{request.userName || "Unnamed User"}</span>
                        <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>
                          {request.requestedPlan === PLANS.BUSINESS ? "Business (Coming Soon)" : `${PLAN_LABELS[request.requestedPlan || PLANS.PRO] || "Pro"} ${request.billingCycle === BILLING_CYCLES.YEARLY ? "Yearly" : "Monthly"}`}
                        </span>
                        <span
                          className="pill"
                          style={{
                            background:
                              (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.APPROVED
                                ? "var(--accent-deep)"
                                : (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.REJECTED
                                  ? "var(--danger-deep)"
                                  : "var(--gold-deep)",
                            color:
                              (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.APPROVED
                                ? "var(--accent)"
                                : (request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.REJECTED
                                  ? "var(--danger)"
                                  : "var(--gold)"
                          }}
                        >
                          {request.status || PAYMENT_REQUEST_STATUS.PENDING}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 4 }}>{request.userEmail || "No email"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        Amount Rs {request.amount || 0} - Razorpay ID {request.transactionId || "--"} - Submitted {formatSubscriptionDate(request.createdAt) || "--"}
                      </div>

                      {request.note && (
                        <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, background: "var(--surface-high)", borderRadius: 12, padding: "10px 12px" }}>
                          {request.note}
                        </div>
                      )}

                      {request.screenshotUrl && (
                        <a
                          href={request.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ display: "inline-flex", marginTop: 12, padding: "8px 12px", fontSize: 12, textDecoration: "none", color: "var(--blue)" }}
                        >
                          View Payment Screenshot
                        </a>
                      )}

                      {(request.status || PAYMENT_REQUEST_STATUS.PENDING) === PAYMENT_REQUEST_STATUS.PENDING && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                          <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, color: "var(--accent)" }} onClick={() => updatePaymentRequestStatus(request, PAYMENT_REQUEST_STATUS.APPROVED)}>
                            Approve Payment
                          </button>
                          <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12, color: "var(--danger)" }} onClick={() => updatePaymentRequestStatus(request, PAYMENT_REQUEST_STATUS.REJECTED)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="ledger-feed-card">
          {monthInv.length === 0 ? (
            <WorkflowSetupCard
              eyebrow={isQuote ? "Quotes" : isApartmentOrg ? "Receipts & bills" : "Documents"}
              title={isAdmin ? "No subscription invoices yet" : isApartmentOrg ? "No documents yet" : `No ${documentCollectionLabel.toLowerCase()} yet`}
              message={isAdmin ? "Create invoices for subscription payments." : isQuote ? "Create your first quote to prepare pricing before sending an invoice." : isApartmentOrg ? "Create your first receipt or bill for this month." : `Create your first ${config.invoiceEntryLabel.toLowerCase()} to start tracking revenue and reminders.`}
              actionLabel={isQuote ? "Create Quote" : config.invoiceActionLabel}
              onAction={openNew}
              tone="accent"
            />
          ) : filteredMonthInv.length === 0 ? (
            <EmptyState title="No matching records" message="Try a different search term to find the receipt or bill you need." accentColor="var(--blue)" />
          ) : (
            filteredMonthInv.map(invoice => <DocumentCard key={invoice.id} invoice={invoice} />)
          )}
        </div>
      </div>

      {detail && (() => {
        const invoice = d.invoices.find(item => item.id === detail.id) || detail;
        const computedStatus = getDocumentStatus(invoice, isQuote);
        const tax = getInvoiceTaxBreakdown(invoice);
        const grandTotal = invoiceGrandTotal(invoice);
        const dueMessage = isApartmentOrg ? "" : getDocumentDueMessage(invoice, isQuote);
        return (
          <Modal title={invoice.number} onClose={() => setDetail(null)} onSave={!isViewerMode ? () => openEdit(invoice) : undefined} saveLabel="Edit" accentColor="var(--blue)">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={52} fontSize={20} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {isQuote ? "Prepared" : "Issued"} {fmtDate(invoice.date)}{!isApartmentOrg && invoice.dueDate ? ` · ${isQuote ? "Valid until" : "Due"} ${fmtDate(invoice.dueDate)}` : ""}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 38, color: "var(--blue)" }}>{fmtMoney(grandTotal, sym)}</div>
                {!isApartmentOrg && dueMessage && <div style={{ fontSize: 13, color: getDocumentStatusColor(computedStatus, isQuote) }}>{dueMessage}</div>}
              </div>
              {!isApartmentOrg && (
                <div style={{ padding: "7px 12px", borderRadius: 999, background: `${getDocumentStatusColor(computedStatus, isQuote)}22`, color: getDocumentStatusColor(computedStatus, isQuote), fontSize: 12, fontWeight: 700 }}>
                  {getDocumentStatusLabel(computedStatus, isQuote)}
                </div>
              )}
            </div>

            {isApartmentOrg ? (
              <div style={{ background: "var(--surface-high)", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{invoice.billTo?.name || invoice.customer?.name || "--"}</div>
                {invoice.billTo?.phone && <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>Phone: {invoice.billTo.phone}</div>}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[["Bill To", invoice.billTo], ["Ship To", invoice.shipTo]].map(([label, block]) => (
                  <div key={label} style={{ background: "var(--surface-high)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{block?.name || "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2, lineHeight: 1.6 }}>{(block?.address || "").replace(/\n/g, ", ")}</div>
                    {showTaxFields && block?.gstin && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>GSTIN: {block.gstin}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="ledger-feed-card" style={{ marginBottom: 16 }}>
              {invoice.items.map(item => (
                <div key={item.id} className="ledger-feed-row">
                  <div className="ledger-feed-main">
                    <div className="ledger-feed-title">{item.desc || "Item"}</div>
                    {item.subDesc && <div className="ledger-feed-meta">{item.subDesc}</div>}
                    <div className="ledger-feed-meta" style={{ marginTop: 3 }}>
                      {showTaxFields ? `${item.hsn ? `HSN ${item.hsn} · ` : ""}${item.qty} × ${fmtMoney(item.rate, sym)} · GST ${Number(item.taxRate ?? item.igst ?? 0)}%` : `${item.qty} × ${fmtMoney(item.rate, sym)}`}
                    </div>
                  </div>
                  <div className="ledger-feed-side">
                    <span className="ledger-feed-amount">{fmtMoney((Number(item.qty) || 0) * (Number(item.rate) || 0), sym)}</span>
                  </div>
                </div>
              ))}
              <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--text-sec)" }}>
                {!isApartmentOrg && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Subtotal</span>
                      <span>{fmtMoney(tax.subtotal, sym)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Discount</span>
                      <span>-{fmtMoney(getInvoiceDiscount(invoice), sym)}</span>
                    </div>
                  </>
                )}
                {showTaxFields && (
                  <>
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
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--blue)" }}>{fmtMoney(grandTotal, sym)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && <div className="card" style={{ padding: "14px 18px", fontSize: 14, color: "var(--text-sec)", marginBottom: 14, lineHeight: 1.6 }}><strong style={{ color: "var(--text)" }}>Notes:</strong> {invoice.notes}</div>}
            {invoice.terms && <div className="card" style={{ padding: "14px 18px", fontSize: 13, color: "var(--text-sec)", marginBottom: 18, lineHeight: 1.6 }}><strong style={{ color: "var(--text)" }}>Terms:</strong> {invoice.terms}</div>}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${isViewerMode ? 1 : isApartmentOrg ? 2 : 3}, 1fr)`, gap: 10, marginBottom: 12 }}>
              {!isApartmentOrg && !isViewerMode && (
                <button onClick={() => updateInvoiceStatus(invoice, isQuote ? (computedStatus === "draft" ? "sent" : computedStatus === "sent" ? "approved" : "draft") : computedStatus === "paid" ? "pending" : "paid")} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: isQuote ? "var(--gold-deep)" : computedStatus === "paid" ? "var(--gold-deep)" : "var(--accent)", color: isQuote ? "var(--gold)" : computedStatus === "paid" ? "var(--gold)" : "#0C0C10" }}>
                  {isQuote ? (computedStatus === "draft" ? "Mark Sent" : computedStatus === "sent" ? "Mark Approved" : "Mark Draft") : computedStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                </button>
              )}
              {!isViewerMode && (
                <button onClick={() => openDuplicate(invoice)} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "var(--surface-high)", color: "var(--text)" }}>
                  Duplicate
                </button>
              )}
              <button onClick={() => handleDownloadPdf(invoice)} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "var(--blue)", color: "#fff" }}>
                Download PDF
              </button>
            </div>

            {!isViewerMode && (
              <button onClick={() => { if (window.confirm(`Delete this ${documentLabel.toLowerCase()}?`)) { removeApartmentLinkedEntries(invoice.id); d.removeInvoice(invoice.id); setDetail(null); } }} style={{ width: "100%", border: "1px solid var(--danger)44", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "var(--danger-deep)", color: "var(--danger)" }}>
                Delete {documentLabel}
              </button>
            )}
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

            <Field label={`${documentLabel} Number`} error={errors.number}>
              <Input error={errors.number} value={form.number} onChange={event => { setForm(current => ({ ...current, number: event.target.value })); if (errors.number) setErrors(prev => ({ ...prev, number: "" })); }} />
            </Field>

            <Field label={isAdmin ? "User" : config.customerEntryLabel} hint={isAdmin ? "Select a user who made the payment." : isApartmentOrg ? "Optional. Pick a flat record to auto-fill the name, or leave it empty and type the recipient manually." : `Select an existing ${config.customerEntryLabel.toLowerCase()} to auto-fill billing and shipping details.`}>
              <Select
                value={form.customerId}
                onChange={event => selectCustomer(event.target.value)}
                autoFocus={guidedField === "customerId"}
                style={guidedField === "customerId" ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(103,178,255,0.2)" } : undefined}
              >
                <option value="">{isAdmin ? "-- Select user --" : `-- Select ${config.customerEntryLabel.toLowerCase()} --`}</option>
                {(isAdmin ? users : (isApartmentOrg ? apartmentDocumentOptions : d.customers)).map(entity => (
                  <option key={entity.id} value={entity.id}>{isApartmentOrg ? [entity.flatNumber, entity.ownerName || entity.tenantName || "", !entity.isBuilding ? societyName : ""].filter(Boolean).join(" - ") : entity.name || entity.email}</option>
                ))}
              </Select>
            </Field>

            {!form.customerId && (
              <>
                <Field label={isApartmentOrg ? "Recipient Name" : "Bill To Name"} required error={errors.billToName}>
                  <Input error={errors.billToName} placeholder={config.customerNamePlaceholder} value={form.billTo?.name || ""} onChange={event => { setForm(current => ({ ...current, billTo: { ...current.billTo, name: event.target.value } })); if (errors.billToName) setErrors(prev => ({ ...prev, billToName: "" })); }} />
                </Field>
                {!isApartmentOrg && (
                  <>
                    <Field label="Bill To Phone" error={errors.billToPhone}>
                      <PhoneNumberInput
                        countryCode={form.billTo?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
                        phoneNumber={form.billTo?.phoneNumber || ""}
                        onCountryCodeChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, phoneCountryCode: value } }))}
                        onPhoneNumberChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, phoneNumber: value } }))}
                        countryOptions={PHONE_COUNTRY_OPTIONS}
                        phonePlaceholder="9876543210"
                      />
                    </Field>
                    <StructuredLocationFields
                      addressLine={form.billTo?.addressLine || ""}
                      city={form.billTo?.city || ""}
                      state={form.billTo?.state || ""}
                      country={form.billTo?.country || d.account?.country || "India"}
                      onAddressLineChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, addressLine: value } }))}
                      onCityChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, city: value } }))}
                      onStateChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, state: value } }))}
                      onCountryChange={value => setForm(current => ({ ...current, billTo: { ...current.billTo, country: value } }))}
                    />
                  </>
                )}
                {showTaxFields && <Field label="Bill To GSTIN" error={errors.billToGstin}>
                  <Input error={errors.billToGstin} placeholder="GSTIN (optional)" value={form.billTo?.gstin || ""} onChange={event => { setForm(current => ({ ...current, billTo: { ...current.billTo, gstin: event.target.value } })); if (errors.billToGstin) setErrors(prev => ({ ...prev, billToGstin: "" })); }} />
                </Field>}
              </>
            )}

            {!isApartmentOrg && (
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
                    <Field label="Ship To Phone">
                      <PhoneNumberInput
                        countryCode={form.shipTo?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
                        phoneNumber={form.shipTo?.phoneNumber || ""}
                        onCountryCodeChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, phoneCountryCode: value } }))}
                        onPhoneNumberChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, phoneNumber: value } }))}
                        countryOptions={PHONE_COUNTRY_OPTIONS}
                        phonePlaceholder="9876543210"
                      />
                    </Field>
                    <StructuredLocationFields
                      addressLine={form.shipTo?.addressLine || ""}
                      city={form.shipTo?.city || ""}
                      state={form.shipTo?.state || ""}
                      country={form.shipTo?.country || form.billTo?.country || d.account?.country || "India"}
                      onAddressLineChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, addressLine: value } }))}
                      onCityChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, city: value } }))}
                      onStateChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, state: value } }))}
                      onCountryChange={value => setForm(current => ({ ...current, shipTo: { ...current.shipTo, country: value } }))}
                    />
                  </>
                )}
              </Field>
            )}

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (isApartmentOrg ? "1fr" : "1fr 1fr"), gap: 10 }}>
              <Field label="Invoice Date" required error={errors.date}>
                <DateSelectInput value={form.date} onChange={value => { setForm(current => ({ ...current, date: value })); if (errors.date) setErrors(prev => ({ ...prev, date: "" })); }} max={TODAY} />
              </Field>
              {!isApartmentOrg && (
                <Field label={isQuote ? "Valid Until" : "Due Date"} error={errors.dueDate}>
                  <DateSelectInput value={form.dueDate || ""} onChange={value => { setForm(current => ({ ...current, dueDate: value })); if (errors.dueDate) setErrors(prev => ({ ...prev, dueDate: "" })); }} min={form.date} max={TODAY} />
                </Field>
              )}
            </div>

            {!isApartmentOrg && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
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
                {showTaxFields && <Field label="GST Type">
                  <Select value={form.taxMode} onChange={event => setForm(current => ({ ...current, taxMode: event.target.value }))}>
                    <option value="split">CGST + SGST</option>
                    <option value="igst">IGST</option>
                  </Select>
                </Field>}
              </div>
            )}

            {!isApartmentOrg && !isQuote && form.status === "paid" && (
              <Field label="Paid Date" error={errors.paidDate}>
                <DateSelectInput value={form.paidDate || ""} onChange={value => { setForm(current => ({ ...current, paidDate: value })); if (errors.paidDate) setErrors(prev => ({ ...prev, paidDate: "" })); }} min={form.date} max={TODAY} />
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
                {showTaxFields && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>HSN / SAC</label>
                      <Input placeholder="998314" value={item.hsn || ""} onChange={event => setItem(item.id, "hsn", event.target.value)} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>GST Rate %</label>
                      <Input type="number" min="0" placeholder="18" value={item.taxRate ?? item.igst ?? ""} onChange={event => setItem(item.id, "taxRate", event.target.value)} />
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
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
              Add Line Item
            </button>

            <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
              {!isApartmentOrg && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                    <span>Subtotal</span>
                    <span>{fmtMoney(tax.subtotal, sym)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 14, color: "var(--text-sec)" }}>
                    <span>Discount</span>
                    <span>-{fmtMoney(getInvoiceDiscount(previewInvoice), sym)}</span>
                  </div>
                </>
              )}
              {showTaxFields && (
                <>
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
                </>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, color: "var(--text)", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span>Total</span>
                <span style={{ color: "var(--blue)" }}>{fmtMoney(previewTotal, sym)}</span>
              </div>
            </div>

            {(config.invoiceFields || []).map(field => (
              <Field key={field.key} label={field.label}>
                {renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
              </Field>
            ))}

            <Field label="Notes">
              <Textarea placeholder="Any message for the customer" value={form.notes || ""} onChange={event => setForm(current => ({ ...current, notes: event.target.value }))} />
            </Field>
            <Field label="Terms & Conditions">
              <Textarea placeholder={showTaxFields ? "Payment terms, delivery notes, or GST wording" : "Payment terms or document notes"} value={form.terms || ""} onChange={event => setForm(current => ({ ...current, terms: event.target.value }))} />
            </Field>
          </Modal>
        );
      })()}

      <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
    </div>
  );
}
