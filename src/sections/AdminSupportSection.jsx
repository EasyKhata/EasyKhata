import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api";
import { EmptyState, SectionSkeleton, PaginatedListControls } from "../components/UI";
import { logError } from "../utils/logger";

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
  return [
    {
      id: `${ticket?.id || "ticket"}-initial`,
      senderRole: "user",
      senderId: ticket?.userId || "",
      senderName: ticket?.userName || "User",
      message: fallbackMessage,
      createdAt: ticket?.createdAt || ""
    }
  ];
}

function getPriority(ticket) {
  const ageMs = Date.now() - new Date(ticket?.createdAt || Date.now()).getTime();
  const ageDays = Math.floor(ageMs / 86400000);
  if (ticket?.topic === "billing" || ticket?.topic === "payment" || ageDays >= 7) return "High";
  if (ageDays >= 3) return "Medium";
  return "Low";
}

function getSlaBadge(ticket) {
  if ((ticket?.status || "open") === "resolved") return "SLA Met";
  const ageMs = Date.now() - new Date(ticket?.createdAt || Date.now()).getTime();
  return ageMs > 72 * 60 * 60 * 1000 ? "Overdue" : "On Track";
}

export default function AdminSupportSection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingTicketId, setReplyingTicketId] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(25);

  async function fetchTickets() {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.listSupportTickets();
      // API now returns { tickets, total, page, hasMore } — handle both shapes for safety
      const list = Array.isArray(res) ? res : (res.tickets || []);
      setTickets(list.map(t => ({ ...t, messages: normalizeSupportMessages(t) })));
    } catch (err) {
      logError("Admin support load error", err);
      setError("Unable to load support tickets right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const visibleTickets = useMemo(() => tickets.filter(ticket => {
    if (statusFilter !== "all" && String(ticket.status || "open") !== statusFilter) return false;
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
      ticket.subject,
      ticket.message,
      ticket.userName,
      ticket.userEmail,
      ticket.topic,
      ticket.organizationName
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  }), [searchTerm, statusFilter, tickets]);
  const queueStats = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter(ticket => String(ticket.status || "open") === "open").length,
    in_progress: tickets.filter(ticket => String(ticket.status || "open") === "in_progress").length,
    resolved: tickets.filter(ticket => String(ticket.status || "open") === "resolved").length
  }), [tickets]);
  const selectedTicket = useMemo(() => (
    visibleTickets.find(ticket => ticket.id === selectedTicketId) || visibleTickets[0] || null
  ), [selectedTicketId, visibleTickets]);
  const paginatedQueueTickets = useMemo(() => {
    const startIndex = (queuePage - 1) * queuePageSize;
    return visibleTickets.slice(startIndex, startIndex + queuePageSize);
  }, [queuePage, queuePageSize, visibleTickets]);

  useEffect(() => {
    if (!visibleTickets.length) {
      setSelectedTicketId("");
      return;
    }
    if (!visibleTickets.some(ticket => ticket.id === selectedTicketId)) {
      setSelectedTicketId(visibleTickets[0].id);
    }
  }, [selectedTicketId, visibleTickets]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(visibleTickets.length / queuePageSize));
    if (queuePage > totalPages) setQueuePage(totalPages);
  }, [queuePage, queuePageSize, visibleTickets.length]);

  async function updateSupportTicketStatus(ticket, status) {
    try {
      await adminApi.updateSupportTicket(ticket.id, { status });
      await fetchTickets();
    } catch (err) {
      logError("Support status update error", err);
      setError("Unable to update ticket status.");
    }
  }

  async function sendSupportReply(ticket) {
    const draft = String(replyDrafts?.[ticket.id] || "").trim();
    if (!draft) return;
    setReplyingTicketId(ticket.id);
    try {
      await adminApi.updateSupportTicket(ticket.id, { reply: draft });
      setReplyDrafts(current => ({ ...current, [ticket.id]: "" }));
      await fetchTickets();
    } catch (err) {
      logError("Support reply error", err);
      setError("Unable to send reply right now.");
    } finally {
      setReplyingTicketId("");
    }
  }

  if (loading) return <SectionSkeleton rows={5} showHero={false} />;

  return (
    <div style={{ padding: "22px 18px 100px" }}>
      <div className="section-label">Support Operations</div>
      <div className="card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10 }}>
          <input
            className="input-field"
            placeholder="Search by subject, user, email, topic"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            style={{ marginBottom: 0 }}
          />
          <button className="btn-secondary" onClick={fetchTickets} style={{ padding: "8px 12px", fontSize: 12 }}>
            Refresh
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {[
            ["all", `All (${queueStats.all})`],
            ["open", `Open (${queueStats.open})`],
            ["in_progress", `In Progress (${queueStats.in_progress})`],
            ["resolved", `Resolved (${queueStats.resolved})`]
          ].map(([value, label]) => (
            <button
              key={value}
              className="btn-secondary"
              onClick={() => setStatusFilter(value)}
              style={{ padding: "8px 12px", fontSize: 12, background: statusFilter === value ? "var(--surface-pop)" : "var(--surface-high)" }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <PaginatedListControls
            totalItems={visibleTickets.length}
            page={queuePage}
            pageSize={queuePageSize}
            onPageChange={setQueuePage}
            onPageSizeChange={nextSize => {
              setQueuePageSize(nextSize);
              setQueuePage(1);
            }}
            itemLabel="tickets"
          />
        </div>
      </div>
      {error && (
        <div className="card" style={{ marginBottom: 14, color: "var(--danger)", fontSize: 13 }}>
          {error}
        </div>
      )}
      {!visibleTickets.length ? (
        <div className="card">
          <EmptyState title="No support tickets" message="No tickets match this filter right now." accentColor="var(--blue)" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(260px, 340px) minmax(0, 1fr)", gap: 14 }}>
          <div className="card" style={{ marginBottom: 0, maxHeight: "calc(100vh - 230px)", overflowY: "auto" }}>
            {paginatedQueueTickets.map(ticket => {
              const active = selectedTicket?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: active ? "1px solid var(--accent)" : "1px solid transparent",
                    borderRadius: 10,
                    background: active ? "var(--surface-pop)" : "transparent",
                    padding: "10px 12px",
                    marginBottom: 8,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.4 }}>{ticket.subject || "Support ticket"}</div>
                    <span className="pill" style={{ background: ticket.status === "resolved" ? "var(--accent-deep)" : ticket.status === "in_progress" ? "var(--blue-deep)" : "var(--gold-deep)", color: ticket.status === "resolved" ? "var(--accent)" : ticket.status === "in_progress" ? "var(--blue)" : "var(--gold)" }}>
                      {formatTicketStatus(ticket.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>
                    {ticket.userName || ticket.userEmail || "Unknown user"} · {ticket.topic || "other"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                    Updated {new Date(ticket.updatedAt || ticket.createdAt || Date.now()).toLocaleString("en-IN")}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    <span className="pill" style={{ background: "var(--surface-high)", color: "var(--text-sec)" }}>Priority: {getPriority(ticket)}</span>
                    <span className="pill" style={{ background: getSlaBadge(ticket) === "Overdue" ? "var(--danger-deep)" : "var(--surface-high)", color: getSlaBadge(ticket) === "Overdue" ? "var(--danger)" : "var(--text-sec)" }}>SLA: {getSlaBadge(ticket)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            {!selectedTicket ? (
              <EmptyState title="Select a ticket" message="Choose a ticket from the left queue to operate on it." accentColor="var(--blue)" />
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{selectedTicket.subject || "Support ticket"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                      {selectedTicket.userName || selectedTicket.userEmail || "Unknown user"} · {selectedTicket.topic || "other"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                      Org: {selectedTicket.organizationName || "--"} · Updated {new Date(selectedTicket.updatedAt || selectedTicket.createdAt || Date.now()).toLocaleDateString("en-IN")}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      <span className="pill" style={{ background: "var(--surface-high)", color: "var(--text-sec)" }}>Priority: {getPriority(selectedTicket)}</span>
                      <span className="pill" style={{ background: getSlaBadge(selectedTicket) === "Overdue" ? "var(--danger-deep)" : "var(--surface-high)", color: getSlaBadge(selectedTicket) === "Overdue" ? "var(--danger)" : "var(--text-sec)" }}>SLA: {getSlaBadge(selectedTicket)}</span>
                      <span className="pill" style={{ background: "var(--surface-high)", color: "var(--text-sec)" }}>Assignee: Support Desk</span>
                    </div>
                  </div>
                  <span className="pill" style={{ background: selectedTicket.status === "resolved" ? "var(--accent-deep)" : selectedTicket.status === "in_progress" ? "var(--blue-deep)" : "var(--gold-deep)", color: selectedTicket.status === "resolved" ? "var(--accent)" : selectedTicket.status === "in_progress" ? "var(--blue)" : "var(--gold)" }}>
                    {formatTicketStatus(selectedTicket.status)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.7, marginBottom: 10 }}>{selectedTicket.message}</div>
                <div className="card" style={{ padding: 12, marginBottom: 10, maxHeight: 260, overflowY: "auto" }}>
                  {(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : []).map(msg => (
                    <div key={msg.id || `${msg.senderRole}-${msg.createdAt}`} style={{ marginBottom: 8, display: "flex", justifyContent: msg.senderRole === "admin" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "92%", padding: "8px 10px", borderRadius: 10, background: msg.senderRole === "admin" ? "var(--accent-deep)" : "var(--surface-high)", color: msg.senderRole === "admin" ? "var(--accent)" : "var(--text-sec)", fontSize: 12, lineHeight: 1.5 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 3, color: "var(--text-dim)" }}>
                          {msg.senderRole === "admin" ? "Support" : (msg.senderName || "User")}
                        </div>
                        <div>{msg.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <textarea
                  className="input-field"
                  placeholder="Write an internal-quality response..."
                  value={replyDrafts?.[selectedTicket.id] || ""}
                  onChange={event => setReplyDrafts(current => ({ ...current, [selectedTicket.id]: event.target.value }))}
                  style={{ minHeight: 74, resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <button
                    className="btn-secondary"
                    type="button"
                    style={{ padding: "8px 12px", fontSize: 12, color: "var(--blue)" }}
                    onClick={() => sendSupportReply(selectedTicket)}
                    disabled={replyingTicketId === selectedTicket.id}
                  >
                    {replyingTicketId === selectedTicket.id ? "Sending..." : "Send Reply"}
                  </button>
                  {(selectedTicket.status || "open") !== "in_progress" && (selectedTicket.status || "open") !== "resolved" && (
                    <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12, color: "var(--blue)" }} onClick={() => updateSupportTicketStatus(selectedTicket, "in_progress")}>
                      Mark In Progress
                    </button>
                  )}
                  {(selectedTicket.status || "open") !== "resolved" && (
                    <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12, color: "var(--accent)" }} onClick={() => updateSupportTicketStatus(selectedTicket, "resolved")}>
                      Mark Resolved
                    </button>
                  )}
                  {(selectedTicket.status || "open") !== "open" && (
                    <button className="btn-secondary" type="button" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => updateSupportTicketStatus(selectedTicket, "open")}>
                      Re-open
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
