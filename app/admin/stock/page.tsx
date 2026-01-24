'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import { Boxes, Plus, Minus, Search, AlertCircle, Save, X } from 'lucide-react';

interface StockVariant {
  productvariantid: string;
  productid: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  trackquantity: boolean;
  characteristics: Array<{
    property_name: string;
    value: string;
  }>;
}

export default function StockPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language || 'en'];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all'); // 'all', 'low', 'out'
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({});
  const [updatingVariants, setUpdatingVariants] = useState<Set<string>>(new Set());
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getAdminSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStock();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterVariants();
  }, [variants, searchTerm, stockFilter]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stock');
      const result = await response.json();
      if (result.success) {
        setVariants(result.variants || []);
        // Initialize temp quantities
        const initialTemp: Record<string, number> = {};
        result.variants?.forEach((v: StockVariant) => {
          initialTemp[v.productvariantid] = v.quantity;
        });
        setTempQuantities(initialTemp);
      }
    } catch (error) {
      console.error('Failed to load stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVariants = () => {
    let filtered = [...variants];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.product_name.toLowerCase().includes(searchLower) ||
        v.sku?.toLowerCase().includes(searchLower) ||
        v.characteristics.some(c => 
          c.property_name.toLowerCase().includes(searchLower) ||
          c.value.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(v => v.quantity > 0 && v.quantity < 10);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(v => v.quantity === 0);
    }

    setFilteredVariants(filtered);
  };

  const updateQuantity = async (variantId: string, action: 'set' | 'add' | 'remove', amount?: number) => {
    try {
      setUpdatingVariants(prev => new Set(prev).add(variantId));
      
      const currentQuantity = tempQuantities[variantId] || variants.find(v => v.productvariantid === variantId)?.quantity || 0;
      let newQuantity = currentQuantity;

      if (action === 'add') {
        newQuantity = currentQuantity + (amount || 1);
      } else if (action === 'remove') {
        newQuantity = Math.max(0, currentQuantity - (amount || 1));
      } else if (action === 'set' && amount !== undefined) {
        newQuantity = amount;
      }

      const response = await fetch(`/api/admin/stock/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          quantity: newQuantity,
          action: 'set'
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setVariants(prev => prev.map(v => 
          v.productvariantid === variantId 
            ? { ...v, quantity: newQuantity }
            : v
        ));
        setTempQuantities(prev => ({ ...prev, [variantId]: newQuantity }));
        setEditingQuantities(prev => {
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
      } else {
        alert(result.error || (language === 'bg' ? 'Грешка при обновяване на наличност' : 'Failed to update stock'));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert(language === 'bg' ? 'Грешка при обновяване на наличност' : 'Failed to update stock');
    } finally {
      setUpdatingVariants(prev => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
    }
  };

  const handleQuantityChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setTempQuantities(prev => ({ ...prev, [variantId]: numValue }));
    setEditingQuantities(prev => ({ ...prev, [variantId]: numValue }));
  };

  const handleSaveQuantity = (variantId: string) => {
    const newQuantity = tempQuantities[variantId] ?? variants.find(v => v.productvariantid === variantId)?.quantity ?? 0;
    if (newQuantity < 0) {
      alert(language === 'bg' ? 'Количеството не може да бъде отрицателно' : 'Quantity cannot be negative');
      return;
    }
    updateQuantity(variantId, 'set', newQuantity);
  };

  const formatCharacteristics = (characteristics: Array<{ property_name: string; value: string }>) => {
    if (characteristics.length === 0) return language === 'bg' ? 'Няма характеристики' : 'No characteristics';
    return characteristics.map(c => `${c.property_name}: ${c.value}`).join(', ');
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) {
      return 'text-red-600 dark:text-red-400';
    } else if (quantity < 10) {
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const totalVariants = variants.length;
  const lowStockCount = variants.filter(v => v.quantity > 0 && v.quantity < 10).length;
  const outOfStockCount = variants.filter(v => v.quantity === 0).length;
  const inStockCount = variants.filter(v => v.quantity >= 10).length;

  return (
    <AdminLayout currentPath="/admin/stock">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: theme.colors.text }}
          >
            {language === 'bg' ? 'Наличности' : 'Stock Management'}
          </h1>
          <p
            className="mt-1 sm:mt-2 text-sm sm:text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            {language === 'bg' ? 'Управление на наличностите по варианти' : 'Manage stock quantities for all product variants'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div
            className="p-4 sm:p-5 lg:p-6 rounded-lg shadow-sm border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <p className="text-xs sm:text-sm font-medium opacity-75" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Общо варианти' : 'Total Variants'}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{totalVariants}</p>
          </div>
          <div
            className="p-4 sm:p-5 lg:p-6 rounded-lg shadow-sm border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <p className="text-xs sm:text-sm font-medium opacity-75" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'В наличност' : 'In Stock'}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-green-600 dark:text-green-400">{inStockCount}</p>
          </div>
          <div
            className="p-4 sm:p-5 lg:p-6 rounded-lg shadow-sm border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <p className="text-xs sm:text-sm font-medium opacity-75" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Ниска наличност' : 'Low Stock'}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-yellow-600 dark:text-yellow-400">{lowStockCount}</p>
          </div>
          <div
            className="p-4 sm:p-5 lg:p-6 rounded-lg shadow-sm border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text
            }}
          >
            <p className="text-xs sm:text-sm font-medium opacity-75" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Изчерпани' : 'Out of Stock'}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2 text-red-600 dark:text-red-400">{outOfStockCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: theme.colors.textSecondary }}
            />
            <input
              type="text"
              placeholder={language === 'bg' ? 'Търсене по продукт, SKU или характеристики...' : 'Search by product, SKU or characteristics...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
                color: theme.colors.text
              }}
            />
          </div>

          {/* Stock Filter */}
          <div className="flex gap-2">
            {['all', 'low', 'out'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStockFilter(filter)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  stockFilter === filter ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: stockFilter === filter ? theme.colors.primary : theme.colors.surface,
                  color: stockFilter === filter ? '#ffffff' : theme.colors.text,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                {filter === 'all' && (language === 'bg' ? 'Всички' : 'All')}
                {filter === 'low' && (language === 'bg' ? 'Ниска наличност' : 'Low Stock')}
                {filter === 'out' && (language === 'bg' ? 'Изчерпани' : 'Out of Stock')}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Grid */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="p-8 text-center" style={{ color: theme.colors.textSecondary }}>
            {language === 'bg' ? 'Няма намерени варианти' : 'No variants found'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredVariants.map((variant) => {
              const isUpdating = updatingVariants.has(variant.productvariantid);
              const currentQuantity = tempQuantities[variant.productvariantid] ?? variant.quantity;
              const isEditing = editingQuantities[variant.productvariantid] !== undefined;

              return (
                <div
                  key={variant.productvariantid}
                  className="p-4 sm:p-5 rounded-lg shadow-sm border"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border
                  }}
                >
                  {/* Product Name */}
                  <Link
                    href={`/admin/products`}
                    className="block mb-2 font-semibold text-sm sm:text-base hover:underline"
                    style={{ color: theme.colors.primary }}
                  >
                    {variant.product_name}
                  </Link>

                  {/* Characteristics */}
                  <div className="mb-3 text-xs sm:text-sm" style={{ color: theme.colors.textSecondary }}>
                    {formatCharacteristics(variant.characteristics)}
                  </div>

                  {/* SKU */}
                  {variant.sku && (
                    <div className="mb-3 text-xs" style={{ color: theme.colors.textSecondary }}>
                      SKU: {variant.sku}
                    </div>
                  )}

                  {/* Current Quantity */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium" style={{ color: theme.colors.textSecondary }}>
                        {language === 'bg' ? 'Наличност:' : 'Stock:'}
                      </span>
                      <span className={`text-lg sm:text-xl font-bold ${getStockStatusColor(variant.quantity)}`}>
                        {variant.quantity}
                        {variant.quantity === 0 && (
                          <AlertCircle size={16} className="inline-block ml-1" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="space-y-2">
                    {/* Quantity Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={currentQuantity}
                        onChange={(e) => handleQuantityChange(variant.productvariantid, e.target.value)}
                        disabled={isUpdating}
                        className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors"
                        style={{
                          backgroundColor: theme.colors.cardBg,
                          borderColor: theme.colors.border,
                          color: theme.colors.text
                        }}
                      />
                      {isEditing && (
                        <button
                          onClick={() => handleSaveQuantity(variant.productvariantid)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: theme.colors.primary,
                            color: '#ffffff'
                          }}
                          title={language === 'bg' ? 'Запази' : 'Save'}
                        >
                          <Save size={16} />
                        </button>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateQuantity(variant.productvariantid, 'add', 1)}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: theme.colors.text
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primary;
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.secondary;
                          e.currentTarget.style.color = theme.colors.text;
                        }}
                      >
                        <Plus size={14} />
                        {language === 'bg' ? 'Добави' : 'Add'}
                      </button>
                      <button
                        onClick={() => updateQuantity(variant.productvariantid, 'remove', 1)}
                        disabled={isUpdating || currentQuantity === 0}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
                        style={{
                          backgroundColor: theme.colors.secondary,
                          color: theme.colors.text
                        }}
                        onMouseEnter={(e) => {
                          if (!isUpdating && currentQuantity > 0) {
                            e.currentTarget.style.backgroundColor = theme.colors.primary;
                            e.currentTarget.style.color = '#ffffff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.secondary;
                          e.currentTarget.style.color = theme.colors.text;
                        }}
                      >
                        <Minus size={14} />
                        {language === 'bg' ? 'Премахни' : 'Remove'}
                      </button>
                    </div>

                    {isUpdating && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
