import { isAxiosError } from 'axios';

export type ReadErrorKind = 'forbidden' | 'notFound' | 'offline' | 'unknown';

export function getReadErrorKind(error: unknown): ReadErrorKind {
  if (!isAxiosError(error)) return 'unknown';
  if (error.response?.status === 403) return 'forbidden';
  if (error.response?.status === 404) return 'notFound';
  if (!error.response) return 'offline';
  return 'unknown';
}
