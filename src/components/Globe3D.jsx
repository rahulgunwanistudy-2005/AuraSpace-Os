import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { propagateTLE } from '../orbital/sgp4';
import { Engine } from '../orbital/OrbitalEngine';
import AuraSatellite from './AuraSatellite';
import DebrisObject from './DebrisObject';

function generateOrbitPath(tle1, tle2, hours, steps) {
  const points = [];
  const TARGET_DATE = new Date('2026-06-10T12:00:00Z');
  const startMs = TARGET_DATE.getTime() - (hours/2)*3600*1000;
  for (let i=0; i<=steps; i++) {
    const d = new Date(startMs + (hours * 3600 * 1000 * i) / steps);
    const state = propagateTLE(tle1, tle2, d);
    if (state && state.position) {
      points.push(new THREE.Vector3(state.position.x/1000, state.position.y/1000, state.position.z/1000));
    }
  }
  return points;
}

import { useStore } from '../state/store';

import MonteCarloCloud from './MonteCarloCloud';

export default function Globe3D({ scenario }) {
  const earthGroupRef = useRef();
  const cloudsRef = useRef();
  const atmosphereRef = useRef();
  const judgeModeStep = useStore(s => s.judgeModeStep);
  const lightingMode = useStore(s => s.lightingMode);
  const engineState = useStore(s => s.engineState);

  const [colorMap, normalMap, specularMap, cloudsMap, nightMap] = useTexture([
    '/textures/earth_diffuse.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
    '/textures/earth_night.png'
  ]);

  useFrame((state, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025;
    }

    if (customMaterialRef.current?.userData?.shader) {
      const isCinematic = lightingMode === 'CINEMATIC';
      const targetSunDir = isCinematic 
        ? new THREE.Vector3(-20, 5, -15).normalize() 
        : new THREE.Vector3(-10, 5, 10).normalize();
      
      customMaterialRef.current.userData.shader.uniforms.sunDirection.value.lerp(targetSunDir, delta * 2);
      customMaterialRef.current.userData.shader.uniforms.viewVector.value.copy(state.camera.position).normalize();
      customMaterialRef.current.userData.shader.uniforms.time.value = state.clock.elapsedTime;
    }
    
    if (cloudsRef.current?.material?.userData?.shader) {
      const isCinematic = lightingMode === 'CINEMATIC';
      const targetSunDir = isCinematic 
        ? new THREE.Vector3(-20, 5, -15).normalize() 
        : new THREE.Vector3(-10, 5, 10).normalize();
      cloudsRef.current.material.userData.shader.uniforms.sunDirection.value.lerp(targetSunDir, delta * 2);
    }

    if (atmosphereRef.current?.material?.uniforms?.sunDirection) {
      const isCinematic = lightingMode === 'CINEMATIC';
      const targetSunDir = isCinematic 
        ? new THREE.Vector3(-20, 5, -15).normalize() 
        : new THREE.Vector3(-10, 5, 10).normalize();
      atmosphereRef.current.material.uniforms.sunDirection.value.lerp(targetSunDir, delta * 2);
    }
  });

  const orbit1 = React.useMemo(() => generateOrbitPath(scenario.tlePrimary[0], scenario.tlePrimary[1], 2, 200), [scenario]);
  const orbit2 = React.useMemo(() => generateOrbitPath(scenario.tleChaser[0], scenario.tleChaser[1], 2, 200), [scenario]);

  const baseState1 = Engine.baseState1;
  const baseState2 = Engine.baseState2;

  const isDanger = judgeModeStep >= 4 && judgeModeStep < 9;

  // Custom shader logic to mix day and night maps based on light direction
  const customMaterialRef = useRef();

  return (
    <group ref={earthGroupRef} scale={1.8} rotation={[0.2, 0, 0]}>
      
      {/* AAA Photorealistic Earth Core */}
      <mesh>
        <sphereGeometry args={[6.3, 128, 128]} />
        <meshStandardMaterial 
          ref={customMaterialRef}
          map={colorMap}
          normalMap={normalMap}
          normalScale={[1.5, 1.5]}
          roughness={1.0}
          metalness={0.0}
          onBeforeCompile={(shader) => {
            shader.uniforms.tNight = { value: nightMap };
            shader.uniforms.tSpecular = { value: specularMap };
            shader.uniforms.tClouds = { value: cloudsMap };
            shader.uniforms.sunDirection = { value: new THREE.Vector3(-10, 5, 10).normalize() };
            shader.uniforms.viewVector = { value: new THREE.Vector3(0, 0, 1) };
            shader.uniforms.time = { value: 0 };
            customMaterialRef.current.userData.shader = shader;
            
            shader.fragmentShader = `
              uniform sampler2D tNight;
              uniform sampler2D tSpecular;
              uniform sampler2D tClouds;
              uniform vec3 sunDirection;
              uniform vec3 viewVector;
              uniform float time;
              
              // Simplex noise for Aurora
              vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
              vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
              vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
              float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute(permute(permute(
                           i.z + vec4(0.0, i1.z, i2.z, 1.0))
                         + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                         + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
              }
            ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
              `#include <emissivemap_fragment>`,
              `
              #include <emissivemap_fragment>
              // Correctly transform sun direction to view space for accurate lighting math
              vec3 viewSunDir = normalize((viewMatrix * vec4(sunDirection, 0.0)).xyz);
              float intensity = dot(vNormal, viewSunDir);
              
              // 3-Stage Twilight Terminator
              float dayMix = smoothstep(-0.25, 0.25, intensity);
              
              // Subtle sunset terminator (scattering across atmosphere at the boundary)
              float sunsetBand = smoothstep(-0.15, 0.05, intensity) - smoothstep(0.05, 0.25, intensity);
              vec3 sunsetColor = vec3(0.8, 0.35, 0.15) * sunsetBand * 0.8; // Kept subtle to avoid the thick yellow ring
              
              // Procedural Cloud Shadows
              // We project the cloud texture slightly offset based on sun direction
              vec2 shadowUvOffset = normalize(viewSunDir.xy) * 0.003;
              float cloudShadow = texture2D(tClouds, vMapUv + shadowUvOffset).r;
              // Soften the shadow so it doesn't crush the diffuse color into pitch black
              float shadowMask = 1.0 - (cloudShadow * 0.5 * dayMix);
              diffuseColor.rgb *= shadowMask;
              
              // Apply sunset color as an emissive additive to the terminator
              totalEmissiveRadiance += sunsetColor * diffuseColor.rgb; // Blends with surface naturally

              // Night City Lights
              vec4 nightColor = texture2D(tNight, vMapUv);
              // Crush the blacks so oceans stay dark, boost the brights for warm amber lights
              vec3 crushedNight = pow(nightColor.rgb, vec3(2.0));
              vec3 cityLights = crushedNight * vec3(1.0, 0.8, 0.4) * 6.0; 
              // Fade lights in gracefully as it enters twilight
              totalEmissiveRadiance += cityLights * (1.0 - smoothstep(-0.15, 0.1, intensity));

              // Ocean Specular Mask
              vec4 specMap = texture2D(tSpecular, vMapUv);
              float isOcean = specMap.r; 

              // Physically Based Ocean System
              // Fresnel reflection: stronger at glancing angles (limb), weaker at nadir (center)
              float fresnelOcean = pow(1.0 - max(dot(vNormal, normalize(viewVector)), 0.0), 4.0);
              // Deep blue ocean coloration for glancing reflections
              vec3 oceanReflection = vec3(0.02, 0.1, 0.3) * fresnelOcean * isOcean * dayMix * 0.6;
              
              // Dynamic Sun Glints
              vec3 halfVector = normalize(viewSunDir + normalize(viewVector));
              float NdotH = max(0.0, dot(vNormal, halfVector));
              
              // Tight, high-power specular highlight for water
              float sunGlint = pow(NdotH, 600.0) * isOcean * dayMix * max(fresnelOcean, 0.3) * 2.0;
              sunGlint += pow(NdotH, 80.0) * isOcean * sunsetBand * 0.4; // Softer, wider scatter during sunset

              // Optional Realistic Auroras (Subtle)
              float absLat = abs(vMapUv.y - 0.5) * 2.0; 
              float auroraBand = smoothstep(0.75, 0.85, absLat) - smoothstep(0.85, 0.98, absLat);
              float auroraNoise = snoise(vec3(vMapUv.x * 20.0 + time * 0.05, vMapUv.y * 20.0, time * 0.1));
              float auroraIntensity = smoothstep(0.4, 0.7, auroraNoise) * auroraBand * (1.0 - smoothstep(-0.2, 0.0, intensity));
              vec3 auroraColor = mix(vec3(0.1, 0.7, 0.4), vec3(0.2, 0.1, 0.6), snoise(vec3(vMapUv.x * 10.0, vMapUv.y * 10.0, time * 0.2)));
              
              totalEmissiveRadiance += auroraColor * auroraIntensity * 0.2; // Very subtle so it doesn't overpower

              totalEmissiveRadiance += oceanReflection + vec3(sunGlint);
              `
            );
          }}
        />
      </mesh>

      {/* High-Res Volumetric Clouds */}
      <mesh ref={cloudsRef} scale={1.012} receiveShadow castShadow>
        <sphereGeometry args={[6.3, 128, 128]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.85}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.FrontSide}
          roughness={1.0}
          onBeforeCompile={(shader) => {
            shader.uniforms.sunDirection = { value: new THREE.Vector3(-10, 5, 10).normalize() };
            cloudsRef.current.material.userData.shader = shader;
            
            shader.fragmentShader = `
              uniform vec3 sunDirection;
            ` + shader.fragmentShader;
            
            shader.fragmentShader = shader.fragmentShader.replace(
              `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
              `
              // Cloud self-shadowing & terminator fade
              vec3 viewSunDir = normalize((viewMatrix * vec4(sunDirection, 0.0)).xyz);
              float lightDot = dot(vNormal, viewSunDir);
              float cloudShadow = smoothstep(-0.1, 0.3, lightDot);
              vec3 finalCloudLight = outgoingLight * (0.1 + 0.9 * cloudShadow);
              gl_FragColor = vec4(finalCloudLight, diffuseColor.a);
              `
            );
          }}
        />
      </mesh>

      {/* Advanced Atmospheric Scattering (Rayleigh/Mie approximation) */}
      <Sphere args={[6.35, 64, 64]} ref={atmosphereRef}>
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            sunDirection: { value: new THREE.Vector3(-10, 5, 10).normalize() }
          }}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
               vNormal = normalize(normalMatrix * normal);
               vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
               vViewPosition = -mvPosition.xyz;
               gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 sunDirection;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
              vec3 viewDir = normalize(vViewPosition);
              // Thin, elegant NASA blue rim
              float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 6.0);
              
              // Illuminate atmosphere softly on day side, with subtle scatter into dusk
              vec3 viewSunDir = normalize((viewMatrix * vec4(sunDirection, 0.0)).xyz);
              float dayIntensity = max(0.0, dot(vNormal, viewSunDir));
              float dayMix = smoothstep(-0.2, 0.5, dayIntensity);
              
              vec3 atmColor = vec3(0.05, 0.45, 1.0); // NASA blue
              gl_FragColor = vec4(atmColor, fresnel * dayMix * 1.2);
            }
          `}
        />
      </Sphere>
      
      {/* Cinematic Glowing Orbit Trails */}
      <Line 
        points={orbit1} 
        color="#00f0ff" 
        lineWidth={2} 
        transparent 
        opacity={0.2} 
        toneMapped={false} 
      />
      <Line 
        points={orbit2} 
        color={scenario.tier === 'Critical' ? '#ff003c' : '#ffb400'} 
        lineWidth={2} 
        opacity={0.3} 
        transparent 
        toneMapped={false} 
      />

      {/* AAA Hero Satellites / Debris Models */}
      {baseState1?.position && (
        <group position={[baseState1.position.x/1000, baseState1.position.y/1000, baseState1.position.z/1000]}>
          <AuraSatellite scale={0.06} />
        </group>
      )}
      
      {baseState2?.position && (
        <group position={[baseState2.position.x/1000, baseState2.position.y/1000, baseState2.position.z/1000]}>
          <DebrisObject scale={0.04} />
          
          {engineState?.isSingular && (
            <MonteCarloCloud position={[0, 0, 0]} count={10000} isCritical={scenario.tier === 'Critical'} />
          )}

          {/* Danger Glow (Intensifies during Cinematic) */}
          <Sphere args={[isDanger ? 0.2 : 0.1, 16, 16]}>
             <meshBasicMaterial color={scenario.tier === 'Critical' ? '#ff003c' : '#ffb400'} transparent opacity={isDanger ? 0.6 : 0.2} toneMapped={false} />
          </Sphere>
          {isDanger && (
            <pointLight color="#ff003c" intensity={5} distance={5} />
          )}
        </group>
      )}

      {/* Cinematic Risk Corridor & TCA Visualization */}
      {isDanger && baseState1?.position && baseState2?.position && (() => {
        const pcValue = engineState?.Pc || 1e-6;
        // Normalize log(Pc) between 1e-6 (0.0) and 1e-2 (1.0)
        const normalizedRisk = Math.min(Math.max(Math.log10(pcValue) + 6, 0) / 4, 1);
        
        const corridorColor = new THREE.Color().lerpColors(
          new THREE.Color('#ffb400'), // Amber
          new THREE.Color('#ff003c'), // Red
          normalizedRisk
        ).getHexString();
        
        const corridorWidth = 1.0 + (normalizedRisk * 6.0); // Scales from 1.0 to 7.0

        return (
          <group>
            <Line 
              points={[
                [baseState1.position.x/1000, baseState1.position.y/1000, baseState1.position.z/1000],
                [baseState2.position.x/1000, baseState2.position.y/1000, baseState2.position.z/1000]
              ]} 
              color={`#${corridorColor}`} 
              lineWidth={corridorWidth} 
              transparent 
              opacity={0.8 + (normalizedRisk * 0.2)} 
              toneMapped={false} 
            />
          <Sphere position={[
              (baseState1.position.x/1000 + baseState2.position.x/1000) / 2,
              (baseState1.position.y/1000 + baseState2.position.y/1000) / 2,
              (baseState1.position.z/1000 + baseState2.position.z/1000) / 2
            ]} args={[0.05, 8, 8]}>
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.5} />
          </Sphere>
          {baseState2?.velocity && (
            <Line 
              points={[
                [baseState2.position.x/1000, baseState2.position.y/1000, baseState2.position.z/1000],
                [
                  baseState2.position.x/1000 + baseState2.velocity.x/200, 
                  baseState2.position.y/1000 + baseState2.velocity.y/200, 
                  baseState2.position.z/1000 + baseState2.velocity.z/200
                ]
              ]} 
              color="#ffb400" 
              lineWidth={1.5} 
              transparent 
              opacity={0.9} 
              toneMapped={false} 
            />
          )}
        </group>
        );
      })()}
    </group>
  );
}
