const APP_PREFIX = "ledgerApp_v1";

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
  const data = localStorage.getItem(buildKey(userId, key));
  return data ? JSON.parse(data) : null;
};

export const setUserData = (userId, key, value) => {
  localStorage.setItem(buildKey(userId, key), JSON.stringify(value));
};

export const removeUserData = (userId, key) => {
  localStorage.removeItem(buildKey(userId, key));
};