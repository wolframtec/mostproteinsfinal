import type { Metadata } from 'next';
import ShopPage from '@/views/ShopPage';

const siteUrl = 'https://mostproteins.com';

export const metadata: Metadata = {
  title: 'Shop | Research Peptides & Compounds',
  description:
    'Browse our collection of high-purity research peptides and compounds. HPLC-tested with certificates of analysis. BPC-157, GHK-Cu, Epithalon, TB-500, and more.',
  keywords: [
    'research peptides shop',
    'buy research peptides',
    'BPC-157 for sale',
    'GHK-Cu peptide',
    'Epithalon research',
    'TB-500 peptide',
    'laboratory compounds',
    'HPLC tested peptides',
  ],
  alternates: { canonical: '/shop/' },
  openGraph: {
    title: 'Shop Research Peptides | Most Proteins',
    description:
      'Browse our collection of high-purity research peptides. HPLC-tested with COA documentation.',
    url: '/shop/',
    type: 'website',
    images: [
      {
        url: '/images/bpc157-product.jpg',
        width: 1200,
        height: 630,
        alt: 'Research peptides shop - Most Proteins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Research Peptides | Most Proteins',
    description: 'Browse our collection of high-purity research peptides.',
    images: ['/images/bpc157-product.jpg'],
  },
};

// Breadcrumb Schema
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Shop',
      item: `${siteUrl}/shop/`,
    },
  ],
};

export default function Shop() {
  return (
    <>
      <ShopPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
