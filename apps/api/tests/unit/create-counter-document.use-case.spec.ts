import { CreateCounterDocumentUseCase, CreateCounterDocumentInput, CreateCounterDocumentContext } from '../../src/modules/document-engine/application/create-counter-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentStatus, DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('CreateCounterDocumentUseCase', () => {
  let useCase: CreateCounterDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;
  let mockEventRepo: jest.Mocked<DocumentEventRepository>;
  let mockEmitter: jest.Mocked<DocumentEventEmitter>;
  let stateMachine: DocumentStateMachine;

  const mockContext: CreateCounterDocumentContext = {
    tenantId: 'tenant-1',
    userId: 'user-2',
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

  const mockInput: CreateCounterDocumentInput = {
    counterDocumentType: 'credit_note',
    reason: 'Price correction',
    lines: [
      { description: 'Correction', quantity: 1, unitPrice: -50, taxRate: 16 },
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
    };
    mockEventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    mockEmitter = {
      emit: jest.fn(),
    } as any;
    stateMachine = new DocumentStateMachine();
    useCase = new CreateCounterDocumentUseCase(mockRepo, stateMachine, mockEventRepo, mockEmitter);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a counter-document for an approved document', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    mockRepo.create.mockResolvedValue({ id: 'counter-1', documentNumber: 'CN-20260619-000001' } as any);
    mockRepo.updateCounterDocument.mockResolvedValue({} as any);

    const result = await useCase.execute('doc-1', mockInput, mockContext);

    expect(mockRepo.findById).toHaveBeenCalledWith('doc-1', 'tenant-1');
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateCounterDocument).toHaveBeenCalledWith(
      'counter-1', 'tenant-1', 'doc-1', 'credit_note',
    );
    expect(mockEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'document.counter-created' }),
    );
    expect(mockEmitter.emit).toHaveBeenCalledWith('document.counter-created', expect.any(Object));
  });

  it('should throw if original document not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', mockInput, mockContext)).rejects.toThrow('Original document not found');
  });

  it('should throw if original document is not approved', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockApprovedDoc, status: DocumentStatus.DRAFT } as any);
    await expect(useCase.execute('doc-1', mockInput, mockContext)).rejects.toThrow(
      'Counter-documents can only reference approved documents',
    );
  });
});
