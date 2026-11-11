# Performance Budget

> La velocidad del POS no es un lujo. Es un requisito funcional.
> Una venta que tarda más de 30 segundos hace que el cajero se sienta incompetente.
> Y el cajero incompetente culpa al sistema.

---

## KPIs del POS

| KPI | Target | Medición | Cómo se mide |
|-----|--------|----------|--------------|
| Tiempo promedio por venta | < 30 s | Desde que se agrega el primer producto hasta que se emite el comprobante | RUM (Real User Monitoring) |
| Clics para vender un producto | ≤ 3 | Input búsqueda → Enter → Enter | Contador de eventos |
| Tiempo para encontrar producto | < 2 s | Desde que se teclea hasta que aparece en la lista | TTFB + render de resultados |
| Tiempo para cobrar | < 10 s | Desde que se presiona Cobrar hasta que se muestra cambio | RUM |
| Latencia de búsqueda | < 200 ms | Desde keyup hasta resultados renderizados | Performance API |
| Uso sin mouse | 100% posible | Toda acción debe tener shortcut | Auditoría manual |

---

## Budgets de rendimiento técnico

### Bundle size

| Recurso | Límite | Notas |
|---------|--------|-------|
| JS inicial (gzip) | < 100 KB | POS es lazy-loaded, no parte del bundle principal |
| CSS inicial (gzip) | < 20 KB | Tailwind purgado, tokens variables |
| Catálogo de productos (IndexedDB) | < 5 MB | ~1000 productos con precio, stock, nombre |
| Iconos | < 10 KB | SVG inline, no librerías de iconos completas |

### Render

| Métrica | Target |
|---------|--------|
| First Contentful Paint (FCP) | < 500 ms |
| Time to Interactive (TTI) | < 1 s |
| Input delay (keydown → handler) | < 50 ms |
| Búsqueda (keyup → resultados) | < 200 ms |
| Frame rate en animaciones | 60 fps |
| Layout shifts | 0 (sin CLS) |

### API

| Endpoint | Target | Medición |
|----------|--------|----------|
| POST /pos/sales/:id/checkout | < 1 s | P95 |
| POST /pos/sales/:id/pay | < 2 s | P95 |
| GET /products/search | < 500 ms | P95 |
| GET /customers/search | < 500 ms | P95 |
| POST /customers/quick | < 1 s | P95 |

---

## Estrategias para cumplir budgets

### Búsqueda

- Catálogo en IndexedDB con índice de búsqueda (compuesto: barcode, sku, name)
- La búsqueda nunca hace request al servidor (salvo que no haya catálogo local)
- Debounce de 150ms en el input
- Virtual scrolling para resultados (solo renderizar 20 items visibles)

### Carrito

- Sin re-renders innecesarios: líneas individuales memoizadas por `productId`
- Totales calculados con useMemo, no en cada render
- Sin modales para editar cantidad (controles inline en la línea)

### Cobro

- La validación de stock ocurre en backend (no bloquear UI esperando)
- El overlay de pago es un componente ligero (sin re-fetch de datos)
- La impresión del comprobante no bloquea la UI

### Sesión

- La apertura de caja puede tardar hasta 2s (es la única operación que espera)
- Después de abierta, el POS es instantáneo (datos en memoria/IndexedDB)

---

## Monitoreo

### RUM

```typescript
// Performance marks en acciones clave
performance.mark('pos:sale:start');
// ... cajero opera ...
performance.mark('pos:sale:payment');
// ... pago procesado ...
performance.mark('pos:sale:complete');

performance.measure('pos:sale:total', 'pos:sale:start', 'pos:sale:complete');
performance.measure('pos:sale:payment', 'pos:sale:payment', 'pos:sale:complete');
```

Estas métricas se envían al endpoint `/metrics/business` (implementado en H-001.6).

### Alertas

| Condición | Acción |
|-----------|--------|
| Tiempo promedio por venta > 45 s (última hora) | Notificar a desarrollo |
| Latencia de búsqueda > 500 ms (últimos 10 min) | Notificar a desarrollo |
| Fallos de pago > 5% (última hora) | Notificar a operaciones |

---

## Qué NO optimizar (por ahora)

| Aspecto | Razón |
|---------|-------|
| Imágenes de productos | V1 no tiene imágenes. Se agrega en V2. |
| Animaciones complejas | POS debe ser rápido, no bonito. Animaciones mínimas. |
| PWA completo | El service worker offline se agrega después del MVP. |
| Soporte para 1000+ productos en búsqueda | Si el tenant tiene más, se requiere paginación. Para V1, 1000 es suficiente. |
