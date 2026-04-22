const crypto = require("node:crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");
const functionsV1 = require("firebase-functions/v1");
const { onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const ALLOWED_ORIGINS = [
  "https://www.eazykhata.in",
  "https://eazykhata.in",
  "https://www.easykhata.in",
  "https://easykhata.in",
  "https://www.easykhata.net",
  "https://easykhata.net",
  "https://ledger-app-599cc.web.app",
  "https://ledger-app-599cc.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Firebase-AppCheck");
  res.set("Access-Control-Max-Age", "3600");
}

async function verifyFirebaseAuth(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch {
    return null;
  }
}

function sendError(res, code, message) {
  const statusMap = {
    unauthenticated: 401,
    "permission-denied": 403,
    "not-found": 404,
    "invalid-argument": 400,
    "failed-precondition": 400,
    internal: 500
  };
  res.status(statusMap[code] || 500).json({ error: { status: code, message } });
}

async function verifyAdminAuth(req) {
  const authUser = await verifyFirebaseAuth(req);
  if (!authUser?.uid) {
    throw new HttpsError("unauthenticated", "Please sign in to continue.");
  }

  const userSnap = await db.collection("users").doc(authUser.uid).get();
  const userData = userSnap.exists ? userSnap.data() || {} : {};
  if (String(userData.role || "") !== "admin") {
    throw new HttpsError("permission-denied", "Admin access is required.");
  }

  return { authUser, userData };
}

admin.initializeApp();

const db = admin.firestore();
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

const PLAN_PRICES = {
  pro: { monthly: 49, yearly: 499 },
  business: { monthly: 99, yearly: 999 }
};

const PLAN_DURATION_DAYS = {
  monthly: 30,
  yearly: 365
};
const ENDPOINT_RATE_LIMITS_MS = {
  createOrder: 30 * 1000,
  verifyPayment: 15 * 1000
};

const ADMIN_DERIVATIVE_SYNC_LIMIT = 10000;

function getAdminOrgDocId(userId, orgId) {
  return `${userId}__${orgId}`;
}

function normalizeLocationLabel(value = "") {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const parts = clean
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
  const label = parts.length >= 2 ? parts.slice(-2).join(", ") : clean;
  return label.length > 28 ? `${label.slice(0, 28)}...` : label;
}

function buildLocationLabel({ addressLine = "", city = "", state = "", country = "" } = {}) {
  return [addressLine, city, state, country].map(part => String(part || "").trim()).filter(Boolean).join(", ");
}

function pushBucket(bucket, label, amount = 1) {
  if (!label) return;
  bucket[label] = (bucket[label] || 0) + amount;
}

function toDistribution(bucket, total, limitCount = null) {
  const items = Object.entries(bucket)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: total ? Math.round((count / total) * 100) : 0
    }));
  return Number.isFinite(limitCount) ? items.slice(0, limitCount) : items;
}

function getNormalizedUserOrgs(userData = {}) {
  const orgEntries = userData?.orgs && typeof userData.orgs === "object"
    ? Object.entries(userData.orgs).filter(([, orgValue]) => orgValue && typeof orgValue === "object")
    : [];

  if (orgEntries.length) {
    return orgEntries;
  }

  const fallbackOrgId = String(userData.activeOrgId || "org_primary");
  return [[fallbackOrgId, { account: { organizationType: userData.organizationType || "small_business" } }]];
}

function buildAdminUserOrgStatsDoc(userId, userData = {}) {
  const orgEntries = getNormalizedUserOrgs(userData);
  const nowIso = new Date().toISOString();
  return {
    userId,
    orgCount: orgEntries.length,
    hasMultipleOrgs: orgEntries.length > 1,
    sharedLedgerLinked: Boolean(userData.sharedLedgerId),
    updatedAt: nowIso
  };
}

