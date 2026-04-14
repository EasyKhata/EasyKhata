import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { canUseFeature } from "../utils/subscription";
import {
  DateSelectInput,
  Modal,
  Field,
  Input,
  MonthSelectInput,
  Textarea,
  Select,
  DeleteBtn,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  Avatar,
  EmptyState,
  SectionSkeleton,
  uid
} from "../components/UI";
import { getFinancialInvoices, getInvoiceStatus, getPersonalMemberOptions, invoiceGrandTotal } from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isFutureMonthValue, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";
import { downloadInvoice } from "../utils/invoiceGen";

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = TODAY.slice(0, 7);
const DEFAULT_SALE_GST = 18;

function newSaleItem() {
  return {
    id: uid(),
    productId: "",
    productType: "unit",
    unit: "pcs",
    productName: "",
    qty: "1",
    rate: "",
    gstRate: String(DEFAULT_SALE_GST)
  };
}

function normalizeSaleItems(items = []) {
  return items
    .map(item => ({
      id: item.id || uid(),
      productId: String(item.productId || "").trim(),
      productType: String(item.productType || "unit").trim().toLowerCase() === "weight" ? "weight" : "unit",
      unit: String(item.unit || "").trim(),
      productName: String(item.productName || "").trim(),
      qty: Number(item.qty || 0),
      rate: Number(item.rate || 0),
      gstRate: Number(item.gstRate || 0)
    }))
    .filter(item => item.productName && item.qty > 0 && item.rate > 0 && item.gstRate >= 0);
}

function getSaleTotals(items = [], discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0);
  const gstTotal = items.reduce((sum, item) => sum + (((Number(item.qty) || 0) * (Number(item.rate) || 0)) * (Number(item.gstRate) || 0) / 100), 0);
  const discountValue = Math.max(0, Number(discount || 0));
  const total = Math.max(0, subtotal + gstTotal - discountValue);
  return { subtotal, gstTotal, discountValue, total };
}

function adjustServiceProductStock(services = [], items = [], direction = -1) {
  const normalizedItems = normalizeSaleItems(items);
  const quantityById = new Map();
  const quantityByName = new Map();

  normalizedItems.forEach(item => {
    const qty = Math.max(0, Number(item.qty || 0));
    const matchId = String(item.productId || "").trim();
    const matchName = String(item.productName || "").trim().toLowerCase();
    if (matchId) {
      quantityById.set(matchId, (quantityById.get(matchId) || 0) + qty);
    } else if (matchName) {
      quantityByName.set(matchName, (quantityByName.get(matchName) || 0) + qty);
    }
  });

  return (services || []).map(service => ({
    ...service,
    products: (service.products || []).map(product => {
      const productId = String(product.id || "").trim();
      const productName = String(product.productName || "").trim().toLowerCase();
      const qty = quantityById.get(productId) || quantityByName.get(productName) || 0;
      if (qty <= 0) return product;

      const currentQty = Math.max(0, Number(product.quantity || 0));
      const delta = qty * direction;
      return {
        ...product,
        quantity: String(Math.max(0, currentQty + delta))
      };
    })
  }));
}

function getSaleInvoicePrefix(dateValue) {
  const source = isValidDateValue(dateValue) ? dateValue : TODAY;
  const [year, month] = source.split("-");
  return `INV-${month}/${String(year || "").slice(-2)}`;
}

function getNextSaleInvoiceNumber(dateValue, incomes = [], skipId = null) {
  const prefix = getSaleInvoicePrefix(dateValue);
  const expectedPrefix = `${prefix}-`;
  let maxSequence = 0;

  (incomes || []).forEach(income => {
    if (skipId && income?.id === skipId) return;
    const currentNumber = String(income?.invoiceNumber || income?.receiptNumber || "").trim();
    if (!currentNumber.startsWith(expectedPrefix)) return;

    const seq = Number.parseInt(currentNumber.slice(expectedPrefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSequence) {
      maxSequence = seq;
    }
  });

  return `${prefix}-${String(maxSequence + 1).padStart(3, "0")}`;
}

function getApartmentMaintenanceKey(orgId, monthKeyValue) {
  return `easykhata:apartment-maintenance:${orgId || "default"}:${monthKeyValue}`;
}

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

  if (field.type === "date") {
    return <DateSelectInput value={value || ""} onChange={onChange} max={TODAY} />;
  }

  if (field.type === "month") {
    return <MonthSelectInput value={value || ""} onChange={onChange} max={CURRENT_MONTH} />;
  }

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} max={field.type === "date" ? TODAY : field.type === "month" ? CURRENT_MONTH : undefined} step={field.type === "number" ? "0.01" : undefined} />;
}

