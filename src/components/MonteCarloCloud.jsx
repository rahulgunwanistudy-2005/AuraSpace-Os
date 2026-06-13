import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../state/store';

const cloudVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float time;
  uniform float pulseSpeed;
  
  // Simplex 3D Noise 
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    // Breathing effect
    float noise = snoise(position * 2.0 + time * 0.5);
    float breath = sin(time * pulseSpeed) * 0.05;
    vec3 newPos = position + normal * (noise * 0.05 + breath);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const cloudFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform vec3 color;
  uniform float time;
  uniform float opacityBase;

  void main() {
    // Edge glow (Fresnel)
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
    
    // Density gradient based on local height/position
    float density = smoothstep(0.0, 1.0, 1.0 - length(vPosition));
    
    float alpha = (fresnel * 0.5 + density * 0.5) * opacityBase;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

function ConfidenceShell({ scaleArgs, color, opacity, text, textY, fontSize }) {
  const matRef = useRef();
  
  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <group>
      <mesh scale={scaleArgs}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 },
            color: { value: new THREE.Color(color) },
            opacityBase: { value: opacity },
            pulseSpeed: { value: 2.0 }
          }}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text position={[0, textY, 0]} fontSize={fontSize} color={color} font="https://fonts.gstatic.com/s/firamono/v14/N0bX2SlFPv1weGeLZDtgJv7S.woff" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </group>
  );
}

export default function MonteCarloCloud({ position, scale = 1.0, isCritical = false }) {
  const groupRef = useRef();
  const targetConfidence = useStore(s => s.targetConfidence);
  const activeTimelineIdx = useStore(s => s.activeTimelineIdx);
  const currentScaleRef = useRef(1.0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.z += delta * 0.05;
      
      // Uncertainty shrinks as timeline approaches execution (idx 5)
      // T-72h (idx 0) = max scale. T-0h (idx 5) = min scale.
      const timelineFactor = Math.max(0, (5 - activeTimelineIdx) * 0.5);
      
      // Confidence 30 -> large scale (e.g., 3.0)
      // Confidence 99.9 -> small scale (e.g., 1.0)
      const baseScale = 1.0 + ((100 - targetConfidence) / 70) * 2.0;
      
      const targetScale = baseScale + timelineFactor;
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, 0.05);
      
      const finalScale = currentScaleRef.current * scale;
      groupRef.current.scale.set(finalScale, finalScale, finalScale);
    }
  });

  const sigma1 = [0.15, 0.15, 0.4];
  const sigma2 = [0.3, 0.3, 0.8];
  const sigma3 = [0.6, 0.6, 1.6];

  const baseColor = isCritical ? '#ff003c' : '#ffb400';

  return (
    <group position={position} ref={groupRef}>
      <ConfidenceShell scaleArgs={sigma3} color={baseColor} opacity={0.15} text="99.7%" textY={sigma3[1] + 0.1} fontSize={0.1} />
      <ConfidenceShell scaleArgs={sigma2} color={baseColor} opacity={0.3} text="95%" textY={sigma2[1] + 0.1} fontSize={0.08} />
      <ConfidenceShell scaleArgs={sigma1} color="#ffffff" opacity={0.6} text="68%" textY={sigma1[1] + 0.1} fontSize={0.06} />
      
      {/* Inner Core */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      <Html position={[0, -1.0, 0]} center className="pointer-events-none z-10 w-64">
        <div className="flex flex-col items-center opacity-80">
          <div className="bg-black/80 border border-[#ffb400] text-[#ffb400] px-3 py-1 text-xs font-bold tracking-widest uppercase rounded mb-1 backdrop-blur-md">
            UNCERTAINTY ZONE
          </div>
          <div className="text-[10px] text-white/80 text-center font-mono leading-tight px-2 bg-black/50 rounded py-1 backdrop-blur-md">
            The object may be anywhere inside this region.
          </div>
        </div>
      </Html>
    </group>
  );
}
