import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';

function setup(lotNumber: string | null = null) {
  let state = {
    transfer: { id: 'tr1', tenantId: 't1', fromWarehouseId: 'w1', toWarehouseId: 'w2', productId: 'p1', quantity: 2.5, status: 'pending', lotNumber, notes: null, createdAt: new Date(), completedAt: null as Date | null },
    balances: { w1: 5, w2: 1 } as Record<string, number>,
    lots: lotNumber ? [{ id: 'lot1', tenantId: 't1', productId: 'p1', warehouseId: 'w1', lotNumber, quantity: 5, serialNumber: 'SER-1', expirationDate: new Date('2027-04-20') }] : [],
    movements: [] as any[],
  };
  const stock = (warehouseId: string) => ({ id: `s-${warehouseId}`, productId: 'p1', warehouseId, quantity: state.balances[warehouseId] });
  const tx = {
    product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't1', isActive: true }) },
    warehouse: { findFirst: jest.fn().mockImplementation(async ({ where }) => ({ id: where.id, tenantId: 't1', isActive: true, branchId: null })) },
    stockTransfer: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => where.tenantId === state.transfer.tenantId && where.id === state.transfer.id ? structuredClone(state.transfer) : null),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        if (where.status !== state.transfer.status || where.tenantId !== state.transfer.tenantId) return { count: 0 };
        Object.assign(state.transfer, data); return { count: 1 };
      }),
      update: jest.fn().mockImplementation(async ({ data }) => { Object.assign(state.transfer, data); return structuredClone(state.transfer); }),
    },
    stock: {
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        if (state.balances[where.warehouseId] < where.quantity.gte) return { count: 0 };
        state.balances[where.warehouseId] -= data.quantity.decrement; return { count: 1 };
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) => stock(where.productId_warehouseId.warehouseId)),
      upsert: jest.fn().mockImplementation(async ({ where, update }) => {
        const warehouseId = where.productId_warehouseId.warehouseId;
        state.balances[warehouseId] += update.quantity.increment;
        return stock(warehouseId);
      }),
    },
    stockLot: {
      findMany: jest.fn().mockImplementation(async ({ where }) => state.lots.filter(l => l.warehouseId === where.warehouseId)),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        const lot = state.lots.find(l => l.tenantId === where.tenantId && l.warehouseId === where.warehouseId && l.lotNumber === where.lotNumber);
        if (!lot || lot.quantity < where.quantity.gte) return { count: 0 };
        lot.quantity += data.quantity.increment; return { count: 1 };
      }),
      findFirstOrThrow: jest.fn().mockImplementation(async ({ where }) => structuredClone(state.lots.find(l => l.warehouseId === where.warehouseId && l.lotNumber === where.lotNumber))),
      findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) => structuredClone(state.lots.find(l => l.id === where.id))),
      upsert: jest.fn().mockImplementation(async ({ create }) => { const lot = { id: 'lot2', ...create }; state.lots.push(lot); return structuredClone(lot); }),
    },
    stockMovement: { createMany: jest.fn().mockImplementation(async ({ data }) => { state.movements.push(...data); return { count: data.length }; }) },
  };
  const prisma = { ...tx, $transaction: jest.fn().mockImplementation(async fn => {
    const before = structuredClone(state);
    try { return await fn(tx); } catch (error) { state = before; throw error; }
  }) };
  return { repo: new PrismaInventoryRepository(prisma as any), prisma, tx, state: () => state };
}

