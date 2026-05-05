import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { DeleteBtn } from "../components/UI";
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

function formatTime(isoOrDate) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (d.toDateString() === today.toDateString()) return time;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
}

function getInitials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "?";
  return clean.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
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

function PinnedBanner({ message, canPin, onUnpin }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (message.text || message.event?.title || "").slice(0, 80);
  const full = message.text || message.event?.title || "";
  return (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "color-mix(in srgb, var(--gold) 12%, var(--surface-high))", borderBottom: "1px solid color-mix(in srgb, var(--gold) 25%, var(--border))", cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
      <div style={{ fontSize: 14, color: "var(--gold)", flexShrink: 0 }}>Pin</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 0, marginBottom: 1 }}>Pinned message</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: expanded ? "normal" : "nowrap" }}>
          {expanded ? full : preview}{!expanded && full.length > 80 ? "..." : ""}
        </div>
      </div>
      {canPin && (
        <button type="button" onClick={e => { e.stopPropagation(); onUnpin(); }} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }} title="Unpin">
          x
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
      <div style={{ fontSize: 10, fontWeight: 850, color: isMe ? "#fff" : "var(--blue)", textTransform: "uppercase", letterSpacing: 0 }}>Poll</div>
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
    <div style={{ display: "grid", gap: 8 }}>
      {item.text && <div>{item.text}</div>}
      {item.imageUrl && (
        <a href={item.imageUrl} target="_blank" rel="noreferrer" style={{ display: "block" }}>
          <img src={item.imageUrl} alt="" style={{ width: "100%", maxWidth: 300, maxHeight: 260, objectFit: "contain", borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
        </a>
      )}
    </div>
  );
}

