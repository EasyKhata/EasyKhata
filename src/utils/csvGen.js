function esc(value) {
  const str = String(value ?? "").replace(/"/g, '""');
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
}

function row(...cells) {
  return cells.map(esc).join(",");
}

function fmtAmount(value) {
  return Number(value || 0).toFixed(2);
}

export function downloadCSV(filename, csvString) {
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateIncomeCSV(income = [], sym = "Rs") {
  const lines = [
    row("Date", "Label", "Amount", `Amount (${sym})`, "Category", "Note", "Collection Type", "Flat", "Month", "Added By", "Added At")
  ];
  income.forEach(r => {
    lines.push(row(
      r.date || r.month || "",
      r.label || r.description || "",
      fmtAmount(r.amount),
      `${sym} ${fmtAmount(r.amount)}`,
      r.category || r.collectionType || "",
      r.note || "",
      r.collectionType || "",
      r.flatNumber || "",
      r.collectionMonth || r.month || "",
      r.createdByName || r.createdBy || "",
      r.createdAt ? r.createdAt.slice(0, 19).replace("T", " ") : ""
    ));
  });
  return lines.join("\r\n");
}

export function generateExpensesCSV(expenses = [], sym = "Rs") {
  const lines = [
    row("Date", "Label", "Amount", `Amount (${sym})`, "Category", "Note", "Vendor", "Added By", "Added At")
  ];
  expenses.forEach(r => {
    lines.push(row(
      r.date || "",
      r.label || r.description || "",
      fmtAmount(r.amount),
      `${sym} ${fmtAmount(r.amount)}`,
      r.category || "",
      r.note || "",
      r.vendor || r.payee || "",
      r.createdByName || r.createdBy || "",
      r.createdAt ? r.createdAt.slice(0, 19).replace("T", " ") : ""
    ));
  });
  return lines.join("\r\n");
}

export function generateCollectionsCSV(income = [], customers = [], sym = "Rs", monthKey = "") {
  const monthIncome = monthKey
    ? income.filter(r => (r.collectionMonth || r.month || r.date?.slice(0, 7) || "") === monthKey)
    : income;

  const paidFlatValues = new Set(
    monthIncome
      .filter(r => String(r.collectionType || "Monthly Maintenance").trim() === "Monthly Maintenance")
      .map(r => String(r.flatNumber || "").trim())
  );

  const lines = [
    row("Flat", "Owner", "Phone", "Monthly Amount", "Status", "Paid Amount", "Payment Date", "Added By")
  ];
  customers.forEach(c => {
    const paidEntry = monthIncome.find(r =>
      String(r.flatNumber || "").trim() === String(c.value || "").trim() &&
      String(r.collectionType || "Monthly Maintenance").trim() === "Monthly Maintenance"
    );
    lines.push(row(
      c.value || "",
      c.ownerName || c.name || "",
      c.phone || "",
      fmtAmount(c.monthlyMaintenance || 0),
      paidFlatValues.has(String(c.value || "").trim()) ? "Paid" : "Pending",
      paidEntry ? fmtAmount(paidEntry.amount) : "",
      paidEntry ? (paidEntry.date || "") : "",
      paidEntry ? (paidEntry.createdByName || paidEntry.createdBy || "") : ""
    ));
  });
  return lines.join("\r\n");
}

export function generateCustomersCSV(customers = []) {
  const lines = [row("Name", "Flat / ID", "Phone", "Email", "Monthly Amount", "Notes")];
  customers.forEach(c => {
    lines.push(row(
      c.name || c.ownerName || "",
      c.value || c.flatNumber || "",
      c.phone || "",
      c.email || "",
      fmtAmount(c.monthlyMaintenance || 0),
      c.notes || c.note || ""
    ));
  });
  return lines.join("\r\n");
}

export function generateFullReportCSV(data = {}, year, month) {
  const sym = data.currency?.symbol || "Rs";
  const mk = `${year}-${String(month + 1).padStart(2, "0")}`;

  const incomeThisMonth = (data.income || []).filter(r =>
    (r.date || r.month || "").startsWith(mk)
  );
  const expensesThisMonth = (data.expenses || []).filter(r =>
    (r.date || "").startsWith(mk)
  );

  const sections = [
    `INCOME — ${mk}`,
    generateIncomeCSV(incomeThisMonth, sym),
    "",
    `EXPENSES — ${mk}`,
    generateExpensesCSV(expensesThisMonth, sym)
  ];
  return sections.join("\r\n");
}
