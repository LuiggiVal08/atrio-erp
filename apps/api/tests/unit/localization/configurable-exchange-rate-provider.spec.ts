import { ConfigurableExchangeRateProvider } from '../../../src/modules/localization/application/configurable-exchange-rate-provider';

describe('ConfigurableExchangeRateProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('reads the configured JSON rate path and sends the API key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        rates: { VES: 36.25 },
        date: '2026-10-31',
      }),
    });
    global.fetch = fetchMock as typeof fetch;
    const provider = new ConfigurableExchangeRateProvider({
      id: 'custom-bank',
      name: 'Banco personalizado',
      urlTemplate: 'https://rates.example.com/latest/{from}?target={to}',
      ratePath: 'rates.VES',
      datePath: 'date',
      apiKeyHeader: 'X-API-Key',
      apiKey: 'secret-token',
    });

    const quote = await provider.fetchQuote('USD', 'VES');

    expect(quote.rate).toBe(36.25);
    expect(quote.effectiveDate.toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'secret-token' }),
      }),
    );
  });

  it('rejects private network URLs', async () => {
    const provider = new ConfigurableExchangeRateProvider({
      id: 'internal',
      name: 'Interno',
      urlTemplate: 'http://127.0.0.1/rates',
      ratePath: 'rate',
    });

    await expect(provider.fetchQuote('USD', 'VES')).rejects.toThrow('redes privadas');
  });
});
