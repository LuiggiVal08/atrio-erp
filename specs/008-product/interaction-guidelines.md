# Interaction Guidelines

> No es UI. Es interacción.
> Estas reglas garantizan que Atrio se comporte de forma predecible en cada pantalla.
> Ningún desarrollador debería inventar su propia UX.

---

## Principio rector

**Atrio siempre responde de la misma manera a la misma entrada, sin importar en qué pantalla esté.**

---

## Teclas universales

Funcionan en TODA la aplicación, sin excepción.

| Tecla | Acción | Comportamiento |
|-------|--------|---------------|
| `Enter` | Confirmar / Avanzar | Ejecuta la acción principal del contexto actual |
| `ESC` | Cancelar / Retroceder | Cierra overlay, modal, dropdown o vuelve al estado anterior |
| `Tab` | Siguiente campo | Avanza al siguiente elemento interactivo en orden lógico |
| `Shift + Tab` | Campo anterior | Retrocede al elemento interactivo anterior |

### Enter: reglas

- En un input de búsqueda → seleccionar primer resultado (o ejecutar búsqueda)
- En un modal → ejecutar acción principal (guardar, confirmar)
- En una tabla → abrir el registro seleccionado o editarlo
- En un formulario → enviar el formulario
- EN NINGÚN CASO → recargar la página

### ESC: reglas

- En un modal/overlay → cerrar el modal
- En un dropdown → cerrar el dropdown, foco vuelve al trigger
- En búsqueda → limpiar input y cerrar resultados
- En edición inline → cancelar edición, restaurar valor anterior
- Si no hay nada que cancelar → no hacer nada (NUNCA salir de la pantalla)

### Tab: reglas

- El orden de Tab debe ser lógico, no visual (de arriba a abajo, izquierda a derecha)
- Tab NUNCA pasa por elementos ocultos o deshabilitados
- Tab NUNCA sale del modal actual (focus trap en modales)
- Shift + Tab en el primer elemento del modal → ir al último elemento (loop)

---

## Shortcuts globales

Aplican en toda la aplicación, no solo en el POS.

| Shortcut | Acción | ¿Dónde? |
|----------|--------|---------|
| `/` | Foco en búsqueda global | En toda la app |
| `?` | Mostrar panel de shortcuts | En toda la app |
| `Ctrl + K` | Paleta de comandos (V2) | En toda la app |

### Shortcuts del POS

| Shortcut | Acción |
|----------|--------|
| `F2` | Búsqueda de producto |
| `F4` | Búsqueda de cliente |
| `F8` | Cobrar |
| `Ctrl + N` | Nueva venta |
| `Ctrl + P` | Imprimir comprobante |
| `Ctrl + S` | Suspender venta |
| `Ctrl + D` | Descuento (V2) |

---

## Tablas (listas de datos)

Aplica a: productos, clientes, roles, usuarios, ventas, documentos, etc.

| Interacción | Comportamiento |
|-------------|---------------|
| `↑↓` | Navegar filas |
| `Enter` | Abrir detalle o editar |
| `Supr` | Eliminar (solo si la acción es permitida y reversible) |
| Click en fila | Seleccionar |
| Doble click en fila | Abrir detalle |
| Click en header | Ordenar por columna (toggle ascendente/descendente) |
| Shift + click en filas | Selección múltiple |

### Paginación

- Mostrar "X de Y resultados" arriba de la tabla
- Navegación: `← Anterior` `1 2 3 ... 10` `Siguiente →`
- Atajos: `Ctrl + ←` → página anterior, `Ctrl + →` → siguiente página

### Búsqueda en tabla

- Input de búsqueda sobre la tabla
- Filtra mientras se escribe (debounce 300ms)
- Busca en todas las columnas visibles

---

## Formularios

| Interacción | Comportamiento |
|-------------|---------------|
| `Enter` | Enviar formulario |
| `ESC` | Cancelar (con confirmación si hay cambios) |
| `Tab` | Siguiente campo |
| Foco automático | En el primer campo del formulario |
| Validación | Al hacer blur en el campo (no mientras escribe) |
| Error | Mensaje debajo del campo, no tooltip ni alert |

### Confirmación al salir

Si el formulario tiene cambios sin guardar:

```text
¿Perder los cambios?
Las modificaciones no guardadas se perderán.

[Cancelar] [Salir sin guardar]
```

