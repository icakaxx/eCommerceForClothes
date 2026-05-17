import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://modabox.eu';
const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

async function fetchProduct(id: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('products')
      .select('id, name, description, brand, images')
      .eq('id', id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    return {
      title: 'Продукт не е намерен',
      robots: { index: false, follow: false },
    };
  }

  const name: string = product.name || 'Продукт';
  const brand: string = product.brand || '';
  const description: string =
    product.description ||
    `${brand ? `${brand} – ` : ''}${name} | Луксозна мода от ModaBox.eu`;

  const rawImages: unknown = product.images;
  const firstImage: string | null =
    Array.isArray(rawImages) && rawImages.length > 0
      ? (rawImages[0] as string)
      : null;
  const ogImage = firstImage || OG_IMAGE;

  const title = brand ? `${brand} ${name}` : name;
  const canonical = `${SITE_URL}/products/${id}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    image: ogImage,
    url: canonical,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: canonical,
      seller: { '@type': 'Organization', name: 'ModaBox' },
    },
  };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'bg_BG',
      url: canonical,
      title,
      description,
      siteName: 'ModaBox',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    other: {
      'script:ld+json': JSON.stringify(productJsonLd),
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
