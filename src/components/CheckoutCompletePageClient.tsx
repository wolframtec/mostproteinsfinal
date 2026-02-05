'use client';

import { useRouter } from 'next/navigation';
import CheckoutCompletePage from '../views/CheckoutCompletePage';

export default function CheckoutCompletePageClient() {
  const router = useRouter();

  return (
    <CheckoutCompletePage
      onBack={() => router.push('/')}
      onRetry={() => router.push('/checkout')}
    />
  );
}
