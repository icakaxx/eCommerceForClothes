'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const [formData, setFormData] = useState<Product>({ ...product });
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.surface,
          boxShadow: theme.effects.shadowHover
        }}
      >
        <div 
          className="sticky top-0 border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center transition-colors duration-300"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <h2 
            className="text-lg sm:text-xl font-semibold transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {t.editProduct}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded transition-colors duration-300"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label={t.cancel}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.basicInfo}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.categoryLabel}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <option value="clothes">{t.clothes}</option>
                  <option value="shoes">{t.shoes}</option>
                  <option value="accessories">{t.accessories}</option>
                </select>
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.brandLabel}
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.modelLabel}
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            {formData.category === 'clothes' && (
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.typeLabel}
                </label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder={t.typePlaceholder}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.attributes}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.colorLabel}
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.sizeLabel}
                </label>
                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.quantityLabel}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          <div>
            <h3 
              className="font-medium mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.pricing}
            </h3>
            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.priceLabel}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          <div>
            <h3 
              className="font-medium mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.visibility}
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded focus:ring-2 transition-colors duration-300"
                style={{
                  accentColor: theme.colors.primary
                }}
              />
              <span 
                className="text-xs sm:text-sm transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.visibleOnWebsite}
              </span>
            </label>
          </div>

          <div 
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t transition-colors duration-300"
            style={{ borderColor: theme.colors.border }}
          >
            <button
              type="submit"
              className="flex-1 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-300"
              style={{
                backgroundColor: typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')
                  ? theme.colors.buttonPrimary
                  : undefined,
                backgroundImage: typeof theme.colors.buttonPrimary === 'string' && theme.colors.buttonPrimary.includes('gradient') 
                  ? theme.colors.buttonPrimary 
                  : undefined
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimary;
                }
              }}
            >
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base transition-colors duration-300"
              style={{ 
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

