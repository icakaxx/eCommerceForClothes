'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property } from '@/lib/types/product-types';

interface PropertiesContextType {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  loadProperties: () => Promise<void>;
  isLoading: boolean;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load properties from Supabase
  const loadProperties = async () => {
    try {
      setIsLoading(true);
      console.log('📦 Loading properties from Supabase...');

      const response = await fetch('/api/properties');
      const result = await response.json();

      if (result.success && result.properties) {
        setProperties(result.properties);
        console.log(`✅ Loaded ${result.properties.length} properties from database`);
      } else {
        console.warn('⚠️ No properties found');
        setProperties([]);
      }
    } catch (error) {
      console.error('❌ Failed to load properties:', error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  return (
    <PropertiesContext.Provider value={{ properties, setProperties, loadProperties, isLoading }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
}
