import React,{ useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import {  doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import { Modal, Field, Input, Textarea, Select, CurrencyPicker, Avatar, DeleteBtn, CURRENCIES } from "../components/UI";
import { exportUserData, importUserData } from "../utils/backup";


export default function SettingsSection() {
  const { user, logout, updateProfile, setUser } = useAuth();
  const { account, saveAccount, currency, setCurrency, customers, addCustomer, updateCustomer, removeCustomer } = useData();
  const { theme, toggle } = useTheme();

  const [screen, setScreen] = useState("main"); // main | account | customers | customer-form | currency | passcode
  const [custForm, setCustForm] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [accForm, setAccForm] = useState(account || { name:"", address:"", gstin:"", phone:"", email:"", showHSN:true });
  const [passForm, setPassForm] = useState({ current:["","","","","",""], next:["","","","","",""], confirm:["","","","","",""] });
  const [passError, setPassError] = useState("");
  const [showCurrPicker, setShowCurrPicker] = useState(false);

useEffect(() => {
  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const snap = await getDoc(doc(db, "users", user.id));

      if (snap.exists()) {
        const data = snap.data();

        setAccForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          gstin: data.gstin || "",
          showHSN: data.showHSN || false
        });
      }
    } catch (err) {
      console.error("LOAD PROFILE ERROR:", err);
    }
  };

  loadProfile();
}, [user]);

