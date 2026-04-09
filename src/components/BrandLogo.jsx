import React from "react";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";

export function BrandMark({ size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: "linear-gradient(145deg, #7EE8A2 0%, #F6C94E 100%)",
        boxShadow: "0 14px 34px rgba(126,232,162,0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="12" y="10" width="40" height="44" rx="9" fill="#0C0C10" opacity="0.18" />
        <path d="M22 20H42" stroke="#0C0C10" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 30H42" stroke="#0C0C10" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 40H34" stroke="#0C0C10" strokeWidth="4" strokeLinecap="round" />
        <path d="M40 42L45 47L53 36" stroke="#0C0C10" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function BrandLogo({ compact = false, center = false, showTagline = true, nameSize, taglineSize }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, justifyContent: center ? "center" : "flex-start" }}>
      <BrandMark size={compact ? 38 : 50} />
      <div style={{ textAlign: center ? "center" : "left" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: nameSize || (compact ? 22 : 30), color: "var(--text)", lineHeight: 1 }}>
          {APP_NAME}
        </div>
        {showTagline && (
          <div style={{ fontSize: taglineSize || 12, fontWeight: 600, color: "var(--text-sec)", letterSpacing: 0.3, marginTop: 6 }}>
            {APP_TAGLINE}
          </div>
        )}
      </div>
    </div>
  );
}
