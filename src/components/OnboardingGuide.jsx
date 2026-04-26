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

  useEffect(() => {
    setAccountForm(current => ({
      ...buildAccountFormState(account),
      secondaryOrgType: current?.secondaryOrgType || ORG_TYPES.FREELANCER,
      secondaryOrgName: current?.secondaryOrgName || ""
    }));
  }, [account?.name]);

  if (!isOpen) return null;

  async function finishCreate() {
    const secondaryName = String(accountForm.secondaryOrgName || "").trim();
    if (!secondaryName) {
      alert(`Please enter a name for your ${secondaryOrgConfig.orgLabel || "second"} Khata.`);
      return;
    }
    const result = await onCreateOrganization?.({
      organizationType: secondaryOrgType,
      name: secondaryName
    });
    if (result?.error) {
      alert(result.error);
      return;
    }
    await onComplete?.();
    onNavigate?.({ tab: "dashboard" });
  }

  async function skipSecondary() {
    const householdName = String(accountForm.name || "").trim();
    if (!householdName) {
      alert(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return;
    }
    onUpdateAccount?.({
      ...account,
      name: householdName,
      organizationType: ORG_TYPES.PERSONAL
    });
    await onComplete?.();
    onNavigate?.({ tab: "dashboard" });
  }

  function continueFromStepOne() {
    const householdName = String(accountForm.name || "").trim();
    if (!householdName) {
      alert(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return;
    }
    onUpdateAccount?.({
      ...account,
      name: householdName,
      organizationType: ORG_TYPES.PERSONAL
    });
    setStep(2);
  }

  function renderStepContent() {
    if (step === 1) {
      return (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
            Your account already includes one permanent Household Khata. You can add one extra work Khata now, or skip and create it later from New Khata.
          </div>
          <Field label={orgConfig.profileNameLabel} required hint="This Household Khata always stays with your account.">
            <Input
              placeholder={orgConfig.profileNamePlaceholder}
              value={accountForm.name || ""}
              onChange={event => setAccountForm(current => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Second Khata Type" required hint="Pick the extra workspace you want beyond Household.">
            <Select
              value={secondaryOrgType}
              onChange={event => setAccountForm(current => ({ ...current, secondaryOrgType: event.target.value }))}
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
              onChange={event => setAccountForm(current => ({ ...current, secondaryOrgName: event.target.value }))}
            />
          </Field>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-high)", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
            Household always stays with your account. Your second Khata is optional and can later switch between Freelancer and Apartment.
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div>
          <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
            Here is how your account will be organized after onboarding.
          </div>
          <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Household + {secondaryOrgConfig.orgLabel || "Second Khata"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7 }}>
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
    }

    return (
      <div>
        <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
          Finish setup and we’ll create your second Khata automatically, or skip and start with Household only.
        </div>
        <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What happens next</div>
          <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8 }}>
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
  }

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
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
            Setup Guide · Step {step} of {totalSteps}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
            {step === 1 ? "Set Up Your Household" : step === 2 ? "Review Your Khatas" : `Create Your ${secondaryOrgConfig.orgLabel || "Second"} Workspace`}
          </div>
        </div>

        <div style={{ padding: "20px 18px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[...Array(totalSteps)].map((_, index) => (
              <div key={index} style={{ flex: 1, height: 4, borderRadius: 2, background: index < step ? "var(--accent)" : "var(--border)" }} />
            ))}
          </div>
          {renderStepContent()}
        </div>

        <div style={{ padding: "16px 18px calc(16px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "var(--bg)" }}>
          {step > 1 && (
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step === 1 ? (
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={skipSecondary}>Skip for now</button>
              <button className="btn-primary" style={{ flex: 1.35 }} onClick={continueFromStepOne}>Continue</button>
            </>
          ) : step === 2 ? (
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={skipSecondary}>Skip for now</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Next</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={skipSecondary}>Skip for now</button>
              <button className="btn-primary" style={{ flex: 1.2 }} onClick={finishCreate}>Finish & Create Second Khata</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
