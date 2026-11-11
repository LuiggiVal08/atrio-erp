# ADR-0009 — Temporal Relationships

**Status**: Accepted  
**Date**: 2026-07-08  
**Context**: Organization, Business Partners, Document Engine  

## Decision

When a relationship has historical significance or may change over time, it must NOT be stored as a direct FK on the main entity. Instead, model it as a separate temporal entity that preserves history.

## Rationale

Direct FKs (`employee.positionId`, `employee.departmentId`) destroy history. When the relationship changes, the previous state is irrecoverable. This makes it impossible to answer business questions like "What was Luis's position on March 10?" or "Which department did this sale belong to at the time?"

## Examples

| Domain | Stable Entity | Temporal Relationship |
|--------|--------------|----------------------|
| Organization | Position | PositionAssignment |
| Business Partners | Partner | PartnerRole |
| Inventory | Product | InventoryMovement |
| Documents | Document | DocumentTransition |
| Pricing (future) | PriceList | PriceRevision |
| Payroll (future) | PayrollPeriod | PayrollRun |

## Consequences

### Positive
- Historical queries become possible without event sourcing or audit logs
- Business state can be reconstructed at any point in time
- Relationships evolve without data migration
- New temporal dimensions (e.g., manager history) can be added without breaking existing models

### Negative
- More tables and joins than a naive FK approach
- Slightly more complex queries for "current" state (requires `WHERE end_date IS NULL` or similar)

## Migration Note

Existing `Employee.department` and `Employee.departmentId` are legacy fields from before this ADR. They are retained for backward compatibility but new relationships must follow the temporal pattern.

## See Also

- ADR-0005: Document State Machine (applies the same pattern to document transitions)
- Organization module: Position + PositionAssignment
- Business Partners: Partner + PartnerRole
