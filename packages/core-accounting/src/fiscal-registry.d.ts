import type { FiscalStrategy } from './fiscal-strategy.interface';
export declare class FiscalRegistry {
    private strategies;
    register(strategy: FiscalStrategy): void;
    getStrategy(countryCode: string): FiscalStrategy;
    hasStrategy(countryCode: string): boolean;
    getAllCountries(): string[];
}
//# sourceMappingURL=fiscal-registry.d.ts.map