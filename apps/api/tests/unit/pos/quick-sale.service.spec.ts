import { BadRequestException } from '@nestjs/common';
import { QuickSaleService } from '../../../src/modules/pos/application/quick-sale.service';

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';

describe('QuickSaleService', () => {
  let service: QuickSaleService;
  let posRepo: { findOpenSession: jest.Mock };
  let prisma: any;
  let eventEmitter: { emit: jest.Mock };

  const makeInput = (overrides: Record<string, unknown> = {}) => ({
    tenantId: 'tenant-1',
    clientId: CLIENT_ID,
    cashRegisterId: 'register-1',
    subtotal: 100,
    taxAmount: 16,
    total: 116,
    currency: 'VED',
    paymentMethod: 'cash',
    paymentAllocations: [
      { method: 'cash', amount: 116, currency: 'VED', exchangeRate: 1 },
    ],
    items: [{ productId: 'product-1', warehouseId: 'warehouse-1', quantity: 1, unitPrice: 100 }],
    userId: 'user-1',
    ...overrides,
  });

  beforeEach(() => {
    posRepo = {
      findOpenSession: jest.fn().mockResolvedValue({ id: 'session-1' }),
    };
    prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
      salesOrder: { create: jest.fn().mockResolvedValue({ id: 'order-1' }) },
      cashRegister: { update: jest.fn().mockResolvedValue({}) },
      cashMovement: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      client: { upsert: jest.fn().mockResolvedValue({ id: 'walk-in-1' }) },
      stock: {
        findUnique: jest.fn().mockResolvedValue({ quantity: 10 }),
        update: jest.fn().mockResolvedValue({}),
      },
      stockMovement: { create: jest.fn().mockResolvedValue({}) },
    };
    eventEmitter = { emit: jest.fn() };
    service = new QuickSaleService(posRepo as any, prisma as any, eventEmitter as any);
  });

  it('rejects a sale when there is no open register session', async () => {
    posRepo.findOpenSession.mockResolvedValue(null);

    await expect(service.execute(makeInput())).rejects.toThrow(BadRequestException);
    expect(prisma.salesOrder.create).not.toHaveBeenCalled();
  });

  it('accepts a mixed card and cash payment', async () => {
    const result = await service.execute(
      makeInput({
        paymentAllocations: [
          { method: 'card', amount: 100, currency: 'VED', exchangeRate: 1 },
          { method: 'cash', amount: 16, currency: 'VED', exchangeRate: 1 },
        ],
      }),
    );

    expect(result.paid).toBe(116);
    expect(result.change).toBe(0);
    expect(prisma.cashRegister.update).toHaveBeenCalledWith({
      where: { id: 'register-1' },
      data: { balance: { increment: 16 } },
    });
  });

  it('only adds the cash portion to the register balance', async () => {
    await service.execute(
      makeInput({
        paymentAllocations: [
          { method: 'transfer', amount: 100, currency: 'VED', exchangeRate: 1 },
          { method: 'cash', amount: 20, currency: 'VED', exchangeRate: 1 },
        ],
      }),
    );

    expect(prisma.cashRegister.update).toHaveBeenCalledWith({
      where: { id: 'register-1' },
      data: { balance: { increment: 20 } },
    });
  });

  it('returns change when cash exceeds the total', async () => {
    const result = await service.execute(
      makeInput({
        paymentAllocations: [
          { method: 'cash', amount: 120, currency: 'VED', exchangeRate: 1 },
        ],
      }),
    );

    expect(result.change).toBe(4);
    expect(result.paid).toBe(120);
    expect(prisma.cashRegister.update).toHaveBeenCalledWith({
      where: { id: 'register-1' },
      data: { balance: { increment: 120 } },
    });
  });

  it('stores the original amount and the base amount for foreign currency payments', async () => {
    await service.execute(
      makeInput({
        total: 400,
        paymentAllocations: [
          { method: 'card', amount: 10, currency: 'USD', exchangeRate: 40 },
        ],
      }),
    );

    expect(prisma.cashMovement.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          amount: 10,
          currency: 'USD',
          exchangeRate: 40,
          baseAmount: 400,
        }),
      ],
    });
    expect(prisma.cashRegister.update).not.toHaveBeenCalled();
  });

  it('rejects a non-cash payment that exceeds the total', async () => {
    await expect(
      service.execute(
        makeInput({
          paymentAllocations: [
            { method: 'card', amount: 120, currency: 'VED', exchangeRate: 1 },
          ],
        }),
      ),
    ).rejects.toThrow('Solo el efectivo puede exceder el total');
    expect(prisma.salesOrder.create).not.toHaveBeenCalled();
  });

  it('rejects a payment that does not cover the total', async () => {
    await expect(
      service.execute(
        makeInput({
          paymentAllocations: [
            { method: 'cash', amount: 100, currency: 'VED', exchangeRate: 1 },
          ],
        }),
      ),
    ).rejects.toThrow('El pago no cubre el total de la venta');
  });

  it('rejects unknown payment methods', async () => {
    await expect(
      service.execute(
        makeInput({
          paymentAllocations: [
            { method: 'bitcoin', amount: 116, currency: 'VED', exchangeRate: 1 },
          ],
        }),
      ),
    ).rejects.toThrow('Método de pago no válido');
  });

  it('rejects rows with a zero amount or rate', async () => {
    await expect(
      service.execute(
        makeInput({
          paymentAllocations: [
            { method: 'cash', amount: 0, currency: 'VED', exchangeRate: 1 },
          ],
        }),
      ),
    ).rejects.toThrow('Cada pago debe tener un monto mayor a 0');

    await expect(
      service.execute(
        makeInput({
          paymentAllocations: [
            { method: 'cash', amount: 116, currency: 'VED', exchangeRate: 0 },
          ],
        }),
      ),
    ).rejects.toThrow('Cada pago debe tener una tasa de cambio mayor a 0');
  });

  it('creates a walk-in customer when no client is selected', async () => {
    await service.execute(makeInput({ clientId: undefined }));

    expect(prisma.client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_documentId: { tenantId: 'tenant-1', documentId: 'CONSUMIDOR-FINAL' },
        },
      }),
    );
    expect(prisma.salesOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: 'walk-in-1' }),
      }),
    );
  });

  it('does not create a walk-in customer when a valid client is provided', async () => {
    await service.execute(makeInput());

    expect(prisma.client.upsert).not.toHaveBeenCalled();
    expect(prisma.salesOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: CLIENT_ID }),
      }),
    );
  });

  it('treats a non-UUID client as a walk-in customer', async () => {
    await service.execute(makeInput({ clientId: 'default-client' }));

    expect(prisma.client.upsert).toHaveBeenCalled();
    expect(prisma.salesOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: 'walk-in-1' }),
      }),
    );
  });

  it('deducts stock for every sold item', async () => {
    await service.execute(
      makeInput({
        items: [{ productId: 'product-1', warehouseId: 'warehouse-1', quantity: 3, unitPrice: 100 }],
      }),
    );

    expect(prisma.stock.update).toHaveBeenCalledWith({
      where: { productId_warehouseId: { productId: 'product-1', warehouseId: 'warehouse-1' } },
      data: { quantity: { decrement: 3 } },
    });
    expect(prisma.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        type: 'out',
        quantity: 3,
        referenceType: 'sales_order',
        referenceId: 'order-1',
      }),
    });
  });

  it('rejects the sale when stock is insufficient', async () => {
    prisma.stock.findUnique.mockResolvedValue({ quantity: 0 });

    await expect(service.execute(makeInput())).rejects.toThrow('Stock insuficiente');
    expect(prisma.stock.update).not.toHaveBeenCalled();
  });

  it('rejects the sale when physical stock is reserved by another operation', async () => {
    prisma.stock.findUnique.mockResolvedValue({ quantity: 10, committedQuantity: 9 });

    await expect(service.execute(
      makeInput({
        items: [{ productId: 'product-1', warehouseId: 'warehouse-1', quantity: 2, unitPrice: 100 }],
      }),
    )).rejects.toThrow('Stock insuficiente');
    expect(prisma.stock.update).not.toHaveBeenCalled();
  });

  it('rejects an oversell when a concurrent sale wins the conditional decrement', async () => {
    prisma.stock.updateMany = jest.fn().mockResolvedValue({ count: 0 });
    await expect(service.execute(makeInput())).rejects.toThrow('Stock insuficiente');
    expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('returns the sale total, paid amount and change', async () => {
    const result = await service.execute(makeInput());

    expect(result).toEqual(
      expect.objectContaining({
        orderId: 'order-1',
        sessionId: 'session-1',
        status: 'approved',
        total: 116,
        paid: 116,
        change: 0,
      }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'document.created',
      expect.objectContaining({
        metadata: expect.objectContaining({ clientId: CLIENT_ID }),
      }),
    );
  });
});
