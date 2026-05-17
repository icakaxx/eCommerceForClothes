import type { Metadata } from 'next';

const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

export const metadata: Metadata = {
  title: 'Дамска мода – дрехи, обувки и аксесоари за жени',
  description:
    'Открийте дамската колекция на ModaBox – луксозни дрехи, обувки и аксесоари за жени. Бърза доставка в България.',
  keywords: ['дамска мода', 'дрехи за жени', 'обувки за жени', 'дамски аксесоари', 'луксозна дамска мода'],
  alternates: { canonical: 'https://modabox.eu/for-her' },
  openGraph: {
    title: 'Дамска мода | ModaBox',
    description:
      'Луксозни дрехи, обувки и аксесоари за жени от ModaBox.',
    images: [{ url: OG_IMAGE, alt: 'ModaBox – дамска мода' }],
  },
};

export default function ForHerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
