import { Permission } from './permission.entity';

export interface PermissionRepository {
  findAll(): Promise<Permission[]>;
  findByIds(ids: string[]): Promise<Permission[]>;
}
