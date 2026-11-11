# Bounded Contexts

> **NOTA:** Estos bounded contexts están definidos desde la perspectiva del negocio (Domain-Driven Design), no como módulos técnicos ni tablas de base de datos. Cada contexto representa una capacidad del negocio con su propio lenguaje ubicuo, sus propias reglas y sus propios límites. La implementación técnica (monolito modular) los mantendrá separados por capas de dominio, no por procesos.

---

## BC-01: Catalog

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar los productos y servicios que comercializa la empresa, sus precios, impuestos y clasificaciones. |
| **Lenguaje ubicuo** | Producto, Servicio, Variante, Categoría, Unidad de Medida, Precio, Lista de Precios, Impuesto, Alícuota |
| **Entidades principales** | Product, Variant, Category, PriceList, TaxRule, UnitOfMeasure |
| **Aggregate Roots** | `Product` (contiene Variants como entities), `Category`, `PriceList` (contiene PriceListEntries), `TaxRule` |
| **Eventos que emite** | `ProductCreated`, `ProductUpdated`, `PriceChanged`, `CategoryChanged` |
| **Eventos que consume** | — (es fuente de verdad para productos) |
| **Comunicación** | Solo emite eventos asíncronos. Otros contextos leen el catálogo mediante consultas síncronas vía dominio, nunca modifican. |
| **Dependencias permitidas** | Configuration (para campos personalizados) |
| **Dependencias prohibidas** | Inventory, Sales, Purchasing — ellos consumen del catálogo, no al revés |
| **Notas** | El catálogo no sabe ni debe saber cuánto stock hay, ni a qué precio se vendió algo. Solo define "qué existe" y "cuánto vale en lista". |

---

## BC-02: Customer Management (CRM Lite)

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar la información de clientes, proveedores, prospectos y contactos, junto con el historial de interacciones comerciales. |
| **Lenguaje ubicuo** | Cliente, Proveedor, Contacto, Prospecto, Dirección, Segmento, Interacción |
| **Entidades principales** | Customer, Supplier, Contact, Address, Segment |
| **Aggregate Roots** | `Customer` (contiene Contacts, Addresses como entities), `Supplier`, `Segment` |
| **Eventos que emite** | `CustomerCreated`, `CustomerUpdated`, `SupplierCreated` |
| **Eventos que consume** | `InvoiceIssued` (para actualizar historial del cliente) |
| **Comunicación** | Emisión asíncrona de eventos. Sales y Purchasing leen datos de clientes/proveedores mediante consultas síncronas vía interfaces de dominio. |
| **Dependencias permitidas** | Configuration |
| **Dependencias prohibidas** | Inventory, Sales, Purchasing |
| **Notas** | Este contexto NO es un CRM completo. No tiene automatización de marketing, campañas ni embudos complejos. Es la libreta de direcciones inteligente del ERP, con historial de transacciones. Un CRM completo de ODALX podría consumir estos mismos datos via API. |

---

## BC-03: Inventory

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Controlar las existencias físicas en todos los almacenes, registrar movimientos de stock, ajustes y transferencias. |
| **Lenguaje ubicuo** | Almacén, Existencias, Movimiento, Ajuste, Transferencia, Lote, Serie, Stock Mínimo, Stock Máximo |
| **Entidades principales** | Warehouse, Stock, StockMovement, InventoryAdjustment, Lot, SerialNumber |
| **Aggregate Roots** | `Warehouse`, `StockItem` (product+warehouse, contiene lotes y series), `StockMovement` |
| **Eventos que emite** | `StockChanged`, `LowStockAlert`, `TransferCompleted`, `StockReserved`, `StockReleased` |
| **Eventos que consume** | `ProductCreated` (para inicializar tracking del producto), `GoodsReceived` (de Purchasing), `SaleConfirmed` (de Sales) |
| **Comunicación** | **Consulta síncrona**: expone disponibilidad de stock via interfaz de dominio (necesario para POS en tiempo real). **Eventos asíncronos**: `StockChanged`, `LowStockAlert` para consumidores no críticos en tiempo real. |
| **Dependencias permitidas** | Catalog (solo lectura de productos por ID), Configuration |
| **Dependencias prohibidas** | Sales, Purchasing (el inventario no debe conocer transacciones comerciales; solo responde "cuánto tengo") |
| **Notas** | Inventory es el contexto que dice "cuánto hay". No decide "cuánto comprar" ni "a quién venderle". Es puramente logístico. La consulta síncrona de disponibilidad es la excepción a la comunicación por eventos, justificada por la naturaleza transaccional del POS. |

