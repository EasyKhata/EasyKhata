import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Field, Input, PhoneNumberInput, Select, Modal } from "../components/UI";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import { ORG_TYPES, getSelectableOrgTypeOptions } from "../utils/orgTypes";
import { LEGAL_PATHS } from "../utils/legal";
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  isValidUserPhoneNumber,
  PHONE_COUNTRY_OPTIONS,
  sanitizePhoneDigits
} from "../utils/profile";

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

export default function AuthScreen() {
  const { signInWithGoogle, completeSetup, pendingSetup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // First-time setup form state
  const [orgType, setOrgType] = useState(ORG_TYPES.SMALL_BUSINESS);
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  const orgTypeOptions = useMemo(() => getSelectableOrgTypeOptions(orgType), [orgType]);
  const selectedOrgDesc = useMemo(
    () => orgTypeOptions.find(o => o.value === orgType)?.description || "",
    [orgType, orgTypeOptions]
  );

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

  async function handleCompleteSetup() {
    setSetupError("");
    const cleanPhone = sanitizePhoneDigits(phoneNumber);
    if (!isValidUserPhoneNumber(cleanPhone)) {
      setSetupError("Enter a valid 10-digit phone number.");
      return;
    }
    setSetupLoading(true);
    try {
      const res = await completeSetup({ organizationType: orgType, phone: cleanPhone, phoneCountryCode });
      if (res?.error) setSetupError(res.error);
    } finally {
      setSetupLoading(false);
    }
  }

  // First-time setup modal
  if (pendingSetup) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
        <Modal
          title="Welcome to EasyKhata"
          onClose={null}
          onSave={handleCompleteSetup}
          saveLabel={setupLoading ? "Setting up..." : "Get Started"}
          canSave={!setupLoading}
        >
          <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 16, lineHeight: 1.6 }}>
            Signed in as <b>{pendingSetup.email}</b>. Tell us how you'll use EasyKhata.
          </div>

          <Field label="How will you use EasyKhata?" required hint={selectedOrgDesc}>
            <Select value={orgType} onChange={e => setOrgType(e.target.value)}>
              {orgTypeOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>

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

          {setupError && (
            <div style={{ fontSize: 13, color: "var(--danger)", marginTop: 8 }}>{setupError}</div>
          )}

          <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 16, lineHeight: 1.6 }}>
            By continuing you agree to our{" "}
            <a href={LEGAL_PATHS.terms} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Terms</a>
            {" "}and{" "}
            <a href={LEGAL_PATHS.privacy} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
          </div>
        </Modal>
      </div>
    );
  }

  // Main sign-in screen
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <BrandLogo size={56} style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>{APP_NAME}</div>
          <div style={{ fontSize: 14, color: "var(--text-sec)", marginTop: 6 }}>{APP_TAGLINE}</div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "14px 20px",
            background: "var(--surface-high)",
            border: "1.5px solid var(--border)",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.15s"
          }}
        >
          <GoogleIcon />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

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
