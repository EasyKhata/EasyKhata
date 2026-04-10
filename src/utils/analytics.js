import { invoiceTotal, monthKey, MONTHS } from "../components/UI";
import { ORG_TYPES, getOrgType } from "./orgTypes";

function toNumber(value) {
  return Number(value) || 0;
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

function invoiceTaxTotal(invoice) {
  return (invoice?.items || []).reduce((sum, item) => {
    const taxable = toNumber(item.qty) * toNumber(item.rate);
    const rate = toNumber(item.taxRate ?? item.igst);
    return sum + (taxable * rate) / 100;
  }, 0);
}

export function invoiceGrandTotal(invoice) {
  return invoiceTotal(invoice?.items) + invoiceTaxTotal(invoice);
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
  return (data?.income || []).filter(item => {
    const itemMonth = item.collectionMonth || item.month || item.date?.slice(0, 7) || "";
    return itemMonth === mk;
  });
}

function getApartmentCollectionsForYear(data, year) {
  return (data?.income || []).filter(item => {
    const itemMonth = item.collectionMonth || item.month || item.date?.slice(0, 7) || "";
    return itemMonth.slice(0, 4) === String(year);
  });
}

function getApartmentExpectedCollection(flats) {
  return flats.reduce((sum, flat) => sum + toNumber(flat.monthlyMaintenance), 0);
}

function getApartmentExpenseCategoryMap(expenses) {
  return expenses.reduce((map, expense) => {
    const category = expense.category || expense.expenseType || "Other";
    map[category] = (map[category] || 0) + toNumber(expense.amount);
    return map;
  }, {});
}

function getApartmentUnpaidFlats(flats, collections) {
  const paidFlatNumbers = new Set(collections.map(item => String(item.flatNumber || "").trim()).filter(Boolean));
  return flats.filter(flat => !paidFlatNumbers.has(String(flat.name || flat.flatNumber || "").trim()));
}

function sumApartmentReserveToMonth(data, year, month) {
  let runningTotal = 0;
  for (let monthIdx = 0; monthIdx <= month; monthIdx += 1) {
    const mk = monthKey(year, monthIdx);
    const income = getApartmentCollectionsForMonth(data, mk).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expenses = sumExpensesForMonth(data, mk);
    runningTotal += income - expenses;
  }
  return runningTotal;
}

export function calculateApartmentDashboard(data, year, month) {
  const mk = monthKey(year, month);
  const flats = getApartmentFlats(data);
  const residents = flats.reduce((count, flat) => count + (flat.ownerName ? 1 : 0) + (flat.tenantName ? 1 : 0), 0);
  const collections = getApartmentCollectionsForMonth(data, mk);
  const totalIncome = collections.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalExpense = sumExpensesForMonth(data, mk);
  const profit = totalIncome - totalExpense;
  const expectedCollection = getApartmentExpectedCollection(flats);
  const collectionRate = expectedCollection > 0 ? Math.min(100, (totalIncome / expectedCollection) * 100) : 0;
  const unpaidFlats = getApartmentUnpaidFlats(flats, collections);
  const monthlyReserve = profit;
  const totalReserve = sumApartmentReserveToMonth(data, year, month);
  const directExpenses = (data?.expenses || []).filter(expense => {
      if (expense.recurring) {
        const started = expense.startMonth <= mk;
        const notEnded = !expense.endMonth || expense.endMonth >= mk;
        return started && notEnded;
      }
      return expense.month === mk;
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
    alertItems.push({
      tone: "gold",
      title: `${unpaidFlats.length} flat(s) pending collection`,
      message: `${flats.length - unpaidFlats.length} flat(s) have a recorded collection this month and ${unpaidFlats.length} are still pending.`
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
    collectionRate,
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
  const totalIncome = getApartmentCollectionsForYear(data, year).reduce((sum, item) => sum + toNumber(item.amount), 0);
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
  const collectionRate = expectedCollection > 0 ? Math.min(100, (totalIncome / expectedCollection) * 100) : 0;
  const monthlyReserve = monthlyBreakdown[monthlyBreakdown.length - 1]?.net || 0;
  const totalReserve = profit;
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
    collectionRate,
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

export function getPersonalEmiDueDate(emi) {
  return String(emi?.dueDate || emi?.nextDueDate || "");
}

export function getPersonalEmiEndDate(emi) {
  return String(emi?.endDate || "");
}

function getPersonalEmiStartDate(emi) {
  return String(emi?.startDate || getPersonalEmiDueDate(emi) || "");
}

export function getScheduledEmiDate(emi, year, month) {
  const baseDate = parseDateParts(getPersonalEmiDueDate(emi)) || parseDateParts(getPersonalEmiStartDate(emi));
  if (!baseDate) return "";
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
    dueDate,
    endDate,
    startDate,
    scheduledDate,
    monthlyEmi: getPersonalEmiAmount(emi)
  };
}

function isActiveEmiForMonth(emi, year, month) {
  if (!emi) return false;
  if (String(emi.status || "Active").toLowerCase() === "closed") return false;
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
    .filter(item => item.month === mk)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const spendingEntries = (data?.expenses || []).filter(expense => {
    if (expense.recurring) {
      const started = expense.startMonth <= mk;
      const notEnded = !expense.endMonth || expense.endMonth >= mk;
      return started && notEnded;
    }
    return expense.month === mk;
  });
  const totalExpense = spendingEntries.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalEmi = calculateEmiDueForMonth(data, year, month);
  const netAfterEmi = totalIncome - totalExpense - totalEmi;
  const people = getPersonalMemberNames(data);
  const activeEmis = getPersonalEmis(data)
    .filter(emi => isActiveEmiForMonth(emi, year, month))
    .map(emi => normalizePersonalEmi(emi, year, month));
  const totalOutstanding = activeEmis.reduce((sum, emi) => sum + toNumber(emi.outstandingBalance), 0);
  const memberTotals = people.map(name => {
    const income = (data?.income || []).filter(item => item.month === mk && (item.personName || "") === name).reduce((sum, item) => sum + toNumber(item.amount), 0);
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
    const income = (data?.income || []).filter(item => item.month === flowKey).reduce((sum, item) => sum + toNumber(item.amount), 0);
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
    totalOutstanding,
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
    const income = (data?.income || []).filter(item => item.month === mk).reduce((sum, item) => sum + toNumber(item.amount), 0);
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
    .filter(emi => String(emi.status || "Active").toLowerCase() !== "closed")
    .map(emi => normalizePersonalEmi(emi, today.getFullYear(), today.getMonth()));
  const totalOutstanding = activeEmis.reduce((sum, emi) => sum + toNumber(emi.outstandingBalance), 0);
  const people = getPersonalMemberNames(data);
  const topExpenseCategories = Object.entries(
    ((data?.expenses || []).filter(expense => {
      if (expense.recurring) {
        const yearKey = String(year);
        const startYear = expense.startMonth?.slice(0, 4);
        const endYear = expense.endMonth?.slice(0, 4);
        return (!startYear || startYear <= yearKey) && (!endYear || endYear >= yearKey);
      }
      return expense.month?.slice(0, 4) === String(year);
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
    totalOutstanding,
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
  const maxSeq = (invoices || []).reduce((max, invoice) => {
    if (!invoice?.number?.startsWith(prefix)) return max;
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
    .filter(item => item.month === mk)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  if (isApartmentOrgData(data)) {
    return manual;
  }

  const invoices = (data.invoices || [])
    .filter(invoice => getInvoiceStatus(invoice) === "paid" && invoice.paidDate?.slice(0, 7) === mk)
    .reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0);

  return manual + invoices;
}

function sumExpensesForMonth(data, mk) {
  return (data.expenses || []).reduce((sum, expense) => {
    if (expense.recurring) {
      const started = expense.startMonth <= mk;
      const notEnded = !expense.endMonth || expense.endMonth >= mk;
      return started && notEnded ? sum + toNumber(expense.amount) : sum;
    }

    return expense.month === mk ? sum + toNumber(expense.amount) : sum;
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

  const activeExpenses = (data.expenses || []).filter(expense => {
    if (expense.recurring) {
      const started = expense.startMonth <= mk;
      const notEnded = !expense.endMonth || expense.endMonth >= mk;
      return started && notEnded;
    }

    return expense.month === mk;
  });

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

  const invoices = (data.invoices || []).map(invoice => {
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
  const invoices = (data.invoices || [])
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
  const yearExpenses = (data.expenses || []).filter(expense => {
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

export function calculateCustomerInsights(data) {
  const invoices = (data.invoices || []).map(invoice => {
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
