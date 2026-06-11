import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Check, ChevronDown, Clock, Copy, CornerUpLeft, Paperclip, Pin, SendHorizontal, Smile, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { storage } from "../firebase";
import { messagesApi } from "../lib/api";
import { logError } from "../utils/logger";

const MAX_MSG_LEN = 500;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const POLL_INTERVAL = 8000;
const DISCUSSION_NOTICE_PREFIX = "ek_discussion_notices";
const EVENT_PREFIX = "__apt__:";
const QUICK_EMOJIS = ["👍", "🙏", "✅", "❤️", "😂", "😮"];
const LONG_PRESS_MS = 420;

const _msgCache = new Map();

const MT = {
  CHAT: "chat",
  PIN: "pin_action",
};

function makeId(prefix = "id") {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function encodeEvent(event) {
  return `${EVENT_PREFIX}${JSON.stringify(event)}`;
}

function decodeEvent(message) {
  const text = message?.text;
  if (typeof text !== "string" || !text.startsWith(EVENT_PREFIX)) return null;
  try {
    return {
      ...JSON.parse(text.slice(EVENT_PREFIX.length)),
      messageId: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      sentAt: message.sentAt,
      _pending: message._pending,
    };
  } catch {
    return null;
  }
}

function enrichFromText(m) {
  const event = decodeEvent(m);
  if (event) return { messageType: event.kind, event };
  const text = m.text;
  if (typeof text === "string" && text.startsWith("__ann__:")) {
    return { messageType: "chat", text: text.slice(8) };
  }
  if (typeof text === "string" && text.startsWith("__poll__:")) {
    const parts = text.slice(9).split("\x00");
    return { messageType: "chat", text: parts[0] || "Poll" };
  }
  return null;
}

function _normalizeMsg(m, local) {
  const base = local ? { ...local, ...m } : { ...m };
  const textEnrich = enrichFromText(base);
  return textEnrich ? { ...base, ...textEnrich } : { ...base, messageType: base.messageType || "chat" };
}

function decodeActionText(text) {
  if (typeof text !== "string") return null;
  if (text.startsWith("__pin__:")) {
    const p = text.split(":");
    return p[1] ? { type: "pin", refMessageId: p[1], pinned: p[2] === "1" } : null;
  }
  return null;
}

function discussionNoticeKey(userId) {
  return `${DISCUSSION_NOTICE_PREFIX}_${userId || "anonymous"}`;
}

function loadNotices(userId) {
  try {
    const raw = localStorage.getItem(discussionNoticeKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotices(userId, notices) {
  try {
    localStorage.setItem(discussionNoticeKey(userId), JSON.stringify(notices.slice(0, 40)));
    window.dispatchEvent(new CustomEvent("ek:discussion-notices-updated"));
  } catch {}
}

function publishDiscussionNotices(userId, orgId, feedItems, myId) {
  if (!userId || !orgId) return;
  const relevant = feedItems
    .filter(item => String(item.senderId || "") !== String(myId || ""))
    .filter(item => ["chat", "attachment", "poll"].includes(item.kind))
    .map(item => {
      const id = `discussion-${orgId}-${item.messageId || item.id || item.sentAt}`;
      if (item.kind === "poll") {
        return {
          id,
          orgId,
          tab: "discussions",
          tone: "gold",
          title: "New apartment poll",
          message: item.title || "A new poll is ready for your vote.",
          createdAt: item.sentAt,
        };
      }
      if (item.kind === "attachment") {
        return {
          id,
          orgId,
          tab: "discussions",
          tone: "gold",
          title: "New apartment attachment",
          message: item.text || `${item.senderName || "A resident"} shared an image.`,
          createdAt: item.sentAt,
        };
      }
      return {
        id,
        orgId,
        tab: "discussions",
        tone: "gold",
        title: "New apartment message",
        message: item.text || `${item.senderName || "A resident"} posted in chat.`,
        createdAt: item.sentAt,
      };
    });

  if (!relevant.length) return;
  const existing = loadNotices(userId);
  const byId = new Map([...existing, ...relevant].map(item => [item.id, item]));
  saveNotices(userId, Array.from(byId.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))));
}

function safeFileName(file) {
  const ext = (file.name || "attachment.jpg").split(".").pop() || "jpg";
  return `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg"}`;
}

function formatBubbleTime(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

function formatDayChip(isoOrDate) {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

function getInitials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "?";
  return clean.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

// Stable per-name hue so each member gets a consistent name colour, like
// WhatsApp group chats. Avoids brand-colour collisions by staying in a
// muted band.
const NAME_COLORS = ["#53BDEB", "#E5A50A", "#FF7EB6", "#9D8CFF", "#06CF9C", "#FA8072", "#52B7C9", "#D5A6E8"];
function nameColor(name) {
  let hash = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return NAME_COLORS[hash % NAME_COLORS.length];
}

function Av({ name, size = 30 }) {
  const bg = nameColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `color-mix(in srgb, ${bg} 28%, var(--surface-high))`, border: `1px solid color-mix(in srgb, ${bg} 40%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 800, color: bg, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

// Preview text for reply quotes / pinned banner.
function messagePreview(message) {
  if (message?.event?.kind === "attachment") return message.event.text || "📷 Photo";
  if (message?.event?.kind === "poll") return `📊 ${message.event.title || "Poll"}`;
  if (message?.event?.kind === "reply") return message.event.text || "";
  return message?.text || "";
}

function PinnedBanner({ message, canPin, onUnpin, onJump }) {
  const full = messagePreview(message);
  return (
    <div
      style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", background: "var(--surface-high)", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
      onClick={() => onJump?.(message.id)}
    >
      <Pin size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--accent)", marginBottom: 1 }}>Pinned</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {full.slice(0, 90)}{full.length > 90 ? "…" : ""}
        </div>
      </div>
      {canPin && (
        <button type="button" onClick={e => { e.stopPropagation(); onUnpin(); }} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 4, flexShrink: 0, display: "grid", placeItems: "center" }} title="Unpin">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function PollBubble({ item, votes, myId, onVote, isMe }) {
  const totalVotes = Object.keys(votes || {}).length;
  const myVote = votes?.[myId];
  return (
    <div style={{ display: "grid", gap: 8, minWidth: 230 }}>
      <div style={{ fontSize: 10, fontWeight: 850, color: isMe ? "rgba(255,255,255,0.85)" : "var(--blue)", textTransform: "uppercase", letterSpacing: 0.5 }}>📊 Poll</div>
      <div style={{ fontSize: 14, fontWeight: 850 }}>{item.title}</div>
      {item.text && <div style={{ fontSize: 12, opacity: 0.88, lineHeight: 1.45 }}>{item.text}</div>}
      <div style={{ display: "grid", gap: 7 }}>
        {(item.options || []).map(option => {
          const count = Object.values(votes || {}).filter(value => value === option.id).length;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const selected = myVote === option.id;
          return (
            <button key={option.id} type="button" onClick={() => onVote(item, option.id)} disabled={Boolean(myVote)} style={{ border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`, background: isMe ? "rgba(255,255,255,0.14)" : "var(--surface-high)", color: isMe ? "#fff" : "var(--text)", borderRadius: 10, padding: 9, textAlign: "left", cursor: myVote ? "default" : "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, fontWeight: 800 }}>
                <span>{option.label}</span>
                <span>{count}</span>
              </div>
              <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: isMe ? "rgba(255,255,255,0.22)" : "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: selected ? "var(--accent)" : "var(--blue)" }} />
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11, opacity: 0.75 }}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}{myVote ? " · You voted" : ""}</div>
    </div>
  );
}

