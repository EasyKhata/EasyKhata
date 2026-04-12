export const ORG_TYPES = {
  PERSONAL: "personal",
  FREELANCER: "freelancer",
  SMALL_BUSINESS: "small_business",
  APARTMENT: "apartment",
  RETAIL: "retail"
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
  { value: ORG_TYPES.SMALL_BUSINESS, label: "Small Business", description: "Run a service business with clients, invoices, team, and operating expenses." },
  { value: ORG_TYPES.APARTMENT, label: "Apartment Maintenance / Society", description: "Handle maintenance collections, flats, residents, service providers, and complaints." },
  { value: ORG_TYPES.RETAIL, label: "Kirana Shop / Retail", description: "Track sales, purchases, inventory, and supplier balances." }
];

export function getSelectableOrgTypeOptions(currentType = "") {
  const cleanCurrentType = getOrgType(currentType);
  return ORG_TYPE_OPTIONS.filter(option => option.value !== ORG_TYPES.RETAIL || cleanCurrentType === ORG_TYPES.RETAIL);
}

export const ORG_TYPE_CONFIGS = {
  [ORG_TYPES.PERSONAL]: {
    ...BASE_CONFIG,
    incomeLabel: "Earnings",
    incomeEntryLabel: "Earning",
    incomeActionLabel: "Add Earning",
    expensesLabel: "Spending",
    expensesEntryLabel: "Spending Entry",
    expensesActionLabel: "Add Spending",
    invoicesLabel: "Borrow / Lend",
    invoiceEntryLabel: "Borrow / Lend Record",
    invoiceActionLabel: "Add Borrow / Lend",
    customerLabel: "People",
    customerEntryLabel: "Person",
    customerNameLabel: "Person Name",
    customerNamePlaceholder: "Family member, friend, or contact name",
    profileNameLabel: "Household Name",
    profileNamePlaceholder: "E.g. Reddy Family Budget",
    accountIntro: "Use this profile for your household or personal finance records.",
    hideInvoices: true,
    incomeFields: [
      { key: "personName", label: "Person", type: "text", placeholder: "Select household member" },
      { key: "incomeType", label: "Earning Type", type: "select", options: ["Salary", "Bonus", "Rental", "Interest", "Gift", "Other"] }
    ],
    expenseFields: [
      { key: "personName", label: "Person", type: "text", placeholder: "Select household member" },
      { key: "necessityType", label: "Need Type", type: "select", options: ["Essential", "Non-Essential"] }
    ],
    expenseCategories: ["Groceries", "Rent", "Utilities", "Education", "Healthcare", "Transport", "Shopping", "Entertainment", "Insurance", "EMI", "Other"],
    extraSections: [
      {
        key: "loans",
        label: "Loans / EMIs",
        entryLabel: "EMI",
        empty: () => ({ loanName: "", lender: "", monthlyEmi: "", startDate: "", dueDay: "", endDate: "" }),
        fields: [
          { key: "loanName", label: "Loan / EMI Name", type: "text", required: true, placeholder: "Home loan" },
          { key: "lender", label: "Lender", type: "text", required: true, placeholder: "Bank or person name" },
          { key: "monthlyEmi", label: "Monthly EMI", type: "number", required: true, placeholder: "0.00" },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "dueDay", label: "Due Date", type: "select", required: true, options: Array.from({ length: 31 }, (_, index) => String(index + 1)) },
          { key: "endDate", label: "End Date", type: "date" }
        ]
      }
    ]
  },
  [ORG_TYPES.FREELANCER]: {
    ...BASE_CONFIG,
    incomeLabel: "Payments Received",
    incomeEntryLabel: "Payment",
    incomeActionLabel: "Add Payment",
    expensesLabel: "Business Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Client Invoices",
    customerLabel: "Clients",
    customerEntryLabel: "Client",
    customerNameLabel: "Client Name",
    customerNamePlaceholder: "Client or studio name",
    profileNameLabel: "Freelancer / Brand Name",
    profileNamePlaceholder: "E.g. Deepak Design Studio",
    accountIntro: "This profile powers your client invoices, payments, and expense records.",
    incomeFields: [
      { key: "clientName", label: "Client Name", type: "text", placeholder: "Client name" },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: ["Received", "Partially Received", "Awaiting"] }
    ],
    expenseFields: [
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
    incomeLabel: "Receipts",
    incomeEntryLabel: "Receipt",
    incomeActionLabel: "Add Receipt",
    expensesLabel: "Business Expenses",
    expensesEntryLabel: "Expense",
    expensesActionLabel: "Add Expense",
    invoicesLabel: "Client Invoices",
    customerLabel: "Clients",
    customerEntryLabel: "Client",
    customerNameLabel: "Client Name",
    customerNamePlaceholder: "Client or company name",
    profileNameLabel: "Business / Studio Name",
    profileNamePlaceholder: "E.g. Reddy Photo Studio",
    accountIntro: "Use this profile for a small service business with one owner, a small team, client invoices, and everyday operating costs.",
    incomeFields: [
      { key: "receiptType", label: "Receipt Type", type: "select", options: ["Client Payment", "Advance", "Retainer", "Commission", "Other"] },
      { key: "serviceName", label: "Service / Deal / Event", type: "text", placeholder: "What was this payment for?" }
    ],
    expenseFields: [
      { key: "expenseType", label: "Expense Type", type: "select", options: ["Operations", "Team Payout", "Rent", "Travel", "Marketing", "Software", "Partner Payment", "Other"] }
    ],
    invoiceFields: [
      { key: "taxId", label: "GST / Tax ID", type: "text", placeholder: "Tax identifier (optional)" },
      { key: "discount", label: "Discount", type: "number", placeholder: "0.00" },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "E.g. Net 15" }
    ],
    customerFields: [
      { key: "company", label: "Company", type: "text", placeholder: "Company or brand name" }
    ],
    expenseCategories: ["Operations", "Team Payout", "Rent", "Travel", "Marketing", "Software", "Partner Payment", "Other"],
    extraSections: [
      {
        key: "services",
        label: "Services",
        entryLabel: "Service",
        empty: () => ({ serviceName: "", packageName: "", defaultAmount: "", notes: "" }),
        fields: [
          { key: "serviceName", label: "Service Name", type: "text", required: true, placeholder: "Wedding shoot, flat resale, ad campaign" },
          { key: "packageName", label: "Package / Plan", type: "text", placeholder: "Optional package name" },
          { key: "defaultAmount", label: "Default Amount", type: "number", placeholder: "0.00" },
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
  },
  [ORG_TYPES.RETAIL]: {
    ...BASE_CONFIG,
    hideInvoices: true,
    showCustomerFinancials: false,
    incomeLabel: "Sales",
    incomeEntryLabel: "Sale",
    incomeActionLabel: "Add Sale",
    expensesLabel: "Purchases & Expenses",
    expensesEntryLabel: "Purchase / Expense",
    expensesActionLabel: "Add Purchase",
    invoicesLabel: "Bills",
    customerLabel: "Customers / Udhar",
    customerEntryLabel: "Customer",
    customerNameLabel: "Customer Name",
    customerNamePlaceholder: "Regular or credit customer name",
    profileNameLabel: "Shop Name",
    profileNamePlaceholder: "E.g. Reddy Kirana Store",
    accountIntro: "Use this profile for daily sales, stock purchases, inventory tracking, and supplier balances.",
    incomeFields: [
      { key: "saleType", label: "Sale Type", type: "select", options: ["Counter Sale", "Home Delivery", "Credit Sale", "Online Order", "Other"] },
      { key: "productName", label: "Product / Basket", type: "text", placeholder: "Select a product or describe the basket" },
      { key: "quantity", label: "Quantity", type: "number", placeholder: "0" },
    ],
    expenseFields: [
      { key: "purchaseType", label: "Entry Type", type: "select", options: ["Stock Purchase", "Supplier Payment", "Rent", "Utilities", "Staff", "Other"] },
      { key: "supplierName", label: "Supplier", type: "text", placeholder: "Select supplier if relevant" }
    ],
    expenseCategories: ["Stock Purchase", "Supplier Payment", "Rent", "Utilities", "Staff", "Other"],
    extraSections: [
      {
        key: "inventory",
        label: "Inventory",
        entryLabel: "Product",
        empty: () => ({ productName: "", stock: "", expiryDate: "", price: "" }),
        fields: [
          { key: "productName", label: "Product Name", type: "text", required: true, placeholder: "Product name" },
          { key: "stock", label: "Stock", type: "number", placeholder: "0" },
          { key: "expiryDate", label: "Expiry Date", type: "date" },
          { key: "price", label: "Price", type: "number", placeholder: "0.00" }
        ]
      },
      {
        key: "suppliers",
        label: "Suppliers",
        entryLabel: "Supplier",
        empty: () => ({ supplierName: "", contact: "", creditBalance: "" }),
        fields: [
          { key: "supplierName", label: "Supplier Name", type: "text", required: true, placeholder: "Supplier name" },
          { key: "contact", label: "Contact", type: "text", placeholder: "Phone or email" },
          { key: "creditBalance", label: "Credit Balance", type: "number", placeholder: "0.00" }
        ]
      }
    ]
  }
};

export function getOrgType(value) {
  return ORG_TYPE_CONFIGS[value] ? value : ORG_TYPES.SMALL_BUSINESS;
}

export function getOrgConfig(value) {
  return ORG_TYPE_CONFIGS[getOrgType(value)];
}

export function getSectionLabel(config, key) {
  return config?.[key] || BASE_CONFIG[key];
}
