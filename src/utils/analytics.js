import { invoiceTotal, monthKey, MONTHS } from "../components/UI";

function toNumber(value) {
  return Number(value) || 0;
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

  const monthlySavingsGoal = toNumber(data.goals?.monthlySavings);
  const goalProgress = monthlySavingsGoal > 0 ? Math.max(0, Math.min(100, (profit / monthlySavingsGoal) * 100)) : 0;
  const goalStatus = monthlySavingsGoal <= 0 ? "Set a savings goal" : profit >= monthlySavingsGoal ? "On track" : "Behind schedule";

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
    monthlySavingsGoal,
    goalProgress,
    goalStatus,
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
  const monthlySavingsGoal = toNumber(data.goals?.monthlySavings);
  const goalProgress = monthlySavingsGoal > 0 ? Math.max(0, Math.min(100, (profit / (monthlySavingsGoal * 12)) * 100)) : 0;
  const goalStatus = monthlySavingsGoal <= 0 ? "Set a savings goal" : profit >= monthlySavingsGoal * 12 ? "On track" : "Behind schedule";

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
    monthlySavingsGoal,
    goalProgress,
    goalStatus,
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
