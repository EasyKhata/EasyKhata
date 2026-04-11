import React, { useEffect, useMemo, useState } from "react";
import { Field, Input, PhoneNumberInput, Select } from "./UI";
import { buildLocationLabel, buildPhoneNumber, COUNTRY_OPTIONS, DEFAULT_PHONE_COUNTRY_CODE, getStateProvinceOptions, isValidUserPhoneNumber, parseLocationFields, PHONE_COUNTRY_OPTIONS, sanitizePhoneDigits, splitPhoneNumber } from "../utils/profile";
import { ORG_TYPES, ORG_TYPE_OPTIONS, getOrgConfig, getOrgType } from "../utils/orgTypes";

function buildAccountFormState(account, user) {
  const parsedLocation = parseLocationFields(account?.location || account?.address || "");
  const phoneParts = splitPhoneNumber(account?.phone || "", account?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
  const addressLine = account?.addressLine || parsedLocation.addressLine || "";
  const city = account?.city || parsedLocation.city || "";
  const state = account?.state || parsedLocation.state || "";
  const country = account?.country || parsedLocation.country || "India";
  const location = account?.location || buildLocationLabel({ city, state, country });
  return {
    name: account?.name || "",
    addressLine,
    city,
    state,
    country,
    location,
    address: account?.address || buildLocationLabel({ addressLine, city, state, country }),
    gstin: account?.gstin || "",
    phone: account?.phone || "",
    phoneCountryCode: account?.phoneCountryCode || phoneParts.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    phoneNumber: phoneParts.phoneNumber,
    email: account?.email || user?.email || "",
    showHSN: Boolean(account?.showHSN),
    organizationType: getOrgType(account?.organizationType || user?.organizationType)
  };
}

function getSetupStep(orgType, orgConfig) {
  if (orgType === ORG_TYPES.SMALL_BUSINESS) {
    return {
      title: "Add Your First Service",
      intro: "Add a core service or package first so quotes, receipts, and client invoices follow the same structure from the start.",
      cardTitle: "Ready to add a service?",
      cardBody: "Create one service or package in Settings so pricing, team planning, and future quotes stay consistent.",
      ctaLabel: "Go to Services",
      destination: { tab: "org", screen: "org-records", orgSectionKey: "services" },
      revisitLabel: "services"
    };
  }

  if (orgType === ORG_TYPES.RETAIL) {
    return {
      title: "Add Your First Product",
      intro: "Add a product first so daily sales, stock value, and low-stock alerts have a real inventory base to work from.",
      cardTitle: "Ready to add a product?",
      cardBody: "Create one inventory item with price and stock so shop sales and purchase tracking are easier from day one.",
      ctaLabel: "Go to Inventory",
      destination: { tab: "org", screen: "org-records", orgSectionKey: "inventory" },
      revisitLabel: "inventory"
    };
  }

  return {
    title: `Add Your First ${orgConfig.customerEntryLabel}`,
    intro:
      orgType === ORG_TYPES.APARTMENT
        ? "Add your first flat or resident record so collections, dues, and society tracking all start from a clean unit list."
        : orgType === ORG_TYPES.PERSONAL
          ? "Add your first person so household entries, lending records, and tagged spending stay organized from the beginning."
          : orgType === ORG_TYPES.FREELANCER
            ? "Add your first client so invoices, follow-ups, and payment history start with a clean client record."
            : `Add your first ${orgConfig.customerEntryLabel.toLowerCase()}. You can always add more from Settings later.`,
    cardTitle: `Ready to add a ${orgConfig.customerEntryLabel.toLowerCase()}?`,
    cardBody:
      orgType === ORG_TYPES.APARTMENT
        ? "Start with a flat or resident record so collections and pending units stay organized month by month."
        : orgType === ORG_TYPES.PERSONAL
          ? "Add a household member or contact so earnings, spending, and borrow or lend tracking can stay attached to real people."
          : orgType === ORG_TYPES.FREELANCER
            ? "Start with a real client record so invoices, payment follow-up, and work history stay organized from day one."
            : "You will enter details like name, email, phone, and location so your records stay organized.",
    ctaLabel: `Go to ${orgConfig.customerLabel}`,
    destination: { tab: "org", screen: "customers" },
    revisitLabel: orgConfig.customerLabel.toLowerCase()
  };
}

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, user, account, onUpdateAccount }) {
  const [step, setStep] = useState(1);
  const [accountForm, setAccountForm] = useState(buildAccountFormState(account, user));
  const orgType = getOrgType(accountForm.organizationType || user?.organizationType || account?.organizationType);
  const orgConfig = useMemo(() => getOrgConfig(orgType), [orgType]);
  const showOrgBusinessFields = orgType !== ORG_TYPES.PERSONAL;
  const stateProvinceOptions = useMemo(() => getStateProvinceOptions(accountForm.country), [accountForm.country]);
  const setupStep = useMemo(() => getSetupStep(orgType, orgConfig), [orgConfig, orgType]);

  useEffect(() => {
    setAccountForm(buildAccountFormState(account, user));
  }, [account?.address, account?.addressLine, account?.city, account?.country, account?.email, account?.gstin, account?.location, account?.name, account?.organizationType, account?.phone, account?.showHSN, account?.state, user?.email, user?.organizationType]);

  useEffect(() => {
    if (accountForm.state && !stateProvinceOptions.includes(accountForm.state)) {
      setAccountForm(current => ({ ...current, state: "" }));
    }
  }, [accountForm.state, stateProvinceOptions]);

  const isSmallBusinessOrg = orgType === ORG_TYPES.SMALL_BUSINESS;
  const isRetailOrg = orgType === ORG_TYPES.RETAIL;
  const totalSteps = 4;
  const isLastStep = step === totalSteps;
  const stepTitles = [
    `Set Your ${orgConfig.profileNameLabel}`,
    setupStep.title,
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
    if (!String(accountForm.city || "").trim() || !String(accountForm.state || "").trim() || !String(accountForm.country || "").trim()) {
      alert("Please enter city, state, and country for your organization profile.");
      return;
    }
    const cleanPhoneNumber = sanitizePhoneDigits(accountForm.phoneNumber);
    if (showOrgBusinessFields && cleanPhoneNumber && !isValidUserPhoneNumber(cleanPhoneNumber)) {
      alert("Please enter a valid phone number.");
      return;
    }
    const nextAccount = {
      ...accountForm,
      addressLine: String(accountForm.addressLine || "").trim(),
      city: String(accountForm.city || "").trim(),
      state: String(accountForm.state || "").trim(),
      country: String(accountForm.country || "").trim(),
      gstin: showOrgBusinessFields ? String(accountForm.gstin || "").trim() : "",
      email: showOrgBusinessFields ? String(accountForm.email || "").trim() : "",
      showHSN: showOrgBusinessFields ? Boolean(accountForm.showHSN) : false,
      phoneCountryCode: accountForm.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
      phone: showOrgBusinessFields ? buildPhoneNumber(accountForm.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE, cleanPhoneNumber) : ""
    };
    nextAccount.location = buildLocationLabel({ city: nextAccount.city, state: nextAccount.state, country: nextAccount.country });
    nextAccount.address = buildLocationLabel(nextAccount);
    onUpdateAccount?.(nextAccount);
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
            {showOrgBusinessFields && <Field label="GSTIN">
              <Input
                placeholder="Your GST registration number"
                value={accountForm.gstin || ""}
                onChange={e => setAccountForm(current => ({ ...current, gstin: e.target.value }))}
              />
            </Field>}
            <Field label="Address Line" hint="House number, street, road, or locality.">
              <Input
                placeholder="Flat 12, MG Road"
                value={accountForm.addressLine || ""}
                onChange={e => setAccountForm(current => ({ ...current, addressLine: e.target.value }))}
                autoComplete="address-line1"
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="City" required>
                <Input
                  placeholder="Hyderabad"
                  value={accountForm.city || ""}
                  onChange={e => setAccountForm(current => ({ ...current, city: e.target.value }))}
                />
              </Field>
              <Field label="Country" required>
                <Select value={accountForm.country || "India"} onChange={e => setAccountForm(current => ({ ...current, country: e.target.value }))}>
                  {COUNTRY_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="State / Province" required>
              <Select value={accountForm.state || ""} onChange={e => setAccountForm(current => ({ ...current, state: e.target.value }))}>
                <option value="">Select state / province</option>
                {stateProvinceOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            {showOrgBusinessFields && <Field label="Phone">
              <PhoneNumberInput
                countryCode={accountForm.phoneCountryCode}
                phoneNumber={accountForm.phoneNumber}
                onCountryCodeChange={value => setAccountForm(current => ({ ...current, phoneCountryCode: value }))}
                onPhoneNumberChange={value => setAccountForm(current => ({ ...current, phoneNumber: value }))}
                countryOptions={PHONE_COUNTRY_OPTIONS}
                phonePlaceholder="9876543210"
              />
            </Field>}
            {showOrgBusinessFields && <Field label="Email">
              <Input
                type="email"
                placeholder="you@example.com"
                value={accountForm.email || ""}
                onChange={e => setAccountForm(current => ({ ...current, email: e.target.value }))}
              />
            </Field>}
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              {setupStep.intro}
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {setupStep.cardTitle}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 12 }}>
                {setupStep.cardBody}
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate(setupStep.destination);
                }}
              >
                {setupStep.ctaLabel}
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              You can revisit {setupStep.revisitLabel} anytime from Org.
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
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate(orgConfig.hideInvoices ? "income" : "invoices");
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
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("expenses");
                  handleNext();
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
