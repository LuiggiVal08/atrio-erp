import { Module } from '@nestjs/common';
import { LocalizationController } from './infrastructure/localization.controller';
import { PrismaLocalizationRepository } from './infrastructure/prisma-localization.repository';
import { LocalizationTaxService } from './application/localization-tax.service';
import { CurrencyRateService } from './application/currency-rate.service';
import { ExchangeRateSyncService } from './application/exchange-rate-sync.service';
import { OpenErApiProvider } from './application/open-er-api-provider';
import { FrankfurterProvider } from './application/frankfurter-provider';

@Module({
  imports: [],
  controllers: [LocalizationController],
  providers: [
    LocalizationTaxService,
    CurrencyRateService,
    ExchangeRateSyncService,
    OpenErApiProvider,
    FrankfurterProvider,
    { provide: 'LocalizationRepository', useClass: PrismaLocalizationRepository },
  ],
  exports: ['LocalizationRepository'],
})
export class LocalizationModule {}
