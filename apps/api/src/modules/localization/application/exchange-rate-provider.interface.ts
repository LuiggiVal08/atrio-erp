export interface ExchangeRateQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: Date;
}

export interface ExchangeRateProvider {
  readonly id: string;
  readonly name: string;
  fetchQuote(
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<ExchangeRateQuote>;
}
