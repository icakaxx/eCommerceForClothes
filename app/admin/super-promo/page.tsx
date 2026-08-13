'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import AdminModal from '../components/AdminModal';
import { getAdminSession } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import type { SuperPromoDisplayItem } from '@/lib/super-promo';
import { getVariantPropertyValues } from '@/lib/variant-stock';

interface ProductOption {
  productid: string;
  name: string;
}

interface VariantOption {
  productvariantid: string;
  price: number;
  label: string;
}

interface FormState {
  productid: string;
  productvariantid: string;
  promoprice: string;
  sortorder: string;
  isactive: boolean;
}

const emptyForm: FormState = {
  productid: '',
  productvariantid: '',
  promoprice: '',
  sortorder: '0',
  isactive: true,
};

function buildVariantLabel(variant: Record<string, unknown>, fallbackPrice: number): string {
  const props = getVariantPropertyValues(variant);
  const parts = props.map((p) => p.value);
  const suffix = parts.length > 0 ? parts.join(' • ') : variant.sku || variant.productvariantid;
  return `${suffix} — €${Number(fallbackPrice || variant.price || 0).toFixed(2)}`;
}

export default function AdminSuperPromoPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language || 'en'];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<SuperPromoDisplayItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title =
      language === 'bg' ? 'SUPER PROMO - Админ' : 'SUPER PROMO - Admin';
  }, [language]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getAdminSession();
        if (!session) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch {
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const loadItems = async () => {
    const response = await fetch('/api/admin/super-promo');
    const result = await response.json();
    if (result.success) {
      setItems(result.items || []);
    }
  };

  const loadProducts = async () => {
    const response = await fetch('/api/products?basic=true');
    const result = await response.json();
    if (result.success) {
      setProducts(
        (result.products || []).map((p: { productid?: string; id?: string; name?: string }) => ({
          productid: p.productid || p.id,
          name: p.name || 'Product',
        }))
      );
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadProducts();
    }
  }, [isAuthenticated]);

  const loadVariantsForProduct = async (productId: string, selectedVariantId?: string) => {
    if (!productId) {
      setVariants([]);
      return;
    }

    setLoadingVariants(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      const result = await response.json();
      if (result.success && result.product) {
        const productVariants = result.product.variants || result.product.Variants || [];
        const options = productVariants
          .filter((v: { isvisible?: boolean }) => v.isvisible !== false)
          .map((variant: Record<string, unknown>) => ({
            productvariantid: String(variant.productvariantid || variant.ProductVariantID || ''),
            price: Number(variant.price) || 0,
            label: buildVariantLabel(variant, Number(variant.price) || 0),
          }))
          .filter((v: VariantOption) => v.productvariantid);

        setVariants(options);

        if (selectedVariantId && options.some((v: VariantOption) => v.productvariantid === selectedVariantId)) {
          setFormData((prev) => ({ ...prev, productvariantid: selectedVariantId }));
        } else if (options.length === 1) {
          setFormData((prev) => ({ ...prev, productvariantid: options[0].productvariantid }));
        }
      } else {
        setVariants([]);
      }
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    if (formData.productid) {
      loadVariantsForProduct(formData.productid, formData.productvariantid || undefined);
    } else {
      setVariants([]);
    }
  }, [formData.productid]);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.productvariantid === formData.productvariantid),
    [variants, formData.productvariantid]
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setVariants([]);
    setFormError('');
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: SuperPromoDisplayItem) => {
    setEditingId(item.superpromoid);
    setFormData({
      productid: item.productid,
      productvariantid: item.productvariantid,
      promoprice: item.promoPrice.toFixed(2),
      sortorder: String(item.sortorder),
      isactive: item.isactive,
    });
    setFormError('');
    setShowModal(true);
    loadVariantsForProduct(item.productid, item.productvariantid);
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!formData.productid || !formData.productvariantid) {
      setFormError(language === 'bg' ? 'Изберете продукт и вариант (размер).' : 'Select product and variant (size).');
      return;
    }

    const promoPrice = parseFloat(formData.promoprice);
    if (!Number.isFinite(promoPrice) || promoPrice <= 0) {
      setFormError(language === 'bg' ? 'Въведете валидна промо цена.' : 'Enter a valid promo price.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        superpromoid: editingId || undefined,
        productid: formData.productid,
        productvariantid: formData.productvariantid,
        promoprice: promoPrice,
        sortorder: parseInt(formData.sortorder, 10) || 0,
        isactive: formData.isactive,
      };

      const response = await fetch('/api/admin/super-promo', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        setFormError(result.error || 'Failed to save');
        return;
      }

      setShowModal(false);
      resetForm();
      await loadItems();
    } catch {
      setFormError(language === 'bg' ? 'Грешка при запис.' : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      language === 'bg' ? 'Изтриване на SUPER PROMO офертата?' : 'Delete this SUPER PROMO offer?'
    );
    if (!confirmed) return;

    const response = await fetch(`/api/admin/super-promo?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (result.success) {
      await loadItems();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <AdminLayout currentPath="/admin/super-promo">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.colors.text }}>
              SUPER PROMO
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg'
                ? 'Добавете избрани продукти и размери със специална промо цена за страницата /super-promo.'
                : 'Add chosen products and sizes with special promo prices for the /super-promo page.'}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/super-promo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: theme.colors.border, color: theme.colors.text }}
            >
              <ExternalLink size={16} />
              {language === 'bg' ? 'Виж страницата' : 'View page'}
            </a>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Plus size={16} />
              {language === 'bg' ? 'Добави оферта' : 'Add offer'}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.cardBg }}
        >
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: theme.colors.textSecondary }}>
              {language === 'bg' ? 'Няма SUPER PROMO оферти.' : 'No SUPER PROMO offers yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead style={{ backgroundColor: theme.colors.secondary }}>
                  <tr>
                    <th className="text-left px-4 py-3">{language === 'bg' ? 'Продукт' : 'Product'}</th>
                    <th className="text-left px-4 py-3">{language === 'bg' ? 'Размер' : 'Size'}</th>
                    <th className="text-left px-4 py-3">{language === 'bg' ? 'Оригинал' : 'Original'}</th>
                    <th className="text-left px-4 py-3">SUPER PROMO</th>
                    <th className="text-left px-4 py-3">{language === 'bg' ? 'Ред' : 'Order'}</th>
                    <th className="text-right px-4 py-3">{language === 'bg' ? 'Действия' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.superpromoid} className="border-t" style={{ borderColor: theme.colors.border }}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
                          {item.color}
                        </div>
                      </td>
                      <td className="px-4 py-3">{item.size || '—'}</td>
                      <td className="px-4 py-3">€{item.originalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 font-semibold text-red-600">€{item.promoPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">{item.sortorder}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg border"
                            style={{ borderColor: theme.colors.border }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.superpromoid)}
                            className="p-2 rounded-lg border text-red-600"
                            style={{ borderColor: theme.colors.border }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AdminModal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
            resetForm();
          }
        }}
        title={editingId ? (language === 'bg' ? 'Редакция SUPER PROMO' : 'Edit SUPER PROMO') : (language === 'bg' ? 'Нова SUPER PROMO оферта' : 'New SUPER PROMO offer')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'bg' ? 'Продукт' : 'Product'}
            </label>
            <select
              value={formData.productid}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productid: e.target.value,
                  productvariantid: '',
                })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{language === 'bg' ? 'Изберете продукт' : 'Select product'}</option>
              {products.map((product) => (
                <option key={product.productid} value={product.productid}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'bg' ? 'Вариант / размер' : 'Variant / size'}
            </label>
            <select
              value={formData.productvariantid}
              onChange={(e) => setFormData({ ...formData, productvariantid: e.target.value })}
              disabled={!formData.productid || loadingVariants}
              className="w-full border rounded-lg px-3 py-2 text-sm disabled:opacity-60"
            >
              <option value="">
                {loadingVariants
                  ? language === 'bg'
                    ? 'Зареждане...'
                    : 'Loading...'
                  : language === 'bg'
                    ? 'Изберете размер'
                    : 'Select size'}
              </option>
              {variants.map((variant) => (
                <option key={variant.productvariantid} value={variant.productvariantid}>
                  {variant.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'bg' ? 'SUPER PROMO цена (€)' : 'SUPER PROMO price (€)'}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.promoprice}
                onChange={(e) => setFormData({ ...formData, promoprice: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={selectedVariant ? selectedVariant.price.toFixed(2) : '59.99'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'bg' ? 'Ред на показване' : 'Display order'}
              </label>
              <input
                type="number"
                value={formData.sortorder}
                onChange={(e) => setFormData({ ...formData, sortorder: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.isactive}
              onChange={(e) => setFormData({ ...formData, isactive: e.target.checked })}
            />
            {language === 'bg' ? 'Активна оферта' : 'Active offer'}
          </label>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border text-sm"
              disabled={submitting}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: theme.colors.primary }}
            >
              {submitting ? (language === 'bg' ? 'Запис...' : 'Saving...') : t.save}
            </button>
          </div>
        </div>
      </AdminModal>
    </AdminLayout>
  );
}
