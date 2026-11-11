# Atrio ERP — Documento Maestro del Sistema

> **Qué es este documento:** la consolidación de todos los documentos que definen qué contiene y qué contendrá Atrio. Es el punto de entrada único para producto, arquitectura, alcance, módulos, datos, reglas, roadmap y estado real.
>
> **Vigencia:** 2026-10-30 · **Rama:** `develop` · **Fuente de verdad:** el código y los specs citados en el Anexo A. Ante conflicto, prevalece el código; las discrepancias se registran en la sección 15.
>
> **Regla de mantenimiento:** este documento no reemplaza a los specs fuente. Los resume y los ordena. Cuando un spec cambie, se actualiza aquí la sección afectada. No se crean nuevos documentos de alcance mientras dure Alpha-1 (ver §2.3).

---

## 0. Cómo leer este documento

| Si buscas… | Ve a… |
|---|---|
| Qué es Atrio y a quién sirve | §1 |
| Qué principios no se pueden romper | §2 |
| Qué incluye el MVP y qué no | §3 |
| Cómo está construido | §4 |
| Qué dominios existen y cómo se relacionan | §5 |
| Qué hace cada módulo, con entidades y reglas | §6 |
| Qué tablas/modelos existen | §7 |
| Qué endpoints hay | §8 |
| Qué pantallas y flujos existen | §9 |
| Qué reglas de negocio son inviolables | §10 |
| Rendimiento, seguridad, disponibilidad | §11 |
| Cómo se prueba y cuándo está “terminado” | §12 |
| Qué viene y en qué orden | §13 |
| Qué está realmente implementado | §14 |
| Qué falta decidir | §15 |
| De dónde salió todo esto | §16 |

---

## 1. Identidad del producto

### 1.1 Qué es Atrio

**Atrio** es un ERP modular, multi-tenant y API-first para PYMES de Latinoamérica. Forma parte del ecosistema **ODALX**, la marca matriz que agrupa productos independientes entre sí.

- **Propósito:** reducir la complejidad operativa de las empresas. Cada pantalla y cada flujo debe permitir completar el trabajo con menos pasos, menos errores y menos carga cognitiva.
- **Promesa:** simplicidad operativa, velocidad de uso diario, localización real (no traducción), modularidad y precio accesible.
- **Núcleo:** “todo es un documento con estados”. Todo movimiento económico genera un documento trazable; el documento es inmutable al aprobarse.
- **Usuario primario:** cajero, contador, administrador, gerente de inventario y dueño de PYME. Uso intensivo, 8 horas al día.
- **Diferenciador:** alta densidad, keyboard-first, multi-moneda y reglas fiscales/laborales como capacidades nativas del `Localization Engine`.

### 1.2 Qué NO es Atrio

- No es un ERP genérico ni una plataforma todo-en-uno.
- No es CRM, Help Desk, BI ni E-commerce (esos son productos ODALX futuros).
- No es low-code ni una plataforma de marketing.
- No es un proyecto open source.
- No se adapta a procesos incorrectos del cliente: se educa, no se programa.
- No compite por cantidad de módulos: un módulo excelente vale más que diez regulares.
- No crea una bifurcación por país ni por cliente: un solo código base, múltiples localizaciones y configuraciones.
- No hardcodea legislación fiscal en el core.

### 1.3 Ecosistema ODALX

```text
ODALX
├── Atrio (ERP)          ← este producto
├── Argos (ATS)
├── CRM (futuro)
├── Help Desk (futuro)
├── BI (futuro)
└── E-commerce (futuro)
```

Cada producto debe poder vivir solo: modelo de datos, autenticación y despliegue propios. Las integraciones entre productos son por API, nunca por dependencia directa (PR-013).

### 1.4 Mercado objetivo

| Dimensión | V1 |
|---|---|
| Cliente primario | PYME latinoamericana de 3–200 empleados, facturación USD 50K–10M/año |
| Sectores | Comercio, distribución, servicios, alimentos y bebidas |
| Países | Venezuela y Colombia (V1); México, Perú, Chile, España (V2+) |
| Cliente secundario | Empresas de software que necesiten ERP white-label (fase posterior) |
| Perfiles | Cajero (máxima prioridad, desktop), contador, administrador, gerente de inventario, dueño (desktop + móvil), cliente/proveedor (ocasional) |
| No target V1 | Manufactura pesada/MRP, retail de decenas de sucursales, salud, construcción, agroindustria |

**Dolor que resuelve:** Excel + facturador básico, sistemas legacy caros (Profit, Contasis), ERPs extranjeros que no entienden IVA/IGTF, multi-moneda ni prestaciones sociales, y soluciones locales que no escalan.

### 1.5 Propuesta de valor

1. **Modularidad real:** se activa solo lo que se necesita.
2. **Localización nativa:** la legislación es un pilar arquitectónico, no un plugin.
3. **Multi-país desde el día uno:** un código base para varios países.
4. **Alta densidad:** interfaz para uso intensivo, no para demos.
5. **Modernidad técnica:** TypeScript, React 19, NestJS 11, PostgreSQL 16.

### 1.6 Modelo de negocio y planes

**Modelo:** SaaS multi-tenant con suscripción mensual/anual. Unidad económica: una empresa (tenant). Canales: directo (landing + prueba), referidos (contadores/consultores) y partners white-label (fase posterior).

| Plan | Público | Módulos | Límites | Precio estimado |
|---|---|---|---|---|
| **Free** | Microemprendedores, prueba | Ventas, clientes, productos, caja básica, inventario básico | 1 empresa, 3–5 usuarios, 1 almacén | Gratis |
| **Starter** | PYMES pequeñas | Free + compras, reportes básicos | 1 empresa, usuarios ilimitados, 3 almacenes | USD 29–49/mes |
| **Business / Professional** | PYMES en crecimiento | Starter + caja completa, localización fiscal, comisiones, API, RRHH básico | 1 empresa, usuarios y almacenes ilimitados | USD 79–149/mes |
| **Enterprise** | Empresas consolidadas | Professional + multi-tenant, nómina, SLA, on-premise opcional | Multi-empresa, usuarios ilimitados | A medida (USD 300–500+/mes) |

**Principios de pricing:** no se cobra por módulo individual; el precio se basa en capacidad, no en transacciones; Free es embudo, no producto; descuento anual equivalente a 2 meses. Precios de lista en USD; cobro en la moneda funcional del tenant según país (Venezuela referenciado a BCV, Colombia fijo en COP, resto USD/EUR).

**Lo que no se hará:** % de facturación, permanencia mínima, costos ocultos de implementación, licencias perpetuas.

---

## 2. Principios y gobierno

### 2.1 Constitución (10 artículos)

1. Atrio siempre será un ERP. Nunca una plataforma de marketing, low-code o e-commerce.
2. El núcleo nunca conocerá legislación fiscal. La legislación vive en `Localization` como capacidades intercambiables por país.
3. Todo movimiento económico genera documento fiscal. No existe transacción sin registro legal.
4. Todo documento tiene trazabilidad completa: quién, cuándo, desde dónde, sobre qué estado anterior.
5. El dominio nunca importa Prisma. La infraestructura es un detalle; las reglas viven en lenguaje ubicuo, no en SQL.
6. No existen `Client` ni `Vendor`. Existe `Partner` con `PartnerRole[]`. Un partner puede ser cliente, proveedor, prospecto o varios a la vez.
7. Los módulos pueden deshabilitarse, nunca eliminarse. Los datos históricos son inviolables.
8. Cruzar un bounded context requiere integración explícita (evento, servicio o anti-corruption layer).
9. Toda decisión arquitectónica importante requiere ADR. Si no hay ADR, la decisión no existe.
10. La UX se valida observando operadores reales. Una observación vence a cualquier suposición.

### 2.2 Principios de producto (PR-001 a PR-013)

| ID | Principio |
|---|---|
| PR-001 | El core nunca contiene legislación. |
| PR-002 | Todo debe poder des/habilitarse por configuración o módulo. |
| PR-003 | Toda operación importante es auditable (quién, qué, cuándo, antes/después). |
| PR-004 | No se eliminan datos críticos: soft delete, historial o eventos inmutables. |
| PR-005 | Configuración > código. |
| PR-006 | API First: todo lo que hace el frontend se puede hacer por la API interna. |
| PR-007 | Multi-tenant por diseño, con aislamiento estricto. |
| PR-008 | Mantenibilidad sobre velocidad de implementación. |
| PR-009 | Los módulos se comunican por eventos o servicios, nunca por dependencia directa. |
| PR-010 | UX de alta densidad, pensada para uso intensivo diario. |
| PR-011 | 90% configuración, 10% extensibilidad; nunca modificar el núcleo por cliente. |
| PR-012 | Monolito modular como arquitectura inicial; extraer servicios solo con tracción. |
| PR-013 | Cada producto ODALX debe poder vivir por sí solo. |

### 2.3 Prioridades y reglas de gobierno

**Prioridades siempre (Product Charter):** simplicidad sobre funcionalidad; velocidad (el operador nunca espera); configuración sobre personalización con código; localización nativa; keyboard-first; evidencia sobre opinión.

**Reglas de decisión:**

- Un cliente que pide romper el modelo estándar: no se hace; se busca configuración alternativa.
- Una funcionalidad nueva que compite con otra existente: no se agrega; se mejora la existente.
- Un flujo que tarda más de 30 segundos: se rediseña antes de liberar.
- Una pantalla que requiere más de 2 clics para la acción principal: se simplifica.
- Una observación F0/F1 abierta en un módulo: no se agregan funcionalidades nuevas a ese módulo.

**Reglas de calidad y evidencia:**

- **TDD obligatorio** (Constitución, Principio III).
- **Rule of Four:** no abstraer infraestructura compartida hasta la cuarta ocurrencia (1 implementar, 2 coincidencia, 3 observar, 4 considerar).
- **Backlog por evidencia:** OBS (observación), OPS (operación), ARCH (arquitectura), EXP (experimento). Nunca se borran entradas.
- **Flujo de observación:** OPEN → IN PROGRESS → VALIDATED → CLOSED.
- **UFI (User Friction Index):** F0=100, F1=40, F2=10, F3=3; objetivo UFI abierto < 20.
- **UX Debt** se rastrea aparte, con la misma prioridad que la deuda técnica.
- **Keyboard-first:** ninguna feature entra al POS sin pruebas Playwright de teclado.
- **Estados terminales requieren ADR:** CANCELLED, VOIDED, REFUNDED, REVERSED, etc. no se agregan solo porque un flujo los necesite; el ADR debe cubrir inventario, caja, documentos, impuestos, auditoría y eventos.
- **Alpha-1:** 100 ventas reales en un negocio piloto. No se crean nuevos specs; toda feature nace de una venta real o una necesidad demostrable. El gate es “Operational Ready”: operar un día completo sin asistencia de desarrollo.

**Decisiones arquitectónicas registradas (ADR):**

| ADR | Decisión |
|---|---|
| ADR-0001 | Monolito modular |
| ADR-0002 | API First |
| ADR-0003 | Localization Engine |
| ADR-0004 | Domain-Driven Design |
| ADR-0005 | Comunicación por eventos |
| ADR-0006 | Carpetas por bounded context |
| ADR-0007 | Límites transaccionales y eventos post-commit |
| ADR-0008 | Extracción de `PaymentUseCase` |
| ADR-0009 | Relaciones temporales (historial, nunca update in-place) |
| ADR-0010 | Principio de permanencia de identidad |

---

