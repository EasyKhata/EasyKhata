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
  const totalSteps = 4;
  const isLastStep = step === totalSteps;
  const isSmallBusinessOrg = orgType === ORG_TYPES.SMALL_BUSINESS;
  const isRetailOrg = orgType === ORG_TYPES.RETAIL;

  useEffect(() => {
    setAccountForm(buildAccountFormState(account, user));
  }, [account?.name, account?.organizationType, user?.organizationType]);

  async function completeOnboarding() {
    await onComplete?.();
  }

  const stepTitles = [
    `Set Your ${orgConfig.profileNameLabel}`,
    `Review Your ${orgConfig.orgLabel || "Org"} Setup`,
    orgConfig.hideInvoices ? `Understand ${orgConfig.incomeLabel}` : `Understand ${orgConfig.invoicesLabel}`,
    `Understand ${orgConfig.expensesLabel}`
  ];

  function handleNext() {
    if (isLastStep) {
      completeOnboarding();
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
              Choose how you want to use EasyKhata and set the name you want shown across the app. You can fill the remaining details later from Org.
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
                  : isRetailOrg
                    ? "Add a product to inventory"
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
                        : isRetailOrg
                          ? "Create an inventory item first so shop sales and stock tracking start from real products."
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
              {orgConfig.hideInvoices
                ? `Ready to track your first ${orgConfig.incomeEntryLabel.toLowerCase()}?`
                : `Ready to create your first ${orgConfig.invoiceEntryLabel.toLowerCase()}?`}
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                {orgConfig.hideInvoices ? (
                  <>
                    {isRetailOrg ? (
                      <>
                        <div>• Pick a product or basket from inventory</div>
                        <div>• Enter the sale amount, quantity, and date</div>
                        <div>• Keep daily shop sales ready for dashboard tracking</div>
                      </>
                    ) : (
                      <>
                        <div>• Add the amount you received</div>
                        <div>• Set the date and earning type</div>
                        <div>• Keep the entry ready for dashboard tracking</div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div>• Select a {orgConfig.customerEntryLabel.toLowerCase()}</div>
                    <div>• Add items with description, quantity, and rate</div>
                    <div>• Set due dates and taxes if needed</div>
                    <div>{isSmallBusinessOrg ? "Save an invoice your customer can pay against" : "Save a professional invoice"}</div>
                  </>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              You will be able to open {orgConfig.hideInvoices ? orgConfig.incomeLabel : orgConfig.invoicesLabel} from the main tabs after setup.
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              {isSmallBusinessOrg
                ? `Finally, record your first ${orgConfig.expensesEntryLabel.toLowerCase()} so the dashboard can compare sales against real operating costs like rent, payroll, or supplies.`
                : isRetailOrg
                  ? `Finally, record your first ${orgConfig.expensesEntryLabel.toLowerCase()} so the dashboard can compare shop sales against stock buying and running costs.`
                : `Finally, record your first ${orgConfig.expensesEntryLabel.toLowerCase()} so your dashboard can start comparing inflow and outflow.`}
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                <div>• Add the amount and date</div>
                <div>• Choose the best category</div>
                <div>• Add any extra notes you need later</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              Finish this guide and then use the main tabs to start adding live records.
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
