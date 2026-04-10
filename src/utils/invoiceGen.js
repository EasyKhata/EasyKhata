import { jsPDF } from "jspdf";
import { fmtDate } from "../components/UI";
import { getInvoiceDiscount, getInvoiceTaxBreakdown } from "./analytics";
import { buildLocationLabel, parseLocationFields } from "./profile";

const PAGE = {
  width: 210,
  height: 297,
  left: 16,
  right: 194,
  top: 18,
  bottom: 280
};

function toNumber(value) {
  return Number(value) || 0;
}

function safeText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function money(value, symbol) {
  const prefix = symbol === "Rs" ? "Rs " : `${symbol}`;
  return `${prefix}${toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function moneyPlain(value) {
  return toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function contactAddress(contact = {}) {
  const parsedLocation = parseLocationFields(contact?.location || contact?.address || "");
  return buildLocationLabel({
    addressLine: contact?.addressLine || parsedLocation.addressLine,
    city: contact?.city || parsedLocation.city,
    state: contact?.state || parsedLocation.state,
    country: contact?.country || parsedLocation.country
  }) || contact?.address || "";
}

function ensureSpace(doc, y, needed) {
  if (y + needed <= PAGE.bottom) return y;
  doc.addPage();
  return PAGE.top;
}

function drawRule(doc, y) {
  doc.setDrawColor(225);
  doc.line(PAGE.left, y, PAGE.right, y);
}

function drawLabelValue(doc, y, label, value, opts = {}) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(opts.size || 10.5);
  doc.setTextColor(85, 85, 95);
  doc.text(safeText(label), PAGE.left, y);
  doc.setTextColor(20, 20, 28);
  doc.text(safeText(value), PAGE.right, y, { align: "right" });
}

function drawWrappedBlock(doc, x, y, width, title, lines) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 120);
  doc.text(safeText(title), x, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 28);
  const wrapped = [];
  lines.filter(Boolean).forEach(line => {
    wrapped.push(...doc.splitTextToSize(safeText(line), width));
  });
  doc.text(wrapped.length ? wrapped : ["--"], x, y);
  return y + Math.max(6, wrapped.length * 4.8);
}

export function downloadInvoice(invoice, account, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const acc = account || {};
  const tax = getInvoiceTaxBreakdown(invoice);
  const total = tax.taxable + tax.cgst + tax.sgst + tax.igst;
  const customerName = invoice.billTo?.name || invoice.customer?.name || "--";
  const isQuote = String(invoice?.documentType || "invoice").toLowerCase() === "quote";
  let y = PAGE.top;

  doc.setFillColor(22, 22, 28);
  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 28, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text(safeText(acc.name || "Your Business"), PAGE.left + 4, y + 10);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(safeText(acc.email || acc.phone || "Business invoice"), PAGE.left + 4, y + 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(isQuote ? "QUOTE" : "INVOICE", PAGE.right - 4, y + 11, { align: "right" });
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.text(safeText(invoice.number || "--"), PAGE.right - 4, y + 18, { align: "right" });
  doc.setFontSize(9);
  doc.text(`All amounts in ${safeText(sym === "Rs" ? "INR" : sym)}`, PAGE.right - 4, y + 23, { align: "right" });
  y += 36;

  const businessLines = [
    contactAddress(acc),
    acc.gstin ? `GSTIN: ${acc.gstin}` : "",
    acc.phone ? `Phone: ${acc.phone}` : "",
    acc.email ? `Email: ${acc.email}` : ""
  ];
  const metaLines = [
    `${isQuote ? "Prepared" : "Issued"}: ${invoice.date ? fmtDate(invoice.date) : "--"}`,
    invoice.dueDate ? `${isQuote ? "Valid Until" : "Due"}: ${fmtDate(invoice.dueDate)}` : `${isQuote ? "Valid Until" : "Due"}: --`,
    `Status: ${safeText(invoice.status || "pending").toUpperCase()}`,
    invoice.paidDate ? `Paid: ${fmtDate(invoice.paidDate)}` : ""
  ];

  doc.setDrawColor(225);
  doc.setFillColor(248, 248, 251);
  doc.roundedRect(PAGE.left, y, 84, 34, 4, 4, "FD");
  doc.roundedRect(110, y, 84, 34, 4, 4, "FD");
  const leftEnd = drawWrappedBlock(doc, PAGE.left + 4, y + 7, 74, "FROM", businessLines);
  const rightEnd = drawWrappedBlock(doc, 114, y + 7, 74, "DETAILS", metaLines);
  y += Math.max(42, Math.max(leftEnd, rightEnd) - y + 6);

  y = ensureSpace(doc, y, 36);
  doc.setFillColor(238, 242, 247);
  doc.roundedRect(PAGE.left, y, 84, 30, 4, 4, "F");
  doc.roundedRect(110, y, 84, 30, 4, 4, "F");
  const billEnd = drawWrappedBlock(
    doc,
    PAGE.left + 4,
    y + 7,
    74,
    "BILL TO",
    [
      customerName,
      contactAddress(invoice.billTo || invoice.customer || {}),
      invoice.billTo?.phone || invoice.customer?.phone ? `Phone: ${invoice.billTo?.phone || invoice.customer?.phone}` : "",
      invoice.billTo?.gstin || invoice.customer?.gstin ? `GSTIN: ${invoice.billTo?.gstin || invoice.customer?.gstin}` : ""
    ]
  );
  const shipEnd = drawWrappedBlock(
    doc,
    114,
    y + 7,
    74,
    "SHIP TO",
    [
      invoice.shipTo?.name || customerName,
      contactAddress(invoice.shipTo || invoice.customer || {}),
      invoice.shipTo?.phone ? `Phone: ${invoice.shipTo.phone}` : ""
    ]
  );
  y += Math.max(38, Math.max(billEnd, shipEnd) - y + 6);

  y = ensureSpace(doc, y, 22);
  doc.setFillColor(30, 36, 44);
  doc.rect(PAGE.left, y, PAGE.right - PAGE.left, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("#", 18, y + 6);
  doc.text("Description", 28, y + 6);
  doc.text("Qty", 128, y + 6, { align: "right" });
  doc.text("Rate", 148, y + 6, { align: "right" });
  doc.text((invoice.taxMode || "split") === "split" ? "GST %" : "IGST %", 167, y + 6, { align: "right" });
  doc.text("Amount", 192, y + 6, { align: "right" });
  y += 12;
  doc.setTextColor(20, 20, 28);

  (invoice.items || []).forEach((item, index) => {
    const desc = safeText(item.desc || "Item");
    const sub = safeText(item.subDesc || "");
    const descriptionLines = doc.splitTextToSize(sub ? `${desc}  ${sub}` : desc, 82);
    const rowHeight = Math.max(10, descriptionLines.length * 5);
    y = ensureSpace(doc, y, rowHeight + 3);

    if (index % 2 === 0) {
      doc.setFillColor(249, 249, 251);
      doc.rect(PAGE.left, y - 4, PAGE.right - PAGE.left, rowHeight + 2, "F");
    }

    const amount = toNumber(item.qty) * toNumber(item.rate);
    const rate = toNumber(item.taxRate ?? item.igst);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.text(String(index + 1), 18, y + 2);
    doc.text(descriptionLines, 28, y + 2);
    doc.text(String(toNumber(item.qty)), 128, y + 2, { align: "right" });
    doc.text(moneyPlain(item.rate), 148, y + 2, { align: "right" });
    doc.text(`${rate.toFixed(2)}`, 167, y + 2, { align: "right" });
    doc.text(moneyPlain(amount), 192, y + 2, { align: "right" });
    y += rowHeight + 3;
  });

  y += 4;
  y = ensureSpace(doc, y, 34);
  drawRule(doc, y);
  y += 8;
  drawLabelValue(doc, y, "Subtotal", money(tax.subtotal, sym));
  y += 7;
  drawLabelValue(doc, y, "Discount", `- ${money(getInvoiceDiscount(invoice), sym)}`);
  y += 7;
  drawLabelValue(doc, y, "Taxable Value", money(tax.taxable, sym));
  y += 7;
  if ((invoice.taxMode || "split") === "split") {
    drawLabelValue(doc, y, "CGST", money(tax.cgst, sym));
    y += 7;
    drawLabelValue(doc, y, "SGST", money(tax.sgst, sym));
    y += 7;
  } else {
    drawLabelValue(doc, y, "IGST", money(tax.igst, sym));
    y += 7;
  }
  doc.setFont("helvetica", "bold");
  doc.setFillColor(243, 246, 249);
  doc.roundedRect(118, y - 6, 76, 14, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 95);
  doc.text("Grand Total", 122, y - 0.5);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 28);
  doc.text(moneyPlain(total), 190, y - 0.5, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 120);
  doc.text(sym === "Rs" ? "INR" : safeText(sym), 192, y - 0.5, { align: "left" });
  y += 12;

  if (invoice.notes) {
    y = ensureSpace(doc, y, 26);
    doc.setFillColor(247, 248, 250);
    doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 18, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Notes", PAGE.left + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(safeText(invoice.notes), 168), PAGE.left + 4, y + 12);
    y += 24;
  }

  if (invoice.terms) {
    y = ensureSpace(doc, y, 28);
    doc.setFillColor(247, 248, 250);
    doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 20, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Terms", PAGE.left + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(doc.splitTextToSize(safeText(invoice.terms), 168), PAGE.left + 4, y + 12);
  }

  doc.save(`${safeText(invoice.number || "invoice")}.pdf`);
}
