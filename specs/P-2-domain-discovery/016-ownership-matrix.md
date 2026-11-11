# Ownership Matrix

> Define quién es dueño de cada entidad del dominio (escribe/modifica) y quiénes solo leen. Una entidad pertenece a exactamente un contexto. Cualquier modificación debe pasar por el contexto dueño.

---

## Visión general

| Entidad | Dueño (escribe) | Solo lectura |
|---------|----------------|--------------|
| `Product` | Catalog | Sales, Inventory, Purchasing, Localization |
| `Variant` | Catalog | Sales, Inventory |
| `Category` | Catalog | Sales, Inventory |
| `PriceList` | Catalog | Sales, Purchasing |
| `TaxRule` | Localization | Sales, Purchasing, Financials |
| `Customer` | Customer Management | Sales |
| `Supplier` | Customer Management | Purchasing |
| `Contact` | Customer Management | Sales, Purchasing |
| `Address` | Customer Management | Sales, Purchasing |
| `Segment` | Customer Management | Sales |
| `Warehouse` | Inventory | Sales, Purchasing |
| `StockItem` | Inventory | Sales, Purchasing |
| `StockMovement` | Inventory | Financials, Reporting |
| `Lot` | Inventory | Sales |
| `SerialNumber` | Inventory | Sales |
| `SaleOrder` | Sales | Reporting, Financials |
| `Invoice` | Sales | Cash Management, Financials, Reporting |
| `CreditNote` | Sales | Financials |
| `Quotation` | Sales | Customer Management |
| `CashRegister` | Cash Management | — |
| `CashTransaction` | Cash Management | Financials, Reporting |
| `PurchaseOrder` | Purchasing | Inventory, Financials |
| `GoodsReceipt` | Purchasing | Inventory |
| `Account` | Financials | Reporting |
| `JournalEntry` | Financials | Reporting, Audit |
| `AccountingPeriod` | Financials | Todos (solo lectura después de cerrado) |
| `Employee` | HR | Payroll |
| `Department` | HR | Payroll, Reporting |
| `Position` | HR | Payroll |
| `Contract` | HR | Payroll |
| `PayrollConcept` | Payroll | — |
| `PayrollRun` | Payroll | Financials |
| `PayReceipt` | Payroll | Employee (self-service), Financials |
| `PayrollPeriod` | Payroll | — |
| `CountryConfig` | Localization | Todos |
| `WithholdingRule` | Localization | Sales, Purchasing, Payroll |
| `FiscalDocumentTemplate` | Localization | Sales, Purchasing |
| `TenantConfig` | Configuration | Todos |
| `Module` | Configuration | Todos |
| `CustomFieldDefinition` | Configuration | Todos |
| `Role` | Configuration | Todos |
| `Permission` | Configuration | Todos |
| `User` | Configuration (Auth) | Todos |
| `UserAccess` | Configuration (Auth) | Todos |
| `AuditLog` | Configuration (Audit) | Configuration |

---

## Reglas de ownership

1. **Un dueño por entidad.** Ninguna entidad puede ser modificada por dos contextos diferentes. Si dos contextos necesitan modificar la misma entidad, el diseño tiene un problema de delimitación de contexto.

2. **Lectura por ID o consulta.** Los contextos que solo leen pueden hacerlo por ID (referencia) o mediante consultas específicas expuestas por el contexto dueño. Nunca mediante acceso directo a la base de datos del dueño.

3. **Actualización mediante API del dueño.** Si un contexto necesita que una entidad cambie (ej: Sales necesita desactivar un cliente moroso), debe solicitarlo al contexto dueño (Customer Management) mediante su API o un comando.

4. **Cambio de dueño requiere ADR.** Si en el futuro se determina que una entidad debería pertenecer a otro contexto, se requiere un ADR que documente la justificación y el plan de migración.

---

## Ejemplos de cumplimiento

### ✔ Correcto
```
Sales necesita el precio de un producto:
  → Consulta a Catalog via interfaz IProductPriceQuery
  
Sales necesita crear un cliente:
  → Llama a Customer Management API: CreateCustomer()
```

### ❌ Incorrecto
```
Sales modifica directamente el producto:
  → SaleRepository.updateProduct()  // PROHIBIDO
  
Sales escribe en la tabla de customers:
  → INSERT INTO customers WHERE...  // PROHIBIDO
```
