# Acceptance Criteria

> Cada experiencia (PX) tiene criterios de aceptación que deben cumplirse para considerar la experiencia completa.
> Los criterios son verificables, no subjetivos.

---

## PX-01: Abrir Caja

### AC-01.01 — Login exitoso
- [ ] Cajero ingresa usuario y contraseña válidos
- [ ] Sistema redirige a selección de caja
- [ ] Si solo hay una caja asignada, se selecciona automáticamente

### AC-01.02 — Selección de caja
- [ ] Cajero ve lista de cajas disponibles (o caja predeterminada)
- [ ] Cajero selecciona una caja
- [ ] Sistema verifica que la caja no esté abierta en otra sesión

### AC-01.03 — Apertura con saldo inicial
- [ ] Cajero ingresa saldo inicial (o 0 si no aplica)
- [ ] Sistema abre la caja y muestra pantalla principal del POS
- [ ] Saldo inicial queda registrado en el historial de caja

### AC-01.04 — Error: caja ocupada
- [ ] Cajero intenta abrir caja ya abierta en otra sesión
- [ ] Sistema muestra "Caja ya está abierta en [terminal/ubicación]"
- [ ] Sistema ofrece "Forzar cierre" (solo supervisores)

### AC-01.05 — Error: credenciales inválidas
- [ ] Cajero ingresa credenciales incorrectas
- [ ] Sistema muestra "Usuario o contraseña incorrectos"
- [ ] Tras 3 intentos fallidos, bloqueo de 30 segundos

### AC-01.06 — Sin cajas disponibles
- [ ] Cajero sin cajas asignadas
- [ ] Sistema muestra "No tienes cajas asignadas. Contacta a tu supervisor."

---

## PX-02: Buscar Producto

### AC-02.01 — Búsqueda por código de barras
- [ ] Cajero escanea o escribe código de barras de 8-13 dígitos
- [ ] Sistema encuentra el producto por coincidencia exacta
- [ ] Producto se agrega al carrito automáticamente

### AC-02.02 — Búsqueda por SKU
- [ ] Cajero escribe SKU (ej: "ARL-001")
- [ ] Sistema encuentra el producto por coincidencia exacta
- [ ] Producto se agrega al carrito (o se muestra en resultados)

### AC-02.03 — Búsqueda por nombre
- [ ] Cajero escribe "Coca"
- [ ] Sistema muestra productos cuyo nombre contenga "Coca"
- [ ] Resultados ordenados por relevancia (más vendidos primero)

### AC-02.04 — Búsqueda parcial
- [ ] Cajero escribe "Coca 3"
- [ ] Sistema busca coincidencias parciales en nombre, SKU y código
- [ ] Muestra resultados relevantes

### AC-02.05 — Sin resultados
- [ ] Cajero escribe un texto sin coincidencias
- [ ] Sistema muestra "Producto no encontrado. Verifica el código o nombre."

### AC-02.06 — Búsqueda offline
- [ ] POS offline y catálogo local disponible
- [ ] Búsqueda funciona igual que online (mismos resultados)
- [ ] POS offline y sin catálogo local
- [ ] Sistema muestra "Sin conexión. Carga el catálogo antes de desconectarte."

### AC-02.07 — Rendimiento de búsqueda
- [ ] Resultados aparecen en < 200 ms desde keyup (online y offline)
- [ ] Debounce de 150ms no causa percepción de lentitud

---

## PX-03: Carrito

### AC-03.01 — Agregar producto
- [ ] Cajero selecciona producto de búsqueda
- [ ] Producto se agrega al carrito
- [ ] Foco vuelve a Search Bar
- [ ] Total se actualiza inmediatamente

### AC-03.02 — Producto duplicado
- [ ] Cajero agrega el mismo producto dos veces
- [ ] Cantidad se incrementa en lugar de crear nueva línea
- [ ] Total se actualiza correctamente

