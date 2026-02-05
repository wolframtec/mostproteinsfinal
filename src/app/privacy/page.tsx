import type { Metadata } from 'next';
import PrivacyPolicy from '@/views/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Most Proteins privacy policy covering data collection, usage, and security.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <PrivacyPolicy />;
}
