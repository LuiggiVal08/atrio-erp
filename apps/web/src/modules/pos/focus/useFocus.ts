import { useRef, useEffect, useCallback } from 'react';
import { focusManager, type FocusTarget } from './focus-manager';

export function useFocus(target: FocusTarget) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unregister = focusManager.register(target, () => {
      ref.current?.focus();
    });
    return unregister;
  }, [target]);

  const requestFocus = useCallback(() => {
    focusManager.requestFocus(target);
  }, [target]);

  return { ref, requestFocus };
}