function buildAdminUserProfileStatsDoc(userId, userData = {}) {
  const orgEntries = getNormalizedUserOrgs(userData);
  const profileLocation = normalizeLocationLabel(
    buildLocationLabel({
      city: userData.city || "",
      state: userData.state || "",
      country: userData.country || ""
    }) || userData.location || ""
  );
  const orgLocationSignals = orgEntries
    .map(([, orgValue]) => normalizeLocationLabel(buildLocationLabel({
      city: orgValue?.account?.city || "",
      state: orgValue?.account?.state || "",
      country: orgValue?.account?.country || ""
    }) || orgValue?.account?.location || orgValue?.account?.address || ""))
    .filter(Boolean);
  const totalSessionMs = Number(userData?.analytics?.totalSessionMs || 0);

  return {
    userId,
    planLabel: userData.plan === "business" ? "Business" : userData.plan === "pro" ? "Pro" : "Free",
    subscriptionLabel: userData.subscriptionStatus === "trial" ? "Trial" : userData.subscriptionStatus === "active" ? "Active" : "Inactive",
    gender: String(userData.gender || "").trim(),
    ageGroup: String(userData.ageGroup || "").trim(),
    profileLocation,
    hasLocationSignal: Boolean(profileLocation || orgLocationSignals.length),
    hasGenderSignal: Boolean(String(userData.gender || "").trim()),
    hasAgeSignal: Boolean(String(userData.ageGroup || "").trim()),
    hasSessionSignal: totalSessionMs > 0,
    totalSessionMs,
    updatedAt: new Date().toISOString()
  };
}

function buildAdminOrganizationDocs(userId, userData = {}) {
  const orgEntries = getNormalizedUserOrgs(userData);
  const nowIso = new Date().toISOString();
  const profileLocation = normalizeLocationLabel(
    buildLocationLabel({
      city: userData.city || "",
      state: userData.state || "",
      country: userData.country || ""
    }) || userData.location || ""
  );

  return orgEntries.map(([orgId, orgValue]) => ({
    id: getAdminOrgDocId(userId, orgId),
    data: {
      ownerUserId: userId,
      orgId,
      orgName: String(orgValue?.account?.name || "").trim(),
      orgType: String(orgValue?.account?.organizationType || userData.organizationType || "small_business"),
      marketLabel: normalizeLocationLabel(
        buildLocationLabel({
          city: orgValue?.account?.city || "",
          state: orgValue?.account?.state || "",
          country: orgValue?.account?.country || ""
        }) || orgValue?.account?.location || orgValue?.account?.address || profileLocation
      ),
      sharedLedgerLinked: Boolean(userData.sharedLedgerId),
      updatedAt: nowIso
    }
  }));
}

async function syncAdminOrgDerivedDocsForUser(userId, beforeData, afterData) {
  const batch = db.batch();
  const userStatsRef = db.collection("admin_user_org_stats").doc(userId);
  const userProfileStatsRef = db.collection("admin_user_profile_stats").doc(userId);
  const beforeOrgIds = new Set(getNormalizedUserOrgs(beforeData).map(([orgId]) => orgId));
  const afterOrgIds = new Set(afterData ? getNormalizedUserOrgs(afterData).map(([orgId]) => orgId) : []);

  if (afterData) {
    batch.set(userStatsRef, buildAdminUserOrgStatsDoc(userId, afterData), { merge: true });
    batch.set(userProfileStatsRef, buildAdminUserProfileStatsDoc(userId, afterData), { merge: true });
    buildAdminOrganizationDocs(userId, afterData).forEach(orgDoc => {
      batch.set(db.collection("admin_organizations").doc(orgDoc.id), orgDoc.data, { merge: true });
    });
  } else {
    batch.delete(userStatsRef);
    batch.delete(userProfileStatsRef);
  }

  beforeOrgIds.forEach(orgId => {
    if (!afterOrgIds.has(orgId)) {
      batch.delete(db.collection("admin_organizations").doc(getAdminOrgDocId(userId, orgId)));
    }
  });

  await batch.commit();
}

