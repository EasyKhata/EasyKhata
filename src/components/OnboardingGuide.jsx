import React, { useState } from "react";
import { Modal, Field, Input, Textarea } from "./UI";

export default function OnboardingGuide({ isOpen, onComplete, data, onNavigate, user, account, onUpdateAccount }) {
  const [step, setStep] = useState(1);
  const [accountForm, setAccountForm] = useState(
    account || { name: "", address: "", gstin: "", phone: "", email: "", showHSN: false }
  );

  const totalSteps = 4;
  const isLastStep = step === totalSteps;
  const stepTitles = [
    "Set Your Business Details",
    "Add Your First Customer",
    "Create Your First Invoice",
    "Record Your First Expense"
  ];

  function handleNext() {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function saveAccountAndContinue() {
    if (!accountForm.name.trim()) {
      alert("Please enter your business name.");
      return;
    }
    // Save account info through parent callback
    if (onUpdateAccount) {
      onUpdateAccount(accountForm);
    }
    handleNext();
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Let's set up your business basics. This information will appear on your invoices and reports.
            </div>
            <Field label="Business Name" required>
              <Input
                placeholder="E.g., Sharma's Kirana Store"
                value={accountForm.name || ""}
                onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="GSTIN">
              <Input
                placeholder="Your GST Registration Number"
                value={accountForm.gstin || ""}
                onChange={e => setAccountForm(f => ({ ...f, gstin: e.target.value }))}
              />
            </Field>
            <Field label="Address">
              <Textarea
                placeholder="Full business address"
                value={accountForm.address || ""}
                onChange={e => setAccountForm(f => ({ ...f, address: e.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="+91-9123456789"
                value={accountForm.phone || ""}
                onChange={e => setAccountForm(f => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="business@example.com"
                value={accountForm.email || ""}
                onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))}
              />
            </Field>
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Add your first customer. You can add more customers later as you need them.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Ready to add a customer?</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 12 }}>
                You'll enter customer details like name, email, phone, and address. This helps you track invoices and create professional bills.
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("settings");
                  onComplete();
                }}
              >
                Go to Customers
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              You can also click "Customers" from the Settings tab anytime to add or manage your customer list.
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Ready to create your first invoice? Click the button below to create a professional invoice for your customer.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do:</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                <div>• Select a customer</div>
                <div>• Add items with description, qty, and rate</div>
                <div>• Set GST/Tax rates</div>
                <div>• Add a due date</div>
                <div>• Save and download as PDF</div>
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("invoices");
                  onComplete();
                }}
              >
                Go to Invoices
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6 }}>
              Finally, let's record your first expense. This helps you track costs and see your profit or loss.
            </div>
            <div style={{ padding: 16, background: "var(--surface-high)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>What you'll do:</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.8, marginBottom: 12 }}>
                <div>• Pick an expense category (Rent, Supplies, etc.)</div>
                <div>• Enter the amount</div>
                <div>• Choose a date</div>
                <div>• Add notes (optional)</div>
              </div>
              <button
                className="btn-secondary"
                style={{ width: "100%" }}
                onClick={() => {
                  onNavigate("expenses");
                  onComplete();
                }}
              >
                Go to Expenses
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, marginTop: 12 }}>
              Once you've added a few receipts and expense entries, your dashboard will show profit, cash flow, and insights.
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .onboarding-modal {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
      <div className="onboarding-modal" style={{ background: "var(--bg)", width: "100%", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Setup Guide · Step {step} of {totalSteps}
            </div>
            <button
              onClick={onComplete}
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-sec)" }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{stepTitles[step - 1]}</div>
        </div>

        <div style={{ padding: "20px 18px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: i < step ? "var(--accent)" : "var(--border)"
                  }}
                />
              ))}
            </div>
          </div>

          {renderStepContent()}
        </div>

        <div style={{ padding: "16px 18px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
          {step > 1 && (
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={handleBack}
            >
              Back
            </button>
          )}
          {step === 1 ? (
            <button
              className="btn-primary"
              style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }}
              onClick={saveAccountAndContinue}
            >
              Continue
            </button>
          ) : isLastStep ? (
            <button
              className="btn-primary"
              style={{ flex: 1, background: "var(--accent)", color: "#fff", border: "none" }}
              onClick={handleNext}
            >
              Get Started
            </button>
          ) : (
            <button
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
