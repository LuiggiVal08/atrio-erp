# Quickstart: Document Engine Validation Guide

## Prerequisites

- PostgreSQL 16 running (via `docker-compose up -d`)
- NestJS backend running (`npm run start:dev` from `apps/api/`)
- Database migrated: `npm run prisma:migrate`
- At least one tenant and authenticated user (use `001-core-foundations` flows)

## Setup

```bash
# From apps/api/
npm run prisma:migrate --name add_document_engine
npm run prisma:seed
npm run start:dev
```

## Validation Scenarios

### Scenario 1: Create a Document (Draft)

```bash
# Create a sales invoice
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "sales_invoice",
    "currency": "VED",
    "lines": [
      {"description": "Widget A", "quantity": 5, "unitPrice": 100.00, "taxRate": 16.00}
    ]
  }'
```

**Expected**: HTTP 201, response includes `status: "draft"`, `documentNumber` auto-generated, totals calculated.

### Scenario 2: Submit for Approval

```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId}/submit \
  -H "Authorization: Bearer {token}"
```

**Expected**: HTTP 200, `status: "pending_approval"`. Document fields become read-only.

### Scenario 3: Approve Document (Immutability Check)

```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId}/approve \
  -H "Authorization: Bearer {token}"
```

**Expected**: HTTP 200, `status: "approved"`, `approvedAt` and `approvedBy` set.

Then attempt to edit a field:

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Trying to edit"}'
```

**Expected**: HTTP 400, error message indicating document is immutable.

### Scenario 4: Invalid State Transition

```bash
# Try to deliver a draft document (should fail)
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId}/transition \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"targetStatus": "delivered"}'
```

**Expected**: HTTP 400, error message "Invalid transition: draft → delivered".

### Scenario 5: Valid State Transition

```bash
# After approval, mark as delivered
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId}/transition \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"targetStatus": "delivered"}'
```

**Expected**: HTTP 200, `status: "delivered"`.

### Scenario 6: Create Counter-Document

```bash
# Create a credit note for an approved document
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/{docId}/counter \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "counterDocumentType": "credit_note",
    "reason": "Price adjustment",
    "lines": [
      {"description": "Price correction", "quantity": 1, "unitPrice": -50.00, "taxRate": 0}
    ]
  }'
```

**Expected**: HTTP 201, new draft counter-document with `originalDocumentId` linking to the original.

### Scenario 7: Verify Event Emission

```bash
# Check document_events table or listen via WebSocket
GET /api/v1/admin/tenants/{tenantId}/documents/{docId}/events
```

**Expected**: Array of events showing `document.created`, `document.submitted`, `document.approved`, etc., in chronological order.

## Test Suite

```bash
# Run unit tests for document engine
cd apps/api && npx jest --testPathPattern='tests/unit/document-engine'

# Run contract tests
npx jest --testPathPattern='tests/contract/document-engine'

# Run all tests
npm test
```

## Expected Outcomes

| Scenario | Expected Status | Validates |
|----------|----------------|-----------|
| Create draft | `draft` | FR-008, FR-009 |
| Submit | `pending_approval` | FR-001 |
| Approve + immutability | `approved`, edits rejected | FR-002, FR-010 |
| Invalid transition | 400 error | FR-003 |
| Valid transition | status change | FR-003 |
| Counter-document | linked draft | FR-004 |
| Event emission | events persisted | FR-005, FR-006 |
| Audit trail | logs created | FR-007 |

For full data model details, see [data-model.md](data-model.md).
For API contract details, see [contracts/rest-api.md](contracts/rest-api.md).
For event contract details, see [contracts/events.md](contracts/events.md).
