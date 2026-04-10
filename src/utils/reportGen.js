import { jsPDF } from "jspdf";
import { calculateApartmentDashboard, calculateDashboard, calculatePersonalDashboard, invoiceGrandTotal, isApartmentOrgData, isPersonalOrgData } from "./analytics";
import { MONTHS } from "../components/UI";

const PAGE = {
  left: 16,
  right: 194,
  top: 18,
  bottom: 280
};

function money(value, sym) {
  const prefix = sym === "Rs" ? "Rs " : `${sym}`;
  return `${prefix}${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function safeText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE.bottom) return y;
  doc.addPage();
  return PAGE.top;
}

function sectionTitle(doc, y, title) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 28);
  doc.text(title, PAGE.left, y);
  return y + 8;
}

function drawMetricGrid(doc, y, items) {
  const cardWidth = 86;
  const cardHeight = 24;
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? PAGE.left : 108;
    const cy = y + row * (cardHeight + 8);
    doc.setFillColor(247, 248, 250);
    doc.roundedRect(x, cy, cardWidth, cardHeight, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 110);
    doc.text(safeText(item.label), x + 4, cy + 7);
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 28);
    doc.text(safeText(item.value), x + 4, cy + 17);
  });
  return y + Math.ceil(items.length / 2) * (cardHeight + 8);
}

function drawRows(doc, y, rows) {
  rows.forEach((row, index) => {
    y = ensureSpace(doc, y, 10);
    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 251);
      doc.rect(PAGE.left, y - 5, PAGE.right - PAGE.left, 9, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(25, 25, 32);
    doc.text(safeText(row.label), PAGE.left + 2, y);
    doc.text(safeText(row.value), PAGE.right - 2, y, { align: "right" });
    y += 10;
  });
  return y;
}

function formatUserSubscription(user) {
  const plan = safeText(user.plan || user.subscriptionPlan || "free");
  const status = safeText(user.subscriptionStatus || user.status || "active");
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "joined N/A";
  return `${plan} · ${status} · ${joined}`;
}

function downloadCsv(filename, rows) {
  const csvRows = rows.map(row => row.map(value => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  }).join(","));
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAdminUsersCsv(users) {
  const rows = [
    ["User ID", "Name", "Email", "Phone", "Plan", "Subscription Status", "Joined", "Blocked", "Shared Ledger"]
  ];
  users.forEach(user => {
    rows.push([
      user.id,
      user.name || "",
      user.email || "",
      user.phone || "",
      user.plan || user.subscriptionPlan || "free",
      user.subscriptionStatus || user.status || "active",
      user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "",
      user.blocked ? "Yes" : "No",
      user.sharedLedgerId || ""
    ]);
  });
  downloadCsv(`admin-users-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function downloadAdminRequestsCsv(requests) {
  const rows = [
    ["Request ID", "User ID", "User Name", "Email", "Plan", "Billing Cycle", "Amount", "Status", "Created At", "Updated At", "Transaction ID"]
  ];
  requests.forEach(request => {
    rows.push([
      request.id,
      request.userId || "",
      request.userName || "",
      request.userEmail || "",
      request.requestedPlan || "",
      request.billingCycle || "",
      request.amount || "",
      request.status || "pending",
      request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-IN") : "",
      request.updatedAt ? new Date(request.updatedAt).toLocaleDateString("en-IN") : "",
      request.transactionId || ""
    ]);
  });
  downloadCsv(`admin-requests-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

export function downloadAdminMonthlyReport(data, year, month, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = `Admin Activity Report - ${MONTHS[month]} ${year}`;
  const users = data.users || [];
  const paymentRequests = data.paymentRequests || [];
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const usersAdded = users.filter(user => user.createdAt?.slice(0, 7) === monthKey).length;
  const blockedUsers = users.filter(user => user.blocked).length;
  const adminUsers = users.filter(user => user.role === "admin").length;
  const planCounts = users.reduce(
    (acc, user) => {
      const plan = user.plan || user.subscriptionPlan || "free";
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    },
    {}
  );

  const requestStatusCounts = paymentRequests.reduce(
    (acc, request) => {
      const status = request.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      acc.totalAmount += Number(request.amount) || 0;
      return acc;
    },
    { totalAmount: 0 }
  );

  const activeUsers = users.length - blockedUsers;
  const removedUsersNote = "Removed users are not tracked in this report.";

  let y = PAGE.top;
  doc.setFillColor(22, 22, 28);
  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 24, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, PAGE.left + 4, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, PAGE.left + 4, y + 18);
  y += 32;

  y = sectionTitle(doc, y, "Admin Summary");
  y = drawMetricGrid(doc, y, [
    { label: "Total Users", value: String(users.length) },
    { label: "Admin Users", value: String(adminUsers) },
    { label: "Active Users", value: String(activeUsers) },
    { label: "Blocked Users", value: String(blockedUsers) },
    { label: "Users Added This Month", value: String(usersAdded) },
    { label: "Removed Users", value: removedUsersNote }
  ]);

  y = ensureSpace(doc, y + 2, 44);
  y = sectionTitle(doc, y + 2, "Subscription Breakdown");
  y = drawRows(
    doc,
    y,
    Object.keys(planCounts).length
      ? Object.entries(planCounts).map(([plan, count]) => ({ label: `${safeText(plan)} plan users`, value: String(count) }))
      : [{ label: "No subscription plan data found", value: "--" }]
  );

  y = ensureSpace(doc, y + 2, 44);
  y = sectionTitle(doc, y + 2, "Payment Request Activity");
  y = drawRows(doc, y, [
    { label: "Pending requests", value: String(requestStatusCounts.pending || 0) },
    { label: "Approved requests", value: String(requestStatusCounts.approved || 0) },
    { label: "Rejected requests", value: String(requestStatusCounts.rejected || 0) },
    { label: "Total requested amount", value: money(requestStatusCounts.totalAmount, sym) }
  ]);

  y = ensureSpace(doc, y + 2, 30);
  y = sectionTitle(doc, y + 2, "User Details");
  const userRows = users.slice(0, 22).map(user => ({
    label: `${safeText(user.name || "Unknown")} · ${safeText(user.email || "no email")}`,
    value: formatUserSubscription(user)
  }));

  y = drawRows(doc, y, userRows.length ? userRows : [{ label: "No user data available", value: "--" }]);

  if (users.length > 22) {
    y = ensureSpace(doc, y + 16, 20);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 110);
    doc.text(`Showing first 22 users of ${users.length}.`, PAGE.left, y);
  }

  doc.save(`admin-report-${monthKey}.pdf`);
}

export function downloadMonthlyReport(data, year, month, sym) {
  if (isApartmentOrgData(data)) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const stats = calculateApartmentDashboard(data, year, month);
    const title = `Society Report - ${MONTHS[month]} ${year}`;
    const recentCollections = stats.recentCollections || [];

    let y = PAGE.top;
    doc.setFillColor(22, 22, 28);
    doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 24, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, PAGE.left + 4, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, PAGE.left + 4, y + 18);
    y += 32;

    y = sectionTitle(doc, y, "Society Summary");
    y = drawMetricGrid(doc, y, [
      { label: "Collections", value: money(stats.totalIncome, sym) },
      { label: "Society Expenses", value: money(stats.totalExpense, sym) },
      { label: "Monthly Reserve", value: money(stats.monthlyReserve, sym) },
      { label: "Total Reserve", value: money(stats.totalReserve, sym) },
      { label: "Flats", value: String(stats.flatsCount || 0) },
      { label: "Residents", value: String(stats.residentsCount || 0) }
    ]);

    y = ensureSpace(doc, y + 2, 44);
    y = sectionTitle(doc, y + 2, "Collection Coverage");
    y = drawRows(doc, y, [
      { label: "Flats paid this month", value: String(stats.paidFlatsCount || 0) },
      { label: "Flats pending this month", value: String(stats.unpaidFlats.length || 0) }
    ]);

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Expense Breakdown");
    y = drawRows(
      doc,
      y,
      stats.topExpenseCategories.length
        ? stats.topExpenseCategories.map(item => ({ label: item.category, value: money(item.amount, sym) }))
        : [{ label: "No society expenses recorded this month", value: "--" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Recent Collections");
    y = drawRows(
      doc,
      y,
      recentCollections.length
        ? recentCollections.map(item => ({
            label: `${safeText(item.flatNumber || "Flat")} · ${safeText(item.residentName || "Resident")}`,
            value: `${money(item.amount, sym)}  |  ${safeText(item.collectionType || "Collection")}`
          }))
        : [{ label: "No maintenance collections recorded", value: "--" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Pending Flats");
    y = drawRows(
      doc,
      y,
      stats.unpaidFlats.length
        ? stats.unpaidFlats.slice(0, 18).map(flat => ({
            label: `${safeText(flat.flatNumber || "Flat")} · ${safeText(flat.ownerName || flat.tenantName || "No resident assigned")}`,
            value: flat.phone ? safeText(flat.phone) : "No phone number"
          }))
        : [{ label: "All tracked flats are covered this month", value: "--" }]
    );

    doc.save(`society-report-${stats.monthKey}.pdf`);
    return;
  }

  if (isPersonalOrgData(data)) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const stats = calculatePersonalDashboard(data, year, month);
    const title = `Household Report - ${MONTHS[month]} ${year}`;

    let y = PAGE.top;
    doc.setFillColor(22, 22, 28);
    doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 24, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, PAGE.left + 4, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, PAGE.left + 4, y + 18);
    y += 32;

    y = sectionTitle(doc, y, "Household Summary");
    y = drawMetricGrid(doc, y, [
      { label: "Earnings", value: money(stats.totalIncome, sym) },
      { label: "Spending", value: money(stats.totalExpense, sym) },
      { label: "Monthly EMI", value: money(stats.totalEmi, sym) },
      { label: "Left for Goals", value: money(stats.goalContribution || stats.netAfterEmi || 0, sym) },
      { label: "Goal Gap", value: stats.monthlySavingsGoal ? money(stats.goalLeft || 0, sym) : "--" },
      { label: "Household Members", value: String(stats.peopleCount || 0) }
    ]);

    y = ensureSpace(doc, y + 2, 44);
    y = sectionTitle(doc, y + 2, "Savings Goal");
    y = drawRows(doc, y, [
      { label: "Goal target", value: stats.goalTargetAmount ? money(stats.goalTargetAmount, sym) : "--" },
      { label: "Saved till date", value: money(stats.goalSavedAmount || 0, sym) },
      { label: "Target date", value: safeText(stats.goalTargetDate || "--") },
      { label: "Still needed", value: stats.goalTargetAmount ? money(stats.goalLeft || 0, sym) : "--" },
      { label: "Status", value: safeText(stats.goalStatus || "") },
      { label: "Note", value: safeText(stats.goalNote || "--") }
    ]);

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Household Members");
    y = drawRows(
      doc,
      y,
      stats.memberTotals.length
        ? stats.memberTotals.map(person => ({
            label: person.name,
            value: `${money(person.income, sym)} earned | ${money(person.spending, sym)} spent`
          }))
        : [{ label: "No member activity tagged yet", value: "Add People in Settings or tag entries with a person" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "EMI Commitments");
    y = drawRows(
      doc,
      y,
      stats.upcomingEmis.length
        ? stats.upcomingEmis.map(item => ({
            label: `${safeText(item.loanName || "EMI")} · ${safeText(item.lender || "Lender")}`,
            value: `${money(item.monthlyEmi, sym)} | Due ${safeText(item.scheduledDate || item.dueDate || "--")}${item.endDate ? ` | Ends ${safeText(item.endDate)}` : ""}`
          }))
        : [{ label: "No EMI records found", value: "--" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Spending Insights");
    y = drawRows(doc, y, [
      { label: "Spending ratio", value: `${Math.round(stats.spendingRatio || 0)}% of earnings` },
      { label: "EMI ratio", value: `${Math.round(stats.emiRatio || 0)}% of earnings` },
      { label: "Essential spending", value: money(stats.essentialSpending || 0, sym) },
      { label: "Non-essential spending", value: money(stats.nonEssentialSpending || 0, sym) },
      { label: "Overspend pressure", value: money(stats.spendingPressure || 0, sym) }
    ]);

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Top Spending Categories");
    y = drawRows(
      doc,
      y,
      stats.topExpenseCategories.length
        ? stats.topExpenseCategories.map(item => ({ label: item.category, value: money(item.amount, sym) }))
        : [{ label: "No spending categories recorded", value: "--" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Smart Suggestions");
    y = drawRows(
      doc,
      y,
      (stats.actionTips || []).map(item => ({ label: item.title, value: safeText(item.message) }))
    );

    doc.save(`household-report-${stats.monthKey}.pdf`);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = calculateDashboard(data, year, month);
  const invoices = (data.invoices || []).filter(item => item.date?.slice(0, 7) === stats.monthKey);
  const title = `Ledger Report - ${MONTHS[month]} ${year}`;

  const taxSummary = invoices.reduce(
    (totals, invoice) => {
      (invoice.items || []).forEach(item => {
        const taxable = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        const taxRate = Number(item.taxRate ?? item.igst) || 0;
        const taxAmount = (taxable * taxRate) / 100;
        totals.taxable += taxable;
        if ((invoice.taxMode || "split") === "split") {
          totals.cgst += taxAmount / 2;
          totals.sgst += taxAmount / 2;
        } else {
          totals.igst += taxAmount;
        }
      });
      return totals;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  );

  let y = PAGE.top;
  doc.setFillColor(22, 22, 28);
  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 24, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(title, PAGE.left + 4, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, PAGE.left + 4, y + 18);
  y += 32;

  y = sectionTitle(doc, y, "Financial Summary");
  y = drawMetricGrid(doc, y, [
    { label: "Total Receipts", value: money(stats.totalIncome, sym) },
    { label: "Total Expenses", value: money(stats.totalExpense, sym) },
    { label: "Profit / Loss", value: money(stats.profit, sym) },
    { label: "Pending Invoices", value: money(stats.pendingInvoiceTotal, sym) },
    { label: "Burn Rate", value: stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days` },
    { label: "Savings Goal", value: stats.goalTargetAmount ? money(stats.goalTargetAmount, sym) : "--" }
  ]);

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Expense Breakdown");
  y = drawRows(
    doc,
    y,
    stats.topExpenseCategories.length
      ? stats.topExpenseCategories.map(item => ({
          label: item.category,
          value: money(item.amount, sym)
        }))
      : [{ label: "No expenses recorded this month", value: "--" }]
  );

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Top Customers");
  y = drawRows(
    doc,
    y,
    stats.topCustomers.length
      ? stats.topCustomers.map(item => ({
          label: item.name,
          value: `${money(item.revenue, sym)}  |  Open ${money(item.balance, sym)}`
        }))
      : [{ label: "No customer revenue recorded yet", value: "--" }]
  );

  y = ensureSpace(doc, y + 2, 44);
  y = sectionTitle(doc, y + 2, "GST Summary");
  y = drawRows(doc, y, [
    { label: "Taxable Value", value: money(taxSummary.taxable, sym) },
    { label: "CGST", value: money(taxSummary.cgst, sym) },
    { label: "SGST", value: money(taxSummary.sgst, sym) },
    { label: "IGST", value: money(taxSummary.igst, sym) },
    { label: "Invoice Total", value: money(invoices.reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0), sym) }
  ]);

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Savings Goal");
  y = drawRows(doc, y, [
    { label: "Target amount", value: stats.goalTargetAmount ? money(stats.goalTargetAmount, sym) : "--" },
    { label: "Saved till date", value: money(stats.goalSavedAmount || 0, sym) },
    { label: "Target date", value: safeText(stats.goalTargetDate || "--") },
    { label: "Remaining", value: stats.goalTargetAmount ? money(stats.goalLeft || 0, sym) : "--" },
    { label: "Note", value: safeText(stats.goalNote || "--") }
  ]);

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Alerts Snapshot");
  y = drawRows(
    doc,
    y,
    stats.alertItems.length
      ? stats.alertItems.slice(0, 5).map(item => ({
          label: item.title,
          value: safeText(item.message)
        }))
      : [{ label: "No active alerts", value: "Everything looks steady right now" }]
  );

  doc.save(`ledger-report-${stats.monthKey}.pdf`);
}
