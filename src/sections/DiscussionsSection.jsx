import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { messagesApi } from "../lib/api";
import { DeleteBtn } from "../components/UI";

const MAX_MSG_LEN = 500;
const POLL_INTERVAL = 8000;

// Module-level cache — survives component unmounts within the same session.
// Keyed by `${ownerId}_${orgId}` so switching orgs gets the right messages.
const _msgCache = new Map();

// Existing messages may have __ann__: or __poll__: text prefixes from when those
// features were active. Strip them so messages display as readable chat bubbles.
function enrichFromText(m) {
  const t = m.text;
  if (typeof t !== "string") return null;
  if (t.startsWith("__ann__:")) {
    return { messageType: "announcement", text: t.slice(8) };
  }
  if (t.startsWith("__poll__:")) {
    const parts = t.slice(9).split("\x00");
    if (parts.length < 2) return null;
    return { messageType: "poll", text: parts[0] };
  }
  return null;
}

function _normalizeMsg(m, local) {
  const textEnrich = enrichFromText(m);
  if (textEnrich) {
    const base = local ? { ...local, ...m } : { ...m };
    return { ...base, ...textEnrich };
  }
  const type = m.messageType || local?.messageType || "chat";
  const base = local ? { ...local, ...m } : { ...m };
  return { ...base, messageType: type };
}

const MT = {
  CHAT: "chat",
  ANNOUNCEMENT: "announcement",
  POLL: "poll",
  VOTE: "vote",
  PIN: "pin_action",
};
const HIDDEN = new Set([MT.VOTE, MT.PIN]);

function formatTime(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (isNaN(d)) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (d.toDateString() === today.toDateString()) return time;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
}

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// Pins are stored as regular chat messages with a special text prefix because the
// server only accepts messageType "chat".
// Pin  format: __pin__:<msgId>:<1|0>
// Vote format: __vote__:<pollId>:<optionId>:<senderId>  (legacy, hidden)
function decodeActionText(text) {
  if (typeof text !== "string") return null;
  if (text.startsWith("__vote__:")) {
    const p = text.split(":");
    return (p[1] && p[2]) ? { type: "vote", refPollId: p[1], optionId: p[2], senderId: p[3] || null } : null;
  }
  if (text.startsWith("__pin__:")) {
    const p = text.split(":");
    return p[1] ? { type: "pin", refMessageId: p[1], pinned: p[2] === "1" } : null;
  }
  return null;
}

function Av({ name, tone = "member", size = 34 }) {
  const bg = { owner: "var(--accent)", admin: "var(--gold)", me: "var(--accent)", member: "var(--blue)" }[tone] || "var(--blue)";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.14)" }}>
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

// ── Pinned banner ─────────────────────────────────────────────────────────────

