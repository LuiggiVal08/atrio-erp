# Product Roadmap

## Configurabilidad por fase

| Fase | Nivel | Descripción |
|------|-------|-------------|
| P-1 | Nivel 2 | Configuración por empresa, módulos activables, campos personalizados, catálogos configurables, preferencias por entidad, estados configurables |
| P-2/P-3 | Nivel 3 | Workflows configurables (flujos de aprobación, reglas de negocio) |
| P-4+ | Nivel 4 | Framework de plugins para extensiones de terceros |

## Fases

### P-0 — Fundación (actual)

Setup tecnológico base:
- Monorepo NestJS + React + Vite + PostgreSQL
- Multi-tenant con slugs y UserAccess
- Auth, login, switch de tenant
- Landing page multi-idioma
- Docker dev/prod
- CI/CD básico
- i18n (es/en)
- Contact form

---

### P-1 — Core operativo (próximo)

Módulos que forman el corazón del ERP:
- **Catálogo** — productos, categorías, variantes, precios, impuestos
- **Inventario** — almacenes, movimientos, ajustes, transferencias
- **Clientes y proveedores** — CRM básico, contactos, direcciones
- **Ventas** — facturación, cotizaciones, notas de crédito/débito
- **Caja** — apertura/cierre, movimientos de caja, arqueo
- **Compras** — órdenes de compra, recepciones, cuentas por pagar
- **Dashboard** — reports básicos, indicadores clave
- **Configuración V1** — módulos activables, campos personalizados, preferencias por entidad
- **Localización V1** — Venezuela (IVA, IGTF, retenciones ISLR)

---

### P-2 — Gestión financiera

- **Contabilidad** — plan de cuentas, libro diario, libro mayor, balances
- **Cuentas por cobrar / pagar**
- **Conciliación bancaria**
- **Localización Colombia** — DIAN, facturación electrónica, RUT, retenciones

---

### P-3 — Talento humano

- **RRHH** — empleados, departamentos, cargos, contratos, historial
- **Nómina** — conceptos, períodos, liquidación, recibos
- **Localización Venezuela** — prestaciones sociales, utilidades, paro forzoso, FAOV, IVSS
- **Localización Colombia** — SBC, parafiscales, cesantías, primas, vacaciones

---

### P-4 — Expansión

- **Más países** — México (CFDI), Perú, Chile, España
- **API pública** — documentada, versionada, con rate limiting
- **Móvil** — app para consulta y aprobaciones
- **Marketplace de módulos** — terceros pueden construir sobre la plataforma

---

### P-5 — Ecosistema ODALX

- **ARGOS (ATS)** — reclutamiento y selección
- **CRM** — gestión de relaciones con clientes
- **Help Desk** — tickets, SLA, base de conocimiento
- **BI** — inteligencia de negocio, dashboards personalizados
- **E-commerce** — tienda online integrada
- **API Marketplace** — conectores para bancos, gobierno, logística

---

## Timeline tentativo

```
P-0: Fundación      → Completo
P-1: Core operativo → Q3 2026
P-2: Financiero     → Q1 2027
P-3: Talento humano → Q3 2027
P-4: Expansión      → 2028
P-5: Ecosistema     → 2029+
```

## Criterios de paso entre fases

| Fase | Criterio de salida |
|------|-------------------|
| P-0 → P-1 | Landing + auth + multi-tenant funcional en producción |
| P-1 → P-2 | Mínimo 3 clientes de pago activos en Starter+ |
| P-2 → P-3 | MRR recurrente > $5K |
| P-3 → P-4 | MRR recurrente > $20K |
| P-4 → P-5 | MRR recurrente > $50K |
