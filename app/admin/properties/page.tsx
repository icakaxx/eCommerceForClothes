'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, List, ChevronDown, ChevronRight } from 'lucide-react';
import { Property, PropertyValue } from '@/lib/types/product-types';
import { PropertyValuesStorage } from '@/lib/propertyValuesStorage';
import AdminLayout from '../components/AdminLayout';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

export default function PropertiesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination calculations
  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = properties.slice(startIndex, endIndex);

  // Reset to first page when properties change
  useEffect(() => {
    setCurrentPage(1);
  }, [properties.length]);
  const [formData, setFormData] = useState({ name: '', description: '', datatype: 'text' as 'text' | 'select' | 'number' });
  const [expandedProperties, setExpandedProperties] = useState<Set<string>>(new Set());
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<PropertyValue | null>(null);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [valueFormData, setValueFormData] = useState({ value: '', displayorder: 0 });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/properties');
      const result = await response.json();
      if (result.success) {
        // Merge database properties with local storage values
        const propertiesWithLocalValues = result.properties.map((prop: Property) => {
          // If database has values, use them; otherwise check local storage
          const localValues = PropertyValuesStorage.getPropertyValues(prop.propertyid);
          return {
            ...prop,
            values: prop.values && prop.values.length > 0 ? prop.values : localValues
          };
        });
        setProperties(propertiesWithLocalValues);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      // As a last resort, try to load from local storage only
      try {
        const localData = PropertyValuesStorage.getAllPropertyValues();
        const localProperties = Object.keys(localData).map(propertyId => ({
          propertyid: propertyId,
          name: `Property ${propertyId}`,
          description: 'Locally stored property',
          datatype: 'select' as const,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
          values: localData[propertyId]
        }));
        setProperties(localProperties);
      } catch (localError) {
        console.error('Failed to load local properties:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProperty 
        ? `/api/properties/${editingProperty.propertyid}`
        : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        setFormData({ name: '', description: '', datatype: 'text' });
        setEditingProperty(null);
        loadProperties();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save property:', error);
      alert('Failed to save property');
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      name: property.name,
      description: property.description || '',
      datatype: property.datatype
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        loadProperties();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property');
    }
  };

  const togglePropertyExpansion = (propertyId: string) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  const handleAddValue = (property: Property) => {
    setCurrentProperty(property);
    setEditingValue(null);
    setValueFormData({ value: '', displayorder: (property.values?.length || 0) + 1 });
    setShowValueModal(true);
  };

  const handleEditValue = (property: Property, value: PropertyValue) => {
    setCurrentProperty(property);
    setEditingValue(value);
    setValueFormData({ value: value.value, displayorder: value.displayorder });
    setShowValueModal(true);
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm('Are you sure you want to delete this property value?')) return;

    try {
      const response = await fetch(`/api/properties/values/${valueId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        // If it's a temporary/local value, also remove from local storage
        if (valueId.startsWith('temp-') || result.warning) {
          // Find which property this value belongs to and remove it from local storage
          const allLocalData = PropertyValuesStorage.getAllPropertyValues();
          for (const [propertyId, values] of Object.entries(allLocalData)) {
            const valueIndex = values.findIndex(v => v.propertyvalueid === valueId);
            if (valueIndex !== -1) {
              PropertyValuesStorage.deletePropertyValue(propertyId, valueId);
              break;
            }
          }
        }

        loadProperties();

        if (result.warning) {
          alert('Property value deleted locally. Database migration needed for persistence.');
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete property value via API, using local storage:', error);

      // Fallback to local storage
      const allLocalData = PropertyValuesStorage.getAllPropertyValues();
      for (const [propertyId, values] of Object.entries(allLocalData)) {
        const valueIndex = values.findIndex(v => v.propertyvalueid === valueId);
        if (valueIndex !== -1) {
          PropertyValuesStorage.deletePropertyValue(propertyId, valueId);
          loadProperties();
          alert('Property value deleted locally. Database migration needed for full functionality.');
          return;
        }
      }

      alert('Failed to delete property value');
    }
  };

  const handleNextValue = async () => {
    if (!currentProperty || !valueFormData.value.trim()) return;

    try {
      const url = editingValue
        ? `/api/properties/values/${editingValue.propertyvalueid}`
        : `/api/properties/${currentProperty.propertyid}/values`;
      const method = editingValue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valueFormData)
      });

      const result = await response.json();
      if (result.success) {
        // If it's a temporary/local value, store it locally
        if (result.value?.PropertyValueID?.startsWith('temp-') || result.warning) {
          const value: PropertyValue = {
            propertyvalueid: result.value.propertyvalueid || PropertyValuesStorage.generateTempId(),
            propertyid: currentProperty.propertyid,
            value: valueFormData.value,
            displayorder: valueFormData.displayorder,
            isactive: true,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          };

          if (editingValue) {
            PropertyValuesStorage.updatePropertyValue(currentProperty.propertyid, editingValue.propertyvalueid, value);
          } else {
            PropertyValuesStorage.addPropertyValue(currentProperty.propertyid, value);
          }
        }

        // Clear value and increment display order, keep modal open
        setValueFormData({
          value: '',
          displayorder: valueFormData.displayorder + 1
        });
        loadProperties();

        if (result.warning) {
          alert('Property value saved locally. Database migration needed for persistence.');
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save property value via API, using local storage:', error);

      // Fallback to local storage
      const value: PropertyValue = {
        propertyvalueid: editingValue?.propertyvalueid || PropertyValuesStorage.generateTempId(),
        propertyid: currentProperty.propertyid,
        value: valueFormData.value,
        displayorder: valueFormData.displayorder,
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      if (editingValue) {
        PropertyValuesStorage.updatePropertyValue(currentProperty.propertyid, editingValue.propertyvalueid, value);
      } else {
        PropertyValuesStorage.addPropertyValue(currentProperty.propertyid, value);
      }

      // Clear value and increment display order, keep modal open
      setValueFormData({
        value: '',
        displayorder: valueFormData.displayorder + 1
      });
      loadProperties();

      alert('Property value saved locally. Database migration needed for full functionality.');
    }
  };

  const handleValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProperty) return;

    try {
      const url = editingValue
        ? `/api/properties/values/${editingValue.propertyvalueid}`
        : `/api/properties/${currentProperty.propertyid}/values`;
      const method = editingValue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valueFormData)
      });

      const result = await response.json();
      if (result.success) {
        // If it's a temporary/local value, store it locally
        if (result.value?.PropertyValueID?.startsWith('temp-') || result.warning) {
          const value: PropertyValue = {
            propertyvalueid: result.value.propertyvalueid || PropertyValuesStorage.generateTempId(),
            propertyid: currentProperty.propertyid,
            value: valueFormData.value,
            displayorder: valueFormData.displayorder,
            isactive: true,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          };

          if (editingValue) {
            PropertyValuesStorage.updatePropertyValue(currentProperty.propertyid, editingValue.propertyvalueid, value);
          } else {
            PropertyValuesStorage.addPropertyValue(currentProperty.propertyid, value);
          }
        }

        setShowValueModal(false);
        setValueFormData({ value: '', displayorder: 0 });
        setEditingValue(null);
        setCurrentProperty(null);
        loadProperties();

        if (result.warning) {
          alert('Property value saved locally. Database migration needed for persistence.');
        }
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save property value via API, using local storage:', error);

      // Fallback to local storage
      const value: PropertyValue = {
        propertyvalueid: editingValue?.propertyvalueid || PropertyValuesStorage.generateTempId(),
        propertyid: currentProperty.propertyid,
        value: valueFormData.value,
        displayorder: valueFormData.displayorder,
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      };

      if (editingValue) {
        PropertyValuesStorage.updatePropertyValue(currentProperty.propertyid, editingValue.propertyvalueid, value);
      } else {
        PropertyValuesStorage.addPropertyValue(currentProperty.propertyid, value);
      }

      setShowValueModal(false);
      setValueFormData({ value: '', displayorder: 0 });
      setEditingValue(null);
      setCurrentProperty(null);
      loadProperties();

      alert('Property value saved locally. Database migration needed for full functionality.');
    }
  };

  return (
    <AdminLayout currentPath="/admin/properties">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Properties</h1>
          <button
            onClick={() => {
              setEditingProperty(null);
              setFormData({ name: '', description: '', datatype: 'text' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t.addProperty}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.description}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.dataType}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.propertyValues}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProperties.map((prop) => (
                  <React.Fragment key={prop.propertyid}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {prop.datatype === 'select' && (
                            <button
                              onClick={() => togglePropertyExpansion(prop.propertyid)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedProperties.has(prop.propertyid) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {prop.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prop.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prop.datatype}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {prop.datatype === 'select' ? (
                          <span>{prop.values?.length || 0} values</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {prop.datatype === 'select' && (
                            <button
                              onClick={() => handleAddValue(prop)}
                              className="text-green-600 hover:text-green-900"
                              title="Add Value"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(prop)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Property"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prop.propertyid)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded property values */}
                    {expandedProperties.has(prop.propertyid) && prop.datatype === 'select' && (
                      <tr>
                        <td colSpan={5} className="px-6 py-0">
                          <div className="bg-gray-50 rounded-md p-4 m-2">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium text-gray-700">
                                Property Values
                              </h4>
                              <button
                                onClick={() => handleAddValue(prop)}
                                className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Plus className="w-3 h-3" />
                                Add Value
                              </button>
                            </div>

                            {prop.values && prop.values.length > 0 ? (
                              <div className="space-y-2">
                                {prop.values.map((value) => (
                                  <div
                                    key={value.propertyvalueid}
                                    className="flex items-center justify-between bg-white p-2 rounded border"
                                  >
                                    <span className="text-sm">{value.value}</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEditValue(prop, value)}
                                        className="text-indigo-600 hover:text-indigo-900 p-1"
                                        title="Edit Value"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteValue(value.propertyvalueid)}
                                        className="text-red-600 hover:text-red-900 p-1"
                                        title="Delete Value"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                No values defined. Click "Add Value" to create options for this property.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {properties.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No properties found. Create one to get started.
              </div>
            )}
          </div>
        )}

        {/* Mobile Card Layout */}
        {!loading && (
          <div className="block md:hidden space-y-4">
            {currentProperties.map((prop) => (
              <div key={prop.propertyid} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{prop.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{prop.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{t.dataType}: {prop.datatype}</span>
                      {prop.datatype === 'select' && (
                        <span>{prop.values?.length || 0} {t.propertyValues.toLowerCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {prop.datatype === 'select' && (
                      <button
                        onClick={() => handleAddValue(prop)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                        title="Add Value"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(prop)}
                      className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                      title="Edit Property"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prop.propertyid)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded values for mobile */}
                {expandedProperties.has(prop.propertyid) && prop.datatype === 'select' && prop.values && prop.values.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{t.propertyValues}:</h4>
                    <div className="space-y-1">
                      {prop.values.map((value) => (
                        <div key={value.propertyvalueid} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-sm">
                          <span>{value.value}</span>
                          <button
                            onClick={() => handleDeleteValue(value.propertyvalueid)}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Delete Value"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {language === 'bg'
                ? `Показване на ${startIndex + 1} до ${Math.min(endIndex, properties.length)} от ${properties.length} свойства`
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, properties.length)} of ${properties.length} properties`
              }
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {language === 'bg' ? 'Предишна' : 'Previous'}
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNumber > totalPages) return null;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {language === 'bg' ? 'Следваща' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingProperty ? t.editProperty : t.addProperty}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Type
                  </label>
                  <select
                    value={formData.datatype}
                    onChange={(e) => setFormData({ ...formData, datatype: e.target.value as 'text' | 'select' | 'number' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingProperty ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showValueModal && currentProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingValue ? t.editPropertyValue : t.addPropertyValue}
                </h2>
                <button onClick={() => setShowValueModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  Property: <strong>{currentProperty.name}</strong>
                </p>
              </div>
              <form onSubmit={handleValueSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value *
                  </label>
                  <input
                    type="text"
                    value={valueFormData.value}
                    onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter value (e.g., Genuine Leather)"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={valueFormData.displayorder}
                    onChange={(e) => setValueFormData({ ...valueFormData, displayorder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first in the list
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowValueModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {!editingValue && (
                    <button
                      type="button"
                      onClick={handleNextValue}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Next
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingValue ? 'Update' : 'Add'} Value
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

