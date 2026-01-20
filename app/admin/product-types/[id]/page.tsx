'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { ProductType, Property } from '@/lib/types/product-types';
import AdminModal from '../../components/AdminModal';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import CompleteAnimation from '@/components/CompleteAnimation';

export default function ProductTypeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { language } = useLanguage();
  const t = translations[language || 'bg'];

  const [productType, setProductType] = useState<ProductType | null>(null);

  useEffect(() => {
    if (productType) {
      document.title = productType.name || t.productTypes || (language === 'bg' ? 'Категория' : 'Product Type');
    } else {
      document.title = t.productTypes || (language === 'bg' ? 'Категория' : 'Product Type');
    }
  }, [productType, language, t]);
  const [assignedProperties, setAssignedProperties] = useState<any[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [addingProperties, setAddingProperties] = useState(false);
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);

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

  const handleAddProperty = async (propertyId?: string) => {
    // If propertyId is provided, use it for backward compatibility
    // Otherwise, use selectedPropertyIds
    const propertyIds = propertyId 
      ? [propertyId] 
      : Array.from(selectedPropertyIds);

    if (propertyIds.length === 0) {
      alert(language === 'bg' ? 'Моля, изберете поне една характеристика' : 'Please select at least one property');
      return;
    }

    try {
      setAddingProperties(true);
      const response = await fetch(`/api/product-types/${id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyids: propertyIds })
      });

      const result = await response.json();
      if (result.success) {
        // Show complete animation
        setShowCompleteAnimation(true);
        
        // Close modal and reset after animation completes
        setTimeout(() => {
          loadProductType();
          setSelectedPropertyIds(new Set());
          setShowAddModal(false);
          setShowCompleteAnimation(false);
        }, 1200);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to add properties:', error);
      alert(language === 'bg' ? 'Грешка при добавяне на характеристики' : 'Failed to add properties');
    } finally {
      setAddingProperties(false);
    }
  };

  const handleToggleProperty = (propertyId: string) => {
    setSelectedPropertyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPropertyIds.size === unassignedProperties.length) {
      // Deselect all
      setSelectedPropertyIds(new Set());
    } else {
      // Select all
      setSelectedPropertyIds(new Set(unassignedProperties.map(p => p.propertyid)));
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{language === 'bg' ? 'Присвоени характеристики' : 'Assigned Properties'}</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              {t.addProperty}
            </button>
          </div>

          {assignedProperties.length === 0 ? (
            <p className="text-gray-500">{language === 'bg' ? 'Няма присвоени характеристики все още.' : 'No properties assigned yet.'}</p>
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
          onClose={() => {
            if (!showCompleteAnimation) {
              setShowAddModal(false);
              setSelectedPropertyIds(new Set());
              setShowCompleteAnimation(false);
            }
          }}
          title={t.addProperty}
          subheader={language === 'bg' ? 'Изберете характеристики за добавяне към тази категория' : 'Select properties to add to this category'}
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={300}
        >
          <div className="relative">
            <div className={`space-y-4 transition-all duration-300 ${showCompleteAnimation ? 'blur-sm pointer-events-none' : ''}`}>
            {unassignedProperties.length === 0 ? (
              <p className="text-gray-500">{t.allPropertiesAssigned}</p>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-2 border-b">
                  <input
                    type="checkbox"
                    id="select-all-properties"
                    checked={selectedPropertyIds.size === unassignedProperties.length && unassignedProperties.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="select-all-properties"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {language === 'bg' ? 'Избери всички' : 'Select All'}
                  </label>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unassignedProperties.map((prop) => (
                    <label
                      key={prop.propertyid}
                      className="flex items-start gap-3 w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.has(prop.propertyid)}
                        onChange={() => handleToggleProperty(prop.propertyid)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{prop.name}</div>
                        {prop.description && (
                          <div className="text-sm text-gray-500">{prop.description}</div>
                        )}
                        <div className="text-xs text-gray-400">Type: {prop.datatype}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      if (!showCompleteAnimation) {
                        setShowAddModal(false);
                        setSelectedPropertyIds(new Set());
                        setShowCompleteAnimation(false);
                      }
                    }}
                    disabled={showCompleteAnimation}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    {language === 'bg' ? 'Отказ' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleAddProperty()}
                    disabled={selectedPropertyIds.size === 0 || addingProperties || showCompleteAnimation}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingProperties ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        {language === 'bg' ? 'Добавяне...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {language === 'bg' 
                          ? `Добави (${selectedPropertyIds.size})` 
                          : `Add (${selectedPropertyIds.size})`}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
            </div>
            
            {/* Complete Animation Overlay */}
            {showCompleteAnimation && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <CompleteAnimation size={120} />
              </div>
            )}
          </div>
        </AdminModal>
      </div>
    </div>
  );
}




