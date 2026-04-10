import React, { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { Modal, Field, Input, Select, DateSelectInput, FAB, DeleteBtn, fmtMoney, fmtDate, MONTHS, SectionSkeleton, EmptyState } from "../components/UI";
import { getOrgConfig, getOrgType, ORG_TYPES } from "../utils/orgTypes";
import { getPersonalEmiAmount, getPersonalEmiDueDate, getPersonalEmiEndDate } from "../utils/analytics";
import { hasMinLength, isPositiveAmount, isValidDateValue } from "../utils/validator";

const TODAY = new Date().toISOString().slice(0, 10);

function buildBlankForm(section) {
  const base = section?.empty?.() || {};
  (section?.fields || []).forEach(field => {
    if (base[field.key] == null) {
      base[field.key] = field.type === "select" ? field.options?.[0] || "" : "";
    }
  });
  return base;
}

function renderField(field, value, onChange) {
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
    return <DateSelectInput value={value || ""} onChange={onChange} max={TODAY} />;
  }

  return <Input {...commonProps} type={field.type || "text"} min={field.type === "number" ? "0" : undefined} />;
}

export default function EmiSection({ year, month, orgType }) {
  const d = useData();
  const resolvedOrgType = getOrgType(orgType);
  const config = useMemo(() => getOrgConfig(resolvedOrgType), [resolvedOrgType]);
  const emiSection = useMemo(() => (config.extraSections || []).find(section => section.key === "loans") || null, [config]);
  const sym = d.currency?.symbol || "Rs";
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(buildBlankForm(emiSection));
  const [formError, setFormError] = useState("");

  const loans = (d.orgRecords?.loans || []).slice().sort((a, b) => String(getPersonalEmiDueDate(a) || "").localeCompare(String(getPersonalEmiDueDate(b) || "")));
  const activeLoans = loans.filter(item => String(item.status || "Active").toLowerCase() !== "closed");
  const monthlyEmi = activeLoans.reduce((sum, item) => sum + getPersonalEmiAmount(item), 0);
  const outstanding = activeLoans.reduce((sum, item) => sum + (Number(item.outstandingBalance) || 0), 0);

  if (resolvedOrgType !== ORG_TYPES.PERSONAL || !emiSection) {
    return null;
  }

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  function openNew() {
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
      dueDate: record.dueDate || record.nextDueDate || "",
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
    if (!form.dueDate || !isValidDateValue(form.dueDate)) {
      setFormError("Choose a valid EMI due date.");
      return;
    }
    if (form.endDate && !isValidDateValue(form.endDate)) {
      setFormError("Choose a valid EMI end date or leave it empty.");
      return;
    }
    if (form.endDate && form.endDate < form.dueDate) {
      setFormError("End date should be on or after the EMI due date.");
      return;
    }

    const payload = {};
    emiSection.fields.forEach(field => {
      payload[field.key] = String(form[field.key] || "").trim();
    });

    if (editId) d.updateOrgRecord("loans", { ...payload, id: editId });
    else d.addOrgRecord("loans", payload);
    closeForm();
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--gold-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          EMI Commitments · {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--gold)", letterSpacing: -0.5 }}>{fmtMoney(monthlyEmi, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {activeLoans.length} active EMI record(s) · Outstanding {fmtMoney(outstanding, sym)}
        </div>
      </div>

      <div style={{ padding: "22px 18px 0" }}>
        <div className="card">
          {loans.length === 0 ? (
            <EmptyState title="No EMI records yet" message="Add your home loan, vehicle loan, or other EMI commitments here." actionLabel="Add EMI" onAction={openNew} accentColor="var(--gold)" />
          ) : (
            loans.map(item => (
              <div key={item.id} className="card-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{item.loanName || "EMI"}</span>
                    <span className="pill" style={{ background: String(item.status || "Active").toLowerCase() === "closed" ? "var(--surface-high)" : "var(--gold-deep)", color: String(item.status || "Active").toLowerCase() === "closed" ? "var(--text-sec)" : "var(--gold)" }}>{item.status || "Active"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {[
                      item.lender || "",
                      getPersonalEmiDueDate(item) ? `Due ${fmtDate(getPersonalEmiDueDate(item))}` : "No due date",
                      getPersonalEmiEndDate(item) ? `Ends ${fmtDate(getPersonalEmiEndDate(item))}` : "",
                      item.interestRate ? `${item.interestRate}% interest` : "",
                      item.outstandingBalance ? `Outstanding ${fmtMoney(item.outstandingBalance, sym)}` : ""
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

      <FAB bg="var(--gold)" shadow="rgba(246,201,78,0.35)" onClick={openNew} />

      {showForm && (
        <Modal title={editId ? "Edit EMI" : "Add EMI"} onClose={closeForm} onSave={save} saveLabel={editId ? "Update" : "Save"} canSave={!!String(form.loanName || "").trim()} accentColor="var(--gold)">
          {formError && (
            <div style={{ background: "var(--danger-deep)", border: "1px solid var(--danger)44", borderRadius: 12, padding: "12px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
              {formError}
            </div>
          )}
          {emiSection.fields.map(field => (
            <Field key={field.key} label={field.label} required={Boolean(field.required)}>
              {renderField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
            </Field>
          ))}
        </Modal>
      )}
    </div>
  );
}
