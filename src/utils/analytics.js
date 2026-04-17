import { invoiceTotal, monthKey, MONTHS } from "../components/UI";
import { ORG_TYPES, getOrgType } from "./orgTypes";

function toNumber(value) {
  return Number(value) || 0;
}

function normalizeMonthValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const directMatch = raw.match(/^(\d{4})-(\d{1,2})/);
  if (directMatch) {
    const year = directMatch[1];
    const month = String(Number(directMatch[2])).padStart(2, "0");
    return `${year}-${month}`;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getGoalSnapshot(goals = {}) {
  const targetAmount = toNumber(goals.targetAmount ?? goals.monthlySavings);
  const targetDate = String(goals.targetDate || "");
  const savedAmount = Math.max(0, toNumber(goals.savedAmount));
  const note = String(goals.note || "").trim();
  const goalLeft = Math.max(0, targetAmount - savedAmount);
  const goalProgress = targetAmount > 0 ? Math.max(0, Math.min(100, (savedAmount / targetAmount) * 100)) : 0;
  const goalStatus = targetAmount <= 0 ? "Set a savings goal" : goalLeft === 0 ? "Goal funded" : targetDate ? `Target by ${targetDate}` : "Goal in progress";

  return {
    targetAmount,
    targetDate,
    savedAmount,
    note,
    goalLeft,
    goalProgress,
    goalStatus
  };
}

export function isQuoteDocument(invoice) {
  return String(invoice?.documentType || "invoice").toLowerCase() === "quote";
}

export function getFinancialInvoices(invoices) {
  return (invoices || []).filter(invoice => !isQuoteDocument(invoice));
}

function getInvoiceSubtotal(invoice) {
  return (invoice?.items || []).reduce((sum, item) => {
    const taxable = toNumber(item.qty) * toNumber(item.rate);
    return sum + taxable;
  }, 0);
}

export function getInvoiceDiscount(invoice) {
  const subtotal = getInvoiceSubtotal(invoice);
  return Math.max(0, Math.min(subtotal, toNumber(invoice?.discount)));
}

export function getInvoiceTaxBreakdown(invoice) {
  const subtotal = getInvoiceSubtotal(invoice);
  const discount = getInvoiceDiscount(invoice);
  const multiplier = subtotal > 0 ? Math.max(0, subtotal - discount) / subtotal : 0;

  return (invoice?.items || []).reduce(
    (totals, item) => {
      const taxable = toNumber(item.qty) * toNumber(item.rate);
      const adjustedTaxable = taxable * multiplier;
      const rate = toNumber(item.taxRate ?? item.igst);
      const taxAmount = (adjustedTaxable * rate) / 100;

      totals.subtotal += taxable;
      totals.discount = discount;
      totals.taxable += adjustedTaxable;
      if ((invoice?.taxMode || "split") === "split") {
        totals.cgst += taxAmount / 2;
        totals.sgst += taxAmount / 2;
      } else {
        totals.igst += taxAmount;
      }

      return totals;
    },
    { subtotal: 0, discount, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  );
}

export function invoiceGrandTotal(invoice) {
  const tax = getInvoiceTaxBreakdown(invoice);
  return tax.taxable + tax.cgst + tax.sgst + tax.igst;
}

export function isApartmentResidentInvoice(invoice) {
  return invoice?.apartmentInvoiceType === "collections";
}

export function isApartmentExpenseInvoice(invoice) {
  return invoice?.apartmentInvoiceType === "expenses";
}

export function getApartmentInvoiceExpenseCategory(invoice) {
  return invoice?.expenseCategory || invoice?.maintenanceType || "Other";
}

export function getInvoiceStatus(invoice, today = new Date()) {
  if (invoice?.status === "paid") return "paid";
  if (!invoice?.dueDate) return "pending";

  const due = new Date(`${invoice.dueDate}T23:59:59`);
  return due < today ? "overdue" : "pending";
}

export function getInvoiceStatusLabel(status) {
  if (status === "paid") return "Paid";
  if (status === "overdue") return "Overdue";
  return "Pending";
}

export function getInvoiceStatusColor(status) {
  if (status === "paid") return "var(--accent)";
  if (status === "overdue") return "var(--danger)";
  return "var(--gold)";
}

export function getInvoiceDueMessage(invoice, today = new Date()) {
  if (!invoice?.dueDate || getInvoiceStatus(invoice, today) === "paid") return "";

  const oneDay = 24 * 60 * 60 * 1000;
  const due = new Date(`${invoice.dueDate}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((due - start) / oneDay);

  if (diffDays < 0) return `${Math.abs(diffDays)} day(s) overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

export function getReminderInvoices(invoices, today = new Date()) {
  return (invoices || []).filter(invoice => {
    if (isQuoteDocument(invoice)) return false;
    const status = getInvoiceStatus(invoice, today);
    if (!invoice?.dueDate || status === "paid") return false;

    const due = new Date(`${invoice.dueDate}T00:00:00`);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((due - start) / (24 * 60 * 60 * 1000));
    return diffDays <= 3;
  });
}

function getApartmentFlats(data) {
  return data?.customers || [];
}

function getApartmentCollectionsForMonth(data, mk) {
  const monthValue = normalizeMonthValue(mk);
  return (data?.income || []).filter(item => {
    const itemMonth = normalizeMonthValue(item.collectionMonth || item.month || item.date?.slice(0, 7) || "");
    return itemMonth === monthValue;
  });
}

function getApartmentCollectionsForYear(data, year) {
  const yearValue = String(year);
  return (data?.income || []).filter(item => {
    const itemMonth = normalizeMonthValue(item.collectionMonth || item.month || item.date?.slice(0, 7) || "");
    return itemMonth.slice(0, 4) === yearValue;
  });
}

function getApartmentExpectedCollection(flats) {
  return flats.reduce((sum, flat) => sum + toNumber(flat.monthlyMaintenance), 0);
}

function isMonthlyMaintenanceCollection(item) {
  return String(item?.collectionType || "Monthly Maintenance").trim().toLowerCase() === "monthly maintenance";
}

function getApartmentExpenseCategoryMap(expenses) {
  return expenses.reduce((map, expense) => {
    const category = expense.category || expense.expenseType || "Other";
    map[category] = (map[category] || 0) + toNumber(expense.amount);
    return map;
  }, {});
}

function getApartmentUnpaidFlats(flats, collections) {
  const { unpaidFlats } = getApartmentCollectionHealth(flats, collections);
  return unpaidFlats;
}

function getApartmentCollectionHealth(flats, collections) {
  const paidByFlat = collections.reduce((map, item) => {
    const flatNumber = String(item.flatNumber || "").trim();
    if (!flatNumber) return map;
    map[flatNumber] = (map[flatNumber] || 0) + toNumber(item.amount);
    return map;
  }, {});
  let expectedTotal = 0;
  let pendingDuesAmount = 0;
  let cappedCollectedAmount = 0;

  const unpaidFlats = flats.filter(flat => {
    const flatNumber = String(flat.name || flat.flatNumber || "").trim();
    const expected = toNumber(flat.monthlyMaintenance);
    if (expected <= 0) return false;
    const paid = toNumber(paidByFlat[flatNumber]);
    const due = Math.max(0, expected - paid);
    expectedTotal += expected;
    pendingDuesAmount += due;
    cappedCollectedAmount += Math.min(expected, paid);
    return due > 0;
  });

  return {
    unpaidFlats,
    expectedTotal,
    pendingDuesAmount,
    cappedCollectedAmount
  };
}

function parseMonthKey(value) {
  const [yearRaw, monthRaw] = String(value || "").split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month: month - 1 };
}

function formatMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getNextMonthKey(value) {
  const parsed = parseMonthKey(value);
  if (!parsed) return null;
  const date = new Date(parsed.year, parsed.month + 1, 1);
  return formatMonthKey(date.getFullYear(), date.getMonth());
}

function getApartmentStartMonthKey(data, fallbackKey) {
  const keys = [];
  (data?.income || []).forEach(item => {
    const itemMonth = normalizeMonthValue(item.collectionMonth || item.month || item.date?.slice(0, 7));
    if (parseMonthKey(itemMonth)) keys.push(itemMonth);
  });
  (data?.expenses || []).forEach(item => {
    const expenseMonth = normalizeMonthValue(item.month || item.startMonth);
    if (parseMonthKey(expenseMonth)) keys.push(expenseMonth);
  });
  if (!keys.length) return fallbackKey;
  return keys.sort((a, b) => String(a).localeCompare(String(b)))[0] || fallbackKey;
}

function sumApartmentReserveToMonth(data, year, month) {
  const endKey = monthKey(year, month);
  const startKey = getApartmentStartMonthKey(data, endKey);
  let pointerKey = startKey;
  let runningTotal = 0;

  while (pointerKey && pointerKey <= endKey) {
    const income = getApartmentCollectionsForMonth(data, pointerKey).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expenses = sumExpensesForMonth(data, pointerKey);
    runningTotal += income - expenses;
    pointerKey = getNextMonthKey(pointerKey);
  }
  return runningTotal;
}

export function calculateApartmentDashboard(data, year, month) {
  const mk = monthKey(year, month);
  const flats = getApartmentFlats(data);
  const residents = flats.reduce((count, flat) => count + (flat.ownerName ? 1 : 0) + (flat.tenantName ? 1 : 0), 0);
  const collections = getApartmentCollectionsForMonth(data, mk);
  const maintenanceCollections = collections.filter(isMonthlyMaintenanceCollection);
  const totalIncome = collections.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const maintenanceCollected = maintenanceCollections.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalExpense = sumExpensesForMonth(data, mk);
  const profit = totalIncome - totalExpense;
  const collectionHealth = getApartmentCollectionHealth(flats, maintenanceCollections);
  const expectedCollection = collectionHealth.expectedTotal || getApartmentExpectedCollection(flats);
  const collectionRate = expectedCollection > 0 ? Math.min(100, (collectionHealth.cappedCollectedAmount / expectedCollection) * 100) : 0;
  const pendingDuesAmount = collectionHealth.pendingDuesAmount;
  const unpaidFlats = collectionHealth.unpaidFlats;
  const monthlyReserve = profit;
  const totalReserve = sumApartmentReserveToMonth(data, year, month);
  const directExpenses = (data?.expenses || []).filter(expense => {
      if (expense.recurring) {
        const started = expense.startMonth <= mk;
        const notEnded = !expense.endMonth || expense.endMonth >= mk;
        return started && notEnded;
      }
      return getRecordMonth(expense) === mk;
    });
  const expenseCategoryMap = getApartmentExpenseCategoryMap(directExpenses);
  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const recentCollections = collections
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 6);
  const cashFlow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - (5 - index), 1);
    const flowKey = monthKey(date.getFullYear(), date.getMonth());
    const flowIncome = getApartmentCollectionsForMonth(data, flowKey).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const flowExpense = sumExpensesForMonth(data, flowKey);
    return {
      key: flowKey,
      label: monthLabel(date.getFullYear(), date.getMonth()),
      shortLabel: MONTHS[date.getMonth()],
      income: flowIncome,
      expenses: flowExpense,
      net: flowIncome - flowExpense
    };
  });

  const alertItems = [];
  if (unpaidFlats.length) {
    const fullyCollectedFlats = Math.max(0, flats.length - unpaidFlats.length);
    alertItems.push({
      tone: "gold",
      title: `${unpaidFlats.length} flat(s) pending collection`,
      message: `${fullyCollectedFlats} flat(s) are fully collected and ${unpaidFlats.length} still have pending dues.`
    });
  }
  if (profit < 0) {
    alertItems.push({
      tone: "danger",
      title: "Society expenses exceed collections",
      message: "This month is currently running at a deficit. Review repairs, utilities, and pending collections."
    });
  }

  return {
    monthKey: mk,
    totalIncome,
    totalExpense,
    profit,
    flatsCount: flats.length,
    residentsCount: residents,
    expectedCollection,
    maintenanceCollected,
    collectionRate,
    pendingDuesAmount,
    monthlyReserve,
    totalReserve,
    paidFlatsCount: flats.length ? flats.length - unpaidFlats.length : 0,
    unpaidFlats,
    topExpenseCategories,
    recentCollections,
    cashFlow,
    alertItems,
    pendingInvoices: [],
    pendingInvoiceTotal: 0,
    overdueInvoices: [],
    dueSoonInvoices: [],
    budgetStatus: [],
    burnRateDays: null,
    monthlySavingsGoal: 0,
    goalProgress: 0,
    goalStatus: ""
  };
}

