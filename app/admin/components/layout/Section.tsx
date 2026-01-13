'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section - Consistent section wrapper for page content
 * 
 * Features:
 * - Optional title and description
 * - Optional actions (right-aligned)
 * - Consistent spacing between sections
 */
export default function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            {title && (
              <h2 className="text-admin-h2 font-semibold">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-admin-subtitle text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0 flex flex-wrap gap-2 sm:flex-nowrap">
              {actions}
            </div>
          )}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