function ReactionRow({ reactions, onReact }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
      {QUICK_EMOJIS.map(emoji => {
        const item = reactions?.[emoji];
        const active = Boolean(item?.reacted);
        const count = item?.count || 0;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(emoji, active)}
            style={{
              border: `1px solid ${active ? "var(--accent)" : count ? "var(--border)" : "transparent"}`,
              background: active ? "color-mix(in srgb, var(--accent) 12%, var(--surface-high))" : count ? "var(--surface-high)" : "transparent",
              color: "var(--text)",
              borderRadius: 999,
              padding: count ? "3px 7px" : "2px 4px",
              fontSize: 12,
              cursor: "pointer",
              lineHeight: 1.2,
              opacity: count || active ? 1 : 0.55,
            }}
            title={active ? "Remove reaction" : "React"}
          >
            {emoji}{count ? ` ${count}` : ""}
          </button>
        );
      })}
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

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const latestSentAtRef = useRef(null);
  const pollTimerRef = useRef(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

    return { feedMessages: visible, pinnedMessage: pinned, votesByPoll: votes, reactionsByMessage: reactions };
  }, [events, messages, myId]);

  useEffect(() => {
    const noticeItems = feedMessages.map(message => {
      if (message.event?.kind === "poll") return { ...message.event, kind: "poll" };
      if (message.event?.kind === "attachment") return { ...message.event, kind: "attachment" };
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

  const chatCount = feedMessages.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--surface)" }}>
      <div style={{ flexShrink: 0, padding: "10px 12px", display: "flex", alignItems: "center", gap: 9, background: "linear-gradient(180deg, color-mix(in srgb, var(--blue) 18%, var(--surface-high)) 0%, var(--surface) 100%)", borderBottom: "1px solid var(--border)" }}>
        <Av name="Community" tone="member" size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Apartment Group Chat</div>
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
            Messages, polls, and attachments · {chatCount} item{chatCount !== 1 ? "s" : ""}
          </div>
        </div>
        {canManageChat && (
          <button type="button" className={pollOpen ? "btn-primary" : "btn-secondary"} onClick={() => setPollOpen(open => !open)} style={{ height: 32, borderRadius: 999, padding: "0 11px", fontSize: 11, fontWeight: 850 }}>
            Poll
          </button>
        )}
      </div>

      {pinnedMessage && <PinnedBanner message={pinnedMessage} canPin={canPin} onUnpin={handleUnpin} />}

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

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 6, background: "linear-gradient(180deg, color-mix(in srgb, var(--accent) 6%, var(--bg)) 0%, var(--bg) 100%)" }}>
        {loading && <div style={{ textAlign: "center", padding: "28px 20px", color: "var(--text-dim)", fontSize: 13 }}>Loading messages...</div>}
        {!loading && loadError && <div style={{ textAlign: "center", padding: "18px", color: "var(--danger)", fontSize: 12 }}>{loadError}</div>}
        {!loading && !loadError && feedMessages.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>Send a message, image, or poll to start the conversation.</div>
          </div>
        )}

        {feedMessages.map((message, index) => {
          const isMe = String(message.senderId || "") === myId;
          const prev = feedMessages[index - 1];
          const showDate = !prev || new Date(message.sentAt).toDateString() !== new Date(prev.sentAt).toDateString();
          const showSender = !prev || prev.senderId !== message.senderId || showDate;
          const tone = roleTone(message.senderRole, isMe);
          const isPinned = pinnedMessage?.id === message.id;
          const event = message.event;

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
                <div style={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showSender && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? "var(--accent)" : message.senderRole === "owner" ? "var(--accent)" : message.senderRole === "admin" ? "var(--gold)" : "var(--text-sec)", marginBottom: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                      {isMe ? "You" : message.senderName || "Resident"}
                      {message.senderRole === "owner" && !isMe && <span style={{ color: "var(--accent)", marginLeft: 4 }}>· Owner</span>}
                      {message.senderRole === "admin" && !isMe && <span style={{ color: "var(--gold)", marginLeft: 4 }}>· Admin</span>}
                    </div>
                  )}
                  <div style={{ background: message._pending ? "color-mix(in srgb, var(--accent) 70%, var(--surface))" : isMe ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, white) 0%, var(--accent) 100%)" : "color-mix(in srgb, var(--surface) 92%, white)", color: isMe ? "#fff" : "var(--text)", borderRadius: isMe ? "20px 20px 6px 20px" : "20px 20px 20px 6px", padding: event ? 10 : "10px 14px 9px", fontSize: 14, lineHeight: 1.5, border: isMe ? "none" : "1px solid var(--border)", wordBreak: "break-word", whiteSpace: "pre-wrap", opacity: message._pending ? 0.7 : 1, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    {event?.kind === "poll" ? (
                      <PollBubble item={event} votes={votesByPoll[event.id] || {}} myId={myId} onVote={votePoll} isMe={isMe} />
                    ) : event?.kind === "attachment" ? (
                      <AttachmentBubble item={event} />
                    ) : (
                      message.text
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, display: "flex", alignItems: "center", gap: 5, flexDirection: isMe ? "row-reverse" : "row", paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                    <span>{message._pending ? "Sending..." : formatTime(message.sentAt)}</span>
                    {canPin && !message._pending && event?.kind !== "poll_vote" && (
                      <button type="button" onClick={() => handlePin(message)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, opacity: isPinned ? 1 : 0.45, padding: 0, lineHeight: 1, color: "var(--text-dim)" }} title={isPinned ? "Unpin" : "Pin"}>Pin</button>
                    )}
                    {canDelete(message) && <DeleteBtn onDelete={() => handleDelete(message)} style={{ opacity: 0.35 }} />}
                  </div>
                  {!message._pending && <ReactionRow reactions={reactionsByMessage[message.id]} onReact={(emoji, active) => reactToMessage(message, emoji, active)} />}
                </div>
                {showSender && isMe ? <Av name={senderName} tone="me" size={30} /> : isMe ? <div style={{ width: 30, flexShrink: 0 }} /> : null}
              </div>
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div style={{ flexShrink: 0, padding: "8px 10px 10px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 6 }}>{error}</div>}
        <div style={{ display: "flex", gap: 5, marginBottom: 6, overflowX: "auto", paddingBottom: 1 }}>
          {QUICK_EMOJIS.map(emoji => (
            <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} style={{ border: "1px solid var(--border)", background: "var(--surface-high)", borderRadius: 999, width: 30, height: 30, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }} title="Add emoji">
              {emoji}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 15, padding: "6px 6px 6px 9px" }}>
          <label className="btn-secondary" style={{ width: 38, height: 38, borderRadius: 999, display: "grid", placeItems: "center", padding: 0, flexShrink: 0, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }} title="Attach image">
            +
            <input type="file" accept="image/*" disabled={uploading} onChange={event => { handleAttachment(event.target.files?.[0]); event.target.value = ""; }} style={{ display: "none" }} />
          </label>
          <input ref={inputRef} className="input-field" placeholder={uploading ? "Uploading image..." : "Message group"} value={text} onChange={e => { setText(e.target.value); if (error) setError(""); }} onKeyDown={handleKeyDown} style={{ flex: 1, border: "none", background: "transparent", padding: 0, minHeight: 20, fontSize: 14 }} />
          <button className="btn-primary" style={{ height: 38, borderRadius: 999, padding: "0 14px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, opacity: !text.trim() || sending || uploading ? 0.5 : 1 }} onClick={handleSend} disabled={!text.trim() || sending || uploading}>
            Send
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, textAlign: "right" }}>{text.length}/{MAX_MSG_LEN}</div>
      </div>
    </div>
  );
}
