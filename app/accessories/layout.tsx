import type { Metadata } from 'next';

const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

export const metadata: Metadata = {
  title: 'Аксесоари – чанти, колани, шалове и още',
  description:
    'Луксозни аксесоари от ModaBox – чанти, колани, шалове, бижута и още. Перфектното допълнение към всяка визия.',
  keywords: ['аксесоари', 'чанти', 'колани', 'шалове', 'бижута', 'луксозни аксесоари', 'мода'],
  alternates: { canonical: 'https://modabox.eu/accessories' },
  openGraph: {
    title: 'Аксесоари | ModaBox',
    description:
      'Луксозни аксесоари – чанти, шалове, бижута и още от ModaBox.',
    images: [{ url: OG_IMAGE, alt: 'ModaBox – аксесоари' }],
  },
};

export default function AccessoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
