import { InventorySummaryService } from '@/modules/inventory/application/inventory-summary.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function product(overrides: Record<string, any> = {}) {
  return {
    id: 'p1',
    categoryId: 'cat-1',
    costPrice: 10,
    minStock: 5,
    maxStock: 100,
    reorderPoint: 0,
    category: { name: 'Tools' },
    stock: [{ quantity: 50 }],
    ...overrides,
  };
}

function soldLine(productId: string, quantity: number) {
  return { productId, _sum: { quantity } };
}

describe('InventorySummaryService', () => {
  let prisma: any;
  let service: InventorySummaryService;

  beforeEach(() => {
    prisma = {
      tenant: { findUniqueOrThrow: jest.fn().mockResolvedValue({ baseCurrency: 'VED' }) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      documentLine: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    service = new InventorySummaryService(prisma);
  });

  it('scopes every query to the tenant and excludes services, inactive and deleted products', async () => {
    const before = Date.now();
    await service.getSummary('tenant-1');

    expect(prisma.tenant.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      select: { baseCurrency: true },
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: 'tenant-1',
        deletedAt: null,
        isActive: true,
        isService: false,
      }),
    }));
    const productQuery = prisma.product.findMany.mock.calls[0][0];
    expect(productQuery.select.stock.where).toEqual({ warehouse: { tenantId: 'tenant-1' } });

    const salesQuery = prisma.documentLine.groupBy.mock.calls[0][0];
    expect(salesQuery.by).toEqual(['productId']);
    expect(salesQuery._sum).toEqual({ quantity: true });
    expect(salesQuery.where.document).toEqual(expect.objectContaining({
      tenantId: 'tenant-1',
      deletedAt: null,
      documentType: 'sales_invoice',
      status: { in: ['approved', 'paid'] },
    }));
    const { gte, lte } = salesQuery.where.document.approvedAt;
    expect(lte.getTime() - gte.getTime()).toBe(30 * DAY_MS);
    expect(Math.abs(lte.getTime() - before)).toBeLessThan(5000);
  });

  it('classifies each product into exactly one stock health bucket', async () => {
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'healthy', stock: [{ quantity: 40 }, { quantity: 20 }] }),
      product({ id: 'low-exact-min', stock: [{ quantity: 5 }] }),
      product({ id: 'low-reorder', minStock: 0, reorderPoint: 10, stock: [{ quantity: 8 }] }),
      product({ id: 'out-zero', stock: [{ quantity: 0 }] }),
      product({ id: 'out-negative', stock: [{ quantity: -3 }] }),
      product({ id: 'out-missing', stock: [] }),
      product({ id: 'over', stock: [{ quantity: 101 }] }),
      product({ id: 'no-max', maxStock: null, stock: [{ quantity: 9999 }] }),
    ]);

    const result = await service.getSummary('tenant-1');

    expect(result.totalProducts).toBe(8);
    expect(result.stockHealth).toEqual({ healthy: 2, low: 2, out: 3, overstock: 1 });
  });

  it('values stock at cost grouped by category id, sorted descending, with tenant currency', async () => {
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'a', categoryId: 'cat-1', category: { name: 'Tools' }, costPrice: 10.556, stock: [{ quantity: 3 }] }),
      product({ id: 'b', categoryId: 'cat-2', category: { name: 'Tools' }, costPrice: 100, stock: [{ quantity: 2 }] }),
      product({ id: 'c', categoryId: null, category: null, costPrice: 7.25, stock: [{ quantity: 4 }] }),
      product({ id: 'd', categoryId: 'cat-1', category: { name: 'Tools' }, costPrice: 50, stock: [{ quantity: -5 }] }),
    ]);

    const result = await service.getSummary('tenant-1');

    expect(result.valuation.currency).toBe('VED');
    expect(result.valuation.totalValue).toBe(260.67);
    expect(result.valuation.categories).toEqual([
      { categoryId: 'cat-2', name: 'Tools', value: 200 },
      { categoryId: 'cat-1', name: 'Tools', value: 31.67 },
      { categoryId: null, name: null, value: 29 },
    ]);
  });

  it('computes per-product days of cover, median and buckets from 30-day sales', async () => {
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'a', stock: [{ quantity: 30 }] }),
      product({ id: 'b', stock: [{ quantity: 7 }] }),
      product({ id: 'c', stock: [{ quantity: 210 }] }),
      product({ id: 'd', stock: [{ quantity: 6 }] }),
      product({ id: 'e', stock: [{ quantity: 90 }] }),
      product({ id: 'no-sales', stock: [{ quantity: 500 }] }),
    ]);
    prisma.documentLine.groupBy.mockResolvedValue([
      soldLine('a', 30),
      soldLine('b', 10),
      soldLine('c', 30),
      soldLine('d', 30),
      soldLine('e', 30),
    ]);

    const result = await service.getSummary('tenant-1');

    expect(result.coverage.periodDays).toBe(30);
    expect(result.coverage.medianDays).toBe(30);
    expect(result.coverage.under7).toBe(1);
    expect(result.coverage.from7to30).toBe(2);
    expect(result.coverage.over30).toBe(2);
    expect(result.coverage.noSales).toBe(1);
  });

  it('averages the two middle values for an even number of coverage samples', async () => {
    prisma.product.findMany.mockResolvedValue([
      product({ id: 'a', stock: [{ quantity: 10 }] }),
      product({ id: 'b', stock: [{ quantity: 20 }] }),
    ]);
    prisma.documentLine.groupBy.mockResolvedValue([soldLine('a', 30), soldLine('b', 30)]);

    const result = await service.getSummary('tenant-1');

    expect(result.coverage.medianDays).toBe(15);
  });

  it('returns null median and zeroed metrics for an empty inventory', async () => {
    const result = await service.getSummary('tenant-1');

    expect(result).toEqual({
      totalProducts: 0,
      stockHealth: { healthy: 0, low: 0, out: 0, overstock: 0 },
      valuation: { currency: 'VED', totalValue: 0, categories: [] },
      coverage: { periodDays: 30, medianDays: null, under7: 0, from7to30: 0, over30: 0, noSales: 0 },
    });
  });

  it('treats sold-out products as zero days of cover', async () => {
    prisma.product.findMany.mockResolvedValue([product({ id: 'a', stock: [] })]);
    prisma.documentLine.groupBy.mockResolvedValue([soldLine('a', 12)]);

    const result = await service.getSummary('tenant-1');

    expect(result.coverage.medianDays).toBe(0);
    expect(result.coverage.under7).toBe(1);
    expect(result.coverage.noSales).toBe(0);
  });
});
