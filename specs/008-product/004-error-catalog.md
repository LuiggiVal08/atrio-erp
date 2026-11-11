# Error Catalog

> No errores HTTP. Errores de negocio.
> Cada error debe decirle al usuario QUÉ pasó, POR QUÉ pasó y QUÉ puede hacer.

---

## Formato de error

```
[Código de error] — [Título legible]

[Mensaje descriptivo]

[Qué puede hacer el usuario]
```

### Visualización

```
┌──────────────────────────────────────────────────┐
│  ⚠️  Stock insuficiente  [ERR-POS-001]           │
│                                                  │
│  El producto "Coca-Cola 350ml" tiene stock       │
│  disponible de 2 unidades, pero solicitaste 5.   │
│                                                  │
│  Puedes:                                         │
│  • Reducir la cantidad a 2 o menos               │
│  • Elegir otro producto                          │
│  • Contactar al administrador si crees           │
│    que el stock debería ser mayor                │
│                                                  │
│  ┌────────────────────────────┐                  │
│  │  [Ajustar cantidad]        │                  │
│  └────────────────────────────┘                  │
└──────────────────────────────────────────────────┘
```

---

## POS

### ERR-POS-001: Stock insuficiente

```text
Stock insuficiente

El producto "{nombre}" tiene stock disponible de {disponible} unidades, pero solicitaste {solicitado}.

• Reduce la cantidad a {disponible} o menos
• Elige otro producto similar
• Contacta al administrador si el stock es incorrecto
```

### ERR-POS-002: Producto descontinuado

```text
Producto descontinuado

El producto "{nombre}" ya no está disponible para la venta.

• Busca un producto similar
• El administrador puede reactivarlo si es necesario
```

### ERR-POS-003: Cliente bloqueado

```text
Cliente bloqueado

El cliente "{nombre}" ({RIF}) está bloqueado por: {motivo}.

• Usa otro cliente o vende como Consumidor Final
• El administrador puede desbloquear al cliente
```

### ERR-POS-004: Caja ya abierta

```text
Caja ocupada

La caja "{nombre}" ya está abierta en "{ubicación/terminal}".

• Usa otra caja disponible
• Si es un error, el supervisor puede forzar el cierre remoto
```

### ERR-POS-005: Sesión expirada

```text
Sesión expirada

Tu sesión ha expirado por inactividad.

• Ingresa nuevamente tu PIN para continuar
• Los datos de la venta actual se han guardado
```

### ERR-POS-006: Error al procesar pago

```text
Error al procesar el pago

No se pudo completar el pago. El carrito se ha conservado.

• Verifica tu conexión a internet
• Intenta de nuevo
• Si el error persiste, contacta al administrador
```

### ERR-POS-007: Monto insuficiente

```text
Monto insuficiente

El monto recibido (${recibido}) es menor al total (${total}).

• Ingresa un monto igual o mayor al total
• Si el cliente paga con otro método, selecciona el método correspondiente
```

### ERR-POS-008: Sin conexión — Pago con tarjeta no disponible

```text
Pago con tarjeta no disponible sin conexión

Los pagos con tarjeta requieren conexión a internet.

• Usa efectivo, transferencia o pago móvil
• Cuando恢复了 la conexión, podrás procesar pagos con tarjeta
```

### ERR-POS-009: Venta no encontrada

```text
Venta no encontrada

No encontramos la venta que intentas recuperar.

• Puede haber sido eliminada o haber expirado
• Revisa el historial de ventas
```

---

## Productos

### ERR-PRD-001: Producto no encontrado

```text
Producto no encontrado

No encontramos un producto con "{término de búsqueda}".

• Verifica el código, nombre o SKU
• Prueba con una búsqueda parcial
• El producto podría estar archivado
```

### ERR-PRD-002: SKU duplicado

```text
SKU duplicado

El SKU "{sku}" ya está registrado para otro producto.

• Usa un SKU diferente
• Si el producto es el mismo, actualiza el existente
```

### ERR-PRD-003: Código de barras duplicado

```text
Código de barras duplicado

El código de barras "{barcode}" ya está registrado.

• Verifica que el código sea correcto
• Si es correcto, actualiza el producto existente
```

### ERR-PRD-004: Precio inválido

```text
Precio inválido

El precio debe ser mayor a 0.

• Ingresa un precio válido
• Si el producto es un regalo, usa precio $0 (requiere permiso especial)
```

