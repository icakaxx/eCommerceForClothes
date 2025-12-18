'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { getAdminSession } from '@/lib/auth';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Discount {
  discountid: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  isactive: boolean;
  createdat: string;
  expiresat?: string;
}

interface DiscountFormData {
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: string;
  isactive: boolean;
  expiresat: string;
}

export default function DiscountsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    isactive: true,
    expiresat: ''
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
      loadDiscounts();
    }
  }, [isAuthenticated]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/discounts');
      const result = await response.json();
      if (result.success) {
        setDiscounts(result.discounts || []);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: '',
      isactive: true,
      expiresat: ''
    });
    setFormErrors([]);
    setEditingDiscount(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setFormData({
      code: discount.code,
      description: discount.description || '',
      type: discount.type,
      value: discount.value.toString(),
      isactive: discount.isactive,
      expiresat: discount.expiresat ? new Date(discount.expiresat).toISOString().slice(0, 16) : ''
    });
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.code.trim()) {
      errors.push(t.discountCodeRequiredMsg);
    } else if (formData.code.length < 3 || formData.code.length > 50) {
      errors.push(t.discountCodeLengthMsg);
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      errors.push(t.discountCodeFormatMsg);
    }

    if (!formData.type || !['percentage', 'fixed'].includes(formData.type)) {
      errors.push(t.discountTypeRequiredMsg);
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      errors.push(t.discountValueRequiredMsg);
    } else if (formData.type === 'percentage' && value > 100) {
      errors.push(t.discountPercentageMaxMsg);
    }

    if (formData.expiresat) {
      const expiryDate = new Date(formData.expiresat);
      if (isNaN(expiryDate.getTime())) {
        errors.push(t.invalidExpiryDateMsg);
      } else if (expiryDate <= new Date()) {
        errors.push(t.expiryDateFutureMsg);
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors([]);

      const submitData = {
        ...formData,
        value: parseFloat(formData.value),
        expiresat: formData.expiresat || null,
        ...(editingDiscount && { discountid: editingDiscount.discountid })
      };

      const method = editingDiscount ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/discounts', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setFormErrors(result.details);
        } else {
          setFormErrors([result.error || 'Failed to save discount']);
        }
        return;
      }

      if (result.success) {
        await loadDiscounts();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to save discount:', error);
      setFormErrors([t.unexpectedError]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (discount: Discount) => {
    if (!confirm(`${t.confirmDeleteDiscount} "${discount.code}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/discounts?id=${discount.discountid}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadDiscounts();
      } else {
        alert(`${t.failedToDeleteDiscount}: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete discount:', error);
      alert(t.unexpectedErrorDeleting);
    }
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

  const activeDiscounts = discounts.filter(d => d.isactive).length;

  return (
    <AdminLayout currentPath="/admin/discounts">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t.discounts}</h1>
          <p className="text-gray-600 mt-2">{t.manageDiscountCodesAndPromotions}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">{t.totalDiscounts}</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{discounts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">{t.activeDiscounts}</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{activeDiscounts}</p>
          </div>
        </div>

        {/* Add Discount Button */}
        <div className="mb-6">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            {t.addDiscountCode}
          </button>
        </div>

        {/* Discounts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">{t.loadingDiscounts}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.codeHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.descriptionHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.typeHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.valueHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.statusHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.expiresHeader}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actionsHeader}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {discounts.map((discount) => (
                  <tr key={discount.discountid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {discount.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.description || t.na}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.type === 'percentage' ? t.percentage : t.fixedAmount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.type === 'percentage' ? `${discount.value}%` : `€${discount.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        discount.isactive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.isactive ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {discount.expiresat ? new Date(discount.expiresat).toLocaleDateString() : t.never}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit discount"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(discount)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete discount"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {discounts.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              {t.noDiscountsFoundEmpty}
            </div>
          )}
        </div>

        {/* Discount Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingDiscount ? t.editDiscountCode : t.createDiscountCode}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Form Errors */}
                {formErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <ul className="text-sm text-red-600 space-y-1">
                      {formErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.discountCodeRequired}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.discountCodePlaceholder}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t.discountCodeHelp}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.discountDescription}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t.discountDescriptionPlaceholder}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.discountTypeRequired}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">{t.percentage}</option>
                    <option value="fixed">{t.fixedAmount}</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.discountValueRequired}
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                      min="0"
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      required
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                      {formData.type === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.expiryDateOptional}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresat}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isactive"
                    checked={formData.isactive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isactive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isactive" className="ml-2 block text-sm text-gray-700">
                    {t.activeStatus}
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={submitting}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? t.saving : (editingDiscount ? t.updateDiscount : t.createDiscountBtn)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}