async function bootstrapAdminOrgDerivedDocs(totalUsers) {
  if (totalUsers > ADMIN_DERIVATIVE_SYNC_LIMIT) {
    return false;
  }

  const usersRef = db.collection("users");
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const pageQuery = cursor
      ? usersRef.orderBy(admin.firestore.FieldPath.documentId()).startAfter(cursor).limit(250)
      : usersRef.orderBy(admin.firestore.FieldPath.documentId()).limit(250);
    const snap = await pageQuery.get();
    if (!snap.docs.length) break;

    let batch = db.batch();
    let writeCount = 0;
    for (const userDoc of snap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() || {};
      batch.set(db.collection("admin_user_org_stats").doc(userId), buildAdminUserOrgStatsDoc(userId, userData), { merge: true });
      writeCount += 1;
      batch.set(db.collection("admin_user_profile_stats").doc(userId), buildAdminUserProfileStatsDoc(userId, userData), { merge: true });
      writeCount += 1;

      buildAdminOrganizationDocs(userId, userData).forEach(orgDoc => {
        batch.set(db.collection("admin_organizations").doc(orgDoc.id), orgDoc.data, { merge: true });
        writeCount += 1;
      });

      if (writeCount >= 400) {
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
      }
    }

    if (writeCount > 0) {
      await batch.commit();
    }

    cursor = snap.docs[snap.docs.length - 1].id;
    hasMore = snap.docs.length === 250;
  }

  return true;
}

function getRazorpayConfig() {
  const keyId = RAZORPAY_KEY_ID.value() || "";
  const keySecret = RAZORPAY_KEY_SECRET.value() || "";
  const webhookSecret = RAZORPAY_WEBHOOK_SECRET.value() || "";
  if (!keyId || !keySecret) {
    throw new HttpsError("failed-precondition", "Payment gateway is not configured.");
  }
  return { keyId, keySecret, webhookSecret };
}

function getValidatedPlan(inputPlan) {
  const plan = String(inputPlan || "pro").trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan)) {
    throw new HttpsError("invalid-argument", "Invalid plan selected.");
  }
  return plan;
}

function getValidatedBillingCycle(inputCycle) {
  const cycle = String(inputCycle || "monthly").trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(PLAN_DURATION_DAYS, cycle)) {
    throw new HttpsError("invalid-argument", "Invalid billing cycle selected.");
  }
  return cycle;
}

function getAmountInPaise(plan, billingCycle) {
  const amountInRs = PLAN_PRICES?.[plan]?.[billingCycle] || 0;
  if (!Number.isFinite(amountInRs) || amountInRs <= 0) {
    throw new HttpsError("invalid-argument", "Unable to determine billing amount.");
  }
  return Math.round(amountInRs * 100);
}

function getActiveOrgType(userData = {}) {
  const activeOrgId = String(userData?.activeOrgId || "");
  const orgs = userData?.orgs && typeof userData.orgs === "object" ? userData.orgs : {};
  const activeOrg = activeOrgId && orgs[activeOrgId] ? orgs[activeOrgId] : Object.values(orgs)[0];
  return String(activeOrg?.account?.organizationType || userData?.organizationType || "small_business").trim().toLowerCase();
}

function assertBusinessPlanEligibility(userData = {}, requestedPlan = "pro") {
  if (String(requestedPlan || "").toLowerCase() !== "business") return;
  throw new HttpsError("failed-precondition", "Business plan subscriptions are temporarily disabled and will return in a future release.");
}

function isMatchingHexSignature(expectedHex, providedHex) {
  const expected = Buffer.from(String(expectedHex || ""), "hex");
  const provided = Buffer.from(String(providedHex || ""), "hex");
  if (!expected.length || !provided.length || expected.length !== provided.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, provided);
}

function computeSubscriptionEndDate(currentEndsAt, durationDays) {
  const now = new Date();
  const currentEnd = currentEndsAt ? new Date(currentEndsAt) : null;
  const baseDate = currentEnd && !Number.isNaN(currentEnd.getTime()) && currentEnd > now ? currentEnd : now;
  const next = new Date(baseDate);
  next.setDate(next.getDate() + durationDays);
  return next.toISOString();
}

