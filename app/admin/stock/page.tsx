'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import ProductStockCard, { LARGE_REDUCTION_THRESHOLD } from './components/ProductStockCard';
import { getAdminSession } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import {
  type GroupedStockProduct,
  filterGroupedProducts,
  getStockSummary,
  groupVariantsIntoProducts,
} from '@/lib/admin-stock-utils';
import { Search, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

type StockFilter = 'all' | 'low' | 'out' | 'negative';
type BulkAction = 'add' | 'remove';

export default function StockPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const lang = (language === 'bg' ? 'bg' : 'en') as 'bg' | 'en';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<GroupedStockProduct[]>([]);
  const [savedQuantities, setSavedQuantities] = useState<Record<string, number>>({});
  const [editedQuantities, setEditedQuantities] = useState<Record<string, number>>({});
  const [savedPrices, setSavedPrices] = useState<Record<string, number>>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [savedPromoPrices, setSavedPromoPrices] = useState<Record<string, number | null>>({});
  const [editedPromoPrices, setEditedPromoPrices] = useState<Record<string, number | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkAction, setBulkAction] = useState<BulkAction>('add');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const hasUnsavedChanges = useMemo(() => {
    const quantityChanged = Object.entries(editedQuantities).some(([variantId, qty]) => {
      const saved = savedQuantities[variantId];
      return saved !== undefined && qty !== saved;
    });
    const priceChanged = Object.entries(editedPrices).some(([variantId, price]) => {
      const saved = savedPrices[variantId];
      return saved !== undefined && price !== saved;
    });
    const promoChanged = Object.keys(editedPromoPrices).some((variantId) => {
      if (savedPromoPrices[variantId] === undefined) return false;
      return editedPromoPrices[variantId] !== savedPromoPrices[variantId];
    });
    return quantityChanged || priceChanged || promoChanged;
  }, [editedQuantities, savedQuantities, editedPrices, savedPrices, editedPromoPrices, savedPromoPrices]);

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
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stock');
      const result = await response.json();
      if (result.success) {
        const grouped: GroupedStockProduct[] =
          result.products || groupVariantsIntoProducts(result.variants || []);
        setProducts(grouped);

        const quantities: Record<string, number> = {};
        const prices: Record<string, number> = {};
        const promoPrices: Record<string, number | null> = {};
        grouped.forEach((p) =>
          p.variants.forEach((v) => {
            quantities[v.productvariantid] = v.quantity;
            prices[v.productvariantid] = v.price;
            promoPrices[v.productvariantid] = v.promotional_price;
          })
        );
        setSavedQuantities(quantities);
        setEditedQuantities({ ...quantities });
        setSavedPrices(prices);
        setEditedPrices({ ...prices });
        setSavedPromoPrices(promoPrices);
        setEditedPromoPrices({ ...promoPrices });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const allVariants = useMemo(
    () => products.flatMap((p) => p.variants),
    [products]
  );

  const { products: filteredProducts, matchedVariantIds, autoExpandProductIds } = useMemo(
    () => filterGroupedProducts(products, searchTerm, stockFilter),
    [products, searchTerm, stockFilter]
  );

  useEffect(() => {
    if (autoExpandProductIds.size === 0) return;
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      autoExpandProductIds.forEach((id) => next.add(id));
      return next;
    });
  }, [autoExpandProductIds]);

  const summary = useMemo(() => getStockSummary(allVariants), [allVariants]);

  const pendingUpdates = useMemo(() => {
    const variantIds = new Set<string>([
      ...Object.keys(editedQuantities),
      ...Object.keys(editedPrices),
      ...Object.keys(editedPromoPrices),
    ]);

    const updates: Array<{
      productvariantid: string;
      quantity?: number;
      price?: number;
      promotional_price?: number | null;
    }> = [];

    for (const variantId of variantIds) {
      const item: {
        productvariantid: string;
        quantity?: number;
        price?: number;
        promotional_price?: number | null;
      } = { productvariantid: variantId };

      if (
        savedQuantities[variantId] !== undefined &&
        editedQuantities[variantId] !== savedQuantities[variantId]
      ) {
        item.quantity = editedQuantities[variantId];
      }
      if (savedPrices[variantId] !== undefined && editedPrices[variantId] !== savedPrices[variantId]) {
        item.price = editedPrices[variantId];
      }
      if (
        savedPromoPrices[variantId] !== undefined &&
        editedPromoPrices[variantId] !== savedPromoPrices[variantId]
      ) {
        item.promotional_price = editedPromoPrices[variantId];
      }

      if (item.quantity !== undefined || item.price !== undefined || item.promotional_price !== undefined) {
        updates.push(item);
      }
    }

    return updates;
  }, [editedQuantities, savedQuantities, editedPrices, savedPrices, editedPromoPrices, savedPromoPrices]);

  const applyLocalVariantUpdates = useCallback(
    (
      updates: Array<{
        productvariantid: string;
        quantity?: number;
        price?: number;
        promotional_price?: number | null;
      }>
    ) => {
      setSavedQuantities((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.quantity !== undefined) next[u.productvariantid] = u.quantity;
        });
        return next;
      });
      setEditedQuantities((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.quantity !== undefined) next[u.productvariantid] = u.quantity;
        });
        return next;
      });
      setSavedPrices((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.price !== undefined) next[u.productvariantid] = u.price;
        });
        return next;
      });
      setEditedPrices((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.price !== undefined) next[u.productvariantid] = u.price;
        });
        return next;
      });
      setSavedPromoPrices((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.promotional_price !== undefined) next[u.productvariantid] = u.promotional_price;
        });
        return next;
      });
      setEditedPromoPrices((prev) => {
        const next = { ...prev };
        updates.forEach((u) => {
          if (u.promotional_price !== undefined) next[u.productvariantid] = u.promotional_price;
        });
        return next;
      });

      setProducts((prev) => {
        const updateMap = new Map(updates.map((u) => [u.productvariantid, u]));
        const flatVariants = prev.flatMap((p) =>
          p.variants.map((v) => {
            const patch = updateMap.get(v.productvariantid);
            if (!patch) return v;
            return {
              ...v,
              quantity: patch.quantity ?? v.quantity,
              price: patch.price ?? v.price,
              promotional_price:
                patch.promotional_price !== undefined ? patch.promotional_price : v.promotional_price,
            };
          })
        );
        return groupVariantsIntoProducts(flatVariants);
      });
    },
    []
  );

  const handleQuantityChange = (variantId: string, value: number) => {
    const safeValue = Math.max(0, value);
    setEditedQuantities((prev) => ({ ...prev, [variantId]: safeValue }));
    setSaveMessage(null);
  };

  const handlePriceChange = (variantId: string, value: number) => {
    setEditedPrices((prev) => ({ ...prev, [variantId]: Math.max(0, value) }));
    setSaveMessage(null);
  };

  const handlePromoPriceChange = (variantId: string, value: number | null) => {
    setEditedPromoPrices((prev) => ({ ...prev, [variantId]: value }));
    setSaveMessage(null);
  };

  const handleAdjustQuantity = (variantId: string, delta: number) => {
    const current =
      editedQuantities[variantId] ?? savedQuantities[variantId] ?? 0;
    handleQuantityChange(variantId, Math.max(0, current + delta));
  };

  const handleSaveAllChanges = async () => {
    if (pendingUpdates.length === 0 || isSaving) return;

    const largeReductions = pendingUpdates.filter((u) => {
      if (u.quantity === undefined) return false;
      const previous = savedQuantities[u.productvariantid] ?? 0;
      return previous - u.quantity >= LARGE_REDUCTION_THRESHOLD;
    });

    if (largeReductions.length > 0) {
      const confirmed = window.confirm(
        lang === 'bg'
          ? `Ще намалите наличността с ${LARGE_REDUCTION_THRESHOLD}+ бр. за ${largeReductions.length} вариант(а). Продължавате ли?`
          : `You are reducing stock by ${LARGE_REDUCTION_THRESHOLD}+ for ${largeReductions.length} variant(s). Continue?`
      );
      if (!confirmed) return;
    }

    for (const update of pendingUpdates) {
      if (update.quantity !== undefined && update.quantity < 0) {
        setSaveMessage({
          type: 'error',
          text: lang === 'bg' ? 'Наличността не може да бъде отрицателна' : 'Stock cannot be negative',
        });
        return;
      }
      if (update.price !== undefined && update.price < 0) {
        setSaveMessage({
          type: 'error',
          text: lang === 'bg' ? 'Цената не може да бъде отрицателна' : 'Price cannot be negative',
        });
        return;
      }
      if (
        update.promotional_price != null &&
        update.price !== undefined &&
        update.promotional_price >= update.price
      ) {
        setSaveMessage({
          type: 'error',
          text:
            lang === 'bg'
              ? 'Промо цената трябва да е по-ниска от обикновената цена'
              : 'Promo price must be lower than regular price',
        });
        return;
      }
      const effectivePrice =
        update.price ?? editedPrices[update.productvariantid] ?? savedPrices[update.productvariantid] ?? 0;
      if (
        update.promotional_price != null &&
        update.promotional_price >= effectivePrice
      ) {
        setSaveMessage({
          type: 'error',
          text:
            lang === 'bg'
              ? 'Промо цената трябва да е по-ниска от обикновената цена'
              : 'Promo price must be lower than regular price',
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      const response = await fetch('/api/admin/stock/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantUpdates: pendingUpdates }),
      });

      const result = await response.json();
      if (!result.success) {
        setSaveMessage({
          type: 'error',
          text: result.error || (lang === 'bg' ? 'Неуспешно запазване' : 'Failed to save'),
        });
        return;
      }

      const updates = (result.updated || []).map(
        (row: {
          productvariantid: string;
          quantity?: number;
          price?: number;
          promotional_price?: number | null;
        }) => ({
          productvariantid: row.productvariantid,
          quantity: row.quantity,
          price: row.price,
          promotional_price: row.promotional_price,
        })
      );
      applyLocalVariantUpdates(updates);
      setSaveMessage({
        type: 'success',
        text: lang === 'bg' ? 'Промените са запазени успешно' : 'Changes saved successfully',
      });
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: lang === 'bg' ? 'Неуспешно запазване' : 'Failed to save',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkApply = async () => {
    if (selectedVariantIds.size === 0 || bulkQuantity <= 0 || isSaving) return;

    const variantIds = Array.from(selectedVariantIds);

    if (bulkAction === 'remove') {
      const wouldGoNegative = variantIds.some((id) => {
        const current = editedQuantities[id] ?? savedQuantities[id] ?? 0;
        return current - bulkQuantity < 0;
      });
      if (wouldGoNegative) {
        setSaveMessage({
          type: 'error',
          text:
            lang === 'bg'
              ? 'Наличността не може да стане отрицателна'
              : 'Stock cannot become negative',
        });
        return;
      }

      if (bulkQuantity >= LARGE_REDUCTION_THRESHOLD) {
        const confirmed = window.confirm(
          lang === 'bg'
            ? `Ще премахнете ${bulkQuantity} бр. от ${variantIds.length} избрани варианта. Продължавате ли?`
            : `Remove ${bulkQuantity} from ${variantIds.length} selected variants. Continue?`
        );
        if (!confirmed) return;
      }
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);

      const response = await fetch('/api/admin/stock/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantIds,
          quantity: bulkQuantity,
          action: bulkAction,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setSaveMessage({
          type: 'error',
          text: result.error || (lang === 'bg' ? 'Неуспешно запазване' : 'Failed to update'),
        });
        return;
      }

      const updates = (result.updated || []).map(
        (row: { productvariantid: string; quantity: number }) => ({
          productvariantid: row.productvariantid,
          quantity: row.quantity,
        })
      );
      applyLocalVariantUpdates(updates);
      setSaveMessage({
        type: 'success',
        text: lang === 'bg' ? 'Промените са запазени успешно' : 'Changes saved successfully',
      });
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: lang === 'bg' ? 'Неуспешно запазване' : 'Failed to update',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleVariantSelection = (variantId: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  };

  const handleSelectAllVariants = (_productId: string, variantIds: string[]) => {
    setSelectedVariantIds((prev) => {
      const allSelected = variantIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        variantIds.forEach((id) => next.delete(id));
      } else {
        variantIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedVariantIds(new Set());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout currentPath="/admin/stock">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
            {lang === 'bg' ? 'Наличности' : 'Stock Management'}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: theme.colors.textSecondary }}>
            {lang === 'bg'
              ? 'Управление на наличностите по продукти и варианти'
              : 'Manage stock by product and variant'}
          </p>
          <Link
            href="/admin/stock-in"
            className="inline-block mt-3 text-sm font-medium underline touch-manipulation min-h-[44px] py-2"
            style={{ color: theme.colors.primary }}
          >
            {lang === 'bg' ? '→ Заприхождаване' : '→ Receive stock'}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            {
              label: lang === 'bg' ? 'Продукти' : 'Products',
              value: summary.totalProducts,
            },
            {
              label: lang === 'bg' ? 'Варианти' : 'Variants',
              value: summary.totalVariants,
            },
            {
              label: lang === 'bg' ? 'В наличност' : 'In stock',
              value: summary.inStockCount,
              color: 'text-green-600 dark:text-green-400',
            },
            {
              label: lang === 'bg' ? 'Ниска наличност' : 'Low stock',
              value: summary.lowStockCount,
              color: 'text-yellow-600 dark:text-yellow-400',
            },
            {
              label: lang === 'bg' ? 'Изчерпани' : 'Out of stock',
              value: summary.outOfStockCount,
              color: 'text-red-600 dark:text-red-400',
            },
            {
              label: lang === 'bg' ? 'Отрицателна' : 'Negative',
              value: summary.negativeStockCount,
              color: 'text-purple-600 dark:text-purple-400',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="p-4 rounded-lg shadow-sm border"
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              <p className="text-xs font-medium opacity-75" style={{ color: theme.colors.textSecondary }}>
                {card.label}
              </p>
              <p className={`text-xl font-bold mt-1 ${card.color || ''}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: theme.colors.textSecondary }}
            />
            <input
              type="text"
              placeholder={
                lang === 'bg'
                  ? 'Търсене по продукт, SKU, размер или цвят...'
                  : 'Search by product, SKU, size or color...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'low', 'out', 'negative'] as StockFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStockFilter(filter)}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: stockFilter === filter ? theme.colors.primary : theme.colors.surface,
                  color: stockFilter === filter ? '#ffffff' : theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {filter === 'all' && (lang === 'bg' ? 'Всички' : 'All')}
                {filter === 'low' && (lang === 'bg' ? 'Ниска наличност' : 'Low stock')}
                {filter === 'out' && (lang === 'bg' ? 'Изчерпани' : 'Out of stock')}
                {filter === 'negative' && (lang === 'bg' ? 'Претоварване' : 'Oversold')}
              </button>
            ))}
          </div>
        </div>

        <div
          className="p-4 rounded-lg border space-y-3"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }}
        >
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: theme.colors.text }}>
            {lang === 'bg' ? 'Бързо зареждане' : 'Quick stock update'}
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: theme.colors.textSecondary }}>
                {lang === 'bg' ? 'Количество' : 'Quantity'}
              </label>
              <input
                type="number"
                min={1}
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-3 py-2 text-sm border rounded-lg"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkAction('add')}
                className="px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: bulkAction === 'add' ? theme.colors.primary : theme.colors.cardBg,
                  color: bulkAction === 'add' ? '#fff' : theme.colors.text,
                  borderColor: theme.colors.border,
                }}
              >
                {lang === 'bg' ? 'Добави' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setBulkAction('remove')}
                className="px-3 py-2 text-sm rounded-lg border"
                style={{
                  backgroundColor: bulkAction === 'remove' ? theme.colors.primary : theme.colors.cardBg,
                  color: bulkAction === 'remove' ? '#fff' : theme.colors.text,
                  borderColor: theme.colors.border,
                }}
              >
                {lang === 'bg' ? 'Премахни' : 'Remove'}
              </button>
            </div>
            <button
              type="button"
              disabled={isSaving || selectedVariantIds.size === 0}
              onClick={handleBulkApply}
              className="px-4 py-2 text-sm rounded-lg disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
            >
              {bulkAction === 'add'
                ? lang === 'bg'
                  ? 'Добави към избраните'
                  : 'Add to selected'
                : lang === 'bg'
                  ? 'Премахни от избраните'
                  : 'Remove from selected'}{' '}
              ({selectedVariantIds.size})
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm underline"
              style={{ color: theme.colors.primary }}
            >
              {lang === 'bg' ? 'Изчисти избора' : 'Clear selection'}
            </button>
          </div>
        </div>

        {(pendingUpdates.length > 0 || saveMessage) && (
          <div
            className="sticky top-2 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border shadow-sm"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              {saveMessage?.type === 'success' ? (
                <CheckCircle2 size={18} className="text-green-600" />
              ) : saveMessage?.type === 'error' ? (
                <AlertCircle size={18} className="text-red-600" />
              ) : (
                <AlertCircle size={18} style={{ color: theme.colors.primary }} />
              )}
              <span style={{ color: theme.colors.text }}>
                {saveMessage?.text ||
                  (lang === 'bg'
                    ? `${pendingUpdates.length} незапазени промени`
                    : `${pendingUpdates.length} unsaved changes`)}
              </span>
            </div>
            {pendingUpdates.length > 0 && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAllChanges}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: theme.colors.primary, color: '#ffffff' }}
              >
                <Save size={16} />
                {isSaving
                  ? lang === 'bg'
                    ? 'Запазване...'
                    : 'Saving...'
                  : lang === 'bg'
                    ? 'Запази всички промени'
                    : 'Save all changes'}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center" style={{ color: theme.colors.textSecondary }}>
            {lang === 'bg' ? 'Няма намерени продукти' : 'No products found'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductStockCard
                key={product.productid}
                product={product}
                isExpanded={expandedProductIds.has(product.productid)}
                onToggleExpand={() => toggleExpand(product.productid)}
                matchedVariantIds={matchedVariantIds}
                editedQuantities={editedQuantities}
                savedQuantities={savedQuantities}
                editedPrices={editedPrices}
                savedPrices={savedPrices}
                editedPromoPrices={editedPromoPrices}
                savedPromoPrices={savedPromoPrices}
                onQuantityChange={handleQuantityChange}
                onAdjustQuantity={handleAdjustQuantity}
                onPriceChange={handlePriceChange}
                onPromoPriceChange={handlePromoPriceChange}
                selectedVariantIds={selectedVariantIds}
                onToggleVariantSelection={toggleVariantSelection}
                onSelectAllVariants={handleSelectAllVariants}
                isSaving={isSaving}
                language={lang}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
