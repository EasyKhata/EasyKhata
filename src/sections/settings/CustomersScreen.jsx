import React from "react";
import {
  Modal, Field, Input, Select, PhoneNumberInput,
  StructuredLocationFields, Avatar, EmptyState, DeleteBtn,
  PaginatedListControls, fmtMoney
} from "../../components/UI";
import { PHONE_COUNTRY_OPTIONS, DEFAULT_PHONE_COUNTRY_CODE } from "../../utils/profile";

/**
 * Customer management screens (list / detail / form).
 *
 * Props:
 *   screen                    "customers" | "customer-detail" | "customer-form"
 *   orgConfig                 org config object
 *   currency                  currency object
 *   customerDirectory         all customer objects (unfiltered)
 *   filteredCustomerDirectory search-filtered list
 *   paginatedCustomerDirectory page slice
 *   customerSearch            string
 *   onCustomerSearchChange    (value) => void
 *   customerPage              number
 *   onCustomerPageChange      (page) => void
 *   customerPageSize          number
 *   onCustomerPageSizeChange  (size) => void
 *   selectedCustomer          object | null
 *   selectedCustomerPayments  array
 *   editCust                  object | null (non-null = edit mode)
 *   custForm                  form object | null
 *   onCustFormChange          (updater) => void
 *   showPersonContactFields   boolean
 *   showApartmentWhatsappField boolean
 *   showFullCustomerForm      boolean
 *   renderDynamicField        (field, value, onChange) => ReactNode
 *   onOpenNewCust             () => void
 *   onOpenEditCust            (customer) => void
 *   onOpenDetail              (customer) => void
 *   onSaveCust                () => void
 *   onRemoveCustomer          (id) => void
 *   onBackToList              () => void
 *   onClose                   () => void
 */
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
  onClose
}) {
  const sym = currency?.symbol || "Rs";

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
          <EmptyState
            title={`No ${orgConfig.customerLabel.toLowerCase()} yet`}
            message={`Add your first ${orgConfig.customerEntryLabel.toLowerCase()} to start building your records.`}
            accentColor="var(--blue)"
          />
        ) : filteredCustomerDirectory.length === 0 ? (
          <EmptyState
            title="No matching records"
            message="Try a different search term to find the flat or customer you need."
            accentColor="var(--blue)"
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
              {paginatedCustomerDirectory.map(customer => (
                <div key={customer.id} className="card-row">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1 }}
                    onClick={() => onOpenDetail(customer)}
                  >
                    <Avatar name={customer.name} size={38} fontSize={13} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{customer.name}</div>
                      {orgConfig.showCustomerFinancials === false ? (
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {[customer.ownerName || "No owner"].filter(Boolean).join(" · ") || "Flat details"}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          Balance {fmtMoney(customer.outstanding, sym)} · Revenue {fmtMoney(customer.totalRevenue, sym)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => onOpenEditCust(customer)}
                      style={{ background: "var(--blue-deep)", border: "none", borderRadius: 9, color: "var(--blue)", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font)" }}
                    >
                      Edit
                    </button>
                    <DeleteBtn onDelete={() => { if (window.confirm(`Remove ${customer.name}?`)) onRemoveCustomer(customer.id); }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
    );
  }

  if (screen === "customer-detail" && selectedCustomer) {
    if (orgConfig.showCustomerFinancials === false) {
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
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{selectedCustomer.name || "--"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Owner</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{selectedCustomer.ownerName || "--"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Record Type</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>Flat record</div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: "18px" }}>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.8 }}>
              <div>This flat record is used to auto-fill apartment collections and apartment invoices.</div>
            </div>
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
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>
              No invoice history yet for this customer.
            </div>
          ) : (
            selectedCustomerPayments.map(payment => (
              <div key={payment.id} className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{payment.number}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {payment.date ? new Date(`${payment.date}T00:00:00`).toLocaleDateString("en-IN") : "--"}
                    {payment.dueMessage ? ` · ${payment.dueMessage}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(payment.total, sym)}</div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: payment.status === "overdue" ? "var(--danger)" : payment.status === "paid" ? "var(--accent)" : "var(--gold)"
                  }}>
                    {payment.status}
                  </div>
                </div>
              </div>
            ))
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
