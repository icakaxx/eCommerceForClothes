'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageProps {
  children: ReactNode;
  className?: string;
  /**
   * If true, allows content to bleed to edges (removes horizontal padding)
   */
  bleed?: boolean;
}

/**
 * AdminPage - Main wrapper for admin pages
 * 
 * Provides consistent container width, padding, and vertical spacing
 * - Max width: 1400px (admin-container)
 * - Horizontal padding: 1.5rem (24px) on mobile, 2rem (32px) on desktop
 * - Vertical padding: 2rem (32px)
 */
export default function AdminPage({ children, className, bleed = false }: AdminPageProps) {
  return (
    <div
      className={cn(
        'max-w-admin-container mx-auto',
        bleed ? '' : 'px-4 md:px-8',
        'py-8',
        className
      )}
    >
      {children}
    </div>
  );
}
