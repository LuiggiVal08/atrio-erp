# REST API Contract: Document Engine

**Status**: ✅ Implemented — see [`document.controller.ts`](../../../../apps/api/src/modules/document-engine/infrastructure/document.controller.ts)

**Base URL**: `/api/v1/tenants/:tenantId/documents`

**Auth**: All endpoints require JWT Bearer token + RBAC permissions via existing `JwtAuthGuard` + `RbacGuard`.

**RBAC permissions** (each endpoint is guarded with `@RequirePermission()`):

| Endpoint | Permission | Notes |
|----------|-----------|-------|
| `POST /` | `documents.create` | |
| `GET /` | `documents.list` | |
| `GET /:id` | `documents.read` | |
| `POST /:id/submit` | `documents.submit` | |
| `POST /:id/approve` | `documents.approve` | |
| `POST /:id/reject` | `documents.reject` | |
| `POST /:id/transition` | `documents.transition` | |
| `POST /:id/counter` | `documents.create` | |
| `DELETE /:id` | `documents.delete` | |
| `PUT /:id` | `documents.update` | |

**Audit**: Every POST/PUT/PATCH/DELETE operation is intercepted by `DocumentAuditInterceptor` and emits a `document.audit` event with `userId`, `tenantId`, `method`, `path`, and `documentId`.

---

## `POST /`

Create a new document in `draft` status.

**Request Body**:
```json
{
  "documentType": "sales_invoice",
  "currency": "VED",
  "notes": "Optional notes",
  "lines": [
    {
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 150.00,
      "taxRate": 16.00,
      "discountRate": 0
    }
  ]
}
```

**Response `201`**:
```json
{
  "id": "uuid",
  "documentNumber": "INV-20260619-000001",
  "documentType": "sales_invoice",
  "status": "draft",
  "subtotal": 1500.00,
  "taxTotal": 240.00,
  "grandTotal": 1740.00,
  "lines": [...],
  "createdAt": "2026-06-19T12:00:00Z"
}
```

**Errors**: `400` — validation error, `403` — permission denied

---

## `GET /`

List documents with optional filters.

**Query Parameters**: `status`, `documentType`, `dateFrom`, `dateTo`, `page`, `limit` (default 20, max 100)

**Response `200`**:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

## `GET /:id`

Get a single document with all lines.

**Response `200`**: Full document object + lines array

**Errors**: `404` — not found

---

## `POST /:id/submit`

Transition `draft → pending_approval`.

**Response `200`**:
```json
{
  "id": "uuid",
  "status": "pending_approval",
  "submittedAt": "2026-06-19T12:05:00Z"
}
```

---

## `POST /:id/approve`

Transition `pending_approval → approved`. Immutability activates.

**Response `200`**: Status updated to `approved`, `approvedAt` and `approvedBy` set.

**Errors**: `409` — already approved by another user (concurrent approval)

---

## `POST /:id/reject`

Transition `pending_approval → draft`. Requires `rejectionReason`.

**Request Body**:
```json
{
  "rejectionReason": "Missing line items"
}
```

**Response `200`**: Status back to `draft`.

---

## `POST /:id/transition`

Generic state transition. Body specifies target status.

**Request Body**:
```json
{
  "targetStatus": "delivered"
}
```

**Response `200`**: Status updated. Emits `document.status-changed` event.

**Errors**: `400` — invalid transition for current status

---

## `POST /:id/counter`

Create a counter-document (Credit Note / Debit Note) referencing this approved document.

**Request Body**:
```json
{
  "counterDocumentType": "credit_note",
  "reason": "Price correction",
  "lines": [...]
}
```

**Response `201`**: New counter-document in `draft` status.

**Errors**: `400` — original document not approved, `403` — no permission

---

## `DELETE /:id`

Soft delete a document. Only allowed in `draft` or `cancelled` status.

**Response `204`**: No content

**Errors**: `400` — cannot delete approved document
