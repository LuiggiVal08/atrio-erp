import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';
import type { PrismaService } from '@/infrastructure/database/prisma.service';

function makePrisma() {
  return {
    reorderPoint: { findMany: jest.fn() },
    stock: { findUnique: jest.fn() },
  } as unknown as PrismaService;
}

describe('PrismaInventoryRepository.findLowStock', () => {
  it('includes stock exactly at the reorder threshold', async () => {
    const prisma = makePrisma();
    (prisma.reorderPoint.findMany as jest.Mock).mockResolvedValue([
      {
        productId: 'p1', warehouseId: 'w1', minQuantity: 5, maxQuantity: 10,
        product: { name: 'Cemento', sku: 'CEM-001' }, warehouse: { name: 'Central' },
      },
    ]);
    (prisma.stock.findUnique as jest.Mock).mockResolvedValue({ quantity: 5 });
    const repository = new PrismaInventoryRepository(prisma);

    const result = await repository.findLowStock('tenant-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ currentQuantity: 5, minQuantity: 5, suggestedQuantity: 5 });
  });

  it('enriches shortages with product, warehouse and suggested quantity', async () => {
    const prisma = makePrisma();
    (prisma.reorderPoint.findMany as jest.Mock).mockResolvedValue([
      {
        productId: 'p2', warehouseId: 'w1', minQuantity: 5, maxQuantity: 12,
        product: { name: 'Tubo PVC', sku: 'PVC-001' }, warehouse: { name: 'Central' },
      },
      {
        productId: 'p1', warehouseId: 'w1', minQuantity: 3, maxQuantity: 8,
        product: { name: 'Cemento', sku: 'CEM-001' }, warehouse: { name: 'Central' },
      },
    ]);
    (prisma.stock.findUnique as jest.Mock)
      .mockResolvedValueOnce({ quantity: 2 })
      .mockResolvedValueOnce(null);
    const repository = new PrismaInventoryRepository(prisma);

    const result = await repository.findLowStock('tenant-1');

    expect(prisma.reorderPoint.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-1', isActive: true },
    }));
    expect(result.map((row) => row.productName)).toEqual(['Cemento', 'Tubo PVC']);
    expect(result[1]).toMatchObject({
      currentQuantity: 2,
      minQuantity: 5,
      maxQuantity: 12,
      suggestedQuantity: 10,
      productSku: 'PVC-001',
      warehouseName: 'Central',
    });
  });
});