### AC-03.03 — Cambiar cantidad
- [ ] Cajero selecciona línea del carrito y presiona `+` o `→`
- [ ] Cantidad aumenta en 1
- [ ] Cajero presiona `-` o `←`
- [ ] Cantidad disminuye en 1
- [ ] Cajero escribe número directamente
- [ ] Cantidad se actualiza al número escrito
- [ ] Cantidad no puede ser menor a 1

### AC-03.04 — Eliminar línea
- [ ] Cajero selecciona línea y presiona `Supr`
- [ ] Línea se elimina sin confirmación
- [ ] Total se actualiza
- [ ] Si era la única línea, carrito muestra "Agrega productos para iniciar la venta"

### AC-03.05 — Carrito vacío
- [ ] Sin productos en carrito
- [ ] Botón COBRAR deshabilitado
- [ ] Mensaje "Agrega productos para iniciar la venta" visible

### AC-03.06 — Cálculo de totales
- [ ] Subtotal = suma de precio × cantidad de cada línea
- [ ] IVA = subtotal × tasa de impuesto del tenant
- [ ] Total = subtotal + IVA

---

## PX-04: Cliente

### AC-04.01 — Consumidor Final por defecto
- [ ] Nueva venta se crea sin cliente asignado
- [ ] Customer Zone muestra "Consumidor Final"

### AC-04.02 — Buscar cliente
- [ ] Cajero presiona `F4`
- [ ] Input de búsqueda de cliente aparece
- [ ] Cajero escribe RIF, nombre, teléfono o email
- [ ] Resultados aparecen en < 500 ms

### AC-04.03 — Seleccionar cliente
- [ ] Cajero selecciona cliente de resultados
- [ ] Customer Zone muestra nombre y RIF del cliente
- [ ] Productos en carrito no se pierden

### AC-04.04 — Creación rápida de cliente
- [ ] Cajero no encuentra cliente y presiona "Crear cliente rápido"
- [ ] Formulario mínimo: Nombre + RIF (obligatorio), Teléfono (opcional)
- [ ] Cajero completa y confirma
- [ ] Cliente se crea y se asigna a la venta actual
- [ ] Cajero no sale del flujo de venta

### AC-04.05 — Cambiar cliente
- [ ] Cajero selecciona un cliente diferente
- [ ] Nuevo cliente reemplaza al anterior
- [ ] Productos en carrito no se pierden

### AC-04.06 — Cliente bloqueado
- [ ] Cajero intenta asignar cliente bloqueado
- [ ] Sistema muestra "Cliente bloqueado: [motivo]"
- [ ] Venta no puede continuar con ese cliente

---

## PX-05: Cobro

### AC-05.01 — Iniciar cobro
- [ ] Carrito con productos y botón COBRAR habilitado
- [ ] Cajero presiona `F8` o hace clic en COBRAR
- [ ] Overlay de pago aparece

### AC-05.02 — Validación de stock
- [ ] Sistema valida stock antes de mostrar overlay de pago
- [ ] Stock suficiente → overlay de pago
- [ ] Stock insuficiente → mensaje claro: "Stock insuficiente: [producto] (solicitado: X, disponible: Y)"
- [ ] Cajero puede ajustar cantidad o cancelar

### AC-05.03 — Métodos de pago
- [ ] Cajero ve 4 métodos: Efectivo, Tarjeta, Transferencia, Pago Móvil
- [ ] Cajero selecciona un método
- [ ] Método seleccionado se resalta visualmente

### AC-05.04 — Pago en efectivo
- [ ] Cajero ingresa monto recibido
- [ ] Sistema calcula cambio automáticamente
- [ ] Botón CONFIRMAR se habilita solo si monto recibido ≥ total
- [ ] Cajero confirma pago
- [ ] Pago se procesa

### AC-05.05 — Pago exacto
- [ ] Cajero presiona `CTRL + Enter` en el input de monto
- [ ] Monto recibido se setea automáticamente al total
- [ ] Cambio = 0

