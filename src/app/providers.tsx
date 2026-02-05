'use client';

import { type ReactNode } from 'react';
import { CartProvider } from '@/context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <CartProvider>{children}</CartProvider>;
}

export default Providers;
