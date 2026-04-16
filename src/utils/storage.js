const APP_PREFIX = "ledgerApp_v1";

// Keys that hold sensitive financial data go to sessionStorage so they
// clear automatically when the browser closes (consistent with session auth).
const SESSION_ONLY_KEYS = new Set(["appData"]);

export const getCurrentUser = () => {
  return localStorage.getItem(`${APP_PREFIX}_currentUser`);
};

export const setCurrentUser = (userId) => {
  localStorage.setItem(`${APP_PREFIX}_currentUser`, userId);
};

export const clearCurrentUser = () => {
  localStorage.removeItem(`${APP_PREFIX}_currentUser`);
};

const buildKey = (userId, key) => {
  return `${APP_PREFIX}_user_${userId}_${key}`;
};

export const getUserData = (userId, key) => {
  const store = SESSION_ONLY_KEYS.has(key) ? sessionStorage : localStorage;
  const data = store.getItem(buildKey(userId, key));
  return data ? JSON.parse(data) : null;
};

export const setUserData = (userId, key, value) => {
  const store = SESSION_ONLY_KEYS.has(key) ? sessionStorage : localStorage;
  store.setItem(buildKey(userId, key), JSON.stringify(value));
};

export const removeUserData = (userId, key) => {
  const store = SESSION_ONLY_KEYS.has(key) ? sessionStorage : localStorage;
  store.removeItem(buildKey(userId, key));
};