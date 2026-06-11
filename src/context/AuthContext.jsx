import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import { usersApi, orgsApi, warmupBackend } from "../lib/api";
import { clearAllUserData, clearCurrentUser, getUserData, setCurrentUser, setUserData } from "../utils/storage";
import { buildLocationLabel, getAgeGroupFromDateOfBirth, parseLocationFields, splitPhoneNumber, DEFAULT_PHONE_COUNTRY_CODE } from "../utils/profile";
import { PLANS, SUBSCRIPTION_STATUS } from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";
import { logError, logEvent, setCrashUser } from "../utils/logger";
import { isNative } from "../utils/native";
import { deleteCurrentPushToken, getCurrentPushToken, initPush, requestPushPermission } from "../utils/push";
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential } from "firebase/auth";

const AuthContext = createContext();
const DEFAULT_ORG_ID = "org_primary";

function createDefaultOrgProfile({ email = "", phone = "", organizationType = ORG_TYPES.SMALL_BUSINESS } = {}) {
  const cleanOrganizationType = getOrgType(organizationType);
  return {
    id: DEFAULT_ORG_ID,
    income: [],
    expenses: [],
    invoices: [],
    customers: [],
    orgRecords: {},
    goals: { monthlySavings: 0, targetAmount: 0, targetDate: "", savedAmount: 0, note: "" },
    budgets: {},
    notificationPrefs: {
      browserEnabled: false,
      invoiceDue: true,
      overdueInvoices: true,
      budgetAlerts: true,
      lowBalance: true,
      spendingSpike: true
    },
    currency: { code: "INR", symbol: "Rs", name: "Indian Rupee", flag: "IN" },
    account: {
      name: "",
      email,
      phone,
      addressLine: "",
      city: "",
      state: "",
      district: "",
      pincode: "",
      country: "",
      location: "",
      address: "",
      gstin: "",
      showHSN: false,
      organizationType: cleanOrganizationType
    }
  };
}

function getActiveOrgProfile(profile = {}) {
  const orgs = profile?.orgs || {};
  const activeOrgId = profile?.activeOrgId || Object.keys(orgs)[0] || DEFAULT_ORG_ID;
  return {
    activeOrgId,
    activeOrg:
      orgs[activeOrgId] ||
      createDefaultOrgProfile({
        email: profile?.email || "",
        phone: profile?.phone || "",
        organizationType: profile?.organizationType || profile?.account?.organizationType
      })
  };
}