function AttachmentBubble({ item }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {item.imageUrl && (
        <a href={item.imageUrl} target="_blank" rel="noreferrer" style={{ display: "block", margin: "-2px -4px 0" }}>
          <img src={item.imageUrl} alt="" style={{ width: "100%", maxWidth: 300, maxHeight: 280, objectFit: "cover", borderRadius: 12, background: "rgba(0,0,0,0.1)", display: "block" }} />
        </a>
      )}
      {item.text && <div>{item.text}</div>}
    </div>
  );
}

// Quoted-message block inside a reply bubble (WhatsApp-style).
function ReplyQuote({ replyTo, isMe, onJump }) {
  if (!replyTo) return null;
  return (
    <div
      onClick={e => { e.stopPropagation(); onJump?.(replyTo.id); }}
      style={{
        borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.65)" : "var(--accent)"}`,
        background: isMe ? "rgba(0,0,0,0.16)" : "color-mix(in srgb, var(--accent) 6%, var(--surface-high))",
        borderRadius: 8,
        padding: "5px 9px",
        marginBottom: 6,
        cursor: "pointer",
        overflow: "hidden"
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: isMe ? "rgba(255,255,255,0.9)" : "var(--accent)", marginBottom: 1 }}>
        {replyTo.name || "Member"}
      </div>
      <div style={{ fontSize: 12, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {replyTo.preview || ""}
      </div>
    </div>
  );
}

// Reaction pills — only rendered when reactions exist (no permanent emoji
// clutter). Tap a pill to toggle your own reaction.
function ReactionPills({ reactions, onReact, isMe }) {
  const entries = Object.entries(reactions || {}).filter(([, v]) => v.count > 0);
  if (!entries.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: -6, marginBottom: 2, position: "relative", zIndex: 2, justifyContent: isMe ? "flex-end" : "flex-start", padding: isMe ? "0 8px 0 0" : "0 0 0 8px" }}>
      {entries.map(([emoji, item]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji, item.reacted)}
          style={{
            border: `1px solid ${item.reacted ? "var(--accent)" : "var(--border)"}`,
            background: "var(--surface)",
            color: "var(--text)",
            borderRadius: 999,
            padding: "2px 7px",
            fontSize: 12,
            cursor: "pointer",
            lineHeight: 1.3,
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
            display: "inline-flex",
            alignItems: "center",
            gap: 3
          }}
        >
          {emoji}<span style={{ fontSize: 10, fontWeight: 700, color: item.reacted ? "var(--accent)" : "var(--text-dim)" }}>{item.count}</span>
        </button>
      ))}
    </div>
  );
}

