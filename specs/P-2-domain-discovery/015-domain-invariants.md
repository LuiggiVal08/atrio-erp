# Domain Invariants

> Reglas de negocio inmutables que el dominio debe garantizar en todo momento. Cada invariante es una restricción que el código debe hacer cumplir, no una sugerencia ni una validación de UI.

---

## Catalog

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-001 | Un producto no puede tener precio negativo o cero en ninguna lista de precios activa. | Un producto sin precio no puede venderse. Precios negativos no tienen sentido en el dominio. |
| INV-002 | Una categoría no puede ser padre de sí misma. | Evita ciclos infinitos en la jerarquía de categorías. |
| INV-003 | Un producto no puede ser eliminado si existe stock o transacciones asociadas. | Se marca como inactivo/descontinuado, no se elimina. |
| INV-004 | Una lista de precios debe tener una moneda definida. | No existe un precio sin moneda en un contexto multi-moneda. |
| INV-005 | Las variantes de un producto deben tener valores únicos para sus atributos. | No pueden existir dos variantes idénticas (mismo color+talla, por ejemplo). |

---

## Customer Management

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-010 | Un cliente debe tener al menos un medio de contacto (email o teléfono). | No registrar entidades sin forma de contacto. |
| INV-011 | El RIF/NIT/NIF de un cliente debe ser único dentro del mismo tenant. | No pueden existir dos clientes con el mismo documento fiscal. |
| INV-012 | Un cliente dado de baja no puede generar nuevas transacciones. | Solo consulta de historial. Se bloquea la creación de nuevas ventas, cotizaciones o pedidos. |

---

## Inventory

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-020 | El stock disponible nunca puede ser negativo a menos que el producto tenga configuración "permitir stock negativo". | Por defecto, stock negativo no está permitido. Si se configura, se audita cada movimiento que genere negativo. |
| INV-021 | Una transferencia entre almacenes no puede ser al mismo almacén. | Carece de sentido logístico. |
| INV-022 | No se puede reservar más stock del disponible a menos que esté configurado. | `StockReserved` solo se emite si hay suficiente stock. Si no, se emite `InsufficientStock`. |
| INV-023 | Un lote vencido no puede estar disponible para la venta. | Los lotes con fecha de vencimiento pasada se bloquean automáticamente. |
| INV-024 | Todo movimiento de inventario debe tener un tipo y un origen documentado. | No existen movimientos huérfanos. Cada entrada/salida se asocia a una transacción (compra, venta, ajuste, transferencia). |

---

## Sales

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-030 | Una venta confirmada nunca puede volver a estado borrador. | `SaleConfirmed` es irreversible. Si se necesita corregir, se emite `SaleCancelled` y se crea una nueva venta, o se emite `CreditNoteIssued`. |
| INV-031 | Una factura emitida no puede modificarse. Solo anularse con nota de crédito. | Las facturas son inmutables por requisito legal y contable. |
| INV-032 | El total de una factura debe ser igual a la suma de sus líneas más impuestos menos descuentos. | Consistencia aritmética del documento. |
| INV-033 | No se puede emitir una nota de crédito por un monto mayor al de la factura original. | No se puede devolver más de lo que se cobró (a menos que se configure aprobación especial). |
| INV-034 | Una cotización vencida no puede convertirse en pedido. | Las cotizaciones tienen fecha de validez. |
| INV-035 | Una venta no puede tener líneas sin producto o servicio asociado. | Toda línea de venta debe referenciar un item del catálogo. |

---

## Purchasing

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-040 | Una orden de compra no puede recibir más cantidad de la ordenada. | Las recepciones parciales acumuladas no pueden superar la cantidad total ordenada. |
| INV-041 | Una orden de compra no puede modificarse después de recibida parcial o totalmente. | Se cierra a modificaciones; cualquier cambio requiere una nueva orden. |
| INV-042 | No se puede recibir mercancía de una orden cancelada. | Las órdenes canceladas se cierran a recepción. |

---

