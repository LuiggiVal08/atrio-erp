import { DocumentRepository } from '../domain/document.repository.interface';
import { DocumentStateMachine } from '../domain/document-state-machine';
import { DocumentStatus } from '../domain/document.entity';

export interface SubmitDocumentContext {
  tenantId: string;
  userId: string;
}

export class SubmitDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly stateMachine: DocumentStateMachine,
  ) {}

  async execute(documentId: string, ctx: SubmitDocumentContext) {
    const doc = await this.documentRepository.findById(documentId, ctx.tenantId);
    if (!doc) {
      throw new Error('Document not found');
    }

    if (!doc.grandTotal || doc.grandTotal <= 0) {
      throw new Error('Cannot submit a document with zero or negative total');
    }

    this.stateMachine.transition(doc.status, DocumentStatus.PENDING_APPROVAL);

    return this.documentRepository.updateStatus(
      documentId,
      ctx.tenantId,
      DocumentStatus.PENDING_APPROVAL,
    );
  }
}