async function assertEndpointRateLimit(userId, endpointKey, minIntervalMs) {
  const ref = db.collection("rate_limits").doc(`${userId}:${endpointKey}`);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const nowMs = Date.now();
    const lastAtMs = snap.exists ? Number(snap.data()?.lastAtMs || 0) : 0;
    if (lastAtMs && nowMs - lastAtMs < minIntervalMs) {
      throw new HttpsError("failed-precondition", "Please wait a few seconds before retrying.");
    }
    tx.set(ref, { userId, endpointKey, lastAtMs: nowMs, updatedAt: new Date(nowMs).toISOString() }, { merge: true });
  });
}

function getMonthWindow(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

async function applySubscriptionUpgrade({ userId, requestedPlan, billingCycle, paymentRequestId, paymentId, source }) {
  const userRef = db.collection("users").doc(userId);
  const requestRef = db.collection("payment_requests").doc(paymentRequestId);

  await db.runTransaction(async tx => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User account not found.");
    }

    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists) {
      throw new HttpsError("not-found", "Payment request not found.");
    }

    const requestData = requestSnap.data() || {};
    const currentStatus = String(requestData.status || "pending").toLowerCase();
    if (currentStatus === "approved" || currentStatus === "auto_approved") {
      return;
    }
    const expectedAmountPaise = getAmountInPaise(requestedPlan, billingCycle);
    const requestAmountPaise = Number(requestData.amountPaise || 0);
    if (!Number.isFinite(requestAmountPaise) || requestAmountPaise !== expectedAmountPaise) {
      throw new HttpsError("failed-precondition", "Payment request amount does not match the selected plan.");
    }

    const duration = PLAN_DURATION_DAYS[billingCycle];
    const currentUser = userSnap.data() || {};
    assertBusinessPlanEligibility(currentUser, requestedPlan);
    const nextEndDate = computeSubscriptionEndDate(currentUser.subscriptionEndsAt || "", duration);
    const nowIso = new Date().toISOString();

    tx.update(userRef, {
      plan: requestedPlan,
      subscriptionStatus: "active",
      subscriptionEndsAt: nextEndDate,
      trialEligible: false,
      updatedAt: nowIso,
      lastActivityAt: nowIso
    });

    tx.set(
      requestRef,
      {
        status: "approved",
        approvalMode: source,
        reviewedAt: nowIso,
        reviewedBy: source,
        processedPaymentId: paymentId || requestData.processedPaymentId || "",
        updatedAt: nowIso
      },
      { merge: true }
    );
  });
}

