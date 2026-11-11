# Module Vision — Inventory Receiving

> Gestión de entrada de mercancía al inventario.
> Completa el circuito económico: proveedor → compra → recepción → stock → venta.

---

## Por qué existe este módulo

Atrio tiene POS (venta), Inventory (stock), Business Partners (proveedores).
Pero falta el origen del stock:

```
Proveedor → PurchaseOrder → GoodsReceipt → StockMovement(IN) → Inventory → POS
```

Sin recepción, no hay forma de que un negocio opere con inventario real.

---

## Alcance

### Incluido (Slice 1)

- **PurchaseOrder**: orden de compra a proveedor
- **PurchaseOrderLine**: línea de producto con cantidad, costo, impuestos
- **GoodsReceipt**: recepción de mercancía (aggregate separado)
- **GoodsReceiptLine**: línea de recepción (cantidad recibida vs ordenada)
- **Draft → Approved → Receiving → Completed**: ciclo de vida de la PO
- **StockMovement(IN)**: se genera al completar la recepción
- **Snapshots**: proveedor, producto, costo, moneda congelados al crear

### Excluido explícitamente (No Slice 1)

- CANCELLED, PARTIALLY_RECEIVED (requieren ADR)
- Recepciones parciales / múltiples (GoodsReceipt soporta 1:N, pero no se expone en Slice 1)
- Devoluciones al proveedor
- Cuentas por pagar / facturación de compra
- Impresión de documentos
- Historial de versiones de PO
- Integración contable

---

## Principios

1. **GoodsReceipt ≠ PurchaseOrder** — la recepción es un aggregate separado; la PO no acumula lógica de entrada de stock
2. **Nunca stock antes de recepción completa** — el inventario solo se actualiza cuando GoodsReceipt está COMPLETED
3. **Snapshots inmutables** — proveedor, producto, costo, moneda se congelan al crear la orden
4. **Eventos, no efectos directos** — StockMovement se origina por evento de dominio, no por llamada directa desde Purchasing

---

## Relación con otros bounded contexts

```text
Business Partners (Supplier)  ────  snapshot ──────┐
                                                    ↓
Inventory (Product)           ────  snapshot ──────►  PurchaseOrder
                                                    │
Document Engine               ────  documents ◄─────┘
                                                    │
                                                    └──► GoodsReceipt ──► StockMovement(IN) ──► Inventory

Purchasing no conoce Inventory directamente.
Purchasing emite eventos; Inventory reacciona.
```
