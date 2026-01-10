'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
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
  quantity: number;
  trackquantity: boolean;
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
    rfproducttypeid: 1, // Default to 1 (For Him)
    producttypeid: '',
    isfeatured: false,
    propertyvalues: {} as Record<string, string>
  });
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [selectedPropertyValues, setSelectedPropertyValues] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [rfProductTypes, setRfProductTypes] = useState<Array<{rfproducttypeid: number, name: string}>>([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState<ProductType[]>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Array<{name: string, path: string, url: string}>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null);
  const [newPropertyValues, setNewPropertyValues] = useState<Record<string, string>>({});
  const [addingPropertyValue, setAddingPropertyValue] = useState<Record<string, boolean>>({});

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
    loadRfProductTypes();
  }, []);

  // Load RF Product Types (main categories)
  const loadRfProductTypes = async () => {
    try {
      const response = await fetch('/api/rf-product-types');
      const result = await response.json();
      if (result.success) {
        setRfProductTypes(result.rfProductTypes);
      }
    } catch (error) {
      console.error('Failed to load RF product types:', error);
    }
  };

  // Load media files from storage (from all folders: images, logos, hero-images)
  const loadMediaFiles = async () => {
    try {
      setLoadingMedia(true);
      const response = await fetch('/api/storage/list?folders=images,logos,hero-images&limit=200');
      const result = await response.json();
      if (result.success) {
        setMediaFiles(result.files || []);
      }
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Open media modal for specific variant
  const openMediaModal = (variantIndex: number) => {
    setSelectedVariantIndex(variantIndex);
    setShowMediaModal(true);
    loadMediaFiles();
  };

  // Select image from media library
  const selectImageFromMedia = (imageUrl: string) => {
    if (selectedVariantIndex !== null) {
      updateVariant(selectedVariantIndex, 'imageurl', imageUrl);
    }
    setShowMediaModal(false);
    setSelectedVariantIndex(null);
  };

  // Filter product types based on selected main category
  useEffect(() => {
    if (formData.rfproducttypeid) {
      const filtered = productTypes.filter(pt => 
        pt.rfproducttypeid === formData.rfproducttypeid || !pt.rfproducttypeid
      );
      setFilteredProductTypes(filtered);
      // Reset product type if current selection is not in filtered list
      if (formData.producttypeid && !filtered.find(pt => pt.producttypeid === formData.producttypeid)) {
        setFormData({ ...formData, producttypeid: '' });
        setProductTypeProperties([]);
        setSelectedPropertyValues({});
        setVariants([]);
      }
    } else {
      setFilteredProductTypes(productTypes);
    }
  }, [formData.rfproducttypeid, productTypes]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const result = await response.json();
      if (result.success) {
        // Map API response to Product interface
        const mappedProducts = result.products.map((p: any) => ({
          productid: p.productid,
          name: p.name,
          sku: p.sku || '',
          description: p.description || '',
          producttypeid: p.producttypeid || '',
          ProductType: p.producttype,
          propertyvalues: p.propertyvalues || {}
        }));

        setProducts(mappedProducts);
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
        const properties = result.properties.map((p: any) => p.properties).filter(Boolean);
        
        // Load values for each property
        const propertiesWithValues = await Promise.all(
          properties.map(async (prop: Property) => {
            try {
              const valuesResponse = await fetch(`/api/properties/${prop.propertyid}/values`);
              const valuesResult = await valuesResponse.json();
              if (valuesResult.success) {
                return {
                  ...prop,
                  values: valuesResult.values || []
                };
              }
            } catch (error) {
              console.error(`Failed to load values for property ${prop.propertyid}:`, error);
            }
            return {
              ...prop,
              values: prop.values || []
            };
          })
        );
        
        return propertiesWithValues;
      }
    } catch (error) {
      console.error('Failed to load properties for product type:', error);
    }
    return [];
  };

  const handleAddPropertyValue = async (propertyId: string) => {
    const newValue = newPropertyValues[propertyId]?.trim();
    if (!newValue) {
      alert(language === 'bg' ? 'Моля, въведете стойност' : 'Please enter a value');
      return;
    }

    // Check if value already exists
    const property = productTypeProperties.find(p => p.propertyid === propertyId);
    if (property?.values?.some(v => v.value.toLowerCase() === newValue.toLowerCase())) {
      alert(language === 'bg' ? 'Тази стойност вече съществува' : 'This value already exists');
      return;
    }

    setAddingPropertyValue(prev => ({ ...prev, [propertyId]: true }));

    try {
      // Get the next display order
      const maxDisplayOrder = property?.values?.reduce((max, v) => Math.max(max, v.displayorder || 0), 0) || 0;
      
      const response = await fetch(`/api/properties/${propertyId}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newValue,
          displayorder: maxDisplayOrder + 1
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload properties for the product type to get the new value
        if (formData.producttypeid) {
          const updatedProps = await loadPropertiesForProductType(formData.producttypeid);
          setProductTypeProperties(updatedProps);
        }
        
        // Automatically select the newly added value
        const currentValues = selectedPropertyValues[propertyId] || [];
        setSelectedPropertyValues({
          ...selectedPropertyValues,
          [propertyId]: [...currentValues, newValue]
        });
        
        // Clear the input
        setNewPropertyValues(prev => ({ ...prev, [propertyId]: '' }));
      } else {
        alert(language === 'bg' ? 'Грешка при добавяне на стойност: ' + result.error : 'Error adding value: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to add property value:', error);
      alert(language === 'bg' ? 'Неуспешно добавяне на стойност' : 'Failed to add property value');
    } finally {
      setAddingPropertyValue(prev => ({ ...prev, [propertyId]: false }));
    }
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
        rfproducttypeid: formData.rfproducttypeid,
        producttypeid: formData.producttypeid,
        isfeatured: formData.isfeatured || false,
        Variants: variants
      };


      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('API response:', result);
      
      if (result.success) {
        setShowModal(false);
        setFormData({ name: '', sku: '', description: '', rfproducttypeid: 1, producttypeid: '', isfeatured: false, propertyvalues: {} });
        setEditingProduct(null);
        setVariants([]);
        setSelectedPropertyValues({});
        setNewPropertyValues({});

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
          rfproducttypeid: fullProduct.rfproducttypeid || 1,
          producttypeid: fullProduct.producttypeid,
          isfeatured: fullProduct.isfeatured || false,
          propertyvalues: {}
        });

        // Load properties for this product type
        if (fullProduct.producttypeid) {
          const props = await loadPropertiesForProductType(fullProduct.producttypeid);
          setProductTypeProperties(props);
          
          // Load existing variants if they exist
          if (fullProduct.Variants && fullProduct.Variants.length > 0) {
            const loadedVariants: Variant[] = fullProduct.Variants.map((v: any) => ({
              productvariantid: v.productvariantid,
              sku: v.sku,
              price: v.price || 0,
              quantity: v.quantity || 0,
              trackquantity: v.trackquantity ?? true,
              isvisible: v.isvisible ?? true,
              imageurl: v.imageurl, // Load variant image
              IsPrimaryImage: v.IsPrimaryImage || false, // Load primary flag
              propertyvalues: (v.product_variant_property_values || []).map((pv: any) => ({
                propertyid: pv.propertyid,
                value: pv.value
              }))
            }));
            
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
      setNewPropertyValues({});
    } else {
      setProductTypeProperties([]);
      setFormData(prev => ({ ...prev, propertyvalues: {} }));
      setSelectedPropertyValues({});
      setVariants([]);
      setNewPropertyValues({});
    }
  };

  // Generate variants from selected property values
  const generateVariants = () => {
    const propertyIds = Object.keys(selectedPropertyValues);
    if (propertyIds.length === 0) {
      alert(t.selectAtLeastOnePropertyValue);
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

      // Generate SKU from combination - include product ID for uniqueness
      // For new products, use a timestamp-based unique identifier
      const productId = editingProduct?.productid || `NEW_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const variantSKU = `${formData.sku || 'PROD'}-${productId}-${combination.map(v => v.toUpperCase()).join('-')}`;

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
          trackquantity: true,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Продукти</h1>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', sku: '', description: '', rfproducttypeid: 1, producttypeid: '', isfeatured: false, propertyvalues: {} });
              setProductTypeProperties([]);
              setSelectedPropertyValues({});
              setVariants([]);
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            {t.addProduct}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm sm:text-base text-gray-500">{t.loading || 'Loading...'}</p>
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
                        {t.sku}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.productType}
                      </th>
                      <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts.map((product) => (
                      <tr key={product.productid} className="hover:bg-gray-50">
                        <td className="px-4 xl:px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="truncate max-w-xs">{product.name}</div>
                        </td>
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-mono text-xs">{product.sku || '-'}</span>
                        </td>
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {productTypes.find(pt => pt.producttypeid === product.producttypeid)?.name || '-'}
                        </td>
                        <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 sm:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors touch-manipulation"
                              title={t.edit}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.productid)}
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
              {products.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <p className="text-sm sm:text-base">{t.noProductsFound}</p>
                </div>
              )}
            </div>

            {/* Mobile/Tablet Card Layout */}
            <div className="md:hidden space-y-3">
              {currentProducts.map((product) => (
                <div key={product.productid} className="bg-white p-3 sm:p-4 rounded-lg shadow border">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                      <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                        <p><span className="font-medium">SKU:</span> <span className="font-mono">{product.sku || '-'}</span></p>
                        <p>
                          <span className="font-medium">{t.productType}:</span> {productTypes.find(pt => pt.producttypeid === product.producttypeid)?.name || '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 rounded transition-colors touch-manipulation"
                        title={t.edit}
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.productid)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 active:bg-red-100 rounded transition-colors touch-manipulation"
                        title={language === 'bg' ? 'Изтрий' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="bg-white p-4 rounded-lg shadow border text-center">
                  <p className="text-sm text-gray-500">{t.noProductsFound}</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow px-3 sm:px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  {t.showingTransactions || 'Showing'} <span className="font-medium">{startIndex + 1}</span> {language === 'bg' ? 'до' : 'to'} <span className="font-medium">{Math.min(endIndex, products.length)}</span> {language === 'bg' ? 'от' : 'of'} <span className="font-medium">{products.length}</span>
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
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl font-bold">
                  {editingProduct ? t.editProduct : t.addProduct}
                </h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    // Don't clear the data here - only clear when starting a new product
                  }}
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
                      {t.productName}
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
                      {t.productSKU}
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {language === 'bg' ? 'Описание' : 'Description'}
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
                      {language === 'bg' ? 'Основна категория' : 'Main Category'}
                    </label>
                    <select
                      value={formData.rfproducttypeid}
                      onChange={(e) => {
                        const newRfProductTypeId = parseInt(e.target.value);
                        setFormData({ 
                          ...formData, 
                          rfproducttypeid: newRfProductTypeId,
                          producttypeid: '' // Reset product type when main category changes
                        });
                        setProductTypeProperties([]);
                        setSelectedPropertyValues({});
                        setVariants([]);
                      }}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {rfProductTypes.map((rpt) => (
                        <option key={rpt.rfproducttypeid} value={rpt.rfproducttypeid}>
                          {rpt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {language === 'bg' ? 'Тип продукт' : 'Product Type'}
                    </label>
                    <select
                      value={formData.producttypeid}
                      onChange={(e) => handleProductTypeChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                      disabled={!formData.rfproducttypeid}
                    >
                      <option value="">{t.selectAProductType || 'Select a product type'}</option>
                      {filteredProductTypes.map((pt) => (
                        <option key={pt.producttypeid} value={pt.producttypeid}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isfeatured || false}
                        onChange={(e) => setFormData({ ...formData, isfeatured: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 block">
                          {language === 'bg' ? 'Избран продукт (показва се на началната страница)' : 'Featured Product (displayed on home page)'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {language === 'bg' ? 'Максимум 4 избрани продукта ще се покажат на началната страница' : 'Maximum 4 featured products will be displayed on the home page'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {formData.producttypeid && productTypeProperties.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        {language === 'bg' ? 'Свойства на вариантите' : 'Variant Properties'}
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        {language === 'bg'
                          ? 'Изберете няколко стойности за всяко свойство, за да генерирате варианти'
                          : 'Select multiple values for each property to generate variants'
                        }
                      </p>
                      <div className="space-y-3 max-h-64 sm:max-h-none overflow-y-auto">
                        {productTypeProperties.map((property) => (
                          <div key={property.propertyid} className="border rounded-md p-2 sm:p-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              {property.name}
                              {property.description && (
                                <span className="text-gray-400 ml-1 text-xs">({property.description})</span>
                              )}
                            </label>
                            {property.datatype === 'select' ? (
                              <>
                                {property.values && property.values.length > 0 ? (
                                  <div className="space-y-1.5 max-h-32 sm:max-h-40 overflow-y-auto">
                                    {property.values
                                      .filter(v => v.isactive)
                                      .sort((a, b) => a.displayorder - b.displayorder)
                                      .map((value) => (
                                        <label key={value.propertyvalueid} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded">
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
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                          <span className="text-xs sm:text-sm">{value.value}</span>
                                        </label>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 mb-2">
                                    {language === 'bg' ? 'Няма налични стойности' : 'No values available'}
                                  </p>
                                )}
                                {/* Add new value input */}
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="text"
                                      value={newPropertyValues[property.propertyid] || ''}
                                      onChange={(e) => setNewPropertyValues(prev => ({ ...prev, [property.propertyid]: e.target.value }))}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddPropertyValue(property.propertyid);
                                        }
                                      }}
                                      placeholder={language === 'bg' ? 'Добави нова стойност...' : 'Add new value...'}
                                      className="flex-1 px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                      disabled={addingPropertyValue[property.propertyid]}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddPropertyValue(property.propertyid)}
                                      disabled={addingPropertyValue[property.propertyid] || !newPropertyValues[property.propertyid]?.trim()}
                                      className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-colors touch-manipulation whitespace-nowrap"
                                    >
                                      {addingPropertyValue[property.propertyid] ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                          <span>{language === 'bg' ? 'Добавяне...' : 'Adding...'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-3 h-3" />
                                          <span>{language === 'bg' ? 'Добави' : 'Add'}</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">
                                {t.propertyTypeNotSupportVariants}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={generateVariants}
                        className="mt-3 w-full px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
                      >
                        {t.generateVariants} ({Object.values(selectedPropertyValues).reduce((acc, vals) => acc * (vals.length || 1), 1)} {t.combinations})
                      </button>
                    </div>
                  )}

                  {variants.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        {t.variant}s ({variants.length})
                      </label>
                      <div className="max-h-96 overflow-y-auto border rounded-md">
                        {/* Desktop Variants Table */}
                        <div className="hidden md:block overflow-x-auto">
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
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-xs">
                                    <div className="max-w-xs truncate">
                                      {variant.propertyvalues.map(pv => {
                                        const prop = productTypeProperties.find(p => p.propertyid === pv.propertyid);
                                        return `${prop?.name}: ${pv.value}`;
                                      }).join(', ')}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={variant.sku || ''}
                                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={variant.price}
                                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={variant.quantity}
                                      onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
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
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                                            title={language === 'bg' ? 'Премахни изображение' : 'Remove Image'}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ) : null}
                                      <div className="flex gap-1">
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
                                          <div className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-blue-500 active:border-blue-600 transition-colors bg-gray-50 touch-manipulation" title={language === 'bg' ? 'Качи ново изображение' : 'Upload new image'}>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                          </div>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => openMediaModal(index)}
                                          className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-green-500 active:border-green-600 transition-colors bg-gray-50 touch-manipulation"
                                          title={language === 'bg' ? 'Избери от медията' : 'Select from media'}
                                        >
                                          <ImageIcon className="w-5 h-5 text-gray-400" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={variant.IsPrimaryImage || false}
                                      onChange={() => handlePrimaryImageChange(index)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      title={t.setAsPrimaryImage}
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => deleteVariant(index)}
                                      className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors touch-manipulation"
                                      title={language === 'bg' ? 'Изтрий' : 'Delete'}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Variants Cards */}
                        <div className="md:hidden divide-y divide-gray-200">
                          {variants.map((variant, index) => (
                            <div key={index} className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    {variant.propertyvalues.map(pv => {
                                      const prop = productTypeProperties.find(p => p.propertyid === pv.propertyid);
                                      return `${prop?.name}: ${pv.value}`;
                                    }).join(', ')}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteVariant(index)}
                                  className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded flex-shrink-0 transition-colors touch-manipulation"
                                  title={language === 'bg' ? 'Изтрий' : 'Delete'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-gray-500 mb-1">SKU</label>
                                  <input
                                    type="text"
                                    value={variant.sku || ''}
                                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-500 mb-1">{t.price}</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={variant.price}
                                    onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-500 mb-1">{t.quantity}</label>
                                  <input
                                    type="number"
                                    value={variant.quantity}
                                    onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-gray-500 mb-1">{t.primary}</label>
                                  <div className="flex items-center h-[34px]">
                                    <input
                                      type="checkbox"
                                      checked={variant.IsPrimaryImage || false}
                                      onChange={() => handlePrimaryImageChange(index)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      title={t.setAsPrimaryImage}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-gray-500 mb-1 text-xs">{t.image}</label>
                                <div className="flex items-center gap-2">
                                  {variant.imageurl ? (
                                    <div className="relative group">
                                      <img 
                                        src={variant.imageurl} 
                                        alt="Variant" 
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateVariant(index, 'imageurl', undefined)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation"
                                        title={language === 'bg' ? 'Премахни изображение' : 'Remove Image'}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                                      <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex gap-2">
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
                                      <div className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-blue-500 active:border-blue-600 transition-colors bg-gray-50 touch-manipulation" title={language === 'bg' ? 'Качи' : 'Upload'}>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                      </div>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => openMediaModal(index)}
                                      className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center hover:border-green-500 active:border-green-600 transition-colors bg-gray-50 touch-manipulation"
                                      title={language === 'bg' ? 'Медия' : 'Media'}
                                    >
                                      <ImageIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                    </div>

                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 mt-6 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          setProductTypeProperties([]);
                          setShowMediaModal(false);
                          setSelectedVariantIndex(null);
                          setSelectedPropertyValues({});
                          setVariants([]);
                          setNewPropertyValues({});
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base border border-gray-300 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        {language === 'bg' ? 'Отказ' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                      >
                        {editingProduct
                          ? (language === 'bg' ? 'Актуализиране' : 'Update')
                          : (language === 'bg' ? 'Създаване' : 'Create')
                        }
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        {/* Media Selection Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col my-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center z-10">
                <h3 className="text-base sm:text-lg font-semibold">
                  {language === 'bg' ? 'Избери изображение от медията' : 'Select Image from Media'}
                </h3>
                <button
                  onClick={() => {
                    setShowMediaModal(false);
                    setSelectedVariantIndex(null);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {loadingMedia ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500">
                      {language === 'bg' ? 'Зареждане...' : 'Loading...'}
                    </p>
                  </div>
                ) : mediaFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">{language === 'bg' ? 'Няма налични изображения' : 'No images available'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {mediaFiles.map((file, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectImageFromMedia(file.url)}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 active:border-blue-600 transition-colors group touch-manipulation"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 group-active:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                            {language === 'bg' ? 'Избери' : 'Select'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

