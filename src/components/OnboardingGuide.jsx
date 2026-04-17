import React, { useEffect, useMemo, useState } from "react";
import { Field, Input, Select } from "./UI";
import { ORG_TYPES, getOrgConfig, getOrgType, getSelectableOrgTypeOptions } from "../utils/orgTypes";

function buildAccountFormState(account, user) {
  return {
    name: account?.name || "",
    organizationType: getOrgType(account?.organizationType || user?.organizationType)
  };
}

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, user, account, onUpdateAccount }) {
  const [step, setStep] = useState(1);
  const [accountForm, setAccountForm] = useState(buildAccountFormState(account, user));
  const orgType = getOrgType(accountForm.organizationType || user?.organizationType || account?.organizationType);
  const orgConfig = useMemo(() => getOrgConfig(orgType), [orgType]);
  const selectableOrgTypeOptions = useMemo(() => getSelectableOrgTypeOptions(orgType), [orgType]);
  const totalSteps = 3;
  const isLastStep = step === totalSteps;
  const isSmallBusinessOrg = orgType === ORG_TYPES.SMALL_BUSINESS;
  const primaryQuickstartAction = orgType === ORG_TYPES.APARTMENT ? "first-dues" : orgConfig.hideInvoices ? "first-income" : "first-invoice";
  const quickstartTarget = orgType === ORG_TYPES.APARTMENT
    ? { tab: "income", quickstart: "first-dues" }
    : orgConfig.hideInvoices
      ? { tab: "income", quickstart: "first-income" }
      : { tab: "invoices", quickstart: "first-invoice" };

  useEffect(() => {
    setAccountForm(buildAccountFormState(account, user));
  }, [account?.name, account?.organizationType, user?.organizationType]);

  async function completeOnboarding() {
    await onComplete?.();
  }

  const stepTitles = [
    `Set Your ${orgConfig.profileNameLabel}`,
    `Review Your ${orgConfig.orgLabel || "Khata"} Setup`,
    orgType === ORG_TYPES.APARTMENT ? "Create First Dues Entry" : orgConfig.hideInvoices ? `Create First ${orgConfig.incomeEntryLabel}` : `Create First ${orgConfig.invoiceEntryLabel}`
  ];

  async function handleNext() {
    if (isLastStep) {
      await completeOnboarding();
      onNavigate?.(quickstartTarget);
      return;
    }
    setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function saveAccountAndContinue() {
    if (!String(accountForm.name || "").trim()) {
      alert(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return;
    }
    const nextAccount = {
      ...account,
      name: String(accountForm.name || "").trim(),
      organizationType: accountForm.organizationType
    };
    onUpdateAccount?.(nextAccount);
    setStep(2);
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Choose how you want to use EasyKhata and set the name you want shown across the app. You can fill the remaining details later from Khata.
            </div>
            <Field label="Usage Type" required hint="Choose the setup that matches how you plan to use EasyKhata.">
              <Select value={orgType} onChange={e => setAccountForm(current => ({ ...current, organizationType: e.target.value }))}>
                {selectableOrgTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div style={{ marginBottom: 16, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {selectableOrgTypeOptions.find(option => option.value === orgType)?.description}
            </div>
            <Field label={orgConfig.profileNameLabel} required>
              <Input
                placeholder={orgConfig.profileNamePlaceholder}
                value={accountForm.name || ""}
                onChange={e => setAccountForm(current => ({ ...current, name: e.target.value }))}
              />
            </Field>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-high)", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
              The rest of your profile details like phone, email, address, GST, and invoice preferences can be updated later from the Org tab.
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Here is the first thing to set up after this guide so the rest of the app has the right base data.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {isSmallBusinessOrg
                  ? "Add a service or package"
                  : `Add your first ${orgConfig.customerEntryLabel.toLowerCase()}`}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 12 }}>
                {orgType === ORG_TYPES.APARTMENT
                  ? "Create a flat or resident record first so collections and pending units are attached to actual homes."
                  : orgType === ORG_TYPES.PERSONAL
                    ? "Create at least one person first so earnings, spendings, and EMI entries can be linked correctly."
                    : orgType === ORG_TYPES.FREELANCER
                      ? "Create a client first so invoices and payment follow-up have a real customer record behind them."
                      : isSmallBusinessOrg
                        ? "Create a service first so khata, invoices, and work pricing stay consistent."
                        : `Create a ${orgConfig.customerEntryLabel.toLowerCase()} first so records stay organized from day one.`}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              After finishing this guide, open Org to complete that setup when you are ready.
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              {orgType === ORG_TYPES.APARTMENT
                ? "Finish setup and we'll open a ready dues form so you can record the first monthly collection in one step."
                : orgConfig.hideInvoices
                  ? `Finish setup and we'll open a ready ${orgConfig.incomeEntryLabel.toLowerCase()} form so you can add your first live record immediately.`
                  : `Finish setup and we'll open a ready ${orgConfig.invoiceEntryLabel.toLowerCase()} form so your first bill is created right away.`}
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Guided quickstart</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                {primaryQuickstartAction === "first-dues" ? (
                  <>
                    <div>• Open Income with a dues draft form</div>
                    <div>• Pick a flat and amount</div>
                    <div>• Save your first monthly maintenance entry</div>
                  </>
                ) : primaryQuickstartAction === "first-invoice" ? (
                  <>
                    <div>• Open Invoices with a new invoice draft</div>
                    <div>• Choose customer and add line items</div>
                    <div>• Save your first invoice in minutes</div>
                  </>
                ) : (
                  <>
                    <div>• Open Income with a new earning draft</div>
                    <div>• Fill amount and date</div>
                    <div>• Save your first entry</div>
                  </>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {primaryQuickstartAction === "first-dues"
                ? "Tap finish and you will be taken straight to the first dues form."
                : primaryQuickstartAction === "first-invoice"
                  ? "Tap finish and you will be taken straight to the first invoice form."
                  : "Tap finish and you will be taken straight to the first income form."}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
        zIndex: 1000
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .onboarding-modal {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div
        className="onboarding-modal"
        style={{
          background: "var(--bg)",
          width: "min(100%, 720px)",
          borderRadius: 16,
          maxHeight: "min(780px, calc(100dvh - 104px))",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.22)"
        }}
      >
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Setup Guide · Step {step} of {totalSteps}
            </div>
            <span style={{ width: 18, height: 18, display: "inline-block" }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stepTitles[step - 1]}</div>
        </div>

        <div style={{ padding: "20px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[...Array(totalSteps)].map((_, index) => (
                <div key={index} style={{ flex: 1, height: 4, borderRadius: 2, background: index < step ? "var(--accent)" : "var(--border)" }} />
              ))}
            </div>
          </div>

          {renderStepContent()}
        </div>

        <div
          style={{
            padding: "16px 18px calc(16px + env(safe-area-inset-bottom, 0px))",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            flexShrink: 0,
            background: "var(--bg)"
          }}
        >
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
              {primaryQuickstartAction === "first-dues" ? "Finish & Add First Dues" : primaryQuickstartAction === "first-invoice" ? "Finish & Create First Invoice" : "Finish & Add First Entry"}
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
