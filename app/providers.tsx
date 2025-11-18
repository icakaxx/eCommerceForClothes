'use client';

import { ProductProvider } from '@/context/ProductContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProductProvider>{children}</ProductProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

