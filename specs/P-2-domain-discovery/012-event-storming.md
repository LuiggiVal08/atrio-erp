# Event Storming

> Eventos de dominio identificados para los flujos core del ERP. Este documento captura los eventos clave que cruzan bounded contexts, no todos los eventos internos de cada contexto.

---

## Domain Events vs Integration Events

| Tipo | Propósito | Consumidores | Volatilidad |
|------|-----------|-------------|-------------|
| **Domain Event** | Hecho del negocio que cambió el estado del dominio. Los contextos internos reaccionan. | Otros bounded contexts del mismo dominio (Atrio) | Evoluciona con el modelo de dominio |
| **Integration Event** | Traducción de un Domain Event para consumidores externos al dominio. | Productos ODALX, API pública, BI, integraciones externas | Versionado, no rompe contrato |

### Regla

Todo Integration Event es una traducción explícita de un Domain Event. No se emiten Integration Events sin que exista su Domain Event correspondiente. Esto asegura que el dominio nunca dependa de sistemas externos.

```
Domain Event (dentro de Atrio)
       │
       ▼
Integration Event (para ODALX)  →  API pública, BI, CRM, Argos...
```

---

## Comunicación síncrona vs asíncrona entre contextos

| Tipo | Cuándo usarlo | Ejemplo |
|------|--------------|---------|
| **Síncrona** (consulta via interfaz de dominio) | Operaciones que requieren respuesta inmediata para completar una transacción crítica | POS necesita validar stock disponible antes de confirmar la venta. Sales consulta a Inventory via interfaz. |
| **Asíncrona** (evento) | Operaciones que pueden ocurrir después de la transacción principal sin afectar la consistencia del negocio | Sales emite `SaleConfirmed` → Inventory descuenta stock. Sales emite `InvoiceIssued` → Financials genera asiento. |

### Excepciones documentadas al principio de "comunicación por hechos"

| Excepción | Contextos | Justificación |
|-----------|-----------|--------------|
| Consulta de disponibilidad de stock | Sales → Inventory | El POS no puede confirmar una venta sin saber si hay stock. La respuesta debe ser inmediata y transaccional. |
| Consulta de datos de cliente/proveedor | Sales/Purchasing → Customer Management | Necesario para validar datos en tiempo real durante la transacción. |
| Consulta de reglas fiscales | Sales → Localization | El cálculo de impuestos debe ocurrir dentro de la misma transacción de facturación. |

Todas las excepciones se implementan mediante **interfaces de dominio** (ej: `IInventoryAvailability`), nunca mediante acceso directo a datos de otro contexto.

---

## Tabla de eventos: emisor y consumidores

| Domain Event | Emisor (BC) | Consumidores internos | Consumidores externos (Integration Event) |
|-------------|-------------|----------------------|-------------------------------------------|
| `ProductCreated` | Catalog | Sales, Inventory, Purchasing | ODALX BI, API pública |
| `PriceChanged` | Catalog | Sales, Purchasing | ODALX BI |
| `CustomerCreated` | Customer Mgmt | Sales | ODALX CRM, Argos |
| `SupplierCreated` | Customer Mgmt | Purchasing | — |
| `SaleConfirmed` | Sales | Inventory (desc. stock), Cash (registra cobro) | ODALX BI, ODALX CRM |
| `SaleCancelled` | Sales | Inventory (reversa stock), Cash (reversa cobro) | ODALX BI |
| `InvoiceIssued` | Sales | Cash, Financials | API pública (factura electrónica) |
| `CreditNoteIssued` | Sales | Financials | API pública |
| `PurchaseOrderPlaced` | Purchasing | Cash (pago esperado) | — |
| `GoodsReceived` | Purchasing | Inventory (incrementa stock) | — |
| `StockChanged` | Inventory | — (notificación interna) | ODALX BI |
| `LowStockAlert` | Inventory | Configuration (notificación) | — |
| `StockReserved` | Inventory | Sales (confirmación de disponibilidad) | — |
| `StockReleased` | Inventory | Sales (stock liberado por cancelación) | — |
| `CashTransactionRecorded` | Cash Mgmt | Financials | — |
| `RegisterClosed` | Cash Mgmt | — | ODALX BI (reportes) |
| `EmployeeHired` | HR | Payroll | ODALX Argos (candidato contratado) |
| `ContractUpdated` | HR | Payroll | — |
| `EmployeeTerminated` | HR | Payroll | ODALX Argos |
| `PayrollProcessed` | Payroll | Financials | — |
| `PayReceiptIssued` | Payroll | — | API pública (empleado) |
| `JournalEntryPosted` | Financials | — | ODALX BI, auditoría externa |
| `TaxRuleChanged` | Localization | Sales, Purchasing, Payroll, Financials | — |
| `ConfigurationChanged` | Configuration | Todos los contextos | — |

