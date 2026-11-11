# Domain Model — Inventory Receiving

> Modelo de dominio del bounded context Purchasing.
> Sigue los patrones Atrio: append-only, snapshots, state machine separada.

---

## Aggregate Root: PurchaseOrder

La orden de compra a un proveedor. Aggregate root del bounded context.

```
PurchaseOrder
├── id: PurchaseOrderId
├── tenantId: TenantId
├── status: PurchaseOrderStatus
├── supplierSnapshot: SupplierSnapshot (VO, congelado al crear)
├── lines: PurchaseOrderLine[]
├── notes: string?
├── createdAt: Date
├── updatedAt: Date
├── completedAt: Date?
└── version: number (optimistic concurrency)
```

### PurchaseOrderLine (Entity)

```
PurchaseOrderLine
├── id: PurchaseOrderLineId
├── productSnapshot: ProductSnapshot (VO)
├── orderedQuantity: number (> 0)
├── unitCost: Money
├── taxRate: number (0 - 1)
├── discountRate: number (0 - 1)
├── totalCost: Money (unitCost * orderedQuantity * (1 - discountRate) * (1 + taxRate))
└── receivedQuantity: number (acumulado de GoodsReceiptLines, 0 inicial)
```

### SupplierSnapshot (VO)

```
SupplierSnapshot
├── supplierId: string
├── name: string
├── taxId: string
├── email: string?
└── phone: string?
```

### ProductSnapshot (VO)

```
ProductSnapshot
├── productId: string
├── sku: string
├── name: string
├── unit: string
└── warehouseId: string?
```

---

## Aggregate Root: GoodsReceipt

La recepción física de mercancía. Aggregate separado para soportar
múltiples recepciones contra una misma orden sin romper la máquina de estados.

```
GoodsReceipt
├── id: GoodsReceiptId
├── purchaseOrderId: PurchaseOrderId
├── status: GoodsReceiptStatus
├── receivedAt: Date
├── lines: GoodsReceiptLine[]
├── notes: string?
├── createdAt: Date
└── updatedAt: Date
```

### GoodsReceiptLine (Entity)

```
GoodsReceiptLine
├── id: GoodsReceiptLineId
├── purchaseOrderLineId: PurchaseOrderLineId
├── receivedQuantity: number (> 0)
├── damagedQuantity: number (>= 0, defectos/daños)
└── notes: string?
```

---

## State Machines

### PurchaseOrderStatus

```
DRAFT ──► APPROVED ──► RECEIVING ──► COMPLETED
```

| Desde       | Hacia        |
|-------------|--------------|
| DRAFT       | APPROVED     |
| APPROVED    | RECEIVING    |
| RECEIVING   | COMPLETED    |
| COMPLETED   | —            |

### GoodsReceiptStatus

```
PENDING ──► RECEIVED
```

| Desde    | Hacia     |
|----------|-----------|
| PENDING  | RECEIVED  |
| RECEIVED | —         |

Slice 1: un solo GoodsReceipt por PurchaseOrder, creado al iniciar RECEIVING.
Completado automáticamente al crear el GoodsReceipt (PENDING → RECEIVED).

---

## Invariantes

1. **orderedQuantity > 0** en PurchaseOrderLine
2. **receivedQuantity <= orderedQuantity** en GoodsReceiptLine (no recibir más de lo ordenado)
3. **unitCost > 0** en PurchaseOrderLine
4. **receivedQuantity > 0** en GoodsReceiptLine
5. **damagedQuantity >= 0** en GoodsReceiptLine
6. **sum(receivedQuantity) en GoodsReceiptLines <= orderedQuantity** (invarianza entre recepciones, para V2 con múltiples GR)
7. **GoodsReceipt.purchaseOrderId** debe referenciar una PurchaseOrder existente con status RECEIVING
8. **Un PO tiene un solo GoodsReceipt activo en Slice 1**
9. **totalCost = unitCost * orderedQuantity * (1 - discountRate) * (1 + taxRate)**