### Estados de botón

| Estado | Comportamiento |
|--------|---------------|
| Enabled | Click o Enter ejecuta la acción |
| Disabled | No interactuable, opacidad 50% |
| Loading | Spinner + texto "Guardando...", botón deshabilitado |
| Success | Check verde + "Guardado" por 2s, luego vuelve a enabled |

---

## Modales y Overlays

### Reglas

- Solo UN modal abierto a la vez
- Foco atrapado dentro del modal (focus trap)
- ESC lo cierra
- Click fuera NO lo cierra (excepto modales de notificación)
- Título descriptivo + botón de cerrar (X) en la esquina
- Al cerrar, foco vuelve al elemento que lo abrió

### Tipos de modal

| Tipo | Comportamiento |
|------|---------------|
| Diálogo de confirmación | Botones: [Cancelar] [Confirmar]. ESC = Cancelar |
| Formulario | Input + [Cancelar] [Guardar]. Enter = Guardar |
| Notificación | Auto-cierra a los 5s. No requiere acción. |
| Error | No auto-cierra. Requiere que el usuario lo cierre. |

---

## Notificaciones

### Posición

- Esquina inferior derecha
- Stack vertical (máximo 3 visibles, las más viejas arriba)

### Tipos

| Tipo | Color | Icono | Duración |
|------|-------|-------|---------|
| Success | Verde | Check | 3s |
| Error | Rojo | X | Hasta que usuario cierre |
| Warning | Amarillo | ⚠ | 5s |
| Info | Azul | ℹ | 3s |

### Contenido

```
[Icono] Mensaje claro en una línea.
       Acción opcional (ej: "Deshacer")
```

---

## Confirmaciones

### ¿Cuándo confirmar?

Confirmar cuando la acción:

- Es irreversible (eliminar, anular, cerrar caja)
- Tiene consecuencias financieras (descuento > X%, devolución)
- Afecta a otro usuario (bloquear usuario, cambiar rol)

### ¿Cuándo NO confirmar?

No confirmar cuando la acción:

- Es fácilmente reversible (eliminar línea del carrito)
- Es parte de un flujo rápido (agregar producto)
- El usuario ya confirmó implícitamente (click en "Cobrar" ya es una intención)

### Formato de confirmación

```text
[Acción] + [Elemento] + [Consecuencia]

¿Eliminar producto "Coca-Cola 350ml"?
Esta acción no se puede deshacer.

[Cancelar] [Eliminar]
```

---

## Estados vacíos

Ninguna pantalla debe mostrar una tabla vacía sin contexto.

| Situación | Mensaje | Acción sugerida |
|-----------|---------|----------------|
| Sin productos | "Aún no has creado productos" | [+ Crear producto] |
| Sin ventas hoy | "No hay ventas registradas hoy" | [Ir a POS] |
| Sin clientes | "Aún no has registrado clientes" | [+ Crear cliente] |
| Sin resultados de búsqueda | "No encontramos resultados para '[término]'" | [Limpiar búsqueda] |

---

## Loading States

### Tiempos

| Duración | Comportamiento |
|----------|---------------|
| < 200ms | Sin indicador (no alcanza a percibirse) |
| 200ms - 1s | Spinner inline en el componente afectado |
| 1s - 3s | Spinner + texto "Cargando..." |
| > 3s | Spinner + barra de progreso (si es medible) o "Esto está tomando más de lo esperado" |

### Skeletons

Para carga inicial de páginas: usar skeleton screens (bloques grises animados) en lugar de spinner global.

---

## Toques finales (Tablet)

### Gestos

| Gesto | Acción |
|-------|--------|
| Tap | Click |
| Long press | Menú contextual |
| Swipe left | Eliminar (con confirmación) |
| Swipe right | Marcar como completado |
| Pinch | Zoom (solo en componentes diseñados para ello) |

### Touch targets

- Mínimo 48x48 px para elementos interactivos
- Mínimo 16 px de separación entre elementos táctiles
- Sin hover states en táctil (usar active/focus instead)

### Teclado virtual

- Cuando un input recibe foco en Tablet, el teclado virtual debe aparecer automáticamente
- Inputs numéricos deben abrir teclado numérico (`inputmode="decimal"`)
- Evitar inputs que requieran teclado físico cuando el dispositivo es táctil
