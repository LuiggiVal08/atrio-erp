import { RoleRepository, CreateRoleData } from '../domain/role.repository.interface';
import { PermissionRepository } from '../domain/permission.repository.interface';

export class CreateRoleUseCase {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(dto: CreateRoleData) {
    const existing = await this.roleRepository.findByName(dto.tenantId, dto.name);
    if (existing) {
      throw new Error('Role name already exists in this tenant');
    }

    const permissions = await this.permissionRepository.findByIds(dto.permissionIds);

    return this.roleRepository.create(dto);
  }
}