---

## BC-04: Sales

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar el ciclo de vida de una venta: cotización, pedido, facturación, notas de crédito/débito. |
| **Lenguaje ubicuo** | Cotización, Pedido, Factura, Nota de Crédito, Nota de Débito, Línea, Despacho, Condición de Pago |
| **Entidades principales** | Quotation, Order, Invoice, CreditNote, DebitNote, OrderLine |
| **Aggregate Roots** | `SaleOrder` (contiene OrderLines como entities), `Invoice` (contiene InvoiceLines), `CreditNote`, `Quotation` |
| **Eventos que emite** | `QuotationCreated`, `SaleConfirmed`, `InvoiceIssued`, `CreditNoteIssued`, `SaleCancelled` |
| **Eventos que consume** | `ProductCreated`, `PriceChanged` (para sincronizar catálogo de venta), `CustomerCreated` (para validar clientes), `StockReserved` (confirmación de inventario) |
| **Comunicación** | **Consulta síncrona**: valida disponibilidad de stock con Inventory via interfaz de dominio (necesario para POS). **Emisión asíncrona**: `SaleConfirmed` → Inventory descuenta stock; `InvoiceIssued` → Cash registra cobro esperado; `InvoiceIssued` → Financials genera asiento. |
| **Dependencias permitidas** | Catalog (lectura de productos), Customer Management (lectura de clientes), Inventory (consulta de disponibilidad via interfaz), Localization (cálculo de impuestos), Configuration |
| **Dependencias prohibidas** | Purchasing (Sales no compra), Cash Management (Sales no maneja efectivo), Financials (Sales no contabiliza) |
| **Notas** | Sales es el orquestador del proceso de venta. No sabe de almacenes, ni de efectivo, ni de contabilidad. Sus eventos disparan acciones en otros contextos. La consulta síncrona de stock es la única excepción al principio de comunicación por hechos, justificada por la naturaleza transaccional del POS. |

---

## BC-05: Purchasing

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar el ciclo de vida de una compra: orden de compra, recepción, cuentas por pagar. |
| **Lenguaje ubicuo** | Orden de Compra, Recepción, Proveedor, Condición de Pago, Línea de Compra |
| **Entidades principales** | PurchaseOrder, Receipt, PurchaseOrderLine |
| **Aggregate Roots** | `PurchaseOrder` (contiene POLines como entities), `GoodsReceipt` |
| **Eventos que emite** | `PurchaseOrderPlaced`, `GoodsReceived` |
| **Eventos que consume** | `ProductCreated`, `SupplierCreated` |
| **Comunicación** | **Emisión asíncrona**: `PurchaseOrderPlaced` → Cash registra pago esperado; `GoodsReceived` → Inventory actualiza stock. |
| **Dependencias permitidas** | Catalog (lectura de productos), Customer Management (lectura de proveedores), Configuration |
| **Dependencias prohibidas** | Sales, Inventory |
| **Notas** | Comprar y vender son procesos distintos aunque usen productos del mismo catálogo. Mezclarlos es la fuente #1 de acoplamiento en ERPs. |

---

