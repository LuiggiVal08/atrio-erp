import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { LocalizationRepository } from '../domain/localization.repository.interface';

@Injectable()
export class LocalizationTaxService {
  constructor(@Inject('LocalizationRepository') private readonly repo: LocalizationRepository) {}

  async create(data: { tenantId: string; name: string; rate: number; type: 'percentage' | 'fixed' }) {
    return this.repo.createTax(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findAllTaxes(tenantId);
  }

  async findById(id: string) {
    const tax = await this.repo.findTaxById(id);
    if (!tax) throw new NotFoundException('Tax not found');
    return tax;
  }

  async update(id: string, data: any) {
    const existing = await this.repo.findTaxById(id);
    if (!existing) throw new NotFoundException('Tax not found');
    return this.repo.updateTax(id, data);
  }

  async delete(id: string) {
    const existing = await this.repo.findTaxById(id);
    if (!existing) throw new NotFoundException('Tax not found');
    return this.repo.deleteTax(id);
  }
}