export function calculateApartmentYearlyDashboard(data, year) {
  const flats = getApartmentFlats(data);
  const residents = flats.reduce((count, flat) => count + (flat.ownerName ? 1 : 0) + (flat.tenantName ? 1 : 0), 0);
  const yearlyCollections = getApartmentCollectionsForYear(data, year);
  const totalIncome = yearlyCollections.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const maintenanceCollected = yearlyCollections.filter(isMonthlyMaintenanceCollection).reduce((sum, item) => sum + toNumber(item.amount), 0);
  let totalExpense = 0;
  const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIdx) => {
    const mk = monthKey(year, monthIdx);
    const income = getApartmentCollectionsForMonth(data, mk).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expenses = sumExpensesForMonth(data, mk);
    totalExpense += expenses;
    return {
      key: mk,
      month: monthIdx,
      label: MONTHS[monthIdx],
      income,
      expenses,
      net: income - expenses
    };
  });
  const profit = totalIncome - totalExpense;
  const expectedCollection = getApartmentExpectedCollection(flats) * 12;
  const collectionRate = expectedCollection > 0 ? Math.min(100, (maintenanceCollected / expectedCollection) * 100) : 0;
  const pendingDuesAmount = Math.max(0, expectedCollection - maintenanceCollected);
  const monthlyReserve = monthlyBreakdown[monthlyBreakdown.length - 1]?.net || 0;
  const totalReserve = sumApartmentReserveToMonth(data, year, 11);
  const topExpenseCategories = Object.entries(
    getApartmentExpenseCategoryMap(
      (data?.expenses || []).filter(expense => {
        if (expense.recurring) {
          const yearKey = String(year);
          const startYear = expense.startMonth?.slice(0, 4);
          const endYear = expense.endMonth?.slice(0, 4);
          const started = !startYear || startYear <= yearKey;
          const notEnded = !endYear || endYear >= yearKey;
          return started && notEnded;
        }
        return expense.month?.slice(0, 4) === String(year);
      })
    )
  )
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const alertItems = [];
  if (profit < 0) {
    alertItems.push({
      tone: "danger",
      title: "Society expenses exceed annual collections",
      message: "This year is currently running at a deficit. Review spending and pending collections."
    });
  }

  return {
    year,
    totalIncome,
    totalExpense,
    profit,
    avgMonthlyIncome: totalIncome / 12,
    avgMonthlyExpense: totalExpense / 12,
    flatsCount: flats.length,
    residentsCount: residents,
    expectedCollection,
    maintenanceCollected,
    collectionRate,
    pendingDuesAmount,
    monthlyReserve,
    totalReserve,
    topExpenseCategories,
    monthlyBreakdown,
    alertItems,
    pendingInvoices: [],
    pendingInvoiceTotal: 0,
    overdueInvoices: [],
    dueSoonInvoices: [],
    budgetStatus: [],
    burnRateDays: null,
    monthlySavingsGoal: 0,
    goalProgress: 0,
    goalStatus: ""
  };
}

export function isApartmentOrgData(data) {
  return getOrgType(data?.account?.organizationType || data?.organizationType) === ORG_TYPES.APARTMENT;
}

export function isPersonalOrgData(data) {
  return getOrgType(data?.account?.organizationType || data?.organizationType) === ORG_TYPES.PERSONAL;
}

export function isSmallBusinessOrgData(data) {
  return getOrgType(data?.account?.organizationType || data?.organizationType) === ORG_TYPES.SMALL_BUSINESS;
}

export function isFreelancerOrgData(data) {
  return getOrgType(data?.account?.organizationType || data?.organizationType) === ORG_TYPES.FREELANCER;
}

