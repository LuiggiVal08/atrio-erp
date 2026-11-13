export interface QueryDefaults {
  staleTime?: number;
  gcTime?: number;
}

export const REFERENCE_STALE_TIME = 1000 * 60 * 60;
export const REFERENCE_GC_TIME = 1000 * 60 * 60 * 24;
export const TRANSACTIONAL_STALE_TIME = 1000 * 30;

export function refQueryOptions(overrides: QueryDefaults = {}): QueryDefaults {
  return {
    staleTime: REFERENCE_STALE_TIME,
    gcTime: REFERENCE_GC_TIME,
    ...overrides,
  };
}

export function txQueryOptions(overrides: QueryDefaults = {}): QueryDefaults {
  return {
    staleTime: TRANSACTIONAL_STALE_TIME,
    ...overrides,
  };
}
