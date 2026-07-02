# ODALX ERP — Backlog de Gaps

> **Generado**: 2026-06-30
> **Origen**: Auditoría post-spec 003 vs Visión ODALX completa
> **Estado del core**: ~40% de la visión total implementada

## Priorización

| Prio | Área | Prioridad | Spec | Estado actual |
|------|------|-----------|------|---------------|
| P1 | **Reportes** | 🔴 Alta | `004-a-reportes` | 0% — No existe nada |
| P2 | **Frontend UI** | 🔴 Alta | `004-b-frontend` | ~5% — Solo shell + i18n |
| P3 | **Sales endpoints faltantes** | 🔴 Alta | `004-c-sales` | PATCH/DELETE faltantes, pagos, devoluciones |
| P4 | **Purchasing endpoints faltantes** | 🔴 Alta | `004-d-purchasing` | Recepción parcial, PATCH/DELETE |
| P5 | **POS (Punto de Venta)** | 🟡 Media | `004-e-pos` | 0% — No existe |
| P6 | **Factura electrónica LATAM** | 🟡 Media | `004-f-electronic-invoice` | 0% — No existe |
| P7 | **Inventory avanzado** | 🟡 Media | `004-g-inventory-advanced` | Lotes, seriales, transferencias |
| P8 | **Cash avanzado** | 🟡 Media | `004-h-cash-advanced` | Cuentas bancarias, comisiones |
| P9 | **Employee/HR** | 🟢 Baja | `004-i-hr` | ~30% — Solo básico, sin nómina |
| P10 | **Localization avanzado** | 🟢 Baja | `004-j-localization` | Períodos fiscales, retenciones |

## Detalle de cada gap

### P1 — Reportes
- **Estado**: 0%
- **Requiere**: Módulo de reportes con generación PDF/Excel/CSV, dashboards, reportes predefinidos (ventas, inventario, caja, impuestos, clientes, utilidad)
- **Backend**: Endpoints de datos agregados, servicio de generación de reportes
- **Frontend**: Dashboard visual, descarga de reportes

### P2 — Frontend UI
- **Estado**: ~5% (solo `App.tsx` con heading + i18n)
- **Requiere**: Pantallas para cada módulo (inventory, sales, purchasing, cash, client-vendor, localization, employees)
- **Stack**: React 19 + Vite 6 + Tailwind CSS 4 (ya configurado)
- **Backend**: APIs ya existen para todos los módulos

### P3 — Sales endpoints faltantes
- **Estado**: Órdenes y facturas tienen create/list/get pero faltan PATCH, DELETE
- **Faltan**: PATCH/DELETE orders, PATCH/DELETE invoices, payment registration, returns flow, commissions

### P4 — Purchasing endpoints faltantes
- **Estado**: POs tienen create/list/get/receive pero faltan PATCH, DELETE
- **Faltan**: PATCH/DELETE orders, recepción parcial, devoluciones, price lists

### P5 — POS
- **Estado**: 0%
- **Requiere**: Terminal/caja POS, quick-sale flow, cart management, sesiones de POS, integración con impresión

### P6 — Factura electrónica LATAM
- **Estado**: 0%
- **Requiere**: Documentos electrónicos con firma digital, validación SENIAT (Venezuela), XML/JSON fiscales, numeración fiscal

### P7 — Inventory avanzado
- **Estado**: ~55% (mejor módulo)
- **Faltan**: Lotes, números de serie, transferencias entre almacenes, puntos de reorden, conteos físicos, unidades de medida múltiples, imágenes de producto

### P8 — Cash avanzado
- **Estado**: ~40%
- **Faltan**: Cuentas bancarias, comisiones por método de pago, conciliación bancaria, plazos de pago, informes X/Z

### P9 — Employee/HR
- **Estado**: ~30%
- **Faltan**: PATCH employee, cargos/departamentos como entidades, historial salarial, contratos, asistencia, nómina (futuro)

### P10 — Localization avanzado
- **Estado**: ~35%
- **Faltan**: Configuración por país (no solo tax), períodos fiscales, numeración fiscal por serie, retenciones de IVA/ISLR
