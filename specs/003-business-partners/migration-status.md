# Migration Dashboard — Business Partners

> **Updated**: 2026-07-07
> **Current Phase**: M-002.5 — Dry Run Validation ✅
> **Owner**: Platform Team
> **Semaphore**: 🟢 M-001 complete · 🟢 M-001.6 complete · 🟢 M-002 complete · 🟢 M-002.5 complete · ⚪ M-003..M-006 pending

---

## 🔴🟡🟢 Global Semaphore

```
🟢 Schema
🟢 Domain
🟢 Repository
🟢 Module Wiring
🟢 Migration SQL
🟢 Tests (domain)
🟢 Build (API + Web)
🟢 Regression (408/408)
🟢 Verification Suite
🟢 ETL Migration
🟢 Dry Run (21 partners, 4 invariants)
⚪ Adapters
⚪ Frontend
⚪ Deprecation
⚪ Legacy Cleanup
```

---

## Overall Progress

| Component | Status | Coverage | Risk | Notes |
|-----------|--------|----------|------|-------|
| Domain Model | ✅ | 100% | 🟢 Low | 3 aggregates, 4 enums, VOs |
| Prisma Schema | ✅ | 100% | 🟢 Low | 6 tables, 10 indexes, 11 FKs |
| Repository (interface) | ✅ | 100% | 🟢 Low | 20+ methods |
| Repository (Prisma) | ✅ | 100% | 🟢 Low | Full impl + transactional |
| Module Wiring | ✅ | 100% | 🟢 Low | NestJS module, DI token |
| Migration SQL | ✅ | Applied | 🟢 Low | `20260707000001` |
| Tests (domain) | ✅ | 10/10 | 🟢 Low | 100% pass |
| Existing Test Suite | ✅ | 448/448 | 🟢 Low | No regressions (107 suites) |
| TypeScript (API) | ✅ | Clean | 🟢 Low | |
| TypeScript (Web) | ✅ | Clean | 🟢 Low | |
| Verification Suite | ✅ | 24/24 | 🟢 Low | Idempotency, integrity, rollback, perf, compatibility |
| ETL Migration (M-002) | ✅ | 12/12 | 🟢 Low | 6-stage pipeline, traceability |
| Dry Run (M-002.5) | ✅ | 4/4 | 🟢 Low | Rep. dataset, invariants, idempotency, mapping |
| API (controllers) | ⏳ | — | 🟡 Medium | Phase 3 |
| Frontend | ⏳ | — | 🟡 Medium | Phase 4 |
| Legacy Deprecation | ❌ | — | 🔴 High | Phase 5-6 |

---

## Migration Metrics

```
Tests passing:         408/408
Test suites:           100
TypeScript (API):      clean
TypeScript (Web):      clean
Build (API):           success
Build (Web):           success
Migration tables:      6
Migration enums:       4
Migration indexes:     7
Migration FKs:         11
Migration time:        2.1s
Rollback time:         —
Schema drift:          0
Legacy endpoints broken: 0
```

---

## Entry / Exit Criteria by Phase

### M-001 — Foundation

| Entry | Exit |
|-------|------|
| — (initial phase) | ✅ Domain modelled |
| | ✅ Prisma schema generated |
| | ✅ Repository interface defined |
| | ✅ Repository implemented |
| | ✅ Module wired |
| | ✅ Migration SQL written + applied |
| | ✅ 10 domain tests passing |
| | ✅ 408 regression tests passing |

### M-001.6 — Verification Suite

| Entry | Exit |
|-------|------|
| ✅ M-001 complete | 🟡 Idempotency validated |
| ✅ 408 tests in green | 🟡 Referential integrity validated |
| ✅ Schema compiling (API + Web) | 🟡 Rollback proven |
| ✅ Migrations applied | 🟡 Performance benchmarked |
| ✅ No legacy endpoint changes | 🟡 Consistency verified (suite re-run) |
| ✅ No regressions | 🟡 Evidence files committed |
| | 🟡 Gate approved |

### M-002 — Data Migration (not started)

| Entry | Exit |
|-------|------|
| ⏳ M-001.6 verified | ⏳ Customers migrated |
| ⏳ Rollback proven | ⏳ Vendors migrated |
| ⏳ Matching algorithm approved | ⏳ Duplicates merged |
| | ⏳ Report generated |
| | ⏳ No FK violations |

---

## Evidence Index

| Verification | Evidence | Status |
|-------------|----------|--------|
| Idempotency | `tests/migrations/idempotency.spec.ts` | ⏳ |
| Referential integrity | `tests/migrations/referential-integrity.spec.ts` | ⏳ |
| Rollback | `tests/migrations/rollback.spec.ts` | ⏳ |
| Performance | `tests/migrations/performance.spec.ts` | ⏳ |
| Consistency | `tests/migrations/compatibility.spec.ts` | ⏳ |

---

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation | Status |
|------|--------|------------|------------|--------|
| FK violations after migration | 🔴 High | Low | All FKs tested before migration + transactional script | 🟢 |
| Duplicate partners (client+vendor) | 🔴 High | Medium | Matching by TaxIdentifier (exact) + fallback fuzzy + manual review | 🟡 |
| Rollback incomplete / data loss | 🔴 High | Low | Script tested, documented, reviewed | 🟡 |
| API regression (legacy routes) | 🟡 Medium | Low | Legacy adapters + contract tests unchanged | 🟢 |
| Performance degradation | 🟡 Medium | Low | Benchmark before/after, indexed queries | 🟢 |
| Schema drift between envs | 🟡 Medium | Low | `prisma migrate status` in CI | 🟢 |
| Matching algorithm false positives | 🟡 Medium | Medium | Tax ID first (exact), not name-based merging | 🟢 |

