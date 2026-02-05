import { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { 
  ShoppingCart, X, Plus, Minus, ChevronRight, ArrowRight, Beaker, Dna, 
  Sparkles, Shield, Zap, Activity, AlertTriangle, Users, 
  Lock, CheckCircle, FlaskConical, Microscope, ShieldCheck 
} from 'lucide-react';
import { CartProvider, useCart, type Product } from './context';
import { ProductCard } from './components/ProductCard';
import { AgeVerification } from './components/AgeVerification';
import { ComplianceBanner } from './components/ComplianceBanner';
import { CookieConsent } from './components/CookieConsent';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

// Lazy load heavy components
const ProductPage = lazy(() => import('./pages/ProductPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutCompletePage = lazy(() => import('./pages/CheckoutCompletePage'));

// ============================================
// FDA COMPLIANCE - PRODUCT DATA
// All descriptions are factual, chemical information only
// No efficacy or medical claims made
// ============================================
const PRODUCTS: Product[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157 (5mg)',
    description: 'Synthetic pentadecapeptide consisting of 15 amino acids. Research compound for laboratory studies on tissue repair mechanisms. Purity: ≥98% by HPLC.',
    price: 178,
    image: '/images/bpc157-product.jpg',
    label: 'RESEARCH PEPTIDE',
    icon: <Activity className="w-5 h-5" />,
    casNumber: '137525-51-0',
    molecularWeight: '1419.5 g/mol',
    purity: '≥98%',
    storage: '-20°C',
    sequence: 'Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu (50mg)',
    description: 'Copper tripeptide-1 (glycyl-L-histidyl-L-lysine). Research compound for laboratory studies on extracellular matrix interactions. Purity: ≥99% by HPLC.',
    price: 258,
    image: '/images/ghkcu-product.jpg',
    label: 'RESEARCH PEPTIDE',
    icon: <Sparkles className="w-5 h-5" />,
    casNumber: '89030-95-5',
    molecularWeight: '340.4 g/mol',
    purity: '≥99%',
    storage: '-20°C',
    sequence: 'Gly-His-Lys-Cu',
  },
  {
    id: 'epithalon',
    name: 'Epithalon (20mg)',
    description: 'Synthetic tetrapeptide (Ala-Glu-Asp-Gly). Research compound for laboratory studies on telomerase activity. Purity: ≥98% by HPLC.',
    price: 298,
    image: '/images/epithalon-product.jpg',
    label: 'RESEARCH PEPTIDE',
    icon: <Dna className="w-5 h-5" />,
    casNumber: '307297-39-8',
    molecularWeight: '390.3 g/mol',
    purity: '≥98%',
    storage: '-20°C',
    sequence: 'Ala-Glu-Asp-Gly',
  },
  {
    id: 'tb-500',
    name: 'TB-500 (5mg)',
    description: 'Synthetic version of Thymosin Beta-4 (fragment 17-23). Research compound for laboratory studies on actin regulation. Purity: ≥98% by HPLC.',
    price: 218,
    image: '/images/tb500-product.jpg',
    label: 'RESEARCH PEPTIDE',
    icon: <Shield className="w-5 h-5" />,
    casNumber: '885340-08-9',
    molecularWeight: '889.0 g/mol',
    purity: '≥98%',
    storage: '-20°C',
    sequence: 'Ac-Lys-Lys-Thr-Glu-Thr-Gln',
  },
  {
    id: 'cjc-ghrp',
    name: 'CJC-1295 + GHRP-2 (10mg Blend)',
    description: 'Research blend of modified GRF 1-29 and growth hormone secretagogue. For laboratory studies on GHRH receptor interactions. Purity: ≥98% by HPLC.',
    price: 358,
    image: '/images/cjc-product.jpg',
    label: 'RESEARCH BLEND',
    icon: <Zap className="w-5 h-5" />,
    casNumber: 'Blend - See COA',
    molecularWeight: 'Varies',
    purity: '≥98%',
    storage: '-20°C',
    sequence: 'See Certificate of Analysis',
  },
];

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
// CART PANEL
// ============================================
function CartPanel({ isOpen, onClose, onCheckout }: { isOpen: boolean; onClose: () => void; onCheckout: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { items, removeItem, updateQuantity, total } = useCart();

  useEffect(() => {
    if (panelRef.current && overlayRef.current) {
      if (isOpen) {
        gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
        gsap.to(panelRef.current, { x: 0, duration: 0.4, ease: 'power3.out' });
      } else {
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.3 });
        gsap.to(panelRef.current, { x: '100%', duration: 0.4, ease: 'power3.in' });
      }
    }
  }, [isOpen]);

  return (
    <>
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0 pointer-events-none"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-biotech-dark/95 backdrop-blur-xl border-l border-biotech-white/10 z-[70] flex flex-col"
        style={{ transform: 'translateX(100%)' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-biotech-white/10">
          <h2 className="text-xl font-heading font-bold text-biotech-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-biotech-mint" />
            Research Cart
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-biotech-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-biotech-gray" />
          </button>
        </div>

        {/* FDA Disclaimer in Cart */}
        <div className="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-xs text-yellow-400/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Products are for research use only. Not for human consumption. By checking out, you affirm you are a qualified researcher 21+.</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-biotech-gray/30 mb-4" />
              <p className="text-biotech-gray">Your research cart is empty</p>
              <p className="text-biotech-gray/60 text-sm mt-2">Add research materials to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="glass-card p-4 flex gap-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="label-mono text-biotech-mint text-[10px]">{item.label}</p>
                        <h4 className="text-biotech-white font-semibold text-sm">{item.name}</h4>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-biotech-white/10 rounded transition-colors">
                        <X className="w-4 h-4 text-biotech-gray" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-biotech-white/10 rounded hover:bg-biotech-white/20 transition-colors">
                          <Minus className="w-3 h-3 text-biotech-white" />
                        </button>
                        <span className="text-biotech-white font-mono w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-biotech-white/10 rounded hover:bg-biotech-white/20 transition-colors">
                          <Plus className="w-3 h-3 text-biotech-white" />
                        </button>
                      </div>
                      <span className="text-biotech-white font-semibold">${item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-biotech-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-biotech-gray">Subtotal</span>
              <span className="text-2xl font-heading font-bold text-biotech-white">${total}</span>
            </div>
            <button onClick={onCheckout} className="w-full btn-primary flex items-center justify-center gap-2">
              Proceed to Secure Checkout
              <Lock className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================
// ABOUT US SECTION
// ============================================
function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.about-content'),
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );
    }
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative z-30 min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="about-content text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-4">
            About Most Proteins
          </h2>
          <p className="about-content text-biotech-gray text-lg max-w-2xl mx-auto">
            Advancing scientific research through high-purity research compounds
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="about-content glass-card p-8 text-center">
            <div className="w-16 h-16 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-8 h-8 text-biotech-mint" />
            </div>
            <h3 className="text-xl font-heading font-bold text-biotech-white mb-2">Research Focus</h3>
            <p className="text-biotech-gray text-sm">
              We supply research-grade peptides and compounds to qualified laboratories and research institutions worldwide.
            </p>
          </div>

          <div className="about-content glass-card p-8 text-center">
            <div className="w-16 h-16 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-8 h-8 text-biotech-mint" />
            </div>
            <h3 className="text-xl font-heading font-bold text-biotech-white mb-2">Quality Assured</h3>
            <p className="text-biotech-gray text-sm">
              All compounds are HPLC-tested with Certificates of Analysis. Minimum 98% purity guaranteed.
            </p>
          </div>

          <div className="about-content glass-card p-8 text-center">
            <div className="w-16 h-16 bg-biotech-mint/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-biotech-mint" />
            </div>
            <h3 className="text-xl font-heading font-bold text-biotech-white mb-2">Compliance First</h3>
            <p className="text-biotech-gray text-sm">
              All products sold strictly for research purposes. We maintain full regulatory compliance and documentation.
            </p>
          </div>
        </div>

        <div className="about-content glass-card p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-heading font-bold text-biotech-white mb-4 flex items-center gap-3">
            <Users className="w-6 h-6 text-biotech-mint" />
            Our Commitment to Research
          </h3>
          <p className="text-biotech-gray mb-4">
            Most Proteins is dedicated to supporting scientific advancement by providing researchers with the highest quality 
            research compounds. We understand the critical importance of reliable, pure materials in laboratory settings.
          </p>
          <p className="text-biotech-gray mb-4">
            Our facility operates under strict quality control protocols. Each batch is tested and documented with 
            comprehensive Certificates of Analysis. We maintain cold-chain shipping for temperature-sensitive compounds 
            to ensure integrity upon delivery.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-biotech-mint">
              <CheckCircle className="w-4 h-4" />
              <span>HPLC Verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-biotech-mint">
              <CheckCircle className="w-4 h-4" />
              <span>COA Provided</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-biotech-mint">
              <CheckCircle className="w-4 h-4" />
              <span>Cold Chain Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-biotech-mint">
              <CheckCircle className="w-4 h-4" />
              <span>Batch Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// SUBSCRIBE SECTION
// ============================================
function SubscribeSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current.querySelectorAll('.subscribe-content'),
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Capture user data for newsletter
    const userData = {
      email,
      source: 'newsletter_signup',
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
    };
    // Store in localStorage (in production, send to secure API)
    const existingUsers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
    existingUsers.push(userData);
    localStorage.setItem('newsletter_subscribers', JSON.stringify(existingUsers));
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section id="subscribe" ref={sectionRef} className="relative z-30 min-h-screen flex items-center py-20">
      <div className="w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="subscribe-content text-4xl md:text-5xl font-heading font-bold text-biotech-white mb-4">
            Stay Updated
          </h2>
          <p className="subscribe-content text-biotech-gray text-lg mb-8">
            Get notified about new research compounds, batch releases, and laboratory best practices.
          </p>
          <div className="subscribe-content flex items-center gap-4 text-biotech-gray">
            <div className="w-12 h-12 bg-biotech-mint/10 rounded-full flex items-center justify-center">
              <Beaker className="w-5 h-5 text-biotech-mint" />
            </div>
            <div>
              <p className="text-biotech-white font-semibold">research@mostproteins.com</p>
              <p className="text-sm">For research inquiries only</p>
            </div>
          </div>
        </div>
        <div className="subscribe-content glass-card p-8">
          {subscribed ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-biotech-mint mx-auto mb-4" />
              <h3 className="text-xl font-heading font-bold text-biotech-white mb-2">Thank You!</h3>
              <p className="text-biotech-gray">You'll receive updates on new research materials.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-biotech-gray mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-biotech-black/50 border border-biotech-white/20 rounded-xl px-4 py-3 text-biotech-white placeholder-biotech-gray/50 focus:border-biotech-mint focus:outline-none transition-colors"
                  placeholder="researcher@institution.edu"
                />
              </div>
              <p className="text-xs text-biotech-gray/60">
                By subscribing, you agree to receive research-related communications. 
                We respect your privacy and never share your data.
              </p>
              <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                Subscribe to Updates
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN APP CONTENT
// ============================================
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  type View = 'home' | 'product' | 'about' | 'checkout' | 'checkout-complete' | 'privacy' | 'terms';

  const normalizePath = (path: string) => {
    if (path === '/') return '/';
    return path.replace(/\/+$/, '');
  };

  const findProductById = (id?: string | null) => {
    if (!id) return null;
    return PRODUCTS.find(product => product.id === id) || null;
  };

  const getProductFromLocation = () => {
    const path = normalizePath(window.location.pathname);
    const params = new URLSearchParams(window.location.search);
    const legacyId = params.get('id');

    if (path === '/product' && legacyId) {
      return findProductById(legacyId);
    }

    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'product' && segments[1]) {
      const slug = decodeURIComponent(segments[1]);
      return findProductById(slug);
    }

    return null;
  };

  const getInitialView = (): View => {
    const path = normalizePath(window.location.pathname);
    const params = new URLSearchParams(window.location.search);
    if (path.startsWith('/checkout/complete')) return 'checkout-complete';
    if (path.startsWith('/checkout')) return 'checkout';
    if (path.startsWith('/about')) return 'about';
    if (path.startsWith('/privacy')) return 'privacy';
    if (path.startsWith('/terms')) return 'terms';
    if (path.startsWith('/product/') || (path === '/product' && params.get('id'))) return 'product';
    return 'home';
  };

  const viewPaths: Record<View, string> = {
    home: '/',
    product: '/product',
    about: '/about',
    checkout: '/checkout',
    'checkout-complete': '/checkout/complete',
    privacy: '/privacy',
    terms: '/terms',
  };

  const buildPath = (view: View, productId?: string) => {
    if (view === 'product') {
      return productId ? `/product/${encodeURIComponent(productId)}` : viewPaths.product;
    }
    return viewPaths[view];
  };

  const initialProduct = getProductFromLocation();
  const [currentView, setCurrentView] = useState<View>(() => initialProduct ? 'product' : getInitialView());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => initialProduct);

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

  const navigate = (view: View, options?: { replace?: boolean; productId?: string }) => {
    const path = buildPath(view, options?.productId);
    if (options?.replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    setCurrentView(view);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    navigate('product', { productId: product.id });
    window.scrollTo(0, 0);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('checkout');
    window.scrollTo(0, 0);
  };

  // Sync view with browser navigation + deep links
  useEffect(() => {
    const syncFromLocation = () => {
      const path = normalizePath(window.location.pathname);
      const params = new URLSearchParams(window.location.search);

      if (path.startsWith('/product')) {
        const productFromSlug = getProductFromLocation();
        const productId = params.get('id');
        const productFromQuery = findProductById(productId);
        const product = productFromSlug || productFromQuery;

        if (product) {
          setSelectedProduct(product);
          setCurrentView('product');
        } else {
          setSelectedProduct(null);
          window.history.replaceState(null, '', '/');
          setCurrentView('home');
        }
        return;
      }

      setSelectedProduct(null);

      if (path.startsWith('/checkout/complete')) {
        setCurrentView('checkout-complete');
      } else if (path.startsWith('/checkout')) {
        setCurrentView('checkout');
      } else if (path.startsWith('/about')) {
        setCurrentView('about');
      } else if (path.startsWith('/privacy')) {
        setCurrentView('privacy');
      } else if (path.startsWith('/terms')) {
        setCurrentView('terms');
      } else {
        setCurrentView('home');
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  // Render different views
  if (currentView === 'product' && selectedProduct) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <ProductPage 
          product={selectedProduct} 
          onBack={() => navigate('home')} 
          onCartClick={() => setIsCartOpen(true)}
        />
      </Suspense>
    );
  }

  if (currentView === 'checkout') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <CheckoutPage onBack={() => navigate('home')} />
      </Suspense>
    );
  }

  if (currentView === 'checkout-complete') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <CheckoutCompletePage 
          onBack={() => navigate('home', { replace: true })}
          onRetry={() => navigate('checkout', { replace: true })}
        />
      </Suspense>
    );
  }

  if (currentView === 'about') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <AboutPage onBack={() => navigate('home')} />
      </Suspense>
    );
  }

  if (currentView === 'privacy') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <PrivacyPolicy onBack={() => navigate('home')} />
      </Suspense>
    );
  }

  if (currentView === 'terms') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-biotech-black flex items-center justify-center"><Dna className="w-12 h-12 text-biotech-mint animate-spin" /></div>}>
        <TermsOfService onBack={() => navigate('home')} />
      </Suspense>
    );
  }

  return (
    <div ref={mainRef} className="relative bg-biotech-black min-h-screen">
      {/* Compliance Components */}
      <AgeVerification />
      <ComplianceBanner />
      <CookieConsent />

      {/* Overlays */}
      <div className="grain-overlay" />
      <div className="vignette" />

      {/* 3D Canvas */}
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene scrollProgress={scrollProgress} />
          </Suspense>
        </Canvas>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-biotech-black/80 to-transparent">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <Dna className="w-6 h-6 text-biotech-mint" />
          <span className="text-lg font-heading font-bold text-biotech-white">Most Proteins</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('home')} className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            Products
          </button>
          <button onClick={() => navigate('about')} className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
            About
          </button>
          <a
            href="#subscribe"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
              requestAnimationFrame(() => {
                document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' });
              });
            }}
            className="text-sm text-biotech-gray hover:text-biotech-white transition-colors"
          >
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
            MOST: Measurable, Observable, Strictly Traceable — built for the most demanding labs.
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
              <button onClick={() => navigate('privacy')} className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate('terms')} className="text-sm text-biotech-gray hover:text-biotech-white transition-colors">
                Terms
              </button>
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

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
export { PRODUCTS };
