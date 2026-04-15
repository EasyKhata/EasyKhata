import React from "react";
import { Modal, Field, Input, Select, PhoneNumberInput } from "../../components/UI";
import {
  COUNTRY_OPTIONS,
  MONTH_OPTIONS,
  PHONE_COUNTRY_OPTIONS,
  getBirthDayOptions,
  getBirthYearOptions,
  getStateProvinceOptions
} from "../../utils/profile";

const GENDER_OPTIONS = ["", "Female", "Male", "Non-binary", "Other", "Prefer not to say"];

/**
 * Personal / admin profile edit modal.
 *
 * Props:
 *   form         userForm object
 *   onFormChange (updater: prev => next)
 *   onSave       () => void
 *   onClose      () => void
 *   user         auth user object (role, etc.)
 */
export default function ProfileModal({ form, onFormChange, onSave, onClose, user }) {
  const stateProvinceOptions = React.useMemo(() => getStateProvinceOptions(form.country), [form.country]);
  const birthYearOptions = React.useMemo(() => getBirthYearOptions(), []);
  const birthDayOptions = React.useMemo(() => getBirthDayOptions(form.birthMonth, form.birthYear), [form.birthMonth, form.birthYear]);

  return (
    <Modal
      title={user?.role === "admin" ? "Admin Account" : "Personal Profile"}
      onClose={onClose}
      onSave={onSave}
      canSave={!!form.name?.trim()}
    >
      <Field label="Full Name" required>
        <Input
          placeholder="Your name"
          value={form.name}
          onChange={event => onFormChange(current => ({ ...current, name: event.target.value }))}
        />
      </Field>

      <Field label="Email" required hint="Linked to your sign-in account and cannot be edited here.">
        <Input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          readOnly
          aria-readonly="true"
          style={{ background: "var(--surface-high)", color: "var(--text-sec)", cursor: "not-allowed" }}
        />
      </Field>

      <Field label="Phone" required>
        <PhoneNumberInput
          countryCode={form.phoneCountryCode}
          phoneNumber={form.phoneNumber}
          onCountryCodeChange={value => onFormChange(current => ({ ...current, phoneCountryCode: value }))}
          onPhoneNumberChange={value => onFormChange(current => ({ ...current, phoneNumber: value }))}
          countryOptions={PHONE_COUNTRY_OPTIONS}
          phonePlaceholder="9876543210"
        />
      </Field>

      <Field label="Date of Birth" hint="Used to derive age-group insights for admin analytics.">
        <div className="desktop-grid-3">
          <Select
            value={form.birthDay}
            onChange={event => onFormChange(current => ({ ...current, birthDay: event.target.value }))}
          >
            <option value="">Day</option>
            {birthDayOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
          <Select
            value={form.birthMonth}
            onChange={event => onFormChange(current => ({ ...current, birthMonth: event.target.value }))}
          >
            <option value="">Month</option>
            {MONTH_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select
            value={form.birthYear}
            onChange={event => onFormChange(current => ({ ...current, birthYear: event.target.value }))}
          >
            <option value="">Year</option>
            {birthYearOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </div>
      </Field>

      <Field label="Gender" hint="Optional. Used only for aggregated audience insights.">
        <Select
          value={form.gender}
          onChange={event => onFormChange(current => ({ ...current, gender: event.target.value }))}
        >
          <option value="">Prefer not to share</option>
          {GENDER_OPTIONS.filter(option => option).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </Field>

      <Field label="Address Line" hint="House number, street, road, or locality.">
        <Input
          placeholder="Flat 12, MG Road"
          value={form.addressLine}
          onChange={event => onFormChange(current => ({ ...current, addressLine: event.target.value }))}
          autoComplete="address-line1"
        />
      </Field>

      <div className="desktop-grid-2">
        <Field label="City" required hint="Used for market-level segmentation.">
          <Input
            placeholder="Hyderabad"
            value={form.city}
            onChange={event => onFormChange(current => ({ ...current, city: event.target.value }))}
            autoComplete="address-level2"
          />
        </Field>
        <Field label="Country" required>
          <Select
            value={form.country}
            onChange={event => onFormChange(current => ({ ...current, country: event.target.value }))}
          >
            {COUNTRY_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="State / Province" required>
        <Select
          value={form.state}
          onChange={event => onFormChange(current => ({ ...current, state: event.target.value }))}
        >
          <option value="">Select state / province</option>
          {stateProvinceOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
      </Field>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
          {user?.role === "admin"
            ? "This information belongs to your sign-in identity and admin account. Structured phone, date of birth, and location improve aggregate admin insights, not person-level tracking."
            : "This information belongs to your sign-in identity. Organization name, GSTIN, org phone, and invoice details stay in the organization profile. Structured phone, date of birth, and location improve aggregate product and marketing insights."}
        </div>
      </div>
    </Modal>
  );
}
