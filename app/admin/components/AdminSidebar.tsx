'use client';

import { ArrowLeft, Package, Tags, Settings, Cog, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import LanguageToggle from '@/components/LanguageToggle';
import { signOutAdmin } from '@/lib/auth';

interface AdminSidebarProps {
  currentPath: string;
  onClose?: () => void;
}

export default function AdminSidebar({ currentPath, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language || 'en'];

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

  return (
    <div
      className="w-64 h-full border-r flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div className="flex flex-col h-full">
        {/* Mobile close button */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-300 hover:opacity-70"
            style={{ color: theme.colors.textSecondary }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-6 pt-0 lg:pt-6">
        <div className="flex items-center justify-between lg:block mb-4 lg:mb-8">
          <button
            onClick={() => {
              router.push('/admin');
              onClose?.();
            }}
            onAuxClick={() => window.open('/admin', '_blank')}
            title={t.tooltipDashboard}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
          >
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
          </button>
          <div className="lg:hidden">
            <LanguageToggle />
          </div>
        </div>
        <nav className="space-y-1">
          <button
            onClick={() => {
              router.push('/admin/products');
              onClose?.();
            }}
            onAuxClick={() => window.open('/admin/products', '_blank')}
            title={t.tooltipProducts}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/products' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/products' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/products' ? theme.colors.primary : theme.colors.text
            }}
          >
            <div className="flex items-center gap-3">
              <Package size={18} />
              <span>{t.products}</span>
            </div>
          </button>
          <button
            onClick={() => {
              router.push('/admin/product-types');
              onClose?.();
            }}
            onAuxClick={() => window.open('/admin/product-types', '_blank')}
            title={t.tooltipProductTypes}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/product-types' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/product-types' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/product-types' ? theme.colors.primary : theme.colors.text
            }}
          >
            <div className="flex items-center gap-3">
              <Tags size={18} />
              <span>{t.productTypes}</span>
            </div>
          </button>
          <button
            onClick={() => {
              router.push('/admin/properties');
              onClose?.();
            }}
            onAuxClick={() => window.open('/admin/properties', '_blank')}
            title={t.tooltipProperties}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/properties' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/properties' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/properties' ? theme.colors.primary : theme.colors.text
            }}
          >
            <div className="flex items-center gap-3">
              <Settings size={18} />
              <span>{t.properties}</span>
            </div>
          </button>
          <button
            onClick={() => {
              router.push('/admin/settings');
              onClose?.();
            }}
            onAuxClick={() => window.open('/admin/settings', '_blank')}
            title={t.tooltipSettings}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/settings' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/settings' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/settings' ? theme.colors.primary : theme.colors.text
            }}
          >
            <div className="flex items-center gap-3">
              <Cog size={18} />
              <span>{t.settings}</span>
            </div>
          </button>
        </nav>
        <button
          onClick={() => {
            handleBackToStore();
            onClose?.();
          }}
          onAuxClick={() => {
            handleBackToStore();
            onClose?.();
          }}
          title={t.tooltipBackToStore}
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
          <span>{t.backToStore}</span>
        </button>
        </div>
      </div>
    </div>
  );
}



