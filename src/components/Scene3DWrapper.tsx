'use client';

import { useEffect, useState } from 'react';

interface Scene3DWrapperProps {
  scrollProgress: number;
}

export function Scene3DWrapper({ scrollProgress }: Scene3DWrapperProps) {
  const [SceneComponent, setSceneComponent] = useState<React.ComponentType<{ scrollProgress: number }> | null>(null);

  useEffect(() => {
    // Dynamically import the Scene3D component only on client
    import('./Scene3D').then((mod) => {
      setSceneComponent(() => mod.Scene3D);
    });
  }, []);

  if (!SceneComponent) {
    return <div className="canvas-container bg-biotech-black" />;
  }

  return <SceneComponent scrollProgress={scrollProgress} />;
}
