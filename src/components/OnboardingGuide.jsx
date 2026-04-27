import React, { useEffect, useState } from "react";
import { Field, Input } from "./UI";
import { ORG_TYPES } from "../utils/orgTypes";

function buildFormState(account) {
  return { name: account?.name || "" };
}

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, account, onUpdateAccount }) {
  const [form, setForm] = useState(buildFormState(account));
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    setForm(buildFormState(account));
  }, [account?.name]);

  if (!isOpen) return null;

  async function finish() {
    const name = String(form.name || "").trim();
    if (!name) {
      setNameError("Please enter your household name to continue.");
      return;
    }
    setNameError("");
    onUpdateAccount?.({ ...account, name, organizationType: ORG_TYPES.PERSONAL });
    await onComplete?.();
    onNavigate?.({ tab: "dashboard" });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: "var(--bg)",
          width: "min(100%, 520px)",
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.26)"
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)", margin: "0 auto 20px" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Welcome to EazyKhata
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
            Set up your Household
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 20 }}>
            Your account comes with a Household Khata for tracking home income, expenses, and EMIs. Give it a name to get started.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "0 20px 20px" }}>
          <Field label="Household Name" required error={nameError}>
            <Input
              placeholder="e.g. Reddy Family"
              value={form.name}
              onChange={e => {
                setForm(current => ({ ...current, name: e.target.value }));
                if (nameError) setNameError("");
              }}
              error={nameError}
            />
          </Field>
          {nameError && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginTop: -6, marginBottom: 10, fontWeight: 600 }}>
              {nameError}
            </div>
          )}
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-high)", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.7, marginTop: 6 }}>
            You can add a second Khata (Freelancer or Apartment) anytime from <strong>New Khata</strong> in the settings.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px calc(20px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--border)" }}>
          <div style={{ height: 16 }} />
          <button
            className="btn-primary"
            style={{ width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 800, borderRadius: 14 }}
            onClick={finish}
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
