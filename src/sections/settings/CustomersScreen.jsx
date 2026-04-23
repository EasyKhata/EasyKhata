import React from "react";
import {
  Modal, Field, Input, Select, PhoneNumberInput,
  StructuredLocationFields, Avatar, EmptyState, DeleteBtn,
  PaginatedListControls, WorkflowRecordCard, WorkflowSetupCard, fmtMoney
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

  function CustomerListCard({ customer }) {
    const meta = orgConfig.showCustomerFinancials === false
      ? [customer.ownerName || "No owner"].filter(Boolean).join(" · ") || "Flat details"
      : `Balance ${fmtMoney(customer.outstanding, sym)} · Revenue ${fmtMoney(customer.totalRevenue, sym)}`;

    return (
      <WorkflowRecordCard
        avatar={<Avatar name={customer.name} size={40} fontSize={13} />}
        title={customer.name}
        meta={meta}
        amount={orgConfig.showCustomerFinancials === false ? null : fmtMoney(customer.outstanding, sym)}
        amountTone={orgConfig.showCustomerFinancials === false ? "var(--text)" : ((customer.outstanding || 0) > 0 ? "gold" : "accent")}
        onClick={() => onOpenDetail(customer)}
        actions={[
          { label: "Edit", onClick: () => onOpenEditCust(customer), tone: "blue" },
          { label: "Delete", onClick: () => { if (window.confirm(`Remove ${customer.name}?`)) onRemoveCustomer(customer.id); }, tone: "danger" }
        ]}
      />
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
            body={`Create your first ${orgConfig.customerEntryLabel.toLowerCase()} to start building this directory and record history.`}
            tone="blue"
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
              {paginatedCustomerDirectory.map(customer => <CustomerListCard key={customer.id} customer={customer} />)}
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
