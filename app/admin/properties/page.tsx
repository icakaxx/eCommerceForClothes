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
    if (!confirm(t.confirmDeleteProperty)) return;

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
    if (!confirm(t.confirmDeletePropertyValue)) return;

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Свойства</h1>
          <button
            onClick={() => {
              setEditingProperty(null);
              setFormData({ name: '', description: '', datatype: 'text' });
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.addProperty}
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
                        {t.description}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.dataType || 'Data Type'}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.propertyValues}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProperties.map((prop) => (
                      <React.Fragment key={prop.propertyid}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {prop.datatype === 'select' && (
                                <button
                                  onClick={() => togglePropertyExpansion(prop.propertyid)}
                                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                                  title={expandedProperties.has(prop.propertyid) ? 'Collapse' : 'Expand'}
                                >
                                  {expandedProperties.has(prop.propertyid) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                              <span className="truncate max-w-xs">{prop.name}</span>
                            </div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 text-sm text-gray-500">
                            <div className="max-w-xs truncate">{prop.description || '-'}</div>
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{prop.datatype}</span>
                          </td>
                          <td className="px-4 xl:px-6 py-4 text-sm text-gray-500">
                            {prop.datatype === 'select' ? (
                              <span>{prop.values?.length || 0} {language === 'bg' ? 'стойности' : 'values'}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {prop.datatype === 'select' && (
                                <button
                                  onClick={() => handleAddValue(prop)}
                                  className="p-1.5 sm:p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors touch-manipulation"
                                  title={t.addPropertyValue || 'Add Value'}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(prop)}
                                className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors touch-manipulation"
                                title={t.editProperty || 'Edit Property'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(prop.propertyid)}
                                className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                                title={language === 'bg' ? 'Изтрий свойство' : 'Delete Property'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded property values - Desktop */}
                        {expandedProperties.has(prop.propertyid) && prop.datatype === 'select' && (
                          <tr>
                            <td colSpan={5} className="px-4 xl:px-6 py-0">
                              <div className="bg-gray-50 rounded-md p-3 sm:p-4 m-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                                  <h4 className="text-xs sm:text-sm font-medium text-gray-700">
                                    {language === 'bg' ? 'Стойности на свойство' : 'Property Values'}
                                  </h4>
                                  <button
                                    onClick={() => handleAddValue(prop)}
                                    className="flex items-center justify-center gap-1 text-xs px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation w-full sm:w-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {language === 'bg' ? 'Добавяне на стойност' : 'Add Value'}
                                  </button>
                                </div>

                                {prop.values && prop.values.length > 0 ? (
                                  <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
                                    {prop.values.map((value) => (
                                      <div
                                        key={value.propertyvalueid}
                                        className="flex items-center justify-between bg-white p-2 sm:p-3 rounded border hover:bg-gray-50 transition-colors"
                                      >
                                        <span className="text-xs sm:text-sm flex-1 min-w-0 truncate">{value.value}</span>
                                        <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                                          <button
                                            onClick={() => handleEditValue(prop, value)}
                                            className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors touch-manipulation"
                                            title={t.editPropertyValue || 'Edit Value'}
                                          >
                                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteValue(value.propertyvalueid)}
                                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                                            title={language === 'bg' ? 'Изтрий стойност' : 'Delete Value'}
                                          >
                                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 text-xs sm:text-sm">
                                    {t.noValuesDefined || (language === 'bg' ? 'Не са дефинирани стойности. Натиснете "Добавяне на стойност", за да създадете опции за този свойство.' : 'No values defined. Click "Add Value" to create options for this property.')}
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
              </div>
              {properties.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <p className="text-sm sm:text-base">{t.noPropertiesFound || (language === 'bg' ? 'Не са намерили свойства. Създайте едно, за да започнете.' : 'No properties found. Create one to get started.')}</p>
                </div>
              )}
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {currentProperties.map((prop) => {
                const isExpanded = expandedProperties.has(prop.propertyid);
                return (
                  <div key={prop.propertyid} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {prop.datatype === 'select' && (
                            <button
                              onClick={() => togglePropertyExpansion(prop.propertyid)}
                              className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation flex-shrink-0"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{prop.name}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{prop.description || (language === 'bg' ? 'Без описание' : 'No description')}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{prop.datatype}</span>
                          {prop.datatype === 'select' && (
                            <span>{prop.values?.length || 0} {language === 'bg' ? 'стойности' : 'values'}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        {prop.datatype === 'select' && (
                          <button
                            onClick={() => handleAddValue(prop)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 active:bg-green-100 rounded transition-colors touch-manipulation"
                            title={t.addPropertyValue || 'Add Value'}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(prop)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 rounded transition-colors touch-manipulation"
                          title={t.editProperty || 'Edit Property'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prop.propertyid)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 active:bg-red-100 rounded transition-colors touch-manipulation"
                          title={language === 'bg' ? 'Изтрий свойство' : 'Delete Property'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded values for mobile */}
                    {isExpanded && prop.datatype === 'select' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-700">
                            {t.propertyValues || 'Property Values'}:
                          </h4>
                          <button
                            onClick={() => handleAddValue(prop)}
                            className="flex items-center gap-1 text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
                          >
                            <Plus className="w-3 h-3" />
                            {language === 'bg' ? 'Добави' : 'Add'}
                          </button>
                        </div>
                        {prop.values && prop.values.length > 0 ? (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {prop.values.map((value) => (
                              <div key={value.propertyvalueid} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs sm:text-sm hover:bg-gray-100 transition-colors">
                                <span className="flex-1 min-w-0 truncate">{value.value}</span>
                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                  <button
                                    onClick={() => handleEditValue(prop, value)}
                                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors touch-manipulation"
                                    title={t.editPropertyValue || 'Edit Value'}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteValue(value.propertyvalueid)}
                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                                    title={language === 'bg' ? 'Изтрий стойност' : 'Delete Value'}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-3 text-gray-500 text-xs">
                            {t.noValuesDefined || (language === 'bg' ? 'Няма стойности' : 'No values defined')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {properties.length === 0 && (
                <div className="bg-white p-4 rounded-lg shadow border text-center">
                  <p className="text-sm text-gray-500">{t.noPropertiesFound || (language === 'bg' ? 'Не са намерили свойства' : 'No properties found')}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              {t.showingTransactions || 'Showing'} <span className="font-medium">{startIndex + 1}</span> {language === 'bg' ? 'до' : 'to'} <span className="font-medium">{Math.min(endIndex, properties.length)}</span> {language === 'bg' ? 'от' : 'of'} <span className="font-medium">{properties.length}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                {t.previous || 'Previous'}
              </button>

              <div className="flex gap-1 overflow-x-auto">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNumber > totalPages) return null;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-2 text-xs sm:text-sm border rounded min-w-[2.5rem] transition-colors touch-manipulation ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50 active:bg-gray-100'
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
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                {t.next || 'Next'}
              </button>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl font-bold">
                  {editingProperty ? t.editProperty : t.addProperty}
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
                        {t.description}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.dataType || 'Data Type'}
                      </label>
                      <select
                        value={formData.datatype}
                        onChange={(e) => setFormData({ ...formData, datatype: e.target.value as 'text' | 'select' | 'number' })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">{t.text || 'Text'}</option>
                        <option value="select">{t.select || 'Select'}</option>
                        <option value="number">{t.number || 'Number'}</option>
                      </select>
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
                        {editingProperty ? t.update : t.create}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showValueModal && currentProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl font-bold">
                  {editingValue ? t.editPropertyValue : t.addPropertyValue}
                </h2>
                <button 
                  onClick={() => setShowValueModal(false)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {t.propertyColon || 'Property'}: <strong>{currentProperty.name}</strong>
                  </p>
                </div>
                <form onSubmit={handleValueSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.valueRequired || 'Value'} *
                      </label>
                      <input
                        type="text"
                        value={valueFormData.value}
                        onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={language === 'bg' ? 'Въведете стойност (напр. Истинска кожа)' : 'Enter value (e.g., Genuine Leather)'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t.displayOrder || 'Display Order'}
                      </label>
                      <input
                        type="number"
                        value={valueFormData.displayorder}
                        onChange={(e) => setValueFormData({ ...valueFormData, displayorder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t.lowerNumbersFirst || 'Lower numbers appear first'}
                      </p>
                    </div>
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setShowValueModal(false)}
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        {t.cancel}
                      </button>
                      {!editingValue && (
                        <button
                          type="button"
                          onClick={handleNextValue}
                          className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
                        >
                          {t.next || 'Next'}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                      >
                        {editingValue ? (t.updateValue || t.update) : (t.addValueBtn || (language === 'bg' ? 'Добави' : 'Add'))}
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

