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
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface StoreSettings {
  storesettingsid: string;
  storename: string;
  logourl: string | null;
  themeid: string;
  language: 'en' | 'bg';
  createdat: string;
  updatedat: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { refreshSettings } = useStoreSettings();
  const t = translations[language || 'en'];

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
          // Apply language and theme from settings for admin panel context
          // Note: User preferences in localStorage take priority over store settings
          if (!localStorage.getItem('theme')) {
            setTheme(data.themeid);
          }
          if (!localStorage.getItem('language')) {
            setLanguage(data.language);
          }
        } else {
          // Create default settings if none exist
          const defaultSettings: Omit<StoreSettings, 'storesettingsid' | 'createdat' | 'updatedat'> = {
            storename: 'ModaBox',
            logourl: null,
            themeid: 'default',
            language: 'en'
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

  // Sync local settings with global theme changes
  useEffect(() => {
    if (settings && theme.id !== settings.themeid) {
      setSettings(prev => prev ? { ...prev, themeid: theme.id } : null);
      setHasChanges(true);
    }
  }, [theme.id, settings]);

  // Sync local settings with global language changes
  useEffect(() => {
    if (settings && language !== settings.language) {
      setSettings(prev => prev ? { ...prev, language: language } : null);
      setHasChanges(true);
    }
  }, [language, settings]);

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          storename: settings.storename,
          logourl: settings.logourl,
          themeid: settings.themeid,
          language: settings.language,
          updatedat: new Date().toISOString()
        })
        .eq('storesettingsid', settings.storesettingsid);

      if (error) {
        console.error('Error saving settings:', error);
        alert(t.errorSavingSettings);
        return;
      }

      setHasChanges(false);
      // Refresh global store settings to update the application
      await refreshSettings();
      alert(t.settingsSaved);
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
      alert(t.pleaseSelectImage);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t.fileTooLarge);
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
      const result = await uploadFile('logos', fileName, file);

      if (result.success && result.url) {
        setSettings(prev => prev ? { ...prev, logourl: result.url } : null);
        setHasChanges(true);
      } else {
        alert(t.errorUploadingLogo);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert(t.errorUploadingLogo);
    }

    // Clear input
    event.target.value = '';
  };

  const handleSettingChange = (field: keyof StoreSettings, value: any) => {
    if (!settings) return;

    setSettings(prev => prev ? { ...prev, [field]: value } : null);

    // Update global contexts immediately for theme and language changes
    if (field === 'themeid') {
      setTheme(value);
    } else if (field === 'language') {
      setLanguage(value);
    }

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
              {t.storeSettings}
            </h1>
          </div>
          <p
            className="text-base"
            style={{ color: theme.colors.textSecondary }}
          >
            {t.manageStoreSettings}
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
              {t.storeInformation}
            </h2>

            <div className="space-y-6">
              {/* Store Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {t.storeName}
                </label>
                <input
                  type="text"
                  value={settings.storename}
                  onChange={(e) => handleSettingChange('storename', e.target.value)}
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
                  {t.logo}
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: settings.logourl ? 'transparent' : theme.colors.secondary
                    }}
                  >
                    {settings.logourl ? (
                      <img
                        src={settings.logourl}
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
                      {t.uploadLogo}
                    </label>
                    <p
                      className="text-sm mt-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {t.logoRequirements}
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
              {t.appearance}
            </h2>

            <div className="space-y-6">
              {/* Color Theme */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: theme.colors.text }}
                >
                  {t.colorPalette}
                </label>
                <ThemeSwitcher />
              </div>

              {/* Language */}
              <div>
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: theme.colors.text }}
                >
                  {t.language}
                </label>
                <LanguageToggle />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
              style={{
                backgroundColor: hasChanges ? theme.colors.primary : theme.colors.secondary,
                color: '#ffffff',
                boxShadow: theme.effects.shadow,
                opacity: isSaving ? 0.5 : 1
              }}
            >
              <Save size={20} />
              {isSaving
                ? t.saving
                : t.saveSettings
              }
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}