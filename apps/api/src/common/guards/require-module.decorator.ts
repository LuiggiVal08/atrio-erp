import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'module';
export const RequireModule = (...modules: string[]) =>
  SetMetadata(MODULE_KEY, modules);
