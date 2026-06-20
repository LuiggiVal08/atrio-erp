import { RoleRepository, UpdateRoleData } from '../domain/role.repository.interface';

export class ManageRoleUseCase {
  constructor(private readonly roleRepository: RoleRepository) {}

  async findById(id: string) {
    return this.roleRepository.findById(id);
  }

  async findByTenant(tenantId: string) {
    return this.roleRepository.findByTenant(tenantId);
  }

  async update(id: string, dto: UpdateRoleData) {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot edit system role');
    return this.roleRepository.update(id, dto);
  }

  async remove(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new Error('Cannot delete system role');
    return this.roleRepository.remove(id);
  }

  async assignToUser(roleId: string, userId: string) {
    return this.roleRepository.assignToUser(roleId, userId);
  }

  async removeFromUser(roleId: string, userId: string) {
    return this.roleRepository.removeFromUser(roleId, userId);
  }
}
