import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { messagesApi } from "../lib/api";
import { DeleteBtn } from "../components/UI";

const MAX_MSG_LEN = 500;
const MAX_POLL_Q = 180;
const MAX_POLL_OPT = 80;
const MAX_POLL_OPTIONS = 4;
const POLL_INTERVAL = 8000;

// Module-level cache — survives component unmounts within the same session.
// Keyed by `${ownerId}_${orgId}` so switching orgs gets the right messages.
const _msgCache = new Map();

// Poll options store — persisted to localStorage so polls survive app restarts.
// The server strips pollOptions when listing messages, so we keep our own copy.
const _pollOptsCache = new Map(); // pollId → pollOptions[]
const _POLL_LS = "ek_po_";

function _loadPollOpts(storeKey) {
  try {
    const data = JSON.parse(localStorage.getItem(_POLL_LS + storeKey) || "{}");
    Object.entries(data).forEach(([id, opts]) => _pollOptsCache.set(id, opts));
  } catch {}
}
function _savePollOpts(storeKey) {
  try {
    const out = {};
    _pollOptsCache.forEach((v, k) => { out[k] = v; });
    localStorage.setItem(_POLL_LS + storeKey, JSON.stringify(out));
  } catch {}
}
function _storePoll(storeKey, pollId, opts) {
  if (!pollId || !opts?.length) return;
  _pollOptsCache.set(pollId, opts);
  _savePollOpts(storeKey);
}
function _getPollOpts(pollId) { return _pollOptsCache.get(pollId); }

