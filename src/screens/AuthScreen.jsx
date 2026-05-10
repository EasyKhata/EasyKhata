import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Field, Input, PhoneNumberInput, Select, Modal } from "../components/UI";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import { LEGAL_PATHS } from "../utils/legal";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  isValidUserPhoneNumber,
  isValidDateOfBirth,
  PHONE_COUNTRY_OPTIONS,
  COUNTRY_OPTIONS,
  MONTH_OPTIONS,
  getStateProvinceOptions,
  getBirthDayOptions,
  getBirthYearOptions,
  buildDateOfBirthFromParts,
  getAgeGroupFromDateOfBirth,
  sanitizePhoneDigits,
  sanitizeIndianPincode
} from "../utils/profile";
import { ORG_TYPES, ORG_TYPE_OPTIONS, getOrgConfig } from "../utils/orgTypes";

function friendlySetupError(message) {
  const text = String(message || "").trim();
  if (!text) return "Could not complete setup. Please try again.";
  if (/failed to fetch|network|load failed/i.test(text)) {
    return "Couldn't connect to EasyKhata. Please check your internet and try again.";
  }
  if (/session expired|not authenticated/i.test(text)) {
    return "Your sign-in session expired. Please go back and sign in again.";
  }
  return text;
}

// Google "G" logo SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ display: "block" }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

// Step indicator pill row — shows progress through the wizard.
function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: done || active ? "var(--accent)" : "var(--border)",
              opacity: active ? 1 : (done ? 0.6 : 1),
              transition: "background 0.2s, opacity 0.2s"
            }}
          />
        );
      })}
    </div>
  );
}

