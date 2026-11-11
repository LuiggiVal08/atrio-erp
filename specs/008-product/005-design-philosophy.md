# Design Philosophy

> No es un documento de diseño visual.
> Es un documento de principios.
> Cada decisión en Atrio debe poder rastrearse hasta uno de estos principios.

---

## Los 12 principios

### 1. La acción principal siempre es visible

El usuario nunca debe buscar cómo hacer lo que necesita hacer.

| Pantalla | Acción principal | Visible |
|----------|-----------------|---------|
| POS | Cobrar | Botón grande, abajo, siempre visible |
| Lista de productos | Crear producto | Botón arriba a la derecha |
| Dashboard | Ver ventas de hoy | Tarjeta principal, arriba |

### 2. Los modales son el último recurso

Un modal interrumpe el flujo del usuario. Antes de usarlo:

- ¿Puede ser inline? (ej: editar cantidad en el carrito)
- ¿Puede ser un panel lateral? (ej: detalle de producto)
- ¿Puede ser un dropdown? (ej: seleccionar método de pago)

Si es inevitable (confirmación de cobro), que sea rápido de cerrar.

### 3. Nunca bloquear por validaciones tardías

Validar al final es castigar al usuario por algo que no sabía.

- Errores de stock → al agregar producto, no al cobrar
- Errores de RIF duplicado → al escribir el RIF, no al guardar
- Errores de precio inválido → al escribir el precio, no al enviar el formulario

### 4. El teclado es la interfaz principal

No "soporte de teclado". Interfaz principal.

- Toda acción ejecutable con teclado
- Los shortcuts son la forma más rápida de operar
- Mouse es opcional, no requerido

### 5. Menos clics, más ventas

Cada clic extra en un flujo frecuente se multiplica por 100 ventas al día.

- 1 clic extra × 100 ventas/día × 30 días = 3000 clics innecesarios
- Un segundo extra por venta = 50 minutos perdidos al mes por cajero

### 6. Confirmar lo irreversible, no lo reversible

- ¿Eliminar producto del carrito? → Sin confirmación (Ctrl+Z lo restaura)
- ¿Anular venta ya pagada? → Confirmación obligatoria (implicaciones fiscales)
- ¿Cambiar precio? → Sin confirmación (se puede corregir)
- ¿Cerrar caja con descuadre? → Confirmación obligatoria

### 7. El sistema nunca pierde información

- El carrito se guarda automáticamente
- Las ventas offline se sincronizan al reconectar
- Los formularios con cambios sin guardar muestran advertencia antes de salir
- El historial de cambios es inmutable

### 8. El error es del sistema, no del usuario

Si el usuario comete un error, el sistema debería haberlo prevenido o guiado.

- "Producto no encontrado" → sugerencia de búsqueda
- "Stock insuficiente" → sugerencia de cantidad máxima
- "RIF inválido" → formato esperado (J-12345678)

### 9. La velocidad es una feature, no una optimización

- El POS debe responder en < 200ms
- La búsqueda debe ser instantánea
- El pago debe procesarse en < 2s

El rendimiento es un requisito funcional, no técnico.

### 10. Una pantalla, una cosa

Cada pantalla debe tener un propósito claro y único.

- POS → vender
- Productos → gestionar catálogo
- Clientes → gestionar partners
- Reportes → ver datos

Si una pantalla intenta hacer dos cosas, hay que dividirla.

### 11. El modo entrenamiento es un ciudadano de primera clase

No es un afterthought. Es una feature de venta.

- Misma experiencia, cero consecuencias
- Ideal para capacitar empleados nuevos
- Diferenciador competitivo en LATAM

### 12. Diseñar para el cajero experto primero, principiante después

- El principiante puede aprender
- El experto no puede perder tiempo
- Los tooltips y ayudas son colapsables, no permanentes
- Los shortcuts son la interfaz, no un extra
