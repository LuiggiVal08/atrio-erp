# Reportes ERP

**Version**: 1.0.0-draft | **Status**: Planning | **Dependencies**: 001-core-foundations, 002-document-engine, 003-core-architecture

---

## Overview

Sistema de reportes que permite a los usuarios generar informes visulizables y descargables con datos agregados de todos los módulos del sistema. Incluye dashboards ejecutivos, reportes predefinidos por módulo, exportación a múltiples formatos (PDF, Excel, CSV), y programación de reportes periódicos.

---

## Clarifications

### Session 2026-06-30

- Q: ¿Reportes predefinidos en código vs DB? → A: Híbrido — core en código, filtros/schedule en DB
- Q: ¿Dashboard live queries vs pre-agregados? → A: Live queries con SQL directo
- Q: ¿Generación síncrona vs asíncrona? → A: Híbrido — dashboard en tiempo real, exportaciones en background con Redis Queue + Socket.IO + MinIO
- Q: ¿Flujo de descarga? → A: Socket.IO emite `report.completed` con downloadUrl. Auto-download si está en página. Siempre queda en Report History (48h). Cleanup nocturno.
- Q: ¿Almacenamiento de archivos? → A: MinIO (S3-compatible) en Docker

---

## User Stories

### US1 — Dashboard Ejecutivo
**Como** usuario del sistema  
**Quiero** ver un dashboard con indicadores clave (ventas del día, inventario bajo, movimientos de caja, clientes nuevos)  
**Para** tener una visión rápida del estado del negocio

**Criterios de Aceptación**:
- Dashboard principal con tarjetas de resumen (ventas hoy, total facturado mes, productos bajos en stock, movimientos caja hoy)
- Gráficos simples (barras de ventas semanales, top productos vendidos)
- Filtro por rango de fechas
- Datos en tiempo real vs período anterior

### US2 — Reporte de Ventas
**Como** usuario de ventas  
**Quiero** generar un reporte de ventas con filtros por fecha, cliente, producto y vendedor  
**Para** analizar el rendimiento comercial

**Criterios de Aceptación**:
- Totales facturados por día/semana/mes
- Desglose por cliente, producto, vendedor
- Comparativa con período anterior
- Exportable a PDF, Excel y CSV

### US3 — Reporte de Inventario
**Como** usuario de inventario  
**Quiero** generar reportes de stock actual, movimientos y productos por agotarse  
**Para** mantener el control del inventario

**Criterios de Aceptación**:
- Reporte de stock actual (todos los productos con cantidades por almacén)
- Productos con stock bajo (umbral configurable)
- Movimientos de stock por período
- Valorización del inventario (costo total)
- Exportable a PDF, Excel y CSV

### US4 — Reporte de Caja
**Como** usuario de caja  
**Quiero** ver el resumen de movimientos de caja por período y método de pago  
**Para** cuadrar caja al cierre del día

**Criterios de Aceptación**:
- Resumen de ingresos y egresos por día
- Desglose por método de pago
- Saldo inicial y final por caja
- Reporte X (cierre parcial) y Z (cierre total)
- Exportable

### US5 — Reporte de Clientes
**Como** usuario de clientes  
**Quiero** ver el historial de compras, saldos pendientes y antigüedad de clientes  
**Para** gestionar la cartera de clientes

**Criterios de Aceptación**:
- Listado de clientes con total comprado y última compra
- Clientes con más compras (top N)
- Historial de transacciones por cliente
- Exportable

### US6 — Reporte de Impuestos
**Como** usuario de contabilidad  
**Quiero** generar un reporte de impuestos (IVA) por período  
**Para** preparar declaraciones fiscales

**Criterios de Aceptación**:
- Total de IVA cobrado en ventas del período
- Total de IVA pagado en compras del período
- Débito y crédito fiscal
- Exportable

