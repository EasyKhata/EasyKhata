import React, { useEffect, useRef, useState } from "react";
import { Modal, Field, Input, Textarea, Select } from "../../components/UI";
import { APP_SUPPORT_EMAIL } from "../../utils/brand";

export const SUPPORT_TOPIC_OPTIONS = [
  ["account", "Account access"],
  ["billing", "Billing and subscription"],
  ["bug", "Bug report"],
  ["feature", "Feature request"],
  ["data", "Data or reports"],
  ["other", "Other"]
];

export const SUPPORT_STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved"
};

const STATUS_COLORS = {
  open:        { bg: "var(--gold-deep)",    text: "var(--gold)" },
  in_progress: { bg: "var(--blue-deep)",    text: "var(--blue)" },
  resolved:    { bg: "var(--accent-deep)",  text: "var(--accent)" }
};

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function hasUnreadAdminReply(ticket) {
  const msgs = ticket?.messages || [];
  return msgs.length > 0 && msgs[msgs.length - 1]?.senderRole === "admin";
}

function ChatBubble({ msg }) {
  const isAdmin = msg.senderRole === "admin";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-start" : "flex-end", marginBottom: 10 }}>
      <div style={{
        maxWidth: "82%",
        padding: "10px 12px",
        borderRadius: isAdmin ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
        background: isAdmin ? "var(--surface-high)" : "color-mix(in srgb, var(--accent) 14%, var(--surface-high))",
        border: isAdmin ? "1px solid var(--border)" : "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
        color: "var(--text)",
        fontSize: 13,
        lineHeight: 1.6
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: isAdmin ? "var(--accent)" : "var(--text-dim)", marginBottom: 4, letterSpacing: 0.4 }}>
          {isAdmin ? "Support Team" : "You"}
        </div>
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.message}</div>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3, paddingLeft: isAdmin ? 2 : 0, paddingRight: isAdmin ? 0 : 2 }}>
        {fmtTime(msg.createdAt)}
      </div>
    </div>
  );
}

