import { PrismaService } from '@/infrastructure/database/prisma.service';
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
  let mockPrisma: jest.Mocked<PrismaService>;
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
    lines: [],
  };

  const mockDeliveredDoc = {
    ...mockApprovedDoc,
    status: DocumentStatus.DELIVERED,
    lines: [],
  };

  const mockPaidDoc = {
    ...mockApprovedDoc,
    status: DocumentStatus.PAID,
    lines: [],
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
      getNextSequence: jest.fn(),
    };
    mockEventRepo = {
      create: jest.fn(),
      findByDocumentId: jest.fn(),
    };
    mockEmitter = {
      emit: jest.fn(),
    } as any;
    mockPrisma = {
      $transaction: jest.fn((promises: Promise<any>[]) => Promise.all(promises)),
      document: {
        update: jest.fn(),
      },
      documentEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
    } as any;
    stateMachine = new DocumentStateMachine();
    useCase = new TransitionDocumentUseCase(mockRepo, stateMachine, mockEventRepo, mockEmitter, mockPrisma);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should transition approved → delivered', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    (mockPrisma.document.update as jest.Mock).mockResolvedValue(mockDeliveredDoc);

    const result = await useCase.execute('doc-1', DocumentStatus.DELIVERED, mockContext);

    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', tenantId: 'tenant-1' },
        data: { status: DocumentStatus.DELIVERED },
      }),
    );
    expect(mockPrisma.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ eventType: expect.stringMatching(/^document\./) }),
      }),
    );
    expect(mockEmitter.emit).toHaveBeenCalled();
    expect(result.status).toBe(DocumentStatus.DELIVERED);
  });

  it('should transition approved → paid', async () => {
    mockRepo.findById.mockResolvedValue(mockApprovedDoc as any);
    (mockPrisma.document.update as jest.Mock).mockResolvedValue(mockPaidDoc);

    const result = await useCase.execute('doc-1', DocumentStatus.PAID, mockContext);

    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', tenantId: 'tenant-1' },
        data: { status: DocumentStatus.PAID },
      }),
    );
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