describe('atomic transfer completion', () => {
  it('moves fractional stock and records both actor and before/after balances', async () => {
    const { repo, prisma, tx, state } = setup();
    const result = await repo.completeTransfer('tr1', 't1', 'u1');
    expect(result.status).toBe('completed');
    expect(state().balances).toEqual({ w1: 2.5, w2: 3.5 });
    expect(state().movements).toEqual([
      expect.objectContaining({ type: 'out', warehouseId: 'w1', quantity: 2.5, userId: 'u1', balanceBefore: 5, balanceAfter: 2.5, referenceId: 'tr1' }),
      expect.objectContaining({ type: 'in', warehouseId: 'w2', quantity: 2.5, userId: 'u1', balanceBefore: 1, balanceAfter: 3.5, referenceId: 'tr1' }),
    ]);
    expect(tx.stockTransfer.findFirst).toHaveBeenCalledWith({ where: { id: 'tr1', tenantId: 't1' } });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }));
  });

  it('preserves lot identity, serial and expiry at the destination', async () => {
    const { repo, state } = setup('L-1');
    const result = await repo.completeTransfer('tr1', 't1', 'u1');
    expect(result.lotNumber).toBe('L-1');
    expect(state().lots[0].quantity).toBe(2.5);
    expect(state().lots[1]).toMatchObject({ tenantId: 't1', warehouseId: 'w2', lotNumber: 'L-1', quantity: 2.5, serialNumber: 'SER-1', expirationDate: new Date('2027-04-20') });
    expect(state().movements.map(m => m.lotId)).toEqual(['lot1', 'lot2']);
  });

  it('rejects another tenant before any mutation', async () => {
    const { repo, tx, state } = setup();
    await expect(repo.completeTransfer('tr1', 't2')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.stockTransfer.updateMany).not.toHaveBeenCalled();
    expect(state().balances).toEqual({ w1: 5, w2: 1 });
  });

  it('rejects an inactive destination without claiming the transfer', async () => {
    const { repo, tx } = setup();
    tx.warehouse.findFirst.mockResolvedValueOnce({ id: 'w1', branchId: null }).mockResolvedValueOnce(null);
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.stockTransfer.updateMany).not.toHaveBeenCalled();
  });

  it('rejects insufficient stock and releases the pending claim', async () => {
    const { repo, state } = setup(); state().balances.w1 = 1;
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toBeInstanceOf(BadRequestException);
    expect(state().transfer.status).toBe('pending');
    expect(state().balances).toEqual({ w1: 1, w2: 1 });
    expect(state().movements).toHaveLength(0);
  });

  it('rolls back both balances and source lot when destination lot creation fails', async () => {
    const { repo, tx, state } = setup('L-1');
    tx.stockLot.upsert.mockRejectedValue(new Error('destination lot failed'));
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toThrow('destination lot failed');
    expect(state().balances).toEqual({ w1: 5, w2: 1 });
    expect(state().lots).toHaveLength(1);
    expect(state().lots[0].quantity).toBe(5);
    expect(state().transfer.status).toBe('pending');
    expect(state().movements).toHaveLength(0);
  });

  it('rolls back lots and quantities if paired movement persistence fails', async () => {
    const { repo, tx, state } = setup('L-1');
    tx.stockMovement.createMany.mockRejectedValue(new Error('movement failed'));
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toThrow('movement failed');
    expect(state().balances).toEqual({ w1: 5, w2: 1 });
    expect(state().lots).toHaveLength(1);
    expect(state().lots[0].quantity).toBe(5);
    expect(state().transfer.status).toBe('pending');
  });

  it('does not apply a completed transfer again', async () => {
    const { repo, state } = setup();
    await repo.completeTransfer('tr1', 't1');
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toBeInstanceOf(BadRequestException);
    expect(state().balances).toEqual({ w1: 2.5, w2: 3.5 });
    expect(state().movements).toHaveLength(2);
  });

  it('requires a lot when unallocated quantity cannot cover the transfer', async () => {
    const { repo, state } = setup('L-1'); state().transfer.lotNumber = null;
    await expect(repo.completeTransfer('tr1', 't1')).rejects.toBeInstanceOf(BadRequestException);
    expect(state().balances).toEqual({ w1: 5, w2: 1 });
    expect(state().lots[0].quantity).toBe(5);
  });
});
