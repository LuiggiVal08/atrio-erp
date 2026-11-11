# Context Map

## Relaciones entre bounded contexts

```
                    ┌───────────────┐
                    │ Configuration │
                    └───────┬───────┘
                            │ (todos los contextos consultan configuración)
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   ┌──────────┐      ┌────────────┐      ┌──────────────┐
   │ Catalog  │      │ Customer   │      │ Localization │
   │          │      │ Management │      │              │
   └────┬─────┘      └─────┬──────┘      └──────┬───────┘
        │                  │                     │
        │ (consume)        │ (consume)           │ (consulta)
        ▼                  ▼                     ▼
   ┌─────────────────────────────────────────────────┐
   │                  Sales ◄────────────────────────│
   │                  Purchasing                      │
   │                  Inventory                       │
   │                  Cash Management                 │
   └────────┬────────┬────────┬──────────────────────┘
            │        │        │
            │        │        │ (eventos: facturas, cobros, nómina)
            ▼        ▼        ▼
   ┌─────────────────────────────────────────────────┐
   │                   Financials                     │
   │  (consume eventos de Sales, Cash, Payroll y      │
   │   genera asientos contables automáticamente)     │
   └─────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐
   │ HR           │────►│ Payroll      │
   │ (Personas,   │     │ (Nómina,     │
   │  Org, Contra-│     │  Liquidación)│
   │  tos)        │     └──────┬───────┘
   └──────────────┘            │
                               │ (eventos: nómina procesada)
                               ▼
                        ┌──────────────┐
                        │ Financials   │
                        └──────────────┘
```

## Tipos de relación

| Relación | Contexto A | Contexto B | Tipo | Descripción |
|----------|-----------|-----------|------|-------------|
| R-01 | Catalog | Sales, Purchasing, Inventory | **Upstream/Downstream** | Catalog es fuente de verdad de productos. Sales, Purchasing e Inventory consultan pero no modifican el catálogo. |
| R-02 | Customer Mgmt | Sales, Purchasing | **Upstream/Downstream** | Customer Management es fuente de verdad de clientes y proveedores. Sales y Purchasing los consultan para crear transacciones. |
| R-03 | Sales → Inventory | — | **Evento / Consulta** | Sales emite `OrderFulfilled`. Inventory actualiza stock. Sales consulta disponibilidad via servicio (no acceso directo a datos). |
| R-04 | Purchasing → Inventory | — | **Evento / Consulta** | Purchasing emite `GoodsReceived`. Inventory recibe y actualiza stock. |
| R-05 | Sales → Cash Mgmt | — | **Evento** | Sales emite `InvoiceIssued`. Cash Management registra el cobro esperado. |
| R-06 | Purchasing → Cash Mgmt | — | **Evento** | Purchasing emite `PurchaseOrderPlaced`. Cash Management registra el pago esperado. |
| R-07 | Sales, Cash, Payroll → Financials | — | **Evento** | Estos contextos emiten eventos que Financials consume para generar asientos contables. |
| R-08 | HR → Payroll | **Upstream/Downstream** | HR es fuente de verdad de empleados y contratos. Payroll consume esta información para calcular nómina. |
| R-09 | Localization → Sales, Purchasing, Payroll, Financials | **Upstream** | Localization expresa reglas fiscales y laborales que estos contextos consultan al procesar transacciones. |
| R-10 | Configuration → Todos | **Upstream** | Todos los contextos consultan Configuration para saber qué módulos están activos, qué campos personalizados existen, etc. |

## Reglas de comunicación entre contextos

1. **Un contexto nunca accede directamente a la base de datos de otro contexto.** Toda comunicación es mediante servicios (API interna) o eventos.
2. **Los eventos son inmutables.** Una vez emitidos, no se modifican. Si se necesita corregir, se emite un nuevo evento compensatorio.
3. **Cada contexto es dueño de sus datos.** Ningún contexto puede modificar datos de otro contexto. Si necesita modificar, solicita via API o evento.
4. **Las dependencias son unidireccionales.** Catalog no conoce Sales. Sales conoce Catalog (solo lectura). Si aparece una dependencia circular, el diseño está mal.
5. **La configuración es la excepción.** Todos leen de Configuration, pero Configuration no escribe en ningún otro contexto.

## Glosario de relaciones

| Término | Significado |
|---------|-------------|
| **Upstream/Downstream** | El contexto upstream publica datos que el downstream consume. El downstream depende del upstream, no al revés. |
| **Evento** | El contexto A emite un evento que el contexto B consume de forma asíncrona. A no espera respuesta de B. |
| **Consulta** | El contexto A hace una llamada síncrona al contexto B para obtener información. B responde sin modificar estado. |
| **Socio** | Dos contextos cooperan intercambiando eventos. Ninguno es upstream del otro. |
