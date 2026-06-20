<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/002-document-engine/plan.md
<!-- SPECKIT END -->

## Project Conventions

### Branching Strategy
- **main** — production-ready, stable
- **develop** — integration branch for features (create from main when starting a feature cycle)
- **feat/<module>** — feature branches (e.g., `feat/document-engine`, `feat/docker`)
- Merge: feature → develop (squash), develop → main (merge commit with semver tag)

### Commit Convention — Conventional Commits
Format: `type(scope): imperative description in English`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
Scopes: `api`, `web`, `db`, `docker`, `docs`, `specs`

Examples:
- `feat(api): add document repository with Prisma`
- `fix(db): remove CLI warnings from migration SQL`
- `chore(docker): add Dockerfiles for api and web`

Use `git add -p` to separate unrelated changes into distinct commits.

### Code Conventions
- **API (NestJS 11 + TypeScript 5.x):** hexagonal architecture (domain/application/infrastructure), `@/` path alias, Prisma ORM, PostgreSQL 16
- **Web (React 19 + Vite 6):** `@/` path alias, `import.meta.env` for env vars, Tailwind CSS 4
- Tests: Jest (unit), Supertest (E2E), Vitest (web unit), Playwright (web E2E)
- TDD mandatory per Constitution Principle III

### Docker Strategy
- `apps/api/Dockerfile`: multi-stage (build + runtime), Node 24 Alpine, Prisma via direct connection for migrations
- `apps/web/Dockerfile`: multi-stage Node 24 Alpine build + Nginx Alpine serve
- `docker-compose.yml`: one service per component, Nginx as single entry point (:80)
- API connects through PgBouncer at runtime; migrations run via direct PostgreSQL connection

### PR Workflow
- Feature branches squash-merged to develop
- develop merged to main with merge commit and version tag (v1.0.0, v1.1.0, etc.)