## 3. Alcance

### 3.1 Mapa de capacidades

| Dominio | Capacidad | Estado real |
|---|---|---|
| Core | Multi-tenant, auth JWT, RBAC 82 permisos, usuarios, auditoría, eventos, soft delete | ✅ |
| Document Engine | CRUD, FSM, numeración, eventos, auditoría, contra-documentos | ✅ (contra-documentos 🟡) |
| Business Partners | Partner, roles, contactos, direcciones, tags, migración legacy | ✅ backend, ⚪ UI |
| Catálogo | Productos, categorías, imágenes, listas de precio | ✅ backend, ⚪ UI |
| Inventario | Almacenes, stock, movimientos, ajustes, transferencias, reorder points | ✅ backend, ⚪ UI |
| Ventas / POS | Sesión, draft, checkout, pago, quick sale, UI terminal | ✅ backend + UI parcial |
| Compras | PurchaseOrder legacy, PurchasingOrder slice 1, GoodsReceipt, price lists | 🟡 |
| Caja / Pagos | Cajas, movimientos, métodos, bancos, arqueo | ✅ backend, ⚪ UI; multi-pago 🔴 |
| Localización / Fiscal | Impuestos, tasas, estrategia VE/CO, cálculo fiscal | ✅ backend, ⚪ UI |
| Organización | Departamentos, cargos, asignaciones | ✅ backend, ⚪ UI |
| People / Employment | Employee, EmploymentRelationship, Contract, Compensation, Schedule | ✅ backend, ⚪ UI |
| Nómina | PayrollPeriod + Payslip (salario base) | 🟡 slice 1 |
| Reportes | Dashboard, definiciones, ejecuciones, historial, PDF/XLSX | 🟡 |
| Notificaciones | Email/push/in-app | ⚪ |
| Servicios recurrentes | Suscripciones, cobros periódicos | ⚪ |
| Contabilidad / Financials | Plan de cuentas, asientos, CxC/CxP | ⚪ |
| Facturación electrónica | SENIAT / DIAN | ⚪ |

Leyenda: ✅ completo · 🟡 parcial con deuda · 🔴 roto/deuda crítica · ⚪ no iniciado.

> **Nota:** la `capability-matrix` fuente está desactualizada. El hardening transaccional H-001 ya está implementado en código (idempotencia, `FOR UPDATE`, eventos post-commit, pago en una sola transacción), aunque la matriz lo marque en rojo. Ver §14.

### 3.2 MVP (Core Operativo P1)

**Incluye:**

| Capacidad | Mínimo |
|---|---|
| Catálogo | CRUD productos + categorías + precios (sin variantes ni múltiples listas) |
| Clientes | CRUD clientes + contactos básicos (sin segmentos ni historial) |
| Ventas | Confirmar venta + factura básica (sin cotizaciones ni notas de crédito V1) |
| Caja | Apertura/cierre + cobro en efectivo (sin arqueo ni multi-pago V1) |
| Inventario | 1 almacén, movimiento entrada/salida (sin transferencias, lotes ni series) |
| Auth | Login email + JWT + refresh (sin SSO ni 2FA) |
| Multi-tenant | Crear empresa + slug + UserAccess (sin switch en frontend V1) |
| Auditoría | Log de eventos de dominio (sin UI, solo DB) |
| Localización V1 | IVA + IGTF Venezuela (sin retenciones ni facturación electrónica) |

**No incluye:** compras, RRHH, nómina, contabilidad, reportes avanzados, campos personalizados, workflows, API pública, múltiples monedas, múltiples almacenes, lotes/series, integraciones externas.

**Criterios de salida:** 3 flujos verticales completos (crear producto → vender → cobrar); cobertura > 80%; todo corre local/Docker; CI/CD; documentación de API del MVP; un cliente no técnico completa el flujo sin asistencia.

### 3.3 Fuera de alcance V1

- Manufactura/MRP/BOM multi-nivel.
- Retail con decenas de sucursales y POS multi-sucursal complejo.
- Salud, construcción, agroindustria.
- CRM completo, Help Desk, BI, E-commerce (productos ODALX separados).
- Contabilidad completa y facturación electrónica (fases posteriores).
- Workflows configurables y framework de plugins (P-2/P-4).

---

## 4. Arquitectura

### 4.1 Estilo

**Monolito modular** con bounded contexts separados por capas de dominio, no por procesos. La comunicación entre contextos es por interfaces, inyección de dependencias, eventos o API interna; nunca por acceso directo a la base de datos de otro contexto. Solo se extrae un servicio cuando hay necesidad real de escalar o desplegar independientemente.

**Capas por módulo:**

```text
domain/          entidades, value objects, state machines, invariantes, puertos
application/     use cases, DTOs de aplicación, orquestación
infrastructure/  Prisma, controllers, repositorios, adaptadores
```

**Regla:** el dominio no importa Prisma ni NestJS. La infraestructura implementa los puertos del dominio.

### 4.2 Stack

| Capa | Tecnología |
|---|---|
| API | NestJS 11, TypeScript estricto, Prisma 6 |
| Web | React 19, Vite 6, Tailwind CSS 4, HeroUI, Zustand, TanStack Query |
| Base de datos | PostgreSQL 16 (PgBouncer en runtime; conexión directa para migraciones) |
| Cache / colas | Redis 7, BullMQ |
| Tiempo real | Socket.io |
| Archivos | MinIO (S3-compatible) |
| PDF / Excel | Puppeteer, ExcelJS |
| Auth | JWT (access corto + refresh rotativo), bcrypt |
| Infra | Docker multi-stage, Nginx como entrada única, GitHub Actions |
| Tests | Jest (unit), Supertest (E2E API), Vitest (web), Playwright (E2E web) |

### 4.3 Estructura del repositorio

```text
apps/
├── api/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── core/                 # business-partners, shared kernel
│       ├── common/               # audit, guards, interceptors, metrics
│       └── modules/              # un directorio por bounded context
└── web/
    └── src/
        ├── modules/              # cash, client-vendor, crm, inventory, payroll,
        │                         # pos, purchases, rbac, reports, sales, settings, users
        ├── routes/
        └── shared/
```

### 4.4 Multi-tenant

- Cada empresa es un `Tenant`; el `tenantId` está en todas las entidades de negocio.
- `Tenant.slug` único; `enabledModules: string[]` define qué módulos ve y puede usar el tenant.
- El JWT incluye `tenantId`, roles/permisos, `enabledModules` y `locale`.
- `TenantAccessGuard` global valida pertenencia y estado del tenant.
- Aislamiento estricto: no basta con `WHERE tenant_id = ?`; se valida en guard + repositorio + constraints.
- Un usuario puede pertenecer a varios tenants vía `UserAccess`; el rol se asigna por tenant.

### 4.5 API

- Prefijo global: `/api/v1`.
- `ValidationPipe` global con `whitelist: true` y `transform: true`.
- REST, DTOs validados, respuestas consistentes, paginación y filtros.
- Contratos documentados por módulo en `specs/*/contracts/`.
- Idempotencia en operaciones críticas (checkout, pago, cancelación, aprobación) vía `IdempotencyInterceptor` con Redis (TTL 3600 s).
- Rate limiting por endpoint y tenant (NFR-023).
- Versionado de API y de esquema según `002-implementation/008-versioning-strategy.md`.

### 4.6 Eventos

- Comunicación asíncrona con `EventEmitter2` dentro del monolito.
- Eventos de dominio inmutables; para corregir se emite un evento compensatorio.
- **Regla de transacción (ADR-0007):** una transacción de base de datos por caso de uso; los eventos se publican **después del commit**. Si un handler falla, el evento queda persistido para replay.
- Eventos principales: `document.approved`, `document.paid`, `document.cancelled`, `document.status-changed`, `document.counter-created`, `partner.*`, `stock.*`, `payroll.period.*`, `report.completed`.
- Consumidores: Inventory (descuenta stock al aprobar venta), Cash (registra movimiento al pagar), Reports (métricas), Financials (futuro).

### 4.7 Transacciones y concurrencia

- Una sola transacción por operación de negocio (checkout + pago + stock + caja).
- Bloqueo pesimista `SELECT ... FOR UPDATE` para stock y saldos de caja.
- Idempotencia para evitar doble cobro/doble descuento.
- Stock y caja no pueden quedar en estado parcial.
- Los handlers de eventos no bloquean la transacción principal.
- Deuda pendiente: outbox pattern formal (documentado, no implementado).

### 4.8 Seguridad

- HTTPS/TLS 1.3; headers CSP, HSTS, X-Frame-Options.
- bcrypt con costo ≥ 10; bloqueo temporal tras N intentos fallidos configurables.
- JWT con expiración corta y refresh rotativo; revocación en logout.
- RBAC granular (`modulo.accion`) validado en cada endpoint.
- Auditoría de acceso a datos sensibles.
- Aislamiento total entre tenants.
- Principio de mínimo privilegio: sin rol, sin acceso.
- Cumplimiento de protección de datos: LOPDP (VE), Ley 1581 (CO), LGPD (BR); exportación y eliminación por tenant.

### 4.9 Observabilidad

- Logs estructurados con contexto de tenant, usuario y correlación.
- Métricas de negocio: duración de checkout, errores de pago, conflictos de stock, ventas por hora.
- Health checks y métricas técnicas (`/metrics`).
- Auditoría inmutable en `audit_logs` y `document_events`.
- Retención de logs de acceso/operaciones ≥ 2 años.

### 4.10 Infraestructura

`docker-compose.yml` levanta: PostgreSQL 16, PgBouncer, Redis 7, API, Web, Nginx (entrada única :80) y MinIO. La API usa PgBouncer en runtime; las migraciones usan conexión directa a PostgreSQL. Builds multi-stage con Node 24 Alpine. En Docker se evita `npm ci` por timeouts de red: se copia `node_modules` del contexto (ver AGENTS.md).

---

## 5. Bounded contexts

### 5.1 Contextos canónicos

| ID | Contexto | Propósito | Fuente de verdad | Implementación |
|---|---|---|---|---|
| BC-01 | **Catalog** | Productos, servicios, precios, impuestos, clasificaciones | Product, Variant, Category, PriceList, TaxRule, UoM | `modules/inventory` (productos/categorías), `purchasing/price-lists` |
| BC-02 | **Customer Management → Business Partners** | Terceros con roles: cliente, proveedor, prospecto, distribuidor, transportista, acreedor | Partner + roles + contactos + direcciones | `core/business-partners` + `modules/client-vendor` legacy |
| BC-03 | **Inventory** | Existencias, movimientos, ajustes, transferencias, lotes/series | Warehouse, Stock, StockMovement | `modules/inventory` |
| BC-04 | **Sales** | Cotización, pedido, factura, notas de crédito/débito, POS | SaleOrder, Invoice, CreditNote | `modules/sales`, `modules/pos`, Document Engine |
| BC-05 | **Purchasing** | Orden de compra, recepción, cuentas por pagar | PurchaseOrder, GoodsReceipt | `modules/purchasing` (dos modelos, ver §7.11) |
| BC-06 | **Cash Management** | Caja, apertura/cierre, cobros, pagos, arqueo | CashRegister, CashMovement, PaymentMethod | `modules/cash-payments`, `modules/pos` |
| BC-07 | **Financials** | Contabilidad, plan de cuentas, asientos, CxC/CxP | Account, JournalEntry, AccountingPeriod | ⚪ no implementado |
| BC-08 | **Human Resources** | Empleados, organización, contratos, historial | Employee, Department, Position, Contract | `modules/employee`, `modules/organization`, `modules/employment` |
| BC-09 | **Payroll** | Conceptos, períodos, liquidación, recibos, provisiones | PayrollPeriod, Payslip | `modules/payroll` (slice 1) |
| BC-10 | **Localization** | Reglas fiscales, laborales y contables por país | CountryConfig, TaxRule, WithholdingRule | `modules/localization`, `modules/fiscal` |
| BC-11 | **Configuration** | Módulos activos, campos personalizados, preferencias, roles/permisos | TenantConfig, Module, CustomField, Role | `modules/tenant`, `modules/rbac`, settings |

