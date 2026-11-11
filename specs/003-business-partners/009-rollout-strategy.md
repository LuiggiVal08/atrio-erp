# Rollout Strategy — Business Partners

> Estrategia de despliegue incremental del módulo Business Partners.
> Minimiza riesgo, preserva compatibilidad y permite revertir en cualquier fase.

---

## Principios

1. **Nunca romper funcionalidad existente** — cada fase debe ser reversible
2. **Los adaptadores son temporales pero con EOL explícita** — no se vuelven permanente legacy
3. **El frontend nuevo convive con el viejo** — migración progresiva de usuarios
4. **Feature flags** para activar/desactivar el nuevo módulo por tenant

---

## Fase 0: Preparación (Día 1-3)

### Actividades

- [ ] Crear rama `feat/business-partners`
- [ ] Generar migración Prisma con tablas nuevas (sin dropear las viejas)
- [ ] Implementar `PartnerEntity`, value objects, repository interface
- [ ] Implementar `PrismaPartnerRepository`
- [ ] Implementar casos de uso core (UC-01 a UC-06)
- [ ] Escribir tests unitarios de use cases
- [ ] Escribir tests de integración del repository

### Criterio de salida

```
✓ Todos los tests unitarios pasan
✓ Todos los tests de integración pasan
✓ La migración Prisma se aplica sin errores
✓ La BD existente no se modifica
```

---

## Fase 1: API nueva (Día 4-6)

### Actividades

- [ ] Implementar `PartnerController` con endpoints nuevos
- [ ] Implementar roles (UC-07, UC-08)
- [ ] Implementar contactos (UC-09, UC-10, UC-11)
- [ ] Implementar direcciones (UC-12, UC-13, UC-14)
- [ ] Implementar etiquetas (UC-15, UC-16)
- [ ] Implementar `GET /partners/:id/commercial-history` (consulta delegada)
- [ ] Escribir tests de contracto para endpoints nuevos
- [ ] Documentar API en Swagger

### Criterio de salida

```
✓ Todos los endpoints nuevos responden correctamente
✓ Tests de contracto pasan
✓ La API legacy sigue funcionando sin cambios
✓ Se puede crear un Partner via API nueva y consultarlo
```

---

## Fase 2: Migración de datos (Día 7)

### Actividades

- [ ] Ejecutar script de migración de `clients` → `partners` (rol CUSTOMER)
- [ ] Ejecutar script de migración de `vendors` → `partners` (rol SUPPLIER)
- [ ] Verificar que todos los registros se migraron (conteo + muestreo)
- [ ] Verificar que las FKs legacy siguen funcionando

### Criterio de salida

```
✓ SELECT COUNT(*) FROM partners = SELECT COUNT(*) FROM clients + SELECT COUNT(*) FROM vendors
✓ Muestreo aleatorio de 20 Partners: datos correctos, roles asignados
✓ Las facturas existentes siguen siendo accesibles por client_id
✓ Las órdenes existentes siguen siendo accesibles por vendor_id
```

---

## Fase 3: Adaptadores legacy (Día 8-9)

### Actividades

- [ ] Refactorizar `ClientController.findAll` para delegar a `PartnerService`
- [ ] Refactorizar `VendorController.findAll` para delegar a `PartnerService`
- [ ] Refactorizar `ClientController.create` para delegar a `PartnerService`
- [ ] Refactorizar `VendorController.create` para delegar a `PartnerService`
- [ ] Agregar headers `Deprecation` / `Sunset` a endpoints legacy
- [ ] Escribir tests que verifiquen que los adaptadores producen output idéntico

### Feature flag

```typescript
// Configuración por tenant en BD o env var
FEATURE_BUSINESS_PARTNERS = boolean

// En los controllers legacy:
if (featureFlags.isEnabled('business-partners')) {
  return this.partnerService.findByRole('CUSTOMER');
}
return this.legacyClientService.findAll();
```

### Criterio de salida

```
✓ GET /clients y GET /vendors returnan mismos datos que antes
✓ POST /clients y POST /vendors crean Partners correctamente
✓ Tests de contracto de adaptadores pasan
✓ El flag permite desactivar y volver al comportamiento anterior
```

---

## Fase 4: Frontend nuevo (Día 10-14)

### Actividades

- [ ] Implementar hooks de Partner en `modules/business-partners/hooks/`
- [ ] Implementar `PartnerListView` con tabs de filtro por rol
- [ ] Implementar `PartnerDetailView` con solapas
- [ ] Implementar `PartnerFormView` (create/edit)
- [ ] Agregar entrada en sidebar: "Business Partners"
- [ ] Agregar redirects de rutas antiguas
- [ ] Implementar búsqueda con debounce
- [ ] Escribir tests de integración frontend (Vitest)
- [ ] Escribir tests E2E (Playwright)

### Feature flag (frontend)

```typescript
// En AppRoutes.tsx
if (featureFlags.isEnabled('business-partners')) {
  // Mostrar sidebar item + rutas nuevas
}
// Siempre mantener redirects de rutas antiguas
```

### Criterio de salida

```
✓ PartnerListView carga y filtra correctamente
✓ PartnerDetailView muestra todas las solapas con datos
✓ PartnerFormView crea/edita Partners
✓ Los redirects de /inventory/clients → /partners funcionan
✓ Tests Vitest pasan
✓ Tests Playwright pasan (crear Partner + ver en listado)
```

---

## Fase 5: Limpieza (Día 15)

### Actividades

- [ ] Migrar FKs de tablas legacy a `partners.id`
- [ ] Dropear tablas `clients` y `vendors` (migración Prisma)
- [ ] Eliminar `ClientController`, `VendorController`
- [ ] Eliminar hooks `useClients.ts`, `useVendors.ts`
- [ ] Eliminar vistas `ClientListView.tsx`, `VendorListView.tsx`
- [ ] Eliminar modelos Prisma `Client` y `Vendor`
- [ ] Remover feature flags (siempre activo)

### Rollback plan

Si algo sale mal en cualquier fase:

```
Fase 0-1:  git revert + migración rollback
Fase 2:    Restaurar desde backup de BD (los datos fuente no se modifican)
Fase 3:    Desactivar feature flag → vuelve al comportamiento legacy
Fase 4:    Desactivar feature flag frontend → sidebar y rutas legacy
Fase 5:    Requiere restore completo de BD + git revert (alto riesgo — solo si es crítico)
```

### Criterio de salida

```
✓ No existen tablas clients ni vendors en BD
✓ No existen referencias a Client/Vendor en el código (excepto documentación histórica)
✓ Todos los tests pasan (unit, integration, contract, E2E)
✓ El build de TypeScript compila sin errores
✓ El build de Vite produce el bundle correcto
```

---

## Post-migración

- Monitorear errores 404/500 en endpoints de Partners durante 1 semana
- Monitorear tiempo de respuesta de `/partners` vs antiguo `/clients`
- Encuesta rápida a usuarios: "¿notaste algún cambio en el módulo de terceros?"
- Si todo estable: eliminar feature flags del código
- Actualizar documentación de API (remover endpoints deprecated)
