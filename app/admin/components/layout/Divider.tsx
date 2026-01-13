'use client';

import { cn } from '@/lib/utils';

interface DividerProps {
  className?: string;
  /**
   * Spacing around divider: 'md' (standard) or 'lg' (larger)
   */
  spacing?: 'md' | 'lg';
  /**
   * Divider style: 'default' (full border) or 'subtle' (lighter)
   */
  variant?: 'default' | 'subtle';
}

/**
 * Divider - Consistent vertical spacing around a border line
 * 
 * Creates visual separation between sections with consistent spacing.
 */
export default function Divider({ 
  className,
  spacing = 'md',
  variant = 'default'
}: DividerProps) {
  const spacingClasses = {
    md: 'my-6',
    lg: 'my-8',
  };

  return (
    <div
      className={cn(
        'border-t',
        variant === 'default' 
          ? 'border-slate-200'
          : 'border-slate-200/50',
        spacingClasses[spacing],
        className
      )}
    />
  );
}
