import React, { useState, useEffect } from "react";
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
import { buildLocationLabel, buildPhoneNumber, DEFAULT_PHONE_COUNTRY_CODE, isValidUserPhoneNumber, PHONE_COUNTRY_OPTIONS, parseLocationFields, sanitizePhoneDigits, splitPhoneNumber } from "../utils/profile";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  PLAN_LABELS,
  PLANS,
  SUBSCRIPTION_STATUS,
  UPI_CONFIG,
  canUseFeature,
  formatSubscriptionDate,
  getBillingDuration,
  getSubscriptionEndDate,
  getUpgradeCopy
} from "../utils/subscription";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";

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

export default function InvoicesSection({ year, month, documentType = "invoice", orgType }) {
  const d = useData();
  const { user } = useAuth();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentRequestsEnabled, setPaymentRequestsEnabled] = useState(true);
  const [requestFilter, setRequestFilter] = useState(PAYMENT_REQUEST_STATUS.PENDING);
  const [adminRequestError, setAdminRequestError] = useState("");
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
  const apartmentDocumentOptions = apartmentFlatOptions;

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

      try {
        const requestsSnapshot = await getDocs(collection(db, "payment_requests"));
        setPaymentRequests(
          requestsSnapshot.docs
            .map(item => ({
              id: item.id,
              ...item.data()
            }))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        );
        setPaymentRequestsEnabled(true);
      } catch (err) {
        console.error("Fetch payment requests error:", err);
        setPaymentRequests([]);
        setPaymentRequestsEnabled(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const filteredRequests = paymentRequests.filter(item => requestFilter === "all" || (item.status || PAYMENT_REQUEST_STATUS.PENDING) === requestFilter);

  async function updatePaymentRequestStatus(request, status) {
    setAdminRequestError("");
    try {
      const requestRef = doc(db, "payment_requests", request.id);
      const updates = {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (status === PAYMENT_REQUEST_STATUS.APPROVED) {
        await updateDoc(doc(db, "users", request.userId), {
          plan: request.requestedPlan || PLANS.PRO,
          subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
          subscriptionEndsAt: getSubscriptionEndDate(getBillingDuration(request.billingCycle || BILLING_CYCLES.MONTHLY))
        });
      }

      if (status === PAYMENT_REQUEST_STATUS.REJECTED) {
        updates.rejectionReason = "Payment proof not approved";
      }

      await setDoc(requestRef, updates, { merge: true });

      setPaymentRequests(current =>
        current.map(item =>
          item.id === request.id
            ? { ...item, ...updates }
            : item
        )
      );
    } catch (err) {
      console.error("Payment request status update error:", err);
      setAdminRequestError("Unable to update the payment request. Please try again.");
      alert(err?.message || "Unable to update the payment request. Please try again.");
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

  const monthInv = d.invoices
    .filter(invoice => String(invoice.documentType || "invoice") === documentType)
    .filter(invoice => invoice.date?.slice(0, 7) === mk)
    .map(invoice => ({
      ...invoice,
      computedStatus: getDocumentStatus(invoice, isQuote),
      dueMessage: isApartmentOrg ? "" : getDocumentDueMessage(invoice, isQuote),
      total: invoiceGrandTotal(invoice),
    }));
  const total = monthInv.reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingCount = isApartmentOrg ? 0 : monthInv.filter(invoice => invoice.computedStatus !== (isQuote ? "approved" : "paid")).length;
  const filteredMonthInv = monthInv.filter(invoice => {
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
  });

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
        taxRate: showTaxFields ? Number(item.taxRate ?? item.igst) || 0 : 0,
        hsn: showTaxFields ? item.hsn || "" : ""
      })),
      billTo: buildContactFormState(invoice.billTo || invoice.customer || {}, d.account?.country || "India"),
      shipTo: buildContactFormState(invoice.shipTo || {}, d.account?.country || "India"),
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
    setFormError("");
    setShowForm(true);
  }

  function handleDownloadPdf(invoice) {
    if (!canUseFeature(user, "invoicePdf")) {
      setUpgradeInfo(getUpgradeCopy("invoicePdf"));
      return;
    }
    downloadInvoice(invoice, d.account, sym, { isApartment: isApartmentOrg });
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
    if (!isApartmentOrg && form.dueDate && !isValidDateValue(form.dueDate)) {
      setFormError("Choose a valid due date or leave it empty.");
      return;
    }
    if (!isApartmentOrg && form.dueDate && form.dueDate < form.date) {
      setFormError("Due date must be on or after the invoice date.");
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && !isValidDateValue(form.paidDate)) {
      setFormError("Choose a valid paid date.");
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && isFutureDateValue(form.paidDate)) {
      setFormError("Future dates are not allowed for records.");
      return;
    }
    if (!isApartmentOrg && !isQuote && form.status === "paid" && form.paidDate && form.paidDate < form.date) {
      setFormError("Paid date must be on or after the invoice date.");
      return;
    }
    if (sanitizePhoneDigits(form.billTo?.phoneNumber || "") && !isValidUserPhoneNumber(sanitizePhoneDigits(form.billTo?.phoneNumber || ""))) {
      setFormError("Enter a valid bill-to phone number or leave it empty.");
      return;
    }
    if (!isApartmentOrg && !form.shipSameAsBill && sanitizePhoneDigits(form.shipTo?.phoneNumber || "") && !isValidUserPhoneNumber(sanitizePhoneDigits(form.shipTo?.phoneNumber || ""))) {
      setFormError("Enter a valid ship-to phone number or leave it empty.");
      return;
    }
    if (!form.customerId && !hasMinLength(form.billTo?.name, 2)) {
      setFormError(`Select a ${config.customerEntryLabel.toLowerCase()} or enter the bill-to name.`);
      return;
    }
    if (showTaxFields && !isValidGstin(form.billTo?.gstin)) {
      setFormError("Enter a valid bill-to GSTIN or leave it empty.");
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
    <div style={{ paddingBottom: 100 }}>
        <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep) 0%, var(--bg) 60%)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            {isAdmin ? "Subscription Invoices" : documentCollectionLabel} · {MONTHS[month]} {year}
          </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--blue)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {monthInv.length} {documentLabel.toLowerCase()}(s){!isApartmentOrg ? ` · ${pendingCount} ${isQuote ? "open" : "pending"}` : ""}
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {monthInv.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 18 }}>
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
            <div className="section-label">Payment Requests</div>
            <div className="card" style={{ padding: 14, marginBottom: 18 }}>
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

            <div className="card" style={{ marginBottom: 18 }}>
              {!paymentRequestsEnabled ? (
                <EmptyState title="Payment requests are locked by rules" message="The payment_requests collection is not readable yet. Add rules for payment_requests to manage approvals here." accentColor="var(--gold)" />
              ) : filteredRequests.length === 0 ? (
                <EmptyState title="No payment requests" message="Customer UPI payment submissions will appear here for admin verification." accentColor="var(--gold)" />
              ) : (
                filteredRequests.map(request => (
                  <div key={request.id} className="card-row" style={{ alignItems: "flex-start", gap: 14 }}>
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
                        Amount Rs {request.amount || 0} - UPI {request.transactionId || "--"} - Submitted {formatSubscriptionDate(request.createdAt) || "--"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
                        Payee {request.upiPayeeName || UPI_CONFIG.payeeName} - UPI ID {request.upiId || UPI_CONFIG.upiId}
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

        <div className="card">
          {monthInv.length === 0 ? (
            <EmptyState title={isAdmin ? "No subscription invoices this month" : `No ${documentCollectionLabel.toLowerCase()} this month`} message={isAdmin ? "Create invoices for subscription payments." : isQuote ? "Create your first quote to prepare pricing before sending an invoice." : `Create your first ${config.invoiceEntryLabel.toLowerCase()} to start tracking revenue, reminders, and history.`} actionLabel={isQuote ? "Create Quote" : config.invoiceActionLabel} onAction={openNew} accentColor="var(--blue)" />
          ) : filteredMonthInv.length === 0 ? (
            <EmptyState title="No matching records" message="Try a different search term to find the receipt or bill you need." accentColor="var(--blue)" />
          ) : (
            filteredMonthInv.map(invoice => (
              <div key={invoice.id} className="card-row" onClick={() => setDetail(invoice)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Avatar name={invoice.customer?.name || invoice.billTo?.name || "?"} size={40} fontSize={14} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{invoice.customer?.name || invoice.billTo?.name || "--"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{invoice.number} · {fmtDate(invoice.date)}</div>
                      {!isApartmentOrg && invoice.dueMessage && (
                        <div style={{ fontSize: 11, color: getDocumentStatusColor(invoice.computedStatus, isQuote), marginTop: 3 }}>
                          {invoice.dueMessage}
                        </div>
                      )}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(invoice.total, sym)}</div>
                  {!isApartmentOrg && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: getDocumentStatusColor(invoice.computedStatus, isQuote), marginTop: 4 }}>
                      {getDocumentStatusLabel(invoice.computedStatus, isQuote)}
                    </div>
                  )}
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
      </div>

      {detail && (() => {
        const invoice = d.invoices.find(item => item.id === detail.id) || detail;
        const computedStatus = getDocumentStatus(invoice, isQuote);
        const tax = getInvoiceTaxBreakdown(invoice);
        const grandTotal = invoiceGrandTotal(invoice);
        const dueMessage = isApartmentOrg ? "" : getDocumentDueMessage(invoice, isQuote);
        return (
          <Modal title={invoice.number} onClose={() => setDetail(null)} onSave={() => openEdit(invoice)} saveLabel="Edit" accentColor="var(--blue)">
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
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

            <div className="card" style={{ marginBottom: 16 }}>
              {invoice.items.map(item => (
                <div key={item.id} className="card-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.desc || "Item"}</div>
                    {item.subDesc && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{item.subDesc}</div>}
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
                      {showTaxFields ? `${item.hsn ? `HSN ${item.hsn} · ` : ""}${item.qty} × ${fmtMoney(item.rate, sym)} · GST ${Number(item.taxRate ?? item.igst ?? 0)}%` : `${item.qty} × ${fmtMoney(item.rate, sym)}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{fmtMoney((Number(item.qty) || 0) * (Number(item.rate) || 0), sym)}</span>
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

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${isApartmentOrg ? 2 : 3}, 1fr)`, gap: 10, marginBottom: 12 }}>
              {!isApartmentOrg && (
                <button onClick={() => updateInvoiceStatus(invoice, isQuote ? (computedStatus === "draft" ? "sent" : computedStatus === "sent" ? "approved" : "draft") : computedStatus === "paid" ? "pending" : "paid")} style={{ border: "none", borderRadius: 14, padding: "14px", fontFamily: "var(--font)", fontSize: 14, fontWeight: 700, cursor: "pointer", background: isQuote ? "var(--gold-deep)" : computedStatus === "paid" ? "var(--gold-deep)" : "var(--accent)", color: isQuote ? "var(--gold)" : computedStatus === "paid" ? "var(--gold)" : "#0C0C10" }}>
                  {isQuote ? (computedStatus === "draft" ? "Mark Sent" : computedStatus === "sent" ? "Mark Approved" : "Mark Draft") : computedStatus === "paid" ? "Mark Pending" : "Mark Paid"}
                </button>
              )}
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

            <Field label={isAdmin ? "User" : config.customerEntryLabel} hint={isAdmin ? "Select a user who made the payment." : isApartmentOrg ? "Optional. Pick a flat record to auto-fill the name, or leave it empty and type the recipient manually." : `Select an existing ${config.customerEntryLabel.toLowerCase()} to auto-fill billing and shipping details.`}>
              <Select value={form.customerId} onChange={event => selectCustomer(event.target.value)}>
                <option value="">{isAdmin ? "-- Select user --" : `-- Select ${config.customerEntryLabel.toLowerCase()} --`}</option>
                {(isAdmin ? users : (isApartmentOrg ? apartmentDocumentOptions : d.customers)).map(entity => (
                  <option key={entity.id} value={entity.id}>{isApartmentOrg ? [entity.flatNumber, entity.ownerName || entity.tenantName || "", !entity.isBuilding ? societyName : ""].filter(Boolean).join(" - ") : entity.name || entity.email}</option>
                ))}
              </Select>
            </Field>

            {!form.customerId && (
              <>
                <Field label={isApartmentOrg ? "Recipient Name" : "Bill To Name"} required>
                  <Input placeholder={config.customerNamePlaceholder} value={form.billTo?.name || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, name: event.target.value } }))} />
                </Field>
                {!isApartmentOrg && (
                  <>
                    <Field label="Bill To Phone">
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
                {showTaxFields && <Field label="Bill To GSTIN">
                  <Input placeholder="GSTIN (optional)" value={form.billTo?.gstin || ""} onChange={event => setForm(current => ({ ...current, billTo: { ...current.billTo, gstin: event.target.value } }))} />
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

            <div style={{ display: "grid", gridTemplateColumns: isApartmentOrg ? "1fr" : "1fr 1fr", gap: 10 }}>
              <Field label="Invoice Date" required>
                <DateSelectInput value={form.date} onChange={value => setForm(current => ({ ...current, date: value }))} max={TODAY} />
              </Field>
              {!isApartmentOrg && (
                <Field label={isQuote ? "Valid Until" : "Due Date"}>
                  <DateSelectInput value={form.dueDate || ""} onChange={value => setForm(current => ({ ...current, dueDate: value }))} min={form.date} max={TODAY} />
                </Field>
              )}
            </div>

            {!isApartmentOrg && (
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
                {showTaxFields && <Field label="GST Type">
                  <Select value={form.taxMode} onChange={event => setForm(current => ({ ...current, taxMode: event.target.value }))}>
                    <option value="split">CGST + SGST</option>
                    <option value="igst">IGST</option>
                  </Select>
                </Field>}
              </div>
            )}

            {!isApartmentOrg && !isQuote && form.status === "paid" && (
              <Field label="Paid Date">
                <DateSelectInput value={form.paidDate || ""} onChange={value => setForm(current => ({ ...current, paidDate: value }))} min={form.date} max={TODAY} />
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
                )}
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
