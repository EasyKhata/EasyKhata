import { calculateDashboard } from "./analytics";

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

export function buildReminders(data, year, month) {
  const stats = calculateDashboard(data, year, month);
  const reminders = [];

  if (stats.overdueInvoices.length) {
    reminders.push({
      id: `overdue-${stats.monthKey}-${stats.overdueInvoices.map(item => item.id).join("-")}`,
      type: "overdueInvoices",
      tab: "invoices",
      tone: "danger",
      title: `${stats.overdueInvoices.length} overdue invoice(s)`,
      message: `Collections worth ${formatPlainMoney(stats.pendingInvoiceTotal)} are still pending and overdue.`
    });
  }

  if (stats.dueSoonInvoices.length) {
    reminders.push({
      id: `due-soon-${stats.monthKey}-${stats.dueSoonInvoices.map(item => item.id).join("-")}`,
      type: "invoiceDue",
      tab: "invoices",
      tone: "gold",
      title: `${stats.dueSoonInvoices.length} invoice reminder(s)`,
      message: "Some invoices are due within the next 3 days. A follow-up now can protect cash flow."
    });
  }

  const exceededBudgets = stats.budgetStatus.filter(item => item.progress >= 100);
  exceededBudgets.forEach(item => {
    reminders.push({
      id: `budget-${stats.monthKey}-${item.category}`,
      type: "budgetAlerts",
      tab: "expenses",
      tone: "danger",
      title: `${item.category} budget exceeded`,
      message: `Spent ${formatPlainMoney(item.spent)} against a budget of ${formatPlainMoney(item.budget)}.`
    });
  });

  if (stats.profit < 0) {
    reminders.push({
      id: `low-balance-${stats.monthKey}`,
      type: "lowBalance",
      tab: "dashboard",
      tone: "danger",
      title: "Low balance alert",
      message: "This month is currently running at a loss. Review expenses or follow up on pending invoices."
    });
  }

  const spendingSpike = stats.alertItems.find(item => item.title === "High spending alert");
  if (spendingSpike) {
    reminders.push({
      id: `spending-spike-${stats.monthKey}`,
      type: "spendingSpike",
      tab: "expenses",
      tone: "gold",
      title: spendingSpike.title,
      message: spendingSpike.message
    });
  }

  return reminders;
}

export function filterRemindersByPrefs(reminders, prefs) {
  return reminders.filter(reminder => prefs?.[reminder.type] !== false);
}

function formatPlainMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
