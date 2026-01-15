'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataTableShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * DataTableShell - Consistent table container styling
 * 
 * Features:
 * - Rounded corners (rounded-admin-card)
 * - Border and background
 * - Overflow handling
 * - Standard header row typography + row height + hover state
 */
export default function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        'rounded-admin-card border border-slate-200 bg-white overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          {children}
        </table>
      </div>
    </div>
  );
}

/**
 * TableHeader - Consistent table header styling
 */
export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <thead className={cn('bg-slate-50', className)}>
      {children}
    </thead>
  );
}

/**
 * TableHeaderRow - Standard header row
 */
export function TableHeaderRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={className}>
      {children}
    </tr>
  );
}

/**
 * TableHeaderCell - Standard header cell
 */
export function TableHeaderCell({ children, className, align = 'left' }: { 
  children: ReactNode; 
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  return (
    <th
      className={cn(
        'px-4 xl:px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider',
        alignClasses[align],
        className
      )}
    >
      {children}
    </th>
  );
}

/**
 * TableBody - Table body wrapper
 */
export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tbody className={cn('bg-white divide-y divide-slate-200', className)}>
      {children}
    </tbody>
  );
}

/**
 * TableRow - Standard table row with hover state
 */
export function TableRow({ children, className, onClick }: { 
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

/**
 * TableCell - Standard table cell
 */
export function TableCell({ children, className, align = 'left', style }: { 
  children: ReactNode; 
  className?: string;
  align?: 'left' | 'right' | 'center';
  style?: React.CSSProperties;
}) {
  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  return (
    <td
      className={cn(
        'px-4 xl:px-6 py-4 text-sm',
        alignClasses[align],
        className
      )}
      style={style}
    >
      {children}
    </td>
  );
}
