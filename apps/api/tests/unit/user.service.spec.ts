import { ManageUserUseCase } from '../../src/modules/user/application/manage-user.use-case';
import { UserRepository } from '../../src/modules/user/domain/user.repository.interface';

describe('ManageUserUseCase', () => {
  let manageUserUseCase: ManageUserUseCase;

  const mockUserRepo: UserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    manageUserUseCase = new ManageUserUseCase(mockUserRepo);
    jest.clearAllMocks();
  });

  describe('linkEmployee', () => {
    it('should link an employee to a user', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue({ id: 'user-1', deletedAt: null });
      (mockUserRepo.update as jest.Mock).mockResolvedValue({ id: 'user-1', employeeId: 'emp-1' });

      const result = await manageUserUseCase.linkEmployee('user-1', 'emp-1');
      expect(result.employeeId).toBe('emp-1');
    });
  });

  describe('unlinkEmployee', () => {
    it('should unlink employee from user', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue({ id: 'user-1', deletedAt: null });
      (mockUserRepo.update as jest.Mock).mockResolvedValue({ id: 'user-1', employeeId: null });

      const result = await manageUserUseCase.unlinkEmployee('user-1');
      expect(result.employeeId).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user without affecting employee', async () => {
      (mockUserRepo.findById as jest.Mock).mockResolvedValue({ id: 'user-1', employeeId: 'emp-1', deletedAt: null });
      (mockUserRepo.update as jest.Mock).mockResolvedValue({ id: 'user-1', deletedAt: new Date(), status: 'inactive', employeeId: 'emp-1' });

      const result = await manageUserUseCase.softDelete('user-1');
      expect(result.deletedAt).toBeDefined();
    });
  });
});
