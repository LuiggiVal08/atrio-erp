import { TransitionDocumentUseCase } from '../../../src/modules/document-engine/application/transition-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentStateMachine } from '../../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('TransitionDocumentUseCase', () => {
  let useCase: TransitionDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;
  let eventRepo: jest.Mocked<DocumentEventRepository>;
  let stateMachine: DocumentStateMachine;
  let eventEmitter: jest.Mocked<DocumentEventEmitter>;
  let prisma: any;

  const baseDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
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
    stateMachine = new DocumentStateMachine();
    eventEmitter = { emit: jest.fn() } as any;
    prisma = {
      $transaction: jest.fn(),
    };
    useCase = new TransitionDocumentUseCase(repository, stateMachine, eventRepo, eventEmitter, prisma);
  });

  it('should transition from approved to delivered', async () => {
    repository.findById.mockResolvedValue({ ...baseDoc, status: DocumentStatus.APPROVED });
    prisma.$transaction.mockImplementation((promises: Promise<any>[]) => Promise.all(promises));
    prisma.document = {
      update: jest.fn().mockResolvedValue({ ...baseDoc, status: DocumentStatus.DELIVERED, lines: [] }),
    };
    prisma.documentEvent = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await useCase.execute('doc-1', DocumentStatus.DELIVERED, { tenantId: 'tenant-1', userId: 'user-1' });

    expect(result.status).toBe(DocumentStatus.DELIVERED);
    expect(prisma.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'document.deliver' }) }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'document.deliver',
      expect.any(Object),
    );
  });

  it('should persist rejection reason on reject', async () => {
    repository.findById.mockResolvedValue({ ...baseDoc, status: DocumentStatus.PENDING_APPROVAL });
    prisma.$transaction.mockImplementation((promises: Promise<any>[]) => Promise.all(promises));
    prisma.document = {
      update: jest.fn().mockResolvedValue({ ...baseDoc, status: DocumentStatus.DRAFT, rejectionReason: 'Missing items', lines: [] }),
    };
    prisma.documentEvent = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await useCase.execute(
      'doc-1',
      DocumentStatus.DRAFT,
      { tenantId: 'tenant-1', userId: 'user-1' },
      { rejectionReason: 'Missing items' },
    );

    expect(result.rejectionReason).toBe('Missing items');
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rejectionReason: 'Missing items' }),
      }),
    );
    expect(prisma.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payload: expect.objectContaining({ rejectionReason: 'Missing items' }),
        }),
      }),
    );
  });

  it('should throw for invalid transition', async () => {
    repository.findById.mockResolvedValue({ ...baseDoc, status: DocumentStatus.DRAFT });

    await expect(
      useCase.execute('doc-1', DocumentStatus.DELIVERED, { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it('should throw when document not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('doc-1', DocumentStatus.APPROVED, { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Document not found');
  });
});