export default function AuthScreen() {
  const { signInWithGoogle, completeSetup, pendingSetup, logout } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Setup wizard state ─────────────────────────────────────────────────────
  // Step 1: phone, Step 2: khata type, Step 3: khata profile.
  // Returning users with a phone already on file skip step 1.
  const skipPhone = Boolean(pendingSetup?.skipPhoneStep);
  const [step, setStep] = useState(skipPhone ? 1 : 0);
  const totalSteps = 3;

  // Reset the wizard when the pendingSetup object changes (different user, etc.).
  useEffect(() => {
    setStep(skipPhone ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSetup?.firebaseUser?.uid]);

  const [phoneCountryCode, setPhoneCountryCode] = useState(
    pendingSetup?.existingPhoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
  );
  const [phoneNumber, setPhoneNumber] = useState(pendingSetup?.existingPhone || "");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const birthYearOptions = useMemo(() => getBirthYearOptions(), []);
  const birthDayOptions = useMemo(() => getBirthDayOptions(birthMonth, birthYear), [birthMonth, birthYear]);
  const [orgType, setOrgType] = useState(pendingSetup?.existingOrgType || ORG_TYPES.PERSONAL);
  const [orgProfile, setOrgProfile] = useState({
    name: "",
    addressLine: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",
    gstin: "",
    email: pendingSetup?.email || "",
    phone: ""
  });
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const orgConfig = useMemo(() => getOrgConfig(orgType), [orgType]);
  const stateOptions = useMemo(() => getStateProvinceOptions(orgProfile.country), [orgProfile.country]);
  // Apartment/freelancer orgs collect contact + GSTIN; household stays minimal.
  const isPersonalOrg = orgType === ORG_TYPES.PERSONAL;

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res?.error) setError(res.error);
    } finally {
      setLoading(false);
    }
  }

  function validatePhoneStep() {
    const cleanPhone = sanitizePhoneDigits(phoneNumber);
    if (!isValidUserPhoneNumber(cleanPhone)) {
      setSetupError("Enter a valid 10-digit phone number.");
      return false;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setSetupError("Please pick your date of birth.");
      return false;
    }
    const dob = buildDateOfBirthFromParts({ birthDay, birthMonth, birthYear });
    if (!isValidDateOfBirth(dob)) {
      setSetupError("That date of birth doesn't look right.");
      return false;
    }
    return true;
  }

  function validateProfileStep() {
    if (!orgProfile.name.trim()) {
      setSetupError(`Please enter your ${orgConfig.profileNameLabel.toLowerCase()}.`);
      return false;
    }
    if (!orgProfile.addressLine.trim()) {
      setSetupError("Please enter an address.");
      return false;
    }
    if (!orgProfile.city.trim()) {
      setSetupError("Please enter a city.");
      return false;
    }
    if (!orgProfile.state.trim()) {
      setSetupError("Please pick a state.");
      return false;
    }
    if (!orgProfile.pincode.trim() || orgProfile.pincode.length < 4) {
      setSetupError("Please enter a valid pincode.");
      return false;
    }
    return true;
  }

  function handleNext() {
    setSetupError("");
    if (step === 0 && !validatePhoneStep()) return;
    setStep(s => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setSetupError("");
    setStep(s => Math.max(s - 1, skipPhone ? 1 : 0));
  }

  async function handleSubmit() {
    setSetupError("");
    if (!validateProfileStep()) return;
    setSetupLoading(true);
    try {
      const cleanPhone = sanitizePhoneDigits(phoneNumber);
      const dateOfBirth = buildDateOfBirthFromParts({ birthDay, birthMonth, birthYear });
      const res = await completeSetup({
        phone: cleanPhone,
        phoneCountryCode,
        dateOfBirth,
        ageGroup: getAgeGroupFromDateOfBirth(dateOfBirth),
        organizationType: orgType,
        orgProfile: {
          ...orgProfile,
          name: orgProfile.name.trim(),
          addressLine: orgProfile.addressLine.trim(),
          city: orgProfile.city.trim(),
          district: orgProfile.district.trim(),
          state: orgProfile.state.trim(),
          pincode: orgProfile.pincode.trim()
        }
      });
      if (res?.error) setSetupError(friendlySetupError(res.error));
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleExitSetup() {
    if (setupLoading) return;
    setSetupError("");
    await logout();
  }

  // ── Setup wizard ───────────────────────────────────────────────────────────
  if (pendingSetup) {
    const isLastStep = step === totalSteps - 1;
    const stepTitles = [
      "Tell us about you",
      "What is this Khata for?",
      "Set up your Khata"
    ];
    const stepNames = ["About you", "Khata type", "Khata profile"];

    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, var(--bg)) 0%, var(--bg) 100%)", padding: 20 }}>
        <Modal
          title={stepTitles[step]}
          onClose={handleExitSetup}
          onSave={isLastStep ? handleSubmit : handleNext}
          saveLabel={
            setupLoading
              ? "Setting up..."
              : isLastStep
                ? "Get Started"
                : "Continue"
          }
          canSave={!setupLoading}
        >
          <StepIndicator current={step} total={totalSteps} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
            Step {step + 1} of {totalSteps} · {stepNames[step]}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 16, lineHeight: 1.6 }}>
            Signed in as <b>{pendingSetup.email}</b>.
          </div>

          {/* ── Step 0: Phone + Date of birth ──────────────────────────── */}
          {step === 0 && (
            <>
              <Field label="Phone Number" required hint="Used for payment receipts and support.">
                <PhoneNumberInput
                  countryCode={phoneCountryCode}
                  phoneNumber={phoneNumber}
                  onCountryCodeChange={setPhoneCountryCode}
                  onPhoneNumberChange={setPhoneNumber}
                  countryOptions={PHONE_COUNTRY_OPTIONS}
                  phonePlaceholder="9876543210"
                />
              </Field>

              <Field label="Date of Birth" required hint="Helps us tailor reminders and offers — never shown publicly.">
                <div className="desktop-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Select
                    value={birthDay}
                    onChange={e => setBirthDay(e.target.value)}
                  >
                    <option value="">Day</option>
                    {birthDayOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                  <Select
                    value={birthMonth}
                    onChange={e => setBirthMonth(e.target.value)}
                  >
                    <option value="">Month</option>
                    {MONTH_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <Select
                    value={birthYear}
                    onChange={e => setBirthYear(e.target.value)}
                  >
                    <option value="">Year</option>
                    {birthYearOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </div>
              </Field>
            </>
          )}

          {/* ── Step 1: Khata type ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 12, lineHeight: 1.6 }}>
                Pick the option that best fits how you'll use this Khata. You can create more later.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ORG_TYPE_OPTIONS.map(option => {
                  const selected = orgType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setOrgType(option.value)}
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
                        borderRadius: 14,
                        border: `1.5px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                        background: selected ? "color-mix(in srgb, var(--accent) 8%, var(--surface-high))" : "var(--surface-high)",
                        color: "var(--text)",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{option.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>{option.description}</div>
                    </button>
                  );
                })}
              </div>
              {orgType !== ORG_TYPES.PERSONAL && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--surface-high)", borderRadius: 10, fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6 }}>
                  Includes a 30-day Pro trial. No payment needed up front.
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Khata profile ──────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 16, lineHeight: 1.6 }}>
                {orgConfig.accountIntro}
              </div>

              <Field label={orgConfig.profileNameLabel} required>
                <Input
                  placeholder={orgConfig.profileNamePlaceholder}
                  value={orgProfile.name}
                  onChange={e => setOrgProfile(p => ({ ...p, name: e.target.value }))}
                />
              </Field>

              <Field label="Address" required hint="Society name, street, area, and any landmark.">
                <Input
                  placeholder="Lake View Residency, MG Road, Hyderabad"
                  value={orgProfile.addressLine}
                  onChange={e => setOrgProfile(p => ({ ...p, addressLine: e.target.value }))}
                  autoComplete="street-address"
                />
              </Field>

              <div className="desktop-grid-2">
                <Field label="City" required>
                  <Input
                    placeholder="Hyderabad"
                    value={orgProfile.city}
                    onChange={e => setOrgProfile(p => ({ ...p, city: e.target.value }))}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="District">
                  <Input
                    placeholder="Hyderabad"
                    value={orgProfile.district}
                    onChange={e => setOrgProfile(p => ({ ...p, district: e.target.value }))}
                    autoComplete="address-level2"
                  />
                </Field>
              </div>

              <div className="desktop-grid-2">
                <Field label="State" required>
                  <Select
                    value={orgProfile.state}
                    onChange={e => setOrgProfile(p => ({ ...p, state: e.target.value }))}
                  >
                    <option value="">Select state</option>
                    {stateOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pincode" required>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="500081"
                    value={orgProfile.pincode}
                    onChange={e => setOrgProfile(p => ({ ...p, pincode: sanitizeIndianPincode(e.target.value) }))}
                    autoComplete="postal-code"
                  />
                </Field>
              </div>

              {!isPersonalOrg && (
                <Field label="GSTIN (optional)" hint="Add now or later from Settings.">
                  <Input
                    placeholder="22AAAAA0000A1Z5"
                    value={orgProfile.gstin}
                    onChange={e => setOrgProfile(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                  />
                </Field>
              )}
            </div>
          )}

          {setupError && (
            <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 12, lineHeight: 1.5 }}>
              {setupError}
            </div>
          )}

          {/* Back button — shown on steps after the first usable step. */}
          {step > (skipPhone ? 1 : 0) && !setupLoading && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                marginTop: 14,
                width: "100%",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--text-sec)",
                cursor: "pointer"
              }}
            >
              ← Back
            </button>
          )}

          {step === 0 && (
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 16, lineHeight: 1.6 }}>
              By continuing you agree to our{" "}
              <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Terms</a>
              {" "}and{" "}
              <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // Main sign-in screen
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, var(--bg)) 0%, var(--bg) 100%)", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <BrandLogo size={64} pulse style={{ marginBottom: 18 }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Continue to EazyKhata</div>
          <div style={{ fontSize: 14, color: "var(--text-sec)", textAlign: "center", lineHeight: 1.7, maxWidth: 320 }}>
            Track income, expenses, invoices, and EMIs for your household, freelance work, or apartment society from one account.
          </div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 24, padding: 20, boxShadow: "0 18px 40px rgba(12, 20, 38, 0.08)" }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "16px 20px",
              background: "var(--surface-high)",
              border: "1.5px solid var(--border)",
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "background 0.15s"
            }}
          >
            <GoogleIcon />
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.7 }}>
            Household Khata is free forever. Add one extra Freelancer or Apartment workspace later if you need it.
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--danger)", textAlign: "center", lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 11, color: "var(--text-dim)", textAlign: "center", lineHeight: 1.7 }}>
          By signing in you agree to our{" "}
          <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Terms of Service</a>
          {" "}and{" "}
          <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
