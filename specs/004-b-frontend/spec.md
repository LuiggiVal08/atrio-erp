# Frontend UI — Interfaz de Alta Densidad ODALX Atrio

**Version**: 1.0.0-draft | **Status**: Planning | **Dependencies**: 001-core-foundations, 002-document-engine, 003-core-architecture

---

## Overview

Interfaz de usuario web para el ERP modular ODALX Atrio, operando bajo el paradigma "Todo es un documento con estados". La UI se compone de un layout global de alta densidad con sidebar de navegación, header con utilidades y un canvas de contenido asíncrono con scroll interno. Cada entidad del sistema hereda una máquina de estados finitos (FSM) que se representa visualmente mediante badges interactivos con micro-indicadores y líneas de tiempo colapsables. La interfaz cubre los módulos de inventario, ventas (POS), compras, caja/tesorería, clientes/proveedores (CRM), localización fiscal y empleados.

---

## Clarifications

### Session 2026-07-01

- Q: How should POS offline stock conflicts be resolved when two terminals sell the same unit while offline? → A: Last-write-wins — server accepts latest timestamp; stock can go negative with manual reconciliation via inventory adjustment document
- Q: How is the user's language/locale determined on first visit? → A: Browser `navigator.language` detection, tenant config can override, persisted per user in user profile
- Q: ¿El timeline de eventos del documento debe venir incrustado en el payload del documento o en un endpoint separado? → A: Incrustado en el payload del documento (`document.timeline[]`), un solo request, cacheado por TanStack Query

---

## User Stories

### HU-01 — Módulo de Inventario (Kardex de Capas de Costo FIFO)

**Como** Analista de Logística  
**Quiero** registrar un ajuste de inventario mediante la máquina de estados  
**Para** asegurar que el costo promedio ponderado y las capas FIFO impacten los estados financieros con auditoría granular

**Criterios de Aceptación**:
- Grilla virtualizada capaz de soportar +10,000 SKUs con ordenamiento nativo en memoria
- Al pasar de DRAFT a APPROVED, se congela el stock físico de la sucursal
- Visualización de la máquina de estados del documento (DRAFT → APPROVED → PAID/CANCELLED)
- Badge interactivo con micro-indicador visual del estado actual

**Edge Cases**:
- Intento de aprobación concurrente por dos usuarios: bloqueo optimista vía timestamp genera alerta inmediata sin recargar interfaz

### HU-02 — Módulo de Ventas (Punto de Venta Masivo de Alta Densidad)

**Como** Cajero Facturador  
**Quiero** procesar cobros utilizando atajos de teclado sin tocar el mouse  
**Para** mantener un rendimiento de transacciones menor a 3 segundos

**Criterios de Aceptación**:
- Foco automático persistente en el input de búsqueda de productos
- Comandos de teclado: F8 para métodos de pago, F10 para emitir factura
- Visualización del estado del documento en tiempo real (DRAFT → APPROVED → PAID)
- Canvas con scroll interno independiente para grillas de productos

**Edge Cases**:
- Pérdida instantánea de conectividad: la venta se enruta a store local en IndexedDB y sincroniza al restaurarse la red

### HU-03 — Módulo de Compras (Gestión de Suministros y Costos de Importación)

**Como** Gerente de Compras  
**Quiero** asociar gastos de nacionalización a una Orden de Compra internacional  
**Para** prorratear el costo real unitario de los productos

**Criterios de Aceptación**:
- Formulario dinámico con cálculo en tiempo real de aranceles distributivos
- Visualización del estado de la orden de compra en el flujo FSM (DRAFT → APPROVED → RECEIVED → PAID)
- Timeline colapsable de eventos del documento

### HU-04 — Módulo de Caja y Tesorería (Arqueo de Turnos Dinámico)

**Como** Supervisor de Caja  
**Quiero** conciliar el efectivo físico contra el saldo del sistema  
**Para** cerrar el turno operacional y emitir el documento de descuadre si aplica

**Criterios de Aceptación**:
- Bloqueo inmediato del POS del cajero al iniciar el arqueo
- Visualización del estado del arqueo como documento FSM (DRAFT → APPROVED → PAID/CANCELLED)
- Dashboard de movimientos con scroll interno independiente

### HU-05 — Módulo de Clientes y Proveedores (CRM/Ficha de Crédito Centralizada)

**Como** Oficial de Crédito  
**Quiero** evaluar el estado de cuenta consolidado de un tercero  
**Para** congelar transacciones automáticamente si excede el límite de crédito permitido

**Criterios de Aceptación**:
- Ficha de tercero con histórico de transacciones, saldo actual, límite de crédito
- Alerta visual automática al exceder límite de crédito
- Grilla virtualizada de transacciones del tercero

### HU-06 — Módulo de Localización (Motor Multi-Moneda y Reglas Fiscales Locales)

**Como** Contador  
**Quiero** parametrizar tasas de retención fiscal (IGTF, IVA) adaptadas a la región Trujillo/Venezuela  
**Para** su aplicación automática en documentos de venta y compra

**Criterios de Aceptación**:
- Formulario de configuración de tasas impositivas con cálculo en tiempo real
- Visualización del tipo de cambio actual en el header global
- Integración con la máquina de estados de documentos fiscales

### HU-07 — Módulo de Empleados (Nómina y Control de Roles por Sucursal)

