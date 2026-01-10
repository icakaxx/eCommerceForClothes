'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { ProductType } from '@/lib/types/product-types';
import AdminLayout from '../components/AdminLayout';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function ProductTypesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'bg'];
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  useEffect(() => {
    loadProductTypes();
  }, []);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/product-types');
      const result = await response.json();
      if (result.success) {
        setProductTypes(result.productTypes);
      }
    } catch (error) {
      console.error('Failed to load product types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProductType 
        ? `/api/product-types/${editingProductType.producttypeid}`
        : '/api/product-types';
      const method = editingProductType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        setFormData({ name: '', code: '' });
        setEditingProductType(null);
        loadProductTypes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save product type:', error);
      alert('Failed to save product type');
    }
  };

  const handleEdit = (productType: ProductType) => {
    setEditingProductType(productType);
    setFormData({ name: productType.name, code: productType.code });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDeleteProductType)) return;

    try {
      const response = await fetch(`/api/product-types/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        loadProductTypes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete product type:', error);
      alert('Failed to delete product type');
    }
  };

  const handleManageProperties = (productType: ProductType) => {
    router.push(`/admin/product-types/${productType.producttypeid}`);
  };

  return (
    <AdminLayout currentPath="/admin/product-types">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Типове продукти</h1>
          <button
            onClick={() => {
              setEditingProductType(null);
              setFormData({ name: '', code: '' });
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.addProductType}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm sm:text-base text-gray-500">{language === 'bg' ? 'Зареждане...' : 'Loading...'}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.name}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.code}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productTypes.map((pt) => (
                      <tr key={pt.producttypeid} className="hover:bg-gray-50">
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="truncate max-w-xs">{pt.name}</div>
                        </td>
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-mono text-xs">{pt.code}</span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleManageProperties(pt)}
                              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors touch-manipulation"
                              title={t.manageProperties || 'Manage Properties'}
                            >
                              {t.manageProperties || 'Manage'}
                            </button>
                            <button
                              onClick={() => handleEdit(pt)}
                              className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors touch-manipulation"
                              title={t.editProductType || 'Edit'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(pt.producttypeid)}
                              className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                              title={language === 'bg' ? 'Изтрий' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {productTypes.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <p className="text-sm sm:text-base">{t.noProductTypesFound}</p>
                </div>
              )}
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="md:hidden space-y-3">
              {productTypes.map((pt) => (
                <div key={pt.producttypeid} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 truncate">{pt.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 font-mono">{pt.code}</p>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleManageProperties(pt)}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 active:bg-blue-100 rounded transition-colors touch-manipulation whitespace-nowrap"
                        title={t.manageProperties || 'Manage Properties'}
                      >
                        {t.manageProperties || 'Manage'}
                      </button>
                      <button
                        onClick={() => handleEdit(pt)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 rounded transition-colors touch-manipulation"
                        title={t.editProductType || 'Edit'}
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(pt.producttypeid)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 active:bg-red-100 rounded transition-colors touch-manipulation"
                        title={language === 'bg' ? 'Изтрий' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {productTypes.length === 0 && (
                <div className="bg-white p-4 rounded-lg shadow border text-center">
                  <p className="text-sm text-gray-500">{t.noProductTypesFound}</p>
                </div>
              )}
            </div>
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl font-bold">
                  {editingProductType ? t.editProductType : t.addProductType}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.name}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.code}
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        required
                      />
                    </div>
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                      >
                        {editingProductType ? t.update : t.create}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