async function refreshAdminMetricsSnapshotInternal(triggeredBy = "system-scheduled") {
  const usersRef = db.collection("users");
  const paymentsRef = db.collection("payment_requests");
  const ticketsRef = db.collection("support_tickets");
  const userOrgStatsRef = db.collection("admin_user_org_stats");
  const userProfileStatsRef = db.collection("admin_user_profile_stats");
  const organizationsRef = db.collection("admin_organizations");
  const currentMonth = getMonthWindow();

  const [
    totalUsersAgg,
    blockedUsersAgg,
    trialUsersAgg,
    proUsersAgg,
    businessUsersAgg,
    pendingRequestsAgg,
    approvedRequestsAgg,
    rejectedRequestsAgg,
    supportOpenAgg,
    supportInProgressAgg,
    supportResolvedAgg,
    userOrgStatsAgg,
    userProfileStatsAgg,
    currentMonthUsersSnap,
    currentMonthPaymentsSnap
  ] = await Promise.all([
    usersRef.count().get(),
    usersRef.where("blocked", "==", true).count().get(),
    usersRef.where("subscriptionStatus", "==", "trial").count().get(),
    usersRef.where("plan", "==", "pro").count().get(),
    usersRef.where("plan", "==", "business").count().get(),
    paymentsRef.where("status", "==", "pending").count().get(),
    paymentsRef.where("status", "==", "approved").count().get(),
    paymentsRef.where("status", "==", "rejected").count().get(),
    ticketsRef.where("status", "==", "open").count().get(),
    ticketsRef.where("status", "==", "in_progress").count().get(),
    ticketsRef.where("status", "==", "resolved").count().get(),
    userOrgStatsRef.count().get(),
    userProfileStatsRef.count().get(),
    usersRef.where("createdAt", ">=", currentMonth.startIso).where("createdAt", "<", currentMonth.endIso).get(),
    paymentsRef.where("updatedAt", ">=", currentMonth.startIso).where("updatedAt", "<", currentMonth.endIso).get()
  ]);

  const totalUsers = Number(totalUsersAgg.data().count || 0);
  const blockedUsers = Number(blockedUsersAgg.data().count || 0);
  const premiumUsers = Number(proUsersAgg.data().count || 0) + Number(businessUsersAgg.data().count || 0);
  let derivedReady = Number(userOrgStatsAgg.data().count || 0) === totalUsers && Number(userProfileStatsAgg.data().count || 0) === totalUsers;

  if (!derivedReady && totalUsers > 0) {
    const bootstrapped = await bootstrapAdminOrgDerivedDocs(totalUsers);
    if (bootstrapped) {
      const [refreshedUserOrgStatsAgg, refreshedUserProfileStatsAgg] = await Promise.all([
        userOrgStatsRef.count().get(),
        userProfileStatsRef.count().get()
      ]);
      derivedReady = Number(refreshedUserOrgStatsAgg.data().count || 0) === totalUsers && Number(refreshedUserProfileStatsAgg.data().count || 0) === totalUsers;
    }
  }

  let totalOrganizations = null;
  let multiOrgUsers = null;
  let sharedLedgerUsers = null;
  let distributions = null;
  let readiness = null;
  if (derivedReady) {
    const [organizationsAgg, multiOrgUsersAgg, sharedLedgerUsersAgg] = await Promise.all([
      organizationsRef.count().get(),
      userOrgStatsRef.where("hasMultipleOrgs", "==", true).count().get(),
      userOrgStatsRef.where("sharedLedgerLinked", "==", true).count().get()
    ]);
    totalOrganizations = Number(organizationsAgg.data().count || 0);
    multiOrgUsers = Number(multiOrgUsersAgg.data().count || 0);
    sharedLedgerUsers = Number(sharedLedgerUsersAgg.data().count || 0);

    const profileBucketCounts = {
      planMix: {},
      statusMix: {},
      genderMix: {},
      ageMix: {}
    };
    const orgBucketCounts = {
      orgTypeMix: {},
      locationMix: {}
    };
    let locationCoverageUsers = 0;
    let genderCoverageUsers = 0;
    let ageCoverageUsers = 0;
    let sessionCoverageUsers = 0;

    let profileCursor = null;
    let profileHasMore = true;
    while (profileHasMore) {
      const profileQuery = profileCursor
        ? userProfileStatsRef.orderBy(admin.firestore.FieldPath.documentId()).startAfter(profileCursor).limit(500)
        : userProfileStatsRef.orderBy(admin.firestore.FieldPath.documentId()).limit(500);
      const snap = await profileQuery.get();
      if (!snap.docs.length) break;

      snap.docs.forEach(item => {
        const data = item.data() || {};
        pushBucket(profileBucketCounts.planMix, data.planLabel);
        pushBucket(profileBucketCounts.statusMix, data.subscriptionLabel);
        pushBucket(profileBucketCounts.genderMix, data.gender);
        pushBucket(profileBucketCounts.ageMix, data.ageGroup);
        if (data.hasLocationSignal) locationCoverageUsers += 1;
        if (data.hasGenderSignal) genderCoverageUsers += 1;
        if (data.hasAgeSignal) ageCoverageUsers += 1;
        if (data.hasSessionSignal) sessionCoverageUsers += 1;
      });

      profileCursor = snap.docs[snap.docs.length - 1].id;
      profileHasMore = snap.docs.length === 500;
    }

    let orgCursor = null;
    let orgHasMore = true;
    while (orgHasMore) {
      const orgQuery = orgCursor
        ? organizationsRef.orderBy(admin.firestore.FieldPath.documentId()).startAfter(orgCursor).limit(500)
        : organizationsRef.orderBy(admin.firestore.FieldPath.documentId()).limit(500);
      const snap = await orgQuery.get();
      if (!snap.docs.length) break;

      snap.docs.forEach(item => {
        const data = item.data() || {};
        pushBucket(orgBucketCounts.orgTypeMix, data.orgType);
        pushBucket(orgBucketCounts.locationMix, data.marketLabel);
      });

      orgCursor = snap.docs[snap.docs.length - 1].id;
      orgHasMore = snap.docs.length === 500;
    }

    distributions = {
      planMix: toDistribution(profileBucketCounts.planMix, totalUsers),
      statusMix: toDistribution(profileBucketCounts.statusMix, totalUsers),
      orgTypeMix: toDistribution(orgBucketCounts.orgTypeMix, Math.max(1, totalOrganizations), 5),
      locationMix: toDistribution(orgBucketCounts.locationMix, Math.max(1, totalOrganizations), 6),
      genderMix: toDistribution(profileBucketCounts.genderMix, totalUsers),
      ageMix: toDistribution(profileBucketCounts.ageMix, totalUsers)
    };
    readiness = {
      locationCoverage: totalUsers ? Math.round((locationCoverageUsers / totalUsers) * 100) : 0,
      genderCoverage: totalUsers ? Math.round((genderCoverageUsers / totalUsers) * 100) : 0,
      ageCoverage: totalUsers ? Math.round((ageCoverageUsers / totalUsers) * 100) : 0,
      sessionCoverage: totalUsers ? Math.round((sessionCoverageUsers / totalUsers) * 100) : 0
    };
  }

  const currentMonthUsers = currentMonthUsersSnap.docs.map(item => item.data() || {});
  const currentMonthPayments = currentMonthPaymentsSnap.docs.map(item => item.data() || {});
  const currentMonthApprovedPayments = currentMonthPayments.filter(item => String(item.status || "").toLowerCase() === "approved");
  const payload = {
    generatedAt: new Date().toISOString(),
    source: triggeredBy,
    stats: {
      totalUsers,
      activeUsers: Math.max(0, totalUsers - blockedUsers),
      blockedUsers,
      premiumUsers,
      totalOrganizations,
      multiOrgUsers,
      sharedLedgerUsers,
      trialUsers: Number(trialUsersAgg.data().count || 0),
      pendingRequests: Number(pendingRequestsAgg.data().count || 0),
      approvedRequests: Number(approvedRequestsAgg.data().count || 0),
      rejectedRequests: Number(rejectedRequestsAgg.data().count || 0),
      supportOpen: Number(supportOpenAgg.data().count || 0),
      supportInProgress: Number(supportInProgressAgg.data().count || 0),
      supportResolved: Number(supportResolvedAgg.data().count || 0)
    },
    derivations: {
      orgCollectionsReady: derivedReady
    },
    distributions,
    periods: {
      currentMonth: {
        key: currentMonth.key,
        newUsers: currentMonthUsers.length,
        newPremiumUsers: currentMonthUsers.filter(item => ["pro", "business"].includes(String(item.plan || "").toLowerCase())).length,
        approvedAmount: currentMonthApprovedPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        approvedRequests: currentMonthApprovedPayments.length
      }
    },
    readiness
  };

  await db.collection("admin_metrics").doc("global").set(payload, { merge: true });
  return payload;
}

