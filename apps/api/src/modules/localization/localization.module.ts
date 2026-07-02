import { Module } from '@nestjs/common';
import { LocalizationController } from './infrastructure/localization.controller';
import { PrismaLocalizationRepository } from './infrastructure/prisma-localization.repository';
import { LocalizationTaxService } from './application/localization-tax.service';
import { CurrencyRateService } from './application/currency-rate.service';

@Module({
  imports: [],
  controllers: [LocalizationController],
  providers: [
    LocalizationTaxService,
    CurrencyRateService,
    { provide: 'LocalizationRepository', useClass: PrismaLocalizationRepository },
  ],
  exports: ['LocalizationRepository'],
})
export class LocalizationModule {}
