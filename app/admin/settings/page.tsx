'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, Settings as SettingsIcon, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import RichTextEditor from '@/components/RichTextEditor';
import { useTheme } from '@/context/ThemeContext';
import { translations } from '@/lib/translations';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import AdminLayout from '../components/AdminLayout';
import { uploadFile, getStorageUrl } from '@/lib/supabaseStorage';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase-browser';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface StoreSettings {
  storesettingsid: string;
  storename: string;
  logourl: string | null;
  themeid: string;
  language: 'en' | 'bg';
  bannertext: string | null;
  bannerduration: number | null;
  heroimageurl: string | null;
  discordurl: string | null;
  facebookurl: string | null;
  pinteresturl: string | null;
  youtubeurl: string | null;
  instagramurl: string | null;
  xurl: string | null;
  tiktokurl: string | null;
  email: string | null;
  yearofcreation: number | null;
  telephonenumber: string | null;
  closingremarks: string | null;
  aboutusphoto: string | null;
  aboutustext: string | null;
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

  // Load settings from API
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/store-settings');
        const result = await response.json();

        if (!response.ok) {
          console.error('Error loading settings:', result.error);
          return;
        }

        if (result.settings) {
          setSettings(result.settings);
          // Apply language and theme from settings for admin panel context
          // Note: User preferences in localStorage take priority over store settings
          if (!localStorage.getItem('theme')) {
            setTheme(result.settings.themeid);
          }
          if (!localStorage.getItem('language')) {
            setLanguage(result.settings.language);
          }
        } else {
          // Create default settings if none exist
          const defaultSettings = {
            storename: 'ModaBox',
            logourl: null,
            themeid: 'default',
            language: 'en',
            bannertext: null,
            bannerduration: 5,
            heroimageurl: null,
            discordurl: null,
            facebookurl: null,
            pinteresturl: null,
            youtubeurl: null,
            instagramurl: null,
            xurl: null,
            tiktokurl: null,
            email: null,
            yearofcreation: null,
            telephonenumber: null,
            closingremarks: null,
            aboutusphoto: null,
            aboutustext: null
          };

          const createResponse = await fetch('/api/store-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultSettings)
          });

          const createResult = await createResponse.json();

          if (!createResponse.ok || !createResult.success) {
            console.error('Error creating default settings:', createResult.error);
            return;
          }

          setSettings(createResult.settings);
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
      const response = await fetch(`/api/store-settings/${settings.storesettingsid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storename: settings.storename,
          logourl: settings.logourl,
          themeid: settings.themeid,
          language: settings.language,
          bannertext: settings.bannertext,
          bannerduration: settings.bannerduration,
          heroimageurl: settings.heroimageurl,
          discordurl: settings.discordurl,
          facebookurl: settings.facebookurl,
          pinteresturl: settings.pinteresturl,
          youtubeurl: settings.youtubeurl,
          instagramurl: settings.instagramurl,
          xurl: settings.xurl,
          tiktokurl: settings.tiktokurl,
          email: settings.email,
          yearofcreation: settings.yearofcreation,
          telephonenumber: settings.telephonenumber,
          closingremarks: settings.closingremarks,
          aboutusphoto: settings.aboutusphoto,
          aboutustext: settings.aboutustext
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Error saving settings:', result.error);
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

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    // Validate file type - allow images including GIFs
    if (!file.type.startsWith('image/')) {
      alert(t.pleaseSelectImage);
      return;
    }

    // Validate file size (max 5MB for hero images including GIFs)
    if (file.size > 5 * 1024 * 1024) {
      alert(t.fileTooLarge);
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `hero-${Date.now()}.${file.name.split('.').pop()}`;
      const result = await uploadFile('hero-images', fileName, file);

      if (result.success && result.url) {
        setSettings(prev => prev ? { ...prev, heroimageurl: result.url } : null);
        setHasChanges(true);
      } else {
        alert(language === 'bg' ? 'Грешка при качване на hero изображение' : 'Error uploading hero image');
      }
    } catch (error) {
      console.error('Hero image upload error:', error);
      alert(language === 'bg' ? 'Грешка при качване на hero изображение' : 'Error uploading hero image');
    }

    // Clear input
    event.target.value = '';
  };

  const handleAboutUsPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `about-us-${Date.now()}.${file.name.split('.').pop()}`;
      const result = await uploadFile('images', fileName, file);

      if (result.success && result.url) {
        setSettings(prev => prev ? { ...prev, aboutusphoto: result.url } : null);
        setHasChanges(true);
      } else {
        alert(language === 'bg' ? 'Грешка при качване на изображение' : 'Error uploading image');
      }
    } catch (error) {
      console.error('About us photo upload error:', error);
      alert(language === 'bg' ? 'Грешка при качване на изображение' : 'Error uploading image');
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
              <div id="settings-store-information">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {t.storeName}
                </label>
                <input
                  id="settings-store-name"
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

              {/* Email */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Имейл' : 'Email'}
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleSettingChange('email', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder={language === 'bg' ? 'example@store.com' : 'example@store.com'}
                />
              </div>

              {/* Telephone Number */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Телефонен номер' : 'Telephone Number'}
                </label>
                <input
                  id="settings-telephone"
                  type="tel"
                  value={settings.telephonenumber || ''}
                  onChange={(e) => handleSettingChange('telephonenumber', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder={language === 'bg' ? '+359 123 456 789' : '+1 234 567 8900'}
                />
              </div>

              {/* Year of Creation */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Година на създаване' : 'Year of Creation'}
                </label>
                <input
                  id="settings-year-creation"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={settings.yearofcreation || ''}
                  onChange={(e) => handleSettingChange('yearofcreation', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>

              {/* Closing Remarks */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Заключителни думи' : 'Closing Remarks'}
                </label>
                <textarea
                  id="settings-closing-remarks"
                  value={settings.closingremarks || ''}
                  onChange={(e) => handleSettingChange('closingremarks', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    minHeight: '120px'
                  }}
                  placeholder={language === 'bg' ? 'Въведете заключителни думи или съобщение за магазина' : 'Enter closing remarks or message for the store'}
                />
                <p
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' ? 'Опционално съобщение, което ще се показва на сайта' : 'Optional message that will be displayed on the store'}
                </p>
              </div>

              {/* About Us Section */}
              <div id="settings-about-us" className="border-t pt-6 mt-6" style={{ borderColor: theme.colors.border }}>
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Страница "За нас"' : 'About Us Page'}
                </h3>

                {/* About Us Photo */}
                <div id="settings-about-us-photo" className="mb-6">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text }}
                  >
                    {language === 'bg' ? 'Снимка за страницата "За нас"' : 'About Us Photo'}
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                      style={{
                        borderColor: theme.colors.border,
                        backgroundColor: settings.aboutusphoto ? 'transparent' : theme.colors.secondary
                      }}
                    >
                      {settings.aboutusphoto ? (
                        <img
                          src={settings.aboutusphoto}
                          alt="About Us"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={32}
                          style={{ color: theme.colors.textSecondary }}
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        className="px-4 py-2 rounded-md cursor-pointer transition-colors duration-300 inline-flex items-center gap-2"
                        style={{
                          backgroundColor: theme.colors.primary,
                          color: '#fff'
                        }}
                      >
                        <Upload size={16} />
                        {language === 'bg' ? 'Качи снимка' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAboutUsPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {settings.aboutusphoto && (
                        <button
                          onClick={() => {
                            setSettings(prev => prev ? { ...prev, aboutusphoto: null } : null);
                            setHasChanges(true);
                          }}
                          className="px-4 py-2 rounded-md transition-colors duration-300 text-sm"
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#fff'
                          }}
                        >
                          {language === 'bg' ? 'Премахни снимка' : 'Remove Photo'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p
                    className="text-sm mt-2"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {language === 'bg' ? 'Максимален размер: 5MB' : 'Max size: 5MB'}
                  </p>
                </div>

                {/* About Us Text (Rich Text Editor) */}
                <div id="settings-about-us-text">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme.colors.text }}
                  >
                    {language === 'bg' ? 'Текст за страницата "За нас"' : 'About Us Text'}
                  </label>
                  <RichTextEditor
                    value={settings.aboutustext || ''}
                    onChange={(value) => handleSettingChange('aboutustext', value || null)}
                    theme={theme}
                    language={language}
                  />
                  <p
                    className="text-sm mt-2"
                    style={{ color: theme.colors.textSecondary }}
                  >
                    {language === 'bg' ? 'Използвайте редактора за форматиране на текста с удебелен шрифт, курсив, списъци и др.' : 'Use the editor to format text with bold, italic, lists, and more'}
                  </p>
                </div>
              </div>

              {/* Logo */}
              <div id="settings-logo">
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

              {/* Hero Image */}
              <div id="settings-hero-image">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Hero изображение' : 'Hero Image'}
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                    style={{
                      borderColor: theme.colors.border,
                      backgroundColor: settings.heroimageurl ? 'transparent' : theme.colors.secondary
                    }}
                  >
                    {settings.heroimageurl ? (
                      <img
                        src={settings.heroimageurl}
                        alt="Hero Image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Upload size={24} style={{ color: theme.colors.textSecondary }} />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="hidden"
                      id="hero-image-upload"
                    />
                    <label
                      htmlFor="hero-image-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors duration-300"
                      style={{
                        backgroundColor: theme.colors.primary,
                        color: '#ffffff'
                      }}
                    >
                      <Upload size={16} />
                      {language === 'bg' ? 'Качи Hero изображение' : 'Upload Hero Image'}
                    </label>
                    {settings.heroimageurl && (
                      <button
                        onClick={() => handleSettingChange('heroimageurl', null)}
                        className="block mt-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        {language === 'bg' ? 'Премахни изображение' : 'Remove Image'}
                      </button>
                    )}
                    <p
                      className="text-sm mt-1"
                      style={{ color: theme.colors.textSecondary }}
                    >
                      {language === 'bg' ? 'Изображение или GIF за началната страница (препоръчително: 1920x1080px, макс. 5MB)' : 'Image or GIF for the home page (recommended: 1920x1080px, max 5MB)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div
            id="settings-appearance"
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
              <div id="settings-color-palette">
                <label
                  className="block text-sm font-medium mb-3"
                  style={{ color: theme.colors.text }}
                >
                  {t.colorPalette}
                </label>
                <ThemeSwitcher />
              </div>

              {/* Language */}
              <div id="settings-language">
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

          {/* Banner Settings */}
          <div
            id="settings-banner"
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
              {language === 'bg' ? 'Банер' : 'Banner'}
            </h2>

            <div className="space-y-6">
              {/* Banner Text */}
              <div id="settings-banner-text">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Текст на банера (по един ред на ред)' : 'Banner Text (one line per row)'}
                </label>
                <textarea
                  value={settings.bannertext || ''}
                  onChange={(e) => handleSettingChange('bannertext', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    minHeight: '120px',
                    fontFamily: 'monospace'
                  }}
                  placeholder={language === 'bg' ? 'Въведете текст на банера\nВсеки ред ще се показва отделно' : 'Enter banner text\nEach line will be displayed separately'}
                />
                <p
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' ? 'Всеки ред ще се ротира автоматично' : 'Each line will rotate automatically'}
                </p>
              </div>

              {/* Banner Duration */}
              <div id="settings-banner-duration">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  {language === 'bg' ? 'Продължителност на ротация (секунди)' : 'Rotation Duration (seconds)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.bannerduration || 5}
                  onChange={(e) => handleSettingChange('bannerduration', parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                />
                <p
                  className="text-sm mt-1"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {language === 'bg' ? 'Време между смяна на редовете' : 'Time between line changes'}
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Settings */}
          <div
            id="settings-social-media"
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
              {language === 'bg' ? 'Социални мрежи (Оставете празно, ако не желаете да показвате линк)' : 'Social Media (Leave empty if you do not want to display a link)'}
            </h2>

            <div className="space-y-4">
              {/* Discord */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Discord URL
                </label>
                <input
                  id="settings-discord"
                  type="url"
                  value={settings.discordurl || ''}
                  onChange={(e) => handleSettingChange('discordurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://discord.gg/..."
                />
              </div>

              {/* Facebook */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Facebook URL
                </label>
                <input
                  id="settings-facebook"
                  type="url"
                  value={settings.facebookurl || ''}
                  onChange={(e) => handleSettingChange('facebookurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* Pinterest */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Pinterest URL
                </label>
                <input
                  id="settings-pinterest"
                  type="url"
                  value={settings.pinteresturl || ''}
                  onChange={(e) => handleSettingChange('pinteresturl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://pinterest.com/..."
                />
              </div>

              {/* YouTube */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  YouTube URL
                </label>
                <input
                  id="settings-youtube"
                  type="url"
                  value={settings.youtubeurl || ''}
                  onChange={(e) => handleSettingChange('youtubeurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* Instagram */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  Instagram URL
                </label>
                <input
                  id="settings-instagram"
                  type="url"
                  value={settings.instagramurl || ''}
                  onChange={(e) => handleSettingChange('instagramurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://instagram.com/..."
                />
              </div>

              {/* X (Twitter) */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  X (Twitter) URL
                </label>
                <input
                  id="settings-x"
                  type="url"
                  value={settings.xurl || ''}
                  onChange={(e) => handleSettingChange('xurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://x.com/..."
                />
              </div>

              {/* TikTok */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: theme.colors.text }}
                >
                  TikTok URL
                </label>
                <input
                  id="settings-tiktok"
                  type="url"
                  value={settings.tiktokurl || ''}
                  onChange={(e) => handleSettingChange('tiktokurl', e.target.value || null)}
                  className="w-full px-3 py-2 rounded-md border transition-colors duration-300"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              id="settings-save"
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