exports.syncAdminOrgDerivedDocs = functionsV1.region("asia-south1").firestore.document("users/{userId}").onWrite(async (change, context) => {
  const userId = context.params.userId;
  const beforeData = change.before.exists ? change.before.data() || {} : null;
  const afterData = change.after.exists ? change.after.data() || {} : null;
  await syncAdminOrgDerivedDocsForUser(userId, beforeData, afterData);
});

exports.createUpiSubscriptionOrder = onRequest({ region: "asia-south1", invoker: "public", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  const authUser = await verifyFirebaseAuth(req);
  if (!authUser?.uid) { sendError(res, "unauthenticated", "Please sign in to continue."); return; }

  let keyId, keySecret;
  try {
    ({ keyId, keySecret } = getRazorpayConfig());
  } catch (e) {
    sendError(res, "failed-precondition", e.message); return;
  }
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  let targetPlan, billingCycle;
  try {
    targetPlan = getValidatedPlan(req.body?.data?.targetPlan);
    billingCycle = getValidatedBillingCycle(req.body?.data?.billingCycle);
  } catch (e) {
    sendError(res, "invalid-argument", e.message); return;
  }
  const note = String(req.body?.data?.note || "").trim().slice(0, 300);
  const amount = getAmountInPaise(targetPlan, billingCycle);
  const userId = authUser.uid;
  try {
    await assertEndpointRateLimit(userId, "create-order", ENDPOINT_RATE_LIMITS_MS.createOrder);
  } catch (err) {
    sendError(res, err.code || "failed-precondition", err.message || "Please wait a few seconds before retrying.");
    return;
  }

  const userSnap = await db.collection("users").doc(userId).get();
  const userData = userSnap.exists ? userSnap.data() || {} : {};
  try {
    assertBusinessPlanEligibility(userData, targetPlan);
  } catch (err) {
    sendError(res, err.code || "failed-precondition", err.message || "Selected plan is not allowed.");
    return;
  }

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `sub_${userId.slice(0, 8)}_${Date.now()}`,
    notes: { userId, requestedPlan: targetPlan, billingCycle }
  });

  const nowIso = new Date().toISOString();
  await db.collection("payment_requests").doc(order.id).set(
    {
      userId,
      userName: userData.name || "",
      userEmail: userData.email || "",
      currentPlan: userData.plan || "free",
      requestedPlan: targetPlan,
      billingCycle,
      amount: Math.round(amount / 100),
      amountPaise: amount,
      currency: "INR",
      paymentMethod: "razorpay",
      gateway: "razorpay",
      gatewayOrderId: order.id,
      transactionId: "",
      screenshotStatus: "not-required",
      supportEmail: "",
      status: "pending",
      note,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    { merge: true }
  );

  res.status(200).json({ data: { keyId, orderId: order.id, amount, currency: order.currency || "INR" } });
});

