import { Injectable } from '@nestjs/common';
import { ExchangeRateProvider, ExchangeRateQuote } from './exchange-rate-provider.interface';

@Injectable()
export class FrankfurterProvider implements ExchangeRateProvider {
  readonly id = 'frankfurter';
  readonly name = 'Frankfurter';

  async fetchQuote(fromCurrency: string, toCurrency: string): Promise<ExchangeRateQuote> {
    const from = encodeURIComponent(fromCurrency.toUpperCase());
    const to = encodeURIComponent(toCurrency.toUpperCase());
    const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Frankfurter respondió ${response.status}`);

    const payload = await response.json() as {
      amount?: number;
      base?: string;
      date?: string;
      rates?: Record<string, number>;
    };
    const rate = payload.rates?.[to];
    if (!Number.isFinite(rate) || !rate || rate <= 0) {
      throw new Error(`Frankfurter no ofrece ${from}/${to}`);
    }

    return {
      fromCurrency: from,
      toCurrency: to,
      rate: Number(rate),
      effectiveDate: payload.date ? new Date(`${payload.date}T00:00:00Z`) : new Date(),
    };
  }
}
