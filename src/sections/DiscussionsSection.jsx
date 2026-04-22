import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { messagesApi } from "../lib/api";
import { DeleteBtn } from "../components/UI";

const MAX_MSG_LEN = 500;
const POLL_INTERVAL = 8000;

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
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
}

function Avatar({ name, tone = "member", size = 34 }) {
  const colors = {
    owner: "var(--accent)",
    admin: "var(--gold)",
    me: "var(--accent)",
    member: "var(--blue)"
  };
  const background = colors[tone] || colors.member;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 8px 18px rgba(0,0,0,0.12)"
      }}
    >
      {getInitials(name)}
    </div>
  );
}

function roleTone(role, isMe) {
  if (isMe) return "me";
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return "member";
}

export default function DiscussionsSection() {
  const { user } = useAuth();
  const { activeSharedOrgKey, activeOrgId } = useData();

  const sharedInfo = activeSharedOrgKey ? user?.sharedOrgs?.[activeSharedOrgKey] : null;
  const ownerId = sharedInfo?.ownerId || user?.id;
  const orgId = sharedInfo?.orgId || activeOrgId;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const latestSentAtRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isOwner = String(ownerId || "") === String(user?.id || "");
  const isAdmin = user?.role === "admin";
  const senderName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Resident";
  const senderRole = isOwner ? "owner" : isAdmin ? "admin" : "member";

  const fetchMessages = useCallback(async (after) => {
    if (!ownerId || !orgId) return;
    try {
      const rows = await messagesApi.list(ownerId, orgId, after || undefined);
      if (!Array.isArray(rows) || rows.length === 0) return;

      setMessages(prev => {
        const existingIds = new Set(prev.map(message => message.id));
        const fresh = rows.filter(message => !existingIds.has(message.id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
      });

      const newest = rows.reduce(
        (max, message) => (String(message.sentAt) > String(max) ? String(message.sentAt) : max),
        latestSentAtRef.current || ""
      );
      latestSentAtRef.current = newest;
      setLoadError("");
    } catch (err) {
      if (!after) setLoadError("Could not load messages. Retrying...");
    }
  }, [orgId, ownerId]);

  useEffect(() => {
    if (!ownerId || !orgId) return undefined;
    setLoading(true);
    fetchMessages(null).finally(() => setLoading(false));
    return undefined;
  }, [fetchMessages, orgId, ownerId]);

  useEffect(() => {
    if (!ownerId || !orgId) return undefined;
    pollTimerRef.current = setInterval(() => {
      fetchMessages(latestSentAtRef.current);
    }, POLL_INTERVAL);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchMessages, orgId, ownerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MSG_LEN) {
      setError(`Message too long (max ${MAX_MSG_LEN} chars).`);
      return;
    }

    setError("");
    setSending(true);

    const optimistic = {
      id: `temp_${Date.now()}`,
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
      setMessages(prev => prev.map(message => (message.id === optimistic.id ? { ...saved } : message)));
      latestSentAtRef.current = String(saved.sentAt);
    } catch (err) {
      setMessages(prev => prev.filter(message => message.id !== optimistic.id));
      setText(trimmed);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleDelete(message) {
    if (message._pending) return;
    setMessages(prev => prev.filter(item => item.id !== message.id));
    try {
      await messagesApi.delete(ownerId, orgId, message.id);
    } catch (err) {
      setMessages(prev => [...prev, message].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt))));
    }
  }

  function canDelete(message) {
    if (message._pending) return false;
    return isAdmin || isOwner || String(message.senderId || "") === String(user?.id || "");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 140px)",
        borderRadius: 22,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--surface)"
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--blue) 18%, var(--surface-high)) 0%, var(--surface) 100%)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <Avatar name="Community" tone="member" size={38} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Apartment Group Chat</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
            Residents and management updates - {messages.length} message{messages.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", padding: "6px 10px", borderRadius: 999, background: "var(--accent-deep)" }}>
          Live
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, var(--bg)) 0%, var(--bg) 100%)"
        }}
      >
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: 14 }}>
            Loading messages...
          </div>
        )}

        {!loading && loadError && (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--danger)", fontSize: 13 }}>{loadError}</div>
        )}

        {!loading && !loadError && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: 14 }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>Chat</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-sec)" }}>No messages yet</div>
            <div>Start the conversation - post an announcement, ask a question, or share an update.</div>
          </div>
        )}

        {messages.map((message, index) => {
          const isMe = String(message.senderId || "") === String(user?.id || "");
          const prevMessage = messages[index - 1];
          const showDate = !prevMessage || new Date(message.sentAt).toDateString() !== new Date(prevMessage.sentAt).toDateString();
          const showSender = !prevMessage || prevMessage.senderId !== message.senderId || showDate;
          const tone = roleTone(message.senderRole, isMe);

          return (
            <React.Fragment key={message.id || index}>
              {showDate && (
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", fontWeight: 700, padding: "6px 0" }}>
                  <span style={{ display: "inline-flex", padding: "5px 10px", borderRadius: 999, background: "color-mix(in srgb, var(--surface) 88%, transparent)", border: "1px solid var(--border)" }}>
                    {new Date(message.sentAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                {showSender && !isMe ? <Avatar name={message.senderName} tone={tone} size={30} /> : !isMe ? <div style={{ width: 30, flexShrink: 0 }} /> : null}

                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showSender && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isMe ? "var(--accent)" : message.senderRole === "owner" ? "var(--accent)" : message.senderRole === "admin" ? "var(--gold)" : "var(--text-sec)",
                        marginBottom: 3,
                        paddingLeft: isMe ? 0 : 2,
                        paddingRight: isMe ? 2 : 0
                      }}
                    >
                      {isMe ? "You" : message.senderName || "Resident"}
                      {message.senderRole === "owner" && !isMe && <span style={{ color: "var(--accent)", marginLeft: 4 }}>- Owner</span>}
                      {message.senderRole === "admin" && !isMe && <span style={{ color: "var(--gold)", marginLeft: 4 }}>- Admin</span>}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flexDirection: isMe ? "row-reverse" : "row" }}>
                    <div
                      style={{
                        background: message._pending
                          ? "color-mix(in srgb, var(--accent) 70%, var(--surface))"
                          : isMe
                            ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white) 0%, var(--accent) 100%)"
                            : "color-mix(in srgb, var(--surface) 92%, white)",
                        color: isMe ? "#fff" : "var(--text)",
                        borderRadius: isMe ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                        padding: "10px 14px 9px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        border: isMe ? "none" : "1px solid var(--border)",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        opacity: message._pending ? 0.7 : 1,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.08)"
                      }}
                    >
                      {message.text}
                    </div>

                    {canDelete(message) && (
                      <DeleteBtn onDelete={() => handleDelete(message)} style={{ opacity: 0.45 }} />
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                    {message._pending ? "Sending..." : formatTime(message.sentAt)}
                  </div>
                </div>

                {showSender && isMe ? <Avatar name={senderName} tone="me" size={30} /> : isMe ? <div style={{ width: 30, flexShrink: 0 }} /> : null}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, padding: "12px 14px 16px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 18, padding: "8px 8px 8px 12px" }}>
          <input
            ref={inputRef}
            className="input-field"
            placeholder="Message the group"
            value={text}
            onChange={event => {
              setText(event.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, border: "none", background: "transparent", padding: 0, minHeight: 22 }}
          />
          <button
            className="btn-primary"
            style={{ width: 44, height: 44, borderRadius: 999, padding: 0, fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, opacity: !text.trim() || sending ? 0.5 : 1 }}
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
