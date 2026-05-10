import React, { Suspense, lazy, useEffect, useRef } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { DialogProvider } from "./context/DialogContext";
import { ToastProvider } from "./context/ToastContext";
import { DashboardSkeleton } from "./components/UI";
import BrandLogo from "./components/BrandLogo";
import LaunchIntro from "./components/LaunchIntro";
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
const AdsManager = lazy(() => import("./sections/AdsManager"));

function AppRouter() {
  const { user, loading, logout, pendingSetup } = useAuth();
  const isAdsManagerRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/ads-manager");
  // Track at mount whether a user was previously signed in (before Firebase resolves).
  // This lets returning users skip the landing page and see the app skeleton instead.
  const wasSignedIn = useRef(!!getCurrentUser());

  // Returning user: Firebase is still loading — show skeleton, not landing
  if (loading && wasSignedIn.current) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <DashboardSkeleton />
      </div>
    );
  }

  if (isAdsManagerRoute && !user) {
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

  if (!user) {
    // The sign-in wizard (phone / khata type / khata profile) is hosted by
    // AuthScreen and is gated by `pendingSetup` from AuthContext. New users
    // who just authenticated via Google but haven't filled out the wizard see
    // it here. Returning users with a complete profile never hit this branch.
    if (pendingSetup) {
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <AuthScreen />
        </Suspense>
      );
    }
    // Otherwise show the marketing landing page. Sign-in is now triggered
    // from CTAs ON the landing page itself — no intermediate empty AuthScreen
    // step. Firebase auth resolution is a background task; while it runs we
    // keep showing landing so the user can keep reading or click sign-in.
    return (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
        <LandingScreen />
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

  if (isAdsManagerRoute) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <AdsManager />
      </Suspense>
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
  // Cold-start launch animation overlay. Renders for ~1.1 s while the actual
  // app mounts behind it; self-removes via internal timer. Only fires once per
  // page load thanks to the useState initializer running only on mount.
  const [introDone, setIntroDone] = React.useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DialogProvider>
            <ToastProvider>
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
              {!introDone && <LaunchIntro onDone={() => setIntroDone(true)} />}
            </ToastProvider>
          </DialogProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
