# ADR-0012 — Physical Location Hierarchy

**Status**: Accepted
**Date**: 2026-11-14
**Context**: Inventory / Warehouse Management

## Decision

The physical position of goods inside a warehouse is modeled as a strict
four-level tree of `StorageLocation` nodes:

```
Warehouse
└── AISLE   (pasillo)
    └── SHELF   (estante)
        └── LEVEL   (nivel)
            └── BIN   (rack / bin)
```

- A single self-referencing table (`storage_locations`) stores all nodes with
  `warehouseId`, `parentId`, `type`, `code` and a materialized `path`.
- The type sequence is strict: `AISLE` has no parent, `SHELF` requires an
  `AISLE`, `LEVEL` requires a `SHELF`, `BIN` requires a `LEVEL`.
- `code` is unique among siblings and `path` is unique per warehouse.
- The flat columns `warehouses.aisle/shelf/level/bin` are removed.

## Stock granularity

Stock remains at **warehouse level** (`Stock` unique on
`(productId, warehouseId)`). The location tree is a directory for putaway,
picking and physical organization; it is **not** the source of truth for
balances.

This is a deliberate, reversible first step. If bin-level stock is required
later, it can be introduced with a dedicated ADR and a migration that moves
`Stock` to `(productId, storageLocationId)` while keeping warehouse totals as
an aggregate.

## Rationale

The previous model (`Warehouse.aisle/shelf/level/bin`) assumed one warehouse
equals one bin. Real warehouses contain many aisles, shelves, levels and bins.
A tree models reality, supports bulk generation, and keeps the invariant
"every bin belongs to exactly one warehouse" enforceable.

Keeping stock at warehouse level avoids destabilizing POS, transfers, lots,
movements and reorder points in this iteration.

## Consequences

### Positive
- Real physical layout can be represented and navigated.
- Bulk generation (e.g. A–C × 1–5 × 1–3 × 1–10) is straightforward.
- No changes to stock balances, POS, transfers or reorder points.
- Path materialization makes search and display cheap.

### Negative
- Stock cannot be located to a specific bin yet.
- Additional table and CRUD surface to maintain.
- Deleting/moving nodes requires guarding against children.

## Alternatives considered

- **Flexible/skippable hierarchy**: rejected for now; strict levels are simpler
  to validate and predict.
- **Bin-level stock immediately**: rejected; high blast radius across POS,
  transfers, lots and reorder points. Deferred behind an ADR.
- **Keep flat columns and add a separate location table**: rejected; duplicate
  sources of truth.
