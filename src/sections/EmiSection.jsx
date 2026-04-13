import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, DateSelectInput, DeleteBtn, fmtMoney, fmtDate, MONTHS, SectionSkeleton, EmptyState } from "../components/UI";
import { getOrgConfig, getOrgType, ORG_TYPES } from "../utils/orgTypes";
import { getPersonalEmiAmount, getPersonalEmiDueDay, getPersonalEmiEndDate } from "../utils/analytics";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";

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

function renderField(field, value, onChange, options = {}) {
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

  if (field.type === "date") {
    return <DateSelectInput value={value || ""} onChange={onChange} min={options.min} max={options.max} yearOrder={field.key === "startDate" || field.key === "endDate" ? "asc" : "desc"} />;
  }

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} />;
}

export default function EmiSection({ year, month, orgType, headerDatePicker }) {
  const d = useData();
  const resolvedOrgType = getOrgType(orgType);
  const config = useMemo(() => getOrgConfig(resolvedOrgType), [resolvedOrgType]);
  const emiSection = useMemo(() => (config.extraSections || []).find(section => section.key === "loans") || null, [config]);
  const sym = d.currency?.symbol || "Rs";
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(buildBlankForm(emiSection));
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const openPeopleManager = () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));

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
    setFormError("");
    setShowForm(true);
  }

  function openEdit(record) {
    setEditId(record.id);
    setForm({
      ...buildBlankForm(emiSection),
      ...record,
      monthlyEmi: String(record.monthlyEmi ?? record.emiAmount ?? ""),
      startDate: record.startDate || "",
      dueDay: String(getPersonalEmiDueDay(record) || ""),
      endDate: record.endDate || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setEditId(null);
    setForm(buildBlankForm(emiSection));
    setFormError("");
    setShowForm(false);
  }

  function save() {
    if (!hasMinLength(form.loanName, 2)) {
      setFormError("Enter the EMI or loan name.");
      return;
    }
    if (!hasMinLength(form.lender, 2)) {
      setFormError("Enter the lender name.");
      return;
    }
    if (!isPositiveAmount(form.monthlyEmi)) {
      setFormError("Enter a monthly EMI amount greater than 0.");
      return;
    }
    const dueDay = Number(form.dueDay);
    if (!Number.isFinite(dueDay) || dueDay < 1 || dueDay > 31) {
      setFormError("Choose a valid EMI due date between 1 and 31.");
      return;
    }
    if (!form.endDate || !isValidDateValue(form.endDate)) {
      setFormError("Choose a valid EMI end date.");
      return;
    }
    if (form.startDate && !isValidDateValue(form.startDate)) {
      setFormError("Choose a valid EMI start date or leave it empty.");
      return;
    }
    if (form.startDate && form.startDate > TODAY) {
      setFormError("EMI start date cannot be in the future.");
      return;
    }
    const effectiveStartDate = form.startDate || CURRENT_MONTH_START;
    const minimumEndDate = nextMonthStart(effectiveStartDate);
    if (form.endDate < minimumEndDate) {
      setFormError("EMI end date should start from the next month after the start date.");
      return;
    }
    if (form.endDate < effectiveStartDate) {
      setFormError("End date should be on or after the EMI start date.");
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
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--gold-deep) 0%, var(--bg) 60%)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            EMI Commitments · {MONTHS[month]} {year}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--gold)", letterSpacing: -0.5 }}>{fmtMoney(monthlyEmi, sym)}</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
            {activeLoans.length} active EMI record(s)
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          {headerDatePicker}
          <button className="btn-secondary" onClick={openNew} style={{ alignSelf: "flex-end", marginTop: 0, padding: "10px 14px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
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
            <EmptyState title="Add a person before tracking EMIs" message="Household EMI records are available only after you add at least one person in Org." actionLabel="Open People" onAction={openPeopleManager} accentColor="var(--gold)" />
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
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          {emiSection.fields.map(field => (
            <Field key={field.key} label={field.label} required={Boolean(field.required)}>
              {renderField(
                field,
                form[field.key],
                value => setForm(current => ({ ...current, [field.key]: value })),
                field.key === "startDate"
                  ? { max: TODAY }
                  : field.key === "endDate"
                    ? { min: nextMonthStart(form.startDate || CURRENT_MONTH_START), max: EMI_END_DATE_MAX }
                    : {}
              )}
            </Field>
          ))}
        </Modal>
      )}
    </div>
  );
}