**Contextos especializados añadidos:**

| Contexto | Propósito | Implementación |
|---|---|---|
| **Document Engine** | Sistema nervioso: todo documento transaccional, FSM, numeración, auditoría, contra-documentos | `modules/document-engine` |
| **Organization** | Estructura organizacional (departamentos, cargos, asignaciones), separada de People | `modules/organization` |
| **Employment** | Relación laboral como entidad de primer orden; capa entre Employee y Payroll | `modules/employment` |
| **Reports** | Read model: dashboards, reportes, exportaciones, historial | `modules/reports` |
| **Notifications** | Email/push/in-app | ⚪ no implementado |
| **Recurring Services** | Servicios/suscripciones con cobro periódico | ⚪ no implementado |

### 5.2 Mapa de relaciones

```text
                    ┌───────────────┐
                    │ Configuration │
                    └───────┬───────┘
                            │ (todos consultan)
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌──────────┐      ┌──────────────┐     ┌──────────────┐
  │ Catalog  │      │ Business     │     │ Localization │
  │          │      │ Partners     │     │              │
  └────┬─────┘      └──────┬───────┘     └──────┬───────┘
       │ (consume)         │ (consume)          │ (consulta)
       ▼                   ▼                    ▼
  ┌──────────────────────────────────────────────────┐
  │        Sales · Purchasing · Inventory · Cash     │
  └────────┬─────────┬─────────┬─────────────────────┘
           │         │         │ (eventos)
           ▼         ▼         ▼
  ┌──────────────────────────────────────────────────┐
  │                   Financials                      │
  └──────────────────────────────────────────────────┘

  ┌──────────────┐    ┌──────────────┐
  │ Organization │    │ People       │
  └──────┬───────┘    └──────┬───────┘
         └────────┬──────────┘
                  ▼
           ┌──────────────┐     ┌──────────┐
           │ Employment   │────►│ Payroll  │
           └──────────────┘     └────┬─────┘
                                     ▼
                              ┌──────────────┐
                              │ Financials   │
                              └──────────────┘
```

### 5.3 Reglas de comunicación

1. Un contexto nunca accede directamente a la base de datos de otro.
2. Los eventos son inmutables; si hay error, se emite un evento compensatorio.
3. Cada contexto es dueño de sus datos; para modificar otro contexto se usa API o evento.
4. Las dependencias son unidireccionales; una dependencia circular indica mal diseño.
5. `Configuration` es la excepción transversal: todos leen, él no escribe en nadie.
6. Excepciones síncronas justificadas: disponibilidad de stock para POS y cálculo fiscal en transacción.

---

## 6. Módulos funcionales

> Cada módulo describe: propósito, alcance, entidades, estados, reglas, eventos, API y estado. Lo planificado se marca explícitamente.

### 6.1 Core Platform (Tenant, Auth, RBAC, Users, Audit, Config)

**Propósito:** que la plataforma exista, aísle empresas, autentique, autorice y audite.

**Alcance:**

- Registro/aprovisionamiento de tenants por super-admin (no autoservicio público).
- `Tenant`: slug, razón social, identificación fiscal, moneda base, país, timezone, plan, estado, módulos activos, settings.
- `User`: identidad digital por tenant; email, password hash, nombre, foto, locale, teléfono, estado, intentos fallidos, bloqueo, vínculo opcional a Employee.
- `UserAccess`: relación usuario–tenant–rol.
- `Role`, `Permission`, `RolePermission`, `UserRole`: RBAC granular con 82 permisos.
- Auditoría global (`AuditLog`) y por entidad; inmutable.
- Soft delete y ciclos de vida (`ACTIVE → INACTIVE → BLOCKED → ARCHIVED`).
- Configuración por tenant: módulos activos, preferencias, campos personalizados (V1.5), estados configurables (futuro).

**Estados:**

- `TenantStatus`: `active`, `suspended`, `inactive`.
- `UserStatus`: `active`, `blocked`, `inactive`.

**Reglas clave:**

- Aislamiento total entre tenants.
- Sin rol asignado → sin acceso (mínimo privilegio).
- Login falla si el tenant está suspendido.
- No se elimina un tenant con datos transaccionales; se suspende o se migra.
- Roles asignados no se eliminan sin reasignación o notificación.
- Usuarios y empleados son entidades separadas; eliminar uno no afecta al otro.

**Eventos:** `TenantCreated`, `TenantSuspended`, `UserCreated`, `UserRoleAssigned`, `ConfigurationChanged`, `ModuleActivated`, `ModuleDeactivated`.

**API:** `/auth/*`, `/tenants/*`, `/users/*`, `/roles/*`, `/permissions/*`, `/admin/audit-logs`, `/metrics`.

**Estado:** ✅ backend y UI de usuarios/RBAC; UI de tenants 🟡; auditoría sin UI.

---

### 6.2 Document Engine

**Propósito:** ser la única vía para crear documentos transaccionales y garantizar inmutabilidad, trazabilidad y estados válidos.

**Alcance:**

- `Document`: tipo, estado, número, moneda, tasa de cambio, subtotal, impuestos, descuentos, total, notas, motivo de rechazo, creador, aprobador, timestamps, soft delete.
- `DocumentLine`: descripción, cantidad, precio unitario, tasa/importe de impuesto, descuento, total, producto/almacén opcional, cantidad recibida.
- `DocumentEvent`: historial inmutable de transiciones (estado anterior/nuevo, payload, usuario, fecha).
- `InvoiceTaxDetail`: desglose fiscal por factura (IVA débito, retenciones IVA/ISLR/ICA, IGTF).
- Contra-documentos: nota de crédito/débito referenciando el documento original.
- Numeración: `{PREFIX}-YYYYMMDD-{SEQ}` única por tenant.
- FSM: `draft → pending_approval → pending_fiscal → approved → posted → delivered → paid → cancelled`.
- Inmutabilidad estructural al aprobar.
- Aprobación concurrente: el primero gana; los demás se rechazan.

**Tipos:** `sales_invoice`, `purchase_order`, `credit_note`, `debit_note`, `delivery_order`, `stock_transfer`, `cash_movement`.

**Reglas clave:**

- No existe transacción sin documento.
- Un documento aprobado no se edita; se corrige con contra-documento.
- Transiciones inválidas se rechazan con error claro.
- Totales consistentes: subtotal + impuestos − descuentos = total.
- La tasa de cambio se congela al aprobar.
- No se aprueba un documento con total cero salvo configuración explícita.
- Toda transición queda en auditoría y emite evento.

**Eventos:** `document.approved`, `document.paid`, `document.cancelled`, `document.status-changed`, `document.counter-created`.

**API:** `/documents` (CRUD, query por estado/tipo/fecha), `/documents/:id/approve`, `/cancel`, `/counter-documents`.

**Estado:** ✅ implementado (45/45 tareas, 88 tests unitarios, 1 E2E de ciclo de vida, 1 suite de contrato). Contra-documentos 🟡.

---

### 6.3 Business Partners

**Propósito:** un solo modelo de terceros con múltiples roles, eliminando la duplicación `Client`/`Vendor`.

**Alcance V1:**

- `Partner`: persona o empresa, identificación fiscal por país, nombre legal/comercial, sitio web, estado, metadata, `externalId`.
- Roles simultáneos: `CUSTOMER`, `SUPPLIER`, `PROSPECT`, `DISTRIBUTOR`, `CARRIER`, `MANUFACTURER`, `CREDITOR`.
- `Contact`: nombre, cargo, email, teléfono, móvil, principal.
- `PartnerAddress`: fiscal, facturación, envío, sucursal, principal, otro; ciudad, estado, país, postal.
- `PartnerTag`: etiquetas libres (VIP, moroso, frecuente…).
- `PartnerEvent`: timeline de eventos (estructura; UI futura).
- Migración desde `Client`/`Vendor` con `PartnerMigrationMap` y revisión de casos ambiguos.
- Endpoints legacy `/clients` y `/vendors` con headers de deprecación.

**Estados:** `ACTIVE → INACTIVE → BLOCKED → ARCHIVED` (soft delete; nunca DELETE físico).

**Reglas clave:**

- Un partner, muchos roles; los roles se asignan/revocan, no se duplica el partner.
- Identificación fiscal única por tenant + país + tipo.
- Un partner archivado no genera transacciones nuevas.
- El historial comercial es de solo lectura desde este módulo.
- Las etiquetas son libres, sin jerarquía forzada.
- Solo Business Partners escribe el agregado; los demás contextos leen.

**Eventos:** `PartnerCreated`, `PartnerUpdated`, `PartnerRoleAssigned`, `PartnerArchived`.

**API:** `/partners` (CRUD, búsqueda, roles, contactos, direcciones, tags, timeline), `/clients`, `/vendors` (legacy).

**Estado:** ✅ backend; ⚪ UI (existe `FichaTerceroView` y vistas legacy); migración en curso.

---

### 6.4 Catalog

**Propósito:** definir qué existe y cuánto vale en lista; no sabe de stock ni de ventas.

**Alcance:**

- `Product`: SKU único, nombre, descripción, precio, costo, impuesto por defecto, categoría, unidad, imagen, estado, soft delete.
- `ProductCategory`: árbol jerárquico con `parentId`.
- `PriceList` / `PriceListItem`: listas de precios por moneda y vigencia.
- `LocalizationTax`: impuesto asignable (IVA, IGTF, etc.).
- Variantes, lotes y series: modelados en el dominio objetivo; V1 sin variantes.
- Imágenes de producto: almacenamiento y endpoint.

**Reglas clave (INV-001..005):**

- Precio no negativo/cero en listas activas.
- Una categoría no puede ser padre de sí misma.
- Un producto con stock o transacciones no se elimina; se desactiva.
- Toda lista de precios tiene moneda.
- Variantes con combinación de atributos única.

**Eventos:** `ProductCreated`, `ProductUpdated`, `PriceChanged`, `CategoryChanged`.

**API:** `/inventory/products`, `/inventory/categories`, `/inventory/products/:id/image`, `/purchasing/price-lists`.

**Estado:** ✅ backend; ⚪ UI de productos/categorías (existen vistas de inventario).

---

### 6.5 Inventory

**Propósito:** decir “cuánto hay” y registrar todo movimiento con origen documentado.

**Alcance:**

- `Warehouse`: almacén por tenant.
- `Stock`: saldo por producto + almacén.
- `StockMovement`: entrada, salida, ajuste, transferencia; referencia al documento origen.
- `StockTransfer`: transferencia entre almacenes.
- `ReorderPoint`: punto de reorden y alerta de stock bajo.
- Ajustes de inventario (in/out) con auditoría.
- Descuento automático por evento `document.approved` (venta).
- Incremento por `GoodsReceipt` completado (compra).
- Consulta síncrona de disponibilidad para POS.
- Lotes/series: modelados en dominio; V1 sin exponer.

