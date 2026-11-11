# Testing Strategy

## Directory layout

```
tests/
├── unit/           — Pure unit tests (mocks, no DB)
├── integration/    — Prisma + PostgreSQL required
├── contract/       — HTTP contract tests (full app, DB required)
├── migrations/     — ETL / migration pipeline tests
├── e2e/            — End-to-end flows (future)
├── fixtures/       — Shared test data (future)
└── helpers/        — Shared test utilities
```

## Test categories

| Type | Goal | Requires DB | When it runs |
|---|---|---|---|
| **Unit** | Isolated logic with mocks | ❌ | Every commit + CI (PR & main) |
| **Contract** | API backward compatibility, status codes, JSON shape | ✅ | CI (PR & main) |
| **Integration** | Prisma + PostgreSQL queries, repository layer | ✅ | CI (main only) |
| **Migration** | ETL pipeline, data integrity, rollback | ✅ | CI (main only) |
| **E2E** | Full user flow (future) | ✅ | CI (main only) |

## Running tests

```bash
npm test                  # unit + contract (fast, for development)
npm run test:unit         # unit only
npm run test:integration  # integration only
npm run test:contract     # contract only
npm run test:migrations   # migrations only
npm run test:all          # everything
npm run test:e2e          # end-to-end
```

## Design principles

### Unit tests (`tests/unit/`)
- Never connect to a real database
- Mock all Prisma / repository dependencies
- Test business logic, validation, edge cases
- Must complete in under 30s

### Integration tests (`tests/integration/`)
- Require a running PostgreSQL (Prisma)
- Use real Prisma client — no mocks
- Clean up test data in `afterAll`
- Named `*.spec.ts` with directory matching domain structure:
  ```
  tests/integration/
  ├── business-partners/
  ├── sales/
  ├── inventory/
  └── localization/
  ```

### Contract tests (`tests/contract/`)
- Bootstrap the full NestJS `AppModule` via `createTestApp()`
- Use `supertest` for HTTP assertions
- Verify JSON shapes, status codes, error messages
- Run in PR CI to catch API breaks early

### Migration tests (`tests/migrations/`)
- Test the ETL pipeline end-to-end
- Verify data integrity after migration
- Include rollback and idempotency scenarios
- Run before releases

## CI pipeline

### Pull request (fast gate)
```
Unit + Contract + TypeScript check + Build
```

### Main merge (full gate)
```
Unit + Contract + Integration + Migrations + TypeScript check + Build
```

## Adding new tests

1. Choose the right directory (see table above)
2. If your test uses `PrismaService` directly → belongs in `tests/integration/`
3. If your test sends HTTP requests to a NestJS app → belongs in `tests/contract/`
4. If your test can construct objects with `new` and mock everything → `tests/unit/`
5. Never put a DB-dependent test in `tests/unit/`

## Known technical debt

### 1. Contract tests need DB but could be lighter

Some contract tests only check `401` without auth. These could be moved to a lighter "http" category that doesn't need a full DB bootstrap. Tracked in [TBD].

### 2. No shared test fixtures yet

Each test file creates its own test data inline. A `tests/fixtures/` directory with factory functions would reduce duplication. Tracked in [TBD].

### 3. Web tests not covered by this strategy

The frontend uses Vitest + Playwright. That is a separate strategy for a separate document.
