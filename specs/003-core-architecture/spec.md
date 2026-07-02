# Core Architecture & Domain Modules

**Version**: 1.0.0-draft | **Status**: Planning | **Dependencies**: 002-document-engine

---

## Overview

Implementar la arquitectura base del ERP: estructura de módulos de dominio multi-tenant, tablas de datos maestros (productos, clientes, proveedores, caja, compras), el Localization Engine (impuestos, tasas de cambio) y el Event Bus para impacto cross-module. Todo orquestado por el Document Engine (002) como sistema nervioso central.

---

## User Stories

### US1 — Tenant Module Activation
**Como** super-admin de tenant  
**Quiero** activar/desactivar módulos (sales, inventory, cash-payments, purchasing, hr) por tenant  
**Para** que cada empresa solo vea los módulos que contrató

**Criterios de Aceptación**:
- `tenants.enabled_modules` es un `TEXT[]` con los slugs de módulos activos
- Al hacer login, el JWT incluye `enabledModules`
- El frontend oculta módulos no activos
- El backend rechaza requests a módulos desactivados con 403

---

### US2 — Product & Inventory Management
**Como** usuario de inventario  
**Quiero** gestionar productos, categorías, almacenes y stock  
**Para** mantener el catálogo y saber cuánto tengo de cada producto

**Criterios de Aceptación**:
- CRUD de categorías (árbol jerárquico con `parentId`)
- CRUD de productos con SKU único, precio, costo, impuesto asignable
- CRUD de almacenes por tenant
- Stock tracking por producto + almacén
- Movimientos de stock (entrada, salida, transferencia) con referencia al documento que lo originó
- Soft-delete en productos (no se pierde histórico)

---

### US3 — Client & Vendor Registry
**Como** usuario del sistema  
**Quiero** registrar clientes y proveedores con su documentación fiscal (RIF, CI, J-)  
**Para** poder emitir documentos a nombre de terceros

**Criterios de Aceptación**:
- CRUD de clientes con `documentId` único por tenant
- CRUD de proveedores con `documentId` único por tenant
- Soft-delete en ambos
- Relacionables con documentos (ventas/compras)

---

### US4 — Localization Engine
**Como** administrador del tenant  
**Quiero** configurar impuestos (IVA, IGTF, retenciones) y tasas de cambio  
**Para** que los documentos se calculen con las reglas fiscales del país

**Criterios de Aceptación**:
- CRUD de tasas de impuesto (nombre, tasa %, país, tipo)
- CRUD de tasas de cambio (from, to, rate, date)
- Las tasas de cambio se fijan históricamente al momento de aprobar un documento
- Cada producto puede tener un impuesto asignado por defecto

---

### US5 — Cash & Payment Methods
**Como** usuario de caja  
**Quiero** configurar cajas registradoras y métodos de pago  
**Para** poder recibir pagos y registrar movimientos de efectivo

**Criterios de Aceptación**:
- CRUD de cajas por tenant (nombre, moneda, balance)
- CRUD de métodos de pago (efectivo, transferencia, pago móvil, Zelle, divisa)
- Registro de movimientos de caja (ingreso/egreso) referenciando documentos
- Validación: no permitir egresos > balance disponible

---

### US6 — Sales Flow (Orders → Invoices)
**Como** vendedor  
**Quiero** crear cotizaciones/pedidos y convertirlos en facturas  
**Para** formalizar las ventas

**Criterios de Aceptación**:
- Crear cotización o pedido como documento tipo `quote` / `order` (usa Document Engine)
- Convertir cotización a pedido sin duplicar datos
- Al aprobar una factura → el Document Engine emite `document.approved`
  → Inventory descuenta stock automáticamente
  → Cash & Payments registra la cuenta por cobrar

---

### US7 — Purchasing Flow
**Como** comprador  
**Quiero** crear órdenes de compra y recibir productos  
**Para** reponer inventario

**Criterios de Aceptación**:
- Crear orden de compra como documento tipo `purchase_order`
- Al recibir (transición a `received`) → Inventory incrementa stock
- Al aprobar la factura de compra → Cash & Payments registra la cuenta por pagar
- Soportar entregas parciales (múltiples recepciones contra una misma OC)

---

### US8 — Cross-Module Event Bus
**Como** sistema  
**Quiero** que cada transición de documento emita eventos que los módulos consuman  
**Para** mantener consistencia sin acoplamiento directo

**Criterios de Aceptación**:
- Document Engine emite eventos (`document.approved`, `document.paid`, `document.cancelled`)
- Inventory escucha `document.approved` (tipo invoice) → descuenta stock
- Cash & Payments escucha `document.paid` → registra movimiento de caja
- Los eventos se persisten en `document_status_logs` + `audit_logs`
- Si un consumidor falla, el evento queda persistido para replay

---

### US9 — Audit Logging
**Como** administrador  
**Quiero** que cada mutación en datos críticos quede registrada con who/what/when  
**Para** cumplir con Principio III de la Constitución

**Criterios de Aceptación**:
- `audit_logs` registra: tenantId, userId, action, entityType, entityId, before/after (JSON), createdAt
- Se registra automáticamente en cada crear/actualizar/eliminar de entidades core
- Inmutable: no se puede modificar ni eliminar un audit_log

---

### US10 — User Locale Preference
**Como** usuario  
**Quiero** seleccionar mi idioma (español / inglés)  
**Para** que la interfaz se muestre en mi idioma preferido

**Criterios de Aceptación**:
- `users.locale` almacena `"es"` o `"en"` (default `"es"`)
- El JWT incluye `locale` para que el frontend lo use
- El frontend consume archivos JSON key-based (`i18n/es.json`, `i18n/en.json`)
- No hay strings hardcodeadas en la UI

---

## Non-Functional Requirements

- NFR-001: Toda request a módulo desactivado → HTTP 403
- NFR-002: Auditoría obligatoria en toda mutación de datos core
- NFR-003: Soft-delete en productos, clientes, proveedores
- NFR-004: Document Engine es la única vía para crear documentos transaccionales
- NFR-005: Event Bus debe soportar replay en caso de fallo de consumidor
- NFR-006: i18n keys externalizadas desde el día 1

---|---

## Dependencies

| Spec | Status |
|------|--------|
| 001-core-foundations | ✅ Implemented |
| 002-document-engine | ✅ Implemented |
