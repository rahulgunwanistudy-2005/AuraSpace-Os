import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// --- Energy Ribbon ---
const ribbonVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ribbonFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float speed;
  uniform float direction; // 1.0 or -1.0
  uniform float opacityBase;
  varying vec2 vUv;

  void main() {
    // Scroll along the U axis
    float scroll = fract(vUv.x * 20.0 + time * speed * direction);
    
    // Core glow and edge fading
    float edgeFade = sin(vUv.y * 3.14159);
    
    // Create pulses
    float pulse = smoothstep(0.4, 0.6, scroll) * smoothstep(0.8, 0.6, scroll);
    
    // Fade out at ends
    float endFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    
    float alpha = pulse * edgeFade * endFade * opacityBase;
    
    gl_FragColor = vec4(color, alpha * 0.8);
  }
`;

export function EnergyRibbon({ points, color = "#00f0ff", speed = 2.0, direction = 1.0, radius = 0.02, opacity = 1.0 }) {
  const materialRef = useRef();

  const curve = useMemo(() => {
    if (!points || points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  if (!curve) return null;

  return (
    <mesh>
      <tubeGeometry args={[curve, 128, radius, 8, false]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color(color) },
          speed: { value: speed },
          direction: { value: direction },
          opacityBase: { value: opacity }
        }}
        vertexShader={ribbonVertexShader}
        fragmentShader={ribbonFragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// --- Conjunction Bubble ---
const bubbleVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const bubbleFragmentShader = `
  uniform vec3 color;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    // Fresnel for the edge glow
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
    
    // Soft breathing core
    float breathe = (sin(time * 2.0) * 0.5 + 0.5) * 0.2;
    float alpha = fresnel * 0.8 + breathe;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ConjunctionBubble({ position, radius = 0.5, color = "#00aaff" }) {
  const matRef = useRef();
  
  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color(color) }
        }}
        vertexShader={bubbleVertexShader}
        fragmentShader={bubbleFragmentShader}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// --- Collision Corridor ---
