import React,{ createContext, useContext, useState, useEffect } from "react";
import { setCurrentUser, getCurrentUser, clearCurrentUser } from "../utils/storage";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getDoc } from "firebase/firestore";
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
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        const profile = snap.exists() ? snap.data() : {};

        if (profile?.blocked) {
          alert("Your account is blocked. Contact admin.");
          await signOut(auth);
          setUser(null);
          return;
        }

        setUser({
          id: firebaseUser.uid,
          name: profile?.name || "",
          email: profile?.email || firebaseUser.email,
          phone: profile?.phone || "",
          role: profile?.role || "user",   // ✅ FIXED
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

      return { error: err.message };
    }
  }

  // ✅ REGISTER
  async function register(name, email, phone, passcode) {
    try {
      const finalPasscode = Array.isArray(passcode)
        ? passcode.join("")
        : passcode;

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        finalPasscode
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        phone,
        role: "user", 
        blocked: false,
        createdAt: new Date().toISOString(),

        // 🔥 IMPORTANT DEFAULT STRUCTURE
        income: [],
        expenses: [],
        invoices: [],
        customers: [],
        goals: []
      });

      const newUser = {
        id: userCred.user.uid,
        name,
        email,
        phone,
        role: "user"
      };

      setUser(newUser);
      setCurrentUser(newUser.id);

      return { success: true, user: newUser };

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        return { error: "User already exists. Please login." };
      }

      return { error: err.message };
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
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}