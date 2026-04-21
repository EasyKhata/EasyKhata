import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { messagesApi } from "../lib/api";
import { DeleteBtn } from "../components/UI";

const MAX_MSG_LEN = 500;
const POLL_INTERVAL = 8000; // 8 seconds

function formatTime(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (isNaN(d)) return "";
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function Avatar({ name, isMe, size = 32 }) {
  const colors = ["var(--accent)", "var(--gold)", "var(--purple)", "var(--blue)", "var(--danger)"];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const bg = isMe ? "var(--accent)" : colors[idx];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

export default function DiscussionsSection() {
  const { user } = useAuth();
  const { activeSharedOrgKey, activeOrgId } = useData();

  // Resolve which org owner's namespace to use for API calls.
  // For member users, user.sharedOrgs[key] holds { ownerId, orgId }.
  // For the org owner, ownerId = user.id and orgId = data.activeOrgId.
  const sharedInfo = activeSharedOrgKey ? user?.sharedOrgs?.[activeSharedOrgKey] : null;
  const ownerId = sharedInfo?.ownerId || user?.id;
  const orgId   = sharedInfo?.orgId   || activeOrgId;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const latestSentAtRef = useRef(null); // ISO string of newest message seen
  const pollTimerRef = useRef(null);

  const isAdmin = user?.role === "admin";
  const senderName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Resident";
  const senderRole = isAdmin ? "admin" : "member";

  // ── Load / poll ─────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (after) => {
    if (!ownerId || !orgId) return;
    try {
      const rows = await messagesApi.list(ownerId, orgId, after || undefined);
      if (!Array.isArray(rows) || rows.length === 0) return;

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const fresh = rows.filter(m => !existingIds.has(m.id));
        if (fresh.length === 0) return prev;
        const merged = [...prev, ...fresh].sort((a, b) =>
          String(a.sentAt).localeCompare(String(b.sentAt))
        );
        return merged;
      });

      // Track the latest sentAt for incremental polls
      const newest = rows.reduce((max, m) =>
        String(m.sentAt) > String(max) ? String(m.sentAt) : max,
        latestSentAtRef.current || ""
      );
      latestSentAtRef.current = newest;

      setLoadError("");
    } catch (err) {
      if (!after) setLoadError("Could not load messages. Retrying…");
    }
  }, [ownerId, orgId]);

  // Initial full load
  useEffect(() => {
    if (!ownerId || !orgId) return;
    setLoading(true);
    fetchMessages(null).finally(() => setLoading(false));
  }, [ownerId, orgId, fetchMessages]);

  // Polling for new messages
  useEffect(() => {
    if (!ownerId || !orgId) return;
    pollTimerRef.current = setInterval(() => {
      fetchMessages(latestSentAtRef.current);
    }, POLL_INTERVAL);
    return () => clearInterval(pollTimerRef.current);
  }, [ownerId, orgId, fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send ────────────────────────────────────────────────────────────────────

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MSG_LEN) {
      setError(`Message too long (max ${MAX_MSG_LEN} chars).`);
      return;
    }
    setError("");
    setSending(true);

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: user?.id || "",
      senderName,
      senderRole,
      text: trimmed,
      sentAt: new Date().toISOString(),
      _pending: true
    };
    setMessages(prev => [...prev, optimistic]);
    setText("");

    try {
      const saved = await messagesApi.send(ownerId, orgId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        text: trimmed,
        senderName,
        senderRole,
        sentAt: optimistic.sentAt
      });
      // Replace optimistic placeholder with real record
      setMessages(prev => prev.map(m => m.id === tempId ? { ...saved } : m));
      latestSentAtRef.current = String(saved.sentAt);
    } catch {
      // Remove optimistic on failure and restore text
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setText(trimmed);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(msg) {
    if (msg._pending) return;
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    try {
      await messagesApi.delete(ownerId, orgId, msg.id);
    } catch {
      setMessages(prev => [...prev, msg].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt))));
    }
  }

  function canDelete(msg) {
    if (msg._pending) return false;
    return isAdmin
      || String(msg.senderId || "") === String(user?.id || "")
      || user?.id === ownerId;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "calc(100vh - 140px)" }}>

      {/* Header */}
      <div className="section-hero" style={{ background: "linear-gradient(145deg, var(--blue-deep, #0d2137) 0%, var(--bg) 60%)", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
          Community Board
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 28, color: "var(--blue)", letterSpacing: -0.5 }}>
          Discussions
        </div>
        <div style={{ fontSize: 13, color: "var(--text-sec)", marginTop: 6 }}>
          Group chat for residents and management · {messages.length} message{messages.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: 14 }}>
            Loading messages…
          </div>
        )}

        {!loading && loadError && (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--danger)", fontSize: 13 }}>{loadError}</div>
        )}

        {!loading && !loadError && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-sec)" }}>No messages yet</div>
            <div>Start the conversation — post an announcement, ask a question, or share an update.</div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = String(msg.senderId || "") === String(user?.id || "");
          const prevMsg = messages[index - 1];
          const showDate = !prevMsg || new Date(msg.sentAt).toDateString() !== new Date(prevMsg.sentAt).toDateString();
          const showSender = !prevMsg || prevMsg.senderId !== msg.senderId || showDate;

          return (
            <React.Fragment key={msg.id || index}>
              {showDate && (
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", fontWeight: 700, letterSpacing: 0.5, padding: "4px 0" }}>
                  {new Date(msg.sentAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                {showSender && !isMe && <Avatar name={msg.senderName} isMe={false} size={30} />}
                {!showSender && !isMe && <div style={{ width: 30, flexShrink: 0 }} />}

                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showSender && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--accent)" : msg.senderRole === "admin" ? "var(--gold)" : "var(--text-sec)", marginBottom: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                      {isMe ? "You" : msg.senderName || "Resident"}
                      {msg.senderRole === "admin" && !isMe && <span style={{ color: "var(--gold)", marginLeft: 4 }}>· Admin</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                    <div style={{
                      background: msg._pending ? "var(--accent-dim, #4a5568)" : isMe ? "var(--accent)" : "var(--surface)",
                      color: isMe ? "#fff" : "var(--text)",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "10px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: isMe ? "none" : "1px solid var(--border)",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      opacity: msg._pending ? 0.7 : 1
                    }}>
                      {msg.text}
                    </div>
                    {canDelete(msg) && (
                      <DeleteBtn onDelete={() => handleDelete(msg)} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                    {msg._pending ? "Sending…" : formatTime(msg.sentAt)}
                  </div>
                </div>

                {showSender && isMe && <Avatar name={senderName} isMe size={30} />}
                {!showSender && isMe && <div style={{ width: 30, flexShrink: 0 }} />}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Compose bar */}
      <div style={{ flexShrink: 0, padding: "10px 14px 16px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            ref={inputRef}
            className="input-field"
            placeholder="Type a message… (Enter to send)"
            value={text}
            onChange={e => { setText(e.target.value); if (error) setError(""); }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1 }}
          />
          <button
            className="btn-primary"
            style={{ padding: "10px 18px", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0, opacity: !text.trim() || sending ? 0.5 : 1 }}
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            Send
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, textAlign: "right" }}>
          {text.length}/{MAX_MSG_LEN}
        </div>
      </div>
    </div>
  );
}
