import { Module } from '@nestjs/common';
import { PARTNER_REPOSITORY } from '../domain/partner.repository.interface';
import { PrismaPartnerRepository } from './prisma-partner.repository';
import { PartnerMigrationService } from '../application/partner-migration.service';
import { PartnerService } from '../application/partner.service';
import { PartnerController } from './partner.controller';

@Module({
  controllers: [PartnerController],
  providers: [
    { provide: PARTNER_REPOSITORY, useClass: PrismaPartnerRepository },
    PartnerMigrationService,
    PartnerService,
  ],
  exports: [PARTNER_REPOSITORY, PartnerMigrationService, PartnerService],
})
export class BusinessPartnersModule {}
