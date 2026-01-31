'use client';

import { Filter } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface ProductFiltersProps {
  selectedFilters: Record<string, any>;
  onToggleVisibility: () => void;
}

export default function ProductFilters({
  selectedFilters,
  onToggleVisibility
}: ProductFiltersProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  const getFilterCount = () => {
    return Object.keys(selectedFilters).length;
  };

  return (
    <div className="mb-6 px-2">
      <button
        onClick={onToggleVisibility}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-300"
        style={{
          backgroundColor: theme.colors.secondary,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.surface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.secondary;
        }}
      >
        <Filter size={16} />
        {language === 'bg' ? 'Филтри' : 'Filters'}
        {getFilterCount() > 0 && (
          <span
            className="px-2 py-1 text-xs rounded-full"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#ffffff'
            }}
          >
            {getFilterCount()}
          </span>
        )}
      </button>
    </div>
  );
}