## BC-06: Cash Management

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Controlar los movimientos de efectivo y equivalentes: apertura/cierre de caja, cobros, pagos, arqueo. |
| **Lenguaje ubicuo** | Caja, Apertura, Cierre, Movimiento, Arqueo, Medio de Pago, Déficit, Superávit |
| **Entidades principales** | CashRegister, CashMovement, Reconciliation, PaymentMethod |
| **Aggregate Roots** | `CashRegister` (contiene movimientos como entities), `CashTransaction` |
| **Eventos que emite** | `CashTransactionRecorded`, `RegisterClosed` |
| **Eventos que consume** | `InvoiceIssued` (para registrar cobro esperado), `PurchaseOrderPlaced` (para registrar pago esperado) |
| **Comunicación** | **Emisión asíncrona**: `CashTransactionRecorded` → Financials genera asiento contable. **Recepción asíncrona**: escucha `InvoiceIssued` y `PurchaseOrderPlaced`. |
| **Dependencias permitidas** | Configuration |
| **Dependencias prohibidas** | Catalog, Inventory, Sales |
| **Notas** | Cash Management no sabe qué productos se vendieron. Solo sabe que entró o salió dinero. La conciliación entre lo que dice Sales ("factura pagada") y lo que dice Cash ("dinero recibido") ocurre en Financials. |

---

## BC-07: Financials

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar la contabilidad: plan de cuentas, asientos contables, libro diario, libro mayor, balances, cuentas por cobrar y por pagar. |
| **Lenguaje ubicuo** | Cuenta Contable, Asiento, Debe, Haber, Libro Diario, Libro Mayor, Balance, Centro de Costo, Año Fiscal |
| **Entidades principales** | Account, JournalEntry, AccountingPeriod, CostCenter, TrialBalance |
| **Aggregate Roots** | `Account` (plan de cuentas), `JournalEntry` (contiene EntryLines como entities, inmutables después de posted), `AccountingPeriod` |
| **Eventos que emite** | `JournalEntryPosted` (Integration Event para BI/auditoría externa) |
| **Eventos que consume** | `InvoiceIssued` (Sales), `CreditNoteIssued` (Sales), `CashTransactionRecorded` (Cash), `PayrollProcessed` (Payroll) |
| **Comunicación** | **Solo recibe eventos asíncronos**. Nunca emite comandos a otros contextos. Es puramente downstream. |
| **Dependencias permitidas** | Configuration, Localization (reglas contables por país: plan de cuentas local, tratamiento contable de impuestos) |
| **Dependencias prohibidas** | Catalog, Inventory, Sales, Purchasing, HR |
| **Notas** | Financials es el contexto más downstream. Consume eventos de casi todos los demás contextos para generar automáticamente los asientos contables. No debe conocer los detalles de una venta o una compra, solo los montos y cuentas afectadas. Un asiento contable contabilizado es inmutable — solo se revierte con un asiento de reversión. |

---

## BC-08: Human Resources

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar la información de los empleados, la estructura organizacional (departamentos, áreas, cargos), los contratos y el historial laboral. |
| **Lenguaje ubicuo** | Empleado, Departamento, Área, Cargo, Contrato, Tipo de Contrato, Historial Laboral |
| **Entidades principales** | Employee, Department, Position, Contract, EmploymentHistory |
| **Aggregate Roots** | `Employee` (contiene Contracts como entities de historial), `Department`, `Position` |
| **Eventos que emite** | `EmployeeHired`, `ContractUpdated`, `EmployeeTerminated` |
| **Eventos que consume** | — (es fuente de verdad para datos de personas en la organización) |
| **Comunicación** | **Emisión asíncrona**: `EmployeeHired`, `ContractUpdated` → Payroll consume para actualizar datos de nómina. |
| **Dependencias permitidas** | Configuration |
| **Dependencias prohibidas** | Payroll (RRHH no calcula nómina), Sales, Purchasing, Inventory |
| **Notas** | RRHH no sabe cuánto gana un empleado en nómina. Solo sabe que existe, dónde trabaja y qué contrato tiene. El salario y los conceptos pertenecen a Payroll. Esta separación es fundamental para la seguridad y la auditabilidad. |

---

