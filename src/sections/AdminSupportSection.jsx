import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminApi } from "../lib/api";
import { SectionSkeleton, WorkflowSetupCard } from "../components/UI";
import { logError } from "../utils/logger";

const QUICK_REPLIES = [
  { label: "Investigating",   text: "Thanks for reaching out! We're looking into this and will update you shortly." },
  { label: "Need screenshot", text: "Could you share a screenshot or screen recording of what you're seeing? That'll help us reproduce it faster." },
  { label: "Next release",    text: "This is a known issue and a fix is in progress. It will be included in our next release — we'll notify you once it's live." },
  { label: "Clear cache",     text: "Please try force-closing the app and reopening it. If the issue persists, go to Settings → Apps → EazyKhata → Clear Cache." },
  { label: "Resolved",        text: "This has been resolved. Please update the app to the latest version and let us know if you still see the issue." },
  { label: "Billing done",    text: "Your billing request has been processed. The change will reflect within 24 hours. Reach out if anything looks off." },
];

function fmtTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatTicketStatus(status) {
  if (status === "resolved") return "Resolved";
  if (status === "in_progress") return "In Progress";
  return "Open";
}

function normalizeSupportMessages(ticket) {
  const baseMessages = Array.isArray(ticket?.messages) ? ticket.messages : [];
  if (baseMessages.length) return baseMessages;
  const fallbackMessage = String(ticket?.message || "").trim();
  if (!fallbackMessage) return [];
  return [{
    id: `${ticket?.id || "ticket"}-initial`,
    senderRole: "user",
    senderId: ticket?.userId || "",
    senderName: ticket?.userName || "User",
    message: fallbackMessage,
    createdAt: ticket?.createdAt || ""
  }];
}

function getPriority(ticket) {
  const ageMs = Date.now() - new Date(ticket?.createdAt || Date.now()).getTime();
  const ageDays = Math.floor(ageMs / 86400000);
  if (ticket?.topic === "billing" || ticket?.topic === "payment" || ageDays >= 7) return "High";
  if (ageDays >= 3) return "Medium";
  return "Low";
}

function getSlaBadge(ticket) {
  if ((ticket?.status || "open") === "resolved") return "Met";
  const msgs = ticket?.messages || [];
  const lastMsg = msgs[msgs.length - 1];
  const refDate = lastMsg?.createdAt || ticket?.createdAt || Date.now();
  return Date.now() - new Date(refDate).getTime() > 72 * 3600000 ? "Overdue" : "On Track";
}

function needsAdminReply(ticket) {
  const msgs = ticket?.messages || [];
  if (!msgs.length) return ticket?.status !== "resolved";
  return msgs[msgs.length - 1]?.senderRole === "user" && ticket?.status !== "resolved";
}

const PRIORITY_COLORS = {
  High:   { bg: "var(--danger-deep)", text: "var(--danger)" },
  Medium: { bg: "var(--gold-deep)",   text: "var(--gold)" },
  Low:    { bg: "var(--surface-high)", text: "var(--text-dim)" }
};

const STATUS_COLORS = {
  open:        { bg: "var(--gold-deep)",   text: "var(--gold)" },
  in_progress: { bg: "var(--blue-deep)",   text: "var(--blue)" },
  resolved:    { bg: "var(--accent-deep)", text: "var(--accent)" }
};

function ChatBubble({ msg }) {
  const isAdmin = msg.senderRole === "admin";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start", marginBottom: 12 }}>
      <div style={{
        maxWidth: "80%",
        padding: "10px 13px",
        borderRadius: isAdmin ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
        background: isAdmin ? "color-mix(in srgb, var(--accent) 15%, var(--surface-high))" : "var(--surface-high)",
        border: `1px solid ${isAdmin ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--border)"}`,
        fontSize: 13,
        color: "var(--text)",
        lineHeight: 1.6
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: isAdmin ? "var(--accent)" : "var(--text-dim)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {isAdmin ? "You (Support)" : (msg.senderName || "User")}
        </div>
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.message}</div>
      </div>
      <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>
        {fmtTime(msg.createdAt)}
      </div>
    </div>
  );
}

