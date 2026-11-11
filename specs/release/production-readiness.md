# Production Readiness Gates

> No habla de funcionalidades. Habla de condiciones.
> Ningún release de Atrio pasa a producción sin cumplir todos los gates del nivel correspondiente.
> Este documento une los estándares existentes (arquitectura, testing, UX, métricas) en una sola checklist de salida.

---

## Gate P-01 — Arquitectura

| # | Condición | Verificado por |
|---|-----------|----------------|
| □ | Build limpio (API + Web) | CI |
| □ | Sin dependencias circulares | `madge` / `dependency-cruiser` |
| □ | TypeScript `strict` sin errores | `tsc --noEmit` |
| □ | ADRs actualizados si hubo decisión arquitectónica nueva | Revisión manual |
| □ | Sin `any` en código nuevo (excepciones documentadas) | ESLint rule |
| □ | Prisma migrations generadas y aplicadas en staging | CI + migration test |

---

## Gate P-02 — Backend

| # | Condición | Verificado por |
|---|-----------|----------------|
| □ | Cobertura unitaria > 80% en módulos nuevos | `jest --coverage` |
| □ | Tests de integración pasan en staging | CI |
| □ | Tests de migraciones (rollback + reapply) pasan | CI |
| □ | Endpoints nuevos tienen contrato OpenAPI | `@nestjs/swagger` |
| □ | Logs estructurados en endpoints nuevos | Revisión manual |
| □ | Health check responde (`/api/health`) | CI + monitoring |
| □ | Sin secretos hardcodeados | `git diff` review |

---

## Gate P-03 — Producto

| # | Condición | Verificado por |
|---|-----------|----------------|
| □ | Sin observaciones F0 (imposible vender) abiertas en el módulo | Observation Log |
| □ | Sin observaciones F1 (obliga a usar mouse) abiertas en el módulo | Observation Log |
| □ | UFI abierto del módulo < 20 puntos | Observation Log |
| □ | UX Debt sin entradas de impacto Alto abiertas en el módulo | UX-DEBT.md |
| □ | Funcionalidad nueva respaldada por OBS/OPS/ARCH/EXP | Observation Log |

---

## Gate P-04 — UX

| # | Condición | Verificado por |
|---|-----------|----------------|
| □ | Keyboard Playwright tests verdes para todos los flujos core | `npx playwright test` |
| □ | Time Motion dentro del objetivo (< 15 s venta 1p, < 30 s venta 3p) | `002-time-motion-study.md` |
| □ | 100 Sales Challenge (Tier A) aprobado sin F0/F1 nuevos | Playwright + observation |
| □ | Sin regresiones de foco (FocusManager + useFocus) | Playwright keyboard tests |
| □ | Atajos de teclado documentados (F1 overlay) | UI de ayuda |

---

## Gate P-05 — Operación

| # | Condición | Verificado por |
|---|-----------|----------------|
| □ | Backup de base de datos probado en staging | Script manual |
| □ | Restore desde backup probado en staging | Script manual |
| □ | Logs de error accesibles sin acceso al servidor | Dashboard / log aggregator |
| □ | Alerta configurada para caída del servicio | Monitoring |
| □ | Tiempo de recuperación (RTO) documentado | Postmortem / runbook |
| □ | Rollback del release documentado (último tag estable) | Release script |

---

## Niveles de release

| Release type | Gates requeridos |
|--------------|------------------|
| **Hotfix** (bug crítico en producción) | P-01 + P-05 |
| **Patch** (bug no crítico) | P-01 + P-02 + P-05 |
| **Minor** (nueva funcionalidad) | P-01 + P-02 + P-03 + P-04 + P-05 |
| **Major** (cambio breaking) | P-01 + P-02 + P-03 + P-04 + P-05 + aprobación arquitectura |

---

## Historial de releases superados

| Fecha | Release | Tipo | Gates |
|-------|---------|------|-------|
| — | — | — | Línea base pendiente |
