import React, { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Moon({ position = [20, 8, -30], scale = 2.0 }) {
  const moonRef = useRef();
  
  const [colorMap, normalMap] = useTexture([
    '/textures/moon_diffuse.jpg',
    '/textures/moon_normal.jpg'
  ]);

  useFrame((state, delta) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += delta * 0.005; // tidally locked, very slow rotation
    }
  });

  return (
    <group position={position} ref={moonRef}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[scale, 128, 128]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={normalMap}
          bumpScale={0.015} // simulate crater depth
          roughness={0.9} // realistic dry regolith
          metalness={0.0}
          onBeforeCompile={(shader) => {
             // Add subtle Earth-shine on the dark side of the moon
             // We know the Earth is roughly at [-6, -2, -16] in the MainCommandDeck
             shader.uniforms.earthPosition = { value: new THREE.Vector3(-6, -2, -16) };
             
             shader.fragmentShader = `
                uniform vec3 earthPosition;
             ` + shader.fragmentShader;

             shader.fragmentShader = shader.fragmentShader.replace(
                `#include <emissivemap_fragment>`,
                `
                #include <emissivemap_fragment>
                
                // Earthshine logic
                // Calculate direction to Earth from this pixel
                vec3 earthDir = normalize(earthPosition - vViewPosition);
                float earthShineIntensity = max(0.0, dot(vNormal, earthDir));
                
                // Dim the earthshine slightly based on the sun's intensity to avoid it competing
                // But realistically, earthshine is always there, just overpowered by sun.
                vec3 earthShineColor = vec3(0.01, 0.03, 0.06) * pow(earthShineIntensity, 2.0);
                
                totalEmissiveRadiance += earthShineColor;
                `
             );
          }}
        />
      </mesh>
    </group>
  );
}
