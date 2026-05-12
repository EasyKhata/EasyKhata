import React, { useEffect, useMemo, useState } from "react";
import { announcementsApi, adminApi } from "../lib/api";
import { logError } from "../utils/logger";
import { SectionSkeleton, WorkflowSetupCard } from "../components/UI";
import { useConfirm } from "../context/DialogContext";

const TYPE_OPTIONS = [
  { value: "info",     label: "Info",     color: "var(--blue)",   bg: "var(--blue-deep)" },
  { value: "offer",    label: "Offer",    color: "var(--green)",  bg: "var(--green-deep)" },
  { value: "update",   label: "Update",   color: "var(--accent)", bg: "var(--surface-pop)" },
  { value: "festival", label: "Festival", color: "var(--gold)",   bg: "var(--gold-deep)" }
];

const PLAN_OPTIONS = [
  { value: "all",      label: "All Users" },
  { value: "free",     label: "Free only" },
  { value: "pro",      label: "Pro only" },
  { value: "business", label: "Business only" }
];

const ORG_TYPE_OPTIONS = [
  { value: "personal",   label: "Household" },
  { value: "freelancer", label: "Small Business" },
  { value: "apartment",  label: "Apartment" }
];

function typeConfig(type) {
  return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
}

// `sendInApp` writes a Firestore announcement (the existing in-app banner).
// `sendPush` fires a native push notification to matching users — rate-limited
// server-side to 1 marketing push per user per 24 h.
// `orgTypes` filters by user.organizationType (multi-select).
// `route` optionally tells the client where to deep-link on tap (e.g. "income").
const EMPTY_FORM = {
  title: "",
  body: "",
  type: "info",
  targetPlan: "all",
  orgTypes: [],
  endsAt: "",
  sendInApp: true,
  sendPush: true,
  route: ""
};

