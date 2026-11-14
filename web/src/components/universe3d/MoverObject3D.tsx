"use client";

import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { MoverCandidate, EpochInfo } from "@/types";
import { raDecToVector3, CELESTIAL_SPHERE_RADIUS } from "./coords3d";

interface MoverObject3DProps {
  mover: MoverCandidate;
  isSelected: boolean;
  onSelect: (objectId: string) => void;
  epochIndex: number;
  epochs: EpochInfo[];
  showLabels?: boolean;
}

export function MoverObject3D({
  mover,
  isSelected,
  onSelect,
  epochIndex,
  epochs,
  showLabels = true,
}: MoverObject3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isKnown = mover.type === "known";
  const primaryColor = isKnown ? "#27D9D0" : "#F5A742"; // Ion cyan vs Solar amber
  const displayName = mover.match_name || mover.object_id;

  // Determine current position based on active epoch detection or fallback to base ra/dec
  const activeEpoch = epochs[epochIndex];
  const activeDetection = activeEpoch
    ? mover.detections.find((d) => d.epoch_id === activeEpoch.epoch_id)
    : null;

  const currentRa = activeDetection ? activeDetection.ra : mover.ra;
  const currentDec = activeDetection ? activeDetection.dec : mover.dec;

  // Place object directly on the celestial sphere
  const worldPos = useMemo(() => {
    return raDecToVector3(currentRa, currentDec, CELESTIAL_SPHERE_RADIUS * 0.985);
  }, [currentRa, currentDec]);

  // Compute direction pointing towards the center of the sphere
  const lookAtCenter = useMemo(() => {
    const v = worldPos.clone().normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v);
    return q;
  }, [worldPos]);

  // Procedural asteroid geometry for known dwarf planet / asteroid (Ceres)
  const asteroidGeometry = useMemo(() => {
    const geom = new THREE.DodecahedronGeometry(1.2, 3);
    const pos = geom.attributes.position;
    // Apply deterministic cratering/noise displacement
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + y * y + z * z);
      // Pseudo noise
      const noise =
        Math.sin(x * 3.5) * Math.cos(y * 3.2) * 0.18 +
        Math.sin(z * 4.1 + y * 2.1) * 0.12;
      const factor = (dist + noise) / dist;
      pos.setXYZ(i, x * factor, y * factor, z * factor);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Frame animations (rotation, pulsing targeting ring, hover float)
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
      const scale = isSelected ? 1.4 : isHovered ? 1.25 : 1.0;
      const pulse = 1.0 + Math.sin(state.clock.getElapsedTime() * 3.0) * 0.08;
      ringRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.x += delta * 0.3;
    }
  });

  return (
    <group
      ref={meshRef}
      position={worldPos}
      quaternion={lookAtCenter}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(mover.object_id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setIsHovered(false);
        if (typeof document !== "undefined") document.body.style.cursor = "auto";
      }}
    >
      {/* 1. 3D Body Representation */}
      {isKnown ? (
        // Known Dwarf Planet / Asteroid 3D Mesh (e.g. 1 Ceres)
        <mesh ref={coreRef} geometry={asteroidGeometry}>
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.85}
            metalness={0.15}
            emissive="#101B46"
            emissiveIntensity={0.2}
          />
        </mesh>
      ) : (
        // Unknown Mover / Planet X Candidate Holographic Core
        <mesh ref={coreRef}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color="#F5A742"
            emissive="#F5A742"
            emissiveIntensity={0.9}
            wireframe
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* 2. Soft Luminous Glow Corona / Point Light */}
      <pointLight
        color={primaryColor}
        intensity={isSelected ? 3.5 : isHovered ? 2.0 : 0.8}
        distance={15}
        decay={2}
      />

      {/* 3. Futuristic NASA Eyes Targeting Reticle Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.2]}>
        <ringGeometry args={[0.9, 1.05, 32]} />
        <meshBasicMaterial
          color={primaryColor}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.45}
        />
      </mesh>

      {/* 4. Crosshair Tick Marks for Targeting */}
      <group position={[0, 0, 0.2]}>
        {[-1.3, 1.3].map((offset, i) => (
          <React.Fragment key={i}>
            <mesh position={[offset, 0, 0]}>
              <boxGeometry args={[0.25, 0.04, 0.01]} />
              <meshBasicMaterial color={primaryColor} />
            </mesh>
            <mesh position={[0, offset, 0]}>
              <boxGeometry args={[0.04, 0.25, 0.01]} />
              <meshBasicMaterial color={primaryColor} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 5. 3D Interactive Billboard Badge & Telemetry Label */}
      {showLabels && (
        <Html
          position={[0, isKnown ? -1.6 : 1.6, 0]}
          center
          className="pointer-events-none select-none whitespace-nowrap transition-transform duration-200"
        >
          <div
            className={`flex flex-col items-center gap-1 transition-all ${
              isSelected
                ? "scale-110 z-40"
                : isHovered
                ? "scale-105 z-30"
                : "scale-100 z-10"
            }`}
          >
            {/* Primary Name & Icon Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-2xl transition-all whitespace-nowrap ${
                isKnown
                  ? "bg-black/85 border-cyan-400 text-cyan-200 shadow-cyan-950/70"
                  : "bg-black/85 border-amber-400 text-amber-200 shadow-amber-950/70"
              } ${isSelected ? "ring-2 ring-white" : ""}`}
            >
              <span className="text-[10px] leading-none">
                {isKnown ? "●" : "◆"}
              </span>
              <span className="text-xs font-sans font-bold tracking-wide text-white">
                {displayName}
              </span>
              <span
                className={`text-[8px] font-mono uppercase px-1 rounded ${
                  isKnown ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {mover.type}
              </span>
            </div>

            {/* Hover Telemetry HUD Dossier */}
            {(isHovered || isSelected) && (
              <div className="p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/15 text-left text-[10px] font-mono text-white/80 shadow-2xl space-y-1 min-w-[160px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-white/40 uppercase">Confidence</span>
                  <span className="font-bold text-white">
                    {(mover.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 uppercase">Motion Rate</span>
                  <span className="font-semibold text-cyan-300">
                    {Math.hypot(
                      mover.motion.ra_rate_arcsec_per_day,
                      mover.motion.dec_rate_arcsec_per_day
                    ).toFixed(1)}
                    &quot;/d
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-white/50">
                  <span>RA {currentRa.toFixed(4)}°</span>
                  <span>Dec {currentDec >= 0 ? `+${currentDec.toFixed(4)}` : currentDec.toFixed(4)}°</span>
                </div>
                {mover.is_synthetic && (
                  <div className="pt-0.5 text-[8px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-slate-400" />
                    <span>SYNTHETIC TEST BENCHMARK</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
