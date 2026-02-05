'use client';

import { useRouter } from 'next/navigation';
import CheckoutPage from '../views/CheckoutPage';

export default function CheckoutPageClient() {
  const router = useRouter();

  return <CheckoutPage onBack={() => router.push('/')} />;
}
