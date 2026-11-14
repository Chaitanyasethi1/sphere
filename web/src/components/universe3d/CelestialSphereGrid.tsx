"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { CELESTIAL_SPHERE_RADIUS } from "./coords3d";

interface CelestialSphereGridProps {
  radius?: number;
  showLabels?: boolean;
}

export function CelestialSphereGrid({
  radius = CELESTIAL_SPHERE_RADIUS,
  showLabels = true,
}: CelestialSphereGridProps) {
  // Generate coordinate line objects: Equator, Parallels, Hour Meridians, and Ecliptic
  const { equatorLine, parallelLines, meridianLines, eclipticLine } =
    useMemo(() => {
      const segments = 128;

      // 1. Celestial Equator (Dec = 0°)
      const eqPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        eqPoints.push(new THREE.Vector3(radius * Math.cos(theta), 0, -radius * Math.sin(theta)));
      }
      const eqGeom = new THREE.BufferGeometry().setFromPoints(eqPoints);
      const eqLine = new THREE.Line(
        eqGeom,
        new THREE.LineBasicMaterial({ color: "#27D9D0", transparent: true, opacity: 0.45 })
      );

      // 2. Declination Parallels (±20°, ±40°, ±60°, ±80°)
      const parLines: THREE.Line[] = [];
      const decAngles = [-60, -40, -20, 20, 40, 60, 80];
      for (const dec of decAngles) {
        const rad = (dec * Math.PI) / 180;
        const rSub = radius * Math.cos(rad);
        const ySub = radius * Math.sin(rad);
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(rSub * Math.cos(theta), ySub, -rSub * Math.sin(theta)));
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        parLines.push(
          new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({ color: "#087EAC", transparent: true, opacity: 0.18 })
          )
        );
      }

      // 3. Hour Circles / RA Meridians (Every 30° / 2 Hours of RA: 0h, 2h, 4h... 22h)
      const merLines: THREE.Line[] = [];
      for (let raDeg = 0; raDeg < 360; raDeg += 30) {
        const raRad = (raDeg * Math.PI) / 180;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
          const decRad = -Math.PI / 2 + (i / segments) * Math.PI;
          const rSub = radius * Math.cos(decRad);
          const ySub = radius * Math.sin(decRad);
          points.push(
            new THREE.Vector3(rSub * Math.cos(raRad), ySub, -rSub * Math.sin(raRad))
          );
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        merLines.push(
          new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({ color: "#39216F", transparent: true, opacity: 0.25 })
          )
        );
      }

      // 4. Ecliptic Plane (Tilted by 23.44° obliquity of the ecliptic)
      const ecPoints: THREE.Vector3[] = [];
      const obliquityRad = (23.43928 * Math.PI) / 180;
      for (let i = 0; i <= segments; i++) {
        const lambda = (i / segments) * Math.PI * 2;
        const x = radius * Math.cos(lambda);
        const y = radius * Math.sin(lambda) * Math.sin(obliquityRad);
        const z = -radius * Math.sin(lambda) * Math.cos(obliquityRad);
        ecPoints.push(new THREE.Vector3(x, y, z));
      }
      const ecGeom = new THREE.BufferGeometry().setFromPoints(ecPoints);
      const ecLine = new THREE.Line(
        ecGeom,
        new THREE.LineBasicMaterial({ color: "#F5A742", transparent: true, opacity: 0.5 })
      );

      return {
        equatorLine: eqLine,
        parallelLines: parLines,
        meridianLines: merLines,
        eclipticLine: ecLine,
      };
    }, [radius]);

  return (
    <group name="celestial-grid">
      {/* 1. Celestial Equator Ring (Ion Cyan) */}
      <primitive object={equatorLine} />

      {/* 2. Declination Parallels (Deep Blue / Indigo) */}
      {parallelLines.map((line, idx) => (
        <primitive key={`parallel-${idx}`} object={line} />
      ))}

      {/* 3. Hour Meridians / Right Ascension Lines (Nebula Violet Tint) */}
      {meridianLines.map((line, idx) => (
        <primitive key={`meridian-${idx}`} object={line} />
      ))}

      {/* 4. Ecliptic Plane (Solar Amber) */}
      <primitive object={eclipticLine} />

      {/* 5. Celestial Coordinate Axis Markers & Labels */}
      {showLabels && (
        <>
          {/* North Celestial Pole (NCP) */}
          <group position={[0, radius * 1.01, 0]}>
            <Html center>
              <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[9px] font-mono text-cyan-300 uppercase tracking-widest pointer-events-none select-none shadow-lg whitespace-nowrap">
                NCP +90°
              </div>
            </Html>
          </group>

          {/* South Celestial Pole (SCP) */}
          <group position={[0, -radius * 1.01, 0]}>
            <Html center>
              <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-mono text-white/50 uppercase tracking-widest pointer-events-none select-none shadow-lg whitespace-nowrap">
                SCP -90°
              </div>
            </Html>
          </group>

          {/* Vernal Equinox (RA 0h 00m, Dec 0°) */}
          <group position={[radius * 1.01, 0, 0]}>
            <Html center>
              <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-400/50 text-[9px] font-mono text-cyan-200 pointer-events-none select-none shadow-lg whitespace-nowrap">
                ♈ 0h (RA 0°)
              </div>
            </Html>
          </group>

          {/* RA 6h */}
          <group position={[0, 0, -radius * 1.01]}>
            <Html center>
              <div className="px-1.5 py-0.2 rounded bg-black/60 text-[8px] font-mono text-white/40 pointer-events-none select-none whitespace-nowrap">
                6h (RA 90°)
              </div>
            </Html>
          </group>

          {/* RA 12h */}
          <group position={[-radius * 1.01, 0, 0]}>
            <Html center>
              <div className="px-1.5 py-0.2 rounded bg-black/60 text-[8px] font-mono text-white/40 pointer-events-none select-none whitespace-nowrap">
                12h (RA 180°)
              </div>
            </Html>
          </group>

          {/* RA 18h */}
          <group position={[0, 0, radius * 1.01]}>
            <Html center>
              <div className="px-1.5 py-0.2 rounded bg-black/60 text-[8px] font-mono text-white/40 pointer-events-none select-none whitespace-nowrap">
                18h (RA 270°)
              </div>
            </Html>
          </group>

          {/* Ecliptic Plane Marker */}
          <group position={[0, radius * Math.sin((23.44 * Math.PI) / 180) * 1.01, -radius * Math.cos((23.44 * Math.PI) / 180) * 1.01]}>
            <Html center>
              <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-amber-500/40 text-[9px] font-mono text-amber-300 uppercase tracking-widest pointer-events-none select-none shadow-lg whitespace-nowrap">
                ECLIPTIC PLANE
              </div>
            </Html>
          </group>
        </>
      )}
    </group>
  );
}
