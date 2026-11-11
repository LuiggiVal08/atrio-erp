# ADR-0010 — Identity Permanence Principle

**Status**: Accepted  
**Date**: 2026-07-08  
**Context**: Organization, Business Partners, Employment  

## Decision

Entities that represent a permanent identity (Person, Partner, Employee,
Product, Warehouse, OrganizationUnit) must NEVER directly store historical
states or temporal relationships. Everything that changes over time must
be modeled as versioned temporal entities.

This is an architectural invariant across all Atrio modules.

## Rationale

When an identity entity stores a FK to another entity (e.g.
`employee.positionId`), the identity becomes coupled to a specific state
at a specific time. When that state changes, the previous state is lost.
This makes it impossible to answer retrospective business questions or
reconstruct the organization at a past point in time.

The pattern emerged independently across multiple modules, indicating
a natural domain consistency:

| Domain | Identity (stable) | Temporal Relationship |
|--------|-------------------|----------------------|
| Business Partners | Partner | PartnerRole |
| Organization | Position | PositionAssignment |
| Organization | Department | (future: DepartmentAssignment) |
| Employment | Employee | EmploymentRelationship |
| Employment | EmploymentRelationship | Contract, CompensationAgreement, ScheduleAssignment |
| Inventory | Product | InventoryMovement |
| Documents | Document | DocumentTransition |
| Pricing (future) | PriceList | PriceRevision |
| Payroll (future) | PayrollPeriod | PayrollRun |

## Consequences

### Positive
- Historical queries are possible without event sourcing or audit logs
- Business state can be reconstructed at any point in time
- Relationships evolve without data migration
- New temporal dimensions can be added without breaking existing models
- The system becomes naturally audit-compliant

### Negative
- More tables and joins than a naive FK approach
- "Current state" queries require `WHERE end_date IS NULL` or similar
- Developers must think in temporal terms from the start

## Rules

1. **No FK identity→identity for mutable relationships.** If relationship
   X→Y changes over time, create a temporal entity XYAssignment.
2. **Never UPDATE a temporal record.** Only INSERT new versions.
3. **The latest record without endDate IS the current state.** Any record
   with an endDate is historical.
4. **Identity entities may have mutable descriptive fields** (name, code,
   description) as long as changing them does not destroy historical
   meaning. If it does, version the identity itself (PositionRevision).

## See Also

- ADR-0009: Temporal Relationships
- Employment 002-domain-model.md: aggregate boundaries
- Business Partners 002-domain-model.md: Partner + PartnerRole
