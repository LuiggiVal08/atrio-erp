import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'atrio:chunk-reload';

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /failed to fetch dynamically imported module|importing a module script failed|loading chunk \S+ failed|error loading dynamically imported module/i.test(
    error.message,
  );
}

function clearReloadFlag() {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* storage unavailable */
  }
}

function consumeReloadFlag(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const module = await factory();
      clearReloadFlag();
      return module;
    } catch (error) {
      if (!isChunkLoadError(error)) throw error;

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const module = await factory();
        clearReloadFlag();
        return module;
      } catch (retryError) {
        if (consumeReloadFlag()) {
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        throw retryError;
      }
    }
  });
}
