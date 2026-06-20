import { CreateCounterDocumentUseCase } from '../../../src/modules/document-engine/application/create-counter-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentEventRepository } from '../../../src/modules/document-engine/domain/document-event.repository.interface';
import { DocumentStateMachine } from '../../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('CreateCounterDocumentUseCase', () => {
  let useCase: CreateCounterDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;
  let eventRepo: jest.Mocked<DocumentEventRepository>;
  let stateMachine: DocumentStateMachine;
  let eventEmitter: jest.Mocked<DocumentEventEmitter>;
  let prisma: any;

  const approvedDoc = {
    id: 'original-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.APPROVED,
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
    approvedById: 'user-2',
    approvedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const createdDoc = {
    ...approvedDoc,
    id: 'counter-1',
    status: DocumentStatus.DRAFT,
    documentNumber: 'CN-20260619-000001',
    subtotal: -50,
    taxTotal: 0,
    grandTotal: -50,
    lines: [],
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
      getNextSequence: jest.fn().mockResolvedValue(1),
    };
    eventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    stateMachine = new DocumentStateMachine();
    eventEmitter = { emit: jest.fn() } as any;
    prisma = {
      $transaction: jest.fn(),
      documentEvent: {
        create: jest.fn(),
      },
    };
    useCase = new CreateCounterDocumentUseCase(repository, stateMachine, eventRepo, eventEmitter, prisma);
  });

  it('should create a counter-document for an approved document', async () => {
    repository.findById.mockResolvedValue(approvedDoc);
    const tx = {
      document: {
        create: jest.fn().mockResolvedValue(createdDoc),
      },
      documentEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(tx));

    const result = await useCase.execute(
      'original-1',
      {
        counterDocumentType: 'credit_note',
        reason: 'Price adjustment',
        lines: [{ description: 'Correction', quantity: 1, unitPrice: -50, taxRate: 0 }],
      },
      { tenantId: 'tenant-1', userId: 'user-1' },
    );

    expect(result.id).toBe('counter-1');
    expect(repository.findById).toHaveBeenCalledWith('original-1', 'tenant-1');
    expect(tx.document.create).toHaveBeenCalled();
    expect(tx.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'document.counter-created' }) }),
    );
  });

  it('should throw if original document is not approved', async () => {
    repository.findById.mockResolvedValue({ ...approvedDoc, status: DocumentStatus.DRAFT });

    await expect(
      useCase.execute(
        'original-1',
        { counterDocumentType: 'credit_note', lines: [{ description: 'Test', quantity: 1, unitPrice: 10, taxRate: 0 }] },
        { tenantId: 'tenant-1', userId: 'user-1' },
      ),
    ).rejects.toThrow('Counter-documents can only reference approved documents');
  });

  it('should throw if original document is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(
        'original-1',
        { counterDocumentType: 'credit_note', lines: [{ description: 'Test', quantity: 1, unitPrice: 10, taxRate: 0 }] },
        { tenantId: 'tenant-1', userId: 'user-1' },
      ),
    ).rejects.toThrow('Original document not found');
  });
});