---

## Flujo: Venta al contado (POS)

### Diagrama de eventos

```
[Sales]           [Inventory]       [Cash Mgmt]       [Financials]

                    (consulta stock
                     via interfaz
                     síncrona)
                    ◄──────────────

SaleConfirmed ──────────────────►
                    StockReserved
                                    
                    (descuento
                     de stock)
                    StockChanged

InvoiceIssued ────────────────────────────────────────►  (1)

                                                         JournalEntryPosted

InvoiceIssued ───────────────────►  (2)
                    CashTransactionRecorded ──────────►
                                                         JournalEntryPosted
```

### Secuencia

1. **Sales** valida disponibilidad de stock con **Inventory** mediante consulta síncrona (excepción justificada).
2. **Sales** confirma la venta → emite `SaleConfirmed`.
3. **Inventory** consume `SaleConfirmed` → verifica stock real → descuenta → emite `StockReserved` (si hay stock) o `InsufficientStock` (si no hay, Sales cancela).
   - Si no hay stock: Sales emite `SaleCancelled`, Inventory emite `StockReleased`.
4. **Sales** emite `InvoiceIssued` con impuestos calculados (consulta síncrona a Localization).
5. **Cash Management** consume `InvoiceIssued` y registra el cobro → `CashTransactionRecorded`.
6. **Financials** consume `InvoiceIssued` y `CashTransactionRecorded` → genera asientos contables → `JournalEntryPosted`.

---

## Flujo: Compra y recepción

### Diagrama de eventos

```
[Purchasing]      [Inventory]       [Cash Mgmt]       [Financials]

PurchaseOrderPlaced ───────────────────────────────►  (1)
                    
                    GoodsReceived ─────────────────►
                                          
                    StockChanged
                                                         JournalEntryPosted

                    (pago se registra
                     cuando se realiza)
                    CashTransactionRecorded ────────►
                                                         JournalEntryPosted
```

### Secuencia

1. **Purchasing** emite `PurchaseOrderPlaced`. **Cash Management** lo consume y registra el compromiso de pago.
2. **Purchasing** recibe mercancía → emite `GoodsReceived`.
3. **Inventory** consume `GoodsReceived` → incrementa stock → `StockChanged`.
4. **Financials** consume `GoodsReceived` → genera asiento contable de entrada de inventario.
5. **Cash Management** registra el pago al proveedor → `CashTransactionRecorded`.
6. **Financials** consume `CashTransactionRecorded` → genera asiento de pago.

---

## Flujo: Nómina mensual

### Diagrama de eventos

```
[HR]              [Payroll]         [Localization]    [Financials]

EmployeeHired ───►
ContractUpdated ──►
EmployeeTerminated ►

                    (Payroll consulta
                     reglas de
                     Localization
                     via interfaz)

                    PayrollProcessed ─────────────────►
                                                         JournalEntryPosted

                    PayReceiptIssued                     (asiento de gasto de
                                                          nómina + provisiones
                                                          + retenciones)
```

### Secuencia

1. **HR** emite eventos de empleados y contratos. **Payroll** los consume para mantener su lista de empleados activos.
2. Al procesar un período, **Payroll** consulta reglas de **Localization** (cálculos legales del país).
3. **Payroll** procesa la nómina → emite `PayrollProcessed`.
4. **Financials** consume `PayrollProcessed` → genera asientos contables de:
   - Gasto de nómina (salarios)
   - Provisiones (prestaciones sociales, utilidades)
   - Retenciones (ISLR, parafiscales, seguridad social)
   - Cuentas por pagar (neto a empleados, retenciones a pagar)

---

