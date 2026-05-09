// Persistent flag per-user-per-org for "local state is ahead of server".
//
// Local edits are already written to localStorage immediately, so the user's data
// is never lost on a sync failure. What was missing was an automatic retry once
// connectivity returns: a user could go offline, edit, close the app, and the
// changes would sit unsynced until they happened to make another edit.
//
// Pattern:
//   • Mark the org as pending when any sync attempt fails with a network error.
//   • Clear it when a sync succeeds.
//   • On app resume / online event / bootstrap, drain pending orgs by firing the
//     normal sync path again — local state is the source of truth for the deltas.
const KEY_PREFIX = "ledgerApp_v1_pendingSyncs";

function read(userId) {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}_${userId}`);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

function write(userId, value) {
  if (!userId) return;
  try {
    localStorage.setItem(`${KEY_PREFIX}_${userId}`, JSON.stringify(value || {}));
  } catch {
    // localStorage may be full or disabled — silently degrade.
  }
}

export function markPendingSync(userId, orgId) {
  if (!userId || !orgId) return;
  const next = read(userId);
  next[orgId] = Date.now();
  write(userId, next);
}

export function clearPendingSync(userId, orgId) {
  if (!userId || !orgId) return;
  const next = read(userId);
  if (!(orgId in next)) return;
  delete next[orgId];
  write(userId, next);
}

export function hasPendingSync(userId, orgId) {
  if (!userId || !orgId) return false;
  return Boolean(read(userId)[orgId]);
}

export function listPendingSyncs(userId) {
  return Object.keys(read(userId));
}
