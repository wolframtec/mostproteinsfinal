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
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Check if intro was recently played
    const checkRecentPlay = () => {
      const playedAt = localStorage.getItem(STORAGE_KEY);
      if (playedAt) {
        const playedTime = parseInt(playedAt, 10);
        const now = Date.now();
        const minutesSince = (now - playedTime) / (1000 * 60);
        
        if (minutesSince < rememberDurationMinutes) {
          setSkipIntro(true);
          setShowIntro(false);
          return;
        }
      }
      setSkipIntro(false);
    };

    checkRecentPlay();
  }, [rememberDurationMinutes]);

  useEffect(() => {
    if (skipIntro) return;

    const introVideo = introVideoRef.current;
    const loopVideo = loopVideoRef.current;

    if (introVideo && loopVideo) {
      loopVideo.load();

      const handleIntroEnded = () => {
        setIntroEnded(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        
        setTimeout(() => {
          setShowIntro(false);
          loopVideo.play().catch((err) => {
            console.log('Loop video autoplay blocked:', err);
          });
        }, 100);
      };

      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setVideoError(true);
      };

      introVideo.addEventListener('ended', handleIntroEnded);
      introVideo.addEventListener('error', handleError);
      
      // Mobile-friendly autoplay
      const playVideo = async () => {
        try {
          await introVideo.play();
        } catch (err) {
          console.log('Autoplay blocked, waiting for interaction');
          // Try muted autoplay which is allowed on mobile
          introVideo.muted = true;
          try {
            await introVideo.play();
          } catch (err2) {
            console.log('Muted autoplay also failed');
          }
        }
      };
      
      playVideo();

      return () => {
        introVideo.removeEventListener('ended', handleIntroEnded);
        introVideo.removeEventListener('error', handleError);
      };
    }
  }, [skipIntro]);

  useEffect(() => {
    if (skipIntro && loopVideoRef.current) {
      const playLoop = async () => {
        try {
          await loopVideoRef.current?.play();
        } catch (err) {
          console.log('Loop autoplay blocked:', err);
        }
      };
      playLoop();
    }
  }, [skipIntro]);

  // Fallback for video errors
  if (videoError) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-biotech-black"
          style={{
            background: 'radial-gradient(ellipse at center, #1a1d26 0%, #0B0C10 100%)'
          }}
        />
        <div 
          className="absolute inset-0 bg-biotech-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(11, 12, 16, 0.4) 100%),
              radial-gradient(ellipse at 50% 100%, rgba(11, 12, 16, 0.8) 0%, transparent 60%)
            `
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Intro Video */}
      {showIntro && (
        <video
          ref={introVideoRef}
          muted
          playsInline
          poster={posterSrc}
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            introEnded ? 'opacity-0' : 'opacity-100'
          } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        >
          <source src={introSrc} type="video/mp4" />
        </video>
      )}

      {/* Loop Video */}
      <video
        ref={loopVideoRef}
        loop
        muted
        playsInline
        preload="auto"
        autoPlay={skipIntro}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          showIntro ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      >
        <source src={loopSrc} type="video/mp4" />
      </video>

      {/* Overlays */}
      <div 
        className="absolute inset-0 bg-biotech-black pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(11, 12, 16, 0.4) 100%),
            radial-gradient(ellipse at 50% 100%, rgba(11, 12, 16, 0.8) 0%, transparent 60%)
          `
        }}
      />
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
