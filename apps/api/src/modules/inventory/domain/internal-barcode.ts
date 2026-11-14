// Prefix 200 is for restricted circulation, not a globally registered GTIN.
const INTERNAL_PREFIX = '200';
const MAX_SEQUENCE = 999_999_999;

export function ean13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export function buildInternalEan13(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > MAX_SEQUENCE) {
    throw new Error(`Internal barcode sequence out of range: ${sequence}`);
  }
  const body = INTERNAL_PREFIX + String(sequence).padStart(9, '0');
  return body + ean13CheckDigit(body);
}