import { collection, doc, getDocs, writeBatch } from "firebase/firestore";

export const ORG_COLLECTION_KEYS = ["income", "expenses", "invoices"];

function countOrgRecords(orgRecords = {}) {
  return Object.values(orgRecords || {}).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
}

function sanitizeForFirestore(value) {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeForFirestore(item)).filter(item => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, entry]) => {
      const cleaned = sanitizeForFirestore(entry);
      if (cleaned !== undefined) {
        acc[key] = cleaned;
      }
      return acc;
    }, {});
  }

  return value;
}

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

    const updatedCompare = String(right?.updatedAt || right?.createdAt || "").localeCompare(String(left?.updatedAt || left?.createdAt || ""));
    if (updatedCompare !== 0) return updatedCompare;

    return String(right?.id || "").localeCompare(String(left?.id || ""));
  });
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

function buildOrgCollectionSignature(collectionKey, records = []) {
  return JSON.stringify(sortOrgCollectionRecords(collectionKey, records).map(record => sanitizeForFirestore(record)));
}

function getSignatureKey(userId, orgId, collectionKey, scopeKey = "") {
  const baseKey = scopeKey || `${userId}:${orgId}`;
  return `${baseKey}:${collectionKey}`;
}

export function getOrgCollectionRef(db, userId, orgId, collectionKey, pathSegments = null) {
  if (Array.isArray(pathSegments) && pathSegments.length) {
    return collection(db, ...pathSegments, collectionKey);
  }

  return collection(db, "users", userId, "orgs", orgId, collectionKey);
}

function getOrgCollectionDocRef(db, userId, orgId, collectionKey, recordId, pathSegments = null) {
  if (Array.isArray(pathSegments) && pathSegments.length) {
    return doc(db, ...pathSegments, collectionKey, recordId);
  }

  return doc(db, "users", userId, "orgs", orgId, collectionKey, recordId);
}

export async function syncOrgCollection({ db, userId, orgId, collectionKey, records = [], signatureStore = null, force = false, deleteMissing = true, pathSegments = null, scopeKey = "" }) {
  if (!db || !userId || !orgId || !collectionKey) return;

  const syncKey = getSignatureKey(userId, orgId, collectionKey, scopeKey);
  const normalizedRecords = sortOrgCollectionRecords(collectionKey, records);
  const nextSignature = buildOrgCollectionSignature(collectionKey, normalizedRecords);

  if (!force && signatureStore?.[syncKey] === nextSignature) {
    return;
  }

  const collectionRef = getOrgCollectionRef(db, userId, orgId, collectionKey, pathSegments);
  const snapshot = await getDocs(collectionRef);
  const existingDocs = new Map(snapshot.docs.map(item => [item.id, item.data()]));
  const nextIds = new Set();
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  normalizedRecords.forEach(record => {
    const recordId = record.id;
    if (!recordId) return;

    const existingRecord = existingDocs.get(recordId) || {};
    nextIds.add(recordId);
    batch.set(
      getOrgCollectionDocRef(db, userId, orgId, collectionKey, recordId, pathSegments),
      sanitizeForFirestore({
        ...record,
        id: recordId,
        orgId,
        createdAt: record.createdAt || existingRecord.createdAt || nowIso,
        updatedAt: nowIso
      })
    );
  });

  if (deleteMissing) {
    snapshot.docs.forEach(item => {
      if (!nextIds.has(item.id)) {
        batch.delete(item.ref);
      }
    });
  }

  await batch.commit();
  if (signatureStore) {
    signatureStore[syncKey] = nextSignature;
  }
}

export async function deleteOrgCollectionDocs({ db, userId, orgId, collectionKey, signatureStore = null, pathSegments = null, scopeKey = "" }) {
  if (!db || !userId || !orgId || !collectionKey) return;

  const snapshot = await getDocs(getOrgCollectionRef(db, userId, orgId, collectionKey, pathSegments));
  if (!snapshot.empty) {
    const batch = writeBatch(db);
    snapshot.docs.forEach(item => batch.delete(item.ref));
    await batch.commit();
  }

  if (signatureStore) {
    delete signatureStore[getSignatureKey(userId, orgId, collectionKey, scopeKey)];
  }
}

