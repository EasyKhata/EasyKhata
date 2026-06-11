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
const PortalSelectionScreen = lazy(() => import("./screens/PortalSelectionScreen"));
const AdsManager = lazy(() => import("./sections/AdsManager"));

const AUTO_RETRY_SECONDS = 10;

function NoConnectionScreen({ offlineReason, onContinueOffline }) {
  const isServerDown = offlineReason === "server_unreachable";
  const [countdown, setCountdown] = React.useState(AUTO_RETRY_SECONDS);
  const [retrying, setRetrying] = React.useState(false);

  function handleRetry() {
    setRetrying(true);
    window.location.reload();
  }

  // Auto-retry countdown — only when server is reachable but returned an error.
  // On "no internet" we wait for the user to fix connectivity manually.
  React.useEffect(() => {
    if (!isServerDown) return;
    if (countdown <= 0) { handleRetry(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerDown, countdown]);

  const title   = isServerDown ? "Service temporarily unavailable" : "No internet connection";
  const message = isServerDown
    ? "EasyKhata's servers are not responding right now. This usually clears up in a few seconds."
    : "Please check your internet connection and try again.";
  const icon    = isServerDown ? "🛠️" : "📡";

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: "32px 24px",
      textAlign: "center"
    }}>
      <BrandLogo compact showTagline={false} center />
      <div style={{ fontSize: 40, marginTop: 28, marginBottom: 4 }}>{icon}</div>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--text)", margin: "0 0 10px" }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.6, maxWidth: 300, margin: "0 0 28px" }}>
        {message}
      </p>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="btn-primary"
        style={{ padding: "13px 32px", fontSize: 15, fontWeight: 700, opacity: retrying ? 0.7 : 1, cursor: retrying ? "wait" : "pointer", minWidth: 160 }}
      >
        {retrying ? "Retrying…" : isServerDown ? `Retry in ${countdown}s` : "Try again"}
      </button>
      <button
        onClick={onContinueOffline}
        style={{ marginTop: 18, background: "none", border: "none", color: "var(--text-dim)", fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "var(--font)" }}
      >
        Continue with saved data
      </button>
    </div>
  );
}

function AppRouter() {
  const { user, loading, logout, pendingSetup } = useAuth();
  const [bypassOffline, setBypassOffline] = React.useState(false);
  // Portal selection is shown once after each sign-in session.
  // null = not yet chosen, 'admin' or 'resident' = chosen.
  const [portalSession, setPortalSession] = React.useState(null);
  const isAdsManagerRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/ads-manager");
  // Track at mount whether a user was previously signed in (before Firebase resolves).
  // This lets returning users skip the landing page and see the app skeleton instead.
  const wasSignedIn = useRef(!!getCurrentUser());

  // Reset portal session whenever the signed-in identity changes so every new
  // sign-in sees the portal selection screen.
  const prevUserIdRef = useRef(null);
  React.useEffect(() => {
    const currentId = user?.id || (pendingSetup ? "__pending__" : null);
    if (!currentId) {
      prevUserIdRef.current = null;
      setPortalSession(null);
    } else if (currentId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentId;
      setPortalSession(null);
    }
  }, [user?.id, pendingSetup]);

  function handlePortalSelect(portal, data) {
    if (data) {
      try { sessionStorage.setItem("ek_portal_entry", JSON.stringify({ portal, ...data })); } catch {}
    } else {
      try { sessionStorage.removeItem("ek_portal_entry"); } catch {}
    }
    setPortalSession(portal);
  }

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

  if (!user && !pendingSetup) {
    return (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
        <LandingScreen />
      </Suspense>
    );
  }

  // Portal selection — shown to every user after each sign-in until they choose.
  // Unified condition keeps the component mounted across the pendingSetup → user
  // transition so internal state (e.g. invite-finder view) survives the handoff.
  if (!portalSession) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <PortalSelectionScreen onSelectPortal={handlePortalSelect} />
      </Suspense>
    );
  }

  // New user picked Admin Portal — show the khata-creation wizard.
  if (pendingSetup && portalSession === "admin") {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <AuthScreen />
      </Suspense>
    );
  }

  // Still in pendingSetup but portal is 'resident' — PortalSelectionScreen
  // handles the invite flow and will call completeSetup({ residentPath: true })
  // then call onSelectPortal which clears pendingSetup and advances to MainApp.
  // This branch is a safety net only.
  if (pendingSetup) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <PortalSelectionScreen onSelectPortal={handlePortalSelect} />
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

  if (user.offlineProfile && !bypassOffline) {
    return <NoConnectionScreen offlineReason={user.offlineReason} onContinueOffline={() => setBypassOffline(true)} />;
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
