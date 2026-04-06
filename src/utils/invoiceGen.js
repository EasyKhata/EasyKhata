import { invoiceTotal, fmtDate, fmtMoney } from "../components/UI";

export function downloadInvoice(inv, account, sym) {
  const total = invoiceTotal(inv.items);
  const igstTotal = inv.items.reduce((s, it) => {
    const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0);
    const igst = amt * (Number(it.igst) || 0) / 100;
    return s + igst;
  }, 0);
  const taxable = total;
  const grandTotal = total + igstTotal;

  const acc = account || {};

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${inv.number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111; padding: 40px; font-size: 13px; }
  .page { max-width: 800px; margin: 0 auto; }
  
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #111; }
  .biz-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .biz-details { font-size: 12px; color: #555; line-height: 1.7; }
  .gstin { font-weight: 700; color: #111; }
  
  .inv-title { font-size: 26px; font-weight: 800; letter-spacing: 1px; text-align: right; margin-bottom: 8px; }
  .inv-meta { text-align: right; font-size: 12px; color: #555; line-height: 1.7; }
  .inv-num { font-size: 14px; font-weight: 700; color: #111; }
  
  .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .addr-block { padding: 16px; background: #f8f8f8; border-radius: 6px; }
  .addr-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #999; margin-bottom: 8px; }
  .addr-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .addr-details { font-size: 12px; color: #555; line-height: 1.7; }
  
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead { background: #111; color: #fff; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
  th.ar, td.ar { text-align: right; }
  td { padding: 12px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
  .item-desc { font-weight: 600; }
  .item-sub { font-size: 11px; color: #888; margin-top: 2px; }
  
  .totals-section { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .totals-table { width: 300px; }
  .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; border-bottom: 1px solid #eee; }
  .totals-row.grand { border-top: 2px solid #111; border-bottom: none; padding-top: 12px; font-size: 16px; font-weight: 800; }
  
  .notes-section { margin-bottom: 24px; }
  .notes-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #999; margin-bottom: 8px; }
  .notes-box { background: #f8f8f8; border-radius: 6px; padding: 14px; font-size: 13px; color: #555; line-height: 1.6; }
  
  .terms { font-size: 12px; color: #777; line-height: 1.7; border-top: 1px solid #eee; padding-top: 20px; }
  .terms-title { font-weight: 700; color: #555; margin-bottom: 4px; }
  
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #bbb; border-top: 1px solid #eee; padding-top: 20px; }
  
  @media print {
    body { padding: 20px; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div>
      <div class="biz-name">${acc.name || "Your Business"}</div>
      <div class="biz-details">
        ${acc.address ? acc.address.replace(/\n/g, "<br>") : ""}
        ${acc.gstin ? `<br><span class="gstin">GSTIN: ${acc.gstin}</span>` : ""}
        ${acc.phone ? `<br>${acc.phone}` : ""}
        ${acc.email ? `<br>${acc.email}` : ""}
      </div>
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta">
        <div class="inv-num">Invoice Number: ${inv.number}</div>
        <div>Date: ${fmtDate(inv.date)}</div>
        ${inv.dueDate ? `<div>Due Date: ${fmtDate(inv.dueDate)}</div>` : ""}
      </div>
    </div>
  </div>

  <!-- Addresses -->
  <div class="addresses">
    <div class="addr-block">
      <div class="addr-label">Bill To</div>
      <div class="addr-name">${inv.billTo?.name || inv.customer?.name || "—"}</div>
      <div class="addr-details">
        ${(inv.billTo?.address || inv.customer?.address || "").replace(/\n/g, "<br>")}
        ${inv.billTo?.gstin || inv.customer?.gstin ? `<br><strong>GSTIN:</strong> ${inv.billTo?.gstin || inv.customer?.gstin}` : ""}
      </div>
    </div>
    <div class="addr-block">
      <div class="addr-label">Ship To</div>
      <div class="addr-name">${inv.shipTo?.name || inv.customer?.name || "—"}</div>
      <div class="addr-details">
        ${(inv.shipTo?.address || inv.customer?.address || "").replace(/\n/g, "<br>")}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item &amp; Description</th>
        ${acc.showHSN !== false ? "<th>HSN/SAC</th>" : ""}
        <th class="ar">Qty</th>
        <th class="ar">Rate</th>
        <th class="ar">IGST</th>
        <th class="ar">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${inv.items.map((it, i) => {
        const amt = (Number(it.qty) || 0) * (Number(it.rate) || 0);
        return `<tr>
          <td>${i + 1}</td>
          <td><div class="item-desc">${it.desc || "—"}</div>${it.subDesc ? `<div class="item-sub">${it.subDesc}</div>` : ""}</td>
          ${acc.showHSN !== false ? `<td>${it.hsn || ""}</td>` : ""}
          <td class="ar">${it.qty}</td>
          <td class="ar">${sym}${Number(it.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="ar">${Number(it.igst || 0).toFixed(2)}%</td>
          <td class="ar">${sym}${amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-table">
      <div class="totals-row"><span>Taxable Value</span><span>${sym}${taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      <div class="totals-row"><span>IGST</span><span>${sym}${igstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      <div class="totals-row grand"><span>Total</span><span>${sym}${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
    </div>
  </div>

  ${inv.notes ? `<div class="notes-section"><div class="notes-label">Notes</div><div class="notes-box">${inv.notes}</div></div>` : ""}

  ${inv.terms ? `<div class="terms"><div class="terms-title">Terms &amp; Conditions</div>${inv.terms}</div>` : ""}

  <div class="footer">Thank you for your business.</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${inv.number}.html`; a.click();
  URL.revokeObjectURL(url);
}