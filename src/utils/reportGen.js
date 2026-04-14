import { jsPDF } from "jspdf";
import { calculateApartmentDashboard, calculateDashboard, calculateFreelancerDashboard, calculatePersonalDashboard, calculateSmallBusinessDashboard, getFinancialInvoices, getPersonalEmiDueDay, invoiceGrandTotal, isApartmentOrgData, isFreelancerOrgData, isPersonalOrgData, isSmallBusinessOrgData } from "./analytics";
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

function formatDateValue(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return safeText(value);
  return parsed.toLocaleDateString("en-IN");
}

function getApartmentCollectionEntries(data, year, month) {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return (data?.income || [])
    .filter(item => (item.collectionMonth || item.month || item.date?.slice(0, 7) || "") === monthKey)
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function isOpeningBalanceCollection(item) {
  return String(item?.collectionType || "").trim().toLowerCase() === "opening balance";
}

function sumCollectionAmounts(entries) {
  return (entries || []).reduce((total, entry) => total + Number(entry?.amount || 0), 0);
}

function getApartmentExpenseEntries(data, year, month) {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return (data?.expenses || [])
    .filter(expense => {
      if (expense.recurring) {
        const started = expense.startMonth <= monthKey;
        const notEnded = !expense.endMonth || expense.endMonth >= monthKey;
        return started && notEnded;
      }
      return expense.month === monthKey;
    })
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function getApartmentCollectionDetailRows(entries, sym) {
  return entries.map(item => ({
    label: [
      safeText(item.flatNumber || "Flat"),
      safeText(item.collectionType || item.source || "Collection")
    ].filter(Boolean).join(" · "),
    value: `${formatDateValue(item.date)} | ${money(item.amount, sym)} | ${safeText(item.collectionType || "Collection")}`
  }));
}

function getApartmentExpenseDetailRows(entries, sym) {
  return entries.map(item => ({
    label: [
      safeText(item.category || item.expenseType || "Expense"),
      safeText(item.serviceProvider || item.vendor || item.paidTo || item.source || item.billReference || "")
    ].filter(Boolean).join(" · "),
    value: `${formatDateValue(item.date)} | ${money(item.amount, sym)}${item.billReference ? ` | Ref ${safeText(item.billReference)}` : ""}`
  }));
}

function getApartmentFinancialYearCollectionEntries(data, startYear) {
  const periods = getFinancialYearPeriods(startYear).map(period => period.key);
  const validPeriods = new Set(periods);
  return (data?.income || [])
    .filter(item => validPeriods.has(item.collectionMonth || item.month || item.date?.slice(0, 7) || ""))
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function getApartmentFinancialYearExpenseEntries(data, startYear) {
  const periods = getFinancialYearPeriods(startYear).map(period => period.key);
  const validPeriods = new Set(periods);
  return (data?.expenses || [])
    .filter(expense => {
      if (expense.recurring) {
        return periods.some(periodKey => expense.startMonth <= periodKey && (!expense.endMonth || expense.endMonth >= periodKey));
      }
      return validPeriods.has(expense.month || "");
    })
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
}

function formatUserSubscription(user) {
  const plan = safeText(user.plan || user.subscriptionPlan || "free");
  const status = safeText(user.subscriptionStatus || user.status || "active");
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "joined N/A";
  return `${plan} · ${status} · ${joined}`;
}

function getReportStatsForMonth(data, year, month) {
  if (isApartmentOrgData(data)) return calculateApartmentDashboard(data, year, month);
  if (isPersonalOrgData(data)) return calculatePersonalDashboard(data, year, month);
  if (isFreelancerOrgData(data)) return calculateFreelancerDashboard(data, year, month);
  if (isSmallBusinessOrgData(data)) return calculateSmallBusinessDashboard(data, year, month);
  return calculateDashboard(data, year, month);
}

function getFinancialYearPeriods(startYear) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(startYear, 3 + index, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
    };
  });
}

function getFinancialYearLabel(startYear) {
  return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
}

function getFinancialYearTitle(data, startYear) {
  const fyLabel = getFinancialYearLabel(startYear);
  if (isApartmentOrgData(data)) return `Society Report - ${fyLabel}`;
  if (isPersonalOrgData(data)) return `Household Report - ${fyLabel}`;
  if (isFreelancerOrgData(data)) return `Freelancer Report - ${fyLabel}`;
  if (isSmallBusinessOrgData(data)) return `Small Business Report - ${fyLabel}`;
  return `Ledger Report - ${fyLabel}`;
}

function getFinancialYearFilename(data, startYear) {
  const suffix = `${startYear}-${startYear + 1}`;
  if (isApartmentOrgData(data)) return `society-report-${suffix}.pdf`;
  if (isPersonalOrgData(data)) return `household-report-${suffix}.pdf`;
  if (isFreelancerOrgData(data)) return `freelancer-report-${suffix}.pdf`;
  if (isSmallBusinessOrgData(data)) return `small-business-report-${suffix}.pdf`;
  return `ledger-report-${suffix}.pdf`;
}

