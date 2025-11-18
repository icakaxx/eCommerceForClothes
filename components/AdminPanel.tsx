'use client';

import { useState } from 'react';
import { Search, Edit2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EditProductModal from './EditProductModal';
import { useProducts } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import { Product } from '@/lib/data';
import LanguageToggle from './LanguageToggle';

export default function AdminPanel() {
  const { products, setProducts } = useProducts();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleBackToStore = () => {
    localStorage.setItem('isAdmin', 'false');
    router.push('/');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesVisibility = visibilityFilter === 'all' || 
      (visibilityFilter === 'visible' && p.visible) ||
      (visibilityFilter === 'hidden' && !p.visible);

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const toggleVisibility = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, visible: !p.visible } : p
    ));
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    setEditingProduct(null);
  };

  return (
    <div 
      className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div 
        className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r flex-shrink-0 transition-colors duration-300"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between lg:block mb-4 lg:mb-8">
            <div className="flex items-center gap-2">
              <Image
                src="/image.png"
                alt="ModaBox Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <div 
                className="text-lg sm:text-xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                ModaBox
              </div>
            </div>
            <div className="lg:hidden">
              <LanguageToggle />
            </div>
          </div>
          <nav className="space-y-1">
            <div 
              className="px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              {t.products}
            </div>
          </nav>
          <button
            onClick={handleBackToStore}
            className="mt-4 w-full flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base rounded-lg transition-colors duration-300"
            style={{ 
              color: theme.colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={18} />
            <span>{language === 'bg' ? 'Обратно в магазина' : 'Back to Store'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.products}
              </h1>
              <div className="hidden lg:block">
                <LanguageToggle />
              </div>
            </div>
            <p 
              className="text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.manageProducts}
            </p>
          </div>

          <div 
            className="rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300" 
                    size={18}
                    style={{ color: theme.colors.textSecondary }}
                  />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.cardBg,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allCategories}</option>
                <option value="clothes">{t.clothes}</option>
                <option value="shoes">{t.shoes}</option>
                <option value="accessories">{t.accessories}</option>
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allItems}</option>
                <option value="visible">{t.visible}</option>
                <option value="hidden">{t.hidden}</option>
              </select>
            </div>
          </div>

          <div 
            className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead 
                  className="border-b transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <tr>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.image}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.category}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.brand}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.model}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.color}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.size}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.qty}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.price}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.visible}</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <img
                          src={product.images[0]}
                          alt={product.model}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover"
                        />
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm capitalize transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.category === 'clothes' ? t.clothes : 
                         product.category === 'shoes' ? t.shoes : 
                         product.category === 'accessories' ? t.accessories : product.category}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.brand}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.model}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.color}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.size || '-'}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.quantity}
                      </td>
                      <td 
                        className="px-3 sm:px-6 py-4 text-xs sm:text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        €{product.price.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <button
                          onClick={() => toggleVisibility(product.id)}
                          className={`p-1.5 rounded ${
                            product.visible
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {product.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 rounded transition-colors duration-300"
                          style={{ 
                            color: theme.colors.primary
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.secondary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p 
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t.noProductsFound}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