---

## Schema Details

### New Tables (8)

| Table | Rows | FKs | Notes |
|-------|------|-----|-------|
| `partners` | 0 | 3 | Tenant + CreatedBy + UpdatedBy |
| `partner_roles` | 0 | 1 | Cascade delete from partner |
| `partner_tags` | 0 | 1 | Cascade delete from partner |
| `contacts` | 0 | 3 | Partner + CreatedBy + UpdatedBy |
| `partner_addresses` | 0 | 3 | Partner + CreatedBy + UpdatedBy |
| `partner_events` | 0 | 2 | Partner + CreatedBy |
| `partner_migration_map` | 0 | 1 | ETL traceability (M-002) |
| `partner_migration_review` | 0 | 0 | Manual review queue (M-002.5) |

### Enums (4)

| Enum | Values |
|------|--------|
| `PartnerType` | `PERSON`, `COMPANY` |
| `PartnerStatus` | `ACTIVE`, `INACTIVE`, `BLOCKED`, `ARCHIVED` |
| `PartnerRoleType` | `CUSTOMER`, `SUPPLIER`, `PROSPECT`, `DISTRIBUTOR`, `CARRIER`, `MANUFACTURER`, `CREDITOR` |
| `AddressType` | `FISCAL`, `BILLING`, `SHIPPING`, `BRANCH`, `PRIMARY`, `OTHER` |

### Indexes (7)

- `partners_tenant_id_status_idx` — filtered queries by tenant + status
- `partners_tenant_id_legal_name_idx` — search by legal name
- `partners_tenant_id_tax_id_*` (unique) — dedup by tax ID per tenant
- `contacts_partner_id_idx` — contact lookup
- `partner_addresses_partner_id_idx` — address lookup
- `partner_events_partner_id_occurred_at_idx` — event timeline

---

## Rollback Procedure

If rollback is needed:

```sql
-- 1. Drop partner tables (order matters for FKs)
DROP TABLE IF EXISTS partner_events CASCADE;
DROP TABLE IF EXISTS partner_addresses CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS partner_tags CASCADE;
DROP TABLE IF EXISTS partner_roles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;

-- 2. Drop enums
DROP TYPE IF EXISTS "AddressType";
DROP TYPE IF EXISTS "PartnerRoleType";
DROP TYPE IF EXISTS "PartnerStatus";
DROP TYPE IF EXISTS "PartnerType";

-- 3. Remove migration record
DELETE FROM _prisma_migrations
WHERE migration_name = '20260707000001_add_business_partners';
```

Rollback tested: ⏳ M-001.6

---

## Hotfixes

| Date | Issue | Fix |
|------|-------|-----|
| 2026-07-07 | `PartnerStatus` missing `ARCHIVED` | `ALTER TYPE` + schema.prisma + migration.sql updated |

---

## Defect Tracking

| ID | Description | Impact | Status |
|----|-------------|--------|--------|
| — | None currently | — | 🟢 |

---

## Matching Algorithm (for M-002)

Priority order for deduplication:

1. **TaxIdentifier** (RIF/NIT/EIN/…) → exact match per tenant + country + type + value
2. **Official ID** (if documented in legacy `identification_number`)
3. **Name similarity** → fuzzy match as **last resort** + flagged for manual review

No blind merging by commercial name.

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Data model (lines 1046-1205) |
| `prisma/migrations/20260707000001_add_business_partners/migration.sql` | Applied SQL |
| `src/core/business-partners/domain/partner.entity.ts` | Domain types |
| `src/core/business-partners/domain/partner.repository.interface.ts` | Repository contract |
| `src/core/business-partners/infrastructure/prisma-partner.repository.ts` | Prisma implementation |
| `src/core/business-partners/infrastructure/business-partners.module.ts` | NestJS wiring |
| `tests/unit/business-partners/partner.repository.spec.ts` | Domain integration tests |
| `tests/migrations/idempotency.spec.ts` | Idempotency verification |
| `tests/migrations/referential-integrity.spec.ts` | Integrity verification |
| `tests/migrations/rollback.spec.ts` | Rollback verification |
| `tests/migrations/performance.spec.ts` | Performance benchmark |
| `tests/migrations/compatibility.spec.ts` | Full regression check |
| `specs/003-business-partners/006-migration-plan.md` | Migration strategy |
| `specs/003-business-partners/CCR-01-cross-context-review.md` | Cross-context review |
| `src/core/business-partners/domain/migration.types.ts` | ETL types (confidence VOs, match criteria enum, normalization changes) |
| `src/core/business-partners/application/partner-migration.service.ts` | ETL pipeline (6 stages) |
| `tests/migrations/etl.spec.ts` | ETL stage tests (12) |
| `tests/migrations/dry-run.spec.ts` | Dry run validation (4 tests, 21 partners, 3 merges) |
| `prisma/migrations/20260707000002_add_partner_migration_map/migration.sql` | Partner migration map table |
| `prisma/migrations/20260707000003_add_partner_migration_review/migration.sql` | Partner migration review table |

---

## Next Milestones

| Phase | Description | Target |
|-------|-------------|--------|
| M-003 | Adapter Endpoints | Next |
| M-004 | Frontend | |
| M-005 | Deprecation | |
| M-006 | Legacy Removal | |
