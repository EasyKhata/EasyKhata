import React, { useState, useEffect, createContext, useContext } from "react";
import AuthScreen from "./screens/AuthScreen";
import MainApp from "./screens/MainApp";
import AdminApp from "./screens/AdminApp";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import "./index.css";

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <AuthScreen />;
  if (user.role === "admin") return <DataProvider><AdminApp /></DataProvider>;
  if (user.blocked) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: "var(--text)", fontFamily: "var(--serif)", fontSize: 28, marginBottom: 8 }}>Account Blocked</h2>
        <p style={{ color: "var(--text-sec)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>Your account has been blocked by the administrator. Please contact support.</p>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ background: "var(--danger)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>
          Sign Out
        </button>
      </div>
    </div>
  );
  return <DataProvider><MainApp /></DataProvider>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}