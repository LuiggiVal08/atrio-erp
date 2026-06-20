import { SubmitDocumentUseCase } from '../../../src/modules/document-engine/application/submit-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentStateMachine } from '../../../src/modules/document-engine/domain/document-state-machine';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('SubmitDocumentUseCase', () => {
  let useCase: SubmitDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;
  let stateMachine: DocumentStateMachine;

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
    stateMachine = new DocumentStateMachine();
    useCase = new SubmitDocumentUseCase(repository, stateMachine);
  });

  it('should submit a draft document successfully', async () => {
    repository.findById.mockResolvedValue(mockDoc);
    repository.updateStatus.mockResolvedValue({ ...mockDoc, status: DocumentStatus.PENDING_APPROVAL });

    const result = await useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' });

    expect(result.status).toBe(DocumentStatus.PENDING_APPROVAL);
    expect(repository.updateStatus).toHaveBeenCalledWith('doc-1', 'tenant-1', DocumentStatus.PENDING_APPROVAL);
  });

  it('should throw when document is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Document not found');
  });

  it('should throw when transition is invalid', async () => {
    repository.findById.mockResolvedValue({ ...mockDoc, status: DocumentStatus.APPROVED });

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it('should throw when document has zero total', async () => {
    repository.findById.mockResolvedValue({ ...mockDoc, grandTotal: 0 });

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Cannot submit a document with zero or negative total');
  });

  it('should throw when document has negative total', async () => {
    repository.findById.mockResolvedValue({ ...mockDoc, grandTotal: -50 });

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Cannot submit a document with zero or negative total');
  });
});
