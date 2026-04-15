const isDev = import.meta.env.DEV;

/**
 * Log an error. In development, prints to console.
 * In production this is the integration point for a service like Sentry or Firebase Crashlytics.
 *
 * @param {string} label  - Short description of where the error occurred (e.g. "Invoice load")
 * @param {unknown} error - The caught error object
 * @param {object} [ctx]  - Optional extra context
 */
export function logError(label, error, ctx) {
  if (isDev) {
    if (ctx !== undefined) {
      console.error(`[${label}]`, error, ctx);
    } else {
      console.error(`[${label}]`, error);
    }
  }
  // TODO: forward to Sentry / Firebase Crashlytics in production
  // Example:
  // if (!isDev && window.Sentry) {
  //   window.Sentry.withScope(scope => {
  //     if (label) scope.setTag("label", label);
  //     if (ctx) scope.setContext("details", ctx);
  //     window.Sentry.captureException(error instanceof Error ? error : new Error(String(error)));
  //   });
  // }
}

/**
 * Log a warning.
 */
export function logWarn(label, ctx) {
  if (isDev) {
    if (ctx !== undefined) {
      console.warn(`[${label}]`, ctx);
    } else {
      console.warn(`[${label}]`);
    }
  }
}
