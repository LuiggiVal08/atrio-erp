import { CreateRoleUseCase } from '../../src/modules/rbac/application/create-role.use-case';
import { ManageRoleUseCase } from '../../src/modules/rbac/application/manage-role.use-case';
import { RoleRepository } from '../../src/modules/rbac/domain/role.repository.interface';
import { PermissionRepository } from '../../src/modules/rbac/domain/permission.repository.interface';

describe('CreateRoleUseCase', () => {
  let createRoleUseCase: CreateRoleUseCase;
  let manageRoleUseCase: ManageRoleUseCase;

  const mockRoleRepo: RoleRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignToUser: jest.fn(),
    removeFromUser: jest.fn(),
  };

  const mockPermRepo: PermissionRepository = {
    findAll: jest.fn(),
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    createRoleUseCase = new CreateRoleUseCase(mockRoleRepo, mockPermRepo);
    manageRoleUseCase = new ManageRoleUseCase(mockRoleRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role with permissions', async () => {
      const dto = {
        tenantId: 'tenant-1',
        name: 'Auditor',
        description: 'Read-only access',
        permissionIds: ['perm-1'],
      };

      const mockPermissions = [{ id: 'perm-1', code: 'invoice.read' }];
      const mockRole = { id: 'role-1', tenantId: 'tenant-1', name: 'Auditor', description: 'Read-only access', isSystem: false };

      (mockRoleRepo.findByName as jest.Mock).mockResolvedValue(null);
      (mockPermRepo.findByIds as jest.Mock).mockResolvedValue(mockPermissions as any);
      (mockRoleRepo.create as jest.Mock).mockResolvedValue(mockRole);

      const result = await createRoleUseCase.execute(dto);
      expect(result).toEqual(mockRole);
    });
  });

  describe('findByTenant', () => {
    it('should return roles for a tenant', async () => {
      const roles = [{ id: 'role-1', name: 'Admin' }];
      (mockRoleRepo.findByTenant as jest.Mock).mockResolvedValue(roles);

      const result = await manageRoleUseCase.findByTenant('tenant-1');
      expect(result).toEqual(roles);
    });
  });
});