export default function IncomeSection({ year, month, orgType, quickstartIntent, onQuickstartHandled, headerDatePicker }) {
  const d = useData();
  const { user } = useAuth();
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const isApartmentOrg = getOrgType(orgType) === ORG_TYPES.APARTMENT;
  const isPersonalOrg = getOrgType(orgType) === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = getOrgType(orgType) === ORG_TYPES.SMALL_BUSINESS;
  const isFreelancerOrg = getOrgType(orgType) === ORG_TYPES.FREELANCER;
  const hasPosSystem = isSmallBusinessOrg && canUseFeature(user, "posSystem");
  const societyName = String(d.account?.name || "").trim();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const isCurrentViewedMonth = mk === CURRENT_MONTH;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(buildBlankForm(year, month, config));
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkMaintenanceAmount, setBulkMaintenanceAmount] = useState("");
  const [maintenanceAmountHydrated, setMaintenanceAmountHydrated] = useState(false);
  const [pendingFlatPayments, setPendingFlatPayments] = useState([]);
  const [flatSearchTerm, setFlatSearchTerm] = useState("");
  const [flatStatusFilter, setFlatStatusFilter] = useState("all");
  const [saleItems, setSaleItems] = useState([newSaleItem()]);
  const [saleDiscount, setSaleDiscount] = useState("");
  const [salePhone, setSalePhone] = useState("");
  const [guidedField, setGuidedField] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const openPeopleManager = () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));
  const openFlatManager = openPeopleManager;

  const invIncome = useMemo(() => (
    config.hideInvoices || isApartmentOrg
      ? []
      : getFinancialInvoices(d.invoices).filter(invoice => getInvoiceStatus(invoice) === "paid" && invoice.paidDate?.slice(0, 7) === mk)
  ), [config.hideInvoices, d.invoices, isApartmentOrg, mk]);
  const manualIncome = useMemo(() => (
    d.income.filter(item => {
      if (isApartmentOrg) {
        return (item.collectionMonth || item.month || item.date?.slice(0, 7)) === mk;
      }
      return item.month === mk;
    })
  ), [d.income, isApartmentOrg, mk]);
  const countableManualIncome = useMemo(() => (
    manualIncome.filter(item => {
      if (!isSmallBusinessOrg) return true;
      const status = String(item.saleStatus || "pending").toLowerCase();
      return status !== "canceled" && status !== "refunded";
    })
  ), [isSmallBusinessOrg, manualIncome]);
  const totalInv = useMemo(() => invIncome.reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0), [invIncome]);
  const totalManual = useMemo(() => countableManualIncome.reduce((sum, item) => sum + Number(item.amount), 0), [countableManualIncome]);
  const totalIncome = totalInv + totalManual;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInvIncome = useMemo(() => (
    invIncome.filter(invoice => {
      if (!normalizedSearch) return true;
      const invoiceSearch = [
        invoice.customer?.name,
        invoice.billTo?.name,
        invoice.number,
        invoice.paidDate,
        String(invoiceGrandTotal(invoice) || "")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return invoiceSearch.includes(normalizedSearch);
    })
  ), [invIncome, normalizedSearch]);
  const filteredManualIncome = useMemo(() => (
    manualIncome.filter(item => {
      if (!normalizedSearch) return true;
      const manualSearch = [
        item.label,
        item.note,
        item.date,
        item.invoiceNumber,
        item.receiptNumber,
        item.customerName,
        item.phone,
        String(item.amount || ""),
        ...(config.incomeFields || []).map(field => item[field.key])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return manualSearch.includes(normalizedSearch);
    })
  ), [config.incomeFields, manualIncome, normalizedSearch]);
  const apartmentFlats = useMemo(() => (
    (d.customers || []).map(flat => ({
      value: flat.name || "",
      label: [flat.name, flat.ownerName || "", societyName].filter(Boolean).join(" - "),
      ownerName: flat.ownerName || "",
      monthlyMaintenance: Number(flat.monthlyMaintenance || 0),
      id: flat.id
    })).filter(option => option.value)
  ), [d.customers, societyName, sym]);
  const flatOptions = apartmentFlats;
  const peopleOptions = useMemo(() => {
    const customerMeta = new Map(
      (d.customers || [])
        .filter(person => String(person?.name || "").trim())
        .map(person => [
          String(person.name).trim().toLowerCase(),
          [person.name || "", person.phone || person.email || ""].filter(Boolean).join(" - ")
        ])
    );

    return getPersonalMemberOptions(d).map(option => ({
      value: option.value,
      label: customerMeta.get(String(option.value || "").trim().toLowerCase()) || option.label
    }));
  }, [d]);
  const hasHouseholdPeople = !isPersonalOrg || peopleOptions.length > 0;
  const hasApartmentFlats = !isApartmentOrg || apartmentFlats.length > 0;
  const clientOptions = useMemo(() => (
    (d.customers || []).map(client => ({ value: client.name || "", label: [client.name || "", client.company || client.email || client.phone || ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.customers]);
  const hasFreelancerClients = !isFreelancerOrg || clientOptions.length > 0;
  const inventoryOptions = useMemo(() => (
    (d.orgRecords?.inventory || []).map(item => ({
      value: item.productName || "",
      label: [item.productName || "", item.stock ? `${item.stock} in stock` : "", item.price ? `${sym} ${item.price}` : ""].filter(Boolean).join(" - ")
    })).filter(option => option.value)
  ), [d.orgRecords, sym]);
  const saleProductOptions = useMemo(() => (
    (d.orgRecords?.services || [])
      .flatMap(service => (service.products || []).map(product => ({
        id: product.id,
        serviceName: String(service.serviceName || "").trim(),
        value: String(product.productName || "").trim(),
        rate: Number(product.price || 0),
        quantity: Math.max(0, Number(product.quantity || 0)),
        productType: String(product.productType || "unit").trim().toLowerCase() === "weight" ? "weight" : "unit",
        unit: String(product.unit || "").trim() || (String(product.productType || "unit").trim().toLowerCase() === "weight" ? "kg" : "pcs")
      })))
      .filter(option => option.value)
  ), [d.orgRecords]);
  const saleProductByName = useMemo(() => {
    const map = new Map();
    saleProductOptions.forEach(product => {
      const key = String(product.value || "").trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, product);
      }
    });
    return map;
  }, [saleProductOptions]);
  const salePhoneLookup = useMemo(() => {
    const clean = salePhone.replace(/\D/g, "");
    if (clean.length < 6) return null;
    return (d.customers || []).find(c => String(c.phone || "").replace(/\D/g, "") === clean) || null;
  }, [salePhone, d.customers]);
  const saleIsNewCustomer = useMemo(() => {
    const clean = salePhone.replace(/\D/g, "");
    return clean.length >= 6 && salePhoneLookup === null;
  }, [salePhone, salePhoneLookup]);
  const allSalesIncome = useMemo(() => d.income || [], [d.income]);
  const saleTotals = useMemo(() => getSaleTotals(saleItems, saleDiscount), [saleDiscount, saleItems]);
  const saleInvoicePreview = useMemo(() => {
    if (!isSmallBusinessOrg) return "";
    if (editId) {
      const currentSale = allSalesIncome.find(item => item.id === editId);
      return String(currentSale?.invoiceNumber || currentSale?.receiptNumber || "").trim();
    }
    return getNextSaleInvoiceNumber(form.date || TODAY, allSalesIncome);
  }, [allSalesIncome, editId, form.date, isSmallBusinessOrg]);

  useEffect(() => {
    if (!isApartmentOrg) return;
    if (typeof window === "undefined") return;
    const storageValue = window.localStorage.getItem(getApartmentMaintenanceKey(d.activeOrgId, mk)) || "";
    const fallbackValue = String(apartmentFlats.find(flat => Number(flat.monthlyMaintenance || 0) > 0)?.monthlyMaintenance || "");
    setBulkMaintenanceAmount(storageValue || fallbackValue);
    setMaintenanceAmountHydrated(true);
  }, [apartmentFlats, d.activeOrgId, isApartmentOrg, mk]);

  useEffect(() => {
    if (!isApartmentOrg || typeof window === "undefined") return;
    if (!maintenanceAmountHydrated) return;
    const storageKey = getApartmentMaintenanceKey(d.activeOrgId, mk);
    if (bulkMaintenanceAmount) {
      window.localStorage.setItem(storageKey, bulkMaintenanceAmount);
      return;
    }
    window.localStorage.removeItem(storageKey);
  }, [bulkMaintenanceAmount, d.activeOrgId, isApartmentOrg, maintenanceAmountHydrated, mk]);

  useEffect(() => {
    if (!isSmallBusinessOrg || !salePhoneLookup) return;
    setForm(current => ({
      ...current,
      customerName: salePhoneLookup.name,
      label: current.label || `${salePhoneLookup.name} Sale`
    }));
  }, [salePhoneLookup]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectedMonthDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const defaultCollectionDate = selectedMonthDate > TODAY ? TODAY : selectedMonthDate;
  const apartmentCollectionStatus = useMemo(() => apartmentFlats.map(flat => {
    const monthlyAmount = Number(flat.monthlyMaintenance || bulkMaintenanceAmount || 0);
    const paidEntry = manualIncome.find(item => (
      String(item.flatNumber || "").trim() === String(flat.value || "").trim() &&
      (item.collectionMonth || item.month || item.date?.slice(0, 7)) === mk &&
      String(item.collectionType || "Monthly Maintenance").trim() === "Monthly Maintenance"
    ));

    return {
      ...flat,
      monthlyAmount,
      paidEntry
    };
  }).sort((left, right) => String(left.value || "").localeCompare(String(right.value || ""), undefined, { numeric: true, sensitivity: "base" })), [apartmentFlats, bulkMaintenanceAmount, manualIncome, mk]);
  const apartmentCollectionMetrics = useMemo(() => {
    const totalFlats = apartmentCollectionStatus.length;
    const paidFlats = apartmentCollectionStatus.filter(flat => Boolean(flat.paidEntry)).length;
    const pendingFlats = totalFlats - paidFlats;
    const expectedAmount = apartmentCollectionStatus.reduce((sum, flat) => sum + Number(flat.monthlyAmount || 0), 0);
    const collectedAmount = apartmentCollectionStatus.reduce((sum, flat) => sum + Number(flat.paidEntry?.amount || 0), 0);
    const pendingAmount = Math.max(0, expectedAmount - collectedAmount);
    return { totalFlats, paidFlats, pendingFlats, expectedAmount, collectedAmount, pendingAmount };
  }, [apartmentCollectionStatus]);
  const normalizedFlatSearch = flatSearchTerm.trim().toLowerCase();
  const visibleApartmentCollectionStatus = useMemo(() => apartmentCollectionStatus.filter(flat => {
    if (flatStatusFilter === "paid" && !flat.paidEntry) return false;
    if (flatStatusFilter === "pending" && flat.paidEntry) return false;
    if (flatStatusFilter === "unpriced" && Number(flat.monthlyAmount || 0) > 0) return false;
    if (!normalizedFlatSearch) return true;
    const haystack = [flat.value, flat.ownerName, flat.label].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(normalizedFlatSearch);
  }), [apartmentCollectionStatus, flatStatusFilter, normalizedFlatSearch]);
  const bulkPayableFlats = useMemo(() => apartmentCollectionStatus.filter(flat => !flat.paidEntry && Number(flat.monthlyAmount || 0) > 0), [apartmentCollectionStatus]);
  const activeMaintenanceFlat = useMemo(() => {
    if (!isApartmentOrg) return null;
    const flatNumber = String(form.flatNumber || "").trim();
    const collectionType = String(form.collectionType || "Monthly Maintenance").trim();
    const collectionMonth = String(form.collectionMonth || form.date?.slice(0, 7) || "").trim();
    if (!flatNumber || collectionType !== "Monthly Maintenance" || collectionMonth !== mk) return null;
    return apartmentCollectionStatus.find(flat => String(flat.value || "").trim() === flatNumber) || null;
  }, [apartmentCollectionStatus, form.collectionMonth, form.collectionType, form.date, form.flatNumber, isApartmentOrg, mk]);

  useEffect(() => {
    if (!d.loaded) return;
    if (!quickstartIntent?.action) return;

    if (quickstartIntent.action === "first-dues" && isApartmentOrg) {
      const targetFlat = apartmentCollectionStatus.find(flat => !flat.paidEntry) || apartmentFlats[0] || null;
      if (!targetFlat) {
        openFlatManager();
        onQuickstartHandled?.();
        return;
      }

      setEditId(null);
      setForm({
        ...buildBlankForm(year, month, config),
        label: `Monthly Maintenance - ${targetFlat.value}`,
        amount: targetFlat.monthlyAmount > 0 ? String(targetFlat.monthlyAmount) : "",
        date: defaultCollectionDate,
        flatNumber: targetFlat.value,
        residentName: targetFlat.ownerName || "",
        collectionType: "Monthly Maintenance",
        collectionMonth: mk
      });
      setGuidedField("flatNumber");
      setFormError("");
      setShowForm(true);
      onQuickstartHandled?.();
      return;
    }

    if (quickstartIntent.action === "first-income" && !isApartmentOrg) {
      setGuidedField("label");
      openNew();
      onQuickstartHandled?.();
    }
  }, [
    apartmentCollectionStatus,
    apartmentFlats,
    config,
    d.loaded,
    defaultCollectionDate,
    isApartmentOrg,
    mk,
    month,
    onQuickstartHandled,
    quickstartIntent?.action,
    quickstartIntent?.token,
    year
  ]);

  useEffect(() => {
    if (!guidedField) return undefined;
    const timeout = window.setTimeout(() => setGuidedField(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [guidedField]);

  function openNew() {
    if (isApartmentOrg && !hasApartmentFlats) {
      openFlatManager();
      return;
    }
    if (!hasHouseholdPeople) {
      openPeopleManager();
      return;
    }
    if (isFreelancerOrg && !hasFreelancerClients) {
      window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));
      return;
    }
    setEditId(null);
    const blankForm = buildBlankForm(year, month, config);
    if (isSmallBusinessOrg) {
      blankForm.date = TODAY;
      // POS defaults to pending (billed, payment may come later)
      // Simple sales default to paid (cash/UPI collected on the spot)
      blankForm.saleStatus = hasPosSystem ? "pending" : "paid";
    }
    setForm(blankForm);
    setSaleItems([newSaleItem()]);
    setSaleDiscount("");
    setSalePhone("");
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
    if (isSmallBusinessOrg && hasPosSystem) {
      next.saleStatus = income.saleStatus || "pending";
      const existingItems = Array.isArray(income.saleItems) && income.saleItems.length
        ? income.saleItems
        : income.productName
          ? [{ id: uid(), productName: income.productName, qty: "1", rate: String(income.amount || ""), gstRate: String(DEFAULT_SALE_GST) }]
          : [newSaleItem()];
      setSaleItems(existingItems.map(item => ({
        id: item.id || uid(),
        productId: String(item.productId || ""),
        productType: String(item.productType || "unit"),
        unit: String(item.unit || ""),
        productName: String(item.productName || ""),
        qty: String(item.qty ?? 1),
        rate: String(item.rate ?? ""),
        gstRate: String(item.gstRate ?? DEFAULT_SALE_GST)
      })));
      setSaleDiscount(String(income.saleDiscount ?? ""));
      const existingCustomer = (d.customers || []).find(c =>
        String(c.name || "").trim().toLowerCase() === String(income.customerName || "").trim().toLowerCase()
      );
      setSalePhone(existingCustomer?.phone || income.phone || "");
    } else if (isSmallBusinessOrg) {
      next.saleStatus = income.saleStatus || "paid";
    }
    setEditId(income.id);
    setForm(next);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
    setSaleItems([newSaleItem()]);
    setSaleDiscount("");
    setSalePhone("");
    setFormError("");
  }

  function addSaleItem() {
    setSaleItems(current => [...current, newSaleItem()]);
  }

  function removeSaleItem(id) {
    setSaleItems(current => (current.length <= 1 ? current : current.filter(item => item.id !== id)));
  }

  function updateSaleItem(id, key, value) {
    setSaleItems(current => current.map(item => {
      if (item.id !== id) return item;
      const next = { ...item, [key]: value };
      if (key === "productName") {
        const matchedProduct = saleProductOptions.find(product => product.value.toLowerCase() === String(value || "").trim().toLowerCase());
        if (matchedProduct?.rate > 0 && !(Number(next.rate) > 0)) {
          next.rate = String(matchedProduct.rate);
        }
        if (matchedProduct?.id) {
          next.productId = matchedProduct.id;
          next.productType = matchedProduct.productType || "unit";
          next.unit = matchedProduct.unit || "pcs";
          if (!(Number(next.qty) > 0)) {
            next.qty = matchedProduct.productType === "weight" ? "0.25" : "1";
          }
        }
      }
      return next;
    }));
  }

  function handlePrintSaleReceipt(item) {
    const saleItemsForReceipt = normalizeSaleItems(item.saleItems || []);
    if (!saleItemsForReceipt.length) return;
    const billToCustomer = (d.customers || []).find(customer => String(customer.name || "").trim().toLowerCase() === String(item.customerName || "").trim().toLowerCase());
    downloadInvoice({
      id: item.id,
      number: item.invoiceNumber || item.receiptNumber || `SALE-${String(item.date || TODAY).replaceAll("-", "")}-${String(item.id || "").slice(-4)}`,
      date: item.date || TODAY,
      dueDate: item.date || TODAY,
      paidDate: String(item.saleStatus || "paid") === "paid" ? (item.date || TODAY) : "",
      status: String(item.saleStatus || "paid") === "paid" ? "paid" : "pending",
      taxMode: "split",
      discount: Number(item.saleDiscount || 0),
      notes: item.note || "",
      terms: "Thank you for your purchase.",
      billTo: {
        name: item.customerName || "Customer",
        phone: billToCustomer?.phone || "",
        gstin: billToCustomer?.gstin || "",
        city: billToCustomer?.city || "",
        state: billToCustomer?.state || "",
        country: billToCustomer?.country || ""
      },
      customer: { name: item.customerName || "Customer" },
      items: saleItemsForReceipt.map(line => ({
        id: line.id,
        desc: line.productName,
        subDesc: "",
        qty: Number(line.qty),
        rate: Number(line.rate),
        taxRate: Number(line.gstRate || 0),
        hsn: ""
      }))
    }, d.account, sym, { isApartment: false });
  }

  function handleSendSaleReceipt(item) {
    const lines = normalizeSaleItems(item.saleItems || []);
    if (!lines.length) return;
    const totals = getSaleTotals(lines, item.saleDiscount || 0);
    const message = [
      `Invoice: ${item.invoiceNumber || item.receiptNumber || item.id}`,
      `Date: ${fmtDate(item.date)}`,
      item.customerName ? `Customer: ${item.customerName}` : "",
      `Status: ${String(item.saleStatus || "paid").toUpperCase()}`,
      "Items:",
      ...lines.map(line => `- ${line.productName} x${line.qty} @ ${fmtMoney(line.rate, sym)} + GST ${line.gstRate}%`),
      `Subtotal: ${fmtMoney(totals.subtotal, sym)}`,
      `GST: ${fmtMoney(totals.gstTotal, sym)}`,
      `Discount: ${fmtMoney(totals.discountValue, sym)}`,
      `Total: ${fmtMoney(totals.total, sym)}`
    ].filter(Boolean).join("\n");

    const matchedCustomer = (d.customers || []).find(customer => String(customer.name || "").trim().toLowerCase() === String(item.customerName || "").trim().toLowerCase());
    const phone = String(matchedCustomer?.phone || "").replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function toggleSaleStatus(item) {
    if (!item?.id || !isSmallBusinessOrg) return;
    if (String(item.saleStatus || "pending") === "canceled" || String(item.saleStatus || "pending") === "refunded") return;
    const nextStatus = String(item.saleStatus || "paid") === "paid" ? "pending" : "paid";
    d.updateIncome({ ...item, saleStatus: nextStatus });
  }

  function issueSaleRefund(item) {
    if (!item?.id || !isSmallBusinessOrg) return;
    const status = String(item.saleStatus || "pending").toLowerCase();
    if (status === "refunded") return;
    if (Array.isArray(item.saleItems) && item.saleItems.length) {
      const restockedServices = adjustServiceProductStock(d.orgRecords?.services || [], item.saleItems, +1);
      d.saveOrgRecords("services", restockedServices);
    }
    d.updateIncome({ ...item, saleStatus: "refunded", refundDate: TODAY });
  }

  function save(overrides = {}) {
    const nextForm = { ...form, ...overrides };
    const currentSale = editId ? allSalesIncome.find(item => item.id === editId) : null;

    // POS sales are locked once saved (stock has been deducted)
    if (isSmallBusinessOrg && hasPosSystem && currentSale && Array.isArray(currentSale.saleItems) && currentSale.saleItems.length) {
      setFormError("Saved sales are locked and cannot be edited.");
      return;
    }

    if (isApartmentOrg && !hasApartmentFlats) {
      setFormError("Add at least one resident/flat in Settings before recording a maintenance collection.");
      return;
    }
    if (!isSmallBusinessOrg && !hasMinLength(nextForm.label, 2)) {
      setFormError(`Add a clear ${config.incomeEntryLabel.toLowerCase()} description so you can recognize it later.`);
      return;
    }
    if (isSmallBusinessOrg && !hasPosSystem && !hasMinLength(nextForm.label, 2)) {
      setFormError("Describe what was sold so you can find this record later.");
      return;
    }
    const normalizedItems = (isSmallBusinessOrg && hasPosSystem) ? normalizeSaleItems(saleItems) : [];
    const computedSaleTotals = (isSmallBusinessOrg && hasPosSystem) ? getSaleTotals(normalizedItems, saleDiscount) : null;
    if (isSmallBusinessOrg && hasPosSystem && !String(nextForm.customerName || "").trim()) {
      setFormError("Select or type a customer name.");
      return;
    }
    if (isSmallBusinessOrg && hasPosSystem && !normalizedItems.length) {
      setFormError("Add at least one valid product line with quantity, rate, and GST.");
      return;
    }
    if (isSmallBusinessOrg && hasPosSystem) {
      const aggregatedDemand = new Map();
      normalizedItems.forEach(line => {
        const key = String(line.productId || "").trim() || String(line.productName || "").trim().toLowerCase();
        if (!key) return;
        aggregatedDemand.set(key, (aggregatedDemand.get(key) || 0) + Number(line.qty || 0));
      });

      const stockIssue = Array.from(aggregatedDemand.entries()).find(([key, demandedQty]) => {
        const byId = saleProductOptions.find(product => String(product.id || "") === key);
        const byName = saleProductByName.get(key);
        const matched = byId || byName;
        if (!matched) return false;
        return demandedQty > Number(matched.quantity || 0);
      });
      if (stockIssue) {
        const [key] = stockIssue;
        const matched = saleProductOptions.find(product => String(product.id || "") === key) || saleProductByName.get(key);
        const left = Number(matched?.quantity || 0);
        const name = matched?.value || "selected product";
        setFormError(`Only ${left} item(s) left for ${name}. Reduce quantity to continue.`);
        return;
      }
    }
    if (!isSmallBusinessOrg && !isPositiveAmount(nextForm.amount)) {
      setFormError("Enter an amount greater than 0.");
      return;
    }
    if (!isValidDateValue(nextForm.date)) {
      setFormError(`Choose the date when this ${config.incomeEntryLabel.toLowerCase()} was received.`);
      return;
    }
    if (isFutureDateValue(nextForm.date)) {
      setFormError("Future dates are not allowed for records.");
      return;
    }
    if (isApartmentOrg && !String(nextForm.flatNumber || "").trim()) {
      setFormError("Select a flat from Settings before saving this maintenance collection.");
      return;
    }
    if (isPersonalOrg && !String(nextForm.personName || "").trim()) {
      setFormError("Select a household person before saving this earning.");
      return;
    }
    if (isApartmentOrg && !String(nextForm.residentName || "").trim()) {
      setFormError("Select the flat record from Settings before saving this maintenance collection.");
      return;
    }

    const payload = {
      label: isSmallBusinessOrg
        ? (nextForm.label.trim() || `${nextForm.customerName.trim()} Sale`)
        : nextForm.label.trim(),
      amount: (isSmallBusinessOrg && hasPosSystem) ? Number(computedSaleTotals.total || 0) : Number(nextForm.amount),
      date: nextForm.date,
      month: isApartmentOrg ? (nextForm.collectionMonth || nextForm.date.slice(0, 7)) : nextForm.date.slice(0, 7),
      note: nextForm.note.trim()
    };

    (config.incomeFields || []).forEach(field => {
      payload[field.key] = String(nextForm[field.key] || "").trim();
    });

    const hasFutureMonth = (config.incomeFields || []).some(field => field.type === "month" && isFutureMonthValue(payload[field.key]));
    if (hasFutureMonth) {
      setFormError("Future months are not allowed for records.");
      return;
    }

    if (isSmallBusinessOrg && hasPosSystem) {
      if (saleIsNewCustomer && String(nextForm.customerName || "").trim()) {
        const cleanPhone = salePhone.replace(/\D/g, "");
        d.addCustomer({ name: String(nextForm.customerName).trim(), phone: cleanPhone });
      }
      payload.saleItems = normalizedItems;
      payload.saleDiscount = Number(saleDiscount || 0);
      payload.saleSubtotal = computedSaleTotals.subtotal;
      payload.saleGstTotal = computedSaleTotals.gstTotal;
      const nextSaleStatus = String(nextForm.saleStatus || "pending").toLowerCase();
      payload.saleStatus = nextSaleStatus === "paid" || nextSaleStatus === "refunded" ? nextSaleStatus : "pending";
      payload.invoiceNumber = editId
        ? (allSalesIncome.find(item => item.id === editId)?.invoiceNumber || allSalesIncome.find(item => item.id === editId)?.receiptNumber || getNextSaleInvoiceNumber(nextForm.date || TODAY, allSalesIncome, editId))
        : getNextSaleInvoiceNumber(nextForm.date || TODAY, allSalesIncome);
      payload.receiptNumber = payload.invoiceNumber;
      payload.phone = salePhone.replace(/\D/g, "");

      const deductStock = payload.saleStatus !== "refunded";
      if (deductStock) {
        const updatedServices = adjustServiceProductStock(d.orgRecords?.services || [], normalizedItems, -1);
        d.saveOrgRecords("services", updatedServices);
      }
    } else if (isSmallBusinessOrg) {
      // Simple sale: just track status (paid = cash received, pending = credit / will collect later)
      const simpleSaleStatus = String(nextForm.saleStatus || "paid").toLowerCase();
      payload.saleStatus = simpleSaleStatus === "pending" ? "pending" : "paid";
    }

    if (editId) {
      d.updateIncome({ ...payload, id: editId });
    } else {
      const hadIncome = (d.income || []).length > 0;
      const hadDues = (d.income || []).some(item => String(item?.collectionType || "").trim() === "Monthly Maintenance");
      d.addIncome(payload);

      if (isApartmentOrg && !hadDues && String(payload.collectionType || "").trim() === "Monthly Maintenance") {
        window.dispatchEvent(new CustomEvent("ledger:first-success", {
          detail: {
            title: "First dues entry saved",
            message: "Nice. Next, add one society expense to start reserve tracking.",
            actionLabel: "Open Expenses",
            target: { tab: "expenses" }
          }
        }));
      } else if (!isApartmentOrg && !hadIncome) {
        window.dispatchEvent(new CustomEvent("ledger:first-success", {
          detail: {
            title: "First income entry saved",
            message: "Great momentum. Next, create one matching expense for a complete cashflow view.",
            actionLabel: "Open Expenses",
            target: { tab: "expenses" }
          }
        }));
      }
    }

    closeForm();
  }

  function applyMaintenanceAmountToAllFlats() {
    const amount = Number(bulkMaintenanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const normalized = String(amount);
    setBulkMaintenanceAmount(normalized);
    (d.customers || []).forEach(customer => {
      if (!String(customer?.name || "").trim()) return;
      d.updateCustomer?.({
        ...customer,
        monthlyMaintenance: normalized
      });
    });
  }

  function createMaintenanceEntryForFlat(flat, triggerSuccessNotice = false) {
    if (!flat || flat.paidEntry || !(flat.monthlyAmount > 0)) return;
    const hadDues = (d.income || []).some(item => String(item?.collectionType || "").trim() === "Monthly Maintenance");
    d.addIncome({
      label: `Monthly Maintenance - ${flat.value}`,
      amount: flat.monthlyAmount,
      date: TODAY,
      month: mk,
      note: "",
      flatNumber: flat.value,
      collectionType: "Monthly Maintenance",
      residentName: flat.ownerName || "",
      collectionMonth: mk
    });
    if (triggerSuccessNotice && !hadDues) {
      window.dispatchEvent(new CustomEvent("ledger:first-success", {
        detail: {
          title: "First dues entry saved",
          message: "Great start. Next, record one society expense to track net reserve clearly.",
          actionLabel: "Open Expenses",
          target: { tab: "expenses" }
        }
      }));
    }
  }

  function markFlatAsPaid(flat) {
    if (!flat || flat.paidEntry || !(flat.monthlyAmount > 0) || pendingFlatPayments.includes(flat.id)) return;

    setPendingFlatPayments(current => [...current, flat.id]);
    try {
      createMaintenanceEntryForFlat(flat, true);
    } finally {
      setPendingFlatPayments(current => current.filter(item => item !== flat.id));
    }
  }

  function markAllPendingFlatsAsPaid() {
    if (!bulkPayableFlats.length) return;
    const targetIds = bulkPayableFlats.map(flat => flat.id);
    setPendingFlatPayments(current => Array.from(new Set([...current, ...targetIds])));
    try {
      bulkPayableFlats.forEach((flat, index) => createMaintenanceEntryForFlat(flat, index === 0));
    } finally {
      setPendingFlatPayments(current => current.filter(item => !targetIds.includes(item)));
    }
  }

  async function copyPendingReminders() {
    const pendingFlats = apartmentCollectionStatus.filter(flat => !flat.paidEntry && Number(flat.monthlyAmount || 0) > 0);
    if (!pendingFlats.length) return;
    const reminderText = [
      `Maintenance reminder - ${societyName || "Society"}`,
      `Month: ${MONTHS[month]} ${year}`,
      "",
      ...pendingFlats.map(flat => `${flat.value}: ${fmtMoney(flat.monthlyAmount, sym)} pending`),
      "",
      "Please clear dues at the earliest. Thank you."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(reminderText);
      window.dispatchEvent(new CustomEvent("ledger:second-success", {
        detail: {
          title: "Pending reminder copied",
          message: "Share this message in your resident WhatsApp group."
        }
      }));
    } catch (err) {
      window.alert("Could not copy reminder text on this browser.");
    }
  }

  function markFlatAsPending(flat) {
    if (!flat?.paidEntry?.id) return;
    d.removeIncome(flat.paidEntry.id);
    setPendingFlatPayments(current => current.filter(item => item !== flat.id));
    closeForm();
  }

  function openBulkCollectionDraft(flat) {
    if (flat?.paidEntry) {
      openEdit(flat.paidEntry);
      return;
    }

    setEditId(null);
    setForm({
      ...buildBlankForm(year, month, config),
      label: `Monthly Maintenance - ${flat.value}`,
      amount: flat.monthlyAmount > 0 ? String(flat.monthlyAmount) : "",
      date: defaultCollectionDate,
      flatNumber: flat.value,
      residentName: flat.ownerName || "",
      collectionType: "Monthly Maintenance",
      collectionMonth: mk
    });
    setFormError("");
    setShowForm(true);
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Total {config.incomeLabel} - {MONTHS[month]} {year}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--accent)", letterSpacing: -0.5 }}>{fmtMoney(totalIncome, sym)}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
            {isPersonalOrg ? "Track household earnings person by person for the selected month." : `Review all ${config.incomeLabel.toLowerCase()} recorded for this period.`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          {headerDatePicker}
          <button className="btn-secondary" onClick={openNew} style={{ alignSelf: "flex-end", marginTop: 0, padding: "10px 14px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
            + New {isApartmentOrg ? "Maintenance" : config.incomeLabel}
          </button>
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {isApartmentOrg && (
          <div className="card" style={{ padding: 16, marginBottom: 18 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Monthly Maintenance Setup</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                Set one monthly amount for all flats, then mark individual flats as paid for {MONTHS[month]} {year}.
              </div>
            </div>

            {!hasApartmentFlats ? (
              <EmptyState
                title="Add flats first"
                message="Create flat records in Org before recording maintenance collections."
                actionLabel="Open Flats"
                onAction={openFlatManager}
                accentColor="var(--accent)"
              />
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", gap: 10, marginBottom: 14 }}>
                  <Input type="number" min="0" step="0.01" placeholder="Monthly amount for all flats" value={bulkMaintenanceAmount} onChange={event => setBulkMaintenanceAmount(event.target.value)} />
                  <button className="btn-secondary" style={{ whiteSpace: "nowrap" }} onClick={applyMaintenanceAmountToAllFlats} disabled={!(Number(bulkMaintenanceAmount) > 0)}>
                    Apply to All Flats
                  </button>
                </div>
                <div className="card" style={{ marginBottom: 12, padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))", gap: 8 }}>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Flats</div><div style={{ fontSize: 14, fontWeight: 700 }}>{apartmentCollectionMetrics.totalFlats}</div></div>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Paid</div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{apartmentCollectionMetrics.paidFlats}</div></div>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Pending</div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{apartmentCollectionMetrics.pendingFlats}</div></div>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Expected</div><div style={{ fontSize: 13, fontWeight: 700 }}>{fmtMoney(apartmentCollectionMetrics.expectedAmount, sym)}</div></div>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Collected</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(apartmentCollectionMetrics.collectedAmount, sym)}</div></div>
                    <div><div style={{ fontSize: 10, color: "var(--text-dim)" }}>Pending Amt</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(apartmentCollectionMetrics.pendingAmount, sym)}</div></div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto auto auto", gap: 8, marginBottom: 12 }}>
                  <Input placeholder="Search flat / owner" value={flatSearchTerm} onChange={event => setFlatSearchTerm(event.target.value)} />
                  <Select value={flatStatusFilter} onChange={event => setFlatStatusFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="unpriced">No amount set</option>
                  </Select>
                  <button className="btn-secondary" onClick={markAllPendingFlatsAsPaid} disabled={!isCurrentViewedMonth || bulkPayableFlats.length === 0}>
                    Mark All Pending Paid
                  </button>
                  <button className="btn-secondary" onClick={copyPendingReminders} disabled={apartmentCollectionMetrics.pendingFlats === 0}>
                    Copy Pending Reminder
                  </button>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  {visibleApartmentCollectionStatus.map(flat => (
                    <div key={flat.id} className="card-row" style={{ alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{flat.value}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {[flat.ownerName || "No owner", flat.monthlyAmount > 0 ? `Due ${fmtMoney(flat.monthlyAmount, sym)}` : "Set maintenance amount"]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {flat.paidEntry && (
                          <span className="pill" style={{ background: "var(--accent-deep)", color: "var(--accent)" }}>Paid</span>
                        )}
                        <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openBulkCollectionDraft(flat)}>
                          Review
                        </button>
                        {isCurrentViewedMonth && !flat.paidEntry && (
                          <button
                            className="btn-secondary"
                            style={{ padding: "7px 12px", fontSize: 12, color: "var(--accent)" }}
                            disabled={pendingFlatPayments.includes(flat.id) || !(flat.monthlyAmount > 0)}
                            onClick={() => markFlatAsPaid(flat)}
                          >
                            {pendingFlatPayments.includes(flat.id) ? "Saving..." : "Mark as Paid"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {(invIncome.length > 0 || manualIncome.length > 0) && (
          <div style={{ marginBottom: 18 }}>
            <Input
              placeholder={`Search ${config.incomeLabel.toLowerCase()} by name, note, date, or amount`}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
        )}
        {!config.hideInvoices && !isApartmentOrg && (
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
              ) : filteredInvIncome.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
                  No {config.invoicesLabel.toLowerCase()} match this search.
                </div>
              ) : (
                filteredInvIncome.map(invoice => (
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
          <span>{isApartmentOrg ? config.incomeLabel : `Manual ${config.incomeLabel}`}</span>
          <span style={{ color: "var(--accent)" }}>{fmtMoney(totalManual, sym)}</span>
        </div>
        <div className="card">
          {isApartmentOrg && !hasApartmentFlats && manualIncome.length === 0 ? (
            <EmptyState
              title="Add flats before tracking collections"
              message="Maintenance collections need at least one flat record in Org."
              actionLabel="Open Flats"
              onAction={openFlatManager}
              accentColor="var(--accent)"
            />
          ) : !hasHouseholdPeople ? (
            <EmptyState
              title="Add a person before tracking earnings"
              message="Household earnings must be tagged to at least one person. Add your first person in Org to continue."
              actionLabel="Open People"
              onAction={openPeopleManager}
              accentColor="var(--accent)"
            />
          ) : isFreelancerOrg && !hasFreelancerClients ? (
            <EmptyState
              title="Add a client before tracking payments"
              message="Freelancer payments must be linked to at least one client. Add your first client in Org to continue."
              actionLabel="Open Clients"
              onAction={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }))}
              accentColor="var(--accent)"
            />
          ) : manualIncome.length === 0 ? (
            <EmptyState
              title={`No ${config.incomeLabel.toLowerCase()} yet`}
              message={isApartmentOrg ? "Use Add Collection to enter maintenance amounts already collected before onboarding or received after starting with the app." : `Track cash, transfers, or direct ${config.incomeEntryLabel.toLowerCase()} entries here.`}
              actionLabel={config.incomeActionLabel}
              onAction={openNew}
              accentColor="var(--accent)"
            />
          ) : filteredManualIncome.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
              No {config.incomeLabel.toLowerCase()} match this search.
            </div>
          ) : (
            filteredManualIncome.map(item => (
              <div key={item.id} className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {fmtDate(item.date)}
                    {item.invoiceNumber || item.receiptNumber ? ` - ${item.invoiceNumber || item.receiptNumber}` : ""}
                    {item.note ? ` - ${item.note}` : ""}
                    {(config.incomeFields || []).map(field => item[field.key] ? ` - ${item[field.key]}` : "").join("")}
                    {isSmallBusinessOrg && Array.isArray(item.saleItems) && item.saleItems.length > 0 ? ` - ${item.saleItems.length} product(s)` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {isSmallBusinessOrg && Array.isArray(item.saleItems) && item.saleItems.length > 0 && (
                    <>
                      <span className="pill" style={{
                        background: String(item.saleStatus || "pending") === "paid"
                          ? "var(--accent-deep)"
                          : String(item.saleStatus || "pending") === "refunded"
                            ? "var(--danger-deep)"
                          : String(item.saleStatus || "pending") === "canceled"
                            ? "var(--danger-deep)"
                            : "var(--gold-deep)",
                        color: String(item.saleStatus || "pending") === "paid"
                          ? "var(--accent)"
                          : String(item.saleStatus || "pending") === "refunded"
                            ? "var(--danger)"
                          : String(item.saleStatus || "pending") === "canceled"
                            ? "var(--danger)"
                            : "var(--gold)"
                      }}>
                        {String(item.saleStatus || "pending") === "paid" ? "Paid" : String(item.saleStatus || "pending") === "refunded" ? "Refunded" : String(item.saleStatus || "pending") === "canceled" ? "Canceled" : "Pending"}
                      </span>
                      {String(item.saleStatus || "pending") !== "canceled" && String(item.saleStatus || "pending") !== "refunded" && (
                        <>
                          <button className="btn-secondary" style={{ padding: "7px 10px", fontSize: 12 }} onClick={() => handlePrintSaleReceipt(item)}>Print Receipt</button>
                          <button className="btn-secondary" style={{ padding: "7px 10px", fontSize: 12 }} onClick={() => handleSendSaleReceipt(item)}>Send Receipt</button>
                          <button className="btn-secondary" style={{ padding: "7px 10px", fontSize: 12, color: "var(--danger)" }} onClick={() => issueSaleRefund(item)}>Issue Refund</button>
                        </>
                      )}
                    </>
                  )}
                  <span style={{ fontSize: 15, fontWeight: 700, color: (String(item.saleStatus || "pending") === "canceled" || String(item.saleStatus || "pending") === "refunded") ? "var(--text-dim)" : "var(--accent)", textDecoration: (String(item.saleStatus || "pending") === "canceled" || String(item.saleStatus || "pending") === "refunded") ? "line-through" : "none" }}>
                    {fmtMoney(item.amount, sym)}
                  </span>
                  {/* Simple sale (non-POS): status pill + toggle */}
                  {isSmallBusinessOrg && item.saleStatus != null && !(Array.isArray(item.saleItems) && item.saleItems.length > 0) && (
                    <>
                      <span className="pill" style={{
                        background: String(item.saleStatus) === "paid" ? "var(--accent-deep)" : "var(--gold-deep)",
                        color: String(item.saleStatus) === "paid" ? "var(--accent)" : "var(--gold)"
                      }}>
                        {String(item.saleStatus) === "paid" ? "Paid" : "Pending"}
                      </span>
                      <button
                        className="btn-secondary"
                        style={{ padding: "7px 10px", fontSize: 12 }}
                        onClick={() => toggleSaleStatus(item)}
                      >
                        {String(item.saleStatus) === "paid" ? "Mark Pending" : "Mark Paid"}
                      </button>
                    </>
                  )}
                  {(!isSmallBusinessOrg || !Array.isArray(item.saleItems) || !item.saleItems.length) && (
                    <>
                      <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(item)}>Edit</button>
                      <DeleteBtn onDelete={() => d.removeIncome(item.id)} />
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <Modal
          title={editId ? `Edit ${config.incomeEntryLabel}` : config.incomeActionLabel}
          onClose={closeForm}
          onSave={save}
          saveLabel={editId ? "Update" : "Save"}
          canSave={isSmallBusinessOrg && hasPosSystem ? (String(form.customerName || "").trim().length > 1 && normalizeSaleItems(saleItems).length > 0) : (!!form.label.trim() && Number(form.amount) > 0)}
        >
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          {activeMaintenanceFlat && (
            <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: "var(--surface-high)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Maintenance Status</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
                {activeMaintenanceFlat.value} for {MONTHS[month]} {year} is currently {activeMaintenanceFlat.paidEntry ? "paid" : "pending"}.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!activeMaintenanceFlat.paidEntry ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ color: "var(--accent)" }}
                    onClick={() => save({ date: TODAY })}
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ color: "var(--danger)" }}
                    onClick={() => markFlatAsPending(activeMaintenanceFlat)}
                  >
                    Mark as Pending
                  </button>
                )}
              </div>
            </div>
          )}
          {isSmallBusinessOrg && hasPosSystem ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 14 }}>
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>POS Checkout</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 10 }}>
                  <Field label="Phone Number">
                    <Input
                      type="tel"
                      placeholder="Customer phone"
                      value={salePhone}
                      onChange={e => setSalePhone(e.target.value)}
                    />
                  </Field>
                  <Field label={saleIsNewCustomer ? "New Customer Name" : "Customer"} required>
                    {salePhoneLookup ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: "var(--accent-deep)", border: "1px solid var(--accent)44" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", flex: 1 }}>{salePhoneLookup.name}</span>
                        <span style={{ fontSize: 11, color: "var(--accent)", opacity: 0.7 }}>Found</span>
                      </div>
                    ) : saleIsNewCustomer ? (
                      <Input
                        placeholder="Enter new customer name"
                        value={form.customerName || ""}
                        onChange={e => setForm(current => ({ ...current, customerName: e.target.value }))}
                      />
                    ) : (
                      <Select value={form.customerName || ""} onChange={event => setForm(current => ({ ...current, customerName: event.target.value, label: current.label || `${event.target.value} Sale` }))}>
                        <option value="">{clientOptions.length ? "Select customer" : "No customers yet"}</option>
                        {clientOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  <Field label="Invoice Number">
                    <Input value={saleInvoicePreview} readOnly />
                  </Field>
                  <Field label="Date" required>
                    <DateSelectInput value={form.date} onChange={value => setForm(current => ({ ...current, date: value }))} max={TODAY} />
                  </Field>
                </div>
              </div>

              <div className="card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Items</div>
                  <button type="button" className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12 }} onClick={addSaleItem}>+ Add Item</button>
                </div>
                <div style={{ overflowX: isMobile ? "auto" : "visible" }}>
                  <div style={{ minWidth: isMobile ? 680 : "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 0.7fr 0.9fr 0.8fr 0.9fr auto", gap: 8, marginBottom: 8, fontSize: 11, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
                      <div>Product</div>
                      <div>Qty</div>
                      <div>Rate</div>
                      <div>GST</div>
                      <div>Total</div>
                      <div></div>
                    </div>
                    {saleItems.map((line, index) => {
                      const lineTotal = (Number(line.qty || 0) * Number(line.rate || 0)) * (1 + (Number(line.gstRate || 0) / 100));
                      const selectedStock = saleProductByName.get(String(line.productName || "").trim().toLowerCase());
                      return (
                        <div key={line.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 0.7fr 0.9fr 0.8fr 0.9fr auto", gap: 8, alignItems: "center", marginBottom: index === saleItems.length - 1 ? 0 : 8 }}>
                      <Select value={line.productName || ""} onChange={event => updateSaleItem(line.id, "productName", event.target.value)}>
                        <option value="">{saleProductOptions.length ? "Select product" : "Add products via Services in Settings"}</option>
                        {saleProductOptions.map(product => (
                          <option key={product.id || `${product.serviceName}-${product.value}`} value={product.value}>
                            {product.serviceName ? `${product.value} (${product.serviceName})` : product.value}{product.rate > 0 ? ` — ${sym} ${product.rate}` : ""}{` — ${product.quantity} ${product.unit} left`}
                          </option>
                        ))}
                      </Select>
                      <Input
                        type="number"
                        min={selectedStock?.productType === "weight" ? "0.01" : "1"}
                        step={selectedStock?.productType === "weight" ? "0.01" : "1"}
                        placeholder={selectedStock?.productType === "weight" ? "0.25" : "1"}
                        value={line.qty}
                        onChange={event => updateSaleItem(line.id, "qty", event.target.value)}
                      />
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={line.rate} onChange={event => updateSaleItem(line.id, "rate", event.target.value)} />
                      <Select value={line.gstRate} onChange={event => updateSaleItem(line.id, "gstRate", event.target.value)}>
                        {[0, 5, 12, 18, 28].map(rate => <option key={rate} value={String(rate)}>{rate}%</option>)}
                      </Select>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{fmtMoney(lineTotal, sym)}</div>
                        {selectedStock && <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{selectedStock.quantity} {selectedStock.unit} left</div>}
                      </div>
                      <button type="button" className="btn-secondary" style={{ padding: "6px 9px", fontSize: 12, color: "var(--danger)" }} onClick={() => removeSaleItem(line.id)} disabled={saleItems.length <= 1}>x</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 14, background: "var(--surface-high)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, fontSize: 13, color: "var(--text-sec)" }}>
                  <span>Subtotal</span>
                  <span>{fmtMoney(saleTotals.subtotal, sym)}</span>
                  <span>GST</span>
                  <span>{fmtMoney(saleTotals.gstTotal, sym)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Field label="Discount">
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={saleDiscount} onChange={event => setSaleDiscount(event.target.value)} />
                  </Field>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Grand Total</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{fmtMoney(saleTotals.total, sym)}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontWeight: 700,
                      fontSize: 14,
                      color: String(form.saleStatus || "pending") === "paid" ? "var(--text-dim)" : "var(--accent)",
                      border: String(form.saleStatus || "pending") === "paid" ? "1.5px solid var(--border)" : "1.5px solid var(--accent)"
                    }}
                    onClick={() => save({ saleStatus: "paid" })}
                  >
                    {String(form.saleStatus || "pending") === "paid" ? "Paid and Saved" : "Mark as Paid and Save"}
                  </button>
                </div>
              </div>

              <Field label="Note">
                <Input placeholder="Optional note" value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
              </Field>
            </div>
          ) : (
            <>
              <Field label={isSmallBusinessOrg ? "What was sold" : "Description"} required>
                <Input
                  placeholder={isSmallBusinessOrg ? "e.g. Sarees, Tailoring, Milk delivery, Repair work..." : `e.g. ${config.incomeEntryLabel}`}
                  value={form.label}
                  onChange={e => setForm(current => ({ ...current, label: e.target.value }))}
                  autoFocus={guidedField === "label"}
                  style={guidedField === "label" ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(103,178,255,0.2)" } : undefined}
                />
              </Field>
              <Field label={`Amount (${sym})`} required hint={`Enter the ${config.incomeEntryLabel.toLowerCase()} amount.`}>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(current => ({ ...current, amount: e.target.value }))} />
              </Field>
              <Field label="Date Received" required>
                <DateSelectInput value={form.date} onChange={value => setForm(current => ({ ...current, date: value }))} max={TODAY} />
              </Field>
              {(config.incomeFields || []).map(field => (
                <Field key={field.key} label={field.label}>
                  {isPersonalOrg && field.key === "personName" ? (
                    <Select value={form.personName || ""} onChange={event => setForm(current => ({ ...current, personName: event.target.value, label: current.label || `${event.target.value} ${config.incomeEntryLabel}` }))}>
                      <option value="">{peopleOptions.length ? "Select person" : "Add people in Settings first"}</option>
                      {peopleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  ) : isApartmentOrg && field.key === "flatNumber" ? (
                    <Select
                      value={form.flatNumber || ""}
                      autoFocus={guidedField === "flatNumber"}
                      style={guidedField === "flatNumber" ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(103,178,255,0.2)" } : undefined}
                      onChange={event => {
                        const nextFlatNumber = event.target.value;
                        const matchedFlat = flatOptions.find(option => option.value === nextFlatNumber);
                        setForm(current => ({
                          ...current,
                          flatNumber: nextFlatNumber,
                          residentName: matchedFlat?.ownerName || current.residentName || "",
                          label: current.label || `Maintenance Collection - ${nextFlatNumber}`
                        }));
                      }}
                    >
                      <option value="">{flatOptions.length ? "Select flat" : "Add flats in Settings first"}</option>
                      {flatOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  ) : isApartmentOrg && field.key === "residentName" ? (
                    <Input value={form.residentName || ""} placeholder="Owner auto-fills from flat" readOnly />
                  ) : field.key === "clientName" ? (
                    <Select value={form.clientName || ""} onChange={event => setForm(current => ({ ...current, clientName: event.target.value, label: current.label || `${event.target.value} Payment` }))}>
                      <option value="">{clientOptions.length ? "Select client" : "Add clients in Settings first"}</option>
                      {clientOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  ) : isSmallBusinessOrg && field.key === "customerName" ? (
                    <>
                      <Input
                        list="simple-customer-datalist"
                        placeholder="Customer name or walk-in"
                        value={form.customerName || ""}
                        onChange={e => setForm(current => ({ ...current, customerName: e.target.value }))}
                      />
                      <datalist id="simple-customer-datalist">
                        {clientOptions.map(opt => <option key={opt.value} value={opt.value} />)}
                      </datalist>
                    </>
                  ) : renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
                </Field>
              ))}
              {isSmallBusinessOrg && (
                <Field label="Payment Status">
                  <Select value={form.saleStatus || "paid"} onChange={e => setForm(current => ({ ...current, saleStatus: e.target.value }))}>
                    <option value="paid">Paid — Cash / UPI received</option>
                    <option value="pending">Pending — Credit / Will collect later</option>
                  </Select>
                </Field>
              )}
              <Field label="Note">
                <Input placeholder="Optional note" value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
              </Field>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
