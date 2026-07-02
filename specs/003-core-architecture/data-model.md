# Data Model: Core Architecture & Domain Modules

**Status**: Draft | **Date**: 2026-06-20 | **Applies to**: `apps/api/prisma/schema.prisma`

---

## Entities

### 1. Tenant (modificado)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `name` | String | |
| `slug` | String | Único |
| `baseCurrency` | String | Default "USD" |
| `enabledModules` | String[] | `["sales","inventory","cash-payments","purchasing","hr"]` |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Relaciones**:
- `Tenant 1──N User`
- `Tenant 1──N Product`
- `Tenant 1──N Client`
- `Tenant 1──N Vendor`
- `Tenant 1──N Warehouse`
- `Tenant 1──N Document`

---

### 2. ProductCategory

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `name` | String | Único por tenant |
| `parentId` | UUID FK → ProductCategory (nullable) | Árbol jerárquico |
| `createdAt` | DateTime | |

---

### 3. Product

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `sku` | String | Único global |
| `name` | String | |
| `description` | String? | |
| `categoryId` | UUID FK → ProductCategory? | |
| `unitPrice` | Decimal(14,2) | Precio de venta |
| `costPrice` | Decimal(14,2) | Precio de costo |
| `taxId` | UUID FK → LocalizationTax? | Impuesto por defecto |
| `isService` | Boolean | Si es servicio, no maneja inventario |
| `isActive` | Boolean | Soft-delete |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Validaciones**:
- `sku` único global (no solo por tenant)
- `unitPrice >= 0`, `costPrice >= 0`
- Si `isService`, no se crea registro en `stock`

---

### 4. Warehouse

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `name` | String | |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |

---

### 5. Stock

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `productId` | UUID FK → Product | |
| `warehouseId` | UUID FK → Warehouse | |
| `quantity` | Decimal(14,4) | Snapshot del saldo actual |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Unique**: `(productId, warehouseId)`

---

### 6. StockMovement

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `productId` | UUID FK → Product | |
| `warehouseId` | UUID FK → Warehouse | |
| `type` | String | `"in"`, `"out"`, `"transfer"` |
| `quantity` | Decimal(14,4) | Siempre positiva (type define signo) |
| `referenceId` | String? | Document ID que originó el movimiento |
| `referenceType` | String? | `"document"`, `"adjustment"` |
| `createdAt` | DateTime | |
| `userId` | UUID FK → User | |

---

### 7. Client

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `documentId` | String | RIF, CI, J-, etc. |
| `legalName` | String | |
| `email` | String? | |
| `phone` | String? | |
| `isActive` | Boolean | Soft-delete |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Validaciones**: `(tenantId, documentId)` único

---

### 8. Vendor

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `documentId` | String | RIF, CI, J- |
| `legalName` | String | |
| `email` | String? | |
| `phone` | String? | |
| `isActive` | Boolean | Soft-delete |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

**Validaciones**: `(tenantId, documentId)` único

---

### 9. LocalizationTax

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `name` | String | "IVA 16%", "IVA 8%" |
| `rate` | Decimal(5,3) | 16.000, 8.000 |
| `type` | String | `"iva"`, `"igtf"`, `"retention_islr"` |
| `country` | String | ISO 3166-1 alpha-2, default "VE" |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |

---

### 10. CurrencyRate

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `from` | String | "USD" |
| `to` | String | "VES" |
| `rate` | Decimal(14,6) | |
| `date` | DateTime | Fecha fija de la tasa |
| `createdAt` | DateTime | |

**Unique**: `(tenantId, from, to, date)`

---

### 11. CashRegister

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `name` | String | |
| `currency` | String | "USD" |
| `balance` | Decimal(14,2) | |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### 12. PaymentMethod

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant | |
| `name` | String | "Efectivo", "Transferencia" |
| `type` | String | `"cash"`, `"bank"`, `"mobile"`, `"crypto"` |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |

**Unique**: `(tenantId, name)`

---

### 13. CashMovement

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `registerId` | UUID FK → CashRegister | |
| `type` | String | `"in"`, `"out"` |
| `amount` | Decimal(14,2) | |
| `referenceType` | String? | `"document"`, `"expense"` |
| `referenceId` | String? | Document ID |
| `description` | String? | |
| `createdAt` | DateTime | |
| `userId` | UUID | |

---

### 14. SalesOrder

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `documentId` | UUID FK → Document | 1:1 con Document |
| `type` | String | `"quote"`, `"order"` |
| `deliveredWarehouseId` | UUID FK → Warehouse? | |
| `createdAt` | DateTime | |

---

### 15. SalesInvoice

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `documentId` | UUID FK → Document | 1:1 con Document |
| `salesOrderId` | UUID FK → SalesOrder? | |
| `paidAt` | DateTime? | |
| `paymentMethodId` | UUID FK → PaymentMethod? | |
| `createdAt` | DateTime | |

---

### 16. PurchaseOrder

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `documentId` | UUID FK → Document | 1:1 con Document |
| `vendorId` | UUID FK → Vendor | |
| `expectedDate` | DateTime? | |
| `receivedAt` | DateTime? | |
| `createdAt` | DateTime | |

---

### 17. Document (modificado — añadir campo)

| Campo | Tipo | Notas |
|-------|------|-------|
| `exchangeRate` | Decimal(14,6) | Tasa al momento de aprobación |

Campo ya existente en el modelo actual.

---

### 18. AuditLog

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenantId` | UUID FK → Tenant? | |
| `userId` | UUID FK → User? | |
| `action` | String | `"document.approve"`, `"product.create"` |
| `entityType` | String? | `"product"`, `"client"` |
| `entityId` | String? | |
| `before` | JSON? | Estado previo |
| `after` | JSON? | Estado posterior |
| `createdAt` | DateTime | |

**Index**: `(tenantId, action, createdAt)`

---

## Entity Relationship Diagram (textual)

```
Tenant 1──N Product ──N Stock ──N Warehouse
        1──N ProductCategory (autorreferencia parentId)
        1──N Client
        1──N Vendor
        1──N Warehouse
        1──N LocalizationTax
        1──N CurrencyRate
        1──N CashRegister ──N CashMovement
        1──N PaymentMethod
        1──N Document ──1 SalesOrder
                    └──1 SalesInvoice
                    └──1 PurchaseOrder ──N Vendor
```

## State Transitions

| Entidad | Transiciones |
|---------|-------------|
| Document | Via Document Engine (002). Nuevos tipos: `"quote"`, `"order"`, `"sales_invoice"`, `"purchase_order"`, `"credit_note"`, `"debit_note"` |
| StockMovement | Inmutable — una vez creado no se modifica |
