import { CreateDocumentUseCase, CreateDocumentInput, CreateDocumentContext } from '../../src/modules/document-engine/application/create-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('CreateDocumentUseCase', () => {
  let useCase: CreateDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;

  const mockContext: CreateDocumentContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
  };

  const mockInput: CreateDocumentInput = {
    documentType: DocumentType.SALES_INVOICE,
    currency: 'VED',
    lines: [
      { description: 'Widget A', quantity: 5, unitPrice: 100, taxRate: 16 },
    ],
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithLines: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      updateCounterDocument: jest.fn(),
      softDelete: jest.fn(),
      getNextSequence: jest.fn().mockResolvedValue(1),
    };
    useCase = new CreateDocumentUseCase(mockRepo);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a document with calculated totals', async () => {
    const mockDoc = { id: 'doc-1', documentNumber: 'INV-20260619-000001', status: 'draft' };
    mockRepo.create.mockResolvedValue(mockDoc as any);

    const result = await useCase.execute(mockInput, mockContext);

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    const callArgs = mockRepo.create.mock.calls[0][0];
    expect(callArgs.tenantId).toBe('tenant-1');
    expect(callArgs.createdById).toBe('user-1');
    expect(callArgs.currency).toBe('VED');
    expect(callArgs.lines).toHaveLength(1);
    expect(callArgs.lines[0].lineNumber).toBe(1);
    expect(callArgs.lines[0].description).toBe('Widget A');
    expect(callArgs.lines[0].quantity).toBe(5);
    expect(callArgs.lines[0].unitPrice).toBe(100);
    expect(callArgs.subtotal).toBe(500);
    expect(callArgs.taxTotal).toBe(80);
    expect(callArgs.grandTotal).toBe(580);
    expect(result).toEqual(mockDoc);
  });

  it('should generate a document number', async () => {
    mockRepo.create.mockResolvedValue({ id: 'doc-1' } as any);
    await useCase.execute(mockInput, mockContext);

    const callArgs = mockRepo.create.mock.calls[0][0];
    expect(callArgs.documentNumber).toMatch(/^INV-\d{8}-\d{6}$/);
  });

  it('should default currency to VED', async () => {
    const inputWithoutCurrency: CreateDocumentInput = {
      documentType: DocumentType.SALES_INVOICE,
      lines: [{ description: 'Item', quantity: 1, unitPrice: 10, taxRate: 0 }],
    };
    mockRepo.create.mockResolvedValue({ id: 'doc-1' } as any);
    await useCase.execute(inputWithoutCurrency, mockContext);

    expect(mockRepo.create.mock.calls[0][0].currency).toBe('VED');
  });

  it('should handle multiple lines', async () => {
    const multiLineInput: CreateDocumentInput = {
      documentType: DocumentType.SALES_INVOICE,
      lines: [
        { description: 'Item 1', quantity: 2, unitPrice: 50, taxRate: 16 },
        { description: 'Item 2', quantity: 1, unitPrice: 200, taxRate: 16 },
      ],
    };
    mockRepo.create.mockResolvedValue({ id: 'doc-1' } as any);
    await useCase.execute(multiLineInput, mockContext);

    const callArgs = mockRepo.create.mock.calls[0][0];
    expect(callArgs.lines).toHaveLength(2);
    expect(callArgs.lines[0].lineNumber).toBe(1);
    expect(callArgs.lines[1].lineNumber).toBe(2);
  });

  it('should handle discount rates', async () => {
    const inputWithDiscount: CreateDocumentInput = {
      documentType: DocumentType.SALES_INVOICE,
      lines: [
        { description: 'Discounted item', quantity: 10, unitPrice: 100, taxRate: 16, discountRate: 10 },
      ],
    };
    mockRepo.create.mockResolvedValue({ id: 'doc-1' } as any);
    await useCase.execute(inputWithDiscount, mockContext);

    const callArgs = mockRepo.create.mock.calls[0][0];
    expect(callArgs.lines[0].discountRate).toBe(10);
    expect(callArgs.lines[0].discountAmount).toBe(100);
    expect(callArgs.discountTotal).toBe(100);
  });
});
