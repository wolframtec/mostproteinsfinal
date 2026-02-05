'use client';

import { useEffect, useRef, useState } from 'react';

interface IntroThenLoopVideoProps {
  introSrc: string;
  loopSrc: string;
  posterSrc?: string;
  overlayOpacity?: number;
  rememberDurationMinutes?: number;
}

const STORAGE_KEY = 'introVideoPlayedAt';

export function IntroThenLoopVideo({ 
  introSrc, 
  loopSrc,
  posterSrc,
  overlayOpacity = 0.6,
  rememberDurationMinutes = 15
}: IntroThenLoopVideoProps) {
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const loopVideoRef = useRef<HTMLVideoElement>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introEnded, setIntroEnded] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if intro was recently played
    const checkRecentPlay = () => {
      const playedAt = localStorage.getItem(STORAGE_KEY);
      if (playedAt) {
        const playedTime = parseInt(playedAt, 10);
        const now = Date.now();
        const minutesSince = (now - playedTime) / (1000 * 60);
        
        if (minutesSince < rememberDurationMinutes) {
          // Skip intro, go straight to loop
          setSkipIntro(true);
          setShowIntro(false);
          return;
        }
      }
      // Will play intro
      setSkipIntro(false);
    };

    checkRecentPlay();
  }, [rememberDurationMinutes]);

  useEffect(() => {
    if (skipIntro) return;

    const introVideo = introVideoRef.current;
    const loopVideo = loopVideoRef.current;

    if (introVideo && loopVideo) {
      // Preload the loop video while intro plays
      loopVideo.load();

      // When intro ends, switch to loop
      const handleIntroEnded = () => {
        setIntroEnded(true);
        
        // Record that intro was played
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        
        // Crossfade delay
        setTimeout(() => {
          setShowIntro(false);
          loopVideo.play().catch(() => {
            console.log('Loop video autoplay blocked');
          });
        }, 100);
      };

      introVideo.addEventListener('ended', handleIntroEnded);
      
      // Start playing intro
      introVideo.play().catch(() => {
        console.log('Intro video autoplay blocked');
      });

      return () => {
        introVideo.removeEventListener('ended', handleIntroEnded);
      };
    }
  }, [skipIntro]);

  useEffect(() => {
    if (skipIntro && loopVideoRef.current) {
      // Start loop immediately if skipping intro
      loopVideoRef.current.play().catch(() => {
        console.log('Loop video autoplay blocked');
      });
    }
  }, [skipIntro]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Intro Video (plays once, then crossfades) */}
      {showIntro && (
        <video
          ref={introVideoRef}
          muted
          playsInline
          poster={posterSrc}
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            introEnded ? 'opacity-0' : 'opacity-100'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        >
          <source src={introSrc} type="video/mp4" />
        </video>
      )}

      {/* Loop Video (starts after intro, loops forever) */}
      <video
        ref={loopVideoRef}
        loop
        muted
        playsInline
        autoPlay={skipIntro}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          showIntro ? 'opacity-0' : 'opacity-100'
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

export default IntroThenLoopVideo;
