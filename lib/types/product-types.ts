// TypeScript interfaces for the new product type system
// All field names match the PascalCase database column names

export interface ProductType {
  ProductTypeID: string;
  Name: string;
  Code: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Property {
  PropertyID: string;
  Name: string;
  Description?: string;
  DataType: 'text' | 'select' | 'number';
  CreatedAt: string;
  UpdatedAt: string;
  // Extended data
  Values?: PropertyValue[];
}

export interface PropertyValue {
  PropertyValueID: string;
  PropertyID: string;
  Value: string;
  DisplayOrder: number;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ProductTypeProperty {
  ProductTypePropertyID: string;
  ProductTypeID: string;
  PropertyID: string;
  CreatedAt: string;
}

export interface Product {
  ProductID: string;
  Name: string;
  SKU?: string;
  Description?: string;
  ProductTypeID: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ProductPropertyValue {
  ProductPropertyValueID: string;
  ProductID: string;
  PropertyID: string;
  Value: string;
  CreatedAt: string;
  UpdatedAt: string;
}

// New Variant System Interfaces
export interface ProductVariant {
  ProductVariantID: string;
  ProductID: string;
  SKU?: string;
  Price?: number;
  CompareAtPrice?: number;
  Cost?: number;
  Quantity: number;
  Weight?: number;
  WeightUnit: string;
  Barcode?: string;
  TrackQuantity: boolean;
  ContinueSellingWhenOutOfStock: boolean;
  IsVisible: boolean;
  CreatedAt: string;
  UpdatedAt: string;
  // Joined data
  PropertyValues?: ProductVariantPropertyValue[];
}

export interface ProductVariantPropertyValue {
  ProductVariantPropertyValueID: string;
  ProductVariantID: string;
  PropertyID: string;
  Value: string;
  CreatedAt: string;
  // Joined data
  Property?: Property;
}

export interface ProductImage {
  ProductImageID: string;
  ProductID: string;
  ProductVariantID?: string;
  ImageURL: string;
  AltText?: string;
  SortOrder: number;
  IsPrimary: boolean;
  CreatedAt: string;
}

// Extended interfaces for API responses with joins
export interface ProductTypeWithProperties extends ProductType {
  Properties?: Property[];
}

export interface ProductWithDetails extends Product {
  ProductType?: ProductType;
  PropertyValues?: Array<ProductPropertyValue & { Property?: Property }>;
  Variants?: ProductVariant[];
  Images?: ProductImage[];
}

export interface ProductVariantWithDetails extends ProductVariant {
  PropertyValues?: Array<ProductVariantPropertyValue & { Property?: Property }>;
  Images?: ProductImage[];
}

export interface PropertyWithProductTypes extends Property {
  ProductTypes?: ProductType[];
}

