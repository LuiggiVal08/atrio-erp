# Release Strategy

> Cómo versionamos, empaquetamos y desplegamos Atrio.

---

## Versionado semántico

**Formato:** `MAJOR.MINOR.PATCH` (semver)

| Componente | Cuándo incrementar | Ejemplo |
|-----------|-------------------|---------|
| MAJOR | Cambios incompatibles en API pública o modelo de datos que requieren migración manual | `2.0.0` |
| MINOR | Nuevas funcionalidades compatibles hacia atrás | `1.3.0` |
| PATCH | Bug fixes, seguridad, optimizaciones sin cambio de API | `1.3.1` |

**Pre-release:** `1.0.0-alpha.1`, `1.0.0-beta.1`, `1.0.0-rc.1`

---

## Ciclo de release

```
develop ──► main (cada release)
   │            │
   │            ▼
   │        Tag: v1.0.0
   │            │
   │            ▼
   │        Docker image: atrio/api:1.0.0
   │
   └── hotfix branch (bug crítico en producción)
        ──► main ──► develop
```

### Frecuencia

| Fase | Frecuencia | Entorno |
|------|-----------|---------|
| Desarrollo | Múltiples commits/día | `develop` (local/Docker dev) |
| Sprint Review | 1 release/sprint | `staging` |
| Producción | 1 release/mes (estable) | `production` |
| Hotfix | Cuando sea necesario | `production` (desde `main`) |

---

## Calidad de release

Un release a producción requiere:

- [ ] Tests unitarios: > 90% de cobertura en nuevas funcionalidades
- [ ] Tests E2E: todos los flujos core pasan
- [ ] Linter: 0 errores, 0 warnings
- [ ] Dependency rules: 0 violaciones de imports prohibidos
- [ ] Code review: aprobado por al menos 1 persona
- [ ] CHANGELOG actualizado
- [ ] Documentación de API actualizada
- [ ] Migraciones de DB: forward + rollback probados

---

## Estrategia de branches

| Branch | Propósito | Base |
|--------|-----------|------|
| `main` | Producción. Solo merge desde `develop` y `hotfix/*` | — |
| `develop` | Integración de características | `main` |
| `feat/*` | Características nuevas | `develop` |
| `fix/*` | Bug fixes | `develop` |
| `hotfix/*` | Bug crítico en producción | `main` |

### Merge strategy

- `feat/*` → `develop`: squash merge (1 commit por feature)
- `develop` → `main`: merge commit con tag semver
- `hotfix/*` → `main`: merge commit con tag patch

---

## Artefactos

| Artefacto | Formato | Dónde |
|-----------|---------|-------|
| API | Docker image | `ghcr.io/odalx/atrio-api:{version}` |
| Web | Docker image + static files | `ghcr.io/odalx/atrio-web:{version}` |
| DB migrations | SQL files | Repositorio, `prisma/migrations/` |
| API docs | OpenAPI 3.0 | Generado automáticamente, expuesto en `/api/docs` |
| CHANGELOG | Markdown | `CHANGELOG.md` en raíz del repo |

---

## Entornos

| Entorno | URL | DB | Propósito |
|---------|-----|----|-----------|
| `local` | `localhost:5173` | PostgreSQL local | Desarrollo individual |
| `dev` | `dev.atrio.app` | PostgreSQL compartida | Integración |
| `staging` | `staging.atrio.app` | PostgreSQL staging | QA, revisión |
| `production` | `app.atrio.app` | PostgreSQL prod | Clientes reales |