export default function DiscussionsSection() {
  const { user } = useAuth();
  const { activeSharedOrgKey, activeOrgId, sharedOrgs = [], activeSharedOrgRole } = useData();

  const sharedInfo = activeSharedOrgKey ? sharedOrgs.find(org => org.key === activeSharedOrgKey) : null;
  const ownerId = sharedInfo?.ownerId || user?.id;
  const orgId = sharedInfo?.orgId || activeOrgId;
  const cacheKey = ownerId && orgId ? `${ownerId}_${orgId}` : null;

  const [messages, setMessages] = useState(() => (cacheKey ? (_msgCache.get(cacheKey) || []) : []));
  const [text, setText] = useState("");
  const [pollOpen, setPollOpen] = useState(false);
  const [pollForm, setPollForm] = useState({ title: "", text: "", options: ["Yes", "No"] });
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!cacheKey || !_msgCache.has(cacheKey));
  // WhatsApp-style UX state
  const [menu, setMenu] = useState(null);            // { message, x, y }
  const [replyTo, setReplyTo] = useState(null);       // { id, name, preview }
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [highlightId, setHighlightId] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const latestSentAtRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const pressPosRef = useRef({ x: 0, y: 0 });
  const atBottomRef = useRef(true);
  const prevCountRef = useRef(0);

  const myId = String(user?.id || "");
  const isOwner = String(ownerId || "") === myId;
  const memberRole = activeSharedOrgRole || sharedInfo?.role || (isOwner ? "owner" : "viewer");
  const isAdmin = user?.role === "admin" || memberRole === "admin";
  const canManageChat = isOwner || isAdmin;
  const canPin = canManageChat;
  const senderName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Resident";
  const senderRole = isOwner ? "owner" : isAdmin ? "admin" : "member";

  useEffect(() => {
    if (!cacheKey) return;
    const toCache = messages.filter(m => !m._pending);
    if (toCache.length > 0) _msgCache.set(cacheKey, toCache);
  }, [messages, cacheKey]);

  const fetchMessages = useCallback(async (after) => {
    if (!ownerId || !orgId) return;
    try {
      const rows = await messagesApi.list(ownerId, orgId, after || undefined);
      if (!Array.isArray(rows) || rows.length === 0) return;
      setMessages(prev => {
        const localById = new Map(prev.map(m => [m.id, m]));
        if (after) {
          const fresh = rows.filter(m => !localById.has(m.id)).map(m => _normalizeMsg(m, null));
          if (fresh.length === 0) return prev;
          return [...prev, ...fresh].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
        }
        const merged = rows.map(m => _normalizeMsg(m, localById.get(m.id)));
        const serverIds = new Set(rows.map(m => m.id));
        const pending = prev.filter(m => m._pending && !serverIds.has(m.id));
        return [...merged, ...pending].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
      });
      latestSentAtRef.current = rows.reduce((max, m) => (String(m.sentAt) > String(max) ? String(m.sentAt) : max), latestSentAtRef.current || "");
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
    if (!ownerId || !orgId) return undefined;
    pollTimerRef.current = setInterval(() => fetchMessages(latestSentAtRef.current), POLL_INTERVAL);
    return () => clearInterval(pollTimerRef.current);
  }, [fetchMessages, orgId, ownerId]);

  const events = useMemo(() => messages.map(decodeEvent).filter(Boolean), [messages]);

  const { feedMessages, pinnedMessage, votesByPoll, reactionsByMessage } = useMemo(() => {
    let latestPin = null;
    const votes = {};
    const reactionState = {};

    messages.forEach(m => {
      const action = decodeActionText(m.text);
      if (m.messageType === MT.PIN || action?.type === "pin") {
        const pin = action ? { ...m, refMessageId: action.refMessageId, pinned: action.pinned } : m;
        if (!latestPin || String(pin.sentAt) > String(latestPin.sentAt)) latestPin = pin;
      }
    });

    events.forEach(event => {
      if (event.kind === "poll_vote") {
        votes[event.pollId] = { ...(votes[event.pollId] || {}), [event.voterId || event.senderId]: event.optionId };
      } else if (event.kind === "reaction") {
        const targetId = event.targetMessageId;
        const emoji = event.emoji;
        const reactorId = String(event.reactorId || event.senderId || "");
        if (!targetId || !emoji || !reactorId) return;
        reactionState[targetId] = reactionState[targetId] || {};
        reactionState[targetId][emoji] = reactionState[targetId][emoji] || {};
        reactionState[targetId][emoji][reactorId] = event.active !== false;
      }
    });

    const pinnedId = latestPin?.pinned ? latestPin.refMessageId : null;
    const pinned = pinnedId ? messages.find(m => m.id === pinnedId) : null;

    const visible = messages
      .map(m => _normalizeMsg(m, null))
      .filter(m => {
        if (decodeActionText(m.text)) return false;
        if (m.event?.kind === "poll_vote") return false;
        if (m.event?.kind === "reaction") return false;
        return true;
      });

    const reactions = {};
    Object.entries(reactionState).forEach(([messageId, byEmoji]) => {
      reactions[messageId] = {};
      Object.entries(byEmoji).forEach(([emoji, byUser]) => {
        const activeUsers = Object.entries(byUser).filter(([, active]) => active).map(([reactorId]) => reactorId);
        if (activeUsers.length) {
          reactions[messageId][emoji] = { count: activeUsers.length, reacted: activeUsers.includes(myId) };
        }
      });
    });

    return { feedMessages: visible, pinnedMessage: pinned ? _normalizeMsg(pinned, null) : null, votesByPoll: votes, reactionsByMessage: reactions };
  }, [events, messages, myId]);

  // ── Smart auto-scroll ────────────────────────────────────────────────────
  // Only pull the view down when the user is already at the bottom (or they
  // just sent a message). When reading history, count new arrivals instead.
  useEffect(() => {
    const prevCount = prevCountRef.current;
    prevCountRef.current = feedMessages.length;
    if (feedMessages.length <= prevCount) return;
    const last = feedMessages[feedMessages.length - 1];
    const mine = String(last?.senderId || "") === myId;
    if (atBottomRef.current || mine || prevCount === 0) {
      // rAF so the new node is in the DOM before we scroll
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: prevCount === 0 ? "auto" : "smooth" }));
      setNewCount(0);
    } else {
      setNewCount(c => c + (feedMessages.length - prevCount));
    }
  }, [feedMessages, myId]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isBottom = dist < 80;
    atBottomRef.current = isBottom;
    setAtBottom(isBottom);
    if (isBottom) setNewCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewCount(0);
  }, []);

  const jumpToMessage = useCallback((id) => {
    if (!id) return;
    const el = document.getElementById(`ekmsg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 1600);
    }
  }, []);

  useEffect(() => {
    const noticeItems = feedMessages.map(message => {
      if (message.event?.kind === "poll") return { ...message.event, kind: "poll" };
      if (message.event?.kind === "attachment") return { ...message.event, kind: "attachment" };
      if (message.event?.kind === "reply") {
        return { kind: "chat", id: message.id, messageId: message.id, text: message.event.text, senderId: message.senderId, senderName: message.senderName, sentAt: message.sentAt };
      }
      if (!message.event && !decodeActionText(message.text)) {
        return { kind: "chat", id: message.id, messageId: message.id, text: message.text, senderId: message.senderId, senderName: message.senderName, sentAt: message.sentAt };
      }
      return null;
    }).filter(Boolean);
    publishDiscussionNotices(myId, orgId, noticeItems, myId);
  }, [feedMessages, myId, orgId]);

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
    setMessages(prev => [...prev, _normalizeMsg(optimistic, null)]);
    try {
      const saved = await messagesApi.send(ownerId, orgId, {
        id: makeId("msg"),
        senderId: myId,
        senderName,
        senderRole,
        sentAt: optimistic.sentAt,
        ...payload,
      });
      const merged = _normalizeMsg({ ...optimistic, ...saved, senderId: saved.senderId || optimistic.senderId, _pending: false }, optimistic);
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
    if (trimmed.length > MAX_MSG_LEN) {
      setError(`Message too long (max ${MAX_MSG_LEN} chars).`);
      return;
    }
    setError("");
    setSending(true);
    setText("");
    setShowEmojiBar(false);
    const reply = replyTo;
    setReplyTo(null);
    try {
      if (reply) {
        await sendMessage({
          messageType: MT.CHAT,
          text: encodeEvent({ kind: "reply", id: makeId("rep"), text: trimmed, replyTo: { id: reply.id, name: reply.name, preview: reply.preview } }),
        });
      } else {
        await sendMessage({ messageType: MT.CHAT, text: trimmed });
      }
    } catch {
      setText(trimmed);
      if (reply) setReplyTo(reply);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleAttachment(file) {
    if (!file || uploading) return;
    setError("");
    if (!String(file.type || "").startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 5 MB.");
      return;
    }
    const caption = text.trim();
    if (caption.length > MAX_MSG_LEN) {
      setError(`Caption too long (max ${MAX_MSG_LEN} chars).`);
      return;
    }
    setUploading(true);
    setText("");
    try {
      const path = `apartment-discussions/${ownerId}/${orgId}/${safeFileName(file)}`;
      const uploadRef = ref(storage, path);
      await uploadBytes(uploadRef, file, {
        contentType: file.type,
        customMetadata: { ownerId: String(ownerId || ""), orgId: String(orgId || ""), uploadedBy: myId },
      });
      const imageUrl = await getDownloadURL(uploadRef);
      await sendMessage({
        messageType: MT.CHAT,
        text: encodeEvent({ kind: "attachment", id: makeId("att"), text: caption, imageUrl, imagePath: path }),
      });
    } catch (err) {
      logError("discussion_attachment_upload_failed", err, { ownerId, orgId, userId: myId });
      setText(caption);
      setError("Attachment upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function createPoll() {
    if (!canManageChat) {
      setError("Only owners and admins can create polls.");
      setPollOpen(false);
      return;
    }
    const options = pollForm.options.map(option => option.trim()).filter(Boolean).slice(0, 5);
    if (!pollForm.title.trim() || options.length < 2 || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage({
        messageType: MT.CHAT,
        text: encodeEvent({
          kind: "poll",
          id: makeId("poll"),
          title: pollForm.title.trim(),
          text: pollForm.text.trim(),
          options: options.map((label, index) => ({ id: `opt_${index}_${label.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || index}`, label })),
        }),
      });
      setPollForm({ title: "", text: "", options: ["Yes", "No"] });
      setPollOpen(false);
    } catch {
      setError("Could not publish poll.");
    } finally {
      setSending(false);
    }
  }

  async function votePoll(poll, optionId) {
    if (votesByPoll[poll.id]?.[myId]) return;
    try {
      await sendMessage({
        messageType: MT.CHAT,
        text: encodeEvent({ kind: "poll_vote", pollId: poll.id, optionId, voterId: myId }),
      });
    } catch {
      setError("Could not save vote.");
    }
  }

  async function reactToMessage(message, emoji, active) {
    if (!message?.id || message._pending) return;
    try {
      await sendMessage({
        messageType: MT.CHAT,
        text: encodeEvent({ kind: "reaction", targetMessageId: message.id, emoji, reactorId: myId, active: !active }),
      });
    } catch {
      setError("Could not save reaction.");
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

  function appendEmoji(emoji) {
    setText(current => `${current}${emoji}`);
    setTimeout(() => inputRef.current?.focus(), 20);
  }

  // ── Message context menu (long-press / right-click) ─────────────────────
  function openMenu(x, y, message) {
    if (message._pending) return;
    const menuW = 232;
    const menuH = 250;
    const cx = Math.max(8, Math.min(x, (window.innerWidth || 360) - menuW - 8));
    const cy = Math.max(8, Math.min(y, (window.innerHeight || 640) - menuH - 8));
    setMenu({ message, x: cx, y: cy });
  }

  function closeMenu() {
    setMenu(null);
  }

  function startPress(e, message) {
    const t = e.touches?.[0];
    pressPosRef.current = { x: t ? t.clientX : e.clientX, y: t ? t.clientY : e.clientY };
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      openMenu(pressPosRef.current.x, pressPosRef.current.y, message);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    clearTimeout(pressTimerRef.current);
  }

  function startReply(message) {
    setReplyTo({
      id: message.id,
      name: String(message.senderId || "") === myId ? "You" : (message.senderName || "Member"),
      preview: messagePreview(message).slice(0, 90),
    });
    closeMenu();
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  async function copyMessage(message) {
    const value = messagePreview(message);
    try { await navigator.clipboard.writeText(value); } catch {}
    closeMenu();
  }

  const chatCount = feedMessages.length;
  const counterVisible = text.length > MAX_MSG_LEN - 60;

  return (
    <div className="ek-chat-root" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      <style>{`
        @keyframes ekMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes ekFlash { 0% { background: color-mix(in srgb, var(--accent) 18%, transparent); } 100% { background: transparent; } }
        .ek-msg-row { animation: ekMsgIn 0.18s ease; }
        .ek-msg-flash { animation: ekFlash 1.5s ease; border-radius: 12px; }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "color-mix(in srgb, var(--accent) 16%, var(--surface-high))", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>🏠</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Society Chat</div>
          <div style={{ fontSize: 10.5, color: "var(--text-dim)", marginTop: 1 }}>
            {chatCount === 0 ? "No messages yet" : `${chatCount} message${chatCount !== 1 ? "s" : ""}`}
          </div>
        </div>
        {canManageChat && (
          <button type="button" className={pollOpen ? "btn-primary" : "btn-secondary"} onClick={() => setPollOpen(open => !open)} style={{ height: 32, borderRadius: 999, padding: "0 12px", fontSize: 11, fontWeight: 850 }}>
            📊 Poll
          </button>
        )}
      </div>

      {pinnedMessage && <PinnedBanner message={pinnedMessage} canPin={canPin} onUnpin={handleUnpin} onJump={jumpToMessage} />}

      {pollOpen && canManageChat && (
        <div style={{ flexShrink: 0, padding: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "grid", gap: 8 }}>
          <input className="input-field" value={pollForm.title} onChange={event => setPollForm(current => ({ ...current, title: event.target.value }))} placeholder="Poll question, e.g. Approve CCTV repair?" maxLength={110} />
          <textarea className="input-field" value={pollForm.text} onChange={event => setPollForm(current => ({ ...current, text: event.target.value }))} placeholder="Optional context" rows={2} maxLength={MAX_MSG_LEN} style={{ resize: "vertical", fontFamily: "inherit" }} />
          {pollForm.options.map((option, index) => (
            <input key={index} className="input-field" value={option} onChange={event => setPollForm(current => ({ ...current, options: current.options.map((item, idx) => idx === index ? event.target.value : item) }))} placeholder={`Option ${index + 1}`} maxLength={60} />
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn-secondary" disabled={pollForm.options.length >= 5} onClick={() => setPollForm(current => ({ ...current, options: [...current.options, ""] }))} style={{ padding: "9px 12px", fontSize: 12 }}>Add Option</button>
            {pollForm.options.length > 2 && <button type="button" className="btn-secondary" onClick={() => setPollForm(current => ({ ...current, options: current.options.slice(0, -1) }))} style={{ padding: "9px 12px", fontSize: 12 }}>Remove</button>}
            <button type="button" className="btn-primary" onClick={createPoll} disabled={!pollForm.title.trim() || pollForm.options.filter(Boolean).length < 2 || sending} style={{ marginLeft: "auto", padding: "9px 14px", fontSize: 12 }}>Publish</button>
          </div>
        </div>
      )}

      {/* Message feed */}
      <div style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px 8px", display: "flex", flexDirection: "column", background: "var(--bg)", WebkitOverflowScrolling: "touch" }}>
          {loading && <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-dim)", fontSize: 13 }}>Loading messages...</div>}
          {!loading && loadError && <div style={{ textAlign: "center", padding: "18px", color: "var(--danger)", fontSize: 12 }}>{loadError}</div>}
          {!loading && !loadError && feedMessages.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--surface-high)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 24, marginBottom: 14 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Start the conversation</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                Share an announcement, run a poll, or post a notice — everyone in this khata sees it instantly.
              </div>
            </div>
          )}

          {feedMessages.map((message, index) => {
            const isMe = String(message.senderId || "") === myId;
            const prev = feedMessages[index - 1];
            const next = feedMessages[index + 1];
            const showDate = !prev || new Date(message.sentAt).toDateString() !== new Date(prev.sentAt).toDateString();
            const nextSameDay = next && new Date(next.sentAt).toDateString() === new Date(message.sentAt).toDateString();
            const firstOfGroup = !prev || prev.senderId !== message.senderId || showDate;
            const lastOfGroup = !next || next.senderId !== message.senderId || !nextSameDay;
            const event = message.event;
            const isPinned = pinnedMessage?.id === message.id;
            const hasImage = event?.kind === "attachment" && event.imageUrl;

            // WhatsApp-style radii: tail corner only on the last bubble of a group.
            const radius = isMe
              ? `16px 16px ${lastOfGroup ? "4px" : "16px"} 16px`
              : `16px 16px 16px ${lastOfGroup ? "4px" : "16px"}`;

            return (
              <React.Fragment key={message.id || index}>
                {showDate && (
                  <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-dim)", fontWeight: 700, padding: "10px 0 8px" }}>
                    <span style={{ display: "inline-flex", padding: "4px 11px", borderRadius: 999, background: "var(--surface-high)", border: "1px solid var(--border)" }}>
                      {formatDayChip(message.sentAt)}
                    </span>
                  </div>
                )}

                <div
                  id={`ekmsg-${message.id}`}
                  className={`ek-msg-row${highlightId === message.id ? " ek-msg-flash" : ""}`}
                  style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", marginTop: firstOfGroup ? (showDate ? 0 : 10) : 2 }}
                >
                  {/* Avatar bottom-aligned on the last bubble of a group, like Telegram */}
                  {!isMe && (lastOfGroup ? <Av name={message.senderName} size={28} /> : <div style={{ width: 28, flexShrink: 0 }} />)}

                  <div style={{ maxWidth: "78%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    <div
                      onContextMenu={e => { e.preventDefault(); openMenu(e.clientX, e.clientY, message); }}
                      onTouchStart={e => startPress(e, message)}
                      onTouchEnd={cancelPress}
                      onTouchMove={cancelPress}
                      style={{
                        background: message._pending
                          ? "color-mix(in srgb, var(--accent) 72%, var(--surface))"
                          : isMe ? "var(--accent)" : "var(--surface)",
                        color: isMe ? "#fff" : "var(--text)",
                        borderRadius: radius,
                        padding: hasImage ? "5px 6px 6px" : event?.kind === "poll" ? 11 : "7px 11px 8px",
                        fontSize: 14,
                        lineHeight: 1.45,
                        border: isMe ? "none" : "1px solid var(--border)",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                        position: "relative",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none"
                      }}
                    >
                      {/* Sender name inside bubble on first message of a group (others only) */}
                      {firstOfGroup && !isMe && (
                        <div style={{ fontSize: 12, fontWeight: 800, color: nameColor(message.senderName), marginBottom: 2, display: "flex", alignItems: "center", gap: 5 }}>
                          {message.senderName || "Resident"}
                          {message.senderRole === "owner" && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)", padding: "1px 5px", borderRadius: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Owner</span>}
                          {message.senderRole === "admin" && <span style={{ fontSize: 9, fontWeight: 800, color: "var(--gold)", background: "color-mix(in srgb, var(--gold) 12%, transparent)", padding: "1px 5px", borderRadius: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Admin</span>}
                        </div>
                      )}

                      {event?.kind === "reply" && <ReplyQuote replyTo={event.replyTo} isMe={isMe} onJump={jumpToMessage} />}

                      {event?.kind === "poll" ? (
                        <PollBubble item={event} votes={votesByPoll[event.id] || {}} myId={myId} onVote={votePoll} isMe={isMe} />
                      ) : event?.kind === "attachment" ? (
                        <AttachmentBubble item={event} />
                      ) : event?.kind === "reply" ? (
                        event.text
                      ) : (
                        message.text
                      )}

                      {/* Time + status inside the bubble, WhatsApp-style */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, float: "right", margin: "8px -3px -2px 8px", fontSize: 10, fontWeight: 600, color: isMe ? "rgba(255,255,255,0.78)" : "var(--text-dim)", lineHeight: 1, userSelect: "none" }}>
                        {isPinned && <Pin size={9} style={{ opacity: 0.9 }} />}
                        {formatBubbleTime(message.sentAt)}
                        {isMe && (message._pending
                          ? <Clock size={10} style={{ opacity: 0.85 }} />
                          : <Check size={11} strokeWidth={3} style={{ opacity: 0.85 }} />
                        )}
                      </span>
                    </div>

                    <ReactionPills reactions={reactionsByMessage[message.id]} onReact={(emoji, active) => reactToMessage(message, emoji, active)} isMe={isMe} />
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Floating scroll-to-bottom pill with unread count */}
        {!atBottom && chatCount > 0 && (
          <button
            type="button"
            onClick={scrollToBottom}
            style={{ position: "absolute", right: 14, bottom: 14, width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-sec)", cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.3)", zIndex: 5 }}
            title="Scroll to latest"
          >
            <ChevronDown size={18} />
            {newCount > 0 && (
              <span style={{ position: "absolute", top: -6, right: -4, minWidth: 17, height: 17, borderRadius: 9, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                {newCount > 99 ? "99+" : newCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="ek-chat-composer" style={{ flexShrink: 0, padding: "8px 8px calc(env(safe-area-inset-bottom, 0px) + 106px)", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", margin: "2px 4px 6px" }}>{error}</div>}

        {/* Reply preview strip */}
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 2px 6px", padding: "6px 9px", borderRadius: 10, background: "var(--surface-high)", borderLeft: "3px solid var(--accent)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", marginBottom: 1 }}>Replying to {replyTo.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.preview}</div>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 4, display: "grid", placeItems: "center", flexShrink: 0 }} title="Cancel reply">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Quick-emoji strip — toggled by the smiley button */}
        {showEmojiBar && (
          <div style={{ display: "flex", gap: 6, margin: "2px 2px 6px", overflowX: "auto", paddingBottom: 1 }}>
            {QUICK_EMOJIS.map(emoji => (
              <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} style={{ border: "1px solid var(--border)", background: "var(--surface-high)", borderRadius: 999, width: 34, height: 34, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer", fontSize: 16 }}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
          {/* Input pill: emoji + text + attach */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4, background: "var(--surface-high)", border: "1px solid var(--border)", borderRadius: 22, padding: "5px 6px 5px 5px" }}>
            <button
              type="button"
              onClick={() => setShowEmojiBar(open => !open)}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: showEmojiBar ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent", color: showEmojiBar ? "var(--accent)" : "var(--text-dim)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}
              title="Emoji"
            >
              <Smile size={19} />
            </button>
            <input
              ref={inputRef}
              placeholder={uploading ? "Uploading image…" : "Message"}
              value={text}
              onChange={e => { setText(e.target.value); if (error) setError(""); }}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", padding: "8px 2px", fontSize: 14.5, fontFamily: "inherit" }}
            />
            {counterVisible && (
              <span style={{ fontSize: 10, color: text.length > MAX_MSG_LEN ? "var(--danger)" : "var(--text-dim)", fontWeight: 700, flexShrink: 0, paddingRight: 2 }}>
                {MAX_MSG_LEN - text.length}
              </span>
            )}
            <label style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.5 : 1, color: "var(--text-dim)" }} title="Attach image">
              <Paperclip size={18} />
              <input type="file" accept="image/*" disabled={uploading} onChange={event => { handleAttachment(event.target.files?.[0]); event.target.value = ""; }} style={{ display: "none" }} />
            </label>
          </div>

          {/* Round send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() || sending || uploading}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
              background: text.trim() && !sending && !uploading ? "var(--accent)" : "var(--surface-high)",
              color: text.trim() && !sending && !uploading ? "#fff" : "var(--text-dim)",
              cursor: text.trim() && !sending && !uploading ? "pointer" : "default",
              display: "grid", placeItems: "center",
              boxShadow: text.trim() && !sending && !uploading ? "0 6px 16px color-mix(in srgb, var(--accent) 35%, transparent)" : "none",
              transition: "background 0.15s, box-shadow 0.15s"
            }}
            title="Send"
          >
            <SendHorizontal size={19} style={{ marginLeft: 2 }} />
          </button>
        </div>
      </div>

      {/* Message context menu (long-press / right-click) */}
      {menu && (
        <>
          <div onClick={closeMenu} onContextMenu={e => { e.preventDefault(); closeMenu(); }} style={{ position: "fixed", inset: 0, zIndex: 300 }} />
          <div style={{ position: "fixed", left: menu.x, top: menu.y, zIndex: 301, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.5)", overflow: "hidden", minWidth: 216, animation: "ekMsgIn 0.12s ease" }}>
            {/* Quick reactions */}
            <div style={{ display: "flex", gap: 2, padding: "8px 9px", borderBottom: "1px solid var(--border)" }}>
              {QUICK_EMOJIS.map(emoji => {
                const reacted = Boolean(reactionsByMessage[menu.message.id]?.[emoji]?.reacted);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { reactToMessage(menu.message, emoji, reacted); closeMenu(); }}
                    style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: reacted ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent", fontSize: 17, cursor: "pointer", display: "grid", placeItems: "center" }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            {[
              { label: "Reply", icon: <CornerUpLeft size={15} />, onClick: () => startReply(menu.message), show: true },
              { label: "Copy", icon: <Copy size={15} />, onClick: () => copyMessage(menu.message), show: Boolean(messagePreview(menu.message)) },
              { label: pinnedMessage?.id === menu.message.id ? "Unpin" : "Pin", icon: <Pin size={15} />, onClick: () => { handlePin(menu.message); closeMenu(); }, show: canPin && menu.message.event?.kind !== "poll_vote" },
              { label: "Delete", icon: <Trash2 size={15} />, onClick: () => { handleDelete(menu.message); closeMenu(); }, show: canDelete(menu.message), danger: true },
            ].filter(item => item.show).map(item => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", border: "none", background: "transparent", color: item.danger ? "var(--danger)" : "var(--text)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
