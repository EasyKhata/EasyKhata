import React,{ useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Input, Field } from "../components/UI";

export default function AuthScreen() {
  const { login, register, requestTempPassword } = useAuth();
  const [screen, setScreen] = useState("login"); // login | register | forgot
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState(["","","","","",""]);
  const [confirmPasscode, setConfirmPasscode] = useState(["","","","","",""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePasscodeKey(e, idx, arr, setArr) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...arr]; next[idx] = val; setArr(next);
    if (val && idx < 5) document.getElementById(`${arr === passcode ? "pc" : "cpc"}-${idx + 1}`)?.focus();
    if (!val && e.nativeEvent.inputType === "deleteContentBackward" && idx > 0)
      document.getElementById(`${arr === passcode ? "pc" : "cpc"}-${idx - 1}`)?.focus();
  }

  function handleLogin() {
    setError(""); setLoading(true);
    const code = passcode.join("");
    if (!phone.replace(/\D/g,"")) { setError("Enter your phone number."); setLoading(false); return; }
    if (code.length < 6) { setError("Enter your 6-digit passcode."); setLoading(false); return; }
    setTimeout(() => {
      const res = login(phone.replace(/\D/g,""), code);
      if (res.error) setError(res.error);
      setLoading(false);
    }, 400);
  }

  function handleRegister() {
    setError(""); setLoading(true);
    const code = passcode.join("");
    const conf = confirmPasscode.join("");
    if (!phone.replace(/\D/g,"")) { setError("Enter your phone number."); setLoading(false); return; }
    if (!name.trim()) { setError("Enter your full name."); setLoading(false); return; }
    if (code.length < 6) { setError("Set a 6-digit passcode."); setLoading(false); return; }
    if (code !== conf) { setError("Passcodes don't match."); setLoading(false); return; }
    setTimeout(() => {
      const res = register(phone.replace(/\D/g,""), name.trim(), code);
      if (res.error) setError(res.error);
      setLoading(false);
    }, 400);
  }

  function handleForgot() {
    setError(""); setInfo("");
    if (!phone.replace(/\D/g,"")) { setError("Enter your registered phone number."); return; }
    const res = requestTempPassword(phone.replace(/\D/g,""));
    if (res.error) setError(res.error);
    else setInfo(res.message);
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
            <Field label="Phone Number" required>
              <Input type="tel" placeholder="e.g. 9391559067" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
            <Field label="6-Digit Passcode" required>
              <PasscodeBoxes arr={passcode} setArr={setPasscode} prefix="pc" />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16, textAlign: "center" }}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => { setScreen("register"); setError(""); setPasscode(["","","","","",""]); }}
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
              <Input type="tel" placeholder="e.g. 9391559067" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
            <Field label="Set 6-Digit Passcode" required>
              <PasscodeBoxes arr={passcode} setArr={setPasscode} prefix="pc" />
            </Field>
            <Field label="Confirm Passcode" required>
              <PasscodeBoxes arr={confirmPasscode} setArr={setConfirmPasscode} prefix="cpc" />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16, textAlign: "center" }}>{error}</p>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleRegister} disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
            <button onClick={() => { setScreen("login"); setError(""); setPasscode(["","","","","",""]); setConfirmPasscode(["","","","","",""]); }}
              style={{ background: "none", border: "none", color: "var(--text-sec)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", width: "100%", textAlign: "center" }}>
              Already have an account? Sign in
            </button>
          </div>
        )}

        {/* ── FORGOT ── */}
        {screen === "forgot" && (
          <div className="fade-in">
            <Field label="Registered Phone Number" required>
              <Input type="tel" placeholder="e.g. 9391559067" value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
            {error && <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 16 }}>{error}</p>}
            {info && <div style={{ background: "var(--accent-deep)", border: "1px solid var(--accent)", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "var(--accent-text)", marginBottom: 16, lineHeight: 1.5 }}>{info}</div>}
            <button className="btn-primary" style={{ width: "100%", marginBottom: 14 }} onClick={handleForgot}>
              Request Temp Password
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