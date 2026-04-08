import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Field, Input } from "../components/UI";
import { isStrongPassword, isValidEmail, isValidPhone, sanitizePhone } from "../utils/validator";

export default function AuthScreen() {
  const { login, register, forgotPassword, resendVerification } = useAuth();
  const [screen, setScreen] = useState("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  function resetMessages() {
    setError("");
    setInfo("");
  }

  function switchScreen(nextScreen) {
    setScreen(nextScreen);
    resetMessages();
  }

  async function handleLogin() {
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();

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
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = sanitizePhone(phone);

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isValidPhone(cleanPhone)) {
      setError("Please enter a valid phone number with at least 10 digits.");
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
    const res = await register(cleanName, cleanEmail, cleanPhone, password);
    setLoading(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setInfo(res?.message || "Account created successfully.");
    setPassword("");
    setConfirmPassword("");
    setScreen("login");
  }

  async function handleForgot() {
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();

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
    const cleanEmail = email.trim().toLowerCase();

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
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, background: "radial-gradient(circle, var(--accent-deep) 0%, transparent 70%)", pointerEvents: "none", opacity: 0.8 }} />
      <div style={{ position: "absolute", bottom: 120, left: -80, width: 220, height: 220, borderRadius: 110, background: "radial-gradient(circle, var(--blue-deep) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 28px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Welcome to</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 52, color: "var(--text)", lineHeight: 1, marginBottom: 10 }}>Ledger</div>
          <div style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.6 }}>
            {screen === "login" ? "Sign in securely to continue." : screen === "register" ? "Create your account and verify your email." : "Reset your password from your inbox."}
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
              <Input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Phone Number" required hint="Used for your business profile and account recovery.">
              <Input type="tel" autoComplete="tel" placeholder="e.g. 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
            <Field label="Email Address" required>
              <Input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" required hint="Use at least 6 characters.">
              <Input type="password" autoComplete="new-password" placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm Password" required>
              <Input type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </Field>
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleRegister} disabled={loading}>
              {loading ? "Creating your account..." : "Create Account"}
            </button>
            <button onClick={() => switchScreen("login")} style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>Already have an account? Sign in</button>
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
