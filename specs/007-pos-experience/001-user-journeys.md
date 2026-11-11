# PX User Journeys

> El POS no es una página. Es un **estado de trabajo** que el cajero habita durante su turno.
> Cada journey describe una experiencia completa, no una pantalla.

---

## PX-01: Abrir Caja

### Flujo principal

```
1. Cajero ingresa credenciales (usuario + contraseña o PIN)
2. Sistema verifica credenciales contra auth
3. Cajero selecciona caja asignada (o el sistema la detecta automáticamente)
4. Sistema valida que la caja no esté abierta en otra sesión
5. Caja se abre con saldo inicial (opcional, configurable)
6. Cajero ve la pantalla principal del POS lista para operar
```

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| No hay cajas disponibles | Mostrar mensaje claro: "No hay cajas disponibles. Contacta a tu supervisor." |
| Caja ya está abierta | Ofrecer retomar sesión activa o forzar cierre |
| Cajero olvidó contraseña | Enlace para restablecer (redirige a auth) |
| PIN incorrecto 3 veces | Bloqueo temporal de 30 segundos |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Ingresar PIN | `Enter` | Botón "Ingresar" |
| Seleccionar caja | `↑↓` + `Enter` | Tap |

### Validaciones duras

- No se puede realizar ninguna operación POS sin una sesión activa
- Una caja no puede estar abierta en dos terminales simultáneamente
- El saldo inicial debe ser ≥ 0

---

## PX-02: Buscar Producto

### Flujo principal

```
1. Input de búsqueda tiene foco automático al iniciar la venta (o al presionar F2)
2. Cajero escribe: código, nombre, SKU, código de barras, o búsqueda parcial
3. Resultados aparecen en < 200 ms mientras escribe
4. Cajero selecciona producto con Enter o clic
5. Producto se agrega al carrito
6. Input de búsqueda recupera el foco automáticamente
```

### Reglas de búsqueda

| Input | Busca en |
|-------|---------|
| `75010553` | Código de barras (exacto) |
| `ARL-001` | SKU (exacto) |
| `Coca` | Nombre (contiene, case-insensitive) |
| `Coca 3` | Parcial en múltiples campos |
| `7501` | Código de barras parcial |

### Orden de resultados

1. Código de barras exacto > SKU exacto > nombre exacto > parcial
2. Más vendidos > mayor stock > alfabético

### Comportamiento sin conexión

- Debe cargar un catálogo local (cacheado en IndexedDB) para búsqueda offline
- Si no hay conexión ni catálogo local, mostrar "Sin conexión. Carga el catálogo antes de desconectarte."

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| Sin resultados | Mostrar "Producto no encontrado. Verifica el código o nombre." |
| Múltiples resultados | Lista scrolleable, selección con `↑↓` + `Enter` |
| Escáner de código de barras | El input captura del escáner como si fuera teclado (no requiere foco especial) |
| Producto sin stock | Mostrar en rojo "Sin stock" pero permitir agregar (configurable por tenant) |
| Producto descontinuado | Mostrar en gris "Descontinuado" y no permitir agregar |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Foco en búsqueda | `F2` o `/` | Tap en barra |
| Seleccionar resultado | `Enter` o `Tab` | Tap |
| Navegar resultados | `↑↓` | Scroll |
| Salir de búsqueda | `ESC` | Tap fuera |

---

## PX-03: Carrito

### Flujo principal

```
1. Producto se agrega al carrito inmediatamente al seleccionarlo
2. Cajero puede:
   - Cambiar cantidad (+ / - o tecleando número)
   - Eliminar línea (Supr)
   - Ver subtotal por línea
3. Carrito muestra siempre el total acumulado en la zona de Totales
```

### Reglas del carrito