export default function AdminAnnouncementsSection() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState(null);
  // Live audience count — refreshed when audience filters change.
  const [audience, setAudience] = useState({ count: null, loading: false });

  async function load() {
    setLoading(true);
    try {
      const data = await announcementsApi.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      logError("Announcements load error", err);
      setError("Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Translate the form's targetPlan + orgTypes into the audience filter shape
  // the server expects. targetPlan "all" → no plan filter; otherwise [plan].
  function audienceParams() {
    const plans = form.targetPlan && form.targetPlan !== "all" ? [form.targetPlan] : [];
    const orgTypes = Array.isArray(form.orgTypes) ? form.orgTypes : [];
    return { plans, orgTypes };
  }

  // Debounced preview — re-runs when audience inputs change. Cheap server count.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setAudience(a => ({ ...a, loading: true }));
      try {
        const res = await adminApi.previewBroadcastAudience(audienceParams());
        if (!cancelled) setAudience({ count: Number(res?.matched ?? 0), loading: false });
      } catch {
        if (!cancelled) setAudience({ count: null, loading: false });
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.targetPlan, JSON.stringify(form.orgTypes)]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (!form.sendInApp && !form.sendPush) {
      setError("Pick at least one delivery channel — in-app banner or push notification.");
      return;
    }
    setSubmitting(true);
    setError("");
    setLastResult(null);
    try {
      const { plans, orgTypes } = audienceParams();
      const result = await adminApi.createBroadcast({
        title: form.title.trim(),
        body:  form.body.trim(),
        route: form.route.trim() || undefined,
        type:  form.type || "info",
        targetPlan: form.targetPlan || "all",
        plans,
        orgTypes,
        sendInApp: form.sendInApp,
        sendPush:  form.sendPush
      });
      setLastResult(result);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      logError("Create broadcast error", err);
      setError(err?.message || "Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleOrgType(value) {
    setForm(f => {
      const set = new Set(f.orgTypes);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, orgTypes: Array.from(set) };
    });
  }

  async function remove(item) {
    const ok = await confirm(`Delete "${item.title}"? Users will no longer see this.`, { title: "Delete Announcement", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await announcementsApi.delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      logError("Delete announcement error", err);
      setError("Could not delete. Please try again.");
    }
  }

  const cfg = typeConfig(form.type);
  const summary = useMemo(() => {
    const now = new Date();
    return items.reduce((acc, item) => {
      const expired = item.endsAt && new Date(item.endsAt) < now;
      if (expired) acc.expired += 1;
      else acc.active += 1;
      if (item.type === "offer") acc.offers += 1;
      if (item.targetPlan && item.targetPlan !== "all") acc.targeted += 1;
      return acc;
    }, { active: 0, expired: 0, offers: 0, targeted: 0 });
  }, [items]);

  function duplicate(item) {
    setForm({
      ...EMPTY_FORM,
      title: item.title || "",
      body: item.body || "",
      type: item.type || "info",
      targetPlan: item.targetPlan || "all"
    });
    setLastResult(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ padding: "16px 16px 110px" }}>
      <div className="section-label" style={{ marginBottom: 14 }}>Announcements</div>

      {error && (
        <div className="card" style={{ padding: 12, marginBottom: 14, borderLeft: "4px solid var(--danger)" }}>
          <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
        {[
          ["Active", summary.active, "var(--accent)"],
          ["Expired", summary.expired, "var(--text-dim)"],
          ["Offers", summary.offers, "var(--gold)"],
          ["Targeted", summary.targeted, "var(--blue)"]
        ].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: 12, marginBottom: 0, borderColor: `${color}44` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
            <div style={{ fontSize: 22, fontFamily: "var(--serif)", color: "var(--text)", marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Compose form */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>New Announcement</div>
        <form onSubmit={submit}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                type="button"
                className="btn-secondary"
                style={{
                  padding: "6px 12px", fontSize: 12,
                  background: form.type === t.value ? t.bg : "var(--surface-high)",
                  color: form.type === t.value ? t.color : "var(--text-sec)",
                  borderColor: form.type === t.value ? `${t.color}55` : undefined
                }}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            className="input-field"
            placeholder="Title — e.g. Happy Diwali from EazyKhata!"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ marginBottom: 8 }}
            maxLength={80}
          />

          <textarea
            className="input-field"
            placeholder="Message — e.g. Wishing you prosperity and growth this festive season."
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={3}
            maxLength={300}
            style={{ marginBottom: 8, resize: "vertical", fontFamily: "inherit", fontSize: 13 }}
          />

          {/* Audience row 1 — plan + expiry */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              className="input-field"
              value={form.targetPlan}
              onChange={e => setForm(f => ({ ...f, targetPlan: e.target.value }))}
              style={{ padding: "7px 10px", fontSize: 12, width: "auto" }}
            >
              {PLAN_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-sec)", whiteSpace: "nowrap" }}>Expires</span>
              <input
                className="input-field"
                type="date"
                value={form.endsAt ? form.endsAt.slice(0, 10) : ""}
                onChange={e => setForm(f => ({ ...f, endsAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                style={{ padding: "7px 10px", fontSize: 12, width: "auto" }}
              />
              {form.endsAt && (
                <button type="button" className="btn-secondary" style={{ padding: "6px 8px", fontSize: 11, color: "var(--text-dim)" }} onClick={() => setForm(f => ({ ...f, endsAt: "" }))}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Audience row 2 — org type multi-select */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-dim)", marginRight: 4 }}>Khata type:</span>
            {ORG_TYPE_OPTIONS.map(o => {
              const on = form.orgTypes.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className="btn-secondary"
                  onClick={() => toggleOrgType(o.value)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 11,
                    background: on ? "var(--surface-pop)" : "var(--surface-high)",
                    color: on ? "var(--text)" : "var(--text-sec)",
                    borderColor: on ? "var(--accent)" : undefined
                  }}
                >
                  {on ? "✓ " : ""}{o.label}
                </button>
              );
            })}
            {form.orgTypes.length === 0 && (
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>(any)</span>
            )}
          </div>

          {/* Delivery channels */}
          <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: "var(--surface-high)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-sec)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.sendInApp}
                onChange={e => setForm(f => ({ ...f, sendInApp: e.target.checked }))}
              />
              In-app banner
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-sec)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.sendPush}
                onChange={e => setForm(f => ({ ...f, sendPush: e.target.checked }))}
              />
              Push notification
            </label>
            {form.sendPush && (
              <input
                className="input-field"
                placeholder="Deep-link route (optional, e.g. income)"
                value={form.route}
                onChange={e => setForm(f => ({ ...f, route: e.target.value }))}
                style={{ padding: "6px 10px", fontSize: 12, flex: "1 1 200px", minWidth: 160 }}
                maxLength={64}
              />
            )}
          </div>

          {/* Audience count */}
          <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 12, lineHeight: 1.5 }}>
            {audience.loading
              ? "Counting matching users…"
              : audience.count === null
                ? "Audience size unavailable."
                : `Will reach ${audience.count.toLocaleString("en-IN")} user${audience.count === 1 ? "" : "s"}${form.sendPush ? " (push respects 24-hour rate limit + opt-out)" : ""}.`}
          </div>

          {(form.title || form.body) && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: cfg.bg, border: `1px solid ${cfg.color}44`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Preview</div>
              {form.title && <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{form.title}</div>}
              {form.body && <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>{form.body}</div>}
            </div>
          )}

          {lastResult && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "color-mix(in srgb, var(--accent) 6%, var(--surface-high))", border: "1px solid color-mix(in srgb, var(--accent) 24%, var(--border))", marginBottom: 10, fontSize: 12, color: "var(--text-sec)", lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
                ✓ Broadcast sent
              </div>
              Reached <b>{lastResult.audienceSize}</b> user{lastResult.audienceSize === 1 ? "" : "s"}.
              {lastResult.pushSummary && (
                <>
                  {" "}Push: <b>{lastResult.pushSummary.sent}</b> delivered
                  {lastResult.pushSummary.rateLimited ? <>, <b>{lastResult.pushSummary.rateLimited}</b> skipped (24-h limit)</> : null}
                  {lastResult.pushSummary.failed ? <>, <b>{lastResult.pushSummary.failed}</b> failed</> : null}
                  {lastResult.pushSummary.deadTokensReaped ? <>, <b>{lastResult.pushSummary.deadTokensReaped}</b> dead tokens cleaned</> : null}.
                </>
              )}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting} style={{ width: "100%", padding: "10px 0", fontSize: 13 }}>
            {submitting
              ? "Sending…"
              : !form.sendInApp && !form.sendPush
                ? "Pick a delivery channel"
                : form.sendPush && form.sendInApp
                  ? "Send banner + push"
                  : form.sendPush
                    ? "Send push notification"
                    : "Send in-app banner"}
          </button>
        </form>
      </div>

      {/* Sent announcements list */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>
        Sent ({items.length})
      </div>

      {loading ? (
        <SectionSkeleton rows={3} showHero={false} />
      ) : items.length === 0 ? (
        <WorkflowSetupCard title="No announcements yet" message="Compose your first message above to reach all users instantly." tone="info" />
      ) : (
        <div className="card">
          {items.map((item, idx) => {
            const tc = typeConfig(item.type);
            const expired = item.endsAt && new Date(item.endsAt) < new Date();
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
            return (
              <div key={item.id} className="card-row" style={{ padding: "12px 14px", alignItems: "flex-start", gap: 10, borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none", opacity: expired ? 0.55 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                    <span className="pill" style={{ background: tc.bg, color: tc.color }}>{tc.label}</span>
                    {item.targetPlan !== "all" && <span className="pill" style={{ background: "var(--surface-pop)", color: "var(--text-sec)" }}>{PLAN_OPTIONS.find(p => p.value === item.targetPlan)?.label}</span>}
                    {expired && <span className="pill" style={{ background: "var(--surface-high)", color: "var(--text-dim)" }}>Expired</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-sec)", lineHeight: 1.5 }}>{item.body}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                    {date}{item.endsAt ? ` · Expires ${new Date(item.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                  <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => duplicate(item)}>
                    Duplicate
                  </button>
                  <button className="btn-secondary" style={{ padding: "5px 10px", fontSize: 11, color: "var(--danger)" }} onClick={() => remove(item)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
