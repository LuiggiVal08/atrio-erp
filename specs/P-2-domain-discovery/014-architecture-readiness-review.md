# Architecture Readiness Review (ARR)

> **Gate de aprobación antes de iniciar `001-architecture`.** Este documento lista los criterios que los artefactos de P-2 deben cumplir para que el modelo de dominio se considere válido para pasar a diseño técnico. Un error conceptual en esta fase cuesta órdenes de magnitud más que uno técnico durante la implementación.

---

## Checklist

### ARR-01: Bounded Contexts bien delimitados

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-01.1 | Cada contexto tiene exactamente una responsabilidad de negocio | ✔ |
| ARR-01.2 | No existe acoplamiento oculto (excepciones documentadas en 010-bounded-contexts.md) | ✔ |
| ARR-01.3 | Cada entidad pertenece a exactamente un contexto (dueño único) | ✔ |
| ARR-01.4 | Los nombres de los contextos son de negocio, no técnicos | ✔ |
| ARR-01.5 | Cada contexto tiene dependencias explícitas y unidireccionales | ✔ |
| ARR-01.6 | No existen dependencias circulares entre contextos | ✔ |
| ARR-01.7 | El lenguaje ubicuo de cada contexto es coherente y no se superpone con otros | ✔ |

### ARR-02: Aggregate Roots definidos

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-02.1 | Cada entidad que se modifica de forma independiente tiene un Aggregate Root | ✔ |
| ARR-02.2 | Los Aggregate Roots son cohesivos (incluyen todo lo que necesita una transacción) | ✔ |
| ARR-02.3 | Las referencias entre agregados son por identidad (ID), no por objeto | ✔ |

### ARR-03: Invariantes de dominio documentadas

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-03.1 | Las reglas de negocio inmutables están documentadas por contexto | ✔ |
| ARR-03.2 | Las invariantes cubren creación, modificación y eliminación de entidades | ✔ |
| ARR-03.3 | Las invariantes protegen la integridad del negocio, no solo la técnica | ✔ |

### ARR-04: Domain Events e Integration Events diferenciados

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-04.1 | Los Domain Events representan hechos del negocio que cambiaron el estado del dominio | ✔ |
| ARR-04.2 | Los eventos no son acciones ni comandos | ✔ |
| ARR-04.3 | Domain Events e Integration Events están conceptualmente separados | ✔ |
| ARR-04.4 | Los Integration Events son traducciones de Domain Events para consumidores externos | ✔ |

### ARR-05: Comunicación entre contextos

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-05.1 | Los contextos se comunican compartiendo hechos (eventos), no datos | ✔ |
| ARR-05.2 | Las operaciones síncronas necesarias están identificadas y justificadas | ✔ |
| ARR-05.3 | Las operaciones asíncronas están identificadas | ✔ |
| ARR-05.4 | La tabla emisor/consumidores de eventos está completa | ✔ |

### ARR-06: Event Storming completo

| Ítem | Criterio | Estado |
|------|----------|--------|
| ARR-06.1 | Todos los eventos de dominio core están identificados | ✔ |
| ARR-06.2 | La tabla de eventos incluye emisor y consumidores | ✔ |
| ARR-06.3 | Los flujos core (POS, Compras, Nómina) están modelados con eventos | ✔ |
| ARR-06.4 | No hay acciones disfrazadas de eventos | ✔ |

---

## Estado de aprobación

| Fase | Estado | Fecha | Revisor |
|------|--------|-------|---------|
| P-2 Domain Discovery | ✔ Cumplido | 2026-07-06 | Revisión automática |
| ARR | 🔍 Pendiente de revisión humana | — | Pendiente |
| P-1 Product Design | ✔ Cumplido | 2026-07-06 | Revisión automática |

**Para aprobar:** todos los criterios ARR-01 a ARR-06 deben estar en ✔.
