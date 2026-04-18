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

// Prices per org type. Only apartment has a Business tier.
export const PLAN_PRICES = {
  [ORG_TYPES.PERSONAL]:       { pro: { monthly: 69,  yearly: 699  }, business: null },
  [ORG_TYPES.FREELANCER]:     { pro: { monthly: 69,  yearly: 699  }, business: null },
  [ORG_TYPES.SMALL_BUSINESS]: { pro: { monthly: 69,  yearly: 699  }, business: null },
  [ORG_TYPES.APARTMENT]:      { pro: { monthly: 69,  yearly: 699  }, business: { monthly: 99, yearly: 999 } }
};

// Per-plan limits for org types that aren't fully unlimited on Pro
const PLAN_LIMITS = {
  [ORG_TYPES.FREELANCER]: {
    customers: 10,
    invoicesPerCustomerPerMonth: 10
  },
  [ORG_TYPES.APARTMENT]: {
    pro:      { flats: 40, invites: 40 },
    business: { flats: 40, invites: 40 }
  }
};

export const UPI_CONFIG = {
  payeeName: "EasyKhata"
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

// Returns true only if the given org type has a Business tier available
export function hasBusinessPlan(orgType) {
  return !!(PLAN_PRICES[orgType]?.business);
}

// True when user is on an active paid plan (not trial, not expired)
export function isPaidActive(user) {
  if (isAdminUser(user)) return true;
  const plan = getUserPlan(user);
  if (plan !== PLANS.PRO && plan !== PLANS.BUSINESS) return false;
  return isSubscriptionActive(user);
}

// 4 max (1 per type). Creating org 2-4 requires an active paid plan — enforced in createOrganization.
export function getMaxOrganizations(user) {
  if (isAdminUser(user) || isReviewAccessEnabled()) return 4;
  if (isSubscriptionActive(user)) return 4;
  return 1;
}

// Org type can be changed during trial (clears data) or on a paid plan.
// Expired/free users are locked to their current type.
export function canChangeOrgType(user) {
  if (isAdminUser(user)) return true;
  return isSubscriptionActive(user);
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

// orgType is required to look up the correct price tier
export function getBillingAmount(cycle, plan = PLANS.PRO, orgType = ORG_TYPES.SMALL_BUSINESS) {
  const prices = PLAN_PRICES[orgType] || PLAN_PRICES[ORG_TYPES.SMALL_BUSINESS];
  const tier = plan === PLANS.BUSINESS ? prices.business : prices.pro;
  if (!tier) return 0;
  return cycle === BILLING_CYCLES.YEARLY ? tier.yearly : tier.monthly;
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
  if (isReviewAccessEnabled()) return true;
  const status = user?.subscriptionStatus || SUBSCRIPTION_STATUS.ACTIVE;
  if (status === SUBSCRIPTION_STATUS.ACTIVE) return true;
  if (status === SUBSCRIPTION_STATUS.TRIAL) return isTrialActive(user);
  return false;
}

// Read-only mode: trial expired or no active subscription
export function isFreeReadOnlyMode(user) {
  if (isAdminUser(user)) return false;
  if (isReviewAccessEnabled()) return false;
  return !isSubscriptionActive(user);
}

// usage keys by feature:
//   customerCreate      → customerCount, flatCount
//   invoiceCreate       → invoiceCountForCustomer (freelancer only; per customer per month)
//   apartmentFlatCreate → flatCount
//   societyInvite       → inviteCount
export function canUseFeature(user, feature, usage = {}, orgType = ORG_TYPES.SMALL_BUSINESS) {
  if (isAdminUser(user)) return true;
  if (isReviewAccessEnabled()) return feature !== "sharedLedger";

  const plan = getUserPlan(user);
  const active = isSubscriptionActive(user);

  // Trial expired / no active plan: read-only — allow viewing and exports, block all writes
  if (!active) {
    return feature === "basicBookkeeping" || feature === "invoicePdf" || feature === "reports";
  }

  switch (feature) {
    case "customerCreate": {
      if (orgType === ORG_TYPES.FREELANCER) {
        return (usage.customerCount || 0) < PLAN_LIMITS[ORG_TYPES.FREELANCER].customers;
      }
      if (orgType === ORG_TYPES.APARTMENT) {
        const limit = plan === PLANS.BUSINESS
          ? PLAN_LIMITS[ORG_TYPES.APARTMENT].business.flats
          : PLAN_LIMITS[ORG_TYPES.APARTMENT].pro.flats;
        return (usage.flatCount || 0) < limit;
      }
      return true; // personal, small_business: unlimited
    }

    case "invoiceCreate": {
      if (orgType === ORG_TYPES.FREELANCER) {
        // usage.invoiceCountForCustomer = invoices for this customer in the current month
        return (usage.invoiceCountForCustomer || 0) < PLAN_LIMITS[ORG_TYPES.FREELANCER].invoicesPerCustomerPerMonth;
      }
      return true;
    }

    case "apartmentFlatCreate": {
      if (orgType !== ORG_TYPES.APARTMENT) return false;
      const limit = plan === PLANS.BUSINESS
        ? PLAN_LIMITS[ORG_TYPES.APARTMENT].business.flats
        : PLAN_LIMITS[ORG_TYPES.APARTMENT].pro.flats;
      return (usage.flatCount || 0) < limit;
    }

    case "societyInvite": {
      if (orgType !== ORG_TYPES.APARTMENT) return false;
      const limit = plan === PLANS.BUSINESS
        ? PLAN_LIMITS[ORG_TYPES.APARTMENT].business.invites
        : PLAN_LIMITS[ORG_TYPES.APARTMENT].pro.invites;
      return (usage.inviteCount || 0) < limit;
    }

    case "notifications":
    case "advancedAnalytics":
    case "budgets":
    case "advancedInvoice":
      return plan === PLANS.PRO || plan === PLANS.BUSINESS;

    case "posSystem":
      return false; // not launched

    case "residentPortal":
      return false; // coming soon

    case "sharedLedger":
      return false;

    default:
      return true;
  }
}

export function getUpgradeCopy(feature, orgType = ORG_TYPES.SMALL_BUSINESS) {
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
        message: "Your trial has ended. Upgrade to Pro to create invoices."
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
          message: "Pro and Business plans support up to 40 flats."
        };
      }
      return {
        title: "Subscription required",
        message: "Your trial has ended. Upgrade to Pro to add customers."
      };

    case "apartmentFlatCreate":
      return {
        title: "Flat limit reached",
        message: "Pro and Business plans support up to 40 flats."
      };

    case "societyInvite":
      return {
        title: "Invite limit reached",
        message: "Pro and Business plans support up to 40 resident invites."
      };

    case "invoicePdf":
      return {
        title: "PDF export",
        message: "Upgrade to Pro to download branded invoice PDFs."
      };

    case "reports":
      return {
        title: "Reports",
        message: "Upgrade to Pro for advanced reports, alerts, and insights."
      };

    case "notifications":
      return {
        title: "Smart alerts are a Pro feature",
        message: "Upgrade to Pro to enable payment reminders and notification alerts."
      };

    case "advancedAnalytics":
      return {
        title: "Advanced analytics are a Pro feature",
        message: "Upgrade to Pro to unlock burn rate, savings goals, and customer intelligence."
      };

    case "budgets":
      return {
        title: "Budgets are a Pro feature",
        message: "Upgrade to Pro to set category budgets and track overspending automatically."
      };

    case "sharedLedger":
      return {
        title: "Feature retired",
        message: "Shared ledger has been retired from the app."
      };

    case "residentPortal":
      return {
        title: "Resident portal — coming soon",
        message: "Apartment resident read-only portal will roll out in a future update."
      };

    default:
      return {
        title: "Upgrade required",
        message: "This feature requires an active Pro subscription."
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

  if (isReviewAccessEnabled()) {
    return {
      title: "Review access enabled",
      message: "All Pro features are unlocked. No upgrade needed during the review period."
    };
  }

  if (status === SUBSCRIPTION_STATUS.TRIAL && isTrialActive(user)) {
    const ends = formatSubscriptionDate(user?.subscriptionEndsAt);
    return {
      title: `${PLAN_LABELS[plan] || "Pro"} trial`,
      message: ends ? `Trial access is active until ${ends}.` : "Trial access is active for a limited period."
    };
  }

  if (status === SUBSCRIPTION_STATUS.TRIAL && !isTrialActive(user)) {
    return {
      title: "Trial ended",
      message: "Your free trial has ended. Upgrade to continue creating and editing records."
    };
  }

  if (status === SUBSCRIPTION_STATUS.INACTIVE) {
    return {
      title: `${PLAN_LABELS[plan] || "Plan"} inactive`,
      message: "Premium features are paused. Contact admin to reactivate."
    };
  }

  return {
    title: `${PLAN_LABELS[plan] || "Free"} plan`,
    message:
      plan === PLANS.FREE
        ? "Your trial has ended. You can view existing records and download reports. Upgrade to Pro to create or edit records."
        : `${PLAN_LABELS[plan] || "Plan"} access is active.`
  };
}
