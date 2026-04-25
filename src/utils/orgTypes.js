export const ORG_TYPES = {
  PERSONAL: "personal",
  FREELANCER: "freelancer",
  SMALL_BUSINESS: "small_business",
  APARTMENT: "apartment"
};

const BASE_CONFIG = {
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
  { value: ORG_TYPES.PERSONAL, label: "Household / Personal Finance", description: "Track family money, spending, savings, and loans." },
  { value: ORG_TYPES.FREELANCER, label: "Freelancer", description: "Manage clients, payments received, invoices, and business expenses." },
  { value: ORG_TYPES.APARTMENT, label: "Apartment Maintenance / Society", description: "Handle maintenance collections, flats, residents, service providers, and complaints." }
];

export function getSelectableOrgTypeOptions(currentType = "") {
  return ORG_TYPE_OPTIONS;
}

export function getSecondaryOrgTypeOptions(currentType = "") {
  const normalizedCurrent = getOrgType(currentType);
  const secondaryTypes = new Set([ORG_TYPES.FREELANCER, ORG_TYPES.APARTMENT]);
  return ORG_TYPE_OPTIONS.filter(option => {
    const optionType = getOrgType(option.value);
    if (secondaryTypes.has(optionType)) return true;
    return normalizedCurrent && optionType === normalizedCurrent && optionType !== ORG_TYPES.PERSONAL;
  });
}

