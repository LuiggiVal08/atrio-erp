# Quality Attributes

> Atributos del sistema que la arquitectura debe garantizar. No son requisitos funcionales; son propiedades emergentes del diseño.

---

## Modificabilidad

**¿Cómo lo garantiza la arquitectura?**

- Bounded contexts con dependencias explícitas y unidireccionales — cambiar un contexto no afecta a los demás
- Comunicación por eventos — agregar un nuevo consumidor no requiere modificar al emisor
- Configuration como contexto separado — los cambios de comportamiento se hacen por configuración, no por código
- ADRs documentan cada decisión — el porqué no se pierde

---

## Escalabilidad

**¿Cómo lo garantiza la arquitectura?**

- Monolito modular permite escalar horizontalmente como unidad (múltiples instancias detrás de un balanceador)
- API stateless — cualquier instancia puede manejar cualquier request
- Los eventos de dominio pueden migrarse a una cola distribuida (RabbitMQ, Kafka) sin cambiar el código del dominio
- Si un contexto requiere escalar independientemente, se extrae a un servicio sin rediseñar el sistema

---

## Disponibilidad

**¿Cómo lo garantiza la arquitectura?**

- PostgreSQL con replicación (lectura/escritura separados)
- API stateless — si una instancia falla, el balanceador redirige a otra
- Mantenimiento programado en ventanas de baja actividad (domingo 2-6 AM)
- Los eventos pueden persistirse en una tabla outbox para garantizar entrega incluso si el consumidor falla temporalmente

---

## Seguridad

**¿Cómo lo garantiza la arquitectura?**

- Multi-tenant por diseño — los datos de cada tenant están aislados a nivel de aplicación (todo query incluye `tenantId`)
- Autenticación via JWT con expiración y refresh tokens rotativos
- Autorización por roles y permisos (RBAC) dentro de cada tenant
- Auditoría obligatoria de todas las operaciones críticas
- Rate limiting por endpoint y por tenant
- Headers de seguridad (CSP, HSTS, X-Frame-Options)
- Ownership matrix evita que un contexto modifique datos de otro fuera de su competencia
- Comunicación por eventos evita que un contexto acceda a datos sensibles de otro

---

## Auditabilidad

**¿Cómo lo garantiza la arquitectura?**

- Todos los Aggregate Roots generan Domain Events
- Todos los Domain Events generan Audit Entries (quién, qué, cuándo, valor anterior, valor nuevo)
- Los eventos de integración para sistemas externos son una traducción explícita de los Domain Events, no eventos separados
- Los asientos contables una vez contabilizados son inmutables
- PR-003: Toda operación importante es auditable

---

## Internacionalización

**¿Cómo lo garantiza la arquitectura?**

- Localization Engine como bounded context separado del core (PR-001)
- Toda regla fiscal, laboral o contable que varíe por país vive en Localization
- i18n en UI desde el día uno (archivos es.json, en.json)
- Multi-moneda nativa: precios en cualquier moneda, tasas de cambio, asientos contables multi-moneda
- Nuevo país = nueva configuración + reglas en Localization, no nuevo código en el core

---

## Configurabilidad

**¿Cómo lo garantiza la arquitectura?**

- Configuration como bounded context transversal (BC-11)
- Módulos activables/desactivables por tenant
- Campos personalizados por entidad
- Estados configurables para procesos
- Preferencias por tenant
- PR-005: Configuración > Código

---

## Observabilidad

**¿Cómo lo garantiza la arquitectura?**

- Logging estructurado en todos los servicios (JSON, con requestId, tenantId, userId)
- Métricas de dominio expuestas además de las técnicas (ej: ventas por hora, stock bajo, cajas abiertas)
- Domain Events como fuente de datos para métricas de negocio
- Health checks por contexto y por dependencia externa
- Trazabilidad distribuida (traceId propaga a través de eventos)

---

## Testabilidad

**¿Cómo lo garantiza la arquitectura?**

- Domain model sin dependencias de infraestructura — testeable en aislamiento (unit tests)
- Puertos/adaptadores permiten mockear infraestructura — repositorios, APIs externas, mensajería
- Cada bounded context tiene su propio conjunto de pruebas
- Test Data Builders para crear agregados en tests sin acoplar a la base de datos
- PR-042: Cobertura de unit tests > 80%
- PR-043: Cobertura de E2E > 60% para módulos core
- TypeScript estricto en toda la base de código

---

## Matriz de atributos vs. decisiones arquitectónicas

| Atributo | Decisión principal que lo garantiza |
|----------|-----------------------------------|
| Modificabilidad | Bounded contexts + eventos |
| Escalabilidad | Monolito modular con capacidad de extracción |
| Disponibilidad | API stateless + PostgreSQL replicado |
| Seguridad | Multi-tenant por diseño + ownership matrix |
| Auditabilidad | Domain Events → Audit Log |
| Internacionalización | Localization Engine |
| Configurabilidad | Configuration BC |
| Observabilidad | Logging + métricas de dominio + health checks |
| Testabilidad | Domain sin infraestructura + puertos/adaptadores |
