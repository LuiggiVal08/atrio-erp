import { Prisma } from '@prisma/client';
import { PrismaPurchasingRepository } from '../../../src/modules/purchasing/infrastructure/prisma-purchasing.repository';
import { PurchaseOrderService } from '../../../src/modules/purchasing/application/purchase-order.service';

const context = { tenantId: 't1', userId: 'u1' };
const op1 = 'f47a322a-e15a-41c9-bab4-688774d9aa65';
const op2 = '58df76dd-8543-44ac-bd27-f6a4bf71a8f1';

function harness() {
  let order: any = { id: 'po-1', documentId: 'doc-1', tenantId: 't1', status: 'approved' };
  let lines: any[] = [
    { id: 'l1', productId: 'p1', warehouseId: 'w1', quantity: new Prisma.Decimal(5), receivedQuantity: null },
    { id: 'l2', productId: 'p2', warehouseId: 'w1', quantity: new Prisma.Decimal(4), receivedQuantity: null },
  ];
  let events = new Map<string, any>();
  const tx = {
    $queryRaw: jest.fn(async (_sql, _id, tenantId) => tenantId === order.tenantId ? [{ id: order.id }] : []),
    purchaseOrder: {
      findUniqueOrThrow: jest.fn(async () => ({ ...order })),
      update: jest.fn(async ({ data }) => { order = { ...order, ...data }; return { ...order }; }),
    },
    documentLine: {
      findMany: jest.fn(async () => lines.map(l => ({ ...l }))),
      updateMany: jest.fn(async ({ where, data }) => {
        const line = lines.find(l => l.id === where.id);
        if (!line || !(line.receivedQuantity === null ? where.receivedQuantity === null : line.receivedQuantity.eq(where.receivedQuantity))) return { count: 0 };
        line.receivedQuantity = typeof data.receivedQuantity === 'number' ? new Prisma.Decimal(data.receivedQuantity)
          : line.receivedQuantity.plus(data.receivedQuantity.increment);
        return { count: 1 };
      }),
    },
    documentEvent: {
      findUnique: jest.fn(async ({ where }) => events.get(where.id) ?? null),
      create: jest.fn(async ({ data }) => { events.set(data.id, data); return data; }),
    },
    product: { findFirst: jest.fn(async () => ({ id: 'p1' })) },
    warehouse: { findFirst: jest.fn(async () => ({ id: 'w1' })) },
  };
  const prisma = { $transaction: jest.fn(async (fn) => {
    const before = { order: { ...order }, lines: lines.map(l => ({ ...l })), events: new Map(events) };
    try { return await fn(tx); }
    catch (error) { order = before.order; lines = before.lines; events = before.events; throw error; }
  }) };
  const repo = new PrismaPurchasingRepository(prisma as any);
  const emitter = { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]) };
  const service = new PurchaseOrderService(repo, emitter as any, {} as any);
  return { repo, service, tx, prisma, emitter, order: () => order, lines: () => lines, events: () => events };
}

