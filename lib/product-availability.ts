import { Product } from '@/lib/data';

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
  if (product.quantity <= 0 && product.variants && product.variants.length > 0) {
    return false;
  }
  return true;
}