function toTime(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function isLikelyReturningFirebaseUser(firebaseUser) {
  const createdAt = toTime(firebaseUser?.metadata?.creationTime);
  const lastSignInAt = toTime(firebaseUser?.metadata?.lastSignInTime);
  if (!createdAt || !lastSignInAt) return false;
  return lastSignInAt - createdAt > 60 * 1000;
}

function isNetworkProfileError(err) {
  const message = String(err?.message || "");
  return err?.status === 0 || err?.code === "NETWORK_ERROR" || /failed to fetch|network|load failed/i.test(message);
}

function buildOfflineProfile(firebaseUser) {
  const cachedData = getUserData(firebaseUser.uid, "appData") || {};
  const cachedAccount = cachedData.account || {};
  const cachedProfile = getUserData(firebaseUser.uid, "profile") || {};
  // Distinguish "no internet" from "server unreachable" so the UI can show the
  // right message. navigator.onLine is not perfect but is the best signal we
  // have at the moment the failure occurs.
  const offlineReason = (typeof navigator !== "undefined" && !navigator.onLine)
    ? "no_internet"
    : "server_unreachable";
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || cachedProfile.name || cachedAccount.name || "",
    email: firebaseUser.email || cachedProfile.email || cachedAccount.email || "",
    phone: firebaseUser.phoneNumber || cachedProfile.phone || cachedAccount.phone || "",
    phoneCountryCode: cachedProfile.phoneCountryCode || cachedAccount.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
    activeOrgId: cachedData.activeOrgId || DEFAULT_ORG_ID,
    organizationType: getOrgType(cachedProfile.organizationType || cachedAccount.organizationType || ORG_TYPES.SMALL_BUSINESS),
    onboardingSeenAt: cachedProfile.onboardingSeenAt || "__offline_profile__",
    legalAccepted: true,
    orgs: cachedData.orgs || {},
    offlineProfile: true,
    offlineReason
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // When a Google user signs in for the first time they need to pick org type + phone.
  // We keep the firebaseUser in a ref and expose a pendingSetup flag until they complete it.
  const [pendingSetup, setPendingSetup] = useState(null); // { firebaseUser, name, email }
  const setupInProgressRef = useRef(false);
  const firebaseUserRef = useRef(null);

  // Decides whether the loaded profile is complete enough to enter the app or if
  // we need to bounce the user to the setup wizard. Returns true if the wizard
  // should be shown (and sets pendingSetup as a side effect); false if the user
  // is fine to land on the dashboard.
  function gateOnKhataProfile(firebaseUser, profile) {
    if (!profile) return false;
    const orgs = Array.isArray(profile.organizations) ? profile.organizations : [];

    // Resident-only users have shared org memberships but no owned org — don't force the admin wizard.
    const sharedOrgs = profile.sharedOrgs || {};
    if (Object.keys(sharedOrgs).length > 0) return false;
    try { if (localStorage.getItem("ek_portal_pref") === "resident") return false; } catch {}

    if (orgs.length === 0) {
      // No org at all — extremely unusual but recoverable via the wizard.
      setPendingSetup({
        firebaseUser,
        name: profile.name || firebaseUser.displayName || "",
        email: profile.email || firebaseUser.email || "",
        existingPhone: profile.phone || "",
        existingPhoneCountryCode: profile.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
        existingOrgType: profile.organizationType || ORG_TYPES.SMALL_BUSINESS,
        skipPhoneStep: Boolean(profile.phone)
      });
      setUser(null);
      logEvent("setup_shown", { reason: "no_org" });
      return true;
    }
    const activeOrgId = profile.activeOrgId || orgs[0].id;
    const activeOrg = orgs.find(o => o.id === activeOrgId) || orgs[0];
    const orgName = String(activeOrg?.name || "").trim();
    if (!orgName) {
      setPendingSetup({
        firebaseUser,
        name: profile.name || firebaseUser.displayName || "",
        email: profile.email || firebaseUser.email || "",
        existingPhone: profile.phone || "",
        existingPhoneCountryCode: profile.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE,
        existingOrgType: activeOrg?.organizationType || profile.organizationType || ORG_TYPES.SMALL_BUSINESS,
        existingOrgId: activeOrg?.id || "org_primary",
        // Skip the phone step if we already have a number — most returning users will.
        skipPhoneStep: Boolean(profile.phone)
      });
      setUser(null);
      logEvent("setup_shown", { reason: "khata_profile_incomplete" });
      return true;
    }
    return false;
  }

  async function ensureUserProfile(firebaseUser, profileOverrides = {}) {
    const normalizedOverrides = profileOverrides && typeof profileOverrides === "object" ? profileOverrides : {};
    let existing = {};
    try {
      existing = await usersApi.get(firebaseUser.uid);
    } catch (err) {
      if (err?.status !== 404) throw err;
      // new user
    }
    const baseName = normalizedOverrides.name || existing?.name || firebaseUser.displayName || "";
    const baseEmail = normalizedOverrides.email || existing?.email || firebaseUser.email || "";
    const basePhone = normalizedOverrides.phone || existing?.phone || "";
    const phoneParts = splitPhoneNumber(basePhone, normalizedOverrides.phoneCountryCode || existing?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE);
    const legacyLocation = parseLocationFields(normalizedOverrides.location || normalizedOverrides.address || existing?.location || existing?.address || "");
    const baseAddressLine = normalizedOverrides.addressLine || existing?.addressLine || legacyLocation.addressLine || "";
    const baseCity = normalizedOverrides.city || existing?.city || legacyLocation.city || "";
    const baseState = normalizedOverrides.state || existing?.state || legacyLocation.state || "";
    const baseDistrict = normalizedOverrides.district || existing?.district || legacyLocation.district || "";
    const basePincode = normalizedOverrides.pincode || existing?.pincode || legacyLocation.pincode || "";
    const baseCountry = normalizedOverrides.country || existing?.country || legacyLocation.country || "";
    const baseLocation = buildLocationLabel({ city: baseCity, district: baseDistrict, state: baseState, pincode: basePincode, country: baseCountry });
    const baseAddress = buildLocationLabel({ addressLine: baseAddressLine, city: baseCity, district: baseDistrict, state: baseState, pincode: basePincode, country: baseCountry });
    const baseDateOfBirth = normalizedOverrides.dateOfBirth || existing?.dateOfBirth || "";
    const baseAgeGroup = getAgeGroupFromDateOfBirth(baseDateOfBirth) || normalizedOverrides.ageGroup || existing?.ageGroup || "";
    const baseGender = normalizedOverrides.gender || existing?.gender || "";
    const baseOrganizationType = getOrgType(normalizedOverrides.organizationType || existing?.organizationType || existing?.account?.organizationType || ORG_TYPES.SMALL_BUSINESS);

    if (!existing?.id) {
      const created = await usersApi.create({
        name: baseName,
        phone: basePhone,
        phoneCountryCode: phoneParts.phoneCountryCode,
        gender: baseGender,
        dateOfBirth: baseDateOfBirth,
        ageGroup: baseAgeGroup,
        addressLine: baseAddressLine,
        city: baseCity,
        state: baseState,
        district: baseDistrict,
        pincode: basePincode,
        country: baseCountry,
        location: baseLocation,
        address: baseAddress,
        organizationType: baseOrganizationType,
        legalAccepted: true,
        termsVersion: "1.0",
        termsAcceptedAt: new Date().toISOString()
      });
      return created;
    }

    const updates = {};
    if (!existing?.name && baseName) updates.name = baseName;
    if (!existing?.email && baseEmail) updates.email = baseEmail;
    if (!existing?.phone && basePhone) updates.phone = basePhone;
    if (!existing?.phoneCountryCode && phoneParts.phoneCountryCode) updates.phoneCountryCode = phoneParts.phoneCountryCode;
    if (!existing?.organizationType) updates.organizationType = baseOrganizationType;
    if (!existing?.gender && baseGender) updates.gender = baseGender;
    if (!existing?.dateOfBirth && baseDateOfBirth) updates.dateOfBirth = baseDateOfBirth;
    if (!existing?.ageGroup && baseAgeGroup) updates.ageGroup = baseAgeGroup;
    if (!existing?.addressLine && baseAddressLine) updates.addressLine = baseAddressLine;
    if (!existing?.city && baseCity) updates.city = baseCity;
    if (!existing?.state && baseState) updates.state = baseState;
    if (!existing?.district && baseDistrict) updates.district = baseDistrict;
    if (!existing?.pincode && basePincode) updates.pincode = basePincode;
    if (!existing?.country && baseCountry) updates.country = baseCountry;
    if (!existing?.location && baseLocation) updates.location = baseLocation;
    if (!existing?.address && baseAddress) updates.address = baseAddress;
    if (!existing?.updatedAt && existing?.createdAt) updates.updatedAt = existing.createdAt;
    if (!existing?.lastActivityAt && (existing?.updatedAt || existing?.createdAt)) {
      updates.lastActivityAt = existing?.updatedAt || existing?.createdAt;
    }
    // Mark setup complete — either Cloud Function pre-created the row (legalAccepted=false)
    // or this is an older account that never had it set.
    if (!existing?.legalAccepted) {
      updates.legalAccepted = true;
      updates.termsVersion = "1.0";
      updates.termsAcceptedAt = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      return await usersApi.update(firebaseUser.uid, updates);
    }
    return existing;
  }

  function buildSessionUser(firebaseUser, profile = {}) {
    const { activeOrgId, activeOrg } = getActiveOrgProfile(profile);
    return {
      id: firebaseUser.uid,
      name: profile?.name || firebaseUser.displayName || "",
      email: profile?.email || firebaseUser.email || "",
      phone: profile?.phone || "",
      phoneCountryCode: profile?.phoneCountryCode || splitPhoneNumber(profile?.phone || "").phoneCountryCode,
      gender: profile?.gender || "",
      dateOfBirth: profile?.dateOfBirth || "",
      ageGroup: profile?.ageGroup || getAgeGroupFromDateOfBirth(profile?.dateOfBirth) || "",
      addressLine: profile?.addressLine || parseLocationFields(profile?.location || profile?.address || "").addressLine || "",
      city: profile?.city || parseLocationFields(profile?.location || "").city || "",
      state: profile?.state || parseLocationFields(profile?.location || "").state || "",
      district: profile?.district || parseLocationFields(profile?.location || "").district || "",
      pincode: profile?.pincode || parseLocationFields(profile?.location || "").pincode || "",
      country: profile?.country || parseLocationFields(profile?.location || "").country || "",
      location: profile?.location || buildLocationLabel({ city: profile?.city, district: profile?.district, state: profile?.state, pincode: profile?.pincode, country: profile?.country }),
      address: profile?.address || buildLocationLabel({ addressLine: profile?.addressLine, city: profile?.city, district: profile?.district, state: profile?.state, pincode: profile?.pincode, country: profile?.country }),
      role: profile?.role || "user",
      onboardingSeenAt: profile?.onboardingSeenAt || "",
      offlineProfile: Boolean(profile?.offlineProfile),
      offlineReason: profile?.offlineReason || null,
      lastActivityAt: profile?.lastActivityAt || profile?.updatedAt || profile?.createdAt || "",
      activeOrgId,
      organizationType: getOrgType(activeOrg?.account?.organizationType || profile?.organizationType || profile?.account?.organizationType),
      plan: profile?.plan || PLANS.FREE,
      subscriptionStatus: profile?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE,
      subscriptionEndsAt: profile?.subscriptionEndsAt || "",
      blocked: Boolean(profile?.blocked),
      sharedOrgs: profile?.sharedOrgs || {},
      // Push-notification opt-out for promotional broadcasts. Default true
      // so a missing field doesn't accidentally silence a user.
      marketingPushEnabled: profile?.marketingPushEnabled !== false
    };
  }


  async function refreshUserProfile() {
    const firebaseUser = firebaseUserRef.current;
    if (!firebaseUser || setupInProgressRef.current) return;
    try {
      const fresh = await usersApi.get(firebaseUser.uid);
      if (fresh?.id) {
        setUserData(firebaseUser.uid, "profile", fresh);
        setUser(prev => prev ? buildSessionUser(firebaseUser, fresh) : prev);
      }
    } catch {
      // silently ignore — network blip or not logged in
    }
  }

  useEffect(() => {
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
    const interval = setInterval(refreshUserProfile, REFRESH_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") refreshUserProfile();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Warm up the backend at app start — Firebase will fire onAuthStateChanged
    // shortly after for returning sessions, and we want the server awake before
    // the first authenticated request lands.
    warmupBackend();

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        firebaseUserRef.current = null;
        clearCurrentUser();
        setCrashUser(null);
        setPendingSetup(null);
        setUser(null);
        setLoading(false);
        return;
      }

      firebaseUserRef.current = firebaseUser;
      // Tag native crash reports with the user id so we can correlate a crash to
      // the account that hit it without ever logging PII like email.
      setCrashUser(firebaseUser.uid);

      // If setup is in progress (completing org type selection), don't re-process
      if (setupInProgressRef.current) return;

      // Wait for the warmup ping to finish before making authenticated API calls.
      // warmupBackend() returns a singleton promise that resolves on both success
      // and failure — on a warm server this is ~100 ms; on a cold Railway container
      // it gives the server time to boot so the profile fetch below succeeds on the
      // first try instead of exhausting all retries while the container is still
      // starting up.
      await warmupBackend();

      try {
        let existing = null;
        let getUserError = null;
        try { existing = await usersApi.get(firebaseUser.uid); } catch (err) { getUserError = err; }

        if (!existing?.id) {
          if (getUserError && getUserError.status !== 404) {
            // Network error or unexpected server error — do not treat as new user
            logError("Failed to load user profile", getUserError, {
              phase: "auth_state_profile_get",
              status: getUserError?.status ?? null,
              code: getUserError?.code ?? null,
              native: isNative
            });
            if (isNetworkProfileError(getUserError)) {
              const fallbackProfile = buildOfflineProfile(firebaseUser);
              setUser(buildSessionUser(firebaseUser, fallbackProfile));
              setCurrentUser(firebaseUser.uid);
              setPendingSetup(null);
              logEvent("profile_load_offline_fallback", { reason: "network_error" });
            } else {
              setUser(null);
            }
            setLoading(false);
            return;
          }
          // Genuine 404 — Cloud Function hasn't provisioned the row yet
          logEvent("setup_shown", { reason: "profile_not_found" });
          setPendingSetup({
            firebaseUser,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || ""
          });
          setUser(null);
          setLoading(false);
          return;
        }

        if (!existing?.legalAccepted) {
          if (isLikelyReturningFirebaseUser(firebaseUser)) {
            const profile = await ensureUserProfile(firebaseUser, {
              name: existing.name || firebaseUser.displayName || "",
              email: existing.email || firebaseUser.email || "",
              organizationType: existing.organizationType || existing?.account?.organizationType || ORG_TYPES.SMALL_BUSINESS,
              phone: existing.phone || firebaseUser.phoneNumber || "",
              phoneCountryCode: existing.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE
            });
            setUserData(firebaseUser.uid, "profile", profile || {});
            // Returning users still need their khata profile filled in if the org
            // row has no name — fall through to the shared completeness check
            // below instead of unconditionally letting them onto the dashboard.
            if (!gateOnKhataProfile(firebaseUser, profile)) {
              setUser(buildSessionUser(firebaseUser, profile || {}));
              setCurrentUser(firebaseUser.uid);
              setPendingSetup(null);
              logEvent("returning_user_migrated", { reason: "legal_not_accepted" });
            }
            setLoading(false);
            return;
          }
          // Cloud Function pre-created the row for a genuinely new account.
          logEvent("setup_shown", { reason: "legal_not_accepted" });
          setPendingSetup({
            firebaseUser,
            name: existing.name || firebaseUser.displayName || "",
            email: existing.email || firebaseUser.email || ""
          });
          setUser(null);
          setLoading(false);
          return;
        }

        if (existing?.blocked) {
          await signOut(auth);
          clearCurrentUser();
          setUser(null);
          setLoading(false);
          return;
        }

        const profile = await ensureUserProfile(firebaseUser);
        setUserData(firebaseUser.uid, "profile", profile || {});

        // If the user has no khata profile filled in (org name empty), force them
        // through the setup wizard before they can reach the dashboard. Catches:
        //   • Brand-new users mid-onboarding who refreshed before completing it.
        //   • Pre-launch testers whose accounts were created with the older flow.
        // gateOnKhataProfile returns true and sets pendingSetup itself if a gate
        // was needed; we just skip the dashboard handoff in that case.
        if (gateOnKhataProfile(firebaseUser, profile)) {
          setLoading(false);
          return;
        }

        setUser(buildSessionUser(firebaseUser, profile || {}));
        setCurrentUser(firebaseUser.uid);
        setPendingSetup(null);
        logEvent("session_restored", {
          email: firebaseUser.email || profile?.email || null,
          returning: isLikelyReturningFirebaseUser(firebaseUser)
        });
      } catch (err) {
        logError("Profile load error", err, {
          phase: "auth_state_restore",
          status: err?.status ?? null,
          code: err?.code ?? null,
          native: isNative
        });
        if (isNetworkProfileError(err)) {
          const fallbackProfile = buildOfflineProfile(firebaseUser);
          setUser(buildSessionUser(firebaseUser, fallbackProfile));
          setCurrentUser(firebaseUser.uid);
          setPendingSetup(null);
          logEvent("profile_load_offline_fallback", { reason: "restore_error" });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Push-notification lifecycle ───────────────────────────────────────────
  //
  // Fires whenever the signed-in user's id changes. Walks through:
  //   1. Install foreground listeners + create Android channel (idempotent).
  //   2. Ask the OS for POST_NOTIFICATIONS if we haven't already. On Android
  //      13+ this shows the system prompt; on older Android it auto-grants.
  //   3. Fetch the current FCM token and register it with the backend so
  //      server-side senders can target this device.
  //
  // Errors at any step are logged but never thrown — push is a "nice to have"
  // and must never block sign-in. Token rotation events from FCM are caught
  // by the `app:push-token` window listener below.
  useEffect(() => {
    // Always log so we can diagnose push issues remotely. isNative must be
    // true for any push code to run — if it's false the APK is likely a web
    // build or the Capacitor native layer hasn't initialised.
    logEvent("push_effect_fired", { isNative, hasUser: !!user?.id });
    if (!user?.id || !isNative) return undefined;

    let cancelled = false;
    let registered = false;

    async function attemptPushRegistration() {
      if (cancelled || registered) return;
      try {
        await initPush();
        const status = await requestPushPermission();
        if (cancelled) return;
        if (status !== "granted") {
          // logError so this appears in Firestore app_logs even without an event endpoint
          logError("push_permission_not_granted", null, { status, userId: user.id });
          return;
        }
        const token = await getCurrentPushToken();
        if (cancelled) return;
        if (!token) {
          logError("push_token_empty", null, { userId: user.id });
          return;
        }
        try {
          await usersApi.registerDevice(user.id, {
            token,
            platform: "android",
            appVersion: import.meta.env.VITE_APP_VERSION || ""
          });
          registered = true;
          logEvent("push_token_registered");
        } catch (err) {
          logError("push_token_register_failed", err, { userId: user.id });
        }
      } catch (err) {
        logError("push_init_failed", err, { userId: user.id });
      }
    }

    attemptPushRegistration();

    // Re-attempt on foreground — covers the case where the user went to Android
    // Settings to grant POST_NOTIFICATIONS manually and then returned to the app.
    // The registered flag prevents redundant server calls once a token is saved.
    const onVisibility = () => {
      if (document.visibilityState === "visible") attemptPushRegistration();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Token rotation: FCM may rotate the token at any time. push.js dispatches
    // an event with the new value; re-register so server-side sends keep
    // landing on this device.
    const onRotate = (event) => {
      const newToken = event?.detail?.token;
      if (!newToken || !user?.id) return;
      usersApi.registerDevice(user.id, {
        token: newToken,
        platform: "android",
        appVersion: import.meta.env.VITE_APP_VERSION || ""
      }).catch(err => logError("push_token_rotate_register_failed", err));
    };
    window.addEventListener("app:push-token", onRotate);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("app:push-token", onRotate);
    };
  }, [user?.id]);

/*  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // Use signInWithPopup on both native and web.
      // On native, browserPopupRedirectResolver opens a Chrome Custom Tab
      // without the sessionStorage round-trip that breaks signInWithRedirect.
      const resolver = isNative ? browserPopupRedirectResolver : undefined;
      await signInWithPopup(auth, provider, resolver);
      return { success: true };
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return { error: null };
      }
      if (err.code === "auth/network-request-failed") {
        return { error: "No internet connection. Please check your network and try again." };
      }
      logError("Google sign-in error", err);
      return { error: "Sign-in failed. Please try again." };
    }
  }
*/

async function signInWithGoogle() {
  logEvent("login_started", { provider: "google" });
  // Fire-and-forget: wake the backend while the Google account-picker is open.
  // Backend cold-start (~5–10 s on Railway) overlaps with the user's auth flow,
  // so by the time we issue the first authenticated request the server is warm.
  warmupBackend();
  try {
    const result = await FirebaseAuthentication.signInWithGoogle({
  mode: 'explicit'
});

    if (!result?.credential?.idToken) {
      return { error: "No ID token received" };
    }

    const credential = GoogleAuthProvider.credential(
      result.credential.idToken
    );

    await signInWithCredential(auth, credential);

    logEvent("login_success", { provider: "google" });
    return { success: true };

  } catch (err) {
    logError("Google sign-in error", err);

    if (err?.code === "canceled" || /no credentials available/i.test(String(err?.message || ""))) {
      return { error: null };
    }

    logEvent("login_failed", { provider: "google", code: err?.code || "unknown" });
    return { error: "Sign-in failed. Please try again." };
  }
}
  // Called from the first-time setup wizard after phone + DOB + khata type + khata
  // profile are all collected. Provisions the user, then immediately writes the org
  // profile (name, address, etc.) so the user lands on a fully-set-up dashboard
  // rather than an empty workspace they have to configure later.
  //
  // orgProfile is optional only because pre-existing testers may already have an
  // org row and just need their phone collected. For brand-new accounts the wizard
  // should always pass it.
  async function completeSetup({ phone, phoneCountryCode, dateOfBirth, ageGroup, organizationType, orgProfile, residentPath = false }) {
    if (!pendingSetup?.firebaseUser) return { error: "Session expired. Please sign in again." };
    setupInProgressRef.current = true;
    try {
      // Resident path — create a minimal profile with no org so the user can
      // accept invitations and enter the app as a viewer.
      if (residentPath) {
        const profile = await ensureUserProfile(pendingSetup.firebaseUser, {
          name: pendingSetup.name || pendingSetup.firebaseUser.displayName || "",
          email: pendingSetup.email || pendingSetup.firebaseUser.email || "",
          organizationType: ORG_TYPES.SMALL_BUSINESS
        });
        if (profile?.blocked) {
          await signOut(auth);
          clearCurrentUser();
          setPendingSetup(null);
          return { error: "Your account has been blocked. Contact admin." };
        }
        try { localStorage.setItem("ek_portal_pref", "resident"); } catch {}
        const sessionUser = buildSessionUser(pendingSetup.firebaseUser, profile || {});
        setUser(sessionUser);
        setCurrentUser(sessionUser.id);
        setPendingSetup(null);
        logEvent("resident_setup_completed");
        return { success: true };
      }

      const orgType = getOrgType(organizationType || ORG_TYPES.SMALL_BUSINESS);
      const profile = await ensureUserProfile(pendingSetup.firebaseUser, {
        name: pendingSetup.name,
        email: pendingSetup.email,
        organizationType: orgType,
        phone,
        phoneCountryCode,
        dateOfBirth: dateOfBirth || "",
        ageGroup: ageGroup || ""
      });
      setUserData(pendingSetup.firebaseUser.uid, "profile", profile || {});

      if (profile?.blocked) {
        await signOut(auth);
        clearCurrentUser();
        setPendingSetup(null);
        return { error: "Your account has been blocked. Contact admin." };
      }

      // Resolve which org to populate. New users should create exactly one
      // owner khata during this setup flow; returning users may already have it.
      let orgs = Array.isArray(profile?.organizations) ? profile.organizations : [];
      let activeOrgId = profile?.activeOrgId || orgs[0]?.id || "org_primary";

      // Push the khata profile to the org. We only do this when the wizard supplied
      // a profile — phone-only flows (legacy or recovery) skip it.
      if (orgProfile && (orgProfile.name || "").trim()) {
        try {
          const orgUpdate = {
            organizationType: orgType,
            name: String(orgProfile.name || "").trim(),
            addressLine: String(orgProfile.addressLine || "").trim(),
            city: String(orgProfile.city || "").trim(),
            district: String(orgProfile.district || "").trim(),
            state: String(orgProfile.state || "").trim(),
            pincode: String(orgProfile.pincode || "").trim(),
            country: String(orgProfile.country || "India").trim(),
            // Optional contact fields (used for invoices on non-personal orgs)
            email: String(orgProfile.email || "").trim(),
            phone: String(orgProfile.phone || "").trim(),
            gstin: String(orgProfile.gstin || "").trim()
          };
          if (orgs.length === 0) {
            const createdOrg = await orgsApi.create(pendingSetup.firebaseUser.uid, activeOrgId, orgUpdate);
            const createdProfileOrg = { id: activeOrgId, ...orgUpdate, ...(createdOrg || {}) };
            profile.organizations = [createdProfileOrg];
            profile.activeOrgId = activeOrgId;
            profile.plan = createdOrg?.plan || profile.plan || PLANS.PRO;
            profile.subscriptionStatus = createdOrg?.subscriptionStatus || profile.subscriptionStatus || SUBSCRIPTION_STATUS.TRIAL;
            profile.subscriptionEndsAt = createdOrg?.subscriptionEndsAt || profile.subscriptionEndsAt || "";
            profile.trialEligible = createdOrg?.trialEligible ?? profile.trialEligible;
            orgs = profile.organizations;
          } else {
            await orgsApi.update(pendingSetup.firebaseUser.uid, activeOrgId, orgUpdate);
          }
          // Reflect the updated org in the locally cached profile so the dashboard
          // doesn't render with stale empty fields before the next refetch.
          if (Array.isArray(profile.organizations)) {
            profile.organizations = profile.organizations.map(org =>
              org.id === activeOrgId ? { ...org, ...orgUpdate } : org
            );
          }
        } catch (err) {
          // Don't hard-fail — the user account exists, they can edit the profile in
          // Settings. Log so we can track if this happens often on flaky networks.
          logError("Setup org profile update failed", err);
        }
      }

      // Mark onboarding as seen. The Dashboard renders a separate OnboardingGuide
      // component that prompts the user to pick a khata type and name whenever
      // user.onboardingSeenAt is empty. Without this write the user would land
      // on the dashboard and immediately face the same questions they just
      // answered in the wizard. The Dashboard guide is preserved as a fallback
      // for any path that bypasses the wizard.
      try {
        const onboardingTimestamp = new Date().toISOString();
        await usersApi.update(pendingSetup.firebaseUser.uid, { onboardingSeenAt: onboardingTimestamp });
        if (profile) profile.onboardingSeenAt = onboardingTimestamp;
      } catch (err) {
        logError("Setup onboardingSeenAt update failed", err);
      }

      // User created an owned org — they're no longer resident-only.
      try { localStorage.removeItem("ek_portal_pref"); } catch {}
      const sessionUser = buildSessionUser(pendingSetup.firebaseUser, profile);
      setUser(sessionUser);
      setCurrentUser(sessionUser.id);
      setPendingSetup(null);
      logEvent("setup_completed", { orgType });
      return { success: true };
    } catch (err) {
      logError("Setup error", err);
      logEvent("setup_failed", { message: err?.message || "unknown" });
      return { error: err.message || "Could not complete setup. Please try again." };
    } finally {
      setupInProgressRef.current = false;
    }
  }

  async function updateProfile(updates) {
    if (!auth.currentUser) return { error: "No user logged in." };
    try {
      const timestamp = new Date().toISOString();
      const nextUpdates = { ...updates, updatedAt: timestamp, lastActivityAt: timestamp };
      delete nextUpdates.email;
      if ("dateOfBirth" in nextUpdates) {
        nextUpdates.ageGroup = getAgeGroupFromDateOfBirth(nextUpdates.dateOfBirth);
      }
      if ("addressLine" in nextUpdates || "city" in nextUpdates || "state" in nextUpdates || "district" in nextUpdates || "pincode" in nextUpdates || "country" in nextUpdates) {
        nextUpdates.location = buildLocationLabel({
          city: nextUpdates.city ?? user?.city ?? "",
          district: nextUpdates.district ?? user?.district ?? "",
          state: nextUpdates.state ?? user?.state ?? "",
          pincode: nextUpdates.pincode ?? user?.pincode ?? "",
          country: nextUpdates.country ?? user?.country ?? ""
        });
        nextUpdates.address = buildLocationLabel({
          addressLine: nextUpdates.addressLine ?? user?.addressLine ?? "",
          city: nextUpdates.city ?? user?.city ?? "",
          district: nextUpdates.district ?? user?.district ?? "",
          state: nextUpdates.state ?? user?.state ?? "",
          pincode: nextUpdates.pincode ?? user?.pincode ?? "",
          country: nextUpdates.country ?? user?.country ?? ""
        });
      }
      if ("phone" in nextUpdates || "phoneCountryCode" in nextUpdates) {
        nextUpdates.phoneCountryCode = nextUpdates.phoneCountryCode || user?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
      }
      await usersApi.update(auth.currentUser.uid, nextUpdates);
      setUser(prev => {
        const next = prev ? { ...prev, ...nextUpdates, offlineProfile: false } : prev;
        if (next) setUserData(auth.currentUser.uid, "profile", next);
        return next;
      });
      return { success: true };
    } catch (err) {
      return { error: err.message || "Failed to update profile." };
    }
  }

  async function logout() {
    const userId = auth.currentUser?.uid;
    logEvent("logout");
    // Drop the FCM token both on the server and at FCM itself before signing
    // out, so the next account on this device doesn't inherit notifications
    // meant for the previous user. Best-effort — never blocks logout.
    if (userId && isNative) {
      try {
        const token = await getCurrentPushToken();
        if (token) {
          await usersApi.unregisterDevice(userId, token).catch(() => {});
        }
        await deleteCurrentPushToken();
      } catch { /* ignore */ }
    }
    await signOut(auth);
    clearCurrentUser();
    if (userId) {
      // Purge all cached financial data for this user. Replaces the old
      // sessionStorage auto-clear (which was unreliable on Android WebView).
      clearAllUserData(userId);
      try { localStorage.removeItem(`ledger-session-analytics:${userId}`); } catch {}
    }
    setUser(null);
    setPendingSetup(null);
  }

  async function deleteAccount() {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Not signed in.");
    // Delete server data (Postgres cascade + Firestore user doc)
    await usersApi.delete(userId);
    // Delete Firebase Auth account
    if (auth.currentUser) await firebaseDeleteUser(auth.currentUser);
    clearCurrentUser();
    clearAllUserData(userId);
    try { localStorage.removeItem(`ledger-session-analytics:${userId}`); } catch {}
    setUser(null);
    setPendingSetup(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pendingSetup,
        signInWithGoogle,
        completeSetup,
        logout,
        deleteAccount,
        setUser,
        updateProfile,
        refreshUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
