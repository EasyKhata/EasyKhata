import { jsPDF } from "jspdf";
import { calculateDashboard, invoiceGrandTotal } from "./analytics";
import { MONTHS } from "../components/UI";

function money(value, sym) {
  return `${sym}${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function downloadMonthlyReport(data, year, month, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = calculateDashboard(data, year, month);
  const invoices = (data.invoices || []).filter(item => item.date?.slice(0, 7) === stats.monthKey);
  const pageTitle = `Monthly Report - ${MONTHS[month]} ${year}`;
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

  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(pageTitle, 16, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 16, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 16, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  [
    ["Total Income", money(stats.totalIncome, sym)],
    ["Total Expenses", money(stats.totalExpense, sym)],
    ["Profit / Loss", money(stats.profit, sym)],
    ["Pending Invoices", money(stats.pendingInvoiceTotal, sym)],
    ["Burn Rate", stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days`]
  ].forEach(([label, value]) => {
    doc.text(label, 16, y);
    doc.text(value, 194, y, { align: "right" });
    y += 7;
  });

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Expense Breakdown", 16, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  if (!stats.topExpenseCategories.length) {
    doc.text("No expenses recorded this month.", 16, y);
    y += 7;
  } else {
    stats.topExpenseCategories.forEach(item => {
      doc.text(item.category, 16, y);
      doc.text(money(item.amount, sym), 194, y, { align: "right" });
      y += 7;
    });
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Top Customers", 16, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  if (!stats.topCustomers.length) {
    doc.text("No customer revenue recorded yet.", 16, y);
    y += 7;
  } else {
    stats.topCustomers.forEach(item => {
      doc.text(item.name, 16, y);
      doc.text(money(item.revenue, sym), 194, y, { align: "right" });
      y += 7;
    });
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("GST Summary", 16, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  [
    ["Taxable Value", money(taxSummary.taxable, sym)],
    ["CGST", money(taxSummary.cgst, sym)],
    ["SGST", money(taxSummary.sgst, sym)],
    ["IGST", money(taxSummary.igst, sym)],
    ["Invoice Total", money(invoices.reduce((sum, invoice) => sum + invoiceGrandTotal(invoice), 0), sym)]
  ].forEach(([label, value]) => {
    doc.text(label, 16, y);
    doc.text(value, 194, y, { align: "right" });
    y += 7;
  });

  doc.save(`ledger-report-${stats.monthKey}.pdf`);
}
