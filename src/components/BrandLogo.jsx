import React from "react";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import brandIcon from "../assets/brand/easykhata-c-icon.svg";

// `pulse` makes the mark gently breathe — used on splash/onboarding to telegraph
// "the app is alive and loading." Plain inline use (e.g. header) skips the
// pulse so it doesn't pull attention away from real content.
export function BrandMark({ size = 44, pulse = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        position: "relative",
        flexShrink: 0,
        width: size,
        height: size
      }}
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: Math.round(size * 0.24),
            background: "color-mix(in srgb, var(--accent) 22%, transparent)",
            animation: "brandMarkPulse 2.4s ease-in-out infinite",
            filter: "blur(2px)"
          }}
        />
      )}
      <img
        src={brandIcon}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.24),
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
          animation: pulse ? "brandMarkBreath 2.4s ease-in-out infinite" : undefined
        }}
        alt={`${APP_NAME} mark`}
      />
    </span>
  );
}

export default function BrandLogo({ compact = false, center = false, showTagline = true, nameSize, taglineSize, pulse = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 14, justifyContent: center ? "center" : "flex-start" }}>
      <BrandMark size={compact ? 38 : 50} pulse={pulse} />
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
