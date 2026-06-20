# Data Model: Document Engine

## Entity: Document

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | Auto-generated | Document identifier |
| `tenantId` | UUID (FK → tenants.id) | NOT NULL, indexed | Tenant scope (Principle V) |
| `documentType` | Enum | NOT NULL | `sales_invoice`, `purchase_order`, `credit_note`, `debit_note`, `delivery_order`, `stock_transfer`, `cash_movement` |
| `status` | Enum | NOT NULL, default `draft` | `draft`, `pending_approval`, `approved`, `delivered`, `paid`, `cancelled` |
| `documentNumber` | String | NOT NULL, unique per tenant | Auto-generated human-readable number (e.g., INV-000001) |
| `originalDocumentId` | UUID (self-FK) | NULLABLE | Links counter-document to original approved document |
| `counterDocumentType` | Enum | NULLABLE | `credit_note`, `debit_note` — type of counter-document |
| `currency` | String | NOT NULL, default `VED` | ISO currency code (Principle IV compatibility) |
| `exchangeRate` | Decimal(15,6) | NULLABLE | Rate at moment of approval (Principle IV) |
| `subtotal` | Decimal(15,2) | NOT NULL, >= 0 | Sum of line amounts before taxes |
| `taxTotal` | Decimal(15,2) | NOT NULL, >= 0 | Total taxes |
| `discountTotal` | Decimal(15,2) | NOT NULL, >= 0 | Total discounts |
| `grandTotal` | Decimal(15,2) | NOT NULL, >= 0 | Final total (subtotal + taxes - discounts) |
| `notes` | Text | NULLABLE | Free-text notes |
| `rejectionReason` | Text | NULLABLE | Reason if returned from approval |
| `createdById` | UUID (FK → users.id) | NOT NULL | User who created the document |
| `approvedById` | UUID (FK → users.id) | NULLABLE | User who approved the document |
| `approvedAt` | Timestamp | NULLABLE | When the document was approved |
| `createdAt` | Timestamp | NOT NULL, default now() | Creation timestamp |
| `updatedAt` | Timestamp | Auto-updated | Last modification timestamp |
| `deletedAt` | Timestamp | NULLABLE | Soft delete timestamp |

**Unique Constraints**: `(tenantId, documentNumber)`

**Indexes**: `(tenantId, status)`, `(tenantId, documentType)`, `(tenantId, createdAt)`, `(tenantId, originalDocumentId)`

## Entity: Document Line

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | Auto-generated | Line identifier |
| `documentId` | UUID (FK → documents.id) | NOT NULL, indexed, ON DELETE CASCADE | Parent document |
| `lineNumber` | Integer | NOT NULL | Line order within document |
| `description` | String | NOT NULL | Item description |
| `quantity` | Decimal(15,4) | NOT NULL, > 0 | Quantity |
| `unitPrice` | Decimal(15,4) | NOT NULL, >= 0 | Unit price |
| `taxRate` | Decimal(5,2) | NOT NULL, default 0 | Tax percentage |
| `taxAmount` | Decimal(15,2) | NOT NULL, >= 0 | Calculated tax amount |
| `discountRate` | Decimal(5,2) | NULLABLE, default 0 | Discount percentage |
| `discountAmount` | Decimal(15,2) | NOT NULL, >= 0 | Calculated discount amount |
| `lineTotal` | Decimal(15,2) | NOT NULL, >= 0 | (quantity * unitPrice) - discount + tax |
| `productId` | UUID | NULLABLE | Reference to product/catalog (future module) |
| `createdAt` | Timestamp | NOT NULL, default now() | Creation timestamp |

**Indexes**: `(documentId, lineNumber)`

## Entity: Document Event

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID (PK) | Auto-generated | Event identifier |
| `tenantId` | UUID (FK → tenants.id) | NOT NULL | Tenant scope |
| `documentId` | UUID (FK → documents.id) | NOT NULL | Document that triggered the event |
| `eventType` | String | NOT NULL | `document.created`, `document.submitted`, `document.approved`, `document.delivered`, `document.paid`, `document.cancelled`, `document.counter-created`, `document.status-changed` |
| `previousStatus` | Enum | NULLABLE | Status before transition |
| `newStatus` | Enum | NULLABLE | Status after transition |
| `payload` | JSONB | NULLABLE | Additional event data |
| `createdById` | UUID (FK → users.id) | NOT NULL | User who triggered the event |
| `createdAt` | Timestamp | NOT NULL, default now() | Event timestamp |

**Indexes**: `(documentId, createdAt)`, `(tenantId, eventType, createdAt)`, `(tenantId, createdAt)`

## State Machine: Valid Transitions

```
draft → pending_approval   (submit)
pending_approval → draft   (reject/return)
pending_approval → approved (approve)
approved → delivered       (mark delivered)
approved → paid            (mark paid)
approved → cancelled       (cancel)
delivered → paid           (mark paid)
paid → cancelled           (cancel after payment)
any → cancelled            (cancellation override, requires special permission)
```

## Validation Rules

- **DocumentType**: Must be one of the supported types; extensible via configuration
- **Status**: Must follow valid state transitions per state machine
- **Lines**: At least one line required for `sales_invoice`, `purchase_order`, `credit_note`, `debit_note`
- **GrandTotal**: Must equal `subtotal + taxTotal - discountTotal` (cross-field validation)
- **Immutability**: Once `approved`, no UPDATE allowed on any field except `deletedAt`
- **Counter-document**: `originalDocumentId` must reference an existing approved document
- **Exchange Rate**: Required if `currency != tenant.baseCurrency` at moment of approval
- **Document Number**: Auto-generated with format `{TYPE_PREFIX}-{YYYYMMDD}-{SEQUENTIAL}` (e.g., INV-20260619-000001)
