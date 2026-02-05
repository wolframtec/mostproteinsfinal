'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ShoppingCart, ChevronRight, Dna } from 'lucide-react';
import { useCart, type Product } from './context';
import { PRODUCTS } from './data/products';
import { ProductCard } from './components/ProductCard';
import { CartPanel } from './components/CartPanel';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// 3D DNA HELIX COMPONENT
// ============================================
function DNAHelix({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const helixParams = useMemo(() => ({
    height: 35,
    radius: 2.5,
    turns: 4,
    spheresPerStrand: 80,
  }), []);

  const { sphereGeometry, rungGeometry, nodeGeometry, nodeRingGeometry } = useMemo(() => {
    return {
      sphereGeometry: new THREE.SphereGeometry(0.18, 16, 16),
      rungGeometry: new THREE.CylinderGeometry(0.06, 0.06, 1, 8),
      nodeGeometry: new THREE.SphereGeometry(0.5, 32, 32),
      nodeRingGeometry: new THREE.TorusGeometry(0.7, 0.03, 16, 64),
    };
  }, []);

  const strandMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E8ECF5',
    metalness: 0.25,
    roughness: 0.35,
    emissive: '#2EE9A8',
    emissiveIntensity: 0.15,
  }), []);

  const rungMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#A6ACB8',
    metalness: 0.2,
    roughness: 0.4,
    emissive: '#2EE9A8',
    emissiveIntensity: 0.08,
  }), []);

  const nodeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2EE9A8',
    metalness: 0.4,
    roughness: 0.2,
    emissive: '#2EE9A8',
    emissiveIntensity: 0.6,
  }), []);

  const nodeRingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#2EE9A8',
    transparent: true,
    opacity: 0.5,
  }), []);

  const { strand1Positions, strand2Positions, rungData, nodePositions } = useMemo(() => {
    const strand1: THREE.Vector3[] = [];
    const strand2: THREE.Vector3[] = [];
    const rungs: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const nodes: THREE.Vector3[] = [];

    for (let i = 0; i < helixParams.spheresPerStrand; i++) {
      const t = i / (helixParams.spheresPerStrand - 1);
      const angle = t * helixParams.turns * Math.PI * 2;
      const y = (t - 0.5) * helixParams.height;

      const x1 = Math.cos(angle) * helixParams.radius;
      const z1 = Math.sin(angle) * helixParams.radius;
      const x2 = Math.cos(angle + Math.PI) * helixParams.radius;
      const z2 = Math.sin(angle + Math.PI) * helixParams.radius;

      strand1.push(new THREE.Vector3(x1, y, z1));
      strand2.push(new THREE.Vector3(x2, y, z2));

      if (i % 4 === 0 && i < helixParams.spheresPerStrand - 1) {
        rungs.push({
          start: new THREE.Vector3(x1, y, z1),
          end: new THREE.Vector3(x2, y, z2),
        });
      }
    }

    const nodeYPositions = [-12, -6, 0, 6, 12];
    nodeYPositions.forEach((yPos) => {
      const t = (yPos / helixParams.height) + 0.5;
      const angle = t * helixParams.turns * Math.PI * 2;
      nodes.push(new THREE.Vector3(
        Math.cos(angle) * helixParams.radius * 1.5,
        yPos,
        Math.sin(angle) * helixParams.radius * 1.5
      ));
    });

    return { strand1Positions: strand1, strand2Positions: strand2, rungData: rungs, nodePositions: nodes };
  }, [helixParams]);

  useFrame((state) => {
    if (groupRef.current) {
      const autoRotation = state.clock.elapsedTime * 0.05;
      const scrollRotation = scrollProgress * Math.PI * 2;
      groupRef.current.rotation.y = autoRotation + scrollRotation;
    }
  });

  return (
    <group ref={groupRef}>
      <group>
        {strand1Positions.map((pos, i) => (
          <mesh key={`s1-${i}`} geometry={sphereGeometry} material={strandMaterial} position={pos} />
        ))}
      </group>
      <group>
        {strand2Positions.map((pos, i) => (
          <mesh key={`s2-${i}`} geometry={sphereGeometry} material={strandMaterial} position={pos} />
        ))}
      </group>
      <group>
        {rungData.map((rung, i) => {
          const midPoint = rung.start.clone().add(rung.end).multiplyScalar(0.5);
          const distance = rung.start.distanceTo(rung.end);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            rung.end.clone().sub(rung.start).normalize()
          );
          return (
            <mesh
              key={`rung-${i}`}
              geometry={rungGeometry}
              material={rungMaterial}
              position={midPoint}
              quaternion={quaternion}
              scale={[1, distance, 1]}
            />
          );
        })}
      </group>
      <group>
        {nodePositions.map((pos, i) => (
          <group key={`node-${i}`} position={pos}>
            <mesh geometry={nodeGeometry} material={nodeMaterial} />
            <mesh geometry={nodeRingGeometry} material={nodeRingMaterial} />
          </group>
        ))}
      </group>
    </group>
  );
}

// ============================================
// PARTICLE FIELD
// ============================================
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 400;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const isMint = Math.random() > 0.7;
      colors[i * 3] = isMint ? 0.18 : 0.9;
      colors[i * 3 + 1] = isMint ? 0.91 : 0.9;
      colors[i * 3 + 2] = isMint ? 0.66 : 0.95;
    }

    return { positions, colors };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ============================================
// 3D SCENE
// ============================================
function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 8]} intensity={0.6} color="#2EE9A8" distance={20} />
      <pointLight position={[0, 10, -5]} intensity={0.4} color="#9b5de5" distance={15} />
      <DNAHelix scrollProgress={scrollProgress} />
      <ParticleField />
      <Stars radius={50} depth={50} count={200} factor={4} saturation={0} fade speed={0.5} />
    </>
  );
}

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
      <p className="mt-2 text-biotech-gray text-sm">Research-Grade Peptides</p>
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
            Research peptides, packaged with clarity.
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

  const { count } = useCart();

  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll progress tracking
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
      {/* Overlays */}
      <div className="grain-overlay" />
      <div className="vignette" />

      {/* 3D Canvas */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
          <Scene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

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
            MOST OF ALL.
          </p>
          <button
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="hero-content btn-primary inline-flex items-center gap-2"
          >
            Browse Research Materials
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
