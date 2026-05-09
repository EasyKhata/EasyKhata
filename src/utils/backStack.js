// Tracks dismissable overlays (modals, drawers, etc.) so the Android hardware-back
// button can close them in LIFO order before navigating tabs or exiting the app.
//
// Usage from a component:
//   useEffect(() => pushBackHandler(onClose), [onClose]);
//
// pushBackHandler returns the unregister function — return it directly from useEffect.
const handlers = [];

export function pushBackHandler(handler) {
  if (typeof handler !== "function") return () => {};
  handlers.push(handler);
  return () => {
    const idx = handlers.lastIndexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  };
}

// Pop the most recent handler. Returns true if one ran, false if the stack was empty.
export function consumeBackHandler() {
  const handler = handlers.pop();
  if (!handler) return false;
  try { handler(); } catch { /* never let a buggy handler crash the back-press flow */ }
  return true;
}

export function hasBackHandler() {
  return handlers.length > 0;
}
