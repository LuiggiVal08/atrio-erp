import { BadRequestException, ConflictException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';
import { StorageLocation, StorageLocationType } from '../domain/storage-location.entity';

export interface GenerateStorageLocationsInput {
  aisles: number;
  shelves: number;
  levels: number;
  bins: number;
}

const MAX_GENERATED_LOCATIONS = 5000;

@Injectable()
export class StorageLocationService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async list(tenantId: string, warehouseId: string) {
    await this.ensureWarehouse(tenantId, warehouseId);
    return this.repo.findStorageLocationsByWarehouse(warehouseId);
  }

  async create(
    tenantId: string,
    warehouseId: string,
    data: { parentId?: string | null; type: StorageLocationType; code?: string; name?: string },
  ) {
    await this.ensureWarehouse(tenantId, warehouseId);

    let parent: StorageLocation | null = null;
    if (data.parentId) {
      parent = await this.repo.findStorageLocationById(data.parentId);
      if (!parent || parent.tenantId !== tenantId || parent.warehouseId !== warehouseId || !parent.isActive) {
        throw new BadRequestException('La ubicación padre no pertenece a este almacén');
      }
    }

    try {
      StorageLocation.assertValidParent(data.type, parent?.type ?? null);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const parentId = parent?.id ?? null;
    const code = data.code?.trim() || (await this.nextCode(warehouseId, parentId, data.type));
    const path = StorageLocation.buildPath(parent?.path ?? null, code);

    const existing = await this.repo.findStorageLocationByPath(warehouseId, path);
    if (existing) {
      throw new ConflictException('Ya existe una ubicación con ese código en esta rama');
    }

    return this.repo.createStorageLocation({
      tenantId,
      warehouseId,
      parentId,
      type: data.type,
      code,
      name: data.name ?? null,
      path,
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { code?: string; name?: string | null; isActive?: boolean },
  ) {
    const location = await this.repo.findStorageLocationById(id);
    if (!location || location.tenantId !== tenantId) {
      throw new NotFoundException('Storage location not found');
    }

    if (!tenantId) throw new BadRequestException('Tenant context is required');
    if (data.isActive === false) {
      const children = await this.repo.findStorageLocationChildren(id);
      if (children.some(child => child.isActive)) throw new BadRequestException('No se puede desactivar una ubicación con hijos activos');
    }
    try { return await this.repo.rewriteStorageLocation(id, tenantId, data); } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Ya existe una ubicación con ese código en esta rama');
      throw error;
    }
  }

  async softDelete(tenantId: string, id: string) {
    const location = await this.repo.findStorageLocationById(id);
    if (!location || location.tenantId !== tenantId) {
      throw new NotFoundException('Storage location not found');
    }
    const children = await this.repo.findStorageLocationChildren(id);
    if (children.some((child) => child.isActive)) {
      throw new BadRequestException('No se puede desactivar una ubicación con hijos activos');
    }
    await this.repo.rewriteStorageLocation(id, tenantId, { isActive: false });
  }

  async generate(tenantId: string, warehouseId: string, input: GenerateStorageLocationsInput) {
    await this.ensureWarehouse(tenantId, warehouseId);

    const counts = [input.aisles, input.shelves, input.levels, input.bins];
    if (!counts.every((count) => Number.isSafeInteger(count) && count > 0)) {
      throw new BadRequestException('Debes indicar al menos un pasillo, estante, nivel y bin');
    }

    const shelves = input.aisles * input.shelves;
    const levels = shelves * input.levels;
    const planned = input.aisles + shelves + levels + levels * input.bins;
    if (planned > MAX_GENERATED_LOCATIONS) {
      throw new BadRequestException(
        `No se pueden generar más de ${MAX_GENERATED_LOCATIONS} ubicaciones a la vez`,
      );
    }

    return this.repo.generateStorageLocations(tenantId, warehouseId, input);
  }

  private async nextCode(
    warehouseId: string,
    parentId: string | null,
    type: StorageLocationType,
  ): Promise<string> {
    const siblings = await this.repo.findStorageLocationSiblings(warehouseId, parentId);
    return StorageLocation.nextCode(type, siblings.map((sibling) => sibling.code));
  }

  private async ensureWarehouse(tenantId: string, warehouseId: string): Promise<void> {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    const warehouse = await this.repo.findWarehouseById(warehouseId);
    if (!warehouse || warehouse.tenantId !== tenantId) {
      throw new NotFoundException('Warehouse not found');
    }
  }
}