const saveAcc = async () => {
  try {
    if (!user?.id) {
      alert("User not loaded");
      return;
    }

    await updateDoc(doc(db, "users", user.id), {
      name: accForm.name || "",
      email: accForm.email || "",
      phone: accForm.phone || "",
      address: accForm.address || "",
      gstin: accForm.gstin || "",
      showHSN: accForm.showHSN || false
    });

    // 🔥 update UI instantly
    setUser(prev => ({
      ...prev,
      ...accForm
    }));

    alert("Profile updated successfully");

  } catch (err) {
    console.error("SAVE ERROR:", err);
    alert("Failed to update profile");
  }
};

  function openNewCust() {
    setCustForm({ name:"", email:"", phone:"", address:"", gstin:"" });
    setEditCust(null);
    setScreen("customer-form");
  }

  function openEditCust(c) {
    setCustForm({ ...c });
    setEditCust(c);
    setScreen("customer-form");
  }

  function saveCust() {
    if (!custForm?.name.trim()) return;
    if (editCust) updateCustomer({ ...custForm, id: editCust.id });
    else addCustomer(custForm);
    setScreen("customers");
  }

  function PasscodeBoxes({ arr, setArr, prefix }) {
    function handleKey(e, i) {
      const val = e.target.value.replace(/\D/g,"").slice(-1);
      const next = [...arr]; next[i] = val; setArr(next);
      if (val && i < 5) document.getElementById(`${prefix}-${i+1}`)?.focus();
      if (!val && e.nativeEvent.inputType === "deleteContentBackward" && i > 0) document.getElementById(`${prefix}-${i-1}`)?.focus();
    }
    return (
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        {arr.map((d, i) => (
          <input key={i} id={`${prefix}-${i}`} type="password" inputMode="numeric" maxLength={1} value={d}
            onChange={e=>handleKey(e,i)} className="otp-box" style={{ borderColor: d?"var(--accent)":undefined }} />
        ))}
      </div>
    );
  }

  function changePasscode() {
    setPassError("");
    const cur = passForm.current.join(""), nxt = passForm.next.join(""), conf = passForm.confirm.join("");
    if (cur !== user.passcode) { setPassError("Current passcode is incorrect."); return; }
    if (nxt.length < 6) { setPassError("New passcode must be 6 digits."); return; }
    if (nxt !== conf) { setPassError("New passcodes don't match."); return; }
    updateProfile({ passcode: nxt });
    setPassForm({ current:["","","","","",""], next:["","","","","",""], confirm:["","","","","",""] });
    alert("Passcode updated successfully!");
    setScreen("main");
  }

  function handleExport() {
  exportUserData(user.id);
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!window.confirm("This will overwrite your current data. Continue?")) return;

  importUserData(user.id, file, () => {
    window.location.reload();
  });
}

  const MenuRow = ({ icon, label, sub, onClick, color, danger }) => (
    <div onClick={onClick} className="card-row" style={{ cursor:"pointer" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background: danger?"var(--danger-deep)":color||"var(--surface-high)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color: danger?"var(--danger)":"var(--text)" }}>{label}</div>
          {sub && <div style={{ fontSize:12, color:"var(--text-dim)" }}>{sub}</div>}
        </div>
      </div>
      {!danger && <span style={{ color:"var(--text-dim)", fontSize:18 }}>›</span>}
    </div>
  );

  // ── Main settings menu ──
  if (screen === "main") return (
    <div style={{ padding:"20px 18px", paddingBottom:100 }}>
      {/* Profile card */}
      <div className="card" style={{ padding:"20px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
        <Avatar name={user?.name || "?"} size={52} fontSize={20} />
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"var(--text)" }}>{user?.name}</div>
          <div style={{ fontSize:13, color:"var(--text-sec)" }}>{user?.phone}</div>
        </div>
      </div>

      <div style={{ marginBottom:10 }}><div className="section-label">Business</div>
        <div className="card">
          <MenuRow icon="🏢" label="Account Profile" sub={account?.name || "Set up your business details"} onClick={() =>  setScreen("account") }/>
          <MenuRow icon="👥" label="Customers" sub={`${customers.length} customer(s)`} onClick={() => setScreen("customers")} />
          <MenuRow icon="💱" label="Currency" sub={`${currency?.flag} ${currency?.code} — ${currency?.symbol}`} onClick={() => setShowCurrPicker(true)} />
        </div>
      </div>

      <div style={{ marginBottom:10, marginTop:20 }}><div className="section-label">Preferences</div>
        <div className="card">
          <div className="card-row">
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"var(--surface-high)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{theme==="dark"?"🌙":"☀️"}</div>
              <span style={{ fontSize:15, fontWeight:600, color:"var(--text)" }}>{theme==="dark"?"Dark Mode":"Light Mode"}</span>
            </div>
            <button className="theme-toggle" onClick={toggle} />
          </div>
          <MenuRow icon="🔑" label="Change Passcode" onClick={() => { setPassForm({ current:["","","","","",""], next:["","","","","",""], confirm:["","","","","",""] }); setPassError(""); setScreen("passcode"); }} />
        </div>
      </div>

      <div style={{ marginTop:20 }}>
        <div className="card">
          <MenuRow icon="🚪" label="Sign Out" danger onClick={() => { if (window.confirm("Sign out?")) logout(); }} />
        </div>
      </div>

      <div className="card">
        <div className="card-row" onClick={handleExport} style={{ cursor: "pointer" }}>
          <span>📤 Export Backup</span>
        </div>

        <div className="card-row" style={{ cursor: "pointer" }}>
          <label style={{ cursor: "pointer", width: "100%" }}>
            📥 Import Backup
            <input type="file" accept="application/json" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {showCurrPicker && <CurrencyPicker value={currency} onSelect={cur => { setCurrency(cur); setShowCurrPicker(false); }} onClose={() => setShowCurrPicker(false)} />}
    </div>
  );

  // ── Account Profile ──
  if (screen === "account") return (
    <Modal title="Account Profile" onClose={() => setScreen("main")} onSave={saveAcc} canSave={!!accForm.name.trim()}>
      <Field label="Business Name" required><Input placeholder="e.g. Type to Enter" value={accForm.name||""} onChange={e=>setAccForm(f=>({...f,name:e.target.value}))} /></Field>
      <Field label="Address"><Textarea placeholder="Full address including state, PIN" value={accForm.address||""} onChange={e=>setAccForm(f=>({...f,address:e.target.value}))} /></Field>
      <Field label="GSTIN"><Input placeholder="e.g. 36XXXXXXXXXXXXX" value={accForm.gstin||""} onChange={e=>setAccForm(f=>({...f,gstin:e.target.value}))} /></Field>
      <Field label="Phone"><Input type="tel" placeholder="+91-9391559067" value={accForm.phone||""} onChange={e=>setAccForm(f=>({...f,phone:e.target.value}))} /></Field>
      <Field label="Email"><Input type="email" placeholder="email@example.com" value={accForm.email||""} onChange={e=>setAccForm(f=>({...f,email:e.target.value}))}/></Field>
      <Field label="Show HSN/SAC on Invoices">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"var(--surface-high)", borderRadius:12 }}>
          <span style={{ fontSize:15, color:"var(--text)" }}>Include HSN/SAC column</span>
          <button onClick={()=>setAccForm(f=>({...f,showHSN:!f.showHSN}))}
            style={{ width:48, height:28, borderRadius:14, border:"none", cursor:"pointer", position:"relative", transition:"background 0.3s", background:accForm.showHSN?"var(--accent)":"var(--border)" }}>
            <div style={{ position:"absolute", top:3, left: accForm.showHSN?undefined:3, right: accForm.showHSN?3:undefined, width:22, height:22, borderRadius:11, background:"#fff", transition:"all 0.3s" }} />
          </button>
        </div>
      </Field>
    </Modal>
  );

  // ── Customers List ──
  if (screen === "customers") return (
    <Modal title="Customers" onClose={() => setScreen("main")} onSave={openNewCust} saveLabel="+ Add">
      {customers.length === 0
        ? <div style={{ textAlign:"center", padding:"40px 0" }}><div style={{ fontSize:48, marginBottom:14 }}>👥</div><div style={{ fontSize:16, fontWeight:600, color:"var(--text-sec)" }}>No customers yet</div></div>
        : <div className="card">
            {customers.map(c => (
              <div key={c.id} className="card-row">
                <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", flex:1 }} onClick={() => openEditCust(c)}>
                  <Avatar name={c.name} size={38} fontSize={13} />
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, color:"var(--text)" }}>{c.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-dim)" }}>{c.email || c.phone || (c.gstin ? `GSTIN: ${c.gstin}` : "No contact")}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <button onClick={() => openEditCust(c)} style={{ background:"var(--blue-deep)", border:"none", borderRadius:9, color:"var(--blue)", fontSize:12, fontWeight:600, padding:"5px 10px", cursor:"pointer", fontFamily:"var(--font)" }}>Edit</button>
                  <DeleteBtn onDelete={() => { if(window.confirm(`Remove ${c.name}?`)) removeCustomer(c.id); }} />
                </div>
              </div>
            ))}
          </div>
      }
    </Modal>
  );

  // ── Customer Form ──
  if (screen === "customer-form") return (
    <Modal title={editCust ? "Edit Customer" : "New Customer"} onClose={() => setScreen("customers")} onSave={saveCust} canSave={!!custForm?.name.trim()}>
      <Field label="Name" required><Input placeholder="Client / Company name" value={custForm?.name||""} onChange={e=>setCustForm(f=>({...f,name:e.target.value}))} /></Field>
      <Field label="Email"><Input type="email" placeholder="billing@company.com" value={custForm?.email||""} onChange={e=>setCustForm(f=>({...f,email:e.target.value}))} /></Field>
      <Field label="Phone"><Input type="tel" placeholder="+1 555 000 0000" value={custForm?.phone||""} onChange={e=>setCustForm(f=>({...f,phone:e.target.value}))} /></Field>
      <Field label="Address"><Textarea placeholder="Full billing address" value={custForm?.address||""} onChange={e=>setCustForm(f=>({...f,address:e.target.value}))} /></Field>
      <Field label="GSTIN (optional)"><Input placeholder="e.g. 36XXXXXXXXXX" value={custForm?.gstin||""} onChange={e=>setCustForm(f=>({...f,gstin:e.target.value}))} /></Field>
    </Modal>
  );

  // ── Change Passcode ──
  if (screen === "passcode") return (
    <Modal title="Change Passcode" onClose={() => setScreen("main")} onSave={changePasscode} canSave={true}>
      <Field label="Current Passcode">
        <PasscodeBoxes arr={passForm.current} setArr={v=>setPassForm(f=>({...f,current:v}))} prefix="cur" />
      </Field>
      <Field label="New Passcode">
        <PasscodeBoxes arr={passForm.next} setArr={v=>setPassForm(f=>({...f,next:v}))} prefix="nxt" />
      </Field>
      <Field label="Confirm New Passcode">
        <PasscodeBoxes arr={passForm.confirm} setArr={v=>setPassForm(f=>({...f,confirm:v}))} prefix="cnf" />
      </Field>
      {passError && <p style={{ color:"var(--danger)", fontSize:14, marginTop:8, textAlign:"center" }}>{passError}</p>}
    </Modal>
  );
}