describe('Atomic purchase receipts (service + actual repository)', () => {
  it('receives 3 then 2 as deltas, leaves omitted lines untouched, and uses conditional increments', async () => {
    const h = harness();
    await h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }] }, context);
    await h.service.receive('po-1', { operationId: op2, lines: [{ lineId: 'l1', quantity: 2 }] }, context);
    expect(h.lines()[0].receivedQuantity.toNumber()).toBe(5);
    expect(h.lines()[1].receivedQuantity).toBeNull();
    expect(h.order().status).toBe('partial');
    expect(h.emitter.emitAsync.mock.calls.map(c => c[1].metadata.lines)).toEqual([
      [{ lineId: 'l1', productId: 'p1', warehouseId: 'w1', quantity: 3 }],
      [{ lineId: 'l1', productId: 'p1', warehouseId: 'w1', quantity: 2 }],
    ]);
    expect(h.tx.documentLine.updateMany.mock.calls[1][0]).toMatchObject({
      where: { documentId: 'doc-1', quantity: { gte: new Prisma.Decimal(5) }, receivedQuantity: new Prisma.Decimal(3) },
      data: { receivedQuantity: { increment: 2 } },
    });
    expect(h.tx.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('replays a persisted operation without incrementing, including after the order is fully received', async () => {
    const h = harness();
    const dto = { operationId: op1, lines: [{ lineId: 'l1', quantity: 5 }, { lineId: 'l2', quantity: 4 }] };
    await h.service.receive('po-1', dto, context);
    await h.service.receive('po-1', dto, context);
    expect(h.order().status).toBe('received');
    expect(h.tx.documentLine.updateMany).toHaveBeenCalledTimes(2);
    expect(h.events().size).toBe(1);
    expect(h.emitter.emitAsync.mock.calls[0][1]).toEqual(h.emitter.emitAsync.mock.calls[1][1]);
    expect(h.emitter.emitAsync.mock.calls[0][1]).toMatchObject({ triggeredBy: 'u1', metadata: { operationId: op1 } });
  });

  it('waits for stock effects before confirming success', async () => {
    const h = harness();
    let release!: () => void;
    h.emitter.emitAsync.mockImplementationOnce(() => new Promise(resolve => { release = () => resolve([]); }));
    let confirmed = false;
    const receiving = h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }] }, context)
      .then(() => { confirmed = true; });
    for (let turn = 0; turn < 100 && !h.emitter.emitAsync.mock.calls.length && !confirmed; turn++) await Promise.resolve();
    expect(confirmed).toBe(false);
    release();
    await receiving;
    expect(confirmed).toBe(true);
  });

  it('returns an unconfirmed error after dispatch failure and replays the saved batch', async () => {
    const h = harness();
    const dto = { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }] };
    h.emitter.emitAsync.mockRejectedValueOnce(new Error('Stock unavailable'));
    await expect(h.service.receive('po-1', dto, context)).rejects.toMatchObject({ status: 503 });
    expect(h.lines()[0].receivedQuantity.toNumber()).toBe(3);
    await h.service.receive('po-1', dto, context);
    expect(h.tx.documentLine.updateMany).toHaveBeenCalledTimes(1);
    expect(h.emitter.emitAsync.mock.calls[1][1]).toEqual(h.emitter.emitAsync.mock.calls[0][1]);
  });

  it('rejects reuse of an operation ID with different quantities', async () => {
    const h = harness();
    await h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }] }, context);
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 2 }] }, context)).rejects.toThrow('different receipt');
    expect(h.lines()[0].receivedQuantity.toNumber()).toBe(3);
  });

  it('completes all remaining counts, persists and emits only remaining deltas', async () => {
    const h = harness();
    await h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }] }, context);
    await h.service.completeReceive('po-1', { operationId: op2 }, context);
    expect(h.order()).toMatchObject({ status: 'received', receivedAt: expect.any(Date) });
    expect(h.lines().map(l => l.receivedQuantity.toNumber())).toEqual([5, 4]);
    expect(h.emitter.emitAsync.mock.calls[1][1].metadata.lines.map((l: any) => l.quantity)).toEqual([2, 4]);
    await h.service.completeReceive('po-1', { operationId: op2 }, context);
    expect(h.tx.documentLine.updateMany).toHaveBeenCalledTimes(3);
  });

  it.each(['pending', 'draft', 'received', 'cancelled'])('rejects %s orders without writes', async (status) => {
    const h = harness(); h.order().status = status;
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 1 }] }, context)).rejects.toThrow('Only approved');
    expect(h.tx.documentLine.updateMany).not.toHaveBeenCalled();
    expect(h.emitter.emitAsync).not.toHaveBeenCalled();
  });

  it('rejects effective-tenant mismatch without any writes', async () => {
    const h = harness();
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 1 }] }, { ...context, tenantId: 'other' })).rejects.toThrow('not found');
    expect(h.tx.documentLine.findMany).not.toHaveBeenCalled();
  });

  it.each(['product', 'warehouse'])('rejects foreign/inactive %s', async (resource) => {
    const h = harness(); h.tx[resource as 'product' | 'warehouse'].findFirst.mockResolvedValueOnce(null as any);
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 1 }] }, context)).rejects.toThrow('effective tenant');
    expect(h.tx.documentLine.updateMany).not.toHaveBeenCalled();
    expect(h.tx[resource as 'product' | 'warehouse'].findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1', isActive: true }) }));
  });

  it('rolls back an earlier line when a later line exceeds remaining quantity', async () => {
    const h = harness();
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 3 }, { lineId: 'l2', quantity: 5 }] }, context)).rejects.toThrow('unreceived');
    expect(h.lines().map(l => l.receivedQuantity)).toEqual([null, null]);
    expect(h.order().status).toBe('approved'); expect(h.events().size).toBe(0);
    expect(h.emitter.emitAsync).not.toHaveBeenCalled();
  });

  it('rolls back a conditional-write conflict', async () => {
    const h = harness(); h.tx.documentLine.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 1 }] }, context)).rejects.toThrow('changed');
    expect(h.order().status).toBe('approved'); expect(h.events().size).toBe(0);
  });

  it('rolls back counts and status if event persistence fails', async () => {
    const h = harness(); h.tx.documentEvent.create.mockRejectedValueOnce(new Error('persistence failure'));
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 5 }] }, context)).rejects.toThrow('persistence failure');
    expect(h.lines()[0].receivedQuantity).toBeNull(); expect(h.order().status).toBe('approved');
    expect(h.emitter.emitAsync).not.toHaveBeenCalled();
  });

  it('preserves fractional quantities and never converts receipt quantities to currency', async () => {
    const h = harness();
    await h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 0.125 }] }, context);
    expect(h.lines()[0].receivedQuantity.toNumber()).toBe(0.125);
    expect(h.emitter.emitAsync.mock.calls[0][1].metadata.lines[0].quantity).toBe(0.125);
  });

  it('rejects missing product/warehouse instead of losing physical goods', async () => {
    const h = harness(); h.lines()[0].productId = null;
    await expect(h.service.receive('po-1', { operationId: op1, lines: [{ lineId: 'l1', quantity: 1 }] }, context)).rejects.toThrow('requires a product');
    expect(h.emitter.emitAsync).not.toHaveBeenCalled();
  });
});
