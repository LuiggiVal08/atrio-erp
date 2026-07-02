import { ModuleEnabledGuard } from '../../../src/common/guards/module-enabled.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

describe('ModuleEnabledGuard', () => {
  let guard: ModuleEnabledGuard;
  let reflector: Reflector;

  const mockContext = (user: any, modules?: string[]) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        user: { ...user, enabledModules: user?.enabledModules || [] },
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ModuleEnabledGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no modules required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const result = guard.canActivate(mockContext({ id: 'user-1', enabledModules: ['sales'] }));
    expect(result).toBe(true);
  });

  it('should allow access when user has required module enabled', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['sales']);
    const result = guard.canActivate(
      mockContext({ id: 'user-1', enabledModules: ['sales', 'inventory'] }),
    );
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required module', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['inventory']);
    expect(() =>
      guard.canActivate(mockContext({ id: 'user-1', enabledModules: ['sales'] })),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no enabledModules', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['sales']);
    expect(() =>
      guard.canActivate(mockContext({ id: 'user-1', enabledModules: [] })),
    ).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['sales']);
    expect(() =>
      guard.canActivate(mockContext(null)),
    ).toThrow(ForbiddenException);
  });
});
