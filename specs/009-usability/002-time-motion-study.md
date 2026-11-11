# Time-Motion Study — POS Keyboard Flow

> Documento vivo que establece objetivos cuantitativos de velocidad para cada acción del POS.
> Las mediciones se toman desde el primer keydown hasta el último keydown de la acción (sin contar latencia de red).

---

## Metodología

- **Medición**: cronómetro manual o Playwright `clock.measure()` sobre 10 iteraciones consecutivas
- **Objetivo**: tiempo máximo aceptable para que el flujo se sienta "instantáneo"
- **Mejor**: mejor registro histórico documentado
- **Actual**: mediana de las últimas 10 mediciones
- Se actualiza cada vez que se completa un sprint de UX

---

## Tabla de tiempos

| Acción | Objetivo | Mejor | Actual | Notas |
|--------|--------:|------:|-------:|-------|
| Buscar producto (F2 → query) | < 2.0 s | — | — | Sin incluir latencia de API |
| Agregar producto al carrito (Enter) | < 0.5 s | — | — | Desde que se presiona Enter hasta que el producto aparece en el carrito |
| Cambiar cantidad (+ / -) | < 1.0 s | — | — | Incluye navegación con ↑↓ |
| Eliminar línea (Supr) | < 1.0 s | — | — | |
| Buscar cliente (F4 → query) | < 3.0 s | — | — | |
| Seleccionar cliente (Enter) | < 1.0 s | — | — | |
| Cobrar efectivo exacto | < 5.0 s | — | — | F8 → monto exacto → Enter |
| Cobrar con vuelto | < 8.0 s | — | — | F8 → monto → Enter |
| Venta completa (1 producto, efectivo) | < 15.0 s | — | — | Desde F2 hasta ReceiptPanel |
| Venta completa (3 productos, efectivo) | < 25.0 s | — | — | |
| Nueva venta (Ctrl+N) | < 1.0 s | — | — | Tiempo entre ReceiptPanel → search focus |
| Cobrar multipago | < 10.0 s | — | — | |

---

## Cómo medir

```bash
# Opción 1: Playwright (recomendada)
npx playwright test tests/usability/keyboard/complete-sale.spec.ts --reporter=json

# Opción 2: Manual
# Abrir DevTools → Performance → grabar 10 ventas consecutivas
```

---

## Historial

| Fecha | Sprint | Venta 1p (s) | Venta 3p (s) | Observaciones |
|-------|--------|-------------:|-------------:|---------------|
| — | — | — | — | Línea base pendiente |

---

## Objetivos

- **Corto plazo**: lograr < 15 s para venta de 1 producto (efectivo exacto)
- **Mediano plazo**: mantener < 30 s para cualquier venta de hasta 5 productos
- **Largo plazo**: reducir a < 10 s para venta de 1 producto usando escáner
