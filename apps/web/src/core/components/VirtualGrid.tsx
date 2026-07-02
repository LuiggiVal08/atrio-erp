import { useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { EmptyState } from './EmptyState';

export interface GridColumn<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface VirtualGridProps<T> {
  data: T[];
  columns: GridColumn<T>[];
  rowHeight?: number;
  overscan?: number;
  maxHeight?: number | '100%';
  onRowClick?: (row: T) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyAction?: () => void;
  virtualized?: boolean;
}

export function VirtualGrid<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 48,
  overscan = 10,
  maxHeight = '100%',
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  loading,
  emptyMessage,
  emptyActionLabel,
  emptyAction,
  virtualized = true,
}: VirtualGridProps<T>) {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    enabled: virtualized && data.length > 100,
  });

  const style = useMemo(
    () => (maxHeight === '100%' ? { flex: 1 } : { maxHeight }),
    [maxHeight],
  );

  const renderSortIcon = useCallback(
    (col: GridColumn<T>) => {
      if (!col.sortable) return null;
      if (sortColumn !== col.key) return <ChevronsUpDown size={12} className="text-text-secondary" />;
      return sortDirection === 'asc' ? (
        <ChevronUp size={12} className="text-accent" />
      ) : (
        <ChevronDown size={12} className="text-accent" />
      );
    },
    [sortColumn, sortDirection],
  );

  if (loading) {
    return (
      <div ref={parentRef} style={{ ...style, overflow: 'auto' }} className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (data.length === 0 || !data) {
    return (
      <div ref={parentRef} style={{ ...style, overflow: 'auto' }} className="flex items-center justify-center">
        <EmptyState
          message={emptyMessage || t('common.noResults')}
          icon={<Inbox size={32} className="text-text-secondary" />}
          actionLabel={emptyActionLabel}
          onAction={emptyAction}
        />
      </div>
    );
  }

  return (
    <div ref={parentRef} style={{ ...style, overflow: 'auto' }} className="relative">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-surface">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.sortable && onSort?.(col.key as keyof T, sortColumn === col.key && sortDirection === 'asc' ? 'desc' : 'asc')}
                className={`border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary ${
                  col.sortable ? 'cursor-pointer hover:text-text-primary' : ''
                } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                style={{ width: col.width, minWidth: col.minWidth }}
              >
                <div className="flex items-center gap-1">
                  <span>{col.label}</span>
                  {renderSortIcon(col)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {virtualized && data.length > 100 ? (
            <tr style={{ height: rowVirtualizer.getTotalSize() }}>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = data[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: rowHeight,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="flex border-b border-border hover:bg-surface-hover cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
                      onClick={() => onRowClick?.(row)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onRowClick?.(row);
                      }}
                      tabIndex={0}
                      role="row"
                    >
                      {columns.map((col) => (
                        <div
                          key={String(col.key)}
                          className={`flex items-center px-3 text-[13px] text-text-primary ${
                            col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                          }`}
                          style={{ width: col.width || `${100 / columns.length}%`, minWidth: col.minWidth }}
                        >
                          {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? '')}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border hover:bg-surface-hover cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent"
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRowClick?.(row);
                }}
                tabIndex={0}
                role="row"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-3 py-2 text-[13px] text-text-primary ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                    }`}
                    style={{ width: col.width, minWidth: col.minWidth }}
                  >
                    {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
