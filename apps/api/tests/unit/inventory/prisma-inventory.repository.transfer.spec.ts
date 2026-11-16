import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';

function setup(options: { lotNumber?: string | null; reserved?: boolean; status?: string } = {}) {
  const lotNumber = options.lotNumber ?? null;
  let state = {
    transfer: {
      id: 'tr1', tenantId: 't1', fromWarehouseId: 'w1', toWarehouseId: 'w2', productId: 'p1',
      quantity: 2.5, status: options.status ?? 'pending', lotNumber, notes: null,
      receivedQuantity: 0, shortageQuantity: 0, reserved: options.reserved ?? true,
      lotSerialNumber: null as string | null, lotExpirationDate: null as Date | null,
      createdAt: new Date(), dispatchedAt: null as Date | null, receivedAt: null as Date | null,
      cancelledAt: null as Date | null, completedAt: null as Date | null,
    },
    stocks: {
      w1: { id: 's-w1', productId: 'p1', warehouseId: 'w1', quantity: 5, committedQuantity: 0 },
      w2: { id: 's-w2', productId: 'p1', warehouseId: 'w2', quantity: 1, committedQuantity: 0 },
    } as Record<string, any>,
    lots: lotNumber ? [{
      id: 'lot1', tenantId: 't1', productId: 'p1', warehouseId: 'w1', lotNumber,
      quantity: 5, serialNumber: 'SER-1', expirationDate: new Date('2027-04-20'),
    }] : [] as any[],
    movements: [] as any[],
    lotSequence: 1,
  };

  const clone = (value: any) => structuredClone(value);
  const matchNumber = (condition: any, current: number) =>
    typeof condition === 'number' ? current === condition : current >= condition.gte;
  const applyNumber = (current: number, change: any) =>
    change.increment !== undefined ? current + change.increment : current - change.decrement;
  const stockWhereMatches = (where: any, record: any) => {
    if (where.productId && where.productId !== record.productId) return false;
    if (where.warehouseId && where.warehouseId !== record.warehouseId) return false;
    if (where.quantity !== undefined && !matchNumber(where.quantity, record.quantity)) return false;
    if (where.committedQuantity !== undefined && !matchNumber(where.committedQuantity, record.committedQuantity)) return false;
    return true;
  };
  const stock = (warehouseId: string) => clone(state.stocks[warehouseId]);

  const tx = {
    product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't1', isActive: true }) },
    warehouse: {
      findFirst: jest.fn().mockImplementation(async ({ where }) =>
        ({ id: where.id, tenantId: 't1', isActive: true, branchId: null })),
    },
    stockTransfer: {
      findFirst: jest.fn().mockImplementation(async ({ where }) =>
        where.tenantId === state.transfer.tenantId && where.id === state.transfer.id ? clone(state.transfer) : null),
      findUnique: jest.fn().mockImplementation(async ({ where }) =>
        where.id === state.transfer.id ? clone(state.transfer) : null),
      findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id !== state.transfer.id) throw new Error('not found');
        return clone(state.transfer);
      }),
      create: jest.fn().mockImplementation(async ({ data }) => {
        Object.assign(state.transfer, data);
        return clone(state.transfer);
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        if (where.status !== state.transfer.status || where.tenantId !== state.transfer.tenantId) return { count: 0 };
        Object.assign(state.transfer, data);
        return { count: 1 };
      }),
      update: jest.fn().mockImplementation(async ({ data }) => {
        Object.assign(state.transfer, data);
        return clone(state.transfer);
      }),
    },
    stock: {
      findUnique: jest.fn().mockImplementation(async ({ where }) =>
        stock(where.productId_warehouseId.warehouseId) ?? null),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        const record = state.stocks[where.warehouseId];
        if (!record || !stockWhereMatches(where, record)) return { count: 0 };
        if (data.quantity) record.quantity = applyNumber(record.quantity, data.quantity);
        if (data.committedQuantity) record.committedQuantity = applyNumber(record.committedQuantity, data.committedQuantity);
        return { count: 1 };
      }),
      findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) =>
        stock(where.productId_warehouseId.warehouseId)),
      upsert: jest.fn().mockImplementation(async ({ where, update }) => {
        const warehouseId = where.productId_warehouseId.warehouseId;
        state.stocks[warehouseId].quantity = applyNumber(state.stocks[warehouseId].quantity, update.quantity);
        return stock(warehouseId);
      }),
    },
    stockLot: {
      findMany: jest.fn().mockImplementation(async ({ where }) =>
        state.lots.filter(lot => lot.warehouseId === where.warehouseId && lot.quantity > 0)),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        const lot = state.lots.find(l => l.tenantId === where.tenantId && l.warehouseId === where.warehouseId && l.lotNumber === where.lotNumber);
        if (!lot || lot.quantity < where.quantity.gte) return { count: 0 };
        lot.quantity = applyNumber(lot.quantity, data.quantity);
        Object.assign(lot, Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'quantity')));
        return { count: 1 };
      }),
      findFirstOrThrow: jest.fn().mockImplementation(async ({ where }) =>
        clone(state.lots.find(l => l.warehouseId === where.warehouseId && l.lotNumber === where.lotNumber))),
      findUniqueOrThrow: jest.fn().mockImplementation(async ({ where }) =>
        clone(state.lots.find(l => l.id === where.id))),
      upsert: jest.fn().mockImplementation(async ({ where, update, create }) => {
        const key = where.productId_warehouseId_lotNumber;
        let lot = state.lots.find(l => l.warehouseId === key.warehouseId && l.lotNumber === key.lotNumber);
        if (lot) {
          lot.quantity = applyNumber(lot.quantity, update.quantity);
          Object.assign(lot, Object.fromEntries(Object.entries(update).filter(([field]) => field !== 'quantity')));
        } else {
          lot = { id: `lot${++state.lotSequence + 1}`, ...create };
          state.lots.push(lot);
        }
        return clone(lot);
      }),
    },
    stockMovement: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const movement = { id: `m${state.movements.length + 1}`, ...data };
        state.movements.push(movement);
        return movement;
      }),
    },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn().mockImplementation(async (fn) => {
      const before = clone(state);
      try {
        return await fn(tx);
      } catch (error) {
        state = before;
        throw error;
      }
    }),
  };
  return { repo: new PrismaInventoryRepository(prisma as any), prisma, tx, state: () => state };
}

