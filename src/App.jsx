import React, { Suspense, lazy, useEffect, useRef } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { DashboardSkeleton } from "./components/UI";
import BrandLogo from "./components/BrandLogo";
import ErrorBoundary from "./components/ErrorBoundary";
import { APP_SUPPORT_LABEL } from "./utils/brand";
import { isNative, isAndroid } from "./utils/native";
import { getCurrentUser } from "./utils/storage";
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
const LandingScreen = lazy(() => import("./screens/LandingScreen"));

function AppRouter() {
  const { user, loading, logout } = useAuth();
  // Track at mount whether a user was previously signed in (before Firebase resolves).
  // This lets returning users skip the landing page and see the app skeleton instead.
  const wasSignedIn = useRef(!!getCurrentUser());
  const [showLanding, setShowLanding] = React.useState(!wasSignedIn.current);

  // Once Firebase resolves a logged-in user, never show landing again this session.
  useEffect(() => {
    if (user) setShowLanding(false);
  }, [user]);

  // Returning user: Firebase is still loading — show skeleton, not landing
  if (loading && wasSignedIn.current) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    // Show landing immediately — Firebase loads in background, doesn't block render
    if (showLanding) {
      return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
          <LandingScreen onGetStarted={() => setShowLanding(false)} />
        </Suspense>
      );
    }
    // After "Get Started" — show skeleton while Firebase finishes, then auth screen
    if (loading) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
          <DashboardSkeleton />
        </div>
      );
    }
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
