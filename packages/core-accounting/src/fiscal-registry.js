"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiscalRegistry = void 0;
class FiscalRegistry {
    strategies = new Map();
    register(strategy) {
        this.strategies.set(strategy.countryCode, strategy);
    }
    getStrategy(countryCode) {
        const strategy = this.strategies.get(countryCode);
        if (!strategy) {
            throw new Error(`No fiscal strategy registered for country: ${countryCode}`);
        }
        return strategy;
    }
    hasStrategy(countryCode) {
        return this.strategies.has(countryCode);
    }
    getAllCountries() {
        return Array.from(this.strategies.keys());
    }
}
exports.FiscalRegistry = FiscalRegistry;
//# sourceMappingURL=fiscal-registry.js.map