**Como** Director de RRHH  
**Quiero** mapear los permisos de los empleados por sucursal física  
**Para** asegurar la segregación estricta de funciones

**Criterios de Aceptación**:
- Asignación de roles y permisos por sucursal
- Ficha de empleado con documentos asociados (contratos, nóminas)
- Visualización de estados FSM en documentos de empleado

---

## Functional Requirements

- **FR-001**: Layout global compuesto por tres secciones inmutables: Sidebar (240px), Header superior y Canvas de contenido con scroll interno independiente
- **FR-002**: La sidebar debe mostrar dinámicamente solo los módulos aprovisionados al Tenant y permitidos por el rol del usuario
- **FR-003**: El header debe incluir breadcrumbs dinámicos sincronizados con el árbol de rutas, un buscador global (Command Palette) y selector multi-tenant/multi-sucursal
- **FR-004**: El canvas de contenido debe tener scroll interno independiente para grillas masivas, impidiendo el scroll general de la ventana y preservando los encabezados fijos
- **FR-005**: Cada entidad del sistema debe heredar una representación visual de máquina de estados finitos (FSM) con badges interactivos y micro-indicadores de color
- **FR-006**: Los badges de estado deben mostrar el nombre humanizado del estado, un color distintivo por estado (gris=DRAFT, cobalto=APPROVED, esmeralda=PAID, carmesí=CANCELLED) y las acciones permitidas en ese estado
- **FR-007**: El timeline de eventos del documento debe ser colapsable y mostrar el histórico de cambios de estado con timestamps
- **FR-008**: Las grillas de datos deben ser virtualizadas para soportar +10,000 registros con ordenamiento en memoria
- **FR-009**: El módulo POS debe operar con foco automático persistente en búsqueda y atajos de teclado (F8, F10) sin requerir uso del mouse
- **FR-010**: El POS debe soportar operación offline con almacenamiento en IndexedDB y sincronización automática al restaurar la conectividad
- **FR-011**: El arqueo de caja debe bloquear inmediatamente el POS del cajero al iniciarse
- **FR-012**: El sistema de crédito debe mostrar alertas visuales automáticas al exceder el límite de crédito de un tercero

---

## Success Criteria

- Usuario puede navegar entre todos los módulos autorizados desde la sidebar en menos de 1 segundo
- Grillas virtualizadas renderizan +10,000 registros sin degradación perceptible de rendimiento
- Transacciones POS completadas en menos de 3 segundos usando solo atajos de teclado
- Máquina de estados visual se actualiza en tiempo real al cambiar el estado de un documento
- Operación offline del POS sincroniza correctamente al restaurar la conectividad
- Usuario sin permiso sobre un módulo no ve ese módulo en la sidebar
- El layout preserva headers fijos y scroll interno independiente sin importar el contenido del canvas
- Locale se detecta automáticamente del navegador al primer ingreso, con opción de cambio manual persistida en perfil de usuario

---

## Key Entities

- **Layout**: Sidebar (módulos, items), Header (breadcrumbs, buscador, selector sucursal), Canvas (scroll interno, headers fijos)
- **DocumentState**: Representación visual de la FSM — estado (DRAFT/APPROVED/PAID/CANCELLED), badge (color, ícono, label), acciones permitidas, timeline de transiciones (incrustado en el payload del documento como `document.timeline[]`)
- **VirtualGrid**: Grilla virtualizada con ordenamiento en memoria, paginación infinita, soporte para +10,000 filas
- **POS**: Terminal de venta con foco automático en búsqueda, atajos de teclado (F8/F10), store offline (IndexedDB)
- **CashAudit**: Flujo de arqueo con bloqueo de POS, conciliación efectivo vs sistema, emisión de documento de descuadre
- **FichaTercero**: Vista consolidada de cliente/proveedor con saldo, límite de crédito, histórico de transacciones
- **FiscalConfig**: Configuración de tasas de retención (IGTF, IVA), multi-moneda, tipo de cambio

---

## Edge Cases & Error Handling

- **Pérdida de conectividad en POS**: Almacenamiento local en IndexedDB, sincronización automática al restaurar red, sin pérdida de datos de transacción. Conflictos de stock por ventas offline concurrentes se resuelven con last-write-wins (timestamp del servidor); stock negativo resultante se reconcilia manualmente mediante documento de ajuste de inventario
- **Bloqueo concurrente en aprobaciones**: Bloqueo optimista vía timestamp, alerta inmediata al segundo usuario sin recargar interfaz
- **Sidebar sin módulos**: Mostrar mensaje informativo si el tenant no tiene módulos aprovisionados
- **Grilla vacía**: Mensaje claro si no hay datos para mostrar, con acción sugerida
- **Exceso de límite de crédito**: Alerta visual automática, bloqueo de nuevas transacciones hasta liberación manual
- **Buscador global sin resultados**: Mensaje "No se encontraron resultados" con sugerencias de búsqueda

---

## Out of Scope (v1)

- Renderizado analítico de gráficos complejos en dispositivos móviles — la interfaz móvil solo manejará vistas de control y aprobación simplificadas
- Sincronización P2P directa entre clientes sin pasar por la validación central del API Gateway del Tenant
- Notificaciones push en tiempo real fuera del contexto del POS
- Personalización visual del layout (temas, colores corporativos)
