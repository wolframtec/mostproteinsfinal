'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ShoppingCart, ChevronRight, Dna } from 'lucide-react';
import { useCart, type Product } from './context';
import { PRODUCTS } from './data/products';
import { ProductCard } from './components/ProductCard';
import { CartPanel } from './components/CartPanel';

gsap.registerPlugin(ScrollTrigger);

import { IntroThenLoopVideo } from './components/IntroThenLoopVideo';
// import { Scene3DWrapper } from './components/Scene3DWrapper'; // Uncomment to use 3D background

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-biotech-black flex flex-col items-center justify-center transition-opacity duration-700 ${
      progress >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="relative">
        <Dna className="w-20 h-20 text-biotech-mint animate-pulse" />
        <div className="absolute inset-0 blur-xl">
          <Dna className="w-20 h-20 text-biotech-mint/50" />
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-heading font-bold text-biotech-white">Most Proteins</h2>
      <p className="mt-2 text-biotech-gray text-sm">Make the Most of every opportunity</p>
      <div className="mt-8 w-48 h-1 bg-biotech-dark rounded-full overflow-hidden">
        <div className="h-full bg-biotech-mint transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-4 text-biotech-gray text-xs font-mono">{progress}%</p>
    </div>
  );
}

// ============================================
// ABOUT + SUBSCRIBE SECTIONS
// ============================================
function AboutSection() {
  return (
    <section id="about" className="relative z-20 py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="glass-card p-8 md:p-12">
          <p className="label-mono text-biotech-mint mb-3">MOST</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-biotech-white mb-4">
            Packaged with clarity.
          </h2>
          <p className="text-biotech-gray text-lg leading-relaxed max-w-3xl">
            Most Proteins focuses on clean documentation, careful handling, and a frictionless path to
            procurement. Every order is research-only, with compliance cues built into the experience.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="bg-biotech-dark/60 border border-biotech-white/10 rounded-2xl p-5">
              <p className="text-sm text-biotech-gray/70 uppercase tracking-wider mb-2">COA Included</p>
              <p className="text-biotech-white font-semibold">Clear, consistent documentation</p>
            </div>
            <div className="bg-biotech-dark/60 border border-biotech-white/10 rounded-2xl p-5">
              <p className="text-sm text-biotech-gray/70 uppercase tracking-wider mb-2">Cold Chain</p>
              <p className="text-biotech-white font-semibold">Handled for stability and integrity</p>
            </div>
            <div className="bg-biotech-dark/60 border border-biotech-white/10 rounded-2xl p-5">
              <p className="text-sm text-biotech-gray/70 uppercase tracking-wider mb-2">Research-Only</p>
              <p className="text-biotech-white font-semibold">Built-in compliance checkpoints</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SubscribeSection() {
  return (
    <section id="subscribe" className="relative z-20 py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-biotech-white mb-3">
              Want COAs or custom documentation?
            </h2>
            <p className="text-biotech-gray text-lg">
              Reach out for research support, documentation requests, or product availability updates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href="mailto:research@mostproteins.com"
              className="btn-primary text-center"
            >
              Contact Research
            </a>
            <Link href="/about" className="btn-secondary text-center">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN APP CONTENT
// ============================================
function HomePageClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();
  
  // Prevent unused variable warning when 3D scene is disabled
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _scrollProgress = scrollProgress;

  const { count } = useCart();

  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll progress tracking (for 3D scene - currently unused with video background)
  useEffect(() => {
    if (isLoading) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  // Lenis smooth scroll
  useEffect(() => {
    if (isLoading) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => lenis.destroy();
  }, [isLoading]);

  // GSAP animations
  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll('.hero-content'),
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
        );
      }
      productRefs.current.forEach((ref, index) => {
        if (!ref) return;
        ScrollTrigger.create({
          trigger: ref,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setActiveProductIndex(index),
          onEnterBack: () => setActiveProductIndex(index),
          onLeave: () => { if (index === PRODUCTS.length - 1) setActiveProductIndex(-1); },
          onLeaveBack: () => { if (index === 0) setActiveProductIndex(-1); },
        });
      });
    }, mainRef);
    return () => ctx.revert();
  }, [isLoading]);

  const handleProductClick = (product: Product) => {
    router.push(`/product/${product.id}`);
    window.scrollTo(0, 0);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push('/checkout');
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div ref={mainRef} className="relative bg-biotech-black min-h-screen">
      {/* Video Background - Intro plays once, then seamless loop (remembered for 15 min) */}
      <IntroThenLoopVideo 
        introSrc="/videos/intro.mp4"
        loopSrc="/videos/loop.mp4"
        overlayOpacity={0.6}
        rememberDurationMinutes={15}
      />

      {/* Overlays */}
      <div className="grain-overlay" />
      <div className="vignette" />

      {/* 3D Canvas - Loaded dynamically on client only (optional, comment out if using video only) */}
      {/* <div className="canvas-container">
        <Scene3DWrapper scrollProgress={scrollProgress} />
      </div> */}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-biotech-black/80 to-transparent">
        <Link href="/" className="flex items-center gap-2">
          <Dna className="w-6 h-6 text-biotech-mint" />
          <span className="text-lg font-heading font-bold text-biotech-white">Most Proteins</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            Products
          </Link>
          <Link href="/about" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            About
          </Link>
          <a href="#subscribe" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            Contact
          </a>
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-biotech-dark/80 backdrop-blur-sm border border-biotech-white/10 rounded-full hover:border-biotech-mint/50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-biotech-mint" />
            <span className="text-sm text-biotech-white">{count}</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="section-pinned flex items-center justify-center z-10">
        <div className="text-center px-4">
          <h1 className="hero-content text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-biotech-white text-glow mb-6">
            MOST PROTEINS
          </h1>
          <p className="hero-content text-lg md:text-xl text-biotech-gray max-w-2xl mx-auto mb-8">
            Make the Most of every opportunity.
          </p>
          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="hero-content btn-primary inline-flex items-center gap-2"
          >
            Browse
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="hero-content mt-16 text-sm text-biotech-gray/60 font-mono">
            For Research Use Only • 21+ Required
          </p>
        </div>
      </section>

      {/* Product Sections */}
      <div id="products" className="relative z-20">
        {PRODUCTS.map((product, index) => (
          <div
            key={product.id}
            ref={(el) => { productRefs.current[index] = el; }}
            className="section-pinned flex items-center justify-center"
          >
            <ProductCard
              product={product}
              isVisible={activeProductIndex === index}
              onViewDetails={handleProductClick}
            />
          </div>
        ))}
      </div>

      {/* About Section */}
      <AboutSection />

      {/* Subscribe Section */}
      <SubscribeSection />

      {/* Footer */}
      <footer className="relative z-30 border-t border-biotech-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-biotech-mint" />
              <span className="text-sm font-heading font-semibold text-biotech-white">Most Proteins</span>
            </div>
            <p className="text-xs text-biotech-gray text-center max-w-md">
              All products are sold for research purposes only. Not for human consumption. 
              Must be 21 years or older to purchase.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="border-t border-biotech-white/10 pt-4 text-center">
            <p className="text-xs text-biotech-gray/60">
              © 2026 Most Proteins. All rights reserved. | 
              <span className="text-yellow-500/80 ml-2">For Research Use Only • Not FDA Approved</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Panel */}
      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />
    </div>
  );
}

export default HomePageClient;
