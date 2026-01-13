'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ProductType, Property } from '@/lib/types/product-types';
import AdminModal from '../../components/AdminModal';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function ProductTypeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { language } = useLanguage();
  const t = translations[language || 'bg'];

  const [productType, setProductType] = useState<ProductType | null>(null);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadProductType();
      loadAvailableProperties();
    }
  }, [id]);

  const loadProductType = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/product-types/${id}`);
      const result = await response.json();
      if (result.success) {
        setProductType(result.productType);
        setAssignedProperties(result.productType.product_type_properties || []);
      }
    } catch (error) {
      console.error('Failed to load product type:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      const result = await response.json();
      if (result.success) {
        setAvailableProperties(result.properties);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    }
  };

  const handleAddProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/product-types/${id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyid: propertyId })
      });

      const result = await response.json();
      if (result.success) {
        loadProductType();
        setShowAddModal(false);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Failed to add property');
    }
  };

  const handleRemoveProperty = async (propertyId: string) => {
    if (!confirm(t.removeProperty)) return;

    try {
      const response = await fetch(`/api/product-types/${id}/properties?propertyId=${propertyId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        loadProductType();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to remove property:', error);
      alert('Failed to remove property');
    }
  };

  const unassignedProperties = availableProperties.filter(
    prop => !assignedProperties.some(ap => ap.propertyid === prop.propertyid)
  );

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>;
  }

  if (!productType) {
    return <div className="min-h-screen bg-gray-50 p-8">Product type not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/product-types')}
            className="p-2 hover:bg-gray-200 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{productType.name}</h1>
            <p className="text-gray-500">Code: {productType.code}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{language === 'bg' ? 'Присвоени свойства' : 'Assigned Properties'}</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              {t.addProperty}
            </button>
          </div>

          {assignedProperties.length === 0 ? (
            <p className="text-gray-500">{language === 'bg' ? 'Няма присвоени свойства все още.' : 'No properties assigned yet.'}</p>
          ) : (
            <div className="space-y-2">
              {assignedProperties.map((ap) => (
                <div
                  key={ap.ProductTypePropertyID}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded"
                >
                  <div>
                    <div className="font-medium">{ap.properties?.name}</div>
                    {ap.properties?.description && (
                      <div className="text-sm text-gray-500">{ap.properties.description}</div>
                    )}
                    <div className="text-xs text-gray-400">Type: {ap.properties?.datatype}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveProperty(ap.propertyid)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdminModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={t.addProperty}
          subheader={language === 'bg' ? 'Добавете свойство към този тип продукт' : 'Add a property to this product type'}
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={300}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedProperties.length === 0 ? (
                  <p className="text-gray-500">{t.allPropertiesAssigned}</p>
                ) : (
                  unassignedProperties.map((prop) => (
                    <button
                      key={prop.propertyid}
                      onClick={() => handleAddProperty(prop.propertyid)}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{prop.name}</div>
                      {prop.description && (
                        <div className="text-sm text-gray-500">{prop.description}</div>
                      )}
                      <div className="text-xs text-gray-400">Type: {prop.datatype}</div>
                    </button>
                  ))
                )}
          </div>
        </AdminModal>
      </div>
    </div>
  );
}




