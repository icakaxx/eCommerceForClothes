'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { translations } from '@/lib/translations';
import { 
  FaDiscord, 
  FaFacebook, 
  FaPinterest, 
  FaYoutube, 
  FaInstagram,
  FaXTwitter,
  FaTiktok
} from 'react-icons/fa6';

export default function Footer() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { settings } = useStoreSettings();
  const pathname = usePathname();
  const t = translations[language];

  const navItems = [
    { id: 'home', label: t.home, path: '/' },
    { id: 'products', label: t.products, path: '/products' },
    { id: 'about', label: t.about, path: '/about' }
  ];

  // Social media links - only show if URL is set
  const socialLinks = [
    { 
      id: 'discord', 
      url: settings?.discordurl, 
      icon: FaDiscord,
      label: 'Discord'
    },
    { 
      id: 'facebook', 
      url: settings?.facebookurl, 
      icon: FaFacebook,
      label: 'Facebook'
    },
    { 
      id: 'pinterest', 
      url: settings?.pinteresturl, 
      icon: FaPinterest,
      label: 'Pinterest'
    },
    { 
      id: 'youtube', 
      url: settings?.youtubeurl, 
      icon: FaYoutube,
      label: 'YouTube'
    },
    { 
      id: 'instagram', 
      url: settings?.instagramurl, 
      icon: FaInstagram,
      label: 'Instagram'
    },
    { 
      id: 'x', 
      url: settings?.xurl, 
      icon: FaXTwitter,
      label: 'X (Twitter)'
    },
    { 
      id: 'tiktok', 
      url: settings?.tiktokurl, 
      icon: FaTiktok,
      label: 'TikTok'
    }
  ].filter(link => link.url); // Only include links that have URLs

  return (
    <footer 
      className="border-t mt-8 sm:mt-16 transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.footerBg,
        borderColor: theme.colors.border
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
          {navItems.map(item => (
            <Link
              key={item.id}
              href={item.path}
              className="text-xs sm:text-sm font-medium transition-colors duration-300 hover:opacity-70"
              style={{
                color: pathname === item.path
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Social Media Links */}
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            {socialLinks.map(link => {
              const Icon = link.icon;
              return (
                <a
                  key={link.id}
                  href={link.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all duration-300 hover:scale-110"
                  style={{ color: theme.colors.textSecondary }}
                  aria-label={link.label}
                >
                  <Icon size={24} />
                </a>
              );
            })}
          </div>
        )}

        {/* Store Info */}
        <div 
          className="text-center text-xs sm:text-sm transition-colors duration-300"
          style={{ color: theme.colors.textSecondary }}
        >
          <div
            className="font-medium mb-1 transition-colors duration-300"
            style={{ color: theme.colors.text }}
          >
            {settings?.storename || 'Store'}
          </div>
          
          {/* Contact Information */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-2">
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="hover:opacity-70 transition-opacity"
              >
                {settings.email}
              </a>
            )}
            {settings?.telephonenumber && (
              <a
                href={`tel:${settings.telephonenumber}`}
                className="hover:opacity-70 transition-opacity"
              >
                {settings.telephonenumber}
              </a>
            )}
          </div>

          {/* Copyright with Year */}
          <div className="break-words">
            {settings?.yearofcreation 
              ? `© ${settings.yearofcreation}${new Date().getFullYear() !== settings.yearofcreation ? `-${new Date().getFullYear()}` : ''} ${settings?.storename || 'Store'}. ${t.copyright || 'All rights reserved'}.`
              : `© ${new Date().getFullYear()} ${settings?.storename || 'Store'}. ${t.copyright || 'All rights reserved'}.`
            }
          </div>
        </div>
      </div>
    </footer>
  );
}

