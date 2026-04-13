const crypto = require("node:crypto");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const db = admin.firestore();
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

const PLAN_PRICES = {
  pro: { monthly: 49, yearly: 499 },
  business: { monthly: 149, yearly: 1499 }
};

const PLAN_DURATION_DAYS = {
  monthly: 30,
  yearly: 365
};

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

function computeSubscriptionEndDate(currentEndsAt, durationDays) {
  const now = new Date();
  const currentEnd = currentEndsAt ? new Date(currentEndsAt) : null;
  const baseDate = currentEnd && !Number.isNaN(currentEnd.getTime()) && currentEnd > now ? currentEnd : now;
  const next = new Date(baseDate);
  next.setDate(next.getDate() + durationDays);
  return next.toISOString();
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

    const duration = PLAN_DURATION_DAYS[billingCycle];
    const currentUser = userSnap.data() || {};
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

exports.createUpiSubscriptionOrder = onCall({ region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async request => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Please sign in to continue.");
  }

  const { keyId, keySecret } = getRazorpayConfig();
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const targetPlan = getValidatedPlan(request.data?.targetPlan);
  const billingCycle = getValidatedBillingCycle(request.data?.billingCycle);
  const note = String(request.data?.note || "").trim().slice(0, 300);
  const amount = getAmountInPaise(targetPlan, billingCycle);

  const userId = request.auth.uid;
  const userSnap = await db.collection("users").doc(userId).get();
  const userData = userSnap.exists ? userSnap.data() || {} : {};

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `sub_${userId.slice(0, 8)}_${Date.now()}`,
    notes: {
      userId,
      requestedPlan: targetPlan,
      billingCycle
    }
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
      paymentMethod: "upi",
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

  return {
    keyId,
    orderId: order.id,
    amount,
    currency: order.currency || "INR"
  };
});

exports.verifyUpiSubscriptionPayment = onCall({ region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async request => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Please sign in to continue.");
  }

  const { keySecret } = getRazorpayConfig();
  const orderId = String(request.data?.orderId || "").trim();
  const paymentId = String(request.data?.paymentId || "").trim();
  const signature = String(request.data?.signature || "").trim();

  if (!orderId || !paymentId || !signature) {
    throw new HttpsError("invalid-argument", "Incomplete payment confirmation received.");
  }

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (expected !== signature) {
    throw new HttpsError("permission-denied", "Payment signature verification failed.");
  }

  const requestSnap = await db.collection("payment_requests").doc(orderId).get();
  if (!requestSnap.exists) {
    throw new HttpsError("not-found", "Payment request was not found.");
  }

  const requestData = requestSnap.data() || {};
  if (String(requestData.userId || "") !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Payment request does not belong to this user.");
  }

  const requestedPlan = getValidatedPlan(requestData.requestedPlan);
  const billingCycle = getValidatedBillingCycle(requestData.billingCycle);

  await applySubscriptionUpgrade({
    userId: request.auth.uid,
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

  return { success: true };
});

exports.razorpayWebhook = onRequest({ region: "asia-south1", secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET] }, async (req, res) => {
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
    if (!signature || signature !== expected) {
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
