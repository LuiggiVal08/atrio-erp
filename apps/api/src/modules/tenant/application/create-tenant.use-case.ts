import { TenantRepository, CreateTenantData } from '../domain/tenant.repository.interface';

export class CreateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(dto: CreateTenantData) {
    return this.tenantRepository.create(dto);
  }
}
