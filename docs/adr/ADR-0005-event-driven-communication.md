# ADR-0005: Comunicación por Eventos entre Bounded Contexts

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-009, ARR-05

## Contexto

Los bounded contexts necesitan comunicarse. La opción más simple (acceso directo a datos de otro contexto) rompe el aislamiento y genera acoplamiento. La opción más compleja (mensajería distribuida con colas) añade overhead operativo prematuro.

## Decisión

**Los bounded contexts se comunican compartiendo hechos (eventos de dominio), no datos.**

- Un contexto emite un Domain Event cuando algo relevante ocurre (ej: `SaleConfirmed`)
- Otros contextos consumen el evento y reaccionan (ej: Inventory descuenta stock)
- Domain Events e Integration Events están separados conceptualmente

**Excepciones síncronas justificadas:** algunas operaciones requieren respuesta inmediata (POS validando stock). Estas se implementan mediante interfaces de dominio (`IInventoryAvailability`), nunca con acceso directo a datos.

## Consecuencias

- **Positivas:** desacoplamiento total entre contextos; cada contexto evoluciona independientemente; los eventos documentan la historia del sistema; la migración a colas distribuidas es trivial (los eventos ya existen)
- **Negativas:** consistencia eventual entre contextos (no se puede garantizar que Inventory descuente stock en el mismo momento que Sales confirma); más componentes que en un sistema monolítico tradicional
- **Mitigación:** para transacciones críticas (POS), las excepciones síncronas están documentadas. Para todo lo demás, la consistencia eventual es aceptable.

## Referencias

- PR-009: Los módulos se comunican por eventos
- ARR-05: Comunicación entre contextos
- 012-event-storming.md (sync vs async)
- 016-ownership-matrix.md
