import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { CreateTenantUseCase } from '../application/create-tenant.use-case';
import { GetTenantUseCase } from '../application/get-tenant.use-case';
import { UpdateTenantUseCase } from '../application/update-tenant.use-case';
import { PrismaTenantRepository } from './prisma-tenant.repository';

export const TENANT_REPOSITORY = 'TENANT_REPOSITORY';

@Module({
  controllers: [TenantController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    {
      provide: CreateTenantUseCase,
      useFactory: (repo: any) => new CreateTenantUseCase(repo),
      inject: [TENANT_REPOSITORY],
    },
    {
      provide: GetTenantUseCase,
      useFactory: (repo: any) => new GetTenantUseCase(repo),
      inject: [TENANT_REPOSITORY],
    },
    {
      provide: UpdateTenantUseCase,
      useFactory: (repo: any) => new UpdateTenantUseCase(repo),
      inject: [TENANT_REPOSITORY],
    },
  ],
  exports: [],
})
export class TenantModule {}
