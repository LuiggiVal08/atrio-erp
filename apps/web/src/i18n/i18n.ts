import es from './es.json';
import en from './en.json';

interface NestedRecord {
  [key: string]: string | NestedRecord;
}

const locales: Record<string, NestedRecord> = { es, en };

function resolveNested(obj: NestedRecord, keys: string[]): string | null {
  let current: unknown = obj;
  for (const k of keys) {
    if (current == null || typeof current !== 'object') return null;
    current = (current as NestedRecord)[k];
  }
  return typeof current === 'string' ? current : null;
}

export function t(key: string, locale: string = 'es'): string {
  const keys = key.split('.');
  const result = resolveNested(locales[locale], keys);
  if (result) return result;
  const fallback = resolveNested(locales['es'], keys);
  return fallback ?? key;
}
