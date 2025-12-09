'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, Settings as SettingsIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { uploadFile, getStorageUrl } from '@/lib/supabaseStorage';
import { getAdminSession } from '@/lib/auth';

interface StoreSettings {
  StoreSettingsID: string;
  StoreName: string;
  LogoUrl: string | null;
  ThemeId: string;
  Language: 'en' | 'bg';
  CreatedAt: string;
  UpdatedAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = translations[language];

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setIsAuthLoading(false);
        return;
      }

      try {
        const session = await getAdminSession();

        if (!session) {
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          router.push('/admin/login');
          return;
        }

        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('admin_user_email', session.user.email || '');
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('admin_authenticated');
        router.push('/admin/login');
      } else if (event === 'SIGNED_IN' && session) {
        const canAccess = session.user.user_metadata?.can_access || ['admin'];
        if (!canAccess.includes('admin')) {
          supabase.auth.signOut();
          router.push('/admin/login');
        } else {
          setIsAuthenticated(true);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Load settings from database
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading settings:', error);
          return;
        }

        if (data) {
          setSettings(data);
          // Apply loaded settings to context
          setLanguage(data.Language);
          setTheme(data.ThemeId);
        } else {
          // Create default settings if none exist
          const defaultSettings: Omit<StoreSettings, 'StoreSettingsID' | 'CreatedAt' | 'UpdatedAt'> = {
            StoreName: 'ModaBox',
            LogoUrl: null,
            ThemeId: 'default',
            Language: 'en'
          };

          const { data: newSettings, error: insertError } = await supabase
            .from('store_settings')
            .insert(defaultSettings)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating default settings:', insertError);
            return;
          }

          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [setLanguage, setTheme, isAuthenticated]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          StoreName: settings.StoreName,
          LogoUrl: settings.LogoUrl,
          ThemeId: settings.ThemeId,
          Language: settings.Language,
          UpdatedAt: new Date().toISOString()
        })
        .eq('StoreSettingsID', settings.StoreSettingsID);

      if (error) {
        console.error('Error saving settings:', error);
        alert(language === 'bg' ? 'Грешка при запазване на настройките' : 'Error saving settings');
        return;
      }

      setHasChanges(false);
      alert(language === 'bg' ? 'Настройките са запазени успешно' : 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(language === 'bg' ? 'Грешка при запазване на настройките' : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(language === 'bg' ? 'Моля изберете изображение' : 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(language === 'bg' ? 'Файлът е твърде голям. Максимален размер: 5MB' : 'File too large. Maximum size: 5MB');
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const result = await uploadFile(file, 'logos', fileName);

      if (result.success && result.url) {
        setSettings(prev => prev ? { ...prev, LogoUrl: result.url } : null);
        setHasChanges(true);
      } else {
        alert(language === 'bg' ? 'Грешка при качване на лого' : 'Error uploading logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert(language === 'bg' ? 'Грешка при качване на лого' : 'Error uploading logo');
    }

    // Clear input
    event.target.value = '';
  };

  const handleSettingChange = (field: keyof StoreSettings, value: any) => {
    if (!settings) return;

    setSettings(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <AdminLayout currentPath="/admin/settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout currentPath="/admin/settings">
        <div className="text-center py-12">
          <p style={{ color: theme.colors.textSecondary }}>
            {language === 'bg' ? 'Грешка при зареждане на настройките' : 'Error loading settings'}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath="/admin/settings">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon size={24} style={{ color: theme.colors.primary }} />
            <h1
              className="text-3xl font-bold"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Настройки на магазина' : 'Store Settings'}
            </h1>
          </div>
          <p
            className="text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            {language === 'bg' ? 'Управлявайте общите настройки на вашия магазин' : 'Manage your store general settings'}
          </p>
        </div>

        <div className="space-y-8">
          {/* Store Information */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Информация за магазина' : 'Store Information'}
            </h2>

            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Име на магазина' : 'Store Name'}
                </label>
                <input
                  type="text"
                  value={settings.StoreName}
                  onChange={(e) => handleSettingChange('StoreName', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder={language === 'bg' ? 'Въведете име на магазина' : 'Enter store name'}
                />
              </div>

              {/* Logo */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Лого' : 'Logo'}
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: settings.LogoUrl ? 'transparent' : theme.colors.secondary
                    }}
                  >
                    {settings.LogoUrl ? (
                      <img
                        src={settings.LogoUrl}
                        alt="Store Logo"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Upload size={24} style={{ color: theme.colors.textSecondary }} />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors duration-300"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff'
                      }}
                    >
                      <Upload size={16} />
                      {language === 'bg' ? 'Качи лого' : 'Upload Logo'}
                    </label>
                    <p
                      className="text-sm mt-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {language === 'bg' ? 'PNG, JPG до 5MB' : 'PNG, JPG up to 5MB'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1px solid ${theme.colors.border}`
            }}
          >
            <h2
              className="text-xl font-semibold mb-6"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Външен вид' : 'Appearance'}
            </h2>

            <div className="space-y-6">
              {/* Color Theme */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Цветова палитра' : 'Color Palette'}
                </label>
                <ThemeSwitcher />
              </div>

              {/* Language */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Език' : 'Language'}
                </label>
                <LanguageToggle />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                  boxShadow: theme.effects.shadow
                }}
              >
                <Save size={20} />
                {isSaving
                  ? (language === 'bg' ? 'Запазване...' : 'Saving...')
                  : (language === 'bg' ? 'Запази настройки' : 'Save Settings')
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}