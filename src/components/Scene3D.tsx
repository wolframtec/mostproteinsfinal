'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

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
export function Scene3D({ scrollProgress }: { scrollProgress: number }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="canvas-container bg-biotech-black" />;
  }

  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 8]} intensity={0.6} color="#2EE9A8" distance={20} />
      <pointLight position={[0, 10, -5]} intensity={0.4} color="#9b5de5" distance={15} />
      <DNAHelix scrollProgress={scrollProgress} />
      <ParticleField />
      <Stars radius={50} depth={50} count={200} factor={4} saturation={0} fade speed={0.5} />
    </Canvas>
  );
}
