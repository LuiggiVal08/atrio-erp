import { PosSaleService } from '../../../src/modules/pos/application/pos-sale.service';
import type { SalesRepository } from '../../../src/modules/sales/domain/sales.repository.interface';
import { SalesOrder } from '../../../src/modules/sales/domain/sales-order.entity';
import { SalesOrderStatus } from '../../../src/modules/sales/domain/sales-order-status';
import { CustomerSnapshot } from '../../../src/modules/sales/domain/customer-snapshot.vo';
import { CurrencySnapshot } from '../../../src/modules/sales/domain/currency-snapshot.vo';
import { Money } from '../../../src/modules/sales/domain/money.vo';
import { OrderLine } from '../../../src/modules/sales/domain/order-line.entity';

function makeSale(overrides?: Partial<{ id: string; status: SalesOrderStatus; lines: OrderLine[] }>): SalesOrder {
  const customer = new CustomerSnapshot('p1', 'Test', null, null, null, null);
  const currency = new CurrencySnapshot('VED', null);
  const lines = overrides?.lines ?? [];
  return SalesOrder.fromPersistence({
    id: overrides?.id ?? 'sale-1',
    tenantId: 't1',
    status: overrides?.status ?? SalesOrderStatus.DRAFT,
    customerSnapshot: customer,
    currencySnapshot: currency,
    lines,
    subtotal: lines.reduce((s, l) => s + l.lineTotal.amount, 0),
    taxAmount: 0,
    total: lines.reduce((s, l) => s + l.lineTotal.amount, 0),
    notes: null,
    type: 'pos',
    documentId: null,
    deliveredWarehouseId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockProduct(overrides?: Partial<{ id: string; name: string; sku: string }>) {
  return { id: overrides?.id ?? 'prod-1', name: overrides?.name ?? 'Laptop', sku: overrides?.sku ?? 'LAP001' };
}

describe('PosSaleService', () => {
  let service: PosSaleService;
  let mockRepo: jest.Mocked<SalesRepository>;
  let mockEventEmitter: any;
  let mockAudit: any;
  let mockPrisma: any;
  let mockMetrics: any;

  let mockCreateDoc: any;
  let mockSubmitDoc: any;
  let mockApproveDoc: any;
  let mockTransitionDoc: any;

  beforeEach(() => {
    mockRepo = {
      createOrder: jest.fn(),
      findOrdersByTenant: jest.fn(),
      findOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
      updateOrder: jest.fn(),
      deleteOrder: jest.fn(),
      addLine: jest.fn(),
      removeLine: jest.fn(),
      updateLineQuantity: jest.fn(),
      createInvoice: jest.fn(),
      findInvoicesByTenant: jest.fn(),
      findInvoiceById: jest.fn(),
      updateInvoiceStatus: jest.fn(),
      updateInvoice: jest.fn(),
      deleteInvoice: jest.fn(),
      payInvoice: jest.fn(),
    };

    mockEventEmitter = { emit: jest.fn() };
    mockAudit = { log: jest.fn() };
    mockMetrics = {
      observeCheckout: jest.fn(),
      observePayment: jest.fn(),
      incrementPaymentsTotal: jest.fn(),
      incrementPaymentError: jest.fn(),
      incrementStockConflict: jest.fn(),
    };
    mockPrisma = {
      product: { findMany: jest.fn().mockResolvedValue([mockProduct()]) },
    };

    mockCreateDoc = { execute: jest.fn() };
    mockSubmitDoc = { execute: jest.fn() };
    mockApproveDoc = { execute: jest.fn() };
    mockTransitionDoc = { execute: jest.fn() };

    service = new PosSaleService(
      mockRepo as any,
      mockEventEmitter as any,
      mockAudit as any,
      mockPrisma as any,
      mockCreateDoc,
      mockSubmitDoc,
      mockApproveDoc,
      mockTransitionDoc,
      mockMetrics,
    );
  });

  describe('createDraft', () => {
    it('should create a draft sale', async () => {
      const created = makeSale({ id: 'new-sale' });
      mockRepo.createOrder.mockResolvedValue(created);

      const result = await service.createDraft({
        tenantId: 't1',
        userId: 'u1',
        partnerId: 'p1',
        partnerName: 'Juan Pérez',
        lines: [{ productId: 'prod-1', quantity: 2, unitPrice: 100 }],
      });

      expect(result.id).toBe('new-sale');
      expect(mockRepo.createOrder).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.created', expect.objectContaining({
        eventType: 'sale.created',
        saleId: 'new-sale',
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'CREATE',
        entityType: 'pos_sale',
      }));
    });

    it('should create draft without lines', async () => {
      mockRepo.createOrder.mockResolvedValue(makeSale({ id: 'sale-2' }));

      const result = await service.createDraft({
        tenantId: 't1',
        userId: 'u1',
        partnerId: 'p1',
        partnerName: 'Test',
      });

      expect(result.id).toBe('sale-2');
      expect(mockRepo.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ lines: undefined }),
      );
    });
  });

  describe('findById', () => {
    it('should return sale if found', async () => {
      mockRepo.findOrderById.mockResolvedValue(makeSale());
      const result = await service.findById('sale-1');
      expect(result.id).toBe('sale-1');
    });

    it('should throw if not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow('POS sale not found');
    });
  });

  describe('findAll', () => {
    it('should return only pos type sales', async () => {
      const posSale = makeSale({ id: 's1' });
      const regularSale = makeSale({ id: 's2' });
      (regularSale as any).type = 'order';

      mockRepo.findOrdersByTenant.mockResolvedValue([posSale, regularSale]);
      const result = await service.findAll('t1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });
  });

  describe('updateDraft', () => {
    it('should update customer snapshot', async () => {
      mockRepo.findOrderById.mockResolvedValue(makeSale());
      mockRepo.updateOrder.mockResolvedValue(makeSale({ id: 'sale-1' }));

      const result = await service.updateDraft('sale-1', {
        userId: 'u1',
        partnerName: 'New Name',
      });

      expect(mockRepo.updateOrder).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.updated', expect.any(Object));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
    });

    it('should throw if sale not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.updateDraft('missing', { userId: 'u1' })).rejects.toThrow('POS sale not found');
    });

    it('should throw if sale is not in Draft', async () => {
      const paid = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      mockRepo.findOrderById.mockResolvedValue(paid);
      await expect(service.updateDraft('sale-1', { userId: 'u1' })).rejects.toThrow('INV-SALE-004');
    });

    it('should update lines', async () => {
      const line = OrderLine.create({ productId: 'prod-1', productName: 'Laptop', productSku: null, quantity: 2, unitPrice: new Money(100, 'VED'), id: 'line-1' });
      mockRepo.findOrderById.mockResolvedValue(makeSale({ lines: [line] }));
      mockRepo.updateOrder.mockResolvedValue(makeSale({ id: 'sale-1' }));
      mockPrisma.product.findMany.mockResolvedValue([mockProduct()]);

      await service.updateDraft('sale-1', {
        userId: 'u1',
        lines: [{ id: 'line-1', productId: 'prod-1', quantity: 3, unitPrice: 100 }],
      });

      expect(mockRepo.updateOrder).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.line_updated', expect.any(Object));
    });
  });

  describe('deleteDraft', () => {
    it('should delete draft sale', async () => {
      mockRepo.findOrderById.mockResolvedValue(makeSale());
      await service.deleteDraft('sale-1', 'u1');
      expect(mockRepo.deleteOrder).toHaveBeenCalledWith('sale-1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.deleted', expect.any(Object));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
    });

    it('should throw if not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.deleteDraft('missing', 'u1')).rejects.toThrow('POS sale not found');
    });

    it('should throw if not Draft', async () => {
      const paid = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      mockRepo.findOrderById.mockResolvedValue(paid);
      await expect(service.deleteDraft('sale-1', 'u1')).rejects.toThrow('INV-SALE-004');
    });
  });

  describe('requestCheckout', () => {
    it('should transition to PENDING_PAYMENT', async () => {
      const sale = makeSale({ id: 'sale-1' });
      const paid = makeSale({ id: 'sale-1', status: SalesOrderStatus.PENDING_PAYMENT });
      mockRepo.findOrderById.mockResolvedValue(sale);
      mockRepo.updateOrderStatus.mockResolvedValue(paid);

      const result = await service.requestCheckout('sale-1', 'u1');
      expect(result.status).toBe(SalesOrderStatus.PENDING_PAYMENT);
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'UPDATE',
        before: { status: SalesOrderStatus.DRAFT },
        after: { status: SalesOrderStatus.PENDING_PAYMENT },
      }));
    });

    it('should throw if not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.requestCheckout('missing', 'u1')).rejects.toThrow('POS sale not found');
    });
  });

  // ─────────────────────────────────────
  //  Slice 2 — Checkout
  // ─────────────────────────────────────

  describe('checkout', () => {
    function setupCheckoutMocks() {
      const line = OrderLine.create({ productId: 'prod-1', productName: 'Laptop', productSku: 'LAP001', quantity: 2, unitPrice: new Money(100, 'VED'), id: 'line-1' });
      const sale = makeSale({ id: 'sale-1', lines: [line] });
      mockRepo.findOrderById.mockResolvedValue(sale);

      mockPrisma.product.findMany.mockResolvedValue([
        { id: 'prod-1', name: 'Laptop', unitPrice: 100, taxId: 'tax-1' },
      ]);
      mockPrisma.localizationTax = {
        findMany: jest.fn().mockResolvedValue([{ id: 'tax-1', rate: 0.16 }]),
      };

      mockCreateDoc.execute.mockResolvedValue({ id: 'doc-1', subtotal: 200, taxTotal: 32, grandTotal: 232 });
      mockSubmitDoc.execute.mockResolvedValue({});
      mockRepo.updateOrder.mockResolvedValue(makeSale({ id: 'sale-1', status: SalesOrderStatus.PENDING_PAYMENT }));

      return { sale };
    }

    it('should checkout a draft sale', async () => {
      const { sale } = setupCheckoutMocks();

      const result = await service.checkout('sale-1', 'u1', 't1', 'wh-1');

      expect(result.saleId).toBe('sale-1');
      expect(result.documentId).toBe('doc-1');
      expect(result.status).toBe(SalesOrderStatus.PENDING_PAYMENT);
      expect(result.grandTotal).toBe(232);

      expect(mockCreateDoc.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: 'sales_invoice',
          lines: expect.arrayContaining([
            expect.objectContaining({ productId: 'prod-1', unitPrice: 100, taxRate: 0.16, warehouseId: 'wh-1' }),
          ]),
        }),
        expect.objectContaining({ tenantId: 't1', userId: 'u1' }),
      );
      expect(mockSubmitDoc.execute).toHaveBeenCalledWith('doc-1', { tenantId: 't1', userId: 'u1' });
      expect(mockRepo.updateOrder).toHaveBeenCalledWith('sale-1', {
        documentId: 'doc-1',
        status: SalesOrderStatus.PENDING_PAYMENT,
        subtotal: 200,
        taxAmount: 32,
        total: 232,
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.checkout_completed', expect.objectContaining({
        saleId: 'sale-1',
        data: { documentId: 'doc-1', grandTotal: 232 },
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CHECKOUT' }));
    });

    it('should throw if sale not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.checkout('missing', 'u1', 't1', 'wh-1')).rejects.toThrow('POS sale not found');
    });

    it('should throw if not in Draft', async () => {
      const paid = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      mockRepo.findOrderById.mockResolvedValue(paid);
      await expect(service.checkout('sale-1', 'u1', 't1', 'wh-1')).rejects.toThrow('Only draft sales can be checked out');
    });

    it('should throw if no lines', async () => {
      const empty = makeSale({ lines: [] });
      mockRepo.findOrderById.mockResolvedValue(empty);
      await expect(service.checkout('sale-1', 'u1', 't1', 'wh-1')).rejects.toThrow('Cannot checkout a sale with no items');
    });

    it('should throw if product not found', async () => {
      const line = OrderLine.create({ productId: 'missing-prod', productName: 'Ghost', productSku: null, quantity: 1, unitPrice: new Money(100, 'VED'), id: 'line-1' });
      mockRepo.findOrderById.mockResolvedValue(makeSale({ lines: [line] }));
      mockPrisma.product.findMany.mockResolvedValue([]);
      await expect(service.checkout('sale-1', 'u1', 't1', 'wh-1')).rejects.toThrow('Product not found or inactive');
    });
  });

  // ─────────────────────────────────────
  //  Slice 2 — Pay
  // ─────────────────────────────────────

  describe('pay', () => {
    function makeTxMock(overrides?: {
      stockQty?: number;
      docStatus?: string;
    }) {
      const qty = overrides?.stockQty ?? 10;
      const status = overrides?.docStatus ?? 'pending_approval';
      return {
        document: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'doc-1',
            status,
            grandTotal: 232,
            currency: 'VED',
            lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 2, description: 'Laptop' }],
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        documentEvent: { create: jest.fn().mockResolvedValue({}) },
        stock: { update: jest.fn().mockResolvedValue({}) },
        stockMovement: { create: jest.fn().mockResolvedValue({}) },
        cashRegister: { update: jest.fn().mockResolvedValue({}) },
        cashMovement: { create: jest.fn().mockResolvedValue({}) },
        salesOrder: { update: jest.fn().mockResolvedValue({}) },
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ quantity: qty }]),
      };
    }

    function setupPayMocks(txMock?: ReturnType<typeof makeTxMock>) {
      const tx = txMock ?? makeTxMock();
      const line = OrderLine.create({ productId: 'prod-1', productName: 'Laptop', productSku: 'LAP001', quantity: 2, unitPrice: new Money(100, 'VED'), id: 'line-1' });
      const sale = makeSale({ id: 'sale-1', status: SalesOrderStatus.PENDING_PAYMENT, lines: [line] });
      (sale as any).documentId = 'doc-1';
      (sale as any).subtotal = 200;
      (sale as any).taxAmount = 32;
      (sale as any).total = 232;
      mockRepo.findOrderById.mockResolvedValue(sale);

      mockPrisma.paymentMethod = {
        findUnique: jest.fn().mockResolvedValue({ id: 'pm-1', name: 'Efectivo', type: 'cash' }),
      };
      mockPrisma.cashRegister = {
        findUnique: jest.fn().mockResolvedValue({ id: 'cr-1', name: 'Caja Principal', balance: 1000 }),
      };
      mockPrisma.posSession = {
        findFirst: jest.fn().mockResolvedValue({ id: 'session-1', status: 'open' }),
      };
      mockPrisma.$transaction = jest.fn(async (cb: any) => cb(tx));

      return { sale, tx };
    }

    it('should pay a pending sale with single atomic transaction', async () => {
      const { tx } = setupPayMocks();

      const result = await service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1');

      expect(result.saleId).toBe('sale-1');
      expect(result.status).toBe(SalesOrderStatus.PAID);
      expect(result.documentId).toBe('doc-1');

      // Inside the transaction:
      expect(tx.document.findUnique).toHaveBeenCalledWith({ where: { id: 'doc-1' }, include: { lines: true } });
      expect(tx.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'),
        'prod-1', 'wh-1',
      );
      expect(tx.document.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'pending_approval' }) }),
      );
      expect(tx.stock.update).toHaveBeenCalled();
      expect(tx.stockMovement.create).toHaveBeenCalled();
      expect(tx.cashRegister.update).toHaveBeenCalled();
      expect(tx.cashMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          registerId: 'cr-1', type: 'in', amount: 232,
          referenceType: 'sales_invoice', referenceId: 'doc-1',
        }),
      });
      expect(tx.salesOrder.update).toHaveBeenCalledWith({
        where: { id: 'sale-1' },
        data: { status: SalesOrderStatus.PAID },
      });

      // Post-transaction
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('sale.payment_completed', expect.objectContaining({
        saleId: 'sale-1',
        data: { documentId: 'doc-1', paymentMethodId: 'pm-1', totalPaid: 232 },
      }));
      expect(mockAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'PAY' }));
    });

    it('should throw if sale not found', async () => {
      mockRepo.findOrderById.mockResolvedValue(null);
      await expect(service.pay('missing', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('POS sale not found');
    });

    it('should throw if not in PendingPayment', async () => {
      mockRepo.findOrderById.mockResolvedValue(makeSale());
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('Sale must be in PendingPayment status to pay');
    });

    it('should throw if no documentId', async () => {
      const noDoc = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      mockRepo.findOrderById.mockResolvedValue(noDoc);
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('Sale has no Document');
    });

    it('should throw if payment method not found', async () => {
      const sale = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      (sale as any).documentId = 'doc-1';
      mockRepo.findOrderById.mockResolvedValue(sale);
      mockPrisma.paymentMethod = { findUnique: jest.fn().mockResolvedValue(null) };
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('Payment method not found');
    });

    it('should throw if cash register not found', async () => {
      const sale = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      (sale as any).documentId = 'doc-1';
      mockRepo.findOrderById.mockResolvedValue(sale);
      mockPrisma.paymentMethod = { findUnique: jest.fn().mockResolvedValue({ id: 'pm-1' }) };
      mockPrisma.cashRegister = { findUnique: jest.fn().mockResolvedValue(null) };
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('Cash register not found');
    });

    it('should throw if no open session', async () => {
      const sale = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT });
      (sale as any).documentId = 'doc-1';
      mockRepo.findOrderById.mockResolvedValue(sale);
      mockPrisma.paymentMethod = { findUnique: jest.fn().mockResolvedValue({ id: 'pm-1' }) };
      mockPrisma.cashRegister = { findUnique: jest.fn().mockResolvedValue({ id: 'cr-1' }) };
      mockPrisma.posSession = { findFirst: jest.fn().mockResolvedValue(null) };
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('No open POS session for this cash register');
    });

    it('should throw if insufficient stock inside transaction', async () => {
      const tx = makeTxMock({ stockQty: 0 });
      tx.$queryRawUnsafe = jest.fn().mockResolvedValue([{ quantity: 0 }]);
      setupPayMocks(tx);
      await expect(service.pay('sale-1', 'u1', 't1', 'pm-1', 'cr-1')).rejects.toThrow('Insufficient stock for product Laptop');
    });
  });
});
