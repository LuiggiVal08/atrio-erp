import { PrismaService } from '@/infrastructure/database/prisma.service';
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
  let mockPrisma: jest.Mocked<PrismaService>;
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

  const mockCounterDoc = {
    id: 'counter-1',
    documentNumber: 'CN-20260619-000001',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    currency: 'VED',
    status: DocumentStatus.DRAFT,
    subtotal: -50,
    taxTotal: -8,
    grandTotal: -58,
    createdById: 'user-2',
    lines: [],
    originalDocumentId: 'doc-1',
    counterDocumentType: 'credit_note',
  };

  const mockTx = {
    document: {
      create: jest.fn().mockResolvedValue(mockCounterDoc),
    },
    documentEvent: {
      create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
    },
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
    mockEventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    mockEmitter = {
      emit: jest.fn(),
    } as any;
    mockPrisma = {
      $transaction: jest.fn((cb: Function) => cb(mockTx)),
    } as any;
    stateMachine = new DocumentStateMachine();
    useCase = new CreateCounterDocumentUseCase(mockRepo, stateMachine, mockEventRepo, mockEmitter, mockPrisma);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a counter-document for an approved document', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);

    const result = await useCase.execute('doc-1', mockInput, mockContext);

    expect(mockRepo.findById).toHaveBeenCalledWith('doc-1', 'tenant-1');
    expect(mockTx.document.create).toHaveBeenCalledTimes(1);
    expect(mockTx.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          originalDocumentId: 'doc-1',
          counterDocumentType: 'credit_note',
        }),
      }),
    );
    expect(mockTx.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: 'document.counter-created' }),
      }),
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
