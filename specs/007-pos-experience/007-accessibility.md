# Accessibility

> El POS debe ser utilizable por cualquier persona, independientemente de sus capacidades.

---

## WCAG 2.2

### Nivel objetivo: AA

| Criterio | Cobertura en POS |
|----------|-----------------|
| 1.1.1 Non-text Content | Iconos con `aria-label` descriptivo |
| 1.3.1 Info and Relationships | Zonas del layout con landmarks (`role="region"`, `aria-label`) |
| 1.4.1 Use of Color | Errores no solo con color (icono + texto) |
| 1.4.3 Contrast (Minimum) | 4.5:1 texto normal, 3:1 texto grande |
| 1.4.4 Resize text | Hasta 200% sin pérdida de contenido |
| 2.1.1 Keyboard | Toda acción con teclado (ver 003-keyboard-first.md) |
| 2.2.1 Timing Adjustable | Timeout de 10s post-venta es ajustable (configurable por tenant) |
| 2.4.3 Focus Order | Orden lógico: Search → Cart → Customer → Payment |
| 2.4.7 Focus Visible | Anillo de 2px color primario en elemento enfocado |
| 3.3.2 Labels or Instructions | Todos los inputs tienen label visible o `aria-label` |

---

## Implementación específica para POS

### Roles y landmarks

```html
<!-- Cada zona del POS es un landmark -->
<div role="region" aria-label="Barra superior">
  <!-- Top Bar -->
</div>

<div role="search" aria-label="Buscar producto">
  <!-- Search Bar -->
</div>

<div role="region" aria-label="Lista de productos" aria-live="polite">
  <!-- Product List -->
</div>

<div role="list" aria-label="Carrito de compras">
  <!-- Cart lines -->
</div>

<div role="region" aria-label="Información del cliente">
  <!-- Customer Zone -->
</div>

<div role="region" aria-label="Totales de la venta" aria-live="polite">
  <!-- Totals -->
</div>

<div role="region" aria-label="Barra de pago">
  <!-- Payment Bar -->
</div>
```

### Overlays y modales

```html
<!-- Payment overlay -->
<div role="dialog" aria-modal="true" aria-label="Procesar pago">
  <!-- Foco atrapado dentro del overlay -->
  <!-- ESC cierra el overlay -->
  <!-- Al cerrar, foco vuelve al elemento que lo abrió -->
</div>

<!-- Sale result -->
<div role="alert" aria-live="assertive" aria-label="Venta completada exitosamente">
  <!-- Se anuncia automáticamente -->
</div>
```

### Notificaciones de error

```html
<!-- Error en cobro -->
<div role="alert" aria-live="assertive">
  <span aria-hidden="true">⚠️</span>
  <span>Stock insuficiente: Coca-Cola 350ml (solicitado: 5, disponible: 2)</span>
</div>
```

### Estados de carga

```html
<!-- Búsqueda en progreso -->
<div role="status" aria-live="polite">
  Buscando productos...
</div>

<!-- Procesando pago -->
<button aria-busy="true" disabled>
  Procesando...
</button>
```

---

## Contraste

| Elemento | Ratio | Aplica a |
|----------|-------|----------|
| Texto normal (body) | 4.5:1 | Labels, prices, cart lines |
| Texto grande (>18px) | 3:1 | Total, nombre de producto |
| UI components (bordes) | 3:1 | Botones, inputs |
| Estados de error | 3:1 (rojo sobre fondo claro) | Errores de stock, pago fallido |
| Disabled | 3:1 (reducido) | Botón COBRAR deshabilitado |

---

## Tamaños de touch target (Tablet)

| Elemento | Tamaño mínimo |
|----------|--------------|
| Botones de acción (Cobrar, Confirmar) | 56x56 px |
| Botones de control (+/- en cantidad) | 48x48 px |
| Input de búsqueda | 48 px altura |
| Líneas de carrito (touch area) | 48 px altura |
| Botones de método de pago | 64x64 px |

---

## Screen reader

El POS debe ser funcional con NVDA (Windows) y VoiceOver (macOS).

### Flujo de screen reader

```
1. "Barra superior. Caja 03. Juan Pérez, cajero. Consumidor Final. 10:45."
2. "Buscar producto. Input de texto."
   - Cajero escribe: "Coca"
   - "3 resultados. Coca-Cola 350ml, $12.00. Coca-Cola 600ml, $18.00. Coca-Cola 2L, $28.00."
3. "Enter para seleccionar. Coca-Cola 350ml, $12.00, agregado al carrito."
4. "Carrito. 2 productos. Coca-Cola 350ml, cantidad 1, $12.00. Botón aumentar, botón disminuir."
5. "Barra de pago. Botón Cobrar. Presiona F8 para cobrar."
```

---

## Consideraciones adicionales

| Aspecto | Implementación |
|---------|---------------|
| Movimiento reducido | `prefers-reduced-motion`: desactivar animaciones de overlay |
| Modo de alto contraste | `prefers-contrast: more`: aumentar bordes y separación |
| Reducir transparencia | `prefers-reduced-transparency`: fondos sólidos en lugar de glassmorphism |
| Zoom del navegador | El layout no se rompe hasta 200% de zoom |
| Dictado por voz | Todos los elementos tienen `aria-label` para comandos de voz |
