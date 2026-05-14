import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
// 20 s covers Railway cold-start (5–10 s for container wake + Firebase init + Postgres
// connect) plus normal latency on a marginal mobile network. The previous 12 s window
// timed out the very first call after the backend went idle, even though the user's
// connection was good enough for streaming services.
const REQUEST_TIMEOUT_MS = 20_000;

// ── Core fetch wrapper ────────────────────────────────────────────────────────
// Attaches the current Firebase ID token as Bearer on every request.
// Automatically refreshes the token if it's expired.

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const RETRYABLE_METHODS = new Set(["GET", "POST", "PUT", "PATCH"]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, method, path) {
  const maxAttempts = RETRYABLE_METHODS.has(method) ? 3 : 1;
  let lastError;
  const startedAt = Date.now();
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
      lastError = err;
      if (lastError && typeof lastError === "object") {
        lastError.attempt = attempt;
        lastError.attempts = maxAttempts;
      }
      if (attempt === maxAttempts) break;
      // Exponential backoff with jitter — bursty linear retries hit the same congested
      // window on a flaky network. Spread retries across 0.8 s, 1.6 s (+ random 0–400 ms).
      const baseDelay = 800 * Math.pow(2, attempt - 1);
      const jitter    = Math.random() * 400;
      await sleep(baseDelay + jitter);
    } finally {
      clearTimeout(timeout);
    }
  }
  if (lastError && typeof lastError === "object") {
    lastError.status = 0;
    lastError.code = lastError.code || "NETWORK_ERROR";
    lastError.method = method;
    lastError.path = path;
    lastError.url = url;
    lastError.durationMs = Date.now() - startedAt;
    lastError.online = typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : null;
    if (lastError.name === "AbortError") {
      lastError.code = "NETWORK_TIMEOUT";
      lastError.timeoutMs = REQUEST_TIMEOUT_MS;
    }
  }
  throw lastError;
}

async function request(method, path, body) {
  let token;
  try {
    token = await getIdToken();
  } catch (err) {
    if (err && typeof err === "object") {
      err.method = method;
      err.path = path;
      err.code = err.code || "AUTH_TOKEN_ERROR";
      err.online = typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : null;
    }
    throw err;
  }

  const res = await fetchWithRetry(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  }, method, path);

  if (!res.ok) {
    // Try JSON first (our routes return { error: "…" }), then fall back to the
    // raw text body (Express's default 404 HTML, proxy/edge HTML errors), then
    // finally to the status line. Without the text fallback the user saw
    // "Request failed: 404" with no hint that the route was missing on the
    // deployed server. We clone() so a failed JSON read doesn't consume the
    // body and prevent the text read.
    const clone = res.clone();
    let serverMsg = "";
    try {
      const parsed = await res.json();
      serverMsg = parsed?.error || "";
    } catch {
      try { serverMsg = (await clone.text()).slice(0, 200).trim(); } catch { /* ignore */ }
    }
    const error = new Error(serverMsg || `Request failed: ${res.status} ${res.statusText || ""}`.trim());
    error.status = res.status;
    error.method = method;
    error.path = path;
    error.serverMessage = serverMsg || null;
    throw error;
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

// Fire-and-forget warmup ping. Called when the user begins Google sign-in so the
// backend (often cold on Railway) wakes up while Google's auth popup is open. By
// the time the user picks their account and we call usersApi.get, the server is
// already warm — saving the post-auth window from a 10 s cold-start timeout.
let warmupInFlight = null;
export function warmupBackend() {
  if (warmupInFlight) return warmupInFlight;
  const controller = new AbortController();
  // 12 s covers Railway cold-start (5–10 s container wake + Firebase init).
  // The auth flow awaits this promise, so this is the max extra wait a
  // returning user sees on a cold server before their profile loads.
  const timeout = setTimeout(() => controller.abort(), 12_000);
  warmupInFlight = fetch(`${BASE_URL}/health`, { signal: controller.signal })
    .catch(() => {})
    .finally(() => {
      clearTimeout(timeout);
      // Allow another warmup attempt 90 s later.
      setTimeout(() => { warmupInFlight = null; }, 90_000);
    });
  return warmupInFlight;
}

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
    api.put(`/users/${userId}`, updates),

  // Permanently delete account and all data
  delete: (userId) =>
    api.delete(`/users/${userId}`),

  // Push-notification device tokens.
  registerDevice: (userId, payload) =>
    api.post(`/users/${userId}/devices`, payload),

  unregisterDevice: (userId, token) =>
    api.delete(`/users/${userId}/devices/${encodeURIComponent(token)}`),

  // Promotional push opt-in/out (transactional notifications are never gated).
  setMarketingPref: (userId, enabled) =>
    api.patch(`/users/${userId}/marketing-pref`, { enabled: !!enabled })
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

  transferOwnership: (userId, orgId, memberUid) =>
    api.post(`/users/${userId}/orgs/${orgId}/members/transfer-owner`, { memberUid }),

  // Called by the member themselves to leave a shared khata. The path's :userId
  // is the OWNER of the org; the caller's identity comes from the Bearer token.
  leave: (ownerId, orgId) =>
    api.post(`/users/${ownerId}/orgs/${orgId}/members/leave`),

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

// ── Announcements ─────────────────────────────────────────────────────────────

export const announcementsApi = {
  list: () =>
    api.get("/admin/announcements"),

  create: (data) =>
    api.post("/admin/announcements", data),

  delete: (id) =>
    api.delete(`/admin/announcements/${id}`)
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (userId) =>
    api.get(`/users/${userId}/payment-requests`)
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

  // Payment requests (paginated). Server returns { requests, total, page, hasMore }.
  listPaymentRequests: (page = 1, limit = 100, status) =>
    api.get(`/admin/payment-requests?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),

  updatePaymentRequest: (requestId, updates) =>
    api.put(`/admin/payment-requests/${requestId}`, updates),

  getAdAudienceInsights: () =>
    api.get("/admin/ad-audience-insights"),

  // Broadcasts — combined in-app announcement + optional push notification.
  // previewBroadcastAudience returns just the count so the admin can size
  // the audience before firing. createBroadcast does the actual send.
  previewBroadcastAudience: ({ plans = [], orgTypes = [], userIds = [] } = {}) => {
    const qs = new URLSearchParams();
    if (plans.length)    qs.set("plans",    plans.join(","));
    if (orgTypes.length) qs.set("orgTypes", orgTypes.join(","));
    if (userIds.length)  qs.set("userIds",  userIds.join(","));
    return api.get(`/admin/broadcasts/audience${qs.toString() ? `?${qs}` : ""}`);
  },

  createBroadcast: (payload) =>
    api.post("/admin/broadcasts", payload),

  // Ad campaigns — server-mediated CRUD so writes are audited and validated.
  // Reads are still done directly from Firestore for AdCarousel performance.
  createAdCampaign: (payload) =>
    api.post("/admin/ad-campaigns", payload),

  updateAdCampaign: (campaignId, payload) =>
    api.put(`/admin/ad-campaigns/${campaignId}`, payload),

  deleteAdCampaign: (campaignId) =>
    api.delete(`/admin/ad-campaigns/${campaignId}`)
};