function isYesValue(value) {
  return String(value || "").trim().toLowerCase() === "yes";
}

function getFreelancerClientName(entry) {
  return String(entry?.clientName || entry?.client || entry?.customer?.name || entry?.billTo?.name || "").trim();
}

function getActiveExpensesForMonth(data, mk) {
  return (data.expenses || []).filter(expense => {
    if (expense.recurring) {
      const started = expense.startMonth <= mk;
      const notEnded = !expense.endMonth || expense.endMonth >= mk;
      return started && notEnded;
    }

    return expense.month === mk;
  });
}

function getExpensesForYear(data, year) {
  return (data.expenses || []).filter(expense => {
    if (expense.recurring) {
      const yearKey = String(year);
      const startYear = expense.startMonth?.slice(0, 4);
      const endYear = expense.endMonth?.slice(0, 4);
      const started = !startYear || startYear <= yearKey;
      const notEnded = !endYear || endYear >= yearKey;
      return started && notEnded;
    }
    return expense.month?.slice(0, 4) === String(year);
  });
}

function getFreelancerTrackedClients(data, payments, invoices) {
  const clientNames = new Set((data.customers || []).map(customer => String(customer.name || "").trim()).filter(Boolean));
  payments.forEach(payment => {
    const clientName = getFreelancerClientName(payment);
    if (clientName) clientNames.add(clientName);
  });
  invoices.forEach(invoice => {
    const clientName = getFreelancerClientName(invoice);
    if (clientName) clientNames.add(clientName);
  });
  return clientNames.size;
}

function getSmallBusinessServices(data) {
  return data?.orgRecords?.services || [];
}

function getSmallBusinessPartners(data) {
  return data?.orgRecords?.partners || [];
}

function getSmallBusinessTeam(data) {
  return data?.orgRecords?.team || [];
}

function getSmallBusinessSales(data) {
  // Include both POS sales (have saleItems) and simple sales (have saleStatus set)
  return (data?.income || []).filter(item =>
    item?.saleStatus != null ||
    (Array.isArray(item?.saleItems) && item.saleItems.length > 0)
  );
}

function isSaleExcludedFromRevenue(status) {
  const cleanStatus = String(status || "pending").trim().toLowerCase();
  return cleanStatus === "canceled" || cleanStatus === "refunded";
}

function summarizeSmallBusinessSales(sales = []) {
  const summary = {
    salesCount: sales.length,
    paidSalesCount: 0,
    pendingSalesCount: 0,
    refundedSalesCount: 0,
    paidSalesTotal: 0,
    pendingSalesTotal: 0,
    refundedSalesTotal: 0,
    netSalesTotal: 0
  };

  sales.forEach(sale => {
    const amount = Math.max(0, toNumber(sale.amount));
    const status = String(sale.saleStatus || "pending").trim().toLowerCase();

    if (status === "paid") {
      summary.paidSalesCount += 1;
      summary.paidSalesTotal += amount;
      summary.netSalesTotal += amount;
      return;
    }

    if (status === "refunded") {
      summary.refundedSalesCount += 1;
      summary.refundedSalesTotal += amount;
      return;
    }

    if (status === "canceled") {
      return;
    }

    summary.pendingSalesCount += 1;
    summary.pendingSalesTotal += amount;
    summary.netSalesTotal += amount;
  });

  return summary;
}

function getRetailInventory(data) {
  return [];
}

function getRetailSuppliers(data) {
  return [];
}

function buildSmallBusinessServiceInsights(services) {
  const normalizedServices = (services || []).map(item => {
    const products = (item.products || []).map(product => ({
      id: product.id,
      productName: String(product.productName || product.name || "").trim(),
      price: Math.max(0, toNumber(product.price ?? product.rate ?? product.defaultAmount)),
      quantity: Math.max(0, toNumber(product.quantity ?? product.stock ?? product.qty)),
      unit: String(product.unit || "").trim() || (String(product.productType || "unit").trim().toLowerCase() === "weight" ? "kg" : "pcs"),
      lowStockAt: Math.max(0, toNumber(product.lowStockAt ?? (String(product.productType || "unit").trim().toLowerCase() === "weight" ? 2 : 10)))
    })).filter(product => product.productName);

    return {
      ...item,
      serviceName: String(item.serviceName || item.productName || item.name || "").trim(),
      notes: String(item.notes || "").trim(),
      products,
      productsCount: products.length
    };
  }).filter(item => item.serviceName);

  const topServices = normalizedServices
    .slice()
    .sort((a, b) => b.productsCount - a.productsCount || a.serviceName.localeCompare(b.serviceName))
    .slice(0, 5);

  const topProducts = normalizedServices
    .flatMap(service => service.products.map(product => ({
      ...product,
      serviceName: service.serviceName
    })))
    .sort((a, b) => b.price - a.price || a.productName.localeCompare(b.productName))
    .slice(0, 8);

  const lowStockProducts = normalizedServices
    .flatMap(service => service.products.map(product => ({
      ...product,
      serviceName: service.serviceName
    })))
    .filter(product => product.quantity < product.lowStockAt)
    .sort((a, b) => a.quantity - b.quantity || a.productName.localeCompare(b.productName));

  return {
    services: normalizedServices,
    topServices,
    topProducts,
    lowStockProducts,
    servicesCount: normalizedServices.length,
    totalProductsCount: normalizedServices.reduce((sum, item) => sum + item.productsCount, 0),
    serviceCatalogValue: normalizedServices.reduce((sum, item) => sum + item.products.reduce((inner, product) => inner + product.price, 0), 0)
  };
}

function buildSmallBusinessPartnerInsights(partners) {
  const normalizedPartners = (partners || []).map(partner => ({
    ...partner,
    partnerName: String(partner.partnerName || partner.vendorName || partner.name || "").trim(),
    balanceDue: Math.max(0, toNumber(partner.balanceDue ?? partner.creditBalance)),
    contact: String(partner.contact || "").trim()
  })).filter(partner => partner.partnerName);

  const partnersWithBalance = normalizedPartners
    .filter(partner => partner.balanceDue > 0)
    .sort((a, b) => b.balanceDue - a.balanceDue || a.partnerName.localeCompare(b.partnerName));

  return {
    partners: normalizedPartners,
    partnersWithBalance,
    partnersCount: normalizedPartners.length,
    partnerBalanceTotal: partnersWithBalance.reduce((sum, partner) => sum + partner.balanceDue, 0)
  };
}

function buildSmallBusinessTeamInsights(teamMembers) {
  const normalizedTeam = (teamMembers || []).map(member => ({
    ...member,
    name: String(member.name || "").trim(),
    role: String(member.role || "").trim(),
    payout: Math.max(0, toNumber(member.payout ?? member.salary))
  })).filter(member => member.name);

  return {
    teamMembers: normalizedTeam,
    teamCount: normalizedTeam.length,
    monthlyPayoutEstimate: normalizedTeam.reduce((sum, member) => sum + member.payout, 0)
  };
}


