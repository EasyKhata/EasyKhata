import React,{ createContext, useContext, useState, useEffect } from "react";
import { setCurrentUser, getCurrentUser, clearCurrentUser } from "../utils/storage";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

const AuthContext = createContext();

// Storage helpers
function getStore(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // 🔥 BLOCK UNVERIFIED USERS (VERY IMPORTANT)
        if (!firebaseUser.emailVerified) {
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        const profile = snap.exists() ? snap.data() : {};

        // 🔒 BLOCKED USER CHECK
        if (profile?.blocked) {
          alert("Your account is blocked. Contact admin.");
          await signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({
          id: firebaseUser.uid,
          name: profile?.name || "",
          email: profile?.email || firebaseUser.email,
          phone: profile?.phone || "",
          role: profile?.role || "user",
          blocked: profile?.blocked || false
        });

        setCurrentUser(firebaseUser.uid);

      } catch (err) {
        console.error("Profile load error:", err);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  // ✅ LOGIN
async function login(email, passcode) {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, passcode);

    // 🔥 BLOCK UNVERIFIED USERS
    if (!userCred.user.emailVerified) {
      await signOut(auth); // 🚨 IMPORTANT FIX
      return { error: "Please verify your email before logging in." };
    }

    const user = {
      id: userCred.user.uid,
      email,
      role: "user"
    };

    setUser(user);
    setCurrentUser(user.id);

    return { success: true, user };

  } catch (err) {
    if (err.code === "auth/user-not-found") {
      return { error: "User not found. Please register." };
    }

    if (err.code === "auth/wrong-password") {
      return { error: "Incorrect password." };
    }

    if (err.code === "auth/invalid-email") {
      return { error: "Invalid email format." };
    }

    return { error: err.message };
  }
}

  // ✅ REGISTER
async function register(name, email, phone, passcode) {
  try {
    const finalPasscode = Array.isArray(passcode)
      ? passcode.join("")
      : passcode;

    // ✅ STEP 1: Create auth user
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      finalPasscode
    );

const uid = userCred.user.uid;

// 🔥 FORCE REFRESH AUTH TOKEN (CRITICAL FIX)
await userCred.user.getIdToken(true);

console.log("AUTH READY, creating Firestore doc...");

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
  goals: []
});

console.log("FIRESTORE SUCCESS");

    // ✅ STEP 3: Send verification email
    try {
      await sendEmailVerification(userCred.user);
      console.log("VERIFICATION EMAIL SENT");
    } catch (err) {
      console.error("EMAIL ERROR:", err);
    }

    // ❗ DO NOT auto-login unverified users
    await signOut(auth);

    return {
      success: true,
      message: "Account created. Please verify your email before login."
    };

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === "auth/email-already-in-use") {
      return { error: "User already exists. Please login." };
    }

    return { error: err.message };
  }
}

  // RESEND VERIFICATION

  async function resendVerification() {
  try {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    }
    return { error: "No user logged in" };
  } catch (err) {
    return { error: "Failed to resend email" };
  }
}

  // ✅ LOGOUT
  function logout() {
    signOut(auth);
    setUser(null);
    clearCurrentUser();
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      setUser,
      forgotPassword,
      resendVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

async function forgotPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { error: "Failed to send reset email" };
  }
}