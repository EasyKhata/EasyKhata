import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, DateSelectInput, fmtMoney, fmtDate, MONTHS, SectionSkeleton, WorkflowActionStrip, WorkflowRecordCard, WorkflowSetupCard } from "../components/UI";
import { getOrgConfig, getOrgType, ORG_TYPES } from "../utils/orgTypes";
import { getPersonalEmiAmount, getPersonalEmiDueDay, getPersonalEmiEndDate } from "../utils/analytics";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";

const INDIAN_BANKS = [
  "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Bank of India", "IndusInd Bank", "Yes Bank", "IDFC First Bank", "Federal Bank",
  "South Indian Bank", "Karnataka Bank", "Karur Vysya Bank", "City Union Bank",
  "Tamilnad Mercantile Bank", "Dhanlaxmi Bank", "Bandhan Bank", "RBL Bank",
  "UCO Bank", "Indian Bank", "Central Bank of India", "Bank of Maharashtra",
  "Punjab & Sind Bank", "Indian Overseas Bank", "Bajaj Finserv", "Tata Capital",
  "Mahindra Finance", "Muthoot Finance", "LIC Housing Finance", "PNB Housing Finance",
  "HDFC Ltd", "Aditya Birla Finance", "L&T Finance", "Shriram Finance"
];

const TODAY = new Date().toISOString().slice(0, 10);
const EMI_END_DATE_MAX = `${new Date().getFullYear() + 50}-12-31`;
const CURRENT_MONTH_START = `${TODAY.slice(0, 7)}-01`;

