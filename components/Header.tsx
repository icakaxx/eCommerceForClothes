'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { useTheme } from '@/context/ThemeContext';
import { useProductTypes } from '@/context/ProductTypeContext';

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

  // Create nav items with only Home
  const navItems = [
    { id: 'home', label: t.home, path: '/' }
  ];

  const getCurrentPage = () => {
    return pathname === '/' ? 'home' : '';
  };

  const currentPage = getCurrentPage();

  const { theme } = useTheme();

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
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/"
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => setIsAdmin(false)}
          >
            <Image
              src="/image.png"
              alt="ModaBox Logo"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto object-contain"
              priority
            />
            <span 
              className="text-lg sm:text-xl font-semibold transition-colors duration-300"
              style={{ color: theme.colors.text }}
            >
              ModaBox
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
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
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                if (!isAdmin) {
                  router.push('/admin');
                } else {
                  localStorage.setItem('isAdmin', 'false');
                  setIsAdmin(false);
                  router.push('/');
                }
              }}
              className="text-xs sm:text-sm whitespace-nowrap transition-colors duration-300"
              style={{ 
                color: theme.colors.textSecondary
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.textSecondary}
            >
              {isAdmin ? t.exitAdmin : t.admin}
            </button>
            
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

            {/* Admin/Exit Admin Button */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  router.push('/admin');
                } else {
                  localStorage.setItem('isAdmin', 'false');
                  setIsAdmin(false);
                  router.push('/');
                }
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-6 py-4 font-medium border-b transition-colors duration-300 hover:opacity-70"
              style={{
                color: theme.colors.textSecondary,
                borderColor: theme.colors.border
              }}
            >
              {isAdmin ? t.exitAdmin : t.admin}
            </button>
          </div>

          {/* Bottom CTA Button */}
          <div className="p-6 border-t"
               style={{ borderColor: theme.colors.border }}>
            <Link
              href="/"
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

