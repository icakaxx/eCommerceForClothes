import type { Metadata } from 'next';

const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

export const metadata: Metadata = {
  title: 'Всички продукти – дрехи, обувки и аксесоари',
  description:
    'Разгледайте пълната колекция на ModaBox – изключителни дрехи, обувки и аксесоари за жени и мъже на топ цени.',
  alternates: { canonical: 'https://modabox.eu/products' },
  openGraph: {
    title: 'Всички продукти | ModaBox',
    description:
      'Пълната колекция от дрехи, обувки и аксесоари в ModaBox.',
    images: [{ url: OG_IMAGE, alt: 'ModaBox – колекция' }],
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