function startOfMonthValue(year, month) {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function getPersonalEmis(data) {
  return data?.orgRecords?.loans || [];
}

function parseDateParts(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPersonalEmiAmount(emi) {
  return toNumber(emi?.monthlyEmi ?? emi?.emiAmount);
}

export function getPersonalEmiDueDay(emi) {
  const explicitDay = Number(emi?.dueDay);
  if (Number.isFinite(explicitDay) && explicitDay >= 1 && explicitDay <= 31) {
    return explicitDay;
  }

  const legacyValue = String(emi?.dueDate || emi?.nextDueDate || "").trim();
  if (/^\d{1,2}$/.test(legacyValue)) {
    const legacyDay = Number(legacyValue);
    if (legacyDay >= 1 && legacyDay <= 31) {
      return legacyDay;
    }
  }

  const parsedLegacyDate = parseDateParts(legacyValue);
  return parsedLegacyDate?.day || 0;
}

export function getPersonalEmiDueDate(emi) {
  return String(emi?.dueDate || emi?.nextDueDate || "");
}

export function getPersonalEmiEndDate(emi) {
  return String(emi?.endDate || "");
}

function getPersonalEmiStartDate(emi) {
  if (emi?.startDate) {
    return String(emi.startDate);
  }

  const dueDate = getPersonalEmiDueDate(emi);
  if (dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return dueDate;
  }

  return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
}

export function getScheduledEmiDate(emi, year, month) {
  const dueDay = getPersonalEmiDueDay(emi);
  const baseDate = dueDay ? { day: dueDay } : (parseDateParts(getPersonalEmiDueDate(emi)) || parseDateParts(getPersonalEmiStartDate(emi)));
  if (!baseDate?.day) return "";
  const lastDay = new Date(year, month + 1, 0).getDate();
  return isoDate(year, month, Math.min(baseDate.day, lastDay));
}

export function normalizePersonalEmi(emi, year, month) {
  const dueDate = getPersonalEmiDueDate(emi);
  const endDate = getPersonalEmiEndDate(emi);
  const startDate = getPersonalEmiStartDate(emi);
  const scheduledDate = getScheduledEmiDate(emi, year, month);
  return {
    ...emi,
    dueDay: getPersonalEmiDueDay(emi),
    dueDate,
    endDate,
    startDate,
    scheduledDate,
    monthlyEmi: getPersonalEmiAmount(emi)
  };
}

function isActiveEmiForMonth(emi, year, month) {
  if (!emi) return false;
  const periodStart = startOfMonthValue(year, month);
  const periodEnd = endOfMonthValue(year, month);
  const startDate = getPersonalEmiStartDate(emi);
  const endDate = getPersonalEmiEndDate(emi);
  return (!startDate || startDate <= periodEnd) && (!endDate || endDate >= periodStart);
}

function getPersonalMemberNames(data) {
  const names = new Map();
  const addName = value => {
    const name = String(value || "").trim();
    if (!name) return;
    names.set(name.toLowerCase(), name);
  };

  (data?.customers || []).forEach(person => addName(person?.name));
  (data?.income || []).forEach(item => addName(item?.personName));
  (data?.expenses || []).forEach(item => addName(item?.personName));

  return Array.from(names.values());
}

export function getPersonalMemberOptions(data) {
  return getPersonalMemberNames(data).map(name => ({
    value: name,
    label: name
  }));
}

function getRecordMonth(record) {
  return normalizeMonthValue(record?.month || record?.date?.slice(0, 7) || "");
}

function getRecurringStartMonth(record) {
  return normalizeMonthValue(record?.startMonth || record?.date?.slice(0, 7) || "");
}

function getRecurringEndMonth(record) {
  return normalizeMonthValue(record?.endMonth || record?.endDate?.slice(0, 7) || "");
}

function endOfMonthValue(year, month) {
  const lastDay = new Date(year, month + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
}

function calculateEmiDueForMonth(data, year, month) {
  return getPersonalEmis(data)
    .filter(emi => isActiveEmiForMonth(emi, year, month))
    .reduce((sum, emi) => sum + getPersonalEmiAmount(emi), 0);
}

export function calculatePersonalDashboard(data, year, month) {
  const mk = monthKey(year, month);
  const totalIncome = (data?.income || [])
    .filter(item => getRecordMonth(item) === mk)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const spendingEntries = (data?.expenses || []).filter(expense => {
    if (expense.recurring) {
      const startMonth = getRecurringStartMonth(expense);
      const endMonth = getRecurringEndMonth(expense);
      const started = !startMonth || startMonth <= mk;
      const notEnded = !endMonth || endMonth >= mk;
      return started && notEnded;
    }
    return getRecordMonth(expense) === mk;
  });
  const totalExpense = spendingEntries.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalEmi = calculateEmiDueForMonth(data, year, month);
  const netAfterEmi = totalIncome - totalExpense - totalEmi;
  const people = getPersonalMemberNames(data);
  const activeEmis = getPersonalEmis(data)
    .filter(emi => isActiveEmiForMonth(emi, year, month))
    .map(emi => normalizePersonalEmi(emi, year, month));
  const memberTotals = people.map(name => {
    const income = (data?.income || []).filter(item => getRecordMonth(item) === mk && (item.personName || "") === name).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const spending = spendingEntries.filter(item => (item.personName || "") === name).reduce((sum, item) => sum + toNumber(item.amount), 0);
    return { name, income, spending, net: income - spending, hasActivity: Boolean(income || spending) };
  });
  const expenseCategoryMap = spendingEntries.reduce((map, item) => {
    const category = item.category || "Other";
    map[category] = (map[category] || 0) + toNumber(item.amount);
    return map;
  }, {});
  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const cashFlow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - (5 - index), 1);
    const flowKey = monthKey(date.getFullYear(), date.getMonth());
    const income = (data?.income || []).filter(item => getRecordMonth(item) === flowKey).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expenses = sumExpensesForMonth(data, flowKey);
    const emi = calculateEmiDueForMonth(data, date.getFullYear(), date.getMonth());
    return {
      key: flowKey,
      label: monthLabel(date.getFullYear(), date.getMonth()),
      shortLabel: MONTHS[date.getMonth()],
      income,
      expenses: expenses + emi,
      spending: expenses,
      emi,
      net: income - expenses - emi
    };
  });
  const essentialSpending = spendingEntries
    .filter(item => String(item.necessityType || "Essential").toLowerCase() === "essential")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const nonEssentialSpending = Math.max(0, totalExpense - essentialSpending);
  const goal = getGoalSnapshot(data?.goals);
  const goalContribution = Math.max(0, netAfterEmi);
  const goalLeft = goal.goalLeft;
  const goalProgress = goal.goalProgress;
  const goalStatus = goal.goalStatus;
  const spendingRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : totalExpense > 0 ? 100 : 0;
  const emiRatio = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : totalEmi > 0 ? 100 : 0;
  const biggestExpenseCategory = topExpenseCategories[0] || null;
  const spendingPressure = Math.max(0, totalExpense + totalEmi - totalIncome);
  const upcomingEmis = activeEmis
    .slice()
    .sort((a, b) => String(a.scheduledDate || a.dueDate || "").localeCompare(String(b.scheduledDate || b.dueDate || "")))
    .slice(0, 6);
  const alertItems = [];
  if (netAfterEmi < 0) {
    alertItems.push({
      tone: "danger",
      title: "Household cash flow is negative",
      message: "Earnings are not covering spending and EMI commitments this month."
    });
  }
  if (spendingRatio >= 80) {
    alertItems.push({
      tone: spendingRatio >= 100 ? "danger" : "gold",
      title: "Spending is consuming most of income",
      message: `Household spending is at ${Math.round(spendingRatio)}% of earnings before EMI.`
    });
  }
  if (goal.targetAmount > 0 && goalLeft > 0) {
    alertItems.push({
      tone: "gold",
      title: "Savings goal is still short",
      message: `You still need ${fmtMoneyValue(goalLeft)} to complete your goal.`
    });
  }
  const dueSoonEmis = activeEmis.filter(emi => {
    if (!emi.scheduledDate) return false;
    const today = new Date();
    const due = new Date(`${emi.scheduledDate}T00:00:00`);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((due - start) / (24 * 60 * 60 * 1000));
    return diffDays >= 0 && diffDays <= 7;
  });
  if (dueSoonEmis.length) {
    alertItems.push({
      tone: "gold",
      title: `${dueSoonEmis.length} EMI(s) due soon`,
      message: "Review upcoming loan payments before their due date."
    });
  }

  const actionTips = [];
  if (biggestExpenseCategory && biggestExpenseCategory.amount >= totalExpense * 0.35) {
    actionTips.push({
      title: `Watch ${biggestExpenseCategory.category.toLowerCase()} spending`,
      message: `${biggestExpenseCategory.category} is taking ${Math.round((biggestExpenseCategory.amount / Math.max(1, totalExpense)) * 100)}% of this month's spending.`
    });
  }
  if (nonEssentialSpending > essentialSpending && nonEssentialSpending > 0) {
    actionTips.push({
      title: "Trim non-essential purchases first",
      message: `Non-essential spending is ${fmtMoneyValue(nonEssentialSpending)}, which is above essential spending this month.`
    });
  }
  if (emiRatio >= 35) {
    actionTips.push({
      title: "EMI load is heavy",
      message: `EMIs take ${Math.round(emiRatio)}% of earnings. Consider prepaying smaller loans when cash flow improves.`
    });
  }
  if (goal.targetAmount > 0 && goalContribution > 0) {
    actionTips.push({
      title: "Move surplus to your goal early",
      message: `${fmtMoneyValue(goalContribution)} is free after spending and EMI. Moving part of it to the goal will reduce the remaining gap faster.`
    });
  }
  if (!actionTips.length) {
    actionTips.push({
      title: "Household spending is balanced",
      message: "Keep tagging each earning and spending entry to maintain clear family-level trends."
    });
  }

  return {
    monthKey: mk,
    totalIncome,
    totalExpense,
    totalEmi,
    netAfterEmi,
    peopleCount: people.length,
    activeLoansCount: activeEmis.length,
    memberTotals,
    topExpenseCategories,
    cashFlow,
    upcomingEmis,
    alertItems,
    monthlySavingsGoal: goal.targetAmount,
    goalTargetAmount: goal.targetAmount,
    goalTargetDate: goal.targetDate,
    goalSavedAmount: goal.savedAmount,
    goalNote: goal.note,
    goalContribution,
    goalLeft,
    goalProgress,
    goalStatus,
    spendingRatio,
    emiRatio,
    essentialSpending,
    nonEssentialSpending,
    biggestExpenseCategory,
    spendingPressure,
    actionTips
  };
}

