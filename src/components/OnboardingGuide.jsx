import React, { useState } from "react";
import { Field, Input } from "./UI";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

const ORG_CARDS = [
  {
    type: ORG_TYPES.FREELANCER,
    icon: "💼",
    title: "Small Business",
    desc: "Manage clients, invoices, payments, and business expenses.",
    namePlaceholder: "e.g. My Business",
    nameLabel: "Business Name",
    color: "var(--blue)"
  },
  {
    type: ORG_TYPES.APARTMENT,
    icon: "🏢",
    title: "Apartment Society",
    desc: "Handle maintenance collections, flats, and society expenses.",
    namePlaceholder: "e.g. Sunrise Apartments",
    nameLabel: "Society Name",
    color: "var(--gold)"
  }
];

export default function OnboardingGuide({ isOpen, onComplete, onNavigate, account, onUpdateAccount }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [orgName, setOrgName] = useState(account?.name || "");
  const [nameError, setNameError] = useState("");

  if (!isOpen) return null;

  const selectedCard = ORG_CARDS.find(c => c.type === selectedType);

  async function finish() {
    const name = String(orgName || "").trim();
    if (!name) {
      setNameError(`Please enter a name to continue.`);
      return;
    }
    setNameError("");
    await onUpdateAccount?.({ name, organizationType: selectedType });
    await onComplete?.();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)", zIndex: 1000
    }}>
      <div style={{
        background: "var(--bg)", width: "min(100%, 520px)", borderRadius: 20,
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.30)", maxHeight: "88vh"
      }}>
        <div style={{ padding: "14px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--border)", margin: "0 auto 0" }} />
        </div>

        {step === 1 ? (
          <div style={{ overflowY: "auto", padding: "20px 20px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
              Welcome to EasyKhata
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
              What are you tracking?
            </div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 22 }}>
              Pick the one that fits. This sets up your khata with the right tools.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ORG_CARDS.map(card => (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => { setSelectedType(card.type); setOrgName(account?.name || ""); setStep(2); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 14,
                    border: "1.5px solid var(--border)",
                    background: "var(--surface-high)", cursor: "pointer",
                    textAlign: "left", width: "100%"
                  }}
                >
                  <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{card.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{card.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>{card.desc}</div>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--text-dim)", flexShrink: 0 }}>›</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: "10px 14px", borderRadius: 12, background: "var(--surface-high)", fontSize: 12, color: "var(--text-sec)", lineHeight: 1.65 }}>
              Your owner account can manage one khata. Invite admins, viewers, residents, or partners from Settings when you need to share access.
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowY: "auto", padding: "16px 20px 20px", flex: 1 }}>
              <button
                type="button"
                onClick={() => { setStep(1); setNameError(""); }}
                style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", padding: "0 0 14px", display: "flex", alignItems: "center", gap: 4 }}
              >
                ‹ Back
              </button>
              <div style={{ fontSize: 11, fontWeight: 700, color: selectedCard?.color || "var(--accent)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                {selectedCard?.icon} {selectedCard?.title}
              </div>
              <div style={{ fontSize: 21, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                Give it a name
              </div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 20 }}>
                This appears at the top of your khata. You can change it later in Settings.
              </div>
              <Field label={selectedCard?.nameLabel || "Name"} required error={nameError}>
                <Input
                  autoFocus
                  placeholder={selectedCard?.namePlaceholder || ""}
                  value={orgName}
                  onChange={e => {
                    setOrgName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  error={nameError}
                />
              </Field>
            </div>
            <div style={{ padding: "0 20px calc(20px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ height: 16 }} />
              <button
                className="btn-primary"
                style={{ width: "100%", padding: "14px 18px", fontSize: 15, fontWeight: 800, borderRadius: 14 }}
                onClick={finish}
              >
                Get Started →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
