import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { logError } from "../utils/logger";

const TYPE_STYLE = {
  info:     { color: "var(--blue)",   bg: "var(--blue-deep)",   border: "var(--blue)" },
  offer:    { color: "var(--green)",  bg: "var(--green-deep)",  border: "var(--green)" },
  update:   { color: "var(--accent)", bg: "var(--surface-pop)", border: "var(--accent)" },
  festival: { color: "var(--gold)",   bg: "var(--gold-deep)",   border: "var(--gold)" }
};

const DISMISSED_KEY = "ek_dismissed_announcements";

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; }
}

function saveDismissed(ids) {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids)); } catch {}
}

export default function AnnouncementBanner({ userPlan = "free" }) {
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const dismissed = getDismissed();
    const now = new Date();

    getDocs(collection(db, "announcements"))
      .then(snap => {
        const active = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(ann => {
            if (!ann.active) return false;
            if (dismissed.includes(ann.id)) return false;
            if (ann.endsAt && new Date(ann.endsAt) < now) return false;
            if (ann.targetPlan && ann.targetPlan !== "all" && ann.targetPlan !== userPlan) return false;
            return true;
          })
          .sort((a, b) => (b.createdAt || "") > (a.createdAt || "") ? 1 : -1);

        if (active.length > 0) {
          setCurrent(active[0]);
          setQueue(active.slice(1));
        }
      })
      .catch(err => logError("Announcement fetch error", err));
  }, [userPlan]);

  function dismiss() {
    if (!current) return;
    const dismissed = getDismissed();
    saveDismissed([...dismissed, current.id]);
    if (queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(q => q.slice(1));
    } else {
      setCurrent(null);
    }
  }

  if (!current) return null;

  const style = TYPE_STYLE[current.type] || TYPE_STYLE.info;

  return (
    <div
      style={{
        margin: "0 auto",
        marginTop: 12,
        width: "min(calc(100% - 16px), 760px)",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${style.border}55`,
        background: style.bg,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        pointerEvents: "auto"
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: style.color, marginBottom: 2 }}>{current.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>{current.body}</div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: style.color, fontSize: 16, lineHeight: 1,
          padding: "2px 4px", flexShrink: 0, opacity: 0.7
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