export function calculatePersonalYearlyDashboard(data, year) {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalEmi = 0;
  const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIdx) => {
    const mk = monthKey(year, monthIdx);
    const income = (data?.income || []).filter(item => getRecordMonth(item) === mk).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expenses = sumExpensesForMonth(data, mk);
    const emi = calculateEmiDueForMonth(data, year, monthIdx);
    totalIncome += income;
    totalExpense += expenses;
    totalEmi += emi;
    return {
      key: mk,
      month: monthIdx,
      label: MONTHS[monthIdx],
      income,
      expenses: expenses + emi,
      spending: expenses,
      emi,
      net: income - expenses - emi
    };
  });
  const today = new Date();
  const activeEmis = getPersonalEmis(data)
    .filter(emi => !getPersonalEmiEndDate(emi) || getPersonalEmiEndDate(emi) >= `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`)
    .map(emi => normalizePersonalEmi(emi, today.getFullYear(), today.getMonth()));
  const people = getPersonalMemberNames(data);
  const topExpenseCategories = Object.entries(
    ((data?.expenses || []).filter(expense => {
      if (expense.recurring) {
        const yearKey = String(year);
        const startYear = getRecurringStartMonth(expense).slice(0, 4);
        const endYear = getRecurringEndMonth(expense).slice(0, 4);
        return (!startYear || startYear <= yearKey) && (!endYear || endYear >= yearKey);
      }
      return getRecordMonth(expense).slice(0, 4) === String(year);
    })).reduce((map, item) => {
      const category = item.category || "Other";
      map[category] = (map[category] || 0) + toNumber(item.amount);
      return map;
    }, {})
  ).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const goal = getGoalSnapshot(data?.goals);
  const yearlyGoalTarget = goal.targetAmount;
  const netAfterEmi = totalIncome - totalExpense - totalEmi;
  const goalContribution = Math.max(0, netAfterEmi);
  const goalLeft = goal.goalLeft;
  const goalProgress = goal.goalProgress;
  const goalStatus = goal.goalStatus;
  const spendingRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : totalExpense > 0 ? 100 : 0;
  const emiRatio = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : totalEmi > 0 ? 100 : 0;
  const alertItems = [];
  if (netAfterEmi < 0) {
    alertItems.push({
      tone: "danger",
      title: "Household cash flow is negative",
      message: "This year is currently running below your combined spending and EMI commitments."
    });
  }
  if (spendingRatio >= 80) {
    alertItems.push({
      tone: spendingRatio >= 100 ? "danger" : "gold",
      title: "Spending is consuming most of income",
      message: `Household spending is at ${Math.round(spendingRatio)}% of earnings before EMI this year.`
    });
  }

  const actionTips = [];
  const biggestExpenseCategory = topExpenseCategories[0] || null;
  if (biggestExpenseCategory && biggestExpenseCategory.amount >= totalExpense * 0.3) {
    actionTips.push({
      title: `Review ${biggestExpenseCategory.category.toLowerCase()} over the year`,
      message: `${biggestExpenseCategory.category} is the largest spending bucket this year.`
    });
  }
  if (emiRatio >= 35) {
    actionTips.push({
      title: "EMI load is high across the year",
      message: `EMIs consumed ${Math.round(emiRatio)}% of earnings. Keep extra cash focused on reducing outstanding balances.`
    });
  }
  if (yearlyGoalTarget > 0 && goalContribution > 0) {
    actionTips.push({
      title: "Protect yearly savings momentum",
      message: `${fmtMoneyValue(goalContribution)} remains after yearly spending and EMI. Keep ring-fencing it for the goal instead of letting it drift into extra spending.`
    });
  }
  if (!actionTips.length) {
    actionTips.push({
      title: "Household spending is balanced",
      message: "Keep tracking member-wise entries to hold this trend through the year."
    });
  }

  return {
    year,
    totalIncome,
    totalExpense,
    totalEmi,
    netAfterEmi,
    avgMonthlyIncome: totalIncome / 12,
    avgMonthlyExpense: totalExpense / 12,
    avgMonthlyEmi: totalEmi / 12,
    peopleCount: people.length,
    activeLoansCount: activeEmis.length,
    topExpenseCategories,
    monthlyBreakdown,
    upcomingEmis: activeEmis.slice().sort((a, b) => String(a.scheduledDate || a.dueDate || "").localeCompare(String(b.scheduledDate || b.dueDate || ""))).slice(0, 6),
    alertItems,
    monthlySavingsGoal: goal.targetAmount,
    goalTargetAmount: goal.targetAmount,
    goalTargetDate: goal.targetDate,
    goalSavedAmount: goal.savedAmount,
    goalNote: goal.note,
    yearlyGoalTarget,
    goalContribution,
    goalLeft,
    goalProgress,
    goalStatus,
    spendingRatio,
    emiRatio,
    biggestExpenseCategory,
    actionTips
  };
}

