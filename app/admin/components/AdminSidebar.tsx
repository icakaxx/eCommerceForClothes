'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Settings, 
  Users, 
  BarChart3, 
  DollarSign, 
  Percent, 
  Image as ImageIcon,
  Eye,
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';

interface AdminSidebarProps {
  currentPath: string;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ currentPath, collapsed: externalCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = translations[language || 'en'];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Internal collapsed state (used if not controlled externally)
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  
  // Use external collapsed state if provided, otherwise use internal
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:52',message:'isCollapsed value computed',data:{isCollapsed,externalCollapsed,internalCollapsed,externalDefined:externalCollapsed!==undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [isCollapsed, externalCollapsed, internalCollapsed]);
  // #endregion
  
  // Tooltip state
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  // Handle toggle
  const handleToggle = () => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:82',message:'handleToggle called',data:{currentIsCollapsed:isCollapsed,externalCollapsed,hasOnToggle:!!onToggle},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const newCollapsed = !isCollapsed;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:85',message:'newCollapsed calculated',data:{newCollapsed,currentIsCollapsed:isCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (onToggle) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:87',message:'calling onToggle callback',data:{newCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      onToggle(newCollapsed);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:91',message:'using internal state',data:{newCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setInternalCollapsed(newCollapsed);
    }
  };

  // Tooltip positioning
  useEffect(() => {
    if (hoveredItem && tooltipRef.current && isCollapsed) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      // Position tooltip to the right of sidebar
      tooltip.style.left = `${rect.width + 8}px`;
    }
  }, [hoveredItem, isCollapsed]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:99',message:'sidebar className computed',data:{isCollapsed,className:`${isCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64'}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  }, [isCollapsed]);
  // #endregion

  const menuItems = [
    {
      id: 'dashboard',
      label: t.dashboard || 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard
    },
    {
      id: 'properties',
      label: language === 'bg' ? 'Свойства' : 'Properties',
      path: '/admin/properties',
      icon: Settings
    },
    {
      id: 'product-types',
      label: language === 'bg' ? 'Типове продукти' : 'Product Types',
      path: '/admin/product-types',
      icon: Tag
    },
    {
      id: 'products',
      label: t.products || 'Products',
      path: '/admin/products',
      icon: Package
    },
    {
      id: 'sales',
      label: language === 'bg' ? 'Продажби' : 'Sales',
      path: '/admin/sales',
      icon: BarChart3
    },
    {
      id: 'customers',
      label: t.customers || 'Customers',
      path: '/admin/customers',
      icon: Users
    },
    {
      id: 'analytics',
      label: language === 'bg' ? 'Доклади' : 'Analytics',
      path: '/admin/analytics',
      icon: TrendingUp
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
          h-screen
          transform transition-all duration-300 ease-in-out
          lg:transform-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-16 lg:w-16' : 'w-64 lg:w-64'}
          flex-shrink-0 border-r
        `}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }}
        data-collapsed={isCollapsed}
      >
        <div className="h-full flex flex-col max-h-screen">
          {/* Header */}
          <div
            className={`p-3 sm:p-4 border-b flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            style={{ borderColor: theme.colors.border }}
          >
            {!isCollapsed && (
              <h2
                className="text-base sm:text-lg font-bold"
                style={{ color: theme.colors.text }}
              >
                {language === 'bg' ? 'Админ панел' : 'Admin Panel'}
              </h2>
            )}
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
                <li key={item.id} className="relative">
                  <Link
                    href={item.path}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 sm:gap-3'} px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 touch-manipulation min-h-[44px] ${
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
                      if (isCollapsed) {
                        setHoveredItem(item.id);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = theme.colors.textSecondary;
                      }
                      if (isCollapsed) {
                        setHoveredItem(null);
                      }
                    }}
                    onClick={() => {
                      // Close mobile menu when link is clicked
                      if (window.innerWidth < 1024) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-xs sm:text-sm truncate">{item.label}</span>
                    )}
                    {isCollapsed && (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </Link>
                  {/* Custom tooltip for collapsed state */}
                  {isCollapsed && hoveredItem === item.id && (
                    <div
                      ref={tooltipRef}
                      className="absolute left-full ml-2 px-3 py-2 rounded-lg shadow-lg z-50 pointer-events-none whitespace-nowrap"
                      style={{
                        backgroundColor: theme.colors.cardBg || theme.colors.surface,
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      {item.label}
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent"
                        style={{
                          borderRightColor: theme.colors.cardBg || theme.colors.surface
                        }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className="p-3 sm:p-4 border-t flex-shrink-0 space-y-2"
          style={{ borderColor: theme.colors.border }}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminSidebar.tsx:346',message:'toggle button clicked',data:{isCollapsed,hasOnToggle:!!onToggle},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              handleToggle();
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 sm:gap-3'} px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 w-full touch-manipulation min-h-[44px]`}
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
            title={isCollapsed ? (language === 'bg' ? 'Разгъни страничната лента' : 'Expand sidebar') : (language === 'bg' ? 'Свий страничната лента' : 'Collapse sidebar')}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {language === 'bg' ? 'Свий страничната лента' : 'Collapse sidebar'}
                </span>
              </>
            )}
            {isCollapsed && (
              <span className="sr-only">
                {language === 'bg' ? 'Разгъни страничната лента' : 'Expand sidebar'}
              </span>
            )}
          </button>

          {/* Back to Store */}
          <Link
            href="/"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 sm:gap-3'} px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg transition-colors duration-200 w-full touch-manipulation min-h-[44px]`}
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
            title={isCollapsed ? t.goToStore : undefined}
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-xs sm:text-sm font-medium truncate">{t.goToStore}</span>
            )}
            {isCollapsed && (
              <span className="sr-only">{t.goToStore}</span>
            )}
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}
