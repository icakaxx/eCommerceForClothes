import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'За нас – ModaBox',
  description:
    'Научете повече за ModaBox – вашият онлайн магазин за луксозна мода. Мисия, ценности и нашата история.',
  alternates: { canonical: 'https://modabox.eu/about' },
  openGraph: {
    title: 'За нас | ModaBox',
    description:
      'Научете повече за ModaBox – луксозна мода за жени и мъже.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
