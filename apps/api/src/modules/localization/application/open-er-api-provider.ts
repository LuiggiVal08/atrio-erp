import { Injectable } from '@nestjs/common';
import { ExchangeRateProvider, ExchangeRateQuote } from './exchange-rate-provider.interface';

@Injectable()
export class OpenErApiProvider implements ExchangeRateProvider {
  readonly id = 'open-er-api';
  readonly name = 'Open ER API';

  async fetchQuote(fromCurrency: string, toCurrency: string): Promise<ExchangeRateQuote> {
    const base = encodeURIComponent(fromCurrency.toUpperCase());
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Open ER API respondió ${response.status}`);

    const payload = await response.json() as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    const target = toCurrency.toUpperCase();
    const rate = payload.rates?.[target];
    if (payload.result !== 'success' || !Number.isFinite(rate) || !rate || rate <= 0) {
      throw new Error(`Open ER API no ofrece ${base}/${target}`);
    }

    return {
      fromCurrency: base,
      toCurrency: target,
      rate: Number(rate),
      effectiveDate: payload.time_last_update_utc ? new Date(payload.time_last_update_utc) : new Date(),
    };
  }
}