## Cash Management

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-050 | Una caja cerrada no acepta movimientos. | Para registrar nuevos movimientos, debe abrirse un nuevo turno. |
| INV-051 | El arqueo de caja debe cuadrar dentro de una tolerancia configurable por tenant. | Si la diferencia supera la tolerancia, se requiere aprobación. |
| INV-052 | Un cobro no puede asociarse a una factura ya pagada en su totalidad. | Evita doble cobro. |
| INV-053 | El monto de un cobro no puede exceder el saldo pendiente de la factura. | Cobros parciales están permitidos, pero no pueden superar el total adeudado. |

---

## Financials

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-060 | Un asiento contable debe cuadrar: suma del Debe = suma del Haber. | Principio de partida doble. Un asiento descuadrado no puede contabilizarse. |
| INV-061 | Un asiento contabilizado no puede modificarse ni eliminarse. Solo revertirse con un asiento de reversión. | Inmutabilidad del libro contable por requisito legal. |
| INV-062 | No se pueden contabilizar asientos en un período fiscal cerrado. | Los períodos cerrados son inmutables para mantener la integridad de los balances. |
| INV-063 | Una cuenta contable no puede tener movimientos si no está activa. | Las cuentas dadas de baja no aceptan nuevos asientos. |

---

## Human Resources

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-070 | Un empleado no puede estar asignado a dos cargos activos simultáneamente en el mismo período. | Un empleado tiene un cargo principal. Excepciones (doble cargo) requieren configuración especial. |
| INV-071 | Un empleado retirado no puede generar nuevas novedades ni contratos. | Solo consulta de historial. |
| INV-072 | La fecha de inicio de un contrato no puede ser posterior a la fecha de fin. | Consistencia temporal. |
| INV-073 | No se puede eliminar un empleado con transacciones asociadas (nóminas, histórial). | Se marca como inactivo, no se elimina. |

---

## Payroll

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-080 | Un período de nómina no puede procesarse dos veces. | Evita duplicidad de pagos. Si se necesita corregir, se procesa un período complementario o de ajuste. |
| INV-081 | No se puede generar recibo de nómina para un empleado inactivo o retirado. | Solo empleados activos generan nómina. |
| INV-082 | El neto a pagar no puede ser negativo. | Si las deducciones superan el ingreso, se genera un registro especial (deuda del empleado) no un recibo negativo. |
| INV-083 | Un recibo de nómina emitido no puede modificarse. Solo reversarse con un nuevo período. | Los recibos son documentos legales. |

---

## Localization

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-090 | No pueden existir dos reglas fiscales activas para el mismo impuesto y país en el mismo período. | Una tasa de IVA vigente no puede tener dos valores distintos simultáneamente. |
| INV-091 | Un cambio de regla fiscal debe tener fecha de vigencia. | Las reglas no cambian retroactivamente a menos que la legislación lo exija. |
| INV-092 | No se puede eliminar una regla fiscal si existen transacciones que la referencian. | Se desactiva, no se elimina. |

---

## Configuration

| ID | Invariante | Explicación |
|----|-----------|-------------|
| INV-100 | Un módulo no puede desactivarse si existen transacciones activas que dependen de él. | Ej: no se puede desactivar Inventario si hay ventas en tránsito. |
| INV-101 | Un campo personalizado no puede cambiar su tipo después de creado si existen datos. | El tipo de dato es inmutable una vez que hay valores almacenados. |
| INV-102 | No puede existir un tenant sin un plan asignado. | Todo tenant tiene exactamente un plan que determina sus límites. |

---

## Invariantes cross-context

| ID | Invariante | Contextos involucrados |
|----|-----------|----------------------|
| INV-200 | Una venta no puede confirmarse si el producto no existe en el catálogo. | Sales + Catalog |
| INV-201 | Una venta no puede confirmarse si el stock es insuficiente y no está configurado para permitirlo. | Sales + Inventory |
| INV-202 | Un pago registrado en caja debe referenciar una factura o un concepto válido. | Cash Management + Sales / Purchasing |
| INV-203 | Un asiento contable generado desde una factura no puede crearse si el período contable está cerrado. | Financials + Sales (el evento se rechaza) |
| INV-204 | Un empleado no puede procesarse en nómina si su contrato está vencido. | Payroll + HR |
