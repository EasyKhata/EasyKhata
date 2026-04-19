import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Modal } from "./modal";

export function Skeleton({ width = "100%", height = 14, radius = 10, style }) {
  return <div className="skeleton shimmer" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SectionSkeleton({ rows = 3, showHero = true }) {
  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      {showHero && (
        <div className="section-hero">
          <Skeleton width="42%" height={12} style={{ marginBottom: 12 }} />
          <Skeleton width="58%" height={44} radius={16} />
          <Skeleton width="36%" height={12} style={{ marginTop: 12 }} />
        </div>
      )}
      <div style={{ padding: "20px 18px 0" }}>
        <div className="card" style={{ padding: 18 }}>
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderBottom: index === rows - 1 ? "none" : "1px solid var(--border)"
              }}
            >
              <div style={{ flex: 1 }}>
                <Skeleton width={index % 2 === 0 ? "58%" : "46%"} height={14} style={{ marginBottom: 8 }} />
                <Skeleton width={index % 2 === 0 ? "34%" : "42%"} height={11} />
              </div>
              <Skeleton width={72} height={18} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="fade-in" style={{ paddingBottom: 24 }}>
      <div className="section-hero">
        <Skeleton width="44%" height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="56%" height={46} radius={16} />
        <Skeleton width="38%" height={12} style={{ marginTop: 12 }} />
      </div>
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card" style={{ padding: 18 }}>
              <Skeleton width="42%" height={10} style={{ marginBottom: 12 }} />
              <Skeleton width="64%" height={24} style={{ marginBottom: 10 }} />
              <Skeleton width="78%" height={11} />
            </div>
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ marginBottom: 22 }}>
            <Skeleton width="28%" height={10} style={{ marginBottom: 10 }} />
            <div className="card" style={{ padding: 18 }}>
              {Array.from({ length: index === 1 ? 1 : 3 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  style={{
                    padding: "10px 0",
                    borderBottom: rowIndex === 2 || index === 1 ? "none" : "1px solid var(--border)"
                  }}
                >
                  <Skeleton
                    width={index === 1 ? "100%" : rowIndex % 2 === 0 ? "72%" : "58%"}
                    height={index === 1 ? 120 : 14}
                    style={{ marginBottom: index === 1 ? 0 : 8 }}
                  />
                  {index !== 1 && <Skeleton width="38%" height={11} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, accentColor = "var(--accent)" }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-orb" style={{ background: `${accentColor}22`, color: accentColor }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, maxWidth: 260 }}>{message}</div>
      {actionLabel && onAction && (
        <button
          className="btn-secondary"
          style={{ marginTop: 16, padding: "10px 16px", color: accentColor, borderColor: `${accentColor}44` }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ToastNotice({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => onClose?.(), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice, onClose]);

  if (!notice) return null;

  const tone = notice.tone || "danger";
  const palette = {
    success: { border: "var(--accent)", background: "var(--accent-deep)", text: "var(--accent)" },
    warning: { border: "var(--gold)", background: "var(--gold-deep)", text: "var(--gold)" },
    danger: { border: "var(--danger)", background: "var(--danger-deep)", text: "var(--danger)" },
    info: { border: "var(--blue)", background: "var(--blue-deep)", text: "var(--blue)" }
  }[tone] || { border: "var(--danger)", background: "var(--danger-deep)", text: "var(--danger)" };

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: "var(--space-4)",
        right: "var(--space-4)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        zIndex: 2200,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        style={{
          width: "min(560px, 100%)",
          pointerEvents: "auto",
          borderRadius: "var(--radius-lg)",
          border: `1px solid ${palette.border}55`,
          background: palette.background,
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          backdropFilter: "blur(8px)"
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: 999, marginTop: 6, background: palette.border, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {notice.title && (
            <div style={{ fontSize: 13, fontWeight: 700, color: palette.text, marginBottom: 4 }}>{notice.title}</div>
          )}
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{notice.message}</div>
        </div>
        <button
          onClick={() => onClose?.()}
          style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

export function UpgradeModal({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <Modal title={title || "Upgrade Required"} onClose={onClose} onSave={onClose} saveLabel="Close" accentColor="var(--gold)">
      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>Premium Feature</div>
        <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.7 }}>
          {message || "This feature is not available on your current plan. Contact admin to upgrade your account."}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: "var(--gold-deep)", color: "var(--gold)", fontSize: 13 }}>
          Subscription access is assigned manually by admin during testing.
        </div>
      </div>
    </Modal>
  );
}

export function SubscriptionBanner({ title, message, onClose }) {
  const [showBanner, setShowBanner] = React.useState(true);
  if (!showBanner) return null;
  return (
    <div className="subscription-banner">
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, maxWidth: 260 }}>{message}</div>
      <button className="close-banner" onClick={() => setShowBanner(false)}>×</button>
    </div>
  );
}
