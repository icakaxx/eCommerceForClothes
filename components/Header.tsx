'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { translations } from '@/lib/translations';
import { useTheme } from '@/context/ThemeContext';
import LanguageToggle from './LanguageToggle';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
}

export default function Header({ isAdmin, setIsAdmin }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.home, path: '/' },
    { id: 'clothes', label: t.clothes, path: '/clothes' },
    { id: 'shoes', label: t.shoes, path: '/shoes' },
    { id: 'accessories', label: t.accessories, path: '/accessories' }
  ];

  const currentPage = pathname === '/' ? 'home' : pathname.slice(1);

  const { theme } = useTheme();

  return (
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
            <LanguageToggle />
            <ThemeSwitcher />
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
              className="md:hidden p-2 transition-colors duration-300"
              aria-label="Menu"
              style={{ color: theme.colors.textSecondary }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div 
            className="md:hidden py-4 border-t transition-colors duration-300"
            style={{ borderColor: theme.colors.border }}
          >
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => {
                  setIsAdmin(false);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm transition-colors duration-300"
                style={{
                  color: currentPage === item.id && !isAdmin
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                  fontWeight: currentPage === item.id && !isAdmin ? '500' : '400'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

