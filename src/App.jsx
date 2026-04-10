import React, { Suspense, lazy } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { DashboardSkeleton } from "./components/UI";
import BrandLogo from "./components/BrandLogo";
import { APP_SUPPORT_LABEL } from "./utils/brand";
import "./index.css";

const AuthScreen = lazy(() => import("./screens/AuthScreen"));
const MainApp = lazy(() => import("./screens/MainApp"));

function AppRouter() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <AuthScreen />
      </Suspense>
    );
  }

  if (user.blocked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <BrandLogo compact showTagline={false} center />
          </div>
          <h2 style={{ color: "var(--text)", fontFamily: "var(--serif)", fontSize: 28, marginBottom: 8 }}>Account Blocked</h2>
          <p style={{ color: "var(--text-sec)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Your account has been blocked by the administrator. Please contact {APP_SUPPORT_LABEL}.
          </p>
          <button
            onClick={logout}
            style={{ background: "var(--danger)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <DataProvider>
      <Suspense fallback={<DashboardSkeleton />}>
        <MainApp />
      </Suspense>
    </DataProvider>
  );
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
