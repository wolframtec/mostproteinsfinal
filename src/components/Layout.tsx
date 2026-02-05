'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Dna } from 'lucide-react';
import { useCart } from '@/context';
import { IntroThenLoopVideo } from './IntroThenLoopVideo';

interface LayoutProps {
  children: React.ReactNode;
  showVideoBackground?: boolean;
}

export function Layout({ children, showVideoBackground = true }: LayoutProps) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <div className="relative min-h-screen">
      {/* Video Background */}
      {showVideoBackground && (
        <IntroThenLoopVideo 
          introSrc="/videos/intro.mp4"
          loopSrc="/videos/loop.mp4"
          overlayOpacity={0.6}
          rememberDurationMinutes={15}
        />
      )}

      {/* Consistent Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-biotech-black/80 to-transparent">
        <Link href="/" className="flex items-center gap-2">
          <Dna className="w-6 h-6 text-biotech-mint" />
          <span className="text-lg font-heading font-bold text-biotech-white">Most Proteins</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/shop" className="text-sm text-biotech-mint font-medium hover:text-biotech-white transition-colors">
            Shop
          </Link>
          <Link href="/" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            Products
          </Link>
          <Link href="/about" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            About
          </Link>
          <a href="/#subscribe" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            Contact
          </a>
          <button
            onClick={() => router.push('/checkout')}
            className="flex items-center gap-2 px-4 py-2 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full hover:border-biotech-mint/50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-biotech-mint" />
            <span className="text-sm text-biotech-white">{count}</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        {children}
      </main>
    </div>
  );
}

export default Layout;
