import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Field, Input, PhoneNumberInput, Select } from "../components/UI";
import { isStrongPassword, isValidEmail, isValidName, normalizeEmail } from "../utils/validator";
import BrandLogo from "../components/BrandLogo";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import { ORG_TYPES, getSelectableOrgTypeOptions } from "../utils/orgTypes";
import {
  buildDateOfBirthFromParts,
  buildPhoneNumber,
  COUNTRY_OPTIONS,
  DEFAULT_PHONE_COUNTRY_CODE,
  getBirthDayOptions,
  getBirthYearOptions,
  getStateProvinceOptions,
  isValidDateOfBirth,
  isValidUserPhoneNumber,
  MONTH_OPTIONS,
  PHONE_COUNTRY_OPTIONS,
  parseDateOfBirthParts,
  sanitizePhoneDigits
} from "../utils/profile";

const GENDER_OPTIONS = ["", "Female", "Male", "Non-binary", "Other", "Prefer not to say"];

export default function AuthScreen() {
  const { login, register, forgotPassword, resendVerification } = useAuth();
  const [screen, setScreen] = useState("login");
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [organizationType, setOrganizationType] = useState(ORG_TYPES.SMALL_BUSINESS);
  const [email, setEmail] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const stateOptions = useMemo(() => getStateProvinceOptions(country), [country]);
  const birthYearOptions = useMemo(() => getBirthYearOptions(), []);
  const birthDayOptions = useMemo(() => getBirthDayOptions(birthMonth, birthYear), [birthMonth, birthYear]);
  const selectableOrgTypeOptions = useMemo(() => getSelectableOrgTypeOptions(organizationType), [organizationType]);

  // Password strength indicator
  const passStrength = password ? {
    length: password.length >= 8 ? "strong" : password.length >= 6 ? "medium" : "weak",
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password),
  } : null;

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function switchScreen(nextScreen) {
    setScreen(nextScreen);
    resetMessages();
  }

  useEffect(() => {
    if (stateName && !stateOptions.includes(stateName)) {
      setStateName("");
    }
  }, [stateName, stateOptions]);

  useEffect(() => {
    if (birthDay && !birthDayOptions.includes(birthDay)) {
      setBirthDay("");
    }
  }, [birthDay, birthDayOptions]);

  async function handleLogin() {
    resetMessages();
    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const res = await login(cleanEmail, password);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      if (res.error.toLowerCase().includes("verify")) {
        setInfo("If the verification email hasn't arrived yet, you can resend it below.");
      }
    }
  }

  async function handleRegister() {
    resetMessages();
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPhoneNumber = sanitizePhoneDigits(phoneNumber);
    const cleanPhone = buildPhoneNumber(phoneCountryCode, cleanPhoneNumber);
    const cleanDateOfBirth = buildDateOfBirthFromParts({ birthDay, birthMonth, birthYear });
    const cleanAddressLine = String(addressLine || "").trim();
    const cleanCity = String(city || "").trim();
    const cleanState = String(stateName || "").trim();
    const cleanCountry = String(country || "").trim();
    const cleanGender = String(gender || "").trim();

    if (!isValidName(cleanName)) {
      setError("Please enter your full name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isValidUserPhoneNumber(cleanPhoneNumber)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (!isValidDateOfBirth(cleanDateOfBirth)) {
      setError("Please enter a valid date of birth. Users must be at least 13 years old.");
      return;
    }

    if (!cleanCity || !cleanState || !cleanCountry) {
      setError("Please enter your city, state, and country.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your password and confirmation do not match.");
      return;
    }

    setLoading(true);
    const res = await register(
      {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        phoneCountryCode,
        organizationType,
        dateOfBirth: cleanDateOfBirth,
        gender: cleanGender,
        addressLine: cleanAddressLine,
        city: cleanCity,
        state: cleanState,
        country: cleanCountry
      },
      password
    );
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setInfo(res?.message || "Account created successfully.");
    setPassword("");
    setConfirmPassword("");
    setPhoneNumber("");
    setBirthDay("");
    setBirthMonth("");
    setBirthYear("");
    setScreen("login");
  }

  async function handleForgot() {
    resetMessages();
    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter the email address linked to your account.");
      return;
    }

    setLoading(true);
    const res = await forgotPassword(cleanEmail);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setInfo(res?.message || "Please check your inbox for the reset email.");
  }

  async function handleResendVerification() {
    resetMessages();
    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError("Enter the same email address you used to create your account.");
      return;
    }

    if (!password) {
      setError("Enter your password so we can resend the verification email securely.");
      return;
    }

    setResending(true);
    const res = await resendVerification(cleanEmail, password);
    setResending(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setInfo(res?.message || "Verification email sent.");
  }

  const showResend = screen === "login" && info.toLowerCase().includes("resend");

  return (
    <div className="auth-shell" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, background: "radial-gradient(circle, var(--accent-deep) 0%, transparent 70%)", pointerEvents: "none", opacity: 0.8 }} />
      <div style={{ position: "absolute", bottom: 120, left: -80, width: 220, height: 220, borderRadius: 110, background: "radial-gradient(circle, var(--blue-deep) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 28px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>Welcome to</div>
          <BrandLogo showTagline center={false} />
          <div style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.6 }}>
            {screen === "login"
              ? `Sign in to ${APP_NAME} and keep ${APP_TAGLINE.toLowerCase()}.`
              : screen === "register"
                ? "Create your account, verify your email, and start using the full app during the review period."
                : "Reset your password from your inbox."}
          </div>
        </div>

        {(error || info) && (
          <div style={{ background: error ? "var(--danger-deep)" : "var(--accent-deep)", border: `1px solid ${error ? "var(--danger)" : "var(--accent)"}44`, borderRadius: 14, padding: "14px 16px", marginBottom: 18, color: error ? "var(--danger)" : "var(--accent-text)", fontSize: 14, lineHeight: 1.5 }}>
            {error || info}
          </div>
        )}

        {screen === "login" && (
          <div className="fade-in">
            <Field label="Email Address" required>
              <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" required hint="Use the password you created during registration.">
              <Input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleLogin} disabled={loading}>
              {loading ? "Signing you in..." : "Sign In"}
            </button>
            {showResend && (
              <button className="btn-secondary" style={{ width: "100%", marginBottom: 14 }} onClick={handleResendVerification} disabled={resending}>
                {resending ? "Sending verification email..." : "Resend Verification Email"}
              </button>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => switchScreen("register")} style={{ background: "none", border: "none", color: "var(--accent-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Create account</button>
              <button onClick={() => switchScreen("forgot")} style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}>Forgot password?</button>
            </div>
          </div>
        )}

        {screen === "register" && (
          <div className="fade-in">
            <Field label="Full Name" required>
              <Input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Email Address" required>
              <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone Number" required hint="Used for account recovery and business profile.">
              <PhoneNumberInput
                countryCode={phoneCountryCode}
                phoneNumber={phoneNumber}
                onCountryCodeChange={setPhoneCountryCode}
                onPhoneNumberChange={setPhoneNumber}
                countryOptions={PHONE_COUNTRY_OPTIONS}
                phonePlaceholder="9876543210"
              />
            </Field>
            <Field label="Date of Birth" required hint="Used for age-group insights and safer product planning.">
              <div className="desktop-grid-3">
                <Select value={birthDay} onChange={e => setBirthDay(e.target.value)}>
                  <option value="">Day</option>
                  {birthDayOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
                  <option value="">Month</option>
                  {MONTH_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select value={birthYear} onChange={e => setBirthYear(e.target.value)}>
                  <option value="">Year</option>
                  {birthYearOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>
            <Field label="Gender" hint="Optional. Used only for aggregate audience insights.">
              <Select value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Prefer not to share</option>
                {GENDER_OPTIONS.filter(option => option).map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Address Line" hint="House number, street, road, or area.">
              <Input placeholder="Flat 12, MG Road" value={addressLine} onChange={e => setAddressLine(e.target.value)} autoComplete="address-line1" />
            </Field>
            <div className="desktop-grid-2">
              <Field label="City" required>
                <Input placeholder="Hyderabad" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
              </Field>
              <Field label="Country" required>
                <Select value={country} onChange={e => setCountry(e.target.value)}>
                  {COUNTRY_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="State / Province" required>
              <Select value={stateName} onChange={e => setStateName(e.target.value)}>
                <option value="">Select state / province</option>
                {stateOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="What Are You Using EasyKhata For?" required hint="This helps us tailor labels, fields, and sections for your workflow.">
              <Select value={organizationType} onChange={e => setOrganizationType(e.target.value)}>
                {selectableOrgTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            
            <Field label="Password" required hint={showPasswordHint ? "At least 6 characters. Add numbers or symbols for extra security." : 
              <button onClick={() => setShowPasswordHint(true)} style={{ background: "none", border: "none", color: "var(--accent-text)", cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font)", fontSize: "inherit" }}>
                View password tips
              </button>
            }>
              <Input 
                type="password" 
                autoComplete="new-password" 
                placeholder="Create a strong password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              {password && (
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <div style={{ fontSize: 11, padding: "4px 8px", borderRadius: 6, background: passStrength?.length === "weak" ? "var(--danger-deep)" : passStrength?.length === "medium" ? "var(--gold-deep)" : "var(--accent-deep)", color: passStrength?.length === "weak" ? "var(--danger)" : passStrength?.length === "medium" ? "var(--gold)" : "var(--accent)", fontWeight: 600 }}>
                    {passStrength.length === "weak" ? "Weak" : passStrength.length === "medium" ? "Medium" : "Strong"}
                  </div>
                  {(passStrength.hasNumber || passStrength.hasSpecial) && (
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {passStrength.hasNumber && "✓ Number "}
                      {passStrength.hasSpecial && "✓ Symbol"}
                    </div>
                  )}
                </div>
              )}
            </Field>

            <Field label="Confirm Password" required>
              <Input 
                type="password" 
                autoComplete="new-password" 
                placeholder="Re-enter your password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
              />
              {password && confirmPassword && password === confirmPassword && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>✓ Passwords match</div>
              )}
              {password && confirmPassword && password !== confirmPassword && (
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>✗ Passwords don't match</div>
              )}
            </Field>

            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleRegister} disabled={loading}>
              {loading ? "Creating your account..." : "Create Account"}
            </button>
            <button onClick={() => switchScreen("login")} style={{ background: "none", border: "none", color: "var(--accent-text)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>Already have an account? Sign in</button>
          </div>
        )}

        {screen === "forgot" && (
          <div className="fade-in">
            <Field label="Registered Email" required hint="We'll send a password reset link to this address.">
              <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleForgot} disabled={loading}>
              {loading ? "Sending reset email..." : "Send Reset Link"}
            </button>
            <button onClick={() => switchScreen("login")} style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>Back to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}
