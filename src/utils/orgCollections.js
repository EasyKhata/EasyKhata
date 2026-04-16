// Pure utility functions — no Firestore dependency.
// The Firestore-specific sync/hydrate functions remain in firestoreOrgCollections.js
// and are only used by the legacy admin panel during the migration period.

export const ORG_COLLECTION_KEYS = ["income", "expenses", "invoices", "customers"];

function getSortValue(collectionKey, record = {}) {
  if (collectionKey === "invoices") {
    return String(record?.date || record?.updatedAt || record?.createdAt || "");
  }
  return String(record?.date || record?.month || record?.startMonth || record?.updatedAt || record?.createdAt || "");
}

export function sortOrgCollectionRecords(collectionKey, records = []) {
  return [...(records || [])].sort((left, right) => {
    const primaryCompare = getSortValue(collectionKey, right).localeCompare(getSortValue(collectionKey, left));
    if (primaryCompare !== 0) return primaryCompare;

    const updatedCompare = String(right?.updatedAt || right?.createdAt || "").localeCompare(
      String(left?.updatedAt || left?.createdAt || "")
    );
    if (updatedCompare !== 0) return updatedCompare;

    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
}

function countOrgRecords(orgRecords = {}) {
  return Object.values(orgRecords || {}).reduce(
    (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
    0
  );
}

export function buildOrgSummary(source = {}) {
  const incomeCount = Array.isArray(source?.income) ? source.income.length : 0;
  const expenseCount = Array.isArray(source?.expenses) ? source.expenses.length : 0;
  const invoiceCount = Array.isArray(source?.invoices) ? source.invoices.length : 0;
  const customerCount = Array.isArray(source?.customers) ? source.customers.length : 0;
  const orgRecordCount = countOrgRecords(source?.orgRecords);

  return {
    incomeCount,
    expenseCount,
    invoiceCount,
    customerCount,
    orgRecordCount,
    totalEntries: incomeCount + expenseCount + invoiceCount + customerCount + orgRecordCount,
    updatedAt: new Date().toISOString()
  };
}
