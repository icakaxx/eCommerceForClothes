import type { Metadata } from 'next'
import { DM_Serif_Display, Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const serifDisplay = DM_Serif_Display({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
})

const SITE_URL = 'https://modabox.eu';
const OG_IMAGE = 'https://static-b2c.loropiana.com/cms/resource/image/440282/portrait_ratio3x4/768/1024/fb215413f1cad8636d48b2f0c1eaa1ce/62B14DD519AB6DBA760C9CE121E9F924/lp-assouline-book-1080x1350-14-.jpg';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ModaBox – Луксозна мода онлайн | Дрехи, обувки, аксесоари',
    template: '%s | ModaBox',
  },
  description:
    'ModaBox.eu – онлайн магазин за луксозна мода. Открийте изключителни дрехи, обувки и аксесоари за жени и мъже. Бърза доставка в България и Европа.',
  keywords: [
    'мода', 'дрехи', 'обувки', 'аксесоари', 'луксозна мода', 'онлайн магазин',
    'мъжка мода', 'дамска мода', 'modabox', 'fashion', 'clothes', 'shoes',
    'accessories', 'luxury fashion', 'Bulgaria', 'online shop',
  ],
  authors: [{ name: 'ModaBox', url: SITE_URL }],
  creator: 'ModaBox',
  publisher: 'ModaBox',
  category: 'fashion',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'bg_BG',
    alternateLocale: 'en_US',
    url: SITE_URL,
    siteName: 'ModaBox',
    title: 'ModaBox – Луксозна мода онлайн | Дрехи, обувки, аксесоари',
    description:
      'Открийте изключителни дрехи, обувки и аксесоари за жени и мъже. Бърза доставка в България и Европа.',
    images: [
      {
        url: OG_IMAGE,
        width: 768,
        height: 1024,
        alt: 'ModaBox – луксозна мода',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@modabox_eu',
    title: 'ModaBox – Луксозна мода онлайн',
    description:
      'Дрехи, обувки и аксесоари за жени и мъже. Бърза доставка в България.',
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'bg': SITE_URL,
      'en': `${SITE_URL}/en`,
    },
  },
  verification: {
    google: 'modabox-google-site-verification',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: 'ModaBox',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: OG_IMAGE,
  description:
    'Онлайн магазин за луксозна мода – дрехи, обувки и аксесоари за жени и мъже.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BG',
  },
  sameAs: ['https://www.tiktok.com/@.modabox.bg'],
  priceRange: '€€',
  currenciesAccepted: 'EUR, BGN',
  paymentAccepted: 'Cash, Credit Card',
  openingHours: 'Mo-Su 00:00-24:00',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLdScript = JSON.stringify(jsonLd)

  return (
    <html lang="bg" suppressHydrationWarning>
      <body className={`${serifDisplay.variable} ${inter.variable} antialiased`}>
        {/* In body to avoid head injection from browser extensions; valid for schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
          suppressHydrationWarning
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

