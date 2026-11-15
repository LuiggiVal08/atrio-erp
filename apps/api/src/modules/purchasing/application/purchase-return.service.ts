import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PurchasingRepository } from '../domain/purchasing.repository.interface';

@Injectable()
export class PurchaseReturnService {
  constructor(
    @Inject('PurchasingRepository') private readonly repo: PurchasingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findReturnsByTenant(tenantId);
  }

  async findById(id: string, tenantId?: string) {
    const ret = await this.repo.findReturnById(id);
    if (!ret || (tenantId && ret.tenantId !== tenantId)) throw new NotFoundException('Purchase return not found');
    return ret;
  }

  async updateStatus(id: string, status: string, tenantId?: string, userId?: string) {
    const ret = await this.findById(id, tenantId);
    if (ret.status === status) return ret;
    // approved is the existing UI's Procesar action; completion is bookkeeping only.
    const transitions: Record<string, string[]> = {
      draft: ['approved', 'rejected', 'cancelled'], pending: ['approved', 'rejected', 'cancelled'], approved: ['completed'],
    };
    if (!transitions[ret.status]?.includes(status)) throw new BadRequestException('Invalid purchase return transition');
    const lines = ret.lines as Array<{ productId: string; warehouseId: string; quantity: number }>;
    if (status === 'approved') await this.repo.validateReturnLines(ret.tenantId, lines);
    const updated = await this.repo.transitionReturnStatus(id, ret.tenantId, ret.status, status);
    if (!updated) throw new ConflictException('Purchase return status changed');
    if (status === 'approved') {
      this.eventEmitter.emit('document.returned', {
        eventType: 'document.returned', tenantId: ret.tenantId, documentId: ret.id, documentType: 'purchase_return',
        timestamp: new Date().toISOString(), triggeredBy: userId ?? ret.userId ?? null,
        metadata: { operationId: ret.id, purchaseOrderId: ret.purchaseOrderId,
          lines: lines.map((line, index) => ({ ...line, lineId: String(index) })),
          reasonCode: ret.reasonCode, resolution: ret.resolution, supplierCreditNo: ret.supplierCreditNo },
      });
    }
    return updated;
  }

  async delete(id: string, tenantId?: string) {
    const ret = await this.findById(id, tenantId);
    if (!['draft', 'pending'].includes(ret.status)) throw new BadRequestException('Cannot delete processed purchase returns');
    await this.repo.deleteReturn(id);
  }
}
