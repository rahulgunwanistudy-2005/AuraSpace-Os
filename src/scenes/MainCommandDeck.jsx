import React, { useRef } from 'react';
import { useStore } from '../state/store';
import Globe3D from '../components/Globe3D';
import QuantumOrb from '../components/QuantumOrb';
import Moon from '../components/Moon';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function CinematicLighting({ judgeModeStep, lightingMode }) {
  const dirLight = useRef();
  const ambLight = useRef();

  useFrame((state, delta) => {
    const isDanger = judgeModeStep >= 4 && judgeModeStep < 9;
    const isCinematic = lightingMode === 'CINEMATIC';
    
    // Pure, premium lighting. No artificial cyan or heavy blues.
    const targetSun = isDanger ? 0.8 : (isCinematic ? 1.5 : 1.8);
    const targetAmb = isDanger ? 0.02 : (isCinematic ? 0.05 : 0.1);
    
    // Light from top-left, cinematic rim light style
    const targetPos = isCinematic ? new THREE.Vector3(-15, 8, -5) : new THREE.Vector3(-12, 10, 8);

    if (dirLight.current) {
      dirLight.current.intensity = THREE.MathUtils.lerp(dirLight.current.intensity, targetSun, delta * 2);
      dirLight.current.position.lerp(targetPos, delta * 2);
    }
    if (ambLight.current) {
      ambLight.current.intensity = THREE.MathUtils.lerp(ambLight.current.intensity, targetAmb, delta * 2);
    }
  });

  return (
    <>
      <ambientLight ref={ambLight} intensity={0.1} color="#ffffff" />
      <directionalLight 
        ref={dirLight}
        position={[-12, 10, 8]}
        intensity={1.8} 
        color="#ffffff" 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
    </>
  );
}

export default function MainCommandDeck() {
  const orbState = useStore((s) => s.orbState);
  const scenario = useStore((s) => s.scenario);
  const immersiveMode = useStore((s) => s.immersiveMode);
  const judgeModeStep = useStore((s) => s.judgeModeStep);
  const lightingMode = useStore((s) => s.lightingMode);

  return (
    <>
      <CinematicLighting judgeModeStep={judgeModeStep} lightingMode={lightingMode} />

      {/* Earth — Centered in the workspace (shifted slightly right to account for 240px sidebar) */}
      <group position={[1.5, -1, -6]}>
        <Globe3D scenario={scenario} />
      </group>

      {/* Moon */}
      <Moon />

      {/* Quantum Orb — Subtly positioned to not compete with Earth */}
      <group position={[8, 4, -4]} scale={[0.5, 0.5, 0.5]}>
        <QuantumOrb state={orbState} />
      </group>
    </>
  );
}