export function CollisionCorridor({ startPos, endPos, color, thickness }) {
  const meshRef = useRef();
  const midpointVec = useRef(new THREE.Vector3());
  const dirVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3(0, 1, 0));
  
  const distance = useMemo(() => startPos.distanceTo(endPos), [startPos, endPos]);
  
  useFrame(() => {
    if (meshRef.current) {
      midpointVec.current.addVectors(startPos, endPos).multiplyScalar(0.5);
      meshRef.current.position.copy(midpointVec.current);
      dirVec.current.subVectors(endPos, startPos).normalize();
      meshRef.current.quaternion.setFromUnitVectors(upVec.current, dirVec.current);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[thickness, thickness, distance, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <Html position={startPos.clone().lerp(endPos, 0.5).add(new THREE.Vector3(0, 0.2, 0))} center className="pointer-events-none z-10">
        <div className="bg-[#ff003c]/20 border border-[#ff003c] text-[#ff003c] px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded whitespace-nowrap backdrop-blur-md opacity-80">
          HIGH RISK REGION
        </div>
      </Html>
    </group>
  );
}

// --- Connection Lines ---
export function ConnectionLines({ startPos, endPos, color = "#ffffff", missDistance, orbState }) {
  const curve = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    // Push mid point outwards slightly for an arc
    mid.multiplyScalar(1.1); 
    return new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
  }, [startPos, endPos]);

  const matRef = useRef();
  const textRef = useRef();
  const currentDistanceRef = useRef(missDistance || 421);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime;
    
    if (missDistance !== undefined && textRef.current) {
      currentDistanceRef.current = THREE.MathUtils.lerp(currentDistanceRef.current, missDistance, 0.05);
      const val = Math.round(currentDistanceRef.current).toLocaleString();
      let statusStr = "TOO CLOSE";
      if (orbState === 'MANEUVER_EXECUTION') statusStr = "INCREASING SEPARATION";
      if (['MISSION_SAFE', 'MISSION_SUMMARY'].includes(orbState)) statusStr = "SAFE CLEARANCE";
      
      textRef.current.innerText = statusStr + ' (' + val + ' m)';
    }
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.01, 4, false]} />
        <shaderMaterial
          ref={matRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 },
            color: { value: new THREE.Color(color) },
            speed: { value: 3.0 },
            direction: { value: 1.0 }
          }}
          vertexShader={ribbonVertexShader}
          fragmentShader={ribbonFragmentShader}
        />
      </mesh>
      {missDistance !== undefined && (
        <Html position={curve.getPointAt(0.5)} center className="pointer-events-none z-20">
          <div className="flex flex-col items-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full mb-1 shadow-[0_0_5px_white]"></div>
            <div 
              ref={textRef}
              className="bg-[#13161f]/80 border border-[#2a2f3a] text-white px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded whitespace-nowrap backdrop-blur-md"
            >
              TOO CLOSE ({Math.round(missDistance || 421).toLocaleString()} m)
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// --- TCA Marker ---
export function TCAMarker({ startPos, endPos, orbState }) {
  const matRef = useRef();

  const position = useMemo(() => startPos.clone().lerp(endPos, 0.5), [startPos, endPos]);

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  const isSafe = ['MISSION_SAFE', 'MISSION_SUMMARY'].includes(orbState);
  const color = isSafe ? "#00d084" : "#ff003c";
  const label = isSafe ? "COLLISION AVOIDED" : "POTENTIAL COLLISION";

  return (
    <mesh position={position}>
      <planeGeometry args={[0.5, 0.5]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color(color) }
        }}
        vertexShader={ribbonVertexShader}
        fragmentShader={`
          uniform vec3 color;
          uniform float time;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv - 0.5;
            float dist = length(p) * 2.0;
            if (dist > 1.0) discard;
            
            // Expanding rings
            float ring = fract(dist * 3.0 - time * 2.0);
            float alpha = smoothstep(0.8, 1.0, ring) * smoothstep(1.0, 0.8, ring) * (1.0 - dist);
            
            // Bright core
            float core = smoothstep(0.1, 0.0, dist);
            
            gl_FragColor = vec4(color, alpha + core);
          }
        `}
        side={THREE.DoubleSide}
      />
      <Html center className="pointer-events-none z-30">
        <div className="flex flex-col items-center">
          {/* Pulsing Crosshair */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <div className={`absolute w-full h-full border-2 rounded-full animate-ping opacity-75 ${isSafe ? 'border-[#00d084]' : 'border-[#ff003c]'}`}></div>
            <div className={`absolute w-full h-0.5 ${isSafe ? 'bg-[#00d084]' : 'bg-[#ff003c]'}`}></div>
            <div className={`absolute h-full w-0.5 ${isSafe ? 'bg-[#00d084]' : 'bg-[#ff003c]'}`}></div>
          </div>
          {/* Label */}
          <div className={`mt-2 border px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded whitespace-nowrap backdrop-blur-md ${isSafe ? 'bg-[#00d084]/20 border-[#00d084] text-[#00d084] shadow-[0_0_10px_rgba(0,208,132,0.5)]' : 'bg-[#ff003c]/20 border-[#ff003c] text-[#ff003c] shadow-[0_0_10px_rgba(255,0,60,0.5)]'}`}>
            {label}
          </div>
        </div>
      </Html>
    </mesh>
  );
}

// --- Dissolve Ribbon ---
const dissolveFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float dissolveProgress;
  varying vec2 vUv;
  
  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float noise = snoise(vUv * 15.0 + time * 0.5);
    
    // Dissolve threshold
    if (dissolveProgress > 0.0 && noise < (dissolveProgress * 2.0 - 1.0)) {
      discard;
    }
    
    // Core glow and edge fading
    float edgeFade = sin(vUv.y * 3.14159);
    float alpha = edgeFade * (1.0 - dissolveProgress);
    
    // Glow intensifies at edges of dissolve
    float glow = smoothstep(0.0, 0.1, abs(noise - (dissolveProgress * 2.0 - 1.0))) * 0.5;
    
    gl_FragColor = vec4(color + vec3(glow), alpha);
  }
`;

export function DissolveRibbon({ points, color = "#00f0ff", dissolveProgress = 0.0, radius = 0.03 }) {
  const materialRef = useRef();

  const curve = useMemo(() => {
    if (!points || points.length < 2) return null;
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.dissolveProgress.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.dissolveProgress.value, 
        dissolveProgress, 
        0.05
      );
    }
  });

  if (!curve) return null;

  return (
    <mesh>
      <tubeGeometry args={[curve, 64, radius, 8, false]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          time: { value: 0 },
          color: { value: new THREE.Color(color) },
          dissolveProgress: { value: 0.0 }
        }}
        vertexShader={ribbonVertexShader}
        fragmentShader={dissolveFragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
