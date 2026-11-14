"use client";

import React, { useMemo } from "react";
import {
  computeSolarSystemPositions,
  computeOrbitSamples,
  type ScaleMode,
  type PlanetKey,
} from "@/lib/solarEphemeris";

export interface SolarSystemFallback2DProps {
  currentDate: Date;
  scaleMode?: ScaleMode;
  onSelectBody?: (bodyKey: PlanetKey) => void;
  selectedBodyKey?: PlanetKey | null;
  className?: string;
}

export function SolarSystemFallback2D({
  currentDate,
  scaleMode = "schematic",
  onSelectBody,
  selectedBodyKey,
  className = "",
}: SolarSystemFallback2DProps) {
  const width = 800;
  const height = 800;
  const cx = width / 2;
  const cy = height / 2;

  const positions = useMemo(
    () => computeSolarSystemPositions(currentDate, scaleMode),
    [currentDate, scaleMode]
  );

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

  // Map 3D scene units to 2D SVG canvas pixels
  const maxSceneR = scaleMode === "true" ? 440 : 80;
  const svgScale = (width * 0.44) / maxSceneR;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-[#010206] overflow-hidden select-none ${className}`}
      role="region"
      aria-label="2D Solar System Orbital Diagram (Fallback View)"
    >
      {/* Notice Banner */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-[2px] bg-black/80 border border-white/10 text-xs font-mono text-[#B8BCC4] shadow-xl flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E0A526]" />
        <span>2D FLAT ORBIT DIAGRAM (WEBGL FALLBACK ACTIVE)</span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-w-4xl max-h-[90vh]"
      >
        {/* Background stars */}
        <rect width={width} height={height} fill="#010206" />

        {/* Orbit Lines */}
        {planetKeys.map((pKey) => {
          const samples = computeOrbitSamples(pKey, currentDate, scaleMode, 96);
          const pathData = samples
            .map((pt, i) => {
              const sx = cx + pt[0] * svgScale;
              const sy = cy + pt[2] * svgScale;
              return `${i === 0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
            })
            .join(" ") + " Z";

          const isSelected = selectedBodyKey === pKey;
          const strokeColor = positions[pKey].color;

          return (
            <path
              key={`orbit-svg-${pKey}`}
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isSelected ? 1.5 : 0.8}
              strokeOpacity={isSelected ? 0.9 : 0.45}
            />
          );
        })}

        {/* Central Sun */}
        <circle cx={cx} cy={cy} r={8} fill="#FFE87C" />
        <circle
          cx={cx}
          cy={cy}
          r={14}
          fill="none"
          stroke="#FFA500"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="#FFE87C"
          fontSize="9"
          fontFamily="monospace"
          letterSpacing="0.2em"
        >
          SUN
        </text>

        {/* Planet Markers & Labels */}
        {planetKeys.map((pKey) => {
          const pos = positions[pKey];
          const px = cx + pos.scenePosition[0] * svgScale;
          const py = cy + pos.scenePosition[2] * svgScale;
          const isSelected = selectedBodyKey === pKey;

          return (
            <g
              key={`planet-svg-${pKey}`}
              className="cursor-pointer"
              onClick={() => onSelectBody?.(pKey)}
            >
              {/* Outer ring */}
              <circle
                cx={px}
                cy={py}
                r={isSelected ? 6 : 4}
                fill="none"
                stroke={isSelected ? "#FFFFFF" : pos.color}
                strokeWidth={isSelected ? 1.5 : 1.0}
              />
              {/* Inner core */}
              <circle
                cx={px}
                cy={py}
                r={isSelected ? 3 : 2}
                fill={pos.color}
              />
              {/* Label */}
              <text
                x={px + 8}
                y={py + 3}
                fill={isSelected ? "#22D3EE" : "#FFFFFF"}
                fontSize="10"
                fontFamily="sans-serif"
                letterSpacing="0.18em"
              >
                {pos.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

