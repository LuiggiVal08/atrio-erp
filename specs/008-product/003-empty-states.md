# Empty States

> La mayoría de los sistemas muestran una tabla vacía y asumen que el usuario sabe qué hacer.
> Atrio nunca deja al usuario preguntándose "¿y ahora qué?".

---

## Tablas de listado

### Productos

```
┌──────────────────────────────────────────────┐
│                                              │
│     📦 Aún no has creado productos           │
│                                              │
│     Los productos son lo que vendes.         │
│     Puedes crearlos uno por uno o            │
│     importarlos desde Excel.                 │
│                                              │
│     [+ Crear producto]  [Importar desde Excel]│
│                                              │
└──────────────────────────────────────────────┘
```

| Variable | Valor |
|----------|-------|
| Título | "Aún no has creado productos" |
| Subtítulo | "Los productos son lo que vendes. Puedes crearlos uno por uno o importarlos desde Excel." |
| Acciones | [+ Crear producto], [Importar desde Excel] |

### Clientes

```
┌──────────────────────────────────────────────┐
│                                              │
│     👤 Aún no has registrado clientes        │
│                                              │
│     Los clientes se asignan a las ventas     │
│     para generar facturas y reportes.        │
│     También puedes vender como Consumidor    │
│     Final sin registrar cliente.             │
│                                              │
│     [+ Crear cliente]  [Ir al POS]           │
│                                              │
└──────────────────────────────────────────────┘
```

| Variable | Valor |
|----------|-------|
| Título | "Aún no has registrado clientes" |
| Subtítulo | "Los clientes se asignan a las ventas para generar facturas y reportes. También puedes vender como Consumidor Final sin registrar cliente." |
| Acciones | [+ Crear cliente], [Ir al POS] |

### Usuarios

```
┌──────────────────────────────────────────────┐
│                                              │
│     👥 Aún no has creado usuarios            │
│                                              │
│     Los usuarios son las personas que        │
│     usarán Atrio. Cada usuario tiene un      │
│     rol que define lo que puede hacer.       │
│                                              │
│     El primer usuario (tú) ya está creado.   │
│                                              │
│     [+ Invitar usuario]                      │
│                                              │
└──────────────────────────────────────────────┘
```

### Roles

```
┌──────────────────────────────────────────────┐
│                                              │
│     🛡️ Aún no has creado roles               │
│                                              │
│     Los roles agrupan permisos. Por          │
│     defecto existen: Admin, Cajero,          │
│     Supervisor. Puedes crear más.            │
│                                              │
│     [+ Crear rol]                            │
│                                              │
└──────────────────────────────────────────────┘
```

### Cajas

```
┌──────────────────────────────────────────────┐
│                                              │
│     💵 Aún no has configurado cajas          │
│                                              │
│     Las cajas son los puntos de venta.       │
│     Cada caja tiene un saldo y un            │
│     historial de movimientos.                │
│                                              │
│     [+ Crear caja]                           │
│                                              │
└──────────────────────────────────────────────┘
```

### Ventas (historial)

```
┌──────────────────────────────────────────────┐
│                                              │
│     🧾 No hay ventas registradas             │
│                                              │
│     Las ventas aparecerán aquí una vez       │
│     que realices tu primera venta en el POS. │
│                                              │
│     [Ir al POS]                              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Búsquedas sin resultados

### Búsqueda de productos

```
┌──────────────────────────────────────────────┐
│                                              │
│     No encontramos resultados para           │
│     "Coca-Cola 2L"                          │
│                                              │
│     Sugerencias:                             │
│     • Verifica la ortografía                 │
│     • Prueba con el código de barras         │
│     • Prueba con el SKU                      │
│     • El producto podría estar archivado     │
│                                              │
│     [Limpiar búsqueda]                       │
│                                              │
└──────────────────────────────────────────────┘
```

### Búsqueda de clientes

```
┌──────────────────────────────────────────────┐
│                                              │
│     No encontramos resultados para           │
│     "J-123456789"                            │
│                                              │
│     Sugerencias:                             │
│     • Verifica el RIF o cédula              │
│     • Prueba con el nombre del cliente       │
│     • El cliente podría estar archivado      │
│                                              │
│     [+ Crear cliente rápido]                 │
│                                              │
└──────────────────────────────────────────────┘
```

---

## POS: estados específicos

### Carrito vacío

```
┌─────────────────────────────┐
│                             │
│    Agrega productos para    │
│    iniciar la venta         │
│                             │
│    Presiona F2 o escribe    │
│    el código de barras      │
│                             │
└─────────────────────────────┘
```

### Sin sesión activa

```
┌──────────────────────────────┐
│                              │
│     🔒 Sesión cerrada        │
│                              │
│     Debes abrir una caja     │
│     para comenzar a vender.  │
│                              │
│     [Abrir caja]             │
│                              │
└──────────────────────────────┘
```

### Sin conexión

```
┌──────────────────────────────────┐
│                                  │
│     📡 Sin conexión              │
│                                  │
│     Puedes seguir vendiendo.     │
│     Las ventas se guardarán      │
│     y sincronizarán cuando       │
│     recuperes la conexión.       │
│                                  │
│     [Entendido]  [Ver cola]      │
│                                  │
└──────────────────────────────────┘
```

---

## Dashboard vacío (primer día)

```
┌──────────────────────────────────────────────┐
│                                              │
│     📊 Resumen de hoy                        │
│                                              │
│     Aún no hay datos que mostrar.            │
│                                              │
│     Aquí verás:                              │
│     • Ventas del día                         │
│     • Cajas abiertas                         │
│     • Productos más vendidos                 │
│     • Alertas y notificaciones               │
│                                              │
│     [Ir al POS]  [Configurar productos]      │
│                                              │
└──────────────────────────────────────────────┘
```
