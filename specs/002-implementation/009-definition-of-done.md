# Definition of Done (DoD)

> Criterios que una funcionalidad, historia, o módulo debe cumplir para considerarse "terminado". Sin excepciones.

---

## DoD para una funcionalidad (vertical slice)

### Código

- [ ] El código sigue la estructura de carpetas definida en `002-folder-structure.md`
- [ ] No hay imports prohibidos (validado por lint)
- [ ] TypeScript strict: 0 errores
- [ ] Linter: 0 errores, 0 warnings
- [ ] Cobertura de unit tests > 90% en Domain
- [ ] Cobertura de unit tests > 80% en Application
- [ ] Tests de integración para repositorios (al menos 1 por repositorio)
- [ ] Test E2E del flujo completo (al menos 1)
- [ ] Sin `console.log`, `debugger`, `TODO`, `FIXME` en código mergeado

### Arquitectura

- [ ] Aggregate Root definido con invariantes protegidas
- [ ] Value Objects implementados donde aplique
- [ ] Domain Events definidos para cambios de estado
- [ ] Repositorio por Aggregate Root (no por tabla)
- [ ] Puertos (`ports/in`, `ports/out`) definidos para dependencias con otros contextos
- [ ] El caso de uso controla la transacción
- [ ] Prisma solo en Infrastructure, nunca en Domain
- [ ] Auditoría: todos los eventos de dominio se registran

### API

- [ ] Endpoint REST documentado (OpenAPI)
- [ ] Validación de input (class-validator o zod)
- [ ] Manejo de errores con códigos HTTP correctos
- [ ] Response en formato estándar (`{ data, meta }` o `{ error }`)

### Seguridad

- [ ] Endpoint protegido con autenticación
- [ ] Permisos verificados (RolesGuard)
- [ ] Filtro por tenant en todas las queries
- [ ] Rate limiting aplicado
- [ ] Log de auditoría para operaciones de escritura

---

## DoD para un módulo completo

Todo lo anterior, más:

- [ ] MRR (Module Readiness Review) aprobado
- [ ] Ownership matrix actualizada con las nuevas entidades
- [ ] Matriz de dependencias actualizada en `001-system-architecture.md`
- [ ] Glosario actualizado con nuevo lenguaje ubicuo
- [ ] CHANGELOG.md actualizado
- [ ] ADR creado para decisiones arquitectónicas significativas

---

## DoD para un release

Todo lo anterior, más:

- [ ] Pipeline CI/CD verde
- [ ] Migraciones de DB forward + rollback probadas
- [ ] CHANGELOG.md completo para el release
- [ ] Tag semver creado en git
- [ ] Docker images publicadas en registry
- [ ] Documentación de API desplegada
- [ ] Notas de release publicadas

---

## DoD para Sprint 0

Criterios específicos del Sprint 0:

- [ ] Tenant creado vía API
- [ ] Usuario autenticado con JWT
- [ ] TenantAccessGuard inyecta `effectiveTenantId`
- [ ] Producto creado y persistido en Catalog
- [ ] Cliente creado y persistido en Customer Management
- [ ] Venta confirmada (flujo completo: Sales → Inventory → Cash)
- [ ] Evento `SaleConfirmed` emitido y consumido por Inventory
- [ ] Evento `InvoiceIssued` emitido y consumido por Cash Management
- [ ] Auditoría registra todos los eventos
- [ ] Tests unitarios > 80% en el flujo
- [ ] Tests E2E del flujo completo pasan
- [ ] Pipeline CI/CD funcionando
- [ ] Structure de carpetas por Bounded Context creada
- [ ] Path aliases configurados
