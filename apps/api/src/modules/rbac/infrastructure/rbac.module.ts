import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { CreateRoleUseCase } from '../application/create-role.use-case';
import { ManageRoleUseCase } from '../application/manage-role.use-case';
import { ListPermissionsUseCase } from '../application/list-permissions.use-case';
import { PrismaRoleRepository } from './prisma-role.repository';
import { PrismaPermissionRepository } from './prisma-permission.repository';

export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';
export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';

@Module({
  controllers: [RoleController],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    {
      provide: CreateRoleUseCase,
      useFactory: (roleRepo: any, permRepo: any) => new CreateRoleUseCase(roleRepo, permRepo),
      inject: [ROLE_REPOSITORY, PERMISSION_REPOSITORY],
    },
    {
      provide: ManageRoleUseCase,
      useFactory: (roleRepo: any) => new ManageRoleUseCase(roleRepo),
      inject: [ROLE_REPOSITORY],
    },
    {
      provide: ListPermissionsUseCase,
      useFactory: (permRepo: any) => new ListPermissionsUseCase(permRepo),
      inject: [PERMISSION_REPOSITORY],
    },
  ],
  exports: [],
})
export class RbacModule {}