export default function SupportModal({
  view,
  onViewChange,
  form,
  onFormChange,
  tickets,
  loading,
  submitting,
  replyDrafts,
  onReplyDraftChange,
  replyingTicketId,
  selectedTicketId,
  onSelectTicket,
  selectedTicket,
  onSubmit,
  onSendReply,
  onCopyEmail,
  onEmailInstead,
  onCopySupportContext,
  onClose
}) {
  const isNew = view === "new";
  const [mobileConvOpen, setMobileConvOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const replyRef = useRef(null);

  useEffect(() => {
    if (selectedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.id, selectedTicket?.messages?.length]);

  function handleSelectTicket(id) {
    onSelectTicket(id);
    setMobileConvOpen(true);
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && selectedTicket && selectedTicket.status !== "resolved") {
      e.preventDefault();
      onSendReply(selectedTicket);
    }
  }

  const statusColors = STATUS_COLORS[selectedTicket?.status] || STATUS_COLORS.open;

  return (
    <Modal
      title={isNew ? "New Support Ticket" : mobileConvOpen && selectedTicket ? selectedTicket.subject || "Conversation" : "Support"}
      onClose={isNew ? () => onViewChange("inbox") : (mobileConvOpen ? () => setMobileConvOpen(false) : onClose)}
      onSave={isNew ? onSubmit : null}
      saveLabel={submitting ? "Submitting…" : "Submit Ticket"}
      canSave={!submitting && Boolean(form.message?.trim())}
      accentColor="var(--blue)"
    >
      {/* Tab bar */}
      {!mobileConvOpen && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, padding: "2px", background: "var(--surface-high)", borderRadius: 12, border: "1px solid var(--border)" }}>
          {[["inbox", "My Tickets"], ["new", "New Ticket"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onViewChange(key)}
              style={{
                flex: 1,
                padding: "9px 12px",
                fontSize: 13,
                fontWeight: view === key ? 700 : 500,
                border: "none",
                borderRadius: 10,
                background: view === key ? "var(--bg)" : "transparent",
                color: view === key ? "var(--text)" : "var(--text-dim)",
                cursor: "pointer",
                boxShadow: view === key ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s"
              }}
            >
              {label}
              {key === "inbox" && tickets.some(hasUnreadAdminReply) && (
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", marginLeft: 6, verticalAlign: "middle" }} />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── NEW TICKET FORM ── */}
      {isNew && (
        <>
          <Field label="Topic" required>
            <Select value={form.topic} onChange={e => onFormChange(c => ({ ...c, topic: e.target.value }))}>
              {SUPPORT_TOPIC_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Short summary" hint="Optional — we'll generate one if left blank.">
            <Input
              placeholder="e.g. Invoice PDF is not downloading"
              value={form.subject || ""}
              onChange={e => onFormChange(c => ({ ...c, subject: e.target.value }))}
            />
          </Field>
          <Field label="Describe the issue" required hint="What happened? What did you expect?">
            <Textarea
              placeholder="I clicked Download PDF and nothing happened. It started after I updated the customer address."
              value={form.message || ""}
              onChange={e => onFormChange(c => ({ ...c, message: e.target.value }))}
            />
          </Field>
          <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7, marginTop: 4 }}>
            Or email us directly at{" "}
            <button type="button" onClick={onCopyEmail} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              {APP_SUPPORT_EMAIL}
            </button>
          </div>
        </>
      )}

      {/* ── INBOX — TICKET LIST ── */}
      {!isNew && !mobileConvOpen && (
        <>
          {loading ? (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: "24px 16px", borderRadius: 14, background: "var(--surface-high)", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No tickets yet</div>
              <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 14 }}>Use "New Ticket" to raise a request. We usually respond within 24 hours.</div>
              <button type="button" className="btn-secondary" style={{ padding: "9px 16px", fontSize: 13 }} onClick={() => onViewChange("new")}>
                Create First Ticket →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tickets.map(ticket => {
                const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
                const unread = hasUnreadAdminReply(ticket);
                const lastMsg = (ticket.messages || []).slice(-1)[0];
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleSelectTicket(ticket.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: `1px solid ${selectedTicketId === ticket.id ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 14,
                      background: selectedTicketId === ticket.id ? "color-mix(in srgb, var(--accent) 7%, var(--bg))" : "var(--surface-high)",
                      padding: "12px 14px",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        {unread && <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ticket.subject || "Support ticket"}
                        </span>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: sc.bg, color: sc.text }}>
                        {SUPPORT_STATUS_LABELS[ticket.status] || "Open"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      {unread ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>Support replied · </span> : null}
                      {lastMsg ? lastMsg.message.slice(0, 60) + (lastMsg.message.length > 60 ? "…" : "") : "No messages"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                      {fmtTime(ticket.updatedAt || ticket.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── OPEN CONVERSATION ── */}
      {!isNew && mobileConvOpen && selectedTicket && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{SUPPORT_TOPIC_OPTIONS.find(([v]) => v === selectedTicket.topic)?.[1] || "Support"}</div>
            </div>
            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: statusColors.bg, color: statusColors.text }}>
              {SUPPORT_STATUS_LABELS[selectedTicket.status] || "Open"}
            </span>
          </div>

          {/* Message thread */}
          <div style={{ minHeight: 140, maxHeight: 340, overflowY: "auto", padding: "4px 2px", marginBottom: 12, WebkitOverflowScrolling: "touch" }}>
            {(selectedTicket.messages || []).length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: "20px 0" }}>No messages yet.</div>
            ) : (
              (selectedTicket.messages || []).map(msg => (
                <ChatBubble key={msg.id || `${msg.senderRole}-${msg.createdAt}`} msg={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply area */}
          {selectedTicket.status !== "resolved" ? (
            <>
              <Textarea
                ref={replyRef}
                placeholder="Write a reply… (Ctrl + Enter to send)"
                value={replyDrafts?.[selectedTicket.id] || ""}
                onChange={e => onReplyDraftChange(c => ({ ...c, [selectedTicket.id]: e.target.value }))}
                onKeyDown={handleKeyDown}
                style={{ minHeight: 76, marginBottom: 8 }}
              />
              <button
                type="button"
                onClick={() => onSendReply(selectedTicket)}
                disabled={replyingTicketId === selectedTicket.id || !String(replyDrafts?.[selectedTicket.id] || "").trim()}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 12,
                  border: "none",
                  background: "var(--blue)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: (replyingTicketId === selectedTicket.id || !String(replyDrafts?.[selectedTicket.id] || "").trim()) ? "not-allowed" : "pointer",
                  opacity: (replyingTicketId === selectedTicket.id || !String(replyDrafts?.[selectedTicket.id] || "").trim()) ? 0.55 : 1
                }}
              >
                {replyingTicketId === selectedTicket.id ? "Sending…" : "Send Reply"}
              </button>
            </>
          ) : (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-high)", fontSize: 13, color: "var(--text-sec)", textAlign: "center" }}>
              This ticket is resolved. Open a new ticket if you need further help.
            </div>
          )}
        </>
      )}

      {/* Footer link — only on inbox view, not conversation, not new */}
      {!isNew && !mobileConvOpen && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
          <button type="button" onClick={onEmailInstead} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
            Email us instead at {APP_SUPPORT_EMAIL}
          </button>
        </div>
      )}
    </Modal>
  );
}
