# UX Debt — POS Module

> Deuda de experiencia de uso. Misma prioridad que la deuda técnica.
> Cada entrada describe una fricción confirmada que debe resolverse antes de agregar funcionalidades nuevas al módulo afectado.

---

## Formato

```
UXD-NNN

Título:
...

Impacto:
Alto / Medio / Bajo

Frecuencia:
Siempre / Cada venta / Ocasional / Raro

Costo estimado:
Pequeño / Mediano / Grande

Estado:
Open / In Progress / Validated / Closed

Observado en:
OBS-NNN

Relacionado:
ARCH-NNN, EXP-NNN
```

---

## Entradas

### UXD-001 — Flujo de foco frágil

| Campo | Valor |
|-------|-------|
| **Impacto** | Alto |
| **Frecuencia** | Cada venta |
| **Costo estimado** | Pequeño |
| **Estado** | Closed |
| **Observado en** | OBS-001, OBS-002, OBS-003 |
| **Relacionado** | — |

**Descripción**: El flujo de foco entre paneles (search → cart → payment → search no es determinista. Si React renderiza después de una mutación de store, el foco puede aterrizar en el elemento incorrecto. Se solucionó con FocusManager, pero la arquitectura de foco debe validarse con pruebas automatizadas después de cada cambio en el POS.

---

### UXD-002 — Panel derecho del layout desaprovechado

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Siempre |
| **Costo estimado** | Pequeño |
| **Estado** | Open |
| **Observado en** | OBS-004 |
| **Relacionado** | — |

**Descripción**: El layout de doble columna tiene un panel derecho vacío. Ocupa espacio visual sin aportar información. El diseño original POSX especificaba productos a la izquierda y carrito a la derecha, o un panel de resumen. Actualmente el carrito está a la izquierda y la derecha está vacía.

---

### UXD-003 — Overlay de pago oculta contexto

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Cada venta |
| **Costo estimado** | Medio |
| **Estado** | Open |
| **Observado en** | OBS-005 |
| **Relacionado** | — |

**Descripción**: El modal de pago es fixed y cubre toda la pantalla. El cajero no puede ver el carrito mientras confirma el pago. En cajas reales con clientes esperando, esto obliga al cajero a memorizar los montos o cometer errores.

---

### UXD-004 — Sin feedback sonoro

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Cada venta |
| **Costo estimado** | Pequeño |
| **Estado** | Open |
| **Observado en** | OBS-006 |
| **Relacionado** | — |

**Descripción**: El beep al escanear/agregar un producto es parte del modelo mental de una caja registradora. Sin él, el cajero debe mirar la pantalla para confirmar cada acción, lo que reduce la velocidad y aumenta la carga cognitiva.

---

### UXD-005 — Modo entrenamiento sin acceso

| Campo | Valor |
|-------|-------|
| **Impacto** | Bajo |
| **Frecuencia** | Raro |
| **Costo estimado** | Pequeño |
| **Estado** | Open |
| **Observado en** | OBS-007 |
| **Relacionado** | — |

**Descripción**: La funcionalidad de training mode existe en el store pero no hay UI para activarla. Un cajero nuevo no puede practicar sin afectar datos reales.

---

### UXD-006 — Sin detección de escáner

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Cada venta (con escáner) |
| **Costo estimado** | Medio |
| **Estado** | Open |
| **Observado en** | OBS-008 |
| **Relacionado** | — |

**Descripción**: Los escáneres HID emulan teclado y envían caracteres rápidamente seguidos de Enter. No hay lógica para distinguir entrada de escáner de entrada manual, ni para auto-agregar el producto al recibir el Enter del escáner.

---

### UXD-007 — Sin indicador de conexión

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Ocasional |
| **Costo estimado** | Pequeño |
| **Estado** | Open |
| **Observado en** | OBS-011 |
| **Relacionado** | — |

**Descripción**: Cuando la API falla o hay pérdida de conexión, el cajero no tiene indicación visual. Puede seguir operando con la ilusión de que el sistema funciona.

---

### UXD-008 — Doble clic en COBRAR (protegido pero sin test)

| Campo | Valor |
|-------|-------|
| **Impacto** | Medio |
| **Frecuencia** | Ocasional |
| **Costo estimado** | Pequeño |
| **Estado** | Closed |
| **Observado en** | OBS-013, OBS-014 |
| **Relacionado** | — |

**Descripción**: La protección contra doble clic en COBRAR está implementada, pero no hay una prueba automatizada que verifique que el botón esté deshabilitado durante PROCESSING. Un refactor futuro podría romper esta protección sin que nadie lo note.

---

### UXD-009 — Cero tests de keyboard flow

| Campo | Valor |
|-------|-------|
| **Impacto** | Alto |
| **Frecuencia** | Siempre |
| **Costo estimado** | Mediano |
| **Estado** | Open |
| **Observado en** | — |
| **Relacionado** | ARCH-001 |

**Descripción**: No existe ninguna prueba automatizada que verifique que el flujo completo de venta se puede ejecutar solo con teclado. El principio "Keyboard First" no está protegido contra regresiones.
