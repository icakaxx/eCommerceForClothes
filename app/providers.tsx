'use client';

import { ProductProvider } from '@/context/ProductContext';
import { ProductTypeProvider } from '@/context/ProductTypeContext';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProductTypeProvider>
          <PropertiesProvider>
            <ProductProvider>{children}</ProductProvider>
          </PropertiesProvider>
        </ProductTypeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

