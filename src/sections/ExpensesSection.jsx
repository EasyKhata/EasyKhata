import React, { useEffect, useMemo, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useData } from "../context/DataContext";
import { storage } from "../firebase";
import {
  DateSelectInput,
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
  DeleteBtn,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  SectionSkeleton,
  ProgressBar,
  UpgradeModal,
  WorkflowActionStrip,
  WorkflowSetupCard,
  WorkflowRecordCard,
  PaginatedListControls
} from "../components/UI";
import { RupeeDisplay } from "../components/ui/reimagined";
import Collapsible from "../components/Collapsible";
import { getPersonalMemberOptions } from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { useAuth } from "../context/AuthContext";
import { openExternal } from "../utils/openExternal";
import { canUseFeature, getUpgradeCopy } from "../utils/subscription";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";
import { logError } from "../utils/logger";
import { useConfirm } from "../context/DialogContext";

const DEFAULT_EXPENSE_CATEGORIES = ["Operations", "Tools", "Marketing", "Payroll", "Utilities", "Travel", "Other"];
const TODAY = new Date().toISOString().slice(0, 10);
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

function buildBlankForm(year, month, config, categories) {
  const defaultCategory = categories?.[0] || DEFAULT_EXPENSE_CATEGORIES[0];
  const base = {
    label: "",
    amount: "",
    category: defaultCategory,
    recurring: false,
    date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    endDate: "",
    note: "",
    teamMemberName: "",
    partnerName: "",
    staffMemberName: "",
    receiptImageUrl: "",
    receiptImagePath: "",
    receiptFileName: "",
    receiptUploadedAt: ""
  };
  (config.expenseFields || []).forEach(field => {
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

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} max={field.type === "date" ? TODAY : undefined} step={field.type === "number" ? "0.01" : undefined} />;
}

export default function ExpensesSection({ year, month, orgType, headerDatePicker }) {
  const d = useData();
  const confirm = useConfirm();
  const isViewerMode = d.isViewerMode;
  const { user } = useAuth();

  // Lazy-load expenses collection the first time this section mounts
  useEffect(() => {
    if (!d.loaded || !d.activeOrgId) return;
    d.ensureCollectionLoaded?.("expenses");
  }, [d.ensureCollectionLoaded, d.loaded, d.activeOrgId]);
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const isApartmentOrg = getOrgType(orgType) === ORG_TYPES.APARTMENT;
  const isPersonalOrg = getOrgType(orgType) === ORG_TYPES.PERSONAL;
  const isFreelancerOrg = getOrgType(orgType) === ORG_TYPES.FREELANCER;
  const canAttachReceipt = isApartmentOrg || isFreelancerOrg;
  const visibleExpenseFields = useMemo(
    () => (config.expenseFields || []).filter(field => {
      if (isPersonalOrg && field.key === "necessityType") return false;
      if (isApartmentOrg && field.key === "expenseType") return false;
      return true;
    }),
    [config.expenseFields, isApartmentOrg, isPersonalOrg]
  );
  const sym = d.currency?.symbol || "Rs";
  const mk = monthKey(year, month);
  const categoryOptions = useMemo(() => {
    const configuredCategories = config.expenseCategories?.length ? config.expenseCategories : DEFAULT_EXPENSE_CATEGORIES;
    const usedCategories = [
      ...Object.keys(d.budgets || {}),
      ...(d.expenses || []).map(expense => expense.category).filter(Boolean)
    ];
    return [...new Set([...configuredCategories, ...usedCategories])];
  }, [config.expenseCategories, d.budgets, d.expenses]);
  const [showForm, setShowForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expensesPage, setExpensesPage] = useState(1);
  const EXPENSES_PAGE_SIZE = 50;
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [form, setForm] = useState(buildBlankForm(year, month, config, categoryOptions));
  const openPeopleManager = () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));
  const openFlatManager = openPeopleManager;
  const [budgetDraft, setBudgetDraft] = useState(() =>
    categoryOptions.reduce((map, category) => ({ ...map, [category]: String(d.budgets?.[category] || "") }), {})
  );
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
  const supplierOptions = useMemo(() => (
    (d.orgRecords?.suppliers || []).map(supplier => ({ value: supplier.supplierName || "", label: [supplier.supplierName || "", supplier.contact || "", supplier.creditBalance ? `${sym} ${supplier.creditBalance}` : ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.orgRecords, sym]);
  const clientOptions = useMemo(() => (
    (d.customers || []).map(client => ({ value: client.name || "", label: [client.name || "", client.company || client.phone || ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.customers]);
  const staffOptions = useMemo(() => (
    (d.orgRecords?.staff || []).map(m => ({ value: m.name || "", label: [m.name || "", m.role || m.phone || ""].filter(Boolean).join(" - ") })).filter(o => o.value)
  ), [d.orgRecords?.staff]);
  const hasHouseholdPeople = !isPersonalOrg || peopleOptions.length > 0;
  const hasApartmentFlats = !isApartmentOrg || (d.customers || []).some(flat => String(flat?.name || "").trim());
  const hasFreelancerClients = !isFreelancerOrg || clientOptions.length > 0;

  const active = useMemo(() => d.expenses.filter(expense => {
    if (!expense.recurring) return (expense.month || expense.date?.slice(0, 7) || "") === mk;
    const started = expense.startMonth <= mk;
    const notEnded = !expense.endMonth || expense.endMonth >= mk;
    return started && notEnded;
  }), [d.expenses, mk]);
  const total = useMemo(() => active.reduce((sum, expense) => sum + Number(expense.amount), 0), [active]);
  const recurring = useMemo(() => active.filter(expense => expense.recurring), [active]);
  const oneTime = useMemo(() => active.filter(expense => !expense.recurring), [active]);
  const stockExpenses = useMemo(() => active.filter(expense => String(expense.purchaseType || "").trim() === "Stock Purchase"), [active]);
  const supplierPaymentExpenses = useMemo(() => active.filter(expense => String(expense.purchaseType || "").trim() === "Supplier Payment"), [active]);
  const retailOtherExpenses = useMemo(() => active.filter(expense => !["Stock Purchase", "Supplier Payment"].includes(String(expense.purchaseType || "").trim())), [active]);
  const filteredExpenses = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const sorted = active.slice().sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
    if (!needle) return sorted;

    return sorted.filter(expense => {
      const fields = [
        expense.label,
        expense.category,
        expense.note,
        expense.personName,
        expense.expenseType,
        expense.purchaseType,
        expense.teamMemberName,
        expense.partnerName,
        expense.supplierName,
        expense.clientName
      ];
      return fields.some(value => String(value || "").toLowerCase().includes(needle));
    });
  }, [active, searchQuery]);
  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * EXPENSES_PAGE_SIZE;
    return filteredExpenses.slice(start, start + EXPENSES_PAGE_SIZE);
  }, [filteredExpenses, expensesPage]);

  // Compute budget progress directly from already-loaded expenses — no full dashboard calculation needed.
  const budgetCards = useMemo(() => {
    const budgets = d.budgets && typeof d.budgets === "object" ? d.budgets : {};
    if (!Object.keys(budgets).length) return [];
    const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
    const spent = {};
    (d.expenses || []).forEach(e => {
      const em = e.month || (e.date ? e.date.slice(0, 7) : "");
      if (em === mk && e.category) spent[e.category] = (spent[e.category] || 0) + Number(e.amount || 0);
    });
    return Object.entries(budgets).map(([category, budget]) => {
      const s = spent[category] || 0;
      const limit = Number(budget) || 0;
      const progress = limit > 0 ? (s / limit) * 100 : 0;
      const tone = progress >= 100 ? "var(--danger)" : progress >= 80 ? "var(--gold)" : "var(--accent)";
      return { category, budget: limit, spent: s, remaining: Math.max(0, limit - s), progress, tone };
    });
  }, [d.budgets, d.expenses, year, month]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { setExpensesPage(1); }, [mk, searchQuery]);

  function openNew() {
    if (isViewerMode) return;
    if (isApartmentOrg && !hasApartmentFlats) {
      openFlatManager();
      return;
    }
    if (!hasHouseholdPeople) {
      openPeopleManager();
      return;
    }
    setEditId(null);
    setForm(buildBlankForm(year, month, config, categoryOptions));
    setReceiptError("");
    setFormError(""); setErrors({});
    setShowForm(true);
  }

  const openNewRef = useRef(openNew);
  useEffect(() => { openNewRef.current = openNew; });

  useEffect(() => {
    function handleOpenAdd(event) {
      if (event?.detail?.section && event.detail.section !== "expenses") return;
      openNewRef.current();
    }
    window.addEventListener("ledger:open-add", handleOpenAdd);
    return () => window.removeEventListener("ledger:open-add", handleOpenAdd);
  }, []);

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openBudgetEditor() {
    if (isViewerMode) return;
    if (!canUseFeature(user, "budgets")) {
      setUpgradeInfo(getUpgradeCopy("budgets"));
      return;
    }
    setBudgetDraft(categoryOptions.reduce((map, category) => ({ ...map, [category]: String(d.budgets?.[category] || "") }), {}));
    setShowBudgetForm(true);
  }

  function openEdit(expense) {
    if (isViewerMode) return;
    const next = buildBlankForm(year, month, config, categoryOptions);
    next.label = expense.label || "";
    next.amount = String(expense.amount ?? "");
    next.category = expense.category || categoryOptions[0] || DEFAULT_EXPENSE_CATEGORIES[0];
    next.recurring = isPersonalOrg ? false : Boolean(expense.recurring);
    next.date = expense.date || next.date;
    next.endDate = isPersonalOrg ? "" : expense.endDate || "";
    next.note = expense.note || "";
    next.teamMemberName = expense.teamMemberName || "";
    next.partnerName = expense.partnerName || "";
    next.staffMemberName = expense.staffMemberName || "";
    next.receiptImageUrl = expense.receiptImageUrl || "";
    next.receiptImagePath = expense.receiptImagePath || "";
    next.receiptFileName = expense.receiptFileName || "";
    next.receiptUploadedAt = expense.receiptUploadedAt || "";
    visibleExpenseFields.forEach(field => {
      next[field.key] = expense[field.key] || (field.type === "select" ? field.options?.[0] || "" : "");
    });
    setEditId(expense.id);
    setForm(next);
    setReceiptError("");
    setFormError(""); setErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setEditId(null);
    setShowForm(false);
    setReceiptError("");
    setFormError(""); setErrors({});
    setForm(buildBlankForm(year, month, config, categoryOptions));
  }

  function safeReceiptFileName(file) {
    const extension = String(file?.name || "").split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
  }

  async function uploadReceiptImage(file) {
    if (!file || !canAttachReceipt) return;
    setReceiptError("");

    if (!String(file.type || "").startsWith("image/")) {
      setReceiptError("Upload an image file for the receipt or bill.");
      return;
    }

    if (file.size > RECEIPT_MAX_BYTES) {
      setReceiptError("Receipt image must be under 5 MB.");
      return;
    }

    if (!user?.id) {
      setReceiptError("Please sign in again before uploading a receipt.");
      return;
    }

    setUploadingReceipt(true);
    try {
      const orgId = d.activeOrgId || "active-org";
      const filePath = `expense-receipts/${user.id}/${orgId}/${safeReceiptFileName(file)}`;
      const uploadRef = ref(storage, filePath);
      await uploadBytes(uploadRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.id,
          orgId: String(orgId),
          expenseId: editId || "new"
        }
      });
      const url = await getDownloadURL(uploadRef);
      setForm(current => ({
        ...current,
        receiptImageUrl: url,
        receiptImagePath: filePath,
        receiptFileName: file.name || "receipt",
        receiptUploadedAt: new Date().toISOString()
      }));
    } catch (error) {
      setReceiptError("Receipt upload failed. Please try again.");
      logError("expense_receipt_upload_failed", error, {
        userId: user?.id,
        orgId: d.activeOrgId || "",
        editId: editId || ""
      });
    } finally {
      setUploadingReceipt(false);
    }
  }

  function clearReceiptImage() {
    setReceiptError("");
    setForm(current => ({
      ...current,
      receiptImageUrl: "",
      receiptImagePath: "",
      receiptFileName: "",
      receiptUploadedAt: ""
    }));
  }

  function openReceipt(url) {
    if (!url) return;
    openExternal(url);
  }

  function saveBudgets() {
    if (isViewerMode) return;
    const invalidBudget = categoryOptions.find(category => {
      const raw = budgetDraft[category];
      if (raw === "" || raw == null) return false;
      const amount = Number(raw);
      return !Number.isFinite(amount) || amount < 0;
    });

    if (invalidBudget) {
      setBudgetError(`Please enter a valid budget amount for ${invalidBudget}.`);
      return;
    }
    setBudgetError("");

    const nextBudgets = categoryOptions.reduce((map, category) => {
      const amount = Number(budgetDraft[category]) || 0;
      if (amount > 0) map[category] = amount;
      return map;
    }, {});
    d.saveBudgets(nextBudgets);
    setShowBudgetForm(false);
  }

  function validateForm() {
    const nextErrors = {};
    if (isApartmentOrg && !hasApartmentFlats) {
      return { _form: "Add at least one flat record before saving society expenses." };
    }
    if (!hasMinLength(form.label, 2)) nextErrors.label = `Add a short ${config.expensesEntryLabel.toLowerCase()} title so it is easy to identify later.`;
    if (!isPositiveAmount(form.amount)) nextErrors.amount = "Enter an amount greater than 0.";
    if (isPersonalOrg && !String(form.personName || "").trim()) nextErrors.personName = "Select a family member before saving.";
    if (!isValidDateValue(form.date)) {
      nextErrors.date = `Choose the ${config.expensesEntryLabel.toLowerCase()} date.`;
    } else if (isFutureDateValue(form.date)) {
      nextErrors.date = "Future dates are not allowed for records.";
    }
    if (!isPersonalOrg && form.recurring && form.endDate && !isValidDateValue(form.endDate)) {
      nextErrors.endDate = "Choose a valid recurring end date or leave it empty.";
    } else if (!isPersonalOrg && form.recurring && form.endDate && form.endDate < form.date) {
      nextErrors.endDate = "Recurring end date must be on or after the start date.";
    }
    return nextErrors;
  }

  function save() {
    if (editId) {
      const existing = (d.expenses || []).find(item => item.id === editId);
      if (!(d.canManageRecord?.(existing) ?? !isViewerMode)) return;
    } else if (isViewerMode) {
      return;
    }
    const nextErrors = validateForm();
    if (nextErrors._form) {
      setFormError(nextErrors._form);
      return;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      label: form.label.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      recurring: isPersonalOrg ? false : form.recurring,
      staffMemberName: String(form.staffMemberName || "").trim() || undefined,
    };

    visibleExpenseFields.forEach(field => {
      payload[field.key] = String(form[field.key] || "").trim();
    });

    if (canAttachReceipt) {
      payload.receiptImageUrl = form.receiptImageUrl || "";
      payload.receiptImagePath = form.receiptImagePath || "";
      payload.receiptFileName = form.receiptFileName || "";
      payload.receiptUploadedAt = form.receiptUploadedAt || "";
    }

    if (!isPersonalOrg && form.recurring) {
      payload.startMonth = form.date.slice(0, 7);
      payload.endDate = form.endDate || "";
      payload.endMonth = form.endDate ? form.endDate.slice(0, 7) : "";
    } else {
      payload.month = form.date.slice(0, 7);
      payload.startMonth = "";
      payload.endDate = "";
      payload.endMonth = "";
    }

    if (editId) {
      d.updateExpense({ ...payload, id: editId });
    } else {
      const hadAnyExpense = (d.expenses || []).length > 0;
      d.addExpense(payload);
      
      // Fire second-success event on first expense creation
      if (!hadAnyExpense) {
        window.dispatchEvent(new CustomEvent("ledger:second-success", {
          detail: {
            title: "First expense recorded",
            message: "Excellent. You can now see profit/loss. Next, explore the dashboard for insights and reports.",
            actionLabel: "View Dashboard",
            target: { tab: "dashboard" }
          }
        }));
      }
    }

    closeForm();
  }

  function expenseMeta(expense) {
    const extras = visibleExpenseFields
      .map(field => expense[field.key])
      .filter(Boolean)
      .join(" - ");
    const bits = [
      expense.category,
      expense.date ? fmtDate(expense.date) : "",
      expense.recurring && expense.endDate ? `ends ${fmtDate(expense.endDate)}` : "",
      expense.teamMemberName || "",
      expense.partnerName || "",
      expense.staffMemberName || "",
      extras,
      expense.note || ""
    ].filter(Boolean);
    return bits.join(" - ");
  }

  const ExpenseRow = ({ expense }) => {
    const receiptUrl = expense.receiptImageUrl || "";
    const badges = [
      ...(!isPersonalOrg && expense.recurring ? [{ label: "Recurring", tone: "blue" }] : []),
      ...(receiptUrl ? [{ label: "Receipt", tone: "green" }] : [])
    ];
    const canManage = d.canManageRecord?.(expense) ?? !isViewerMode;
    const confirmDeleteExpense = async () => {
      if (!canManage) return;
      if (await confirm(`Delete ${expense.label || "this expense"}?`, { title: "Delete Expense", confirmLabel: "Delete" })) {
        d.removeExpense(expense.id);
      }
    };
    const ownerActions = [
      ...(receiptUrl ? [{ label: "View Receipt", onClick: () => openReceipt(receiptUrl) }] : []),
      ...(canManage ? [
        { label: "Edit", onClick: () => openEdit(expense) },
        { label: "Delete", onClick: confirmDeleteExpense, tone: "danger" }
      ] : [])
    ];

    return (
      <WorkflowRecordCard
        title={expense.label}
        meta={expenseMeta(expense)}
        amount={fmtMoney(expense.amount, sym)}
        amountTone="danger"
        badges={badges}
        actions={!isViewerMode ? ownerActions : receiptUrl ? [{ label: "View Receipt", onClick: () => openReceipt(receiptUrl) }] : []}
      />
    );
  };

  const expensesSub = isPersonalOrg
    ? "Review monthly spending without oversized cards."
    : isApartmentOrg
      ? "Track society bills, utilities, and repairs in one compact ledger."
      : config.enableBudgets === false
        ? "Track business costs in one place."
        : `${budgetCards.filter(item => item.progress >= 100).length} budget${budgetCards.filter(item => item.progress >= 100).length === 1 ? "" : "s"} over limit this month.`;

  return (
    <div className="ledger-screen">
      {isViewerMode && (
        <div className="ledger-inline-note" style={{ background: "var(--surface-high)", border: "1px solid var(--border)", color: "var(--text-dim)", fontWeight: 600 }}>
          View only · Contact the org owner to add or edit records
        </div>
      )}

      <div className="ledger-block">
        <WorkflowActionStrip
          title={expensesSub}
          actions={[]}
        />
        <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                Total {config.expensesLabel} · {MONTHS[month]} {year}
              </div>
            <div style={{ marginTop: 2 }}>
              <RupeeDisplay amount={total} color="var(--danger)" size={40} animate />
            </div>
            </div>
            {headerDatePicker && <div className="ledger-card-month-picker">{headerDatePicker}</div>}
          </div>
        </div>
        {isPersonalOrg ? (
          <>
            {hasHouseholdPeople && (
                <div className="card ledger-search-card" style={{ marginBottom: 18 }}>
                <Field label={`Search ${config.expensesLabel}`} hint="Find entries by description, category, person, note, or linked name.">
                  <Input placeholder={`Search ${config.expensesLabel.toLowerCase()}...`} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
                </Field>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {filteredExpenses.length} of {active.length} entry{active.length === 1 ? "" : "ies"} shown for {MONTHS[month]} {year}
                </div>
              </div>
            )}

            <div className="card">
              {!hasHouseholdPeople ? (
                <WorkflowSetupCard
                  eyebrow="Household setup"
                  title="Add a person before tracking spendings"
                  message="Household spending must be tagged to at least one person. Add your first person in Khata to continue."
                  actionLabel={!isViewerMode ? "Open People" : undefined}
                  onAction={!isViewerMode ? openPeopleManager : undefined}
                  tone="danger"
                />
              ) : active.length === 0 ? (
                <WorkflowSetupCard
                  eyebrow="Track spend"
                  title={`No ${config.expensesLabel.toLowerCase()} yet`}
                  message={`Tap "${config.expensesActionLabel}" below or use the + button to record your first ${config.expensesEntryLabel.toLowerCase()}.`}
                  actionLabel={!isViewerMode ? config.expensesActionLabel : undefined}
                  onAction={!isViewerMode ? openNew : undefined}
                  tone="danger"
                />
              ) : filteredExpenses.length === 0 ? (
                <div style={{ padding: "18px 16px", fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
                  No matching spendings. Try a different search term.
                </div>
              ) : (
                filteredExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
              )}
            </div>
          </>
        ) : (
          <>
            {config.enableBudgets !== false && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Category Budgets</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>See overspending early and set simple monthly limits.</div>
                  </div>
                  {!isViewerMode && <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={openBudgetEditor}>Set Budgets</button>}
                </div>
                <div className="card" style={{ marginBottom: 22 }}>
                  {budgetCards.length === 0 ? (
                    <WorkflowSetupCard title="No budgets set yet" message="Create category budgets to spot overspending before it hurts your month." actionLabel={!isViewerMode ? "Set Budgets" : undefined} onAction={!isViewerMode ? openBudgetEditor : undefined} tone="danger" />
                  ) : (
                    budgetCards.map((item, index) => (
                      <div key={item.category} style={{ padding: "12px 14px", borderBottom: index < budgetCards.length - 1 ? "1px solid color-mix(in srgb, var(--border) 68%, transparent)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.category}</div>
                            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                              {fmtMoney(item.spent, sym)} spent of {fmtMoney(item.budget, sym)}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: item.tone }}>{Math.round(item.progress)}%</div>
                        </div>
                        <ProgressBar pct={Math.min(100, item.progress)} color={item.tone} />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {active.length > 0 && (
              <div className="card ledger-search-card" style={{ marginBottom: 18 }}>
                <Field label={`Search ${config.expensesLabel}`} hint="Find entries by description, category, vendor, note, or linked name.">
                  <Input placeholder={`Search ${config.expensesLabel.toLowerCase()}...`} value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
                </Field>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {filteredExpenses.length} of {active.length} entry{active.length === 1 ? "" : "ies"} shown for {MONTHS[month]} {year}
                </div>
              </div>
            )}

            {isFreelancerOrg ? (
                <div className="card">
                  {!hasFreelancerClients ? (
                  <WorkflowSetupCard
                    eyebrow="Client setup"
                    title="Add a client before tracking expenses"
                    message="Freelancer expenses must be linked to at least one client. Add your first client in Khata to continue."
                    actionLabel={!isViewerMode ? "Open Clients" : undefined}
                    onAction={!isViewerMode ? () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } })) : undefined}
                    tone="danger"
                  />
                ) : active.length === 0 ? (
                  <WorkflowSetupCard
                    eyebrow="Track spend"
                    title={`No ${config.expensesLabel.toLowerCase()} yet`}
                    message={`Tap "${config.expensesActionLabel}" below or use the + button to record your first ${config.expensesEntryLabel.toLowerCase()}.`}
                    actionLabel={!isViewerMode ? config.expensesActionLabel : undefined}
                    onAction={!isViewerMode ? openNew : undefined}
                    tone="danger"
                  />
                ) : filteredExpenses.length === 0 ? (
                  <div style={{ padding: "18px 16px", fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
                    No matching expenses. Try a different search term.
                  </div>
                ) : (
                  <>
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                    {paginatedExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : recurring.length > 0 && (
              <Collapsible title={`Recurring ${config.expensesLabel}`} icon="↻" color="var(--danger)" count={recurring.length} defaultOpen>
                <div className="card">{recurring.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}</div>
              </Collapsible>
            )}

            {!isApartmentOrg && !isFreelancerOrg && <Collapsible title={`One-Time ${config.expensesLabel}`} icon="•" color="var(--danger)" count={oneTime.length} defaultOpen={oneTime.length > 0}>
              <div className="card">
                {oneTime.length === 0 ? (
                  <WorkflowSetupCard
                    title={`No ${config.expensesLabel.toLowerCase()} yet`}
                    message={`Tap "${config.expensesActionLabel}" below or use the + button to record your first ${config.expensesEntryLabel.toLowerCase()}.`}
                    actionLabel={!isViewerMode ? config.expensesActionLabel : undefined}
                    onAction={!isViewerMode ? openNew : undefined}
                    tone="danger"
                  />
                ) : (
                  oneTime.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>}

            {isApartmentOrg && hasApartmentFlats && (
              <div className="card">
                {active.length === 0 ? (
                  <WorkflowSetupCard
                    eyebrow="Society spend"
                    title={`No ${config.expensesLabel.toLowerCase()} yet`}
                    message={`Tap "${config.expensesActionLabel}" below or use the + button to record your first ${config.expensesEntryLabel.toLowerCase()}.`}
                    actionLabel={!isViewerMode ? config.expensesActionLabel : undefined}
                    onAction={!isViewerMode ? openNew : undefined}
                    tone="danger"
                  />
                ) : filteredExpenses.length === 0 ? (
                  <div style={{ padding: "18px 16px", fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
                    No matching expenses. Try a different search term.
                  </div>
                ) : (
                  <>
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                    {paginatedExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {isApartmentOrg && !hasApartmentFlats && (
              <div className="card">
                {active.length === 0 ? (
                  <WorkflowSetupCard
                    eyebrow="Society setup"
                    title="Add flats before tracking society expenses"
                    message="Society expenses stay locked until you create at least one flat record in Khata."
                    actionLabel={!isViewerMode ? "Open Flats" : undefined}
                    onAction={!isViewerMode ? openFlatManager : undefined}
                    tone="danger"
                  />
                ) : filteredExpenses.length === 0 ? (
                  <div style={{ padding: "18px 16px", fontSize: 13, color: "var(--text-dim)", textAlign: "center" }}>
                    No matching expenses. Try a different search term.
                  </div>
                ) : (
                  <>
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                    {paginatedExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}
                    {filteredExpenses.length > EXPENSES_PAGE_SIZE && (
                      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
                        <PaginatedListControls
                          totalItems={filteredExpenses.length}
                          page={expensesPage}
                          pageSize={EXPENSES_PAGE_SIZE}
                          onPageChange={setExpensesPage}
                          itemLabel={config.expensesLabel.toLowerCase()}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <Modal
          title={editId ? `Edit ${config.expensesEntryLabel}` : config.expensesActionLabel}
          onClose={closeForm}
          onSave={save}
          saveLabel={editId ? "Update" : "Save"}
          canSave={!!form.label.trim() && Number(form.amount) > 0 && !uploadingReceipt}
          accentColor="var(--danger)"
        >
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div className="ledger-form-grid">
            <div className="ledger-form-group">
              <div className="ledger-form-group-title">Primary details</div>
              <Field label="Description" required error={errors.label}>
                <Input error={errors.label} placeholder={`e.g. ${config.expensesEntryLabel}`} value={form.label} onChange={e => { setForm(current => ({ ...current, label: e.target.value })); if (errors.label) setErrors(prev => ({ ...prev, label: "" })); }} onBlur={() => { if (!hasMinLength(form.label, 2)) setErrors(prev => ({ ...prev, label: `Add a short ${config.expensesEntryLabel.toLowerCase()} title so it is easy to identify later.` })); }} />
              </Field>
              <div className="ledger-form-split">
                <Field label={`Amount (${sym})`} required hint={`Enter how much you spent for this ${config.expensesEntryLabel.toLowerCase()}.`} error={errors.amount}>
                  <Input error={errors.amount} type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => { setForm(current => ({ ...current, amount: e.target.value })); if (errors.amount) setErrors(prev => ({ ...prev, amount: "" })); }} onBlur={() => { if (form.amount !== "" && !isPositiveAmount(form.amount)) setErrors(prev => ({ ...prev, amount: "Enter an amount greater than 0." })); }} />
                </Field>
                <Field label="Expense Date" required error={errors.date}>
                  <DateSelectInput value={form.date} onChange={value => { setForm(current => ({ ...current, date: value })); if (errors.date) setErrors(prev => ({ ...prev, date: "" })); }} max={TODAY} />
                </Field>
              </div>
              <Field label="Category">
                <Select value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value, staffMemberName: String(e.target.value).toLowerCase() !== "payroll" ? "" : current.staffMemberName }))}>
                  {categoryOptions.map(category => <option key={category}>{category}</option>)}
                </Select>
              </Field>
              {isFreelancerOrg && String(form.category || "").toLowerCase() === "payroll" && (
                <Field label="Employee">
                  <Select value={form.staffMemberName || ""} onChange={e => setForm(current => ({ ...current, staffMemberName: e.target.value, label: current.label || (e.target.value ? `${e.target.value} Salary` : "") }))}>
                    <option value="">{staffOptions.length ? "Select employee" : "No employees added yet — add in Settings"}</option>
                    {staffOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </Field>
              )}
              {canAttachReceipt && (
                <Field label="Receipt / Bill Photo" hint="Optional. Upload an image under 5 MB.">
                  <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--surface-high)" }}>
                    {form.receiptImageUrl ? (
                      <button type="button" onClick={() => openReceipt(form.receiptImageUrl)} style={{ width: "100%", border: 0, padding: 0, background: "transparent", cursor: "pointer", marginBottom: 10 }}>
                        <img src={form.receiptImageUrl} alt="Expense receipt preview" style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 10, background: "var(--surface)" }} />
                      </button>
                    ) : (
                      <div style={{ minHeight: 104, display: "grid", placeItems: "center", border: "1px dashed var(--border-strong)", borderRadius: 10, color: "var(--text-dim)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        No receipt attached
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <label className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12, cursor: uploadingReceipt ? "not-allowed" : "pointer", opacity: uploadingReceipt ? 0.7 : 1 }}>
                        {uploadingReceipt ? "Uploading..." : form.receiptImageUrl ? "Change Photo" : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingReceipt}
                          onChange={event => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            uploadReceiptImage(file);
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                      {form.receiptImageUrl && (
                        <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={clearReceiptImage} disabled={uploadingReceipt}>
                          Remove
                        </button>
                      )}
                    </div>
                    {form.receiptFileName && <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)", wordBreak: "break-word" }}>{form.receiptFileName}</div>}
                    {receiptError && <div style={{ marginTop: 8, fontSize: 12, color: "var(--danger)", fontWeight: 700 }}>{receiptError}</div>}
                  </div>
                </Field>
              )}
            </div>
            <div className="ledger-form-group compact">
              <div className="ledger-form-group-title">Entry details</div>
              {visibleExpenseFields.map(field => (
              <Field key={field.key} label={field.label} error={field.key === "personName" ? errors.personName : undefined}>
                {isPersonalOrg && field.key === "personName"
                  ? (
                    <Select error={errors.personName} value={form.personName || ""} onChange={e => { setForm(current => ({ ...current, personName: e.target.value, label: current.label || `${e.target.value} ${config.expensesEntryLabel}` })); if (errors.personName) setErrors(prev => ({ ...prev, personName: "" })); }}>
                      <option value="">{peopleOptions.length ? "Select family member" : "Add family members in Settings first"}</option>
                      {peopleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                  )
                  : isFreelancerOrg && field.key === "clientName"
                    ? (
                      <Select value={form.clientName || ""} onChange={e => setForm(current => ({ ...current, clientName: e.target.value }))}>
                        <option value="">{clientOptions.length ? "Select customer (optional)" : "Add customers in Settings first"}</option>
                        {clientOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Select>
                    )
                  : renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
              </Field>
            ))}
            {!isPersonalOrg && (
              <>
                <Field label="Type">
                  <Toggle
                    value={form.recurring ? "recurring" : "once"}
                    onChange={value => setForm(current => ({ ...current, recurring: value === "recurring", endDate: value === "recurring" ? current.endDate : "" }))}
                    options={[
                      { value: "once", label: "One Time" },
                      { value: "recurring", label: "Recurring" }
                    ]}
                  />
                </Field>
                {form.recurring && (
                  <>
                    <div style={{ background: "var(--blue-deep)", border: "1px solid var(--blue)33", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "var(--blue)", marginBottom: 16 }}>
                      This {config.expensesEntryLabel.toLowerCase()} will repeat every month starting from {fmtDate(form.date)}.
                    </div>
                    <Field label="Recurring End Date" hint="Optional. Leave empty if this should continue until you stop it manually." error={errors.endDate}>
                      <DateSelectInput value={form.endDate} onChange={value => { setForm(current => ({ ...current, endDate: value })); if (errors.endDate) setErrors(prev => ({ ...prev, endDate: "" })); }} min={form.date} />
                    </Field>
                  </>
                )}
              </>
            )}
            </div>
          </div>
        </Modal>
      )}

      {!isPersonalOrg && config.enableBudgets !== false && showBudgetForm && (
        <Modal title={`${config.expensesLabel} Budgets`} onClose={() => { setShowBudgetForm(false); setBudgetError(""); }} onSave={saveBudgets} saveLabel="Save" canSave accentColor="var(--danger)">
          {budgetError && <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600, marginBottom: 8 }}>{budgetError}</div>}
          {categoryOptions.map(category => (
            <Field key={category} label={category}>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={budgetDraft[category] || ""} onChange={e => { setBudgetDraft(current => ({ ...current, [category]: e.target.value })); setBudgetError(""); }} />
            </Field>
          ))}
        </Modal>
      )}

      {!isPersonalOrg && <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />}
    </div>
  );
}
