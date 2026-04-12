import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
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
  SectionSkeleton
} from "../components/UI";
import { getFinancialInvoices, getInvoiceStatus, getPersonalMemberOptions, invoiceGrandTotal } from "../utils/analytics";
import { hasMinLength, isFutureDateValue, isFutureMonthValue, isPositiveAmount, isValidDateValue } from "../utils/validator";
import { ORG_TYPES, getOrgConfig, getOrgType } from "../utils/orgTypes";

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = TODAY.slice(0, 7);

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

export default function IncomeSection({ year, month, orgType }) {
  const d = useData();
  const config = useMemo(() => getOrgConfig(orgType), [orgType]);
  const isApartmentOrg = getOrgType(orgType) === ORG_TYPES.APARTMENT;
  const isPersonalOrg = getOrgType(orgType) === ORG_TYPES.PERSONAL;
  const isSmallBusinessOrg = getOrgType(orgType) === ORG_TYPES.SMALL_BUSINESS;
  const isRetailOrg = getOrgType(orgType) === ORG_TYPES.RETAIL;
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
  const openPeopleManager = () => window.dispatchEvent(new CustomEvent("ledger:navigate", { detail: { tab: "org", screen: "customers" } }));
  const openFlatManager = openPeopleManager;

  const invIncome = config.hideInvoices || isApartmentOrg
    ? []
    : getFinancialInvoices(d.invoices).filter(invoice => getInvoiceStatus(invoice) === "paid" && invoice.paidDate?.slice(0, 7) === mk);
  const manualIncome = d.income.filter(item => {
    if (isApartmentOrg) {
      return (item.collectionMonth || item.month || item.date?.slice(0, 7)) === mk;
    }
    return item.month === mk;
  });
  const totalInv = invIncome.reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0);
  const totalManual = manualIncome.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalIncome = totalInv + totalManual;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInvIncome = invIncome.filter(invoice => {
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
  });
  const filteredManualIncome = manualIncome.filter(item => {
    if (!normalizedSearch) return true;
    const manualSearch = [
      item.label,
      item.note,
      item.date,
      String(item.amount || ""),
      ...(config.incomeFields || []).map(field => item[field.key])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return manualSearch.includes(normalizedSearch);
  });
  const apartmentFlats = useMemo(() => (
    (d.customers || []).map(flat => ({
      value: flat.name || "",
      label: [flat.name, flat.ownerName || "", societyName].filter(Boolean).join(" - "),
      ownerName: flat.ownerName || "",
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
  const serviceOptions = useMemo(() => (
    (d.orgRecords?.services || []).map(service => ({
      value: service.serviceName || "",
      label: [service.serviceName || "", service.packageName || "", service.defaultAmount ? `${sym} ${service.defaultAmount}` : ""].filter(Boolean).join(" - ")
    })).filter(option => option.value)
  ), [d.orgRecords, sym]);
  const inventoryOptions = useMemo(() => (
    (d.orgRecords?.inventory || []).map(item => ({
      value: item.productName || "",
      label: [item.productName || "", item.stock ? `${item.stock} in stock` : "", item.price ? `${sym} ${item.price}` : ""].filter(Boolean).join(" - ")
    })).filter(option => option.value)
  ), [d.orgRecords, sym]);

  useEffect(() => {
    if (!isApartmentOrg) return;
    if (typeof window === "undefined") return;
    const savedValue = window.localStorage.getItem(getApartmentMaintenanceKey(d.activeOrgId, mk)) || "";
    setBulkMaintenanceAmount(savedValue);
    setMaintenanceAmountHydrated(true);
  }, [d.activeOrgId, isApartmentOrg, mk]);

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

  if (!d.loaded) {
    return <SectionSkeleton rows={4} />;
  }

  const selectedMonthDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const defaultCollectionDate = selectedMonthDate > TODAY ? TODAY : selectedMonthDate;
  const apartmentCollectionStatus = apartmentFlats.map(flat => {
    const monthlyAmount = Number(bulkMaintenanceAmount || 0);
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
  });
  const activeMaintenanceFlat = useMemo(() => {
    if (!isApartmentOrg) return null;
    const flatNumber = String(form.flatNumber || "").trim();
    const collectionType = String(form.collectionType || "Monthly Maintenance").trim();
    const collectionMonth = String(form.collectionMonth || form.date?.slice(0, 7) || "").trim();
    if (!flatNumber || collectionType !== "Monthly Maintenance" || collectionMonth !== mk) return null;
    return apartmentCollectionStatus.find(flat => String(flat.value || "").trim() === flatNumber) || null;
  }, [apartmentCollectionStatus, form.collectionMonth, form.collectionType, form.date, form.flatNumber, isApartmentOrg, mk]);

  function openNew() {
    if (isApartmentOrg && !hasApartmentFlats) {
      openFlatManager();
      return;
    }
    if (!hasHouseholdPeople) {
      openPeopleManager();
      return;
    }
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
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
    setEditId(income.id);
    setForm(next);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setForm(buildBlankForm(year, month, config));
    setFormError("");
  }

  function save(overrides = {}) {
    const nextForm = { ...form, ...overrides };

    if (isApartmentOrg && !hasApartmentFlats) {
      setFormError("Add at least one resident/flat in Settings before recording a maintenance collection.");
      return;
    }
    if (!hasMinLength(nextForm.label, 2)) {
      setFormError(`Add a clear ${config.incomeEntryLabel.toLowerCase()} description so you can recognize it later.`);
      return;
    }
    if (!isPositiveAmount(nextForm.amount)) {
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
      label: nextForm.label.trim(),
      amount: Number(nextForm.amount),
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

    if (editId) d.updateIncome({ ...payload, id: editId });
    else d.addIncome(payload);

    closeForm();
  }

  function applyMaintenanceAmountToAllFlats() {
    const amount = Number(bulkMaintenanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    setBulkMaintenanceAmount(String(amount));
  }

  function markFlatAsPaid(flat) {
    if (!flat || flat.paidEntry || !(flat.monthlyAmount > 0) || pendingFlatPayments.includes(flat.id)) return;

    setPendingFlatPayments(current => [...current, flat.id]);

    try {
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
    } finally {
      setPendingFlatPayments(current => current.filter(item => item !== flat.id));
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
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--accent-deep) 0%, var(--bg) 60%)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Total {config.incomeLabel} - {MONTHS[month]} {year}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 42, color: "var(--accent)", letterSpacing: -0.5 }}>{fmtMoney(totalIncome, sym)}</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          {isPersonalOrg ? "Track household earnings person by person for the selected month." : `Review all ${config.incomeLabel.toLowerCase()} recorded for this period.`}
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
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, marginBottom: 14 }}>
                  <Input type="number" min="0" step="0.01" placeholder="Monthly amount for all flats" value={bulkMaintenanceAmount} onChange={event => setBulkMaintenanceAmount(event.target.value)} />
                  <button className="btn-secondary" style={{ whiteSpace: "nowrap" }} onClick={applyMaintenanceAmountToAllFlats} disabled={!(Number(bulkMaintenanceAmount) > 0)}>
                    Apply to All Flats
                  </button>
                </div>
                <div className="card" style={{ marginBottom: 0 }}>
                  {apartmentCollectionStatus.map(flat => (
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
                    {item.note ? ` - ${item.note}` : ""}
                    {(config.incomeFields || []).map(field => item[field.key] ? ` - ${item[field.key]}` : "").join("")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(item.amount, sym)}</span>
                  <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={() => openEdit(item)}>Edit</button>
                  <DeleteBtn onDelete={() => d.removeIncome(item.id)} />
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
          <Field label="Description" required>
            <Input placeholder={`e.g. ${config.incomeEntryLabel}`} value={form.label} onChange={e => setForm(current => ({ ...current, label: e.target.value }))} />
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
              ) : isSmallBusinessOrg && field.key === "serviceName" ? (
                <Select value={form.serviceName || ""} onChange={event => setForm(current => ({ ...current, serviceName: event.target.value, label: current.label || event.target.value }))}>
                  <option value="">{serviceOptions.length ? "Select service" : "Add services in Settings first"}</option>
                  {serviceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              ) : isRetailOrg && field.key === "productName" ? (
                <Select value={form.productName || ""} onChange={event => setForm(current => ({ ...current, productName: event.target.value, label: current.label || `${event.target.value} Sale` }))}>
                  <option value="">{inventoryOptions.length ? "Select product" : "Add inventory in Settings first"}</option>
                  {inventoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              ) : renderDynamicField(field, form[field.key], value => setForm(current => ({ ...current, [field.key]: value })))}
            </Field>
          ))}
          <Field label="Note">
            <Input placeholder="Optional note" value={form.note} onChange={e => setForm(current => ({ ...current, note: e.target.value }))} />
          </Field>
        </Modal>
      )}

      <div style={{ position: "fixed", right: 20, bottom: 100, zIndex: 40 }}>
        <button
          className="btn-primary"
          style={{ minWidth: 132, boxShadow: "var(--card-shadow)" }}
          onClick={openNew}
        >
          {config.incomeActionLabel}
        </button>
      </div>
    </div>
  );
}
