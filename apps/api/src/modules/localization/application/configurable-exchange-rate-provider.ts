import { ExchangeRateProvider, ExchangeRateQuote } from './exchange-rate-provider.interface';

export interface ConfigurableExchangeRateProviderOptions {
  id: string;
  name: string;
  urlTemplate: string;
  ratePath: string;
  datePath?: string;
  apiKeyHeader?: string;
  apiKey?: string;
}

function getValue(payload: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, payload);
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost')) return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(normalized)) return true;
  if (/^10(?:\.\d{1,3}){3}$/.test(normalized)) return true;
  if (/^192\.168(?:\.\d{1,3}){2}$/.test(normalized)) return true;
  if (/^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(normalized)) return true;
  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  return false;
}

export class ConfigurableExchangeRateProvider implements ExchangeRateProvider {
  readonly id: string;
  readonly name: string;

  constructor(private readonly options: ConfigurableExchangeRateProviderOptions) {
    this.id = options.id;
    this.name = options.name;
  }

  async fetchQuote(fromCurrency: string, toCurrency: string): Promise<ExchangeRateQuote> {
    const urlTemplate = this.options.urlTemplate
      .replaceAll('{from}', encodeURIComponent(fromCurrency))
      .replaceAll('{to}', encodeURIComponent(toCurrency));
    const url = new URL(urlTemplate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('El proveedor debe usar una URL HTTP o HTTPS');
    }
    if (isPrivateHostname(url.hostname)) {
      throw new Error('No se permiten proveedores en redes privadas o localhost');
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.options.apiKeyHeader && this.options.apiKey) {
      if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(this.options.apiKeyHeader)) {
        throw new Error('El nombre del encabezado de API es inválido');
      }
      headers[this.options.apiKeyHeader] = this.options.apiKey;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`${this.name} respondió ${response.status}`);

    const payload = await response.json();
    const rawRate = getValue(payload, this.options.ratePath.replaceAll('{to}', toCurrency));
    const rate = typeof rawRate === 'number' ? rawRate : Number(rawRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`${this.name} no devolvió una tasa válida en ${this.options.ratePath}`);
    }

    let effectiveDate = new Date();
    if (this.options.datePath) {
      const rawDate = getValue(payload, this.options.datePath);
      if (rawDate) {
        const parsedDate = new Date(typeof rawDate === 'string' ? rawDate : String(rawDate));
        if (!Number.isNaN(parsedDate.getTime())) effectiveDate = parsedDate;
      }
    }

    return {
      fromCurrency,
      toCurrency,
      rate,
      effectiveDate,
    };
  }
}
