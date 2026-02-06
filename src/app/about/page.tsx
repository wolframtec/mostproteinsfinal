import type { Metadata } from 'next';
import AboutPage from '@/views/AboutPage';

const siteUrl = 'https://mostproteins.com';

export const metadata: Metadata = {
  title: 'About Us | Research Short Chain Protein Company',
  description:
    'Learn about Most Proteins, our mission to provide research-grade short chain proteins with COA documentation, and our commitment to research-only compliance. HPLC-tested compounds for laboratory studies.',
  keywords: [
    'about most proteins',
    'research short chain protein company',
    'short chain protein supplier',
    'HPLC testing',
    'COA documentation',
    'research compliance',
    'laboratory short chain proteins',
  ],
  alternates: { canonical: '/about/' },
  openGraph: {
    title: 'About Most Proteins | Research Peptide Company',
    description:
      'Learn about our mission to provide research-grade short chain proteins with COA documentation and HPLC purity testing.',
    url: '/about/',
    type: 'website',
    images: [
      {
        url: '/images/bpc157-product.jpg',
        width: 1200,
        height: 630,
        alt: 'About Most Proteins - Research short chain protein supplier',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Most Proteins | Research Peptide Company',
    description: 'Learn about our mission to provide research-grade peptides with COA documentation.',
    images: ['/images/bpc157-product.jpg'],
  },
};

// About Page Schema
const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Most Proteins',
  description: 'Learn about Most Proteins, our mission, and our commitment to research-only compliance.',
  url: `${siteUrl}/about/`,
  mainEntity: {
    '@type': 'Organization',
    name: 'Most Proteins',
    description: 'Research peptide supplier with HPLC purity testing and COA documentation',
    url: siteUrl,
  },
};

export default function About() {
  return (
    <>
      <AboutPage />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
    </>
  );
}
