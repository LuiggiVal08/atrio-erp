# Research: Frontend UI — ODALX Atrio

## Technology Decisions

### Framework & Build

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| UI Framework | React 19 | Transiciones nativas, `useActionState` para mutaciones de formulario, ecosistema maduro para ERP | Vue 3 (menor ecosistema ERP), Svelte 5 (menor madurez enterprise), Angular 19 (sobreingeniería para SPA) |
| Build Tool | Vite 6 | Bundle segmentado por módulos, HMR ultrarrápido, tree-shaking estricto para Lucide | Next.js (SSR innecesario para ERP SPA), CRA (deprecado), Turbopack (aún inmaduro) |
| Language | TypeScript 5.x | Tipado estricto, interfaces para contratos de módulos, integración nativa con HeroUI/TanStack | JavaScript (pérdida de seguridad en contratos entre equipos) |

### State Management

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Server State | TanStack Query v5 | `stale-while-revalidate`, caché centralizada 5min, retry automático, key compuestas por tenantId | RTK Query (más boilerplate), Apollo (solo GraphQL), SWR (menos features que Query v5) |
| Client State | Zustand 5 | Multi-stores aislados por contexto modular, sin providers, bundle <1KB | Redux Toolkit (boilerplate excesivo), Jotai (átomos demasiado granulares), Pinia (atado a Vue) |

### UI & Styling

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| CSS Framework | Tailwind CSS v4 | Variables CSS nativas, compilación ultrarrápida, integración directa con HeroUI | SCSS Modules (sin utilidades), Styled Components (runtime cost), Panda CSS (menos maduro) |
| UI Kit | HeroUI | Basado en Tailwind Variants + React Aria, manejo nativo de foco por teclado (crítico POS), soporte `data-theme` | shadcn/ui (menos componentes enterprise), MUI (pesado, no integra con Tailwind v4), Ant Design (estilo corporativo rígido) |
| Notifications | Sileo | Spring physics, morph gooey SVG, ultraligero, ideal para feedback transaccional FSM | Sonner (menos customizable), react-hot-toast (sin spring physics), Notistack (pesado) |
| Icons | Lucide React | Vectores de trazo uniforme, tree-shaking estricto vía Vite | Heroicons (menos íconos), Phosphor (sobrecarga de estilos), FontAwesome (licencia) |
| Charts | Recharts | SVG declarativo, hereda tokens CSS de Tailwind, buena densidad informativa | Chart.js (API imperativa), D3 (bajo nivel), Tremor (sobreingeniería para sparklines) |

### Virtualization & Telephony

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Virtualization | `@tanstack/react-virtual` | DOM virtualizado en grillas y Kardex, renderiza solo filas visibles | react-window (API más limitada), react-virtuoso (menos flexible para grillas) |
| Phone Input | `react-phone-number-input` | Banderas, máscara automática, integrable con HeroUI | Material UI Phone (atado a MUI), libphonenumber directo (sin componente React) |
| Phone Formatting | `libphonenumber-js/max` | Formateo puro para celdas en grillas virtualizadas, sin overhead de componentes | google-libphonenumber (pesado, no tree-shakeable) |

### Offline & Performance

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Offline Storage | IndexedDB | Store local POS con sincronización automática al restaurar conectividad |
| Caching Strategy | TanStack Query + stale-while-revalidate | 5min stale time, refetch on window focus, keys compuestas por tenantId |
| Bundle Splitting | React.lazy + Suspense + Vite rollupOptions | Módulos cargados bajo demanda según permisos del tenant |

### Multi-Theme System

| Theme | Base Canvas | Surface | Accent |
|-------|------------|---------|--------|
| Premium Dark (default) | `#0B0F19` | `#1E293B` | `#3B82F6` |
| Nordic Light | `#F8FAFC` | `#FFFFFF` | `#0F172A` |
| Obsidian Emerald | `#060814` | `#0F172A` | `#10B981` |

Los temas se implementan vía CSS variables en atributo `data-theme`, sin inyectar estilos globales.

## Architecture Decisions

### Feature-based Modules

Se adopta estructura `src/modules/{inventory,sales,purchases,cash}/` en lugar de carpetas por tipo (`components/`, `pages/`, `hooks/`). Cada módulo es autocontenido con sus vistas, hooks, store y componentes. El Core (`src/core/`) provee UI Kit atómico, hooks globales, servicios y estilos compartidos.

Razón: Escalabilidad para 7+ módulos. Un developer puede trabajar en un módulo sin conocer la estructura interna de otro.

### Dynamic Route Loading

Las rutas se cargan con `React.lazy()` + `Suspense` según matriz de módulos aprovisionados del tenant post-login. La sidebar solo muestra módulos permitidos.

Razón: Seguridad (RBAC a nivel de ruteo) y performance (carga bajo demanda).

### Optimistic Updates

Zustand actualiza instantáneamente la UI; TanStack Query ejecuta la mutación en background. Rollback automático con toast de error vía Sileo.

Razón: Percepción de velocidad en POS transaccional (<3s por transacción).

### i18n Strategy

Key-based translations en `src/core/i18n/` con ES como primario y EN como secundario. Sin hardcoded strings. Archivos JSON planos cargados según configuración del usuario/tenant.
