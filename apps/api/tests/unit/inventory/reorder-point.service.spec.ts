import { ReorderPointService } from '../../../src/modules/inventory/application/reorder-point.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('ReorderPointService', () => {
  const point = { id: 'rp-1', tenantId: 't1', productId: 'prod-1', warehouseId: 'wh-1', minQuantity: 5, maxQuantity: 20, isActive: true };
  const repo = {
    findProductById: jest.fn(), findWarehouseById: jest.fn(), setReorderPoint: jest.fn(),
    findReorderPointsByTenant: jest.fn(), findReorderPoint: jest.fn(), findReorderPointById: jest.fn(),
    updateReorderPoint: jest.fn(), deleteReorderPoint: jest.fn(), findLowStock: jest.fn(),
  };
  const service = new ReorderPointService(repo as unknown as InventoryRepository);

  beforeEach(() => {
    jest.resetAllMocks();
    repo.findProductById.mockResolvedValue({ id: 'prod-1', tenantId: 't1', isActive: true, isService: false });
    repo.findWarehouseById.mockResolvedValue({ id: 'wh-1', tenantId: 't1', isActive: true });
    repo.findReorderPointById.mockResolvedValue(point);
    repo.findReorderPoint.mockResolvedValue(point);
    repo.setReorderPoint.mockResolvedValue(point);
  });

  it('sets a reorder point for active resources in its tenant', async () => {
    const dto = { tenantId: 't1', productId: 'prod-1', warehouseId: 'wh-1', minQuantity: 5, maxQuantity: 20 };
    expect(await service.set(dto)).toMatchObject({ minQuantity: 5 });
    expect(repo.setReorderPoint).toHaveBeenCalledWith(dto);
  });

  it.each([[20, 5], [5, 5], [5, NaN]])('rejects invalid maximum %s/%s', async (minQuantity, maxQuantity) => {
    await expect(service.set({ ...point, minQuantity, maxQuantity })).rejects.toThrow('Maximum quantity must be greater than minimum');
  });

  it.each([-1, Infinity, NaN])('rejects invalid minimum %s', async (minQuantity) => {
    await expect(service.set({ ...point, minQuantity })).rejects.toThrow('Minimum quantity must be >= 0');
  });

  it('does not create a point for another tenant warehouse', async () => {
    repo.findWarehouseById.mockResolvedValue({ tenantId: 'other', isActive: true });
    await expect(service.set(point)).rejects.toThrow('Active stock resources not found');
    expect(repo.setReorderPoint).not.toHaveBeenCalled();
  });

  it('lists tenant reorder points', async () => {
    repo.findReorderPointsByTenant.mockResolvedValue([point]);
    expect(await service.findAll('t1')).toEqual([point]);
    expect(repo.findReorderPointsByTenant).toHaveBeenCalledWith('t1');
  });

  it('finds a point by product and warehouse', async () => {
    expect(await service.findOne('t1', 'prod-1', 'wh-1')).toEqual(point);
  });

  it('rejects missing and foreign points', async () => {
    repo.findReorderPoint.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...point, tenantId: 'other' });
    await expect(service.findOne('t1', 'prod-1', 'wh-1')).rejects.toThrow('Reorder point not found');
    await expect(service.findOne('t1', 'prod-1', 'wh-1')).rejects.toThrow('Reorder point not found');
  });

  it('updates within tenant scope', async () => {
    const data = { minQuantity: 10, maxQuantity: 30 };
    repo.updateReorderPoint.mockResolvedValue({ ...point, ...data });
    expect(await service.update('t1', point.id, data)).toMatchObject(data);
    expect(repo.updateReorderPoint).toHaveBeenCalledWith(point.id, data, 't1');
  });

  it.each([{ minQuantity: 25 }, { maxQuantity: 3 }])('validates partial updates against the stored range', async (data) => {
    await expect(service.update('t1', point.id, data)).rejects.toThrow('Maximum quantity must be greater than minimum');
    expect(repo.updateReorderPoint).not.toHaveBeenCalled();
  });

  it('rejects update and delete outside tenant scope', async () => {
    repo.findReorderPointById.mockResolvedValue(null);
    await expect(service.update('other', point.id, { minQuantity: 1 })).rejects.toThrow('Reorder point not found');
    await expect(service.delete('other', point.id)).rejects.toThrow('Reorder point not found');
    expect(repo.updateReorderPoint).not.toHaveBeenCalled();
    expect(repo.deleteReorderPoint).not.toHaveBeenCalled();
  });

  it('deletes only within tenant scope', async () => {
    await service.delete('t1', point.id);
    expect(repo.deleteReorderPoint).toHaveBeenCalledWith(point.id, 't1');
  });

  it('returns low stock quantities', async () => {
    repo.findLowStock.mockResolvedValue([{ productId: 'prod-1', warehouseId: 'wh-1', currentQuantity: 3, minQuantity: 5 }]);
    expect(await service.findLowStock('t1')).toEqual([expect.objectContaining({ currentQuantity: 3 })]);
  });
});
