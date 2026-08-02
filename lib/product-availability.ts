import { Product } from '@/lib/data';
import { productHasAnyVariantInStock } from '@/lib/variant-stock';

/** Admin flag: show product as out of stock / awaiting restock on the shop. */
export function isAwaitingRestock(
  product: { awaitingrestock?: boolean } | null | undefined
): boolean {
  return product?.awaitingrestock === true;
}

/** Whether a product should appear in storefront listings. */
export function isListedOnStorefront(product: Product): boolean {
  if (product.visible === false) return false;
  if (isAwaitingRestock(product)) return true;
  return productHasAnyVariantInStock(product);
}
