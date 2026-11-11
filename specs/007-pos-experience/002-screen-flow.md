# POS Screen Flow

> Una sola pantalla. No diez.

El POS es una sola vista que se adapta al estado actual de la venta. No hay navegación entre páginas. El layout es fijo y las zonas se activan/desactivan según el flujo.

---

## Layout general

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                      │
│  Caja 03    Juan Pérez (Cajero)    Consumidor Final    10:45 │
│  [Modo Entrenamiento: OFF]                                   │
├──────────────────────────────────────────────────────────────┤
│  SEARCH BAR                                                   │
│  🔍  Buscar producto (código, nombre, SKU, código de barras) │
├──────────────────────────────┬───────────────────────────────┤
│                              │                               │
│  PRODUCT LIST                │  CART                         │
│                              │                               │
│  [Resultados de búsqueda]    │  2x Coca-Cola 350ml   $12.00 │
│                              │  1x Pan Bimbo 680g     $8.50 │
│                              │                               │
│                              │                               │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│  CUSTOMER ZONE               │  TOTALS                       │
│                              │  Subtotal           $35.50    │
│  [Consumidor Final]  [F4]   │  IVA 16%             $5.68    │
│  Cliente asignado            │  Total              $41.18    │
├──────────────────────────────┴───────────────────────────────┤
│  PAYMENT BAR                                                  │
│  [💵 Efectivo] [💳 Tarjeta] [📱 Pago Móvil] [🏦 Transf.]    │
│                          [COBRAR]  (F8)  [Suspender]          │
└──────────────────────────────────────────────────────────────┘
```

---

## Zonas

### 1. Top Bar (altura fija: 48px)

| Elemento | Contenido | Comportamiento |
|----------|-----------|---------------|
| Caja | Identificador de la caja activa | Mostrar siempre |
| Cajero | Nombre del usuario logueado | Mostrar siempre |
| Cliente actual | Nombre del cliente asignado | Default: Consumidor Final |
| Reloj | Hora actual | Actualizar cada minuto |
| Modo Entrenamiento | Badge ON/OFF | ON = fondo amarillo, indicador visible |

**Responsive:** Top Bar se mantiene igual en Desktop y Tablet.

### 2. Search Bar (altura fija: 56px)

| Estado | Comportamiento |
|--------|---------------|
| Por defecto | Input vacío con placeholder "Buscar producto..." |
| Escribiendo | Resultados dropdown sobre la lista de productos |
| Sin resultados | "Producto no encontrado. Verifica el código o nombre." |
| Error de red | "Sin conexión. Usando catálogo local." |

**Foco automático:** Al iniciar venta y después de agregar un producto, el foco vuelve a Search Bar.

**Keyboard-only:**
- `F2` o `/` → foco en Search Bar
- `ESC` → limpiar búsqueda y quitar foco
- `↑↓` → navegar resultados
- `Enter` → seleccionar y agregar al carrito

### 3. Product List (flexible, ocupa espacio disponible)

| Estado | Contenido |
|--------|-----------|
| Sin búsqueda | Vacío o categorías rápidas (V2) |
| Buscando | Resultados filtrados |
| Producto seleccionado | Se agrega al carrito, lista vuelve a vacío |

**Virtual scrolling** para catálogos grandes (> 1000 productos).

**Ancho:** 50% en Desktop, 100% en Tablet (toggle con carrito).

### 4. Cart (flexible, ocupa espacio disponible)

Siempre visible. Muestra:

- Lista de líneas con cantidad, nombre, precio, subtotal
- Controles inline: `[-]` `[+]` `[Supr]`
- Línea actual resaltada (navegación con teclado)

**Ancho:** 50% en Desktop, 100% en Tablet (cubre toda la pantalla cuando está activo).

**Estados:**

| Estado | Contenido |
|--------|-----------|
| Vacío | "Agrega productos para iniciar la venta" |
| Con productos | Lista + totales arriba del payment bar |
| Suspendido | (V2) Badge "Venta suspendida" + botón "Reanudar" |

### 5. Customer Zone (altura fija: 44px)

| Estado | Contenido |
|--------|-----------|
| Default | "Consumidor Final" con icono de persona |
| Cliente asignado | "Nombre del Cliente (RIF: J-XXX)" con icono de check |
| Búsqueda abierta | Dropdown con resultados + "Crear cliente rápido" |

**Atajo:** `F4` abre/cierra la búsqueda de cliente.

### 6. Totals (altura fija: 80px)

| Elemento | Comportamiento |
|----------|---------------|
| Subtotal | Suma de precios sin impuestos |
| IVA | Cálculo según tasa configurable del tenant |
| Total | Subtotal + impuestos - descuentos |

Se actualiza en tiempo real al modificar el carrito.

### 7. Payment Bar (altura fija: 64px)

| Elemento | Comportamiento |
|----------|---------------|
| Botones de método | Seleccionar método de pago (toggle visual) |
| Botón COBRAR | Principal CTA. Deshabilitado si carrito vacío |
| Botón Suspender | (V2) Guardar venta para retomar después |

**Al presionar Cobrar:**

Si el carrito tiene productos y método seleccionado:

1. Zona de métodos se expande (overlay o modal inline)
2. Input para monto recibido
3. Cálculo de cambio

---

## Flujo de estados del layout

### Estado: Venta activa (default)

```
Top Bar  →  Search Bar  →  Product List | Cart  →  Customer | Totals  →  Payment Bar
```

Todo visible. Cajero puede operar sin restricciones.

### Estado: Cobrando

```
Top Bar  →  Search Bar (deshabilitada)  →  Product List (deshabilitada) | Cart (deshabilitado)
→  Customer (deshabilitado) | Totals (resaltado)  →  Payment Overlay
```

Las zonas se deshabilitan visualmente (opacidad reducida). El overlay de pago ocupa el centro.

### Estado: Venta completada

```
Top Bar  →  Resultado (overlay success)
```

Todo lo demás se oculta temporalmente para mostrar el resultado. Auto-cierra a los 10s.

### Estado: Sin sesión

```
Pantalla de login → Apertura de caja
```

Nada del POS es accesible sin sesión activa.

---

## Transiciones

```
┌──────────┐
│ Login    │
└────┬─────┘
     ↓
