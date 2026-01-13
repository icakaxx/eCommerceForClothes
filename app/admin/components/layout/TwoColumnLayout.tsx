'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  main: ReactNode;
  aside?: ReactNode;
  className?: string;
  /**
   * Main column width ratio: 'default' (2/3) or 'wide' (3/4)
   */
  mainWidth?: 'default' | 'wide';
}

/**
 * TwoColumnLayout - Main + aside slots, aside hidden under lg breakpoint
 * 
 * Provides structured layout for wide screens with optional right-rail content.
 * Use for pages that feel empty on large screens - aside can contain tips, filters, or summaries.
 */
export default function TwoColumnLayout({ 
  main, 
  aside,
  className,
  mainWidth = 'default'
}: TwoColumnLayoutProps) {
  const mainWidthClasses = {
    default: 'lg:w-2/3',
    wide: 'lg:w-3/4',
  };

  return (
    <div className={cn('flex flex-col lg:flex-row gap-6', className)}>
      <div className={cn('flex-1', mainWidthClasses[mainWidth])}>
        {main}
      </div>
      {aside && (
        <aside className="lg:w-1/3 lg:flex-shrink-0 hidden lg:block">
          <div className="sticky top-6 space-y-4">
            {aside}
          </div>
        </aside>
      )}
    </div>
  );
}
