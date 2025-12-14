'use client';

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
  Image as ImageIcon 
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
      id: 'sales',
      label: language === 'bg' ? 'Продажби' : 'Sales',
      path: '/admin/sales',
      icon: ShoppingCart
    },
    {
      id: 'analytics',
      label: language === 'bg' ? 'Аналитика' : 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3
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
    <aside
      className="w-full lg:w-64 flex-shrink-0 border-r transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{ borderColor: theme.colors.border }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: theme.colors.text }}
          >
            {language === 'bg' ? 'Админ панел' : 'Admin Panel'}
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${
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
                  >
                    <Icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
