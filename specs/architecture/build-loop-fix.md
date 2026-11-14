# Build Loop Fix — API Dev Watcher

## Status
Accepted — implemented.

## Context
The API dev container (`atrio-api-dev`) runs `nest start --watch` with the
repository's `apps/api` mounted at `/app` and the monorepo `packages/` mounted
at `/packages` (`docker-compose.override.yml`).

The API imports runtime values from `@atrio/core-accounting`,
`@atrio/l10n_ve` and `@atrio/l10n_co` in `apps/api/src/modules/fiscal/`.

## Symptom
Editing a file under `apps/api/src` recompiles the project, but the running
process keeps serving stale code. The workaround was to copy
`dist/app/src` into `dist/src` and restart the container manually.

## Root cause
`apps/api/tsconfig.json` included `../../packages/**/*` and mapped the
`@atrio/*` aliases to package **sources**:

```json
"paths": {
  "@atrio/core-accounting": ["../../packages/core-accounting/src"],
  "@atrio/l10n_ve": ["../../packages/l10n_ve/src"],
  "@atrio/l10n_co": ["../../packages/l10n_co/src"]
},
"include": ["src/**/*", "prisma/**/*", "tests/**/*", "../../packages/**/*"]
```

With `/packages` present, the common root of all non-declaration inputs
becomes `/`, so `tsc` emits:

- `/app/dist/app/src/...`
- `/app/dist/packages/...`

Nest CLI resolves the entry as
`dist/${sourceRoot}/${entryFile}` = `dist/src/main` (`nest-cli.json`), which
is the stale build from before `/packages` was mounted. The watcher keeps
writing to `dist/app/src` while Nest keeps running `dist/src`.

Without `/packages` (image build), the common root is `/app`, so the output
is `dist/src` and the process starts correctly — but in dev the mount shifts
the output.

Additional inconsistencies found:

- `apps/api/package.json` does not declare `@atrio/*`; the symlinks in
  `node_modules/@atrio` were created manually and show as `extraneous`.
- `jest.moduleNameMapper` and `packages/*/package.json` already point to
  `packages/*/dist`, not to sources.
- `apps/api/docker-entrypoint.sh` runs `dist/apps/api/src/main`, which does
  not match the `apps/api` build context.
- `apps/api/package.json` `start:prod` runs `node dist/main`, also wrong.

## Decision
Treat `packages/*` as prebuilt libraries (Option A):

- Compile against `packages/*/dist` (declarations), not sources.
- Fix the API `rootDir` so the output is always `dist/src`.
- Build packages before typecheck/build in dev, CI and production.
- Create the `node_modules/@atrio/*` symlinks at container startup.

Rejected alternatives:

- **Option B** (keep sources, `rootDir: ".."`, run `dist/app/src/main`):
  fewer build steps but relies on non-standard Nest entry paths and still
  needs packages in the production image.
- **Option C** (npm workspaces): the clean long-term solution, but it
  requires a root `package.json`/lockfile migration and Docker context
  changes; deferred.

## Changes

### Phase 1 — Development

`apps/api/tsconfig.json`
- `include`: `["src/**/*", "prisma/**/*", "tests/**/*"]`
- `paths`:
  ```json
  "@atrio/core-accounting": ["../../packages/core-accounting/dist"],
  "@atrio/l10n_ve": ["../../packages/l10n_ve/dist"],
  "@atrio/l10n_co": ["../../packages/l10n_co/dist"]
  ```

`apps/api/tsconfig.build.json`
- Add `"compilerOptions": { "rootDir": "." }` to pin the output to
  `dist/src`.

`apps/api/docker-entrypoint.dev.sh` (new)
- For each package: ensure `node_modules`, build if `dist` is missing or
  older than `src`, and create `/app/node_modules/@atrio/<pkg>` symlinks.
- Then `exec npm run start:dev`.

`docker-compose.override.yml`
- API service: `command: ["sh", "/app/docker-entrypoint.dev.sh"]`.

### Phase 2 — CI

`.github/workflows/ci.yml`, `api` job, before TypeScript check:
- `npm ci` + `npm run build` for `core-accounting`, then `l10n_ve` and
  `l10n_co` (order matters: both depend on `core-accounting`).

### Phase 3 — Production

`docker-compose.prod.yml`
- Keep `context: ./apps/api` and add an additional build context:
  ```yaml
  additional_contexts:
    packages: ./packages
  ```

`apps/api/Dockerfile`
- Build stage: copy `/packages` from the additional context, build the
  packages, create `node_modules/@atrio/*` symlinks, then `npm run build`.
- Runtime stage: copy `/packages` alongside `dist` and `node_modules` so
  the symlinks resolve.

`packages/.dockerignore` (new)
- Exclude `node_modules` and `dist` from the additional build context; they
  are reinstalled/rebuilt inside the image.

`apps/api/.dockerignore`
- Exclude the gitignored `apps/` build cruft from the build context.

`apps/api/docker-entrypoint.sh`
- `exec node dist/src/main`.

`apps/api/package.json`
- `"start:prod": "node dist/src/main"`.

## Verification
- `npx tsc --noEmit --incremental false` in `apps/api`.
- `npm test` and `npm run build` in `apps/api`.
- `dist/src/main.js` exists; `dist/app` does not.
- Edit an `apps/api/src` file with the dev container running and confirm the
  watcher rewrites `dist/src` and the process restarts.
- CI pipeline green.
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml build api`
  and container starts.

## Risks and contingencies
- If `rootDir: "."` raises `TS6059` for package declarations, fall back to
  `rootDir: ".."` and align the Nest entry to `dist/app/src/main`.
- If `npm ci` in Docker keeps timing out, apply the `AGENTS.md` workaround
  (copy host `node_modules`) to the packages as well.
- If Compose does not support `additional_contexts`, switch to
  `context: .` with `dockerfile: apps/api/Dockerfile` and tune the root
  `.dockerignore`.
- Do not commit unrelated working-tree changes (`apps/api/prisma/seed.ts`,
  web views, i18n, `docker-compose.override.yml` VITE vars, etc.).
