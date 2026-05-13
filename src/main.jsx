import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import { logError, logEvent } from './utils/logger.js'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.05,
    // Don't send PII — strip user emails from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "xhr" || breadcrumb.category === "fetch") {
        if (breadcrumb.data?.url) {
          try {
            const u = new URL(breadcrumb.data.url);
            breadcrumb.data.url = u.origin + u.pathname;
          } catch { /* leave as-is */ }
        }
      }
      return breadcrumb;
    }
  });
}

logEvent("app_opened");

// Catch unhandled promise rejections — covers "Failed to fetch", Firebase token
// refresh failures, and any async error that isn't caught by a try/catch.
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  // Skip noisy non-errors (e.g. user-cancelled dialogs)
  if (!reason) return;
  logError("unhandled_rejection", reason instanceof Error ? reason : new Error(String(reason)));
});

// Catch synchronous errors that escape React's error boundary (e.g. in event
// handlers, setTimeout callbacks, non-React code).
window.addEventListener("error", (event) => {
  if (!event.error) return;
  logError("uncaught_error", event.error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
