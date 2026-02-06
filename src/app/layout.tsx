import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { SiteOverlays } from './site-overlays';

const siteUrl = 'https://mostproteins.com';
const siteName = 'Most Proteins';
const defaultDescription = 'Most Proteins provides research short chain proteins and compounds with clear documentation and reliable handling. For research use only.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Research Short Chain Proteins & Compounds`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'research short chain proteins',
    'research compounds',
    'short chain protein research',
    'HPLC purity',
    'COA',
    'laboratory supplies',
    'BPC-157',
    'GHK-Cu',
    'Epithalon',
    'TB-500',
    'CJC-1295',
    'GHRP-2',
  ],
  authors: [{ name: 'Most Proteins' }],
  creator: 'Most Proteins',
  publisher: 'Most Proteins',
  robots: {
    index: true,
    follow: true,
    nocache: false,
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
    languages: {
      'en-US': '/',
    },
  },
  openGraph: {
    title: `${siteName} | Research Short Chain Proteins & Compounds`,
    description: defaultDescription,
    type: 'website',
    url: siteUrl,
    siteName: siteName,
    locale: 'en_US',
    images: [
      {
        url: '/images/bpc157-product.jpg',
        width: 1200,
        height: 630,
        alt: 'Most Proteins - Research-grade short chain proteins with HPLC purity certificates',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Research Peptides & Compounds`,
    description: defaultDescription,
    images: ['/images/bpc157-product.jpg'],
    creator: '@mostproteins',
    site: '@mostproteins',
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Add your Google Search Console verification
  },
  category: 'Science & Research',
  classification: 'Research Chemicals',
  other: {
    'facebook-domain-verification': 'YOUR_FACEBOOK_VERIFICATION', // Add if using Facebook Pixel
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0B0C10' },
    { media: '(prefers-color-scheme: light)', color: '#0B0C10' },
  ],
};

// Organization Schema
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/images/bpc157-product.jpg`,
  description: defaultDescription,
  sameAs: [
    // Add social media URLs when available
    // 'https://twitter.com/mostproteins',
    // 'https://linkedin.com/company/mostproteins',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'service@mostproteins.com',
    contactType: 'Research Support',
    availableLanguage: ['English'],
  },
};

// Website Schema with Search
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  url: siteUrl,
  description: defaultDescription,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

// Local Business Schema
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: siteName,
  description: defaultDescription,
  url: siteUrl,
  image: `${siteUrl}/images/bpc157-product.jpg`,
  priceRange: '$$$',
  currenciesAccepted: 'USD',
  paymentAccepted: 'Credit Card',
  areaServed: 'US',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Research Peptides',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'BPC-157',
          description: 'Research short chain protein for tissue repair studies',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'GHK-Cu',
          description: 'Copper short chain protein for matrix research',
        },
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="theme-color" content="#0B0C10" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="application-name" content={siteName} />
        <meta name="msapplication-TileColor" content="#0B0C10" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Microsoft Bing UET Tag */}
        <script dangerouslySetInnerHTML={{__html: `(function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"97227623", enableAutoSpaTracking: true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");`}} />
      </head>
      <body>
        <Providers>
          {children}
          <SiteOverlays />
        </Providers>
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </body>
    </html>
  );
}
