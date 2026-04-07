import React,{ useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Input, Field } from "../components/UI";
import { isValidEmail } from "../utils/validator";

export default function AuthScreen() {
  const { login, register, forgotPassword, resendVerification } = useAuth();
  const [screen, setScreen] = useState("login"); // login | register | forgot
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handlePasscodeKey(e, idx, arr, setArr) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...arr]; next[idx] = val; setArr(next);
    if (val && idx < 5) document.getElementById(`${arr === passcode ? "pc" : "cpc"}-${idx + 1}`)?.focus();
    if (!val && e.nativeEvent.inputType === "deleteContentBackward" && idx > 0)
      document.getElementById(`${arr === passcode ? "pc" : "cpc"}-${idx - 1}`)?.focus();
  }

async function handleLogin() {
  setError("");
  setLoading(true);

  const code = password;

  function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

  if (!isValidEmail(email)) {
    setError("Enter valid email.");
    return setLoading(false);
  }

  if (code.length < 6) {
    setError("Enter valid password.");
    return setLoading(false);
  }

  const res = await login(email.trim(), code);

if (res?.error && res.error.includes("verify")) {
  setInfo("Didn't receive email? Click below to resend.");
}
  setLoading(false);
}

async function handleRegister() {
  setError("");
  setLoading(true);

  const finalPass = password;

  if (!name.trim()) {
    setError("Enter your full name.");
    return setLoading(false);
  }

  if (!isValidEmail(email)) {
    setError("Enter a valid email address.");
    return setLoading(false);
  }

  if (!phone || phone.length < 10) {
    setError("Enter valid phone number.");
    return setLoading(false);
  }

  if (finalPass.length < 6) {
    setError("Password must be at least 6 characters.");
    return setLoading(false);
  }

  if (password !== confirmPassword) {
  setError("Passwords do not match.");
  return setLoading(false);
}

  const res = await register(name, email.trim(), phone, finalPass);

  if (res?.error) setError(res.error);

  setLoading(false);
}

  async function handleForgot() {
  setError("");

  if (!isValidEmail(email)) {
    setError("Enter valid email.");
    return;
  }

  const res = await forgotPassword(email);

  if (res?.error) setError(res.error);
  else alert("Password reset email sent!");
}

  const PasscodeBoxes = ({ arr, setArr, prefix }) => (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {arr.map((d, i) => (
        <input key={i} id={`${prefix}-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handlePasscodeKey(e, i, arr, setArr)}
          onKeyDown={e => { if (e.key === "Backspace" && !arr[i] && i > 0) document.getElementById(`${prefix}-${i-1}`)?.focus(); }}
          className="otp-box" style={{ borderColor: d ? "var(--accent)" : undefined }} />
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, background: "radial-gradient(circle, var(--accent-deep) 0%, transparent 70%)", pointerEvents: "none", opacity: 0.8 }} />
      <div style={{ position: "absolute", bottom: 120, left: -80, width: 220, height: 220, borderRadius: 110, background: "radial-gradient(circle, var(--blue-deep) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 28px 32px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-text)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Welcome to</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 52, color: "var(--text)", lineHeight: 1, marginBottom: 10 }}>Ledger</div>
          <div style={{ fontSize: 15, color: "var(--text-sec)", lineHeight: 1.6 }}>
            {screen === "login" ? "Sign in to your account" : screen === "register" ? "Create a new account" : "Reset your passcode"}
          </div>
        </div>

        {/* ── LOGIN ── */}
        {screen === "login" && (
          <div className="fade-in">
            <Field label="Email Address" required>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Field>
            <Field label="6-Digit Passcode" required>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16, textAlign: "center" }}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => { setScreen("register"); setError(""); setPassword([]); }}
                style={{ background: "none", border: "none", color: "var(--accent-text)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>Create account</button>
              <button onClick={() => { setScreen("forgot"); setError(""); setInfo(""); }}
                style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}>Forgot passcode?</button>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {screen === "register" && (
          <div className="fade-in">
            <Field label="Full Name" required>
              <Input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field label="Phone Number" required>
              <Input type="tel" placeholder="e.g. 9XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
            <Field label="Email Address" required>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Set 6-Digit Passcode" required>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm Passcode" required>
              <Input
                type="password"
                placeholder="Enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16, textAlign: "center" }}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleRegister} disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
            <button onClick={() => { setScreen("login"); setError(""); setPassword([]); setConfirmPassword([]); }}
              style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>
              Already have an account? Sign in
            </button>
          </div>
        )}

        {/* ── FORGOT ── */}
        {screen === "forgot" && (
          <div className="fade-in">
            <Field label="Registered Email" required>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</p>}
            {info && <div style={{ background: "var(--accent-deep)", border: "1px solid var(--accent)", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "var(--accent-text)", marginBottom: 16, lineHeight: 1.5 }}>{info}</div>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleForgot}>
              Send reset link
            </button>
            <button onClick={() => { setScreen("login"); setError(""); setInfo(""); }}
              style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}