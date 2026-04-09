import React, { useEffect, useMemo, useState } from "react";
import { Field, Input, Select, Textarea } from "./UI";
import { ORG_TYPE_OPTIONS, getOrgConfig, getOrgType } from "../utils/orgTypes";

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, user, account, onUpdateAccount }) {
  const [step, setStep] = useState(1);
  const [accountForm, setAccountForm] = useState(
    account || { name: "", address: "", gstin: "", phone: "", email: "", showHSN: false, organizationType: getOrgType(user?.organizationType || account?.organizationType) }
  );

  useEffect(() => {
    setAccountForm(current => ({
      ...current,
      organizationType: current.organizationType || getOrgType(user?.organizationType || account?.organizationType)
    }));
  }, [user?.organizationType, account?.organizationType]);

  const orgType = getOrgType(accountForm.organizationType || user?.organizationType || account?.organizationType);
  const orgConfig = useMemo(() => getOrgConfig(orgType), [orgType]);
  const totalSteps = 4;
  const isLastStep = step === totalSteps;
  const stepTitles = [
    `Set Your ${orgConfig.profileNameLabel}`,
    `Add Your First ${orgConfig.customerEntryLabel}`,
    orgConfig.hideInvoices ? `Track Your First ${orgConfig.incomeEntryLabel}` : `Create Your First ${orgConfig.invoiceEntryLabel}`,
    `Record Your First ${orgConfig.expensesEntryLabel}`
  ];

  function handleNext() {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStep(current => current + 1);
  }

  function handleBack() {
    if (step > 1) setStep(current => current - 1);
  }

  function saveAccountAndContinue() {
    if (!String(accountForm.name || "").trim()) {
      alert(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return;
    }
    onUpdateAccount?.(accountForm);
    handleNext();
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              {orgConfig.accountIntro}
            </div>
            <Field label="Usage Type" required hint="Choose the setup that matches how you plan to use EasyKhata.">
              <Select value={orgType} onChange={e => setAccountForm(current => ({ ...current, organizationType: e.target.value }))}>
                {ORG_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ marginBottom: 16, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {ORG_TYPE_OPTIONS.find(option => option.value === orgType)?.description}
            </div>
            <Field label={orgConfig.profileNameLabel} required>
              <Input
                placeholder={orgConfig.profileNamePlaceholder}
                value={accountForm.name || ""}
                onChange={e => setAccountForm(current => ({ ...current, name: e.target.value }))}
              />
            </Field>
            <Field label="GSTIN">
              <Input
                placeholder="Your GST registration number"
                value={accountForm.gstin || ""}
                onChange={e => setAccountForm(current => ({ ...current, gstin: e.target.value }))}
              />
            </Field>
            <Field label="Address">
              <Textarea
                placeholder="Full address"
                value={accountForm.address || ""}
                onChange={e => setAccountForm(current => ({ ...current, address: e.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="+91-9123456789"
                value={accountForm.phone || ""}
                onChange={e => setAccountForm(current => ({ ...current, phone: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                value={accountForm.email || ""}
                onChange={e => setAccountForm(current => ({ ...current, email: e.target.value }))}
              />
            </Field>
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Add your first {orgConfig.customerEntryLabel.toLowerCase()}. You can always add more from Settings later.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Ready to add a {orgConfig.customerEntryLabel.toLowerCase()}?
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 12 }}>
                You will enter details like name, email, phone, and address so your records stay organized.
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("settings");
                  onComplete();
                }}
              >
                Go to {orgConfig.customerLabel}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              You can revisit {orgConfig.customerLabel.toLowerCase()} anytime from Settings.
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              {orgConfig.hideInvoices
                ? `Ready to track your first ${orgConfig.incomeEntryLabel.toLowerCase()}?`
                : `Ready to create your first ${orgConfig.invoiceEntryLabel.toLowerCase()}?`}
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                {orgConfig.hideInvoices ? (
                  <>
                    <div>• Add the amount you received</div>
                    <div>• Set the date and earning type</div>
                    <div>• Keep the entry ready for dashboard tracking</div>
                  </>
                ) : (
                  <>
                    <div>• Select a {orgConfig.customerEntryLabel.toLowerCase()}</div>
                    <div>• Add items with description, quantity, and rate</div>
                    <div>• Set due dates and taxes if needed</div>
                    <div>• Save a professional invoice</div>
                  </>
                )}
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate(orgConfig.hideInvoices ? "income" : "invoices");
                  onComplete();
                }}
              >
                Go to {orgConfig.hideInvoices ? orgConfig.incomeLabel : orgConfig.invoicesLabel}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Finally, record your first {orgConfig.expensesEntryLabel.toLowerCase()} so your dashboard can start comparing inflow and outflow.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                <div>• Add the amount and date</div>
                <div>• Choose the best category</div>
                <div>• Add any extra notes you need later</div>
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("expenses");
                  onComplete();
                }}
              >
                Go to {orgConfig.expensesLabel}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .onboarding-modal {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div className="onboarding-modal" style={{ background: "var(--bg)", width: "100%", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Setup Guide · Step {step} of {totalSteps}
            </div>
            <button onClick={onComplete} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-sec)" }}>
              ×
            </button>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stepTitles[step - 1]}</div>
        </div>

        <div style={{ padding: "20px 18px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[...Array(totalSteps)].map((_, index) => (
                <div key={index} style={{ flex: 1, height: 4, borderRadius: 2, background: index < step ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>
          </div>

          {renderStepContent()}
        </div>

        <div style={{ padding: "16px 18px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          {step > 1 && (
            <button className="btn-secondary" style={{ flex: 1 }} onClick={handleBack}>
              Back
            </button>
          )}
          {step === 1 ? (
            <button className="btn-primary" style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }} onClick={saveAccountAndContinue}>
              Continue
            </button>
          ) : isLastStep ? (
            <button className="btn-primary" style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }} onClick={handleNext}>
              Get Started
            </button>
          ) : (
            <button className="btn-secondary" style={{ flex: 1 }} onClick={handleNext}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
