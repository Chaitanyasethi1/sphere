"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  computeSolarSystemPositions,
  computeOrbitSamples,
  generateAsteroidBeltParticles,
  scaleDistance,
  type ScaleMode,
  type PlanetKey,
} from "@/lib/solarEphemeris";

export interface SolarSystemOrbits3DProps {
  currentDate: Date;
  scaleMode?: ScaleMode;
  showLabels?: boolean;
  showOrbits?: boolean;
  showAsteroidBelt?: boolean;
  onSelectBody?: (bodyKey: PlanetKey | "spherex") => void;
  selectedBodyKey?: PlanetKey | "spherex" | null;
}

export function SolarSystemOrbits3D({
  currentDate,
  scaleMode = "schematic",
  showLabels = true,
  showOrbits = true,
  showAsteroidBelt = true,
  onSelectBody,
  selectedBodyKey,
}: SolarSystemOrbits3DProps) {
  // Compute positions from astronomy-engine ephemeris for the selected date
  const positions = useMemo(
    () => computeSolarSystemPositions(currentDate, scaleMode),
    [currentDate, scaleMode]
  );

  // Closed sampled orbit lines for all planetary bodies
  const orbitCurves = useMemo(() => {
    const keys: Exclude<PlanetKey, "sun" | "moon">[] = [
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
    ];

    return keys.map((key) => {
      const samplePoints = computeOrbitSamples(key, currentDate, scaleMode, 128);
      const points = samplePoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const color = positions[key].color;

      return {
        key,
        color,
        line: new THREE.Line(
          geom,
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.6,
            linewidth: 1,
          })
        ),
      };
    });
  }, [currentDate, scaleMode, positions]);

  // Asteroid belt particles
  const asteroidBeltGeometry = useMemo(() => {
    const positionsArray = generateAsteroidBeltParticles(1600, scaleMode);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
    return geom;
  }, [scaleMode]);

  // Animated pulse / rotation refs
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const saturnRingsRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (sunCoronaRef.current) {
      sunCoronaRef.current.rotation.y += delta * 0.1;
    }
    if (saturnRingsRef.current) {
      saturnRingsRef.current.rotation.z += delta * 0.05;
    }
  });

  const planetKeys: Exclude<PlanetKey, "sun" | "moon">[] = [
    "mercury",
    "venus",
    "earth",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];

  return (
    <group name="solar-system-ephemeris">
      {/* ========================================================
          1. CENTRAL SUN WITH LUMINOUS CORONA & POINT LIGHT
          ======================================================== */}
      <group position={[0, 0, 0]}>
        {/* Core Solar Sphere */}
        <mesh>
          <sphereGeometry args={[positions.sun.visualRadius, 32, 32]} />
          <meshBasicMaterial color="#fffbe6" />
        </mesh>

        {/* Pulsing Coronal Atmosphere */}
        <mesh ref={sunCoronaRef}>
          <sphereGeometry args={[positions.sun.visualRadius * 1.35, 24, 24]} />
          <meshBasicMaterial
            color="#ffb830"
            transparent
            opacity={0.35}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Point light for planetary illumination */}
        <pointLight color="#fff7d6" intensity={4.5} distance={500} decay={1.0} />

        {showLabels && (
          <Html position={[0, 2.5, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-light text-xs tracking-[0.24em] text-[#ffea78] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              SUN
            </span>
          </Html>
        )}
      </group>

      {/* ========================================================
          2. CLOSED REAL SAMPLED ORBIT LINES (1px NASA Eyes style)
          ======================================================== */}
      {showOrbits &&
        orbitCurves.map((oc) => (
          <primitive key={`orbit-curve-${oc.key}`} object={oc.line} />
        ))}

      {/* ========================================================
          3. PROCEDURAL ASTEROID MAIN BELT (Schematic Ring)
          ======================================================== */}
      {showAsteroidBelt && (
        <group name="asteroid-main-belt">
          <points geometry={asteroidBeltGeometry}>
            <pointsMaterial
              size={0.18}
              color="#d4a373"
              transparent
              opacity={0.5}
              sizeAttenuation
            />
          </points>

          {showLabels && (
            <Html
              position={[scaleDistance(2.7, scaleMode), 0.6, 0]}
              center
              className="pointer-events-none select-none"
            >
              <span className="font-sans text-[8.5px] uppercase tracking-[0.2em] text-[#d4a373]/80 whitespace-nowrap bg-black/60 px-1 py-0.5 rounded-[1px] border border-[#d4a373]/30">
                [SCHEMATIC] ASTEROID BELT
              </span>
            </Html>
          )}
        </group>
      )}

      {/* ========================================================
          4. PLANETARY BODIES (Shaded Spheres from Ephemeris)
          ======================================================== */}
      {planetKeys.map((pKey) => {
        const pos = positions[pKey];
        const isSelected = selectedBodyKey === pKey;

        return (
          <group
            key={`planet-body-${pKey}`}
            position={pos.scenePosition}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBody?.(pKey);
            }}
          >
            {/* Outer Target Brackets on selected */}
            {isSelected && (
              <mesh>
                <ringGeometry
                  args={[pos.visualRadius * 1.4, pos.visualRadius * 1.5, 32]}
                />
                <meshBasicMaterial
                  color="#22D3EE"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}

            {/* Shaded Planet Sphere */}
            <mesh>
              <sphereGeometry args={[pos.visualRadius, 24, 24]} />
              <meshStandardMaterial
                color={pos.color}
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>

            {/* Saturn's Rings */}
            {pKey === "saturn" && (
              <mesh
                ref={saturnRingsRef}
                rotation={[(26.7 * Math.PI) / 180, 0, 0]}
              >
                <ringGeometry
                  args={[
                    pos.visualRadius * 1.4,
                    pos.visualRadius * 2.5,
                    48,
                  ]}
                />
                <meshStandardMaterial
                  color="#d4b483"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.75}
                  roughness={0.5}
                />
              </mesh>
            )}

            {/* NASA Eyes Label & Ring Marker */}
            {showLabels && (
              <Html
                position={[0, pos.visualRadius + 1.0, 0]}
                center
                className="pointer-events-auto select-none"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBody?.(pKey);
                  }}
                  className={`group flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[rgba(34,211,238,0.2)] border-[#22D3EE] text-white shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      : "bg-black/75 hover:bg-black/90 border-white/[0.12] hover:border-white/30 text-white/90"
                  }`}
                  aria-label={`Select ${pos.name} (${pos.distanceAU.toFixed(2)} AU from Sun)`}
                >
                  {/* Circle ring marker */}
                  <span
                    className="w-2 h-2 rounded-full border border-current shrink-0"
                    style={{ borderColor: pos.color }}
                  />

                  {/* Wide-tracked uppercase label */}
                  <span className="font-sans font-medium text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">
                    {pos.name}
                  </span>

                  {/* Distance readout */}
                  <span className="text-[8.5px] font-mono text-[#B8BCC4] hidden group-hover:inline">
                    {pos.distanceAU.toFixed(2)} AU
                  </span>
                </button>
              </Html>
            )}
          </group>
        );
      })}

      {/* ========================================================
          5. EARTH SYSTEM: MOON & SPHEREx SPACECRAFT
          ======================================================== */}
      {/* The Moon */}
      <group position={positions.moon.scenePosition}>
        <mesh>
          <sphereGeometry args={[positions.moon.visualRadius, 16, 16]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
        {showLabels && (
          <Html position={[0, 0.6, 0]} center className="pointer-events-none select-none">
            <span className="font-sans text-[8px] tracking-[0.18em] text-[#cbd5e1] uppercase whitespace-nowrap drop-shadow-md">
              MOON
            </span>
          </Html>
        )}
      </group>

      {/* SPHEREx Spacecraft attached to Earth */}
      <group
        position={[
          positions.earth.scenePosition[0] + 0.85,
          positions.earth.scenePosition[1] + 0.35,
          positions.earth.scenePosition[2] + 0.5,
        ]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectBody?.("spherex");
        }}
      >
        {/* Spacecraft Bus mesh */}
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.3]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Solar panels */}
        <mesh position={[0.3, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.18]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[-0.3, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.18]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>

        {showLabels && (
          <Html position={[0, 0.75, 0]} center className="pointer-events-auto select-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBody?.("spherex");
              }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-black/80 hover:bg-black/95 border border-[#22D3EE]/50 hover:border-[#22D3EE] text-white transition-all cursor-pointer shadow-lg"
              title="Low Earth Polar Sun-Synchronous Orbit (approx. 650 km altitude). Attached to Earth frame. TODO(VERIFY) detailed TLE orbital elements."
            >
              {/* Hexagon icon for spacecraft */}
              <span className="text-[9px] text-[#22D3EE] leading-none">⬡</span>
              <span className="font-sans font-medium text-[9.5px] tracking-[0.2em] text-[#22D3EE] uppercase whitespace-nowrap">
                SPHEREx
              </span>
            </button>
          </Html>
        )}
      </group>
    </group>
  );
}
