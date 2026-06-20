import { TenantRepository } from '../domain/tenant.repository.interface';

export class GetTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async findById(id: string) {
    return this.tenantRepository.findById(id);
  }

  async findAll() {
    return this.tenantRepository.findAll();
  }
}
