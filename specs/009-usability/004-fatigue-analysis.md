# Fatigue Analysis — POS Keyboard Flows

> ¿Cuántas veces presiona cada tecla un cajero en 100 ventas?
> Este documento estima el número de repeticiones por acción para identificar atajos que merecen optimización.

---

## Metodología

Se analiza una venta típica de 3 productos, pago en efectivo, sin cliente registrado.
Se extrapola a 100 ventas y a una jornada de 8 horas (~100 ventas).

Los conteos son **estimaciones teóricas**. Se actualizarán con datos reales cuando el POS tenga telemetría.

---

## Keystrokes por venta (3 productos, efectivo)

| Acción | Teclas | Rep/venta | Total keystrokes |
|--------|--------|----------:|-----------------:|
| Buscar producto #1 | `F2` + `clavo`(5) + `Enter` | 1 | 7 |
| Buscar producto #2 | `F2` + `tornillo`(8) + `Enter` | 1 | 10 |
| Buscar producto #3 | `F2` + `disco`(5) + `Enter` | 1 | 7 |
| Aumentar cantidad | `↑↓` + `+` | 1 | 2 |
| Cobrar | `F8` | 1 | 1 |
| Seleccionar efectivo | `Enter` | 1 | 1 |
| Confirmar monto | `Enter` | 1 | 1 |
| Nueva venta | `Ctrl+N` | 1 | 2 |

**Total por venta: ~31 keystrokes** (letras + modificadores)

---

## Proyección

| Escenario | Ventas | Keystrokes | Tiempo estimado |
|-----------|-------:|-----------:|----------------:|
| 1 venta | 1 | ~31 | ~15 s |
| 10 ventas | 10 | ~310 | ~2.5 min |
| 100 ventas | 100 | ~3 100 | ~25 min |
| Jornada (8h, ~100 ventas) | 100 | ~3 100 | ~25 min de escritura pura |

---

## Acciones individuales más repetidas

| Acción | Keystrokes por 100 ventas | % del total | Prioridad de optimización |
|--------|--------------------------:|------------:|---------------------------|
| `Enter` | 500 | 16.1% | Alta — cada venta tiene 5 Enter |
| `F2 + búsqueda` | ~800 letras | 25.8% | Alta — depende de longitud de query |
| `Ctrl+N` | 200 | 6.5% | Media — solo 1/venta |
| `F8` | 100 | 3.2% | Media |
| `↑↓ + -` | 200 | 6.5% | Baja — solo cuando hay >1 producto |

---

## Observaciones de fatiga

1. **F2 es la tecla más usada**: 3 veces por venta. Si el foco se mantuviera en search después de agregar producto, se ahorrarían 2 F2/venta = 200 keystrokes/100 ventas (6.5% de reducción).

2. **Enter domina el perfil**: 500 de 3100 keystrokes son Enter. Cada Enter que pueda eliminarse (ej: auto-complete con escáner) tiene alto impacto.

3. **Ctrl+N se siente rápido pero suma**: Son 200 keystrokes/100 ventas. Un atajo `F10` para "Nueva Venta" no mejora significativamente.

4. **Escáner reduce todo a 1 Enter**: Una venta con escáner pasa de ~31 keystrokes a ~5 (solo Enter para pago). El impacto del scanner engine es la optimización individual más grande posible.

---

## Objetivos de reducción

| Sprint | Keystrokes/venta objetivo | Reducción | Cómo |
|--------|-------------------------:|----------:|------|
| UX-001 | ~28 | ~10% | Auto-foco search elimina 2 F2/venta |
| UX-002 | ~10 | ~65% | Scanner + auto-complete barcode |
| UX-003 | ~8 | ~20% adicional | Pago quick-cash (Enter directo si monto exacto) |
| UX-004 | ~6 | ~25% adicional | Atajos contextuales + historial de foco |
