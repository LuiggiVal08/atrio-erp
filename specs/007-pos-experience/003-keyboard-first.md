# Keyboard-First POS

> Un cajero experto no quiere hacer clic.
> Quiere que el sistema se adelante a su intención.
> El teclado es la interfaz más rápida cuando está bien diseñada.

---

## Principios

1. **Toda acción del POS debe ser ejecutable con teclado.** El mouse es siempre opcional.
2. **Las teclas deben ser memorables.** F2 = buscar (como en Finder), F4 = cliente (como Alt+F4 cierra, nosotros abrimos), F8 = cobrar (como F8 en muchos POS legacy).
3. **El estado activo siempre tiene foco visible.** El cajero nunca debe preguntarse "¿dónde estoy?".
4. **ESC siempre vuelve al estado anterior o cancela la operación actual.**
5. **Sin atajos con más de 3 teclas.** CTRL+SHIFT+ALT+Z no es un atajo, es un ejercicio de contorsionismo.

---

## Mapa global de atajos

### Navegación principal

| Tecla | Acción | Contexto | Justificación |
|-------|--------|----------|--------------|
| `F2` | Foco en búsqueda de producto | Cualquier estado | F2 = "Find" en Windows, Finder en Mac. Estándar de facto para búsqueda en POS. |
| `F4` | Abrir/cerrar búsqueda de cliente | Cualquier estado | Convención POS tradicional |
| `F8` | Ir a cobro | Carrito con productos | F8 = "Cobrar" en múltiples POS latinoamericanos (Brasil, México) |
| `ESC` | Cancelar / Volver | Cualquier estado | Universal. Cancelar operación, cerrar overlay, deseleccionar. |

### Gestión de venta

| Tecla | Acción | Contexto |
|-------|--------|----------|
| `CTRL + N` | Nueva venta | Venta completada o cualquier estado |
| `CTRL + P` | Imprimir comprobante | Venta completada |
| `CTRL + E` | Enviar comprobante por email | Venta completada |
| `CTRL + S` | Suspender venta | Carrito con productos (V2) |
| `CTRL + D` | Descuento | Línea o total seleccionado (V2) |

### Navegación en carrito

| Tecla | Acción |
|-------|--------|
| `↑` | Línea anterior en carrito |
| `↓` | Línea siguiente en carrito |
| `+` o `→` | Aumentar cantidad de línea seleccionada |
| `-` o `←` | Disminuir cantidad de línea seleccionada |
| `Supr` | Eliminar línea seleccionada |
| `Tab` | Siguiente zona (Search → Cart → Customer → Payment) |

### Gestión de cliente

| Tecla | Acción |
|-------|--------|
| `F4` | Abrir búsqueda de cliente |
| `↑↓` | Navegar resultados de búsqueda |
| `Enter` | Seleccionar cliente |
| `CTRL + C` | Crear cliente rápido |
| `ESC` | Cerrar búsqueda sin seleccionar |

### Cobro

| Tecla | Acción |
|-------|--------|
| `F8` | Ir a cobro |
| `↑↓←→` | Navegar métodos de pago |
| `Enter` | Confirmar método / confirmar pago |
| `CTRL + Enter` | Ingresar monto exacto (efectivo) |
| `ESC` | Cancelar cobro (volver a venta) |

### Búsqueda de producto

| Tecla | Acción |
|-------|--------|
| `/` | Alternativa a F2 para foco en búsqueda |
| `↑↓` | Navegar resultados |
| `Enter` | Agregar producto seleccionado al carrito |
| `ESC` | Limpiar búsqueda |

---

## Flujo de cajero experto (sin mouse)

### Venta rápida (consumidor final, efectivo)

```
F2 → "Coca" → Enter (agrega)
→ [escribe otra cosa] → Enter (agrega segundo)
→ F8 → → (efectivo) → Enter → Enter (pago confirmado)
→ CTRL+P → CTRL+N
```

**Tiempo estimado:** 8-12 segundos (cajero con práctica)

### Venta con cliente registrado

```
F2 → "Coca" → Enter
→ F4 → "J-123" → Enter (selecciona cliente)
→ [más productos] → Enter
→ F8 → → → (tarjeta) → Enter → Enter
→ CTRL+P → CTRL+N
```

**Tiempo estimado:** 15-20 segundos

---

## Estados de foco

El foco es el estado más importante del POS. Sin foco visible, el teclado no sirve.

### Reglas de foco

| Evento | Foco va a |
|--------|-----------|
| Inicia venta | Search Bar |
| Producto agregado al carrito | Search Bar (para seguir agregando) |
| Cliente seleccionado | Search Bar |
| Cobro cancelado | Search Bar |
| Venta completada | "Nueva venta" (CTRL+N) |
| ESC desde cualquier overlay | Search Bar |
| Tab en Search Bar | Primera línea del carrito |
| Tab en última línea del carrito | Customer Zone |

### Indicador visual

El elemento con foco debe tener un anillo de 2px de color primario. No usar outline por defecto del navegador (inconsistente entre browsers).

---

## Cómo NO diseñar atajos

| ❌ Mal | Por qué |
|--------|---------|
| `CTRL + ALT + SHIFT + P` | Tres teclas es el límite práctico |
| `F1` para ayuda | F1 es conflictivo con navegadores |
| Atajos sin indicación visual | El cajero no sabe que existen |
| Atajos no configurables | Cada cajero tiene preferencias distintas (V2) |
| Diferentes atajos en Desktop y Tablet | Confunde al cajero que usa ambos |

---

## Quick Actions Panel (V2)

Un panel colapsable que muestra los atajos disponibles según el contexto actual:

```
┌────────────────────┐
│ ⌨️  Quick Actions  │
├────────────────────┤
│ F2  Buscar         │
│ F4  Cliente        │
│ F8  Cobrar         │
│ ESC Cancelar       │
│                    │
│ [Ver todos]        │
└────────────────────┘
```

Aparece la primera vez que el cajero presiona una tecla modificadora (CTRL, F2, etc.) si no está seguro de los atajos. Se puede desactivar en configuración.

---

## Consideraciones técnicas

### Captura de teclado

- Los atajos deben capturarse a nivel de `window` (no de input individual)
- Si el foco está en un input (Search Bar, monto recibido), las teclas normales escriben, pero las funciones F y CTRL+X deben seguir funcionando
- Excepción: ESC debe cerrar modales/overlays antes que limpiar el input

### Prevención de conflictos

| Atajo | Conflicto potencial | Mitigación |
|-------|---------------------|------------|
| `F2` | Renombrar archivo (Explorer) | Prevenir default solo dentro del POS |
| `F8` | Debugger de Chrome | Prevenir default |
| `CTRL + N` | Nueva ventana del navegador | Prevenir default |
| `CTRL + P` | Imprimir página | Prevenir default |
| `CTRL + S` | Guardar página | Prevenir default |

```typescript
// Prevenir default de teclas del POS
document.addEventListener('keydown', (e) => {
  if (posKeys.has(e.key) && !e.repeat) {
    e.preventDefault();
    handleKey(e.key);
  }
});
```

### Modo entrenamiento

En modo entrenamiento, todos los atajos funcionan igual pero las acciones no persisten. El cajero aprende los mismos atajos que usará en producción.
