# Hardware Support

> No es programación. Es producto.
> El soporte de hardware es un argumento comercial directo.
> Un cliente no compra un ERP que no funcione con su impresora.

---

## Estado actual del soporte

| Dispositivo | V1 MVP | V2 | V3 (futuro) |
|------------|--------|----|-------------|
| Lector código barras USB HID | ✅ | ✅ | ✅ |
| Impresora térmica ESC/POS | ✅ | ✅ | ✅ |
| Impresora PDF (comprobante) | ✅ | ✅ | ✅ |
| Cajón monedero (ESC/POS Pulse) | ❌ | ✅ | ✅ |
| Pantalla cliente | ❌ | ❌ | ✅ |
| Balanza | ❌ | ❌ | ✅ |
| Lector código barras Bluetooth | ❌ | ❌ | ✅ |
| Lector código barras Serial | ❌ | ❌ | ✅ |

---

## Lector de código de barras

### USB HID (V1)

El lector USB HID se comporta como un teclado. No requiere drivers.

**Requerimientos:**

- El input de búsqueda captura la entrada del escáner sin necesidad de foco especial
- El escáner envía el código seguido de `Enter` (configurable en el escáner)
- Atrio detecta entrada rápida (> 30 caracteres/segundo) como escáner, no como escritura manual
- Soporte para códigos: EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF-14

**Configuración recomendada del escáner:**

```text
Suffix: CR+LF (Enter)
Mode: USB HID Keyboard
Character Set: UTF-8
```

**Visualización:**

Cuando el escáner lee un código:

1. Input se llena automáticamente con el código
2. Si hay match exacto → producto se agrega al carrito
3. Si hay múltiples matches → mostrar resultados de búsqueda
4. Si no hay match → mostrar "Producto no encontrado: [código]"

### Bluetooth (V2)

- Conexión por Web Bluetooth API
- Pairing desde la configuración del POS
- Indicador de estado de conexión en la Top Bar
- Batería baja → notificación

### Serial (V3)

- Requiere aplicación nativa o middleware (Web Serial API limitada)
- Soporte para lectores legacy muy comunes en LATAM

---

## Impresoras

### ESC/POS Térmica (V1)

**Requerimientos:**

- Impresión por WebUSB o middleware (app de puente)
- Formato de comprobante: 58mm o 80mm
- Caracteres: UTF-8 (tildes, ñ, símbolos)
- Velocidad de impresión: < 3 segundos por comprobante
- Corte automático (si la impresora lo soporta)

**Formato de comprobante:**

```text
═══════════════════════════════
         ATRIO ERP
    Av. Principal, Local 3
       RIF: J-12345678
   Telf: 0212-555-5555
═══════════════════════════════
  FACTURA  NRO: 0001-001
  FECHA: 07/07/2026 14:30
  CAJERO: Juan Pérez
───────────────────────────────
  CANT  PRODUCTO       TOTAL
───────────────────────────────
  2     Coca-Cola      $24.00
  1     Pan Bimbo       $8.50
                           
───────────────────────────────
  SUBTOTAL:             $32.50
  IVA 16%:              $5.20
  TOTAL:                $37.70
───────────────────────────────
  EFECTIVO:             $50.00
  CAMBIO:               $12.30
───────────────────────────────
  CLIENTE: Consumidor Final
═══════════════════════════════
  ¡Gracias por su compra!
═══════════════════════════════
```

**Sin conexión:**

Si la impresora no está disponible:

- Mostrar "Impresora no disponible" con opciones:
  - "Reintentar"
  - "Imprimir después" (guardar cola de impresión)
  - "Enviar comprobante por email"

**Configuración:**

```text
Ancho del papel: [58mm | 80mm]
Copias: [1 | 2]
Fuente: [Normal | Compacta]
Corte automático: [Sí | No]
```

### Impresión PDF (V1)

- Generar PDF del comprobante
- Descarga automática o apertura en nueva pestaña
- Formato A5 (media carta)
- Mismo diseño que el comprobante térmico

### Impresión A4 (V2)

- Para facturas fiscales que requieren formato A4
- Diseño compatible con requisitos del SAT/SENIAT

---

## Cajón monedero

### ESC/POS Pulse (V2)

- Comando ESC/POS estándar para abrir cajón: `ESC p` (pulse)
- Se abre automáticamente al completar una venta en efectivo
- Configurable: abrir siempre / solo efectivo / nunca

### Relay (V3)

- Para cajones monedero que no usan ESC/POS
- Requiere hardware adicional (relé USB)

---

## Pantalla cliente (V3)

### Propósito

La pantalla cliente muestra:

- Total de la compra mientras el cajero agrega productos
- Método de pago seleccionado
- Monto recibido y cambio
- Mensaje de "Gracias por su compra" al finalizar

### Implementación

- Segunda pantalla (HDMI/VGA) manejada por el navegador
- Ventana independiente con URL específica: `/pos/customer-display`
- Sincronizada con el POS en tiempo real (WebSocket o BroadcastChannel)

---

## Balanzas (V3)

### Propósito

- Capturar peso automático al seleccionar un producto pesable
- Productos configurados como "pesables" en el catálogo

### Implementación

- Puerto serial (RS-232) o Bluetooth
- Formato de datos: estándar (peso en gramos o kilogramos)
- Configurable por producto: "Este producto requiere peso"

---

## Verificación de hardware

### Set up wizard

Al configurar el POS por primera vez:

```
1. Conecta la impresora → [Probar impresión]
2. Conecta el escáner → [Escanea un código de prueba]
3. Conecta el cajón monedero (si aplica) → [Probar apertura]
```

Cada prueba muestra:

- ✅ Conectado y funcionando
- ❌ No detectado — instrucciones de conexión
- ⚠️ Detectado pero no responde — reiniciar

### Diagnóstico

Pantalla de diagnóstico accesible desde configuración:

```
Estado del hardware
─────────────────────
Impresora:    ✅ Conectada (ESC/POS 80mm)
Escáner:      ✅ Detectado (USB HID)
Cajón:        ❌ No configurado
Pantalla cl.: ⚠️ No detectada (V3)

[Re-ejecutar diagnóstico]  [Probar impresora]
```
