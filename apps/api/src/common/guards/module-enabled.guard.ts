import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from './require-module.decorator';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const enabledModules: string[] = user.enabledModules || [];

    const hasAll = requiredModules.every((mod) => enabledModules.includes(mod));
    if (!hasAll) {
      throw new ForbiddenException(`Module(s) not enabled: ${requiredModules.join(', ')}`);
    }

    return true;
  }
}