| Regla | Comportamiento |
|-------|---------------|
| Cantidad | Min 1, sin máximo (valida stock al cobrar, no al agregar) |
| Producto duplicado | Incrementar cantidad en lugar de agregar nueva línea |
| Precio | Toma el precio vigente del producto al momento de agregar |
| Descuento por línea | (V2) Permitir descuento porcentual o fijo por línea |
| Comentario por línea | (V2) Nota interna opcional por producto |

### Visualización

```
┌─────────────────────────────────────────┐
│ 2x  Coca-Cola 350ml       $12.00  [−][+]│
│ 1x  Pan Bimbo 680g         $8.50  [−][+]│
│ 3x  Leche Lala 1L         $15.00  [−][+]│
├─────────────────────────────────────────┤
│                              Subtotal    │
│                              $35.50      │
│                              IVA 16%     │
│                              $5.68       │
│                           ──────────     │
│                              Total       │
│                              $41.18      │
└─────────────────────────────────────────┘
```

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| Carrito vacío | Mostrar "Agrega productos para iniciar la venta" |
| Cantidad > stock | Mostrar advertencia "Stock disponible: X" pero permitir (configurable) |
| Eliminar línea | Confirmación no requerida (el cajero sabe lo que hace) |
| Deshacer | (V2) CTRL+Z para restaurar última línea eliminada |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Navegar líneas | `↑↓` | Scroll |
| Aumentar cantidad | `+` o `→` | Tap `+` |
| Disminuir cantidad | `-` o `←` | Tap `-` |
| Eliminar línea | `Supr` | Swipe left + confirm |
| Agregar producto | `F2` (vuelve a búsqueda) | Tap en búsqueda |

---

## PX-04: Cliente

### Flujo principal

```
1. Por defecto: "Consumidor Final"
2. Cajero puede asignar cliente en cualquier momento
3. Busca cliente por: RIF, nombre, teléfono, email
4. Selecciona y el cliente se asocia a la venta
5. Si el cliente no existe: creación rápida (nombre + RIF, opcional teléfono)
6. Si ya hay productos en carrito, no se pierden al cambiar cliente
```

### Creación rápida

Para no bloquear la fila, crear cliente debe ser:

| Campo | Requerido | Default |
|-------|-----------|---------|
| Nombre o Razón Social | Sí | — |
| RIF / Cédula | Sí | — |
| Teléfono | No | — |
| Email | No | — |
| Dirección | No | — |

```
┌─────────────────────────────────┐
│ Buscar cliente...               │
├─────────────────────────────────┤
│ Consumidor Final (por defecto)  │
│ Juan Pérez     [RIF: J-123...] │
│ María López    [RIF: J-456...] │
│ + Crear cliente rápido          │
└─────────────────────────────────┘
```

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| Sin cliente seleccionado | Facturar como Consumidor Final |
| Cliente con crédito vencido | Mostrar alerta "Cliente con crédito vencido" pero permitir venta |
| Cliente bloqueado | No permitir venta, mostrar motivo del bloqueo |
| Creación rápida | Mínimo de campos, sin redirección a página de partners |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Abrir búsqueda cliente | `F4` | Tap en zona cliente |
| Seleccionar cliente | `Enter` | Tap |
| Crear cliente rápido | `CTRL + C` | Tap "+" |
| Volver a Consumidor Final | `CTRL + Shift + C` | Botón "Consumidor Final" |

---

## PX-05: Cobro

### Flujo principal

```
1. Cajero presiona F8 o botón "Cobrar"
2. POS valida stock en tiempo real
3. Si hay suficiente stock, muestra pantalla de métodos de pago
4. Cajero selecciona método: Efectivo | Transferencia | Tarjeta | Pago Móvil
5. Ingresa monto recibido (en efectivo, el resto es automático)
6. POS procesa el pago
7. Muestra resultado: éxito + cambio (si efectivo) o error
```

### Métodos de pago (V1)

| Método | Comportamiento |
|--------|---------------|
| Efectivo | Input para monto recibido, cálculo automático de cambio |
| Transferencia | Referencia opcional (número de transferencia) |
| Tarjeta | Confirmación POS externo (solo marcar como pagado) |
| Pago Móvil | Teléfono + banco + referencia |

