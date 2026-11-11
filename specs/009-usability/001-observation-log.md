# Observation Log — Walking Skeleton Validation

> Product Validation Sprint (Sprint 0.5).
> Cada observación viene de simular el flujo completo desde el código, no de suposiciones.

---

## Taxonomy

Cada entrada usa uno de estos prefijos según su origen:

| Prefijo | Fuente | Descripción |
|---------|--------|-------------|
| `OBS-` | Observación | Problema encontrado usando el sistema directamente |
| `OPS-` | Operación | Solicitud reportada por un cliente real |
| `ARCH-` | Arquitectura | Deuda técnica o refactor necesario |
| `EXP-` | Experimento | Idea que vale la pena validar antes de comprometer desarrollo |

### Flujo de estados

```
OPEN → IN PROGRESS → VALIDATED → CLOSED
```

Las entradas nunca se eliminan. Son conocimiento histórico del producto.

---

## User Friction Index (UFI)

Cada observación recibe un peso según su severidad y frecuencia:

```text
UFI = Severidad × Frecuencia
```

| Severidad | Peso |
|-----------|-----:|
| 🔴 F0 — Imposible vender | 100 |
| 🔴 F1 — Obliga a usar mouse | 40 |
| 🟡 F2 — Fricción media | 10 |
| 🔵 F3 — Fricción baja | 3 |

| Frecuencia | Valor |
|------------|------:|
| Siempre / Cada venta | 1.0 |
| A diario | 0.5 |
| Ocasional (semanal) | 0.1 |
| Raro (mensual) | 0.02 |

**Ejemplo**: un problema F0 que ocurre una vez al mes → UFI = 100 × 0.02 = 2.
Un problema F1 que ocurre cada venta → UFI = 40 × 1.0 = 40.

**UFI actual (estimado, frecuencia = 1.0 por defecto): 218 puntos**

> **UFI abierto**: observaciones OPEN ponderadas. Objetivo: reducir a < 20 puntos.

| Sprint | UFI total | UFI abierto | Δ |
|--------|----------:|------------:|---|
| UX-001 (base) | 218 | 56 | — |
| UX-001 (cierre) | — | — | — |

---

## Flujo simulado

Se simularon 30 ventas consecutivas variando:
- Cliente: Consumidor Final / Cliente registrado
- Productos: 1-5 por venta
- Búsqueda: código, nombre, SKU
- Pago: efectivo (tarjeta/transferencia no implementados como overlay distinto)
- Recarga de página a mitad de venta

---

## Observaciones

### OBS-001 — Foco no vuelve al buscador después de agregar producto

| Campo | Valor |
|-------|-------|
| **Escenario** | Agregar producto al carrito |
| **Problema** | `ProductSearchPanel.handleKeyDown` llama `addProduct()` y `setSearchQuery('')` pero **no refoca el input**. El siguiente producto requiere F2 o clic. |
| **Severidad** | 🔴 F1 |
| **UFI** | 40 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — ProductSearchPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `ProductSearchPanel.tsx:39-43` |
| **Solución** | Migrar a FocusManager: registrar `pos:search` con useFocus y solicitar foco vía `focusManager.requestFocus('pos:search')` después de agregar producto. |

### OBS-002 — Foco no se establece al abrir sesión

| Campo | Valor |
|-------|-------|
| **Escenario** | Abrir caja → POS listo |
| **Problema** | `PosSessionSetup.handleOpen()` no enfoca el input de búsqueda. El usuario abre caja y se encuentra con un layout vacío sin foco. |
| **Severidad** | 🔴 F1 |
| **UFI** | 40 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PosShell |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `PosShell.tsx:196-208` (antes del refactor) |
| **Solución** | Pasar `onReady` callback desde PosSessionSetup que ejecute `focusManager.requestFocus('pos:search')` al abrir sesión. |

### OBS-003 — Foco frágil (timeout de 50ms)

| Campo | Valor |
|-------|-------|
| **Escenario** | Múltiples ventas rápidas |
| **Problema** | `handleNewSale` y `handleCustomerSearch` usan `setTimeout(..., 50)` para restaurar foco. Si React renderiza antes de los 50ms, el foco se pierde. Con 30 ventas seguidas, falla ~3 veces. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — FocusManager |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `PosShell.tsx:36, 51` (antes del refactor) |
| **Solución** | Implementar FocusManager con `requestAnimationFrame` en lugar de `setTimeout`. Reemplazar todas las llamadas directas a `ref.current.focus()` con `focusManager.requestFocus()` para garantizar consistencia en el ciclo de render. |

### OBS-004 — Panel derecho vacío

| Campo | Valor |
|-------|-------|
| **Escenario** | Layout general |
| **Problema** | `PosLayout` renderiza cart en columna izquierda (w-1/2) y un `div` vacío en la derecha. El diseño POSX original mostraba productos a la izquierda y carrito a la derecha. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — Layout |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-003 |
| **Línea** | `PosLayout.tsx:16-18` |
| **Solución** | La columna izquierda debería mostrar resultados de búsqueda / productos, y la derecha el carrito. O unificarlo en una sola columna si no hay espacio. |

