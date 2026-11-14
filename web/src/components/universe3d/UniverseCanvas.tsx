"use client";

import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { Universe3DProps, UniverseLayers } from "./types";
import { StarField3D } from "./StarField3D";
import { CosmicNebula } from "./CosmicNebula";
import { CelestialSphereGrid } from "./CelestialSphereGrid";
import { SolarSystemOrbits3D } from "./SolarSystemOrbits3D";
import { MoverObject3D } from "./MoverObject3D";
import { TrajectoryRibbon3D } from "./TrajectoryRibbon3D";
import { SurveyFootprint3D } from "./SurveyFootprint3D";
import { CameraController } from "./CameraController";
import { CELESTIAL_SPHERE_RADIUS } from "./coords3d";

export function UniverseCanvas({
  movers,
  selectedObjectId,
  onSelectObject,
  epochIndex,
  epochs,
  centerRa = 269.452,
  centerDec = 66.561,
  showTrails = true,
  isDemo = false,
}: Universe3DProps) {
  // Layer toggles state
  const [layers] = useState<UniverseLayers>({
    stars: true,
    nebula: true,
    grid: true,
    trajectories: showTrails,
    solarOrbits: true,
    labels: true,
    footprint: true,
  });

  const selectedMover = selectedObjectId
    ? movers.find((m) => m.object_id === selectedObjectId) || null
    : null;

  return (
    <div className="relative w-full h-full bg-[#050816] overflow-hidden select-none">
      {/* 1. Main Interactive WebGL 3D Canvas */}
      <Canvas
        camera={{
          position: [0, 18, 55],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]}
        className="w-full h-full"
        onPointerMissed={() => {
          // Clicking empty space deselects mover
          onSelectObject(null);
        }}
      >
        <color attach="background" args={["#050816"]} />

        {/* Cinematic Ambient & Directional Lighting */}
        <ambientLight intensity={0.4} color="#101B46" />
        <directionalLight
          position={[40, 60, 50]}
          intensity={1.2}
          color="#ffffff"
        />
        <pointLight
          position={[0, 0, 0]}
          intensity={0.6}
          color="#087EAC"
          distance={120}
        />

        <Suspense fallback={null}>
          {/* Deep-Space Starfield with Multiple Depth Layers */}
          {layers.stars && <StarField3D count={7000} radius={260} />}

          {/* Procedural Animated Cosmic Nebula Cloud Shell */}
          {layers.nebula && <CosmicNebula radius={220} />}

          {/* Celestial Coordinate Sphere Grid (Equator, Parallels, Ecliptic) */}
          {layers.grid && (
            <CelestialSphereGrid
              radius={CELESTIAL_SPHERE_RADIUS}
              showLabels={layers.labels}
            />
          )}

          {/* NASA Eyes on the Solar System Orbits & Spacecraft Trajectories */}
          {layers.solarOrbits && (
            <SolarSystemOrbits3D showLabels={layers.labels} />
          )}

          {/* SPHEREx Deep Field Footprint Frustum */}
          {layers.footprint && (
            <SurveyFootprint3D
              centerRa={centerRa}
              centerDec={centerDec}
              sizeDeg={1.5}
            />
          )}

          {/* Multi-Epoch Motion Trajectory Ribbons */}
          {layers.trajectories && (
            <TrajectoryRibbon3D
              movers={movers}
              activeEpochIndex={epochIndex}
              epochs={epochs}
              selectedObjectId={selectedObjectId}
            />
          )}

          {/* Interactive 3D Asteroids / Candidate Objects */}
          {movers.map((mover) => (
            <MoverObject3D
              key={mover.object_id}
              mover={mover}
              isSelected={mover.object_id === selectedObjectId}
              onSelect={(id) => onSelectObject(id)}
              epochIndex={epochIndex}
              epochs={epochs}
              showLabels={layers.labels}
            />
          ))}

          {/* Smooth Cinematic Camera Orbit & Fly-To Controller */}
          <CameraController
            selectedMover={selectedMover}
            targetRa={centerRa}
            targetDec={centerDec}
          />
        </Suspense>
      </Canvas>

      {/* 2. Top-Right NASA Eyes Celestial Pointing Telemetry HUD (Plain text without a box) */}
      <div className="absolute top-16 right-6 z-30 text-right pointer-events-none space-y-0.5 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="text-[10px] font-sans font-medium uppercase tracking-[0.24em] text-[#22D3EE]">
          3D CELESTIAL UNIVERSE
        </div>
        <div className="text-xs font-mono text-white tracking-wide">
          RA {centerRa.toFixed(4)}° · DEC {centerDec >= 0 ? `+${centerDec.toFixed(4)}` : centerDec.toFixed(4)}°
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[#B8BCC4]">
          <span className="uppercase tracking-[0.18em]">
            {isDemo ? "BENCHMARK DEMO" : "SPHEREX DEEP FIELD"}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[#E0A526]">{movers.length} TRACKLETS</span>
          <span className="text-white/20">·</span>
          <span>EPOCH {epochIndex + 1}/{epochs.length}</span>
        </div>
      </div>
    </div>
  );
}
