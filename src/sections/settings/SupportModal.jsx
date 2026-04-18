import React from "react";
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

/**
 * Customer support modal — inbox + new ticket creation.
 *
 * Props:
 *   view                   "inbox" | "new"
 *   onViewChange           (view) => void
 *   form                   { topic, subject, message }
 *   onFormChange           (updater) => void
 *   tickets                array of ticket objects
 *   loading                boolean
 *   submitting             boolean
 *   replyDrafts            { [ticketId]: string }
 *   onReplyDraftChange     (updater) => void
 *   replyingTicketId       string
 *   selectedTicketId       string
 *   onSelectTicket         (id) => void
 *   selectedTicket         ticket object | null
 *   onSubmit               async () => void
 *   onSendReply            async (ticket) => void
 *   onCopyEmail            () => void
 *   onEmailInstead         () => void
 *   onCopySupportContext   () => void
 *   onClose                () => void
 */
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

  return (
    <Modal
      title="Customer Support"
      onClose={onClose}
      onSave={isNew ? onSubmit : onClose}
      saveLabel={isNew ? (submitting ? "Submitting..." : "Submit Ticket") : "Done"}
      canSave={isNew ? (!submitting && Boolean(form.message?.trim())) : true}
      accentColor="var(--blue)"
    >
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Need Help?</div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7 }}>
          Track ongoing conversations and create new tickets separately for a cleaner support workflow.
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: "8px 12px", fontSize: 12, background: !isNew ? "var(--surface-pop)" : "var(--surface-high)" }}
            onClick={() => onViewChange("inbox")}
          >
            Conversations
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: "8px 12px", fontSize: 12, background: isNew ? "var(--surface-pop)" : "var(--surface-high)" }}
            onClick={() => onViewChange("new")}
          >
            New Ticket
          </button>
        </div>
      </div>

      {isNew ? (
        <>
          <Field label="What's the issue?" required hint="Pick the closest category so your request is easier to route.">
            <Select value={form.topic} onChange={event => onFormChange(current => ({ ...current, topic: event.target.value }))}>
              {SUPPORT_TOPIC_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Short summary" hint="Optional. We will generate one if you leave this blank.">
            <Input
              placeholder="Example: Invoice PDF is not downloading"
              value={form.subject || ""}
              onChange={event => onFormChange(current => ({ ...current, subject: event.target.value }))}
            />
          </Field>

          <Field label="Message" hint="Describe what happened, what you expected, and any relevant steps.">
            <Textarea
              placeholder="Example: I created an invoice, clicked Download PDF, and nothing happened. This started after I updated the customer address."
              value={form.message || ""}
              onChange={event => onFormChange(current => ({ ...current, message: event.target.value }))}
            />
          </Field>

          <div className="card" style={{ padding: 16, marginTop: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>What to include</div>
            <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.8 }}>
              <div>• What you were trying to do</div>
              <div>• What happened instead</div>
              <div>• The screen or section where it happened</div>
              <div>• Any invoice, customer, or report details that help reproduce it</div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 0 }}>
          {loading ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>
              No support tickets yet. Use New Ticket to raise your first request.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
              <div className="card" style={{ marginBottom: 0, maxHeight: 320, overflowY: "auto" }}>
                {tickets.map(ticket => {
                  const active = selectedTicket?.id === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => onSelectTicket(ticket.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: active ? "1px solid var(--accent)" : "1px solid transparent",
                        borderRadius: 10,
                        background: active ? "var(--surface-pop)" : "transparent",
                        padding: "9px 10px",
                        marginBottom: 8,
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                        {ticket.subject || "Support ticket"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                        {SUPPORT_STATUS_LABELS[ticket.status] || "Open"} ·{" "}
                        {new Date(ticket.updatedAt || ticket.createdAt || Date.now()).toLocaleDateString("en-IN")}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                {!selectedTicket ? (
                  <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Select a ticket from conversations.</div>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                      {selectedTicket.subject || "Support ticket"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8, maxHeight: 220, overflowY: "auto" }}>
                      {(selectedTicket.messages || []).map(msg => (
                        <div
                          key={msg.id || `${msg.senderRole}-${msg.createdAt}`}
                          style={{
                            alignSelf: msg.senderRole === "admin" ? "flex-start" : "flex-end",
                            maxWidth: "90%",
                            padding: "8px 10px",
                            borderRadius: 10,
                            background: msg.senderRole === "admin" ? "var(--blue-deep)" : "var(--surface-high)",
                            color: msg.senderRole === "admin" ? "var(--blue)" : "var(--text-sec)",
                            fontSize: 12,
                            lineHeight: 1.5
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 3, color: "var(--text-dim)" }}>
                            {msg.senderRole === "admin" ? "Support" : "You"}
                          </div>
                          <div>{msg.message}</div>
                        </div>
                      ))}
                    </div>
                    {selectedTicket.status !== "resolved" && (
                      <div style={{ marginTop: 8 }}>
                        <Textarea
                          placeholder="Reply to support..."
                          value={replyDrafts?.[selectedTicket.id] || ""}
                          onChange={event => onReplyDraftChange(current => ({ ...current, [selectedTicket.id]: event.target.value }))}
                          style={{ minHeight: 70 }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ marginTop: 8, padding: "8px 12px", fontSize: 12 }}
                          onClick={() => onSendReply(selectedTicket)}
                          disabled={replyingTicketId === selectedTicket.id}
                        >
                          {replyingTicketId === selectedTicket.id ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <Field label="Support Email">
        <div className="card" style={{ padding: 14, background: "var(--surface-high)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 12 }}>
            {APP_SUPPORT_EMAIL}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={onCopyEmail}>
              Copy Email
            </button>
            <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={onEmailInstead}>
              Email Instead
            </button>
            <button type="button" className="btn-secondary" style={{ padding: "9px 12px", fontSize: 12 }} onClick={onCopySupportContext}>
              Copy Support Context
            </button>
          </div>
        </div>
      </Field>
    </Modal>
  );
}
