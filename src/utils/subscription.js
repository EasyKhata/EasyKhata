export const PLANS = {
  FREE: "free",
  PRO: "pro",
  BUSINESS: "business"
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  TRIAL: "trial"
};

export const DEFAULT_TRIAL_DAYS = 7;
export const DEFAULT_MONTHLY_DAYS = 30;
export const DEFAULT_YEARLY_DAYS = 365;

export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  YEARLY: "yearly"
};

export const PAYMENT_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};

export const UPI_CONFIG = {
  payeeName: "EasyKhata",
  upiId: "yourupi@bank",
  monthlyAmount: 99,
  yearlyAmount: 999
};

export const PLAN_LABELS = {
  free: "Free",
  pro: "Pro",
  business: "Business"
};

const FREE_LIMITS = {
  invoices: 10,
  customers: 10
};

export function isAdminUser(user) {
  return user?.role === "admin";
}

export function getUserPlan(user) {
  if (isAdminUser(user)) return PLANS.BUSINESS;
  return user?.plan || PLANS.FREE;
}

export function getTrialEndDate(days = DEFAULT_TRIAL_DAYS) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function formatSubscriptionDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function getSubscriptionEndDate(days) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function getBillingAmount(cycle) {
  return cycle === BILLING_CYCLES.YEARLY ? UPI_CONFIG.yearlyAmount : UPI_CONFIG.monthlyAmount;
}

export function getBillingDuration(cycle) {
  return cycle === BILLING_CYCLES.YEARLY ? DEFAULT_YEARLY_DAYS : DEFAULT_MONTHLY_DAYS;
}

export function isTrialActive(user) {
  if (isAdminUser(user)) return true;
  if ((user?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE) !== SUBSCRIPTION_STATUS.TRIAL) return false;
  if (!user?.subscriptionEndsAt) return true;
  const endAt = new Date(user.subscriptionEndsAt);
  if (Number.isNaN(endAt.getTime())) return true;
  return endAt.getTime() >= Date.now();
}

export function isSubscriptionActive(user) {
  if (isAdminUser(user)) return true;
  const status = user?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE;
  if (status === SUBSCRIPTION_STATUS.ACTIVE) return true;
  if (status === SUBSCRIPTION_STATUS.TRIAL) return isTrialActive(user);
  return false;
}

export function canUseFeature(user, feature, usage = {}) {
  if (isAdminUser(user)) return true;
  const plan = getUserPlan(user);
  const active = isSubscriptionActive(user);

  if (!active && feature !== "basicBookkeeping") return false;

  switch (feature) {
    case "invoiceCreate":
      return plan !== PLANS.FREE || (usage.invoiceCount || 0) < FREE_LIMITS.invoices;
    case "customerCreate":
      return plan !== PLANS.FREE || (usage.customerCount || 0) < FREE_LIMITS.customers;
    case "invoicePdf":
    case "reports":
    case "notifications":
    case "smartDashboard":
    case "budgets":
    case "advancedInvoice":
      return plan === PLANS.PRO || plan === PLANS.BUSINESS;
    case "sharedLedger":
      return false;
    default:
      return true;
  }
}

export function getUpgradeCopy(feature) {
  switch (feature) {
    case "invoiceCreate":
      return {
        title: "Invoice limit reached",
        message: "Free plan includes up to 10 invoices. Upgrade to Pro to create unlimited invoices."
      };
    case "customerCreate":
      return {
        title: "Customer limit reached",
        message: "Free plan includes up to 10 customers. Upgrade to Pro to manage unlimited customers."
      };
    case "invoicePdf":
      return {
        title: "PDF export is a Pro feature",
        message: "Upgrade to Pro to download branded invoice PDFs for your customers."
      };
    case "reports":
      return {
        title: "Reports are available on Pro",
        message: "Upgrade to Pro to download monthly reports, GST summaries, and business insights."
      };
    case "notifications":
      return {
        title: "Smart alerts are available on Pro",
        message: "Upgrade to Pro to turn on reminder inbox features and notification-based alerts."
      };
    case "smartDashboard":
      return {
        title: "Advanced dashboard is available on Pro",
        message: "Upgrade to Pro to unlock burn rate, customer intelligence, and advanced financial insights."
      };
    case "budgets":
      return {
        title: "Budgets are available on Pro",
        message: "Upgrade to Pro to set category budgets and track overspending automatically."
      };
    case "sharedLedger":
      return {
        title: "Shared ledger is coming soon",
        message: "Shared ledger and team collaboration are planned for a future release."
      };
    default:
      return {
        title: "Upgrade required",
        message: "This feature is part of a higher plan. Contact admin to upgrade your account."
      };
  }
}

export function getPlanSummary(user) {
  const plan = getUserPlan(user);
  const status = user?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE;

  if (isAdminUser(user)) {
    return {
      title: "Owner access",
      message: "You have full admin access across all plan features."
    };
  }

  if (status === SUBSCRIPTION_STATUS.TRIAL && isTrialActive(user)) {
    const ends = formatSubscriptionDate(user?.subscriptionEndsAt);
    return {
      title: `${PLAN_LABELS[plan] || "Plan"} trial`,
      message: ends ? `Trial access is active until ${ends}.` : "Trial access is active for a limited period."
    };
  }

  if (status === SUBSCRIPTION_STATUS.INACTIVE) {
    return {
      title: `${PLAN_LABELS[plan] || "Plan"} inactive`,
      message: "Premium features are paused right now. Contact admin to reactivate this plan."
    };
  }

  return {
    title: `${PLAN_LABELS[plan] || "Free"} plan`,
    message:
      plan === PLANS.FREE
        ? "Basic bookkeeping is active. Upgrade to unlock premium invoicing, reports, alerts, and analytics."
        : `${PLAN_LABELS[plan] || "Plan"} access is active.`
  };
}
