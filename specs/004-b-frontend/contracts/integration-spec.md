# Integration Spec: Frontend Visual Ecosystem — ODALX Atrio

**Version**: 1.0.0-draft | **Status**: Planning | **Parent Spec**: [spec.md](../spec.md)

---

Este documento actúa como el contrato de ingeniería para el acoplamiento de las librerías visuales dentro de la arquitectura modular y el sistema multi-tema.

## 1. Matriz de Dependencias Inyectadas

| Propósito | Librería | Criterio de Selección |
|-----------|----------|----------------------|
| **UI Kit & Core Components** | **HeroUI** | Basado en Tailwind Variants y React Aria. Manejo nativo del foco por teclado (crítico para POS) y soporte para `data-theme` sin inyectar estilos globales. |
| **Micro-Interacciones & Feedback** | **Sileo** | Notificaciones ultraligero con spring physics y morph gooey SVG. Ideal para feedback de transacciones asíncronas de la máquina de estados. |
| **Iconografía Estándar** | **Lucide React** | Vectores de trazo uniforme. Tree-shaking estricto mediante Vite 6. |
| **Manejo de Datos Telefónicos** | `react-phone-number-input` + `libphonenumber-js` | Separación: entrada controlada con banderas en formularios, formateo asíncrono en grillas mediante funciones puras. |
| **Visualización Analítica** | **Recharts** | Gráficos declarativos SVG integrados en el árbol de renderizado de React, heredando tokens CSS de Tailwind. |

## 2. Estándar de Integración de Notificaciones (Sileo Engine)

El viewport de Sileo se inicializa exclusivamente en el componente raíz del sistema (`src/App.tsx`), configurando overrides semánticos para el sistema multi-tema.

### 2.1 Bootstrapping Global

```tsx
import { Toaster } from "sileo";

export function AppProvider() {
  return (
    <>
      <Toaster
        position="top-right"
        offset={{ top: 24, right: 24 }}
        roundness={8}
        options={{
          fill: "var(--bg-surface)",
          styles: {
            title: "text-[13px] font-semibold tracking-tight text-light-100!",
            description: "text-[12px] text-light-300/80!",
          },
        }}
      />
      <AppRoutes />
    </>
  );
}
```

### 2.2 Patrón de Mutación Asíncrona (Document FSM)

Las operaciones transaccionales con TanStack Query se encadenan mediante `sileo.promise()` dentro de un servicio centralizado:

```typescript
// src/core/services/toast-service.ts
import { sileo } from "sileo";

export const toastService = {
  syncDocument: <T>(promise: Promise<T>, docId: string) => {
    return sileo.promise(promise, {
      loading: {
        title: `Sincronizando ${docId}`,
        description: "Procesando reglas contables y afectación de stock...",
      },
      success: () => ({
        title: `${docId} Procesado`,
        description: "El documento ha cambiado al estado: APPROVED.",
        styles: {
          badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20!",
        },
      }),
      error: (err: any) => ({
        title: "Fallo de Consistencia",
        description: err?.message || "Error interno en el procesamiento del Tenant.",
        styles: {
          badge: "bg-danger-500/10 text-danger-400 border border-danger-500/20!",
        },
      }),
    });
  },
};
```

## 3. Localización y Validación Telefónica de Alta Densidad

- **Vistas de Formulario**: `react-phone-number-input` adaptado cromáticamente a variantes oscuras de HeroUI.
- **Vistas de Listado**: `libphonenumber-js/max` directo, sin componentes React pesados en grillas virtuales.

```typescript
import parsePhoneNumberFromString from "libphonenumber-js/max";

export function MemoizedPhoneCell({ rawPhone }: { rawPhone: string }) {
  const phoneNumber = parsePhoneNumberFromString(rawPhone);
  if (!phoneNumber) return <span className="text-light-400 font-mono">-</span>;
  return (
    <span className="font-mono text-[12px] text-light-200 tracking-tight">
      {phoneNumber.formatInternational()}
    </span>
  );
}
```

## 4. Estrategia de Analítica y Dashboards (Recharts)

Regla de **Minimalismo Premium**: alta densidad sin ruido cognitivo. Ejes secundarios, gridlines y leyendas masivas quedan fuera de alcance.

### 4.1 Micro-Sparklines para KPI Cards

