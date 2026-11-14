"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface StarField3DProps {
  count?: number;
  radius?: number;
}

export function StarField3D({ count = 6000, radius = 250 }: StarField3DProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Spectral star colors (O, B, A, F, G, K, M stellar classifications)
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    const spectralPalette = [
      new THREE.Color("#dbeafe"), // O/B Blue-white (Hot, luminous)
      new THREE.Color("#f8fafc"), // A Pure White
      new THREE.Color("#fef08a"), // F Yellow-white
      new THREE.Color("#fed7aa"), // G Yellow (Solar-type)
      new THREE.Color("#fdba74"), // K Orange
      new THREE.Color("#fca5a5"), // M Red dwarf
      new THREE.Color("#27D9D0"), // Ion cyan tinted interstellar reflection
      new THREE.Color("#c084fc"), // Subtle ultraviolet/violet tint
    ];

    let seed = 1337;
    const pseudoRandom = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      // Uniform distribution on spherical shells with radial thickness for parallax depth
      const u = pseudoRandom();
      const v = pseudoRandom();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // Depth layers: 70% deep background, 25% mid-ground, 5% foreground
      let layerRadius = radius;
      const layerPick = pseudoRandom();
      if (layerPick < 0.7) {
        layerRadius = radius * (0.85 + pseudoRandom() * 0.4);
      } else if (layerPick < 0.95) {
        layerRadius = radius * (0.55 + pseudoRandom() * 0.3);
      } else {
        layerRadius = radius * (0.35 + pseudoRandom() * 0.2);
      }

      const sinPhi = Math.sin(phi);
      pos[i * 3] = layerRadius * sinPhi * Math.cos(theta);
      pos[i * 3 + 1] = layerRadius * Math.cos(phi);
      pos[i * 3 + 2] = layerRadius * sinPhi * Math.sin(theta);

      // Magnitude distribution: Power-law (fewer bright, many faint)
      const magPick = Math.pow(pseudoRandom(), 2.8);
      const isAnchorStar = pseudoRandom() < 0.02;
      sz[i] = isAnchorStar ? 3.5 + pseudoRandom() * 2.0 : 0.8 + (1.0 - magPick) * 2.2;
      // Color selection
      const color = isAnchorStar
        ? spectralPalette[0] // Anchor stars bright blue-white
        : spectralPalette[Math.floor(pseudoRandom() * spectralPalette.length)];

      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }

    return {
      positions: pos,
      colors: col,
      sizes: sz,
    };
  }, [count, radius]);

  // Gentle starfield rotation and twinkle animation
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.003;
      pointsRef.current.rotation.x += delta * 0.001;
    }
  });

  // Procedural circular star particle texture for soft luminous edges
  const starTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    grad.addColorStop(0.5, "rgba(200, 230, 255, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation
        map={starTexture || undefined}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