// Normalize a message received from the server, filling gaps from local cache and
// the poll options store. Always call this before putting a server row into state.
function _normalizeMsg(m, local, storeKey) {
  // Resolve poll options: server → local → localStorage cache
  const opts = (m.pollOptions?.length ? m.pollOptions : null)
    || (local?.pollOptions?.length ? local.pollOptions : null)
    || _getPollOpts(m.id);
  if (opts?.length && storeKey) _storePoll(storeKey, m.id, opts);

  // Resolve messageType: server → local → infer from opts
  const type = m.messageType || local?.messageType || (opts?.length ? MT.POLL : MT.CHAT);

  const base = local ? { ...local, ...m } : { ...m };
  return { ...base, messageType: type, ...(opts ? { pollOptions: opts } : {}) };
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

// Votes and pins are stored as regular chat messages with a special text prefix
// because the server only accepts messageType "chat"|"announcement"|"poll".
// Vote format: __vote__:<pollId>:<optionId>:<senderId>
// Pin  format: __pin__:<msgId>:<1|0>
function decodeActionText(text) {
  if (typeof text !== "string") return null;
  if (text.startsWith("__vote__:")) {
    const p = text.split(":");
    // p[0]="__vote__", p[1]=pollId, p[2]=optionId, p[3]=senderId
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

// ── Pinned banner ────────────────────────────────────────────────────────────

function PinnedBanner({ message, canPin, onUnpin }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (message.text || message.pollQuestion || "").slice(0, 80);
  const full = message.text || message.pollQuestion || "";
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

// ── Announcement card ────────────────────────────────────────────────────────

function AnnouncementCard({ message, canDelete, canPin, onDelete, onPin, isPinned }) {
  const isOwner = message.senderRole === "owner";
  const ac = isOwner ? "var(--accent)" : "var(--gold)";
  const acDeep = isOwner ? "var(--accent-deep)" : "color-mix(in srgb, var(--gold) 14%, var(--surface))";
  return (
    <div style={{ margin: "4px 0", flexShrink: 0, borderRadius: 14, border: `1px solid color-mix(in srgb, ${ac} 30%, var(--border))`, background: acDeep, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", opacity: message._pending ? 0.7 : 1 }}>
      <div style={{ padding: "8px 12px 6px", borderBottom: `1px solid color-mix(in srgb, ${ac} 20%, var(--border))`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: ac, textTransform: "uppercase", letterSpacing: 0.7, padding: "3px 7px", borderRadius: 999, background: `color-mix(in srgb, ${ac} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${ac} 28%, transparent)` }}>
            Announcement
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: ac }}>
            {message.senderName || "Management"}
            {message.senderRole === "owner" && <span style={{ marginLeft: 4, fontWeight: 500, color: "var(--text-dim)" }}>· Owner</span>}
            {message.senderRole === "admin" && <span style={{ marginLeft: 4, fontWeight: 500, color: "var(--text-dim)" }}>· Admin</span>}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{message._pending ? "Sending..." : formatTime(message.sentAt)}</span>
          {canPin && !message._pending && (
            <button type="button" onClick={onPin} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: isPinned ? 1 : 0.45, padding: "2px" }} title={isPinned ? "Unpin" : "Pin"}>
              📌
            </button>
          )}
          {canDelete && !message._pending && <DeleteBtn onDelete={onDelete} style={{ opacity: 0.45 }} />}
        </div>
      </div>
      <div style={{ padding: "10px 14px 12px", fontSize: 14, lineHeight: 1.6, color: "var(--text)", fontWeight: 500, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
        {message.text}
      </div>
    </div>
  );
}

// ── Poll card ────────────────────────────────────────────────────────────────

function PollCard({ message, myVote, voteCountsForPoll, totalVoters, onVote, canDelete, canPin, onDelete, onPin, isPinned }) {
  const options = message.pollOptions || [];
  const hasVoted = Boolean(myVote);

  return (
    <div style={{ margin: "4px 0", flexShrink: 0, borderRadius: 14, border: "1.5px solid color-mix(in srgb, var(--blue) 35%, var(--border))", background: "color-mix(in srgb, var(--blue) 8%, var(--surface-high))", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", opacity: message._pending ? 0.7 : 1 }}>
      {/* Header */}
      <div style={{ padding: "8px 12px 7px", borderBottom: "1px solid color-mix(in srgb, var(--blue) 18%, var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.7, padding: "3px 7px", borderRadius: 999, background: "color-mix(in srgb, var(--blue) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--blue) 28%, transparent)" }}>
            Poll
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)" }}>
            {message.senderName || "Owner"}
            {message.senderRole === "owner" && <span style={{ marginLeft: 4, fontWeight: 500, color: "var(--text-dim)" }}>· Owner</span>}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{message._pending ? "Sending..." : formatTime(message.sentAt)}</span>
          {canPin && !message._pending && (
            <button type="button" onClick={onPin} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: isPinned ? 1 : 0.45, padding: "2px" }} title={isPinned ? "Unpin" : "Pin"}>📌</button>
          )}
          {canDelete && !message._pending && <DeleteBtn onDelete={onDelete} style={{ opacity: 0.45 }} />}
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: "12px 14px 10px", fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.5, wordBreak: "break-word" }}>
        {message.text}
      </div>

      {/* Options */}
      <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map(opt => {
          const votes = voteCountsForPoll?.[opt.id] || 0;
          const pct = totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0;
          const isMyChoice = myVote === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={hasVoted || message._pending}
              onClick={() => onVote(message, opt.id)}
              style={{
                width: "100%",
                padding: 0,
                border: `1.5px solid ${isMyChoice ? "var(--blue)" : "color-mix(in srgb, var(--blue) 25%, var(--border))"}`,
                borderRadius: 10,
                background: "transparent",
                cursor: hasVoted ? "default" : "pointer",
                overflow: "hidden",
                position: "relative",
                textAlign: "left"
              }}
            >
              {hasVoted && (
                <div style={{ position: "absolute", inset: 0, background: `color-mix(in srgb, var(--blue) ${Math.max(pct, 2)}%, transparent)`, borderRadius: 9, transition: "width 0.4s ease" }} />
              )}
              <div style={{ position: "relative", padding: "9px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: isMyChoice ? 700 : 500, color: "var(--text)" }}>
                  {isMyChoice && <span style={{ color: "var(--blue)", marginRight: 6 }}>✓</span>}
                  {opt.text}
                </span>
                {hasVoted && (
                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: isMyChoice ? "var(--blue)" : "var(--text-dim)" }}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
          {totalVoters} {totalVoters === 1 ? "vote" : "votes"}{!hasVoted && " · Tap an option to vote"}
        </div>
      </div>
    </div>
  );
}

// ── Poll creator ─────────────────────────────────────────────────────────────

function PollCreator({ onSubmit, onCancel, disabled }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  function addOption() {
    if (options.length < MAX_POLL_OPTIONS) setOptions(o => [...o, ""]);
  }
  function removeOption(idx) {
    if (options.length <= 2) return;
    setOptions(o => o.filter((_, i) => i !== idx));
  }
  function setOption(idx, val) {
    setOptions(o => o.map((v, i) => (i === idx ? val : v)));
  }

  const cleanOpts = options.map(o => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && cleanOpts.length >= 2 && !disabled;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(question.trim(), cleanOpts);
    setQuestion("");
    setOptions(["", ""]);
  }

  return (
    <div style={{ padding: "10px 12px", background: "color-mix(in srgb, var(--blue) 7%, var(--surface-high))", borderRadius: 14, border: "1px solid color-mix(in srgb, var(--blue) 25%, var(--border))", marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Create Poll</div>
      <textarea
        className="input-field"
        placeholder="Ask a question…"
        value={question}
        maxLength={MAX_POLL_Q}
        onChange={e => setQuestion(e.target.value)}
        rows={2}
        style={{ width: "100%", resize: "none", fontSize: 13, marginBottom: 8, borderRadius: 10, padding: "8px 10px", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        {options.map((opt, idx) => (
          <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              className="input-field"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              maxLength={MAX_POLL_OPT}
              onChange={e => setOption(idx, e.target.value)}
              style={{ flex: 1, fontSize: 13, borderRadius: 10, padding: "7px 10px" }}
            />
            {options.length > 2 && (
              <button type="button" onClick={() => removeOption(idx)} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 16, cursor: "pointer", flexShrink: 0, padding: "4px" }}>✕</button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        {options.length < MAX_POLL_OPTIONS && (
          <button type="button" onClick={addOption} style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", background: "none", border: "1px solid color-mix(in srgb, var(--blue) 30%, var(--border))", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
            + Add option
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onCancel} style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>Cancel</button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ fontSize: 12, fontWeight: 800, color: "#fff", background: canSubmit ? "var(--blue)" : "var(--text-dim)", border: "none", borderRadius: 8, padding: "5px 14px", cursor: canSubmit ? "pointer" : "not-allowed", transition: "background 0.15s" }}
        >
          Post Poll
        </button>
      </div>
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
  const [mode, setMode] = useState("chat"); // "chat" | "announcement" | "poll"
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!cacheKey || !_msgCache.has(cacheKey));

  // Load persisted poll options from localStorage on mount so polls survive app restarts.
  useEffect(() => {
    if (cacheKey) _loadPollOpts(cacheKey);
  }, [cacheKey]);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const latestSentAtRef = useRef(null);
  const pollTimerRef = useRef(null);

  const isOwner = String(ownerId || "") === String(user?.id || "");
  const isAdmin = user?.role === "admin";
  const canAnnounce = isOwner || isAdmin;
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

  // ── Fetch / poll ─────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (after) => {
    if (!ownerId || !orgId) return;
    const storeKey = `${ownerId}_${orgId}`;
    try {
      const rows = await messagesApi.list(ownerId, orgId, after || undefined);
      if (!Array.isArray(rows) || rows.length === 0) return;
      setMessages(prev => {
        const localById = new Map(prev.map(m => [m.id, m]));
        if (after) {
          // Incremental — append only genuinely new messages; never drop existing.
          const fresh = rows
            .filter(m => !localById.has(m.id))
            .map(m => _normalizeMsg(m, null, storeKey));
          if (fresh.length === 0) return prev;
          return [...prev, ...fresh].sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));
        }
        // Full load — merge server rows with local, preserving fields the server omits.
        const merged = rows.map(m => _normalizeMsg(m, localById.get(m.id), storeKey));
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
    // If we have a cache hit, skip the loading spinner — just silently refresh.
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

  // ── Derived data ─────────────────────────────────────────────────────────

  const { visibleMessages, votesByPoll, pinnedMessage } = useMemo(() => {
    const votes = {};
    let latestPin = null;

    messages.forEach(m => {
      // Detect encoded actions by text pattern (server may return any messageType or none).
      const action = decodeActionText(m.text);

      if (m.messageType === MT.VOTE || action?.type === "vote") {
        const pollId  = action ? action.refPollId : m.refPollId;
        const optId   = action ? action.optionId  : m.optionId;
        // senderId from encoded text (reliable) > from server field (may be missing)
        const voterId = (action?.senderId) || m.senderId;
        if (pollId && optId && voterId) {
          if (!votes[pollId]) votes[pollId] = {};
          if (!votes[pollId][voterId] || String(m.sentAt) > String(votes[pollId][voterId]?.sentAt || "")) {
            votes[pollId][voterId] = { optionId: optId, sentAt: m.sentAt };
          }
        }
      }

      if (m.messageType === MT.PIN || action?.type === "pin") {
        const pin = action ? { ...m, refMessageId: action.refMessageId, pinned: action.pinned } : m;
        if (!latestPin || String(pin.sentAt) > String(latestPin.sentAt)) latestPin = pin;
      }
    });

    const pinnedId = latestPin?.pinned ? latestPin.refMessageId : null;
    const pinned = pinnedId ? messages.find(m => m.id === pinnedId) : null;

    // Hide MT.VOTE, MT.PIN (optimistic) and any encoded-action messages (any messageType).
    const visible = messages.filter(m => {
      if (HIDDEN.has(m.messageType)) return false;
      if (decodeActionText(m.text)) return false;
      return true;
    });

    return { visibleMessages: visible, votesByPoll: votes, pinnedMessage: pinned };
  }, [messages]);

  function getVoteCounts(pollMsgId, options) {
    const pollVotes = votesByPoll[pollMsgId] || {};
    const counts = {};
    Object.values(pollVotes).forEach(({ optionId }) => {
      counts[optionId] = (counts[optionId] || 0) + 1;
    });
    return counts;
  }

  function getMyVote(pollMsgId) {
    return votesByPoll[pollMsgId]?.[myId]?.optionId || null;
  }

  function getTotalVoters(pollMsgId) {
    return Object.keys(votesByPoll[pollMsgId] || {}).length;
  }

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
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        senderId: myId,
        senderName,
        senderRole,
        sentAt: optimistic.sentAt,
        ...payload,
      });
      // Merge: server wins for fields it provides; optimistic fills every gap.
      const merged = {
        ...optimistic,
        ...saved,
        messageType: saved.messageType || optimistic.messageType,
        // Server never returns pollOptions — keep the ones we sent.
        pollOptions: saved.pollOptions?.length ? saved.pollOptions : optimistic.pollOptions,
        senderId: saved.senderId || optimistic.senderId,
        _pending: false,
      };
      // Persist poll options to localStorage so they survive app restarts.
      if (merged.messageType === MT.POLL && merged.pollOptions?.length && cacheKey) {
        _storePoll(cacheKey, merged.id, merged.pollOptions);
      }
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
    const type = canAnnounce && mode === "announcement" ? MT.ANNOUNCEMENT : MT.CHAT;
    try {
      await sendMessage({ messageType: type, text: trimmed });
    } catch {
      setText(trimmed);
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handlePollSubmit(question, options) {
    setSending(true);
    setError("");
    try {
      await sendMessage({
        messageType: MT.POLL,
        text: question,
        pollOptions: options.map((text, i) => ({ id: `opt_${i}`, text })),
      });
      setMode("chat");
    } catch {
      setError("Failed to post poll. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVote(pollMessage, optionId) {
    if (getMyVote(pollMessage.id) || sending) return;
    try {
      // Server only accepts messageType "chat". Encode vote+voter in text so
      // attribution is self-contained even if server strips senderId.
      await sendMessage(
        { messageType: MT.CHAT, text: `__vote__:${pollMessage.id}:${optionId}:${myId}` },
        { messageType: MT.VOTE, refPollId: pollMessage.id, optionId }
      );
    } catch {
      setError("Vote failed. Try again.");
    }
  }

  async function handlePin(message) {
    if (!canPin) return;
    const alreadyPinned = pinnedMessage?.id === message.id;
    const pinning = !alreadyPinned;
    try {
      // Server only accepts messageType "chat". Encode pin in text; decode locally.
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
    if (e.key === "Enter" && !e.shiftKey && mode !== "poll") {
      e.preventDefault();
      handleSend();
    }
  }

  const isAnnounceMode = canAnnounce && mode === "announcement";
  const feedMessages = visibleMessages;
  const chatCount = feedMessages.filter(m => m.messageType === MT.CHAT || m.messageType === MT.ANNOUNCEMENT || m.messageType === MT.POLL).length;

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
              {canAnnounce ? "Post an announcement, create a poll, or send a message to get started." : "Management will post announcements and polls here. You can also send messages."}
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

              {message.messageType === MT.ANNOUNCEMENT ? (
                <AnnouncementCard
                  message={message}
                  canDelete={canDelete(message)}
                  canPin={canPin}
                  onDelete={() => handleDelete(message)}
                  onPin={() => handlePin(message)}
                  isPinned={isPinned}
                />
              ) : message.messageType === MT.POLL ? (
                <PollCard
                  message={message}
                  myVote={getMyVote(message.id)}
                  voteCountsForPoll={getVoteCounts(message.id, message.pollOptions)}
                  totalVoters={getTotalVoters(message.id)}
                  onVote={handleVote}
                  canDelete={canDelete(message)}
                  canPin={canPin}
                  onDelete={() => handleDelete(message)}
                  onPin={() => handlePin(message)}
                  isPinned={isPinned}
                />
              ) : (
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
              )}
            </React.Fragment>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0, padding: "8px 10px 10px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {/* Mode toggle — owner/admin only */}
        {canAnnounce && (
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {[["chat", "Message"], ["announcement", "Announcement"], ["poll", "Poll"]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, border: `1px solid ${mode === key ? "var(--accent)" : "var(--border)"}`, background: mode === key ? "var(--accent-deep)" : "transparent", color: mode === key ? "var(--accent)" : "var(--text-dim)", cursor: "pointer", transition: "all 0.15s" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 6 }}>{error}</div>}

        {mode === "poll" && canAnnounce ? (
          <PollCreator
            onSubmit={handlePollSubmit}
            onCancel={() => setMode("chat")}
            disabled={sending}
          />
        ) : (
          <>
            <div style={{ display: "flex", gap: 7, alignItems: "center", background: "var(--bg)", border: `1px solid ${isAnnounceMode ? "color-mix(in srgb, var(--accent) 50%, var(--border))" : "var(--border)"}`, borderRadius: 15, padding: "6px 6px 6px 9px", transition: "border-color 0.15s" }}>
              <input
                ref={inputRef}
                className="input-field"
                placeholder={isAnnounceMode ? "Write an announcement for all residents..." : "Message group"}
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
                {isAnnounceMode ? "Post" : "Send"}
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5, textAlign: "right" }}>{text.length}/{MAX_MSG_LEN}</div>
          </>
        )}
      </div>
    </div>
  );
}
