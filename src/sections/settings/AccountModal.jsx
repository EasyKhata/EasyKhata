import React from "react";
import { Modal, Field, Input, Select, PhoneNumberInput } from "../../components/UI";
import { PHONE_COUNTRY_OPTIONS, sanitizeIndianPincode } from "../../utils/profile";

/**
 * Organization profile edit modal (screen === "account").
 *
 * Props:
 *   form                    accForm object
 *   onFormChange            (updater: prev => next)
 *   onSave                  () => void
 *   onClose                 () => void
 *   orgConfig               org config object
 *   isApartmentOrg          boolean
 *   showOrgBusinessFields   boolean
 *   orgStateProvinceOptions string[]
 *   selectableOrgTypeOptions { value, label }[]
 *   orgType                 string
 *   pendingOrgTypeChange    object | null
 *   onCancelOrgTypeChange   () => void
 *   onConfirmOrgTypeChange  () => void
 */
export default function AccountModal({
  form,
  onFormChange,
  onSave,
  onClose,
  orgConfig,
  isApartmentOrg,
  showOrgBusinessFields,
  orgStateProvinceOptions,
  selectableOrgTypeOptions,
  orgType,
  canChangeOrgType = true,
  pendingOrgTypeChange,
  onCancelOrgTypeChange,
  onConfirmOrgTypeChange,
  onLogoChange,
}) {
  return (
    <>
      <Modal
        title="Your Khata"
        onClose={onClose}
        onSave={onSave}
        canSave={!!form.name?.trim() && !!form.addressLine?.trim() && !!form.city?.trim() && !!form.district?.trim() && !!form.state?.trim() && !!form.pincode?.trim()}
      >
        <Field
          label="Usage Type"
          required
          hint={!canChangeOrgType ? (orgType === "personal" ? "Household stays as your permanent default Khata." : "Upgrade to Pro to change your Khata type.") : undefined}
        >
          <Select
            value={form.organizationType || orgType}
            onChange={e => canChangeOrgType && onFormChange(f => ({ ...f, organizationType: e.target.value }))}
            disabled={!canChangeOrgType}
          >
            {selectableOrgTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>

        <Field label={orgConfig.profileNameLabel} required>
          <Input
            placeholder={orgConfig.profileNamePlaceholder}
            value={form.name || ""}
            onChange={e => onFormChange(f => ({ ...f, name: e.target.value }))}
          />
        </Field>

        <Field label="Address" required hint="Society name, street, area, and any landmark.">
          <Input
            placeholder="Lake View Residency, MG Road, Hyderabad"
            value={form.addressLine || ""}
            onChange={e => onFormChange(f => ({ ...f, addressLine: e.target.value }))}
            autoComplete="street-address"
          />
        </Field>

        <div className="desktop-grid-2">
          <Field label="City" required>
            <Input
              placeholder="Hyderabad"
              value={form.city || ""}
              onChange={e => onFormChange(f => ({ ...f, city: e.target.value }))}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="District" required>
            <Input
              placeholder="Hyderabad"
              value={form.district || ""}
              onChange={e => onFormChange(f => ({ ...f, district: e.target.value }))}
              autoComplete="address-level2"
            />
          </Field>
        </div>

        <div className="desktop-grid-2">
          <Field label="State" required>
            <Select
              value={form.state || ""}
              onChange={e => onFormChange(f => ({ ...f, state: e.target.value }))}
            >
              <option value="">Select state</option>
              {orgStateProvinceOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pincode" required>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="500081"
              value={form.pincode || ""}
              onChange={e => onFormChange(f => ({ ...f, pincode: sanitizeIndianPincode(e.target.value) }))}
              autoComplete="postal-code"
            />
          </Field>
        </div>

        {showOrgBusinessFields && (
          <Field label="GSTIN">
            <Input
              placeholder="GSTIN"
              value={form.gstin || ""}
              onChange={e => onFormChange(f => ({ ...f, gstin: e.target.value }))}
            />
          </Field>
        )}

        {showOrgBusinessFields && (
          <Field label="Phone">
            <PhoneNumberInput
              countryCode={form.phoneCountryCode}
              phoneNumber={form.phoneNumber}
              onCountryCodeChange={value => onFormChange(f => ({ ...f, phoneCountryCode: value }))}
              onPhoneNumberChange={value => onFormChange(f => ({ ...f, phoneNumber: value }))}
              countryOptions={PHONE_COUNTRY_OPTIONS}
              phonePlaceholder="9876543210"
            />
          </Field>
        )}

        {showOrgBusinessFields && (
          <Field label="Email">
            <Input
              type="email"
              placeholder="email@example.com"
              value={form.email || ""}
              onChange={e => onFormChange(f => ({ ...f, email: e.target.value }))}
            />
          </Field>
        )}

        {showOrgBusinessFields && (
          <Field label="Business Logo" hint="Shown on invoices and reports. PNG or JPG, under 1 MB.">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {form.logoBase64 ? (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={form.logoBase64}
                    alt="Business logo"
                    style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", padding: 4, display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => onFormChange(f => ({ ...f, logoBase64: "", logoRatio: null }))}
                    style={{ position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: "50%", background: "var(--danger)", border: "none", color: "#fff", fontSize: 13, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Remove logo"
                  >×</button>
                </div>
              ) : (
                <div style={{ width: 80, height: 48, borderRadius: 8, border: "1.5px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 11, flexShrink: 0 }}>
                  No logo
                </div>
              )}
              <label style={{ cursor: "pointer", flex: 1 }}>
                <div style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", fontSize: 13, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                  {form.logoBase64 ? "Change Logo" : "Upload Logo"}
                </div>
                <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onLogoChange} />
              </label>
            </div>
          </Field>
        )}

        {showOrgBusinessFields && (
          <Field label="Show HSN/SAC on Invoices">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-high)", borderRadius: 12 }}>
              <span style={{ fontSize: 15, color: "var(--text)" }}>Include HSN/SAC column</span>
              <button
                onClick={() => onFormChange(f => ({ ...f, showHSN: !f.showHSN }))}
                style={{ width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s", background: form.showHSN ? "var(--accent)" : "var(--border)" }}
              >
                <div style={{ position: "absolute", top: 3, left: form.showHSN ? undefined : 3, right: form.showHSN ? 3 : undefined, width: 22, height: 22, borderRadius: 11, background: "#fff", transition: "all 0.3s" }} />
              </button>
            </div>
          </Field>
        )}
      </Modal>

      {pendingOrgTypeChange && (
        <Modal
          title="Confirm Usage Type Change"
          onClose={onCancelOrgTypeChange}
          onSave={onConfirmOrgTypeChange}
          saveLabel="Yes, Delete Existing Data"
          canSave={true}
        >
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)", marginBottom: 8 }}>
              Warning: This action will permanently delete existing workspace data.
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
              You are changing usage type from <b>{pendingOrgTypeChange.previousOrganizationType}</b> to <b>{pendingOrgTypeChange.nextOrganizationType}</b>.
              All current records in this workspace (customers, income, expenses, invoices, goals, budgets, and organization-specific entries) will be removed.
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              If you want to keep this data, click Cancel and continue with the current workspace setup.
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
