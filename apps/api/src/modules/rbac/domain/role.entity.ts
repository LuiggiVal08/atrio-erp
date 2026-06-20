import { Permission } from './permission.entity';

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: Array<{
    permission: Permission;
  }>;
}

export interface UserRole {
  userId: string;
  roleId: string;
  createdAt: Date;
}
