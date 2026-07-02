# Data Model: Frontend UI — ODALX Atrio

Este documento define los modelos de datos del lado frontend: tipos TypeScript, interfaces de estado (Zustand), y contratos de props para componentes core. Los modelos backend (Prisma/PostgreSQL) se documentan en el plan de API correspondiente.

---

## 1. Layout State (Zustand Global)

### SidebarStore

```typescript
interface SidebarStore {
  isCollapsed: boolean;
  modules: ModuleEntry[];
  activeModule: string | null;

  toggleCollapse: () => void;
  setModules: (modules: ModuleEntry[]) => void;
  setActiveModule: (moduleId: string) => void;
}

interface ModuleEntry {
  id: string;           // e.g., "inventory", "sales", "purchases"
  label: string;        // Human name (i18n key)
  icon: LucideIcon;
  route: string;        // Base route path
  permissions: string[]; // Required permissions to access
  badge?: number;       // Optional notification count
}
```

### ThemeStore

```typescript
type ThemeId = "premium-dark" | "nordic-light" | "obsidian-emerald";

interface ThemeStore {
  current: ThemeId;
  setTheme: (theme: ThemeId) => void;
}
```

### HeaderStore

```typescript
interface HeaderStore {
  breadcrumbs: Breadcrumb[];
  tenantName: string | null;
  branchName: string | null;

  setBreadcrumbs: (crumbs: Breadcrumb[]) => void;
  setTenant: (name: string) => void;
  setBranch: (name: string) => void;
}

interface Breadcrumb {
  label: string; // i18n key
  href?: string; // Optional link
}
```

---

## 2. Document State (FSM Visual)

```typescript
type DocumentStatus = "draft" | "approved" | "paid" | "cancelled" | "received" | "partial";

interface DocumentState {
  id: string;
  documentType: DocumentType; // "sales_order" | "purchase_order" | "cash_audit" | ...
  status: DocumentStatus;
  humanStatus: string;        // i18n key for display
  color: string;              // Tailwind color class
  allowedActions: DocumentAction[];
  timeline: TimelineEntry[];
}

interface TimelineEntry {
  fromStatus: DocumentStatus | null;
  toStatus: DocumentStatus;
  timestamp: string;          // ISO 8601
  userId: string;
  userName: string;
  reason?: string;
}

interface DocumentAction {
  type: "approve" | "pay" | "cancel" | "receive" | "complete";
  label: string;              // i18n key
  shortcut?: string;          // Keyboard shortcut (e.g., "F10")
  requiresConfirmation: boolean;
}
```

### Color Mapping

| Status | Tailwind Color | Hex |
|--------|---------------|-----|
| draft | `text-gray-400` | `#9CA3AF` |
| approved | `text-blue-500` | `#3B82F6` |
| paid | `text-emerald-500` | `#10B981` |
| cancelled | `text-red-500` | `#EF4444` |
| received | `text-violet-500` | `#8B5CF6` |
| partial | `text-amber-500` | `#F59E0B` |

---

## 3. VirtualGrid Props

```typescript
interface VirtualGridProps<T> {
  data: T[];
  columns: GridColumn<T>[];
  rowHeight?: number;        // Default: 48px
  overscan?: number;         // Default: 5
  maxHeight?: number | "100%";
  onRowClick?: (row: T) => void;
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
  sortColumn?: keyof T;
  sortDirection?: "asc" | "desc";
  loading?: boolean;
  emptyMessage?: string;     // i18n key
  virtualized?: boolean;     // Default: true (fallback to regular table for small datasets)
}

interface GridColumn<T> {
  key: keyof T | string;
  label: string;             // i18n key
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  render?: (value: any, row: T) => React.ReactNode;
}
```

---

## 4. POS State (Zustand)

```typescript
interface POSStore {
  // Cart
  items: POSLineItem[];
  total: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  paymentMethod: PaymentMethod | null;

  // UI
  isOffline: boolean;
  isBlockedByAudit: boolean;
  searchQuery: string;
  searchFocused: boolean;

  // Actions
  addItem: (product: ProductSearchResult) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;
  setSearchQuery: (q: string) => void;
  setOffline: (offline: boolean) => void;
}

interface POSLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

type PaymentMethod = "cash" | "card" | "transfer" | "mixed";
```

### Offline Queue (IndexedDB)

```typescript
interface OfflineTransaction {
  id: string;
  tenantId: string;
  branchId: string;
  items: POSLineItem[];
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: string;         // ISO 8601 (local timestamp)
  syncedAt: string | null;   // Set after sync
  retryCount: number;
}
```

---

## 5. FichaTercero (Third-Party Profile)

```typescript
interface FichaTercero {
  id: string;
  type: "customer" | "vendor" | "both";
  legalName: string;
  taxId: string;                // RIF/Juridical ID
  phone: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  currencyCode: string;         // ISO 4217
  creditExceeded: boolean;      // Computed: currentBalance > creditLimit

  // Aggregated
  transactions: TransactionSummary[];
  recentDocuments: DocumentReference[];
}

interface TransactionSummary {
  id: string;
  date: string;
  type: "invoice" | "payment" | "credit_note" | "debit_note";
  amount: number;
  balance: number;              // Running balance after transaction
}

interface DocumentReference {
  id: string;
  type: string;
  number: string;
  status: DocumentStatus;
  total: number;
  date: string;
}
```

---

## 6. CashAudit (Cash Register Audit)

```typescript
interface CashAudit {
  id: string;
  cashRegisterId: string;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  status: DocumentStatus;

  // System calculated
  expectedCash: number;
  expectedCard: number;
  expectedTransfer: number;

  // Physical counted
  countedCash: number | null;
  countedCard: number | null;
  countedTransfer: number | null;

  // Computed
  difference: number | null;      // counted - expected
  isBalanced: boolean | null;     // difference === 0
}

interface CashAuditForm {
  countedCash: number;
  countedCard: number;
  countedTransfer: number;
  notes?: string;
}
```

---

## 7. FiscalConfig (Localization)

```typescript
interface FiscalConfig {
  id: string;
  countryCode: string;           // ISO 3166-1 alpha-2
  currencyCode: string;          // ISO 4217
  taxRules: TaxRule[];
  retentionRules: RetentionRule[];
  exchangeRate: ExchangeRate;
}

interface TaxRule {
  id: string;
  name: string;                  // e.g., "IVA 16%"
  rate: number;                  // Decimal: 0.16
  category: string;              // Product category
  isExempt: boolean;
}

interface RetentionRule {
  id: string;
  type: "IGTF" | "IVA" | "ISLR";
  rate: number;
  threshold: number;             // Minimum amount to apply
  appliesTo: ("sales" | "purchases")[];
}

interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}
```

---

## 8. i18n Translation Schema

```typescript
// src/core/i18n/es.ts (primary)
interface TranslationSchema {
  common: {
    save: string;
    cancel: string;
    delete: string;
    search: string;
    noResults: string;
    loading: string;
  };
  sidebar: {
    [moduleId: string]: {
      label: string;
      children?: { [key: string]: string };
    };
  };
  document: {
    status: { [status in DocumentStatus]: string };
    actions: {
      approve: string;
      pay: string;
      cancel: string;
      receive: string;
    };
    timeline: {
      title: string;
      empty: string;
      by: string;   // "by {user}" template
    };
  };
  inventory: { /* module-specific keys */ };
  sales: { /* module-specific keys */ };
  purchases: { /* module-specific keys */ };
  cash: { /* module-specific keys */ };
}
```
