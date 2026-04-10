import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { clearCurrentUser, setCurrentUser } from "../utils/storage";
import { buildLocationLabel, getAgeGroupFromDateOfBirth, normalizeSupportedCountry, parseLocationFields, splitPhoneNumber, DEFAULT_PHONE_COUNTRY_CODE } from "../utils/profile";
import { PLANS, SUBSCRIPTION_STATUS, getTrialEndDate } from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

const AuthContext = createContext();
const PENDING_PROFILE_KEY = "pending-profile:";
const DEFAULT_ORG_ID = "org_primary";

function getPendingProfileKey(email) {
  return `${PENDING_PROFILE_KEY}${String(email || "").trim().toLowerCase()}`;
}

function savePendingProfile(email, profile) {
  if (typeof window === "undefined" || !email) return;
  localStorage.setItem(getPendingProfileKey(email), JSON.stringify(profile));
}

function readPendingProfile(email) {
  if (typeof window === "undefined" || !email) return null;
  try {
    const raw = localStorage.getItem(getPendingProfileKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingProfile(email) {
  if (typeof window === "undefined" || !email) return;
  localStorage.removeItem(getPendingProfileKey(email));
}

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
    currency: {
      code: "INR",
      symbol: "Rs",
      name: "Indian Rupee",
      flag: "IN"
    },
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
  const registrationInProgressRef = useRef(false);

  async function ensureUserProfile(firebaseUser, profileOverrides = {}) {
    const normalizedOverrides = profileOverrides && typeof profileOverrides === "object" ? profileOverrides : {};
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : {};
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
    const baseOrganizationType = getOrgType(normalizedOverrides.organizationType || existing?.organizationType || existing?.account?.organizationType || ORG_TYPES.SMALL_BUSINESS);

    if (!snap.exists()) {
      const nowIso = new Date().toISOString();
      await setDoc(userRef, {
        name: baseName,
        email: baseEmail,
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
        activeOrgId: DEFAULT_ORG_ID,
        orgs: {
          [DEFAULT_ORG_ID]: createDefaultOrgProfile({ email: baseEmail, phone: basePhone, organizationType: baseOrganizationType })
        },
        onboardingSeenAt: "",
        role: "user",
        plan: PLANS.FREE,
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
        subscriptionEndsAt: "",
        trialEligible: true,
        trialStartedAt: "",
        blocked: false,
        sharedLedgerId: "",
        sharedLedgerRole: "",
        createdAt: nowIso,
        updatedAt: nowIso,
        lastActivityAt: nowIso
      });
      clearPendingProfile(baseEmail);
      return;
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

    if (!existing?.orgs || Object.keys(existing.orgs || {}).length === 0) {
      const activeOrgId = existing?.activeOrgId || DEFAULT_ORG_ID;
      updates.activeOrgId = activeOrgId;
      updates.orgs = {
        [activeOrgId]: {
          ...createDefaultOrgProfile({ email: baseEmail, phone: basePhone, organizationType: baseOrganizationType }),
          income: existing?.income || [],
          expenses: existing?.expenses || [],
          invoices: existing?.invoices || [],
          customers: existing?.customers || [],
          orgRecords: existing?.orgRecords || {},
          goals: existing?.goals || { monthlySavings: 0, targetAmount: 0, targetDate: "", savedAmount: 0, note: "" },
          budgets: existing?.budgets || {},
          notificationPrefs: existing?.notificationPrefs || {
            browserEnabled: false,
            invoiceDue: true,
            overdueInvoices: true,
            budgetAlerts: true,
            lowBalance: true,
            spendingSpike: true
          },
          currency: existing?.currency || {
            code: "INR",
            symbol: "Rs",
            name: "Indian Rupee",
            flag: "IN"
          },
          account: (() => {
            const existingAccountLocation = parseLocationFields(existing?.account?.location || existing?.account?.address || "");
            const addressLine = existing?.account?.addressLine || existingAccountLocation.addressLine || "";
            const city = existing?.account?.city || existingAccountLocation.city || "";
            const state = existing?.account?.state || existingAccountLocation.state || "";
            const rawCountry = String(existing?.account?.country || existingAccountLocation.country || "").trim();
            const country = rawCountry ? normalizeSupportedCountry(rawCountry) : "";
            const location = existing?.account?.location || buildLocationLabel({ city, state, country });
            const address = existing?.account?.address || buildLocationLabel({ addressLine, city, state, country });
            return {
              name: existing?.account?.name || "",
              email: existing?.account?.email || baseEmail,
              phone: existing?.account?.phone || basePhone,
              addressLine,
              city,
              state,
              country,
              location,
              address,
              gstin: existing?.account?.gstin || "",
              showHSN: Boolean(existing?.account?.showHSN),
              organizationType: getOrgType(existing?.account?.organizationType || existing?.organizationType || baseOrganizationType)
            };
          })()
        }
      };
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
    clearPendingProfile(baseEmail);
  }

  async function activateTrialIfEligible(firebaseUser, profile = null) {
    const nextProfile = profile || (await getDoc(doc(db, "users", firebaseUser.uid))).data() || {};
    if (!nextProfile?.trialEligible || nextProfile?.trialStartedAt) {
      return nextProfile;
    }

    const updates = {
      plan: PLANS.PRO,
      subscriptionStatus: SUBSCRIPTION_STATUS.TRIAL,
      subscriptionEndsAt: getTrialEndDate(),
      trialEligible: false,
      trialStartedAt: new Date().toISOString()
    };

    await updateDoc(doc(db, "users", firebaseUser.uid), updates);
    return { ...nextProfile, ...updates };
  }

  function buildSessionUser(firebaseUser, profile = {}) {
    const { activeOrgId, activeOrg } = getActiveOrgProfile(profile);
    return {
      id: firebaseUser.uid,
      name: profile?.name || "",
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
      sharedLedgerRole: profile?.sharedLedgerRole || ""
    };
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      if (!firebaseUser) {
        clearCurrentUser();
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        if (!firebaseUser.emailVerified) {
          if (registrationInProgressRef.current) {
            return;
          }
          await signOut(auth);
          clearCurrentUser();
          setUser(null);
          setLoading(false);
          return;
        }

        await ensureUserProfile(firebaseUser, readPendingProfile(firebaseUser.email));
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = await activateTrialIfEligible(firebaseUser, snap.exists() ? snap.data() : {});

        setUser(buildSessionUser(firebaseUser, profile));
        setCurrentUser(firebaseUser.uid);
      } catch (err) {
        console.error("Profile load error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function login(email, password) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);

      if (!userCred.user.emailVerified) {
        await signOut(auth);
        clearCurrentUser();
        return { error: "Please verify your email before logging in." };
      }

      await ensureUserProfile(userCred.user, readPendingProfile(userCred.user.email));
      const snap = await getDoc(doc(db, "users", userCred.user.uid));
      const profile = await activateTrialIfEligible(userCred.user, snap.exists() ? snap.data() : {});

      if (profile?.blocked) {
        await signOut(auth);
        clearCurrentUser();
        return { error: "Your account has been blocked. Contact admin." };
      }

      const nextUser = buildSessionUser(userCred.user, profile);

      setUser(nextUser);
      setCurrentUser(nextUser.id);
      return { success: true, user: nextUser };
    } catch (err) {
      if (err.code === "auth/user-not-found") return { error: "User not found. Please register." };
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") return { error: "Incorrect password." };
      if (err.code === "auth/invalid-email") return { error: "Invalid email format." };
      return { error: err.message };
    }
  }

  async function register(profileInput, password) {
    registrationInProgressRef.current = true;
    try {
      const profile = profileInput && typeof profileInput === "object"
        ? profileInput
        : {
            name: "",
            email: "",
            phone: "",
            organizationType: ORG_TYPES.SMALL_BUSINESS
          };
      const userCred = await createUserWithEmailAndPassword(auth, profile.email, password);
      await sendEmailVerification(userCred.user);
      savePendingProfile(profile.email, {
        ...profile,
        ageGroup: getAgeGroupFromDateOfBirth(profile.dateOfBirth)
      });
      await signOut(auth);
      clearCurrentUser();

      return {
        success: true,
        message: "Your account is ready. Please verify your email before signing in. Full review access will be available after your first verified login."
      };
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        try {
          const existingCred = await signInWithEmailAndPassword(auth, email, password);
          if (!existingCred.user.emailVerified) {
            await sendEmailVerification(existingCred.user);
            await signOut(auth);
            clearCurrentUser();
            return {
              success: true,
              message: "This email is already registered but still unverified. We've sent a fresh verification email. Please verify it before signing in."
            };
          }

          await signOut(auth);
          clearCurrentUser();
          return { error: "An account with this email already exists. Please sign in instead." };
        } catch (existingErr) {
          if (existingErr.code === "auth/wrong-password" || existingErr.code === "auth/invalid-credential") {
            return { error: "This email is already registered. Use your existing password from Sign In to resend the verification email if needed." };
          }
          return { error: "This email is already registered. Please sign in instead." };
        }
      }
      if (err.code === "auth/invalid-email") {
        return { error: "Please enter a valid email address." };
      }
      if (err.code === "auth/weak-password") {
        return { error: "Password must be at least 6 characters long." };
      }
      if (err.code === "auth/too-many-requests") {
        return { error: "Too many attempts were made. Please wait a little and try again." };
      }
      if (err.code === "permission-denied") {
        return { error: "Your verification email was sent, but we could not finish setting up the account. Please update Firestore rules and try signing in again after verification." };
      }
      return { error: err.message || "We couldn't create your account right now. Please try again." };
    } finally {
      registrationInProgressRef.current = false;
    }
  }

  async function forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "Password reset instructions have been sent to your email." };
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-email") {
        return { error: "We couldn't find an account with that email address." };
      }
      return { error: "We couldn't send the reset email right now. Please try again shortly." };
    }
  }

  async function resendVerification(email, password) {
    try {
      let verificationUser = auth.currentUser;

      if (!verificationUser) {
        if (!email || !password) {
          return { error: "Enter your email and password to resend the verification email." };
        }
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        verificationUser = userCred.user;
      }

      if (verificationUser.emailVerified) {
        return { error: "This email address is already verified. Please sign in." };
      }

      await sendEmailVerification(verificationUser);
      await signOut(auth);
      clearCurrentUser();
      return { success: true, message: "We've sent a fresh verification email. Please check your inbox and spam folder." };
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        return { error: "Your password didn't match our records. Please try again." };
      }
      if (err.code === "auth/too-many-requests") {
        return { error: "Too many attempts were made. Please wait a little and try again." };
      }
      return { error: "We couldn't resend the verification email right now. Please try again shortly." };
    }
  }

  async function updateProfile(updates) {
    if (!auth.currentUser) {
      return { error: "No user logged in." };
    }

    try {
      const timestamp = new Date().toISOString();
      const nextUpdates = { ...updates, updatedAt: timestamp, lastActivityAt: timestamp };
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
      await updateDoc(doc(db, "users", auth.currentUser.uid), nextUpdates);
      setUser(prev => (prev ? { ...prev, ...nextUpdates } : prev));
      return { success: true };
    } catch (err) {
      return { error: err.message || "Failed to update profile." };
    }
  }

  async function changePassword(currentPassword, nextPassword) {
    if (!auth.currentUser || !auth.currentUser.email) {
      return { error: "No authenticated user found." };
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, nextPassword);
      return { success: true };
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        return { error: "Your current password is incorrect." };
      }
      if (err.code === "auth/weak-password") {
        return { error: "Password must be at least 6 characters long." };
      }
      return { error: err.message || "We couldn't update your password right now. Please try again." };
    }
  }

  async function logout() {
    await signOut(auth);
    clearCurrentUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUser,
        updateProfile,
        changePassword,
        forgotPassword,
        resendVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
