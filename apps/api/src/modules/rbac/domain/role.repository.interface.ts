import { Role, RoleWithPermissions, UserRole } from './role.entity';

export interface CreateRoleData {
  tenantId: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

export interface RoleRepository {
  create(data: CreateRoleData): Promise<RoleWithPermissions>;
  findById(id: string): Promise<RoleWithPermissions | null>;
  findByTenant(tenantId: string): Promise<RoleWithPermissions[]>;
  findByName(tenantId: string, name: string): Promise<Role | null>;
  update(id: string, data: UpdateRoleData): Promise<Role>;
  remove(id: string): Promise<Role>;
  assignToUser(roleId: string, userId: string): Promise<UserRole>;
  removeFromUser(roleId: string, userId: string): Promise<void>;
}
