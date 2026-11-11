# Epic 002 — Point of Sale Experience (POSX)

> No estamos construyendo componentes React.
> Estamos diseñando cómo trabaja una persona durante 8 horas al día.
> — Principio fundacional del Epic

**Estado:** ⚪ Planificación
**Dependencias:** H-001 completado (transaction hardening listo en backend)
**Release:** v0.3

---

## KPIs del POS

| KPI | Objetivo | Cómo se mide |
|-----|----------|--------------|
| Tiempo promedio por venta completa | < 30 s | Desde que se agrega el primer producto hasta que se emite el comprobante |
| Clicks para vender un producto | ≤ 3 | Agregar producto al carrito desde la búsqueda |
| Tiempo para encontrar un producto | < 2 s | Desde que se escribe la consulta hasta que aparece en la lista |
| Tiempo para cobrar | < 10 s | Desde que se presiona "Cobrar" hasta que se muestra el cambio |
| Uso sin mouse | 100 % posible | Toda acción del POS debe ser ejecutable con teclado |
| Recuperar venta suspendida | < 5 s | Desde que se reanuda la sesión hasta que la venta está en pantalla |
| Modo entrenamiento | Sin impacto en datos reales | Inventario, caja, documentos no se modifican |

---

## Experiencias (PX)

El Epic se divide por **experiencias de trabajo del cajero**, no por componentes de UI:

| ID | Experiencia | Prioridad | Dependencias |
|----|------------|-----------|-------------|
| PX-01 | Abrir Caja | Alta | Sesiones POS (backend existente) |
| PX-02 | Buscar producto | Alta | Catálogo de productos (backend existente) |
| PX-03 | Carrito | Alta | Draft CRUD (backend existente) |
| PX-04 | Cliente | Alta | Business Partners (backend existente) |
| PX-05 | Cobro | Alta | Checkout + Payment (backend existente + H-001) |
| PX-06 | Finalizar | Alta | Receipt (backend existente) |

---

## Decisiones de diseño

1. **Single-page layout**: toda la experiencia en una sola pantalla, no múltiples vistas
2. **Keyboard-first**: toda acción ejecutable sin mouse
3. **Quick Actions**: F2/F4/F8/ESC/CTRL+N como la interfaz principal del cajero experto
4. **Dos experiencias**: POS Desktop (teclado + monitor grande) y POS Tablet (táctil + botones grandes), no responsive
5. **Estado centralizado**: Zustand store dedicado para el POS (session, currentSale, cart, payment)
6. **Modo entrenamiento**: interruptor global que desactiva todo efecto colateral
7. **Consumidor Final por defecto**: 80%+ de las ventas no requieren cliente registrado

---

## Documentos del Epic

| Documento | Propósito |
|-----------|-----------|
| `001-user-journeys.md` | Flujo completo del cajero desde que llega hasta que cierra |
| `002-screen-flow.md` | Layout de pantalla única, zonas, componentes |
| `003-keyboard-first.md` | Atajos de teclado, Quick Actions, navegación sin mouse |
| `004-state-management.md` | Store de estado (Zustand), tipos, persistencia |
| `005-offline-strategy.md` | Comportamiento offline, cola de reintentos |
| `006-performance-budget.md` | Métricas de rendimiento, budgets de bundle |
| `007-accessibility.md` | WCAG 2.2, contraste, foco, lectores de pantalla |
| `008-ui-guidelines.md` | Design tokens, spacing, colores, tipografía |
| `009-acceptance-criteria.md` | Criterios de aceptación por experiencia |

---

## Criterios de salida del Epic

- [ ] Un cajero puede completar una venta completa (buscar → carrito → cobrar → comprobante) en < 30 s
- [ ] Toda acción es ejecutable con teclado
- [ ] 100% de las Quick Actions documentadas funcionan en POS Desktop
- [ ] POS Tablet es funcional con solo táctil
- [ ] Modo entrenamiento no modifica inventario, caja, ni documentos
- [ ] La sesión del POS se recupera al recargar la página (persistencia en localStorage)
- [ ] 0 regresiones en 477 tests del backend
- [ ] Nuevos tests de integración POS UI + API
