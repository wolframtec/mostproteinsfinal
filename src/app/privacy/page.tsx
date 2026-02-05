import type { Metadata } from 'next';
import PrivacyPolicy from '@/views/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy | Data Protection',
  description:
    'Most Proteins privacy policy covering data collection, usage, security measures, and your rights. We protect your research data with industry-standard encryption.',
  keywords: [
    'privacy policy',
    'data protection',
    'research data security',
    'GDPR compliance',
    'privacy rights',
  ],
  alternates: { canonical: '/privacy/' },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Most Proteins',
    description:
      'Most Proteins privacy policy covering data collection, usage, security measures, and your rights.',
    url: '/privacy/',
    type: 'website',
  },
};

export default function Privacy() {
  return <PrivacyPolicy />;
}
