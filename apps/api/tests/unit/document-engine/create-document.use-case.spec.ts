import { CreateDocumentUseCase } from '../../../src/modules/document-engine/application/create-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('CreateDocumentUseCase', () => {
  let useCase: CreateDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithLines: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      updateCounterDocument: jest.fn(),
      softDelete: jest.fn(),
      getNextSequence: jest.fn().mockResolvedValue(1),
    };
    useCase = new CreateDocumentUseCase(repository);
  });

  it('should create a document with calculated totals', async () => {
    const mockDoc = {
      id: 'doc-1',
      tenantId: 'tenant-1',
      documentType: DocumentType.SALES_INVOICE,
      status: DocumentStatus.DRAFT,
      documentNumber: 'INV-20260619-000001',
      currency: 'VED',
      subtotal: 1500,
      taxTotal: 240,
      discountTotal: 0,
      grandTotal: 1740,
      notes: null,
      rejectionReason: null,
      originalDocumentId: null,
      counterDocumentType: null,
      exchangeRate: null,
      createdById: 'user-1',
      approvedById: null,
      approvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    repository.create.mockResolvedValue(mockDoc);

    const result = await useCase.execute(
      {
        documentType: DocumentType.SALES_INVOICE,
        currency: 'VED',
        lines: [
          { description: 'Widget A', quantity: 10, unitPrice: 150, taxRate: 16, discountRate: 0 },
        ],
      },
      { tenantId: 'tenant-1', userId: 'user-1' },
    );

    expect(result).toEqual(mockDoc);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        documentType: DocumentType.SALES_INVOICE,
        subtotal: 1500,
        taxTotal: 240,
        grandTotal: 1740,
      }),
    );
  });

  it('should throw if repository fails', async () => {
    repository.create.mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute(
        {
          documentType: DocumentType.SALES_INVOICE,
          lines: [
            { description: 'Item', quantity: 1, unitPrice: 100, taxRate: 0 },
          ],
        },
        { tenantId: 't1', userId: 'u1' },
      ),
    ).rejects.toThrow('DB error');
  });
});
