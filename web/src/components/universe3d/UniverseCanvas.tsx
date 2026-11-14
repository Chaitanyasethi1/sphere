"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { MoverCandidate } from "@/types";
import { StarField3D } from "./StarField3D";
import { CelestialSphereGrid } from "./CelestialSphereGrid";
import { SolarSystemOrbits3D } from "./SolarSystemOrbits3D";
import { TargetDirectionRays3D } from "./TargetDirectionRays3D";
import { CameraController } from "./CameraController";
import { SolarSystemFallback2D } from "./SolarSystemFallback2D";
import {
  computeSolarSystemPositions,
  type ScaleMode,
  type PlanetKey,
} from "@/lib/solarEphemeris";
import { RotateCcw, Compass, X } from "lucide-react";

export interface UniverseCanvasProps {
  currentDate?: Date;
  movers: MoverCandidate[];
  selectedObjectId?: string | null;
  onSelectObject: (objectId: string | null) => void;
  onDiveToSurvey?: (coords: { ra: number; dec: number; objectId?: string | null }) => void;
  scaleMode?: ScaleMode;
  onToggleScaleMode?: () => void;
  showTrails?: boolean;
  isDemo?: boolean;
}

function checkWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function UniverseCanvas({
  currentDate = new Date(),
  movers,
  selectedObjectId,
  onSelectObject,
  onDiveToSurvey,
  scaleMode = "schematic",
  onToggleScaleMode,
  showTrails = true,
  isDemo = false,
}: UniverseCanvasProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [selectedBodyKey, setSelectedBodyKey] = useState<PlanetKey | "spherex" | null>(null);
  const [resetCounter, setResetCounter] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    setWebGLSupported(checkWebGL());
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mq.matches);
    }
  }, []);

  // Compute live planetary positions
  const planetPositions = useMemo(
    () => computeSolarSystemPositions(currentDate, scaleMode),
    [currentDate, scaleMode]
  );

  const earthScenePos = planetPositions.earth.scenePosition;

  // Fly-to coordinates when a planet is selected
  const flyToCoords = useMemo<[number, number, number] | null>(() => {
    if (!selectedBodyKey) return null;
    if (selectedBodyKey === "spherex") {
      return [
        earthScenePos[0] + 0.85,
        earthScenePos[1] + 0.35,
        earthScenePos[2] + 0.5,
      ];
    }
    return planetPositions[selectedBodyKey].scenePosition;
  }, [selectedBodyKey, planetPositions, earthScenePos]);

  // Selected body info data
  const selectedBodyInfo = useMemo(() => {
    if (!selectedBodyKey) return null;
    if (selectedBodyKey === "spherex") {
      return {
        name: "SPHEREx Spacecraft",
        type: "NASA Astrophysics Explorer (MIDEX)",
        distSunAU: planetPositions.earth.distanceAU,
        distEarthKm: "650 km (Low-Earth Sun-Synchronous Orbit)",
        period: "97.5 minutes (14.7 rev/day)",
        note: "Attached to Earth frame in Solar System scene. Direction-only spectral observations. TODO(VERIFY) detailed TLE elements.",
      };
    }
    const pos = planetPositions[selectedBodyKey];
    const kmPerAU = 149597870.7;
    const distMillionKm = (pos.distanceAU * kmPerAU) / 1_000_000;

    // Distance from Earth
    const dx = pos.rawVectorAU.x - planetPositions.earth.rawVectorAU.x;
    const dy = pos.rawVectorAU.y - planetPositions.earth.rawVectorAU.y;
    const dz = pos.rawVectorAU.z - planetPositions.earth.rawVectorAU.z;
    const distEarthAU = Math.hypot(dx, dy, dz);
    const distEarthMillionKm = (distEarthAU * kmPerAU) / 1_000_000;

    return {
      name: pos.name,
      type: selectedBodyKey === "sun" ? "Central Star" : selectedBodyKey === "moon" ? "Planetary Satellite" : selectedBodyKey === "pluto" ? "Dwarf Planet" : "Major Planet",
      distSunAU: pos.distanceAU,
      distSunKm: `${distMillionKm.toFixed(1)} million km`,
      distEarthAU: distEarthAU.toFixed(3),
      distEarthKm: `${distEarthMillionKm.toFixed(1)} million km`,
      period: pos.orbitalPeriodDays > 0 ? `${pos.orbitalPeriodDays.toFixed(1)} days (${(pos.orbitalPeriodDays / 365.25).toFixed(2)} years)` : "N/A",
      color: pos.color,
    };
  }, [selectedBodyKey, planetPositions]);

  // Handle selecting a target ray -> triggers dive transition to 2D survey
  const handleSelectTarget = useCallback(
    (target: { id: string; ra: number; dec: number; name: string; isMover: boolean }) => {
      onSelectObject(target.id);
      if (onDiveToSurvey) {
        onDiveToSurvey({ ra: target.ra, dec: target.dec, objectId: target.id });
      }
    },
    [onSelectObject, onDiveToSurvey]
  );

  // Fallback to 2D flat orbit view if WebGL is unavailable
  if (!webGLSupported) {
    return (
      <SolarSystemFallback2D
        currentDate={currentDate}
        scaleMode={scaleMode}
        onSelectBody={(k) => setSelectedBodyKey(k)}
        selectedBodyKey={selectedBodyKey === "spherex" ? "earth" : selectedBodyKey}
      />
    );
  }

  return (
    <div
      className="relative w-full h-full bg-[#010206] overflow-hidden select-none"
      role="region"
      aria-label="3D Interactive Solar System and Direction Rays Viewport"
    >
      {/* 1. Main Interactive WebGL Canvas */}
      <Canvas
        camera={{
          position: [0, 36, 75],
          fov: 50,
          near: 0.1,
          far: 800,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onDoubleClick={() => {
          // Double-click canvas resets to Sun
          setSelectedBodyKey(null);
          setResetCounter((c) => c + 1);
        }}
      >
        <color attach="background" args={["#010206"]} />
        <ambientLight intensity={0.25} />

        <Suspense fallback={null}>
          {/* Procedural Star-field Backdrop */}
          <StarField3D count={1400} radius={220} />

          {/* Celestial Sphere Coordinate Grid */}
          <CelestialSphereGrid radius={180} />

          {/* Real sampled 3D Ephemeris Solar System */}
          <SolarSystemOrbits3D
            currentDate={currentDate}
            scaleMode={scaleMode}
            showLabels={true}
            showOrbits={true}
            showAsteroidBelt={true}
            onSelectBody={(key) => setSelectedBodyKey(key)}
            selectedBodyKey={selectedBodyKey}
          />

          {/* Line-of-sight Direction Rays from Earth to Movers & Targets */}
          <TargetDirectionRays3D
            earthPosition={earthScenePos}
            movers={movers}
            selectedObjectId={selectedObjectId}
            onSelectTarget={handleSelectTarget}
            showRays={showTrails}
            sphereRadius={85.0}
          />

          {/* Smooth Camera Flight & Orbit Controls */}
          <CameraController
            flyToPosition={flyToCoords}
            flyToDistance={selectedBodyKey === "sun" ? 22 : selectedBodyKey === "spherex" ? 5 : 12}
            resetTrigger={resetCounter}
            reducedMotion={prefersReducedMotion}
          />
        </Suspense>
      </Canvas>

      {/* 2. Top-Right NASA Eyes Celestial Pointing & Scale HUD (Plain Text without Box) */}
      <div className="absolute top-16 right-6 z-30 text-right pointer-events-none space-y-1 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <div className="text-[10px] font-sans font-medium uppercase tracking-[0.24em] text-[#22D3EE] flex items-center justify-end gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
          <span>3D SOLAR SYSTEM</span>
        </div>
        <div className="text-xs font-mono text-white tracking-wide">
          {scaleMode === "schematic" ? "SCHEMATIC SCALE" : "TRUE SCALE (1:1 AU)"}
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-[#B8BCC4]">
          <span className="uppercase tracking-[0.18em]">
            {isDemo ? "BENCHMARK DEMO" : "ASTRONOMY ENGINE EPHEMERIS"}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[#E0A526]">{movers.length} TARGET RAYS</span>
        </div>
      </div>

      {/* 3. Top-Left Controls: Scale Toggle & Reset Solar System */}
      <div className="absolute top-16 left-6 z-30 flex items-center gap-2 pointer-events-auto">
        {onToggleScaleMode && (
          <button
            type="button"
            onClick={onToggleScaleMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-black/80 hover:bg-black/95 backdrop-blur-md border border-white/[0.12] hover:border-[#22D3EE]/50 text-xs font-sans uppercase tracking-[0.18em] text-[#B8BCC4] hover:text-white transition-all cursor-pointer shadow-xl"
            title="Toggle between schematic compressed distances (for visibility) and true physical AU scale"
          >
            <Compass className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>{scaleMode === "schematic" ? "True Scale" : "Schematic Scale"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setSelectedBodyKey(null);
            setResetCounter((c) => c + 1);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-black/80 hover:bg-black/95 backdrop-blur-md border border-white/[0.12] hover:border-white/30 text-xs font-sans uppercase tracking-[0.18em] text-[#B8BCC4] hover:text-white transition-all cursor-pointer shadow-xl"
          title="Reset camera to view the full solar system facing the Sun"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Solar System</span>
        </button>
      </div>

      {/* 4. Planetary Body Inspection Info Card (Opens when a body is selected) */}
      {selectedBodyInfo && (
        <div className="absolute bottom-28 left-6 z-30 w-72 md:w-80 p-4 rounded-[3px] bg-[rgba(20,20,22,0.92)] backdrop-blur-md border border-white/[0.12] text-white shadow-2xl space-y-2 pointer-events-auto animate-in fade-in slide-in-from-left-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.10] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#22D3EE]">●</span>
              <h3 className="font-sans font-light text-base uppercase tracking-wider text-white">
                {selectedBodyInfo.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBodyKey(null)}
              className="text-[#B8BCC4] hover:text-white p-1 rounded-[2px] transition-colors cursor-pointer"
              aria-label="Close body info card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-[#B8BCC4]">
            <div className="flex justify-between">
              <span className="text-[#7E8492]">Type:</span>
              <span className="text-white">{selectedBodyInfo.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7E8492]">Dist. from Sun:</span>
              <span className="text-[#E0A526] font-semibold">
                {selectedBodyInfo.distSunAU.toFixed(3)} AU
              </span>
            </div>
            {"distEarthKm" in selectedBodyInfo && (
              <div className="flex justify-between">
                <span className="text-[#7E8492]">Dist. from Earth:</span>
                <span className="text-white">{selectedBodyInfo.distEarthKm}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#7E8492]">Orbital Period:</span>
              <span className="text-white">{selectedBodyInfo.period}</span>
            </div>
            {"note" in selectedBodyInfo && (
              <p className="text-[10px] text-[#22D3EE]/90 pt-1 leading-relaxed border-t border-white/[0.06]">
                {selectedBodyInfo.note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
