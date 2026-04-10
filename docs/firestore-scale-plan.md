# Firestore Scale Plan

## Target Schema

Use a thin user profile document and move operational data into subcollections.

```
users/{userId}
  profile fields
  role
  plan
  subscriptionStatus
  activeOrgId
  analytics summary counters only

users/{userId}/orgs/{orgId}
  account
  currency
  goals
  notificationPrefs
  lightweight org summary counters

users/{userId}/orgs/{orgId}/customers/{customerId}
users/{userId}/orgs/{orgId}/income/{incomeId}
users/{userId}/orgs/{orgId}/expenses/{expenseId}
users/{userId}/orgs/{orgId}/invoices/{invoiceId}
users/{userId}/orgs/{orgId}/orgRecords/{recordId}

payment_requests/{requestId}
support_tickets/{ticketId}
shared_ledgers/{ledgerId}
```

## Why This Structure

- Avoids Firestore document size pressure on `users/{userId}`.
- Reduces write amplification caused by rewriting full nested arrays on every change.
- Enables pagination, filtering, and date-range queries.
- Makes admin analytics easier to aggregate incrementally instead of scanning giant profile documents.

## Data Ownership Rules

- `users/{userId}` stores identity and coarse account state.
- `users/{userId}/orgs/{orgId}` stores workspace metadata only.
- Records such as invoices and expenses live in their own collections and are never embedded as full arrays in the user document.
- Admin-only collections stay top-level if they need cross-user visibility.

## Suggested Document Shapes

### `users/{userId}`

```json
{
  "name": "",
  "email": "",
  "phone": "",
  "role": "user",
  "plan": "free",
  "subscriptionStatus": "active",
  "activeOrgId": "org_primary",
  "analytics": {
    "sessionCount": 0,
    "totalSessionMs": 0,
    "lastSessionAt": ""
  }
}
```

### `users/{userId}/orgs/{orgId}`

```json
{
  "account": {
    "name": "",
    "email": "",
    "phone": "",
    "addressLine": "",
    "city": "",
    "state": "",
    "country": "",
    "location": "",
    "address": "",
    "gstin": "",
    "organizationType": "small_business"
  },
  "currency": {
    "code": "INR",
    "symbol": "Rs"
  },
  "goals": {},
  "notificationPrefs": {},
  "summary": {
    "incomeCount": 0,
    "expenseCount": 0,
    "invoiceCount": 0,
    "customerCount": 0
  }
}
```

## Query Model

- Dashboard loads org metadata plus paginated month-scoped record queries.
- Admin views read pre-aggregated summaries where possible.
- Heavy analytics should move to Cloud Functions or scheduled summary jobs.

## Migration Path

### Phase 1: Dual Write

- Keep current nested `orgs` structure for compatibility.
- Start writing new records to the target subcollections as the source of truth.
- Continue writing compatibility snapshots only where old UI still depends on them.

### Phase 2: Read Switch

- Change `DataContext` reads from embedded arrays to subcollection queries.
- Load only the active org and the visible period instead of the full tenant history.
- Add pagination for invoices, expenses, customers, and admin lists.

### Phase 3: Summary Backfill

- Add counters and summary fields per org.
- Backfill totals and month snapshots using a one-time script or Cloud Function.
- Update dashboards and reports to rely on summary reads when possible.

### Phase 4: Embedded Data Retirement

- Stop writing nested record arrays to `users/{userId}`.
- Keep only profile, active org, plan, and analytics metadata in the user document.

## Immediate Priority Changes

1. Move invoices into subcollections first.
2. Move expenses and income next.
3. Move customers after transactional data is stable.
4. Replace admin full-collection scans with paginated or summarized reads.

## Frontend Impact

- `DataContext` should stop treating Firestore as one big state blob.
- Tabs should load only the data they need.
- Historical views should fetch by month or year instead of loading full user history.

## Risks To Watch

- Data duplication during dual write.
- Query index requirements once date and status filters are added.
- Report generation must be refactored to stream or page through records instead of assuming one in-memory object graph.