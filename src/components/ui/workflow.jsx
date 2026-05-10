import React from "react";
import { motion } from "framer-motion";

function renderWorkflowBadge(badge, index) {
  if (!badge) return null;
  if (React.isValidElement(badge)) return React.cloneElement(badge, { key: badge.key ?? index });
  if (typeof badge === "string") return <span key={index} className="pill">{badge}</span>;
  return (
    <span key={badge.label || index} className="pill" style={badge.tone ? { background: `var(--${badge.tone}-deep)`, color: `var(--${badge.tone})` } : undefined}>
      {badge.label}
    </span>
  );
}

function renderWorkflowAction(action, index) {
  if (!action) return null;
  if (React.isValidElement(action)) return React.cloneElement(action, { key: action.key ?? index });
  return (
    <button
      key={action.label || index}
      type="button"
      className="ledger-action-btn"
      style={action.tone === "danger" ? { color: "var(--danger)" } : action.tone === "accent" ? { color: "var(--accent)" } : action.tone === "gold" ? { color: "var(--gold)" } : undefined}
      onClick={event => {
        event.stopPropagation();
        action.onClick?.(event);
      }}
    >
      {action.label}
    </button>
  );
}

function resolveWorkflowTone(tone) {
  if (!tone) return undefined;
  if (tone.startsWith?.("var(") || tone.startsWith?.("#") || tone.startsWith?.("rgb")) return tone;
  return `var(--${tone})`;
}

export function WorkflowActionStrip({ title, subtitle, actions = [] }) {
  if (!title && !subtitle && actions.length === 0) return null;

  return (
    <div className="workflow-action-strip">
      <div className="workflow-action-copy">
        {title && <div className="workflow-action-title">{title}</div>}
        {subtitle && <div className="workflow-action-subtitle">{subtitle}</div>}
      </div>
      {actions.length > 0 && (
        <div className="workflow-action-list">
          {actions.map(action => (
            <button
              key={action.label}
              type="button"
              className={`workflow-action-pill${action.tone ? ` ${action.tone}` : ""}`}
              onClick={action.onClick}
            >
              {action.dot && <span className="workflow-action-dot" />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowSetupCard({
  eyebrow,
  title,
  message,
  actionLabel,
  onAction,
  tone = "accent",
  secondaryActionLabel,
  onSecondaryAction
}) {
  return (
    <div className={`workflow-setup-card ${tone}`}>
      {eyebrow && <div className="workflow-setup-eyebrow">{eyebrow}</div>}
      <div className="workflow-setup-title">{title}</div>
      {message && <div className="workflow-setup-message">{message}</div>}
      {(actionLabel || secondaryActionLabel) && (
        <div className="workflow-setup-actions">
          {actionLabel && onAction && (
            <button type="button" className="workflow-setup-primary" onClick={onAction}>
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button type="button" className="workflow-setup-secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkflowRecordCard({
  avatar,
  title,
  meta,
  amount,
  amountTone,
  badges,
  actions,
  onClick,
  children
}) {
  const clickable = typeof onClick === "function";

  // If a destructive (tone="danger") action is present we expose a swipe-left
  // gesture in addition to the inline button — drag the row left past the
  // threshold and release to trigger the action. The inline button stays for
  // discoverability and desktop users.
  const dangerAction = Array.isArray(actions)
    ? actions.find(a => a && a.tone === "danger")
    : null;
  const swipeEnabled = Boolean(dangerAction);

  const inner = (
    <>
      {avatar && <div className="workflow-record-avatar">{avatar}</div>}
      <div className="workflow-record-main">
        <div className="workflow-record-head">
          <div className="workflow-record-title">{title}</div>
          {badges ? <div className="workflow-record-badges">{Array.isArray(badges) ? badges.map(renderWorkflowBadge) : badges}</div> : null}
        </div>
        {meta && <div className="workflow-record-meta">{meta}</div>}
        {children}
      </div>
      {(amount !== undefined || actions) && (
        <div className="workflow-record-side">
          {amount !== undefined && (
            <div className="workflow-record-amount" style={amountTone ? { color: resolveWorkflowTone(amountTone) } : undefined}>
              {amount}
            </div>
          )}
          {actions ? <div className="workflow-record-actions">{Array.isArray(actions) ? actions.map(renderWorkflowAction) : actions}</div> : null}
        </div>
      )}
    </>
  );

  if (!swipeEnabled) {
    // Non-destructive rows: original press-depress + click behaviour.
    const Component = clickable ? motion.div : "div";
    const motionProps = clickable
      ? {
          whileTap: { scale: 0.97 },
          transition: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 }
        }
      : {};
    return (
      <Component
        className={`workflow-record-card${clickable ? " clickable" : ""}`}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
          }
        } : undefined}
        {...motionProps}
      >
        {inner}
      </Component>
    );
  }

  return (
    <SwipeableRecordCard
      clickable={clickable}
      onClick={onClick}
      dangerAction={dangerAction}
    >
      {inner}
    </SwipeableRecordCard>
  );
}

// Internal — handles the drag gesture and the destructive backdrop reveal.
// Kept here (not exported) because it's tightly coupled to record-card markup.
function SwipeableRecordCard({ clickable, onClick, dangerAction, children }) {
  const SWIPE_REVEAL = 84;     // backdrop width
  const SWIPE_TRIGGER = 64;    // release past this → fire the action

  return (
    <div className="workflow-record-card-swipe-wrap">
      {/* Destructive backdrop — only visible during the drag. */}
      <div className="workflow-record-card-swipe-backdrop" aria-hidden="true">
        <span>{dangerAction.label || "Delete"}</span>
      </div>

      <motion.div
        className={`workflow-record-card${clickable ? " clickable" : ""}`}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -SWIPE_REVEAL, right: 0 }}
        dragElastic={{ left: 0.18, right: 0 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
          }
        } : undefined}
        onDragEnd={(_, info) => {
          // Past trigger → fire the destructive action with a synthetic event so
          // existing handlers that call event.stopPropagation() don't blow up.
          if (Math.abs(info.offset.x) >= SWIPE_TRIGGER && info.offset.x < 0) {
            const fakeEvent = { stopPropagation() {}, preventDefault() {} };
            try { dangerAction.onClick?.(fakeEvent); } catch { /* ignore */ }
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
