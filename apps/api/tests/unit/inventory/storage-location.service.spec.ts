import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { StorageLocationService } from '../../../src/modules/inventory/application/storage-location.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';
import { StorageLocation } from '../../../src/modules/inventory/domain/storage-location.entity';

function makeLocation(overrides: Partial<StorageLocation> = {}): StorageLocation {
  return new StorageLocation(
    overrides.id ?? 'loc-1',
    overrides.tenantId ?? 'tenant-1',
    overrides.warehouseId ?? 'wh-1',
    overrides.parentId ?? null,
    overrides.type ?? 'AISLE',
    overrides.code ?? 'A',
    overrides.name ?? null,
    overrides.path ?? 'A',
    overrides.isActive ?? true,
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
  );
}

describe('StorageLocationService', () => {
  let service: StorageLocationService;
  const mockRepo = {
    findWarehouseById: jest.fn(),
    findStorageLocationsByWarehouse: jest.fn(),
    findStorageLocationById: jest.fn(),
    findStorageLocationByPath: jest.fn(),
    findStorageLocationSiblings: jest.fn(),
    createStorageLocation: jest.fn(),
    updateStorageLocation: jest.fn(),
    findStorageLocationChildren: jest.fn(),
    softDeleteStorageLocation: jest.fn(),
    rewriteStorageLocation: jest.fn(),
    generateStorageLocations: jest.fn(),
  } as unknown as InventoryRepository;

  beforeEach(() => {
    service = new StorageLocationService(mockRepo);
    jest.clearAllMocks();
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue({ id: 'wh-1', tenantId: 'tenant-1' });
  });

  it('lists locations after verifying the warehouse tenant', async () => {
    (mockRepo.findStorageLocationsByWarehouse as jest.Mock).mockResolvedValue([makeLocation()]);
    const result = await service.list('tenant-1', 'wh-1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findStorageLocationsByWarehouse).toHaveBeenCalledWith('wh-1');
  });

  it('rejects listing for a warehouse of another tenant', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue({ id: 'wh-1', tenantId: 'tenant-2' });
    await expect(service.list('tenant-1', 'wh-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a root aisle with an explicit code', async () => {
    (mockRepo.findStorageLocationByPath as jest.Mock).mockResolvedValue(null);
    (mockRepo.createStorageLocation as jest.Mock).mockResolvedValue(makeLocation());
    await service.create('tenant-1', 'wh-1', { type: 'AISLE', code: ' A ' });
    expect(mockRepo.createStorageLocation).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', warehouseId: 'wh-1', type: 'AISLE', code: 'A', path: 'A' }),
    );
  });

  it('auto-generates the next root aisle code', async () => {
    (mockRepo.findStorageLocationSiblings as jest.Mock).mockResolvedValue([
      makeLocation({ id: 'loc-1', code: 'A', path: 'A' }),
      makeLocation({ id: 'loc-2', code: 'B', path: 'B' }),
    ]);
    (mockRepo.findStorageLocationByPath as jest.Mock).mockResolvedValue(null);
    (mockRepo.createStorageLocation as jest.Mock).mockImplementation((data) => ({ ...makeLocation(), ...data }));

    await service.create('tenant-1', 'wh-1', { type: 'AISLE' });

    expect(mockRepo.findStorageLocationSiblings).toHaveBeenCalledWith('wh-1', null);
    expect(mockRepo.createStorageLocation).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'AISLE', code: 'C', path: 'C' }),
    );
  });

  it('auto-generates the next shelf code under an aisle', async () => {
    const aisle = makeLocation({ id: 'loc-1', type: 'AISLE', code: 'A', path: 'A' });
    (mockRepo.findStorageLocationById as jest.Mock).mockResolvedValue(aisle);
    (mockRepo.findStorageLocationSiblings as jest.Mock).mockResolvedValue([
      makeLocation({ id: 'loc-2', parentId: 'loc-1', type: 'SHELF', code: '1', path: 'A/1' }),
      makeLocation({ id: 'loc-3', parentId: 'loc-1', type: 'SHELF', code: '2', path: 'A/2' }),
    ]);
    (mockRepo.findStorageLocationByPath as jest.Mock).mockResolvedValue(null);
    (mockRepo.createStorageLocation as jest.Mock).mockImplementation((data) => ({ ...makeLocation(), ...data }));

    await service.create('tenant-1', 'wh-1', { type: 'SHELF', parentId: 'loc-1' });

    expect(mockRepo.findStorageLocationSiblings).toHaveBeenCalledWith('wh-1', 'loc-1');
    expect(mockRepo.createStorageLocation).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SHELF', code: '3', path: 'A/3' }),
    );
  });

  it('rejects a bin whose parent is not a level', async () => {
    const aisle = makeLocation();
    (mockRepo.findStorageLocationById as jest.Mock).mockResolvedValue(aisle);
    await expect(
      service.create('tenant-1', 'wh-1', { type: 'BIN', code: '01', parentId: 'loc-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a duplicate path in the same branch', async () => {
    (mockRepo.findStorageLocationByPath as jest.Mock).mockResolvedValue(makeLocation());
    await expect(service.create('tenant-1', 'wh-1', { type: 'AISLE', code: 'A' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('delegates renaming and descendant paths to one scoped atomic operation', async () => {
    (mockRepo.findStorageLocationById as jest.Mock).mockResolvedValue(makeLocation());
    (mockRepo.rewriteStorageLocation as jest.Mock).mockResolvedValue(makeLocation({ code: 'B', path: 'B' }));

    const result = await service.update('tenant-1', 'loc-1', { code: 'B' });

    expect(result.path).toBe('B');
    expect(mockRepo.rewriteStorageLocation).toHaveBeenCalledWith('loc-1', 'tenant-1', { code: 'B' });
    expect(mockRepo.updateStorageLocation).not.toHaveBeenCalled();
  });

  it('blocks deactivation when active children exist', async () => {
    (mockRepo.findStorageLocationById as jest.Mock).mockResolvedValue(makeLocation());
    (mockRepo.findStorageLocationChildren as jest.Mock).mockResolvedValue([makeLocation({ id: 'loc-2', isActive: true })]);
    await expect(service.softDelete('tenant-1', 'loc-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mockRepo.softDeleteStorageLocation).not.toHaveBeenCalled();
  });

  it('delegates validated counts to the atomic generator', async () => {
    (mockRepo.generateStorageLocations as jest.Mock).mockResolvedValue({ created: 3, total: 4 });
    const counts = { aisles: 1, shelves: 1, levels: 1, bins: 1 };

    const result = await service.generate('tenant-1', 'wh-1', counts);

    expect(result).toEqual({ created: 3, total: 4 });
    expect(mockRepo.generateStorageLocations).toHaveBeenCalledWith('tenant-1', 'wh-1', counts);
    expect(mockRepo.createStorageLocation).not.toHaveBeenCalled();
  });

  it('rejects a generation that exceeds the location limit', async () => {
    await expect(
      service.generate('tenant-1', 'wh-1', { aisles: 20, shelves: 50, levels: 20, bins: 50 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockRepo.createStorageLocation).not.toHaveBeenCalled();
  });

  it('rejects a generation with a zero count', async () => {
    await expect(
      service.generate('tenant-1', 'wh-1', { aisles: 1, shelves: 0, levels: 1, bins: 1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
