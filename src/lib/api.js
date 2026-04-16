import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// Attaches the current Firebase ID token as Bearer on every request.
// Automatically refreshes the token if it's expired.

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function request(method, path, body) {
  const token = await getIdToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

const api = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  put:    (path, body)  => request("PUT",    path, body),
  delete: (path)        => request("DELETE", path)
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  // Create user profile on first login
  create: (profile) =>
    api.post("/users", profile),

  // Get full user profile + orgs
  get: (userId) =>
    api.get(`/users/${userId}`),

  // Update profile fields
  update: (userId, updates) =>
    api.put(`/users/${userId}`, updates)
};

// ── Organisations ─────────────────────────────────────────────────────────────

export const orgsApi = {
  // List all orgs for a user (no collection records — metadata only)
  list: (userId) =>
    api.get(`/users/${userId}/orgs`),

  // Load everything for one org in a single request
  // Returns: { ...orgSettings, income[], expenses[], invoices[], customers[], orgRecords{} }
  getFull: (userId, orgId) =>
    api.get(`/users/${userId}/orgs/${orgId}/full`),

  // Create a new org
  create: (userId, orgId, data) =>
    api.post(`/users/${userId}/orgs`, { orgId, ...data }),

  // Delete an org
  delete: (userId, orgId) =>
    api.delete(`/users/${userId}/orgs/${orgId}`),

  // Update org settings (account, currency, goals, budgets, notificationPrefs)
  update: (userId, orgId, data) =>
    api.put(`/users/${userId}/orgs/${orgId}`, data),

  // Sync a collection — sends the full array, server does upsert + delete-missing
  syncCollection: (userId, orgId, collectionKey, records) =>
    api.post(`/users/${userId}/orgs/${orgId}/${collectionKey}/sync`, records),

  // Sync orgRecords map { "YYYY-MM": [...] }
  syncOrgRecords: (userId, orgId, orgRecordsMap) =>
    api.post(`/users/${userId}/orgs/${orgId}/org-records/sync`, orgRecordsMap),

  // Get all orgs this user is a member of (shared access)
  getMemberships: (userId) =>
    api.get(`/users/${userId}/orgs/memberships`)
};

// ── Org Members ───────────────────────────────────────────────────────────────

export const membersApi = {
  list: (userId, orgId) =>
    api.get(`/users/${userId}/orgs/${orgId}/members`),

  invite: (userId, orgId, payload) =>
    api.post(`/users/${userId}/orgs/${orgId}/members`, payload),

  changeRole: (userId, orgId, memberUid, role) =>
    api.put(`/users/${userId}/orgs/${orgId}/members/${memberUid}`, { role }),

  remove: (userId, orgId, memberUid) =>
    api.delete(`/users/${userId}/orgs/${orgId}/members/${memberUid}`),

  // Called by the invited member to accept
  acceptInvite: (inviteId) =>
    api.post("/invitations/accept", { inviteId }),

  // Check if current user has pending invites
  getPending: () =>
    api.get("/invitations/pending")
};
