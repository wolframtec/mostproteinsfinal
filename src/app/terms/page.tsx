import type { Metadata } from 'next';
import TermsOfService from '@/views/TermsOfService';

export const metadata: Metadata = {
  title: 'Terms of Service | Research-Only Terms',
  description:
    'Read the Most Proteins terms of service, research-only requirements, age verification, and purchasing policies. All products strictly for laboratory research use only.',
  keywords: [
    'terms of service',
    'research only policy',
    'age verification',
    'purchasing terms',
    'laboratory use only',
    'not for human consumption',
  ],
  alternates: { canonical: '/terms/' },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Service | Most Proteins',
    description:
      'Read our terms of service, research-only requirements, and purchasing policies.',
    url: '/terms/',
    type: 'website',
  },
};

export default function TermsPage() {
  return <TermsOfService />;
}
