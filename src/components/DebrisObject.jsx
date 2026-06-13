import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../state/store';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

export default function DebrisObject({ scale = 1, showLabel = false }) {
  const meshRef = useRef();
  const hoveredObject = useStore(s => s.hoveredObject);
  const setHoveredObject = useStore(s => s.setHoveredObject);
  const [localHover, setLocalHover] = useState(false);

  const isHovered = hoveredObject === 'SECONDARY' || localHover;

  // Generate a random, jagged geometry for the debris
  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 1);
    
    // Perturb vertices to make it look broken/irregular
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setXYZ(
        i,
        positions.getX(i) + (Math.random() - 0.5) * 0.4,
        positions.getY(i) + (Math.random() - 0.5) * 0.4,
        positions.getZ(i) + (Math.random() - 0.5) * 0.4
      );
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#444444',
      roughness: 0.9,
      metalness: 0.8,
      flatShading: true,
      emissive: isHovered ? '#ff3c3c' : '#000000',
      emissiveIntensity: isHovered ? 0.3 : 0
    });
  }, [isHovered]);

  // Spin the debris randomly
  const rotationSpeed = useMemo(() => {
    return new THREE.Vector3(
      (Math.random() - 0.5) * 0.05,
      (Math.random() - 0.5) * 0.05,
      (Math.random() - 0.5) * 0.05
    );
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed.x;
      meshRef.current.rotation.y += rotationSpeed.y;
      meshRef.current.rotation.z += rotationSpeed.z;
    }
  });

  return (
    <group
      scale={isHovered ? scale * 1.5 : scale}
      onPointerOver={(e) => { e.stopPropagation(); setLocalHover(true); setHoveredObject('SECONDARY'); }}
      onPointerOut={(e) => { e.stopPropagation(); setLocalHover(false); setHoveredObject(null); }}
    >
      {/* Glow Halo */}
      {isHovered && (
        <mesh>
          <sphereGeometry args={[4, 32, 32]} />
          <meshBasicMaterial color="#ff3c3c" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      <mesh ref={meshRef} geometry={geometry} material={material} />

      {showLabel && (
        <Html position={[0, -2, 0]} center className="pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded border backdrop-blur-md transition-colors ${isHovered ? 'bg-[#ff3c3c]/30 border-[#ff3c3c] shadow-[0_0_15px_rgba(255,60,60,0.4)]' : 'bg-[#ff3c3c]/10 border-[#ff3c3c]/50'}`}
          >
            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[#ff3c3c]" />
            <span className="text-[11px] font-bold text-[#ff3c3c] whitespace-nowrap tracking-wider">THREAT OBJECT</span>
            {isHovered && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex flex-col ml-2 border-l border-[#ff3c3c]/50 pl-2 gap-0.5 mt-1 overflow-hidden">
                <span className="text-[9px] font-mono text-white">ID: 1998-ROCK-7721</span>
                <span className="text-[9px] font-mono text-white">VEL: 8.12 km/s</span>
                <span className="text-[9px] font-mono text-white">ALT: 400.1 km</span>
                <span className="text-[9px] font-mono text-[#ff3c3c]">TYPE: FRAG</span>
                <span className="text-[9px] font-mono text-white">MASS: UNKNOWN</span>
                <span className="text-[9px] font-mono text-[#ff3c3c]">TCA: T-12h</span>
              </motion.div>
            )}
          </motion.div>
        </Html>
      )}
    </group>
  );
}
