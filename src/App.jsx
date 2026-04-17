import React, { Suspense, lazy, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { DashboardSkeleton } from "./components/UI";
import BrandLogo from "./components/BrandLogo";
import ErrorBoundary from "./components/ErrorBoundary";
import { APP_SUPPORT_LABEL } from "./utils/brand";
import { isNative, isAndroid } from "./utils/native";
import "./index.css";

// Initialise native Android integrations once on startup
if (isNative && isAndroid) {
  Promise.all([
    import("@capacitor/status-bar").then(({ StatusBar, Style }) =>
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    ),
    import("@capacitor/status-bar").then(({ StatusBar }) =>
      StatusBar.setBackgroundColor({ color: "#0C0C10" }).catch(() => {})
    )
  ]).catch(() => {});
}

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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
