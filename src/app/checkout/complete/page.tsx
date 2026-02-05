import type { Metadata } from 'next';
import CheckoutCompletePageClient from '@/components/CheckoutCompletePageClient';

export const metadata: Metadata = {
  title: 'Checkout Complete',
  robots: { index: false, follow: false },
  alternates: { canonical: '/checkout/complete' },
};

export default function CheckoutCompletePage() {
  return <CheckoutCompletePageClient />;
}
