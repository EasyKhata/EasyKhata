import React, { createContext, useContext, useEffect, useState } from "react";
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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          await signOut(auth);
          clearCurrentUser();
          setUser(null);
          setLoading(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = snap.exists() ? snap.data() : {};

        setUser({
          id: firebaseUser.uid,
          name: profile?.name || "",
          email: profile?.email || firebaseUser.email || "",
          phone: profile?.phone || "",
          role: profile?.role || "user",
          blocked: Boolean(profile?.blocked)
        });
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

      const snap = await getDoc(doc(db, "users", userCred.user.uid));
      const profile = snap.exists() ? snap.data() : {};

      if (profile?.blocked) {
        await signOut(auth);
        clearCurrentUser();
        return { error: "Your account has been blocked. Contact admin." };
      }

      const nextUser = {
        id: userCred.user.uid,
        name: profile?.name || "",
        email: profile?.email || email,
        phone: profile?.phone || "",
        role: profile?.role || "user",
        blocked: Boolean(profile?.blocked)
      };

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

  async function register(name, email, phone, password) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        phone,
        role: "user",
        blocked: false,
        createdAt: new Date().toISOString(),
        income: [],
        expenses: [],
        invoices: [],
        customers: [],
        account: {
          name,
          email,
          phone,
          address: "",
          gstin: "",
          showHSN: false
        },
        currency: {
          code: "INR",
          symbol: "Rs",
          name: "Indian Rupee",
          flag: "IN"
        }
      });

      await sendEmailVerification(userCred.user);
      await signOut(auth);
      clearCurrentUser();

      return {
        success: true,
        message: "Account created. Please verify your email before login."
      };
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        return { error: "User already exists. Please login." };
      }
      return { error: err.message };
    }
  }

  async function forgotPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { error: "Failed to send reset email" };
    }
  }

  async function resendVerification() {
    try {
      if (!auth.currentUser) {
        return { error: "No user logged in" };
      }
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err) {
      return { error: "Failed to resend email" };
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
        return { error: "Current password is incorrect." };
      }
      if (err.code === "auth/weak-password") {
        return { error: "New password must be at least 6 characters." };
      }
      return { error: err.message || "Failed to update password." };
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
