'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Dna, Search, Filter } from 'lucide-react';
import { useCart } from '@/context';
import { PRODUCTS } from '@/data/products';
import Image from 'next/image';

export default function ShopPage() {
  const router = useRouter();
  const { count, addItem } = useCart();

  const handleAddToCart = (product: typeof PRODUCTS[0]) => {
    addItem(product);
  };

  return (
    <div className="min-h-screen bg-biotech-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-biotech-black/90 backdrop-blur-xl border-b border-biotech-white/10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-biotech-gray hover:text-biotech-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
        
        <Link href="/" className="flex items-center gap-2">
          <Dna className="w-6 h-6 text-biotech-mint" />
          <span className="text-lg font-heading font-bold text-biotech-white">Most Proteins</span>
        </Link>

        <button
          onClick={() => router.push('/checkout')}
          className="flex items-center gap-2 px-4 py-2 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full hover:border-biotech-mint/50 transition-colors"
        >
          <ShoppingCart className="w-4 h-4 text-biotech-mint" />
          <span className="text-sm text-biotech-white">{count}</span>
        </button>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-4">
              Research Compounds
            </h1>
            <p className="text-biotech-gray max-w-2xl mx-auto">
              High-purity research peptides and compounds for laboratory studies. 
              All products include HPLC testing documentation.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-biotech-gray" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 bg-biotech-dark/60 border border-biotech-white/10 rounded-xl text-biotech-white placeholder:text-biotech-gray/50 focus:outline-none focus:border-biotech-mint/50"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-biotech-dark/60 border border-biotech-white/10 rounded-xl text-biotech-white hover:border-biotech-mint/50 transition-colors">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Results Count */}
          <p className="text-biotech-gray text-sm mb-6">
            Showing all {PRODUCTS.length} products
          </p>
        </div>
      </div>

      {/* Product Grid */}
      <main className="px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="group bg-biotech-dark/40 border border-biotech-white/10 rounded-2xl overflow-hidden hover:border-biotech-mint/30 transition-all duration-300 hover:shadow-lg hover:shadow-biotech-mint/5"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-biotech-dark/60 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-biotech-mint/20 border border-biotech-mint/30 rounded-full text-xs font-medium text-biotech-mint">
                      {product.label}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-biotech-white mb-2 group-hover:text-biotech-mint transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-sm text-biotech-gray line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-biotech-black/50 rounded text-xs text-biotech-gray">
                      Purity: {product.purity}
                    </span>
                    <span className="px-2 py-1 bg-biotech-black/50 rounded text-xs text-biotech-gray">
                      CAS: {product.casNumber}
                    </span>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-biotech-white/10">
                    <div>
                      <p className="text-2xl font-bold text-biotech-white">
                        ${product.price}
                      </p>
                      <p className="text-xs text-biotech-gray">USD</p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/product/${product.id}/`}
                        className="px-4 py-2 text-sm text-biotech-white border border-biotech-white/20 rounded-lg hover:border-biotech-mint/50 hover:text-biotech-mint transition-colors"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-4 py-2 text-sm bg-biotech-mint text-biotech-black font-medium rounded-lg hover:bg-biotech-mint/90 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="border-t border-biotech-white/10 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-biotech-white font-semibold mb-2">HPLC Tested</h3>
              <p className="text-sm text-biotech-gray">≥98% purity guaranteed</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-biotech-white font-semibold mb-2">COA Included</h3>
              <p className="text-sm text-biotech-gray">Batch documentation</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧊</span>
              </div>
              <h3 className="text-biotech-white font-semibold mb-2">Cold Shipped</h3>
              <p className="text-sm text-biotech-gray">Temperature controlled</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-biotech-white font-semibold mb-2">Secure</h3>
              <p className="text-sm text-biotech-gray">Encrypted checkout</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-biotech-white/10 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-biotech-mint" />
              <span className="text-sm font-heading font-semibold text-biotech-white">Most Proteins</span>
            </div>
            <p className="text-xs text-biotech-gray text-center">
              All products are sold for research purposes only. Not for human consumption. Must be 21 years or older to purchase.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy/" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms/" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="border-t border-biotech-white/10 mt-4 pt-4 text-center">
            <p className="text-xs text-biotech-gray/60">
              © 2026 Most Proteins. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
