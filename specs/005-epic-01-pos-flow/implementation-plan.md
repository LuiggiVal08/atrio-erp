# Epic 01 — Venta POS V1: Implementation Plan

> **Shift**: From designing modules → to building vertical slices that create business value.
> Every slice must produce a functional increment that can be tested end-to-end.

---

## 1. Capability Matrix

### Legend

| Icon | Meaning |
|------|---------|
| ✅ | Exists and production-ready |
| 🟡 | Exists but needs extension or change |
| 🔴 | Does not exist — must be built |
| ⚪ | Out of scope for V1 |

### Per Bounded Context

| Capability | Partners | Products / Inventory | Sales / POS | Cash / Payments | Doc Engine | Localization / Fiscal | Audit | Auth / Identity |
|---|---|---|---|---|---|---|---|---|
| **CRUD entities** | ✅ PartnerService | ✅ Products, Categories, Warehouses | ✅ Orders, Invoices, Returns | ✅ Registers, Movements, Methods | ✅ Full lifecycle | ✅ Taxes, Currency Rates | ✅ Global + Doc interceptors | ✅ JWT, RBAC, Multi-tenant |
| **Line items / Cart** | ⚪ | ✅ DocumentLine model | 🟡 Sales entities have header-only (no line items) — items live on Document | ⚪ | ✅ DocumentLine | ⚪ | ⚪ | ⚪ |
| **Stock validation** | ⚪ | ✅ StockService.getBalance() | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Stock deduction (event-driven)** | ⚪ | ✅ StockEventHandler listens `document.approved` | ⚪ | ⚪ | ✅ Emits `document.approved` | ⚪ | ⚪ | ⚪ |
| **Tax calculation** | ⚪ | ⚪ | 🟡 QuickSale passes raw numbers, no engine | ⚪ | ⚪ | ✅ FiscalService.processInvoice() with VE/CO strategies | ⚪ | ⚪ |
| **Customer selection** | ✅ Partner with role CUSTOMER | ⚪ | 🟡 Uses legacy Client FK — needs partner migration | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Payment processing** | ⚪ | ⚪ | 🟡 `pay()` endpoint exists, creates commission | 🟡 Captures movement via event, but no gateway | ✅ `document.paid` event | ⚪ | ⚪ | ⚪ |
| **POS Session** | ⚪ | ⚪ | ✅ Open/close session | 🟡 Referenced via cashRegisterId | ⚪ | ⚪ | ⚪ | ⚪ |
| **Document creation** | ⚪ | ⚪ | 🟡 QuickSale creates doc via event — indirect | ⚪ | ✅ Create document with lines + totals | ⚪ | ⚪ | ⚪ |
| **Audit trail** | ⚪ | ⚪ | 🟡 Document-audit interceptor covers doc endpoints | ⚪ | ✅ DocumentEvent records | ⚪ | ✅ Global audit interceptor | ⚪ |
| **Invoice fiscal generation** | ⚪ | ⚪ | 🔴 No comprobante / receipt generation | ⚪ | 🟡 Invoice tax detail model exists but not wired in POS | ✅ Fiscal endpoints exist | ⚪ | ⚪ |
| **POS Frontend** | 🔴 No customer selector UI | 🔴 No product search UI | 🔴 No POS terminal screen | 🔴 No cash register UI | ⚪ | ⚪ | ⚪ | ✅ Login + Layout exist |

### Summary

| Status | Count | What |
|--------|-------|------|
| ✅ **Ready** | 10 | Stock validation, event-driven deduction, POS session, customer CRUD, doc lifecycle, taxes CRUD, currency rates, audit, auth, RBAC |
| 🟡 **Extend** | 6 | Sales line items (header-only), customer FK (legacy), QuickSale (no engine), payment (no multi-method), session cash linkage, invoice tax model |
| 🔴 **Build** | 2 | Comprobante/receipt generation, POS Frontend |

---

## 2. Architecture for POS Flow

