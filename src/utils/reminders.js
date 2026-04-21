import { isApartmentOrgData, isPersonalOrgData } from "./analytics";

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
 * Build in-app reminders from the pre-computed orgSummary (fetched from the backend)
 * and the raw data arrays already in memory. No heavy dashboard calculations here.
 */
export function buildReminders(data, year, month) {
  const summary = data.orgSummary || {};
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;
  const reminders = [];

  // ── Apartment orgs ────────────────────────────────────────────────────────
  if (isApartmentOrgData(data)) {
    // Derive unpaid flats with a lightweight scan of this month's income entries
    const monthIncome = (data.income || []).filter(i => {
      const m = i.collectionMonth || i.month || (i.date ? i.date.slice(0, 7) : "");
      return m === mk && String(i.collectionType || "").trim() === "Monthly Maintenance";
    });
    // Build paid set from both customerId and flatNumber so either match counts
    const paidFlatIds = new Set();
    monthIncome.forEach(i => {
      if (i.customerId) paidFlatIds.add(String(i.customerId));
      if (i.flatNumber) paidFlatIds.add(String(i.flatNumber).trim().toLowerCase());
    });
    const unpaidFlats = (data.customers || []).filter(c => {
      const byId = c.id ? paidFlatIds.has(String(c.id)) : false;
      const byFlat = c.flatNumber ? paidFlatIds.has(String(c.flatNumber || c.name || "").trim().toLowerCase()) : false;
      const byName = c.name ? paidFlatIds.has(String(c.name).trim().toLowerCase()) : false;
      return !byId && !byFlat && !byName;
    });
    const totalIncome = monthIncome.reduce((s, i) => s + Number(i.amount || 0), 0);

    if (unpaidFlats.length > 0) {
      reminders.push({
        id: `collections-${mk}`,
        type: "pendingCollections",
        tab: "income",
        tone: "gold",
        title: `${unpaidFlats.length} flat(s) pending collection`,
        message: `Collected ${formatPlainMoney(totalIncome)} this month. ${paidFlatIds.size} flat(s) covered · ${unpaidFlats.length} pending: ${unpaidFlats.slice(0, 3).map(c => c.name || c.flatNumber || "Flat").join(", ")}${unpaidFlats.length > 3 ? ` +${unpaidFlats.length - 3} more` : ""}.`
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

  // ── Personal / household orgs ────────────────────────────────────────────
  if (isPersonalOrgData(data)) {
    const monthNet = summary.monthNet ?? 0;
    if (monthNet < 0) {
      reminders.push({
        id: `household-low-balance-${mk}`,
        type: "lowBalance",
        tab: "dashboard",
        tone: "danger",
        title: "Household cash flow is negative",
        message: "This month is running below your combined spending and EMI commitments."
      });
    }

    // Upcoming EMIs: quick scan of expense records marked as EMI
    const upcomingEmis = (data.expenses || []).filter(e => {
      const isEmi = e.emiType === "loan" || e.isEmi || e.monthlyEmi != null;
      if (!isEmi) return false;
      const em = e.month || (e.date ? e.date.slice(0, 7) : "");
      return em === mk;
    });
    if (upcomingEmis.length > 0) {
      reminders.push({
        id: `household-emi-${mk}`,
        type: "invoiceDue",
        tab: "emi",
        tone: "gold",
        title: `${upcomingEmis.length} EMI commitment(s) to watch`,
        message: "Review your upcoming EMI due dates and balances from the EMI section."
      });
    }

    // Spending ratio: use summary values (monthExpenseTotal / monthIncomeTotal)
    const incomeT = summary.monthIncomeTotal || 0;
    const expenseT = summary.monthExpenseTotal || 0;
    const spendingRatio = incomeT > 0 ? (expenseT / incomeT) * 100 : expenseT > 0 ? 100 : 0;
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

  // ── Generic / small_business / freelancer ────────────────────────────────
  // Overdue invoices
  if ((summary.overdueCount || 0) > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const overdueIds = (data.invoices || [])
      .filter(i => (i.status === "overdue") || (i.status === "sent" && i.dueDate && i.dueDate < today))
      .map(i => i.id)
      .slice(0, 10)
      .join("-");
    reminders.push({
      id: `overdue-${mk}-${overdueIds}`,
      type: "overdueInvoices",
      tab: "invoices",
      tone: "danger",
      title: `${summary.overdueCount} overdue invoice(s)`,
      message: `Collections worth ${formatPlainMoney(summary.overdueAmount || 0)} are still pending and overdue.`
    });
  }

  // Invoices due within 3 days
  const soon = new Date();
  const soonStr = new Date(soon.getTime() + 3 * 86400_000).toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueSoon = (data.invoices || []).filter(i =>
    i.status === "sent" && i.dueDate && i.dueDate >= todayStr && i.dueDate <= soonStr
  );
  if (dueSoon.length > 0) {
    reminders.push({
      id: `due-soon-${mk}-${dueSoon.map(i => i.id).join("-")}`,
      type: "invoiceDue",
      tab: "invoices",
      tone: "gold",
      title: `${dueSoon.length} invoice reminder(s)`,
      message: "Some invoices are due within the next 3 days. A follow-up now can protect cash flow."
    });
  }

  // Budget alerts from backend summary
  (summary.budgetAlerts || []).filter(b => b.pct >= 100).forEach(b => {
    reminders.push({
      id: `budget-${mk}-${b.category}`,
      type: "budgetAlerts",
      tab: "expenses",
      tone: "danger",
      title: `${b.category} budget exceeded`,
      message: `Spent ${formatPlainMoney(b.spent)} against a budget of ${formatPlainMoney(b.budget)}.`
    });
  });

  // Negative month
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
    // pendingCollections defaults to ON (not stored means enabled)
    if (reminder.type === "pendingCollections") return prefs?.pendingCollections !== false;
    return prefs?.[reminder.type] !== false;
  });
}

function formatPlainMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
