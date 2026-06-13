import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, Html } from '@react-three/drei';
import { useStore } from '../state/store';
import { motion } from 'framer-motion';
import * as THREE from 'three';

export default function AuraSatellite({ scale = 1, position = [0, 0, 0], rotation = [0, 0, 0], isBurning = false, showLabel = false }) {
  const groupRef = useRef();
  const hoveredObject = useStore(s => s.hoveredObject);
  const setHoveredObject = useStore(s => s.setHoveredObject);
  const [localHover, setLocalHover] = useState(false);

  const isHovered = hoveredObject === 'PRIMARY' || localHover;

  // Advanced PBR Materials
  const goldKapton = new THREE.MeshStandardMaterial({
    color: '#ffaa00',
    roughness: 0.4,
    metalness: 0.8,
    bumpScale: 0.05,
    emissive: isHovered ? '#ffaa00' : '#000000',
    emissiveIntensity: isHovered ? 0.5 : 0
  });

  const spaceAluminum = new THREE.MeshStandardMaterial({
    color: '#dddddd',
    roughness: 0.3,
    metalness: 0.9,
    emissive: isHovered ? '#ffffff' : '#000000',
    emissiveIntensity: isHovered ? 0.2 : 0
  });

  const solarPanelDark = new THREE.MeshStandardMaterial({
    color: '#050a1f',
    roughness: 0.1,
    metalness: 0.6,
    emissive: '#050a1f',
    emissiveIntensity: isHovered ? 0.3 : 0.1
  });

  const radiatorWhite = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.8,
    metalness: 0.1,
  });

  // Hover animation
  useFrame((state, delta) => {
    if (groupRef.current && isHovered) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group 
      ref={groupRef} 
      scale={isHovered ? scale * 1.2 : scale} 
      position={position} 
      rotation={rotation}
      onPointerOver={(e) => { e.stopPropagation(); setLocalHover(true); setHoveredObject('PRIMARY'); }}
      onPointerOut={(e) => { e.stopPropagation(); setLocalHover(false); setHoveredObject(null); }}
    >
      {/* Glow Halo */}
      {isHovered && (
        <mesh>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial color="#00d084" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* 1. Main Bus (Hexagonal core) */}
      <Cylinder args={[0.5, 0.5, 2, 6]} rotation={[0, Math.PI/2, 0]} material={goldKapton} />
      
      {/* 2. Solar Arrays (Massive twin wings) */}
      {/* Left Array Wing */}
      <group position={[-2.5, 0, 0]}>
        <Box args={[4, 1.2, 0.05]} material={solarPanelDark} />
        <Box args={[4, 1.25, 0.02]} position={[0, 0, -0.02]} material={spaceAluminum} />
        <Cylinder args={[0.05, 0.05, 1, 8]} position={[2.25, 0, 0]} rotation={[0, 0, Math.PI/2]} material={spaceAluminum} />
      </group>
      {/* Right Array Wing */}
      <group position={[2.5, 0, 0]}>
        <Box args={[4, 1.2, 0.05]} material={solarPanelDark} />
        <Box args={[4, 1.25, 0.02]} position={[0, 0, -0.02]} material={spaceAluminum} />
        <Cylinder args={[0.05, 0.05, 1, 8]} position={[-2.25, 0, 0]} rotation={[0, 0, Math.PI/2]} material={spaceAluminum} />
      </group>

      {/* 3. Communication Dish (High Gain Antenna) */}
      <group position={[0, 1.2, 0]}>
        <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[0, -0.2, 0]} material={spaceAluminum} />
        <Cylinder args={[0.6, 0.1, 0.2, 16]} rotation={[Math.PI, 0, 0]} material={radiatorWhite} />
        <Sphere args={[0.1, 8, 8]} position={[0, 0.15, 0]} material={spaceAluminum} />
      </group>

      {/* 4. Radiator Panels */}
      <Box args={[0.8, 1.8, 0.1]} position={[0, 0, 0.45]} material={radiatorWhite} />
      <Box args={[0.8, 1.8, 0.1]} position={[0, 0, -0.45]} material={radiatorWhite} />

      {/* 5. Instrument Payload Deck (Zenith pointing) */}
      <group position={[0, 1.0, 0]}>
        <Box args={[0.7, 0.2, 0.7]} material={spaceAluminum} />
        <Cylinder args={[0.15, 0.15, 0.4, 8]} position={[0.2, 0.2, 0.2]} material={goldKapton} />
        <Box args={[0.2, 0.3, 0.2]} position={[-0.2, 0.15, -0.2]} material={spaceAluminum} />
      </group>

      {/* 6. Propulsion Deck (Aft) */}
      <Cylinder args={[0.45, 0.45, 0.1, 6]} position={[0, -0.8, 0]} material={spaceAluminum} />
      {/* Main Engine Nozzle */}
      <group position={[0, -1.0, 0]}>
        <Cylinder args={[0.1, 0.2, 0.3, 16]} material={spaceAluminum} />
        {/* Animated Thruster Plume */}
        {isBurning && (
          <mesh position={[0, -0.6, 0]}>
            <coneGeometry args={[0.25, 1.2, 16]} />
            <meshBasicMaterial 
              color="#00f0ff" 
              transparent 
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
      
      {/* RCS Thruster Pods */}
      {[0, Math.PI/2, Math.PI, 3*Math.PI/2].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]} position={[0.4, -0.75, 0]}>
          <Box args={[0.1, 0.1, 0.1]} material={spaceAluminum} />
          <Cylinder args={[0.02, 0.04, 0.05, 8]} position={[0.05, 0, 0]} rotation={[0, 0, Math.PI/2]} material={spaceAluminum} />
          <Cylinder args={[0.02, 0.04, 0.05, 8]} position={[0, -0.05, 0]} material={spaceAluminum} />
        </group>
      ))}

      {showLabel && (
        <Html position={[0, -2, 0]} center className="pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border backdrop-blur-md transition-colors ${isHovered ? 'bg-[#00d084]/30 border-[#00d084] shadow-[0_0_15px_rgba(0,208,132,0.4)]' : 'bg-[#00d084]/10 border-[#00d084]/50'}`}
          >
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#00d084]" />
            <span className="text-[11px] font-bold text-[#00d084] whitespace-nowrap tracking-wider">AURA-1 (PRIMARY)</span>
            {isHovered && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-col ml-2 border-l border-[#00d084]/50 pl-2 gap-0.5 mt-1 overflow-hidden">
                <span className="text-[9px] font-mono text-white">ID: 2025-A1-001</span>
                <span className="text-[9px] font-mono text-white">VEL: 7.66 km/s</span>
                <span className="text-[9px] font-mono text-white">ALT: 400.2 km</span>
                <span className="text-[9px] font-mono text-[#00d084]">SYS: NOMINAL</span>
                <span className="text-[9px] font-mono text-white">FUEL: 87%</span>
                <span className="text-[9px] font-mono text-[#ff3c3c]">TCA: T-12h</span>
              </motion.div>
            )}
          </motion.div>
        </Html>
      )}
    </group>
  );
}
