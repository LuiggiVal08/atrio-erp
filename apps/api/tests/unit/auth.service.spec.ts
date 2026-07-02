import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from '../../src/modules/auth/application/login.use-case';
import { LogoutUseCase } from '../../src/modules/auth/application/logout.use-case';
import { AuthRepository, UserCredentials } from '../../src/modules/auth/domain/auth.repository.interface';
import * as bcrypt from 'bcrypt';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let logoutUseCase: LogoutUseCase;

  const mockAuthRepo: AuthRepository = {
    findUserByEmail: jest.fn(),
    updateLoginAttempts: jest.fn(),
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ enabledModules: [] }),
    },
  };

  const mockBlacklist = {
    blacklist: jest.fn(),
  };

  beforeEach(async () => {
    loginUseCase = new LoginUseCase(mockAuthRepo, mockPrisma as any);
    logoutUseCase = new LogoutUseCase(mockBlacklist);
    jest.clearAllMocks();
  });

  describe('login', () => {
    const dto = { email: 'admin@acme.com', password: 'Pass123!', tenantId: 'tenant-1' };

    it('should return user data on valid credentials', async () => {
      const hash = await bcrypt.hash('Pass123!', 10);
      const mockUser: any = {
        id: 'user-1',
        email: dto.email,
        passwordHash: hash,
        name: 'Admin',
        status: 'active',
        tenantId: dto.tenantId,
        locale: 'es',
        failedLoginAttempts: 0,
        lockedUntil: null,
        deletedAt: null,
      };

      (mockAuthRepo.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await loginUseCase.execute(dto);
      expect(result.user.email).toBe(dto.email);
      expect(result.jti).toBeDefined();
    });

    it('should throw on invalid password', async () => {
      const hash = await bcrypt.hash('WrongPass', 10);
      (mockAuthRepo.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: hash,
        status: 'active',
        tenantId: dto.tenantId,
        locale: 'es',
        failedLoginAttempts: 0,
        lockedUntil: null,
        deletedAt: null,
      } as any);

      await expect(loginUseCase.execute(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw if user not found', async () => {
      (mockAuthRepo.findUserByEmail as jest.Mock).mockResolvedValue(null);
      await expect(loginUseCase.execute(dto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw if account is locked', async () => {
      (mockAuthRepo.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        passwordHash: 'hash',
        status: 'blocked',
        tenantId: dto.tenantId,
        locale: 'es',
        lockedUntil: new Date(Date.now() + 3600000),
        failedLoginAttempts: 5,
        deletedAt: null,
      } as any);

      await expect(loginUseCase.execute(dto)).rejects.toThrow('Account temporarily locked');
    });
  });

  describe('logout', () => {
    it('should blacklist token', async () => {
      await logoutUseCase.execute({ sub: 'user-1', jti: 'jti-1' }, 900);
      expect(mockBlacklist.blacklist).toHaveBeenCalledWith('jti-1', 900);
    });
  });
});