```text
┌─────────────────────────────────────────────────────────┐
│                    POS Controller                         │
│              POST /pos/orders                             │
│              POST /pos/orders/:id/pay                     │
│              POST /pos/sessions                           │
│              POST /pos/sessions/:id/close                 │
└──────────┬──────────────────────────────────────┬────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────┐              ┌──────────────────────┐
│   PartnerService     │              │   PosOrderService     │
│   (core/bp)          │              │   (NEW)               │
│                      │              │                      │
│  findById(tenantId)  │              │  create(OrderData)    │
│  validateRole(CUSTOM)│              │  pay(id, PaymentData) │
└──────────────────────┘              └────────┬─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
        ┌───────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
        │   Inventory/Stock  │     │   DocumentEngine     │     │   Cash Payments   │
        │                    │     │                      │     │                   │
        │  validateStock()   │     │  createDocument()    │     │  registerMovement │
        │  deductStock()     │     │  approveDocument()   │     │  validateBalance  │
        └────────────────────┘     └──────────────────────┘     └──────────────────┘
                                               │
                                               ▼
                                    ┌──────────────────────┐
                                    │   Fiscal Engine       │
                                    │   (Localization)      │
                                    │                       │
                                    │  calculateTaxes()     │
                                    └──────────────────────┘
```

### Interaction flow (happy path)

```text
POST /pos/orders
  │
  ├── 1. Validate POS session is open
  ├── 2. Lookup Partner (CUSTOMER)
  ├── 3. For each item:
  │     ├── Lookup product
  │     └── Validate stock >= quantity
  ├── 4. Calculate totals (subtotal, taxes via Fiscal Engine, total)
  ├── 5. Create Document (status: pending_approval)
  │     └── DocumentLines per item
  ├── 6. Create SalesOrder (type: 'pos', status: 'pending')
  └── 7. Return { orderId, documentId, total }

POST /pos/orders/:id/pay
  │
  ├── 1. Validate order exists + status = pending
  ├── 2. Approve Document (→ APPROVED, emits document.approved)
  │     └── StockEventHandler deducts stock (listens to event)
  ├── 3. Pay Invoice (→ PAID, emits document.paid)
  │     └── CashMovementEventHandler registers in-movement
  ├── 4. Create cash_movement record (type: 'in')
  ├── 5. Mark SalesOrder as paid
  └── 6. Return { orderId, documentId, paymentId }
```

---

## 3. Vertical Slices

### Slice 1: Crear Orden de Venta POS

**Backend only — end-to-end API flow: partner validation, product lookup, stock check, order creation.**

#### What it builds

| Layer | What |
|-------|------|
| **Domain** | `PosOrder` entity, `PosOrderRepository` interface, `PosOrderLine` value object |
| **Application** | `PosOrderService.create()` — receives items, validates stock, calculates totals (raw), creates Document + SalesOrder |
| **Infrastructure** | `POST /pos/orders` endpoint, `PrismaPosOrderRepository`, DTOs |
| **Tests** | Unit: service + repository. Contract: HTTP shape of POST /pos/orders |

#### Acceptance criteria

1. `POST /pos/orders` with valid body (sessionId, partnerId, items[]) → **201** with `{ orderId, documentId, total }`
2. Response JSON has shape `{ orderId: string, documentId: string, total: number, currency: string, createdAt: string }`
3. Missing `sessionId` → **400** with validation error
4. Invalid `partnerId` → **404** with `"Partner not found"`
5. Product with insufficient stock → **409** with `"Insufficient stock for product {name}"`
6. Product not found → **404** with `"Product not found"`
7. Empty items array → **400** with `"At least one item is required"`
8. After creation: Document with `documentType: sales_invoice` and status `pending_approval` exists in DB with correct line items
9. After creation: SalesOrder with `type: 'pos'` exists in DB linked to Document
10. **No stock is deducted yet** (reserved for pay flow)

#### Dependencies
- Business Partners: lookup by ID, validate role includes CUSTOMER
- Inventory: product lookup, stock balance query
- Document Engine: create document with lines

---

### Slice 2: Completar Venta (Pago + Stock + Caja)

**Backend only — closes the sale loop: approve, pay, deduct stock, register cash.**

#### What it builds

