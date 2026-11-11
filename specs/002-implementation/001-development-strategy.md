# Development Strategy

> Cómo construimos Atrio: sprints, entregas, y el flujo que garantiza que cada línea de código está respaldada por la arquitectura.

---

## Principios de desarrollo

1. **Vertical Slices, no capas horizontales.** Cada funcionalidad se completa de extremo a extremo (controller → use case → domain → repository → test → evento) antes de empezar la siguiente. No se implementan "todos los controllers" primero.
2. **La arquitectura se valida antes de expandirse.** El Sprint 0 prueba que el esqueleto funciona antes de construir sobre él.
3. **Cada módulo pasa un Module Readiness Review (MRR)** antes de recibir su primera implementación.
4. **Definition of Done obligatoria.** Una funcionalidad no está terminada hasta que pasa todos los criterios (ver 009-definition-of-done.md).

---

## Sprint 0: Validación de arquitectura

**Objetivo:** Probar que la arquitectura funciona con un flujo vertical mínimo. No construir funcionalidad comercializable.

### Alcance del Sprint 0

```
Empresa (tenant)
  ↓
Usuario (auth + login)
  ↓
Producto (crear desde catálogo)
  ↓
Cliente (crear desde customer management)
  ↓
Venta (confirmar)
  ↓
Movimiento de Inventario (descontar stock)
  ↓
Movimiento de Caja (registrar cobro)
  ↓
Auditoría (trazar todo)
```

### Criterios de éxito del Sprint 0

- [ ] Un tenant puede crearse vía API
- [ ] Un usuario puede autenticarse con JWT
- [ ] El TenantAccessGuard inyecta `effectiveTenantId`
- [ ] Un Producto se crea y persiste en Catalog
- [ ] Un Cliente se crea y persiste en Customer Management
- [ ] Una Venta se confirma (flujo completo: Sales → Inventory → Cash)
- [ ] El evento `SaleConfirmed` se emite y Inventory lo consume
- [ ] El evento `InvoiceIssued` se emite y Cash Management lo consume
- [ ] La auditoría registra todos los eventos
- [ ] Los tests unitarios pasan (> 80% cobertura en el flujo)
- [ ] Los tests E2E del flujo completo pasan

---

## Desarrollo por Vertical Slices

```
┌────────────────────────────────────────────┐
│           ConfirmSale                       │
│  ┌─────────┬────────┬────────┬──────────┐  │
│  │ REST    │ Use    │ Domain │ Prisma   │  │
│  │ Controller │ Case │ Entity │ Repository│  │
│  └─────────┴────────┴────────┴──────────┘  │
│  ┌──────────────────────────────────────┐   │
│  │  Test: domain, app, integration, E2E │   │
│  └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

Cada vertical slice:
- Se completa antes de empezar la siguiente
- Incluye tests de todas las capas
- Incluye todos los eventos que emite/consume
- Incluye auditoría

### Orden de slices dentro de un módulo

Para el módulo Sales (ejemplo):

```
1. Crear cotización       (CRUD simple)
2. Confirmar venta        (flujo core + eventos)
3. Facturar               (evento → Cash + Financials)
4. Cancelar venta         (evento compensatorio)
5. Nota de crédito        (flujo inverso)
```

---

## Module Readiness Review (MRR)

Antes de implementar un módulo, debe aprobar un MRR que responde:

| Pregunta | Responsable |
|----------|-------------|
| ¿Qué problema de negocio resuelve? | PM / Product |
| ¿Cuál es su Aggregate Root? | Arquitecto |
| ¿Qué eventos de dominio emite? | Arquitecto |
| ¿Qué eventos de dominio consume? | Arquitecto |
| ¿Qué bounded contexts toca? | Arquitecto |
| ¿Qué invariantes implementa? | Arquitecto + Dev |
| ¿Cuáles son sus casos de uso core? | Dev |
| ¿Qué pruebas mínimas necesita? | Dev + QA |
| ¿Qué dependencias externas requiere? | Dev |
| ¿Qué plan de licenciamiento aplica? | PM |

Sin MRR aprobado, no se escribe código del módulo.
