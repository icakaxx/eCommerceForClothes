'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { ProductType, Property } from '@/lib/types/product-types';
import AdminLayout from '../components/AdminLayout';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface Product {
  productid: string;
  name: string;
  sku?: string;
  description?: string;
  producttypeid: string;
  ProductType?: ProductType;
  propertyvalues?: Record<string, string>;
}

interface Variant {
  productvariantid?: string;
  sku?: string;
  price: number;
  compareatprice?: number;
  cost?: number;
  quantity: number;
  weight?: number;
  weightunit: string;
  barcode?: string;
  trackquantity: boolean;
  continuesellingwhenoutofstock: boolean;
  isvisible: boolean;
  propertyvalues: Array<{
    propertyid: string;
    value: string;
  }>;
  imageurl?: string;
  IsPrimaryImage?: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    producttypeid: '',
    propertyvalues: {} as Record<string, string>
  });
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedPropertyValues, setSelectedPropertyValues] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<Variant[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination calculations
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  // Reset to first page when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  useEffect(() => {
    loadProducts();
    loadProductTypes();
    loadProperties();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const result = await response.json();
      if (result.success) {
        // Map API response to Product interface
        setProducts(result.products.map((p: any) => ({
          productid: p.productid,
          name: p.name,
          sku: p.sku || '',
          description: p.description || '',
          producttypeid: p.producttypeid || '',
          ProductType: p.producttype,
          propertyvalues: p.propertyvalues || {}
        })));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types');
      const result = await response.json();
      if (result.success) {
        setProductTypes(result.productTypes);
      }
    } catch (error) {
      console.error('Failed to load product types:', error);
    }
  };

  const loadProperties = async () => {
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

  const loadPropertiesForProductType = async (productTypeId: string) => {
    try {
      const response = await fetch(`/api/product-types/${productTypeId}/properties`);
      const result = await response.json();
      if (result.success && result.properties) {
        return result.properties.map((p: any) => p.properties).filter(Boolean);
      }
    } catch (error) {
      console.error('Failed to load properties for product type:', error);
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (variants.length === 0) {
      alert('Please generate at least one variant');
      return;
    }

    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.productid}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        sku: formData.sku || null,
        description: formData.description || null,
        producttypeid: formData.producttypeid,
        variants: variants
      };

      console.log('Submitting product with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('API response:', result);
      
      if (result.success) {
        setShowModal(false);
        setFormData({ name: '', sku: '', description: '', producttypeid: '', propertyvalues: {} });
        setEditingProduct(null);
        setVariants([]);
        setSelectedPropertyValues({});
        loadProducts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    
    // Fetch full product details including variants
    try {
      const response = await fetch(`/api/products/${product.productid}`);
      const result = await response.json();
      
      if (result.success && result.product) {
        const fullProduct = result.product;
        console.log('Loaded product for editing:', fullProduct);
        
        setFormData({
          name: fullProduct.name,
          sku: fullProduct.sku || '',
          description: fullProduct.description || '',
          producttypeid: fullProduct.producttypeid,
          propertyvalues: {}
        });

        // Load properties for this product type
        if (fullProduct.producttypeid) {
          const props = await loadPropertiesForProductType(fullProduct.ProductTypeID);
          setProductTypeProperties(props);
          
          // Load existing variants if they exist
          if (fullProduct.Variants && fullProduct.Variants.length > 0) {
            const loadedVariants: Variant[] = fullProduct.Variants.map((v: any) => ({
              ProductVariantID: v.productvariantid,
              SKU: v.sku,
              Price: v.price || 0,
              CompareAtPrice: v.compareatprice,
              Cost: v.cost,
              Quantity: v.quantity || 0,
              Weight: v.weight,
              WeightUnit: v.weightunit || 'kg',
              Barcode: v.barcode,
              TrackQuantity: v.trackquantity ?? true,
              ContinueSellingWhenOutOfStock: v.continuesellingwhenoutofstock ?? false,
              IsVisible: v.isvisible ?? true,
              ImageURL: v.imageurl, // Load variant image
              IsPrimaryImage: v.IsPrimaryImage || false, // Load primary flag
              PropertyValues: (v.ProductVariantPropertyValues || []).map((pv: any) => ({
                PropertyID: pv.propertyid,
                Value: pv.value
              }))
            }));
            
            console.log('Loaded variants with images:', loadedVariants);
            setVariants(loadedVariants);
            
            // Set selected property values from existing variants
            const selected: Record<string, string[]> = {};
            loadedVariants.forEach(variant => {
              variant.propertyvalues.forEach(pv => {
                if (!selected[pv.propertyid]) {
                  selected[pv.propertyid] = [];
                }
                if (!selected[pv.propertyid].includes(pv.value)) {
                  selected[pv.propertyid].push(pv.value);
                }
              });
            });
            setSelectedPropertyValues(selected);
          }
        } else {
          setProductTypeProperties([]);
        }
      }
    } catch (error) {
      console.error('Failed to load product details:', error);
      alert('Failed to load product details');
      return;
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        loadProducts();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const [productTypeProperties, setProductTypeProperties] = useState<Property[]>([]);

  const handleProductTypeChange = async (productTypeId: string) => {
    setFormData(prev => ({ ...prev, producttypeid: productTypeId }));

    // Load properties for selected product type
    if (productTypeId) {
      const props = await loadPropertiesForProductType(productTypeId);
      setProductTypeProperties(props);
      const newPropertyValues: Record<string, string> = {};
      props.forEach((prop: Property) => {
        newPropertyValues[prop.propertyid] = formData.propertyvalues[prop.propertyid] || '';
      });
      setFormData(prev => ({ ...prev, propertyvalues: newPropertyValues }));
      // Reset selected property values for variant generation
      setSelectedPropertyValues({});
      setVariants([]);
    } else {
      setProductTypeProperties([]);
      setFormData(prev => ({ ...prev, propertyvalues: {} }));
      setSelectedPropertyValues({});
      setVariants([]);
    }
  };

  // Generate variants from selected property values
  const generateVariants = () => {
    const propertyIds = Object.keys(selectedPropertyValues);
    if (propertyIds.length === 0) {
      alert('Please select at least one property value');
      return;
    }

    // Get cartesian product of all selected values
    const cartesianProduct = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restProduct = cartesianProduct(rest);
      return first.flatMap(item => restProduct.map(items => [item, ...items]));
    };

    const valueArrays = propertyIds.map(propId => selectedPropertyValues[propId]);
    const combinations = cartesianProduct(valueArrays);

    const newVariants: Variant[] = combinations.map(combination => {
      const propertyValues = propertyIds.map((propId, index) => ({
        propertyid: propId,
        value: combination[index]
      }));

      // Generate SKU from combination
      const variantSKU = `${formData.sku || 'PROD'}-${combination.join('-').replace(/\s+/g, '')}`;

      // Check if this variant already exists (same property values)
      const existingVariant = variants.find(v => {
        if (v.propertyvalues.length !== propertyValues.length) return false;
        return propertyValues.every(pv =>
          v.propertyvalues.some(epv =>
            epv.propertyid === pv.propertyid && epv.value === pv.value
          )
        );
      });

      // If variant exists, preserve its data; otherwise use defaults
      if (existingVariant) {
        return {
          ...existingVariant,
          sku: existingVariant.sku || variantSKU, // Keep existing SKU if present
        };
      } else {
        return {
          sku: variantSKU,
          price: 0,
          quantity: 0,
          weight: 0,
          weightunit: 'kg',
          trackquantity: true,
          continuesellingwhenoutofstock: false,
          isvisible: true,
          propertyvalues: propertyValues
        };
      }
    });

    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };

  const deleteVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!file) return;

    // Supported image formats
    const supportedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/heic',
      'image/heif',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];

    // Validate file type - check MIME type or file extension
    const isValidType = supportedFormats.includes(file.type.toLowerCase()) || 
                       file.type.startsWith('image/') ||
                       /\.(jpg|jpeg|png|gif|webp|avif|heic|heif|svg|bmp|tiff?)$/i.test(file.name);

    if (!isValidType) {
      alert('Please upload a valid image file (JPG, PNG, GIF, WebP, AVIF, HEIC, etc.)');
      return;
    }

    // Validate file size (max 10MB to accommodate high-quality images)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success && result.url) {
        updateVariant(index, 'imageurl', result.url);
      } else {
        alert('Failed to upload image: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const handlePrimaryImageChange = (index: number) => {
    // Unset all other variants as primary
    const updatedVariants = variants.map((v, i) => ({
      ...v,
      IsPrimaryImage: i === index
    }));
    setVariants(updatedVariants);
  };

  return (
    <AdminLayout currentPath="/admin/products">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Products</h1>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', sku: '', description: '', producttypeid: '', propertyvalues: {} });
              setProductTypeProperties([]);
              setSelectedPropertyValues({});
              setVariants([]);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t.addProduct}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.sku}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.productType}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.productid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {productTypes.find(pt => pt.producttypeid === product.producttypeid)?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.productid)}
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
            {products.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {t.noProductsFound}
              </div>
            )}

            {/* Mobile Card Layout */}
            <div className="block md:hidden space-y-4 mt-4">
            {currentProducts.map((product) => (
              <div key={product.productid} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku || '-'}</p>
                    <p className="text-sm text-gray-500">
                      {t.productType}: {productTypes.find(pt => pt.producttypeid === product.producttypeid)?.name || '-'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.productid)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {language === 'bg'
                  ? `Показване на ${startIndex + 1} до ${Math.min(endIndex, products.length)} от ${products.length} продукта`
                  : `Showing ${startIndex + 1} to ${Math.min(endIndex, products.length)} of ${products.length} products`
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
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingProduct ? t.editProduct : t.addProduct}
                </h2>
                <button onClick={() => {
                  setShowModal(false);
                  setProductTypeProperties([]);
                  setSelectedPropertyValues({});
                  setVariants([]);
                }}>
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
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    Product Type
                  </label>
                  <select
                    value={formData.producttypeid}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a product type</option>
                    {productTypes.map((pt) => (
                      <option key={pt.producttypeid} value={pt.producttypeid}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.producttypeid && productTypeProperties.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant Properties
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select multiple values for each property to generate variants
                    </p>
                    <div className="space-y-3">
                      {productTypeProperties.map((property) => (
                        <div key={property.propertyid} className="border rounded-md p-3">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            {property.name}
                            {property.description && (
                              <span className="text-gray-400 ml-1">({property.description})</span>
                            )}
                          </label>
                          {property.datatype === 'select' && property.values && property.values.length > 0 ? (
                            <div className="space-y-1">
                              {property.values
                                .filter(v => v.isactive)
                                .sort((a, b) => a.displayorder - b.displayorder)
                                .map((value) => (
                                  <label key={value.propertyvalueid} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedPropertyValues[property.propertyid]?.includes(value.value) || false}
                                      onChange={(e) => {
                                        const currentValues = selectedPropertyValues[property.propertyid] || [];
                                        const newValues = e.target.checked
                                          ? [...currentValues, value.value]
                                          : currentValues.filter(v => v !== value.value);
                                        setSelectedPropertyValues({
                                          ...selectedPropertyValues,
                                          [property.propertyid]: newValues
                                        });
                                      }}
                                      className="mr-2"
                                    />
                                    <span className="text-sm">{value.value}</span>
                                  </label>
                                ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              This property type does not support variants. Add values in the Properties section.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={generateVariants}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Generate Variants ({Object.values(selectedPropertyValues).reduce((acc, vals) => acc * (vals.length || 1), 1)} combinations)
                    </button>
                  </div>
                )}

                {variants.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
{t.variant}s ({variants.length})
                    </label>
                    <div className="max-h-96 overflow-y-auto border rounded-md">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.variant}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.sku}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.price}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.quantity}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.image}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.primary}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {variants.map((variant, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-xs">
                                {variant.propertyvalues.map(pv => {
                                  const prop = productTypeProperties.find(p => p.propertyid === pv.propertyid);
                                  return `${prop?.name}: ${pv.value}`;
                                }).join(', ')}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={variant.sku || ''}
                                  onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                  className="w-full px-2 py-1 text-xs border rounded"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-xs border rounded"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={variant.quantity}
                                  onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-xs border rounded"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  {variant.imageurl ? (
                                    <div className="relative group">
                                      <img 
                                        src={variant.imageurl} 
                                        alt="Variant" 
                                        className="w-12 h-12 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateVariant(index, 'imageurl', undefined)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/*,.heic,.heif,.avif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleImageUpload(index, file);
                                        }}
                                      />
                                      <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-500 transition-colors">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </div>
                                    </label>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={variant.IsPrimaryImage || false}
                                  onChange={() => handlePrimaryImageChange(index)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                  title="Set as primary image"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => deleteVariant(index)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setProductTypeProperties([]);
                      setSelectedPropertyValues({});
                      setVariants([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingProduct ? 'Update' : 'Create'}
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