| Layer | What |
|-------|------|
| **Domain** | Extend `PosOrder` with status lifecycle (pending→paid→cancelled) |
| **Application** | `PosOrderService.pay()` — approve Document, pay Invoice, create cash movement, deduct stock |
| **Infrastructure** | `POST /pos/orders/:id/pay` endpoint |
| **Fiscal Engine** | Wire tax calculation into the order creation flow (Slice 1 upgrade) — use `FiscalService.processInvoice()` |
| **Tests** | Unit: pay flow with all integrations. Contract: HTTP pay endpoint |

#### Acceptance criteria

1. `POST /pos/orders/:id/pay` with valid body (sessionId, paymentMethodId, amountReceived) → **200** with `{ orderId, status: 'paid', paymentId }`
2. **Stock is deducted** after payment: `GET /inventory/stock/{productId}/{warehouseId}` returns `quantity - {soldQty}`
3. **Cash register balance increases** by the sale total
4. **Cash movement** of type `in` with `referenceType: 'sales_invoice'` exists
5. **Document** transitions from `pending_approval` → `approved` → `paid`
6. **Document events** created for each transition (`document.approved`, `document.paid`)
7. **SalesInvoice** linked to the order has status `paid` and `paidAt` is set
8. **Taxes calculated** via Fiscal Engine: `InvoiceTaxDetail` records exist with correct IVA amounts
9. Already-paid order → **409** with `"Order already paid"`
10. Invalid `sessionId` → **400** with `"POS session not found or not open"`

#### Dependencies
- Document Engine: approve + pay
- Inventory: StockEventHandler (already listens to `document.approved`)
- Cash Payments: register movement
- Fiscal Engine: calculate taxes (upgrade Slice 1 to use it)

---

### Slice 3: Terminal POS (Frontend)

**Browser-based POS terminal — minimal viable UI for the cashier.**

#### What it builds

| Layer | What |
|-------|------|
| **Web: Routing** | `/pos` route group in frontend router |
| **Web: POS Layout** | Full-screen POS layout (no sidebar), keyboard-friendly |
| **Web: Session** | Cash register selection, session open/close UI |
| **Web: Customer** | Partner search + quick-select |
| **Web: Products** | Product grid with search + barcode input |
| **Web: Cart** | Line items with quantity +/- , subtotal, tax, total |
| **Web: Checkout** | Payment method selection, amount received calc, change due |
| **Web: Result** | Sale confirmation screen with total |
| **Backend** | No new endpoints — uses Slice 1 + 2 APIs |

#### Acceptance criteria

1. User opens `/pos` → sees cash register selector
2. Opens session → sees POS terminal (product grid + cart)
3. Can search products by name/SKU → grid filters in real time
4. Can click product → adds to cart with qty=1
5. Can adjust quantity in cart → total recalculates
6. Can select customer → shows partner name in cart header
7. Can click "Cobrar" → payment method modal
8. Selects payment method → enters amount received → sees change due
9. Confirms → order created, stock deducted, user sees success screen
10. Product with zero stock shows "Sin stock" badge and cannot be added
11. E2E test: complete sale from product search to success screen

#### Dependencies
- Web: Auth + Layout (existing)
- Backend: Slices 1 + 2 endpoints
- New frontend components: ProductGrid, Cart, CheckoutModal, CustomerSearch

---

### Slice 4: Comprobante y Cierre de Sesión

**Receipt generation and daily close operations.**

#### What it builds

| Layer | What |
|-------|------|
| **Backend** | `GET /pos/orders/:id/receipt` — returns formatted receipt data |
| **Backend** | `POST /pos/sessions/:id/close` — finalize session with summary |
| **Backend** | `GET /pos/sessions/:id/summary` — total sales, payment methods breakdown |
| **Web** | Receipt view (browser print) |
| **Web** | Session close screen with totals |
| **Web** | Daily sales summary |

#### Acceptance criteria

1. After sale → user can view receipt → data matches sale
2. Receipt shows: company name, customer, items, subtotal, taxes, total, payment method, change, date
3. User can close session → sees daily totals (total sales, by payment method, count of transactions)
4. Closed session cannot accept new sales → **409**
5. Open session close without sales → closes with zero summary

#### Dependencies
- Non-breaking — builds on Slices 1-3

---

