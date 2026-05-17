import type { Metadata } from 'next';

const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

export const metadata: Metadata = {
  title: 'Мъжка мода – дрехи, обувки и аксесоари за мъже',
  description:
    'Открийте мъжката колекция на ModaBox – луксозни дрехи, обувки и аксесоари за мъже. Бърза доставка в България.',
  keywords: ['мъжка мода', 'дрехи за мъже', 'обувки за мъже', 'мъжки аксесоари', 'луксозна мъжка мода'],
  alternates: { canonical: 'https://modabox.eu/for-him' },
  openGraph: {
    title: 'Мъжка мода | ModaBox',
    description:
      'Луксозни дрехи, обувки и аксесоари за мъже от ModaBox.',
    images: [{ url: OG_IMAGE, alt: 'ModaBox – мъжка мода' }],
  },
};

export default function ForHimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
