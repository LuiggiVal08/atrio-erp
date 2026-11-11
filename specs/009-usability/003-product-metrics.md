# Product Metrics — POS Module

> Documento vivo que define las métricas de negocio del POS.
> No métricas técnicas (latencia, cobertura de tests). Métricas que responden preguntas sobre el comportamiento del usuario y la salud del negocio.

---

## Core Metrics

| Métrica | Definición | Objetivo | Actual | Cómo se mide |
|---------|-----------|--------:|-------:|--------------|
| **Tiempo promedio por venta** | Mediana de tiempo desde primer keydown hasta recepción visible | < 30 s | — | Playwright + `performance.now()` |
| **Tiempo hasta primer cobro** | Tiempo entre abrir sesión y completar primera venta | < 60 s | — | Store log |
| **Ventas por hora** | Ventas completadas / hora de sesión activa | > 80 | — | Backend analytics |
| **Tasa de error por venta** | Errores de pago / total ventas | < 2% | — | Backend |
| **Tasa de cancelación** | Ventas iniciadas con productos en carrito que no se completan | < 5% | — | Store log |
| **Reimpresiones** | # de veces que se reimprime un ticket post-venta | < 1% | — | Backend |
| **Uso de teclado vs mouse** | % de acciones hechas con teclado (keydown) vs clic | > 95% | — | Store log + analytics |
| **Uso de escáner** | % de productos agregados con barcode scan vs búsqueda manual | > 70% | — | Backend (scanner_detected flag) |

---

## Friction Metrics

Estas métricas se derivan del Observation Log:

| Métrica | Fórmula | Objetivo |
|---------|---------|--------:|
| **User Friction Index (UFI)** | Σ(severity_weight × observations_open) | < 20 |
| **F0 / F1 count** | # observaciones abiertas con severidad F0 o F1 | 0 |
| **Sales between F0/F1** | # ventas consecutivas sin encontrar un F0 o F1 | > 100 |

---

## Health Metrics

| Métrica | Definición | Objetivo |
|---------|-----------|--------:|
| **Keyboard test coverage** | # de flujos cubiertos por Playwright keyboard tests | 100% de escenarios core |
| **Observation age** | Días desde que se abrió una observación sin cerrar | < 30 días |
| **UX debt ratio** | UXD abiertos / UXD totales | < 30% |

---

## Historial

| Fecha | Sprint | Tiempo/venta | UFI abierto | F0/F1 abiertos | Ventas/hora |
|-------|--------|-------------:|------------:|----------------:|------------:|
| — | UX-001 | — | 56 | 0 | — |

---

## Tracking

Cada cambio que afecte una métrica core debe registrar el delta aquí, con referencia al commit o PR que lo causó.

**Formato para actualizar:**

```
YYYY-MM-DD | feat(web): descripción del cambio

Métrica afectada: Tiempo promedio por venta
Valor anterior: 24.1 s
Valor nuevo: 20.3 s
Diferencia: -3.8 s (-15.8%)
```