exports.verifyUpiSubscriptionPayment = onRequest({ region: "asia-south1", invoker: "public", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  const authUser = await verifyFirebaseAuth(req);
  if (!authUser?.uid) { sendError(res, "unauthenticated", "Please sign in to continue."); return; }

  let keySecret;
  try {
    ({ keySecret } = getRazorpayConfig());
  } catch (e) {
    sendError(res, "failed-precondition", e.message); return;
  }

  const orderId = String(req.body?.data?.orderId || "").trim();
  const paymentId = String(req.body?.data?.paymentId || "").trim();
  const signature = String(req.body?.data?.signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    sendError(res, "invalid-argument", "Incomplete payment confirmation received."); return;
  }

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (!isMatchingHexSignature(expected, signature)) {
    sendError(res, "permission-denied", "Payment signature verification failed."); return;
  }

  const requestSnap = await db.collection("payment_requests").doc(orderId).get();
  if (!requestSnap.exists) {
    sendError(res, "not-found", "Payment request was not found."); return;
  }

  const requestData = requestSnap.data() || {};
  if (String(requestData.userId || "") !== authUser.uid) {
    sendError(res, "permission-denied", "Payment request does not belong to this user."); return;
  }
  try {
    await assertEndpointRateLimit(authUser.uid, "verify-payment", ENDPOINT_RATE_LIMITS_MS.verifyPayment);
  } catch (err) {
    sendError(res, err.code || "failed-precondition", err.message || "Please wait a few seconds before retrying.");
    return;
  }

  let requestedPlan, billingCycle;
  try {
    requestedPlan = getValidatedPlan(requestData.requestedPlan);
    billingCycle = getValidatedBillingCycle(requestData.billingCycle);
  } catch (e) {
    sendError(res, "invalid-argument", e.message); return;
  }

  await applySubscriptionUpgrade({
    userId: authUser.uid,
    requestedPlan,
    billingCycle,
    paymentRequestId: orderId,
    paymentId,
    source: "system-callable"
  });

  await db.collection("payment_requests").doc(orderId).set(
    {
      gatewayPaymentId: paymentId,
      gatewaySignatureVerified: true,
      transactionId: paymentId,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  res.status(200).json({ data: { success: true } });
});

exports.refreshAdminMetricsNow = onRequest({ region: "asia-south1", invoker: "public" }, async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("Method not allowed"); return; }

  try {
    const { authUser } = await verifyAdminAuth(req);
    const snapshot = await refreshAdminMetricsSnapshotInternal(`manual:${authUser.uid}`);
    res.status(200).json({ data: { success: true, generatedAt: snapshot.generatedAt, stats: snapshot.stats } });
  } catch (err) {
    if (err instanceof HttpsError) {
      sendError(res, err.code, err.message);
      return;
    }

    logger.error("Manual admin metrics refresh failed", err);
    sendError(res, "internal", "Unable to refresh admin metrics right now.");
  }
});

