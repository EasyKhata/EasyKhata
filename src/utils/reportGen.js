import { jsPDF } from "jspdf";
import { calculateDashboard, invoiceGrandTotal } from "./analytics";
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

export function downloadMonthlyReport(data, year, month, sym) {
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
    { label: "Total Income", value: money(stats.totalIncome, sym) },
    { label: "Total Expenses", value: money(stats.totalExpense, sym) },
    { label: "Profit / Loss", value: money(stats.profit, sym) },
    { label: "Pending Invoices", value: money(stats.pendingInvoiceTotal, sym) },
    { label: "Burn Rate", value: stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days` },
    { label: "Savings Goal", value: stats.monthlySavingsGoal ? money(stats.monthlySavingsGoal, sym) : "--" }
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