**Reglas clave (INV-020..024):**

- Stock no negativo salvo configuración “permitir stock negativo” (con auditoría).
- Transferencia no puede ser al mismo almacén.
- No reservar más de lo disponible salvo configuración.
- Lote vencido no disponible para venta.
- Todo movimiento tiene tipo y origen documentado; no hay movimientos huérfanos.
- Concurrencia: bloqueo pesimista para evitar sobreventa.

**Eventos:** `StockChanged`, `LowStockAlert`, `TransferCompleted`, `StockReserved`, `StockReleased`, `InsufficientStock`.

**API:** `/inventory/warehouses`, `/inventory/stock`, `/inventory/movements`, `/inventory/adjustments`, `/inventory/transfers`, `/inventory/reorder-points`.

**Estado:** ✅ backend; ⚪ UI; concurrencia 🔴 en la matriz pero H-001 la aborda.

---

### 6.6 Sales y POS

**Propósito:** vender rápido, sin errores, con trazabilidad documental y cobro inmediato.

**Alcance:**

- `PosSession`: apertura/cierre de turno ligada a caja y usuario.
- Draft de venta: crear/editar/eliminar con líneas; precios congelados al checkout.
- Checkout: crear `Document` y pasar a `pending_approval`.
- Pago: aprobar documento, descontar stock, registrar movimiento de caja; una sola transacción.
- Quick sale legacy (one-shot).
- Ventas por pedido/factura: `SalesOrder`, `SalesOrderLine`, `SalesInvoice`, `SalesReturn`, `SalesCommission`.
- Comisiones por vendedor.
- POS UI: terminal de una sola pantalla, búsqueda, carrito, cliente, cobro, comprobante.
- Atajos: F2 (cliente), F4 (buscar), F8 (pago), F10 (emitir), ESC, CTRL+N.
- Modo entrenamiento: no modifica inventario, caja ni documentos.
- Offline: IndexedDB + cola de reintentos; conflicto de stock last-write-wins con reconciliación manual.
- Consumidor final por defecto (80%+ de ventas sin cliente registrado).

**Reglas clave (INV-030..035):**

- Venta confirmada no vuelve a borrador.
- Factura emitida no se modifica; se anula con nota de crédito.
- Total = suma de líneas + impuestos − descuentos.
- Nota de crédito no mayor a la factura original.
- Cotización vencida no se convierte en pedido.
- Toda línea referencia un producto/servicio.
- No se cobra una factura ya pagada; un cobro no excede el saldo pendiente.
- Pago idempotente y con bloqueo de stock/caja.

**KPIs POS:**

| KPI | Objetivo |
|---|---|
| Tiempo promedio por venta | < 30 s |
| Clics para vender un producto | ≤ 3 |
| Tiempo para encontrar producto | < 2 s |
| Tiempo para cobrar | < 10 s |
| Uso sin mouse | 100% posible |
| Recuperar venta suspendida | < 5 s |
| Modo entrenamiento | Sin impacto en datos reales |

**Eventos:** `SaleConfirmed`, `InvoiceIssued`, `CreditNoteIssued`, `SaleCancelled`, `document.*`.

**API:** `/pos/sessions`, `/pos/sales/drafts`, `/pos/sales/checkout`, `/pos/sales/:id/pay`, `/pos/sales/quick`, `/sales/orders`, `/sales/invoices`, `/sales/returns`, `/sales/commissions`.

**Estado:** ✅ backend; UI terminal parcial; multi-pago 🔴; cancelación con reverso 🔴; cierre diario ⚪; offline ⚪.

---

### 6.7 Purchasing y Receiving

**Propósito:** cerrar el circuito proveedor → compra → recepción → stock → venta.

**Alcance Slice 1:**

- `PurchasingOrder`: orden de compra a proveedor con snapshots de proveedor.
- `PurchasingOrderLine`: producto, SKU, nombre, unidad, almacén, cantidad ordenada, costo, impuesto, descuento, total, cantidad recibida.
- `GoodsReceipt`: aggregate separado; estado `PENDING → RECEIVED`.
- `GoodsReceiptLine`: cantidad recibida, dañada, notas.
- Ciclo PO: `DRAFT → APPROVED → RECEIVING → COMPLETED`.
- `StockMovement(IN)` al completar recepción.
- Snapshots inmutables de proveedor, producto, costo y moneda.
- Price lists de compra.
- Modelo legacy `PurchaseOrder` vinculado a `Document` y `PurchaseReturn`.

**Reglas clave (INV-040..042):**

- No recibir más cantidad de la ordenada.
- No modificar una PO después de recibida parcial/totalmente.
- No recibir mercancía de una orden cancelada.
- No hay stock antes de completar la recepción.
- Purchasing no conoce Inventory directamente: emite eventos.

**Eventos:** `PurchaseOrderPlaced`, `GoodsReceived`.

**API:** `/purchasing/orders`, `/purchasing/receipts`, `/purchasing/price-lists`, `/tenants/:tenantId/purchase-orders` (v2).

**Estado:** 🟡; dos modelos paralelos (ver §7.11); recepciones parciales no expuestas en Slice 1.

---

### 6.8 Cash & Payments

**Propósito:** controlar el dinero: cajas, movimientos, métodos, bancos y arqueo.

**Alcance:**

- `CashRegister`: nombre, moneda, saldo, estado.
- `PosSession`: apertura/cierre de turno, saldo inicial/final.
- `CashMovement`: ingreso/egreso, referencia a documento, validación de saldo.
- `PaymentMethod`: efectivo, tarjeta, transferencia, cheque, pago móvil, Zelle, divisa, cripto (como medio genérico).
- `BankAccount`: cuentas bancarias.
- Arqueo de caja (X/Z), denominaciones, descuadre y aprobación.
- Cobros y pagos; cuentas por cobrar/pagar (CxC/CxP) como capacidad objetivo.
- Multi-pago y multi-moneda por venta (objetivo v0.4/v2).

**Reglas clave (INV-050..053):**

- Caja cerrada no acepta movimientos.
- Arqueo dentro de tolerancia configurable; si no, requiere aprobación.
- No cobrar una factura ya pagada.
- Un cobro no excede el saldo pendiente.
- No egresos mayores al saldo disponible.
- Concurrencia de saldo atómica.

**Eventos:** `CashTransactionRecorded`, `RegisterClosed`.

**API:** `/cash-payments/registers`, `/cash-payments/movements`, `/cash-payments/payment-methods`, `/cash-payments/bank-accounts`, `/cash-payments/audit`.

**Estado:** ✅ backend; ⚪ UI (existen vistas de cajas/métodos/bancos/arqueo); multi-pago 🔴; cierre Z ⚪; `Payment` como agregado ⚪.

---

### 6.9 Localization & Fiscal

**Propósito:** aplicar reglas fiscales, laborales y contables por país sin tocar el core.

**Alcance:**

- `LocalizationTax`: nombre, tasa, tipo, país, estado.
- `CurrencyRate`: from/to, tasa, fecha; histórica.
- Estrategia fiscal por país (`FiscalStrategy`): Venezuela y Colombia.
- **Venezuela:** IVA 16%/8%/31%, IGTF, retenciones (ISLR, IVA).
- **Colombia:** IVA 19%/5%, retenciones (Fuente, ICA, IVA).
- Endpoint `POST /fiscal/calculate`.
- Persistencia de desglose fiscal en `InvoiceTaxDetail`.
- Campos de facturación electrónica en `SalesInvoice`: `fiscalStatus`, `fiscalNumber`, `cufe`, `qrUrl`, `dianXml`, `fiscalError`, timestamps.
- Localización laboral (prestaciones, parafiscales, vacaciones) como fase posterior.

**Reglas clave (INV-090..092):**

- No dos reglas activas para el mismo impuesto/país/período.
- Todo cambio de regla tiene fecha de vigencia; no retroactivo salvo ley.
- No eliminar una regla referenciada; se desactiva.
- La tasa de cambio se congela al aprobar el documento.
- El core no conoce legislación; solo invoca la estrategia.

**Eventos:** `TaxRuleChanged`, `LocalizationUpdated`.

**API:** `/localization/taxes`, `/localization/rates`, `/fiscal/calculate`.

**Estado:** ✅ backend; ⚪ UI de impuestos/tasas; facturación electrónica ⚪ (solo campos).

---

### 6.10 Organization

**Propósito:** modelar la estructura (departamentos, cargos, asignaciones) separada de las personas.

**Alcance:**

- `Department`: jerarquía organizacional.
- `Position`: cargo/rol organizacional.
- `PositionAssignment`: asignación temporal de un empleado a un cargo, con historial.
- `Employee.managerEmployeeId`: relación de supervisión.

**Reglas clave:**

- Un empleado no puede tener dos cargos activos simultáneos en el mismo período (INV-070), salvo configuración.
- Las asignaciones son temporales y versionadas (ADR-0009).
- Organization no es People: estructura ≠ personal.

**API:** `/departments`, `/positions`, `/position-assignments`.

**Estado:** ✅ backend; ⚪ UI (existe `DepartmentListView`).

---

### 6.11 People y Employment

**Propósito:** separar la persona (`Employee`) de su relación laboral (`EmploymentRelationship`), con historial inmutable.

**Alcance:**

- `Employee`: datos personales, identificación, fecha de ingreso, departamento, cargo, estado, vínculo opcional a `User`.
- `EmploymentRelationship`: aggregate root de la relación laboral; estado, fechas, empleado, organización.
- `Contract`: tipo (full-time, part-time, fixed-term, temporary, internship, probation), fechas, moneda, estado, motivo.
- `CompensationAgreement` + `CompensationComponent`: historial salarial (nunca UPDATE; siempre INSERT).
- `EmploymentChange`: registro único de cualquier cambio (motivo obligatorio).
- `SalaryHistory`: modelo legacy en transición hacia `CompensationAgreement`.
- `ScheduleAssignment`: horario con historial (objetivo).

**Estados:**

