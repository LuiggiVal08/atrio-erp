import { TransitionDocumentUseCase, TransitionDocumentContext } from '../../src/modules/document-engine/application/transition-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentStatus, DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('TransitionDocumentUseCase', () => {
  let useCase: TransitionDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;
  let mockEventRepo: jest.Mocked<DocumentEventRepository>;
  let mockEmitter: jest.Mocked<DocumentEventEmitter>;
  let stateMachine: DocumentStateMachine;

  const mockContext: TransitionDocumentContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
  };

  const mockApprovedDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.APPROVED,
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
    useCase = new TransitionDocumentUseCase(mockRepo, stateMachine, mockEventRepo, mockEmitter);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should transition approved → delivered', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    mockRepo.updateStatus.mockResolvedValue({ ...mockApprovedDoc, status: DocumentStatus.DELIVERED } as any);

    const result = await useCase.execute('doc-1', DocumentStatus.DELIVERED, mockContext);

    expect(mockRepo.updateStatus).toHaveBeenCalledWith('doc-1', 'tenant-1', DocumentStatus.DELIVERED);
    expect(mockEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'document.deliver' }),
    );
    expect(mockEmitter.emit).toHaveBeenCalled();
    expect(result.status).toBe(DocumentStatus.DELIVERED);
  });

  it('should transition approved → paid', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    mockRepo.updateStatus.mockResolvedValue({ ...mockApprovedDoc, status: DocumentStatus.PAID } as any);

    const result = await useCase.execute('doc-1', DocumentStatus.PAID, mockContext);

    expect(mockRepo.updateStatus).toHaveBeenCalledWith('doc-1', 'tenant-1', DocumentStatus.PAID);
    expect(result.status).toBe(DocumentStatus.PAID);
  });

  it('should throw for invalid transition', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    await expect(
      useCase.execute('doc-1', DocumentStatus.PENDING_APPROVAL, mockContext),
    ).rejects.toThrow();
  });

  it('should throw if document not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', DocumentStatus.DELIVERED, mockContext),
    ).rejects.toThrow('Document not found');
  });
});
