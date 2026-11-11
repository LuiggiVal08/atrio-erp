import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { ManagePositionUseCase } from '../application/manage-position.use-case';
import { PrismaPositionRepository } from './prisma-position.repository';

export const POSITION_REPOSITORY = 'POSITION_REPOSITORY';

@Module({
  controllers: [OrganizationController],
  providers: [
    { provide: POSITION_REPOSITORY, useClass: PrismaPositionRepository },
    {
      provide: ManagePositionUseCase,
      useFactory: (repo: any) => new ManagePositionUseCase(repo),
      inject: [POSITION_REPOSITORY],
    },
  ],
  exports: [],
})
export class OrganizationModule {}
