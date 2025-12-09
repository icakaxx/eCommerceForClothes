'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import LanguageToggle from '@/components/LanguageToggle';
import { signOutAdmin } from '@/lib/auth';

interface AdminSidebarProps {
  currentPath: string;
}

export default function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const router = useRouter();
  const { theme } = useTheme();

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
      className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r flex-shrink-0 transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between lg:block mb-4 lg:mb-8">
          <button
            onClick={() => router.push('/admin')}
            onAuxClick={() => window.open('/admin', '_blank')}
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
            onClick={() => router.push('/admin/products')}
            onAuxClick={() => window.open('/admin/products', '_blank')}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/products' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/products' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/products' ? theme.colors.primary : theme.colors.text
            }}
          >
            Products
          </button>
          <button
            onClick={() => router.push('/admin/product-types')}
            onAuxClick={() => window.open('/admin/product-types', '_blank')}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/product-types' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/product-types' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/product-types' ? theme.colors.primary : theme.colors.text
            }}
          >
            Product Types
          </button>
          <button
            onClick={() => router.push('/admin/properties')}
            onAuxClick={() => window.open('/admin/properties', '_blank')}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/properties' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/properties' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/properties' ? theme.colors.primary : theme.colors.text
            }}
          >
            Properties
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            onAuxClick={() => window.open('/admin/settings', '_blank')}
            className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm sm:text-base transition-colors duration-300 hover:opacity-80 ${
              currentPath === '/admin/settings' ? 'opacity-100' : 'opacity-80'
            }`}
            style={{
              backgroundColor: currentPath === '/admin/settings' ? theme.colors.secondary : theme.colors.surface,
              color: currentPath === '/admin/settings' ? theme.colors.primary : theme.colors.text
            }}
          >
            Settings
          </button>
        </nav>
        <button
          onClick={handleBackToStore}
          onAuxClick={handleBackToStore}
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
          <span>Back to Store</span>
        </button>
      </div>
    </div>
  );
}