```tsx
import { AreaChart, Area, ResponsiveContainer } from "recharts";

export function Sparkline({
  data,
  variant = "primary",
}: {
  data: { value: number }[];
  variant?: "success" | "primary" | "warning";
}) {
  const strokeColor = `var(--color-${variant}-500)`;
  const fillColor = `var(--color-${variant}-500-opacity)`;

  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${variant}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#grad-${variant})`}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## 5. Configuración Multi-Tema (Tailwind CSS v4 CSS Variables)

Para que HeroUI, Sileo y Recharts reaccionen unificadamente al cambiar `data-theme`, se mapea la paleta corporativa mediante propiedades personalizadas:

```css
/* src/core/styles/themes.css */
@theme {
  --color-canvas: var(--bg-canvas);
  --color-surface: var(--bg-surface);
  --color-border-thin: var(--border-muted);

  --color-primary-500: var(--accent-main);
  --color-primary-500-opacity: var(--accent-main-alpha);
}

[data-theme="premium-dark"] {
  --bg-canvas: #0B0F19;
  --bg-surface: #1E293B;
  --border-muted: #334155;
  --accent-main: #3B82F6;
  --accent-main-alpha: rgba(59, 130, 246, 0.15);
  --text-light-100: #F1F5F9;
  --text-light-300: #94A3B8;
}

[data-theme="nordic-light"] {
  --bg-canvas: #F8FAFC;
  --bg-surface: #FFFFFF;
  --border-muted: #E2E8F0;
  --accent-main: #0F172A;
  --accent-main-alpha: rgba(15, 23, 42, 0.08);
  --text-light-100: #0F172A;
  --text-light-300: #475569;
}

[data-theme="obsidian-emerald"] {
  --bg-canvas: #060814;
  --bg-surface: #0F172A;
  --border-muted: #134E4A;
  --accent-main: #10B981;
  --accent-main-alpha: rgba(16, 185, 129, 0.15);
  --text-light-100: #E0F2FE;
  --text-light-300: #94A3B8;
}
```

## 6. Stack Tecnológico Homologado (Core)

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Framework UI | React | 19 | Transiciones nativas, `useActionState` para mutaciones de formulario |
| Build | Vite | 6 | Bundle segmentado por módulos |
| Estilos | Tailwind CSS | 4 | Variables CSS nativas, compilación ultrarrápida |
| Estado servidor | TanStack Query | 5 | `stale-while-revalidate`, caché centralizada 5min |
| Estado UI | Zustand | 5 | Multi-stores aislados por contexto modular |
| Virtualización | `@tanstack/react-virtual` | — | DOM virtualizado en grillas y Kardex |
| Offline POS | IndexedDB | — | Store local con sincronización automática |

## 7. Arquitectura de Carpetas

```
src/
├── core/
│   ├── components/        # UI Kit Atómico (Inputs, Tables, Modals)
│   ├── hooks/             # useAuth, useTenant, etc.
│   ├── store/             # Zustand global (Theme state, Sidebar)
│   └── styles/            # themes.css, base design tokens
├── modules/
│   ├── inventory/
│   │   ├── components/    # KardexRow, Card, etc.
│   │   ├── hooks/         # TanStack Query queries & mutations
│   │   ├── store/         # Zustand del módulo
│   │   ├── views/         # InventoryListView, InventoryFormView
│   │   └── index.ts       # Rutas y configuración pública
│   ├── sales/
│   ├── purchases/
│   └── cash/
├── routes/                # Enrutador dinámico centralizado
├── App.tsx                # Proveedores de contexto globales
└── main.tsx               # Bootstrapper
```

## 8. Estrategias de Optimización

1. **Virtualización del DOM**: `@tanstack/react-virtual` en todas las vistas tipo reporte y Kardex. Solo se renderizan filas visibles (~30 de 50,000 registros).
2. **Optimistic Updates**: Zustand actualiza instantáneamente la UI; TanStack Query ejecuta la llamada en segundo plano. Rollback automático con toast de error.
3. **Caché Estratégica**: Query keys compuestas por `tenantId` + hash de versión para evitar colisiones de datos entre empresas.
4. **Carga Dinámica por Permisos**: `React.lazy()` + `Suspense` por módulo; el enrutador lee matriz de módulos aprovisionados del Tenant tras el login.
