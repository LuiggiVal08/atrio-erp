# Module Template

> Plantilla para crear un nuevo Bounded Context en Atrio. Después de leer esto, un desarrollador debe poder crear un contexto nuevo completo sin preguntar.

---

## Paso 1: Crear la estructura de carpetas

```bash
mkdir -p apps/api/src/modules/mi-contexto/{application/{use-cases,dto,ports/{in,out}},domain/{entities,value-objects,events,services,repositories},infrastructure/{persistence,messaging,external,anti-corruption},presentation/rest,__tests__/{unit,integration}}
```

---

## Paso 2: Definir el módulo NestJS

```ts
// mi-contexto.module.ts
import { Module } from '@nestjs/common'
import { PrismaService } from '@shared/infrastructure/prisma/prisma-service'
import { MiContextoController } from './presentation/rest/mi-contexto.controller'
import { MiContextoRepository } from './infrastructure/persistence/prisma-mi-contexto.repository'
import { CrearMiEntidadUseCase } from './application/use-cases/crear-mi-entidad.use-case'

@Module({
  controllers: [MiContextoController],
  providers: [
    CrearMiEntidadUseCase,
    { provide: 'IMiContextoRepository', useClass: MiContextoRepository },
    PrismaService,
  ],
  exports: [],
})
export class MiContextoModule {}
```

---

## Paso 3: Definir Aggregate Root

```ts
// domain/entities/mi-entidad.entity.ts
import { Entity } from '@shared/domain/entity'
import { MiEntidadId } from '../value-objects/mi-entidad-id.value-object'

export class MiEntidad extends Entity<MiEntidadId> {
  private constructor(
    id: MiEntidadId,
    private name: string,
    private status: MiEntidadStatus,
  ) {
    super(id)
  }

  static create(id: MiEntidadId, name: string): MiEntidad {
    return new MiEntidad(id, name, MiEntidadStatus.ACTIVE)
  }

  activate(): void {
    if (this.status === MiEntidadStatus.ACTIVE) return
    this.status = MiEntidadStatus.ACTIVE
  }

  deactivate(): void {
    if (this.status === MiEntidadStatus.INACTIVE) return
    this.status = MiEntidadStatus.INACTIVE
  }
}
```

---

## Paso 4: Definir Value Objects

```ts
// domain/value-objects/mi-entidad-id.value-object.ts
import { ValueObject } from '@shared/domain/value-object'

export class MiEntidadId extends ValueObject {
  constructor(readonly value: string) {
    super()
    if (!value) throw new Error('MiEntidadId no puede estar vacío')
  }
}
```

---

## Paso 5: Definir interfaz de repositorio

```ts
// domain/repositories/mi-entidad.repository.interface.ts
import { MiEntidad } from '../entities/mi-entidad.entity'
import { MiEntidadId } from '../value-objects/mi-entidad-id.value-object'

export interface IMiEntidadRepository {
  findById(id: MiEntidadId): Promise<MiEntidad | null>
  findActive(): Promise<MiEntidad[]>
  save(entity: MiEntidad): Promise<void>
  delete(id: MiEntidadId): Promise<void>
}
```

---

## Paso 6: Implementar el caso de uso

```ts
// application/use-cases/crear-mi-entidad.use-case.ts
import { Injectable } from '@nestjs/common'
import { IMiEntidadRepository } from '../domain/repositories/mi-entidad.repository.interface'
import { MiEntidad } from '../domain/entities/mi-entidad.entity'
import { MiEntidadId } from '../domain/value-objects/mi-entidad-id.value-object'
import { CrearMiEntidadDto } from '../dto/crear-mi-entidad.dto'

@Injectable()
export class CrearMiEntidadUseCase {
  constructor(
    private readonly repository: IMiEntidadRepository,
  ) {}

  async execute(dto: CrearMiEntidadDto): Promise<void> {
    const id = new MiEntidadId(dto.id)
    const entity = MiEntidad.create(id, dto.name)
    await this.repository.save(entity)
  }
}
```

---

## Paso 7: Implementar el repositorio

