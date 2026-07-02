import { CashMovementEventHandler } from '../../../src/modules/cash-payments/application/cash-movement-event-handler';
import { CashMovementService } from '../../../src/modules/cash-payments/application/cash-movement.service';

describe('CashMovementEventHandler', () => {
  let handler: CashMovementEventHandler;
  const mockCashMovementService: Partial<CashMovementService> = { register: jest.fn() };

  beforeEach(() => {
    handler = new CashMovementEventHandler(mockCashMovementService as CashMovementService);
    jest.clearAllMocks();
  });

  it('should register cash movement on document.paid', async () => {
    const payload = {
      eventType: 'document.paid',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'sales_invoice',
      triggeredBy: 'user-1',
      metadata: {
        cashRegisterId: 'reg-1',
        amount: 1200.00,
      },
    };

    await handler.handleDocumentPaid(payload);

    expect(mockCashMovementService.register).toHaveBeenCalledWith({
      cashRegisterId: 'reg-1',
      type: 'in',
      amount: 1200.00,
      referenceType: 'sales_invoice',
      referenceId: 'doc-1',
      description: 'Payment for sales_invoice doc-1',
      userId: 'user-1',
    });
  });

  it('should skip if cashRegisterId is missing', async () => {
    await handler.handleDocumentPaid({
      eventType: 'document.paid',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'sales_invoice',
      triggeredBy: 'user-1',
      metadata: { amount: 500 },
    });

    expect(mockCashMovementService.register).not.toHaveBeenCalled();
  });

  it('should skip if amount is missing', async () => {
    await handler.handleDocumentPaid({
      eventType: 'document.paid',
      tenantId: 'tenant-1',
      documentId: 'doc-1',
      documentType: 'sales_invoice',
      triggeredBy: 'user-1',
      metadata: { cashRegisterId: 'reg-1' },
    });

    expect(mockCashMovementService.register).not.toHaveBeenCalled();
  });
});
