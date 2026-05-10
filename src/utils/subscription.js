import { ORG_TYPES } from "./orgTypes.js";

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

export const DEFAULT_TRIAL_DAYS = 30;
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

export const PLAN_PRICES = {
  [PLANS.PRO]: { monthly: 99, yearly: 999 },
  [PLANS.BUSINESS]: { monthly: 199, yearly: 1999 }
};

export const PLAN_ORG_LIMITS = {
  [PLANS.FREE]: 0,
  [PLANS.PRO]: 2,
  [PLANS.BUSINESS]: 5
};

const PLAN_LIMITS = {
  [ORG_TYPES.FREELANCER]: {
    customers: 10,
    invoicesPerCustomerPerMonth: 10
  },
  [ORG_TYPES.APARTMENT]: {
    flats: 40
  }
};

export const UPI_CONFIG = {
  payeeName: "EazyKhata"
};

export const PLAN_LABELS = {
  free: "Free",
  pro: "Pro",
  business: "Business"
};

export const REVIEW_ACCESS_ENABLED = false;

export function isAdminUser(user) {
  return user?.role === "admin";
}

export function isReviewAccessEnabled() {
  return REVIEW_ACCESS_ENABLED;
}

export function isFreeOrgType(orgType) {
  return orgType === ORG_TYPES.PERSONAL;
}

export function hasBusinessPlan(user) {
  return getUserPlan(user) === PLANS.BUSINESS && isSubscriptionActive(user);
}

export function getOrgPlan(org) {
  return org?.plan || org?.account?.plan || "";
}

export function getOrgSubscriptionStatus(org) {
  return org?.subscriptionStatus || org?.account?.subscriptionStatus || "";
}

export function getOrgSubscriptionEndsAt(org) {
  return org?.subscriptionEndsAt || org?.account?.subscriptionEndsAt || "";
}

export function getUserPlan(user) {
  if (isAdminUser(user)) return PLANS.BUSINESS;
  return user?.plan || PLANS.FREE;
}

export function getPaidOrgLimit(planOrUser = PLANS.FREE) {
  const plan = typeof planOrUser === "string" ? planOrUser : getUserPlan(planOrUser);
  return PLAN_ORG_LIMITS[plan] ?? PLAN_ORG_LIMITS[PLANS.FREE];
}

export function getOwnedPaidOrgCount(organizations = []) {
  return (organizations || []).filter(org => !isFreeOrgType(org?.organizationType || org?.account?.organizationType)).length;
}

export function canCreatePaidOrg(user, organizations = [], planOverride = null) {
  if (isAdminUser(user)) return true;
  if (isReviewAccessEnabled()) return true;
  const plan = planOverride || getUserPlan(user);
  const paidLimit = getPaidOrgLimit(plan);
  return isSubscriptionActive({ ...user, plan }) && getOwnedPaidOrgCount(organizations) < paidLimit;
}

export function getMaxOrganizations(user) {
  if (isAdminUser(user)) return Infinity;
  return 1 + getPaidOrgLimit(user);
}

