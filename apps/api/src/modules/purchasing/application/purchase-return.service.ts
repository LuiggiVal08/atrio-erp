import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PurchasingRepository } from '../domain/purchasing.repository.interface';

@Injectable()
export class PurchaseReturnService {
  constructor(
    @Inject('PurchasingRepository') private readonly repo: PurchasingRepository,
  ) {}

  async findAll(tenantId: string) {
    return this.repo.findReturnsByTenant(tenantId);
  }

  async findById(id: string) {
    const ret = await this.repo.findReturnById(id);
    if (!ret) throw new NotFoundException('Purchase return not found');
    return ret;
  }

  async updateStatus(id: string, status: string) {
    const ret = await this.repo.findReturnById(id);
    if (!ret) throw new NotFoundException('Purchase return not found');
    return this.repo.updateReturnStatus(id, status);
  }

  async delete(id: string) {
    const ret = await this.repo.findReturnById(id);
    if (!ret) throw new NotFoundException('Purchase return not found');
    await this.repo.deleteReturn(id);
  }
}
