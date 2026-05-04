import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logError, logEvent } from './utils/logger.js'

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
