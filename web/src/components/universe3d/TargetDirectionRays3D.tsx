"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { MoverCandidate } from "@/types";
import { CHALLENGE_TARGETS } from "@/data/targets";
import { raDecToSceneVector } from "@/lib/solarEphemeris";

export interface TargetDirectionRays3DProps {
  earthPosition: [number, number, number];
  movers: MoverCandidate[];
  selectedObjectId?: string | null;
  onSelectTarget: (target: {
    id: string;
    ra: number;
    dec: number;
    name: string;
    isMover: boolean;
  }) => void;
  showRays?: boolean;
  sphereRadius?: number;
}

export function TargetDirectionRays3D({
  earthPosition,
  movers,
  selectedObjectId,
  onSelectTarget,
  showRays = true,
  sphereRadius = 85.0,
}: TargetDirectionRays3DProps) {
  const earthVec = useMemo(
    () => new THREE.Vector3(...earthPosition),
    [earthPosition]
  );

  // Combine movers and challenge targets
  const targets = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      ra: number;
      dec: number;
      isMover: boolean;
      isKnown: boolean;
      isSynthetic: boolean;
      category?: string;
      color: string;
      endpoint: THREE.Vector3;
    }> = [];

    // 1. SPHEREx Mover candidates (from catalog)
    for (const m of movers) {
      const isKnown = m.type === "known";
      const color = isKnown ? "#22D3EE" : "#E0A526";
      const [ex, ey, ez] = raDecToSceneVector(m.ra, m.dec, sphereRadius);
      list.push({
        id: m.object_id,
        name: m.match_name || m.object_id,
        ra: m.ra,
        dec: m.dec,
        isMover: true,
        isKnown,
        isSynthetic: !!m.is_synthetic,
        color,
        endpoint: new THREE.Vector3(ex, ey, ez),
      });
    }

    // 2. Challenge Targets (Barnard's Star, WISE 0855, etc.)
    for (const ct of CHALLENGE_TARGETS) {
      const [cx, cy, cz] = raDecToSceneVector(ct.ra, ct.dec, sphereRadius);
      list.push({
        id: `target-${ct.name.replace(/\s+/g, "-").toLowerCase()}`,
        name: ct.name,
        ra: ct.ra,
        dec: ct.dec,
        isMover: false,
        isKnown: true,
        isSynthetic: false,
        category: ct.category,
        color: "#67E8F9", // Bright celestial cyan
        endpoint: new THREE.Vector3(cx, cy, cz),
      });
    }

    return list;
  }, [movers, sphereRadius]);

  if (!showRays) return null;

  return (
    <group name="target-direction-rays">
      {targets.map((tgt) => {
        const isSelected = selectedObjectId === tgt.id;

        // Create line geometry from Earth to the celestial sphere endpoint
        const points = [earthVec, tgt.endpoint];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <group key={`target-ray-${tgt.id}`}>
            {/* 1. Thin Line-of-sight Ray from Earth */}
            <primitive
              object={
                new THREE.Line(
                  lineGeom,
                  new THREE.LineBasicMaterial({
                    color: tgt.color,
                    transparent: true,
                    opacity: isSelected ? 0.95 : 0.45,
                    linewidth: 1,
                  })
                )
              }
            />

            {/* 2. Direction Indicator Marker on Celestial Sphere */}
            <mesh position={tgt.endpoint}>
              <sphereGeometry args={[isSelected ? 0.6 : 0.4, 12, 12]} />
              <meshBasicMaterial color={tgt.color} />
            </mesh>

            {/* 3. HTML Label with Honest Science Cue */}
            <Html
              position={[tgt.endpoint.x, tgt.endpoint.y + 1.2, tgt.endpoint.z]}
              center
              distanceFactor={45}
              className="pointer-events-auto select-none"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTarget({
                    id: tgt.id,
                    ra: tgt.ra,
                    dec: tgt.dec,
                    name: tgt.name,
                    isMover: tgt.isMover,
                  });
                }}
                className={`group flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] backdrop-blur-md transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[rgba(34,211,238,0.25)] border-[#22D3EE] text-white shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                    : "bg-black/80 hover:bg-black/95 border-white/[0.12] hover:border-white/30 text-white/90"
                }`}
                title="Direction only. Distance unknown. Click to dive to 2D survey."
              >
                {/* Non-colour symbol */}
                <span
                  className="text-[9px] leading-none"
                  style={{ color: tgt.color }}
                >
                  {tgt.isMover ? (tgt.isKnown ? "●" : "◆") : "⬡"}
                </span>

                {/* Uppercase wide-tracked name */}
                <span className="font-sans font-medium text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">
                  {tgt.name}
                </span>

                {/* TEST DATA indicator */}
                {tgt.isSynthetic && (
                  <span className="px-1 text-[7px] font-mono font-bold bg-[#94A3B8]/20 text-[#94A3B8] border border-[#94A3B8]/30 rounded-[1px] tracking-wider">
                    TEST
                  </span>
                )}

                {/* Direction only cue badge */}
                <span className="text-[7.5px] font-mono text-[#B8BCC4]/70 hidden group-hover:inline">
                  [RAY: DIR ONLY]
                </span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

