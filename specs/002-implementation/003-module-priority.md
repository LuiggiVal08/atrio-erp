# Module Priority

> Orden de implementación de módulos y capacidades, basado en dependencias técnicas y valor de negocio.

---

## P0 — Fundación (Sprint 0)

| Módulo | Capacidad | Dependencias |
|--------|-----------|-------------|
| Core | Tenant, slug, UserAccess, auth, JWT, guards | — |
| Configuration | Módulos activables por tenant | Core |
| Audit | Log de eventos de dominio | Core, EventBus |
| Shared Kernel | Money, Entity, Value Object, DomainEvent | — |
| Localization (mínimo) | TaxRule básico (IVA, IGTF) | Core |

**Objetivo:** Que la plataforma exista, reciba requests, persista datos y audite operaciones.

---

## P1 — Core Operativo (MVP)

| Módulo | Capacidad | Dependencias |
|--------|-----------|-------------|
| Catalog | Producto, Categoría, Precio, Impuesto | Localization, Configuration |
| Customer Management | Cliente, Contacto | Configuration |
| Sales | Confirmar venta, Facturar | Catalog, Customer Management, Localization, Configuration |
| Cash Management | Apertura/cierre, Cobro en efectivo | Configuration |
| Inventory | 1 almacén, movimiento entrada/salida | Catalog, Configuration |

**Objetivo:** Un cliente puede crear productos, registrar clientes, vender, cobrar y ver stock.

---

## P2 — Expansión operativa

| Módulo | Capacidad | Dependencias |
|--------|-----------|-------------|
| Purchasing | Orden de compra, Recepción | Catalog, Customer Management, Configuration |
| Cash Management V2 | Arqueo, múltiples medios de pago | Configuration |
| Inventory V2 | Transferencias, múltiples almacenes, lotes | Catalog, Configuration |
| Financials | Plan de cuentas, asientos automáticos | Localization, Configuration |
| Reports | Dashboard básico, indicadores | Sales, Cash, Inventory |
| Sales V2 | Notas de crédito/débito, cotizaciones | Sales |

**Objetivo:** Ciclo completo de compra→venta→caja→contabilidad.

---

## P3 — Talento Humano

| Módulo | Capacidad | Dependencias |
|--------|-----------|-------------|
| HR | Empleados, departamentos, cargos, contratos | Configuration |
| Payroll | Conceptos, períodos, liquidación, recibos | HR, Localization |
| Localization V2 | Prestaciones sociales, parafiscales (VE/CO) | Localization |

**Objetivo:** Gestión de personas y nómina.

---

## P4 — Ecosistema

| Módulo | Capacidad | Dependencias |
|--------|-----------|-------------|
| Multi-tenant avanzado | Grupo empresarial, consolidación | Core |
| API pública | Documentación, rate limiting, keys | Core |
| Integraciones | SENIAT, DIAN, Stripe, Binance | Sales, Purchasing |
| Marketplace | Plugins de terceros | Core, Configuration |

**Objetivo:** Atrio como plataforma extensible.

---

## Matriz de dependencias entre módulos

```
P0: Core ← Configuration ← Audit ← Shared Kernel ← Localization (mínimo)
     │
P1:  ├── Catalog ← Customer Management
     ├── Sales (← Catalog, Customer, Localization)
     ├── Cash Management
     └── Inventory (← Catalog)
          │
P2:  ├── Purchasing (← Catalog, Customer)
     ├── Financials (← Sales, Cash, Purchasing, Localization)
     ├── Reports (← Sales, Cash, Inventory)
     └── Sales V2
          │
P3:  ├── HR
     └── Payroll (← HR, Localization)
          │
P4:  ├── API Pública
     ├── Integraciones
     └── Marketplace
```
