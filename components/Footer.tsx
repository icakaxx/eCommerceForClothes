'use client';

import Link from 'next/link';
import Image from 'next/image';
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

  // Helper function to strip HTML tags and clean text
  const stripHtml = (html: string): string => {
    if (typeof window === 'undefined') {
      // Server-side: use regex to strip HTML tags
      return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    }
    
    // Client-side: use DOM parsing for better accuracy
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    let text = tmp.textContent || tmp.innerText || '';
    
    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with single space
      .trim();
    
    return text;
  };

  // Brand description - use aboutustext if available, otherwise default
  const brandDescription = settings?.aboutustext 
    ? (() => {
        const cleaned = stripHtml(settings.aboutustext);
        return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
      })()
    : language === 'bg' 
      ? 'Вашият надежден партньор за модни дрехи и аксесоари.'
      : 'Your trusted partner for fashionable clothing and accessories.';

  // Social media links - all platforms from store settings
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

  // Categories navigation links
  const secondaryLinks = [
    { 
      id: 'for-him', 
      label: language === 'bg' ? 'За него' : 'For Him', 
      path: '/for-him' 
    },
    { 
      id: 'for-her', 
      label: language === 'bg' ? 'За нея' : 'For Her', 
      path: '/for-her' 
    },
    { 
      id: 'accessories', 
      label: language === 'bg' ? 'Аксесоари' : 'Accessories', 
      path: '/accessories' 
    }
  ];

  // Contact information - address and legal registration are optional placeholders
  // These can be added to store_settings table in the future
  const contactInfo = {
    phone: settings?.telephonenumber,
    email: settings?.email,
    address: null as string | null, // Placeholder for future address field
    legalRegistration: null as string | null // Placeholder for future legal registration field
  };

  // Copyright text
  const copyrightText = settings?.yearofcreation 
    ? `© ${settings.yearofcreation}${new Date().getFullYear() !== settings.yearofcreation ? `-${new Date().getFullYear()}` : ''} ${settings?.storename || 'Store'}. ${t.copyright || 'All rights reserved'}.`
    : `© ${new Date().getFullYear()} ${settings?.storename || 'Store'}. ${t.copyright || 'All rights reserved'}.`;

  return (
    <footer 
      className="mt-8 sm:mt-16 border-t transition-colors duration-300"
      style={{ 
        backgroundColor: theme.colors.footerBg || '#fafafa',
        borderColor: theme.colors.border
      }}
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* 3-Column Grid - Stacked on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="sr-only">Brand</h3>
            {/* Logo */}
            {settings?.logourl ? (
              <Link href="/" className="inline-block mx-auto md:mx-0">
                <Image
                  src={settings.logourl}
                  alt={settings?.storename || 'Store Logo'}
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </Link>
            ) : (
              <Link 
                href="/"
                className="text-xl font-semibold transition-colors duration-300 hover:opacity-80"
                style={{ color: theme.colors.text }}
              >
                {settings?.storename || 'Store'}
              </Link>
            )}
            
            {/* Description */}
            <p 
              className="text-sm leading-relaxed"
              style={{ color: theme.colors.textSecondary }}
            >
              {brandDescription}
            </p>
            
            {/* Social Icons - Outline Style */}
            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 pt-2 flex-wrap">
                {socialLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.id}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-all duration-300 hover:scale-110 hover:opacity-80"
                      style={{ color: theme.colors.textSecondary }}
                      aria-label={link.label}
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Categories */}
          <div className="text-center md:text-left">
            <h3 
              className="text-sm font-semibold mb-4 tracking-wide uppercase"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Категории' : 'Categories'}
            </h3>
            <nav className="flex flex-col items-center md:items-start space-y-3">
              {secondaryLinks.map(item => (
                <Link
                  key={item.id}
                  href={item.path}
                  className="text-sm transition-colors duration-300 hover:opacity-70"
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
          </div>

          {/* Column 3: Contacts */}
          <div className="text-center md:text-left">
            <h3 
              className="text-sm font-semibold mb-4 tracking-wide uppercase"
              style={{ color: theme.colors.text }}
            >
              {language === 'bg' ? 'Свържете се с нас' : 'Contact Us'}
            </h3>
            <div className="flex flex-col items-center md:items-start space-y-3">
              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-sm transition-colors duration-300 hover:opacity-70"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {contactInfo.phone}
                </a>
              )}
              {contactInfo.email && (
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm transition-colors duration-300 hover:opacity-70"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {contactInfo.email}
                </a>
              )}
              {contactInfo.address && (
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {contactInfo.address}
                </p>
              )}
              {contactInfo.legalRegistration && (
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {contactInfo.legalRegistration}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div 
        className="border-t py-6 transition-colors duration-300"
        style={{ borderColor: theme.colors.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright - Left Aligned */}
            <div 
              className="text-xs sm:text-sm text-center sm:text-left"
              style={{ color: theme.colors.textSecondary }}
            >
              {copyrightText}
            </div>
            
            {/* Credit - Right Aligned */}
            <div 
              className="text-xs sm:text-sm text-center sm:text-right"
              style={{ color: theme.colors.textSecondary }}
            >
              {language === 'bg' ? 'Създадено от' : 'Created by'}{' '}
              <a
                href="https://hmwspro.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors duration-300 hover:opacity-70"
                style={{ color: theme.colors.primary }}
              >
                H&M WsPro
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