function nextMonthStart(dateValue = CURRENT_MONTH_START) {
  const [yearPart, monthPart] = String(dateValue || CURRENT_MONTH_START).split("-");
  const nextDate = new Date(Number(yearPart), Number(monthPart), 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-01`;
}

function startOfMonthValue(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function endOfMonthValue(year, month) {
  const lastDay = new Date(year, month + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
}

function getLoanStartDate(item) {
  return String(item?.startDate || CURRENT_MONTH_START);
}

function buildBlankForm(section) {
  const base = section?.empty?.() || {};
  (section?.fields || []).forEach(field => {
    if (base[field.key] == null) {
      base[field.key] = field.type === "select" ? field.options?.[0] || "" : "";
    }
  });
  return base;
}

function getPeopleOptions(customers) {
  return (customers || []).filter(c => String(c?.name || "").trim()).map(c => String(c.name).trim());
}

function renderField(field, value, onChange, options = {}, error = undefined) {
  const commonProps = {
    value: value || "",
    onChange: event => onChange(event.target.value),
    placeholder: field.placeholder || ""
  };

  if (field.type === "select") {
    return (
      <Select error={error} {...commonProps}>
        {(field.options || []).map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "date") {
    return <DateSelectInput value={value || ""} onChange={onChange} min={options.min} max={options.max} yearOrder={field.key === "startDate" || field.key === "endDate" ? "asc" : "desc"} />;
  }

  return <Input error={error} {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} />;
}

function EmiCard({ item, sym, onEdit, onDelete }) {
  return (
    <WorkflowRecordCard
      title={item.loanName || "EMI"}
      subtitle={[
        item.lender || "",
        getPersonalEmiDueDay(item) ? `Due on ${getPersonalEmiDueDay(item)}` : "No due date",
        getPersonalEmiEndDate(item) ? `Ends ${fmtDate(getPersonalEmiEndDate(item))}` : ""
      ].filter(Boolean).join(" · ")}
      amount={fmtMoney(getPersonalEmiAmount(item), sym)}
      amountTone="gold"
      actions={[
        { label: "Edit", tone: "secondary", onClick: () => onEdit(item) },
        { label: "Delete", tone: "danger", onClick: () => onDelete(item.id) }
      ]}
    />
  );
}

export default function EmiSection({ year, month, orgType, headerDatePicker }) {
  const d = useData();
  const resolvedOrgType = getOrgType(orgType);
  const config = useMemo(() => getOrgConfig(resolvedOrgType), [resolvedOrgType]);
  const emiSection = useMemo(() => (config.extraSections || []).find(section => section.key === "loans") || null, [config]);
  const sym = d.currency?.symbol || "Rs";
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 768 : false));
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(buildBlankForm(emiSection));
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const openPeopleManager = () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!showForm || !form.endDate) return;
    const minEnd = nextMonthStart(CURRENT_MONTH_START);
    if (form.endDate < minEnd) {
      setForm(current => ({ ...current, endDate: "" }));
    }
  }, [form.endDate, showForm]);

  const peopleOptions = useMemo(() => getPeopleOptions(d.customers), [d.customers]);
  const loans = (d.orgRecords?.loans || []).slice().sort((a, b) => getPersonalEmiDueDay(a) - getPersonalEmiDueDay(b));
  const peopleCount = (d.customers || []).filter(person => String(person?.name || "").trim()).length;
  const hasHouseholdPeople = peopleCount > 0;
  const viewStart = startOfMonthValue(year, month);
  const viewEnd = endOfMonthValue(year, month);
  const activeLoans = loans.filter(item => {
    const startDate = getLoanStartDate(item);
    const endDate = getPersonalEmiEndDate(item);
    return (!startDate || startDate <= viewEnd) && (!endDate || endDate >= viewStart);
  });
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredLoans = activeLoans.filter(item => {
    if (!normalizedSearch) return true;
    const searchFields = [
      item.loanName,
      item.lender,
      String(getPersonalEmiDueDay(item) || ""),
      getPersonalEmiEndDate(item),
      String(getPersonalEmiAmount(item) || "")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchFields.includes(normalizedSearch);
  });
  const monthlyEmi = activeLoans.reduce((sum, item) => sum + getPersonalEmiAmount(item), 0);

  if (resolvedOrgType !== ORG_TYPES.PERSONAL || !emiSection) {
    return null;
  }

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
    if (!hasHouseholdPeople) {
      openPeopleManager();
      return;
    }
    setEditId(null);
    setForm(buildBlankForm(emiSection));
    setErrors({});
    setShowForm(true);
  }

  useEffect(() => {
    function handleOpenAdd(event) {
      if (event?.detail?.section && event.detail.section !== "emi") return;
      openNew();
    }
    window.addEventListener("ledger:open-add", handleOpenAdd);
    return () => window.removeEventListener("ledger:open-add", handleOpenAdd);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(record) {
    setEditId(record.id);
    setForm({
      ...buildBlankForm(emiSection),
      ...record,
      monthlyEmi: String(record.monthlyEmi ?? record.emiAmount ?? ""),
      dueDay: String(getPersonalEmiDueDay(record) || "1"),
      endDate: record.endDate || ""
    });
    setErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setEditId(null);
    setForm(buildBlankForm(emiSection));
    setErrors({});
    setShowForm(false);
  }

  function updateField(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  }

  function save() {
    const nextErrors = {};
    if (!hasMinLength(form.loanName, 2)) nextErrors.loanName = "Enter the EMI or loan name.";
    if (!hasMinLength(form.lender, 2)) nextErrors.lender = "Enter the lender name.";
    if (!isPositiveAmount(form.monthlyEmi)) nextErrors.monthlyEmi = "Enter an amount greater than 0.";
    const dueDay = Number(form.dueDay);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) nextErrors.dueDay = "Enter a day between 1 and 31.";
    if (!form.endDate || !isValidDateValue(form.endDate)) nextErrors.endDate = "Choose a valid end date.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const effectiveStartDate = CURRENT_MONTH_START;
    const minimumEndDate = nextMonthStart(effectiveStartDate);
    if (form.endDate < minimumEndDate) {
      setErrors({ endDate: "End date must start from the month after the start date." });
      return;
    }
    if (form.endDate < effectiveStartDate) {
      setErrors({ endDate: "End date must be on or after the start date." });
      return;
    }

    const payload = {};
    emiSection.fields.forEach(field => {
      if (field.key === "startDate") return;
      payload[field.key] = String(form[field.key] || "").trim();
    });
    payload.startDate = CURRENT_MONTH_START;

    if (editId) d.updateOrgRecord("loans", { ...payload, id: editId });
    else d.addOrgRecord("loans", payload);
    closeForm();
  }

  return (
    <div className="ledger-screen">
      <WorkflowActionStrip
        title="Track home loan, vehicle loan, and other monthly EMI commitments."
        actions={[]}
      />
      <div className="card" style={{ padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid var(--gold)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
              EMI Commitments · {MONTHS[month]} {year}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)" }}>{fmtMoney(monthlyEmi, sym)}</div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 3 }}>
              {activeLoans.length
                ? `${activeLoans.length} active EMI ${activeLoans.length === 1 ? "entry" : "entries"} this month`
                : "No active EMIs this month"}
            </div>
          </div>
          {headerDatePicker && <div>{headerDatePicker}</div>}
        </div>
      </div>

      <div className="ledger-block">
        <div className="card ledger-search-card">
          <Input
            placeholder="Search EMI by loan, lender, due day, or amount"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
            Review due dates, lenders, and monthly commitments without scrolling through oversized cards.
          </div>
        </div>

        <div className="card">
          {!hasHouseholdPeople ? (
            <WorkflowSetupCard title="Add a person before tracking EMIs" description="Household EMI records are available only after you add at least one person in Khata." actionLabel="Open People" onAction={openPeopleManager} tone="warning" />
          ) : loans.length === 0 ? (
            <WorkflowSetupCard title="No EMI records yet" description="Add your home loan, vehicle loan, or other EMI commitments here." actionLabel="Add EMI" onAction={openNew} tone="warning" />
          ) : activeLoans.length === 0 ? (
            <WorkflowSetupCard title={`No active EMIs for ${MONTHS[month]} ${year}`} description="EMIs only appear in months that fall between their start date and end date." actionLabel="Add EMI" onAction={openNew} tone="warning" />
          ) : filteredLoans.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
              No EMI records match this search.
            </div>
          ) : (
            filteredLoans.map(item => (
              <EmiCard key={item.id} item={item} sym={sym} onEdit={openEdit} onDelete={id => d.removeOrgRecord("loans", id)} />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <Modal title={editId ? "Edit EMI" : "Add EMI"} onClose={closeForm} onSave={save} saveLabel={editId ? "Update" : "Save"} canSave={!!String(form.loanName || "").trim()} accentColor="var(--gold)">
          <div className="ledger-form-grid">
            <div className="ledger-form-group">
              <div className="ledger-form-group-title">Primary details</div>
              <Field label="Loan / EMI Name" required error={errors.loanName}>
                <Input value={form.loanName || ""} onChange={e => updateField("loanName", e.target.value)} placeholder="Home loan" error={errors.loanName} />
              </Field>
              <Field label="Lender" required error={errors.lender}>
                <Input list="emi-lender-banks" value={form.lender || ""} onChange={e => updateField("lender", e.target.value)} placeholder="Bank or person name" error={errors.lender} />
                <datalist id="emi-lender-banks">
                  {INDIAN_BANKS.map(bank => <option key={bank} value={bank} />)}
                </datalist>
              </Field>
              <Field label={`Monthly EMI (${sym})`} required error={errors.monthlyEmi}>
                <Input type="number" min="0" step="0.01" value={form.monthlyEmi || ""} onChange={e => updateField("monthlyEmi", e.target.value)} placeholder="0.00" error={errors.monthlyEmi} />
              </Field>
            </div>

            <div className="ledger-form-group compact">
              <div className="ledger-form-group-title">Schedule</div>
              <Field label="Family Member" error={errors.personName}>
                <Select value={form.personName || ""} onChange={e => updateField("personName", e.target.value)} error={errors.personName}>
                  <option value="">Select family member</option>
                  {peopleOptions.map(name => <option key={name} value={name}>{name}</option>)}
                </Select>
              </Field>
              <div className="ledger-form-split">
                <Field label="Due Date" required error={errors.dueDay}>
                  <Select value={form.dueDay || "1"} onChange={e => updateField("dueDay", e.target.value)} error={errors.dueDay}>
                    {Array.from({ length: 31 }, (_, index) => String(index + 1)).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="End Date" required error={errors.endDate}>
                <DateSelectInput value={form.endDate || ""} onChange={value => updateField("endDate", value)} min={nextMonthStart(CURRENT_MONTH_START)} max={EMI_END_DATE_MAX} yearOrder="asc" />
              </Field>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