export async function hydrateUserOrgCollections({ db, userId, orgs = {}, collectionKeys = ["invoices"], signatureStore = null }) {
  const orgEntries = Object.entries(orgs || {});
  if (!db || !userId || !orgEntries.length) {
    return { orgs, backfillTargets: [] };
  }

  const hydratedEntries = await Promise.all(
    orgEntries.map(async ([orgId, orgValue]) => {
      let nextOrgValue = { ...orgValue };
      const backfillTargets = [];

      for (const collectionKey of collectionKeys) {
        try {
          const snapshot = await getDocs(getOrgCollectionRef(db, userId, orgId, collectionKey));
          const embeddedRecords = sortOrgCollectionRecords(collectionKey, nextOrgValue?.[collectionKey] || []);

          if (snapshot.empty) {
            nextOrgValue[collectionKey] = embeddedRecords;
            if (signatureStore) {
              signatureStore[getSignatureKey(userId, orgId, collectionKey)] = buildOrgCollectionSignature(collectionKey, embeddedRecords);
            }
            if (embeddedRecords.length) {
              backfillTargets.push({ orgId, collectionKey, records: embeddedRecords });
            }
            continue;
          }

          const subcollectionRecords = sortOrgCollectionRecords(
            collectionKey,
            snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
          );
          const subcollectionById = new Set(subcollectionRecords.map(record => record.id).filter(Boolean));
          const missingFromSubcollection = embeddedRecords.filter(record => record.id && !subcollectionById.has(record.id));
          const mergedRecords = sortOrgCollectionRecords(collectionKey, [...subcollectionRecords, ...missingFromSubcollection]);

          nextOrgValue[collectionKey] = mergedRecords;
          if (signatureStore) {
            signatureStore[getSignatureKey(userId, orgId, collectionKey)] = buildOrgCollectionSignature(collectionKey, mergedRecords);
          }
          if (missingFromSubcollection.length) {
            backfillTargets.push({ orgId, collectionKey, records: mergedRecords });
          }
        } catch {
          const embeddedRecords = sortOrgCollectionRecords(collectionKey, nextOrgValue?.[collectionKey] || []);
          nextOrgValue[collectionKey] = embeddedRecords;
          if (signatureStore) {
            signatureStore[getSignatureKey(userId, orgId, collectionKey)] = buildOrgCollectionSignature(collectionKey, embeddedRecords);
          }
        }
      }

      return { orgId, orgValue: nextOrgValue, backfillTargets };
    })
  );

  return hydratedEntries.reduce(
    (acc, entry) => {
      acc.orgs[entry.orgId] = entry.orgValue;
      acc.backfillTargets.push(...entry.backfillTargets);
      return acc;
    },
    { orgs: {}, backfillTargets: [] }
  );
}

export async function migrateUserOrgCollections({ db, userId, orgs = {}, collectionKeys = ORG_COLLECTION_KEYS, signatureStore = null }) {
  const orgEntries = Object.entries(orgs || {});
  let migratedOrgCount = 0;
  let migratedRecordCount = 0;

  for (const [orgId, orgValue] of orgEntries) {
    let orgTouched = false;
    for (const collectionKey of collectionKeys) {
      const records = sortOrgCollectionRecords(collectionKey, orgValue?.[collectionKey] || []);
      if (!records.length) continue;
      await syncOrgCollection({
        db,
        userId,
        orgId,
        collectionKey,
        records,
        signatureStore,
        force: true,
        deleteMissing: false
      });
      migratedRecordCount += records.length;
      orgTouched = true;
    }

    if (orgTouched) {
      migratedOrgCount += 1;
    }
  }

  return {
    migratedOrgCount,
    migratedRecordCount
  };
}