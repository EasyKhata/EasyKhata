import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { DeleteBtn } from "../components/UI";

const MAX_MSG_LEN = 500;

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
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
  const d = useData();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const messages = useMemo(() => {
    const raw = (d.orgRecords?.discussions || []);
    return raw.slice().sort((a, b) => String(a.sentAt || "").localeCompare(String(b.sentAt || "")));
  }, [d.orgRecords?.discussions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const senderName = user?.name || user?.displayName || user?.email?.split("@")[0] || "Resident";
  const isAdmin = user?.role === "admin";

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > MAX_MSG_LEN) {
      setError(`Message too long (max ${MAX_MSG_LEN} chars).`);
      return;
    }
    setError("");
    setSending(true);
    d.addOrgRecord("discussions", {
      text: trimmed,
      senderName,
      senderId: user?.id || "",
      senderRole: isAdmin ? "admin" : "member",
      sentAt: new Date().toISOString()
    });
    setText("");
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function canDelete(msg) {
    return isAdmin || String(msg.senderId || "") === String(user?.id || "");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "calc(100vh - 140px)", paddingBottom: 0 }}>
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
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-dim)", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text-sec)" }}>No messages yet</div>
            <div>Start the conversation — post an announcement, ask a question, or share an update with your residents.</div>
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
                      background: isMe ? "var(--accent)" : "var(--surface)",
                      color: isMe ? "#fff" : "var(--text)",
                      borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      padding: "10px 14px",
                      fontSize: 14,
                      lineHeight: 1.5,
                      border: isMe ? "none" : "1px solid var(--border)",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap"
                    }}>
                      {msg.text}
                    </div>
                    {canDelete(msg) && (
                      <DeleteBtn onDelete={() => d.removeOrgRecord("discussions", msg.id)} style={{ opacity: 0.5 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, paddingLeft: isMe ? 0 : 2, paddingRight: isMe ? 2 : 0 }}>
                    {formatTime(msg.sentAt)}
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