---

## Clientes

### ERR-CLI-001: Cliente no encontrado

```text
Cliente no encontrado

No encontramos un cliente con "{término de búsqueda}".

• Verifica el RIF, nombre o teléfono
• Prueba con otro término
• Crea un cliente rápido si es nuevo
```

### ERR-CLI-002: RIF duplicado

```text
RIF duplicado

El RIF "{RIF}" ya está registrado para otro cliente.

• Si el cliente ya existe, búscalo por nombre
• Si es un error, verifica el RIF ingresado
```

### ERR-CLI-003: Cliente con crédito vencido

```text
Crédito vencido

El cliente "{nombre}" tiene pagos vencidos por ${monto}.

• Puedes vender al cliente, pero se mostrará una advertencia
• El administrador puede revisar el estado del crédito
```

---

## Caja

### ERR-CAJ-001: Caja no encontrada

```text
Caja no encontrada

No encontramos la caja "{nombre}".

• Verifica el nombre de la caja
• Puede haber sido eliminada o archivada
```

### ERR-CAJ-002: Caja ya cerrada

```text
Caja ya cerrada

La caja "{nombre}" ya fue cerrada el {fecha} a las {hora}.

• Si necesitas reabrirla, el supervisor puede hacerlo
• Revisa el historial de cierres
```

### ERR-CAJ-003: Saldo inicial inválido

```text
Saldo inicial inválido

El saldo inicial debe ser mayor o igual a $0.

• Ingresa un saldo válido
• Si la caja no tiene efectivo inicial, ingresa $0
```

---

## Usuarios y permisos

### ERR-USR-001: Sin permiso

```text
Acción no permitida

No tienes permiso para realizar esta acción.

• Contacta a tu administrador si necesitas acceso
```

### ERR-USR-002: Usuario bloqueado

```text
Usuario bloqueado

Tu usuario ha sido bloqueado. Contacta a tu administrador.

• El administrador puede desbloquear tu cuenta
```

### ERR-USR-003: Usuario inactivo

```text
Sesión cerrada por inactividad

Tu sesión se cerró por inactividad. Ingresa nuevamente.
```

---

## Red y sistema

### ERR-SYS-001: Sin conexión

```text
Sin conexión a internet

Algunas funciones pueden no estar disponibles.

• Puedes seguir vendiendo (las ventas se guardarán)
• La sincronización se reanudará automáticamente
```

### ERR-SYS-002: Error del servidor

```text
Error del servidor

Ocurrió un error inesperado. El equipo técnico ha sido notificado.

• Intenta de nuevo en unos minutos
• Si el error persiste, contacta a soporte
```

### ERR-SYS-003: Versión desactualizada

```text
Versión desactualizada

Tu versión de Atrio no es compatible con el servidor.

• Recarga la página para obtener la última versión
• Si el problema persiste, borra el caché del navegador
```

---

## Cómo mostrar errores

### En formularios

```
┌─────────────────────────────┐
│  Nombre del producto        │
│  ┌───────────────────────┐  │
│  │ Coca-Cola 350ml       │  │
│  └───────────────────────┘  │
│  ⚠ El nombre ya existe      │  ← error debajo del campo
└─────────────────────────────┘
```

### En notificaciones

```
┌──────────────────────────────────────┐
│  ❌ Error al procesar el pago        │
│     Verifica tu conexión e           │
│     intenta de nuevo.                │
│                           [Cerrar]   │
└──────────────────────────────────────┘
```

### En modales de confirmación

```
┌──────────────────────────────────────┐
│  ⚠ Stock insuficiente               │
│                                      │
│  El producto "Coca-Cola 350ml"       │
│  tiene solo 2 unidades disponibles.  │
│                                      │
│  [Ajustar cantidad]  [Cancelar]      │
└──────────────────────────────────────┘
```

---

## Lo que NUNCA debe ver un usuario

| ❌ MAL | ✅ BIEN |
|--------|---------|
| `500 Internal Server Error` | "Error del servidor. Intenta de nuevo." |
| `TypeError: Cannot read property 'id' of undefined` | "No encontramos el producto solicitado." |
| `NetworkError` | "Sin conexión a internet." |
| `NullPointerException` | "Ocurrió un error inesperado." |
| `[object Object]` | Mensaje descriptivo en texto |
| Código de error sin mensaje | "Error ERR-POS-001: Stock insuficiente" |
