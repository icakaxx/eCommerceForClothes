'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Settings, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  DollarSign, 
  Percent, 
  Image as ImageIcon,
  Eye,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface AdminSidebarProps {
  currentPath: string;
}

export default function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const menuItems = [
    {
      id: 'dashboard',
      label: t.dashboard || 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard
    },
    {
      id: 'products',
      label: t.products || 'Products',
      path: '/admin/products',
      icon: Package
    },
    {
      id: 'product-types',
      label: language === 'bg' ? 'Типове продукти' : 'Product Types',
      path: '/admin/product-types',
      icon: Tag
    },
    {
      id: 'properties',
      label: language === 'bg' ? 'Свойства' : 'Properties',
      path: '/admin/properties',
      icon: Settings
    },
    {
      id: 'customers',
      label: t.customers || 'Customers',
      path: '/admin/customers',
      icon: Users
    },
    {
      id: 'orders',
      label: language === 'bg' ? 'Поръчки' : 'Orders',
      path: '/admin/orders',
      icon: ShoppingCart
    },
    {
      id: 'sales',
      label: language === 'bg' ? 'Продажби' : 'Sales',
      path: '/admin/sales',
      icon: BarChart3
    },
    {
      id: 'analytics',
      label: language === 'bg' ? 'Доклади' : 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3
    },
    {
      id: 'visitors',
      label: t.visitors || 'Visitors',
      path: '/admin/visitors',
      icon: Eye
    },
    {
      id: 'finance',
      label: language === 'bg' ? 'Финанси' : 'Finance',
      path: '/admin/finance',
      icon: DollarSign
    },
    {
      id: 'discounts',
      label: language === 'bg' ? 'Отстъпки' : 'Discounts',
      path: '/admin/discounts',
      icon: Percent
    },
    {
      id: 'media',
      label: language === 'bg' ? 'Медия' : 'Media',
      path: '/admin/media',
      icon: ImageIcon
    },
    {
      id: 'settings',
      label: t.storeSettings || 'Settings',
      path: '/admin/settings',
      icon: Settings
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors duration-200 shadow-lg"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`
        }}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 h-screen
          transform transition-transform duration-300 ease-in-out
          lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex-shrink-0 border-r
        `}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
      >
        <div className="h-full flex flex-col max-h-screen">
          {/* Header */}
          <div
            className="p-3 sm:p-4 border-b flex items-center justify-between"
            style={{ borderColor: theme.colors.border }}
          >
            <h2
              className="text-base sm:text-lg font-bold"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Админ панел' : 'Admin Panel'}
            </h2>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 rounded transition-colors duration-200"
              style={{ color: theme.colors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.colors.text;
                e.currentTarget.style.backgroundColor = theme.colors.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.colors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 sm:p-3 min-h-0">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 touch-manipulation min-h-[44px] ${
                      active ? 'font-medium' : ''
                    }`}
                    style={{
                      backgroundColor: active ? theme.colors.primary : 'transparent',
                      color: active ? '#ffffff' : theme.colors.textSecondary
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = theme.colors.secondary;
                        e.currentTarget.style.color = theme.colors.text;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                    }}
                    onClick={() => {
                      // Close mobile menu when link is clicked
                      if (window.innerWidth < 1024) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Back to Store */}
        <div
          className="p-3 sm:p-4 border-t flex-shrink-0"
          style={{ borderColor: theme.colors.border }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 w-full touch-manipulation min-h-[44px]"
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.primary;
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.secondary;
              e.currentTarget.style.color = theme.colors.text;
            }}
            onClick={() => {
              // Close mobile menu when link is clicked
              if (window.innerWidth < 1024) {
                setIsMobileMenuOpen(false);
              }
            }}
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{t.goToStore}</span>
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}
