'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader - Consistent page header with title, subtitle, and actions
 * 
 * Layout:
 * - Title: text-3xl (30px), font-semibold, tracking-tight
 * - Subtitle: text-sm (14px), muted color
 * - Actions: Right-aligned, responsive stack on mobile
 * - Spacing: mt-6 (24px) margin below header
 */
export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-admin-h1 font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-admin-subtitle text-gray-600 dark:text-gray-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex flex-wrap gap-2 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
