// Temporary storage for property values until database migration is run
// This uses localStorage to persist property values locally

import { PropertyValue } from './types/product-types';

const STORAGE_KEY = 'ecommerce_property_values';

interface StoredPropertyValues {
  [propertyId: string]: PropertyValue[];
}

export class PropertyValuesStorage {
  private static getStoredData(): StoredPropertyValues {
    if (typeof window === 'undefined') return {};

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading property values from localStorage:', error);
      return {};
    }
  }

  private static setStoredData(data: StoredPropertyValues): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing property values to localStorage:', error);
    }
  }

  static getPropertyValues(propertyId: string): PropertyValue[] {
    const data = this.getStoredData();
    return data[propertyId] || [];
  }

  static setPropertyValues(propertyId: string, values: PropertyValue[]): void {
    const data = this.getStoredData();
    data[propertyId] = values;
    this.setStoredData(data);
  }

  static addPropertyValue(propertyId: string, value: PropertyValue): void {
    const values = this.getPropertyValues(propertyId);
    values.push(value);
    this.setPropertyValues(propertyId, values);
  }

  static updatePropertyValue(propertyId: string, valueId: string, updates: Partial<PropertyValue>): void {
    const values = this.getPropertyValues(propertyId);
    const index = values.findIndex(v => v.propertyvalueid === valueId);

    if (index !== -1) {
      values[index] = { ...values[index], ...updates, updatedat: new Date().toISOString() };
      this.setPropertyValues(propertyId, values);
    }
  }

  static deletePropertyValue(propertyId: string, valueId: string): void {
    const values = this.getPropertyValues(propertyId);
    const filteredValues = values.filter(v => v.propertyvalueid !== valueId);
    this.setPropertyValues(propertyId, filteredValues);
  }

  static getAllPropertyValues(): StoredPropertyValues {
    return this.getStoredData();
  }

  // Utility method to generate temporary IDs
  static generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Method to clear all stored data (useful for cleanup)
  static clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}



