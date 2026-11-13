# ADR-0011 — Web Forms with TanStack Form + Zod

**Status**: Accepted  
**Date**: 2026-11-13  
**Context**: `apps/web` (React 19 + Vite 6), all CRUD modules

## Decision

All new web forms use **`@tanstack/react-form`** for state/subscription
management and **Zod** (via Standard Schema) for client-side validation.

Both dependencies are pinned to exact versions in `apps/web/package.json`:
`@tanstack/react-form` and `zod`. No range specifiers, because TanStack
Form's API has changed between major lines and the codebase must not drift
on a transitive install.

The UI kit (`FieldLabel`, `MultiSelect`, `PhoneInput`, `DocumentInput`,
`AddressInput`, `Combobox`) is adapted **once** through wrappers that bind
each component to `<form.Field>`. Feature views never use the render-prop
directly.

Zod schemas live in `apps/web/src/shared/validation/` and **mirror**, but
do not share code with, the API's `class-validator` DTOs.

## Rationale

- **Same ecosystem as `@tanstack/react-query`**, already used in the web
  app: consistent mental model, naming and subscription semantics.
- **Field-level subscriptions** reduce re-renders compared to form-wide
  state, which aligns with the perceived-fluidity goal.
- **Standard Schema** accepts Zod, Valibot and ArkType without a custom
  resolver layer.
- **Headless**: it does not impose markup on the existing UI kit, so the
  current design system stays intact.

React Hook Form was considered. It is more mature, but introduces a second
form paradigm alongside TanStack Query and requires a resolver adapter for
Zod. The maturity gap is mitigated by version pinning and by isolating the
library behind wrappers.

## Consequences

### Positive

- One form paradigm across all modules.
- Server data can be applied with `form.reset(initialValues)` instead of
  `useEffect(() => setX(...))` synchronization.
- Validation rules become declarative and testable in isolation.
- The API returns field-keyed errors, so server validation maps cleanly
  onto form fields.

### Negative

- **Double validation**: Zod on the client and `class-validator` on the
  server. The server remains the source of truth; the client schema is a
  minimal mirror, not a copy of business rules.
- Custom inputs require wrappers (built once in the wrapper phase).
- Temporary coexistence of migrated and non-migrated forms.
- TanStack Form's API may still evolve; upgrades are deliberate, not
  automatic.

## Rules

1. **New forms must use the form layer.** A form that mutates server state
   and is not built on `@tanstack/react-form` requires justification in
   review.
2. **No inline `<form.Field>` in feature views.** Add or extend a wrapper in
   the shared form layer instead.
3. **`form.reset(initialValues)` when server data arrives.** Do not
   synchronize server data into local state with `useEffect`.
4. **Zod schemas mirror DTOs; they do not replace server validation.** Keep
   them minimal and field-aligned.
5. **Map API errors by field.** The API exposes `errors: [{ field, message }]`
   from `validationExceptionFactory`; forms consume it through
   `applyServerErrors(form, error)`.
6. **POS is out of scope.** POS keeps its keyboard-first, scanner-driven
   interaction layer and does not adopt this form layer.
7. **Pin versions.** Upgrade TanStack Form and Zod intentionally, with the
   wrapper tests passing.

## Affected modules

`settings`, `cash`, `purchases`, `inventory`, `payroll`, `users`, `rbac`,
`localization`. POS, search/filter inputs and `LoginView` are excluded.

## Verification

- `npm run typecheck` and `npm test -- --run` in `apps/web`.
- Wrapper unit tests with Vitest + Testing Library.
- Playwright only for critical end-to-end flows.
