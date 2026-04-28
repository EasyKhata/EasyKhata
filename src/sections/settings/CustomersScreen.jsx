import React, { useState } from "react";
import { useConfirm } from "../../context/DialogContext";
import {
  Modal, Field, Input, Select, PhoneNumberInput,
  StructuredLocationFields, Avatar, DeleteBtn,
  PaginatedListControls, WorkflowRecordCard, WorkflowSetupCard, fmtMoney
} from "../../components/UI";
import { PHONE_COUNTRY_OPTIONS, DEFAULT_PHONE_COUNTRY_CODE } from "../../utils/profile";

function fmtShortDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmtMonthLabel(mk) {
  if (!mk) return "";
  const [y, m] = mk.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short" });
}

export default function CustomersScreen({
  screen,
  orgConfig,
  currency,
  customerDirectory,
  filteredCustomerDirectory,
  paginatedCustomerDirectory,
  customerSearch,
  onCustomerSearchChange,
  customerPage,
  onCustomerPageChange,
  customerPageSize,
  onCustomerPageSizeChange,
  selectedCustomer,
  selectedCustomerPayments,
  editCust,
  custForm,
  onCustFormChange,
  showPersonContactFields,
  showApartmentWhatsappField,
  showFullCustomerForm,
  renderDynamicField,
  onOpenNewCust,
  onOpenEditCust,
  onOpenDetail,
  onSaveCust,
  onRemoveCustomer,
  onBackToList,
  onClose,
  allExpenses,
  allIncome,
  isApartmentOrg,
  expensesLoaded,
  incomeLoaded,
}) {
  const confirm = useConfirm();
  const sym = currency?.symbol || "Rs";
  const [expandedId, setExpandedId] = useState(null);

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function HouseholdBrief({ customer }) {
    const personName = (customer.name || "").trim().toLowerCase();

    if (!expensesLoaded || !incomeLoaded) {
      return (
        <div style={{ padding: "10px 14px 12px", fontSize: 12, color: "var(--text-dim)" }}>
          Loading…
        </div>
      );
    }

    const personExpenses = personName
      ? (allExpenses || []).filter(e => (e.personName || "").trim().toLowerCase() === personName)
      : [];
    const personIncome = personName
      ? (allIncome || []).filter(i => (i.personName || "").trim().toLowerCase() === personName)
      : [];

    const totalSpent = personExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalIncome = personIncome.reduce((s, i) => s + Number(i.amount || 0), 0);
    const net = totalIncome - totalSpent;

    if (personExpenses.length === 0 && personIncome.length === 0) {
      return (
        <div style={{ padding: "10px 14px 12px", fontSize: 12, color: "var(--text-dim)" }}>
          No entries tagged to {customer.name} yet.
        </div>
      );
    }

    const byCategory = {};
    personExpenses.forEach(e => {
      const cat = e.category || "Other";
      byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
    });
    const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const recent = [
      ...personExpenses.map(e => ({ ...e, _isIncome: false })),
      ...personIncome.map(i => ({ ...i, _isIncome: true }))
    ]
      .sort((a, b) => (b.date || b.month || "").localeCompare(a.date || a.month || ""))
      .slice(0, 3);

    return (
      <div style={{ padding: "10px 14px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Income</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>{fmtMoney(totalIncome, sym)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Spent</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--danger)" }}>{fmtMoney(totalSpent, sym)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Net</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: net >= 0 ? "var(--accent)" : "var(--danger)" }}>{fmtMoney(Math.abs(net), sym)}</div>
          </div>
        </div>
        {topCats.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {topCats.map(([cat, amt]) => (
              <span key={cat} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--surface-high)", color: "var(--text-sec)", border: "1px solid var(--border)" }}>
                {cat} · {fmtMoney(amt, sym)}
              </span>
            ))}
          </div>
        )}
        {recent.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {recent.map((e, i) => (
              <div key={e.id || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-sec)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
                  {e._isIncome ? (e.incomeType || "Income") : (e.label || e.category || "Expense")}
                </span>
                <span style={{ flexShrink: 0, fontWeight: 600, color: e._isIncome ? "var(--accent)" : "var(--text)" }}>
                  {e._isIncome ? "+" : ""}{fmtMoney(Number(e.amount || 0), sym)}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onOpenDetail(customer); }}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          View full history →
        </button>
      </div>
    );
  }

  function ApartmentBrief({ customer }) {
    if (!incomeLoaded) {
      return (
        <div style={{ padding: "10px 14px 12px", fontSize: 12, color: "var(--text-dim)" }}>
          Loading collection history…
        </div>
      );
    }
    const flatIncome = (allIncome || []).filter(e => e.flatNumber === customer.name);
    const maintenanceIncome = flatIncome.filter(e => (e.collectionType || "").toLowerCase().includes("maintenance"));
    const today = new Date();
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    const paidMonths = new Set(maintenanceIncome.map(e => e.collectionMonth).filter(Boolean));
    const totalCollected = flatIncome.reduce((s, e) => s + Number(e.amount || 0), 0);
    const maintenance = Number(customer.monthlyMaintenance || 0);

    const byType = {};
    flatIncome.forEach(e => {
      const type = e.collectionType || "Other";
      byType[type] = (byType[type] || 0) + Number(e.amount || 0);
    });
    const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 4);

    const recentCollections = [...flatIncome]
      .sort((a, b) => (b.date || b.collectionMonth || "").localeCompare(a.date || a.collectionMonth || ""))
      .slice(0, 3);

    return (
      <div style={{ padding: "10px 14px 14px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
          {customer.ownerName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Owner</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{customer.ownerName}</div>
            </div>
          )}
          {customer.tenantName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Tenant</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{customer.tenantName}</div>
            </div>
          )}
          {maintenance > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Monthly</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{fmtMoney(maintenance, sym)}</div>
            </div>
          )}
          {totalCollected > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Collected</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--jade, var(--accent))" }}>{fmtMoney(totalCollected, sym)}</div>
            </div>
          )}
        </div>
        {maintenance > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Last 6 months</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              {last6.map(mk => {
                const paid = paidMonths.has(mk);
                return (
                  <div key={mk} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: paid ? "var(--jade, var(--accent))" : "var(--ember, var(--gold))",
                      border: `2px solid ${paid ? "color-mix(in srgb, var(--jade, var(--accent)) 40%, transparent)" : "color-mix(in srgb, var(--ember, var(--gold)) 40%, transparent)"}`
                    }} />
                    <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{fmtMonthLabel(mk)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {typeEntries.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {typeEntries.map(([type, amt]) => (
              <span key={type} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--surface-high)", color: "var(--text-sec)", border: "1px solid var(--border)" }}>
                {type} · {fmtMoney(amt, sym)}
              </span>
            ))}
          </div>
        )}
        {recentCollections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {recentCollections.map((e, i) => (
              <div key={e.id || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-sec)" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
                  {e.collectionType || "Collection"}{e.collectionMonth ? ` · ${fmtMonthLabel(e.collectionMonth)}` : ""}
                </span>
                <span style={{ flexShrink: 0, fontWeight: 600, color: "var(--accent)" }}>{fmtMoney(Number(e.amount || 0), sym)}</span>
              </div>
            ))}
          </div>
        )}
        {maintenance === 0 && flatIncome.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>No collections recorded for this flat yet.</div>
        )}
        {flatIncome.length > 0 && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onOpenDetail(customer); }}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
          >
            View full history →
          </button>
        )}
      </div>
    );
  }

  function FreelanceBrief({ customer }) {
    const recentPayments = (customer.payments || []).slice(0, 3);
    const hasData = customer.totalRevenue > 0 || customer.outstanding > 0 || recentPayments.length > 0;

    if (!hasData) {
      return (
        <div style={{ padding: "10px 14px 12px", fontSize: 12, color: "var(--text-dim)" }}>
          No invoices or payments recorded yet.
        </div>
      );
    }

    return (
      <div style={{ padding: "10px 14px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Revenue</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--blue)" }}>{fmtMoney(customer.totalRevenue || 0, sym)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Outstanding</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: (customer.outstanding || 0) > 0 ? "var(--gold)" : "var(--accent)" }}>
              {fmtMoney(customer.outstanding || 0, sym)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Paid</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{customer.paidInvoices || 0} invoices</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 2 }}>Risk</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: (customer.risk || 0) > 0 ? "var(--danger)" : "var(--accent)" }}>
              {(customer.risk || 0) > 0 ? `${Math.round(customer.risk * 100)}% late` : "Healthy"}
            </div>
          </div>
        </div>
        {recentPayments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {recentPayments.map((p, i) => {
              const tone = p.status === "overdue" ? "var(--danger)" : p.status === "paid" ? "var(--accent)" : "var(--gold)";
              return (
                <div key={p.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: "var(--text-sec)" }}>{p.number || "Invoice"} · {fmtShortDate(p.date)}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: tone, textTransform: "capitalize" }}>{p.status}</span>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{fmtMoney(p.total, sym)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onOpenDetail(customer); }}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          View full history →
        </button>
      </div>
    );
  }

  function CustomerListCard({ customer, isLast }) {
    const isProtectedProfile = Boolean(customer?.isPrimaryProfile || customer?.isLockedProfile);
    const isExpanded = expandedId === customer.id;
    const meta = orgConfig.showCustomerFinancials === false
      ? isApartmentOrg
        ? [customer.ownerName, customer.phone].filter(Boolean).join(" · ") || "Flat record"
        : [customer.phone, customer.email].filter(Boolean).join(" · ") || "Household member"
      : `Balance ${fmtMoney(customer.outstanding, sym)} · Revenue ${fmtMoney(customer.totalRevenue, sym)}`;

    return (
      <>
        <WorkflowRecordCard
          avatar={<Avatar name={customer.name} size={40} fontSize={13} />}
          title={customer.name}
          meta={meta}
          amount={orgConfig.showCustomerFinancials === false ? null : fmtMoney(customer.outstanding, sym)}
          amountTone={orgConfig.showCustomerFinancials === false ? "var(--text)" : ((customer.outstanding || 0) > 0 ? "gold" : "accent")}
          onClick={() => toggleExpand(customer.id)}
          badges={[
            ...(isProtectedProfile ? [{ label: "Primary", tone: "blue" }] : []),
            { label: isExpanded ? "▾" : "▸" }
          ]}
          actions={[
            { label: "Edit", onClick: () => onOpenEditCust(customer), tone: "blue" },
            ...(!isProtectedProfile ? [{ label: "Delete", onClick: async () => { if (await confirm(`Remove ${customer.name}?`, { title: "Delete", confirmLabel: "Delete" })) onRemoveCustomer(customer.id); }, tone: "danger" }] : [])
          ]}
        />
        {isExpanded && (
          <div style={{
            background: "color-mix(in srgb, var(--accent) 5%, var(--surface-high))",
            borderTop: "1px solid var(--border)",
            borderBottom: isLast ? "none" : "1px solid var(--border)",
            marginBottom: isLast ? 0 : undefined
          }}>
            {isApartmentOrg
              ? <ApartmentBrief customer={customer} />
              : orgConfig.showCustomerFinancials === false
                ? <HouseholdBrief customer={customer} />
                : <FreelanceBrief customer={customer} />
            }
          </div>
        )}
      </>
    );
  }

  function PaymentHistoryCard({ payment }) {
    const statusTone = payment.status === "overdue" ? "danger" : payment.status === "paid" ? "accent" : "gold";
    const meta = [
      payment.date ? new Date(`${payment.date}T00:00:00`).toLocaleDateString("en-IN") : "--",
      payment.dueMessage || ""
    ].filter(Boolean).join(" · ");
    return (
      <WorkflowRecordCard
        title={payment.number}
        meta={meta}
        amount={fmtMoney(payment.total, sym)}
        amountTone="blue"
        badges={[{ label: payment.status, tone: statusTone }]}
      />
    );
  }

  if (screen === "customers") {
    return (
      <Modal
        title={orgConfig.customerLabel}
        onClose={onClose}
        onSave={onOpenNewCust}
        saveLabel={`Add ${orgConfig.customerEntryLabel}`}
      >
        {customerDirectory.length > 0 && (
          <Field label={`Search ${orgConfig.customerLabel}`} hint="Find records by flat number, owner, or contact.">
            <Input
              placeholder={`Search ${orgConfig.customerLabel.toLowerCase()}...`}
              value={customerSearch}
              onChange={event => onCustomerSearchChange(event.target.value)}
            />
          </Field>
        )}

        {customerDirectory.length === 0 ? (
          <WorkflowSetupCard
            title={`Add your first ${orgConfig.customerEntryLabel.toLowerCase()}`}
            description={`Create your first ${orgConfig.customerEntryLabel.toLowerCase()} to start building this directory and record history.`}
            tone="info"
          />
        ) : filteredCustomerDirectory.length === 0 ? (
          <WorkflowSetupCard
            title="No matching records"
            description="Try a different search term to find the flat or customer you need."
            tone="info"
          />
        ) : (
          <>
            <div className="card" style={{ marginBottom: 10, padding: 10 }}>
              <PaginatedListControls
                totalItems={filteredCustomerDirectory.length}
                page={customerPage}
                pageSize={customerPageSize}
                onPageChange={onCustomerPageChange}
                onPageSizeChange={nextSize => {
                  onCustomerPageSizeChange(nextSize);
                  onCustomerPageChange(1);
                }}
                itemLabel={orgConfig.customerLabel.toLowerCase()}
              />
            </div>
            <div className="card">
              {paginatedCustomerDirectory.map((customer, idx) => (
                <CustomerListCard
                  key={customer.id}
                  customer={customer}
                  isLast={idx === paginatedCustomerDirectory.length - 1}
                />
              ))}
            </div>
          </>
        )}
      </Modal>
    );
  }

  if (screen === "customer-detail" && selectedCustomer) {
    if (orgConfig.showCustomerFinancials === false) {
      if (isApartmentOrg) {
        const flatIncome = (allIncome || []).filter(e => e.flatNumber === selectedCustomer.name);
        const maintenanceIncome = flatIncome.filter(e => (e.collectionType || "").toLowerCase().includes("maintenance"));
        const totalCollected = flatIncome.reduce((s, e) => s + Number(e.amount || 0), 0);
        const maintenance = Number(selectedCustomer.monthlyMaintenance || 0);
        const today = new Date();
        const last12 = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        });
        const paidMonths = new Set(maintenanceIncome.map(e => e.collectionMonth).filter(Boolean));
        const byType = {};
        flatIncome.forEach(e => {
          const type = e.collectionType || "Other";
          byType[type] = (byType[type] || 0) + Number(e.amount || 0);
        });
        const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
        const recentCollections = [...flatIncome]
          .sort((a, b) => (b.date || b.collectionMonth || "").localeCompare(a.date || a.collectionMonth || ""))
          .slice(0, 10);

        return (
          <Modal
            title={selectedCustomer.name}
            onClose={onBackToList}
            onSave={() => onOpenEditCust(selectedCustomer)}
            saveLabel="Edit"
          >
            <div className="card" style={{ padding: "18px", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Flat</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--blue)" }}>{selectedCustomer.name || "--"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Owner</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{selectedCustomer.ownerName || "--"}</div>
                </div>
                {selectedCustomer.tenantName && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Tenant</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{selectedCustomer.tenantName}</div>
                  </div>
                )}
                {maintenance > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Monthly</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{fmtMoney(maintenance, sym)}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Total Collected</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--jade, var(--accent))" }}>{fmtMoney(totalCollected, sym)}</div>
                </div>
              </div>
            </div>

            {maintenance > 0 && (
              <>
                <div className="section-label">Maintenance — Last 12 months</div>
                <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {last12.map(mk => {
                      const paid = paidMonths.has(mk);
                      return (
                        <div key={mk} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: paid ? "var(--jade, var(--accent))" : "var(--ember, var(--gold))",
                            border: `2px solid ${paid ? "color-mix(in srgb, var(--jade, var(--accent)) 40%, transparent)" : "color-mix(in srgb, var(--ember, var(--gold)) 40%, transparent)"}`
                          }} />
                          <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{fmtMonthLabel(mk)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {typeEntries.length > 0 && (
              <>
                <div className="section-label">Collections by Type</div>
                <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
                  {typeEntries.map(([type, amt]) => (
                    <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{type}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(amt, sym)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="section-label">Collection History</div>
            <div className="card">
              {recentCollections.length === 0 ? (
                <div style={{ padding: "14px 18px", fontSize: 13, color: "var(--text-dim)" }}>No collections recorded yet.</div>
              ) : (
                recentCollections.map((e, i) => (
                  <div key={e.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < recentCollections.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{e.collectionType || "Collection"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                        {e.collectionMonth ? fmtMonthLabel(e.collectionMonth) : ""}{e.residentName ? ` · ${e.residentName}` : ""}{e.date ? ` · ${fmtShortDate(e.date)}` : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--jade, var(--accent))" }}>{fmtMoney(Number(e.amount || 0), sym)}</span>
                  </div>
                ))
              )}
            </div>
          </Modal>
        );
      }

      // Household / Personal detail view
      const personName = (selectedCustomer.name || "").trim().toLowerCase();
      const personExpenses = personName ? (allExpenses || []).filter(e => (e.personName || "").trim().toLowerCase() === personName) : [];
      const personIncome = personName ? (allIncome || []).filter(i => (i.personName || "").trim().toLowerCase() === personName) : [];
      const totalExpense = personExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const totalIncome = personIncome.reduce((s, i) => s + Number(i.amount || 0), 0);
      const net = totalIncome - totalExpense;

      const byIncomeType = {};
      personIncome.forEach(i => {
        const type = i.incomeType || "Other";
        byIncomeType[type] = (byIncomeType[type] || 0) + Number(i.amount || 0);
      });
      const incomeTypeEntries = Object.entries(byIncomeType).sort((a, b) => b[1] - a[1]);

      const byExpenseCat = {};
      personExpenses.forEach(e => {
        const cat = e.category || "Other";
        byExpenseCat[cat] = (byExpenseCat[cat] || 0) + Number(e.amount || 0);
      });
      const expenseCatEntries = Object.entries(byExpenseCat).sort((a, b) => b[1] - a[1]).slice(0, 6);

      const recentAll = [
        ...personExpenses.map(e => ({ ...e, _type: "expense" })),
        ...personIncome.map(i => ({ ...i, _type: "income" }))
      ]
        .sort((a, b) => (b.date || b.month || "").localeCompare(a.date || a.month || ""))
        .slice(0, 10);

      return (
        <Modal
          title={selectedCustomer.name}
          onClose={onBackToList}
          onSave={() => onOpenEditCust(selectedCustomer)}
          saveLabel="Edit"
        >
          <div className="card" style={{ padding: "18px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Income</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)" }}>{fmtMoney(totalIncome, sym)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Spent</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--danger)" }}>{fmtMoney(totalExpense, sym)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Net</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: net >= 0 ? "var(--accent)" : "var(--danger)" }}>{fmtMoney(Math.abs(net), sym)}</div>
              </div>
            </div>
          </div>

          {incomeTypeEntries.length > 0 && (
            <>
              <div className="section-label">Income by Type</div>
              <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
                {incomeTypeEntries.map(([type, amt]) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{type}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{fmtMoney(amt, sym)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {expenseCatEntries.length > 0 && (
            <>
              <div className="section-label">Expenses by Category</div>
              <div className="card" style={{ padding: "14px 18px", marginBottom: 16 }}>
                {expenseCatEntries.map(([cat, amt]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-sec)" }}>{cat}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(amt, sym)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-label">Recent Activity</div>
          <div className="card">
            {recentAll.length === 0 ? (
              <div style={{ padding: "14px 18px", fontSize: 13, color: "var(--text-dim)" }}>No entries tagged to {selectedCustomer.name} yet.</div>
            ) : (
              recentAll.map((e, i) => (
                <div key={e.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: i < recentAll.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {e._type === "income" ? (e.incomeType || "Income") : (e.label || e.category || "Expense")}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                      {e._type === "income" ? "Income" : "Expense"}{e.date ? ` · ${fmtShortDate(e.date)}` : e.month ? ` · ${e.month}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: e._type === "income" ? "var(--accent)" : "var(--danger)" }}>
                    {e._type === "income" ? "+" : "-"}{fmtMoney(Number(e.amount || 0), sym)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Modal>
      );
    }

    return (
      <Modal
        title={selectedCustomer.name}
        onClose={onBackToList}
        onSave={() => onOpenEditCust(selectedCustomer)}
        saveLabel="Edit"
      >
        <div className="card" style={{ padding: "18px", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Outstanding</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: selectedCustomer.outstanding > 0 ? "var(--gold)" : "var(--accent)" }}>
                {fmtMoney(selectedCustomer.outstanding, sym)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Total Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(selectedCustomer.totalRevenue, sym)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Paid Invoices</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{selectedCustomer.paidInvoices}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Risk Level</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: selectedCustomer.risk > 0 ? "var(--danger)" : "var(--accent)" }}>
                {selectedCustomer.risk > 0 ? `${Math.round(selectedCustomer.risk * 100)}% late` : "Healthy"}
              </div>
            </div>
          </div>
        </div>

        <div className="section-label">Payment History</div>
        <div className="card">
          {selectedCustomerPayments.length === 0 ? (
            <WorkflowSetupCard
              title="No payment history yet"
              body="Once you create invoices or record payments, this customer's billing history will appear here."
              tone="blue"
            />
          ) : (
            selectedCustomerPayments.map(payment => <PaymentHistoryCard key={payment.id} payment={payment} />)
          )}
        </div>
      </Modal>
    );
  }

  if (screen === "customer-form") {
    return (
      <Modal
        title={editCust ? `Edit ${orgConfig.customerEntryLabel}` : `New ${orgConfig.customerEntryLabel}`}
        onClose={onBackToList}
        onSave={onSaveCust}
        canSave={!!custForm?.name?.trim()}
      >
        <Field label={orgConfig.customerNameLabel} required>
          <Input
            placeholder={orgConfig.customerNamePlaceholder}
            value={custForm?.name || ""}
            onChange={e => onCustFormChange(f => ({ ...f, name: e.target.value }))}
          />
        </Field>

        {(showPersonContactFields || showApartmentWhatsappField) && (
          <Field
            label={showApartmentWhatsappField ? "Resident WhatsApp Number" : "Phone"}
            hint={showApartmentWhatsappField ? "Used for due reminders and invoice updates on WhatsApp." : ""}
          >
            <PhoneNumberInput
              countryCode={custForm?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
              phoneNumber={custForm?.phoneNumber || ""}
              onCountryCodeChange={value => onCustFormChange(f => ({ ...f, phoneCountryCode: value }))}
              onPhoneNumberChange={value => onCustFormChange(f => ({ ...f, phoneNumber: value }))}
              countryOptions={PHONE_COUNTRY_OPTIONS}
              phonePlaceholder="9876543210"
            />
          </Field>
        )}

        {showFullCustomerForm && (
          <Field label="Email">
            <Input
              type="email"
              placeholder="billing@company.com"
              value={custForm?.email || ""}
              onChange={e => onCustFormChange(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
        )}

        {showFullCustomerForm && (
          <StructuredLocationFields
            addressLine={custForm?.addressLine || ""}
            city={custForm?.city || ""}
            state={custForm?.state || ""}
            country={custForm?.country || "India"}
            onAddressLineChange={value => onCustFormChange(f => ({ ...f, addressLine: value }))}
            onCityChange={value => onCustFormChange(f => ({ ...f, city: value }))}
            onStateChange={value => onCustFormChange(f => ({ ...f, state: value }))}
            onCountryChange={value => onCustFormChange(f => ({ ...f, country: value }))}
            required
          />
        )}

        {showFullCustomerForm && (
          <Field label="GSTIN (optional)">
            <Input
              placeholder="GSTIN"
              value={custForm?.gstin || ""}
              onChange={e => onCustFormChange(f => ({ ...f, gstin: e.target.value }))}
            />
          </Field>
        )}

        {(orgConfig.customerFields || []).map(field => (
          <Field key={field.key} label={field.label} required={Boolean(field.required)}>
            {renderDynamicField(field, custForm?.[field.key], value => onCustFormChange(current => ({ ...current, [field.key]: value })))}
          </Field>
        ))}
      </Modal>
    );
  }

  return null;
}