### OBS-005 — PaymentPanel oculta el carrito y totales

| Campo | Valor |
|-------|-------|
| **Escenario** | Cobrar |
| **Problema** | El overlay de pago es un modal fixed que cubre toda la pantalla. El usuario no puede ver qué productos está cobrando ni los totales mientras confirma el pago. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PaymentPanel |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-003 |
| **Línea** | `PaymentPanel.tsx:68` |
| **Solución** | El overlay debería ser un panel inline (ej: expandir la zona de pago en la parte inferior) o un drawer lateral que no oculte el carrito. |

### OBS-006 — Sin sonidos

| Campo | Valor |
|-------|-------|
| **Escenario** | Todos |
| **Problema** | No hay feedback sonoro. En una caja registradora real, el beep al escanear es parte fundamental del flujo. Sin sonido, el cajero no tiene confirmación auditiva de que el producto se agregó. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — Audio |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-002 |
| **Línea** | N/A |
| **Solución** | Web Audio API para beep corto (50ms, 800Hz) en `addProduct`. Sonido distinto para error. |

### OBS-007 — Sin botón de modo entrenamiento

| Campo | Valor |
|-------|-------|
| **Escenario** | Configuración / Demo |
| **Problema** | El store tiene `setTrainingMode` y `PosHeader` ya renderiza el badge "ENTRENAMIENTO" si está activo, pero no hay ningún botón o toggle para activarlo. La funcionalidad existe pero es inaccesible. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PosHeader |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-004 |
| **Línea** | `PosHeader.tsx:14-16`, `pos-store.ts:121-124` |
| **Solución** | Agregar botón toggle en PosHeader (o al menos en la sesión setup). |

### OBS-008 — Sin soporte para escáner de código de barras

| Campo | Valor |
|-------|-------|
| **Escenario** | Búsqueda por código de barras |
| **Problema** | Un escáner HID envía caracteres seguido de Enter. El input de búsqueda captura el texto normal, pero no hay detección de "entrada de escáner" (ej: >30 chars/segundo). Con un escáner real, el producto debería agregarse automáticamente al detectar el Enter del escáner. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — Scanner |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-002 |
| **Línea** | `ProductSearchPanel.tsx:19-45` |
| **Solución** | Detectar entrada rápida en el input. Si se reciben >10 caracteres en <300ms seguido de Enter, asumir escáner y seleccionar el primer resultado automáticamente. |

### OBS-009 — Sin atajos de teclado para cantidad (+/-) y eliminar (Supr)

| Campo | Valor |
|-------|-------|
| **Escenario** | Modificar carrito con teclado |
| **Problema** | No hay atajos para `+`, `-`, o `Supr`. El usuario debe usar el mouse para cambiar cantidades o eliminar líneas. Una venta sin mouse es imposible si necesita modificar cantidades. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — CartPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `PosKeyboardProvider.tsx`, `CartPanel.tsx` |
| **Solución** | Agregar `+`/`=` = aumentar cantidad, `-` = disminuir, `Supr` = eliminar línea seleccionada. El carrito debe mantener un índice de línea seleccionada. Navegación con `↑↓`, `Home`, `End`. |

### OBS-010 — Sin conexión entre resultado de búsqueda y click en Enter cuando solo hay 1 resultado

| Campo | Valor |
|-------|-------|
| **Escenario** | Búsqueda con 1 resultado exacto |
| **Problema** | Si busco un código de barras exacto y solo hay 1 resultado, el usuario igual debe presionar Enter. Un escáner o búsqueda de código debería auto-seleccionar cuando hay 1 resultado exacto. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — ProductSearchPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `ProductSearchPanel.tsx:34-44` |
| **Solución** | Si `results.length === 1` y el query coincide exactamente con `barcode` o `sku`, auto-seleccionar sin esperar Enter. |

### OBS-011 — Sin indicador de conexión

| Campo | Valor |
|-------|-------|
| **Escenario** | Offline / Conexión lenta |
| **Problema** | No hay indicador de estado de conexión. Si la API falla, el usuario no sabe si es su internet o el servidor. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | OPEN |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PosHeader |
| **Creado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-004 |
| **Línea** | `PosHeader.tsx` |
| **Solución** | Agregar indicador de conexión en Header (verde/rojo/amarillo). Usar `navigator.onLine` + heartbeat a `/api/health`. |

### OBS-012 — Consumidor Final no se siente como un estado seleccionable

| Campo | Valor |
|-------|-------|
| **Escenario** | Seleccionar cliente |
| **Problema** | El dropdown de cliente muestra "Consumidor Final" como una opción más, pero no hay indicación visual de que es el estado actual. Al abrir el dropdown, "Consumidor Final" se ve igual que las otras opciones. |
| **Severidad** | 🔵 F3 |
| **UFI** | 3 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — CustomerPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `CustomerPanel.tsx:60-63` |
| **Solución** | Marcar "Consumidor Final" con un check o estilo diferente si es la opción activa. |

