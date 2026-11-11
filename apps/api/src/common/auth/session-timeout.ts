export const DEFAULT_SESSION_TIMEOUT_MINUTES = 60;
export const MAX_SESSION_TIMEOUT_MINUTES = 24 * 60;

export function resolveSessionTimeoutMinutes(settings: unknown): number {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }

  const value = (settings as Record<string, unknown>).sessionTimeout;
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_SESSION_TIMEOUT_MINUTES
  ) {
    return DEFAULT_SESSION_TIMEOUT_MINUTES;
  }

  return value;
}