## BC-09: Payroll

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Calcular y procesar la nómina periódica: conceptos de ingreso/deducción, períodos, liquidaciones, recibos, provisiones. |
| **Lenguaje ubicuo** | Concepto de Nómina, Período, Liquidación, Recibo, Ingreso, Deducción, Provisión, Incidencia |
| **Entidades principales** | PayrollConcept, PayrollPeriod, PayrollRun, PayReceipt, PayrollProvision |
| **Aggregate Roots** | `PayrollRun` (contiene PayReceipts como entities), `PayrollConcept`, `PayrollPeriod` |
| **Eventos que emite** | `PayrollProcessed`, `PayReceiptIssued` |
| **Eventos que consume** | `EmployeeHired`, `ContractUpdated`, `EmployeeTerminated` (de RRHH) |
| **Comunicación** | **Recepción asíncrona**: recibe eventos de RRHH para mantener sincronizados los empleados activos. **Emisión asíncrona**: `PayrollProcessed` → Financials genera asientos contables de nómina. |
| **Dependencias permitidas** | Human Resources (lectura de empleados activos y contratos), Localization (reglas de nómina por país), Configuration |
| **Dependencias prohibidas** | Catalog, Sales, Purchasing, Inventory, Cash Management |
| **Notas** | Payroll depende de RRHH (empleados y contratos) y de Localization (cálculos legales). No depende de ningún contexto operativo. Esta independencia permite que un tenant use RRHH sin activar Payroll, y viceversa. |

---

## BC-10: Localization

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Aplicar reglas fiscales, laborales y contables específicas de cada país sobre las operaciones del ERP. Es el corazón de la estrategia multi-país. |
| **Lenguaje ubicuo** | País, Régimen Fiscal, Impuesto, Retención, Tasa, Regla, Documento Fiscal, Timbre, Plazo |
| **Entidades principales** | CountryConfig, TaxRule, WithholdingRule, FiscalDocumentTemplate, LocalizedField |
| **Aggregate Roots** | `CountryConfig` (contiene reglas de país), `TaxRule`, `FiscalDocumentTemplate` |
| **Eventos que emite** | `TaxRuleChanged`, `LocalizationUpdated` |
| **Eventos que consume** | — (no consume eventos; expresa reglas que otros contextos consultan) |
| **Comunicación** | No emite ni consume eventos transaccionales. Los demás contextos consultan las reglas de Localization mediante consultas síncronas vía interfaces de dominio al procesar transacciones (ej: Sales pide cálculo de IVA, Payroll pide reglas de prestaciones). |
| **Dependencias permitidas** | Configuration |
| **Dependencias prohibidas** | Catalog, Sales, Inventory, Purchasing, HR, Payroll, Financials |
| **Notas** | Localization no debe contener datos transaccionales. Es puramente normativo: define reglas que otros contextos aplican. Un cambio en una regla fiscal (ej: nueva tasa de IVA) no debería requerir modificar código en Sales ni en Financials. Cuando un país actualiza sus reglas, se despliega una nueva versión de Localization sin tocar el core. |

---

## BC-11: Configuration

| Atributo | Descripción |
|----------|-------------|
| **Propósito** | Gestionar toda la configuración del tenant: módulos activos, campos personalizados, preferencias, estados configurables, roles y permisos. |
| **Lenguaje ubicuo** | Configuración, Preferencia, Módulo, Campo Personalizado, Estado, Rol, Permiso |
| **Entidades principales** | TenantConfig, Module, CustomField, WorkflowState, Role, Permission |
| **Aggregate Roots** | `TenantConfig` (contiene todas las configuraciones del tenant como value objects), `CustomFieldDefinition`, `Role` (contiene permisos) |
| **Eventos que emite** | `ConfigurationChanged`, `ModuleActivated`, `ModuleDeactivated` |
| **Eventos que consume** | — (es fuente de verdad para la configuración) |
| **Comunicación** | Emisión asíncrona de eventos de cambio de configuración. Los demás contextos consultan configuración mediante consultas síncronas. |
| **Dependencias permitidas** | — (es el contexto más transversal) |
| **Dependencias prohibidas** | Ninguna — todos los contextos pueden depender de Configuration, pero Configuration no debe depender de ningún otro contexto |
| **Notas** | Configuration es el contexto que hace realidad PR-002 (todo debe poder des/habilitarse) y PR-005 (configuración sobre código). Es el sistema nervioso que define qué módulos están activos, qué campos existen, y cómo se comporta cada tenant. |
