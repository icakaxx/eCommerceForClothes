import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nike Tech',
  robots: { index: false, follow: false },
};

export default function NikeTechOutboundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
