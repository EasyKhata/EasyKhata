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
  { value: ORG_TYPES.FREELANCER, label: "Freelancer", description: "Manage client work, payments received, and projects." },
  { value: ORG_TYPES.SMALL_BUSINESS, label: "Small Business", description: "Run invoicing, expenses, vendors, staff, and stock." },
  { value: ORG_TYPES.APARTMENT, label: "Apartment Maintenance / Society", description: "Handle maintenance collections, flats, residents, service providers, and complaints." },
  { value: ORG_TYPES.RETAIL, label: "Kirana Shop / Retail", description: "Track sales, purchases, inventory, and supplier balances." }
];

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
        empty: () => ({ loanName: "", lender: "", monthlyEmi: "", dueDate: "", endDate: "", interestRate: "", outstandingBalance: "", status: "Active" }),
        fields: [
          { key: "loanName", label: "Loan / EMI Name", type: "text", required: true, placeholder: "Home loan" },
          { key: "lender", label: "Lender", type: "text", required: true, placeholder: "Bank or person name" },
          { key: "monthlyEmi", label: "Monthly EMI", type: "number", required: true, placeholder: "0.00" },
          { key: "dueDate", label: "Due Date", type: "date", required: true },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "interestRate", label: "Interest Rate (%)", type: "number", placeholder: "0" },
          { key: "outstandingBalance", label: "Outstanding Balance", type: "number", placeholder: "0.00" },
          { key: "status", label: "Status", type: "select", options: ["Active", "Closed"] }
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
    accountIntro: "This profile powers your client invoices, payments, and project details.",
    incomeFields: [
      { key: "clientName", label: "Client Name", type: "text", placeholder: "Client name" },
      { key: "project", label: "Project", type: "text", placeholder: "Website redesign" },
      { key: "paymentStatus", label: "Payment Status", type: "select", options: ["Received", "Partially Received", "Awaiting"] }
    ],
    expenseFields: [
      { key: "projectLink", label: "Project Link", type: "text", placeholder: "Optional project name or URL" },
      { key: "billable", label: "Billable", type: "select", options: ["Yes", "No"] }
    ],
    invoiceFields: [
      { key: "projectName", label: "Project Name", type: "text", placeholder: "Project name" },
      { key: "hourlyRate", label: "Hourly Rate", type: "number", placeholder: "0.00" },
      { key: "hours", label: "Hours", type: "number", placeholder: "0" }
    ],
    customerFields: [
      { key: "company", label: "Company", type: "text", placeholder: "Company name" }
    ],
    extraSections: [
      {
        key: "projects",
        label: "Projects",
        entryLabel: "Project",
        empty: () => ({ projectName: "", client: "", status: "Active", budget: "" }),
        fields: [
          { key: "projectName", label: "Project Name", type: "text", required: true, placeholder: "Brand identity refresh" },
          { key: "client", label: "Client", type: "text", required: true, placeholder: "Client name" },
          { key: "status", label: "Status", type: "select", options: ["Active", "On Hold", "Completed"] },
          { key: "budget", label: "Budget", type: "number", placeholder: "0.00" }
        ]
      }
    ]
  },
  [ORG_TYPES.SMALL_BUSINESS]: {
    ...BASE_CONFIG,
    incomeFields: [
      { key: "salesChannel", label: "Sales Channel", type: "select", options: ["Online", "Store", "Other"] },
      { key: "productOrService", label: "Product / Service", type: "text", placeholder: "What was sold?" }
    ],
    expenseFields: [
      { key: "expenseType", label: "Expense Type", type: "select", options: ["Operational", "Salary", "Rent", "Other"] }
    ],
    invoiceFields: [
      { key: "taxId", label: "GST / Tax ID", type: "text", placeholder: "Tax identifier (optional)" },
      { key: "discount", label: "Discount", type: "number", placeholder: "0.00" },
      { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "E.g. Net 15" }
    ],
    extraSections: [
      {
        key: "inventory",
        label: "Inventory",
        entryLabel: "Item",
        empty: () => ({ productName: "", stockQuantity: "", costPrice: "", sellingPrice: "" }),
        fields: [
          { key: "productName", label: "Product Name", type: "text", required: true, placeholder: "Product name" },
          { key: "stockQuantity", label: "Stock Quantity", type: "number", placeholder: "0" },
          { key: "costPrice", label: "Cost Price", type: "number", placeholder: "0.00" },
          { key: "sellingPrice", label: "Selling Price", type: "number", placeholder: "0.00" }
        ]
      },
      {
        key: "employees",
        label: "Employees",
        entryLabel: "Employee",
        empty: () => ({ name: "", salary: "", role: "" }),
        fields: [
          { key: "name", label: "Name", type: "text", required: true, placeholder: "Employee name" },
          { key: "salary", label: "Salary", type: "number", placeholder: "0.00" },
          { key: "role", label: "Role", type: "text", placeholder: "Role" }
        ]
      },
      {
        key: "vendors",
        label: "Vendors",
        entryLabel: "Vendor",
        empty: () => ({ vendorName: "", contact: "", balanceDue: "" }),
        fields: [
          { key: "vendorName", label: "Vendor Name", type: "text", required: true, placeholder: "Vendor name" },
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
    invoiceFields: [
      { key: "expenseCategory", label: "Expense Category", type: "select", options: ["Repairs", "Cleaning", "Security", "Water", "Electricity", "Housekeeping", "Lift", "Amenities", "Admin", "Legal", "Other"] }
    ],
    customerFields: [
      { key: "ownerName", label: "Owner Name", type: "text", placeholder: "Owner name" },
      { key: "tenantName", label: "Tenant Name", type: "text", placeholder: "Tenant name" }
    ],
    expenseCategories: ["Repairs", "Cleaning", "Security", "Water", "Electricity", "Housekeeping", "Lift", "Amenities", "Admin", "Legal", "Other"],
    extraSections: []
  },
  [ORG_TYPES.RETAIL]: {
    ...BASE_CONFIG,
    incomeLabel: "Sales",
    incomeEntryLabel: "Sale",
    incomeActionLabel: "Add Sale",
    expensesLabel: "Purchases & Expenses",
    expensesEntryLabel: "Purchase / Expense",
    expensesActionLabel: "Add Purchase",
    invoicesLabel: "Bills",
    profileNameLabel: "Shop Name",
    profileNamePlaceholder: "E.g. EasyKhata Kirana",
    accountIntro: "Use this profile for sales, purchases, stock, and supplier balances.",
    incomeFields: [
      { key: "itemList", label: "Items", type: "textarea", placeholder: "List sold items" },
      { key: "quantity", label: "Quantity", type: "number", placeholder: "0" },
      { key: "totalItems", label: "Total Items", type: "number", placeholder: "0" }
    ],
    expenseFields: [
      { key: "purchaseType", label: "Purchase Type", type: "select", options: ["Stock", "Utility", "Other"] }
    ],
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
      },
      {
        key: "dailySummaries",
        label: "Daily Sales Summary",
        entryLabel: "Daily Summary",
        empty: () => ({ summaryDate: "", totalSales: "", totalExpenses: "", profit: "" }),
        fields: [
          { key: "summaryDate", label: "Date", type: "date", required: true },
          { key: "totalSales", label: "Total Sales", type: "number", placeholder: "0.00" },
          { key: "totalExpenses", label: "Total Expenses", type: "number", placeholder: "0.00" },
          { key: "profit", label: "Profit", type: "number", placeholder: "0.00" }
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