```ts
// infrastructure/persistence/prisma-mi-contexto.repository.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared/infrastructure/prisma/prisma-service'
import { IMiEntidadRepository } from '../../domain/repositories/mi-entidad.repository.interface'
import { MiEntidad } from '../../domain/entities/mi-entidad.entity'
import { MiEntidadId } from '../../domain/value-objects/mi-entidad-id.value-object'

@Injectable()
export class MiContextoRepository implements IMiEntidadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: MiEntidadId): Promise<MiEntidad | null> {
    const record = await this.prisma.miEntidad.findUnique({
      where: { id: id.value },
    })
    return record ? this.toDomain(record) : null
  }

  async findActive(): Promise<MiEntidad[]> {
    const records = await this.prisma.miEntidad.findMany({
      where: { status: 'ACTIVE' },
    })
    return records.map((r) => this.toDomain(r))
  }

  async save(entity: MiEntidad): Promise<void> {
    await this.prisma.miEntidad.upsert({
      where: { id: entity.id.value },
      create: { id: entity.id.value, name: entity.name },
      update: { name: entity.name },
    })
  }

  async delete(id: MiEntidadId): Promise<void> {
    await this.prisma.miEntidad.delete({ where: { id: id.value } })
  }

  private toDomain(record: any): MiEntidad {
    return MiEntidad.create(new MiEntidadId(record.id), record.name)
  }
}
```

---

## Paso 8: Crear el controller

```ts
// presentation/rest/mi-contexto.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { CrearMiEntidadUseCase } from '../../application/use-cases/crear-mi-entidad.use-case'
import { CrearMiEntidadDto } from '../../application/dto/crear-mi-entidad.dto'

@Controller('mi-contexto')
export class MiContextoController {
  constructor(
    private readonly crearMiEntidadUseCase: CrearMiEntidadUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CrearMiEntidadDto): Promise<void> {
    await this.crearMiEntidadUseCase.execute(dto)
  }
}
```

---

## Paso 9: Escribir tests

```ts
// __tests__/unit/domain/mi-entidad.test.ts
describe('MiEntidad', () => {
  it('should create with active status', () => {
    const entity = MiEntidad.create(new MiEntidadId('test'), 'Test')
    expect(entity.status).toBe(MiEntidadStatus.ACTIVE)
  })

  it('should deactivate', () => {
    const entity = MiEntidad.create(new MiEntidadId('test'), 'Test')
    entity.deactivate()
    expect(entity.status).toBe(MiEntidadStatus.INACTIVE)
  })
})
```

```ts
// __tests__/unit/application/crear-mi-entidad.test.ts
describe('CrearMiEntidadUseCase', () => {
  it('should create entity', async () => {
    const repository = mock<IMiEntidadRepository>()
    const useCase = new CrearMiEntidadUseCase(repository)
    await useCase.execute({ id: 'test', name: 'Test' })
    expect(repository.save).toHaveBeenCalled()
  })
})
```

---

## Checklist de creación de un nuevo Bounded Context

- [ ] `001-system-architecture.md` actualizado (matriz de dependencias + diagrama)
- [ ] `016-ownership-matrix.md` actualizado (nuevas entidades con dueño)
- [ ] Archivo `.module.ts` creado
- [ ] Aggregate Root definido en `domain/entities/`
- [ ] Value Objects creados en `domain/value-objects/`
- [ ] Domain Events creados (al menos uno)
- [ ] Interfaz de repositorio en `domain/repositories/`
- [ ] Caso de uso en `application/use-cases/`
- [ ] DTOs en `application/dto/`
- [ ] Puertos en `application/ports/` (si aplica)
- [ ] Implementación del repositorio en `infrastructure/persistence/`
- [ ] Controller en `presentation/rest/`
- [ ] Validators en `presentation/rest/validators/`
- [ ] Tests unitarios de dominio
- [ ] Tests de aplicación (con repositorio mockeado)
- [ ] Tests de integración (con Prisma real)
- [ ] ADR si la decisión arquitectónica es significativa
