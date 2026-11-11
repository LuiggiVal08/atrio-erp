# ADR-0007: Transaction Boundaries y Rol de los Eventos en Flujos Críticos

**Estado:** Aceptado
**Fecha:** 2026-07-07
**Contexto:** H-001 Transaction Hardening, POS Payment

## Contexto

El flujo de pago POS original usaba tres transacciones independientes:

1. `approveDocumentUseCase` → commit → `document.approved` → StockEventHandler descuenta stock
2. `transitionDocumentUseCase` → commit → `document.paid` → CashMovementEventHandler registra
3. `PosSaleService.pay()` → actualiza caja + SalesOrder

Esto generaba estados intermedios inconsistentes:

- Documento APPROVED pero stock no deducido
- Documento PAID pero caja no actualizada
- SalesOrder en PENDING_PAYMENT pero Documento ya PAID

## Decisión

### Consistencia: Una sola transacción

**Para flujos que modifican múltiples aggregates de forma irreversible, todo ocurre en una sola transacción de base de datos.**

El método `pay()` ahora ejecuta en una sola `Prisma.$transaction`:

```
FOR UPDATE (stock)
  ↓
  Validate stock sufficiency
  ↓
  Approve document (PENDING_APPROVAL → APPROVED)
  ↓
  Deduct stock (inline, no event handler)
  ↓
  Pay document (APPROVED → PAID)
  ↓
  Update cash register balance
  ↓
  Create cash movement
  ↓
  Update sales order status (PENDING_PAYMENT → PAID)
  ↓
COMMIT
```

Esto elimina la necesidad de que `document.approved` y `document.paid` ejecuten lógica de negocio (stock deduction, cash movement). Esa lógica ahora es responsabilidad del flujo POS.

### Comunicación: Eventos POST-commit

Los eventos de dominio **siguen existiendo**, pero su propósito cambia:

| Antes | Ahora |
|-------|-------|
| `document.approved` → **ordena** deducir stock | `sale.payment_completed` → **notifica** que ocurrió |
| `document.paid` → **ordena** registrar movimiento | `sale.payment_completed` → **notifica** el hecho consumado |
| El handler **ejecuta** la acción | El handler **reacciona** al hecho (BI, CRM, alertas, analytics) |

Los eventos se emiten **después del commit**, no dentro de la transacción. Esto garantiza:

- Si el evento falla, la transacción ya ocurrió (el sistema está en estado consistente)
- Los consumidores (BI, CRM, Argos) reciben el hecho sin necesidad de modificar el estado del sistema
- La migración futura a Outbox Pattern es trivial (los eventos ya existen, solo cambia el delivery)

### ¿Qué eventos se emiten post-commit?

| Evento | Propósito |
|--------|-----------|
| `sale.checkout_completed` | Notificar que una venta pasó a PENDING_PAYMENT |
| `sale.payment_completed` | Notificar que una venta fue pagada |
| `document.approved` | NO se emite desde POS (el documento se aprueba dentro de la transacción). Otros contextos pueden emitirlo si es relevante. |
| `document.paid` | NO se emite desde POS. |

### ¿Por qué no se emiten `document.approved` y `document.paid` desde POS?

Porque esos eventos pertenecen al Document Engine y tienen semántica de "orden" (approve → haz algo). En el flujo POS, la acción ya ocurrió dentro de la transacción. Emitirlos post-commit causaría doble deducción de stock o requeriría idempotencia en handlers que no la tienen.

En el futuro, cuando se implemente Outbox Pattern, se podrían emitir estos eventos con la semántica de "hecho consumado" (event sourcing ligero).

## Consecuencias

### Positivas

- **Consistencia garantizada**: no hay estados intermedios inconsistentes entre Document, Stock, Cash y SalesOrder
- **Rollback automático**: si cualquier paso falla, todo se revierte
- **Sin doble deducción**: al no emitir `document.approved`, el StockEventHandler no intenta deducir dos veces
- **Eventos de negocio limpios**: `sale.payment_completed` comunica un hecho de negocio, no una instrucción técnica

### Negativas

- **`doPay()` es grande (~120 líneas)**: concentra lógica de Document, Stock, Cash y Sales. Se aborda en ADR-0008.
- **StockEventHandler ya no aplica para POS**: los handlers de `document.approved` ya no descuentan stock de ventas POS. Esto es correcto porque la deducción es inline, pero significa que otros contextos (purchase orders, transfers) siguen usando el handler. El handler debe ser idempotente.
- **Pérdida de visibilidad en Document Engine**: el Document Engine ya no "ve" las transiciones APPROVED y PAID de POS. Si se necesita auditoría centralizada, se puede hacer mediante `sale.payment_completed` + proyección.

## Referencias

- ADR-0005: Comunicación por Eventos (modificado parcialmente por este ADR — la sección de excepciones síncronas se amplía)
- H-001 Transaction Hardening: epic que originó esta decisión
- `transaction-boundaries.md`: mapa detallado de transacciones
