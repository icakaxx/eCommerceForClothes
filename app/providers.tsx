'use client';

import { ProductProvider } from '@/context/ProductContext';
import { ProductTypeProvider } from '@/context/ProductTypeContext';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import { CartProvider } from '@/context/CartContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreSettingsProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CartProvider>
            <ProductTypeProvider>
              <PropertiesProvider>
                <ProductProvider>{children}</ProductProvider>
              </PropertiesProvider>
            </ProductTypeProvider>
          </CartProvider>
        </LanguageProvider>
      </ThemeProvider>
    </StoreSettingsProvider>
  );
}

