'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { ProductType, Property } from '@/lib/types/product-types';
import AdminLayout from '../components/AdminLayout';
import AdminModal from '../components/AdminModal';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { AdminPage, PageHeader, Section, SectionSurface, EmptyState, DataTableShell, TableHeader, TableHeaderRow, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/layout';
import { Tag } from 'lucide-react';

type ProductTypeRow = ProductType & {
  properties?: Array<{ propertyid: string; name: string }>;
  propertiesCount?: number;
  productsCount?: number;
};

export default function ProductTypesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'bg'];
  const [productTypes, setProductTypes] = useState<ProductTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState<ProductType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<{
    loading: boolean;
    properties: Array<{ propertyid: string; name: string }>;
    products: Array<{ productid: string; name: string }>;
  }>({
    loading: false,
    properties: [],
    products: []
  });
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedProductTypeIds, setSelectedProductTypeIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadProductTypes();
  }, []);

  useEffect(() => {
    const loadDeleteDependencies = async () => {
      if (!showDeleteModal || !productTypeToDelete) return;
      setDeleteDependencies({ loading: true, properties: [], products: [] });
      try {
        const [propertiesRes, productsRes] = await Promise.all([
          fetch(`/api/product-types/${productTypeToDelete.producttypeid}/properties`),
          fetch(`/api/products?producttypeid=${productTypeToDelete.producttypeid}`)
        ]);
        const propertiesJson = await propertiesRes.json();
        const productsJson = await productsRes.json();

        setDeleteDependencies({
          loading: false,
          properties: (propertiesJson?.properties || [])
            .map((ptp: any) => ptp?.properties)
            .filter(Boolean)
            .map((prop: any) => ({
              propertyid: prop.propertyid,
              name: prop.name
            })),
          products: (productsJson?.products || []).map((product: any) => ({
            productid: product.productid,
            name: product.name
          }))
        });
      } catch (error) {
        console.error('Failed to load delete dependencies:', error);
        setDeleteDependencies({ loading: false, properties: [], products: [] });
      }
    };

    loadDeleteDependencies();
  }, [showDeleteModal, productTypeToDelete]);

  useEffect(() => {
    const loadProperties = async () => {
      if (!showModal) return;
      setLoadingProperties(true);
      try {
        const response = await fetch('/api/properties');
        const result = await response.json();
        if (result.success) {
          setAvailableProperties(result.properties || []);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setLoadingProperties(false);
      }
    };

    if (showModal) {
      loadProperties();
      if (!editingProductType) {
        setSelectedPropertyIds([]);
      }
    }
  }, [showModal, editingProductType]);

  const loadProductTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/product-types');
      const result = await response.json();
      if (result.success) {
        // Debug: Log to verify counts are coming through
        console.log('Product types with counts:', result.productTypes.map((pt: any) => ({
          name: pt.name,
          propertiesCount: pt.propertiesCount,
          productsCount: pt.productsCount
        })));
        setProductTypes(result.productTypes);
      } else {
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
        if (!editingProductType && selectedPropertyIds.length > 0) {
          const createdId = result.productType?.producttypeid;
          if (createdId) {
            await Promise.all(
              selectedPropertyIds.map((propertyid) =>
                fetch(`/api/product-types/${createdId}/properties`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ propertyid })
                })
              )
            );
          }
        }
        setShowModal(false);
        setFormData({ name: '' });
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
    setFormData({ name: productType.name });
    setShowModal(true);
  };

  const handleDeleteClick = (productType: ProductType) => {
    setProductTypeToDelete(productType);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productTypeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/product-types/${productTypeToDelete.producttypeid}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setShowDeleteModal(false);
        setProductTypeToDelete(null);
        loadProductTypes();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete product type:', error);
      alert('Failed to delete product type');
    } finally {
      setDeleting(false);
    }
  };

  const toggleProductTypeSelection = (productTypeId: string) => {
    setSelectedProductTypeIds((prev) =>
      prev.includes(productTypeId)
        ? prev.filter((id) => id !== productTypeId)
        : [...prev, productTypeId]
    );
  };

  const toggleSelectAllProductTypesOnPage = () => {
    setSelectedProductTypeIds((prev) => {
      if (allSelectedOnPage) {
        return prev.filter((id) => !paginatedProductTypeIds.includes(id));
      }
      const next = new Set(prev);
      paginatedProductTypeIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedProductTypeIds.length === 0) return;
    try {
      setBulkDeleting(true);
      const results = await Promise.all(
        selectedProductTypeIds.map(async (id) => {
          const response = await fetch(`/api/product-types/${id}`, { method: 'DELETE' });
          const result = await response.json();
          return { id, ok: response.ok && result.success, error: result.error };
        })
      );

      const failed = results.filter((item) => !item.ok);
      if (failed.length > 0) {
        alert(
          language === 'bg'
            ? `Неуспешно изтриване за ${failed.length} категории.`
            : `Failed to delete ${failed.length} categories.`
        );
        setSelectedProductTypeIds(failed.map((item) => item.id));
      } else {
        setSelectedProductTypeIds([]);
        setShowBulkDeleteModal(false);
      }

      loadProductTypes();
    } catch (error) {
      console.error('Failed to bulk delete product types:', error);
      alert(language === 'bg' ? 'Неуспешно масово изтриване' : 'Bulk delete failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleManageProperties = (productType: ProductType) => {
    router.push(`/admin/product-types/${productType.producttypeid}`);
  };

  // Pagination calculations
  const totalPages = Math.ceil(productTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductTypes = productTypes.slice(startIndex, endIndex);
  const paginatedProductTypeIds = paginatedProductTypes.map((pt) => pt.producttypeid);
  const allSelectedOnPage =
    paginatedProductTypeIds.length > 0 &&
    paginatedProductTypeIds.every((id) => selectedProductTypeIds.includes(id));

  useEffect(() => {
    setSelectedProductTypeIds((prev) =>
      prev.filter((id) => productTypes.some((pt) => pt.producttypeid === id))
    );
  }, [productTypes]);

  return (
    <AdminLayout currentPath="/admin/product-types">
      <AdminPage className="space-y-6">
        <PageHeader
          title={language === 'bg' ? 'Категории' : 'Categories'}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {selectedProductTypeIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  {language === 'bg'
                    ? `Изтрий избрани (${selectedProductTypeIds.length})`
                    : `Delete selected (${selectedProductTypeIds.length})`}
                </button>
              )}
              <button
                onClick={() => {
                  setEditingProductType(null);
                  setFormData({ name: '' });
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                {t.addProductType}
              </button>
            </div>
          }
        />

        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm sm:text-base text-gray-500">{language === 'bg' ? 'Зареждане...' : 'Loading...'}</p>
          </div>
        ) : (
          <>
          <Section
            title={language === 'bg' ? 'Списък с категории' : 'Categories List'}
            description={language === 'bg' ? 'Управлявайте категориите на продуктите' : 'Manage product categories'}
          >
            {productTypes.length === 0 ? (
              <EmptyState
                title={language === 'bg' ? 'Няма категории' : 'No Categories'}
                description={language === 'bg' ? 'Създайте първата категория, за да започнете да организирате продуктите си.' : 'Create your first category to start organizing your products.'}
                action={
                  <button
                    onClick={() => {
                      setEditingProductType(null);
                      setFormData({ name: '' });
                      setShowModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addProductType}
                  </button>
                }
                icon={Tag}
              />
            ) : (
              <SectionSurface tone="soft" padding="md">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-hidden">
                  <DataTableShell>
                    <TableHeader>
                      <TableHeaderRow>
                        <TableHeaderCell align="center">
                          <input
                            type="checkbox"
                            checked={allSelectedOnPage}
                            onChange={toggleSelectAllProductTypesOnPage}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            aria-label={language === 'bg' ? 'Избери всички' : 'Select all'}
                          />
                        </TableHeaderCell>
                        <TableHeaderCell>{t.name}</TableHeaderCell>
                        <TableHeaderCell>
                          {language === 'bg' ? 'Характеристики' : 'Characteristics'}
                        </TableHeaderCell>
                        <TableHeaderCell align="center">{language === 'bg' ? 'Артикули' : 'Items'}</TableHeaderCell>
                        <TableHeaderCell align="right">{t.actions}</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProductTypes.map((pt) => {
                        const propertiesCount = Number((pt as any).propertiesCount) || 0;
                        const productsCount = Number((pt as any).productsCount) || 0;
                        const highlightProducts = productsCount === 0;
                        const characteristics = pt.properties || [];
                        
                        return (
                          <TableRow key={pt.producttypeid}>
                            <TableCell align="center">
                              <input
                                type="checkbox"
                                checked={selectedProductTypeIds.includes(pt.producttypeid)}
                                onChange={() => toggleProductTypeSelection(pt.producttypeid)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                aria-label={language === 'bg' ? 'Избери категория' : 'Select category'}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="truncate max-w-xs font-medium">{pt.name}</div>
                            </TableCell>
                            <TableCell>
                              {characteristics.length === 0 ? (
                                <span className="text-xs text-gray-400">-</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {characteristics.map((prop) => (
                                    <span
                                      key={prop.propertyid}
                                      className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-gray-300 text-gray-600 bg-white"
                                    >
                                      {prop.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell 
                              align="center"
                              className={highlightProducts ? '!bg-yellow-200' : ''}
                              style={highlightProducts ? { backgroundColor: '#fef3c7', color: '#000' } : undefined}
                            >
                              <span className="font-medium">{productsCount}</span>
                            </TableCell>
                            <TableCell align="right">
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
                                  onClick={() => handleDeleteClick(pt)}
                                  className="p-1.5 sm:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                                  title={language === 'bg' ? 'Изтрий' : 'Delete'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </DataTableShell>
                </div>
              </SectionSurface>
            )}
          </Section>

          {/* Mobile/Tablet Card View */}
          {productTypes.length > 0 && (
            <Section className="md:hidden">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={toggleSelectAllProductTypesOnPage}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  {language === 'bg' ? 'Избери всички на страницата' : 'Select all on page'}
                </label>
              </div>
              <div className="space-y-3">
                {paginatedProductTypes.map((pt) => {
                  const characteristics = pt.properties || [];
                  return (
                <div key={pt.producttypeid} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedProductTypeIds.includes(pt.producttypeid)}
                          onChange={() => toggleProductTypeSelection(pt.producttypeid)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          aria-label={language === 'bg' ? 'Избери категория' : 'Select category'}
                        />
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 truncate">{pt.name}</h3>
                      </div>
                      {characteristics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {characteristics.map((prop) => (
                            <span
                              key={prop.propertyid}
                              className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full border border-gray-300 text-gray-600 bg-white"
                            >
                              {prop.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs sm:text-sm">
                        {(() => {
                          const propertiesCount = Number((pt as any).propertiesCount) || 0;
                          const productsCount = Number((pt as any).productsCount) || 0;
                          const highlightProperties = propertiesCount === 0;
                          const highlightProducts = productsCount === 0;
                          return (
                            <>
                              <div 
                                className={`px-2 py-1 rounded ${highlightProperties ? 'bg-yellow-200' : 'bg-gray-100'}`}
                                style={highlightProperties ? { backgroundColor: '#fef3c7' } : undefined}
                              >
                                <span className="font-medium">{language === 'bg' ? 'Характеристики' : 'Characteristics'}: </span>
                                <span className="font-semibold">{propertiesCount}</span>
                              </div>
                              <div 
                                className={`px-2 py-1 rounded ${highlightProducts ? 'bg-yellow-200' : 'bg-gray-100'}`}
                                style={highlightProducts ? { backgroundColor: '#fef3c7' } : undefined}
                              >
                                <span className="font-medium">{language === 'bg' ? 'Артикули' : 'Items'}: </span>
                                <span className="font-semibold">{productsCount}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
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
                        onClick={() => handleDeleteClick(pt)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 active:bg-red-100 rounded transition-colors touch-manipulation"
                        title={language === 'bg' ? 'Изтрий' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                );
                })}
              </div>
            </Section>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
              <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 mt-4">
                {/* Mobile: Simple Prev/Next */}
                <div className="flex-1 flex justify-between sm:hidden w-full">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center justify-center px-4 py-2.5 min-w-[100px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    {t.previous || 'Previous'}
                  </button>
                  <div className="flex items-center px-4">
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center justify-center px-4 py-2.5 min-w-[100px] border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  >
                    {t.next || 'Next'}
                  </button>
                </div>

                {/* Tablet/Desktop: Full Pagination */}
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      {t.showingTransactions || 'Showing'} <span className="font-medium">{startIndex + 1}</span> {language === 'bg' ? 'до' : 'to'} <span className="font-medium">{Math.min(endIndex, productTypes.length)}</span> {language === 'bg' ? 'от' : 'of'} <span className="font-medium">{productTypes.length}</span> {language === 'bg' ? 'типове продукти' : 'product types'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        <span className="sr-only">{t.previous || 'Previous'}</span>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 rotate-90" />
                      </button>
                      <div className="hidden md:flex">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium transition-colors touch-manipulation ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <div className="md:hidden flex items-center px-3 border-t border-b border-gray-300 bg-white">
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 sm:px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                      >
                        <span className="sr-only">{t.next || 'Next'}</span>
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 -rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <AdminModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingProductType ? t.editProductType : t.addProductType}
          subheader={editingProductType
            ? (language === 'bg' ? 'Редактирайте информацията за типа продукт' : 'Edit the product type information')
            : (language === 'bg' ? 'Създайте нова категория за категоризиране' : 'Create a new category for categorization')
          }
          maxWidth="max-w-2xl"
          minWidth={520}
          minHeight={550}
        >
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
              {!editingProductType && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    {language === 'bg' ? 'Характеристики' : 'Characteristics'}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {language === 'bg'
                      ? 'Изберете характеристики (може повече от една)'
                      : 'Select characteristics (multi-select)'}
                  </p>
                  {loadingProperties ? (
                    <div className="text-xs text-gray-500">
                      {language === 'bg' ? 'Зареждане...' : 'Loading...'}
                    </div>
                  ) : availableProperties.length === 0 ? (
                    <div className="text-xs text-gray-500">
                      {language === 'bg' ? 'Няма налични характеристики' : 'No characteristics available'}
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                      {availableProperties.map((property) => (
                        <label
                          key={property.propertyid}
                          className="flex items-start gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPropertyIds.includes(property.propertyid)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setSelectedPropertyIds((prev) =>
                                isChecked
                                  ? [...prev, property.propertyid]
                                  : prev.filter((id) => id !== property.propertyid)
                              );
                            }}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs sm:text-sm">
                            {property.name}
                            {property.description ? (
                              <span className="text-gray-400 ml-1">
                                ({property.description})
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-4 border-t border-gray-200">
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
        </AdminModal>

        {/* Delete Confirmation Modal */}
        <AdminModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProductTypeToDelete(null);
          }}
          title={language === 'bg' ? 'Потвърди изтриване' : 'Confirm Delete'}
          subheader={language === 'bg' 
            ? 'Сигурни ли сте, че искате да изтриете тази категория? Продуктите и характеристиките към нея също ще бъдат изтрити. Това действие не може да бъде отменено.'
            : 'Are you sure you want to delete this product type? Products and characteristics linked to it will also be deleted. This action cannot be undone.'}
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={550}
        >
          <div className="space-y-4">
            {productTypeToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {language === 'bg' ? 'Категория:' : 'Category:'}
                </p>
                <p className="text-sm text-gray-700">{productTypeToDelete.name}</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {language === 'bg' ? 'Характеристики' : 'Characteristics'}
                  {deleteDependencies.properties.length > 0 ? ` (${deleteDependencies.properties.length})` : ''}
                </p>
                {deleteDependencies.loading ? (
                  <p className="text-xs text-gray-500">
                    {language === 'bg' ? 'Зареждане...' : 'Loading...'}
                  </p>
                ) : deleteDependencies.properties.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {language === 'bg' ? 'Няма' : 'None'}
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto rounded border border-gray-200 bg-white">
                    {deleteDependencies.properties.map((prop) => (
                      <div key={prop.propertyid} className="px-3 py-1 text-xs text-gray-700 border-b last:border-b-0">
                        {prop.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {language === 'bg' ? 'Артикули' : 'Products'}
                  {deleteDependencies.products.length > 0 ? ` (${deleteDependencies.products.length})` : ''}
                </p>
                {deleteDependencies.loading ? (
                  <p className="text-xs text-gray-500">
                    {language === 'bg' ? 'Зареждане...' : 'Loading...'}
                  </p>
                ) : deleteDependencies.products.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    {language === 'bg' ? 'Няма' : 'None'}
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto rounded border border-gray-200 bg-white">
                    {deleteDependencies.products.map((product) => (
                      <div key={product.productid} className="px-3 py-1 text-xs text-gray-700 border-b last:border-b-0">
                        {product.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductTypeToDelete(null);
                }}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (language === 'bg' ? 'Изтриване...' : 'Deleting...') : (language === 'bg' ? 'Изтрий' : 'Delete')}
              </button>
            </div>
          </div>
        </AdminModal>

        <AdminModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          title={language === 'bg' ? 'Потвърди масово изтриване' : 'Confirm Bulk Delete'}
          subheader={language === 'bg'
            ? 'Избраните категории и всички свързани продукти и характеристики ще бъдат изтрити. Това действие не може да бъде отменено.'
            : 'Selected categories and all related products and characteristics will be deleted. This action cannot be undone.'}
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={360}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {language === 'bg' ? 'Избрани категории:' : 'Selected categories:'}
              </p>
              <p className="text-sm text-gray-700">
                {selectedProductTypeIds.length}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleting}
                className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
                className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkDeleting ? (language === 'bg' ? 'Изтриване...' : 'Deleting...') : (language === 'bg' ? 'Изтрий избраните' : 'Delete selected')}
              </button>
            </div>
          </div>
        </AdminModal>
      </AdminPage>
    </AdminLayout>
  );
}

