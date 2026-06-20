import { PermissionRepository } from '../domain/permission.repository.interface';

export class ListPermissionsUseCase {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async execute() {
    return this.permissionRepository.findAll();
  }
}
