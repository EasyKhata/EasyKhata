import React, { useEffect, useState } from "react";
import { getUserData, setUserData } from "../utils/storage";

if (typeof document !== "undefined" && !document.getElementById("ek-coach-css")) {
  const el = document.createElement("style");
  el.id = "ek-coach-css";
  el.textContent = `
    @keyframes ek-coach-ring {
      0%   { transform: scale(1); opacity: 0.75; }
      70%  { transform: scale(1.65); opacity: 0; }
      100% { transform: scale(1.65); opacity: 0; }
    }
  `;
  document.head.appendChild(el);
}

export function useCoachMark(userId, key) {
  const [seen, setSeen] = useState(() => getUserData(userId, `coach:${key}`) === true);
  function dismiss() {
    setUserData(userId, `coach:${key}`, true);
    setSeen(true);
  }
  return { seen, dismiss };
}

export default function CoachMark({ anchorRef, label, sub, arrow = "down", color = "var(--saffron)", onDismiss }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    function update() {
      const el = anchorRef?.current;
      if (!el) return;
      setPos(el.getBoundingClientRect());
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  const BUBBLE_W = 214;
  const cx = pos.left + pos.width / 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let bLeft = Math.round(Math.max(12, Math.min(cx - BUBBLE_W / 2, vw - BUBBLE_W - 12)));
  const arrowOff = Math.max(8, Math.min(Math.round(cx - bLeft) - 6, BUBBLE_W - 20));

  const isDown = arrow === "down";
  const bFixed = isDown
    ? { bottom: Math.round(vh - pos.top + 10), left: bLeft }
    : { top: Math.round(pos.bottom + 10), left: bLeft };
  const arrowBorder = isDown
    ? { bottom: -7, left: arrowOff, borderTop: "7px solid var(--card)", borderLeft: "7px solid transparent", borderRight: "7px solid transparent" }
    : { top: -7, left: arrowOff, borderBottom: "7px solid var(--card)", borderLeft: "7px solid transparent", borderRight: "7px solid transparent" };

  const RING = Math.max(pos.width, pos.height) + 20;
  const rTop = Math.round(pos.top + pos.height / 2 - RING / 2);
  const rLeft = Math.round(pos.left + pos.width / 2 - RING / 2);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 490, pointerEvents: "none" }}>
      <div style={{
        position: "fixed", top: rTop, left: rLeft,
        width: RING, height: RING, borderRadius: "50%",
        border: `2.5px solid ${color}`,
        animation: "ek-coach-ring 1.65s ease-out infinite",
        pointerEvents: "none",
      }} />
      <div
        role="button"
        tabIndex={0}
        onClick={onDismiss}
        onKeyDown={e => e.key === "Enter" && onDismiss?.()}
        style={{
          position: "fixed", width: BUBBLE_W, ...bFixed,
          background: "var(--card)",
          border: `1.5px solid color-mix(in srgb, ${color} 45%, var(--border))`,
          borderRadius: 14,
          padding: "10px 12px 10px",
          boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
          pointerEvents: "auto", cursor: "pointer", zIndex: 491,
        }}
      >
        <div style={{ position: "absolute", width: 0, height: 0, ...arrowBorder }} />
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: sub ? 4 : 8 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-sec)", lineHeight: 1.5, marginBottom: 8 }}>{sub}</div>}
        <div style={{ fontSize: 10, color, fontWeight: 700, textAlign: "right" }}>Got it →</div>
      </div>
    </div>
  );
}
