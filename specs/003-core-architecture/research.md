# Research: Core Architecture & Domain Modules

**Status**: Complete | **Date**: 2026-06-20

---

## 1. Module Activation per Tenant

**Decision**: `tenants.enabled_modules` como `TEXT[]` + `ModuleEnabledGuard` global

**Rationale**:
- No requiere tabla adicional ni join costoso
- El array se carga al autenticar y se incluye en el JWT
- `ModuleEnabledGuard` intercepta requests y verifica contra los módulos del tenant antes de llegar al controlador

**Alternatives considered**:
- Tabla `tenant_modules` con FK: más flexible pero overkill para esta etapa (no hay planes de configuración por módulo aún)
- Feature flags externo (LaunchDarkly): costo innecesario para SaaS early-stage

---

## 2. Cross-Module Event Bus

**Decision**: Extender `@nestjs/event-emitter` existente con un `EventBusService` wrapper

**Rationale**:
- NestJS event-emitter ya está integrado desde 002-document-engine
- No requiere dependencias nuevas
- El wrapper permite persistir eventos fallidos para replay
- Consumidores se registran con `@OnEvent()` decorator

**Alternatives considered**:
- RabbitMQ/Kafka: overkill para monolitos modulares, innecesario hasta que se necesiten microservicios
- Custom EventEmitter: reinventar la rueda

---

## 3. Stock Movement Tracking

**Decision**: Tabla `stock_movements` como ledger (cada movimiento es un registro inmutable) + `stock.quantity` como snapshot actual

**Rationale**:
- `stock_movements` guarda historial completo (cada entrada/salida/transferencia)
- `stock.quantity` es el saldo actual calculado (actualizado vía triggers o en app layer)
- Permite auditoría y replay sin depender de cálculos complejos
- La referencia a `document_id` + `document_type` permite rastrear el origen

**Alternatives considered**:
- Solo snapshot (`stock.quantity` modifiable): pierde historial y auditoría
- Cálculo siempre desde movimientos: lento para consultas frecuentes

---

## 4. Partial Delivery Model

**Decision**: Una sola `purchase_order` permite múltiples recepciones contra sí misma. Cada recepción crea un movimiento de stock independiente. El estado "received" se asigna cuando todas las líneas están completamente recibidas.

**Rationale**:
- No requiere líneas de orden hijas ni esquema complejo
- Se controla con `quantity_received` acumulador por línea (en la tabla `document_items` o una tabla de recibos)
- Para fase inicial, las recepciones parciales se implementan como movimientos de stock con referencia a la OC

**Alternatives considered**:
- Tabla `purchase_receipts` con líneas hijas: más correcto pero más complejo

---

## 5. i18n Structure

**Decision**: Archivos JSON key-based en `apps/web/src/i18n/{locale}.json` con namespace por módulo

**Rationale**:
- Sin dependencias externas, solo JSON plano
- Keys modulares: `sales.invoice.create.title`, `inventory.product.form.sku`
- Fácil de extender a más idiomas
- Compatible con `react-i18next` si se necesita en el futuro

**Alternatives considered**:
- i18next: buena pero añade dependencia para esta etapa
- YAML: menos soporte nativo en JS tooling

---

## 6. Audit Logging Pattern

**Decision**: Interceptor global (ya existe `AuditInterceptor` de 001) extendido para capturar todas las mutaciones REST. Cada módulo puede añadir auditoría granular vía decorator o llamada explícita a `AuditService`.

**Rationale**:
- Reutiliza infraestructura existente
- El interceptor captura automáticamente `before`/`after` en requests REST
- Para mutaciones internas (fuera de REST), `AuditService` se inyecta directamente

**Alternatives considered**:
- Database triggers: menos flexible, difícil de testear
- Solo registro manual: propenso a olvidos

---

## 7. Currency Rate Historical Fixing

**Decision**: Al aprobar un documento, se lee la tasa vigente en `currency_rates` para la fecha de aprobación y se fija en `document.exchange_rate`

**Rationale**:
- Ya es parte del modelo de documentos desde 002
- Consultar `currency_rates` por `[tenantId, from, to, date]` y almacenar el rate en el documento garantiza inmutabilidad del valor histórico
- El `ApproveDocumentUseCase` ya tiene acceso a PrismaService

**Alternatives considered**:
- Recalcular siempre desde la tabla de tasas: rompe inmutabilidad (Principio II)

---

## 8. Frontend Module Structure

**Decision**: Feature modules en `apps/web/src/modules/{module}/` con lazy-loading por ruta.

**Rationale**:
- Cada módulo tiene su propio conjunto de páginas, componentes, hooks
- React Router v7+ con lazy routes para división de código
- Las rutas se renderizan condicionalmente según `enabledModules` del JWT

**Alternatives considered**:
- Todo en un solo feature folder monolítico: difícil de mantener
- Micro-frontends: overkill para esta etapa