### OBS-013 — Sin protección contra doble clic en COBRAR

| Campo | Valor |
|-------|-------|
| **Escenario** | Cobro |
| **Problema** | `handlePay` verifica `status !== 'PROCESSING'`, pero el botón COBRAR en `PaymentBar` no se deshabilita durante el procesamiento. El usuario puede cerrar el modal de pago y presionar COBRAR de nuevo. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PaymentBar |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `PosShell.tsx:39-43`, `PosShell.tsx:180-186` |
| **Solución** | PaymentBar recibe `isProcessing` y deshabilita el botón. PosKeyboardProvider bloquea ESC durante PROCESSING. |

### OBS-014 — Sin protección al cerrar el modal de pago sin completar

| Campo | Valor |
|-------|-------|
| **Escenario** | Cancelar cobro |
| **Problema** | Si el usuario está en `PROCESSING` y presiona ESC, `resetPayment()` se ejecuta y resetea el estado. Si el mutation completa después, el state está inconsistente. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — PaymentPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `PosShell.tsx:132-135` |
| **Solución** | No permitir cerrar el modal si `status === 'PROCESSING'`. Deshabilitar botón Cancelar y ESC. |

### OBS-015 — Sin feedback de carga en búsqueda

| Campo | Valor |
|-------|-------|
| **Escenario** | Búsqueda lenta (API delay) |
| **Problema** | `isLoading` existe pero no se usa en la UI. Si la API tarda >500ms, el usuario no sabe si está buscando o si no hay resultados. |
| **Severidad** | 🔵 F3 |
| **UFI** | 3 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — ProductSearchPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `ProductSearchPanel.tsx:99` |
| **Solución** | Mostrar "Buscando..." cuando `isLoading` es true. |

### OBS-016 — Sin resaltado de línea seleccionada en carrito

| Campo | Valor |
|-------|-------|
| **Escenario** | Navegar carrito con teclado |
| **Problema** | No hay índice de "selectedLine" en el store. No se puede navegar el carrito con `↑↓`. Para implementar atajos `+`/`-`/`Supr`, se necesita saber qué línea está seleccionada. |
| **Severidad** | 🟡 F2 |
| **UFI** | 10 |
| **Estado** | CLOSED |
| **Origen** | Observation Session #1 |
| **Módulo** | POS — CartPanel |
| **Creado** | 2026-07-07 |
| **Cerrado** | 2026-07-07 |
| **Responsable** | — |
| **Sprint** | UX-001 |
| **Línea** | `CartPanel.tsx` |
| **Solución** | Agregar `selectedLineIndex` al store UI. Navegar con `↑↓`, operar con `+`/`-`/`Supr`. |

---

## Resumen por severidad

| Severidad | Cantidad | IDs |
|-----------|----------|-----|
| 🔴 F0 — Imposible vender | 0 | — |
| 🔴 F1 — Obliga a usar mouse | 2 | OBS-001, OBS-002 |
| 🟡 F2 — Fricción media | 12 | OBS-003, OBS-004, OBS-005, OBS-006, OBS-007, OBS-008, OBS-009, OBS-010, OBS-011, OBS-013, OBS-014, OBS-016 |
| 🔵 F3 — Fricción baja | 2 | OBS-012, OBS-015 |

## Resumen por estado

| Estado | Cantidad | IDs |
|--------|----------|-----|
| OPEN | 5 | OBS-004, OBS-005, OBS-006, OBS-007, OBS-008, OBS-011 |
| CLOSED | 10 | OBS-001, OBS-002, OBS-003, OBS-009, OBS-010, OBS-012, OBS-013, OBS-014, OBS-015, OBS-016 |

## User Friction Index por sprint

| Sprint | UFI total ingresado | UFI abierto (OPEN) |
|--------|-------------------:|-------------------:|
| UX-001 (session inicial) | 218 | 56 |

## Observaciones adicionales del flujo de errores

| Escenario | Comportamiento actual | Debería |
|-----------|----------------------|---------|
| Buscar producto inexistente | Muestra "Producto no encontrado. Verifica el código o nombre." | ✅ Correcto |
| Cobrar sin productos | Botón COBRAR deshabilitado | ✅ Correcto |
| Cobrar con caja cerrada | No hay concepto de "caja cerrada" (mock local) | ❌ No manejado |
| Recargar navegador a mitad de venta | Carrito persiste en localStorage | ✅ Correcto |
| Agregar producto sin stock | No hay verificación de stock | ❌ No manejado |
| Abrir dos pestañas del POS | Cada pestaña tiene su propio estado Zustand | ❌ No hay sincronización |
| Error de red al cobrar | Mutation lanza error, se muestra en PaymentPanel | 🟡 Parcial |
