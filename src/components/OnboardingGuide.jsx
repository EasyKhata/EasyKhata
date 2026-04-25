import React, { useEffect, useMemo, useState } from "react";
import { Field, Input, Select } from "./UI";
import { ORG_TYPES, getOrgConfig, getOrgType, getSecondaryOrgTypeOptions } from "../utils/orgTypes";

function buildAccountFormState(account) {
  return {
    name: account?.name || "",
    secondaryOrgType: ORG_TYPES.FREELANCER,
    secondaryOrgName: ""
  };
}

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, account, onUpdateAccount, onCreateOrganization }) {
  const [step, setStep] = useState(1);
  const [accountForm, setAccountForm] = useState(buildAccountFormState(account));
  const orgConfig = useMemo(() => getOrgConfig(ORG_TYPES.PERSONAL), []);
  const secondaryOrgType = getOrgType(accountForm.secondaryOrgType || ORG_TYPES.FREELANCER);
  const secondaryOrgConfig = useMemo(() => getOrgConfig(secondaryOrgType), [secondaryOrgType]);
  const selectableOrgTypeOptions = useMemo(() => getSecondaryOrgTypeOptions(secondaryOrgType), [secondaryOrgType]);
  const totalSteps = 3;
  const isLastStep = step === totalSteps;

  useEffect(() => {
    setAccountForm(current => ({
      ...buildAccountFormState(account),
      secondaryOrgType: current?.secondaryOrgType || ORG_TYPES.FREELANCER,
      secondaryOrgName: current?.secondaryOrgName || ""
    }));
  }, [account?.name]);

  async function completeOnboarding() {
    const secondaryName = String(accountForm.secondaryOrgName || "").trim();
    if (!secondaryName) {
      alert(`Please enter a name for your ${secondaryOrgConfig.orgLabel || "second"} Khata.`);
      return false;
    }
    const result = await onCreateOrganization?.({
      organizationType: secondaryOrgType,
      name: secondaryName
    });
    if (result?.error) {
      alert(result.error);
      return false;
    }
    await onComplete?.();
    return true;
  }

  async function skipSecondaryKhata() {
    await onComplete?.();
    onNavigate?.({ tab: "dashboard" });
  }

  const stepTitles = [
    "Choose Your Second Khata",
    "Review Both Khatas",
    `Create Your ${secondaryOrgConfig.orgLabel || "Second"} Workspace`
  ];

  async function handleNext() {
    if (isLastStep) {
      const success = await completeOnboarding();
      if (success) onNavigate?.({ tab: "dashboard" });
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
    onUpdateAccount?.({
      ...account,
      name: String(accountForm.name || "").trim(),
      organizationType: ORG_TYPES.PERSONAL
    });
    setStep(2);
  }

  async function saveAccountAndSkip() {
    if (!String(accountForm.name || "").trim()) {
      alert(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return;
    }
    onUpdateAccount?.({
      ...account,
      name: String(accountForm.name || "").trim(),
      organizationType: ORG_TYPES.PERSONAL
    });
    await skipSecondaryKhata();
  }

  function renderStepContent() {
    switch (step) {
      case 1:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Every account gets one permanent Household Khata by default. You can add one extra workspace alongside it now, or skip and create it later from New Khata.
            </div>
            <Field label={orgConfig.profileNameLabel} required hint="This default Household Khata always stays with your account.">
              <Input
                placeholder={orgConfig.profileNamePlaceholder}
                value={accountForm.name || ""}
                onChange={e => setAccountForm(current => ({ ...current, name: e.target.value }))}
              />
            </Field>
            <Field label="Second Khata Type" required hint="Pick the extra workspace you want beyond Household.">
              <Select
                value={secondaryOrgType}
                onChange={e => setAccountForm(current => ({ ...current, secondaryOrgType: e.target.value }))}
              >
                {selectableOrgTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            <div style={{ marginBottom: 16, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {selectableOrgTypeOptions.find(option => option.value === secondaryOrgType)?.description}
            </div>
            <Field label={`${secondaryOrgConfig.orgLabel || "Second"} Khata Name`} required>
              <Input
                placeholder={secondaryOrgConfig.profileNamePlaceholder}
                value={accountForm.secondaryOrgName || ""}
                onChange={e => setAccountForm(current => ({ ...current, secondaryOrgName: e.target.value }))}
              />
            </Field>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-high)", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
              Household cannot be deleted or changed later. Your second Khata is optional, and if you create it, it can later switch between Freelancer and Apartment.
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Here is how your account will be organized after onboarding.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Household + {secondaryOrgConfig.orgLabel || "Second Khata"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 12 }}>
                <div>• Household stays permanent as your personal/home workspace.</div>
                <div>• {secondaryOrgConfig.orgLabel || "Second Khata"} becomes your flexible second workspace.</div>
                <div>• You can skip this now and add that second Khata later from New Khata.</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              You can manage both Khatas from the header switcher and Org settings.
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Finish setup and we’ll create your second Khata automatically, or skip and start with Household only.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What happens next</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                <div>• Your Household Khata stays as the permanent default.</div>
                <div>• A new {secondaryOrgConfig.orgLabel || "second"} Khata is created with the name you entered.</div>
                <div>• You can switch between both workspaces anytime from the header.</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              Tap finish to create your second Khata and complete onboarding.
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
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={saveAccountAndSkip}>
                Skip for now
              </button>
              <button className="btn-primary" style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }} onClick={saveAccountAndContinue}>
                Continue
              </button>
            </>
          ) : isLastStep ? (
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={skipSecondaryKhata}>
                Skip for now
              </button>
              <button className="btn-primary" style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }} onClick={handleNext}>
                Finish & Create Second Khata
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={skipSecondaryKhata}>
                Skip for now
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleNext}>
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