### Pantalla de cobro

```
┌──────────────────────────────────────┐
│         Total: $41.18                │
├──────────────────────────────────────┤
│                                      │
│  [💵 Efectivo]  [💳 Tarjeta]        │
│  [📱 Pago Móvil] [🏦 Transferencia] │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Monto recibido:  $  [50.00]   │  │
│  │ Cambio:           $  8.82     │  │
│  └────────────────────────────────┘  │
│                                      │
│         [CONFIRMAR]  [Cancelar]      │
└──────────────────────────────────────┘
```

### Validaciones

- Si stock insuficiente → error antes de mostrar pantalla de pago, no después
- Si el monto recibido < total → botón "Confirmar" deshabilitado
- Si el monto recibido = 0 en efectivo → mostrar error "Ingresa el monto recibido"

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| Stock insuficiente | Mostrar qué producto(s) y cuánto falta. Ofrecer ajustar cantidad. |
| Error de red al procesar | Reintentar automático 1 vez. Si falla, guardar venta como "Pendiente de pago" |
| Cliente no lleva suficiente efectivo | Ofrecer cambiar a otro método (no reiniciar la venta) |
| Pago exitoso | Pasar automáticamente a PX-06 |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Ir a cobro | `F8` | Tap "Cobrar" |
| Seleccionar método | `↑↓←→` + `Enter` | Tap |
| Confirmar pago | `Enter` (si está habilitado) | Tap "Confirmar" |
| Cancelar pago | `ESC` | Botón "Cancelar" |
| Ingresar monto exacto | `CTRL + Enter` | — |

---

## PX-06: Finalizar

### Flujo principal

```
1. Pago exitoso → mostrar pantalla de resultado
2. Mostrar cambio (si aplica)
3. Opción: Imprimir comprobante (Enter o CTRL+P)
4. Opcional: Enviar comprobante por email/SMS
5. Opción: Nueva venta (Enter o CTRL+N)
6. Si no hay acción en 10 segundos, volver automáticamente a nueva venta
```

### Pantalla de resultado

```
┌──────────────────────────────────────┐
│          ✅ VENTA EXITOSA            │
│                                      │
│  Total:              $41.18           │
│  Recibido:           $50.00           │
│  Cambio:             $ 8.82           │
│                                      │
│  [🖨️ Imprimir]  [📧 Enviar]          │
│                                      │
│  [Nueva Venta]  [Cerrar]             │
└──────────────────────────────────────┘
```

### Variantes

| Situación | Comportamiento |
|-----------|---------------|
| Impresora no conectada | Mostrar "Impresora no disponible. Puedes reimprimir desde el historial." |
| Envío por email | Pedir email si no está asociado al cliente |
| Nueva venta | Limpiar carrito, mantener cliente, mantener sesión |
| Inactividad post-venta | Auto-nueva-venta después de 10 segundos |

### Atajos

| Acción | Desktop | Tablet |
|--------|---------|--------|
| Imprimir | `CTRL + P` | Tap "Imprimir" |
| Enviar email | `CTRL + E` | Tap "Enviar" |
| Nueva venta | `CTRL + N` | Tap "Nueva Venta" |
| Salir (auto) | (10 s de inactividad) | (10 s de inactividad) |

---

## Flujo completo del cajero (sin pausas)

```
[Llega]  →  Abre caja  →  F2 + "Coca" + Enter  →  F4 + "Consumidor Final"
→  F8  →  Selecciona método  →  Ingresa monto  →  Enter
→  CTRL + P  →  CTRL + N  →  [Siguiente venta]
```

**Tiempo estimado con práctica:** < 20 segundos por venta.
**Clicks por venta:** 6 (F2, escribir, Enter (x2), F8, seleccionar método, Enter, Enter de confirmar)