## 4. Epic E2E Acceptance Criteria

The Epic is complete when all the following can be executed in sequence without errors:

### E2E Flow (automated via Playwright)

```text
Given:  Tenant exists with products, customer (Partner), cash register, and payment methods
        User is logged in with POS permissions

When:   User opens /pos
And:    Selects a cash register
And:    Opens POS session
And:    Searches for a product by name
And:    Adds 3 units to cart
And:    Searches for a second product
And:    Adds 2 units to cart
And:    Selects customer "Cliente General"
And:    Clicks "Cobrar"
And:    Selects payment method "Efectivo"
And:    Enters amount received > total
And:    Confirms payment

Then:   Success screen shows with:
        - Order number
        - Total paid
        - Change amount
        - "Imprimir" and "Nueva Venta" buttons

When:   User views receipt
Then:   Receipt contains:
        - Company legal name and tax ID
        - 2 line items with correct quantities and prices
        - Subtotal, IVA (16%), total
        - Payment method and amount
        - Change
        - Date and time

When:   User checks inventory (API)
Then:   Stock of product 1: reduced by 3
Then:   Stock of product 2: reduced by 2

When:   User checks cash register balance (API)
Then:   Balance = openingBalance + totalPaid

When:   User closes POS session
Then:   Session summary shows:
        - Total sales: 1 transaction
        - Total amount: matches sale
        - Payment method breakdown
```

### API-only verification (for Slices 1 + 2 before UI exists)

```text
Given:  Tenant "demo" exists
And:    Product "Laptop" has SKU "LAP001", price 1200.00, stock 10
And:    Product "Mouse" has SKU "MOU001", price 25.00, stock 50
And:    Partner "Cliente General" exists with role CUSTOMER
And:    Cash register "Caja Principal" exists with balance 500.00
And:    Payment method "Efectivo" exists

When:   POST /pos/sessions
        { cashRegisterId: "...", openingBalance: 500 }
Then:   Status 201, session is "open"

When:   POST /pos/orders
        { sessionId: "...", partnerId: "...", items: [
            { productId: "...", quantity: 2, unitPrice: 1200 },
            { productId: "...", quantity: 1, unitPrice: 25 }
        ]}
Then:   Status 201
And:    Response.total = 1200*2 + 25*1 = 2425 (before taxes)

When:   POST /fiscal/calculate using order's documentId
Then:   Tax details with IVA 16% = 388.00

When:   POST /pos/orders/:id/pay
        { paymentMethodId: "...", amountReceived: 3000 }
Then:   Status 200
And:    Response.status = "paid"

When:   GET /inventory/stock/LAP001/CajaPrincipal
Then:   quantity = 8 (was 10, sold 2)

When:   GET /inventory/stock/MOU001/CajaPrincipal
Then:   quantity = 49 (was 50, sold 1)

When:   GET /cash-payments/registers/:id/movements
Then:   Last movement: type=in, amount=2813.00, reference=sales_invoice

When:   POST /pos/sessions/:id/close
        { closingBalance: 3313.00 }
Then:   Status 200, session status = "closed"
```

## 5. Non-goals

The following are intentionally excluded from Epic 01 V1:

- Offline POS (IndexedDB) — deferred to V2
- Barcode scanner hardware integration — manual input only
- Credit sales / "fiado" — all sales are instant-pay
- Split payment (multiple methods per sale) — single method only
- Discounts and promotions — deferred to V2
- Gift cards / store credit — deferred
- Fiscal printer integration — receipt is browser-print only
- Invoice emailing — deferred
- Sales returns / refunds via POS — use existing `/sales/returns` API
- Multi-currency POS — single currency per cash register
- Inventory transfers or adjustments — use existing APIs
- Cash register denominations / coin counting — simple balance only
- Customer credit limits — deferred

---

## 6. Dependencies Between Slices

```text
Slice 1 ───────────┐
                   ├──> Slice 3 (needs both APIs)
Slice 2 ───────────┘
                              └──> Slice 4 (needs Slice 1-3 complete)
```

**Parallelism**: Slice 1 + 2 must be sequential (2 depends on 1). Slice 3 can start once Slice 1 API is stable (but needs both 1+2 for full flow). Slice 4 is last.