export function getNextInvoiceNumber(invoices, date = new Date()) {
  const year = date.getFullYear();
  const prefix = `INV-${year}-`;
  const maxSeq = getFinancialInvoices(invoices).reduce((max, invoice) => {
    if (!invoice?.number?.startsWith(prefix)) return max;
    const seq = Number(invoice.number.slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

export function getNextQuoteNumber(invoices, date = new Date()) {
  const year = date.getFullYear();
  const prefix = `QUO-${year}-`;
  const maxSeq = (invoices || []).reduce((max, invoice) => {
    if (!isQuoteDocument(invoice) || !invoice?.number?.startsWith(prefix)) return max;
    const seq = Number(invoice.number.slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

function monthLabel(year, month) {
  return `${MONTHS[month]} ${year}`;
}

function sumIncomeForMonth(data, mk) {
  const manual = (data.income || [])
    .filter(item => getRecordMonth(item) === mk)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  if (isApartmentOrgData(data)) {
    return manual;
  }

  const invoices = getFinancialInvoices(data.invoices)
    .filter(invoice => getInvoiceStatus(invoice) === "paid" && invoice.paidDate?.slice(0, 7) === mk)
    .reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0);

  return manual + invoices;
}

function sumExpensesForMonth(data, mk) {
  return (data.expenses || []).reduce((sum, expense) => {
    if (expense.recurring) {
      const startMonth = getRecurringStartMonth(expense);
      const endMonth = getRecurringEndMonth(expense);
      const started = !startMonth || startMonth <= mk;
      const notEnded = !endMonth || endMonth >= mk;
      return started && notEnded ? sum + toNumber(expense.amount) : sum;
    }

    return getRecordMonth(expense) === mk ? sum + toNumber(expense.amount) : sum;
  }, 0);
}

export function calculateDashboard(data, year, month) {
  const mk = monthKey(year, month);
  const today = new Date();
  const income = sumIncomeForMonth(data, mk);
  const expenses = sumExpensesForMonth(data, mk);
  const profit = income - expenses;

  const cashFlow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - (5 - index), 1);
    const flowKey = monthKey(date.getFullYear(), date.getMonth());
    const monthIncome = sumIncomeForMonth(data, flowKey);
    const monthExpense = sumExpensesForMonth(data, flowKey);

    return {
      key: flowKey,
      label: monthLabel(date.getFullYear(), date.getMonth()),
      shortLabel: MONTHS[date.getMonth()],
      income: monthIncome,
      expenses: monthExpense,
      net: monthIncome - monthExpense
    };
  });

  const activeExpenses = getActiveExpensesForMonth(data, mk);

  const expenseCategoryMap = activeExpenses.reduce((map, expense) => {
    const category = expense.category || "Other";
    map[category] = (map[category] || 0) + toNumber(expense.amount);
    return map;
  }, {});

  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const budgetMap = data.budgets || {};
  const budgetStatus = Object.entries(budgetMap)
    .map(([category, budget]) => {
      const spent = expenseCategoryMap[category] || 0;
      const limit = toNumber(budget);
      const progress = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        category,
        budget: limit,
        spent,
        remaining: Math.max(0, limit - spent),
        progress
      };
    })
    .filter(item => item.budget > 0)
    .sort((a, b) => b.progress - a.progress);

  const invoices = getFinancialInvoices(data.invoices).map(invoice => {
    const status = getInvoiceStatus(invoice, today);
    return {
      ...invoice,
      computedStatus: status,
      total: invoiceGrandTotal(invoice),
      dueMessage: getInvoiceDueMessage(invoice, today)
    };
  });

  const pendingInvoices = invoices.filter(invoice => invoice.computedStatus !== "paid");
  const overdueInvoices = invoices.filter(invoice => invoice.computedStatus === "overdue");
  const dueSoonInvoices = getReminderInvoices(invoices, today);
  const pendingInvoiceTotal = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const customerRevenueMap = {};
  const customerStatusMap = {};
  invoices.forEach(invoice => {
    const customerName = invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer";
    customerRevenueMap[customerName] = (customerRevenueMap[customerName] || 0) + invoice.total;

    if (!customerStatusMap[customerName]) {
      customerStatusMap[customerName] = { total: 0, overdue: 0, pending: 0, paid: 0 };
    }
    customerStatusMap[customerName].total += 1;
    customerStatusMap[customerName][invoice.computedStatus] += 1;
  });

  const topCustomers = Object.entries(customerRevenueMap)
    .map(([name, revenue]) => ({
      name,
      revenue,
      balance: pendingInvoices
        .filter(invoice => (invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer") === name)
        .reduce((sum, invoice) => sum + invoice.total, 0)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const highRiskCustomers = Object.entries(customerStatusMap)
    .map(([name, stats]) => ({
      name,
      lateRatio: stats.total ? stats.overdue / stats.total : 0,
      overdueCount: stats.overdue,
      stats
    }))
    .filter(customer => customer.overdueCount > 0)
    .sort((a, b) => b.lateRatio - a.lateRatio || b.overdueCount - a.overdueCount)
    .slice(0, 3);

  const availableCash = Math.max(0, profit);
  const avgDailyExpense = expenses / 30 || 0;
  const burnRateDays = avgDailyExpense > 0 ? Math.floor(availableCash / avgDailyExpense) : null;
  const goal = getGoalSnapshot(data.goals);

  const alertItems = [];
  if (overdueInvoices.length) {
    alertItems.push({
      tone: "danger",
      title: `${overdueInvoices.length} overdue invoice(s)`,
      message: `Pending recovery of ${pendingInvoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    });
  }
  if (dueSoonInvoices.length) {
    alertItems.push({
      tone: "gold",
      title: `${dueSoonInvoices.length} invoice reminder(s)`,
      message: "Some invoices are due within the next 3 days."
    });
  }
  const recentNet = cashFlow.slice(-3).reduce((sum, item) => sum + item.net, 0);
  if (recentNet < 0) {
    alertItems.push({
      tone: "danger",
      title: "Spending is ahead of earnings",
      message: "Your last 3 months have a combined negative cash flow."
    });
  }
  const averagePastExpense = cashFlow.slice(0, -1).reduce((sum, item) => sum + item.expenses, 0) / Math.max(1, cashFlow.length - 1);
  if (averagePastExpense > 0 && expenses > averagePastExpense * 1.4) {
    alertItems.push({
      tone: "gold",
      title: "High spending alert",
      message: `You spent ${Math.round((expenses / averagePastExpense - 1) * 100)}% more than your recent average.`
    });
  }
  if (profit < 0) {
    alertItems.push({
      tone: "danger",
      title: "Low balance warning",
      message: "This month is currently running at a loss. Review variable expenses and pending collections."
    });
  }
  budgetStatus.filter(item => item.progress >= 100).forEach(item => {
    alertItems.push({
      tone: "danger",
      title: `${item.category} budget exceeded`,
      message: `Spent ${fmtMoneyValue(item.spent)} against a budget of ${fmtMoneyValue(item.budget)}.`
    });
  });

  return {
    monthKey: mk,
    totalIncome: income,
    totalExpense: expenses,
    profit,
    pendingInvoiceTotal,
    pendingInvoices,
    overdueInvoices,
    dueSoonInvoices,
    topExpenseCategories,
    budgetStatus,
    burnRateDays,
    cashFlow,
    topCustomers,
    highRiskCustomers,
    monthlySavingsGoal: goal.targetAmount,
    goalTargetAmount: goal.targetAmount,
    goalTargetDate: goal.targetDate,
    goalSavedAmount: goal.savedAmount,
    goalNote: goal.note,
    goalLeft: goal.goalLeft,
    goalProgress: goal.goalProgress,
    goalStatus: goal.goalStatus,
    alertItems
  };
}

function fmtMoneyValue(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calculateYearlyDashboard(data, year) {
  const today = new Date();
  let totalIncome = 0;
  let totalExpense = 0;

  // Sum all months in the year
  for (let month = 0; month < 12; month++) {
    const mk = monthKey(year, month);
    totalIncome += sumIncomeForMonth(data, mk);
    totalExpense += sumExpensesForMonth(data, mk);
  }

  const profit = totalIncome - totalExpense;

  // Calculate monthly breakdown for visualization
  const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIdx) => {
    const mk = monthKey(year, monthIdx);
    const monthIncome = sumIncomeForMonth(data, mk);
    const monthExpense = sumExpensesForMonth(data, mk);
    return {
      key: mk,
      month: monthIdx,
      label: MONTHS[monthIdx],
      income: monthIncome,
      expenses: monthExpense,
      net: monthIncome - monthExpense
    };
  });

  // Year-to-date invoices and customers
  const invoices = getFinancialInvoices(data.invoices)
    .filter(invoice => invoice.date?.slice(0, 4) === String(year))
    .map(invoice => {
      const status = getInvoiceStatus(invoice, today);
      return {
        ...invoice,
        computedStatus: status,
        total: invoiceGrandTotal(invoice),
        dueMessage: getInvoiceDueMessage(invoice, today)
      };
    });

  const pendingInvoices = invoices.filter(invoice => invoice.computedStatus !== "paid");
  const overdueInvoices = invoices.filter(invoice => invoice.computedStatus === "overdue");
  const dueSoonInvoices = getReminderInvoices(invoices, today);
  const pendingInvoiceTotal = pendingInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  // Top customers for the year
  const customerRevenueMap = {};
  invoices.forEach(invoice => {
    const customerName = invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer";
    customerRevenueMap[customerName] = (customerRevenueMap[customerName] || 0) + invoice.total;
  });

  const topCustomers = Object.entries(customerRevenueMap)
    .map(([name, revenue]) => ({
      name,
      revenue,
      balance: pendingInvoices
        .filter(invoice => (invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer") === name)
        .reduce((sum, invoice) => sum + invoice.total, 0)
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const customerStatusMap = {};
  invoices.forEach(invoice => {
    const customerName = invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer";
    if (!customerStatusMap[customerName]) {
      customerStatusMap[customerName] = { total: 0, overdue: 0, pending: 0, paid: 0 };
    }
    customerStatusMap[customerName].total += 1;
    customerStatusMap[customerName][invoice.computedStatus] += 1;
  });

  const highRiskCustomers = Object.entries(customerStatusMap)
    .map(([name, stats]) => ({
      name,
      lateRatio: stats.total ? stats.overdue / stats.total : 0,
      overdueCount: stats.overdue,
      stats
    }))
    .filter(customer => customer.overdueCount > 0)
    .sort((a, b) => b.lateRatio - a.lateRatio || b.overdueCount - a.overdueCount)
    .slice(0, 3);

  // Year-to-date expense categories
  const yearExpenses = getExpensesForYear(data, year);

  const expenseCategoryMap = yearExpenses.reduce((map, expense) => {
    const category = expense.category || "Other";
    map[category] = (map[category] || 0) + toNumber(expense.amount);
    return map;
  }, {});

  const topExpenseCategories = Object.entries(expenseCategoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const budgetMap = data.budgets || {};
  const budgetStatus = Object.entries(budgetMap)
    .map(([category, budget]) => {
      const spent = expenseCategoryMap[category] || 0;
      const limit = toNumber(budget);
      const progress = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        category,
        budget: limit,
        spent,
        remaining: Math.max(0, limit - spent),
        progress
      };
    })
    .filter(item => item.budget > 0)
    .sort((a, b) => b.progress - a.progress);

  const avgMonthlyIncome = totalIncome / 12;
  const avgMonthlyExpense = totalExpense / 12;
  const availableCash = Math.max(0, profit);
  const burnRateDays = avgMonthlyExpense > 0 ? Math.floor((availableCash / avgMonthlyExpense) * 30) : null;
  const goal = getGoalSnapshot(data.goals);

  const alertItems = [];
  if (overdueInvoices.length) {
    alertItems.push({
      tone: "danger",
      title: `${overdueInvoices.length} overdue invoice(s)`,
      message: `Pending recovery of ${pendingInvoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    });
  }
  if (dueSoonInvoices.length) {
    alertItems.push({
      tone: "gold",
      title: `${dueSoonInvoices.length} invoice reminder(s)`,
      message: "Some invoices are due within the next 3 days."
    });
  }
  if (profit < 0) {
    alertItems.push({
      tone: "danger",
      title: "Low balance warning",
      message: "This year is currently running at a loss. Review spending and collections."
    });
  }
  budgetStatus.filter(item => item.progress >= 100).forEach(item => {
    alertItems.push({
      tone: "danger",
      title: `${item.category} budget exceeded`,
      message: `Spent ${fmtMoneyValue(item.spent)} against a budget of ${fmtMoneyValue(item.budget)}.`
    });
  });

  return {
    year,
    totalIncome,
    totalExpense,
    profit,
    avgMonthlyIncome,
    avgMonthlyExpense,
    pendingInvoiceTotal,
    pendingInvoices,
    overdueInvoices,
    dueSoonInvoices,
    topExpenseCategories,
    topCustomers,
    highRiskCustomers,
    budgetStatus,
    monthlyBreakdown,
    burnRateDays,
    monthlySavingsGoal: goal.targetAmount,
    goalTargetAmount: goal.targetAmount,
    goalTargetDate: goal.targetDate,
    goalSavedAmount: goal.savedAmount,
    goalNote: goal.note,
    goalLeft: goal.goalLeft,
    goalProgress: goal.goalProgress,
    goalStatus: goal.goalStatus,
    alertItems
  };
}

export function calculateFreelancerDashboard(data, year, month) {
  const base = calculateDashboard(data, year, month);
  const mk = monthKey(year, month);
  const payments = (data.income || []).filter(item => item.month === mk);
  const expenses = getActiveExpensesForMonth(data, mk);
  const billableExpenseTotal = expenses.reduce((sum, expense) => sum + (isYesValue(expense.billable) ? toNumber(expense.amount) : 0), 0);
  const trackedClientsCount = getFreelancerTrackedClients(data, payments, data.invoices || []);

  const alertItems = [...base.alertItems];
  if (base.overdueInvoices.length) {
    alertItems.push({
      tone: "gold",
      title: "Overdue invoices need follow-up",
      message: "Some client invoices are overdue. Follow up to keep freelance cash flow moving."
    });
  }
  if (billableExpenseTotal > 0) {
    alertItems.push({
      tone: "gold",
      title: "Billable costs need review",
      message: `${fmtMoneyValue(billableExpenseTotal)} of this month's expenses are marked billable.`
    });
  }

  return {
    ...base,
    trackedClientsCount,
    billableExpenseTotal,
    alertItems
  };
}

export function calculateFreelancerYearlyDashboard(data, year) {
  const base = calculateYearlyDashboard(data, year);
  const payments = (data.income || []).filter(item => item.month?.slice(0, 4) === String(year));
  const expenses = getExpensesForYear(data, year);
  const billableExpenseTotal = expenses.reduce((sum, expense) => sum + (isYesValue(expense.billable) ? toNumber(expense.amount) : 0), 0);
  const trackedClientsCount = getFreelancerTrackedClients(data, payments, data.invoices || []);

  const alertItems = [...base.alertItems];
  if (base.overdueInvoices.length) {
    alertItems.push({
      tone: "gold",
      title: "Outstanding invoices need attention",
      message: "This year still has overdue client invoices that need follow-up."
    });
  }

  return {
    ...base,
    trackedClientsCount,
    billableExpenseTotal,
    alertItems
  };
}

export function calculateSmallBusinessDashboard(data, year, month) {
  const base = calculateDashboard(data, year, month);
  const serviceInsights = buildSmallBusinessServiceInsights(getSmallBusinessServices(data));
  const partnerInsights = buildSmallBusinessPartnerInsights(getSmallBusinessPartners(data));
  const teamInsights = buildSmallBusinessTeamInsights(getSmallBusinessTeam(data));
  const monthSales = getSmallBusinessSales(data).filter(item => getRecordMonth(item) === monthKey(year, month));
  const salesSummary = summarizeSmallBusinessSales(monthSales);
  const pendingCustomerMap = {};
  monthSales.forEach(sale => {
    if (String(sale.saleStatus || "pending").trim().toLowerCase() !== "pending") return;
    const customerName = String(sale.customerName || "").trim() || "Customer";
    pendingCustomerMap[customerName] = (pendingCustomerMap[customerName] || 0) + toNumber(sale.amount);
  });
  const pendingCustomers = Object.entries(pendingCustomerMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, amount]) => ({ name, amount }));
  const mk = monthKey(year, month);
  const activeExpenses = getActiveExpensesForMonth(data, mk);
  const teamPayoutTotal = activeExpenses
    .filter(expense => String(expense.expenseType || expense.category || "").trim().toLowerCase() === "team payout" || String(expense.category || "").trim().toLowerCase() === "payroll")
    .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

  const salesByCustomerMap = {};
  monthSales.forEach(sale => {
    const status = String(sale.saleStatus || "pending").trim().toLowerCase();
    if (isSaleExcludedFromRevenue(status)) return;
    const customerName = String(sale.customerName || "Walk-in Customer").trim() || "Walk-in Customer";
    salesByCustomerMap[customerName] = (salesByCustomerMap[customerName] || 0) + toNumber(sale.amount);
  });
  const topSaleCustomers = Object.entries(salesByCustomerMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const adjustedCashFlow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(year, month - (5 - index), 1);
    const flowKey = monthKey(date.getFullYear(), date.getMonth());
    const flowSales = summarizeSmallBusinessSales(getSmallBusinessSales(data).filter(item => getRecordMonth(item) === flowKey));
    const flowExpense = sumExpensesForMonth(data, flowKey);
    return {
      key: flowKey,
      label: monthLabel(date.getFullYear(), date.getMonth()),
      shortLabel: MONTHS[date.getMonth()],
      income: flowSales.netSalesTotal,
      expenses: flowExpense,
      net: flowSales.netSalesTotal - flowExpense
    };
  });

  const adjustedIncome = salesSummary.netSalesTotal;
  const adjustedProfit = adjustedIncome - base.totalExpense;

  const alertItems = [];
  if (serviceInsights.servicesCount === 0) {
    alertItems.push({
      tone: "gold",
      title: "No services listed yet",
      message: "Add your core services in Settings and attach products so sales entry stays fast and consistent."
    });
  }
  if (salesSummary.pendingSalesCount > 0) {
    alertItems.push({
      tone: salesSummary.pendingSalesTotal > Math.max(adjustedIncome * 0.4, 1) ? "danger" : "gold",
      title: `${salesSummary.pendingSalesCount} pending sale(s)` ,
      message: `${fmtMoneyValue(salesSummary.pendingSalesTotal)} is still awaiting payment.`
    });
  }
  if (salesSummary.refundedSalesCount > 0) {
    alertItems.push({
      tone: "gold",
      title: `${salesSummary.refundedSalesCount} refunded sale(s)`,
      message: `${fmtMoneyValue(salesSummary.refundedSalesTotal)} moved out as refunds in this period.`
    });
  }
  if ((serviceInsights.lowStockProducts || []).length > 0) {
    alertItems.push({
      tone: (serviceInsights.lowStockProducts || []).some(product => product.quantity <= 3) ? "danger" : "gold",
      title: `${serviceInsights.lowStockProducts.length} product(s) low on stock`,
      message: "Some service products have less than 10 quantity left. Refill before next bookings."
    });
  }
  if (partnerInsights.partnerBalanceTotal > 0) {
    alertItems.push({
      tone: partnerInsights.partnerBalanceTotal > Math.max(base.totalExpense, 1) ? "danger" : "gold",
      title: "Partner dues need planning",
      message: `${fmtMoneyValue(partnerInsights.partnerBalanceTotal)} is still due across partners or outside vendors.`
    });
  }
  if (teamInsights.teamCount > 0 && teamPayoutTotal === 0) {
    alertItems.push({
      tone: "gold",
      title: "No team payout logged this month",
      message: "Team members are listed in Settings, but no team payout expense is recorded for this month yet."
    });
  }
  if (adjustedProfit < 0) {
    alertItems.push({
      tone: "danger",
      title: "Expenses are ahead of sales",
      message: "This period is currently running at a loss after excluding refunded or canceled sales."
    });
  }

  return {
    ...base,
    totalIncome: adjustedIncome,
    profit: adjustedProfit,
    cashFlow: adjustedCashFlow,
    ...serviceInsights,
    ...partnerInsights,
    ...teamInsights,
    ...salesSummary,
    pendingCustomers,
    topSaleCustomers,
    teamPayoutTotal,
    alertItems
  };
}

export function calculateSmallBusinessYearlyDashboard(data, year) {
  const base = calculateYearlyDashboard(data, year);
  const serviceInsights = buildSmallBusinessServiceInsights(getSmallBusinessServices(data));
  const partnerInsights = buildSmallBusinessPartnerInsights(getSmallBusinessPartners(data));
  const teamInsights = buildSmallBusinessTeamInsights(getSmallBusinessTeam(data));
  const yearSales = getSmallBusinessSales(data).filter(item => getRecordMonth(item)?.slice(0, 4) === String(year));
  const salesSummary = summarizeSmallBusinessSales(yearSales);
  const yearExpenses = getExpensesForYear(data, year);
  const teamPayoutTotal = yearExpenses
    .filter(expense => String(expense.expenseType || expense.category || "").trim().toLowerCase() === "team payout" || String(expense.category || "").trim().toLowerCase() === "payroll")
    .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

  const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIdx) => {
    const mk = monthKey(year, monthIdx);
    const monthSales = summarizeSmallBusinessSales(getSmallBusinessSales(data).filter(item => getRecordMonth(item) === mk));
    const expenses = sumExpensesForMonth(data, mk);
    return {
      key: mk,
      month: monthIdx,
      label: MONTHS[monthIdx],
      income: monthSales.netSalesTotal,
      expenses,
      net: monthSales.netSalesTotal - expenses
    };
  });

  const adjustedIncome = salesSummary.netSalesTotal;
  const adjustedProfit = adjustedIncome - base.totalExpense;

  const salesByCustomerMap = {};
  yearSales.forEach(sale => {
    const status = String(sale.saleStatus || "pending").trim().toLowerCase();
    if (isSaleExcludedFromRevenue(status)) return;
    const customerName = String(sale.customerName || "Walk-in Customer").trim() || "Walk-in Customer";
    salesByCustomerMap[customerName] = (salesByCustomerMap[customerName] || 0) + toNumber(sale.amount);
  });
  const topSaleCustomers = Object.entries(salesByCustomerMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const alertItems = [];
  if (serviceInsights.servicesCount === 0) {
    alertItems.push({
      tone: "gold",
      title: "Service catalog is still empty",
      message: "Add your services and products in Settings to keep work types consistent across the year."
    });
  }
  if (salesSummary.pendingSalesCount > 0) {
    alertItems.push({
      tone: "gold",
      title: `${salesSummary.pendingSalesCount} pending sale(s) this year`,
      message: `${fmtMoneyValue(salesSummary.pendingSalesTotal)} is awaiting payment in recorded sales.`
    });
  }
  if (salesSummary.refundedSalesCount > 0) {
    alertItems.push({
      tone: "gold",
      title: `${salesSummary.refundedSalesCount} refunded sale(s) this year`,
      message: `${fmtMoneyValue(salesSummary.refundedSalesTotal)} moved out as refunds.`
    });
  }
  if ((serviceInsights.lowStockProducts || []).length > 0) {
    alertItems.push({
      tone: (serviceInsights.lowStockProducts || []).some(product => product.quantity <= 3) ? "danger" : "gold",
      title: `${serviceInsights.lowStockProducts.length} product(s) low on stock`,
      message: "Some products are below 10 quantity. Review and refill inventory in Settings."
    });
  }
  if (partnerInsights.partnerBalanceTotal > 0) {
    alertItems.push({
      tone: "gold",
      title: "Partner dues remain open",
      message: `${fmtMoneyValue(partnerInsights.partnerBalanceTotal)} is outstanding across partner or vendor accounts this year.`
    });
  }

  return {
    ...base,
    totalIncome: adjustedIncome,
    profit: adjustedProfit,
    monthlyBreakdown,
    ...serviceInsights,
    ...partnerInsights,
    ...teamInsights,
    ...salesSummary,
    topSaleCustomers,
    teamPayoutTotal,
    alertItems
  };
}

export function calculateCustomerInsights(data) {
  const invoices = getFinancialInvoices(data.invoices).map(invoice => {
    const customerName = invoice.customer?.name || invoice.billTo?.name || "Walk-in Customer";
    const total = invoiceGrandTotal(invoice);
    const status = getInvoiceStatus(invoice);
    return {
      ...invoice,
      customerName,
      total,
      status,
      dueMessage: getInvoiceDueMessage(invoice)
    };
  });

  return (data.customers || []).map(customer => {
    const customerInvoices = invoices.filter(invoice => (invoice.customer?.id === customer.id) || invoice.customerName === customer.name);
    const totalRevenue = customerInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const outstanding = customerInvoices.filter(invoice => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.total, 0);
    const paidInvoices = customerInvoices.filter(invoice => invoice.status === "paid").length;
    const overdueInvoices = customerInvoices.filter(invoice => invoice.status === "overdue");

    return {
      ...customer,
      totalRevenue,
      outstanding,
      paidInvoices,
      overdueInvoices: overdueInvoices.length,
      risk: overdueInvoices.length > 0 ? (overdueInvoices.length / Math.max(1, customerInvoices.length)) : 0,
      payments: customerInvoices
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          date: invoice.date,
          dueDate: invoice.dueDate,
          status: invoice.status,
          total: invoice.total,
          dueMessage: invoice.dueMessage
        }))
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);
}
