'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

interface ColumnWidthsContextValue {
  columnWidths: Record<string, number>;
  setColumnWidth: (columnId: string, width: number) => void;
  startResize: (
    event: ReactMouseEvent,
    columnId: string,
    currentWidth: number,
    minWidth: number
  ) => void;
  isResizing: boolean;
}

const ColumnWidthsContext = createContext<ColumnWidthsContextValue | null>(null);

function useColumnWidthsContext() {
  return useContext(ColumnWidthsContext);
}

interface DataTableShellProps {
  children: ReactNode;
  className?: string;
  /** When set, column widths are persisted in localStorage and columns can be resized. */
  columnStorageKey?: string;
}

/**
 * DataTableShell - Consistent table container styling
 */
export default function DataTableShell({
  children,
  className,
  columnStorageKey,
}: DataTableShellProps) {
  const [columnWidths, setColumnWidthsState] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!columnStorageKey) return;
    try {
      const saved = localStorage.getItem(columnStorageKey);
      if (saved) {
        setColumnWidthsState(JSON.parse(saved) as Record<string, number>);
      }
    } catch {
      // ignore invalid storage
    }
  }, [columnStorageKey]);

  const [resizing, setResizing] = useState<{
    columnId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);

  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      setColumnWidthsState((prev) => {
        const next = { ...prev, [columnId]: width };
        if (columnStorageKey) {
          try {
            localStorage.setItem(columnStorageKey, JSON.stringify(next));
          } catch {
            // ignore quota errors
          }
        }
        return next;
      });
    },
    [columnStorageKey]
  );

  useEffect(() => {
    if (!resizing) return;

    const onMove = (event: MouseEvent) => {
      const delta = event.clientX - resizing.startX;
      setColumnWidth(resizing.columnId, Math.max(resizing.minWidth, resizing.startWidth + delta));
    };

    const onUp = () => setResizing(null);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing, setColumnWidth]);

  const startResize = useCallback(
    (
      event: ReactMouseEvent,
      columnId: string,
      currentWidth: number,
      minWidth: number
    ) => {
      event.preventDefault();
      event.stopPropagation();
      setResizing({ columnId, startX: event.clientX, startWidth: currentWidth, minWidth });
    },
    []
  );

  const contextValue = useMemo<ColumnWidthsContextValue | null>(() => {
    if (!columnStorageKey) return null;
    return {
      columnWidths,
      setColumnWidth,
      startResize,
      isResizing: resizing !== null,
    };
  }, [columnStorageKey, columnWidths, setColumnWidth, startResize, resizing]);

  const table = (
    <div className="overflow-x-auto">
      <table
        className={cn(
          'min-w-full divide-y divide-slate-200',
          columnStorageKey && 'table-fixed'
        )}
      >
        {children}
      </table>
    </div>
  );

  return (
    <div
      className={cn(
        'rounded-admin-card border border-slate-200 bg-white overflow-hidden',
        className
      )}
    >
      {contextValue ? (
        <ColumnWidthsContext.Provider value={contextValue}>{table}</ColumnWidthsContext.Provider>
      ) : (
        table
      )}
    </div>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={cn('bg-slate-50', className)}>{children}</thead>;
}

export function TableHeaderRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={className}>{children}</tr>;
}

function getColumnWidthStyle(
  columnId: string | undefined,
  defaultWidth: number | undefined,
  ctx: ColumnWidthsContextValue | null
): CSSProperties | undefined {
  if (!columnId || !defaultWidth) return undefined;
  const width = ctx?.columnWidths[columnId] ?? defaultWidth;
  return { width, minWidth: width, maxWidth: width };
}

export function TableHeaderCell({
  children,
  className,
  align = 'left',
  columnId,
  defaultWidth,
  minWidth = 80,
  resizable = true,
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  columnId?: string;
  defaultWidth?: number;
  minWidth?: number;
  resizable?: boolean;
}) {
  const ctx = useColumnWidthsContext();
  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  const width = columnId && defaultWidth ? (ctx?.columnWidths[columnId] ?? defaultWidth) : undefined;
  const canResize = Boolean(columnId && defaultWidth && resizable && ctx);

  return (
    <th
      className={cn(
        'px-4 xl:px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider relative select-none',
        alignClasses[align],
        className
      )}
      style={getColumnWidthStyle(columnId, defaultWidth, ctx)}
    >
      {children}
      {canResize && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          className={cn(
            'absolute top-0 right-0 z-10 h-full w-2 translate-x-1/2 cursor-col-resize touch-none',
            'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-slate-300/80',
            'hover:after:bg-indigo-400 active:after:bg-indigo-500',
            ctx?.isResizing && 'after:bg-indigo-500'
          )}
          onMouseDown={(event) => startResizeColumn(event, ctx!, columnId!, width!, minWidth)}
        />
      )}
    </th>
  );
}

function startResizeColumn(
  event: ReactMouseEvent,
  ctx: ColumnWidthsContextValue,
  columnId: string,
  currentWidth: number,
  minWidth: number
) {
  ctx.startResize(event, columnId, currentWidth, minWidth);
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={cn('bg-white divide-y divide-slate-200', className)}>{children}</tbody>
  );
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'h-12 hover:bg-slate-50/60 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  align = 'left',
  style,
  columnId,
  defaultWidth,
}: {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  style?: CSSProperties;
  columnId?: string;
  defaultWidth?: number;
}) {
  const ctx = useColumnWidthsContext();
  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  return (
    <td
      className={cn('px-4 xl:px-6 py-4 text-sm', alignClasses[align], className)}
      style={{
        ...getColumnWidthStyle(columnId, defaultWidth, ctx),
        ...style,
      }}
    >
      {children}
    </td>
  );
}
