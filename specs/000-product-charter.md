# Product Charter — Atrio

> No es una visión ni una misión. Es la constitución del producto.
> Responde: ¿esta idea pertenece a Atrio?

---

## Propósito

Atrio existe para **reducir la complejidad operativa de las empresas**.

Cada funcionalidad, cada pantalla, cada flujo debe hacer que el operador
(sea cajero, comprador, supervisor o administrador) complete su trabajo
con menos pasos, menos errores y menos carga cognitiva que antes.

---

## Límites

Atrio **nunca** hará:

- Adaptarse a procesos incorrectos del cliente (se educa, no se programa).
- Competir por cantidad de módulos (un módulo excelente vale más que diez regulares).
- Convertirse en una plataforma low-code (Atrio se configura, no se programa).
- Sacrificar velocidad de operación por flexibilidad de configuración.

---

## Prioridades siempre

1. **Simplicidad** — sobre funcionalidad.
2. **Velocidad** — el operador nunca espera.
3. **Configuración** — sobre personalización con código.
4. **Localización** — moneda, impuestos, documentos legales como capacidades nativas del sistema, no parches.
5. **Keyboard-first** — si requiere mouse, no está terminado.
6. **Evidencia sobre opinión** — nada entra al backlog sin OBS, OPS, ARCH o EXP que lo respalde.

---

## Decisiones de diseño

| Situación | Respuesta |
|-----------|-----------|
| Un cliente pide un cambio que rompe el modelo de datos estándar | No se hace. Se busca una configuración alternativa. |
| Una funcionalidad nueva compite con otra existente | No se agrega. Se mejora la existente. |
| Un flujo tarda más de 30 segundos en completarse | Se rediseña antes de liberar. |
| Una pantalla requiere más de 2 clics para la acción principal | Se simplifica. |
| Una observación F0 o F1 está abierta en un módulo | No se agregan funcionalidades nuevas a ese módulo. |

---

## Lo que Atrio no es

- No es un ERP genérico.
- No es un proyecto de código abierto.
- No es una plataforma.
- No es un producto terminado (y probablemente nunca lo será).

Atrio es un **producto en evolución continua**, gobernado por evidencia de uso y principios explícitos.
