'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Eye, EyeOff, ArrowLeft, Upload, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import EditProductModal from '@/components/EditProductModal';
import { useProducts } from '@/context/ProductContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import { Product } from '@/lib/data';
import LanguageToggle from '@/components/LanguageToggle';
import { supabase } from '@/lib/supabase';
import { testStorageConnection, DEFAULT_BUCKET, uploadFile, getStorageUrl, listFiles } from '@/lib/supabaseStorage';
import { generateAndUploadTestImage } from '@/lib/generateTestImage';
import { signOutAdmin } from '@/lib/auth';

export default function AdminPanel() {
  const { products, setProducts } = useProducts();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const t = translations[language];
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; path: string }>>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Test Supabase connection, Storage bucket, and Session on component mount (client-side only)
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const testConnections = async () => {
      try {
        console.log('🔌 AdminPanel: Testing Supabase connections...');
        
        // Check session first
        const { getAdminSession } = await import('@/lib/auth');
        const session = await getAdminSession();
        
        if (session) {
          console.log('✅ AdminPanel: Active session found!');
          console.log('Session info:', {
            email: session.user.email,
            userId: session.user.id,
            expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
            role: session.user.user_metadata?.role
          });
        } else {
          console.warn('⚠️ AdminPanel: No active session found');
        }
        
        // Check if environment variables are available
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!hasUrl || !hasKey) {
          console.error('❌ AdminPanel: Missing Supabase environment variables');
          console.error('Please create .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
          return;
        }
        
        // Test database connection
        console.log('📊 Testing database connection...');
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .limit(1);

        if (error) {
          console.error('❌ AdminPanel: Database connection error:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('✅ AdminPanel: Database connection successful!');
          console.log('Connection info:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            productsFound: data?.length || 0
          });
        }

        // Test Storage bucket connection
        console.log('📦 Testing Storage bucket connection...');
        const storageResult = await testStorageConnection(DEFAULT_BUCKET);
        
        if (storageResult.success) {
          console.log('✅ AdminPanel: Storage bucket connection successful!');
          console.log(`Bucket "${DEFAULT_BUCKET}" is accessible with ${storageResult.fileCount} items`);
        } else {
          console.warn('⚠️ AdminPanel: Storage bucket connection issue:', storageResult.message);
          if (storageResult.availableBuckets) {
            console.log('Available buckets:', storageResult.availableBuckets);
          }
        }
      } catch (err) {
        console.error('❌ AdminPanel: Failed to connect to Supabase:', err);
        if (err instanceof Error) {
          console.error('Error message:', err.message);
        }
      }
    };

    testConnections();
  }, []);

  const handleBackToStore = async () => {
    try {
      // Sign out from Supabase
      await signOutAdmin();
      
      // Clear localStorage
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_login_time');
      localStorage.removeItem('admin_user_email');
      localStorage.setItem('isAdmin', 'false');

      // Call logout API to clear cookies
      await fetch('/api/auth/logout', { method: 'POST' });

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      localStorage.setItem('isAdmin', 'false');
      router.push('/');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm || 
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.color.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesVisibility = visibilityFilter === 'all' || 
      (visibilityFilter === 'visible' && p.visible) ||
      (visibilityFilter === 'hidden' && !p.visible);

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const toggleVisibility = (id: number) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, visible: !p.visible } : p
    ));
  };

  const handleSaveProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    ));
    setEditingProduct(null);
  };

  // Load uploaded files on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const { data, error } = await listFiles(DEFAULT_BUCKET, '');
        if (!error && data) {
          const filesWithUrls = data.map(file => ({
            name: file.name,
            path: file.name,
            url: getStorageUrl(DEFAULT_BUCKET, file.name)
          }));
          setUploadedFiles(filesWithUrls);
          console.log('📁 Loaded files from storage:', filesWithUrls.length);
        }
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };
    loadFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Моля изберете снимка (JPG, PNG, etc.)');
      return;
    }

    setUploading(true);
    setUploadProgress('Качване на снимка...');

    try {
      console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Use API route for upload (bypasses RLS)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'images');

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadProgress(`✅ Снимката е качена успешно!`);
        
        // Add to uploaded files list
        setUploadedFiles(prev => [{
          name: file.name,
          path: result.path,
          url: result.url
        }, ...prev]);

        console.log('✅ Upload successful!');
        console.log('📎 File path:', result.path);
        console.log('🔗 Public URL:', result.url);
        
        // Clear input
        event.target.value = '';
        
        setTimeout(() => {
          setUploadProgress('');
          setShowUploadModal(false);
        }, 2000);
      } else {
        setUploadProgress(`❌ Грешка: ${result.error || 'Неуспешно качване'}`);
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      setUploadProgress(`❌ Грешка: ${error instanceof Error ? error.message : 'Неочаквана грешка'}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div 
      className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div 
        className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r flex-shrink-0 transition-colors duration-300"
        style={{ 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between lg:block mb-4 lg:mb-8">
            <div className="flex items-center gap-2">
              <Image
                src="/image.png"
                alt="ModaBox Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <div 
                className="text-lg sm:text-xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                ModaBox
              </div>
            </div>
            <div className="lg:hidden">
              <LanguageToggle />
            </div>
          </div>
          <nav className="space-y-1">
            <div 
              className="px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300"
              style={{
                backgroundColor: theme.colors.secondary,
                color: theme.colors.primary
              }}
            >
              {t.products}
            </div>
          </nav>
          <button
            onClick={handleBackToStore}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg transition-colors duration-300 touch-manipulation min-h-[44px] sm:min-h-[auto]"
            style={{ 
              color: theme.colors.text
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
            <ArrowLeft size={18} />
            <span>{language === 'bg' ? 'Обратно в магазина' : 'Back to Store'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 
                className="text-2xl sm:text-3xl font-semibold transition-colors duration-300"
                style={{ color: theme.colors.text }}
              >
                {t.products}
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      setUploading(true);
                      setUploadProgress('Генериране на тестова снимка...');
                      
                      // Generate test image
                      const imageBlob = await generateAndUploadTestImage();
                      
                      // Create a File object from the blob
                      const timestamp = Date.now();
                      const file = new File([imageBlob], `test-${timestamp}.png`, { type: 'image/png' });
                      
                      setUploadProgress('Качване на снимката...');
                      
                      // Use API route for upload (bypasses RLS)
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('folder', 'images');

                      const response = await fetch('/api/storage/upload', {
                        method: 'POST',
                        body: formData
                      });

                      const result = await response.json();

                      if (response.ok && result.success) {
                        setUploadProgress(`✅ Тестовата снимка е качена успешно!`);
                        
                        // Add to uploaded files list
                        setUploadedFiles(prev => [{
                          name: `test-${timestamp}.png`,
                          path: result.path,
                          url: result.url
                        }, ...prev]);

                        console.log('✅ Test image uploaded successfully!');
                        console.log('📎 File path:', result.path);
                        console.log('🔗 Public URL:', result.url);
                        
                        // Open in new tab
                        setTimeout(() => {
                          window.open(result.url, '_blank');
                          setUploadProgress('');
                        }, 1000);
                      } else {
                        setUploadProgress(`❌ Грешка: ${result.error || 'Неуспешно качване'}`);
                        console.error('Test image upload failed:', result.error);
                      }
                    } catch (error) {
                      setUploadProgress(`❌ Грешка: ${error instanceof Error ? error.message : 'Неочаквана грешка'}`);
                      console.error('Test image upload error:', error);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 font-medium text-sm"
                  style={{
                    backgroundColor: uploading ? theme.colors.textSecondary : theme.colors.primary,
                    color: '#fff',
                    opacity: uploading ? 0.6 : 1
                  }}
                >
                  <ImageIcon size={18} />
                  <span>{uploading ? (language === 'bg' ? 'Качване...' : 'Uploading...') : (language === 'bg' ? 'Генерирай тестова снимка' : 'Generate Test Image')}</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-300 font-medium text-sm"
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
                >
                  <Upload size={18} />
                  <span>{language === 'bg' ? 'Качи снимка' : 'Upload Image'}</span>
                </button>
                <div className="hidden lg:block">
                  <LanguageToggle />
                </div>
              </div>
            </div>
            <p 
              className="text-sm sm:text-base transition-colors duration-300"
              style={{ color: theme.colors.textSecondary }}
            >
              {t.manageProducts}
            </p>
          </div>

          <div 
            className="rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300" 
                    size={18}
                    style={{ color: theme.colors.textSecondary }}
                  />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300"
                    style={{
                      backgroundColor: theme.colors.cardBg,
                      borderColor: theme.colors.border,
                      color: theme.colors.text
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}33`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation min-h-[44px] sm:min-h-[auto]"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allCategories}</option>
                <option value="clothes">{t.clothes}</option>
                <option value="shoes">{t.shoes}</option>
                <option value="accessories">{t.accessories}</option>
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-300 touch-manipulation min-h-[44px] sm:min-h-[auto]"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <option value="all">{t.allItems}</option>
                <option value="visible">{t.visible}</option>
                <option value="hidden">{t.hidden}</option>
              </select>
            </div>
          </div>

          <div 
            className="rounded-lg shadow-sm overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: theme.colors.surface,
              boxShadow: theme.effects.shadow
            }}
          >
            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="divide-y" style={{ borderColor: theme.colors.border }}>
                {filteredProducts.map(product => (
                  <div 
                    key={product.id}
                    className="p-4 transition-colors duration-300"
                    style={{ 
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.model}
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="font-semibold text-sm mb-1 truncate"
                              style={{ color: theme.colors.text }}
                            >
                              {product.brand} {product.model}
                            </h3>
                            <p 
                              className="text-xs mb-1"
                              style={{ color: theme.colors.textSecondary }}
                            >
                              {product.category === 'clothes' ? t.clothes : 
                               product.category === 'shoes' ? t.shoes : 
                               product.category === 'accessories' ? t.accessories : product.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => toggleVisibility(product.id)}
                              className={`p-2 rounded touch-manipulation ${
                                product.visible
                                  ? 'text-green-600 active:bg-green-50'
                                  : 'text-gray-400 active:bg-gray-100'
                              }`}
                              aria-label={product.visible ? t.visible : t.hidden}
                            >
                              {product.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="p-2 rounded transition-colors duration-300 touch-manipulation"
                              style={{ 
                                color: theme.colors.primary
                              }}
                              onTouchStart={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.secondary;
                              }}
                              onTouchEnd={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              aria-label={t.actions}
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span style={{ color: theme.colors.textSecondary }}>{t.color}: </span>
                            <span style={{ color: theme.colors.text }}>{product.color}</span>
                          </div>
                          <div>
                            <span style={{ color: theme.colors.textSecondary }}>{t.size}: </span>
                            <span style={{ color: theme.colors.text }}>{product.size || '-'}</span>
                          </div>
                          <div>
                            <span style={{ color: theme.colors.textSecondary }}>{t.qty}: </span>
                            <span style={{ color: theme.colors.text }}>{product.quantity}</span>
                          </div>
                          <div>
                            <span style={{ color: theme.colors.textSecondary }}>{t.price}: </span>
                            <span style={{ color: theme.colors.text }} className="font-semibold">€{product.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead 
                  className="border-b transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.secondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <tr>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.image}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.category}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.brand}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.model}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.color}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.size}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.qty}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.price}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.visible}
                    </th>
                    <th 
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: theme.colors.border }}>
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      className="transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-4 lg:px-6 py-4">
                        <img
                          src={product.images[0]}
                          alt={product.model}
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded object-cover"
                        />
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm capitalize transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.category === 'clothes' ? t.clothes : 
                         product.category === 'shoes' ? t.shoes : 
                         product.category === 'accessories' ? t.accessories : product.category}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.brand}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.model}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.color}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.size || '-'}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        {product.quantity}
                      </td>
                      <td 
                        className="px-4 lg:px-6 py-4 text-sm font-medium transition-colors duration-300"
                        style={{ color: theme.colors.text }}
                      >
                        €{product.price.toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <button
                          onClick={() => toggleVisibility(product.id)}
                          className={`p-2 rounded transition-colors ${
                            product.visible
                              ? 'text-green-600 hover:bg-green-50 active:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100 active:bg-gray-200'
                          }`}
                          aria-label={product.visible ? t.visible : t.hidden}
                        >
                          {product.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 rounded transition-colors duration-300"
                          style={{ 
                            color: theme.colors.primary
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.secondary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          aria-label={t.actions}
                        >
                          <Edit2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 px-4">
                <p 
                  className="text-sm sm:text-base transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {t.noProductsFound}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !uploading && setShowUploadModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.text
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 
                  className="text-xl font-semibold"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Качи снимка в Storage' : 'Upload Image to Storage'}
                </h2>
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  disabled={uploading}
                >
                  <X size={20} style={{ color: theme.colors.text }} />
                </button>
              </div>

              <div className="mb-6">
                <label 
                  className="block mb-2 text-sm font-medium"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Избери снимка' : 'Select Image'}
                </label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.cardBg
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = theme.colors.border;
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.files = e.dataTransfer.files as any;
                      input.onchange = (ev) => handleFileUpload(ev as any);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <ImageIcon 
                      size={48} 
                      className="mx-auto mb-4"
                      style={{ color: theme.colors.textSecondary }}
                    />
                    <p 
                      className="text-sm mb-2"
                      style={{ color: theme.colors.text }}
                    >
                      {language === 'bg' 
                        ? 'Кликни или влачи снимка тук' 
                        : 'Click or drag image here'}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {language === 'bg' 
                        ? 'JPG, PNG, GIF до 10MB' 
                        : 'JPG, PNG, GIF up to 10MB'}
                    </p>
                  </label>
                </div>
              </div>

              {uploadProgress && (
                <div 
                  className="p-4 rounded-lg mb-4"
                  style={{
                    backgroundColor: uploadProgress.includes('✅') 
                      ? 'rgba(34, 197, 94, 0.1)' 
                      : uploadProgress.includes('❌')
                      ? 'rgba(239, 68, 68, 0.1)'
                      : theme.colors.secondary
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text }}
                  >
                    {uploadProgress}
                  </p>
                </div>
              )}

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div>
                  <h3 
                    className="text-sm font-medium mb-3"
                    style={{ color: theme.colors.text }}
                  >
                    {language === 'bg' ? 'Качени снимки' : 'Uploaded Images'} ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {uploadedFiles.slice(0, 6).map((file, index) => (
                      <div 
                        key={index}
                        className="relative group"
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded border"
                          style={{ borderColor: theme.colors.border }}
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded flex items-center justify-center"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 text-white text-xs px-2 py-1 bg-black bg-opacity-75 rounded"
                          >
                            {language === 'bg' ? 'Отвори' : 'Open'}
                          </a>
                        </div>
                        <p 
                          className="text-xs mt-1 truncate"
                          style={{ color: theme.colors.textSecondary }}
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

