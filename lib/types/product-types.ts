// TypeScript interfaces for the new product type system
// All field names match the lowercase database column names

export interface ProductType {
  producttypeid: string;
  name: string;
  code: string;
  createdat: string;
  updatedat: string;
}

export interface Property {
  propertyid: string;
  name: string;
  description?: string;
  datatype: 'text' | 'select' | 'number';
  createdat: string;
  updatedat: string;
  // Extended data
  values?: PropertyValue[];
}

export interface PropertyValue {
  propertyvalueid: string;
  propertyid: string;
  value: string;
  displayorder: number;
  isactive: boolean;
  createdat: string;
  updatedat: string;
}

export interface ProductTypeProperty {
  producttypepropertyid: string;
  producttypeid: string;
  propertyid: string;
  createdat: string;
}

export interface Product {
  productid: string;
  name: string;
  sku?: string;
  description?: string;
  producttypeid: string;
  createdat: string;
  updatedat: string;
}

export interface ProductPropertyValue {
  productpropertyvalueid: string;
  productid: string;
  propertyid: string;
  value: string;
  createdat: string;
  updatedat: string;
}

// New Variant System Interfaces
export interface ProductVariant {
  productvariantid: string;
  productid: string;
  sku?: string;
  price?: number;
  compareatprice?: number;
  cost?: number;
  quantity: number;
  weight?: number;
  weightunit: string;
  barcode?: string;
  trackquantity: boolean;
  continuesellingwhenoutofstock: boolean;
  isvisible: boolean;
  createdat: string;
  updatedat: string;
  // Joined data
  propertyvalues?: ProductVariantPropertyValue[];
}

export interface ProductVariantPropertyValue {
  productvariantpropertyvalueid: string;
  productvariantid: string;
  propertyid: string;
  value: string;
  createdat: string;
  // Joined data
  property?: Property;
}

export interface ProductImage {
  productimageid: string;
  productid: string;
  productvariantid?: string;
  imageurl: string;
  alttext?: string;
  sortorder: number;
  isprimary: boolean;
  createdat: string;
}

// Extended interfaces for API responses with joins
export interface ProductTypeWithProperties extends ProductType {
  Properties?: Property[];
}

export interface ProductWithDetails extends Product {
  producttype?: ProductType;
  propertyvalues?: Array<ProductPropertyValue & { property?: Property }>;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductVariantWithDetails extends ProductVariant {
  propertyvalues?: Array<ProductVariantPropertyValue & { property?: Property }>;
  images?: ProductImage[];
}

export interface PropertyWithProductTypes extends Property {
  ProductTypes?: ProductType[];
}