function PinnedBanner({ message, canPin, onUnpin }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (message.text || "").slice(0, 80);
  const full = message.text || "";
  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        background: "color-mix(in srgb, var(--gold) 12%, var(--surface-high))",
        borderBottom: "1px solid color-mix(in srgb, var(--gold) 25%, var(--border))",
        cursor: "pointer"
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ fontSize: 14, color: "var(--gold)", flexShrink: 0 }}>📌</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>Pinned message</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expanded ? "normal" : "nowrap" }}>
          {expanded ? full : preview}{!expanded && full.length > 80 ? "…" : ""}
        </div>
      </div>
      {canPin && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onUnpin(); }}
          style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
          title="Unpin"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DiscussionsSection() {
  const { user } = useAuth();
  const { activeSharedOrgKey, activeOrgId } = useData();

  const sharedInfo = activeSharedOrgKey ? user?.sharedOrgs?.[activeSharedOrgKey] : null;
  const ownerId = sharedInfo?.ownerId || user?.id;
  const orgId = sharedInfo?.orgId || activeOrgId;

  const cacheKey = ownerId && orgId ? `${ownerId}_${orgId}` : null;
  const [messages, setMessages] = useState(() => (cacheKey ? (_msgCache.get(cacheKey) || []) : []));
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!cacheKey || !_msgCache.has(cacheKey));

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const latestSentAtRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isOwner = String(ownerId || "") === String(user?.id || "");
  const isAdmin = user?.role === "admin";
  const canPin = isOwner || isAdmin;
  const senderName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Resident";
  const senderRole = isOwner ? "owner" : isAdmin ? "admin" : "member";
  const myId = String(user?.id || "");

  // Persist non-pending messages to module cache so they survive tab navigation.
  useEffect(() => {
    if (!cacheKey) return;
    const toCache = messages.filter(m => !m._pending);
    if (toCache.length > 0) _msgCache.set(cacheKey, toCache);
  }, [messages, cacheKey]);

  // ── Fetch / poll ──────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (after) => {
    if (!ownerId || !orgId) return;
    try {
      const rows = await messagesApi.list(ownerId, orgId, after || undefined);
      if (!Array.isArray(rows) || rows.length === 0) return;
      setMessages(prev => {
        const localById = new Map(prev.map(m => [m.id, m]));
        if (after) {
          const fresh = rows
            .filter(m => !localById.has(m.id))
            .map(m => _normalizeMsg(m, null));
          if (fresh.length === 0) return prev;
          return [...prev, ...fresh].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
        }
        const merged = rows.map(m => _normalizeMsg(m, localById.get(m.id)));
        const serverIds = new Set(rows.map(m => m.id));
        const pending = prev.filter(m => m._pending && !serverIds.has(m.id));
        return [...merged, ...pending].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
      });
      const newest = rows.reduce((max, m) => (String(m.sentAt) > String(max) ? String(m.sentAt) : max), latestSentAtRef.current || "");
      latestSentAtRef.current = newest;
      setLoadError("");
    } catch {
      if (!after) setLoadError("Could not load messages. Retrying...");
    }
  }, [orgId, ownerId]);

  useEffect(() => {
    if (!ownerId || !orgId) return;
    const hasCached = cacheKey && _msgCache.has(cacheKey);
    if (!hasCached) setLoading(true);
    fetchMessages(null).finally(() => setLoading(false));
  }, [fetchMessages, orgId, ownerId, cacheKey]);

  useEffect(() => {
    if (!ownerId || !orgId) return () => {};
    pollTimerRef.current = setInterval(() => fetchMessages(latestSentAtRef.current), POLL_INTERVAL);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchMessages, orgId, ownerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const { visibleMessages, pinnedMessage } = useMemo(() => {
    let latestPin = null;

    messages.forEach(m => {
      const action = decodeActionText(m.text);
      if (m.messageType === MT.PIN || action?.type === "pin") {
        const pin = action ? { ...m, refMessageId: action.refMessageId, pinned: action.pinned } : m;
        if (!latestPin || String(pin.sentAt) > String(latestPin.sentAt)) latestPin = pin;
      }
    });

    const pinnedId = latestPin?.pinned ? latestPin.refMessageId : null;
    const pinned = pinnedId ? messages.find(m => m.id === pinnedId) : null;

    const visible = messages
      .map(m => { const e = enrichFromText(m); return e ? { ...m, ...e } : m; })
      .filter(m => {
        if (HIDDEN.has(m.messageType)) return false;
        if (decodeActionText(m.text)) return false;
        return true;
      });

    return { visibleMessages: visible, pinnedMessage: pinned };
  }, [messages]);

  // ── Send handlers ─────────────────────────────────────────────────────────

  async function sendMessage(payload, optimisticExtra = {}) {
    const optimistic = {
      id: `temp_${Date.now()}`,
      senderId: myId,
      senderName,
      senderRole,
      sentAt: new Date().toISOString(),
      _pending: true,
      ...payload,
      ...optimisticExtra,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const saved = await messagesApi.send(ownerId, orgId, {
        id: crypto.randomUUID(),
        senderId: myId,
        senderName,
        senderRole,
        sentAt: optimistic.sentAt,
        ...payload,
      });
      const rawMerged = {
        ...optimistic,
        ...saved,
        messageType: saved.messageType || optimistic.messageType,
        senderId: saved.senderId || optimistic.senderId,
        _pending: false,
      };
      const textEnrich = enrichFromText(rawMerged);
      const merged = textEnrich ? { ...rawMerged, ...textEnrich } : rawMerged;
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? merged : m)));
      latestSentAtRef.current = String(saved.sentAt || optimistic.sentAt);
      return saved;
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      throw new Error("Failed to send.");
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MSG_LEN) { setError(`Message too long (max ${MAX_MSG_LEN} chars).`); return; }
    setError("");
    setSending(true);
    setText("");
    try {
      await sendMessage({ messageType: MT.CHAT, text: trimmed });
    } catch {
      setText(trimmed);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handlePin(message) {
    if (!canPin) return;
    const alreadyPinned = pinnedMessage?.id === message.id;
    const pinning = !alreadyPinned;
    try {
      await sendMessage(
        { messageType: MT.CHAT, text: `__pin__:${message.id}:${pinning ? "1" : "0"}` },
        { messageType: MT.PIN, refMessageId: message.id, pinned: pinning }
      );
    } catch {
      setError("Could not pin message.");
    }
  }

  async function handleUnpin() {
    if (!pinnedMessage || !canPin) return;
    try {
      await sendMessage(
        { messageType: MT.CHAT, text: `__pin__:${pinnedMessage.id}:0` },
        { messageType: MT.PIN, refMessageId: pinnedMessage.id, pinned: false }
      );
    } catch {
      setError("Could not unpin.");
    }
  }

  async function handleDelete(message) {
    if (message._pending) return;
    setMessages(prev => prev.filter(item => item.id !== message.id));
    try {
      await messagesApi.delete(ownerId, orgId, message.id);
    } catch {
      setMessages(prev => [...prev, message].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt))));
    }
  }

  function canDelete(message) {
    if (message._pending) return false;
    return isAdmin || isOwner || String(message.senderId || "") === myId;
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const feedMessages = visibleMessages;
  const chatCount = feedMessages.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--surface)" }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: "10px 12px", display: "flex", alignItems: "center", gap: 9, background: "linear-gradient(180deg, color-mix(in srgb, var(--blue) 18%, var(--surface-high)) 0%, var(--surface) 100%)", borderBottom: "1px solid var(--border)" }}>
        <Av name="Community" tone="member" size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Apartment Group Chat</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
            Residents and management updates · {chatCount} message{chatCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", padding: "5px 9px", borderRadius: 999, background: "var(--accent-deep)" }}>Live</div>
      </div>

      {/* Pinned banner */}
      {pinnedMessage && (
        <PinnedBanner message={pinnedMessage} canPin={canPin} onUnpin={handleUnpin} />
      )}

      {/* Message feed */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 6, background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, var(--bg)) 0%, var(--bg) 100%)" }}>
        {loading && <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-dim)", fontSize: 13 }}>Loading messages...</div>}
        {!loading && loadError && <div style={{ textAlign: "center", padding: "18px", color: "var(--danger)", fontSize: 12 }}>{loadError}</div>}
        {!loading && !loadError && feedMessages.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
              Send a message to start the conversation.
            </div>
          </div>
        )}

        {feedMessages.map((message, index) => {
          const isMe = String(message.senderId || "") === myId;
          const prev = feedMessages[index - 1];
          const showDate = !prev || new Date(message.sentAt).toDateString() !== new Date(prev.sentAt).toDateString();
          const showSender = !prev || prev.senderId !== message.senderId || showDate;
          const tone = roleTone(message.senderRole, isMe);
          const isPinned = pinnedMessage?.id === message.id;

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
                {showSender && !isMe ? <Av name={message.senderName} tone={tone} size={30} /> : !isMe ? <div style={{ width: 30, flexShrink: 0 }} /> : null}
                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showSender && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--accent)" : message.senderRole === "owner" ? "var(--accent)" : message.senderRole === "admin" ? "var(--gold)" : "var(--text-sec)", marginBottom: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                      {isMe ? "You" : message.senderName || "Resident"}
                      {message.senderRole === "owner" && !isMe && <span style={{ color: "var(--accent)", marginLeft: 4 }}>· Owner</span>}
                      {message.senderRole === "admin" && !isMe && <span style={{ color: "var(--gold)", marginLeft: 4 }}>· Admin</span>}
                    </div>
                  )}
                  <div>
                    <div style={{ background: message._pending ? "color-mix(in srgb, var(--accent) 70%, var(--surface))" : isMe ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white) 0%, var(--accent) 100%)" : "color-mix(in srgb, var(--surface) 92%, white)", color: isMe ? "#fff" : "var(--text)", borderRadius: isMe ? "20px 20px 6px 20px" : "20px 20px 20px 6px", padding: "10px 14px 9px", fontSize: 14, lineHeight: 1.5, border: isMe ? "none" : "1px solid var(--border)", wordBreak: "break-word", whiteSpace: "pre-wrap", opacity: message._pending ? 0.7 : 1, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                      {message.text}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, display: "flex", alignItems: "center", gap: 5, flexDirection: isMe ? "row-reverse" : "row", paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                    <span>{message._pending ? "Sending..." : formatTime(message.sentAt)}</span>
                    {canPin && !message._pending && (
                      <button type="button" onClick={() => handlePin(message)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, opacity: isPinned ? 1 : 0.4, padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }} title={isPinned ? "Unpin" : "Pin"}>📌</button>
                    )}
                    {canDelete(message) && <DeleteBtn onDelete={() => handleDelete(message)} style={{ opacity: 0.35 }} />}
                  </div>
                </div>
                {showSender && isMe ? <Av name={senderName} tone="me" size={30} /> : isMe ? <div style={{ width: 30, flexShrink: 0 }} /> : null}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, padding: "8px 10px 10px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 7, alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 15, padding: "6px 6px 6px 9px" }}>
          <input
            ref={inputRef}
            className="input-field"
            placeholder="Message group"
            value={text}
            onChange={e => { setText(e.target.value); if (error) setError(""); }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, border: "none", background: "transparent", padding: 0, minHeight: 20, fontSize: 14 }}
          />
          <button
            className="btn-primary"
            style={{ height: 38, borderRadius: 999, padding: "0 14px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, opacity: !text.trim() || sending ? 0.5 : 1 }}
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            Send
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, textAlign: "right" }}>{text.length}/{MAX_MSG_LEN}</div>
      </div>
    </div>
  );
}
