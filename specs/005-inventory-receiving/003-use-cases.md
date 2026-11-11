# Use Cases — Inventory Receiving

> Casos de uso del Slice 1. Cada caso de uso es una transacción atómica.

---

## UC-01: Crear Purchase Order

**Descripción**: Crea una orden de compra en estado DRAFT.

**Actor**: Purchasing Agent

**Precondiciones**:
- Proveedor existe en Business Partners
- Productos existen en Inventory
- No hay restricciones de tenant

**Flujo principal**:
1. Sistema recibe supplierId, líneas (productId, quantity, unitCost, taxRate, discountRate), notes
2. Sistema valida supplierId contra Business Partners (read-only)
3. Sistema valida productId contra Inventory (read-only)
4. Sistema construye SupplierSnapshot desde datos vivos
5. Sistema construye ProductSnapshot por cada línea
6. Sistema crea PurchaseOrder con status DRAFT
7. Sistema calcula totalCost por línea
8. Sistema emite evento `purchasing.order.created`

**Postcondiciones**:
- PurchaseOrder existe con status DRAFT
- Snapshots congelados
- Líneas calculadas con totalCost

---

## UC-02: Aprobar Purchase Order

**Descripción**: Aprueba una orden de compra para comenzar el proceso de recepción.

**Actor**: Purchasing Manager

**Precondiciones**:
- PurchaseOrder existe con status DRAFT

**Flujo principal**:
1. Sistema recibe purchaseOrderId
2. Sistema cambia status a APPROVED
3. Sistema emite evento `purchasing.order.approved`

**Postcondiciones**:
- PurchaseOrder.status = APPROVED
- No se puede modificar la orden (congelada)

---

## UC-03: Iniciar Recepción

**Descripción**: Marca la orden como lista para recibir y crea un GoodsReceipt en PENDING.

**Actor**: Warehouse Operator

**Precondiciones**:
- PurchaseOrder existe con status APPROVED
- No existe un GoodsReceipt activo para esta orden (Slice 1 invariant)

**Flujo principal**:
1. Sistema recibe purchaseOrderId, receivedAt
2. Sistema cambia PurchaseOrder.status a RECEIVING
3. Sistema crea GoodsReceipt con status PENDING
4. Sistema copia líneas de PurchaseOrder a GoodsReceiptLines (receivedQuantity = 0, damagedQuantity = 0)
5. Sistema emite evento `purchasing.receiving.started`

**Postcondiciones**:
- PurchaseOrder.status = RECEIVING
- GoodsReceipt existe con status PENDING
- GoodsReceiptLines creadas con cantidades en cero

---

## UC-04: Recibir Mercancía

**Descripción**: Registra la entrada física de mercancía y completa la recepción.

**Actor**: Warehouse Operator

**Precondiciones**:
- GoodsReceipt existe con status PENDING
- PurchaseOrder.status = RECEIVING

**Flujo principal**:
1. Sistema recibe goodsReceiptId, líneas (purchaseOrderLineId, receivedQuantity, damagedQuantity)
2. Sistema valida que cada receivedQuantity <= orderedQuantity de la línea original
3. Sistema actualiza GoodsReceiptLines con cantidades recibidas
4. Sistema cambia GoodsReceipt.status a RECEIVED
5. Sistema actualiza PurchaseOrder.lines.receivedQuantity (suma acumulada)
6. Sistema cambia PurchaseOrder.status a COMPLETED
7. Sistema establece PurchaseOrder.completedAt
8. Sistema emite evento `purchasing.receiving.completed` con detalle de líneas recibidas

**Postcondiciones**:
- GoodsReceipt.status = RECEIVED
- PurchaseOrder.status = COMPLETED
- PurchaseOrder.completedAt establecido
- Evento `purchasing.receiving.completed` publicado
- Inventory reacciona al evento y crea StockMovement(IN)

---

## UC-05: Consultar Purchase Order

**Descripción**: Obtiene una orden de compra con su estado y líneas.

**Actor**: Purchasing Agent, Warehouse Operator, Auditor

**Precondiciones**: PurchaseOrder existe

**Flujo principal**:
1. Sistema recibe purchaseOrderId
2. Sistema recupera PurchaseOrder + líneas + GoodsReceipt asociado
3. Sistema devuelve aggregate completo

**Postcondiciones**: ninguna
