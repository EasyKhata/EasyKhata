import React,{ createContext, useContext, useState, useEffect } from "react";
import { setCurrentUser, getCurrentUser, clearCurrentUser } from "../utils/storage";

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
  initAdmin();

  const userId = getCurrentUser(); // ✅ new method

  if (userId) {
    const users = getStore("ledger_users", []);
    const found = users.find(u => u.id === userId);

    if (found && !found.blocked) {
      setUser(found);
    } else if (found?.blocked) {
      setUser(found);
    }
  }

  setLoading(false);
}, []);

  function getAllUsers() { return getStore("ledger_users", []); }
  function saveUsers(users) { setStore("ledger_users", users); }

  function login(phone, passcode) {
    const users = getAllUsers();
    const found = users.find(u => u.phone === phone);
    if (!found) return { error: "No account found with this phone number." };
    if (found.blocked) return { error: "Your account has been blocked. Contact admin." };
    
    // check passcode or temp password
    const validPasscode = found.passcode === passcode;
    const validTemp = found.tempPassword && found.tempPassword === passcode;
    
    if (!validPasscode && !validTemp) return { error: "Incorrect passcode." };
    
    // If used temp, force clear it
    if (validTemp) {
      const updated = users.map(u => u.id === found.id ? { ...u, tempPassword: null } : u);
      saveUsers(updated);
      const fresh = { ...found, tempPassword: null };
      setUser(fresh);
      setStore("ledger_session", { id: fresh.id });
      return { success: true, user: fresh };
    }
    
    setUser(found);
    //setStore("ledger_session", { id: found.id });
    setCurrentUser(found.id);
    return { success: true, user: found };
  }

  function register(phone, name, passcode) {
    const users = getAllUsers();
    if (users.find(u => u.phone === phone)) return { error: "An account with this phone number already exists." };
    if (passcode.length !== 6 || !/^\d+$/.test(passcode)) return { error: "Passcode must be exactly 6 digits." };
    
    const newUser = {
      id: `user_${Date.now()}`,
      phone,
      name,
      email: "",
      role: "user",
      passcode,
      blocked: false,
      createdAt: new Date().toISOString(),
      tempPassword: null,
    };
    saveUsers([...users, newUser]);
    setUser(newUser);
    setCurrentUser(newUser.id);
    return { success: true, user: newUser };
  }

  function requestTempPassword(phone) {
    const users = getAllUsers();
    const found = users.find(u => u.phone === phone && u.role !== "admin");
    if (!found) return { error: "No user account found with this number." };
    if (found.blocked) return { error: "This account is blocked." };
    return { success: true, message: "Request noted. Admin will issue a temp password. Try again in a moment." };
  }

  function logout() {
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