exports.razorpayWebhook = onRequest({ region: "asia-south1", invoker: "public", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const { webhookSecret } = getRazorpayConfig();
    if (!webhookSecret) {
      logger.error("Webhook secret missing.");
      res.status(500).send("Webhook not configured");
      return;
    }

    const signature = String(req.headers["x-razorpay-signature"] || "");
    const expected = crypto.createHmac("sha256", webhookSecret).update(req.rawBody).digest("hex");
    if (!signature || !isMatchingHexSignature(expected, signature)) {
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body || {};
    const eventType = String(event.event || "");
    const paymentEntity = event?.payload?.payment?.entity || {};
    const orderId = String(paymentEntity.order_id || "");
    const paymentId = String(paymentEntity.id || "");

    if (!orderId || !paymentId) {
      res.status(200).send("Ignored");
      return;
    }

    const requestSnap = await db.collection("payment_requests").doc(orderId).get();
    if (!requestSnap.exists) {
      res.status(200).send("No matching request");
      return;
    }

    const requestData = requestSnap.data() || {};
    const requestedPlan = getValidatedPlan(requestData.requestedPlan);
    const billingCycle = getValidatedBillingCycle(requestData.billingCycle);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      await applySubscriptionUpgrade({
        userId: requestData.userId,
        requestedPlan,
        billingCycle,
        paymentRequestId: orderId,
        paymentId,
        source: "system-webhook"
      });

      await db.collection("payment_requests").doc(orderId).set(
        {
          gatewayPaymentId: paymentId,
          transactionId: paymentId,
          webhookEvent: eventType,
          gatewayWebhookVerified: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    res.status(200).send("OK");
  } catch (err) {
    logger.error("Webhook processing failed", err);
    res.status(500).send("Webhook error");
  }
});

exports.refreshAdminMetricsSnapshot = onSchedule(
  {
    region: "asia-south1",
    schedule: "every 6 hours",
    timeZone: "Asia/Kolkata"
  },
  async () => {
    try {
      await refreshAdminMetricsSnapshotInternal("scheduled-aggregate");
    } catch (err) {
      logger.error("Failed to refresh admin metrics snapshot", err);
      throw err;
    }
  }
);
