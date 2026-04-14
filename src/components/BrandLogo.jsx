import React from "react";
import { APP_NAME, APP_TAGLINE } from "../utils/brand";
import brandIcon from "../assets/brand/easykhata-c-icon.svg";

export function BrandMark({ size = 44 }) {
  return (
    <img src={brandIcon} width={size} height={size} style={{ width: size, height: size, borderRadius: Math.round(size * 0.24), flexShrink: 0 }} alt={`${APP_NAME} mark`} />
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
