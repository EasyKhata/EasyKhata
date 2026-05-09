import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, addDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { logError, logEvent } from "../utils/logger";
import { openExternal } from "../utils/openExternal";
import { getUserPlan } from "../utils/subscription";
import { getOrgType } from "../utils/orgTypes";

const ALL_VALUE = "all";

function listIncludes(list, value) {
  if (!Array.isArray(list) || list.length === 0 || list.includes(ALL_VALUE)) return true;
  return list.includes(String(value || "").toLowerCase());
}

function locationIncludes(list, value) {
  if (!Array.isArray(list) || list.length === 0) return true;
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return true;
  return list.map(item => String(item || "").trim().toLowerCase()).includes(normalized);
}

function campaignIsActive(campaign, nowDate) {
  if (campaign.status !== "active") return false;
  if (campaign.startDate && campaign.startDate > nowDate) return false;
  if (campaign.endDate && campaign.endDate < nowDate) return false;
  return true;
}

function buildCtaUrl(ad) {
  const type = ad.ctaType || "website";
  const value = String(ad.ctaValue || "").trim();
  if (!value) return "";
  if (type === "phone") return `tel:${value}`;
  if (type === "whatsapp") {
    const digits = value.replace(/\D/g, "");
    const text = encodeURIComponent(ad.whatsappText || "Hi, I found you on EazyKhata.");
    return digits ? `https://wa.me/${digits}?text=${text}` : "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

async function writeAdEvent(type, ad, user, data, orgType, plan) {
  if (!user?.id || !ad?.id) return;
  const payload = {
    type,
    campaignId: ad.id,
    campaignTitle: ad.title || "",
    userId: user.id,
    userEmail: user.email || "",
    orgId: data.activeOrgId || "",
    orgType,
    plan,
    city: user.city || data.account?.city || "",
    state: user.state || data.account?.state || "",
    country: user.country || data.account?.country || "",
    route: typeof window !== "undefined" ? window.location.pathname : "/",
    ts: serverTimestamp()
  };
  await addDoc(collection(db, "ad_events"), payload);
  logEvent(`ad_${type}`, { campaignId: ad.id, orgType, plan });
}

export default function AdCarousel({ placement = "dashboard_carousel" }) {
  const { user } = useAuth();
  const data = useData();
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const seenRef = useRef(new Set());

  const orgType = getOrgType(data.account?.organizationType || user?.organizationType);
  const plan = getUserPlan(user);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    async function loadAds() {
      if (!user?.id) return;
      try {
        const snap = await getDocs(query(collection(db, "ad_campaigns"), where("status", "==", "active")));
        const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (!cancelled) {
          setAds(rows.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0)));
        }
      } catch (err) {
        logError("ad_carousel_load_failed", err);
      }
    }
    loadAds();
    return () => { cancelled = true; };
  }, [user?.id]);

  const visibleAds = useMemo(() => {
    const city = user?.city || data.account?.city;
    const state = user?.state || data.account?.state;
    const country = user?.country || data.account?.country;
    return ads.filter(ad => {
      if ((ad.placement || "dashboard_carousel") !== placement) return false;
      if (!campaignIsActive(ad, today)) return false;
      if (!listIncludes(ad.targetOrgTypes, orgType)) return false;
      if (!listIncludes(ad.targetPlans, plan)) return false;
      if (!locationIncludes(ad.targetCities, city)) return false;
      if (!locationIncludes(ad.targetStates, state)) return false;
      if (!locationIncludes(ad.targetCountries, country)) return false;
      return true;
    });
  }, [ads, data.account?.city, data.account?.country, data.account?.state, orgType, placement, plan, today, user?.city, user?.country, user?.state]);

  useEffect(() => {
    if (index >= visibleAds.length) setIndex(0);
  }, [index, visibleAds.length]);

  const current = visibleAds[index];

  useEffect(() => {
    if (!current?.id || seenRef.current.has(current.id)) return;
    seenRef.current.add(current.id);
    writeAdEvent("impression", current, user, data, orgType, plan).catch(err => {
      logError("ad_impression_failed", err, { campaignId: current.id });
    });
  }, [current, data, orgType, plan, user]);

  if (!current) return null;

  const ctaUrl = buildCtaUrl(current);

  async function handleClick() {
    try {
      await writeAdEvent("click", current, user, data, orgType, plan);
    } catch (err) {
      logError("ad_click_failed", err, { campaignId: current.id });
    }
    if (ctaUrl) openExternal(ctaUrl);
  }

  if (!current.imageUrl) return null;

  const content = (
    <img
      src={current.imageUrl}
      alt={current.altText || "Sponsored"}
      className="ad-carousel-banner-image"
      loading="lazy"
    />
  );

  return (
    <div className="ad-carousel-banner anim-fade-up-2">
      {ctaUrl ? (
        <button type="button" className="ad-carousel-banner-link" onClick={handleClick} aria-label="Open sponsored offer">
          {content}
        </button>
      ) : content}
      {visibleAds.length > 1 && (
        <div className="ad-carousel-dots ad-carousel-banner-dots" aria-label="Sponsored items">
          {visibleAds.map((ad, dotIndex) => (
            <button
              key={ad.id}
              type="button"
              className={dotIndex === index ? "active" : ""}
              onClick={() => setIndex(dotIndex)}
              aria-label={`Show sponsored item ${dotIndex + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
