import { ApproveDocumentUseCase } from '../../../src/modules/document-engine/application/approve-document.use-case';
import { DocumentRepository } from '../../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentStateMachine } from '../../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentType, DocumentStatus } from '../../../src/modules/document-engine/domain/document.entity';

describe('ApproveDocumentUseCase', () => {
  let useCase: ApproveDocumentUseCase;
  let repository: jest.Mocked<DocumentRepository>;
  let stateMachine: DocumentStateMachine;
  let eventEmitter: jest.Mocked<DocumentEventEmitter>;
  let prisma: any;

  const mockDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    documentType: DocumentType.SALES_INVOICE,
    status: DocumentStatus.PENDING_APPROVAL,
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

  const updatedDoc = {
    ...mockDoc,
    status: DocumentStatus.APPROVED,
    approvedById: 'user-1',
    approvedAt: new Date(),
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
    eventEmitter = { emit: jest.fn() } as any;
    prisma = {
      $transaction: jest.fn(),
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ baseCurrency: 'VED' }),
      },
      document: {
        update: jest.fn(),
      },
      documentEvent: {
        create: jest.fn(),
      },
    };

    useCase = new ApproveDocumentUseCase(repository, stateMachine, eventEmitter, prisma);
  });

  it('should approve a pending document', async () => {
    repository.findById.mockResolvedValue(mockDoc);
    prisma.$transaction.mockImplementation((promises: Promise<any>[]) => Promise.all(promises));
    prisma.document = {
      update: jest.fn().mockResolvedValue(updatedDoc),
    };
    prisma.documentEvent = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' });

    expect(result.status).toBe(DocumentStatus.APPROVED);
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'doc-1' }),
        data: expect.objectContaining({ status: DocumentStatus.APPROVED }),
      }),
    );
    expect(prisma.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ eventType: 'document.approved' }) }),
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'document.approved',
      expect.objectContaining({ eventType: 'document.approved' }),
    );
  });

  it('should throw when document not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Document not found');
  });

  it('should throw when transition is invalid', async () => {
    repository.findById.mockResolvedValue({ ...mockDoc, status: DocumentStatus.DRAFT });

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it('should throw on concurrent approval', async () => {
    repository.findById.mockResolvedValue(mockDoc);
    prisma.$transaction.mockImplementation(() => {
      throw new Error('Concurrent modification detected');
    });

    await expect(
      useCase.execute('doc-1', { tenantId: 'tenant-1', userId: 'user-1' }),
    ).rejects.toThrow('Concurrent modification detected');
  });
});
