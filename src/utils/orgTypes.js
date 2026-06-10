export const ORG_TYPES = {
  // "freelancer" is the legacy stored value for Small Business khatas —
  // kept for data compatibility with existing org rows.
  SMALL_BUSINESS: "freelancer",
  FREELANCER: "freelancer",
  APARTMENT: "apartment"
};

const BASE_CONFIG = {
  typeLabel: "Business",
  dashboardLabel: "Home",
  incomeLabel: "Income",
  incomeEntryLabel: "Income",
  incomeActionLabel: "Add Income",
  expensesLabel: "Expenses",
  expensesEntryLabel: "Expense",
  expensesActionLabel: "Add Expense",
  invoicesLabel: "Invoices",
  invoiceEntryLabel: "Invoice",
  invoiceActionLabel: "Create Invoice",
  customerLabel: "Customers",
  customerEntryLabel: "Customer",
  customerNameLabel: "Name",
  customerNamePlaceholder: "Client or company name",
  profileNameLabel: "Business Name",
  profileNamePlaceholder: "Type to enter",
  accountIntro: "This information appears in your reports and invoices.",
  hideInvoices: false,
  incomeFields: [],
  expenseFields: [],
  invoiceFields: [],
  customerFields: [],
  expenseCategories: ["Operations", "Tools", "Marketing", "Payroll", "Utilities", "Travel", "Other"],
  enableBudgets: true,
  showSavingsGoal: true,
  showCustomerFinancials: true,
  extraSections: []
};

export const ORG_TYPE_OPTIONS = [
  { value: ORG_TYPES.FREELANCER, label: "Small Business", description: "Manage clients, invoices, payments received, and business expenses." },
  { value: ORG_TYPES.APARTMENT, label: "Apartment Maintenance / Society", description: "Handle maintenance collections, flats, residents, service providers, and complaints." }
];

export function getSelectableOrgTypeOptions(currentType = "") {
  return ORG_TYPE_OPTIONS;
}

export function getSecondaryOrgTypeOptions(currentType = "") {
  return ORG_TYPE_OPTIONS;
}

export const ORG_TYPE_CONFIGS = {
  [ORG_TYPES.FREELANCER]: {
    ...BASE_CONFIG,
    typeLabel: "Small Business",
    enableBudgets: false,
    incomeLabel: "Payments Received",
    incomeEntryLabel: "Payment",
    incomeActionLabel: "Add Payment",
    expensesLabel: "Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Bills / Invoices",
    customerLabel: "Customers",
    customerEntryLabel: "Customer",
    customerNameLabel: "Customer Name",
    customerNamePlaceholder: "Customer or company name",
    profileNameLabel: "Your Name / Business Name",
    profileNamePlaceholder: "E.g. Design Studio",
    accountIntro: "This profile powers your customer invoices, payments, and expense records.",
    // Internal field key (`clientName`) is kept for data-layer compatibility with
    // existing records — only the user-facing label / placeholder change.
    incomeFields: [
      { key: "clientName", label: "Customer", type: "text", placeholder: "Select customer" }
    ],
    expenseFields: [
      { key: "clientName", label: "Customer", type: "text", placeholder: "Select customer" },
      { key: "billable", label: "Billable", type: "select", options: ["Yes", "No"] }
    ],
    invoiceFields: [],
    customerFields: [],
    extraSections: []
  },
  [ORG_TYPES.APARTMENT]: {
    ...BASE_CONFIG,
    typeLabel: "Apartment",
    hideInvoices: false,
    enableBudgets: false,
    showSavingsGoal: false,
    showCustomerFinancials: false,
    incomeLabel: "Maintenance Collections",
    incomeEntryLabel: "Maintenance Collection",
    incomeActionLabel: "Add Collection",
    expensesLabel: "Society Expenses",
    expensesEntryLabel: "Society Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Receipts & Bills",
    invoiceEntryLabel: "Document",
    invoiceActionLabel: "Create Document",
    customerLabel: "Residents / Flats",
    customerEntryLabel: "Flat Record",
    customerNameLabel: "Flat Number",
    customerNamePlaceholder: "A-101",
    profileNameLabel: "Apartment / Society Name",
    profileNamePlaceholder: "E.g. Lake View Residency",
    accountIntro: "Use this profile for maintenance collections, society expenses, flats, and resident records.",
    incomeFields: [
      { key: "flatNumber", label: "Flat Number", type: "text", placeholder: "A-101" },
      { key: "collectionType", label: "Collection Type", type: "select", options: ["Monthly Maintenance", "Corpus Fund", "Parking", "Amenities", "Penalty", "Opening Balance", "Other"] },
      { key: "residentName", label: "Resident Name", type: "text", placeholder: "Resident name" },
      { key: "collectionMonth", label: "Collection Month", type: "month" }
    ],
    expenseFields: [
      { key: "expenseType", label: "Expense Type", type: "select", options: ["Cleaning", "Security", "Repairs", "Water", "Electricity", "Lift", "Housekeeping", "Admin", "Legal", "Other"] },
      { key: "serviceProvider", label: "Service Provider", type: "text", placeholder: "Vendor or contractor name" },
      { key: "billReference", label: "Bill Reference", type: "text", placeholder: "Invoice or receipt number" }
    ],
    invoiceFields: [],
    customerFields: [
      { key: "ownerName", label: "Owner Name", type: "text", required: true, placeholder: "Owner name" }
    ],
    expenseCategories: ["Repairs", "Cleaning", "Security", "Water", "Electricity", "Housekeeping", "Lift", "Amenities", "Admin", "Legal", "Other"],
    extraSections: []
  }
};

export function getOrgType(value) {
  return ORG_TYPE_CONFIGS[value] ? value : ORG_TYPES.FREELANCER;
}

export function getOrgConfig(value) {
  return ORG_TYPE_CONFIGS[getOrgType(value)];
}

export function getSectionLabel(config, key) {
  return config?.[key] || BASE_CONFIG[key];
}