function buildFinancialYearOverview(data, startYear) {
  const monthlyStats = getFinancialYearPeriods(startYear).map(period => ({
    ...period,
    stats: getReportStatsForMonth(data, period.year, period.month)
  }));
  const endingStats = monthlyStats[monthlyStats.length - 1]?.stats || {};
  const totals = monthlyStats.reduce(
    (acc, period) => {
      const stats = period.stats || {};
      acc.totalIncome += Number(stats.totalIncome || 0);
      acc.totalExpense += Number(stats.totalExpense || 0);
      acc.totalEmi += Number(stats.totalEmi || 0);
      acc.totalNet += isPersonalOrgData(data) ? Number(stats.netAfterEmi || 0) : Number(stats.profit || 0);
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, totalEmi: 0, totalNet: 0 }
  );

  const expenseMap = {};
  monthlyStats.forEach(period => {
    (period.stats?.topExpenseCategories || []).forEach(item => {
      expenseMap[item.category] = (expenseMap[item.category] || 0) + Number(item.amount || 0);
    });
  });

  const topExpenseCategories = Object.entries(expenseMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const alertMap = new Map();
  monthlyStats.forEach(period => {
    (period.stats?.alertItems || []).forEach(item => {
      if (!alertMap.has(item.title)) {
        alertMap.set(item.title, item.message);
      }
    });
  });

  const alerts = Array.from(alertMap.entries()).map(([title, message]) => ({ title, message })).slice(0, 8);

  return {
    startYear,
    label: getFinancialYearLabel(startYear),
    monthlyStats,
    endingStats,
    topExpenseCategories,
    alerts,
    ...totals
  };
}

function getFinancialYearMetricItems(data, overview, sym) {
  const stats = overview.endingStats || {};

  if (isApartmentOrgData(data)) {
    return [
      { label: "Collections", value: money(overview.totalIncome, sym) },
      { label: "Expenses", value: money(overview.totalExpense, sym) },
      { label: "Net Reserve", value: money(overview.totalNet, sym) },
      { label: "Avg Collections", value: money(overview.totalIncome / 12, sym) },
      { label: "Flats", value: String(stats.flatsCount || 0) },
      { label: "Collection Rate", value: `${Math.round(stats.collectionRate || 0)}%` }
    ];
  }

  if (isPersonalOrgData(data)) {
    return [
      { label: "Earnings", value: money(overview.totalIncome, sym) },
      { label: "Spending", value: money(overview.totalExpense, sym) },
      { label: "EMI", value: money(overview.totalEmi, sym) },
      { label: "Net After EMI", value: money(overview.totalNet, sym) },
      { label: "People", value: String(stats.peopleCount || 0) },
      { label: "Active EMIs", value: String(stats.activeLoansCount || 0) }
    ];
  }

  if (isFreelancerOrgData(data)) {
    return [
      { label: "Collected", value: money(overview.totalIncome, sym) },
      { label: "Expenses", value: money(overview.totalExpense, sym) },
      { label: "Net", value: money(overview.totalNet, sym) },
      { label: "Avg Monthly Net", value: money(overview.totalNet / 12, sym) },
      { label: "Clients", value: String(stats.trackedClientsCount || 0) },
      { label: "Billable Costs", value: money(stats.billableExpenseTotal || 0, sym) }
    ];
  }

  if (isSmallBusinessOrgData(data)) {
    return [
      { label: "Sales", value: money(overview.totalIncome, sym) },
      { label: "Expenses", value: money(overview.totalExpense, sym) },
      { label: "Net", value: money(overview.totalNet, sym) },
      { label: "Services", value: String(stats.servicesCount || 0) },
      { label: "Partner Dues", value: money(stats.partnerBalanceTotal || 0, sym) },
      { label: "Team", value: String(stats.teamCount || 0) }
    ];
  }

  return [
    { label: "Receipts", value: money(overview.totalIncome, sym) },
    { label: "Expenses", value: money(overview.totalExpense, sym) },
    { label: "Net", value: money(overview.totalNet, sym) },
    { label: "Pending Invoices", value: money(stats.pendingInvoiceTotal || 0, sym) },
    { label: "Avg Monthly Net", value: money(overview.totalNet / 12, sym) },
    { label: "Top Customers", value: String((stats.topCustomers || []).length || 0) }
  ];
}

function getFinancialYearSnapshotRows(data, overview, sym) {
  const stats = overview.endingStats || {};

  if (isApartmentOrgData(data)) {
    return {
      title: "Society Snapshot",
      rows: [
        { label: "Collection rate", value: `${Math.round(stats.collectionRate || 0)}%` },
        { label: "Latest monthly reserve", value: money(stats.monthlyReserve || 0, sym) },
        { label: "Pending flats in latest month", value: String(stats.unpaidFlats?.length || 0) }
      ]
    };
  }

  if (isPersonalOrgData(data)) {
    return {
      title: "Household Snapshot",
      rows: [
        { label: "Active EMIs", value: String(stats.activeLoansCount || 0) },
        { label: "Monthly EMI", value: money(stats.totalEmi || 0, sym) },
        { label: "Net after EMI", value: money(stats.netAfterEmi || 0, sym) }
      ]
    };
  }

  if (isFreelancerOrgData(data)) {
    return {
      title: "Freelancer Snapshot",
      rows: [
        { label: "Tracked clients", value: String(stats.trackedClientsCount || 0) },
        { label: "Pending invoices", value: money(stats.pendingInvoiceTotal || 0, sym) },
        { label: "Overdue invoices", value: String(stats.overdueInvoices?.length || 0) }
      ]
    };
  }

  if (isSmallBusinessOrgData(data)) {
    return {
      title: "Business Snapshot",
      rows: [
        { label: "Service catalog", value: String(stats.servicesCount || 0) },
        { label: "Team members", value: String(stats.teamCount || 0) },
        { label: "Partner dues", value: money(stats.partnerBalanceTotal || 0, sym) }
      ]
    };
  }

  return {
    title: "Business Snapshot",
    rows: [
      { label: "Pending invoices", value: money(stats.pendingInvoiceTotal || 0, sym) },
      { label: "Burn rate", value: stats.burnRateDays == null ? "--" : `${stats.burnRateDays} days` },
      { label: "Invoices overdue", value: String(stats.overdueInvoices?.length || 0) }
    ]
  };
}

const STATEMENT_THEME = {
  header: [16, 42, 67],
  headerSoft: [226, 236, 248],
  credit: [34, 139, 94],
  creditSoft: [229, 245, 237],
  debit: [189, 69, 69],
  debitSoft: [250, 232, 232],
  neutral: [186, 137, 57],
  neutralSoft: [248, 241, 223],
  row: [247, 249, 252],
  border: [219, 227, 236],
  text: [20, 20, 28],
  textDim: [96, 104, 116]
};

function setRgbFill(doc, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setRgbText(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawStatementHero(doc, y, title, subtitle, metaLine) {
  setRgbFill(doc, STATEMENT_THEME.header);
  doc.roundedRect(PAGE.left, y, PAGE.right - PAGE.left, 34, 7, 7, "F");
  setRgbText(doc, [255, 255, 255]);
  const safeTitle = safeText(title);
  const titleFontSize = safeTitle.length > 34 ? 16 : 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(titleFontSize);
  doc.text(safeTitle, PAGE.left + 5, y + 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(safeText(metaLine), PAGE.left + 5, y + 19);
  doc.text(safeText(subtitle), PAGE.left + 5, y + 26);
  return y + 42;
}

function drawStatementSummaryCards(doc, y, items) {
  const cardWidth = 86;
  const cardHeight = 28;
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = col === 0 ? PAGE.left : 108;
    const cy = y + row * (cardHeight + 8);
    setRgbFill(doc, item.softColor);
    doc.roundedRect(x, cy, cardWidth, cardHeight, 4, 4, "F");
    setRgbFill(doc, item.color);
    doc.roundedRect(x, cy, 4, cardHeight, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setRgbText(doc, STATEMENT_THEME.textDim);
    doc.text(safeText(item.label), x + 8, cy + 8);
    doc.setFontSize(14);
    setRgbText(doc, item.color);
    doc.text(safeText(item.value), x + 8, cy + 19);
  });
  return y + Math.ceil(items.length / 2) * (cardHeight + 8);
}

function buildApartmentStatementRows(collections, expenses, openingBalance) {
  const transactions = [
    ...collections.map(item => ({
      date: item.date || `${item.collectionMonth || item.month || ""}-01`,
      details: [
        item.flatNumber ? `Flat ${safeText(item.flatNumber)}` : "Collection",
        safeText(item.collectionType || "Collection")
      ].filter(Boolean).join(" | "),
      credit: Number(item.amount || 0),
      debit: 0
    })),
    ...expenses.map(item => ({
      date: item.date || `${item.month || ""}-01`,
      details: [
        safeText(item.category || item.expenseType || "Expense"),
        safeText(item.serviceProvider || item.vendor || item.billReference || item.note || "")
      ].filter(Boolean).join(" | "),
      credit: 0,
      debit: Number(item.amount || 0)
    }))
  ].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  let runningBalance = Number(openingBalance || 0);
  return transactions.map(item => {
    runningBalance += item.credit - item.debit;
    return {
      date: formatDateValue(item.date),
      details: item.details || "--",
      credit: item.credit,
      debit: item.debit,
      balance: runningBalance
    };
  });
}

function drawApartmentStatementTable(doc, y, title, rows, sym) {
  y = ensureSpace(doc, y, 22);
  setRgbText(doc, STATEMENT_THEME.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(safeText(title), PAGE.left, y);
  y += 8;

  const columns = [
    { key: "date", label: "Date", width: 22, align: "left" },
    { key: "details", label: "Details", width: 82, align: "left" },
    { key: "credit", label: "Credit", width: 22, align: "right" },
    { key: "debit", label: "Debit", width: 22, align: "right" },
    { key: "balance", label: "Balance", width: 30, align: "right" }
  ];

  const drawHeader = headerY => {
    setRgbFill(doc, STATEMENT_THEME.headerSoft);
    doc.roundedRect(PAGE.left, headerY, PAGE.right - PAGE.left, 10, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setRgbText(doc, STATEMENT_THEME.header);
    let x = PAGE.left + 2;
    columns.forEach(column => {
      const textX = column.align === "right" ? x + column.width - 2 : x;
      doc.text(column.label, textX, headerY + 6.5, column.align === "right" ? { align: "right" } : undefined);
      x += column.width;
    });
  };

  drawHeader(y);
  y += 14;

  if (!rows.length) {
    return drawRows(doc, y, [{ label: "No transactions recorded", value: "--" }]);
  }

  rows.forEach((row, index) => {
    const detailLines = doc.splitTextToSize(safeText(row.details), 78);
    const rowHeight = Math.max(10, detailLines.length * 4.6 + 2);
    y = ensureSpace(doc, y, rowHeight + 4);
    if (y === PAGE.top) {
      drawHeader(y);
      y += 14;
    }
    if (index % 2 === 0) {
      setRgbFill(doc, STATEMENT_THEME.row);
      doc.rect(PAGE.left, y - 5, PAGE.right - PAGE.left, rowHeight + 2, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    setRgbText(doc, STATEMENT_THEME.text);

    let x = PAGE.left + 2;
    doc.text(safeText(row.date), x, y + 1);
    x += 22;
    doc.text(detailLines, x, y + 1);
    x += 82;

    if (row.credit > 0) {
      setRgbText(doc, STATEMENT_THEME.credit);
      doc.text(money(row.credit, sym), x + 20, y + 1, { align: "right" });
    }
    x += 22;
    if (row.debit > 0) {
      setRgbText(doc, STATEMENT_THEME.debit);
      doc.text(money(row.debit, sym), x + 20, y + 1, { align: "right" });
    }
    x += 22;
    setRgbText(doc, row.balance >= 0 ? STATEMENT_THEME.header : STATEMENT_THEME.debit);
    doc.text(money(row.balance, sym), x + 28, y + 1, { align: "right" });
    y += rowHeight + 4;
  });

  return y;
}

function getApartmentFlatStatusRows(data, year, month) {
  const flats = (data?.customers || [])
    .filter(flat => String(flat?.name || "").trim())
    .map(flat => ({
      flatNumber: String(flat.name || "").trim(),
      ownerName: String(flat.ownerName || "").trim(),
      expected: Number(flat.monthlyMaintenance || 0)
    }));
  const collections = getApartmentCollectionEntries(data, year, month).filter(item => !isOpeningBalanceCollection(item));

  return flats
    .map(flat => {
      const matchingCollections = collections
        .filter(item => String(item.flatNumber || "").trim() === flat.flatNumber);
      const paidAmount = matchingCollections
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const lastCollectionDate = matchingCollections
        .map(item => item.date || `${item.collectionMonth || item.month || ""}-01`)
        .filter(Boolean)
        .sort((a, b) => String(b).localeCompare(String(a)))[0] || "";
      const dueAmount = Math.max(0, flat.expected - paidAmount);
      return {
        ...flat,
        paidAmount,
        transactionDate: formatDateValue(lastCollectionDate),
        dueAmount,
        status: dueAmount <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Pending"
      };
    })
    .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber));
}

function drawApartmentFlatStatusTable(doc, y, title, rows, sym) {
  y = ensureSpace(doc, y, 22);
  setRgbText(doc, STATEMENT_THEME.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(safeText(title), PAGE.left, y);
  y += 8;

  const columns = [
    { key: "flatNumber", label: "Flat", width: 24, align: "left" },
    { key: "ownerName", label: "Owner", width: 42, align: "left" },
    { key: "transactionDate", label: "Txn Date", width: 20, align: "left" },
    { key: "expected", label: "Expected", width: 26, align: "right" },
    { key: "paidAmount", label: "Collected", width: 26, align: "right" },
    { key: "dueAmount", label: "Due", width: 20, align: "right" },
    { key: "status", label: "Status", width: 20, align: "right" }
  ];

  const drawHeader = headerY => {
    setRgbFill(doc, STATEMENT_THEME.headerSoft);
    doc.roundedRect(PAGE.left, headerY, PAGE.right - PAGE.left, 10, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    setRgbText(doc, STATEMENT_THEME.header);
    let x = PAGE.left + 2;
    columns.forEach(column => {
      const textX = column.align === "right" ? x + column.width - 2 : x;
      doc.text(column.label, textX, headerY + 6.5, column.align === "right" ? { align: "right" } : undefined);
      x += column.width;
    });
  };

  drawHeader(y);
  y += 14;

  if (!rows.length) {
    return drawRows(doc, y, [{ label: "No flat records found", value: "--" }]);
  }

  rows.forEach((row, index) => {
    const ownerLines = doc.splitTextToSize(safeText(row.ownerName || "--"), 38);
    const rowHeight = Math.max(9, ownerLines.length * 4.4 + 1);
    y = ensureSpace(doc, y, rowHeight + 4);
    if (y === PAGE.top) {
      drawHeader(y);
      y += 14;
    }
    if (index % 2 === 0) {
      setRgbFill(doc, STATEMENT_THEME.row);
      doc.rect(PAGE.left, y - 5, PAGE.right - PAGE.left, rowHeight + 2, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    setRgbText(doc, STATEMENT_THEME.text);

    let x = PAGE.left + 2;
    doc.text(safeText(row.flatNumber), x, y + 1);
    x += 24;
    doc.text(ownerLines, x, y + 1);
    x += 42;
    doc.text(safeText(row.transactionDate || "--"), x, y + 1);
    x += 20;
    doc.text(money(row.expected, sym), x + 24, y + 1, { align: "right" });
    x += 26;
    doc.text(money(row.paidAmount, sym), x + 24, y + 1, { align: "right" });
    x += 26;
    setRgbText(doc, row.dueAmount > 0 ? STATEMENT_THEME.debit : STATEMENT_THEME.credit);
    doc.text(money(row.dueAmount, sym), x + 18, y + 1, { align: "right" });
    x += 20;
    setRgbText(doc, row.status === "Paid" ? STATEMENT_THEME.credit : row.status === "Partial" ? STATEMENT_THEME.neutral : STATEMENT_THEME.debit);
    doc.text(safeText(row.status), x + 14, y + 1, { align: "right" });
    y += rowHeight + 4;
  });

  return y;
}

function drawApartmentExpenseDetailTable(doc, y, title, rows, sym) {
  y = ensureSpace(doc, y, 22);
  setRgbText(doc, STATEMENT_THEME.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(safeText(title), PAGE.left, y);
  y += 8;

  const columns = [
    { key: "date", label: "Date", width: 24, align: "left" },
    { key: "category", label: "Category", width: 36, align: "left" },
    { key: "paidTo", label: "Paid To", width: 54, align: "left" },
    { key: "amount", label: "Amount", width: 26, align: "right" },
    { key: "reference", label: "Reference / Note", width: 38, align: "left" }
  ];

  const drawHeader = headerY => {
    setRgbFill(doc, STATEMENT_THEME.headerSoft);
    doc.roundedRect(PAGE.left, headerY, PAGE.right - PAGE.left, 10, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    setRgbText(doc, STATEMENT_THEME.header);
    let x = PAGE.left + 2;
    columns.forEach(column => {
      const textX = column.align === "right" ? x + column.width - 2 : x;
      doc.text(column.label, textX, headerY + 6.5, column.align === "right" ? { align: "right" } : undefined);
      x += column.width;
    });
  };

  drawHeader(y);
  y += 14;

  if (!rows.length) {
    return drawRows(doc, y, [{ label: "No expenses recorded", value: "--" }]);
  }

  rows.forEach((row, index) => {
    const paidToLines = doc.splitTextToSize(safeText(row.paidTo || "--"), 50);
    const referenceLines = doc.splitTextToSize(safeText(row.reference || "--"), 34);
    const rowHeight = Math.max(9, paidToLines.length * 4.4 + 1, referenceLines.length * 4.4 + 1);
    y = ensureSpace(doc, y, rowHeight + 4);
    if (y === PAGE.top) {
      drawHeader(y);
      y += 14;
    }
    if (index % 2 === 0) {
      setRgbFill(doc, STATEMENT_THEME.row);
      doc.rect(PAGE.left, y - 5, PAGE.right - PAGE.left, rowHeight + 2, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    setRgbText(doc, STATEMENT_THEME.text);

    let x = PAGE.left + 2;
    doc.text(safeText(formatDateValue(row.date)), x, y + 1);
    x += 24;
    doc.text(safeText(row.category || "Expense"), x, y + 1);
    x += 36;
    doc.text(paidToLines, x, y + 1);
    x += 54;
    doc.text(money(row.amount || 0, sym), x + 24, y + 1, { align: "right" });
    x += 26;
    doc.text(referenceLines, x, y + 1);
    y += rowHeight + 4;
  });

  return y;
}

function downloadApartmentFinancialYearStatementReport(data, startYear, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const overview = buildFinancialYearOverview(data, startYear);
  const apartmentName = safeText(data?.account?.name || "Apartment / Society");
  const title = `${apartmentName} Statement`;
  const statementRows = buildApartmentStatementRows(
    getApartmentFinancialYearCollectionEntries(data, startYear),
    getApartmentFinancialYearExpenseEntries(data, startYear),
    0
  );

  let y = PAGE.top;
  y = drawStatementHero(doc, y, title, `Generated on ${new Date().toLocaleDateString("en-IN")}`, overview.label);
  y = drawStatementSummaryCards(doc, y, [
    { label: "Collections", value: money(overview.totalIncome, sym), color: STATEMENT_THEME.credit, softColor: STATEMENT_THEME.creditSoft },
    { label: "Expenses", value: money(overview.totalExpense, sym), color: STATEMENT_THEME.debit, softColor: STATEMENT_THEME.debitSoft },
    { label: "Net Reserve", value: money(overview.totalNet, sym), color: STATEMENT_THEME.header, softColor: STATEMENT_THEME.headerSoft },
    { label: "Avg Monthly", value: money(overview.totalIncome / 12, sym), color: STATEMENT_THEME.neutral, softColor: STATEMENT_THEME.neutralSoft }
  ]);

  y = ensureSpace(doc, y + 2, 30);
  y = sectionTitle(doc, y + 2, "Statement Snapshot");
  y = drawRows(doc, y, [
    { label: "Apartment Name", value: apartmentName },
    { label: "Financial Year", value: overview.label },
    { label: "Pending Flats", value: String(overview.endingStats?.unpaidFlats?.length || 0) }
  ]);

  y = ensureSpace(doc, y + 2, 60);
  y = drawApartmentStatementTable(doc, y + 2, "Transaction Statement", statementRows, sym);
  doc.save(getFinancialYearFilename(data, startYear));
}

function downloadApartmentMonthlyStatementReport(data, year, month, sym) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = calculateApartmentDashboard(data, year, month);
  const apartmentName = safeText(data?.account?.name || "Apartment / Society");
  const monthlyCollections = getApartmentCollectionEntries(data, year, month);
  const openingBalanceCollections = monthlyCollections.filter(isOpeningBalanceCollection);
  const regularCollections = monthlyCollections.filter(item => !isOpeningBalanceCollection(item));
  const monthlyExpenses = getApartmentExpenseEntries(data, year, month);
  const openingBalance = Number(stats.totalReserve || 0) - Number(stats.monthlyReserve || 0);
  const adjustedOpeningBalance = openingBalance + sumCollectionAmounts(openingBalanceCollections);
  const regularCollectionTotal = sumCollectionAmounts(regularCollections);
  const flatStatusRows = getApartmentFlatStatusRows(data, year, month);
  const totalDueAmount = flatStatusRows.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0);

  let y = PAGE.top;
  y = drawStatementHero(doc, y, `${apartmentName} Resident Report`, "Resident circulation copy - collections, dues, and expenses summary", `${MONTHS[month]} ${year}`);
  y = drawStatementSummaryCards(doc, y, [
    { label: "Opening Balance", value: money(adjustedOpeningBalance, sym), color: STATEMENT_THEME.neutral, softColor: STATEMENT_THEME.neutralSoft },
    { label: "Collections", value: money(regularCollectionTotal, sym), color: STATEMENT_THEME.credit, softColor: STATEMENT_THEME.creditSoft },
    { label: "Expenses", value: money(stats.totalExpense, sym), color: STATEMENT_THEME.debit, softColor: STATEMENT_THEME.debitSoft },
    { label: "Closing Balance", value: money(stats.totalReserve, sym), color: STATEMENT_THEME.header, softColor: STATEMENT_THEME.headerSoft }
  ]);

  y = ensureSpace(doc, y + 2, 30);
  y = sectionTitle(doc, y + 2, "Statement Snapshot");
  y = drawRows(doc, y, [
    { label: "Apartment Name", value: apartmentName },
    { label: "Statement Period", value: `${MONTHS[month]} ${year}` },
    { label: "Pending Flats", value: String(stats.unpaidFlats?.length || 0) },
    { label: "Collection Efficiency", value: `${Math.round(stats.collectionRate || 0)}%` },
    { label: "Pending Dues", value: money(totalDueAmount, sym) }
  ]);

  y = ensureSpace(doc, y + 2, 60);
  y = drawApartmentFlatStatusTable(doc, y + 2, "Flat-wise Collection Details", flatStatusRows, sym);
  y = ensureSpace(doc, y + 2, 60);
  y = drawApartmentExpenseDetailTable(
    doc,
    y + 2,
    "Expense Details",
    monthlyExpenses.map(item => ({
      date: item.date || `${item.month || ""}-01`,
      category: item.category || item.expenseType || "Expense",
      paidTo: item.serviceProvider || item.vendor || item.paidTo || "--",
      amount: Number(item.amount || 0),
      reference: item.billReference || item.referenceNo || item.note || "--"
    })),
    sym
  );
  doc.save(`society-report-${stats.monthKey}.pdf`);
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
    ["User ID", "Name", "Email", "Phone", "Plan", "Subscription Status", "Joined", "Blocked"]
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
      user.blocked ? "Yes" : "No"
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

export function downloadFinancialYearReport(data, startYear, sym) {
  if (isApartmentOrgData(data)) {
    downloadApartmentFinancialYearStatementReport(data, startYear, sym);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const overview = buildFinancialYearOverview(data, startYear);
  const title = getFinancialYearTitle(data, startYear);
  const snapshot = getFinancialYearSnapshotRows(data, overview, sym);
  const apartmentName = safeText(data?.account?.name || "Apartment / Society");

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

  if (isApartmentOrgData(data)) {
    y = sectionTitle(doc, y, "Apartment");
    y = drawRows(doc, y, [{ label: "Apartment Name", value: apartmentName }]);
  }

  y = sectionTitle(doc, y, "Financial Year Summary");
  y = drawMetricGrid(doc, y, getFinancialYearMetricItems(data, overview, sym));

  y = ensureSpace(doc, y + 2, 44);
  y = sectionTitle(doc, y + 2, "Month-by-Month Breakdown");
  y = drawRows(
    doc,
    y,
    overview.monthlyStats.map(period => {
      const stats = period.stats || {};
      const expenseValue = isPersonalOrgData(data)
        ? Number(stats.totalExpense || 0) + Number(stats.totalEmi || 0)
        : Number(stats.totalExpense || 0);
      const netValue = isPersonalOrgData(data) ? Number(stats.netAfterEmi || 0) : Number(stats.profit || 0);
      return {
        label: period.label,
        value: `${money(stats.totalIncome || 0, sym)} | ${money(expenseValue, sym)} | Net ${money(netValue, sym)}`
      };
    })
  );

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, snapshot.title);
  y = drawRows(doc, y, snapshot.rows);

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Top Expense Categories");
  y = drawRows(
    doc,
    y,
    overview.topExpenseCategories.length
      ? overview.topExpenseCategories.map(item => ({ label: item.category, value: money(item.amount, sym) }))
      : [{ label: "No expense categories recorded", value: "--" }]
  );

  y = ensureSpace(doc, y + 2, 40);
  y = sectionTitle(doc, y + 2, "Alerts Across The Year");
  y = drawRows(
    doc,
    y,
    overview.alerts.length
      ? overview.alerts.map(item => ({ label: item.title, value: safeText(item.message) }))
      : [{ label: "No active alerts", value: "This financial year looks steady across the tracked records" }]
  );

  if (isApartmentOrgData(data)) {
    const collectionRows = getApartmentCollectionDetailRows(getApartmentFinancialYearCollectionEntries(data, startYear), sym);
    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Collection Details");
    y = drawRows(
      doc,
      y,
      collectionRows.length ? collectionRows : [{ label: "No collections recorded", value: "--" }]
    );

    const expenseRows = getApartmentExpenseDetailRows(getApartmentFinancialYearExpenseEntries(data, startYear), sym);
    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Expense Details");
    y = drawRows(
      doc,
      y,
      expenseRows.length ? expenseRows : [{ label: "No expenses recorded", value: "--" }]
    );
  }

  doc.save(getFinancialYearFilename(data, startYear));
}

export function downloadMonthlyReport(data, year, month, sym) {
  if (isApartmentOrgData(data)) {
    downloadApartmentMonthlyStatementReport(data, year, month, sym);
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
      { label: "Net After EMI", value: money(stats.netAfterEmi || 0, sym) },
      { label: "Active EMIs", value: String(stats.activeLoansCount || 0) },
      { label: "Household Members", value: String(stats.peopleCount || 0) }
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
            value: `${money(item.monthlyEmi, sym)} | Due on ${safeText(getPersonalEmiDueDay(item) || "--")}${item.endDate ? ` | Ends ${safeText(item.endDate)}` : ""}`
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

  if (isFreelancerOrgData(data)) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const stats = calculateFreelancerDashboard(data, year, month);
    const title = `Freelancer Report - ${MONTHS[month]} ${year}`;

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

    y = sectionTitle(doc, y, "Freelancer Summary");
    y = drawMetricGrid(doc, y, [
      { label: "Collected", value: money(stats.totalIncome, sym) },
      { label: "Expenses", value: money(stats.totalExpense, sym) },
      { label: "Net", value: money(stats.profit, sym) },
      { label: "Awaiting Payments", value: money(stats.pendingInvoiceTotal, sym) },
      { label: "Clients", value: String(stats.trackedClientsCount || 0) },
      { label: "Billable Costs", value: money(stats.billableExpenseTotal || 0, sym) }
    ]);

    y = ensureSpace(doc, y + 2, 44);
    y = sectionTitle(doc, y + 2, "Invoice Follow-up");
    y = drawRows(
      doc,
      y,
      [...(stats.overdueInvoices || []), ...(stats.dueSoonInvoices || []).filter(invoice => !(stats.overdueInvoices || []).some(overdue => overdue.id === invoice.id))].length
        ? [...(stats.overdueInvoices || []), ...(stats.dueSoonInvoices || []).filter(invoice => !(stats.overdueInvoices || []).some(overdue => overdue.id === invoice.id))].slice(0, 6).map(invoice => ({
            label: `${safeText(invoice.number || "Invoice")}${(invoice.customer?.name || invoice.billTo?.name) ? ` · ${safeText(invoice.customer?.name || invoice.billTo?.name)}` : ""}`,
            value: `${money(invoice.total || 0, sym)} | ${safeText(invoice.status || invoice.computedStatus || "pending")}${invoice.dueDate ? ` | Due ${safeText(invoice.dueDate)}` : ""}`
          }))
        : [{ label: "No invoice follow-up needed", value: "Open client invoices are under control for this period" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Client Snapshot");
    y = drawRows(
      doc,
      y,
      stats.topCustomers.length
        ? stats.topCustomers.map(client => ({
            label: safeText(client.name),
            value: `${money(client.revenue, sym)} | Open ${money(client.balance, sym)}`
          }))
        : [{ label: "No client billing recorded yet", value: "Create invoices or log client payments to build this section" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Expense Breakdown");
    y = drawRows(
      doc,
      y,
      stats.topExpenseCategories.length
        ? stats.topExpenseCategories.map(item => ({ label: item.category, value: money(item.amount, sym) }))
        : [{ label: "No freelancer expenses recorded", value: "--" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Alerts Snapshot");
    y = drawRows(
      doc,
      y,
      stats.alertItems.length
        ? stats.alertItems.slice(0, 5).map(item => ({ label: item.title, value: safeText(item.message) }))
        : [{ label: "No active alerts", value: "Payments and freelancer spending look steady right now" }]
    );

    doc.save(`freelancer-report-${stats.monthKey}.pdf`);
    return;
  }

  if (isSmallBusinessOrgData(data)) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const stats = calculateSmallBusinessDashboard(data, year, month);
    const title = `Small Business Report - ${MONTHS[month]} ${year}`;

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

    y = sectionTitle(doc, y, "Business Summary");
    y = drawMetricGrid(doc, y, [
      { label: "Sales", value: money(stats.totalIncome, sym) },
      { label: "Expenses", value: money(stats.totalExpense, sym) },
      { label: "Profit / Loss", value: money(stats.profit, sym) },
      { label: "Pending Invoices", value: money(stats.pendingInvoiceTotal, sym) },
      { label: "Service Catalog", value: String(stats.servicesCount || 0) },
      { label: "Partner Dues", value: money(stats.partnerBalanceTotal || 0, sym) }
    ]);

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Service Catalog");
    y = drawRows(
      doc,
      y,
      stats.servicesCount
        ? (stats.topServices || []).slice(0, 6).map(item => ({
            label: safeText(item.serviceName),
            value: `${item.defaultAmount ? money(item.defaultAmount, sym) : "--"}${item.packageName ? ` | ${safeText(item.packageName)}` : ""}`
          }))
        : [{ label: "No service records added", value: "Add your core services in Settings to keep work consistent" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Partner Balances");
    y = drawRows(
      doc,
      y,
      stats.partnersCount
        ? (stats.partnersWithBalance.length
          ? stats.partnersWithBalance.slice(0, 6).map(partner => ({
              label: safeText(partner.partnerName),
              value: `${money(partner.balanceDue, sym)}${partner.contact ? ` | ${safeText(partner.contact)}` : ""}`
            }))
          : [{ label: "All partner balances are clear", value: "No outstanding partner or vendor dues are recorded" }])
        : [{ label: "No partner records added", value: "Add partners or outside vendors in Settings to track balances here" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Team Snapshot");
    y = drawRows(
      doc,
      y,
      stats.teamCount
        ? (stats.teamMembers || []).slice(0, 6).map(member => ({
            label: safeText(member.name),
            value: `${member.role ? safeText(member.role) : "Role not added"}${member.payout ? ` | ${money(member.payout, sym)}` : ""}`
          }))
        : [{ label: "No team records added", value: "Add team members in Settings to keep roles and payouts visible" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Top Customers");
    y = drawRows(
      doc,
      y,
      stats.topCustomers.length
        ? stats.topCustomers.map(item => ({
            label: item.name,
            value: `${money(item.revenue, sym)} | Open ${money(item.balance, sym)}`
          }))
        : [{ label: "No customer revenue recorded yet", value: "Create invoices to build customer insights" }]
    );

    y = ensureSpace(doc, y + 2, 40);
    y = sectionTitle(doc, y + 2, "Alerts Snapshot");
    y = drawRows(
      doc,
      y,
      stats.alertItems.length
        ? stats.alertItems.slice(0, 6).map(item => ({ label: item.title, value: safeText(item.message) }))
        : [{ label: "No active alerts", value: "Operations, stock, and collections look steady right now" }]
    );

    doc.save(`small-business-report-${stats.monthKey}.pdf`);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const stats = calculateDashboard(data, year, month);
  const invoices = getFinancialInvoices(data.invoices).filter(item => item.date?.slice(0, 7) === stats.monthKey);
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
    { label: "Total Sales", value: money(stats.totalIncome, sym) },
    { label: "Total Expenses", value: money(stats.totalExpense, sym) },
    { label: "Profit / Loss", value: money(stats.profit, sym) },
    { label: "Pending Invoices", value: money(stats.pendingInvoiceTotal, sym) },
    { label: "Burn Rate", value: stats.burnRateDays === null ? "--" : `${stats.burnRateDays} days` },
    { label: "Overdue Invoices", value: String(stats.overdueInvoices?.length || 0) }
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
