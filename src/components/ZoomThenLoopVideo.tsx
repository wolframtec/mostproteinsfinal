'use client';

import { useEffect, useRef, useState } from 'react';

interface ZoomThenLoopVideoProps {
  zoomSrc: string;
  loopSrc: string;
  posterSrc?: string;
  overlayOpacity?: number;
}

export function ZoomThenLoopVideo({ 
  zoomSrc, 
  loopSrc,
  posterSrc,
  overlayOpacity = 0.6 
}: ZoomThenLoopVideoProps) {
  const zoomVideoRef = useRef<HTMLVideoElement>(null);
  const loopVideoRef = useRef<HTMLVideoElement>(null);
  const [showZoom, setShowZoom] = useState(true);
  const [zoomEnded, setZoomEnded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const zoomVideo = zoomVideoRef.current;
    const loopVideo = loopVideoRef.current;

    if (zoomVideo && loopVideo) {
      // Preload the loop video while zoom plays
      loopVideo.load();

      // When zoom video ends, switch to loop
      const handleZoomEnded = () => {
        setZoomEnded(true);
        
        // Small delay for smooth transition
        setTimeout(() => {
          setShowZoom(false);
          loopVideo.play().catch(() => {
            console.log('Loop video autoplay blocked');
          });
        }, 100);
      };

      zoomVideo.addEventListener('ended', handleZoomEnded);
      
      // Start playing zoom
      zoomVideo.play().catch(() => {
        console.log('Zoom video autoplay blocked');
      });

      return () => {
        zoomVideo.removeEventListener('ended', handleZoomEnded);
      };
    }
  }, [isMobile]);

  // On mobile, return fallback
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-0 bg-biotech-black"
        style={{
          background: 'radial-gradient(ellipse at center, #1a1d26 0%, #0B0C10 100%)'
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Zoom Video (plays once) */}
      {showZoom && (
        <video
          ref={zoomVideoRef}
          muted
          playsInline
          poster={posterSrc}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            zoomEnded ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        >
          <source src={zoomSrc} type="video/mp4" />
        </video>
      )}

      {/* Loop Video (starts after zoom, loops forever) */}
      <video
        ref={loopVideoRef}
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          showZoom ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      >
        <source src={loopSrc} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-biotech-black pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(11, 12, 16, 0.4) 100%),
            radial-gradient(ellipse at 50% 100%, rgba(11, 12, 16, 0.8) 0%, transparent 60%)
          `
        }}
      />

      {/* Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default ZoomThenLoopVideo;