describe('stock transfer transit and commitment', () => {
  it('creates a pending transfer by reserving stock without moving physical stock', async () => {
    const { repo, state } = setup();
    const result = await repo.createTransfer({
      tenantId: 't1', fromWarehouseId: 'w1', toWarehouseId: 'w2', productId: 'p1', quantity: 2.5,
    });
    expect(result).toMatchObject({ status: 'pending', reserved: true });
    expect(state().stocks.w1).toMatchObject({ quantity: 5, committedQuantity: 2.5 });
    expect(state().movements).toHaveLength(0);
  });

  it('rejects creation when physical stock is already committed', async () => {
    const { repo, state } = setup();
    state().stocks.w1.committedQuantity = 4;
    await expect(repo.createTransfer({
      tenantId: 't1', fromWarehouseId: 'w1', toWarehouseId: 'w2', productId: 'p1', quantity: 2,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(state().stocks.w1.committedQuantity).toBe(4);
  });

  it('dispatches by moving physical stock and releasing the source commitment', async () => {
    const { repo, prisma, tx, state } = setup();
    state().stocks.w1.committedQuantity = 2.5;
    const result = await repo.dispatchTransfer('tr1', 't1', 'u1');
    expect(result.status).toBe('in_transit');
    expect(state().stocks.w1).toMatchObject({ quantity: 2.5, committedQuantity: 0 });
    expect(state().movements).toEqual([
      expect.objectContaining({
        type: 'out', warehouseId: 'w1', quantity: 2.5, userId: 'u1',
        balanceBefore: 5, balanceAfter: 2.5, referenceType: 'transfer_dispatch',
      }),
    ]);
    expect(tx.stockTransfer.findFirst).toHaveBeenCalledWith({ where: { id: 'tr1', tenantId: 't1' } });
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function), expect.objectContaining({ isolationLevel: 'Serializable' }),
    );
  });

  it('dispatches legacy pending transfers without requiring a commitment', async () => {
    const { repo, state } = setup({ reserved: false });
    const result = await repo.dispatchTransfer('tr1', 't1');
    expect(result.status).toBe('in_transit');
    expect(state().stocks.w1).toMatchObject({ quantity: 2.5, committedQuantity: 0 });
  });

  it('preserves lot identity, serial and expiry through dispatch and receipt', async () => {
    const { repo, state } = setup({ lotNumber: 'L-1' });
    state().stocks.w1.committedQuantity = 2.5;
    await repo.dispatchTransfer('tr1', 't1');
    const result = await repo.receiveTransfer('tr1', 't1', { quantity: 2.5 });
    expect(result.status).toBe('completed');
    expect(state().lots.find(l => l.warehouseId === 'w1').quantity).toBe(2.5);
    expect(state().lots.find(l => l.warehouseId === 'w2')).toMatchObject({
      lotNumber: 'L-1', quantity: 2.5, serialNumber: 'SER-1', expirationDate: new Date('2027-04-20'),
    });
    expect(state().movements.map(m => m.lotId)).toEqual(['lot1', 'lot3']);
  });

  it('receives a partial quantity while keeping the transfer in transit', async () => {
    const { repo, state } = setup({ status: 'in_transit' });
    const result = await repo.receiveTransfer('tr1', 't1', { quantity: 1 });
    expect(result).toMatchObject({ status: 'in_transit', receivedQuantity: 1, shortageQuantity: 0 });
    expect(state().stocks.w2.quantity).toBe(2);
    expect(state().movements).toEqual([
      expect.objectContaining({ type: 'in', warehouseId: 'w2', quantity: 1, balanceBefore: 1, balanceAfter: 2 }),
    ]);
  });

  it('closes a shortage explicitly and records the missing quantity', async () => {
    const { repo, state } = setup({ status: 'in_transit' });
    const result = await repo.receiveTransfer('tr1', 't1', { quantity: 2, closeShortage: true });
    expect(result).toMatchObject({ status: 'completed', receivedQuantity: 2, shortageQuantity: 0.5 });
    expect(state().stocks.w2.quantity).toBe(3);
  });

  it('completes automatically when the full pending quantity is received', async () => {
    const { repo, state } = setup({ status: 'in_transit' });
    const result = await repo.receiveTransfer('tr1', 't1', { quantity: 2.5 });
    expect(result).toMatchObject({ status: 'completed', receivedQuantity: 2.5, shortageQuantity: 0 });
    expect(state().stocks.w2.quantity).toBe(3.5);
  });

  it('rejects receipt before dispatch', async () => {
    const { repo, state } = setup();
    await expect(repo.receiveTransfer('tr1', 't1', { quantity: 1 }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(state().stocks.w2.quantity).toBe(1);
    expect(state().movements).toHaveLength(0);
  });

  it('cancels a pending transfer and releases its commitment', async () => {
    const { repo, state } = setup();
    state().stocks.w1.committedQuantity = 2.5;
    const result = await repo.cancelTransfer('tr1', 't1');
    expect(result.status).toBe('cancelled');
    expect(state().stocks.w1).toMatchObject({ quantity: 5, committedQuantity: 0 });
    expect(state().movements).toHaveLength(0);
  });

  it('rejects another tenant before any mutation', async () => {
    const { repo, tx, state } = setup();
    await expect(repo.dispatchTransfer('tr1', 't2')).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.stockTransfer.updateMany).not.toHaveBeenCalled();
    expect(state().stocks.w1).toMatchObject({ quantity: 5, committedQuantity: 0 });
  });

  it('rolls back the transfer and stock when movement persistence fails', async () => {
    const { repo, tx, state } = setup();
    state().stocks.w1.committedQuantity = 2.5;
    tx.stockMovement.create.mockRejectedValue(new Error('movement failed'));
    await expect(repo.dispatchTransfer('tr1', 't1')).rejects.toThrow('movement failed');
    expect(state().stocks.w1).toMatchObject({ quantity: 5, committedQuantity: 2.5 });
    expect(state().transfer.status).toBe('pending');
    expect(state().movements).toHaveLength(0);
  });
});
