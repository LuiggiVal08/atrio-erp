# POS State Management

> El POS es un **estado**, no una página.
> Todo lo que el cajero hace modifica un modelo centralizado.
> Los componentes React son solo proyecciones de ese estado.

---

## Store principal (Zustand)

Un solo store con slices lógicos. No múltiples stores ni contextos anidados.

```typescript
interface PosStore {
  // ── Session ──
  session: PosSession | null;
  openSession: (credentials: Credentials) => Promise<void>;
  closeSession: () => Promise<void>;

  // ── Current Sale ──
  currentSale: SaleDraft | null;
  createSale: () => void;
  suspendSale: () => void;
  resumeSale: (saleId: string) => void;

  // ── Cart ──
  cart: CartLine[];
  addProduct: (product: Product) => void;
  updateQuantity: (lineIndex: number, qty: number) => void;
  removeLine: (lineIndex: number) => void;
  clearCart: () => void;

  // ── Customer ──
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  searchCustomer: (query: string) => Promise<Customer[]>;
  quickCreateCustomer: (data: QuickCustomer) => Promise<Customer>;

  // ── Payment ──
  payment: PaymentState;
  selectMethod: (method: PaymentMethod) => void;
  setAmountReceived: (amount: number) => void;
  processPayment: () => Promise<PaymentResult>;

  // ── UI State ──
  ui: UIState;
  setFocusedZone: (zone: Zone) => void;
  showPaymentOverlay: boolean;
  showSaleResult: boolean;
}
```

---

## Slice: Session

```typescript
interface PosSession {
  id: string;            // UUID v7
  cashRegisterId: string;
  userId: string;
  userName: string;
  openedAt: string;      // ISO 8601
  initialBalance: number;
  status: 'OPEN' | 'CLOSED';
  trainingMode: boolean;
}
```

**Persistencia:** localStorage (para recuperar sesión al recargar). El servidor es la fuente de verdad.

**Training mode:** cuando está activo, todas las llamadas a la API llevan header `X-Training-Mode: true`. El backend ignora side effects pero valida el flujo.

---

## Slice: Current Sale + Cart

```typescript
interface SaleDraft {
  id: string;            // UUID v7
  status: 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'SUSPENDED';
  lines: CartLine[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CartLine {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  stockAvailable: number;
}
```

**Optimistic updates:** agregar/quitar productos del carrito es instantáneo. La sincronización con el backend ocurre en segundo plano (auto-save del draft).

**Auto-save:** cada 3 segundos o en pausa del teclado (no escribir por 1s), se guarda el draft en el backend.

---

## Slice: Payment

```typescript
interface PaymentState {
  method: PaymentMethod | null;
  amountReceived: number;
  change: number;
  status: 'IDLE' | 'VALIDATING_STOCK' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
  error: string | null;
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'MOBILE_PAYMENT';
```

**Estados del pago:**

```
IDLE → VALIDATING_STOCK → PROCESSING → SUCCESS
                          ↓
                        ERROR → IDLE (con mensaje)
```

---

## Slice: UI

```typescript
interface UIState {
  focusedZone: Zone;
  searchQuery: string;
  searchResults: Product[];
  isSearching: boolean;
  customerSearchOpen: boolean;
  customerSearchQuery: string;
  customerSearchResults: Customer[];
  paymentOverlayOpen: boolean;
  saleResultOpen: boolean;
}

type Zone = 'search' | 'cart' | 'customer' | 'payment';
```

**Propósito:** la UI es pura proyección del estado. No hay estado local en componentes que controle el flujo.

---

## Persistencia

| Estado | Persiste en | Cuándo se restaura |
|--------|-------------|-------------------|
| Session | localStorage + servidor | Al recargar página |
| Draft actual | Servidor (auto-save) | Al recuperar sesión |
| Carrito offline | IndexedDB | Al reconectar |
| Quick Actions config | localStorage | Al cargar POS |
| Training mode | localStorage | Al cargar POS |
| Catálogo de productos | IndexedDB | Al iniciar sesión (carga inicial) |

```typescript
// Persist middleware example
const usePosStore = create<PosStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: 'pos-store',
      partialize: (state) => ({
        session: state.session,
        trainingMode: state.session?.trainingMode,
      }),
      // No persistir: cart, payment (son transitorios)
    }
  )
);
```

---

## Sincronización con el backend

### Operaciones síncronas (requieren respuesta inmediata)

| Operación | Estrategia |
|-----------|-----------|
| Login + abrir caja | Esperar confirmación del servidor |
| Procesar pago | Esperar resultado (con timeout + retry) |
| Verificar stock | Esperar validación (dentro de processPayment) |

### Operaciones asíncronas (pueden diferirse)

| Operación | Estrategia |
|-----------|-----------|
| Guardar draft | Auto-save cada 3s (debounced) |
| Sincronizar catálogo | Carga inicial + actualización periódica |
| Crear cliente rápido | POST con confirmación rápida |
| Enviar comprobante | Fire-and-forget (no bloquea) |

---

## Arquitectura de actions

Las actions del store siguen un patrón consistente:

```typescript
// Action de ejemplo: processPayment
processPayment: async () => {
  const { cart, customer, payment } = get();

  // 1. Validar estado
  if (cart.length === 0) {
    set({ payment: { ...payment, error: 'Carrito vacío' }});
    return;
  }

  // 2. Transicionar a procesando
  set({
    payment: {
      ...payment,
      status: 'VALIDATING_STOCK',
      error: null,
    },
  });

  try {
    // 3. Llamar al backend (con idempotency key)
    const result = await api.pos.checkout(saleId, {
      idempotencyKey: saleId,
      customerId: customer?.id ?? null,
      paymentMethod: payment.method,
      amountReceived: payment.amountReceived,
    });

    // 4. Transicionar a éxito
    set({
      payment: {
        ...payment,
        status: 'SUCCESS',
        change: result.change,
      },
      ui: { ...get().ui, paymentOverlayOpen: false, saleResultOpen: true },
    });
  } catch (error) {
    // 5. Transicionar a error (mantener carrito)
    set({
      payment: {
        ...payment,
        status: 'ERROR',
        error: error.message,
      },
    });
  }
}
```

---

## Estados límite

| Situación | Comportamiento del store |
|-----------|--------------------------|
| Sesión expirada | Resetear session → redirigir a login |
| Error de red en pago | Payment state = ERROR. Carrito intacto. Reintentar. |
| Recarga del navegador | Restaurar session desde localStorage. Si draft activo en servidor, restaurarlo. |
| Cierre forzado de sesión | Limpiar todo el store (incluyendo persistencia) |
| Modo entrenamiento activado | Store envía X-Training-Mode: true en todas las requests. Backend valida flujo solo. |
