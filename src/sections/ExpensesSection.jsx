import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import {
  Modal,
  Field,
  Input,
  Textarea,
  Select,
  Toggle,
  FAB,
  DeleteBtn,
  fmtMoney,
  fmtDate,
  monthKey,
  MONTHS,
  ProgressBar,
  EmptyState,
  SectionSkeleton,
  UpgradeModal
} from "../components/UI";
import Collapsible from "../components/Collapsible";
import { calculateDashboard } from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { useAuth } from "../context/AuthContext";
import { canUseFeature, getUpgradeCopy } from "../utils/subscription";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";

const DEFAULT_EXPENSE_CATEGORIES = ["Operations", "Tools", "Marketing", "Payroll", "Utilities", "Travel", "Other"];
const TODAY = new Date().toISOString().slice(0, 10);

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
    partnerName: ""
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

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} max={field.type === "date" ? TODAY : undefined} step={field.type === "number" ? "0.01" : undefined} />;
}

export default function ExpensesSection({ year, month, orgType }) {
  const d = useData();
  const { user } = useAuth();
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const isApartmentOrg = getOrgType(orgType) === ORG_TYPES.APARTMENT;
  const isPersonalOrg = getOrgType(orgType) === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = getOrgType(orgType) === ORG_TYPES.SMALL_BUSINESS;
  const isRetailOrg = getOrgType(orgType) === ORG_TYPES.RETAIL;
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
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [form, setForm] = useState(buildBlankForm(year, month, config, categoryOptions));
  const [budgetDraft, setBudgetDraft] = useState(() =>
    categoryOptions.reduce((map, category) => ({ ...map, [category]: String(d.budgets?.[category] || "") }), {})
  );
  const peopleOptions = useMemo(() => (
    (d.customers || []).map(person => ({ value: person.name || "", label: [person.name || "", person.phone || person.email || ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.customers]);
  const teamOptions = useMemo(() => (
    (d.orgRecords?.team || []).map(member => ({ value: member.name || "", label: [member.name || "", member.role || "", member.payout ? `${sym} ${member.payout}` : ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.orgRecords, sym]);
  const partnerOptions = useMemo(() => (
    (d.orgRecords?.partners || []).map(partner => ({ value: partner.partnerName || "", label: [partner.partnerName || "", partner.contact || "", partner.balanceDue ? `${sym} ${partner.balanceDue}` : ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.orgRecords, sym]);
  const supplierOptions = useMemo(() => (
    (d.orgRecords?.suppliers || []).map(supplier => ({ value: supplier.supplierName || "", label: [supplier.supplierName || "", supplier.contact || "", supplier.creditBalance ? `${sym} ${supplier.creditBalance}` : ""].filter(Boolean).join(" - ") })).filter(option => option.value)
  ), [d.orgRecords, sym]);

  const active = d.expenses.filter(expense => {
    if (!expense.recurring) return expense.month === mk;
    const started = expense.startMonth <= mk;
    const notEnded = !expense.endMonth || expense.endMonth >= mk;
    return started && notEnded;
  });
  const total = active.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const recurring = active.filter(expense => expense.recurring);
  const oneTime = active.filter(expense => !expense.recurring);
  const salaryExpenses = active.filter(expense => String(expense.expenseType || "").trim() === "Team Payout");
  const partnerExpenses = active.filter(expense => String(expense.expenseType || "").trim() === "Partner Payment");
  const stockExpenses = active.filter(expense => String(expense.purchaseType || "").trim() === "Stock Purchase");
  const supplierPaymentExpenses = active.filter(expense => String(expense.purchaseType || "").trim() === "Supplier Payment");
  const otherExpenses = active.filter(expense => !["Team Payout", "Partner Payment"].includes(String(expense.expenseType || "").trim()));
  const retailOtherExpenses = active.filter(expense => !["Stock Purchase", "Supplier Payment"].includes(String(expense.purchaseType || "").trim()));
  const stats = calculateDashboard(d, year, month);

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  const budgetCards = useMemo(
    () =>
      stats.budgetStatus.map(item => ({
        ...item,
        tone: item.progress >= 100 ? "var(--danger)" : item.progress >= 80 ? "var(--gold)" : "var(--accent)"
      })),
    [stats.budgetStatus]
  );

  function openNew() {
    setEditId(null);
    setForm(buildBlankForm(year, month, config, categoryOptions));
    setFormError("");
    setShowForm(true);
  }

  function openBudgetEditor() {
    if (!canUseFeature(user, "budgets")) {
      setUpgradeInfo(getUpgradeCopy("budgets"));
      return;
    }
    setBudgetDraft(categoryOptions.reduce((map, category) => ({ ...map, [category]: String(d.budgets?.[category] || "") }), {}));
    setShowBudgetForm(true);
  }

  function openEdit(expense) {
    const next = buildBlankForm(year, month, config, categoryOptions);
    next.label = expense.label || "";
    next.amount = String(expense.amount ?? "");
    next.category = expense.category || categoryOptions[0] || DEFAULT_EXPENSE_CATEGORIES[0];
    next.recurring = Boolean(expense.recurring);
    next.date = expense.date || next.date;
    next.endDate = expense.endDate || "";
    next.note = expense.note || "";
    next.teamMemberName = expense.teamMemberName || "";
    next.partnerName = expense.partnerName || "";
    (config.expenseFields || []).forEach(field => {
      next[field.key] = expense[field.key] || (field.type === "select" ? field.options?.[0] || "" : "");
    });
    setEditId(expense.id);
    setForm(next);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setEditId(null);
    setShowForm(false);
    setFormError("");
    setForm(buildBlankForm(year, month, config, categoryOptions));
  }

  function saveBudgets() {
    const invalidBudget = categoryOptions.find(category => {
      const raw = budgetDraft[category];
      if (raw === "" || raw == null) return false;
      const amount = Number(raw);
      return !Number.isFinite(amount) || amount < 0;
    });

    if (invalidBudget) {
      alert(`Please enter a valid budget amount for ${invalidBudget}.`);
      return;
    }

    const nextBudgets = categoryOptions.reduce((map, category) => {
      const amount = Number(budgetDraft[category]) || 0;
      if (amount > 0) map[category] = amount;
      return map;
    }, {});
    d.saveBudgets(nextBudgets);
    setShowBudgetForm(false);
  }

  function validateForm() {
    if (!hasMinLength(form.label, 2)) {
      return `Add a short ${config.expensesEntryLabel.toLowerCase()} title so it is easy to identify later.`;
    }
    if (!isPositiveAmount(form.amount)) {
      return "Enter an amount greater than 0.";
    }
    if (isPersonalOrg && !String(form.personName || "").trim()) {
      return "Select a household person before saving this spending entry.";
    }
    if (!isValidDateValue(form.date)) {
      return `Choose the ${config.expensesEntryLabel.toLowerCase()} date.`;
    }
    if (isFutureDateValue(form.date)) {
      return "Future dates are not allowed for records.";
    }
    if (form.recurring && form.endDate && !isValidDateValue(form.endDate)) {
      return "Choose a valid recurring end date or leave it empty.";
    }
    if (form.recurring && form.endDate && isFutureDateValue(form.endDate)) {
      return "Future dates are not allowed for records.";
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
      recurring: form.recurring,
      teamMemberName: String(form.teamMemberName || "").trim(),
      partnerName: String(form.partnerName || "").trim()
    };

    (config.expenseFields || []).forEach(field => {
      payload[field.key] = String(form[field.key] || "").trim();
    });

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

  function expenseMeta(expense) {
    const extras = (config.expenseFields || [])
      .map(field => expense[field.key])
      .filter(Boolean)
      .join(" - ");
    const bits = [
      expense.category,
      expense.date ? fmtDate(expense.date) : "",
      expense.recurring && expense.endDate ? `ends ${fmtDate(expense.endDate)}` : "",
      expense.teamMemberName || "",
      expense.partnerName || "",
      extras,
      expense.note || ""
    ].filter(Boolean);
    return bits.join(" - ");
  }

  const ExpenseRow = ({ expense }) => (
    <div className="card-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{expense.label}</span>
          {expense.recurring && <span className="pill" style={{ background: "var(--blue-deep)", color: "var(--blue)" }}>Recurring</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{expenseMeta(expense)}</div>
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
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Total {config.expensesLabel} - {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--danger)", letterSpacing: -0.5 }}>{fmtMoney(total, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {config.enableBudgets === false ? "Track all society bills, utilities, and repairs here." : `${budgetCards.filter(item => item.progress >= 100).length} budget(s) exceeded this month`}
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        {config.enableBudgets !== false && (
          <>
            <div className="section-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Category Budgets</span>
              <button className="btn-secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={openBudgetEditor}>Set Budgets</button>
            </div>
            <div className="card" style={{ marginBottom: 22 }}>
              {budgetCards.length === 0 ? (
                <EmptyState title="No budgets set yet" message="Create category budgets to spot overspending before it hurts your month." actionLabel="Set Budgets" onAction={openBudgetEditor} accentColor="var(--danger)" />
              ) : (
                budgetCards.map(item => (
                  <div key={item.category} className="card-row" style={{ alignItems: "stretch", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.category}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 3 }}>
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

        {isSmallBusinessOrg ? (
          <>
            <Collapsible title="Salaries & Team Payouts" icon="👥" color="var(--purple)" count={salaryExpenses.length} defaultOpen>
              <div className="card">
                {salaryExpenses.length === 0 ? (
                  <EmptyState title="No team payouts yet" message="Record salary or payout entries here to keep monthly payroll visible." actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--purple)" />
                ) : (
                  salaryExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>

            <Collapsible title="Partner & Vendor Payments" icon="🏷" color="var(--gold)" count={partnerExpenses.length} defaultOpen={partnerExpenses.length > 0}>
              <div className="card">
                {partnerExpenses.length === 0 ? (
                  <EmptyState title="No partner payments yet" message="Track amounts due to outside partners, vendors, venues, or freelancers here." actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--gold)" />
                ) : (
                  partnerExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>

            <Collapsible title="Operating Expenses" icon="•" color="var(--danger)" count={otherExpenses.length} defaultOpen>
              <div className="card">
                {otherExpenses.length === 0 ? (
                  <EmptyState title={`No ${config.expensesLabel.toLowerCase()} yet`} message={`Add your first ${config.expensesEntryLabel.toLowerCase()} to keep this month accurate.`} actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--danger)" />
                ) : (
                  otherExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>
          </>
        ) : isRetailOrg ? (
          <>
            <Collapsible title="Stock Purchases" icon="📦" color="var(--blue)" count={stockExpenses.length} defaultOpen>
              <div className="card">
                {stockExpenses.length === 0 ? (
                  <EmptyState title="No stock purchases yet" message="Track stock buying here so the month reflects how much inventory you brought into the shop." actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--blue)" />
                ) : (
                  stockExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>

            <Collapsible title="Supplier Payments" icon="🏷" color="var(--gold)" count={supplierPaymentExpenses.length} defaultOpen={supplierPaymentExpenses.length > 0}>
              <div className="card">
                {supplierPaymentExpenses.length === 0 ? (
                  <EmptyState title="No supplier payments yet" message="Log direct supplier settlements here to keep payables clear." actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--gold)" />
                ) : (
                  supplierPaymentExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>

            <Collapsible title="Shop Running Costs" icon="•" color="var(--danger)" count={retailOtherExpenses.length} defaultOpen>
              <div className="card">
                {retailOtherExpenses.length === 0 ? (
                  <EmptyState title={`No ${config.expensesLabel.toLowerCase()} yet`} message={`Add your first ${config.expensesEntryLabel.toLowerCase()} to keep this month accurate.`} actionLabel={config.expensesActionLabel} onAction={openNew} accentColor="var(--danger)" />
                ) : (
                  retailOtherExpenses.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
                )}
              </div>
            </Collapsible>
          </>
        ) : recurring.length > 0 && (
          <Collapsible title={`Recurring ${config.expensesLabel}`} icon="↻" color="var(--danger)" count={recurring.length} defaultOpen>
            <div className="card">{recurring.map(expense => <ExpenseRow key={expense.id} expense={expense} />)}</div>
          </Collapsible>
        )}

        {!isSmallBusinessOrg && !isRetailOrg && <Collapsible title={`One-Time ${config.expensesLabel}`} icon="•" color="var(--danger)" count={oneTime.length} defaultOpen={oneTime.length > 0}>
          <div className="card">
            {oneTime.length === 0 ? (
              <EmptyState
                title={`No ${config.expensesLabel.toLowerCase()} yet`}
                message={`Add your first ${config.expensesEntryLabel.toLowerCase()} to keep this month accurate.`}
                actionLabel={config.expensesActionLabel}
                onAction={openNew}
                accentColor="var(--danger)"
              />
            ) : (
              oneTime.map(expense => <ExpenseRow key={expense.id} expense={expense} />)
            )}
          </div>
        </Collapsible>}
      </div>

      <FAB bg="var(--danger)" shadow="rgba(255,110,110,0.35)" onClick={openNew} />

      {showForm && (
        <Modal
          title={editId ? `Edit ${config.expensesEntryLabel}` : config.expensesActionLabel}
          onClose={closeForm}
          onSave={save}
          saveLabel={editId ? "Update" : "Save"}
          canSave={!!form.label.trim() && Number(form.amount) > 0}
          accentColor="var(--danger)"
        >
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}

          <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
            <Field label="Description" required>
              <Input placeholder={`e.g. ${config.expensesEntryLabel}`} value={form.label} onChange={e => setForm(current => ({ ...current, label: e.target.value }))} />
            </Field>
            <Field label={`Amount (${sym})`} required hint={`Enter how much you spent for this ${config.expensesEntryLabel.toLowerCase()}.`}>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(current => ({ ...current, amount: e.target.value }))} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm(current => ({ ...current, category: e.target.value }))}>
                {categoryOptions.map(category => <option key={category}>{category}</option>)}
              </Select>
            </Field>
            <Field label="Expense Date" required>
              <Input type="date" max={TODAY} value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} />
            </Field>
            {(config.expenseFields || []).map(field => (
              <Field key={field.key} label={field.label}>
                {isPersonalOrg && field.key === "personName"
                  ? (
                    <Select value={form.personName || ""} onChange={e => setForm(current => ({ ...current, personName: e.target.value, label: current.label || `${e.target.value} ${config.expensesEntryLabel}` }))}>
                      <option value="">{peopleOptions.length ? "Select person" : "Add people in Settings first"}</option>
                      {peopleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                  )
                  : isSmallBusinessOrg && field.key === "expenseType"
                    ? (
                      <Select value={form.expenseType || ""} onChange={e => setForm(current => ({ ...current, expenseType: e.target.value, teamMemberName: e.target.value === "Team Payout" ? current.teamMemberName : "", partnerName: e.target.value === "Partner Payment" ? current.partnerName : "", label: current.label || e.target.value }))}>
                        {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    )
                  : isRetailOrg && field.key === "purchaseType"
                    ? (
                      <Select value={form.purchaseType || ""} onChange={e => setForm(current => ({ ...current, purchaseType: e.target.value, supplierName: ["Stock Purchase", "Supplier Payment"].includes(e.target.value) ? current.supplierName : "", label: current.label || e.target.value }))}>
                        {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
                      </Select>
                    )
                  : renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
              </Field>
            ))}
            {isSmallBusinessOrg && form.expenseType === "Team Payout" && (
              <Field label="Team Member">
                <Select value={form.teamMemberName || ""} onChange={e => setForm(current => ({ ...current, teamMemberName: e.target.value, label: current.label || `${e.target.value} Payout` }))}>
                  <option value="">{teamOptions.length ? "Select team member" : "Add team members in Settings first"}</option>
                  {teamOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            )}
            {isSmallBusinessOrg && form.expenseType === "Partner Payment" && (
              <Field label="Partner / Vendor">
                <Select value={form.partnerName || ""} onChange={e => setForm(current => ({ ...current, partnerName: e.target.value, label: current.label || `${e.target.value} Payment` }))}>
                  <option value="">{partnerOptions.length ? "Select partner" : "Add partners in Settings first"}</option>
                  {partnerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            )}
            {isRetailOrg && ["Stock Purchase", "Supplier Payment"].includes(form.purchaseType || "") && (
              <Field label="Supplier">
                <Select value={form.supplierName || ""} onChange={e => setForm(current => ({ ...current, supplierName: e.target.value, label: current.label || `${e.target.value} ${form.purchaseType === "Supplier Payment" ? "Payment" : "Purchase"}` }))}>
                  <option value="">{supplierOptions.length ? "Select supplier" : "Add suppliers in Settings first"}</option>
                  {supplierOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </Field>
            )}
          </div>

          <div className="card" style={{ padding: "16px", marginBottom: 16 }}>
            <Field label="Type">
              <Toggle
                value={form.recurring ? "recurring" : "once"}
                onChange={value => setForm(current => ({ ...current, recurring: value === "recurring", endDate: value === "recurring" ? current.endDate : "" }))}
                options={[{ value: "once", label: "One-Time" }, { value: "recurring", label: "Recurring Monthly" }]}
              />
            </Field>
            {form.recurring && (
              <>
                <div style={{ background: "var(--blue-deep)", border: "1px solid var(--blue)33", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "var(--blue)", marginBottom: 16 }}>
                  This {config.expensesEntryLabel.toLowerCase()} will repeat every month starting from {fmtDate(form.date)}.
                </div>
                <Field label="Recurring End Date" hint="Optional. Leave empty if this should continue until you stop it manually.">
                  <Input type="date" value={form.endDate} min={form.date} max={TODAY} onChange={e => setForm(current => ({ ...current, endDate: e.target.value }))} />
                </Field>
              </>
            )}
            <Field label="Note">
              <Input placeholder="Optional note" value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
            </Field>
          </div>
        </Modal>
      )}

      {config.enableBudgets !== false && showBudgetForm && (
        <Modal title={`${config.expensesLabel} Budgets`} onClose={() => setShowBudgetForm(false)} onSave={saveBudgets} saveLabel="Save" canSave accentColor="var(--danger)">
          {categoryOptions.map(category => (
            <Field key={category} label={category}>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={budgetDraft[category] || ""} onChange={e => setBudgetDraft(current => ({ ...current, [category]: e.target.value }))} />
            </Field>
          ))}
        </Modal>
      )}

      <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
    </div>
  );
}
