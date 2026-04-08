export const PLANS = {
  FREE: "free",
  PRO: "pro",
  BUSINESS: "business"
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

export function isSubscriptionActive(user) {
  if (isAdminUser(user)) return true;
  return (user?.subscriptionStatus || "active") === "active";
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
      return plan === PLANS.BUSINESS;
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
        title: "Shared ledger is part of Business",
        message: "Upgrade to Business when you are ready to collaborate with a team on one ledger."
      };
    default:
      return {
        title: "Upgrade required",
        message: "This feature is part of a higher plan. Contact admin to upgrade your account."
      };
  }
}
