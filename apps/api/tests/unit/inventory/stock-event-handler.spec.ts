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
      metadata: {
        lines: [{ productId: 'prod-1', warehouseId: 'wh-1', quantity: 10 }],
        triggeredBy: 'user-1',
      },
    };

    await handler.handleDocumentReceived(payload);

    expect(mockStockService.adjust).toHaveBeenCalledWith({
      productId: 'prod-1',
      warehouseId: 'wh-1',
      type: 'in',
      quantity: 10,
      userId: 'user-1',
    });
  });
});
