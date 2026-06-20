import { SubmitDocumentUseCase, SubmitDocumentContext } from '../../src/modules/document-engine/application/submit-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentStatus, DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('SubmitDocumentUseCase', () => {
  let useCase: SubmitDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;
  let stateMachine: DocumentStateMachine;

  const mockContext: SubmitDocumentContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
  };

  const mockDraftDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.DRAFT,
    documentNumber: 'INV-20260619-000001',
    currency: 'VED',
    subtotal: 500,
    taxTotal: 80,
    grandTotal: 580,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    };
    stateMachine = new DocumentStateMachine();
    useCase = new SubmitDocumentUseCase(mockRepo, stateMachine);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should submit a draft document', async () => {
    mockRepo.findById.mockResolvedValue(mockDraftDoc as any);
    mockRepo.updateStatus.mockResolvedValue({ ...mockDraftDoc, status: DocumentStatus.PENDING_APPROVAL } as any);

    const result = await useCase.execute('doc-1', mockContext);

    expect(mockRepo.findById).toHaveBeenCalledWith('doc-1', 'tenant-1');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      'doc-1', 'tenant-1', DocumentStatus.PENDING_APPROVAL,
    );
    expect(result.status).toBe(DocumentStatus.PENDING_APPROVAL);
  });

  it('should throw if document not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', mockContext)).rejects.toThrow('Document not found');
  });

  it('should throw if document is already approved', async () => {
    const approvedDoc = { ...mockDraftDoc, status: DocumentStatus.APPROVED };
    mockRepo.findById.mockResolvedValue(approvedDoc as any);
    await expect(useCase.execute('doc-1', mockContext)).rejects.toThrow();
  });
});
