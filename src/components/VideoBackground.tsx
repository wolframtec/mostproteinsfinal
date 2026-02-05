'use client';

import { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: number;
}

export function VideoBackground({ 
  videoSrc, 
  posterSrc,
  overlayOpacity = 0.7 
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile (disable video on mobile for performance)
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, show poster/fallback
      });
    }
  }, [isMobile]);

  // On mobile, return null (fallback to CSS background)
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
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        onLoadedData={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center center'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback message */}
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-biotech-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Gradient Overlay for better text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(11, 12, 16, 0.4) 100%),
            radial-gradient(ellipse at 50% 100%, rgba(11, 12, 16, 0.8) 0%, transparent 60%)
          `
        }}
      />

      {/* Noise/Grain Overlay (optional) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default VideoBackground;
