# UI Guidelines

> Atrio POS debe sentirse sólido, rápido y profesional. No necesita ser bonito. Necesita ser predecible.

---

## Design tokens

### Colors

```css
:root {
  /* Primario — acciones principales */
  --color-primary: #2563EB;       /* Azul 600 */
  --color-primary-hover: #1D4ED8; /* Azul 700 */
  --color-primary-text: #FFFFFF;

  /* Semántico */
  --color-success: #16A34A;       /* Verde 600 */
  --color-warning: #D97706;       /* Ámbar 600 */
  --color-error: #DC2626;         /* Rojo 600 */
  --color-info: #2563EB;          /* Azul 600 */

  /* Neutral */
  --color-bg: #F8FAFC;            /* Slate 50 */
  --color-surface: #FFFFFF;       /* White */
  --color-border: #E2E8F0;       /* Slate 200 */
  --color-text: #0F172A;          /* Slate 900 */
  --color-text-secondary: #64748B; /* Slate 500 */
  --color-disabled: #94A3B8;      /* Slate 400 */

  /* POS específico */
  --color-cart-line: #F1F5F9;     /* Slate 100 */
  --color-cart-line-selected: #DBEAFE; /* Blue 100 */
  --color-payment-cash: #16A34A;  /* Verde */
  --color-payment-card: #2563EB;  /* Azul */
  --color-payment-transfer: #7C3AED; /* Violeta */
  --color-payment-mobile: #D97706; /* Ámbar */
  --color-training-mode: #FEF3C7; /* Amber 100 */
  --color-overlay: rgba(0, 0, 0, 0.5);
}
```

### Spacing

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
}
```

### Typography

```css
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --font-size-xs: 12px;    /* Labels secundarios */
  --font-size-sm: 14px;    /* Cuerpo */
  --font-size-md: 16px;    /* Productos, carrito */
  --font-size-lg: 20px;    /* Totales */
  --font-size-xl: 24px;    /* Total principal */
  --font-size-2xl: 32px;   /* Cambio */
  --font-size-3xl: 48px;   /* Cantidad grande */
}
```

### Borders

```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-full: 9999px;

  --border-width: 1px;
  --border-width-focus: 2px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-overlay: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}
```

---

## Layout

### Desktop

```css
:root {
  --top-bar-height: 48px;
  --search-bar-height: 56px;
  --customer-zone-height: 44px;
  --totals-height: 80px;
  --payment-bar-height: 64px;
  --sidebar-width: 50%;  /* Product List = 50%, Cart = 50% */
}
```

### Tablet

```css
:root {
  --top-bar-height: 56px;
  --search-bar-height: 64px;
  --customer-zone-height: 52px;
  --totals-height: 96px;
  --payment-bar-height: 80px;
}
```

---

## Componentes

### Botones

| Tipo | Altura | Padding | Border | Sombra |
|------|--------|---------|--------|--------|
| Primary (Cobrar) | 48px (desktop) / 56px (tablet) | 16px 24px | radius-md | shadow-sm |
| Secondary | 40px | 12px 20px | radius-md | none |
| Ghost | 40px | 8px 12px | radius-md | none |
| Icon only | 40x40 px | — | radius-md | none |

### Inputs

- Altura: 40px (desktop) / 48px (tablet)
- Border: 1px solid var(--color-border)
- Focus: 2px solid var(--color-primary)
- Placeholder: var(--color-text-secondary)
- Error: 2px solid var(--color-error)

### Overlays

- Fondo: var(--color-overlay)
- Panel: var(--color-surface) con shadow-overlay
- Border-radius: radius-lg
- Padding: var(--space-xl)
- Cerrar con ESC o clic fuera

---

## Estados de carga

### Inline

Para operaciones rápidas (< 1s):

```css
.btn--loading {
  position: relative;
  color: transparent;
}
.btn--loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### Overlay de procesamiento

Para operaciones que toman tiempo (> 1s):

```css
.overlay--processing {
  /* Centered spinner + message */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}
```

---

## Animaciones

| Elemento | Animación | Duración | Timing |
|----------|-----------|----------|--------|
| Producto agregado al carrito | Fade in + slide down | 200ms | ease-out |
| Línea eliminada | Fade out + slide up | 200ms | ease-in |
| Overlay de pago | Fade in + scale | 250ms | ease-out |
| Resultado de venta | Fade in | 300ms | ease-out |
| Focus ring | Transition | 150ms | ease |

---

## Responsive

No es responsive. Son dos layouts distintos.

### Desktop (> 1024px)

- Layout de dos columnas (Product List | Cart)
- Atajos de teclado como interfaz principal
- Mouse para selección complementaria

### Tablet (≤ 1024px)

- Layout de una columna (Cart en pantalla completa)
- Gestos táctiles (swipe, long-press)
- Botones grandes
- Teclado virtual (no asumir teclado físico)

---

## Ejemplos de componentes

### Cart Line

```tsx
// 48px height, selected state with blue background
// Quantity controls inline ([-] [number] [+])
// No context menu, no long-press (desktop)
function CartLine({ line, isSelected, onQuantityChange, onRemove }) {
  return (
    <div
      role="listitem"
      aria-label={`${line.quantity} ${line.name}, ${formatCurrency(line.subtotal)}`}
      className={clsx(
        'flex items-center gap-3 px-3 h-12 border-b border-slate-100',
        isSelected && 'bg-blue-50'
      )}
    >
      <QuantityControl value={line.quantity} onChange={onQuantityChange} />
      <span className="flex-1 truncate text-sm">{line.name}</span>
      <span className="text-sm font-medium tabular-nums">
        {formatCurrency(line.subtotal)}
      </span>
      <button aria-label="Eliminar" onClick={onRemove}>
        <TrashIcon className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}
```

### Search Bar

```tsx
function SearchBar() {
  return (
    <div role="search" aria-label="Buscar producto" className="px-4 h-14 flex items-center border-b">
      <SearchIcon className="w-5 h-5 text-slate-400 mr-3" />
      <input
        type="text"
        role="searchbox"
        aria-label="Buscar producto por código, nombre, SKU o código de barras"
        placeholder="Buscar producto (F2)..."
        className="flex-1 text-base bg-transparent outline-none"
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
```

### Payment Overlay

```tsx
function PaymentOverlay({ total, onSubmit }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Procesar pago">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-overlay p-6 w-full max-w-md">
          <AmountDisplay value={total} />
          <MethodSelector />
          <AmountReceivedInput />
          <ChangeDisplay />
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={onSubmit}>Confirmar pago</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```