---

## 7. Test Strategy per Slice

| Slice | Unit Tests | Contract Tests | E2E |
|-------|-----------|----------------|-----|
| 1 | `PosOrderService.create()` variations | `POST /pos/orders` shape, errors | ❌ |
| 2 | `PosOrderService.pay()` with mocks | `POST /pos/orders/:id/pay` shape, errors | ❌ |
| 3 | Components (ProductGrid, Cart) | ❌ | Playwright: select + buy flow |
| 4 | Receipt formatting, session summary | `GET /pos/orders/:id/receipt` | Playwright: close session |

---

## 8. Files to Create / Modify

### Backend (Slices 1 + 2)

```
NEW  apps/api/src/modules/pos/domain/pos-order.entity.ts
NEW  apps/api/src/modules/pos/domain/pos-order.repository.interface.ts
NEW  apps/api/src/modules/pos/application/pos-order.service.ts      ← replaces QuickSaleService
NEW  apps/api/src/modules/pos/infrastructure/dto/pos-order.dto.ts
NEW  apps/api/src/modules/pos/infrastructure/prisma-pos-order.repository.ts
NEW  apps/api/src/modules/pos/infrastructure/pos-order.controller.ts
MOD  apps/api/src/modules/pos/pos.module.ts                         ← register new providers
MOD  apps/api/src/modules/pos/application/quick-sale.service.ts     ← deprecate, delegate to PosOrderService
MOD  apps/api/prisma/schema.prisma                                  ← PosOrder model (if needed)
NEW  apps/api/tests/unit/pos/pos-order.service.spec.ts
NEW  apps/api/tests/unit/pos/pos-order.repository.spec.ts
NEW  apps/api/tests/contract/pos/pos-orders.spec.ts
```

### Frontend (Slice 3)

```
NEW  apps/web/src/modules/pos/
NEW  apps/web/src/modules/pos/views/PosTerminalView.tsx
NEW  apps/web/src/modules/pos/views/PosSessionView.tsx
NEW  apps/web/src/modules/pos/components/ProductGrid.tsx
NEW  apps/web/src/modules/pos/components/Cart.tsx
NEW  apps/web/src/modules/pos/components/CheckoutModal.tsx
NEW  apps/web/src/modules/pos/components/CustomerSearch.tsx
NEW  apps/web/src/modules/pos/hooks/usePosSession.ts
NEW  apps/web/src/modules/pos/hooks/usePosOrder.ts
NEW  apps/web/src/modules/pos/hooks/usePosProducts.ts
NEW  apps/web/src/modules/pos/store.ts
NEW  apps/web/src/modules/pos/index.tsx
MOD  apps/web/src/routes/AppRoutes.tsx                               ← add /pos route
```

---

## 9. Sprint Mapping

| Sprint | Slice | Deliverable |
|--------|-------|-------------|
| Sprint 3 (current) | Slice 1 | `POST /pos/orders` with customer + products + stock validation |
| Sprint 4 | Slice 2 | `POST /pos/orders/:id/pay` with tax calc, stock deduction, cash movement |
| Sprint 5 | Slice 3 | POS Terminal UI — browser-based cashier screen |
| Sprint 6 | Slice 4 | Receipt + session close + daily summary |

> **Note**: Sprint numbers reference the user's proposed roadmap. Each sprint may also include non-POS items (e.g., RBAC/Users polish, bug fixes).

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Document Engine states don't match POS lifecycle | Medium | High | Map POS states to Document states explicitly in Slice 1 design |
| Stock deduction race condition | Low | High | Use Prisma `$transaction` with `updateMany` expected-status guard (already exists in DocumentRepository) |
| Fiscal Engine returns unexpected tax amounts | Medium | Medium | Add explicit test with known VE tax scenario (16% IVA, no withholdings) |
| Frontend POS too complex for first iteration | Medium | Medium | Slice 3 is minimal: no barcode, no split payment, no discounts. Defer all extras. |
| Partner FK migration not done yet | Low | Medium | POS will use PartnerService directly → legacy Client FK is only for existing SalesInvoice queries |