export function canChangeOrgType(user) {
  if (isAdminUser(user)) return true;
  return isSubscriptionActive(user);
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

export function getBillingAmount(cycle, plan = PLANS.PRO) {
  const prices = PLAN_PRICES[plan] || PLAN_PRICES[PLANS.PRO];
  return cycle === BILLING_CYCLES.YEARLY ? prices.yearly : prices.monthly;
}

export function getBillingDuration(cycle) {
  return cycle === BILLING_CYCLES.YEARLY ? DEFAULT_YEARLY_DAYS : DEFAULT_MONTHLY_DAYS;
}

export function isTrialActive(user, org = null) {
  if (isAdminUser(user)) return true;
  const status = getOrgSubscriptionStatus(org) || user?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE;
  if (status !== SUBSCRIPTION_STATUS.TRIAL) return false;
  const endsAt = getOrgSubscriptionEndsAt(org) || user?.subscriptionEndsAt || "";
  if (!endsAt) return true;
  const endAt = new Date(endsAt);
  if (Number.isNaN(endAt.getTime())) return true;
  return endAt.getTime() >= Date.now();
}

export function isSubscriptionActive(user, org = null) {
  if (isAdminUser(user)) return true;
  if (isReviewAccessEnabled()) return true;
  const orgType = org?.organizationType || org?.account?.organizationType;
  if (orgType && isFreeOrgType(orgType)) return true;

  // Pick the more permissive of (user-level, org-level). Either side can be the
  // canonical source depending on the propagation window:
  //   • Just paid via Razorpay → user-level is updated first, org-level may lag
  //     by a few seconds while the Cloud Function syncs to Postgres.
  //   • Org-specific admin overrides → org-level is the source of truth.
  // Honouring the higher-tier side closes the "paid but UI says free" hole
  // without weakening the org-type free-pass check above.
  const orgPlan = getOrgPlan(org);
  const userPlan = getUserPlan(user);
  const orgStatus = getOrgSubscriptionStatus(org);
  const userStatus = user?.subscriptionStatus;

  // If the user-level plan is paid + active, accept it even if the org row is
  // still on the pre-payment values. Same for trial.
  if ((userPlan === PLANS.PRO || userPlan === PLANS.BUSINESS) && userStatus === SUBSCRIPTION_STATUS.ACTIVE) {
    return true;
  }
  if (userStatus === SUBSCRIPTION_STATUS.TRIAL && isTrialActive(user, null)) {
    return true;
  }

  // Otherwise fall back to the org-level evaluation (the previous behavior).
  const plan = orgPlan || userPlan;
  const status = orgStatus || userStatus;
  if (plan === PLANS.FREE && status !== SUBSCRIPTION_STATUS.TRIAL) return false;
  if (status === SUBSCRIPTION_STATUS.TRIAL) return isTrialActive(user, org);
  if (!status || status === SUBSCRIPTION_STATUS.ACTIVE) return plan === PLANS.PRO || plan === PLANS.BUSINESS;
  return false;
}

export function isPaidActive(user, org = null) {
  if (isAdminUser(user)) return true;
  const plan = getOrgPlan(org) || getUserPlan(user);
  return (plan === PLANS.PRO || plan === PLANS.BUSINESS) && isSubscriptionActive(user, org);
}

export function isFreeReadOnlyMode(user, orgType, org = null) {
  if (isAdminUser(user)) return false;
  if (isReviewAccessEnabled()) return false;
  if (orgType && isFreeOrgType(orgType)) return false;
  return !isSubscriptionActive(user, org);
}

export function canUseFeature(user, feature, usage = {}, orgType = ORG_TYPES.FREELANCER, org = null) {
  if (isAdminUser(user)) return true;
  if (isReviewAccessEnabled()) return feature !== "sharedLedger";

  if (isFreeOrgType(orgType)) {
    if (feature === "apartmentFlatCreate" || feature === "sharedLedger" || feature === "reports") return false;
    return true;
  }

  const plan = getOrgPlan(org) || getUserPlan(user);
  const active = isSubscriptionActive(user, org);

  if (!active) {
    return feature === "basicBookkeeping" || feature === "invoicePdf" || feature === "reports";
  }

  switch (feature) {
    case "customerCreate": {
      if (orgType === ORG_TYPES.FREELANCER) {
        return (usage.customerCount || 0) < PLAN_LIMITS[ORG_TYPES.FREELANCER].customers;
      }
      if (orgType === ORG_TYPES.APARTMENT) {
        return (usage.flatCount || 0) < PLAN_LIMITS[ORG_TYPES.APARTMENT].flats;
      }
      return true;
    }

    case "invoiceCreate": {
      if (orgType === ORG_TYPES.FREELANCER) {
        return (usage.invoiceCountForCustomer || 0) < PLAN_LIMITS[ORG_TYPES.FREELANCER].invoicesPerCustomerPerMonth;
      }
      return true;
    }

    case "apartmentFlatCreate": {
      if (orgType !== ORG_TYPES.APARTMENT) return false;
      return (usage.flatCount || 0) < PLAN_LIMITS[ORG_TYPES.APARTMENT].flats;
    }

    case "notifications":
    case "advancedAnalytics":
    case "budgets":
    case "advancedInvoice":
      return plan === PLANS.PRO || plan === PLANS.BUSINESS;

    case "posSystem":
      return false;

    case "sharedLedger":
      return false;

    default:
      return true;
  }
}

export function getUpgradeCopy(feature, orgType = ORG_TYPES.FREELANCER) {
  switch (feature) {
    case "invoiceCreate":
      if (orgType === ORG_TYPES.FREELANCER) {
        return {
          title: "Invoice limit reached",
          message: "Pro plan allows up to 10 invoices per client per month. Select a different client or wait until next month."
        };
      }
      return {
        title: "Subscription required",
        message: "Upgrade to Pro (Rs 99/month) or Business (Rs 199/month) to create invoices."
      };

    case "customerCreate":
      if (orgType === ORG_TYPES.FREELANCER) {
        return {
          title: "Client limit reached",
          message: "Pro plan supports up to 10 clients. Remove an existing client to add a new one."
        };
      }
      if (orgType === ORG_TYPES.APARTMENT) {
        return {
          title: "Flat limit reached",
          message: "Pro plan supports up to 40 flats."
        };
      }
      return {
        title: "Subscription required",
        message: "Upgrade to Pro or Business to add customers."
      };

    case "apartmentFlatCreate":
      return {
        title: "Flat limit reached",
        message: "Pro plan supports up to 40 flats."
      };

    case "invoicePdf":
      return {
        title: "PDF export",
        message: "Upgrade to Pro or Business to download branded invoice PDFs."
      };

    case "reports":
      return {
        title: "Reports",
        message: "Upgrade to Pro or Business for advanced reports, alerts, and insights."
      };

    case "notifications":
      return {
        title: "Smart alerts are a paid feature",
        message: "Upgrade to Pro or Business to enable payment reminders and notification alerts."
      };

    case "advancedAnalytics":
      return {
        title: "Advanced analytics are a paid feature",
        message: "Upgrade to Pro or Business to unlock burn rate, savings goals, and customer intelligence."
      };

    case "budgets":
      return {
        title: "Budgets are a paid feature",
        message: "Upgrade to Pro or Business to set category budgets and track overspending automatically."
      };

    case "sharedLedger":
      return {
        title: "Feature retired",
        message: "Shared ledger has been retired from the app."
      };

    default:
      return {
        title: "Subscription required",
        message: "This feature requires Pro (Rs 99/month) or Business (Rs 199/month)."
      };
  }
}

export function getPlanSummary(user, orgType, org = null, organizations = []) {
  const plan = getUserPlan(user);
  const status = user?.subscriptionStatus || getOrgSubscriptionStatus(org) || SUBSCRIPTION_STATUS.ACTIVE;
  const paidCount = getOwnedPaidOrgCount(organizations);
  const paidLimit = getPaidOrgLimit(user);

  if (orgType && isFreeOrgType(orgType)) {
    return {
      title: "Household - Free",
      message: "Household Khata is permanently free and does not count against your paid Khata limit."
    };
  }

  if (isAdminUser(user)) {
    return {
      title: "Owner access",
      message: "You have full access across all plan features."
    };
  }

  if (isReviewAccessEnabled()) {
    return {
      title: "Review access enabled",
      message: "All paid features are unlocked. No upgrade needed during the review period."
    };
  }

  if (status === SUBSCRIPTION_STATUS.TRIAL && isTrialActive(user, org)) {
    const ends = formatSubscriptionDate(user?.subscriptionEndsAt || getOrgSubscriptionEndsAt(org));
    return {
      title: `${PLAN_LABELS[plan] || "Pro"} trial`,
      message: ends ? `Trial access is active until ${ends}.` : "Trial access is active for a limited period."
    };
  }

  if (!isSubscriptionActive(user, org)) {
    return {
      title: "Free plan",
      message: "Household is free. Upgrade to Pro for 2 paid Khatas or Business for 5 paid Khatas."
    };
  }

  return {
    title: `${PLAN_LABELS[plan] || "Plan"} plan`,
    message: `${paidCount}/${paidLimit} paid Khatas used. Household remains free.`
  };
}