## Eventos de dominio (catálogo completo)

### Catalog
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `ProductCreated` | Se crea un nuevo producto/servicio | productId, tenantId, categoryId, name, unit |
| `ProductUpdated` | Se modifica un producto existente | productId, campos modificados |
| `PriceChanged` | Cambia un precio en una lista de precios | productId, priceListId, oldPrice, newPrice, currency |
| `CategoryChanged` | Se modifica la estructura de categorías | categoryId, parentId, name |

### Customer Management
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `CustomerCreated` | Se registra un nuevo cliente | customerId, tenantId, name, taxId, segment |
| `CustomerUpdated` | Se modifica un cliente | customerId, campos modificados |
| `SupplierCreated` | Se registra un nuevo proveedor | supplierId, tenantId, name, taxId |
| `SupplierUpdated` | Se modifica un proveedor | supplierId, campos modificados |

### Sales
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `QuotationCreated` | Se crea una cotización | quotationId, customerId, lines[], total, currency, validUntil |
| `SaleConfirmed` | Se confirma un pedido/venta | orderId, customerId, lines[], total, currency, warehouseId |
| `SaleCancelled` | Se cancela una venta confirmada | orderId, reason |
| `InvoiceIssued` | Se emite una factura | invoiceId, orderId, customerId, total, taxes[], currency, dueDate |
| `CreditNoteIssued` | Se emite una nota de crédito | creditNoteId, invoiceId, amount, reason |
| `DebitNoteIssued` | Se emite una nota de débito | debitNoteId, invoiceId, amount, reason |

### Purchasing
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `PurchaseOrderPlaced` | Se crea una orden de compra | poId, supplierId, lines[], total, currency |
| `GoodsReceived` | Se recibe mercancía parcial/total | poId, linesRecibidas[], warehouseId |

### Inventory
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `StockReserved` | Se reserva stock para una venta confirmada | productId, warehouseId, quantityReserved, orderId |
| `StockReleased` | Se libera stock previamente reservado | productId, warehouseId, quantityReleased, orderId |
| `StockChanged` | Cambia el stock disponible de un producto | productId, warehouseId, oldStock, newStock, movementType |
| `LowStockAlert` | El stock cae por debajo del mínimo | productId, warehouseId, currentStock, minStock |
| `TransferCompleted` | Transferencia entre almacenes completada | transferId, fromWarehouse, toWarehouse, productId, quantity |
| `InsufficientStock` | No hay suficiente stock para una venta | productId, warehouseId, requestedQuantity, availableQuantity, orderId |

### Cash Management
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `CashTransactionRecorded` | Se registra un movimiento de caja | transactionId, cashRegisterId, type (in/out), amount, method, referenceId |
| `RegisterClosed` | Se cierra una caja (turno) | registerId, closedAt, declaredAmount, countedAmount, difference |

### Financials
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `JournalEntryPosted` | Se contabiliza un asiento | entryId, periodId, accounts[], totalDebit, totalCredit |

### Human Resources
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `EmployeeHired` | Se contrata un nuevo empleado | employeeId, departmentId, positionId, contractId, hireDate |
| `ContractUpdated` | Se modifica un contrato | contractId, employeeId, oldSalary, newSalary, oldPosition, newPosition, effectiveDate |
| `EmployeeTerminated` | Termina la relación laboral | employeeId, terminationDate, reason, type |

### Payroll
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `PayrollProcessed` | Se procesa un período de nómina | periodId, employeeCount, totalEarnings, totalDeductions, netPayroll |
| `PayReceiptIssued` | Se genera un recibo individual | receiptId, employeeId, periodId, gross, deductions[], net |

### Localization
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `TaxRuleChanged` | Cambia una regla fiscal | country, taxType, oldRate, newRate, effectiveDate |
| `LocalizationUpdated` | Se actualiza la configuración de localización | country, version |

### Configuration
| Evento | Cuándo ocurre | Payload (conceptos) |
|--------|--------------|-------------------|
| `ConfigurationChanged` | Cambia cualquier configuración del tenant | tenantId, module, key, oldValue, newValue |
| `ModuleActivated` | Se activa un módulo | tenantId, moduleName |
| `ModuleDeactivated` | Se desactiva un módulo | tenantId, moduleName |
