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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Типове продукти</h1>
          <button
            onClick={() => {
              setEditingProductType(null);
              setFormData({ name: '', code: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t.addProductType}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Зареждане...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.code}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productTypes.map((pt) => (
                  <tr key={pt.producttypeid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pt.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pt.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleManageProperties(pt)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t.manageProperties}
                        </button>
                        <button
                          onClick={() => handleEdit(pt)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pt.producttypeid)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productTypes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {t.noProductTypesFound}
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingProductType ? t.editProductType : t.addProductType}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.name}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.code}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingProductType ? t.update : t.create}
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

