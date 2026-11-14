"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { DESIGN_TOKENS } from "@/design/tokens";

interface SolarSystemOrbits3DProps {
  showLabels?: boolean;
}

export function SolarSystemOrbits3D({ showLabels = true }: SolarSystemOrbits3DProps) {
  // Planetary orbital parameters scaled to fit inside the celestial sphere (R=80)
  const planetOrbits = useMemo(() => {
    const obliquity = (23.43928 * Math.PI) / 180; // Ecliptic inclination

    const planets = [
      {
        name: "MERCURY",
        color: DESIGN_TOKENS.colors.orbits.mercury, // #a278b5 soft lavender
        a: 7.2,
        b: 6.9,
        e: 0.2056,
        rotY: 0.35,
        planetSize: 0.35,
        planetAngle: 1.2,
      },
      {
        name: "VENUS",
        color: DESIGN_TOKENS.colors.orbits.venus, // #e8d5a3 champagne gold
        a: 12.2,
        b: 12.1,
        e: 0.0068,
        rotY: 1.8,
        planetSize: 0.45,
        planetAngle: 3.4,
      },
      {
        name: "EARTH",
        color: DESIGN_TOKENS.colors.orbits.earth, // #68a8cf pale ice cyan
        a: 17.5,
        b: 17.4,
        e: 0.0167,
        rotY: 0.0,
        planetSize: 0.48,
        planetAngle: 0.8,
        crafts: [
          { name: "STEREO Ahead", angle: 1.15, color: DESIGN_TOKENS.colors.orbits.stereo },
          { name: "BioSentinel", angle: 0.65, color: DESIGN_TOKENS.colors.orbits.biosentinel },
        ],
      },
      {
        name: "MARS",
        color: DESIGN_TOKENS.colors.orbits.mars, // #d96b43 rust terracotta
        a: 24.8,
        b: 24.2,
        e: 0.0934,
        rotY: -0.8,
        planetSize: 0.4,
        planetAngle: 2.1,
        crafts: [
          { name: "Psyche", angle: 2.45, color: DESIGN_TOKENS.colors.orbits.psyche },
        ],
      },
      {
        name: "JUPITER",
        color: DESIGN_TOKENS.colors.orbits.jupiter, // #cca06a warm tan amber
        a: 44.5,
        b: 44.2,
        e: 0.0489,
        rotY: 0.6,
        planetSize: 0.7,
        planetAngle: 4.8,
      },
    ];

    const segments = 128;

    return planets.map((p) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        // Orbit in local X-Z plane with eccentricity focus offset
        const localX = p.a * Math.cos(theta) - p.a * p.e;
        const localZ = p.b * Math.sin(theta);

        // Rotate in orbital plane
        const rx = localX * Math.cos(p.rotY) - localZ * Math.sin(p.rotY);
        const rz = localX * Math.sin(p.rotY) + localZ * Math.cos(p.rotY);

        // Incline into ecliptic plane
        const x = rx;
        const y = rz * Math.sin(obliquity);
        const z = rz * Math.cos(obliquity);

        points.push(new THREE.Vector3(x, y, z));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      // Delicate thin ("littler") line with authentic NASA Eyes color
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({
          color: p.color,
          transparent: true,
          opacity: 0.65,
          linewidth: 1,
        })
      );

      // Planet position along orbit
      const pTheta = p.planetAngle;
      const plX = p.a * Math.cos(pTheta) - p.a * p.e;
      const plZ = p.b * Math.sin(pTheta);
      const prx = plX * Math.cos(p.rotY) - plZ * Math.sin(p.rotY);
      const prz = plX * Math.sin(p.rotY) + plZ * Math.cos(p.rotY);
      const planetPos = new THREE.Vector3(
        prx,
        prz * Math.sin(obliquity),
        prz * Math.cos(obliquity)
      );

      // Spacecraft positions
      const craftObjects = (p.crafts || []).map((craft) => {
        const cTheta = craft.angle;
        const cX = (p.a + 0.8) * Math.cos(cTheta) - p.a * p.e;
        const cZ = (p.b + 0.8) * Math.sin(cTheta);
        const crx = cX * Math.cos(p.rotY) - cZ * Math.sin(p.rotY);
        const crz = cX * Math.sin(p.rotY) + cZ * Math.cos(p.rotY);
        const pos = new THREE.Vector3(
          crx,
          crz * Math.sin(obliquity),
          crz * Math.cos(obliquity)
        );
        return { ...craft, pos };
      });

      return {
        ...p,
        line,
        planetPos,
        craftObjects,
      };
    });
  }, []);

  // Parker Solar Probe highly eccentric solar encounter loop
  const parkerTrajectory = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 120;
    const a = 9.8;
    const b = 5.2;
    const e = 0.72;
    const obliquity = (23.43928 * Math.PI) / 180 + 0.12;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const lx = a * Math.cos(theta) - a * e;
      const lz = b * Math.sin(theta);
      const x = lx;
      const y = lz * Math.sin(obliquity);
      const z = lz * Math.cos(obliquity);
      points.push(new THREE.Vector3(x, y, z));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({
        color: DESIGN_TOKENS.colors.orbits.parker, // #cbd5e1 silver
        transparent: true,
        opacity: 0.7,
        linewidth: 1,
      })
    );

    const probePos = points[18];
    return { line, probePos };
  }, []);

  return (
    <group name="solar-system-orbits">
      {/* 1. Center Sun with warm solar corona glow */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color="#ffea78" />
        </mesh>
        <pointLight color="#fff0a0" intensity={2.5} distance={100} decay={1.5} />
        {showLabels && (
          <Html position={[0, 2.0, 0]} center className="pointer-events-none select-none">
            <span className="font-sans font-semibold text-[11px] tracking-widest text-[#ffea78] uppercase drop-shadow-md">
              SUN
            </span>
          </Html>
        )}
      </group>

      {/* 2. Planetary Orbits & Body Markers */}
      {planetOrbits.map((p) => (
        <group key={`orbit-${p.name}`}>
          {/* Delicate orbital line ("littler") */}
          <primitive object={p.line} />

          {/* Planet Body Node */}
          <mesh position={p.planetPos}>
            <sphereGeometry args={[p.planetSize, 16, 16]} />
            <meshBasicMaterial color={p.color} />
          </mesh>

          {/* Planet Label */}
          {showLabels && (
            <Html
              position={[p.planetPos.x, p.planetPos.y + 1.2, p.planetPos.z]}
              center
              className="pointer-events-none select-none"
            >
              <div className="flex flex-col items-center">
                <span className="font-sans font-semibold text-[10.5px] tracking-[0.2em] text-white/90 uppercase drop-shadow-lg whitespace-nowrap">
                  {p.name}
                </span>
              </div>
            </Html>
          )}

          {/* Spacecrafts attached to planetary vicinity (STEREO Ahead, BioSentinel, Psyche) */}
          {p.craftObjects.map((craft) => (
            <group key={`craft-${craft.name}`} position={craft.pos}>
              <mesh>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshBasicMaterial color={craft.color} />
              </mesh>
              {showLabels && (
                <Html position={[0, 0.9, 0]} center className="pointer-events-none select-none">
                  <span
                    className="font-mono text-[9px] tracking-wider uppercase drop-shadow-md whitespace-nowrap"
                    style={{ color: craft.color }}
                  >
                    {craft.name}
                  </span>
                </Html>
              )}
            </group>
          ))}
        </group>
      ))}

      {/* 3. Parker Solar Probe Looping Orbit & Marker */}
      <group>
        <primitive object={parkerTrajectory.line} />
        <mesh position={parkerTrajectory.probePos}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={DESIGN_TOKENS.colors.orbits.parker} />
        </mesh>
        {showLabels && (
          <Html
            position={[
              parkerTrajectory.probePos.x + 0.5,
              parkerTrajectory.probePos.y + 0.8,
              parkerTrajectory.probePos.z,
            ]}
            center
            className="pointer-events-none select-none"
          >
            <span className="font-mono text-[9.5px] tracking-wider text-slate-300 uppercase drop-shadow-md whitespace-nowrap">
              Parker Solar Probe
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}

