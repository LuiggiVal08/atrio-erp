import { StockEventHandler } from '../../../src/modules/inventory/application/stock-event-handler';
import { StockService } from '../../../src/modules/inventory/application/stock.service';

describe('StockEventHandler', () => {
  let handler: StockEventHandler;
  const mockStockService: Partial<StockService> = { adjust: jest.fn() };

  beforeEach(() => {
    handler = new StockEventHandler(mockStockService as StockService);
    jest.clearAllMocks();
  });

  it('should deduct stock on sales_invoice approved', async () => {
    const payload = {
      eventType: 'document.approved',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'sales_invoice',
      metadata: {
        lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 2 }],
        triggeredBy: 'user-1',
      },
    };

    await handler.handleDocumentApproved(payload);

    expect(mockStockService.adjust).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      type: 'out',
      quantity: 2,
      userId: 'user-1',
    });
  });

  it('should skip non-sales_invoice documents', async () => {
    await handler.handleDocumentApproved({
      eventType: 'document.approved',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'purchase_order',
    });

    expect(mockStockService.adjust).not.toHaveBeenCalled();
  });

  it('should skip lines without productId or warehouseId', async () => {
    await handler.handleDocumentApproved({
      eventType: 'document.approved',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'sales_invoice',
      metadata: {
        lines: [{ quantity: 2 }],
      },
    });

    expect(mockStockService.adjust).not.toHaveBeenCalled();
  });

  it('should add stock on purchase_order delivered', async () => {
    const payload = {
      eventType: 'document.deliver',
      tenantId: 'tenant-1',
      documentId: 'doc-2',
      documentType: 'purchase_order',
      metadata: {
        lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 5 }],
        triggeredBy: 'user-1',
      },
    };

    await handler.handleDocumentDelivered(payload);

    expect(mockStockService.adjust).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      type: 'in',
      quantity: 5,
      userId: 'user-1',
    });
  });

  it('should skip non-purchase_order documents on deliver', async () => {
    await handler.handleDocumentDelivered({
      eventType: 'document.deliver',
      tenantId: 'tenant-1',
      documentId: 'doc-3',
      documentType: 'sales_invoice',
    });

    expect(mockStockService.adjust).not.toHaveBeenCalled();
  });

  it('should add stock on purchase_order received', async () => {
    const payload = {
      eventType: 'document.received',
      tenantId: 'tenant-1',
      documentId: 'doc-4',
      documentType: 'purchase_order',
      triggeredBy: 'user-1',
      metadata: {
        operationId: 'receipt-1',
        lines: [{ lineId: 'line-1', productId: 'prod-1', warehouseId: 'wh-1', quantity: 10 }],
      },
    };

    await handler.handleDocumentReceived(payload);

    expect(mockStockService.adjust).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      type: 'in',
      quantity: 10,
      userId: 'user-1',
      operationId: JSON.stringify(['purchase-receipt', 'receipt-1', 'line-1']),
      referenceType: 'purchase_order',
      referenceId: 'doc-4',
    });
    await handler.handleDocumentReceived(payload);
    expect((mockStockService.adjust as jest.Mock).mock.calls[1][0]).toEqual((mockStockService.adjust as jest.Mock).mock.calls[0][0]);
  });

  it('uses the purchase return operation and line identity for idempotent stock exits', async () => {
    await handler.handleDocumentReturned({
      eventType: 'document.returned',
      tenantId: 'tenant-1',
      documentId: 'return-1',
      documentType: 'purchase_return',
      metadata: { operationId: 'return-1', lines: [{ lineId: '0', productId: 'prod-1', warehouseId: 'wh-1', quantity: 2 }] },
    });

    expect(mockStockService.adjust).toHaveBeenCalledWith(expect.objectContaining({
      type: 'out',
      quantity: 2,
      operationId: JSON.stringify(['purchase-return', 'return-1', '0']),
      referenceType: 'purchase_return',
      referenceId: 'return-1',
    }));
  });

  it('uses the sales return operation and line identity for idempotent stock entries', async () => {
    await handler.handleDocumentReturned({
      eventType: 'document.returned',
      tenantId: 'tenant-1',
      documentId: 'return-2',
      documentType: 'sales_return',
      triggeredBy: 'user-1',
      metadata: { operationId: 'return-2', productCondition: 'saleable', lines: [{ lineId: '0', productId: 'prod-1', warehouseId: 'wh-1', quantity: 1 }] },
    });

    expect(mockStockService.adjust).toHaveBeenCalledWith(expect.objectContaining({
      type: 'in',
      quantity: 1,
      operationId: JSON.stringify(['sales-return', 'return-2', '0']),
      referenceType: 'sales_return',
      referenceId: 'return-2',
    }));
  });

  it('rejects receipt events without stable batch and line identities before any stock write', async () => {
    const payload = { eventType: 'document.received', tenantId: 't1', documentId: 'po1', documentType: 'purchase_order',
      metadata: { lines: [{ productId: 'p1', warehouseId: 'w1', quantity: 1 }] } };
    await expect(handler.handleDocumentReceived(payload)).rejects.toThrow();
    await expect(handler.handleDocumentReceived({ ...payload, metadata: { ...payload.metadata, operationId: 'op1' } })).rejects.toThrow();
    expect(mockStockService.adjust).not.toHaveBeenCalled();
  });
});
