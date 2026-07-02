import { useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardNavConfig {
  onSave?: () => void;
  onCancel?: () => void;
  backRoute?: string;
}

export function useKeyboardNav({ onSave, onCancel, backRoute }: KeyboardNavConfig) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) onCancel();
      else if (backRoute) navigate(backRoute);
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
    }
  }, [onSave, onCancel, backRoute, navigate]);

  return { handleKeyDown };
}
