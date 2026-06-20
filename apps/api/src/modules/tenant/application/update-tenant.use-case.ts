import { TenantRepository, UpdateTenantData } from '../domain/tenant.repository.interface';

export class UpdateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(id: string, dto: UpdateTenantData) {
    return this.tenantRepository.update(id, dto);
  }

  async suspend(id: string) {
    return this.tenantRepository.update(id, { status: 'suspended' });
  }

  async reactivate(id: string) {
    return this.tenantRepository.update(id, { status: 'active' });
  }
}
