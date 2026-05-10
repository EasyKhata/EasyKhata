import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { openExternal } from "../utils/openExternal";
import { getUpgradeCopy } from "../utils/subscription";
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
  SectionSkeleton,
  PaginatedListControls,
  UpgradeModal,
  WorkflowActionStrip,
  WorkflowSetupCard,
  WorkflowRecordCard
} from "../components/UI";
import { RupeeDisplay } from "../components/ui/reimagined";
import { getFinancialInvoices, getInvoiceStatus, getPersonalMemberOptions, invoiceGrandTotal } from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isFutureMonthValue, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";
import { useConfirm } from "../context/DialogContext";

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = TODAY.slice(0, 7);

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

export default function IncomeSection({ year, month, orgType, headerDatePicker }) {
  const d = useData();
  const confirm = useConfirm();
  const isViewerMode = d.isViewerMode;
  const isReadOnlyFreeMode = d.isReadOnlyFreeMode;
  const { user } = useAuth();

  // Lazy-load income collection the first time this section mounts
  useEffect(() => {
    if (!d.loaded || !d.activeOrgId) return;
    d.ensureCollectionLoaded?.("income");
  }, [d.ensureCollectionLoaded, d.loaded, d.activeOrgId]);
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const isApartmentOrg = getOrgType(orgType) === ORG_TYPES.APARTMENT;
  const isPersonalOrg = getOrgType(orgType) === ORG_TYPES.PERSONAL;
  const isFreelancerOrg = getOrgType(orgType) === ORG_TYPES.FREELANCER;
  const visibleIncomeFields = useMemo(() => config.incomeFields || [], [config.incomeFields]);
  const societyName = String(d.account?.name || "").trim();
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const isCurrentViewedMonth = mk === CURRENT_MONTH;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [form, setForm] = useState(buildBlankForm(year, month, config));
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkMaintenanceAmount, setBulkMaintenanceAmount] = useState("");
  const [maintenanceAmountHydrated, setMaintenanceAmountHydrated] = useState(false);
  const [pendingFlatPayments, setPendingFlatPayments] = useState([]);
  const [applyAmountToast, setApplyAmountToast] = useState("");
  const [flatSearchTerm, setFlatSearchTerm] = useState("");
  const [flatStatusFilter, setFlatStatusFilter] = useState("all");
  const [flatPage, setFlatPage] = useState(1);
  const [flatPageSize, setFlatPageSize] = useState(25);
  const [incomePage, setIncomePage] = useState(1);
  const INCOME_PAGE_SIZE = 50;
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
      const itemMk = item.collectionMonth || item.month || item.date?.slice(0, 7) || "";
      if (isApartmentOrg) {
        return itemMk === mk;
      }
      return itemMk === mk;
    })
  ), [d.income, isApartmentOrg, mk]);
  const countableManualIncome = manualIncome;
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
  const paginatedManualIncome = useMemo(() => {
    const start = (incomePage - 1) * INCOME_PAGE_SIZE;
    return filteredManualIncome.slice(start, start + INCOME_PAGE_SIZE);
  }, [filteredManualIncome, incomePage]);
  const apartmentFlats = useMemo(() => (
    (d.customers || []).map(flat => ({
      value: flat.name || "",
      label: [flat.name, flat.ownerName || "", societyName].filter(Boolean).join(" - "),
      ownerName: flat.ownerName || "",
      phone: String(flat.phone || "").trim(),
      phoneNumber: String(flat.phoneNumber || "").trim(),
      phoneCountryCode: String(flat.phoneCountryCode || "").trim(),
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
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ManualIncomeCard = ({ item }) => {
    const meta = [
      item.date ? fmtDate(item.date) : "",
      item.invoiceNumber || item.receiptNumber || "",
      item.note || "",
      ...(config.incomeFields || []).map(field => item[field.key]).filter(Boolean)
    ].filter(Boolean).join(" · ");

    const canManage = d.canManageRecord?.(item) ?? !isViewerMode;
    const confirmDeleteIncome = async event => {
      event.stopPropagation();
      if (!canManage) return;
      if (await confirm(`Delete ${item.label || "this income"}?`, { title: "Delete Income", confirmLabel: "Delete" })) {
        d.removeIncome(item.id);
      }
    };
    const actions = !isViewerMode && canManage ? [
      { label: "Edit", onClick: event => { event.stopPropagation(); openEdit(item); } },
      { label: "Delete", onClick: confirmDeleteIncome, tone: "danger" }
    ] : [];

    return (
      <WorkflowRecordCard
        avatar={<Avatar name={item.label || item.personName || item.clientName || "?"} size={38} fontSize={13} />}
        title={item.label}
        meta={meta}
        amount={fmtMoney(item.amount, sym)}
        amountTone="accent"
        badges={[]}
        actions={actions}
      />
    );
  };

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
    const singleFlatAmount = Number(bulkMaintenanceAmount || 0);
    const expectedAmount = singleFlatAmount * totalFlats;
    const collectedAmount = apartmentCollectionStatus.reduce((sum, flat) => sum + Number(flat.paidEntry?.amount || 0), 0);
    const pendingAmount = Math.max(0, expectedAmount - collectedAmount);
    return { totalFlats, paidFlats, pendingFlats, expectedAmount, collectedAmount, pendingAmount };
  }, [apartmentCollectionStatus, bulkMaintenanceAmount]);
  const anyFlatPaidThisMonth = apartmentCollectionStatus.some(f => f.paidEntry);
  const paidFlatsCount = apartmentCollectionStatus.filter(f => f.paidEntry).length;
  const normalizedFlatSearch = flatSearchTerm.trim().toLowerCase();
  const visibleApartmentCollectionStatus = useMemo(() => apartmentCollectionStatus.filter(flat => {
    if (flatStatusFilter === "paid" && !flat.paidEntry) return false;
    if (flatStatusFilter === "pending" && flat.paidEntry) return false;
    if (flatStatusFilter === "unpriced" && Number(flat.monthlyAmount || 0) > 0) return false;
    if (!normalizedFlatSearch) return true;
    const haystack = [flat.value, flat.ownerName, flat.label].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(normalizedFlatSearch);
  }), [apartmentCollectionStatus, flatStatusFilter, normalizedFlatSearch]);
  const paginatedApartmentCollectionStatus = useMemo(() => {
    const startIndex = (flatPage - 1) * flatPageSize;
    return visibleApartmentCollectionStatus.slice(startIndex, startIndex + flatPageSize);
  }, [flatPage, flatPageSize, visibleApartmentCollectionStatus]);
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
    const maxPages = Math.max(1, Math.ceil(visibleApartmentCollectionStatus.length / flatPageSize));
    if (flatPage > maxPages) setFlatPage(maxPages);
  }, [flatPage, flatPageSize, visibleApartmentCollectionStatus.length]);

  useEffect(() => { setIncomePage(1); }, [mk, normalizedSearch]);


  useEffect(() => {
    if (!guidedField) return undefined;
    const timeout = window.setTimeout(() => setGuidedField(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [guidedField]);

  function openNew() {
    if (isViewerMode) return;
    if (isReadOnlyFreeMode) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate", orgType));
      return;
    }
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
    setForm(buildBlankForm(year, month, config));
    setFormError(""); setErrors({});;
    setShowForm(true);
  }

  useEffect(() => {
    function handleOpenAdd(event) {
      if (event?.detail?.section && event.detail.section !== "income") return;
      openNew();
    }
    window.addEventListener("ledger:open-add", handleOpenAdd);
    return () => window.removeEventListener("ledger:open-add", handleOpenAdd);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(income) {
    if (isViewerMode) return;
    if (isReadOnlyFreeMode) {
      setUpgradeInfo(getUpgradeCopy("invoiceCreate", orgType));
      return;
    }
    const next = buildBlankForm(year, month, config);
    next.label = income.label || "";
    next.amount = String(income.amount ?? "");
    next.date = income.date || next.date;
    next.note = income.note || "";
    (config.incomeFields || []).forEach(field => {
      next[field.key] = income[field.key] || (field.type === "select" ? field.options?.[0] || "" : "");
    });
    setEditId(income.id);
    setForm(next);
    setFormError(""); setErrors({});;
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
    setFormError(""); setErrors({});;
  }

  function save(overrides = {}) {
    if (editId) {
      const existing = (d.income || []).find(item => item.id === editId);
      if (!(d.canManageRecord?.(existing) ?? !isViewerMode)) return;
    } else if (isViewerMode) {
      return;
    }
    const nextForm = { ...form, ...overrides };

    if (isApartmentOrg && !hasApartmentFlats) {
      setFormError("Add at least one resident/flat in Settings before recording a maintenance collection.");
      return;
    }
    if (!hasMinLength(nextForm.label, 2)) {
      setErrors(prev => ({ ...prev, label: `Add a clear ${config.incomeEntryLabel.toLowerCase()} description so you can recognize it later.` }));
      return;
    }
    if (!isPositiveAmount(nextForm.amount)) {
      setErrors(prev => ({ ...prev, amount: "Enter an amount greater than 0." }));
      return;
    }
    if (!isValidDateValue(nextForm.date)) {
      setErrors(prev => ({ ...prev, date: `Choose the date when this ${config.incomeEntryLabel.toLowerCase()} was received.` }));
      return;
    }
    if (isFutureDateValue(nextForm.date)) {
      setErrors(prev => ({ ...prev, date: "Future dates are not allowed for records." }));
      return;
    }
    if (isApartmentOrg && !String(nextForm.flatNumber || "").trim()) {
      setErrors(prev => ({ ...prev, flatNumber: "Select a flat before saving." }));
      return;
    }
    if (isPersonalOrg && !String(nextForm.personName || "").trim()) {
      setErrors(prev => ({ ...prev, personName: "Select a family member before saving." }));
      return;
    }
    if (isFreelancerOrg && !String(nextForm.clientName || "").trim()) {
      setErrors(prev => ({ ...prev, clientName: "Select a customer before saving." }));
      return;
    }
    if (isApartmentOrg && !String(nextForm.residentName || "").trim()) {
      setErrors(prev => ({ ...prev, residentName: "Select the flat record before saving." }));
      return;
    }

    const payload = {
      label: nextForm.label.trim(),
      amount: Number(nextForm.amount),
      date: nextForm.date,
      month: isApartmentOrg ? (nextForm.collectionMonth || nextForm.date.slice(0, 7)) : nextForm.date.slice(0, 7),
    };

    visibleIncomeFields.forEach(field => {
      payload[field.key] = String(nextForm[field.key] || "").trim();
    });

    const hasFutureMonth = visibleIncomeFields.some(field => field.type === "month" && isFutureMonthValue(payload[field.key]));
    if (hasFutureMonth) {
      setFormError("Future months are not allowed for records.");
      return;
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
    if (isViewerMode) return;
    const amount = Number(bulkMaintenanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const normalized = String(amount);
    setBulkMaintenanceAmount(normalized);
    let count = 0;
    (d.customers || []).forEach(customer => {
      if (!String(customer?.name || "").trim()) return;
      d.updateCustomer?.({ ...customer, monthlyMaintenance: normalized });
      count++;
    });
    setApplyAmountToast(`${fmtMoney(amount, sym)} applied to ${count} flat${count !== 1 ? "s" : ""}.`);
  }

  useEffect(() => {
    if (!applyAmountToast) return undefined;
    const t = setTimeout(() => setApplyAmountToast(""), 3000);
    return () => clearTimeout(t);
  }, [applyAmountToast]);

  async function createMaintenanceEntryForFlat(flat, triggerSuccessNotice = false) {
    if (isViewerMode) return;
    if (!flat || flat.paidEntry || !(flat.monthlyAmount > 0)) return;
    const hadDues = (d.income || []).some(item => String(item?.collectionType || "").trim() === "Monthly Maintenance");
    await d.addIncome({
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

  async function markFlatAsPaid(flat) {
    if (isViewerMode) return;
    if (!flat || flat.paidEntry || !(flat.monthlyAmount > 0) || pendingFlatPayments.includes(flat.id)) return;
    const ok = await confirm(
      `Mark Flat ${flat.value} as paid for ${MONTHS[month]} ${year}? This will create a maintenance income entry for ${fmtMoney(flat.monthlyAmount, sym)}.`,
      { title: "Mark Maintenance Paid", confirmLabel: "Mark Paid" }
    );
    if (!ok) return;

    setPendingFlatPayments(current => [...current, flat.id]);
    try {
      await createMaintenanceEntryForFlat(flat, true);
      await d.refreshActiveOrgData?.({ collections: ["income"], includeOrgRecords: true });
    } finally {
      setPendingFlatPayments(current => current.filter(item => item !== flat.id));
    }
  }

  async function markFlatAsPending(flat) {
    if (isViewerMode) return;
    if (!flat?.paidEntry?.id) return;
    const ok = await confirm(
      `Mark Flat ${flat.value} as pending for ${MONTHS[month]} ${year}? This will remove the linked maintenance income entry.`,
      { title: "Mark Maintenance Pending", confirmLabel: "Mark Pending" }
    );
    if (!ok) return;
    await d.removeIncome(flat.paidEntry.id);
    await d.refreshActiveOrgData?.({ collections: ["income"], includeOrgRecords: true });
    setPendingFlatPayments(current => current.filter(item => item !== flat.id));
    closeForm();
  }

  function openBulkCollectionDraft(flat) {
    if (isViewerMode) return;
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
    setFormError(""); setErrors({});;
    setShowForm(true);
  }

  function openFlatWhatsapp(flat) {
    const rawPhone = String(flat?.phone || `${flat?.phoneCountryCode || ""}${flat?.phoneNumber || ""}`).trim();
    const whatsappNumber = rawPhone.replace(/\D/g, "");
    if (!whatsappNumber) return;

    const baseIntro = `${societyName || "Apartment Society"} - ${MONTHS[month]} ${year}`;
    const message = flat?.paidEntry
      ? [
          baseIntro,
          `Flat ${flat.value} collection received.`,
          `Amount: ${fmtMoney(flat.paidEntry.amount || 0, sym)}`,
          `Date: ${fmtDate(flat.paidEntry.date || TODAY)}`,
          "Thank you."
        ].join("\n")
      : [
          baseIntro,
          `Reminder for Flat ${flat.value}`,
          `Due amount: ${fmtMoney(flat.monthlyAmount || 0, sym)}`,
          "Please clear dues at the earliest. Thank you."
        ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    openExternal(url);
  }

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  return (
    <div className="ledger-screen">
      {isViewerMode && (
        <div className="ledger-inline-note" style={{ background: "var(--surface-high)", border: "1px solid var(--border)", color: "var(--text-dim)", fontWeight: 600 }}>
          View only · Contact the org owner to add or edit records
        </div>
      )}

      <div className="ledger-block">
        <WorkflowActionStrip
          title={isPersonalOrg ? "Track household earnings for the selected month." : `Review all ${config.incomeLabel.toLowerCase()} recorded for this period.`}
          actions={[]}
        />
        <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--accent)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                Total {config.incomeLabel} · {MONTHS[month]} {year}
              </div>
            <div style={{ marginTop: 2 }}>
              <RupeeDisplay amount={totalIncome} color="var(--accent)" size={40} animate />
            </div>
            </div>
            {headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>}
          </div>
        </div>
        {isApartmentOrg && !isViewerMode && (
          <div className="card" style={{ padding: 14, marginBottom: 18 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Monthly Maintenance Setup</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, lineHeight: 1.45 }}>
                Set one monthly amount for all flats, then mark individual flats as paid for {MONTHS[month]} {year}.
              </div>
            </div>

            {!hasApartmentFlats ? (
              <WorkflowSetupCard
                title="Add flats first"
                description="Create flat records in Khata before recording maintenance collections."
                actionLabel={!isViewerMode ? "Open Flats" : undefined}
                onAction={!isViewerMode ? openFlatManager : undefined}
                tone="accent"
              />
            ) : (
              <>
                {!isViewerMode && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto", gap: 8, marginBottom: anyFlatPaidThisMonth ? 7 : 12 }}>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Monthly amount for all flats"
                    value={bulkMaintenanceAmount}
                    disabled={anyFlatPaidThisMonth}
                    onChange={event => setBulkMaintenanceAmount(event.target.value)}
                    style={{ opacity: anyFlatPaidThisMonth ? 0.55 : 1 }}
                  />
                  <button className="btn-secondary" style={{ whiteSpace: "nowrap", minHeight: 42, padding: "0 14px" }} onClick={applyMaintenanceAmountToAllFlats} disabled={!(Number(bulkMaintenanceAmount) > 0) || anyFlatPaidThisMonth}>
                    Apply to All Flats
                  </button>
                </div>
                )}
                {applyAmountToast && (
                  <div style={{ padding: "7px 10px", borderRadius: 10, background: "var(--accent-deep)", color: "var(--accent)", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                    ✓ {applyAmountToast}
                  </div>
                )}
                {anyFlatPaidThisMonth && (
                  <div style={{ padding: "9px 10px", borderRadius: 11, background: "var(--gold-deep)", color: "var(--gold)", fontSize: 11, fontWeight: 600, marginBottom: 12, lineHeight: 1.45 }}>
                    {paidFlatsCount} flat{paidFlatsCount !== 1 ? "s" : ""} already marked as paid this month — the monthly amount is locked. Mark them as pending first if you need to change it. Note: changing the amount will affect records for all pending flats.
                  </div>
                )}
                <div className="card" style={{ marginBottom: 10, padding: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, minmax(0, 1fr))", gap: 8 }}>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Flats</div><div style={{ fontSize: 13, fontWeight: 700 }}>{apartmentCollectionMetrics.totalFlats}</div></div>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Paid</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{apartmentCollectionMetrics.paidFlats}</div></div>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pending</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>{apartmentCollectionMetrics.pendingFlats}</div></div>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Expected</div><div style={{ fontSize: 12, fontWeight: 700 }}>{fmtMoney(apartmentCollectionMetrics.expectedAmount, sym)}</div></div>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Collected</div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(apartmentCollectionMetrics.collectedAmount, sym)}</div></div>
                    <div><div style={{ fontSize: 9, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pending Amt</div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(apartmentCollectionMetrics.pendingAmount, sym)}</div></div>
                  </div>
                </div>
                <div style={{ position: "sticky", top: 6, zIndex: 2, background: "var(--card)", borderRadius: 10, paddingBottom: 6, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto auto auto", gap: 8, marginBottom: 10 }}>
                  <Input placeholder="Search flat / owner" value={flatSearchTerm} onChange={event => setFlatSearchTerm(event.target.value)} />
                  <Select value={flatStatusFilter} onChange={event => setFlatStatusFilter(event.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="unpriced">No amount set</option>
                  </Select>
                </div>
                <div className="card" style={{ marginBottom: 8, padding: 10 }}>
                  <PaginatedListControls
                    totalItems={visibleApartmentCollectionStatus.length}
                    page={flatPage}
                    pageSize={flatPageSize}
                    onPageChange={setFlatPage}
                    onPageSizeChange={nextSize => {
                      setFlatPageSize(nextSize);
                      setFlatPage(1);
                    }}
                    itemLabel="flats"
                  />
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  {paginatedApartmentCollectionStatus.map(flat => (
                    <div key={flat.id} className="ledger-feed-row" style={{ alignItems: "center" }}>
                      <div>
                        <div className="ledger-feed-title">{flat.value}</div>
                        <div className="ledger-feed-meta">
                          {[
                            flat.ownerName || "No owner",
                            flat.monthlyAmount > 0 ? `Due ${fmtMoney(flat.monthlyAmount, sym)}` : "Set maintenance amount"
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {flat.paidEntry && (
                          <span className="pill" style={{ background: "var(--accent-deep)", color: "var(--accent)" }}>Paid</span>
                        )}
                        {!isViewerMode && (
                          <button className="ledger-action-btn" onClick={() => openBulkCollectionDraft(flat)}>
                            Review
                          </button>
                        )}
                        {!isViewerMode && isCurrentViewedMonth && !flat.paidEntry && (
                          <button
                            className="ledger-action-btn"
                            style={{ color: !(Number(bulkMaintenanceAmount) > 0) ? undefined : "var(--accent)" }}
                            disabled={pendingFlatPayments.includes(flat.id) || !(Number(bulkMaintenanceAmount) > 0)}
                            title={!(Number(bulkMaintenanceAmount) > 0) ? "Set the monthly maintenance amount above before marking as paid" : undefined}
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
          <div className="card ledger-search-card">
            <Input
              placeholder={`Search ${config.incomeLabel.toLowerCase()} by name, note, date, or amount`}
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
            <div className="ledger-block-caption">
              Find entries by description, person, note, invoice number, or amount.
            </div>
          </div>
        )}
        {!config.hideInvoices && !isApartmentOrg && (
          <>
            <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>From {config.invoicesLabel}</span>
              <span style={{ color: "var(--accent)" }}>{fmtMoney(totalInv, sym)}</span>
            </div>
            <div className="card">
              {invIncome.length === 0 ? (
                <WorkflowSetupCard
                  title={`No ${config.invoicesLabel.toLowerCase()} collected yet`}
                  description={`Paid ${config.invoicesLabel.toLowerCase()} received this month will appear here automatically.`}
                  actionLabel={`Open ${config.invoicesLabel}`}
                  onAction={() => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: "invoices" }))}
                  tone="info"
                />
              ) : filteredInvIncome.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
                  No {config.invoicesLabel.toLowerCase()} match this search.
                </div>
              ) : (
                filteredInvIncome.map(invoice => (
                  <div key={invoice.id} className="ledger-feed-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={invoice.customer?.name || "?"} size={34} fontSize={12} />
                      <div className="ledger-feed-main">
                        <div className="ledger-feed-title">{invoice.customer?.name || invoice.billTo?.name}</div>
                        <div className="ledger-feed-meta">{invoice.number} · Paid on {fmtDate(invoice.paidDate || invoice.date)}</div>
                      </div>
                    </div>
                    <span className="ledger-feed-amount" style={{ color: "var(--accent)" }}>{fmtMoney(invoiceGrandTotal(invoice), sym)}</span>
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
            <WorkflowSetupCard
              eyebrow="Collections setup"
              title="Add flats before tracking collections"
              message="Maintenance collections need at least one flat record in Khata so each payment stays linked to the right unit."
              actionLabel={!isViewerMode ? "Open Flats" : undefined}
              onAction={!isViewerMode ? openFlatManager : undefined}
              tone="accent"
            />
          ) : !hasHouseholdPeople ? (
            <WorkflowSetupCard
              eyebrow="Household setup"
              title="Add a person before tracking earnings"
              message="Household earnings must be tagged to at least one person. Add your first person in Khata to keep every entry connected to the right family member."
              actionLabel={!isViewerMode ? "Open People" : undefined}
              onAction={!isViewerMode ? openPeopleManager : undefined}
              tone="accent"
            />
          ) : isFreelancerOrg && !hasFreelancerClients ? (
            <WorkflowSetupCard
              eyebrow="Customer setup"
              title="Add a customer before tracking payments"
              message="Business payments should be linked to a customer so invoices, collections, and follow-up all stay aligned."
              actionLabel={!isViewerMode ? "Open Customers" : undefined}
              onAction={!isViewerMode ? () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } })) : undefined}
              tone="accent"
            />
          ) : manualIncome.length === 0 ? (
            <WorkflowSetupCard
              eyebrow={isApartmentOrg ? "Collections" : "Manual entries"}
              title={`No ${config.incomeLabel.toLowerCase()} yet`}
              message={isApartmentOrg ? `Tap "${config.incomeActionLabel}" below or use the + button to record your first maintenance collection.` : `Tap "${config.incomeActionLabel}" below or use the + button to record your first ${config.incomeEntryLabel.toLowerCase()}.`}
              actionLabel={!isViewerMode ? config.incomeActionLabel : undefined}
              onAction={!isViewerMode ? openNew : undefined}
              tone="accent"
            />
          ) : filteredManualIncome.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
              No {config.incomeLabel.toLowerCase()} match this search.
            </div>
          ) : (
            <>
              {filteredManualIncome.length > INCOME_PAGE_SIZE && (
                <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                  <PaginatedListControls
                    totalItems={filteredManualIncome.length}
                    page={incomePage}
                    pageSize={INCOME_PAGE_SIZE}
                    onPageChange={setIncomePage}
                    itemLabel={config.incomeLabel.toLowerCase()}
                  />
                </div>
              )}
              {paginatedManualIncome.map(item => (
                <ManualIncomeCard key={item.id} item={item} />
              ))}
              {filteredManualIncome.length > INCOME_PAGE_SIZE && (
                <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                  <PaginatedListControls
                    totalItems={filteredManualIncome.length}
                    page={incomePage}
                    pageSize={INCOME_PAGE_SIZE}
                    onPageChange={setIncomePage}
                    itemLabel={config.incomeLabel.toLowerCase()}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showForm && (
        <Modal
          title={editId ? `Edit ${config.incomeEntryLabel}` : config.incomeActionLabel}
          onClose={closeForm}
          onSave={save}
          saveLabel={editId ? "Update" : "Save"}
          canSave={!!form.label.trim() && Number(form.amount) > 0}
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
          <div className="ledger-form-grid">
              <div className="ledger-form-group">
                <div className="ledger-form-group-title">Primary details</div>
                <Field label="Description" required error={errors.label}>
                  <Input
                    error={errors.label}
                    placeholder={`e.g. ${config.incomeEntryLabel}`}
                    value={form.label}
                    onChange={e => { setForm(current => ({ ...current, label: e.target.value })); if (errors.label) setErrors(prev => ({ ...prev, label: "" })); }}
                    onBlur={() => { if (!hasMinLength(form.label, 2)) setErrors(prev => ({ ...prev, label: `Add a clear ${config.incomeEntryLabel.toLowerCase()} description so you can recognize it later.` })); }}
                    autoFocus={guidedField === "label"}
                    style={guidedField === "label" ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(103,178,255,0.2)" } : undefined}
                  />
                </Field>
                <div className="ledger-form-split">
                  <Field label={`Amount (${sym})`} required hint={`Enter the ${config.incomeEntryLabel.toLowerCase()} amount.`} error={errors.amount}>
                    <Input error={errors.amount} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => { setForm(current => ({ ...current, amount: e.target.value })); if (errors.amount) setErrors(prev => ({ ...prev, amount: "" })); }} onBlur={() => { if (form.amount !== "" && !isPositiveAmount(form.amount)) setErrors(prev => ({ ...prev, amount: "Enter an amount greater than 0." })); }} />
                  </Field>
                  <Field label="Date Received" required error={errors.date}>
                    <DateSelectInput value={form.date} onChange={value => { setForm(current => ({ ...current, date: value })); if (errors.date) setErrors(prev => ({ ...prev, date: "" })); }} max={TODAY} />
                  </Field>
                </div>
              </div>
              <div className="ledger-form-group compact">
                <div className="ledger-form-group-title">Entry details</div>
              {visibleIncomeFields.map(field => (
                <Field key={field.key} label={field.label} required={isFreelancerOrg && field.key === "clientName"} error={errors[field.key]}>
                  {isPersonalOrg && field.key === "personName" ? (
                    <Select error={errors.personName} value={form.personName || ""} onChange={event => { setForm(current => ({ ...current, personName: event.target.value, label: current.label || `${event.target.value} ${config.incomeEntryLabel}` })); if (errors.personName) setErrors(prev => ({ ...prev, personName: "" })); }}>
                      <option value="">{peopleOptions.length ? "Select family member" : "Add family members in Settings first"}</option>
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
                    <Select error={errors.clientName} value={form.clientName || ""} onChange={event => { setForm(current => ({ ...current, clientName: event.target.value, label: current.label || `${event.target.value} Payment` })); if (errors.clientName) setErrors(prev => ({ ...prev, clientName: "" })); }}>
                      <option value="">{clientOptions.length ? "Select customer" : "Add customers in Settings first"}</option>
                      {clientOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </Select>
                  ) : renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
                </Field>
              ))}
              </div>
            </div>
        </Modal>
      )}
      <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
    </div>
  );
}
