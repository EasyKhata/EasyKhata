import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { BarChart3, ExternalLink, Megaphone, Pause, Play, Plus, Save, Trash2, X } from "lucide-react";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { logError } from "../utils/logger";
import { ORG_TYPES } from "../utils/orgTypes";
import { PLANS } from "../utils/subscription";
import { adminApi } from "../lib/api";

const DEFAULT_MANAGER_EMAILS = ["admin@easykhata.net", "admin@eazykhata.in"];
const ENV_MANAGER_EMAILS = String(import.meta.env.VITE_ADS_MANAGER_EMAILS || "")
  .split(",")
  .map(item => item.trim().toLowerCase())
  .filter(Boolean);
const MANAGER_EMAILS = new Set([...DEFAULT_MANAGER_EMAILS, ...ENV_MANAGER_EMAILS]);

const STATUS_OPTIONS = ["draft", "active", "paused"];
const CTA_TYPES = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone" }
];

const ORG_TARGETS = [
  { value: "all", label: "All orgs" },
  { value: ORG_TYPES.PERSONAL, label: "Household" },
  { value: ORG_TYPES.FREELANCER, label: "Small Business" },
  { value: ORG_TYPES.APARTMENT, label: "Apartment" }
];

const PLAN_TARGETS = [
  { value: "all", label: "All plans" },
  { value: PLANS.FREE, label: "Free" },
  { value: PLANS.PRO, label: "Pro" }
];

const EMPTY_FORM = {
  businessName: "",
  title: "",
  body: "",
  category: "",
  imageUrl: "",
  ctaType: "website",
  ctaLabel: "View offer",
  ctaValue: "",
  whatsappText: "",
  status: "draft",
  priority: 0,
  startDate: "",
  endDate: "",
  targetOrgTypes: ["all"],
  targetPlans: ["all"],
  targetCountriesText: "",
  targetStatesText: "",
  targetCitiesText: ""
};

