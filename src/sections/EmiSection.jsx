import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, DateSelectInput, DeleteBtn, fmtMoney, fmtDate, MONTHS, SectionSkeleton, EmptyState } from "../components/UI";
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
    if (!showForm || !form.startDate || !form.endDate) return;
    const minEnd = nextMonthStart(form.startDate);
    if (form.endDate < minEnd) {
      setForm(current => ({ ...current, endDate: "" }));
    }
  }, [form.startDate, showForm]);

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

  function openEdit(record) {
    setEditId(record.id);
    setForm({
      ...buildBlankForm(emiSection),
      ...record,
      monthlyEmi: String(record.monthlyEmi ?? record.emiAmount ?? ""),
      startDate: record.startDate || "",
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

  function save() {
    const nextErrors = {};
    if (!hasMinLength(form.loanName, 2)) nextErrors.loanName = "Enter the EMI or loan name.";
    if (!hasMinLength(form.lender, 2)) nextErrors.lender = "Enter the lender name.";
    if (!isPositiveAmount(form.monthlyEmi)) nextErrors.monthlyEmi = "Enter an amount greater than 0.";
    const dueDay = Number(form.dueDay);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) nextErrors.dueDay = "Enter a day between 1 and 31.";
    if (!form.endDate || !isValidDateValue(form.endDate)) nextErrors.endDate = "Choose a valid end date.";
    if (form.startDate && !isValidDateValue(form.startDate)) {
      nextErrors.startDate = "Choose a valid start date or leave it empty.";
    } else if (form.startDate && form.startDate > TODAY) {
      nextErrors.startDate = "Start date cannot be in the future.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    const effectiveStartDate = form.startDate || CURRENT_MONTH_START;
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
      payload[field.key] = String(form[field.key] || "").trim();
    });
    payload.startDate = payload.startDate || CURRENT_MONTH_START;

    if (editId) d.updateOrgRecord("loans", { ...payload, id: editId });
    else d.addOrgRecord("loans", payload);
    closeForm();
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--gold-deep) 0%, var(--bg) 60%)", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            EMI Commitments · {MONTHS[month]} {year}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--gold)", letterSpacing: -0.5 }}>{fmtMoney(monthlyEmi, sym)}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
            {activeLoans.length} active EMI record(s)
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "flex-end", gap: 10, width: isMobile ? "100%" : "auto", flexShrink: 0 }}>
          <div style={{ width: isMobile ? "100%" : "auto", display: "flex", justifyContent: isMobile ? "stretch" : "flex-end" }}>{headerDatePicker}</div>
          <button className="btn-secondary" onClick={openNew} style={{ alignSelf: isMobile ? "stretch" : "flex-end", marginTop: 0, padding: "10px 14px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", width: isMobile ? "100%" : "auto" }}>
            + Add EMI
          </button>
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ marginBottom: 14 }}>
          <Input
            placeholder="Search EMI by loan, lender, due day, or amount"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="card">
          {!hasHouseholdPeople ? (
            <EmptyState title="Add a person before tracking EMIs" message="Household EMI records are available only after you add at least one person in Khata." actionLabel="Open People" onAction={openPeopleManager} accentColor="var(--gold)" />
          ) : loans.length === 0 ? (
            <EmptyState title="No EMI records yet" message="Add your home loan, vehicle loan, or other EMI commitments here." actionLabel="Add EMI" onAction={openNew} accentColor="var(--gold)" />
          ) : activeLoans.length === 0 ? (
            <EmptyState title={`No active EMIs for ${MONTHS[month]} ${year}`} message="EMIs will only appear in months that fall between their start date and end date." actionLabel="Add EMI" onAction={openNew} accentColor="var(--gold)" />
          ) : filteredLoans.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
              No EMI records match this search.
            </div>
          ) : (
            filteredLoans.map(item => (
              <div key={item.id} className="card-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.loanName || "EMI"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {[
                      item.lender || "",
                      getPersonalEmiDueDay(item) ? `Due on ${getPersonalEmiDueDay(item)}` : "No due date",
                      getPersonalEmiEndDate(item) ? `Ends ${fmtDate(getPersonalEmiEndDate(item))}` : ""
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmtMoney(getPersonalEmiAmount(item), sym)}</span>
                  <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(item)}>Edit</button>
                  <DeleteBtn onDelete={() => d.removeOrgRecord("loans", item.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <Modal title={editId ? "Edit EMI" : "Add EMI"} onClose={closeForm} onSave={save} saveLabel={editId ? "Update" : "Save"} canSave={!!String(form.loanName || "").trim()} accentColor="var(--gold)">
          {emiSection.fields.map(field => {
            const onChange = value => {
              setForm(current => ({ ...current, [field.key]: value }));
              if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" }));
            };
            if (field.key === "personName") {
              return (
                <Field key={field.key} label={field.label} required={Boolean(field.required)} error={errors[field.key]}>
                  <Input
                    list="emi-person-list"
                    value={form.personName || ""}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || "Select family member"}
                    error={errors.personName}
                  />
                  <datalist id="emi-person-list">
                    {peopleOptions.map(name => <option key={name} value={name} />)}
                  </datalist>
                </Field>
              );
            }
            if (field.key === "lender") {
              return (
                <Field key={field.key} label={field.label} required={Boolean(field.required)} error={errors[field.key]}>
                  <Input
                    list="emi-lender-banks"
                    value={form.lender || ""}
                    onChange={e => onChange(e.target.value)}
                    placeholder={field.placeholder || "Bank or person name"}
                    error={errors.lender}
                  />
                  <datalist id="emi-lender-banks">
                    {INDIAN_BANKS.map(bank => <option key={bank} value={bank} />)}
                  </datalist>
                </Field>
              );
            }
            return (
              <Field key={field.key} label={field.label} required={Boolean(field.required)} error={errors[field.key]}>
                {renderField(
                  field,
                  form[field.key],
                  onChange,
                  field.key === "startDate"
                    ? { max: TODAY }
                    : field.key === "endDate"
                      ? { min: nextMonthStart(form.startDate || CURRENT_MONTH_START), max: EMI_END_DATE_MAX }
                      : {},
                  errors[field.key]
                )}
              </Field>
            );
          })}
        </Modal>
      )}
    </div>
  );
}
