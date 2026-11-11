import { Injectable, Logger } from '@nestjs/common';
import { FiscalRegistry, type FiscalStrategy } from '@atrio/core-accounting';
import { VeFiscalStrategy } from '@atrio/l10n_ve';
import { CoFiscalStrategy } from '@atrio/l10n_co';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);
  private readonly registry = new FiscalRegistry();

  constructor() {
    const ve = new VeFiscalStrategy();
    const co = new CoFiscalStrategy();
    this.registry.register(ve);
    this.registry.register(co);
    this.logger.log(`Estrategias fiscales registradas: ${this.registry.getAllCountries().join(', ')}`);
  }

  getStrategy(countryCode: string): FiscalStrategy {
    return this.registry.getStrategy(countryCode);
  }

  hasStrategy(countryCode: string): boolean {
    return this.registry.hasStrategy(countryCode);
  }

  getVeStrategy(): VeFiscalStrategy {
    return this.getStrategy('VE') as VeFiscalStrategy;
  }

  getCoStrategy(): CoFiscalStrategy {
    return this.getStrategy('CO') as CoFiscalStrategy;
  }

  getAllCountries(): string[] {
    return this.registry.getAllCountries();
  }
}
