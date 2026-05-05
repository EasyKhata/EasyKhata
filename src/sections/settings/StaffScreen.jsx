import React from "react";
import { useConfirm } from "../../context/DialogContext";
import { Modal, Field, Input, Select, PhoneNumberInput, Avatar, WorkflowRecordCard, WorkflowSetupCard } from "../../components/UI";
import { PHONE_COUNTRY_OPTIONS, DEFAULT_PHONE_COUNTRY_CODE } from "../../utils/profile";

const ID_CARD_TYPES = ["Aadhaar", "PAN", "Passport", "Voter ID", "Driving License", "Other"];

export default function StaffScreen({
  screen,
  items = [],
  staffForm,
  onStaffFormChange,
  editStaff,
  onOpenNewStaff,
  onOpenEditStaff,
  onSaveStaff,
  onRemoveStaff,
  onBackToList,
  onClose,
  canCreateRecords = true,
  canManageRecord,
}) {
  const confirm = useConfirm();
  const canSave = !!(staffForm?.name?.trim()) && !!(staffForm?.phoneNumber || "").trim();

  if (screen === "staff") {
    return (
      <Modal title="Staff" onClose={onClose} onSave={canCreateRecords ? onOpenNewStaff : undefined} saveLabel="Add Staff">
        {items.length === 0 ? (
          <WorkflowSetupCard
            title="Add your first staff member"
            message="Create staff records to manage payroll and team information."
            tone="info"
          />
        ) : (
          <div className="card">
            {items.map(member => (
              <WorkflowRecordCard
                key={member.id}
                avatar={<Avatar name={member.name} size={40} fontSize={13} />}
                title={member.name}
                meta={[
                  member.phone,
                  member.idCardType
                    ? `${member.idCardType}${member.idCardNumber ? ` · ${member.idCardNumber}` : ""}`
                    : ""
                ].filter(Boolean).join(" · ")}
                actions={(canManageRecord?.(member) ?? canCreateRecords) ? [
                  { label: "Edit", onClick: () => onOpenEditStaff(member), tone: "blue" },
                  {
                    label: "Delete",
                    onClick: async () => {
                      if (await confirm(`Remove ${member.name}?`, { title: "Delete", confirmLabel: "Delete" }))
                        onRemoveStaff(member.id);
                    },
                    tone: "danger"
                  }
                ] : []}
              />
            ))}
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "staff-form") {
    return (
      <Modal
        title={editStaff ? "Edit Staff Member" : "New Staff Member"}
        onClose={onBackToList}
        onSave={(editStaff ? (canManageRecord?.(editStaff) ?? canCreateRecords) : canCreateRecords) ? onSaveStaff : undefined}
        canSave={canSave}
      >
        <Field label="Full Name" required>
          <Input
            placeholder="Staff member name"
            value={staffForm?.name || ""}
            onChange={e => onStaffFormChange(f => ({ ...f, name: e.target.value }))}
          />
        </Field>

        <Field label="Phone" required hint="Used for payroll and payslip records.">
          <PhoneNumberInput
            countryCode={staffForm?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE}
            phoneNumber={staffForm?.phoneNumber || ""}
            onCountryCodeChange={value => onStaffFormChange(f => ({ ...f, phoneCountryCode: value }))}
            onPhoneNumberChange={value => onStaffFormChange(f => ({ ...f, phoneNumber: value }))}
            countryOptions={PHONE_COUNTRY_OPTIONS}
            phonePlaceholder="9876543210"
          />
        </Field>

        <Field label="ID Card Type">
          <Select
            value={staffForm?.idCardType || ""}
            onChange={e => onStaffFormChange(f => ({ ...f, idCardType: e.target.value }))}
          >
            <option value="">Select (optional)</option>
            {ID_CARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>

        <Field label="ID Card Number">
          <Input
            placeholder="ID card number (optional)"
            value={staffForm?.idCardNumber || ""}
            onChange={e => onStaffFormChange(f => ({ ...f, idCardNumber: e.target.value }))}
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            placeholder="email@example.com (optional)"
            value={staffForm?.email || ""}
            onChange={e => onStaffFormChange(f => ({ ...f, email: e.target.value }))}
          />
        </Field>

        <Field label="Address">
          <Input
            placeholder="Address (optional)"
            value={staffForm?.address || ""}
            onChange={e => onStaffFormChange(f => ({ ...f, address: e.target.value }))}
          />
        </Field>
      </Modal>
    );
  }

  return null;
}
