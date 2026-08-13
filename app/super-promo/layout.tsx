import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SUPER PROMO',
  description:
    'Специални SUPER PROMO оферти на ModaBox – избрани продукти и размери с ексклузивни цени.',
  alternates: { canonical: 'https://modabox.eu/super-promo' },
};

export default function SuperPromoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
