const APP_PREFIX = "ledgerApp_v1";
const USER_KEY_PREFIX = `${APP_PREFIX}_user_`;

// Previously: SESSION_ONLY_KEYS routed `appData` (the entire org cache) to
// sessionStorage. That worked on desktop browsers where sessionStorage clears
// on tab close, but on Android WebView it cleared unpredictably (memory pressure,
// force-stop, OS-killed background tasks), wiping the offline cache mid-use.
// We now use localStorage for everything and explicitly clear user data on
// logout / account deletion (see clearAllUserData below).
const buildKey = (userId, key) => `${USER_KEY_PREFIX}${userId}_${key}`;

// One-time migration: lift any pre-existing sessionStorage values into
// localStorage so users upgrading from the old build don't see an empty cache
// the first time they open the new version.
function migrateSessionStorageOnce() {
  if (typeof sessionStorage === "undefined" || typeof localStorage === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (!k || !k.startsWith(USER_KEY_PREFIX)) continue;
      const value = sessionStorage.getItem(k);
      if (value !== null && localStorage.getItem(k) === null) {
        localStorage.setItem(k, value);
      }
      sessionStorage.removeItem(k);
    }
  } catch {
    // Storage may be disabled (private browsing); nothing critical here.
  }
}
migrateSessionStorageOnce();

export const getCurrentUser = () => {
  return localStorage.getItem(`${APP_PREFIX}_currentUser`);
};

export const setCurrentUser = (userId) => {
  localStorage.setItem(`${APP_PREFIX}_currentUser`, userId);
};

export const clearCurrentUser = () => {
  localStorage.removeItem(`${APP_PREFIX}_currentUser`);
};

export const getUserData = (userId, key) => {
  const data = localStorage.getItem(buildKey(userId, key));
  return data ? JSON.parse(data) : null;
};

export const setUserData = (userId, key, value) => {
  localStorage.setItem(buildKey(userId, key), JSON.stringify(value));
};

export const removeUserData = (userId, key) => {
  localStorage.removeItem(buildKey(userId, key));
};

// Explicit purge of every key tied to a user. Called on logout and account
// deletion to keep the previous "cleared on close" security property — without
// relying on sessionStorage's unreliable auto-clear on Android WebView.
export const clearAllUserData = (userId) => {
  if (!userId) return;
  const prefix = buildKey(userId, "");
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    // ignore — best-effort
  }
};