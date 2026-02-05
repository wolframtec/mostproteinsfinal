import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { SiteOverlays } from './site-overlays';

const siteUrl = 'https://mostproteins.com';

export const runtime = 'edge';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Most Proteins | Research Peptides & Compounds',
    template: '%s | Most Proteins',
  },
  description:
    'Most Proteins provides research peptides and compounds with clear documentation and reliable handling. For research use only.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Most Proteins | Research Peptides & Compounds',
    description:
      'Most Proteins provides research peptides and compounds with clear documentation and reliable handling. For research use only.',
    type: 'website',
    url: siteUrl,
    siteName: 'Most Proteins',
    images: [
      {
        url: '/images/bpc157-product.jpg',
        width: 1200,
        height: 630,
        alt: 'Most Proteins research peptides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Most Proteins | Research Peptides & Compounds',
    description:
      'Most Proteins provides research peptides and compounds with clear documentation and reliable handling. For research use only.',
    images: ['/images/bpc157-product.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Most Proteins',
    url: siteUrl,
    logo: `${siteUrl}/images/bpc157-product.jpg`,
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Most Proteins',
    url: siteUrl,
  };

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0B0C10" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          {children}
          <SiteOverlays />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
