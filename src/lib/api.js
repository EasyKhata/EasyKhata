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
  patch:  (path, body)  => request("PATCH",  path, body),
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

  // Load everything (or just metadata) for one org.
  // since    — ISO string: only return rows updated after this timestamp (incremental).
  // metaOnly — true: skip income/expenses/invoices/customers; return org settings + orgRecords only.
  // Returns: { ...orgSettings, income[], expenses[], invoices[], customers[], orgRecords{}, syncedAt, isPartial, isMetaOnly }
  getFull: (userId, orgId, since, { metaOnly = false } = {}) => {
    const params = new URLSearchParams();
    if (since)    params.set("since", since);
    if (metaOnly) params.set("meta",  "1");
    const qs = params.toString();
    return api.get(`/users/${userId}/orgs/${orgId}/full${qs ? `?${qs}` : ""}`);
  },

  // Fetch one page of a collection (paginated).
  // cursor — ISO string of the last updatedAt seen (omit for first page)
  // Returns: { records, hasMore, nextCursor }
  getCollection: (userId, orgId, collectionKey, cursor) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return api.get(`/users/${userId}/orgs/${orgId}/${collectionKey}${qs}`);
  },

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

  // Delta sync — send only changed/new records to upsert and IDs to delete.
  // Much cheaper than syncCollection for incremental saves.
  syncDelta: (userId, orgId, collectionKey, delta) =>
    api.patch(`/users/${userId}/orgs/${orgId}/${collectionKey}/sync-delta`, delta),

  // Sync orgRecords map { "YYYY-MM": [...] }
  syncOrgRecords: (userId, orgId, orgRecordsMap) =>
    api.post(`/users/${userId}/orgs/${orgId}/org-records/sync`, orgRecordsMap),

  // Delete all orgRecords for an org (called on org type change to avoid stale data)
  clearOrgRecords: (userId, orgId) =>
    api.delete(`/users/${userId}/orgs/${orgId}/org-records`),

  // Pre-computed dashboard summary (month totals, YTD, overdue, budget alerts)
  getSummary: (userId, orgId) =>
    api.get(`/users/${userId}/orgs/${orgId}/summary`),

  // Full dashboard analytics (all stats for the requested year/month/viewMode)
  getDashboard: (userId, orgId, year, month, viewMode) =>
    api.get(`/users/${userId}/orgs/${orgId}/dashboard?year=${year}&month=${month}&viewMode=${viewMode}`),

  // Customer directory enriched with invoice revenue, outstanding, risk
  getCustomerInsights: (userId, orgId) =>
    api.get(`/users/${userId}/orgs/${orgId}/customer-insights`),

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

// ── Support Tickets ───────────────────────────────────────────────────────────

export const supportApi = {
  list: () =>
    api.get("/support-tickets"),

  create: (payload) =>
    api.post("/support-tickets", payload),

  reply: (ticketId, message) =>
    api.post(`/support-tickets/${ticketId}/reply`, { message })
};

// ── Society Portal ────────────────────────────────────────────────────────────

export const societyApi = {
  // Admin
  getPortal: (orgId) =>
    api.get(`/society/portal?orgId=${encodeURIComponent(orgId)}`),

  savePortal: (orgId, name) =>
    api.put("/society/portal", { orgId, name }),

  createInvite: (orgId, flatNumber, allowedEmail) =>
    api.post("/society/portal/invites", { orgId, flatNumber, allowedEmail }),

  deactivateInvite: (code) =>
    api.put(`/society/portal/invites/${code}`, {}),

  publish: (orgId, period, commonRecord, flatRows) =>
    api.post("/society/portal/publish", { orgId, period, commonRecord, flatRows }),

  // Member
  join: (inviteCode) =>
    api.post("/society/join", { inviteCode }),

  leave: () =>
    api.post("/society/leave", {}),

  getMemberView: (period) =>
    api.get(`/society/member?period=${encodeURIComponent(period)}`)
};

// ── Discussion Messages ───────────────────────────────────────────────────────

export const messagesApi = {
  // Load all messages (or only new ones when after=ISO is provided)
  list: (ownerId, orgId, after) => {
    const qs = after ? `?after=${encodeURIComponent(after)}` : "";
    return api.get(`/users/${ownerId}/orgs/${orgId}/messages${qs}`);
  },

  // Send a new message
  send: (ownerId, orgId, payload) =>
    api.post(`/users/${ownerId}/orgs/${orgId}/messages`, payload),

  // Delete a message
  delete: (ownerId, orgId, messageId) =>
    api.delete(`/users/${ownerId}/orgs/${orgId}/messages/${messageId}`)
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  // Users
  listUsers: (page = 1, limit = 60) =>
    api.get(`/admin/users?page=${page}&limit=${limit}`),

  updateUser: (userId, updates) =>
    api.put(`/admin/users/${userId}`, updates),

  deleteUser: (userId) =>
    api.delete(`/admin/users/${userId}`),

  // Support tickets (paginated: { tickets, total, page, hasMore })
  listSupportTickets: (page = 1, limit = 50, status) =>
    api.get(`/admin/support-tickets?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),

  updateSupportTicket: (ticketId, updates) =>
    api.put(`/admin/support-tickets/${ticketId}`, updates),

  // Payment requests
  listPaymentRequests: () =>
    api.get("/admin/payment-requests"),

  updatePaymentRequest: (requestId, updates) =>
    api.put(`/admin/payment-requests/${requestId}`, updates)
};