┌──────────┐     ┌──────────────────┐
│ Abrir    │────→│ Venta Activa     │
│ Caja     │     │ (layout default) │
└──────────┘     └────────┬─────────┘
                          │
                    ┌─────┴──────┐
                    │            │
               F8/Cobrar    F2/Suspender
                    │            │
                    ↓            ↓
              ┌──────────┐  ┌───────────┐
              │ Cobrando │  │ Suspendida│ (V2)
              │(overlay) │  │           │
              └────┬─────┘  └───────────┘
                   │              │
              Pago exitoso    Reanudar
                   │              │
                   ↓              ↓
              ┌──────────┐  ┌──────────┐
              │ Resultado│  │Venta Activ│
              │(10s auto)│  └──────────┘
              └────┬─────┘
                   │
              CTRL+N o 10s
                   ↓
              ┌──────────┐
              │Venta Activ│
              │(nueva)    │
              └──────────┘
```

---

## Componentes clave

| Componente | Descripción | Estado |
|------------|-------------|--------|
| `TopBar` | Barra superior con info de sesión | V1 |
| `SearchBar` | Input de búsqueda con dropdown | V1 |
| `ProductList` | Resultados de búsqueda (virtual scroll) | V1 |
| `CartLine` | Línea individual del carrito | V1 |
| `CustomerZone` | Selector de cliente | V1 |
| `PaymentBar` | Barra inferior con métodos y cobrar | V1 |
| `PaymentOverlay` | Overlay de cobro (monto, cambio, confirmar) | V1 |
| `SaleResult` | Overlay de resultado exitoso | V1 |
| `QuickActions` | Indicador visual de atajos disponibles | V2 |

---

## POS Tablet

El layout es el **mismo**, pero cambian las proporciones:

```
┌──────────────────────┐
│ TOP BAR              │
├──────────────────────┤
│ SEARCH BAR           │
├──────────────────────┤
│                      │
│ CART (pantalla       │
│ completa)            │
│                      │
├──────────────────────┤
│ CUSTOMER | TOTALS    │
├──────────────────────┤
│ PAYMENT BAR          │
└──────────────────────┘
```

- Product List se oculta en Tablet (se accede desde el carrito con un botón "+")
- Botones más grandes (altura mínima 48px)
- Gestos: swipe para eliminar, long-press para editar cantidad
- Sin hover states, todo es active/focus
