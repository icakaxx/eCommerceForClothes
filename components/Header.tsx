'use client';

import { useState } from 'react';
import { Menu, X, Settings, LogOut, ShoppingCart, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

export default function Header({ isAdmin, setIsAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { productTypes } = useProductTypes();
  const t = translations[language];

  // Create nav items - For Him, For Her, Accessories
  const navItems = [
    { id: 'for-him', label: language === 'bg' ? 'За него' : 'For Him', path: '/for-him' },
    { id: 'for-her', label: language === 'bg' ? 'За нея' : 'For Her', path: '/for-her' },
    { id: 'accessories', label: language === 'bg' ? 'Аксесоари' : 'Accessories', path: '/accessories' }
  ];

  const getCurrentPage = () => {
    if (pathname === '/for-him') return 'for-him';
    if (pathname === '/for-her') return 'for-her';
    if (pathname === '/accessories') return 'accessories';
    return '';
  };

  const currentPage = getCurrentPage();

  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <header
        className="shadow-sm sticky top-0 z-50 transition-colors duration-300"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderBottom: `1px solid ${theme.colors.border}`
        }}
      >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center h-16 relative">
          {/* Navigation tabs on the left */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 flex-1">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsAdmin(false)}
                className="text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  color: currentPage === item.id && !isAdmin 
                    ? theme.colors.primary 
                    : theme.colors.textSecondary
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== item.id || isAdmin) {
                    e.currentTarget.style.color = theme.colors.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== item.id || isAdmin) {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                  }
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Logo in the center */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer absolute left-1/2 transform -translate-x-1/2"
            onClick={() => setIsAdmin(false)}
          >
            {settings?.logourl ? (
              <Image
                src={settings.logourl}
                alt={`${settings.storename} Logo`}
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            ) : (
              <Image
                src="/image.png"
                alt={`${settings?.storename || 'Store'} Logo`}
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            )}
            <span
              className="text-lg sm:text-xl font-semibold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              {settings?.storename || 'Store'}
            </span>
          </Link>
          
          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            {!isAdmin && (
              <>
                <button
                  onClick={openCart}
                  className="relative p-2 transition-colors duration-300"
                  style={{ color: theme.colors.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart size={20} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </button>
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/user/dashboard"
                      className="p-2 transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                      onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                      aria-label="User Dashboard"
                    >
                      <UserIcon size={20} />
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        router.push('/');
                      }}
                      className="p-2 transition-colors duration-300"
                      style={{ color: theme.colors.textSecondary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                      onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                      aria-label="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/user"
                    className="p-2 transition-colors duration-300"
                    style={{ color: theme.colors.textSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
                    aria-label="Login"
                  >
                    <UserIcon size={20} />
                  </Link>
                )}
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    router.push('/admin');
                  }}
                  className="p-2 rounded-lg transition-all duration-300"
                  style={{
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.text;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  aria-label={t.backToAdmin}
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('isAdmin', 'false');
                    setIsAdmin(false);
                    router.push('/');
                  }}
                  className="p-2 rounded-lg transition-all duration-300"
                  style={{
                    color: theme.colors.textSecondary,
                    border: `1px solid ${theme.colors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.text;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.textSecondary;
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                  aria-label={t.exitAdmin}
                >
                  <LogOut size={18} />
                </button>
              </>
            )}
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col items-center justify-center p-2 transition-colors duration-300"
              aria-label="Menu"
              style={{ color: theme.colors.textSecondary }}
            >
              <Menu size={24} />
              <span className="text-[10px] font-medium mt-0.5">МЕНЮ</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Backdrop Overlay */}
    {mobileMenuOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => setMobileMenuOpen(false)}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />
    )}

    {/* Mobile Menu - Sliding from Right */}
    {mobileMenuOpen && (
      <div
        className="fixed top-0 right-0 h-full w-[280px] sm:w-[320px] z-50 md:hidden shadow-2xl"
        style={{ backgroundColor: theme.colors.surface }}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between p-6 border-b"
             style={{ borderColor: theme.colors.border }}>
          <h2 className="font-semibold text-lg"
              style={{ color: theme.colors.text }}>
            МЕНЮ
          </h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg transition-colors duration-300 hover:opacity-70"
            style={{ color: theme.colors.textSecondary }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => {
                  setIsAdmin(false);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                style={{
                  color: currentPage === item.id && !isAdmin
                    ? theme.colors.primary
                    : theme.colors.text,
                  borderColor: theme.colors.border
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* User menu in mobile */}
            {!isAdmin && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href="/user/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                      style={{
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }}
                    >
                      <UserIcon size={20} />
                      {language === 'bg' ? 'Профил' : 'Profile'}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                        router.push('/');
                      }}
                      className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                      style={{
                        color: theme.colors.text,
                        borderColor: theme.colors.border
                      }}
                    >
                      <LogOut size={20} />
                      {language === 'bg' ? 'Изход' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/user"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                    style={{
                      color: theme.colors.text,
                      borderColor: theme.colors.border
                    }}
                  >
                    <UserIcon size={20} />
                    {language === 'bg' ? 'Вход' : 'Login'}
                  </Link>
                )}
              </>
            )}

            {/* Admin Buttons (only shown when in admin mode) */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    router.push('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                  style={{
                    color: theme.colors.textSecondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <Settings size={18} />
                  </div>
                  {t.backToAdmin}
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('isAdmin', 'false');
                    setIsAdmin(false);
                    router.push('/');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
                  style={{
                    color: theme.colors.textSecondary,
                    borderColor: theme.colors.border
                  }}
                >
                  <div 
                    className="p-2 rounded-lg"
                    style={{
                      border: `1px solid ${theme.colors.border}`
                    }}
                  >
                    <LogOut size={18} />
                  </div>
                  {t.exitAdmin}
                </button>
              </>
            )}
          </div>

          {/* Bottom CTA Button */}
          <div className="p-6 border-t"
               style={{ borderColor: theme.colors.border }}>
            <Link
              href="/for-him"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-3 px-6 rounded-lg font-medium transition-all duration-300"
              style={{
                backgroundColor: theme.colors.primary,
                color: '#ffffff'
              }}
            >
              {t.goToStore}
            </Link>
          </div>
        </nav>
      </div>
    )}
    </>
  );
}

