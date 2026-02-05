import type { Metadata } from 'next';
import CheckoutPageClient from '@/components/CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
  alternates: { canonical: '/checkout' },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
