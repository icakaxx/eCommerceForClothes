'use client';

import { ProductProvider } from '@/context/ProductContext';
import { ProductTypeProvider } from '@/context/ProductTypeContext';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreSettingsProvider, useStoreSettings } from '@/context/StoreSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import MaintenanceMode from '@/components/MaintenanceMode';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { error: storeSettingsError, isLoading: storeSettingsLoading } = useStoreSettings();

  // Show maintenance mode if StoreSettings fails to load (critical for the site)
  if (!storeSettingsLoading && storeSettingsError) {
    return <MaintenanceMode />;
  }

  return (
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
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreSettingsProvider>
      <InnerProviders>
        {children}
      </InnerProviders>
    </StoreSettingsProvider>
  );
}