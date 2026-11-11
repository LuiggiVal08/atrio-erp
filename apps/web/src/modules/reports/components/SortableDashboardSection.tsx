import { type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { DashboardSection } from '../store/reports-store';

interface SortableDashboardSectionProps {
  id: DashboardSection;
  title: string;
  icon: ReactNode;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: ReactNode;
}

const controlClass =
  'flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40 md:min-h-8 md:min-w-8';

export function SortableDashboardSection({
  id,
  title,
  icon,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  children,
}: SortableDashboardSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? 'relative z-10 opacity-60' : 'relative'}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={`${controlClass} cursor-grab active:cursor-grabbing`}
          aria-label={`Reordenar ${title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <span className="text-text-muted" aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className={controlClass}
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Mover ${title} arriba`}
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            className={controlClass}
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Mover ${title} abajo`}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}
