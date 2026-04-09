import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { Modal, Field, Input, Textarea, CurrencyPicker, Avatar, DeleteBtn, fmtMoney, UpgradeModal, EmptyState } from "../components/UI";
import { exportUserData, importUserData } from "../utils/backup";
import { calculateCustomerInsights } from "../utils/analytics";
import { downloadMonthlyReport, downloadAdminMonthlyReport } from "../utils/reportGen";
import { isStrongPassword, isValidEmail, isValidPhone } from "../utils/validator";
import {
  BILLING_CYCLES,
  PAYMENT_REQUEST_STATUS,
  UPI_CONFIG,
  canUseFeature,
  formatSubscriptionDate,
  getBillingAmount,
  getUserPlan,
  getPlanSummary,
  getUpgradeCopy,
  PLAN_LABELS,
  PLANS
} from "../utils/subscription";
import { APP_SUPPORT_EMAIL } from "../utils/brand";

export default function SettingsSection() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { account, currency, setCurrency, customers, addCustomer, updateCustomer, removeCustomer, goals, saveGoals, budgets, income, expenses, invoices, notificationPrefs, saveNotificationPrefs, sharedLedger, createSharedLedger, joinSharedLedger, leaveSharedLedger, regenerateLedgerInvite } = useData();
  const { theme, toggle } = useTheme();

  const [screen, setScreen] = useState("main");
  const [custForm, setCustForm] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accForm, setAccForm] = useState(account || { name: "", address: "", gstin: "", phone: "", email: "", showHSN: true });
  const [goalForm, setGoalForm] = useState({ monthlySavings: goals?.monthlySavings || "" });
  const [notificationForm, setNotificationForm] = useState(notificationPrefs);
  const [sharedLedgerForm, setSharedLedgerForm] = useState({ name: "", code: "" });
  const [planRequestForm, setPlanRequestForm] = useState({
    targetPlan: PLANS.PRO,
    billingCycle: BILLING_CYCLES.MONTHLY,
    transactionId: "",
    note: ""
  });
  const [passForm, setPassForm] = useState({ current: "", next: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [showCurrPicker, setShowCurrPicker] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const planSummary = getPlanSummary(user);
  const currentPlan = getUserPlan(user);
  const isFreePlanUser = currentPlan === PLANS.FREE;

  const customerInsights = useMemo(
    () => calculateCustomerInsights({ customers, invoices }),
    [customers, invoices]
  );

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
            showHSN: Boolean(data.showHSN)
          });
        }
      } catch (err) {
        console.error("LOAD PROFILE ERROR:", err);
      }
    };

    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    setGoalForm({ monthlySavings: goals?.monthlySavings || "" });
  }, [goals?.monthlySavings]);

  useEffect(() => {
    setNotificationForm(notificationPrefs);
  }, [notificationPrefs]);

  const saveAcc = async () => {
    const cleanEmail = (accForm.email || "").trim().toLowerCase();
    const cleanPhone = String(accForm.phone || "").trim();

    if (!accForm.name?.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      alert("Please enter a valid phone number with at least 10 digits.");
      return;
    }

    const res = await updateProfile({
      name: accForm.name || "",
      email: cleanEmail,
      phone: cleanPhone,
      address: accForm.address || "",
      gstin: accForm.gstin || "",
      showHSN: Boolean(accForm.showHSN)
    });

    if (res?.error) {
      alert(res.error);
      return;
    }

    alert("Your profile has been updated.");
    setScreen("main");
  };

  function openNewCust() {
    setCustForm({ name: "", email: "", phone: "", address: "", gstin: "" });
    setEditCust(null);
    setScreen("customer-form");
  }

  function openEditCust(customer) {
    setCustForm({ ...customer });
    setEditCust(customer);
    setScreen("customer-form");
  }

  function openCustomerDetail(customer) {
    const detail = customerInsights.find(item => item.id === customer.id) || customer;
    setSelectedCustomer(detail);
    setScreen("customer-detail");
  }

  function saveCust() {
    if (!custForm?.name.trim()) return;
    if (!editCust && !canUseFeature(user, "customerCreate", { customerCount: customers.length })) {
      setUpgradeInfo(getUpgradeCopy("customerCreate"));
      return;
    }
    if (editCust) updateCustomer({ ...custForm, id: editCust.id });
    else addCustomer(custForm);
    setScreen("customers");
  }

  async function handleChangePassword() {
    setPassError("");

    if (!passForm.current) {
      setPassError("Please enter your current password.");
      return;
    }
    if (!isStrongPassword(passForm.next)) {
      setPassError("Password must be at least 6 characters long.");
      return;
    }
    if (passForm.next !== passForm.confirm) {
      setPassError("Your new password and confirmation do not match.");
      return;
    }

    const res = await changePassword(passForm.current, passForm.next);
    if (res?.error) {
      setPassError(res.error);
      return;
    }

    setPassForm({ current: "", next: "", confirm: "" });
    alert("Your password has been updated.");
    setScreen("main");
  }

  function handleExport() {
    exportUserData(user.id);
  }

  function saveGoalSettings() {
    const amount = Number(goalForm.monthlySavings) || 0;
    saveGoals({ monthlySavings: amount });
    alert(amount > 0 ? "Monthly savings goal updated." : "Monthly savings goal cleared.");
    setScreen("main");
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!window.confirm("This will overwrite your current data. Continue?")) return;
    importUserData(user.id, file, () => {
      window.location.reload();
    });
  }

  async function handleReportDownload() {
    if (!canUseFeature(user, "reports")) {
      setUpgradeInfo(getUpgradeCopy("reports"));
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (user?.role === "admin") {
      setGeneratingReport(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const paymentsSnapshot = await getDocs(collection(db, "payment_requests"));

        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const paymentRequests = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        await downloadAdminMonthlyReport({ users, paymentRequests }, year, month, currency?.symbol || "Rs");
      } catch (err) {
        console.error("Admin report error:", err);
        alert(err?.message || "Unable to generate admin report right now.");
      } finally {
        setGeneratingReport(false);
      }

      return;
    }

    downloadMonthlyReport({ account, currency, customers, income, expenses, invoices, goals, budgets }, year, month, currency?.symbol || "Rs");
  }

  async function handleCreateSharedLedger() {
    if (!canUseFeature(user, "sharedLedger")) {
      setUpgradeInfo(getUpgradeCopy("sharedLedger"));
      return;
    }
    if (!sharedLedgerForm.name?.trim()) {
      alert("Please enter a name for the shared ledger.");
      return;
    }
    const res = await createSharedLedger(sharedLedgerForm.name.trim());
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("Shared ledger created. You can now invite members with the invite code.");
    setSharedLedgerForm({ name: "", code: "" });
    setScreen("main");
  }

  async function handleJoinSharedLedger() {
    if (!canUseFeature(user, "sharedLedger")) {
      setUpgradeInfo(getUpgradeCopy("sharedLedger"));
      return;
    }
    if (!sharedLedgerForm.code?.trim()) {
      alert("Please enter the invite code.");
      return;
    }
    const res = await joinSharedLedger(sharedLedgerForm.code.trim());
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("You have joined the shared ledger.");
    setSharedLedgerForm({ name: "", code: "" });
    setScreen("main");
  }

  async function handleRefreshInvite() {
    const res = await regenerateLedgerInvite();
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("Invite code refreshed.");
    setScreen("shared-ledger");
  }

  async function handleLeaveSharedLedger() {
    const res = await leaveSharedLedger();
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert("You left the shared ledger.");
    setScreen("main");
  }

  async function saveNotificationSettings() {
    if (!canUseFeature(user, "notifications")) {
      setUpgradeInfo(getUpgradeCopy("notifications"));
      return;
    }
    let nextPrefs = { ...notificationForm };

    if (nextPrefs.browserEnabled && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          nextPrefs = { ...nextPrefs, browserEnabled: false };
          alert("Browser notifications were not allowed, so in-app reminders will stay active without browser popups.");
        }
      } else if (Notification.permission !== "granted") {
        nextPrefs = { ...nextPrefs, browserEnabled: false };
        alert("Browser notifications are blocked in this browser. You can still use the in-app reminder inbox.");
      }
    }

    saveNotificationPrefs(nextPrefs);
    setScreen("main");
  }

  async function submitPlanRequest() {
    const targetPlan = planRequestForm.targetPlan || PLANS.PRO;
    const billingCycle = planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY;
    const cleanTransactionId = planRequestForm.transactionId.trim();

    if (!cleanTransactionId) {
      alert("Please enter the UPI transaction ID or reference number.");
      return;
    }

    setSubmittingPayment(true);
    try {
      await setDoc(doc(db, "payment_requests", user.id), {
        userId: user.id,
        userName: user?.name || "",
        userEmail: user?.email || "",
        currentPlan: user?.plan || PLANS.FREE,
        requestedPlan: targetPlan,
        billingCycle,
        amount: getBillingAmount(billingCycle),
        paymentMethod: "upi",
        upiId: UPI_CONFIG.upiId,
        upiPayeeName: UPI_CONFIG.payeeName,
        transactionId: cleanTransactionId,
        screenshotStatus: "emailed-separately",
        supportEmail: APP_SUPPORT_EMAIL,
        status: PAYMENT_REQUEST_STATUS.PENDING,
        note: planRequestForm.note.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      alert(`Your payment proof for ${PLAN_LABELS[targetPlan] || "plan"} has been sent to admin for verification.`);
      setPlanRequestForm({
        targetPlan: targetPlan === PLANS.BUSINESS ? PLANS.BUSINESS : PLANS.PRO,
        billingCycle: BILLING_CYCLES.MONTHLY,
        transactionId: "",
        note: ""
      });
      setScreen("main");
    } catch (err) {
      console.error("Payment request error:", err);
      if (err?.code === "permission-denied") {
        alert("Payment requests are blocked by Firestore rules right now. Please allow payment_requests before using this feature.");
        return;
      }
      alert(err?.message || "We couldn't send your payment request right now. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(APP_SUPPORT_EMAIL);
      alert("Support email copied.");
    } catch (err) {
      alert(`Copy failed. Please use this email manually: ${APP_SUPPORT_EMAIL}`);
    }
  }

  function emailPaymentProof() {
    const amount = getBillingAmount(planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY);
    const subject = encodeURIComponent(`EasyKhata payment proof - ${user?.name || "Customer"}`);
    const body = encodeURIComponent(
      `Hello,\n\nI have completed the UPI payment for EasyKhata.\n\nPlan: ${PLAN_LABELS[planRequestForm.targetPlan || PLANS.PRO] || "Pro"}\nBilling cycle: ${planRequestForm.billingCycle || BILLING_CYCLES.MONTHLY}\nAmount: Rs ${amount}\nTransaction ID: ${planRequestForm.transactionId || ""}\n\nPlease find my payment screenshot attached.\n\nThanks.`
    );
    window.location.href = `mailto:${APP_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }

  const MenuRow = ({ icon, label, sub, onClick, color, danger, disabled, badge }) => (
    <div onClick={disabled ? undefined : onClick} className="card-row" style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.56 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: danger ? "var(--danger-deep)" : color || "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: danger ? "var(--danger)" : "var(--text)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{label}</span>
            {badge && <span className="pill" style={{ background: "var(--surface-pop)", color: "var(--text-sec)" }}>{badge}</span>}
          </div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{sub}</div>}
        </div>
      </div>
      {!danger && !disabled && <span style={{ color: "var(--text-dim)", fontSize: 18 }}>{">"}</span>}
    </div>
  );

  if (screen === "main") {
    return (
      <div style={{ padding: "20px 18px", paddingBottom: 100 }}>
        <div className="card" style={{ padding: "20px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={user?.name || "?"} size={52} fontSize={20} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)" }}>{user?.phone}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{planSummary.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{planSummary.message}</div>
            {user?.subscriptionStatus === "trial" && user?.subscriptionEndsAt && (
              <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>Trial ends on {formatSubscriptionDate(user.subscriptionEndsAt)}</div>
            )}
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="card" style={{ padding: "18px 16px", marginBottom: 20, borderLeft: "4px solid var(--gold)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Admin Dashboard</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
              Your admin dashboard is now available from the main tab bar. Use it for user management, subscription approvals, and activity reporting. This settings area still contains your account profile, currency controls, and notifications.
            </div>
          </div>
        )}

        {user?.role !== "admin" && (
          <div className="card" style={{ padding: "18px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Plans and access</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 14 }}>
              {currentPlan === PLANS.PRO && user?.subscriptionStatus === "trial"
                ? "You are currently exploring Pro on trial. Reports, alerts, PDF exports, and advanced insights are fully unlocked until your trial ends."
                : "Free plan covers basic bookkeeping. Pro unlocks reports, alerts, PDF exports, advanced insights, reminders, and secure backup tools."}
            </div>
            <div className="card" style={{ padding: 14, background: "var(--surface-high)", marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6 }}>Free</div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>Basic bookkeeping, limited invoices/customers, no reports, no backup tools.</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginBottom: 6 }}>Pro</div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>PDF exports, reports, smart alerts, advanced dashboard, backups, and priority business tools.</div>
                </div>
              </div>
            </div>
            <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setScreen("plan-request")}>
              {isFreePlanUser ? "Upgrade to Pro" : "Manage Subscription"}
            </button>
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div className="section-label">Business</div>
          <div className="card">
            <MenuRow icon="B" label="Account Profile" sub={account?.name || "Set up your business details"} onClick={() => setScreen("account")} />
            {user?.role !== "admin" && <MenuRow icon="C" label="Customers" sub={`${customers.length} customer(s)`} onClick={() => setScreen("customers")} />}
            <MenuRow icon="$" label="Currency" sub={`${currency?.flag} ${currency?.code} - ${currency?.symbol}`} onClick={() => setShowCurrPicker(true)} />
            <MenuRow icon="R" label="Monthly Report" sub={user?.role === "admin" ? generatingReport ? "Generating admin report..." : "Download admin activity, user, and subscription report" : "Download profit, tax, and GST summary PDF"} onClick={handleReportDownload} />
            {user?.role !== "admin" && <MenuRow icon="L" label="Shared Ledger" badge="Coming Soon" sub="Team collaboration and shared books are planned for a future release." disabled />}
          </div>
        </div>

        <div style={{ marginBottom: 10, marginTop: 20 }}>
          <div className="section-label">Preferences</div>
          <div className="card">
            <div className="card-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-high)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{theme === "dark" ? "M" : "S"}</div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <button className="theme-toggle" onClick={toggle} />
            </div>
            <MenuRow
              icon="P"
              label="Change Password"
              onClick={() => {
                setPassForm({ current: "", next: "", confirm: "" });
                setPassError("");
                setScreen("passcode");
              }}
            />
            {user?.role !== "admin" && <MenuRow icon="G" label="Savings Goal" sub={goals?.monthlySavings ? `Target ${currency?.symbol}${Number(goals.monthlySavings).toLocaleString("en-IN")}` : "Track monthly savings progress"} onClick={() => setScreen("goals")} />}
            <MenuRow icon="N" label="Notifications" sub={notificationPrefs?.browserEnabled ? "Browser and in-app reminders enabled" : "Manage in-app reminders and browser alerts"} onClick={() => setScreen("notifications")} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="card">
            <MenuRow icon="O" label="Sign Out" danger onClick={() => { if (window.confirm("Sign out?")) logout(); }} />
          </div>
        </div>

        {isFreePlanUser ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Backups are available on Pro</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 14 }}>
              Upgrade to Pro to export your bookkeeping data and restore it anytime with secure backup import and export tools.
            </div>
            <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setScreen("plan-request")}>
              Unlock Backups
            </button>
          </div>
        ) : (
          <div className="card">
            <div className="card-row" onClick={handleExport} style={{ cursor: "pointer" }}>
              <span>Export Backup</span>
            </div>
            <div className="card-row" style={{ cursor: "pointer" }}>
              <label style={{ cursor: "pointer", width: "100%" }}>
                Import Backup
                <input type="file" accept="application/json" onChange={handleImport} style={{ display: "none" }} />
              </label>
            </div>
          </div>
        )}

        {showCurrPicker && <CurrencyPicker value={currency} onSelect={cur => { setCurrency(cur); setShowCurrPicker(false); }} onClose={() => setShowCurrPicker(false)} />}
      </div>
    );
  }

  if (screen === "account") {
    return (
      <Modal title="Account Profile" onClose={() => setScreen("main")} onSave={saveAcc} canSave={!!accForm.name.trim()}>
        <Field label="Business Name" required><Input placeholder="Type to enter" value={accForm.name || ""} onChange={e => setAccForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Address"><Textarea placeholder="Full address including state, PIN" value={accForm.address || ""} onChange={e => setAccForm(f => ({ ...f, address: e.target.value }))} /></Field>
        <Field label="GSTIN"><Input placeholder="GSTIN" value={accForm.gstin || ""} onChange={e => setAccForm(f => ({ ...f, gstin: e.target.value }))} /></Field>
        <Field label="Phone"><Input type="tel" placeholder="+91-9391559067" value={accForm.phone || ""} onChange={e => setAccForm(f => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Email"><Input type="email" placeholder="email@example.com" value={accForm.email || ""} onChange={e => setAccForm(f => ({ ...f, email: e.target.value }))} /></Field>
        <Field label="Show HSN/SAC on Invoices">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-high)", borderRadius: 12 }}>
            <span style={{ fontSize: 15, color: "var(--text)" }}>Include HSN/SAC column</span>
            <button onClick={() => setAccForm(f => ({ ...f, showHSN: !f.showHSN }))} style={{ width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s", background: accForm.showHSN ? "var(--accent)" : "var(--border)" }}>
              <div style={{ position: "absolute", top: 3, left: accForm.showHSN ? undefined : 3, right: accForm.showHSN ? 3 : undefined, width: 22, height: 22, borderRadius: 11, background: "#fff", transition: "all 0.3s" }} />
            </button>
          </div>
        </Field>
      </Modal>
    );
  }

  if (screen === "customers") {
    if (user?.role === "admin") return null;
    return (
      <Modal title="Customers" onClose={() => setScreen("main")} onSave={openNewCust} saveLabel="+ Add">
        {customerInsights.length === 0 ? (
          <EmptyState title="No customers yet" message="Add your first customer to start creating invoices and tracking balances." accentColor="var(--blue)" />
        ) : (
          <div className="card">
            {customerInsights.map(customer => (
              <div key={customer.id} className="card-row">
                <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1 }} onClick={() => openCustomerDetail(customer)}>
                  <Avatar name={customer.name} size={38} fontSize={13} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      Balance {fmtMoney(customer.outstanding, currency?.symbol || "Rs")} · Revenue {fmtMoney(customer.totalRevenue, currency?.symbol || "Rs")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => openEditCust(customer)} style={{ background: "var(--blue-deep)", border: "none", borderRadius: 9, color: "var(--blue)", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font)" }}>Edit</button>
                  <DeleteBtn onDelete={() => { if (window.confirm(`Remove ${customer.name}?`)) removeCustomer(customer.id); }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    );
  }

  if (screen === "customer-detail" && selectedCustomer) {
    if (user?.role === "admin") return null;
    return (
      <Modal title={selectedCustomer.name} onClose={() => setScreen("customers")} onSave={() => openEditCust(selectedCustomer)} saveLabel="Edit">
        <div className="card" style={{ padding: "18px", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Outstanding</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: selectedCustomer.outstanding > 0 ? "var(--gold)" : "var(--accent)" }}>{fmtMoney(selectedCustomer.outstanding, currency?.symbol || "Rs")}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Total Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(selectedCustomer.totalRevenue, currency?.symbol || "Rs")}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Paid Invoices</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{selectedCustomer.paidInvoices}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 4 }}>Risk Level</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: selectedCustomer.risk > 0 ? "var(--danger)" : "var(--accent)" }}>
                {selectedCustomer.risk > 0 ? `${Math.round(selectedCustomer.risk * 100)}% late` : "Healthy"}
              </div>
            </div>
          </div>
        </div>

        <div className="section-label">Payment History</div>
        <div className="card">
          {selectedCustomer.payments.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 14, color: "var(--text-dim)" }}>No invoice history yet for this customer.</div>
          ) : (
            selectedCustomer.payments.map(payment => (
              <div key={payment.id} className="card-row">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{payment.number}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {payment.date ? new Date(`${payment.date}T00:00:00`).toLocaleDateString("en-IN") : "--"}
                    {payment.dueMessage ? ` · ${payment.dueMessage}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>{fmtMoney(payment.total, currency?.symbol || "Rs")}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: payment.status === "overdue" ? "var(--danger)" : payment.status === "paid" ? "var(--accent)" : "var(--gold)" }}>{payment.status}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    );
  }

  if (screen === "customer-form") {
    if (user?.role === "admin") return null;
    return (
      <Modal title={editCust ? "Edit Customer" : "New Customer"} onClose={() => setScreen("customers")} onSave={saveCust} canSave={!!custForm?.name.trim()}>
        <Field label="Name" required><Input placeholder="Client / Company name" value={custForm?.name || ""} onChange={e => setCustForm(f => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Email"><Input type="email" placeholder="billing@company.com" value={custForm?.email || ""} onChange={e => setCustForm(f => ({ ...f, email: e.target.value }))} /></Field>
        <Field label="Phone"><Input type="tel" placeholder="+1 555 000 0000" value={custForm?.phone || ""} onChange={e => setCustForm(f => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Address"><Textarea placeholder="Full billing address" value={custForm?.address || ""} onChange={e => setCustForm(f => ({ ...f, address: e.target.value }))} /></Field>
        <Field label="GSTIN (optional)"><Input placeholder="GSTIN" value={custForm?.gstin || ""} onChange={e => setCustForm(f => ({ ...f, gstin: e.target.value }))} /></Field>
      </Modal>
    );
  }

  if (screen === "goals") {
    if (user?.role === "admin") return null;
    return (
      <Modal title="Savings Goal" onClose={() => setScreen("main")} onSave={saveGoalSettings} canSave={true}>
        <Field label="Monthly Savings Goal" hint="Set the profit target you want to hit each month.">
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={goalForm.monthlySavings} onChange={e => setGoalForm({ monthlySavings: e.target.value })} />
        </Field>
      </Modal>
    );
  }

  if (screen === "shared-ledger") {
    if (user?.role === "admin") return null;
    return (
      <Modal title="Shared Ledger" onClose={() => setScreen("main")} onSave={() => setScreen("main")} saveLabel="Done">
        <div className="card" style={{ padding: 18, marginBottom: 16, opacity: 0.76 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Shared ledger is coming soon</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
            We are still building collaborative books, team invites, and shared business access. This feature is visible for roadmap clarity, but it is not live for customers yet.
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>
            For now, EasyKhata focuses on single-user bookkeeping, invoicing, reports, and alerts. Shared ledger and Business collaboration will be enabled in a future release.
          </div>
        </div>
      </Modal>
    );
  }

  if (screen === "notifications") {
    const ToggleRow = ({ label, sub, checked, onChange }) => (
      <div className="card-row">
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
        </div>
        <button onClick={onChange} style={{ width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", transition: "background 0.3s", background: checked ? "var(--accent)" : "var(--border)" }}>
          <div style={{ position: "absolute", top: 3, left: checked ? undefined : 3, right: checked ? 3 : undefined, width: 22, height: 22, borderRadius: 11, background: "#fff", transition: "all 0.3s" }} />
        </button>
      </div>
    );

    return (
      <Modal title="Notifications" onClose={() => setScreen("main")} onSave={saveNotificationSettings} saveLabel="Save">
        <div className="card">
          <ToggleRow
            label="Browser Notifications"
            sub="Show system popups for important reminders when your browser allows it."
            checked={Boolean(notificationForm?.browserEnabled)}
            onChange={() => setNotificationForm(current => ({ ...current, browserEnabled: !current.browserEnabled }))}
          />
          <ToggleRow
            label="Due Soon Invoices"
            sub="Warn when invoices are due within the next 3 days."
            checked={Boolean(notificationForm?.invoiceDue)}
            onChange={() => setNotificationForm(current => ({ ...current, invoiceDue: !current.invoiceDue }))}
          />
          <ToggleRow
            label="Overdue Invoices"
            sub="Highlight invoices that have passed their due date."
            checked={Boolean(notificationForm?.overdueInvoices)}
            onChange={() => setNotificationForm(current => ({ ...current, overdueInvoices: !current.overdueInvoices }))}
          />
          <ToggleRow
            label="Budget Alerts"
            sub="Alert when category budgets are fully used."
            checked={Boolean(notificationForm?.budgetAlerts)}
            onChange={() => setNotificationForm(current => ({ ...current, budgetAlerts: !current.budgetAlerts }))}
          />
          <ToggleRow
            label="Low Balance"
            sub="Warn when the current month is running at a loss."
            checked={Boolean(notificationForm?.lowBalance)}
            onChange={() => setNotificationForm(current => ({ ...current, lowBalance: !current.lowBalance }))}
          />
          <ToggleRow
            label="High Spending"
            sub="Alert when this month is sharply above your recent spending average."
            checked={Boolean(notificationForm?.spendingSpike)}
            onChange={() => setNotificationForm(current => ({ ...current, spendingSpike: !current.spendingSpike }))}
          />
        </div>
      </Modal>
    );
  }

  if (screen === "plan-request") {
    const amount = getBillingAmount(planRequestForm.billingCycle);
    return (
      <Modal
        title="Upgrade via UPI"
        onClose={() => setScreen("main")}
        onSave={submitPlanRequest}
        saveLabel={submittingPayment ? "Sending..." : "Send Payment Proof"}
        canSave={!submittingPayment}
      >
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <Field label="Plan" required hint="Choose the plan you want admin to activate after verifying your payment.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                [PLANS.PRO, "Pro", false],
                [PLANS.BUSINESS, "Business (Coming Soon)", true]
              ].map(([value, label, disabled]) => (
                <button
                  key={value}
                  type="button"
                  className="btn-secondary"
                  onClick={() => !disabled && setPlanRequestForm(current => ({ ...current, targetPlan: value }))}
                  style={{
                    padding: "12px 14px",
                    background: planRequestForm.targetPlan === value && !disabled ? "var(--surface-pop)" : "var(--surface-high)",
                    borderColor: planRequestForm.targetPlan === value && !disabled ? "var(--accent)" : "var(--border)",
                    color: disabled ? "var(--text-dim)" : planRequestForm.targetPlan === value ? "var(--text)" : "var(--text-sec)",
                    opacity: disabled ? 0.55 : 1,
                    cursor: disabled ? "not-allowed" : "pointer"
                  }}
                  disabled={disabled}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Billing Cycle" required hint="Select the cycle you are paying for.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                [BILLING_CYCLES.MONTHLY, `Monthly - Rs ${UPI_CONFIG.monthlyAmount}`],
                [BILLING_CYCLES.YEARLY, `Yearly - Rs ${UPI_CONFIG.yearlyAmount}`]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPlanRequestForm(current => ({ ...current, billingCycle: value }))}
                  style={{
                    padding: "12px 14px",
                    background: planRequestForm.billingCycle === value ? "var(--surface-pop)" : "var(--surface-high)",
                    borderColor: planRequestForm.billingCycle === value ? "var(--accent)" : "var(--border)",
                    color: planRequestForm.billingCycle === value ? "var(--text)" : "var(--text-sec)"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="UPI Payment Details" required hint="Pay the exact amount below and then submit your proof.">
            <div className="card" style={{ padding: 14, background: "var(--surface-high)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Payee: {UPI_CONFIG.payeeName}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>UPI ID: {UPI_CONFIG.upiId}</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)" }}>Amount to pay: Rs {amount}</div>
            </div>
          </Field>
          <Field label="UPI Transaction ID" required hint="Enter the reference number shown after your payment succeeds.">
            <Input
              placeholder="Example: 123456789012"
              value={planRequestForm.transactionId}
              onChange={event => setPlanRequestForm(current => ({ ...current, transactionId: event.target.value }))}
            />
          </Field>
          <Field label="Send Screenshot to Admin" required hint="Email the screenshot to admin after payment. The request below stores your transaction details in the app.">
            <div className="card" style={{ padding: 14, background: "var(--surface-high)" }}>
              <div style={{ fontSize: 13, color: "var(--text-sec)", marginBottom: 8 }}>Admin email</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 12 }}>{APP_SUPPORT_EMAIL}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={copySupportEmail}>
                  Copy Email
                </button>
                <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={emailPaymentProof}>
                  Email Screenshot
                </button>
              </div>
            </div>
          </Field>
          <Field label="Message to Admin" hint="Optional note like the UPI app used or anything you want admin to know.">
            <Textarea
              placeholder="Example: Paid using PhonePe from my business account."
              value={planRequestForm.note}
              onChange={event => setPlanRequestForm(current => ({ ...current, note: event.target.value }))}
            />
          </Field>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>How verification works</div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
            After payment, email the screenshot to {APP_SUPPORT_EMAIL} and submit your transaction ID here. Admin will match the email proof with your in-app request and then activate your subscription.
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal title="Change Password" onClose={() => setScreen("main")} onSave={handleChangePassword} canSave={true}>
        <Field label="Current Password">
          <Input type="password" autoComplete="current-password" placeholder="Enter your current password" value={passForm.current} onChange={e => setPassForm(f => ({ ...f, current: e.target.value }))} />
        </Field>
        <Field label="New Password" hint="Use at least 6 characters.">
          <Input type="password" autoComplete="new-password" placeholder="Create a new password" value={passForm.next} onChange={e => setPassForm(f => ({ ...f, next: e.target.value }))} />
        </Field>
        <Field label="Confirm New Password">
          <Input type="password" autoComplete="new-password" placeholder="Re-enter the new password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} />
        </Field>
        {passError && <p style={{ color: "var(--danger)", fontSize: 14, marginTop: 8, textAlign: "center" }}>{passError}</p>}
      </Modal>
      <UpgradeModal open={!!upgradeInfo} title={upgradeInfo?.title} message={upgradeInfo?.message} onClose={() => setUpgradeInfo(null)} />
    </>
  );
}
