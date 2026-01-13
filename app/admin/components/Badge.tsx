'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeStyle = 'soft' | 'solid';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: BadgeStyle;
  className?: string;
}

/**
 * Badge / StatusPill Component
 * 
 * Consistent badge styling across admin panel:
 * - Default: soft style (tinted background, not full saturated)
 * - Solid: only for critical emphasis
 * - Size: text-xs, medium weight, rounded-full, consistent padding
 */
export default function Badge({ 
  children, 
  variant = 'neutral', 
  style = 'soft',
  className 
}: BadgeProps) {
  const variantStyles = {
    neutral: {
      soft: 'bg-muted text-muted-foreground',
      solid: 'bg-foreground text-background',
    },
    primary: {
      soft: 'bg-primary/10 text-primary',
      solid: 'bg-primary text-primary-foreground',
    },
    success: {
      soft: 'bg-success-bg text-success-text',
      solid: 'bg-success text-success-foreground',
    },
    warning: {
      soft: 'bg-warning-bg text-warning-text',
      solid: 'bg-warning text-warning-foreground',
    },
    danger: {
      soft: 'bg-danger-bg text-danger-text',
      solid: 'bg-danger text-danger-foreground',
    },
    info: {
      soft: 'bg-info-bg text-info-text',
      solid: 'bg-info text-info-foreground',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
        variantStyles[variant][style],
        className
      )}
    >
      {children}
    </span>
  );
}
