'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { ProductType } from '@/lib/types/product-types';
import AdminLayout from '../components/AdminLayout';
import AdminModal from '../components/AdminModal';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { AdminPage, PageHeader, Section, SectionSurface, EmptyState, DataTableShell, TableHeader, TableHeaderRow, TableHeaderCell, TableBody, TableRow, TableCell } from '../components/layout';
import { Tag } from 'lucide-react';

export default function ProductTypesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'bg'];
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState<ProductType | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleManageProperties = (productType: ProductType) => {
    router.push(`/admin/product-types/${productType.producttypeid}`);
  };

  // Pagination calculations
  const totalPages = Math.ceil(productTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductTypes = productTypes.slice(startIndex, endIndex);

  return (
    <AdminLayout currentPath="/admin/product-types">
      <AdminPage className="space-y-6">
        <PageHeader
          title={language === 'bg' ? 'Типове продукти' : 'Product Types'}
          actions={
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
            title={language === 'bg' ? 'Списък с типове продукти' : 'Product Types List'}
            description={language === 'bg' ? 'Управлявайте категориите на продуктите' : 'Manage product categories'}
          >
            {productTypes.length === 0 ? (
              <EmptyState
                title={language === 'bg' ? 'Няма типове продукти' : 'No Product Types'}
                description={language === 'bg' ? 'Създайте първия тип продукт, за да започнете да организирате продуктите си.' : 'Create your first product type to start organizing your products.'}
                action={
                  <button
                    onClick={() => {
                      setEditingProductType(null);
                      setFormData({ name: '', code: '' });
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
                        <TableHeaderCell>{t.name}</TableHeaderCell>
                        <TableHeaderCell>{t.code}</TableHeaderCell>
                        <TableHeaderCell align="right">{t.actions}</TableHeaderCell>
                      </TableHeaderRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProductTypes.map((pt) => (
                        <TableRow key={pt.producttypeid}>
                          <TableCell>
                            <div className="truncate max-w-xs font-medium">{pt.name}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">{pt.code}</span>
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
                      ))}
                    </TableBody>
                  </DataTableShell>
                </div>
              </SectionSurface>
            )}
          </Section>

          {/* Mobile/Tablet Card View */}
          {productTypes.length > 0 && (
            <Section className="md:hidden">
              <div className="space-y-3">
                {paginatedProductTypes.map((pt) => (
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
                        onClick={() => handleDeleteClick(pt)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 active:bg-red-100 rounded transition-colors touch-manipulation"
                        title={language === 'bg' ? 'Изтрий' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
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
            : (language === 'bg' ? 'Създайте нов тип продукт за категоризиране' : 'Create a new product type for categorization')
          }
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={300}
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
            ? 'Сигурни ли сте, че искате да изтриете този тип продукт? Това действие не може да бъде отменено.'
            : 'Are you sure you want to delete this product type? This action cannot be undone.'}
          maxWidth="max-w-md"
          minWidth={400}
          minHeight={200}
        >
          <div className="space-y-4">
            {productTypeToDelete && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {language === 'bg' ? 'Тип продукт:' : 'Product Type:'}
                </p>
                <p className="text-sm text-gray-700">{productTypeToDelete.name}</p>
                {productTypeToDelete.code && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">Code: {productTypeToDelete.code}</p>
                )}
              </div>
            )}
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
      </AdminPage>
    </AdminLayout>
  );
}

