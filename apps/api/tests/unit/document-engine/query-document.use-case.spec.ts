import { QueryDocumentUseCase } from '../../../src/modules/document-engine/application/query-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('QueryDocumentUseCase', () => {
  let useCase: QueryDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;
  let eventRepo: jest.Mocked<DocumentEventRepository>;

  const mockDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.DRAFT,
    documentNumber: 'INV-000001',
    currency: 'VED',
    subtotal: 100,
    taxTotal: 16,
    discountTotal: 0,
    grandTotal: 116,
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

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithLines: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      updateCounterDocument: jest.fn(),
      softDelete: jest.fn(),
      getNextSequence: jest.fn(),
    };
    eventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    useCase = new QueryDocumentUseCase(repository, eventRepo);
  });

  it('should return paginated documents', async () => {
    repository.findAll.mockResolvedValue({
      data: [mockDoc],
      total: 1,
      page: 1,
      limit: 20,
    });

    const result = await useCase.execute('tenant-1', { status: DocumentStatus.DRAFT });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should find document by id with lines', async () => {
    repository.findByIdWithLines.mockResolvedValue({
      document: mockDoc,
      lines: [],
    });

    const result = await useCase.findById('doc-1', 'tenant-1');

    expect(result).toBeDefined();
    expect(result!.document.id).toBe('doc-1');
  });

  it('should soft delete a document', async () => {
    repository.softDelete.mockResolvedValue({ ...mockDoc, deletedAt: new Date() });

    const result = await useCase.softDelete('doc-1', 'tenant-1');

    expect(result.deletedAt).toBeDefined();
  });

  it('should get events for a document', async () => {
    eventRepo.findByDocumentId.mockResolvedValue([]);

    const result = await useCase.getEvents('doc-1', 'tenant-1');

    expect(result).toEqual([]);
    expect(eventRepo.findByDocumentId).toHaveBeenCalledWith('doc-1', 'tenant-1');
  });
});
