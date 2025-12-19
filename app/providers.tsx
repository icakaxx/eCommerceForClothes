'use client';

import { ProductProvider } from '@/context/ProductContext';
import { ProductTypeProvider } from '@/context/ProductTypeContext';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreSettingsProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CookieConsentProvider>
            <CartProvider>
              <ProductTypeProvider>
                <PropertiesProvider>
                  <ProductProvider>
                    {children}
                    <CookieConsentBanner />
                    <AnalyticsTracker />
                  </ProductProvider>
                </PropertiesProvider>
              </ProductTypeProvider>
            </CartProvider>
          </CookieConsentProvider>
        </LanguageProvider>
      </ThemeProvider>
    </StoreSettingsProvider>
  );
}

