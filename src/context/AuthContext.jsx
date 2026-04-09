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
import { PLANS, SUBSCRIPTION_STATUS, getTrialEndDate } from "../utils/subscription";
import { ORG_TYPES, getOrgType } from "../utils/orgTypes";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const registrationInProgressRef = useRef(false);

  async function ensureUserProfile(firebaseUser, profileOverrides = {}) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? snap.data() : {};
    const baseName = profileOverrides.name || existing?.name || firebaseUser.displayName || "";
    const baseEmail = profileOverrides.email || existing?.email || firebaseUser.email || "";
    const basePhone = profileOverrides.phone || existing?.phone || "";
    const baseOrganizationType = getOrgType(profileOverrides.organizationType || existing?.organizationType || existing?.account?.organizationType || ORG_TYPES.SMALL_BUSINESS);

    if (!snap.exists()) {
      await setDoc(userRef, {
        name: baseName,
        email: baseEmail,
        phone: basePhone,
        organizationType: baseOrganizationType,
        role: "user",
        plan: PLANS.FREE,
        subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
        subscriptionEndsAt: "",
        trialEligible: true,
        trialStartedAt: "",
        blocked: false,
        sharedLedgerId: "",
        sharedLedgerRole: "",
        createdAt: new Date().toISOString(),
        income: [],
        expenses: [],
        invoices: [],
        customers: [],
        account: {
          name: baseName,
          email: baseEmail,
          phone: basePhone,
          address: "",
          gstin: "",
          showHSN: false,
          organizationType: baseOrganizationType
        },
        currency: {
          code: "INR",
          symbol: "Rs",
          name: "Indian Rupee",
          flag: "IN"
        }
      });
      return;
    }

    const updates = {};
    if (!existing?.name && baseName) updates.name = baseName;
    if (!existing?.email && baseEmail) updates.email = baseEmail;
    if (!existing?.phone && basePhone) updates.phone = basePhone;
    if (!existing?.organizationType) updates.organizationType = baseOrganizationType;
    if (!existing?.account?.organizationType) updates.account = { ...(existing?.account || {}), organizationType: baseOrganizationType };

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
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
    return {
      id: firebaseUser.uid,
      name: profile?.name || "",
      email: profile?.email || firebaseUser.email || "",
      phone: profile?.phone || "",
      role: profile?.role || "user",
      organizationType: getOrgType(profile?.organizationType || profile?.account?.organizationType),
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

      await ensureUserProfile(userCred.user);
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

  async function register(name, email, phone, password, organizationType = ORG_TYPES.SMALL_BUSINESS) {
    registrationInProgressRef.current = true;
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await ensureUserProfile(userCred.user, { name, email, phone, organizationType });
      await signOut(auth);
      clearCurrentUser();

      return {
        success: true,
        message: "Your account is ready. Please verify your email before signing in. Your free Pro trial will begin after your first verified login."
      };
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        return { error: "An account with this email already exists. Please sign in instead." };
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
      await updateDoc(doc(db, "users", auth.currentUser.uid), updates);
      setUser(prev => (prev ? { ...prev, ...updates } : prev));
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
