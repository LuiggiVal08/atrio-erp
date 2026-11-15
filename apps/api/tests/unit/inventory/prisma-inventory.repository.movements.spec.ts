import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';
import { StockMovementQueryDto } from '../../../src/modules/inventory/infrastructure/dto/inventory.dto';

function setup() {
  const prisma = {
    product: { findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: 'Tubo', sku: 'TUB-01' }, { id: 'archived', name: 'Producto histórico', sku: 'OLD' }]) },
    warehouse: { findMany: jest.fn().mockResolvedValue([{ id: 'w1', name: 'Centro', code: 'CEN', branchId: 'b1' }, { id: 'w2', name: 'Este', code: 'EST', branchId: 'b2' }]) },
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'u1', name: 'Operador' }]) },
    stockMovement: {
      findMany: jest.fn().mockResolvedValue([{ id: 'm501', productId: 'archived', warehouseId: 'w1', userId: 'u1', type: 'in', quantity: 0.125 }]),
      count: jest.fn().mockResolvedValue(650),
    },
    $transaction: jest.fn().mockImplementation(async queries => Promise.all(queries)),
  };
  return { repo: new PrismaInventoryRepository(prisma as any), prisma };
}

describe('server-side movement history', () => {
  it('paginates beyond 500 and retains names for inactive or deleted product identities', async () => {
    const { repo, prisma } = setup();
    const result = await repo.findAllMovements('t1', { page: 21, pageSize: 25 });
    expect(result).toMatchObject({ total: 650, page: 21, pageSize: 25, items: [{ id: 'm501', product: { name: 'Producto histórico' }, userName: 'Operador' }] });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1' } }));
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 500, take: 25, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }));
    const filter = prisma.stockMovement.findMany.mock.calls[0][0].where;
    expect(filter).toMatchObject({ productId: { in: ['p1', 'archived'] }, warehouseId: { in: ['w1', 'w2'] } });
    expect(prisma.stockMovement.count).toHaveBeenCalledWith({ where: filter });
  });

  it('applies branch, product and inclusive calendar-day filters before pagination', async () => {
    const { repo, prisma } = setup();
    await repo.findAllMovements('t1', { branchId: 'b1', productId: 'p1', dateFrom: '2026-11-01', dateTo: '2026-11-14' });
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      productId: { in: ['p1'] }, warehouseId: { in: ['w1'] },
      createdAt: { gte: new Date('2026-11-01T00:00:00.000Z'), lte: new Date('2026-11-14T23:59:59.999Z') },
    }) }));
  });

  it('does not widen the scope when branch or warehouse filters are foreign', async () => {
    const { repo, prisma } = setup();
    await repo.findAllMovements('t1', { branchId: 'foreign' });
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ warehouseId: { in: [] } }) }));
  });

  it.each([{ page: 0 }, { page: 1.5 }, { pageSize: 501 }, { dateFrom: 'bad' }, { dateFrom: '2026-11-14', dateTo: '2026-11-01' }])('rejects invalid filters before querying: %p', async filter => {
    const { repo, prisma } = setup();
    await expect(repo.findAllMovements('t1', filter)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.stockMovement.findMany).not.toHaveBeenCalled();
  });
});

describe('movement query boundary', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const parse = (value: unknown) => pipe.transform(value, { type: 'query', metatype: StockMovementQueryDto });

  it('coerces pagination while preserving branch and calendar-day filters', async () => {
    await expect(parse({ page: '21', pageSize: '25', branchId: '550e8400-e29b-41d4-a716-446655440000', dateFrom: '2026-11-01', dateTo: '2026-11-14' })).resolves.toMatchObject({ page: 21, pageSize: 25, dateFrom: '2026-11-01', dateTo: '2026-11-14' });
  });

  it.each([{ page: 'NaN' }, { page: '0' }, { type: 'adjust' }, { branchId: 'bad' }, { dateFrom: '2026-02-30' }, { from: '2026-11-01' }])('rejects malformed or unsupported filters: %p', async value => {
    await expect(parse(value)).rejects.toBeInstanceOf(BadRequestException);
  });
});
