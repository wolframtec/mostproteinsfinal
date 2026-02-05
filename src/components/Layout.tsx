'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingCart, Dna, Menu, X } from 'lucide-react';
import { useCart } from '@/context';
import { IntroThenLoopVideo } from './IntroThenLoopVideo';

interface LayoutProps {
  children: React.ReactNode;
  showVideoBackground?: boolean;
}

export function Layout({ children, showVideoBackground = true }: LayoutProps) {
  const router = useRouter();
  const { count } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/shop', label: 'Shop', highlight: true },
    { href: '/', label: 'Products' },
    { href: '/about', label: 'About' },
    { href: '/#subscribe', label: 'Contact' },
  ];

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
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-b from-biotech-black/80 to-transparent">
        <Link href="/" className="flex items-center gap-2">
          <Dna className="w-5 h-5 sm:w-6 sm:h-6 text-biotech-mint" />
          <span className="text-base sm:text-lg font-heading font-bold text-biotech-white">Most Proteins</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`text-sm transition-colors ${
                link.highlight 
                  ? 'text-biotech-mint font-medium hover:text-biotech-white' 
                  : 'text-biotech-gray hover:text-biotech-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => router.push('/checkout')}
            className="flex items-center gap-2 px-4 py-2 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full hover:border-biotech-mint/50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-biotech-mint" />
            <span className="text-sm text-biotech-white">{count}</span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => router.push('/checkout')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full"
          >
            <ShoppingCart className="w-4 h-4 text-biotech-mint" />
            <span className="text-sm text-biotech-white">{count}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-biotech-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-biotech-black/90 backdrop-blur-xl"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-16 left-0 right-0 p-6">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg py-3 border-b border-biotech-white/10 transition-colors ${
                    link.highlight 
                      ? 'text-biotech-mint font-medium' 
                      : 'text-biotech-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-16 sm:pt-20">
        {children}
      </main>
    </div>
  );
}

export default Layout;
