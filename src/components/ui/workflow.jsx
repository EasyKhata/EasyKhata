import React from "react";

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

  return (
    <div
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
    >
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
    </div>
  );
}
