# ADR-0008: Extracción de PaymentUseCase del Servicio POS

**Estado:** Propuesto
**Fecha:** 2026-07-07
**Contexto:** H-001 Transaction Hardening, `PosSaleService.doPay()` ~120 líneas

## Contexto

El método `doPay()` en `PosSaleService` concentra:

- Validación de referencia (payment method, cash register, session) — 30 líneas
- Document approval + stock lock — 40 líneas
- Stock deduction + cash movement — 30 líneas
- Sales order update + eventos — 20 líneas

Total: ~120 líneas en un solo método privado.

El servicio `PosSaleService` ya tiene 8 dependencias inyectadas y 9 métodos públicos + privados. Seguir agregando lógica aquí hará que el servicio sea:

- Difícil de testear (cada test requiere mockear todas las dependencias)
- Difícil de cambiar (un cambio en stock afecta a todo el servicio)
- Propenso a errores (el developer no ve el bosque por los árboles)

## Decisión

**No se extrae hoy, pero se documenta la ruta de extracción futura.**

### ¿Cuándo extraer?

> Cuando `doPay()` supere 150 líneas, o cuando aparezca un segundo flujo de pago (ej: pago desde UI de Back Office).

### ¿Cómo extraer?

```
┌─────────────────────────────────────────────────┐
│ PosSaleService.pay()                             │
│  • Load sale, validate status                    │
│  • Load payment method, cash register, session   │
│  • → delega a PaymentUseCase                     │
│  • Post-commit events + audit                    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│ PaymentUseCase                                   │
│  • $transaction {                                │
│      • StockLockStep (FOR UPDATE)                │
│      • DocumentApproveStep                       │
│      • StockDeductionStep                        │
│      • DocumentPayStep                           │
│      • CashRegisterStep                          │
│      • SalesOrderStep                            │
│    }                                             │
│  • Return result                                 │
└─────────────────────────────────────────────────┘
```

Cada "Step" sería una función pura o clase que opera sobre el `Prisma.TransactionClient`:

```typescript
class StockLockStep {
  async execute(tx: Prisma.TransactionClient, lines: DocumentLine[]): Promise<void> {
    for (const line of lines) {
      await tx.$queryRawUnsafe(`SELECT ... FOR UPDATE`, ...);
      // validate
    }
  }
}
```

Esto:

- Mantiene `doPay()` en ~30 líneas (orquestación de steps)
- Cada step es testeable de forma aislada
- Los steps se pueden reordenar, saltar, o combinar para otros flujos
- No hay dependencias de NestJS en los steps (son POJOs que reciben `tx`)

### ¿Por qué no ahora?

- El método actual es estable y funciona
- Extraer demasiado pronto introduce complejidad accidental (interfaces, fábricas, registros DI)
- El patrón de Steps será más claro cuando haya 2+ flujos de pago
- La extracción es mecánica (no requiere decisión arquitectónica nueva)

## Consecuencias

### Positivas

- `PosSaleService` se mantiene como orquestador, no como implementador
- Los steps son testeables unitariamente con un tx mock simple
- La transacción sigue siendo única (no se pierde la atomicidad)
- Nuevos flujos de pago (cancelación, devolución) reutilizan steps

### Negativas

- Hasta que se extraiga, `doPay()` seguirá siendo un método grande
- La extracción requerirá refactorizar el test existente

## Referencias

- ADR-0007: Transaction Boundaries — contexto que originó `doPay()`
- H-001 Transaction Hardening
- `PosSaleService` — 8 dependencias actuales
