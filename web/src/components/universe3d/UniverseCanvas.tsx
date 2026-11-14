"use client";

import React, { useState, useId, Suspense } from "react";
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
import { LayerControls3D } from "./LayerControls3D";
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
  const canvasKey = useId();

  // Layer toggles state
  const [layers, setLayers] = useState<UniverseLayers>({
    stars: true,
    nebula: true,
    grid: true,
    trajectories: showTrails,
    solarOrbits: true,
    labels: true,
    footprint: true,
  });

  const toggleLayer = (layer: keyof UniverseLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const selectedMover = selectedObjectId
    ? movers.find((m) => m.object_id === selectedObjectId) || null
    : null;

  // Key to force reset camera if user clicks reset
  const [cameraResetCounter, setCameraResetCounter] = useState(0);

  return (
    <div className="relative w-full h-full bg-[#050816] overflow-hidden select-none">
      {/* 1. Main Interactive WebGL 3D Canvas */}
      <Canvas
        key={`${canvasKey}-${cameraResetCounter}`}
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

      {/* 2. Top-Right NASA Eyes Celestial Pointing Telemetry HUD */}
      <div className="absolute top-3 right-3 z-30 px-3.5 py-2.5 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 text-right font-mono pointer-events-none space-y-1 shadow-2xl">
        <div className="flex items-center justify-end gap-1.5 text-[9px] uppercase tracking-widest text-cyan-400 font-bold font-sans">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>3D CELESTIAL UNIVERSE</span>
        </div>
        <div className="text-sm font-bold text-white tracking-tight">
          RA {centerRa.toFixed(4)}° • Dec {centerDec >= 0 ? `+${centerDec.toFixed(4)}` : centerDec.toFixed(4)}°
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] text-white/60">
          <span>{isDemo ? "Benchmark Demo Mode" : "SPHEREx Deep Field"}</span>
          <span className="text-white/20">•</span>
          <span className="text-amber-300 font-semibold">{movers.length} Tracklets</span>
          <span className="text-white/20">•</span>
          <span className="text-cyan-300">Epoch {epochIndex + 1}/{epochs.length}</span>
        </div>
      </div>

      {/* 3. Bottom-Left Layer Controls Floating Pill */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-auto flex items-center gap-2">
        <LayerControls3D
          layers={layers}
          onToggleLayer={toggleLayer}
          onResetCamera={() => setCameraResetCounter((c) => c + 1)}
        />
      </div>

      {/* 4. Bottom Center NASA Eyes Live Orbit Telemetry Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex flex-col items-center gap-1 select-none">
        <div className="flex items-center gap-5 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl text-[11px] font-mono text-white/70">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-widest text-[10px]">LIVE</span>
          </div>
          <span className="text-white/30">•</span>
          <span className="font-sans font-medium text-white/90 uppercase tracking-wider text-[10.5px]">
            NOV 14, 2026
          </span>
          <span className="text-white/30">•</span>
          <span className="font-sans font-bold text-white tracking-widest text-[11px]">
            REAL RATE
          </span>
          <span className="text-white/30">•</span>
          <span className="font-mono text-[#c59b6d] font-semibold text-[10.5px]">
            10:02:34 AM
          </span>
        </div>
        <div className="h-5 w-5 rounded-full border border-white/20 bg-black/90 flex items-center justify-center text-[9px] text-white/70 shadow-lg -mt-1">
          ◎
        </div>
      </div>
    </div>
  );
}
