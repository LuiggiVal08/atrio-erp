# Quickstart: Frontend UI — ODALX Atrio

Guía de validación para verificar que la interfaz frontend cumple los criterios de aceptación definidos en [spec.md](spec.md).

---

## Prerequisites

- Node.js 24+ with corepack enabled
- API backend running (see API quickstart)
- PostgreSQL 16 with seeded tenant data

## Setup

```bash
# Install dependencies
cd apps/web
corepack enable
pnpm install

# Environment
cp .env.example .env
# Edit .env: set VITE_API_URL, VITE_TENANT_ID

# Start dev server
pnpm dev
# Opens at http://localhost:5173
```

## Validation Scenarios

### VS-01: Layout Global

**Given** un usuario autenticado con múltiples módulos aprovisionados  
**When** carga la aplicación  
**Then** debe ver:
- Sidebar de 240px con módulos permitidos (no más, no menos)
- Header con breadcrumbs sincronizados con la ruta actual
- Canvas con scroll interno independiente (scroll general de ventana deshabilitado)
- Headers de grilla fijos al hacer scroll vertical

**Expected**: Layout renderizado en <1s, sidebar sin scroll propio, contenido del canvas scrollea independientemente.

### VS-02: Navegación Dinámica por Permisos

**Given** un usuario sin permiso `purchasing:read`  
**When** la aplicación carga la sidebar  
**Then** el módulo "Purchasing" no debe aparecer en la navegación  
**And** al navegar directamente a `/purchasing`, debe redirigir a 403 o dashboard

**Expected**: Sidebar filtrada correctamente, ruta protegida redirige.

### VS-03: Badge de Estado FSM

**Given** un documento en estado DRAFT  
**When** se visualiza en una grilla o ficha  
**Then** debe mostrar un badge gris con texto "Borrador" y sin acciones destructivas  
**When** el documento se aprueba  
**Then** el badge debe transicionar a azul "Aprobado" sin recarga de página

**Expected**: Badge refleja estado actual, timeline muestra transición con timestamp.

### VS-04: Grilla Virtualizada

**Given** un conjunto de datos con 10,000+ registros  
**When** se renderiza la grilla  
**Then**:
- Solo ~30 filas están en el DOM (verificar con DevTools)
- Scroll suave sin saltos
- Ordenamiento por columna funciona en <200ms
- Encabezados permanecen visibles al scrollear

**Expected**: Sin degradación perceptible, sin layout shift.

### VS-05: POS con Atajos de Teclado

**Given** el módulo POS está abierto  
**When** el usuario presiona `/`  
**Then** el foco debe moverse al campo de búsqueda de productos  
**When** se agregan productos al carrito y se presiona F8  
**Then** debe abrirse el selector de método de pago  
**When** se presiona F10  
**Then** debe emitirse la factura (o mostrar confirmación)

**Expected**: Transacción completada en <3s sin usar el mouse.

### VS-06: POS Offline

**Given** el POS está operativo  
**When** se desconecta la red (DevTools > Network > Offline)  
**Then** debe mostrar indicador "Modo Offline" en el header  
**When** se completa una transacción en offline  
**Then** debe almacenarse en IndexedDB (verificar en DevTools > Application > IndexedDB)  
**When** se restaura la conectividad  
**Then** la transacción debe sincronizarse automáticamente y desaparecer de la cola offline

**Expected**: Sin pérdida de datos, toast de confirmación post-sync.

### VS-07: Arqueo de Caja

**Given** un cajero con POS activo  
**When** el supervisor inicia un arqueo  
**Then** el POS del cajero debe bloquearse inmediatamente (botones disabled, overlay)  
**When** se ingresan montos contados y se aprueba el arqueo  
**Then** el POS debe desbloquearse y mostrar el resultado (balanceado o descuadre)

**Expected**: Bloqueo instantáneo, descuadre muestra alerta visual.

### VS-08: Control de Crédito

**Given** un cliente con límite de crédito de $1,000 y saldo actual de $950  
**When** se intenta crear una venta por $100  
**Then** debe mostrar alerta visual de exceso de crédito y bloquear la transacción  
**When** el saldo se reduce a $900 (pago recibido)  
**Then** la alerta debe desaparecer automáticamente

**Expected**: Alerta en tiempo real sin recarga, bloqueo efectivo.

### VS-09: Multi-Tema

**Given** el selector de tema está disponible en la configuración  
**When** el usuario selecciona "Nordic Light"  
**Then** el atributo `data-theme` debe cambiar a `nordic-light` y la paleta debe reflejar colores claros  
**When** selecciona "Obsidian Emerald"  
**Then** la paleta debe cambiar a tonos verdes oscuros  
**When** recarga la página  
**Then** el tema debe persistir (localStorage)

**Expected**: Transición suave, persistencia entre recargas.

### VS-10: i18n ES/EN

**Given** la configuración del usuario está en English  
**When** se renderiza cualquier vista  
**Then** todos los textos deben mostrarse en inglés (verificar sidebar, breadcrumbs, botones, badges)  
**When** se cambia a Español  
**Then** todos los textos deben cambiar sin recargar la página

**Expected**: 0 hardcoded strings, cambio instantáneo de idioma.

## Run Tests

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Coverage
pnpm test -- --coverage
```

## References

- [Specification](spec.md) — User stories & functional requirements
- [Data Model](data-model.md) — TypeScript interfaces & state shapes
- [Integration Contract](contracts/integration-spec.md) — HeroUI/Sileo/Recharts/phone lib details
- [Research](research.md) — Technology decisions & rationale