- `EmploymentStatus`: `PENDING`, `ACTIVE`, `SUSPENDED`, `ON_LEAVE`, `TERMINATED`, `ARCHIVED`.
- `ContractStatus`: `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `CANCELLED`.

**Reglas clave (INV-070..073):**

- Employment ≠ Employee: la persona existe sin relación laboral.
- Nunca se modifica: salario, horario, cargo y cambios son nuevos registros.
- Un Employment tiene un contrato vigente (último sin `endDate`); los anteriores son histórico.
- El core no conoce legislación; Employment almacena hechos puros.
- Un empleado retirado no genera nuevas novedades/contratos.
- Fecha de inicio ≤ fecha de fin.
- No eliminar empleados con transacciones; se inactivan.
- Todo cambio requiere `EmploymentReason` (NEW_HIRE, PROMOTION, TRANSFER, SALARY_REVIEW, RESIGNATION, LAYOFF, etc.).

**Eventos:** `EmployeeHired`, `ContractUpdated`, `EmployeeTerminated`, `EmploymentStarted`, `EmploymentTerminated`, `CompensationChanged`.

**API:** `/employees`, `/employment-relationships`, `/contracts`, `/compensations`.

**Estado:** ✅ backend; ⚪ UI (existen vistas de empleados).

---

### 6.12 Payroll

**Propósito:** calcular y procesar nómina periódica sin acoplarse a RRHH ni a la persona.

**Alcance Slice 1:**

- `PayrollPeriod`: aggregate root; estado `OPEN → CALCULATING → LOCKED → PAID → CLOSED`.
- `Payslip`: snapshot inmutable del empleado, contrato, compensación, cargo, departamento, moneda, salario base y período.
- Generación desde `EmploymentRelationship` activos + `CompensationAgreement` vigente.
- Lock, pay, close.
- Cálculo de salario base únicamente (sin deducciones, prestaciones, impuestos ni conceptos variables en Slice 1).

**Reglas clave (INV-PAY-001..007 / INV-080..083):**

- Solo un período `OPEN` por tenant.
- No generar payslips fuera de `CALCULATING`.
- `LOCKED` impide regenerar.
- `PAID` es irreversible.
- `CLOSED` solo después de `PAID`.
- Un payslip es una fotografía inmutable; nunca se modifica; errores requieren nómina de corrección.
- No procesar dos veces el mismo período.
- No generar recibo para empleado inactivo/retirado.
- Neto no negativo.

**Eventos:** `payroll.period.generated`, `payroll.period.closed`.

**API:** `/payroll/periods`, `/payroll/periods/:id/generate`, `/lock`, `/pay`, `/close`, `/payslips`.

**Estado:** 🟡 slice 1; UI de períodos/detalle existe; cálculo avanzado ⚪.

---

### 6.13 Reports

**Propósito:** dar visibilidad operativa y exportables sin afectar la transacción.

**Alcance:**

- Dashboard ejecutivo: ventas hoy, facturado mes, stock bajo, movimientos de caja, clientes nuevos, gráficos simples, filtro por fecha.
- Reportes: ventas, inventario, caja (X/Z), clientes, impuestos, utilidad.
- Formatos: PDF (Puppeteer), XLSX (ExcelJS), CSV.
- Exportaciones asíncronas con BullMQ + Redis; notificación por Socket.io (`report.completed`); archivos en MinIO.
- `ReportDefinition`, `ReportExecution`, `ReportHistory` (retención 48 h, cleanup nocturno), `DashboardWidget`.
- Reportes programados por cron + email (objetivo).
- Respeto de multi-tenant y RBAC.

**Reglas clave:**

- Dashboard < 2 s con live queries.
- Exportación en background si > 10 MB o rango > 1 año (advertencia).
- Sin datos → mensaje claro.
- Timeout de 30 s en reportes en tiempo real; sugerir exportación.
- Un usuario sin permiso de módulo no ve sus datos.

**API:** `/reports/dashboard`, `/reports/definitions`, `/reports/execute`, `/reports/history`.

**Estado:** 🟡 (PDF/XLSX/dashboard); programación por email ⚪; UI de definiciones/historial existe.

---

### 6.14 Notifications (planificado)

**Propósito:** comunicar eventos relevantes al usuario (pago rechazado, stock bajo, reporte listo, nómina, aprobaciones).

**Alcance objetivo:** email transaccional, in-app, push (móvil), preferencias por usuario, plantillas multi-idioma, reintentos.

**Estado:** ⚪. Solo existe `main.gateway.ts` para Socket.io; no hay módulo de notificaciones.

---

### 6.15 Recurring Services (planificado)

**Propósito:** vender servicios con cobro periódico (mantenimiento, suscripciones, membresías), con generación automática de documentos y cobros.

**Alcance objetivo:** catálogo de servicios, plan/frecuencia, contrato de servicio, generación programada de factura, cobro recurrente, estado del servicio, cancelación/pausa.

**Estado:** ⚪. No existe módulo; el catálogo actual es de productos.

---

### 6.16 Financials / Accounting (planificado)

**Propósito:** contabilidad de partida doble, plan de cuentas, asientos, libros, balances, CxC/CxP, conciliación.

**Alcance objetivo:**

- `Account` (plan de cuentas), `JournalEntry` + líneas, `AccountingPeriod`, `CostCenter`, `TrialBalance`.
- Asientos automáticos desde `InvoiceIssued`, `CreditNoteIssued`, `CashTransactionRecorded`, `PayrollProcessed`.
- CxC/CxP, antigüedad de saldos, conciliación bancaria.
- Localización contable por país.

**Reglas clave (INV-060..063):**

- Debe = Haber.
- Asiento contabilizado inmutable; solo reversión.
- No contabilizar en período cerrado.
- Cuenta inactiva no recibe movimientos.

**Estado:** ⚪. El evento `JournalEntryPosted` está previsto; no hay implementación.

---

## 7. Modelo de datos

> `apps/api/prisma/schema.prisma` contiene ~66 modelos. Esta sección los agrupa por dominio y señala los modelos legacy/paralelos.

### 7.1 Plataforma

`Tenant`, `User`, `UserAccess`, `Role`, `Permission`, `RolePermission`, `UserRole`, `AuditLog`.

Campos clave:

- `Tenant`: `slug` único, `legalName`, `taxId` único, `baseCurrency`, `country`, `timezone`, `subscriptionPlan`, `status`, `enabledModules[]`, `settings`.
- `User`: `tenantId`, `email`, `passwordHash`, `name`, `imageUrl`, `locale`, `phone`, `status`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `employeeId` opcional.
- `UserAccess`: PK compuesta `(userId, tenantId)`, `roleId`, `isActive`.
- `AuditLog`: tenant, usuario, acción, entidad, before/after JSON, timestamp; inmutable.

### 7.2 Document Engine

`Document`, `DocumentLine`, `DocumentEvent`, `InvoiceTaxDetail`.

- `Document`: `tenantId`, `documentType`, `status`, `documentNumber`, `originalDocumentId`, `counterDocumentType`, `currency`, `exchangeRate`, `subtotal`, `taxTotal`, `discountTotal`, `grandTotal`, `notes`, `rejectionReason`, `createdById`, `approvedById`, `approvedAt`, `deletedAt`.
- `DocumentLine`: `documentId`, `lineNumber`, `description`, `quantity`, `unitPrice`, `taxRate`, `taxAmount`, `discountRate`, `discountAmount`, `lineTotal`, `productId`, `warehouseId`, `receivedQuantity`.
- `DocumentEvent`: `eventType`, `previousStatus`, `newStatus`, `payload`, `createdById`.
- `InvoiceTaxDetail`: `invoiceId`, `taxType`, `baseImponible`, `percentage`, `amount`, `isWithholding`.

### 7.3 Business Partners

`Partner`, `PartnerRole`, `PartnerTag`, `Contact`, `PartnerAddress`, `PartnerEvent`, `PartnerMigrationReview`, `PartnerMigrationMap`, `ContactInquiry`.

- `Partner`: `type` (PERSON/COMPANY), `legalName`, `taxIdValue`, `taxIdCountry`, `taxIdType`, `commercialName`, `website`, `status`, `metadataSource`, `metadataNotes`, `externalId`, `createdById`, `updatedById`, `deletedAt`; único `(tenantId, taxIdValue, taxIdCountry, taxIdType)`.
- `PartnerRole`: PK `(partnerId, role)`.
- `PartnerAddress`: tipo, líneas, ciudad, estado, país, postal, principal.
- `PartnerEvent`: `eventType`, `payload`, `occurredAt`.

### 7.4 Catálogo e inventario

`ProductCategory`, `Product`, `PriceList`, `PriceListItem`, `Warehouse`, `Stock`, `StockMovement`, `StockTransfer`, `ReorderPoint`.

- `Product`: SKU, nombre, precio, costo, `taxId`, categoría, unidad, imagen, estado, soft delete.
- `Stock`: `(productId, warehouseId)` con cantidad.
- `StockMovement`: tipo, cantidad, referencia documental, almacén, producto, timestamp.
- `StockTransfer`: origen/destino, líneas, estado.
- `ReorderPoint`: producto + almacén + umbral.

### 7.5 Ventas

`Client` (legacy), `SalesOrder`, `SalesOrderLine`, `SalesInvoice`, `SalesReturn`, `SalesCommission`.

- `SalesOrder`: `documentId` opcional, `clientId`, `status`, totales, moneda, `type` (`order`/`quote`), snapshots de cliente, `deliveredWarehouseId`.
- `SalesInvoice`: `documentId` único, `clientId`, `status`, totales, moneda/tasa, `paidAt`, `paymentMethodId`, `salespersonId`, `commissionRate`, campos fiscales (`fiscalStatus`, `fiscalNumber`, `cufe`, `qrUrl`, `dianXml`, `fiscalError`, timestamps).
- `SalesReturn`: factura, motivo, totales, estado.
- `SalesCommission`: vendedor, factura, tasa, monto.

### 7.6 Compras

`Vendor` (legacy), `PurchaseOrder` (legacy), `PurchaseReturn`, `PurchasingOrder`, `PurchasingOrderLine`, `GoodsReceipt`, `GoodsReceiptLine`.

- `PurchaseOrder`: `documentId` único, `vendorId`, `status`, totales, moneda, `expectedDate`, `receivedAt`.
- `PurchasingOrder`: `supplierId`, snapshots de proveedor, `status`, `version`, `completedAt`.
- `PurchasingOrderLine`: producto/SKU/nombre/unidad/almacén, cantidades, costo, impuesto, descuento, total, recibido.
- `GoodsReceipt`: PO, estado, `receivedAt`, notas.
- `GoodsReceiptLine`: línea PO, cantidad recibida/dañada, notas.

### 7.7 Caja y pagos

`CashRegister`, `PosSession`, `PaymentMethod`, `CashMovement`, `BankAccount`.

- `CashRegister`: nombre, moneda, saldo, activa.
- `PosSession`: caja, usuario, saldo inicial/final, estado, apertura/cierre.
- `CashMovement`: caja, tipo (in/out), monto, método, referencia documental, timestamp.
- `PaymentMethod`: nombre, tipo, moneda, estado.
- `BankAccount`: banco, cuenta, moneda, saldo.

### 7.8 Localización

`LocalizationTax`, `CurrencyRate`.

- `LocalizationTax`: nombre, tasa, tipo, país, activa.
- `CurrencyRate`: from/to, tasa, fecha; único `(tenantId, from, to, date)`.

### 7.9 Organización, empleo y nómina

`Department`, `Position`, `PositionAssignment`, `Employee`, `EmploymentRelationship`, `EmploymentChange`, `Contract`, `CompensationAgreement`, `CompensationComponent`, `SalaryHistory` (legacy), `PayrollPeriod`, `Payslip`.

- `Employee`: datos personales, identificación, ingreso, departamento, cargo, estado, `managerEmployeeId`, vínculo opcional a User.
- `EmploymentRelationship`: empleado, estado, fechas, organización.
- `Contract`: tipo, estado, fechas, moneda, motivo.
- `CompensationAgreement` + `CompensationComponent`: vigencia, tipo (SALARY/BONUS/ALLOWANCE/COMMISSION), monto, moneda.
- `EmploymentChange`: tipo de cambio, motivo, payload, vigencia.
- `PayrollPeriod`: estado, fechas, moneda, totales.
- `Payslip`: snapshot inmutable (empleado, contrato, compensación, cargo, departamento, salario base, período).

### 7.10 Reportes

`ReportDefinition`, `ReportExecution`, `ReportHistory`, `DashboardWidget`.

- `ReportDefinition`: tipo, config JSON, schedule cron, formato, destinatarios, enabled.
- `ReportExecution`: definición, estado, taskId, timestamps, MinIO bucket/key, tamaño, error.
- `ReportHistory`: tipo, formato, filtros, archivo, estado, `expiresAt` (48 h).
- `DashboardWidget`: tipo (kpi/chart/table), config, posición, tamaño.

### 7.11 Modelos legacy y duplicados (deuda de modelado)

| Duplicidad | Situación actual | Destino |
|---|---|---|
| `Client` / `Vendor` vs `Partner` | `SalesInvoice.clientId` y `PurchaseOrder.vendorId` siguen apuntando a `Client`/`Vendor`; `Partner` ya existe con compat layer | Migrar FKs a `Partner` y retirar `Client`/`Vendor` cuando la UI y reportes estén listos |
| `SalesOrder` / `SalesInvoice` vs `Document` | Modelos paralelos: la venta crea `Document` y además filas en `SalesOrder`/`SalesInvoice` | Consolidar en `Document` + proyecciones de lectura; evitar doble escritura |
| `PurchaseOrder` vs `PurchasingOrder` | Dos modelos de compra: el legacy ligado a `Document` y el slice nuevo con `GoodsReceipt` | Unificar en `PurchasingOrder` + `GoodsReceipt` y adaptar el legacy |
| `SalaryHistory` vs `CompensationAgreement` | `SalaryHistory` legacy convive con el modelo temporal nuevo | Migrar y retirar `SalaryHistory` |
| `PosSession.status` / `SalesInvoice.status` como `String` | Estados no tipados en algunos modelos | Reemplazar por enums y FSM explícitas |

> Esta tabla es la lista de trabajo de la deuda de modelado. Cualquier migración debe respetar ADR-0009 (temporalidad) y ADR-0010 (permanencia de identidad).

---

## 8. Superficie de API

Prefijo global: `/api/v1`. Los controladores actuales:

| Grupo | Controlador | Endpoints principales |
|---|---|---|
| Auth | `auth` | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Tenants | `tenants` | CRUD, activar/desactivar módulos, suspender |
| Users | `users` | CRUD, estado, roles, vínculo a empleado |
| RBAC | `roles`, `permissions` | CRUD de roles, asignación de permisos, asignación a usuarios |
| Auditoría | `admin/audit-logs` | Consulta paginada/filtrada |
| Métricas | `metrics` | Health y métricas técnicas/negocio |
| Documentos | `documents` | CRUD, query, aprobar, cancelar, contra-documentos, timeline |
| Partners | `partners` | CRUD, roles, contactos, direcciones, tags, búsqueda |
| Legacy terceros | `client-vendor` | `/clients`, `/vendors` con headers de deprecación |
| Catálogo | `inventory/products`, `inventory` | Productos, categorías, imágenes, listas de precio |
| Inventario | `inventory` | Almacenes, stock, movimientos, ajustes, transferencias, reorder points |
| POS | `pos`, `pos/sales` | Sesiones, drafts, checkout, pago, quick sale |
| Ventas | `sales` | Órdenes, facturas, devoluciones, comisiones |
| Compras | `purchasing`, `tenants/:tenantId/purchase-orders` | Órdenes, recepciones, price lists |
| Caja | `cash-payments` | Cajas, movimientos, métodos, bancos, arqueo |
| Localización | `localization`, `fiscal` | Impuestos, tasas, cálculo fiscal |
| Organización | `organization` | Departamentos, cargos, asignaciones |
| Empleados | `employee` | CRUD de empleados |
| Employment | `employment`, `contracts`, `compensations` | Relaciones, contratos, compensaciones |
| Nómina | `payroll` | Períodos, generate/lock/pay/close, payslips |
| Reportes | `reports` | Dashboard, definiciones, ejecución, historial |
| Contacto | `contact` | Formulario/consulta pública |
| Document Engine | `document.controller` | CRUD y transiciones |

**Convenciones:** DTOs con `class-validator`, respuestas con envelope consistente, errores con código, paginación `page/limit` o cursor, filtros por fecha/estado/tipo, scoping por tenant, RBAC por endpoint, idempotencia en mutaciones críticas.

---

## 9. Frontend y UX

### 9.1 Principios de interfaz

- **Alta densidad:** información compacta, sin ornamentación, para 8 h de uso.
- **Keyboard-first:** toda acción ejecutable sin mouse; atajos visibles.
- **Todo es un documento con estados:** badge de estado, color, acciones permitidas y timeline.
- **Una sola pantalla en POS:** sin navegación entre vistas.
- **Consistencia:** layout global fijo, scroll interno, headers fijos.
- **i18n:** español/inglés desde el día uno; locale del navegador, override por tenant y preferencia de usuario.
- **Accesibilidad:** WCAG 2.2, contraste, foco visible, lectores de pantalla, navegación por teclado.
- **Feedback:** toasts, skeletons, empty states, error catalog, recuperación.

### 9.2 Layout global

- **Sidebar** (240 px): módulos aprovisionados y permitidos por rol.
- **Header:** breadcrumbs, Command Palette (buscador global), selector de tenant/sucursal, tipo de cambio, usuario.
- **Canvas:** contenido con scroll interno independiente; headers fijos; grillas virtualizadas.

### 9.3 Rutas web

```text
/                    Dashboard
/login               Login
/pos/*               POS (terminal, sesión, cobro)
/inventory/*         Productos, categorías, almacenes, stock, transferencias,
                     clientes/proveedores legacy, empleados, departamentos,
                     monedas, fiscal, reorder points
/sales/*             Ventas / terminal POS
/purchasing/*        Órdenes de compra, recepciones, devoluciones, price lists
/cash/*              Cajas, movimientos, métodos, bancos, arqueo
/reports/*           Dashboard, definiciones, historial
/rbac/*              Roles y permisos
/users/*             Usuarios
/payroll/*           Períodos y detalle de nómina
/settings/*          Configuración del tenant
/profile             Perfil del usuario
```

### 9.4 Vistas implementadas (web)

- **Cash:** `BankAccountListView`, `CashAuditView`, `CashRegisterListView`, `PaymentMethodListView`.
- **Inventory:** `CategoryListView`, `ClientListView`, `CurrencyRateListView`, `DepartmentListView`, `EmployeeDetailView`, `EmployeeFormView`, `EmployeeListView`, `FichaTerceroView`, `FiscalConfigView`, `InventoryFormView`, `InventoryListView`, `ProductDetailView`, `ReorderPointListView`, `TransferListView`, `VendorListView`, `WarehouseListView`.
- **Payroll:** `PayrollDetailView`, `PayrollListView`.
- **Purchases:** `PriceListListView`, `PurchaseOrderDetailView`, `PurchaseOrderFormView`, `PurchaseOrderListView`, `PurchaseReturnListView`.
- **RBAC:** `RoleFormView`, `RoleListView`.
- **Reports:** `DashboardView`, `ReportDefinitionsView`, `ReportHistoryView`.
- **Sales/POS:** `POSTerminalView`.
- **Settings/Users:** `TenantSettingsView`, `UserFormView`, `UserListView`.

### 9.5 POS (experiencia)

**Experiencias:** PX-01 Abrir caja · PX-02 Buscar producto · PX-03 Carrito · PX-04 Cliente · PX-05 Cobro · PX-06 Finalizar.

**Layout:** una sola pantalla con zonas: búsqueda (foco persistente), resultados, carrito, cliente, totales, acciones, estado de sesión.

**Atajos:** F2 cliente, F4 búsqueda, F8 pago, F10 emitir, ESC cancelar/cerrar, CTRL+N nueva venta; navegación con flechas/Tab/Enter.

**Estado:** Zustand store dedicado (`session`, `currentSale`, `cart`, `payment`), persistencia de sesión en localStorage, TanStack Query para datos del servidor.

**Offline:** IndexedDB, cola de reintentos, sincronización al reconectar; conflictos de stock last-write-wins con ajuste manual.

**Modo entrenamiento:** interruptor global que desactiva efectos secundarios (inventario, caja, documentos).

**Dos experiencias:** POS Desktop (teclado + monitor) y POS Tablet (táctil + botones grandes), no responsive.

**Accesibilidad:** foco visible, contraste, etiquetas ARIA, sin dependencia de mouse.

---

## 10. Reglas de negocio transversales

### 10.1 Invariantes por dominio

| Dominio | Invariantes |
|---|---|
| Catalog | INV-001..005: precio > 0, categoría sin ciclos, producto con historial no se elimina, lista con moneda, variantes únicas |
| Partners | Identificación fiscal única por tenant/país/tipo; partner archivado no transacciona; historial de solo lectura |
| Inventory | INV-020..024: stock no negativo salvo config, transferencia a distinto almacén, no reservar de más, lote vencido bloqueado, movimiento con origen |
| Sales | INV-030..035: venta confirmada irreversible, factura inmutable, total consistente, NC ≤ factura, cotización vencida no convierte, línea con producto |
| Purchasing | INV-040..042: no sobre-recepción, PO recibida no se modifica, no recibir de PO cancelada |
| Cash | INV-050..053: caja cerrada sin movimientos, arqueo con tolerancia, no doble cobro, cobro ≤ saldo |
| Financials | INV-060..063: Debe = Haber, asiento inmutable, período cerrado bloqueado, cuenta inactiva sin movimientos |
| HR | INV-070..073: un cargo activo, retirado no genera novedades, fechas coherentes, no eliminar con historial |
| Payroll | INV-080..083: período no se procesa dos veces, no recibo para inactivo, neto ≥ 0, recibo inmutable |
| Localization | INV-090..092: una regla activa por impuesto/país/período, vigencia obligatoria, no eliminar regla referenciada |
| Configuration | INV-100..102: no desactivar módulo con transacciones activas, tipo de campo inmutable con datos, tenant siempre con plan |
| Cross-context | INV-200..204: venta requiere producto y stock, pago referencia documento, asiento respeta período, nómina requiere contrato vigente |

### 10.2 Máquinas de estado

| Entidad | Estados |
|---|---|
| Document | `draft → pending_approval → pending_fiscal → approved → posted → delivered → paid → cancelled` |
| Tenant | `active`, `suspended`, `inactive` |
| User | `active`, `blocked`, `inactive` |
| Partner | `ACTIVE → INACTIVE → BLOCKED → ARCHIVED` |
| Employment | `PENDING`, `ACTIVE`, `SUSPENDED`, `ON_LEAVE`, `TERMINATED`, `ARCHIVED` |
| Contract | `DRAFT`, `ACTIVE`, `EXPIRED`, `TERMINATED`, `CANCELLED` |
| PurchasingOrder | `DRAFT → APPROVED → RECEIVING → COMPLETED` |
| GoodsReceipt | `PENDING → RECEIVED` |
| PayrollPeriod | `OPEN → CALCULATING → LOCKED → PAID → CLOSED` |

**Regla:** la state machine solo define transiciones legales; no contiene reglas de negocio ni efectos secundarios. El aggregate decide cuándo transicionar; el use case orquesta y publica eventos.

### 10.3 Dinero y monedas

- Montos con `Decimal(15,2)` / `Decimal(15,4)` para cantidades y precios; nunca `float` en dominio nuevo.
- Moneda explícita en todo documento, lista de precios y caja.
- Tasa de cambio histórica; se congela al aprobar el documento.
- Multi-moneda: documento puede tener moneda distinta a la funcionalidad del tenant; conversión y redondeo requieren diseño dedicado (riesgo RT-01).
- Medios de pago multimoneda y multi-pago: objetivo, no implementado.
- Cripto se trata como medio de pago genérico, sin lógica específica en el core.

### 10.4 Tiempo y temporalidad

- Entidades de identidad permanente no almacenan estados temporales (ADR-0010).
- Cambios de salario, cargo, horario, contrato y estado se registran como nuevos registros con vigencia (ADR-0009).
- Soft delete y `deletedAt`; nunca DELETE físico de datos críticos.
- Historial inmutable: documentos, asientos, payslips, eventos.

### 10.5 Documentos y auditoría

- Todo movimiento económico genera documento.
- Documento aprobado inmutable; corrección por contra-documento o reverso.
- Numeración única por tenant y tipo.
- Auditoría con quién/qué/cuándo/antes/después; inmutable.
- Eventos inmutables; corrección por evento compensatorio.
- No se agrega un estado terminal sin ADR que cubra inventario, caja, documentos, impuestos, auditoría y eventos.

### 10.6 Stock

- El stock se descuenta al aprobar la venta, no al crear el draft.
- La recepción de compra incrementa stock solo al completar `GoodsReceipt`.
- Movimientos siempre referencian un documento o una operación.
- Concurrencia con bloqueo pesimista; no sobreventa.
- Stock negativo solo si el producto lo permite y con auditoría.
- Ajustes manuales requieren motivo y documento.

### 10.7 Caja

- Una caja cerrada no acepta movimientos.
- Apertura/cierre por turno y usuario.
- Arqueo con denominaciones, diferencia y tolerancia.
- No egresos mayores al saldo.
- Cobro idempotente y asociado a documento.
- Cierre Z y reporte X: objetivo (hoy no implementado).

---

## 11. Requisitos no funcionales

### 11.1 Rendimiento

| ID | Requisito | Objetivo |
|---|---|---|
| NFR-001 | Carga de dashboard | < 2 s en conexión promedio LATAM |
| NFR-002 | API CRUD p95 | < 300 ms |
| NFR-003 | API p99 | < 1 s (sin reportes pesados) |
| NFR-004 | Sincronización POS offline | < 5 s de latencia al reconectar |
| NFR-005 | Reportes pesados | Asíncronos con notificación |
| POS | Venta completa | < 30 s |
| POS | Cobro | < 10 s |
| POS | Búsqueda de producto | < 2 s |

### 11.2 Disponibilidad

| ID | Requisito | Objetivo |
|---|---|---|
| NFR-010 | Uptime mensual | > 99.5% |
| NFR-011 | Mantenimiento | ≤ 4 h/mes, domingo 2–6 AM local |
| NFR-012 | Recuperación | RTO < 4 h, RPO < 15 min |

### 11.3 Seguridad

- HTTPS/TLS 1.3; headers CSP, HSTS, X-Frame-Options.
- bcrypt costo ≥ 10; JWT corto + refresh rotativo; rate limiting por endpoint/tenant.
- Auditoría de acceso a datos sensibles; aislamiento total entre tenants.
- Mínimo privilegio; RBAC en el 100% de operaciones.
- Protección de datos: LOPDP (VE), Ley 1581 (CO), LGPD (BR); derecho al olvido y exportación.

### 11.4 Escalabilidad

- 100+ tenants activos por instancia.
- API stateless, escalado horizontal.
- Hasta 1M transacciones/mes por tenant sin degradación.
- Archivos en S3-compatible (MinIO), no filesystem local.

### 11.5 Mantenibilidad

- Cobertura unitaria > 80%; E2E > 60% en módulos core.
- TypeScript estricto.
- JSDoc en APIs y entidades complejas.
- Sin dependencias sin mantenimiento.
- ADR para decisiones importantes.

### 11.6 i18n y compatibilidad

- UI traducible por archivos i18n; contenido generado en idioma del tenant.
- Landing ES/EN.
- Chrome, Firefox, Edge, Safari (últimas 2 versiones).
- Resolución mínima 1024×768; diseño para 1366×768+.
- Sin dependencia de JS deshabilitado en frontend.

### 11.7 Datos y compliance

- Backups diarios, retención 30 días.
- Logs de acceso/operaciones ≥ 2 años.
- Exportación y eliminación por tenant a solicitud.

---

## 12. Testing y Definition of Done

### 12.1 Estrategia

| Nivel | Herramienta | Alcance |
|---|---|---|
| Unitario | Jest | State machines, entidades, invariantes, use cases |
| Integración | Jest + PostgreSQL real | Repositorios, transacciones, concurrencia |
| Contrato | Supertest / schema | Forma HTTP de endpoints críticos |
| E2E API | Supertest | Flujos completos (documento, POS) |
| Unitario web | Vitest | Componentes, stores, utilidades |
| E2E web | Playwright | POS completo, teclado, accesibilidad |
| Concurrencia | Jest | Dos pagos simultáneos, dos aprobaciones |

**TDD obligatorio.** No se considera terminado un cambio sin pruebas que fallen antes y pasen después.

### 12.2 Definition of Done

- [ ] Requisito implementado y probado (unit + integración cuando aplique).
- [ ] TypeScript compila sin errores.
- [ ] Lint pasa.
- [ ] Contrato de API actualizado.
- [ ] Auditoría y eventos implementados.
- [ ] Multi-tenant respetado.
- [ ] RBAC aplicado.
- [ ] Manejo de errores y estados vacíos.
- [ ] Documentación del módulo/spec actualizada.
- [ ] Sin regresiones en la suite existente.

### 12.3 Estado de pruebas

- 450+ pruebas unitarias (Jest), decenas de suites.
- Existe E2E de ciclo de vida de documento.
- Playwright E2E del POS: pendiente.
- Contract tests e integración con DB real: pendientes en varios módulos.
- Cobertura objetivo > 80%; no verificada de forma global.

---

## 13. Roadmap

### 13.1 Fases de producto (largo plazo)

| Fase | Foco | Criterio de salida |
|---|---|---|
| **P-0 Fundación** | Monorepo, multi-tenant, auth, landing, Docker, CI/CD, i18n | Completo |
| **P-1 Core operativo** | Catálogo, inventario, terceros, ventas, caja, compras, dashboard, configuración V1, localización VE | 3 clientes de pago activos en Starter+ |
| **P-2 Gestión financiera** | Contabilidad, CxC/CxP, conciliación, localización CO/DIAN | MRR > USD 5K |
| **P-3 Talento humano** | RRHH, nómina, localización laboral VE/CO | MRR > USD 20K |
| **P-4 Expansión** | Más países, API pública, móvil, marketplace | MRR > USD 50K |
| **P-5 Ecosistema** | Argos, CRM, Help Desk, BI, E-commerce, API marketplace | — |

Timeline tentativo: P-1 Q3 2026 · P-2 Q1 2027 · P-3 Q3 2027 · P-4 2028 · P-5 2029+.

### 13.2 Releases cercanos

| Release | Objetivo | Alcance |
|---|---|---|
| **v0.1 POS V1** (actual) | Primer flujo end-to-end | Partners, RBAC/Users, POS draft/checkout/payment |
| **v0.2 POS Resiliente** | Sobrevivir en producción | Idempotencia, concurrencia stock/caja, eventos, métricas, contract/integration tests |
| **v0.3 POS Terminal** | POS usable en navegador | Terminal, búsqueda, cliente, checkout, confirmación, comprobante, Playwright E2E |
| **v0.4 POS Cierre** | POS completo | Cierre de sesión, multi-pago, cancelación con reverso, reporte diario |
| **v1.0 ERP Core** | Base para vender | POS resiliente, cobertura 90%, contract tests, E2E, métricas, outbox documentado; compras, cotizaciones, devoluciones, dashboard |
| **v2.0+** | Expansión | E-commerce, multi-moneda POS, offline, RRHH/nómina, activos fijos, presupuestos |

> El roadmap de producto (P-0..P-5) y el de releases (v0.1..v2.0) son compatibles: los releases son la ejecución táctica de la fase P-1/P-2.

---

## 14. Estado actual real

### 14.1 Implementado y funcionando

- Multi-tenant con aislamiento, auth JWT, RBAC (82 permisos), usuarios, auditoría, eventos, soft delete.
- Document Engine completo (FSM, numeración, eventos, auditoría, contra-documentos parciales).
- Business Partners backend + compat layer `Client`/`Vendor`.
- Catálogo, inventario, stock, movimientos, transferencias, reorder points.
- POS backend: sesión, draft, checkout, pago, quick sale; UI terminal parcial.
- Caja: cajas, movimientos, métodos, bancos; UI de vistas.
- Localización/fiscal: impuestos, tasas, estrategia VE/CO, endpoint de cálculo.
- Organización, empleados, employment, contratos, compensaciones.
- Nómina slice 1 (período + payslip salario base).
- Reportes: dashboard, PDF/XLSX, definiciones/historial.
- Docker Compose completo y CI/CD.

### 14.2 Hardening transaccional (H-001) — implementado, matriz desactualizada

Ya está en código:

- `IdempotencyInterceptor` en checkout/pago (`pos-sale.controller.ts`), Redis TTL 3600 s.
- `SELECT ... FOR UPDATE` para stock en `pos-sale.service.ts`.
- Pago y descuento de stock en una sola transacción.
- Eventos publicados después del commit.
- `doPay()` extraído (ADR-0008).

Pendiente de H-001:

- Outbox pattern formal.
- Reintentos de handlers de eventos.
- Métricas de negocio completas.
- Contract tests e integration tests con DB real.
- Concurrencia de saldo de caja (más allá del stock).

### 14.3 Brechas funcionales confirmadas

| Brecha | Impacto |
|---|---|
| No existe agregado `Payment` | El pago es `SalesInvoice.paymentMethodId` + `CashMovement`; no hay split, estado ni reverso de pago |
| Multi-moneda parcial | `Document.currency/exchangeRate` y `CashRegister.currency`, pero POS y pagos asumen una moneda |
| Multi-pago no implementado | `PaymentPanel` solo permite un método y una moneda |
| Sin cierre Z / arqueo completo | No hay denominaciones, descuadre, reporte X/Z |
| Sin reversos/cancelación con stock | Cancelar venta no revierte stock/caja de forma completa |
| Sin servicios recurrentes | Solo productos; no hay suscripciones ni cobro periódico |
| Sin notificaciones | Solo gateway Socket.io; no hay email/push/in-app |
| Nómina solo salario base | Sin deducciones, prestaciones, impuestos, conceptos variables |
| `SalesInvoice.clientId` → `Client` legacy | No migrado a `Partner` |
| Dos modelos de compra | `PurchaseOrder` legacy vs `PurchasingOrder` nuevo |
| Dos modelos de venta | `SalesOrder`/`SalesInvoice` vs `Document` |
| Sin contabilidad | Financials no implementado |
| Sin facturación electrónica | Solo campos en `SalesInvoice`; no hay integración SENIAT/DIAN |
| POS UI incompleta | Terminal existe, pero faltan flujos de cierre, offline, multi-pago, accesibilidad completa |
| Matriz de capacidades desactualizada | Subestima H-001 y la UI existente |

---

## 15. Brechas y decisiones abiertas

Estas decisiones deben resolverse antes de convertir las brechas en implementación. No son tareas; son definiciones de producto/arquitectura.

| # | Decisión | Opciones | Impacto |
|---|---|---|---|
| D-01 | Dirección de integración con el ERP de referencia (Colores y Detalles) | Atrio absorbe capacidades vs ERP nuevo derivado | Define roadmap, modelo de datos y migración |
| D-02 | Histórico vs saldos | Conservar todo el histórico vs migrar solo saldos abiertos | Volumen, reportes, auditoría |
| D-03 | Stock en pedidos | Reservar al pedido vs descontar al pago | Inventario, concurrencia, POS |
| D-04 | Moneda de pago | Una moneda por documento vs una por pago | Multi-moneda, caja, contabilidad |
| D-05 | Modelo de servicios | Producto con tipo “servicio” vs agregado `Service` separado | Catálogo, facturación recurrente, inventario |
| D-06 | Alcance contable | Solo CxC/CxP vs contabilidad completa | Financials, localización, esfuerzo |
| D-07 | Facturación electrónica | VE primero vs CO primero vs ambos | Localización, certificaciones, alianzas |
| D-08 | Multi-sucursal | Tenant único vs sucursales como dimensión | Inventario, caja, RBAC, reportes |
| D-09 | Móvil | Solo consulta/aprobación vs POS móvil | UX, offline, seguridad |
| D-10 | Agregado `Payment` | Introducirlo ahora vs extender `CashMovement` | Split payments, reversos, conciliación |
| D-11 | Migración `Client`/`Vendor` → `Partner` | Big bang vs incremental con feature flags | Riesgo, compatibilidad, reportes |
| D-12 | Reversos y estados terminales | Implementar ahora vs ADR previo | Inventario, caja, documentos, impuestos, auditoría |
| D-13 | Outbox pattern | Implementar vs documentar | Consistencia de eventos, reintentos |
| D-14 | Nómina profunda | Slice 2 (deducciones) vs localización laboral primero | RRHH, cumplimiento, esfuerzo |

**Regla:** ninguna de estas decisiones se implementa sin ADR cuando afecte más de un bounded context. Las que impactan inventario, caja, documentos, impuestos o auditoría requieren ADR explícito (regla de estados terminales).

---

## 16. Anexo A — Documentos fuente consolidados

### 16.1 Producto y estrategia

- `specs/000-product-charter.md` — constitución del producto, límites, prioridades.
- `specs/001-constitution.md` — 10 artículos.
- `specs/P-1-product-design/000-mission.md` — misión.
- `specs/P-1-product-design/001-product-vision.md` — visión, qué es/no es, tesis.
- `specs/P-1-product-design/002-product-principles.md` — PR-001..013.
- `specs/P-1-product-design/003-target-market.md` — mercado, perfiles, industrias.
- `specs/P-1-product-design/004-business-model.md` — SaaS, canales, costos.
- `specs/P-1-product-design/005-pricing-strategy.md` — planes y precios.
- `specs/P-1-product-design/006-competitive-analysis.md` — competencia.
- `specs/P-1-product-design/007-roadmap.md` — fases P-0..P-5.
- `specs/P-1-product-design/008-non-functional-requirements.md` — NFR.
- `specs/P-1-product-design/009-glossary.md` — glosario.
- `specs/P-1-product-design/010-risks.md` — riesgos técnicos/comerciales/legales.

### 16.2 Arquitectura

- `specs/001-architecture/001-system-architecture.md` — arquitectura.
- `specs/001-architecture/002-folder-structure.md` — carpetas.
- `specs/001-architecture/003-coding-standards.md` — estándares.
- `specs/001-architecture/004-dependency-rules.md` — dependencias.
- `specs/001-architecture/005-module-template.md` — plantilla de módulo.
- `specs/001-architecture/006-event-guidelines.md` — eventos.
- `specs/001-architecture/007-testing-strategy.md` — testing.
- `specs/001-architecture/008-security-model.md` — seguridad.
- `specs/001-architecture/009-api-guidelines.md` — API.
- `specs/001-architecture/010-observability.md` — observabilidad.

### 16.3 Implementación

- `specs/002-implementation/001-development-strategy.md` — estrategia.
- `specs/002-implementation/002-mvp-definition.md` — MVP.
- `specs/002-implementation/003-module-priority.md` — prioridad P0–P4.
- `specs/002-implementation/004-release-strategy.md` — releases.
- `specs/002-implementation/005-testing-plan.md` — plan de pruebas.
- `specs/002-implementation/006-database-strategy.md` — base de datos.
- `specs/002-implementation/007-migration-strategy.md` — migraciones.
- `specs/002-implementation/008-versioning-strategy.md` — versionado.
- `specs/002-implementation/009-definition-of-done.md` — DoD.

### 16.4 Dominio y módulos

- `specs/P-2-domain-discovery/010-bounded-contexts.md` — 11 BC.
- `specs/P-2-domain-discovery/011-context-map.md` — relaciones.
- `specs/P-2-domain-discovery/012-event-storming.md` — eventos.
- `specs/P-2-domain-discovery/013-business-capabilities.md` — capacidades.
- `specs/P-2-domain-discovery/014-architecture-readiness-review.md` — readiness.
- `specs/P-2-domain-discovery/015-domain-invariants.md` — invariantes.
- `specs/P-2-domain-discovery/016-ownership-matrix.md` — ownership.
- `specs/P-2-domain-discovery/017-quality-attributes.md` — atributos de calidad.
- `specs/001-core-foundations/spec.md` — multi-tenant, auth, RBAC, User/Employee.
- `specs/002-document-engine/spec.md` — document engine.
- `specs/003-core-architecture/spec.md` — arquitectura core y módulos.
- `specs/003-business-partners/*` — visión, modelo, casos de uso, eventos, API, migración, UI, aceptación, rollout, CCR-01.
- `specs/004-employment/*` — visión, modelo, casos de uso, eventos, API, localización, aceptación, contratos, compensación, CCR-01.
- `specs/004-payroll/001-payroll-slice-1.md` — nómina slice 1.
- `specs/005-inventory-receiving/*` — compras y recepción.
- `specs/004-a-reportes/spec.md` — reportes.
- `specs/004-b-frontend/spec.md` — frontend.
- `specs/004-erp-backlog/*` — backlog.
- `specs/005-epic-01-pos-flow/*` — decisiones y plan del flujo POS.

### 16.5 Producto, POS y calidad

- `specs/006-product-capabilities/capability-matrix.md` — matriz de capacidades.
- `specs/006-product-capabilities/epic-status.md` — estado de epics.
- `specs/006-product-capabilities/release-roadmap.md` — releases.
- `specs/006-product-capabilities/transaction-boundaries.md` — límites transaccionales.
- `specs/006-product-capabilities/epic-h-001-transaction-hardening.md` — H-001.
- `specs/007-pos-experience/000-epic-overview.md` — POSX.
- `specs/007-pos-experience/001-user-journeys.md` — journeys.
- `specs/007-pos-experience/002-screen-flow.md` — pantalla.
- `specs/007-pos-experience/003-keyboard-first.md` — teclado.
- `specs/007-pos-experience/004-state-management.md` — estado.
- `specs/007-pos-experience/005-offline-strategy.md` — offline.
- `specs/007-pos-experience/006-performance-budget.md` — performance.
- `specs/007-pos-experience/007-accessibility.md` — accesibilidad.
- `specs/007-pos-experience/008-ui-guidelines.md` — UI.
- `specs/007-pos-experience/009-acceptance-criteria.md` — aceptación.
- `specs/008-product/001-personas.md` — personas.
- `specs/008-product/002-customer-journey.md` — journey.
- `specs/008-product/003-empty-states.md` — empty states.
- `specs/008-product/004-error-catalog.md` — errores.
- `specs/008-product/005-design-philosophy.md` — filosofía de diseño.
- `specs/008-product/006-hardware-support.md` — hardware.
- `specs/008-product/interaction-guidelines.md` — interacción.
- `specs/009-usability/001-observation-log.md` — observaciones.
- `specs/009-usability/002-time-motion-study.md` — time-motion.
- `specs/009-usability/003-product-metrics.md` — métricas.
- `specs/009-usability/004-fatigue-analysis.md` — fatiga.
- `specs/009-usability/UX-DEBT.md` — deuda UX.
- `specs/engineering/testing-strategy.md` — testing.
- `specs/release/production-readiness.md` — readiness.

### 16.6 Decisiones

- `docs/adr/ADR-0001..0008` — monolito, API-first, localization, DDD, eventos, carpetas, transacciones, payment.
- `specs/architecture/decisions/ADR-0009-temporal-relationships.md` — temporalidad.
- `specs/architecture/decisions/ADR-0010-identity-permanence.md` — permanencia de identidad.

### 16.7 Código de referencia

- `apps/api/prisma/schema.prisma` — modelo de datos.
- `apps/api/src/modules/` — implementación por bounded context.
- `apps/web/src/modules/` — implementación por módulo.
- `apps/web/src/routes/AppRoutes.tsx` — rutas.
- `apps/api/src/main.ts` — prefijo, pipes, guards.
- `docker-compose.yml` — infraestructura.
- `AGENTS.md` — convenciones del proyecto.

---

## 17. Anexo B — Capacidades del ERP de referencia (Colores y Detalles)

> **Estado:** no canónico. Este anexo registra capacidades observadas en el ERP de referencia del usuario y su posible absorción por Atrio. No forma parte del alcance aprobado hasta que exista ADR y spec. Se incluye para que el documento maestro sea completo respecto a lo conversado.

### 17.1 Sistema de referencia

- **Móvil:** Expo SDK 58, React Native 0.88, Expo Router, NativeWind, React Native Paper.
- **Web:** Node ESM, Express 5, Sequelize 6, MySQL 8.4, Handlebars SSR, BullMQ, PDFKit, Socket.io.
- **Alcance observado:** ventas, pedidos, abonos, pagos mixtos/multimoneda, caja/arqueo, inventario, compras, clientes/proveedores, servicios, reportes, notificaciones, usuarios/roles, configuración.

### 17.2 Mapeo de capacidades → Atrio

| Capacidad de referencia | Estado en Atrio | Acción candidata |
|---|---|---|
| Ventas POS | ✅ backend, UI parcial | Completar UI y cierre |
| Pedidos con saldo y abonos | 🟡 `SalesOrder` sin saldo/abonos | Diseñar CxC y pagos parciales |
| Pagos mixtos y multimoneda | 🔴 | Introducir agregado `Payment` + split |
| Caja, arqueo, cierre Z | 🟡 caja; Z ⚪ | Implementar arqueo/denominaciones/Z |
| Inventario y compras | ✅/🟡 | Unificar modelos de compra |
| Servicios recurrentes | ⚪ | Definir `Service` y cobro periódico |
| Notificaciones | ⚪ | Módulo de notificaciones |
| Reportes operativos | 🟡 | Ampliar reportes y programación |
| Usuarios/roles | ✅ | RBAC ya cubierto |
| Configuración multi-sucursal | ⚪ | Decidir D-08 |

### 17.3 Qué NO migrar

- La arquitectura Express/Handlebars/MySQL del sistema de referencia.
- El modelo monolítico de pedidos si impide la separación `Document`/`Payment`/`Cash`.
- Lógica fiscal hardcodeada.
- Vistas SSR como base del frontend de Atrio (Atrio es React 19 + Vite).
- Cualquier flujo que no tenga una observación real (regla Alpha-1).

### 17.4 Principios para la absorción

1. No se copia código; se traduce el **comportamiento** al lenguaje ubicuo de Atrio.
2. Toda capacidad absorbida entra por un bounded context existente o por un ADR que cree uno nuevo.
3. No se rompe el modelo `Document` + `Partner` + `Payment` por conveniencia de migración.
4. La migración de datos es incremental, con feature flags y compat layer, igual que `Client`/`Vendor` → `Partner`.
5. Cada capacidad absorbida debe tener spec, pruebas y criterio de aceptación antes de entrar al POS.

---

*Fin del documento. Para cambios, editar la sección afectada y actualizar la fecha de vigencia. Para nuevas capacidades, primero ADR/spec; después este documento.*