### US7 — Programa de Reportes
**Como** usuario administrador  
**Quiero** programar reportes periódicos que se envíen por email automáticamente  
**Para** recibir informes sin tener que generarlos manualmente

**Criterios de Aceptación**:
- Configurar frecuencia (diario, semanal, mensual)
- Seleccionar tipo de reporte y formato
- Lista de destinatarios por email
- Ejecución automática según programación
- Historial de envíos

---

## Functional Requirements

- **FR-001**: El sistema debe exponer endpoints de datos agregados para cada módulo (ventas, inventario, caja, clientes, impuestos)
- **FR-002**: Los reportes deben poder filtrarse por rango de fechas y tenant
- **FR-003**: Los reportes deben poder exportarse a PDF, Excel (XLSX) y CSV
- **FR-004**: Los dashboards deben cargar en menos de 2 segundos (live queries)
- **FR-005**: Las exportaciones de reportes se procesan en background vía Redis Queue (Bull/BullMQ)
- **FR-006**: Al completar una exportación, se notifica al frontend via Socket.IO (`report.completed`)
- **FR-007**: Los archivos generados se almacenan en MinIO (S3-compatible), no en DB ni filesystem local
- **FR-008**: El frontend auto-descarga el reporte si el usuario sigue en la página; siempre queda disponible en Report History
- **FR-009**: Report History retiene los archivos por 48h con cleanup automático
- **FR-010**: Los reportes programados se ejecutan via Cron + Redis Queue
- **FR-011**: Los reportes deben respetar la segmentación multi-tenant
- **FR-012**: Los reportes deben respetar permisos RBAC (solo datos que el usuario tiene permiso de ver)

---

## Success Criteria

- Dashboard principal carga en < 2s con datos del mes actual
- Reporte de ventas con filtros se genera en < 5s
- Exportación PDF/Excel/CSV funcional para todos los tipos de reporte
- Programación de reportes con entrega por email funciona correctamente
- Usuarios sin permiso sobre un módulo no ven datos de ese módulo en reportes

---

## Key Entities

- **ReportDefinition**: id, tenantId, name, type (sales/inventory/cash/clients/taxes), config (JSON: filters, columns), schedule (cron expression), format (pdf/xlsx/csv), recipients (email[]), enabled, createdById, createdAt, updatedAt
- **ReportExecution**: id, reportDefinitionId, tenantId, requestedById, status (pending/processing/completed/failed), taskId, startedAt, completedAt, minioBucket, minioKey, fileSize, errorMessage, createdAt
- **ReportHistory**: id, tenantId, requestedById, reportType, format, filters (JSON), minioBucket, minioKey, fileSize, status, createdAt, expiresAt (createdAt + 48h)
- **DashboardWidget**: id, tenantId, type (kpi/chart/table), config (JSON: metric, period, comparison), position (x, y), width, height, createdById, createdAt, updatedAt
- **ReportTask**: id, tenantId, reportType, format, filters (JSON), status, taskId (Redis Bull/BullMQ job id), createdById, result (JSON: minioBucket, minioKey), error, createdAt, completedAt

---

## Edge Cases & Error Handling

- **Datos vacíos**: Los reportes deben mostrar mensaje claro si no hay datos para el período seleccionado
- **Períodos largos**: Reportes con rangos de fecha muy amplios (>1 año) deben mostrar advertencia de tiempo de generación
- **Archivos grandes**: Exportaciones > 10MB deben procesarse en background con notificación al completar
- **Error de generación**: Si falla la generación, registrar error en `report_executions` y notificar al usuario
- **Timeouts**: Reportes en tiempo real con timeout a 30s; si excede, sugerir usar exportación programada
- **Permisos**: Reportes multi-módulo solo muestran datos de módulos a los que el usuario tiene acceso

---

## Out of Scope (v1)

- Reportes con gráficos interactivos (drill-down, cross-filter) — se agregan en v2
- Reportes personalizados arrastrar-y-soltar — v2
- Inteligencia artificial / predicciones — futuro
