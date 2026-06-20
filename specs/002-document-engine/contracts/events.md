# Event Contract: Document Engine

**Status**: ✅ Implemented — see [`document-event-emitter.ts`](../../../../apps/api/src/modules/document-engine/infrastructure/document-event-emitter.ts)

## Event Bus

Events are emitted via `@nestjs/event-emitter` in-process bus and persist in the `document_events` table.

## Event Schema

All events share this base structure:

```typescript
{
  eventType: string;          // Namespace: `document.{action}`
  tenantId: string;
  documentId: string;
  documentType: string;
  timestamp: string;          // ISO 8601
  triggeredBy: string;        // User ID
  metadata?: Record<string, any>;
}
```

## Event Catalog

### `document.created`

Emitted when a new document is created in draft status.

```json
{
  "eventType": "document.created",
  "documentType": "sales_invoice",
  "status": "draft",
  "grandTotal": 1740.00,
  "currency": "VED"
}
```

**Consumers**: Audit trail, notification service

### `document.submitted`

Emitted when a document transitions to `pending_approval`.

```json
{
  "eventType": "document.submitted",
  "previousStatus": "draft",
  "newStatus": "pending_approval",
  "documentNumber": "INV-20260619-000001"
}
```

**Consumers**: Approval workflow, notification to approvers

### `document.approved`

Emitted when a document is approved (becomes immutable).

```json
{
  "eventType": "document.approved",
  "previousStatus": "pending_approval",
  "newStatus": "approved",
  "approvedBy": "user-uuid",
  "approvedAt": "2026-06-19T12:10:00Z",
  "grandTotal": 1740.00,
  "currency": "VED"
}
```

**Consumers**: Inventory (adjust stock), Accounting (post journal entry), Cash Flow (update projections), Audit trail

### `document.rejected`

Emitted when approval is rejected and document returns to draft.

```json
{
  "eventType": "document.rejected",
  "previousStatus": "pending_approval",
  "newStatus": "draft",
  "rejectionReason": "Missing line items"
}
```

**Consumers**: Notification to creator

### `document.delivered`

Emitted when a document is marked as delivered.

```json
{
  "eventType": "document.delivered",
  "previousStatus": "approved",
  "newStatus": "delivered"
}
```

**Consumers**: Inventory (reduce stock), Logistics module

### `document.paid`

Emitted when a document is marked as paid.

```json
{
  "eventType": "document.paid",
  "previousStatus": "delivered",
  "newStatus": "paid",
  "grandTotal": 1740.00,
  "currency": "VED"
}
```

**Consumers**: Cash Flow (record payment), Accounting (settle receivable/payable)

### `document.cancelled`

Emitted when a document is cancelled.

```json
{
  "eventType": "document.cancelled",
  "previousStatus": "approved|paid",
  "newStatus": "cancelled",
  "reason": "Customer request"
}
```

**Consumers**: Inventory (reverse stock adjustment), Accounting (reverse journal entry)

### `document.counter-created`

Emitted when a counter-document references an approved document.

```json
{
  "eventType": "document.counter-created",
  "originalDocumentId": "original-uuid",
  "counterDocumentId": "new-uuid",
  "counterDocumentType": "credit_note",
  "amount": -500.00,
  "currency": "VED"
}
```

**Consumers**: Accounting (record offset), Audit trail

### `document.status-changed`

Generic event for any status transition not covered by specific events.

```json
{
  "eventType": "document.status-changed",
  "previousStatus": "X",
  "newStatus": "Y"
}
```

**Consumers**: Generic listeners, analytics, activity feed

---

### `document.audit`

Emitted by `DocumentAuditInterceptor` on every mutating HTTP request (POST/PUT/PATCH/DELETE).

```json
{
  "eventType": "document.audit",
  "tenantId": "tenant-uuid",
  "documentId": "uuid",
  "method": "POST",
  "path": "/api/v1/tenants/:tid/documents/:id/submit",
  "userId": "user-uuid",
  "timestamp": "2026-06-19T12:05:00Z"
}
```

**Consumers**: Audit trail, compliance, activity feed

### `document.updated`

Emitted when a draft document is updated via `PUT /:id`.

```json
{
  "eventType": "document.updated",
  "documentType": "sales_invoice",
  "previousStatus": "draft",
  "newStatus": "draft"
}
```

**Consumers**: Audit trail

### `document.deleted`

Emitted when a document is soft-deleted via `DELETE /:id`.

```json
{
  "eventType": "document.deleted",
  "documentType": "sales_invoice",
  "status": "draft",
  "deletedAt": "2026-06-19T12:15:00Z"
}
```

**Consumers**: Audit trail, notification service
