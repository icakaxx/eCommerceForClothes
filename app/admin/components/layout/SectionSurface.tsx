'use client';

import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface SectionSurfaceProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /**
   * Visual tone: 'plain' (white bg) or 'soft' (subtle background)
   */
  tone?: 'plain' | 'soft';
  /**
   * Padding size: 'md' (standard) or 'lg' (larger)
   */
  padding?: 'md' | 'lg';
}

/**
 * SectionSurface - Wraps content with rounded container + subtle background + border
 * 
 * Creates visual anchors by grouping content into distinct surface blocks.
 * Use 'soft' tone for subtle background separation, 'plain' for white surfaces.
 */
export default function SectionSurface({ 
  children, 
  className,
  style,
  tone = 'soft',
  padding = 'md'
}: SectionSurfaceProps) {
  const paddingClasses = {
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-admin-card border',
        tone === 'soft' 
          ? 'bg-slate-50/50 border-slate-200/60'
          : 'bg-white border-slate-200',
        paddingClasses[padding],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}
