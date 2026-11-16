# ADR-0013 — Stock Transit and Commitment

**Status**: Accepted
**Date**: 2026-11-15
**Context**: Inventory / Warehouse Management

## Decision

Warehouse transfers have an explicit lifecycle and stock distinguishes three
quantities:

```
physical quantity  = goods physically present in the warehouse
committed quantity = goods reserved by pending outbound operations
available quantity = physical quantity - committed quantity
```

`available` is always derived; it is never persisted as an independent balance.

### Transfer lifecycle

```
pending ──dispatch──> in_transit ──receive/close──> completed
   │
   └──cancel──> cancelled
```

- `pending` reserves the full transfer quantity at the source warehouse.
- `dispatch` removes the goods from source physical stock and releases the
  source commitment. The goods are now in transit and belong to no warehouse
  balance.
- `receive` may be partial. Each receipt increments destination physical stock
  and accumulates `receivedQuantity`.
- `completed` is reached when all dispatched goods are received, or when an
  operator explicitly closes the remainder as a shortage.
- `cancelled` is reachable only from `pending`; it releases the reservation.
- `completed` and `cancelled` are terminal. No other terminal state is added
  without a new ADR that covers inventory, cash, documents, taxes, audit and
  domain events.

### Shortages

A shortage is the difference between dispatched and received quantity. It is
recorded on the transfer as `shortageQuantity`, with source and destination
movements kept as separate facts. The system never creates virtual destination
stock to hide a shortage. Loss recognition documents may later consume the
shortage fact, but are outside this ADR.

### Commitment policy

- Pending transfers are the first producer of commitments.
- Outbound operations that consume stock must validate **available**, not
  physical quantity: POS sales, document approval, manual stock-outs, transfer
  reservation and dispatch.
- Inbound operations increase physical quantity only.
- Physical counts compare against physical quantity. An adjustment may not
  leave physical below committed.
- Sales-order reservations are not introduced by this ADR; they can use the
  same commitment field when that flow is specified.

### Concurrency

Reservation, dispatch, receipt and cancellation run in serializable
transactions with conditional updates. A concurrent sale or transfer may not
consume committed goods. Retries are limited to serialization conflicts
(`P2034`).

### Lots

Dispatch decrements the selected source lot and snapshots its lot number,
serial and expiration date on the transfer. Receipt recreates or increases the
destination lot using that snapshot for the received quantity. A shortage
leaves the lot already removed at dispatch; it is not re-created.

## Rationale

The previous implementation completed a transfer in one step, decrementing the
source and incrementing the destination in the same transaction. That made
in-transit goods invisible and allowed pending transfers to be sold by mistake.
Splitting dispatch from receipt models the physical reality and gives the
business a place to record partial receipts and shortages.

## Consequences

### Positive
- Goods in transit are explicit and auditable.
- Pending transfers protect source stock from concurrent sales.
- Partial receipts and shortages are first-class facts.
- POS and manual stock-outs share one availability rule.

### Negative
- Every outbound stock consumer must understand commitment.
- A migration is required for commitment and transfer tracking fields.
- Legacy pending transfers have no prior reservation and must be handled
  explicitly during the first dispatch.

## Alternatives considered

- **Keep immediate completion**: rejected; it cannot represent transit or
  partial receipt.
- **Persist available as a separate column**: rejected; three mutable balances
  would drift. Available is derived.
- **Create a separate reservation table**: deferred. A single committed column
  is sufficient while transfers are the only commitment producer. A reservation
  ledger becomes justified when multiple producers or expirations appear.
- **Treat shortage as an automatic inventory loss document**: rejected for this
  iteration; document and tax effects need their own ADR.
