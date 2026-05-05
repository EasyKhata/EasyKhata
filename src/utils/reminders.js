import {
  getFinancialInvoices,
  getInvoiceStatus,
  getPersonalEmiAmount,
  getScheduledEmiDate,
  invoiceGrandTotal,
  isApartmentOrgData,
  isPersonalOrgData
} from "./analytics";

const PREFIX = "ledger_app_notifications";

function keyFor(userId, suffix) {
  return `${PREFIX}_${userId}_${suffix}`;
}

export function getDismissedReminderIds(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(keyFor(userId, "dismissed"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDismissedReminderIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(keyFor(userId, "dismissed"), JSON.stringify(ids));
}

export function getSentBrowserReminderIds(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(keyFor(userId, "sent"));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSentBrowserReminderIds(userId, ids) {
  if (!userId) return;
  localStorage.setItem(keyFor(userId, "sent"), JSON.stringify(ids));
}

/**
 * Build in-app reminders from the pre-computed orgSummary and the raw data arrays
 * already in memory. Keep this light because it runs in the app shell.
 */
export function buildReminders(data, year, month) {
  const summary = data.orgSummary || {};
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const reminders = [];
  const today = new Date();
  const todayStr = toLocalDateKey(today);
  reminders.push(...getDiscussionNoticesForOrg(data.activeOrgId));

  if (isApartmentOrgData(data)) {
    const monthIncome = (data.income || []).filter(item => {
      const itemMonth = item.collectionMonth || item.month || (item.date ? item.date.slice(0, 7) : "");
      return itemMonth === mk && String(item.collectionType || "").trim() === "Monthly Maintenance";
    });

    const paidFlatIds = new Set();
    monthIncome.forEach(item => {
      if (item.customerId) paidFlatIds.add(String(item.customerId));
      if (item.flatNumber) paidFlatIds.add(String(item.flatNumber).trim().toLowerCase());
    });

    const unpaidFlats = (data.customers || []).filter(customer => {
      const byId = customer.id ? paidFlatIds.has(String(customer.id)) : false;
      const byFlat = customer.flatNumber ? paidFlatIds.has(String(customer.flatNumber || customer.name || "").trim().toLowerCase()) : false;
      const byName = customer.name ? paidFlatIds.has(String(customer.name).trim().toLowerCase()) : false;
      return !byId && !byFlat && !byName;
    });
    const totalIncome = monthIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    if (unpaidFlats.length > 0) {
      reminders.push({
        id: `collections-${mk}`,
        type: "pendingCollections",
        tab: "income",
        tone: "gold",
        title: `${unpaidFlats.length} flat(s) pending collection`,
        message: `Collected ${formatPlainMoney(totalIncome)} this month. ${paidFlatIds.size} flat(s) covered, ${unpaidFlats.length} pending: ${unpaidFlats.slice(0, 3).map(customer => customer.name || customer.flatNumber || "Flat").join(", ")}${unpaidFlats.length > 3 ? ` +${unpaidFlats.length - 3} more` : ""}.`
      });
    }

    if ((summary.monthNet ?? 0) < 0) {
      reminders.push({
        id: `society-loss-${mk}`,
        type: "lowBalance",
        tab: "dashboard",
        tone: "danger",
        title: "Society expenses exceed collections",
        message: "This month is currently running at a deficit. Review pending maintenance collections and major expenses."
      });
    }

    return reminders;
  }

  if (isPersonalOrgData(data)) {
    if ((summary.monthNet ?? 0) < 0) {
      reminders.push({
        id: `household-low-balance-${mk}`,
        type: "lowBalance",
        tab: "dashboard",
        tone: "danger",
        title: "Household cash flow is negative",
        message: "This month is running below your combined spending and EMI commitments."
      });
    }

    const activeUnpaidEmis = (data.orgRecords?.loans || [])
      .map(emi => ({
        ...emi,
        scheduledDate: getScheduledEmiDate(emi, year, month),
        amount: getPersonalEmiAmount(emi)
      }))
      .filter(emi => {
        const paidMonths = Array.isArray(emi.paidMonths) ? emi.paidMonths : [];
        if (!emi.scheduledDate || paidMonths.includes(mk)) return false;
        const startDate = String(emi.startDate || "").slice(0, 10);
        const endDate = String(emi.endDate || "").slice(0, 10);
        const monthStart = `${mk}-01`;
        const monthEnd = toLocalDateKey(new Date(year, month + 1, 0));
        return (!startDate || startDate <= monthEnd) && (!endDate || endDate >= monthStart);
      })
      .sort((a, b) => String(a.scheduledDate).localeCompare(String(b.scheduledDate)));

    const dueEmis = activeUnpaidEmis.filter(emi => emi.scheduledDate <= todayStr);
    const upcomingEmis = activeUnpaidEmis.filter(emi => (
      emi.scheduledDate >= todayStr && daysBetween(todayStr, emi.scheduledDate) <= 7
    ));

    if (dueEmis.length > 0) {
      reminders.push({
        id: `household-emi-due-${mk}-${dueEmis.map(item => item.id || item.loanName || item.scheduledDate).join("-")}`,
        type: "emiDue",
        tab: "emi",
        tone: "danger",
        title: `${dueEmis.length} EMI${dueEmis.length !== 1 ? "s" : ""} due`,
        message: `${formatPlainMoney(dueEmis.reduce((sum, emi) => sum + Number(emi.amount || 0), 0))} is due for ${mk}. ${dueEmis.slice(0, 2).map(item => item.loanName || "EMI").join(", ")}${dueEmis.length > 2 ? ` +${dueEmis.length - 2} more` : ""}.`
      });
    } else if (upcomingEmis.length > 0) {
      reminders.push({
        id: `household-emi-upcoming-${mk}-${upcomingEmis.map(item => item.id || item.loanName || item.scheduledDate).join("-")}`,
        type: "emiDue",
        tab: "emi",
        tone: "gold",
        title: `${upcomingEmis.length} EMI${upcomingEmis.length !== 1 ? "s" : ""} coming up`,
        message: `Next due: ${upcomingEmis[0]?.loanName || "EMI"} on ${formatDateLabel(upcomingEmis[0]?.scheduledDate)}. Review or mark paid from EMI.`
      });
    }

    const incomeTotal = summary.monthIncomeTotal || 0;
    const expenseTotal = summary.monthExpenseTotal || 0;
    const spendingRatio = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : expenseTotal > 0 ? 100 : 0;
    if (spendingRatio >= 90) {
      reminders.push({
        id: `household-spending-${mk}`,
        type: "spendingSpike",
        tab: "expenses",
        tone: "gold",
        title: "Household spending needs attention",
        message: `Spending is at ${Math.round(spendingRatio)}% of earnings.`
      });
    }

    return reminders;
  }

  const financialInvoices = getFinancialInvoices(data.invoices || []);
  const openInvoices = financialInvoices
    .map(invoice => ({
      ...invoice,
      computedStatus: getInvoiceStatus(invoice, today),
      total: Number(invoice.grandTotal || invoiceGrandTotal(invoice) || invoice.total || 0)
    }))
    .filter(invoice => invoice.computedStatus !== "paid");

  const overdueInvoices = openInvoices.filter(invoice => invoice.computedStatus === "overdue");
  if (overdueInvoices.length > 0 || (summary.overdueCount || 0) > 0) {
    const overdueAmount = overdueInvoices.length
      ? overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0)
      : Number(summary.overdueAmount || 0);
    reminders.push({
      id: `overdue-${mk}-${overdueInvoices.map(invoice => invoice.id).slice(0, 10).join("-")}`,
      type: "overdueInvoices",
      tab: "invoices",
      tone: "danger",
      title: `${overdueInvoices.length || summary.overdueCount} overdue invoice(s)`,
      message: `Collections worth ${formatPlainMoney(overdueAmount)} are overdue. Follow up from Invoices.`
    });
  }

  const soonStr = toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3));
  const dueSoon = openInvoices.filter(invoice => (
    invoice.computedStatus !== "overdue"
    && invoice.dueDate
    && invoice.dueDate >= todayStr
    && invoice.dueDate <= soonStr
  ));
  if (dueSoon.length > 0) {
    reminders.push({
      id: `due-soon-${mk}-${dueSoon.map(invoice => invoice.id).join("-")}`,
      type: "invoiceDue",
      tab: "invoices",
      tone: "gold",
      title: `${dueSoon.length} invoice reminder(s)`,
      message: "Some invoices are due within the next 3 days. A follow-up now can protect cash flow."
    });
  }

  const otherPending = openInvoices.filter(invoice => (
    invoice.computedStatus !== "overdue" && !dueSoon.some(due => due.id === invoice.id)
  ));
  if (otherPending.length > 0) {
    reminders.push({
      id: `pending-invoices-${mk}-${otherPending.map(invoice => invoice.id).slice(0, 10).join("-")}`,
      type: "invoiceDue",
      tab: "invoices",
      tone: "gold",
      title: `${otherPending.length} invoice${otherPending.length !== 1 ? "s" : ""} pending`,
      message: `${formatPlainMoney(otherPending.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0))} is still awaiting payment.`
    });
  }

  (summary.budgetAlerts || []).filter(item => item.pct >= 100).forEach(item => {
    reminders.push({
      id: `budget-${mk}-${item.category}`,
      type: "budgetAlerts",
      tab: "expenses",
      tone: "danger",
      title: `${item.category} budget exceeded`,
      message: `Spent ${formatPlainMoney(item.spent)} against a budget of ${formatPlainMoney(item.budget)}.`
    });
  });

  if ((summary.monthNet ?? 0) < 0) {
    reminders.push({
      id: `low-balance-${mk}`,
      type: "lowBalance",
      tab: "dashboard",
      tone: "danger",
      title: "Low balance alert",
      message: "This month is currently running at a loss. Review expenses or follow up on pending invoices."
    });
  }

  return reminders;
}

export function filterRemindersByPrefs(reminders, prefs) {
  return reminders.filter(reminder => {
    if (reminder.type === "pendingCollections") return prefs?.pendingCollections !== false;
    if (reminder.type === "emiDue") return prefs?.emiDue !== false;
    return prefs?.[reminder.type] !== false;
  });
}

function formatPlainMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDiscussionNoticesForOrg(activeOrgId) {
  if (typeof localStorage === "undefined") return [];
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith("ek_discussion_notices_"));
    const notices = keys.flatMap(key => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        return [];
      }
    });
    return notices
      .filter(item => !activeOrgId || !item.orgId || String(item.orgId) === String(activeOrgId))
      .map(item => ({
        id: item.id,
        type: "discussion",
        tab: item.tab || "discussions",
        tone: item.tone === "danger" ? "danger" : "gold",
        title: item.title || "Apartment discussion update",
        message: item.message || "There is a new apartment discussion update."
      }));
  } catch {
    return [];
  }
}

function toLocalDateKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(startDateKey, endDateKey) {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  return Math.round((end - start) / 86400000);
}

function formatDateLabel(dateKey) {
  if (!dateKey) return "soon";
  try {
    return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return dateKey;
  }
}
