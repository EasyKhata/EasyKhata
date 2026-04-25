import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import { usersApi } from "../lib/api";
import { clearCurrentUser, setCurrentUser } from "../utils/storage";
import { buildLocationLabel, getAgeGroupFromDateOfBirth, parseLocationFields, splitPhoneNumber, DEFAULT_PHONE_COUNTRY_CODE } from "../utils/profile";
import { PLANS, SUBSCRIPTION_STATUS } from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";
import { logError } from "../utils/logger";
import { isNative } from "../utils/native";
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { signInWithCredential } from "firebase/auth";

const AuthContext = createContext();
const DEFAULT_ORG_ID = "org_primary";

function createDefaultOrgProfile({ email = "", phone = "", organizationType = ORG_TYPES.PERSONAL } = {}) {
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // When a Google user signs in for the first time they need to pick org type + phone.
  // We keep the firebaseUser in a ref and expose a pendingSetup flag until they complete it.
  const [pendingSetup, setPendingSetup] = useState(null); // { firebaseUser, name, email }
  const setupInProgressRef = useRef(false);

  async function ensureUserProfile(firebaseUser, profileOverrides = {}) {
    const normalizedOverrides = profileOverrides && typeof profileOverrides === "object" ? profileOverrides : {};
    let existing = {};
    try {
      existing = await usersApi.get(firebaseUser.uid);
    } catch {
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
    const baseCountry = normalizedOverrides.country || existing?.country || legacyLocation.country || "";
    const baseLocation = buildLocationLabel({ city: baseCity, state: baseState, country: baseCountry });
    const baseAddress = buildLocationLabel({ addressLine: baseAddressLine, city: baseCity, state: baseState, country: baseCountry });
    const baseDateOfBirth = normalizedOverrides.dateOfBirth || existing?.dateOfBirth || "";
    const baseAgeGroup = getAgeGroupFromDateOfBirth(baseDateOfBirth) || normalizedOverrides.ageGroup || existing?.ageGroup || "";
    const baseGender = normalizedOverrides.gender || existing?.gender || "";
    const baseOrganizationType = getOrgType(normalizedOverrides.organizationType || existing?.organizationType || existing?.account?.organizationType || ORG_TYPES.PERSONAL);

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
    if (!existing?.country && baseCountry) updates.country = baseCountry;
    if (!existing?.location && baseLocation) updates.location = baseLocation;
    if (!existing?.address && baseAddress) updates.address = baseAddress;
    if (!existing?.updatedAt && existing?.createdAt) updates.updatedAt = existing.createdAt;
    if (!existing?.lastActivityAt && (existing?.updatedAt || existing?.createdAt)) {
      updates.lastActivityAt = existing?.updatedAt || existing?.createdAt;
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
      country: profile?.country || parseLocationFields(profile?.location || "").country || "",
      location: profile?.location || buildLocationLabel({ city: profile?.city, state: profile?.state, country: profile?.country }),
      address: profile?.address || buildLocationLabel({ addressLine: profile?.addressLine, city: profile?.city, state: profile?.state, country: profile?.country }),
      role: profile?.role || "user",
      onboardingSeenAt: profile?.onboardingSeenAt || "",
      lastActivityAt: profile?.lastActivityAt || profile?.updatedAt || profile?.createdAt || "",
      activeOrgId,
      organizationType: getOrgType(activeOrg?.account?.organizationType || profile?.organizationType || profile?.account?.organizationType),
      plan: profile?.plan || PLANS.FREE,
      subscriptionStatus: profile?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE,
      subscriptionEndsAt: profile?.subscriptionEndsAt || "",
      blocked: Boolean(profile?.blocked),
      sharedLedgerId: profile?.sharedLedgerId || "",
      sharedLedgerRole: profile?.sharedLedgerRole || "",
      societyPortalId: profile?.societyPortalId || "",
      societyPortalRole: profile?.societyPortalRole || "",
      societyFlatNumber: profile?.societyFlatNumber || "",
      societyInviteCode: profile?.societyInviteCode || "",
      apartmentPortalRoles: profile?.apartmentPortalRoles || {},
      sharedOrgs: profile?.sharedOrgs || {}
    };
  }


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        clearCurrentUser();
        setPendingSetup(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // If setup is in progress (completing org type selection), don't re-process
      if (setupInProgressRef.current) return;

      try {
        let existing = {};
        try { existing = await usersApi.get(firebaseUser.uid); } catch {}

        if (!existing?.id) {
          // First-time Google user — need org type + phone before creating profile
          setPendingSetup({
            firebaseUser,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || ""
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
        setUser(buildSessionUser(firebaseUser, profile || {}));
        setCurrentUser(firebaseUser.uid);
        setPendingSetup(null);
      } catch (err) {
        logError("Profile load error", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

    return { success: true };

  } catch (err) {
    console.error("Google sign-in error:", err);

    if (err?.code === "canceled") {
      return { error: null };
    }

    return { error: "Sign-in failed. Please try again." };
  }
}
  // Called from the first-time setup modal after org type + phone are collected
  async function completeSetup({ phone, phoneCountryCode }) {
    if (!pendingSetup?.firebaseUser) return { error: "Session expired. Please sign in again." };
    setupInProgressRef.current = true;
    try {
      const profile = await ensureUserProfile(pendingSetup.firebaseUser, {
        name: pendingSetup.name,
        email: pendingSetup.email,
        organizationType: ORG_TYPES.PERSONAL,
        phone,
        phoneCountryCode
      });

      if (profile?.blocked) {
        await signOut(auth);
        clearCurrentUser();
        setPendingSetup(null);
        return { error: "Your account has been blocked. Contact admin." };
      }

      const sessionUser = buildSessionUser(pendingSetup.firebaseUser, profile);
      setUser(sessionUser);
      setCurrentUser(sessionUser.id);
      setPendingSetup(null);
      return { success: true };
    } catch (err) {
      logError("Setup error", err);
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
      if ("addressLine" in nextUpdates || "city" in nextUpdates || "state" in nextUpdates || "country" in nextUpdates) {
        nextUpdates.location = buildLocationLabel({
          city: nextUpdates.city ?? user?.city ?? "",
          state: nextUpdates.state ?? user?.state ?? "",
          country: nextUpdates.country ?? user?.country ?? ""
        });
        nextUpdates.address = buildLocationLabel({
          addressLine: nextUpdates.addressLine ?? user?.addressLine ?? "",
          city: nextUpdates.city ?? user?.city ?? "",
          state: nextUpdates.state ?? user?.state ?? "",
          country: nextUpdates.country ?? user?.country ?? ""
        });
      }
      if ("phone" in nextUpdates || "phoneCountryCode" in nextUpdates) {
        nextUpdates.phoneCountryCode = nextUpdates.phoneCountryCode || user?.phoneCountryCode || DEFAULT_PHONE_COUNTRY_CODE;
      }
      await usersApi.update(auth.currentUser.uid, nextUpdates);
      setUser(prev => (prev ? { ...prev, ...nextUpdates } : prev));
      return { success: true };
    } catch (err) {
      return { error: err.message || "Failed to update profile." };
    }
  }

  async function logout() {
    const userId = auth.currentUser?.uid;
    await signOut(auth);
    clearCurrentUser();
    if (userId) {
      try { localStorage.removeItem(`ledger-session-analytics:${userId}`); } catch {}
    }
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
        setUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
