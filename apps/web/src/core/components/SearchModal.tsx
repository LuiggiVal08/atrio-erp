import { useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !isOpen) {
        e.preventDefault();
        // parent handles opening
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={18} className="text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar módulos, documentos..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted">
            <Command size={11} />K
          </kbd>
        </div>
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          Escribe para buscar...
        </div>
      </div>
    </div>
  );
}
