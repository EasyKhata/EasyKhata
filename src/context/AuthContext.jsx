import React,{ createContext, useContext, useState, useEffect } from "react";
import { setCurrentUser, getCurrentUser, clearCurrentUser } from "../utils/storage";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const AuthContext = createContext();

// Storage helpers
function getStore(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function setStore(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// Seed admin on first run
function initAdmin() {
  let users = getStore("ledger_users", []);

  const ADMIN = {
    id: "admin_1",
    phone: "9866838167",
    name: "Deepak Reddy",
    email: "yasadeepakreddy@gmail.com",
    role: "admin",
    passcode: "561417",
    blocked: false,
    createdAt: new Date().toISOString(),
    tempPassword: null,
  };

  // remove existing admin (important)
  users = users.filter(u => u.role !== "admin");

  // always insert fresh admin from code
  users.unshift(ADMIN);

  setStore("ledger_users", users);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const phone = firebaseUser.email.replace("@ledger.app", "");

      setUser({
        id: firebaseUser.uid,
        phone,
        role: "user"
      });

      setCurrentUser(firebaseUser.uid);
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  function getAllUsers() { return getStore("ledger_users", []); }
  function saveUsers(users) { setStore("ledger_users", users); }

async function login(phone, passcode) {
  try {
    const email = `${phone}@ledger.app`; // fake email system
    const userCred = await signInWithEmailAndPassword(auth, email, passcode);

    const user = {
      id: userCred.user.uid,
      phone,
      role: "user"
    };

    setUser(user);
    setCurrentUser(user.id);

    return { success: true, user };

  } catch (err) {
    return { error: "Invalid credentials" };
  }
}

async function register(name, phone, passcode) {
  try {
    console.log("PHONE:", phone);
    console.log("NAME:", name);
    console.log("EMAIL:", `${phone}@ledger.app`);
    console.log("Passcode",passcode)
    const email = `${phone}@ledger.app`;
    const finalPasscode = Array.isArray(passcode)
    ? passcode.join("")
    : passcode;
    const userCred = await createUserWithEmailAndPassword(auth, email, finalPasscode);

    const newUser = {
      id: userCred.user.uid,
      phone,
      name,
      role: "user"
    };

    setUser(newUser);
    setCurrentUser(newUser.id);

    return { success: true, user: newUser };

  } catch (err) {
  console.error("REGISTER ERROR FULL:", err);
  console.error("ERROR CODE:", err.code);
  console.error("ERROR MESSAGE:", err.message);

  return { error: err.message };
}

}

  function requestTempPassword(phone) {
    const users = getAllUsers();
    const found = users.find(u => u.phone === phone && u.role !== "admin");
    if (!found) return { error: "No user account found with this number." };
    if (found.blocked) return { error: "This account is blocked." };
    return { success: true, message: "Request noted. Admin will issue a temp password. Try again in a moment." };
  }

function logout() {
  signOut(auth);
  setUser(null);
  clearCurrentUser();
}

  function updateProfile(updates) {
    const users = getAllUsers();
    const updated = users.map(u => u.id === user.id ? { ...u, ...updates } : u);
    saveUsers(updated);
    const fresh = { ...user, ...updates };
    setUser(fresh);
    setStore("ledger_session", { id: fresh.id });
  }

  // Admin functions
  function adminGetUsers() {
    return getAllUsers().filter(u => u.role !== "admin");
  }

  function adminIssueTempPassword(userId, tempPass) {
    const users = getAllUsers();
    const updated = users.map(u => u.id === userId ? { ...u, tempPassword: tempPass } : u);
    saveUsers(updated);
  }

  function adminBlockUser(userId) {
    const users = getAllUsers();
    const updated = users.map(u => u.id === userId ? { ...u, blocked: !u.blocked } : u);
    saveUsers(updated);
  }

  function adminRemoveUser(userId) {
    const users = getAllUsers().filter(u => u.id !== userId);
    saveUsers(users);
    // Also remove their data
    localStorage.removeItem(`ledgerApp_v1_user_${userId}_appData`);
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, requestTempPassword, updateProfile,
      adminGetUsers, adminIssueTempPassword, adminBlockUser, adminRemoveUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }