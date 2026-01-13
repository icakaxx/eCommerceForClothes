'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Card from './Card';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

/**
 * EmptyState - Visually centered empty state inside a Card/Surface
 * 
 * Provides guidance when content is missing or lists are empty.
 * Use instead of blank space to make pages feel intentional.
 */
export default function EmptyState({ 
  title, 
  description, 
  action,
  icon: Icon,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn('text-center', className)}>
      <div className="py-8 sm:py-12">
        {Icon && (
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
        )}
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto mb-6">
            {description}
          </p>
        )}
        {action && (
          <div className="flex justify-center">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
}