export default function AdminSupportSection() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingTicketId, setReplyingTicketId] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));
  const messagesEndRef = useRef(null);
  const replyRef = useRef(null);

  const PAGE_SIZE = 50;

  async function fetchTickets(filter) {
    const f = filter !== undefined ? filter : statusFilter;
    setLoading(true); setError(""); setApiPage(1);
    try {
      const res = await adminApi.listSupportTickets(1, PAGE_SIZE, f !== "all" ? f : undefined);
      const list = Array.isArray(res) ? res : (res.tickets || []);
      setTickets(list.map(t => ({ ...t, messages: normalizeSupportMessages(t) })));
      setTotal(res.total ?? list.length);
      setHasMore(res.hasMore ?? false);
    } catch (err) {
      logError("Admin support load error", err);
      setError("Unable to load tickets right now.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const nextPage = apiPage + 1;
    setLoadingMore(true);
    try {
      const res = await adminApi.listSupportTickets(nextPage, PAGE_SIZE, statusFilter !== "all" ? statusFilter : undefined);
      const list = Array.isArray(res) ? res : (res.tickets || []);
      setTickets(prev => [...prev, ...list.map(t => ({ ...t, messages: normalizeSupportMessages(t) }))]);
      setTotal(res.total ?? (tickets.length + list.length));
      setHasMore(res.hasMore ?? false);
      setApiPage(nextPage);
    } catch (err) {
      logError("Admin load-more error", err);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => { fetchTickets(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [selectedTicketId]);

  const visibleTickets = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return tickets;
    return tickets.filter(t => {
      const hay = [t.subject, t.message, t.userName, t.userEmail, t.topic, t.organizationName]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [searchTerm, tickets]);

  const queueStats = useMemo(() => ({
    open:       tickets.filter(t => String(t.status || "open") === "open").length,
    inProgress: tickets.filter(t => String(t.status || "open") === "in_progress").length,
    resolved:   tickets.filter(t => String(t.status || "open") === "resolved").length,
    needsReply: tickets.filter(needsAdminReply).length
  }), [tickets]);

  const selectedTicket = useMemo(() => (
    visibleTickets.find(t => t.id === selectedTicketId) || visibleTickets[0] || null
  ), [selectedTicketId, visibleTickets]);

  useEffect(() => {
    if (!visibleTickets.length) { setSelectedTicketId(""); return; }
    if (!visibleTickets.some(t => t.id === selectedTicketId)) setSelectedTicketId(visibleTickets[0].id);
  }, [selectedTicketId, visibleTickets]);

  function openTicket(id) {
    setSelectedTicketId(id);
    setShowQuickReplies(false);
    setMobileDetailOpen(true);
  }

  function changeStatusFilter(value) {
    setStatusFilter(value);
    fetchTickets(value);
  }

  async function updateStatus(ticket, status) {
    try {
      await adminApi.updateSupportTicket(ticket.id, { status });
      await fetchTickets();
    } catch (err) {
      logError("Support status update error", err);
      setError("Unable to update status.");
    }
  }

  async function sendReply(ticket) {
    const draft = String(replyDrafts?.[ticket.id] || "").trim();
    if (!draft) return;
    setReplyingTicketId(ticket.id);
    try {
      await adminApi.updateSupportTicket(ticket.id, { reply: draft });
      setReplyDrafts(c => ({ ...c, [ticket.id]: "" }));
      setShowQuickReplies(false);
      await fetchTickets();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch (err) {
      logError("Support reply error", err);
      setError("Unable to send reply.");
    } finally {
      setReplyingTicketId("");
    }
  }

  function insertQuickReply(text) {
    if (!selectedTicket) return;
    setReplyDrafts(c => ({ ...c, [selectedTicket.id]: text }));
    setShowQuickReplies(false);
    replyRef.current?.focus();
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && selectedTicket) {
      e.preventDefault();
      sendReply(selectedTicket);
    }
  }

  if (loading) return <SectionSkeleton rows={5} showHero={false} />;

  // ── Ticket list ──────────────────────────────────────────────────────────
  const TicketList = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {visibleTickets.map(ticket => {
        const active = selectedTicket?.id === ticket.id;
        const tsc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
        const tp = getPriority(ticket);
        const tpc = PRIORITY_COLORS[tp] || PRIORITY_COLORS.Low;
        const awaiting = needsAdminReply(ticket);
        const lastMsg = (ticket.messages || []).slice(-1)[0];
        return (
          <button
            key={ticket.id}
            type="button"
            onClick={() => openTicket(ticket.id)}
            style={{
              width: "100%", textAlign: "left", cursor: "pointer",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 14,
              background: active ? "color-mix(in srgb, var(--accent) 7%, var(--bg))" : "var(--bg)",
              padding: "12px 14px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                {awaiting && <span style={{ flexShrink: 0, width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ticket.subject || "Support ticket"}
                </span>
              </div>
              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: tsc.bg, color: tsc.text }}>
                {formatTicketStatus(ticket.status)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 5 }}>
              {ticket.userName || ticket.userEmail || "Unknown"} · {ticket.topic || "other"}
            </div>
            {lastMsg && (
              <div style={{ fontSize: 11, color: awaiting ? "var(--text-sec)" : "var(--text-dim)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {awaiting ? "User: " : "You: "}{lastMsg.message}
              </div>
            )}
            <div style={{ display: "flex", gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: tpc.bg, color: tpc.text }}>{tp}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: getSlaBadge(ticket) === "Overdue" ? "var(--danger-deep)" : "var(--surface-high)", color: getSlaBadge(ticket) === "Overdue" ? "var(--danger)" : "var(--text-dim)" }}>
                SLA {getSlaBadge(ticket)}
              </span>
              <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: "auto" }}>{fmtTime(ticket.updatedAt || ticket.createdAt)}</span>
            </div>
          </button>
        );
      })}
      {hasMore && (
        <button className="btn-secondary" onClick={loadMore} disabled={loadingMore}
          style={{ padding: "10px", fontSize: 12 }}>
          {loadingMore ? "Loading…" : `Load ${total - tickets.length} more`}
        </button>
      )}
    </div>
  );

  // ── Ticket detail ────────────────────────────────────────────────────────
  const priority = selectedTicket ? getPriority(selectedTicket) : null;
  const sla = selectedTicket ? getSlaBadge(selectedTicket) : null;
  const sc = STATUS_COLORS[selectedTicket?.status] || STATUS_COLORS.open;
  const pc = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Low;
  const isSending = selectedTicket && replyingTicketId === selectedTicket.id;
  const replyText = selectedTicket ? String(replyDrafts?.[selectedTicket.id] || "") : "";

  const DetailPanel = selectedTicket ? (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 120px)" : "calc(100vh - 220px)",
      minHeight: 400
    }}>
      {/* Detail header */}
      <div style={{ flexShrink: 0, padding: isMobile ? "0 0 12px" : "0 0 12px", borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileDetailOpen(false)}
            style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to queue
          </button>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedTicket.subject || "Support ticket"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6 }}>
              {selectedTicket.userName || selectedTicket.userEmail || "Unknown"} · {selectedTicket.topic || "other"}
              {selectedTicket.organizationName ? ` · ${selectedTicket.organizationName}` : ""}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {selectedTicket.userPlan && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "var(--blue-deep)", color: "var(--blue)" }}>
                  {selectedTicket.userPlan}
                </span>
              )}
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: pc.bg, color: pc.text }}>{priority}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: sla === "Overdue" ? "var(--danger-deep)" : "var(--surface-high)", color: sla === "Overdue" ? "var(--danger)" : "var(--text-dim)" }}>
                SLA {sla}
              </span>
            </div>
          </div>
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 7, background: sc.bg, color: sc.text }}>
            {formatTicketStatus(selectedTicket.status)}
          </span>
        </div>
      </div>

      {/* Message thread — scrollable */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 2px", WebkitOverflowScrolling: "touch" }}>
        {(selectedTicket.messages || []).length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: "32px 0" }}>No messages yet.</div>
        ) : (
          (selectedTicket.messages || []).map(msg => (
            <ChatBubble key={msg.id || `${msg.senderRole}-${msg.createdAt}`} msg={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer — pinned */}
      <div style={{ flexShrink: 0, paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: 8 }}>
        {/* Quick reply snippets */}
        {showQuickReplies && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {QUICK_REPLIES.map(qr => (
              <button key={qr.label} type="button" onClick={() => insertQuickReply(qr.text)}
                style={{ padding: "5px 10px", fontSize: 11, fontWeight: 600, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-high)", color: "var(--text-sec)", cursor: "pointer" }}>
                {qr.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={replyRef}
          className="input-field"
          placeholder="Write a reply… (Ctrl + Enter to send)"
          value={replyText}
          onChange={e => setReplyDrafts(c => ({ ...c, [selectedTicket.id]: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ width: "100%", boxSizing: "border-box", minHeight: 70, maxHeight: 140, resize: "none", marginBottom: 10 }}
          disabled={selectedTicket.status === "resolved"}
        />

        {/* Primary actions */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => sendReply(selectedTicket)}
            disabled={isSending || !replyText.trim() || selectedTicket.status === "resolved"}
            style={{
              flex: 1, padding: "12px", borderRadius: 12, border: "none",
              background: (!replyText.trim() || isSending || selectedTicket.status === "resolved") ? "var(--surface-high)" : "var(--blue)",
              color: (!replyText.trim() || isSending || selectedTicket.status === "resolved") ? "var(--text-dim)" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: (!replyText.trim() || isSending || selectedTicket.status === "resolved") ? "not-allowed" : "pointer"
            }}
          >
            {isSending ? "Sending…" : "Send Reply"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setShowQuickReplies(v => !v)}
            style={{ padding: "12px 14px", fontSize: 12, flexShrink: 0 }}>
            {showQuickReplies ? "Hide" : "Snippets ▾"}
          </button>
        </div>

        {/* Status actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {selectedTicket.status === "open" && (
            <button className="btn-secondary" type="button" onClick={() => updateStatus(selectedTicket, "in_progress")}
              style={{ flex: 1, padding: "9px", fontSize: 12, color: "var(--blue)" }}>
              Mark In Progress
            </button>
          )}
          {selectedTicket.status !== "resolved" && (
            <button className="btn-secondary" type="button" onClick={() => updateStatus(selectedTicket, "resolved")}
              style={{ flex: 1, padding: "9px", fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
              Resolve ✓
            </button>
          )}
          {selectedTicket.status === "resolved" && (
            <button className="btn-secondary" type="button" onClick={() => updateStatus(selectedTicket, "open")}
              style={{ flex: 1, padding: "9px", fontSize: 12 }}>
              Re-open
            </button>
          )}
        </div>

        <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 8, textAlign: "center" }}>
          Opened {fmtTime(selectedTicket.createdAt)} · Updated {fmtTime(selectedTicket.updatedAt || selectedTicket.createdAt)}
        </div>
      </div>
    </div>
  ) : (
    <WorkflowSetupCard title="Select a ticket" message="Choose a ticket from the queue." tone="info" />
  );

  // ── Mobile: show list OR detail, not both ────────────────────────────────
  if (isMobile && mobileDetailOpen && selectedTicket) {
    return (
      <div style={{ padding: "16px 16px calc(env(safe-area-inset-bottom, 0px) + 80px)" }}>
        {error && <div style={{ marginBottom: 12, color: "var(--danger)", fontSize: 13 }}>{error}</div>}
        <div className="card" style={{ marginBottom: 0 }}>
          {DetailPanel}
        </div>
      </div>
    );
  }

  // ── Desktop / mobile list view ────────────────────────────────────────────
  return (
    <div style={{ padding: "22px 18px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 2 }}>Support Queue</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {queueStats.open} open · {queueStats.inProgress} in progress · {queueStats.resolved} resolved
            </span>
            {queueStats.needsReply > 0 && (
              <span style={{ padding: "2px 8px", borderRadius: 6, background: "var(--danger-deep)", color: "var(--danger)", fontWeight: 700, fontSize: 11 }}>
                {queueStats.needsReply} need reply
              </span>
            )}
          </div>
        </div>
        <button className="btn-secondary" onClick={() => fetchTickets()} style={{ padding: "8px 14px", fontSize: 12, flexShrink: 0 }}>
          Refresh
        </button>
      </div>

      {/* Search + filters */}
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <input className="input-field" placeholder="Search by subject, user, email, or topic"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[["all", "All"], ["open", `Open (${queueStats.open})`], ["in_progress", `In Progress (${queueStats.inProgress})`], ["resolved", `Resolved (${queueStats.resolved})`]].map(([val, label]) => (
            <button key={val} className="btn-secondary" onClick={() => changeStatusFilter(val)}
              style={{ padding: "7px 11px", fontSize: 12, background: statusFilter === val ? "var(--surface-pop)" : "var(--surface-high)" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-dim)" }}>
          {tickets.length}{total > tickets.length ? ` of ${total}` : ""} ticket{tickets.length !== 1 ? "s" : ""}
          {searchTerm.trim() && visibleTickets.length !== tickets.length ? ` · ${visibleTickets.length} match` : ""}
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 14, color: "var(--danger)", fontSize: 13 }}>{error}</div>}

      {!visibleTickets.length ? (
        <div className="card"><WorkflowSetupCard title="No support tickets" message="No tickets match this filter." tone="info" /></div>
      ) : isMobile ? (
        // Mobile: just the list, tapping opens detail
        <div className="card">{TicketList}</div>
      ) : (
        // Desktop: side-by-side
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
          <div className="card" style={{ marginBottom: 0, maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
            {TicketList}
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            {DetailPanel}
          </div>
        </div>
      )}
    </div>
  );
}
