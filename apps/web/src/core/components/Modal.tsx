import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative mx-4 w-full ${sizeClasses[size]} rounded-xl border border-border bg-overlay shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute left-0 top-0 h-1 w-full bg-accent" />
        <div className="max-h-[80vh] overflow-y-auto p-6 pt-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-brand text-base font-extrabold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
