import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';

const input = { tenantId: 't1', productId: 'p1', warehouseId: 'w1', type: 'out' as const, quantity: 3, userId: 'u1', operationId: 'op1' };
function setup(committed = 0) {
  let quantity = 5;
  const movements: any[] = [];
  const tx: any = {
    product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't1', isActive: true }) },
    warehouse: { findFirst: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1', isActive: true, branchId: null }) },
    stock: {
      upsert: jest.fn().mockImplementation(async () => ({ id: 's1', quantity })),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        if (typeof where.quantity === 'number' && quantity !== where.quantity) return { count: 0 };
        if (where.quantity?.gte && quantity < where.quantity.gte) return { count: 0 };
        quantity += data.quantity.increment;
        return { count: 1 };
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(async () => ({ id: 's1', productId: 'p1', warehouseId: 'w1', quantity, committedQuantity: committed, createdAt: new Date(), updatedAt: new Date() })),
    },
    stockLot: {
      findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }), upsert: jest.fn().mockResolvedValue({ id: 'lot1', tenantId: 't1' }),
    },
    stockMovement: {
      findUnique: jest.fn().mockImplementation(async ({ where }) => movements.find(m => m.operationKey === where.operationKey) ?? null),
      create: jest.fn().mockImplementation(async ({ data }) => { const movement = { id: 'm1', ...data }; movements.push(movement); return movement; }),
    },
  };
  const prisma: any = { ...tx, $transaction: jest.fn().mockImplementation(async (fn) => {
    const before = quantity; const length = movements.length;
    try { return await fn(tx); } catch (error) { quantity = before; movements.splice(length); throw error; }
  }) };
  return { tx, prisma, repo: new PrismaInventoryRepository(prisma), balance: () => quantity, movements };
}

describe('atomic inventory adjustments', () => {
  it('commits a conditional decrement and auditable movement in one transaction', async () => {
    const { repo, prisma, tx, balance, movements } = setup();
    await repo.adjustStockAtomic(input);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tx.stock.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ quantity: { gte: 3 } }) }));
    expect(balance()).toBe(2);
    expect(movements[0]).toMatchObject({ userId: 'u1', balanceBefore: 5, balanceAfter: 2, quantity: 3 });
  });

  it('replays one operation without applying it twice', async () => {
    const { repo, balance, movements } = setup();
    await repo.adjustStockAtomic(input);
    await repo.adjustStockAtomic(input);
    expect(balance()).toBe(2); expect(movements).toHaveLength(1);
  });

  it('rejects reusing an operation ID with different effect', async () => {
    const { repo, balance } = setup();
    await repo.adjustStockAtomic(input);
    await expect(repo.adjustStockAtomic({ ...input, quantity: 1 })).rejects.toBeInstanceOf(ConflictException);
    expect(balance()).toBe(2);
  });

  it('rolls back balance when movement persistence fails', async () => {
    const { repo, tx, balance } = setup();
    tx.stockMovement.create.mockRejectedValue(new Error('movement failed'));
    await expect(repo.adjustStockAtomic(input)).rejects.toThrow('movement failed');
    expect(balance()).toBe(5);
  });

  it('rejects a stale physical count before creating a movement', async () => {
    const { repo, balance, movements } = setup();
    await expect(repo.adjustStockAtomic({ ...input, expectedQuantity: 4 })).rejects.toBeInstanceOf(ConflictException);
    expect(balance()).toBe(5); expect(movements).toHaveLength(0);
  });

  it('rejects a second outgoing adjustment instead of overselling', async () => {
    const { repo, balance } = setup();
    await repo.adjustStockAtomic(input);
    await expect(repo.adjustStockAtomic({ ...input, operationId: 'op2' })).rejects.toBeInstanceOf(BadRequestException);
    expect(balance()).toBe(2);
  });

  it('protects committed stock from outgoing adjustments', async () => {
    const { repo, balance } = setup(3);
    await expect(repo.adjustStockAtomic(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(balance()).toBe(5);
  });

  it('allows an outgoing adjustment that leaves committed stock covered', async () => {
    const { repo, tx, balance } = setup(2);
    await repo.adjustStockAtomic(input);
    expect(balance()).toBe(2);
    expect(tx.stock.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ quantity: { gte: 5 } }) }));
  });

  it('rejects foreign products without changing balances', async () => {
    const { repo, tx, balance } = setup();
    tx.product.findFirst.mockResolvedValue(null);
    await expect(repo.adjustStockAtomic(input)).rejects.toBeInstanceOf(NotFoundException);
    expect(balance()).toBe(5);
  });

  it('rolls back when outgoing lot is missing or insufficient', async () => {
    const { repo, balance, movements } = setup();
    await expect(repo.adjustStockAtomic({ ...input, lotNumber: 'L1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(balance()).toBe(5); expect(movements).toHaveLength(0);
  });

  it('preserves omitted lot serial and expiry metadata', async () => {
    const { repo, tx } = setup();
    await repo.adjustStockAtomic({ ...input, type: 'in', lotNumber: 'L1' });
    expect(tx.stockLot.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { quantity: { increment: 3 } } }));
  });

  it('rejects unallocated outgoing stock that would consume tracked lots', async () => {
    const { repo, tx, balance } = setup();
    tx.stockLot.findMany.mockResolvedValue([{ quantity: 4 }]);
    await expect(repo.adjustStockAtomic(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(balance()).toBe(5);
  });
});