function canManageAds(user) {
  return user?.role === "admin" || MANAGER_EMAILS.has(String(user?.email || "").toLowerCase());
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function joinList(value) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function normalizeMulti(current, value) {
  if (value === "all") return ["all"];
  const next = new Set((current || []).filter(item => item !== "all"));
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next.size ? Array.from(next) : ["all"];
}

function toForm(campaign) {
  return {
    ...EMPTY_FORM,
    ...campaign,
    targetOrgTypes: campaign.targetOrgTypes || ["all"],
    targetPlans: campaign.targetPlans || ["all"],
    targetCountriesText: joinList(campaign.targetCountries),
    targetStatesText: joinList(campaign.targetStates),
    targetCitiesText: joinList(campaign.targetCities)
  };
}

function statusTone(status) {
  if (status === "active") return "var(--jade)";
  if (status === "paused") return "var(--saffron)";
  return "var(--text-dim)";
}

function mapRows(map) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function InsightCard({ label, value, sub }) {
  return (
    <div className="ads-insight-card">
      <div>{label}</div>
      <strong>{value ?? 0}</strong>
      {sub && <span>{sub}</span>}
    </div>
  );
}

function InsightList({ title, rows, empty = "No data yet" }) {
  const safeRows = Array.isArray(rows) ? rows : mapRows(rows);
  return (
    <div className="card ads-insight-list">
      <h3>{title}</h3>
      {safeRows.length > 0 ? safeRows.slice(0, 8).map(row => (
        <div key={row.label} className="ads-insight-row">
          <span>{row.label}</span>
          <strong>{row.count}</strong>
        </div>
      )) : <p>{empty}</p>}
    </div>
  );
}

export default function AdsManager() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsError, setInsightsError] = useState("");
  const [activeTab, setActiveTab] = useState("ads");

  const allowed = canManageAds(user);

  async function load() {
    if (!allowed) return;
    setLoading(true);
    setInsightsError("");
    try {
      const [campaignSnap, eventSnap, audienceInsights] = await Promise.all([
        getDocs(collection(db, "ad_campaigns")),
        getDocs(query(collection(db, "ad_events"), limit(1000))),
        adminApi.getAdAudienceInsights().catch(err => {
          setInsightsError(err.message || "Audience insights are unavailable.");
          return null;
        })
      ]);
      setCampaigns(campaignSnap.docs.map(item => ({ id: item.id, ...item.data() })));
      setEvents(eventSnap.docs.map(item => ({ id: item.id, ...item.data() })));
      setInsights(audienceInsights);
    } catch (err) {
      logError("ads_manager_load_failed", err);
      showToast({ title: "Could not load ads", message: err.message || "Please check Firebase rules.", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [allowed]);

  const statsByCampaign = useMemo(() => {
    const map = {};
    for (const event of events) {
      if (!event.campaignId) continue;
      if (!map[event.campaignId]) map[event.campaignId] = { impressions: 0, clicks: 0 };
      if (event.type === "impression") map[event.campaignId].impressions += 1;
      if (event.type === "click") map[event.campaignId].clicks += 1;
    }
    return map;
  }, [events]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  }, [campaigns]);

  const campaignTotals = useMemo(() => {
    const totals = events.reduce((acc, event) => {
      if (event.type === "impression") acc.impressions += 1;
      if (event.type === "click") acc.clicks += 1;
      return acc;
    }, { impressions: 0, clicks: 0 });
    totals.ctr = totals.impressions ? Math.round((totals.clicks / totals.impressions) * 100) : 0;
    return totals;
  }, [events]);

  function updateField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function startEdit(campaign) {
    setEditingId(campaign.id);
    setForm(toForm(campaign));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId("");
    setForm(EMPTY_FORM);
  }

  function buildPayload() {
    return {
      businessName: form.businessName.trim(),
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim(),
      placement: "dashboard_carousel",
      ctaType: form.ctaType,
      ctaLabel: form.ctaLabel.trim() || "View offer",
      ctaValue: form.ctaValue.trim(),
      whatsappText: form.whatsappText.trim(),
      status: form.status,
      priority: Number(form.priority || 0),
      startDate: form.startDate,
      endDate: form.endDate,
      targetOrgTypes: form.targetOrgTypes || ["all"],
      targetPlans: form.targetPlans || ["all"],
      targetCountries: splitCsv(form.targetCountriesText),
      targetStates: splitCsv(form.targetStatesText),
      targetCities: splitCsv(form.targetCitiesText),
      updatedAt: serverTimestamp(),
      updatedBy: user?.email || user?.id || ""
    };
  }

  function safeFileName(file) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const base = (form.businessName || form.title || "ad")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "ad";
    return `${Date.now()}-${base}.${ext}`;
  }

  async function uploadImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ title: "Choose an image", message: "Please upload a JPG, PNG, or WebP image.", tone: "warning" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast({ title: "Image too large", message: "Please keep ad images below 2 MB. Around 800 x 800 px works best.", tone: "warning" });
      return;
    }
    setUploadingImage(true);
    try {
      const imageRef = ref(storage, `ad-assets/${user.id}/${safeFileName(file)}`);
      await uploadBytes(imageRef, file, {
        contentType: file.type,
        customMetadata: { uploadedBy: user.email || user.id || "ads-manager" }
      });
      const url = await getDownloadURL(imageRef);
      updateField("imageUrl", url);
      showToast({ title: "Image uploaded", message: "The image URL has been added to this campaign.", tone: "success" });
    } catch (err) {
      logError("ads_manager_image_upload_failed", err);
      showToast({ title: "Image upload failed", message: err.message || "Please check Firebase Storage rules.", tone: "danger" });
    } finally {
      setUploadingImage(false);
    }
  }

  async function saveCampaign(e) {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      showToast({ title: "Image required", message: "Upload an ad image or paste an image URL before saving.", tone: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateDoc(doc(db, "ad_campaigns", editingId), payload);
      } else {
        await addDoc(collection(db, "ad_campaigns"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email || user?.id || ""
        });
      }
      showToast({ title: editingId ? "Campaign updated" : "Campaign created", message: "Dashboard ads will pick this up automatically.", tone: "success" });
      resetForm();
      await load();
    } catch (err) {
      logError("ads_manager_save_failed", err);
      showToast({ title: "Could not save campaign", message: err.message || "Please check Firebase rules.", tone: "danger" });
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(campaign, status) {
    try {
      await updateDoc(doc(db, "ad_campaigns", campaign.id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || user?.id || ""
      });
      await load();
    } catch (err) {
      logError("ads_manager_status_failed", err, { campaignId: campaign.id, status });
      showToast({ title: "Status update failed", message: err.message || "Please check Firebase rules.", tone: "danger" });
    }
  }

  async function removeCampaign(campaign) {
    const ok = window.confirm(`Delete "${campaign.title}"? This removes the campaign, not old click/impression events.`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "ad_campaigns", campaign.id));
      await load();
    } catch (err) {
      logError("ads_manager_delete_failed", err, { campaignId: campaign.id });
      showToast({ title: "Delete failed", message: err.message || "Please check Firebase rules.", tone: "danger" });
    }
  }

  if (!allowed) {
    return (
      <div className="ledger-screen ads-manager-page">
        <div className="ledger-block">
          <div className="card" style={{ padding: 22 }}>
            <Megaphone size={28} />
            <h1 style={{ margin: "14px 0 6px", fontFamily: "var(--serif)" }}>Ads Manager</h1>
            <p style={{ color: "var(--text-sec)", lineHeight: 1.6 }}>This internal page is only for EazyKhata manager accounts.</p>
            <button type="button" className="btn-secondary" onClick={logout}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-screen ads-manager-page">
      <div className="ledger-block ads-manager-shell">
        <header className="ads-manager-header">
          <div>
            <div className="section-eyebrow">Internal profile</div>
            <h1>Ads Manager</h1>
            <p>Create sponsored dashboard cards for selected org types, plan types, and locations.</p>
          </div>
          <a className="btn-secondary" href="/" aria-label="Back to app">Back to app</a>
        </header>

        <div className="ads-manager-tabs" role="tablist" aria-label="Ads manager sections">
          <button
            type="button"
            className={activeTab === "ads" ? "active" : ""}
            onClick={() => setActiveTab("ads")}
            role="tab"
            aria-selected={activeTab === "ads"}
          >
            Ads
          </button>
          <button
            type="button"
            className={activeTab === "metrics" ? "active" : ""}
            onClick={() => setActiveTab("metrics")}
            role="tab"
            aria-selected={activeTab === "metrics"}
          >
            Metrics
          </button>
        </div>

        {activeTab === "metrics" && (
        <section className="ads-audience-section">
          <div className="ads-manager-list-head">
            <div>
              <h2>Audience Insights</h2>
              <p>Use these counts to decide who should see each campaign.</p>
            </div>
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
          </div>

          {insightsError && (
            <div className="card" style={{ padding: 14, color: "var(--saffron)" }}>
              Backend audience metrics unavailable: {insightsError}
            </div>
          )}

          <div className="ads-insight-grid">
            <InsightCard label="Users" value={insights?.totalUsers} sub="registered" />
            <InsightCard label="Organizations" value={insights?.totalOrganizations} sub="owned orgs" />
            <InsightCard label="Ad views" value={campaignTotals.impressions} sub="last 1000 events" />
            <InsightCard label="Ad clicks" value={campaignTotals.clicks} sub={`${campaignTotals.ctr}% CTR`} />
            <InsightCard label="Apartment viewers" value={insights?.apartmentAudience?.apartmentViewers} sub="residents/shared access" />
            <InsightCard label="Shared users" value={insights?.sharedAccess?.usersWithSharedAccess} sub="accepted members" />
          </div>

          <div className="ads-insight-lists">
            <InsightList title="Users by type" rows={insights?.byOrgType} />
            <InsightList title="Users by plan" rows={insights?.byPlan} />
            <InsightList title="Type combinations" rows={insights?.orgTypeCombinations} />
            <InsightList title="Owned type combinations" rows={insights?.ownedOrgTypeCombinations} />
            <InsightList title="Shared access combinations" rows={insights?.sharedOrgTypeCombinations} />
            <InsightList title="Cities" rows={insights?.byLocation?.cities} />
            <InsightList title="States" rows={insights?.byLocation?.states} />
            <InsightList title="Apartment audience" rows={[
              { label: "Apartment owners", count: insights?.apartmentAudience?.apartmentOwners || 0 },
              { label: "Viewers / residents", count: insights?.apartmentAudience?.apartmentViewers || 0 },
              { label: "Resident portal users", count: insights?.apartmentAudience?.apartmentResidentPortalUsers || 0 },
              { label: "Shared apartment admins", count: insights?.apartmentAudience?.apartmentSharedAdmins || 0 },
              { label: "Active apartment portals", count: insights?.apartmentAudience?.activeApartmentPortals || 0 }
            ]} />
          </div>
        </section>
        )}

        {activeTab === "ads" && (
        <>
        <form className="card ads-manager-form" onSubmit={saveCampaign}>
          <div className="ads-manager-form-title">
            <div>
              <h2>{editingId ? "Edit Campaign" : "New Campaign"}</h2>
              <p>Users see only the image. Name, title, and message are internal labels for tracking.</p>
            </div>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                <X size={15} /> New
              </button>
            )}
          </div>

          <div className="ledger-form-split">
            <label>
              <span className="section-label">Business name</span>
              <input className="input-field" value={form.businessName} onChange={e => updateField("businessName", e.target.value)} placeholder="Internal advertiser name" />
            </label>
            <label>
              <span className="section-label">Category</span>
              <input className="input-field" value={form.category} onChange={e => updateField("category", e.target.value)} placeholder="Home services, finance, local shop" />
            </label>
          </div>

          <label>
            <span className="section-label">Internal title</span>
            <input className="input-field" value={form.title} onChange={e => updateField("title", e.target.value)} placeholder="May apartment pest control campaign" />
          </label>

          <label>
            <span className="section-label">Internal notes</span>
            <textarea className="input-field" rows={3} value={form.body} onChange={e => updateField("body", e.target.value)} placeholder="Optional notes for your team. Users will not see this." />
          </label>

          <div className="ledger-form-split">
            <div>
              <span className="section-label">Image</span>
              <div className="ads-image-tools">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="" className="ads-image-preview" />
                ) : (
                  <div className="ads-image-preview empty"><Megaphone size={20} /></div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <input className="input-field" value={form.imageUrl} onChange={e => updateField("imageUrl", e.target.value)} placeholder="Paste URL or upload below" />
                  <label className="btn-secondary ads-upload-button">
                    {uploadingImage ? "Uploading..." : "Upload from device"}
                    <input type="file" accept="image/*" disabled={uploadingImage} onChange={e => uploadImage(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </div>
            <label>
              <span className="section-label">Priority</span>
              <input className="input-field" type="number" value={form.priority} onChange={e => updateField("priority", e.target.value)} />
            </label>
          </div>

          <div className="ledger-form-split">
            <label>
              <span className="section-label">CTA type</span>
              <select className="input-field" value={form.ctaType} onChange={e => updateField("ctaType", e.target.value)}>
                {CTA_TYPES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span className="section-label">CTA label</span>
              <input className="input-field" value={form.ctaLabel} onChange={e => updateField("ctaLabel", e.target.value)} placeholder="Call now, View offer" />
            </label>
          </div>

          <label>
            <span className="section-label">CTA value</span>
            <input className="input-field" value={form.ctaValue} onChange={e => updateField("ctaValue", e.target.value)} placeholder="Website URL, WhatsApp number, or phone number" />
          </label>

          {form.ctaType === "whatsapp" && (
            <label>
              <span className="section-label">WhatsApp prefilled text</span>
              <input className="input-field" value={form.whatsappText} onChange={e => updateField("whatsappText", e.target.value)} placeholder="Hi, I found you on EazyKhata..." />
            </label>
          )}

          <div className="ledger-form-split">
            <label>
              <span className="section-label">Start date</span>
              <input className="input-field" type="date" value={form.startDate} onChange={e => updateField("startDate", e.target.value)} />
            </label>
            <label>
              <span className="section-label">End date</span>
              <input className="input-field" type="date" value={form.endDate} onChange={e => updateField("endDate", e.target.value)} />
            </label>
          </div>

          <div className="ledger-form-split">
            <label>
              <span className="section-label">Status</span>
              <select className="input-field" value={form.status} onChange={e => updateField("status", e.target.value)}>
                {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <div>
              <span className="section-label">Plan target</span>
              <div className="ads-manager-checks">
                {PLAN_TARGETS.map(option => (
                  <label key={option.value}>
                    <input type="checkbox" checked={(form.targetPlans || []).includes(option.value)} onChange={() => updateField("targetPlans", normalizeMulti(form.targetPlans, option.value))} />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="section-label">Org target</span>
            <div className="ads-manager-checks">
              {ORG_TARGETS.map(option => (
                <label key={option.value}>
                  <input type="checkbox" checked={(form.targetOrgTypes || []).includes(option.value)} onChange={() => updateField("targetOrgTypes", normalizeMulti(form.targetOrgTypes, option.value))} />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="ledger-form-split">
            <label>
              <span className="section-label">Countries</span>
              <input className="input-field" value={form.targetCountriesText} onChange={e => updateField("targetCountriesText", e.target.value)} placeholder="india, usa" />
            </label>
            <label>
              <span className="section-label">States</span>
              <input className="input-field" value={form.targetStatesText} onChange={e => updateField("targetStatesText", e.target.value)} placeholder="telangana, karnataka" />
            </label>
          </div>
          <label>
            <span className="section-label">Cities</span>
            <input className="input-field" value={form.targetCitiesText} onChange={e => updateField("targetCitiesText", e.target.value)} placeholder="hyderabad, bengaluru" />
          </label>

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : editingId ? "Save changes" : "Create campaign"}
          </button>
        </form>

        <section className="ads-manager-list">
          <div className="ads-manager-list-head">
            <div>
              <h2>Campaigns</h2>
              <p>{loading ? "Loading..." : `${campaigns.length} campaign(s)`}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={resetForm}><Plus size={15} /> New campaign</button>
          </div>

          {sortedCampaigns.map(campaign => {
            const stats = statsByCampaign[campaign.id] || { impressions: 0, clicks: 0 };
            const ctr = stats.impressions ? Math.round((stats.clicks / stats.impressions) * 100) : 0;
            return (
              <article key={campaign.id} className="card ads-campaign-row">
                <div className="ads-campaign-preview">
                  {campaign.imageUrl ? <img src={campaign.imageUrl} alt="" /> : <Megaphone size={22} />}
                </div>
                <div className="ads-campaign-main">
                  <div className="ads-campaign-meta">
                    <span style={{ color: statusTone(campaign.status) }}>{campaign.status}</span>
                    <span>{campaign.category || "Sponsored"}</span>
                    <span>Priority {Number(campaign.priority || 0)}</span>
                  </div>
                  <h3>{campaign.title}</h3>
                  <p>{campaign.body}</p>
                  <div className="ads-campaign-targets">
                    <span>{(campaign.targetOrgTypes || ["all"]).join(", ")}</span>
                    <span>{(campaign.targetPlans || ["all"]).join(", ")}</span>
                    {(campaign.targetCities || []).length > 0 && <span>{campaign.targetCities.join(", ")}</span>}
                  </div>
                </div>
                <div className="ads-campaign-stats">
                  <div><BarChart3 size={14} /> {stats.impressions} views</div>
                  <div>{stats.clicks} clicks</div>
                  <div>{ctr}% CTR</div>
                </div>
                <div className="ads-campaign-actions">
                  {campaign.ctaValue && <button type="button" className="btn-secondary" onClick={() => window.open(campaign.ctaValue.startsWith("http") ? campaign.ctaValue : `https://${campaign.ctaValue}`, "_blank", "noopener,noreferrer")}><ExternalLink size={14} /></button>}
                  <button type="button" className="btn-secondary" onClick={() => startEdit(campaign)}>Edit</button>
                  {campaign.status === "active" ? (
                    <button type="button" className="btn-secondary" onClick={() => setStatus(campaign, "paused")}><Pause size={14} /></button>
                  ) : (
                    <button type="button" className="btn-secondary" onClick={() => setStatus(campaign, "active")}><Play size={14} /></button>
                  )}
                  <button type="button" className="btn-secondary danger-soft" onClick={() => removeCampaign(campaign)}><Trash2 size={14} /></button>
                </div>
              </article>
            );
          })}

          {!loading && sortedCampaigns.length === 0 && (
            <div className="card" style={{ padding: 20, color: "var(--text-sec)" }}>
              No campaigns yet. Create one above and set it active when ready.
            </div>
          )}
        </section>
        </>
        )}
      </div>
    </div>
  );
}
