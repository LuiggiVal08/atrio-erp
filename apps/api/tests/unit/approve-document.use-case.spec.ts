import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ApproveDocumentUseCase, ApproveDocumentContext } from '../../src/modules/document-engine/application/approve-document.use-case';
import { DocumentRepository } from '../../src/modules/document-engine/domain/document.repository.interface';
import { DocumentStateMachine } from '../../src/modules/document-engine/domain/document-state-machine';
import { DocumentEventEmitter } from '../../src/modules/document-engine/infrastructure/document-event-emitter';
import { DocumentStatus, DocumentType } from '../../src/modules/document-engine/domain/document.entity';

describe('ApproveDocumentUseCase', () => {
  let useCase: ApproveDocumentUseCase;
  let mockRepo: jest.Mocked<DocumentRepository>;
  let mockEmitter: jest.Mocked<DocumentEventEmitter>;
  let mockPrisma: jest.Mocked<PrismaService>;
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
    lines: [],
  };

  const mockApprovedDoc = {
    ...mockPendingDoc,
    status: DocumentStatus.APPROVED,
    approvedById: 'user-2',
    approvedAt: new Date(),
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
    mockEmitter = {
      emit: jest.fn(),
    } as any;
    mockPrisma = {
      $transaction: jest.fn((promises: Promise<any>[]) => Promise.all(promises)),
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ baseCurrency: 'VED' }),
      },
      document: {
        update: jest.fn().mockResolvedValue(mockApprovedDoc),
      },
      documentEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
    } as any;
    stateMachine = new DocumentStateMachine();
    useCase = new ApproveDocumentUseCase(mockRepo, stateMachine, mockEmitter, mockPrisma);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should approve a pending document', async () => {
    mockRepo.findById.mockResolvedValue(mockPendingDoc as any);

    const result = await useCase.execute('doc-1', mockContext);

    expect(mockRepo.findById).toHaveBeenCalledWith('doc-1', 'tenant-1');
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', tenantId: 'tenant-1', status: DocumentStatus.PENDING_APPROVAL },
        data: expect.objectContaining({ status: DocumentStatus.APPROVED }),
      }),
    );
    expect(mockPrisma.documentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentId: 'doc-1',
          eventType: 'document.approved',
          newStatus: DocumentStatus.APPROVED,
        }),
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
