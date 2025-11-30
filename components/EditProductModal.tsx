'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { Product } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';

interface EditProductModalProps {
  product: Product | null; // null for new product
  onClose: () => void;
  onSave: (product: Product) => void;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
  const isNewProduct = !product || product.id === 0;
  const [formData, setFormData] = useState<Product>(
    product || {
      id: 0,
      category: 'clothes',
      brand: '',
      model: '',
      color: '',
      quantity: 0,
      price: 0,
      visible: true,
      images: []
    }
  );
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(language === 'bg' ? 'Моля изберете снимка (JPG, PNG, etc.)' : 'Please select an image (JPG, PNG, etc.)');
      return;
    }

    // Create temporary preview URL
    const tempPreviewUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Add temporary preview to images immediately
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, tempPreviewUrl]
    }));
    
    // Add to uploading list
    setUploadingImages(prev => [...prev, tempId]);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'images');

      console.log('📤 Uploading image:', file.name, file.size, file.type);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: uploadFormData
      });

      const result = await response.json();
      console.log('📥 Upload response:', result);

      if (response.ok && result.success) {
        // Verify URL is valid
        if (!result.url) {
          console.error('❌ No URL returned from upload:', result);
          setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img !== tempPreviewUrl)
          }));
          URL.revokeObjectURL(tempPreviewUrl);
          alert(language === 'bg' 
            ? 'Грешка: URL не е върнат от сървъра' 
            : 'Error: No URL returned from server');
          return;
        }

        // Remove temporary preview and add real URL
        setFormData(prev => {
          const newImages = prev.images
            .filter(img => img !== tempPreviewUrl)
            .concat(result.url);
          
          console.log('📸 Updated images array:', {
            oldCount: prev.images.length,
            newCount: newImages.length,
            newUrl: result.url,
            allUrls: newImages
          });
          
          return {
            ...prev,
            images: newImages
          };
        });
        
        // Revoke temporary URL
        URL.revokeObjectURL(tempPreviewUrl);
        
        console.log('✅ Image uploaded successfully:', {
          url: result.url,
          path: result.path,
          fileName: result.fileName,
          bucket: result.bucket,
          fullUrl: result.url
        });
        
        // Test if image is accessible
        const img = new Image();
        img.onload = () => {
          console.log('✅ Image URL is accessible and loaded:', result.url);
        };
        img.onerror = () => {
          console.warn('⚠️ Image URL may not be accessible:', result.url);
          console.warn('⚠️ Check if bucket is public and CORS is configured');
        };
        img.src = result.url;
      } else {
        // Remove temporary preview on error
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter(img => img !== tempPreviewUrl)
        }));
        URL.revokeObjectURL(tempPreviewUrl);
        
        console.error('❌ Upload failed:', result);
        alert(language === 'bg' 
          ? `Грешка при качване: ${result.error || 'Неуспешно качване'}` 
          : `Upload error: ${result.error || 'Upload failed'}`);
      }
    } catch (error) {
      // Remove temporary preview on error
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== tempPreviewUrl)
      }));
      URL.revokeObjectURL(tempPreviewUrl);
      
      console.error('❌ Upload error:', error);
      alert(language === 'bg' 
        ? 'Грешка при качване на снимка' 
        : 'Error uploading image');
    } finally {
      setUploadingImages(prev => prev.filter(id => id !== tempId));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleImageUpload(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        handleImageUpload(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="rounded-xl max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.surface,
          boxShadow: theme.effects.shadowHover
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="sticky top-0 border-b px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex justify-between items-center transition-colors duration-300 z-10"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border
          }}
        >
          <h2 
            className="text-base sm:text-lg md:text-xl font-semibold transition-colors duration-300 pr-2"
            style={{ color: theme.colors.text }}
          >
            {isNewProduct 
              ? (language === 'bg' ? 'Добави нов продукт' : 'Add New Product')
              : t.editProduct}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 sm:p-2 rounded transition-colors duration-300 flex-shrink-0 touch-manipulation"
            style={{ color: theme.colors.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label={t.cancel}
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.basicInfo}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.categoryLabel}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                >
                  <option value="clothes">{t.clothes}</option>
                  <option value="shoes">{t.shoes}</option>
                  <option value="accessories">{t.accessories}</option>
                </select>
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.brandLabel}
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.modelLabel}
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>

            {formData.category === 'clothes' && (
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.typeLabel}
                </label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder={t.typePlaceholder}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.attributes}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.colorLabel}
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>

              <div>
                <label 
                  className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                  style={{ color: theme.colors.text }}
                >
                  {t.sizeLabel}
                </label>
                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.quantityLabel}
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          <div>
            <h3 
              className="font-medium mb-2.5 sm:mb-3 md:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.pricing}
            </h3>
            <div>
              <label 
                className="block text-xs sm:text-sm font-medium mb-1.5 transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.priceLabel}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h3 
              className="font-medium text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Снимки' : 'Images'}
            </h3>
            
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-3 sm:p-4 md:p-6 transition-all duration-300 ${
                dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              style={{
                borderColor: dragActive ? theme.colors.primary : theme.colors.border,
                backgroundColor: dragActive ? 'transparent' : theme.colors.cardBg
              }}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <ImageIcon 
                  size={32}
                  className="sm:w-10 sm:h-10 mb-2"
                  style={{ color: theme.colors.textSecondary }}
                />
                <p 
                  className="text-xs sm:text-sm mb-2.5 sm:mb-3 transition-colors duration-300 px-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' 
                    ? 'Плъзнете снимки тук или кликнете за избор' 
                    : 'Drag images here or click to select'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center gap-1.5 sm:gap-2 touch-manipulation"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Upload size={14} className="sm:w-4 sm:h-4" />
                  <span>{language === 'bg' ? 'Избери снимки' : 'Select Images'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInput}
                  className="hidden"
                />
                <p 
                  className="text-xs mt-2 transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' 
                    ? 'JPG, PNG, GIF до 10MB' 
                    : 'JPG, PNG, GIF up to 10MB'}
                </p>
              </div>
            </div>

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p 
                  className="text-xs transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' 
                    ? `Качени снимки: ${formData.images.length}` 
                    : `Uploaded images: ${formData.images.length}`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3">
                  {formData.images.map((image, index) => {
                    const isUploading = uploadingImages.some(id => 
                      formData.images.indexOf(image) === formData.images.length - 1
                    );
                    return (
                      <div
                        key={`${image}-${index}`}
                        className="relative group aspect-square rounded-lg overflow-hidden border transition-colors duration-300"
                        style={{ borderColor: theme.colors.border }}
                      >
                        {isUploading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" style={{ color: theme.colors.primary }} />
                          </div>
                        ) : (
                          <>
                            <img
                              src={image}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', {
                                  url: image,
                                  index,
                                  allImages: formData.images
                                });
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'w-full h-full flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-2 text-center';
                                errorDiv.innerHTML = `
                                  <div>${language === 'bg' ? 'Грешка при зареждане' : 'Load error'}</div>
                                  <div class="text-[10px] mt-1 break-all">${image.substring(0, 30)}...</div>
                                `;
                                target.parentElement?.appendChild(errorDiv);
                              }}
                              onLoad={() => {
                                console.log('✅ Image loaded successfully:', {
                                  url: image,
                                  index
                                });
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1.5 sm:p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-opacity duration-300 touch-manipulation z-10"
                              aria-label={language === 'bg' ? 'Премахни снимка' : 'Remove image'}
                              onTouchStart={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                            >
                              <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 
              className="font-medium mb-3 sm:mb-4 text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {t.visibility}
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded focus:ring-2 transition-colors duration-300"
                style={{
                  accentColor: theme.colors.primary
                }}
              />
              <span 
                className="text-xs sm:text-sm transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.visibleOnWebsite}
              </span>
            </label>
          </div>

          <div 
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t transition-colors duration-300 sticky bottom-0 bg-inherit"
            style={{ borderColor: theme.colors.border }}
          >
            <button
              type="submit"
              className="flex-1 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 md:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 touch-manipulation"
              style={{
                backgroundColor: typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')
                  ? theme.colors.buttonPrimary
                  : undefined,
                backgroundImage: typeof theme.colors.buttonPrimary === 'string' && theme.colors.buttonPrimary.includes('gradient') 
                  ? theme.colors.buttonPrimary 
                  : undefined
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
                  e.currentTarget.style.backgroundImage = 'none';
                } else {
                  e.currentTarget.style.backgroundImage = theme.colors.buttonPrimary;
                }
              }}
              onTouchStart={(e) => {
                if (typeof theme.colors.buttonPrimary === 'string' && !theme.colors.buttonPrimary.includes('gradient')) {
                  e.currentTarget.style.backgroundColor = theme.colors.buttonPrimaryHover;
                }
              }}
            >
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 md:px-6 py-2.5 sm:py-2 md:py-2.5 rounded-lg text-sm sm:text-base transition-colors duration-300 touch-manipulation"
              style={{ 
                color: theme.colors.text,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

