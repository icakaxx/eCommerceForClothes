'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { ProductType, Property } from '@/lib/types/product-types';

export default function ProductTypeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
        body: JSON.stringify({ PropertyID: propertyId })
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
    if (!confirm('Are you sure you want to remove this property?')) return;

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
    prop => !assignedProperties.some(ap => ap.PropertyID === prop.PropertyID)
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
            <h1 className="text-3xl font-bold">{productType.Name}</h1>
            <p className="text-gray-500">Code: {productType.Code}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Assigned Properties</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Property
            </button>
          </div>

          {assignedProperties.length === 0 ? (
            <p className="text-gray-500">No properties assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignedProperties.map((ap) => (
                <div
                  key={ap.ProductTypePropertyID}
                  className="flex justify-between items-center p-3 border border-gray-200 rounded"
                >
                  <div>
                    <div className="font-medium">{ap.properties?.Name}</div>
                    {ap.properties?.Description && (
                      <div className="text-sm text-gray-500">{ap.properties.Description}</div>
                    )}
                    <div className="text-xs text-gray-400">Type: {ap.properties?.DataType}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveProperty(ap.PropertyID)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Property</h2>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedProperties.length === 0 ? (
                  <p className="text-gray-500">All available properties are already assigned.</p>
                ) : (
                  unassignedProperties.map((prop) => (
                    <button
                      key={prop.PropertyID}
                      onClick={() => handleAddProperty(prop.PropertyID)}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{prop.Name}</div>
                      {prop.Description && (
                        <div className="text-sm text-gray-500">{prop.Description}</div>
                      )}
                      <div className="text-xs text-gray-400">Type: {prop.DataType}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


