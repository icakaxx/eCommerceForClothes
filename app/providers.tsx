'use client';

import { ProductProvider } from '@/context/ProductContext';
import { ProductTypeProvider } from '@/context/ProductTypeContext';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreSettingsProvider, useStoreSettings } from '@/context/StoreSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { CookieConsentProvider } from '@/context/CookieConsentContext';
import { AuthProvider } from '@/context/AuthContext';
import SiteWelcomeBanners from '@/components/SiteWelcomeBanners';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import HtmlLangSync from '@/components/HtmlLangSync';
import VercelAnalyticsFlags from '@/components/VercelAnalyticsFlags';
import VercelAnalytics from '@/components/VercelAnalytics';
import MaintenanceMode from '@/components/MaintenanceMode';

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { error: storeSettingsError, isLoading: storeSettingsLoading } = useStoreSettings();

  // Show maintenance mode if StoreSettings fails to load (critical for the site)
  if (!storeSettingsLoading && storeSettingsError) {
    return <MaintenanceMode />;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CookieConsentProvider>
            <CartProvider>
              <ProductTypeProvider>
                <PropertiesProvider>
                  <ProductProvider>
                    <HtmlLangSync />
                    <VercelAnalyticsFlags />
                    {children}
                    <SiteWelcomeBanners />
                    <AnalyticsTracker />
                    <VercelAnalytics />
                  </ProductProvider>
                </PropertiesProvider>
              </ProductTypeProvider>
            </CartProvider>
          </CookieConsentProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
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