export const ORG_TYPE_CONFIGS = {
  [ORG_TYPES.PERSONAL]: {
    ...BASE_CONFIG,
    incomeLabel: "Income",
    incomeEntryLabel: "Income",
    incomeActionLabel: "Add Income",
    expensesLabel: "Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Udhaar / Credit",
    invoiceEntryLabel: "Udhaar / Credit Record",
    invoiceActionLabel: "Add Udhaar / Credit",
    customerLabel: "People",
    customerEntryLabel: "Person",
    customerNameLabel: "Person Name",
    customerNamePlaceholder: "Family member, friend, or contact name",
    profileNameLabel: "Household Name",
    profileNamePlaceholder: "E.g. Reddy Family Budget",
    accountIntro: "Use this profile for your household or personal finance records.",
    hideInvoices: true,
    incomeFields: [
      { key: "personName", label: "Family Member", type: "text", placeholder: "Select family member" },
      { key: "incomeType", label: "Income Type", type: "select", options: ["Salary", "Bonus", "Rental", "Interest", "Gift", "Other"] }
    ],
    expenseFields: [
      { key: "personName", label: "Family Member", type: "text", placeholder: "Select family member" },
      { key: "necessityType", label: "Type", type: "select", options: ["Needs", "Wants"] }
    ],
    expenseCategories: ["Groceries", "Rent", "Utilities", "Education", "Healthcare", "Transport", "Shopping", "Entertainment", "Insurance", "EMI", "Other"],
    extraSections: [
      {
        key: "loans",
        label: "Loans & EMI",
        entryLabel: "EMI",
        empty: () => ({ loanName: "", personName: "", lender: "", monthlyEmi: "", dueDay: "1", endDate: "" }),
        fields: [
          { key: "loanName", label: "Loan / EMI Name", type: "text", required: true, placeholder: "Home loan" },
          { key: "personName", label: "Family Member", type: "text", placeholder: "Select family member" },
          { key: "lender", label: "Lender", type: "text", required: true, placeholder: "Bank or person name" },
          { key: "monthlyEmi", label: "Monthly EMI", type: "number", required: true, placeholder: "0.00" },
          { key: "dueDay", label: "Due Date", type: "select", required: true, options: Array.from({ length: 31 }, (_, index) => String(index + 1)) },
          { key: "endDate", label: "End Date", type: "date", required: true }
        ]
      }
    ]
  },
  [ORG_TYPES.FREELANCER]: {
    ...BASE_CONFIG,
    enableBudgets: false,
    incomeLabel: "Payments Received",
    incomeEntryLabel: "Payment",
    incomeActionLabel: "Add Payment",
    expensesLabel: "Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Bills / Invoices",
    customerLabel: "Clients",
    customerEntryLabel: "Client",
    customerNameLabel: "Client Name",
    customerNamePlaceholder: "Client or studio name",
    profileNameLabel: "Your Name / Business Name",
    profileNamePlaceholder: "E.g. Deepak Design Studio",
    accountIntro: "This profile powers your client invoices, payments, and expense records.",
    incomeFields: [
      { key: "clientName", label: "Client", type: "text", placeholder: "Select client" }
    ],
    expenseFields: [
      { key: "clientName", label: "Client", type: "text", placeholder: "Select client" },
      { key: "billable", label: "Billable", type: "select", options: ["Yes", "No"] }
    ],
    invoiceFields: [],
    customerFields: [
      { key: "company", label: "Company", type: "text", placeholder: "Company name" }
    ],
    extraSections: []
  },
  [ORG_TYPES.SMALL_BUSINESS]: {
    ...BASE_CONFIG,
    enableBudgets: false,
    simpleCustomerForm: true,
    incomeLabel: "Sales",
    incomeEntryLabel: "Sale",
    incomeActionLabel: "Add Sale",
    expensesLabel: "Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Bills / Invoices",
    hideInvoices: true,
    customerLabel: "Customers",
    customerEntryLabel: "Customer",
    customerNameLabel: "Customer Name",
    customerNamePlaceholder: "Customer name",
    profileNameLabel: "Business / Studio Name",
    profileNamePlaceholder: "E.g. Reddy Photo Studio",
    accountIntro: "Use this profile for a small service business with one owner, a small team, customer invoices, and everyday operating costs.",
    incomeFields: [
      { key: "customerName", label: "Customer", type: "text", placeholder: "Type or select customer" }
    ],
    expenseFields: [
      { key: "expenseType", label: "Expense Type", type: "select", options: ["Operations", "Team Payout", "Rent", "Travel", "Marketing", "Software", "Partner Payment", "Other"] }
    ],
    invoiceFields: [
      { key: "taxId", label: "GST / Tax ID", type: "text", placeholder: "Tax identifier (optional)" },
      { key: "discount", label: "Discount", type: "number", placeholder: "0.00" },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "E.g. Net 15" }
    ],
    customerFields: [],
    expenseCategories: ["Operations", "Team Payout", "Rent", "Travel", "Marketing", "Software", "Partner Payment", "Other"],
    extraSections: [
      {
        key: "services",
        label: "Services",
        entryLabel: "Service",
        empty: () => ({ serviceName: "", notes: "", products: [] }),
        fields: [
          { key: "serviceName", label: "Service Name", type: "text", required: true, placeholder: "Wedding shoot, flat resale, ad campaign" },
          { key: "notes", label: "Notes", type: "textarea", placeholder: "Short notes or scope" }
        ]
      },
      {
        key: "team",
        label: "Team Members",
        entryLabel: "Team Member",
        empty: () => ({ name: "", payout: "", role: "" }),
        fields: [
          { key: "name", label: "Name", type: "text", required: true, placeholder: "Team member name" },
          { key: "payout", label: "Monthly Payout", type: "number", placeholder: "0.00" },
          { key: "role", label: "Role", type: "text", placeholder: "Photographer, agent, editor, coordinator" }
        ]
      },
      {
        key: "partners",
        label: "Partners / Vendors",
        entryLabel: "Partner",
        empty: () => ({ partnerName: "", contact: "", balanceDue: "" }),
        fields: [
          { key: "partnerName", label: "Partner / Vendor Name", type: "text", required: true, placeholder: "Venue, printer, decorator, broker, freelancer" },
          { key: "contact", label: "Contact", type: "text", placeholder: "Phone or email" },
          { key: "balanceDue", label: "Balance Due", type: "number", placeholder: "0.00" }
        ]
      }
    ]
  },
  [ORG_TYPES.APARTMENT]: {
    ...BASE_CONFIG,
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
