import { jsPDF } from "jspdf";
import { fmtDate } from "../components/UI";

function toNumber(value) {
  return Number(value) || 0;
}

function getTaxBreakdown(invoice) {
  return (invoice?.items || []).reduce(
    (totals, item) => {
      const taxable = toNumber(item.qty) * toNumber(item.rate);
      const rate = toNumber(item.taxRate ?? item.igst);
      const taxAmount = (taxable * rate) / 100;

      totals.taxable += taxable;
      if (invoice?.taxMode === "split") {
        totals.cgst += taxAmount / 2;
        totals.sgst += taxAmount / 2;
      } else {
        totals.igst += taxAmount;
      }

      return totals;
    },
    { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
  );
}

function fmtCurrency(value, symbol) {
  return `${symbol}${toNumber(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function line(doc, label, y, value, options = {}) {
  doc.text(String(label || ""), 16, y, options);
  doc.text(String(value || ""), 194, y, { align: "right", ...options });
}

export function downloadInvoice(invoice, account, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const acc = account || {};
  const tax = getTaxBreakdown(invoice);
  const total = tax.taxable + tax.cgst + tax.sgst + tax.igst;
  const customerName = invoice.billTo?.name || invoice.customer?.name || "--";

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(acc.name || "Your Business", 16, y);
  doc.setFontSize(18);
  doc.text("INVOICE", 194, y, { align: "right" });

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const businessLines = [
    acc.address,
    acc.gstin ? `GSTIN: ${acc.gstin}` : "",
    acc.phone,
    acc.email
  ].filter(Boolean);
  businessLines.forEach(text => {
    doc.text(String(text), 16, y);
    y += 5;
  });

  let metaY = 26;
  const metaLines = [
    `Invoice: ${invoice.number || "--"}`,
    `Issued: ${invoice.date ? fmtDate(invoice.date) : "--"}`,
    invoice.dueDate ? `Due: ${fmtDate(invoice.dueDate)}` : "",
    invoice.status === "paid" && invoice.paidDate ? `Paid: ${fmtDate(invoice.paidDate)}` : ""
  ].filter(Boolean);
  metaLines.forEach(text => {
    doc.text(text, 194, metaY, { align: "right" });
    metaY += 5;
  });

  y = Math.max(y, metaY) + 8;
  doc.setDrawColor(220);
  doc.line(16, y, 194, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To", 16, y);
  doc.text("Ship To", 106, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const billLines = [
    customerName,
    invoice.billTo?.address || invoice.customer?.address || "",
    invoice.billTo?.gstin || invoice.customer?.gstin ? `GSTIN: ${invoice.billTo?.gstin || invoice.customer?.gstin}` : ""
  ].filter(Boolean);
  const shipLines = [
    invoice.shipTo?.name || customerName,
    invoice.shipTo?.address || invoice.customer?.address || ""
  ].filter(Boolean);

  const blockHeight = Math.max(billLines.length, shipLines.length) * 5;
  billLines.forEach((text, index) => doc.text(String(text), 16, y + index * 5));
  shipLines.forEach((text, index) => doc.text(String(text), 106, y + index * 5));
  y += blockHeight + 8;

  doc.setFont("helvetica", "bold");
  doc.setFillColor(22, 22, 28);
  doc.rect(16, y, 178, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("#", 18, y + 5.3);
  doc.text("Description", 28, y + 5.3);
  if (acc.showHSN !== false) doc.text("HSN", 112, y + 5.3);
  doc.text("Qty", acc.showHSN !== false ? 132 : 122, y + 5.3, { align: "right" });
  doc.text("Rate", acc.showHSN !== false ? 152 : 147, y + 5.3, { align: "right" });
  doc.text(invoice.taxMode === "split" ? "GST" : "IGST", acc.showHSN !== false ? 170 : 168, y + 5.3, { align: "right" });
  doc.text("Amount", 192, y + 5.3, { align: "right" });
  doc.setTextColor(20, 20, 20);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  (invoice.items || []).forEach((item, index) => {
    const taxable = toNumber(item.qty) * toNumber(item.rate);
    const rate = toNumber(item.taxRate ?? item.igst);
    const descriptionLines = doc.splitTextToSize(item.subDesc ? `${item.desc}\n${item.subDesc}` : item.desc || "--", 72);
    const rowHeight = Math.max(7, descriptionLines.length * 4.6);

    doc.text(String(index + 1), 18, y);
    doc.text(descriptionLines, 28, y);
    if (acc.showHSN !== false) doc.text(item.hsn || "--", 112, y);
    doc.text(String(item.qty || 0), acc.showHSN !== false ? 132 : 122, y, { align: "right" });
    doc.text(fmtCurrency(item.rate, sym), acc.showHSN !== false ? 152 : 147, y, { align: "right" });
    doc.text(`${rate.toFixed(2)}%`, acc.showHSN !== false ? 170 : 168, y, { align: "right" });
    doc.text(fmtCurrency(taxable, sym), 192, y, { align: "right" });
    y += rowHeight;
  });

  y += 4;
  doc.line(120, y, 194, y);
  y += 7;
  doc.setFontSize(10);
  line(doc, "Taxable Value", y, fmtCurrency(tax.taxable, sym));
  y += 6;
  if (invoice.taxMode === "split") {
    line(doc, "CGST", y, fmtCurrency(tax.cgst, sym));
    y += 6;
    line(doc, "SGST", y, fmtCurrency(tax.sgst, sym));
    y += 6;
  } else {
    line(doc, "IGST", y, fmtCurrency(tax.igst, sym));
    y += 6;
  }

  doc.setFont("helvetica", "bold");
  line(doc, "Grand Total", y, fmtCurrency(total, sym));
  y += 10;

  doc.setFont("helvetica", "normal");
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 16, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(invoice.notes, 178), 16, y);
    y += 12;
  }

  if (invoice.terms) {
    doc.setFont("helvetica", "bold");
    doc.text("Terms", 16, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(invoice.terms, 178), 16, y);
  }

  doc.save(`${invoice.number || "invoice"}.pdf`);
}
