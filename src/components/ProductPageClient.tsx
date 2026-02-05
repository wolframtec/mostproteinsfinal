'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Product } from '../context';
import ProductPage from '../views/ProductPage';
import { CartPanel } from './CartPanel';

interface ProductPageClientProps {
  product: Product;
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <ProductPage
        product={product}
        onBack={() => router.push('/')}
        onCartClick={() => setIsCartOpen(true)}
      />
      <CartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => router.push('/checkout')}
      />
    </>
  );
}
