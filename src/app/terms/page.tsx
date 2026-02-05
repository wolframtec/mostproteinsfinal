import type { Metadata } from 'next';
import TermsOfService from '@/views/TermsOfService';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the Most Proteins terms of service, research-only requirements, and purchasing policies.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return <TermsOfService />;
}
