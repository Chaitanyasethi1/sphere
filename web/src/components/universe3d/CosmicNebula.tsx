"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CosmicNebulaProps {
  radius?: number;
}

const nebulaVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorIndigo;
  uniform vec3 uColorViolet;
  uniform vec3 uColorBlue;
  uniform vec3 uColorCyan;
  uniform vec3 uColorAmber;

  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;

  // 3D Simplex noise functions
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

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

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
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  // Fractional Brownian Motion for complex galactic clouds
  float fbm(vec3 p) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      total += amplitude * snoise(p * frequency);
      frequency *= 2.05;
      amplitude *= 0.52;
    }
    return total;
  }

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float t = uTime * 0.02;

    // Multi-scale cloud noise
    float cloud1 = fbm(dir * 2.2 + vec3(t * 0.5, t * 0.3, t * 0.2));
    float cloud2 = fbm(dir * 4.5 - vec3(t * 0.2, t * 0.4, 0.5));
    float cloud3 = fbm(dir * 1.2 + vec3(0.0, t * 0.1, 0.0));

    // Combine cloud density
    float density = smoothstep(0.05, 0.65, cloud1 * 0.6 + cloud2 * 0.25 + cloud3 * 0.35);

    // Color gradient mapping: Indigo -> Violet -> Cosmic Blue -> Ion Cyan hints
    vec3 col = mix(uColorIndigo, uColorViolet, smoothstep(-0.2, 0.3, cloud1));
    col = mix(col, uColorBlue, smoothstep(0.1, 0.5, cloud2));
    col = mix(col, uColorCyan, smoothstep(0.4, 0.8, cloud3) * 0.6);

    // Warm solar amber pockets (infrared dust emission)
    float amberMask = smoothstep(0.5, 0.85, fbm(dir * 3.0 + vec3(t, 0.0, -t)));
    col = mix(col, uColorAmber, amberMask * 0.4);

    float alpha = density * 0.38;

    gl_FragColor = vec4(col, alpha);
  }
`;

export function CosmicNebula({ radius = 220 }: CosmicNebulaProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorIndigo: { value: new THREE.Color("#101B46") },
      uColorViolet: { value: new THREE.Color("#39216F") },
      uColorBlue: { value: new THREE.Color("#087EAC") },
      uColorCyan: { value: new THREE.Color("#27D9D0") },
      uColorAmber: { value: new THREE.Color("#F5A742") },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.002;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