### AC-05.06 — Error de pago (stock)
- [ ] Stock cambió entre que se abrió el overlay y se confirmó
- [ ] Sistema muestra "Stock insuficiente. Actualizando..."
- [ ] Si se puede ajustar, muestra diferencia
- [ ] Si no hay stock, regresa al carrito

### AC-05.07 — Error de red
- [ ] Cajero confirma pago y hay error de red
- [ ] Sistema reintenta automáticamente 1 vez
- [ ] Si falla de nuevo: "Error de conexión. La venta quedará pendiente."
- [ ] Venta se guarda como PENDING_PAYMENT
- [ ] Cajero puede retomar venta desde historial

### AC-05.08 — Cancelar cobro
- [ ] Cajero presiona `ESC` en overlay de pago
- [ ] Overlay se cierra
- [ ] Cajero vuelve al carrito con productos intactos

---

## PX-06: Finalizar

### AC-06.01 — Venta exitosa
- [ ] Pago procesado correctamente
- [ ] Overlay de resultado muestra: Total, Recibido, Cambio (si aplica)
- [ ] Animación de éxito (check + fade in)

### AC-06.02 — Imprimir comprobante
- [ ] Cajero presiona `CTRL + P`
- [ ] Comprobante se envía a la impresora predeterminada
- [ ] Si no hay impresora: "Impresora no disponible. Puedes reimprimir desde el historial."

### AC-06.03 — Enviar comprobante por email
- [ ] Cajero presiona `CTRL + E`
- [ ] Si cliente tiene email: enviar automáticamente
- [ ] Si cliente no tiene email: pedir email
- [ ] Confirmación de envío

### AC-06.04 — Nueva venta
- [ ] Cajero presiona `CTRL + N`
- [ ] Carrito se limpia
- [ ] Cliente vuelve a Consumidor Final
- [ ] Sesión permanece activa
- [ ] POS listo para nueva venta

### AC-06.05 — Auto nueva venta
- [ ] Sin interacción del cajero por 10 segundos post-venta
- [ ] Sistema automáticamente inicia nueva venta

---

## Generales

### AC-G.01 — Atajos de teclado
- [ ] F2: foco en Search Bar
- [ ] F4: abrir/cerrar búsqueda de cliente
- [ ] F8: iniciar cobro (si carrito no vacío)
- [ ] ESC: cancelar operación actual / cerrar overlay
- [ ] CTRL+N: nueva venta
- [ ] CTRL+P: imprimir comprobante
- [ ] CTRL+E: enviar comprobante por email

### AC-G.02 — Modo entrenamiento
- [ ] Interruptor visible en Top Bar
- [ ] Al activar: todas las acciones fluyen normal pero sin side effects
- [ ] Badge amarillo "ENTRENAMIENTO" visible siempre
- [ ] Al desactivar: volver a operación normal

### AC-G.03 — Persistencia de sesión
- [ ] Cajero recarga la página
- [ ] Sesión se restaura desde localStorage
- [ ] Si hay draft activo en servidor, se restaura

### AC-G.04 — Rendimiento
- [ ] Bundle JS inicial del POS < 100 KB (gzip)
- [ ] FCP < 500 ms
- [ ] Búsqueda < 200 ms
- [ ] Pago < 2 s (P95)

### AC-G.05 — Offline
- [ ] Catálogo disponible offline (IndexedDB)
- [ ] Búsqueda funciona offline
- [ ] Venta offline se guarda en cola
- [ ] Al reconectar, ventas offline se sincronizan automáticamente

### AC-G.06 — Accesibilidad
- [ ] Toda acción ejecutable con teclado
- [ ] Focus visible en todo momento
- [ ] Contraste 4.5:1 en texto normal
- [ ] Touch targets ≥ 48px en Tablet
- [ ] Screen reader: todos los elementos tienen aria-label
