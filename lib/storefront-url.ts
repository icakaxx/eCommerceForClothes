const DEFAULT_STOREFRONT_URL = 'https://modabox.eu';

/** Public storefront origin for customer-facing links (never admin). */
export function getStorefrontBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    DEFAULT_STOREFRONT_URL;

  return raw
    .trim()
    .replace(/\/$/, '')
    .replace(/\/admin$/, '');
}

export function getProductStorefrontUrl(
  productId?: string | null,
  variantId?: string | null
): string {
  const cleanProductId = productId?.trim() || '';
  if (!cleanProductId) return '';
  if (variantId && cleanProductId === variantId) return '';

  return `${getStorefrontBaseUrl()}/products/${cleanProductId}`;
}
