import { ApproveDocumentUseCase, ApproveDocumentContext } from '../../src/modules/document-engine/application/approve-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentStatus, DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('ApproveDocumentUseCase', () => {
  let useCase: ApproveDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;
  let mockEventRepo: jest.Mocked<DocumentEventRepository>;
  let mockEmitter: jest.Mocked<DocumentEventEmitter>;
  let stateMachine: DocumentStateMachine;

  const mockContext: ApproveDocumentContext = {
    tenantId: 'tenant-1',
    userId: 'user-2',
  };

  const mockPendingDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.PENDING_APPROVAL,
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
    mockEventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    mockEmitter = {
      emit: jest.fn(),
    } as any;
    stateMachine = new DocumentStateMachine();
    useCase = new ApproveDocumentUseCase(mockRepo, stateMachine, mockEventRepo, mockEmitter);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should approve a pending document', async () => {
    mockRepo.findById.mockResolvedValue(mockPendingDoc as any);
    mockRepo.updateStatus.mockResolvedValue({ ...mockPendingDoc, status: DocumentStatus.APPROVED, approvedById: 'user-2' } as any);

    const result = await useCase.execute('doc-1', mockContext);

    expect(mockRepo.findById).toHaveBeenCalledWith('doc-1', 'tenant-1');
    expect(mockRepo.updateStatus).toHaveBeenCalledWith(
      'doc-1', 'tenant-1', DocumentStatus.APPROVED,
      expect.objectContaining({ approvedById: 'user-2', approvedAt: expect.any(Date) }),
    );
    expect(mockEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-1',
        eventType: 'document.approved',
        newStatus: DocumentStatus.APPROVED,
      }),
    );
    expect(mockEmitter.emit).toHaveBeenCalledWith('document.approved', expect.any(Object));
    expect(result.status).toBe(DocumentStatus.APPROVED);
  });

  it('should throw if document not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', mockContext)).rejects.toThrow('Document not found');
  });

  it('should throw if document is not in pending_approval status', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockPendingDoc, status: DocumentStatus.DRAFT } as any);
    await expect(useCase.execute('doc-1', mockContext)).rejects.toThrow();
  });
});
