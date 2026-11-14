"use client";

import React from "react";
import type { MoverCandidate, EpochInfo, Detection } from "@/types";
import { computeTotalRate, computePositionAngle, positionAngleToCompass } from "@/lib/motion";

export interface MoverOverlayProps {
  movers: MoverCandidate[];
  currentEpoch: EpochInfo | null;
  currentEpochIndex: number;
  selectedObjectId?: string | null;
  onSelect: (objectId: string) => void;
  showTrails?: boolean;
  centerRa: number;
  centerDec: number;
  fovDeg: number;
  containerWidth: number;
  containerHeight: number;
  className?: string;
}

export function MoverOverlay({
  movers,
  currentEpoch,
  currentEpochIndex,
  selectedObjectId,
  onSelect,
  showTrails = true,
  centerRa,
  centerDec,
  fovDeg,
  containerWidth,
  containerHeight,
  className = "",
}: MoverOverlayProps) {
  if (!containerWidth || !containerHeight || fovDeg <= 0) {
    return null;
  }

  const cosDec = Math.cos((centerDec * Math.PI) / 180);
  const halfFov = fovDeg / 2.0;

  // Transform celestial (RA, Dec) into 2D container pixel coordinates (TAN projection approx)
  const skyToPixel = (ra: number, dec: number): { x: number; y: number; inBounds: boolean } => {
    const dRa = (ra - centerRa) * cosDec;
    const dDec = dec - centerDec;

    // Standard astronomy display: East is Left (-x), North is Up (-y)
    const x = containerWidth / 2 - (dRa / halfFov) * (containerWidth / 2);
    const y = containerHeight / 2 - (dDec / halfFov) * (containerHeight / 2);

    const inBounds = x >= 0 && x <= containerWidth && y >= 0 && y <= containerHeight;
    return { x, y, inBounds };
  };

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      role="region"
      aria-label="Moving object detections and trajectories overlay"
    >
      {/* SVG Motion Trails Layer */}
      {showTrails && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee" />
            </marker>
            <marker
              id="arrow-amber"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
          </defs>

          {movers.map((mover) => {
            const isKnown = mover.type === "known";
            const isSelected = selectedObjectId === mover.object_id;

            // Collect historical detections up to current epoch
            const pastDetections = (mover.detections || []).slice(0, currentEpochIndex + 1);
            if (pastDetections.length < 2) return null;

            const points = pastDetections.map((det) => skyToPixel(det.ra, det.dec));
            const pathData = points
              .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
              .join(" ");

            return (
              <g key={`trail-group-${mover.object_id}`}>
                {/* Glow backdrop path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isKnown ? "#06b6d4" : "#f59e0b"}
                  strokeWidth={isSelected ? 5 : 3}
                  strokeOpacity={0.2}
                />
                {/* Core trajectory path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isKnown ? "#22d3ee" : "#fbbf24"}
                  strokeWidth={isSelected ? 2 : 1.5}
                  strokeDasharray={isKnown ? "none" : "5 3"}
                  strokeOpacity={isSelected ? 0.95 : 0.75}
                  markerEnd={isKnown ? "url(#arrow-cyan)" : "url(#arrow-amber)"}
                />
                {/* Numbered epoch node dots along trajectory */}
                {points.map((pt, pIdx) => (
                  <circle
                    key={`node-${mover.object_id}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={pIdx === currentEpochIndex ? 3.5 : 2}
                    fill={isKnown ? "#22d3ee" : "#fbbf24"}
                    stroke="#050814"
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      )}

      {/* HTML Markers Layer */}
      {movers.map((mover) => {
        const isKnown = mover.type === "known";
        const isSelected = selectedObjectId === mover.object_id;

        // Check if there is a detection at the current epoch
        const currentDet: Detection | undefined = mover.detections?.find(
          (d) => d.epoch_id === currentEpoch?.epoch_id
        );

        let targetRa = mover.ra;
        let targetDec = mover.dec;
        let isPredicted = false;

        if (currentDet) {
          targetRa = currentDet.ra;
          targetDec = currentDet.dec;
        } else {
          // Extrapolate predicted position using motion vector
          isPredicted = true;
          const dtDays = currentEpochIndex * 1.0;
          targetRa = mover.ra + (mover.motion.ra_rate_arcsec_per_day * dtDays) / (3600 * cosDec);
          targetDec = mover.dec + (mover.motion.dec_rate_arcsec_per_day * dtDays) / 3600;
        }

        const { x, y, inBounds } = skyToPixel(targetRa, targetDec);
        if (!inBounds) return null;

        const totalRate = computeTotalRate(
          mover.motion?.ra_rate_arcsec_per_day ?? 0,
          mover.motion?.dec_rate_arcsec_per_day ?? 0
        );
        const pa = computePositionAngle(
          mover.motion?.ra_rate_arcsec_per_day ?? 0,
          mover.motion?.dec_rate_arcsec_per_day ?? 0
        );
        const compass = positionAngleToCompass(pa);

        return (
          <div
            key={`marker-${mover.object_id}`}
            style={{
              transform: `translate3d(${x}px, ${y}px, 0)`,
            }}
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 group pointer-events-auto"
          >
            <button
              type="button"
              onClick={() => onSelect(mover.object_id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(mover.object_id);
                }
              }}
              aria-label={`${isKnown ? "Known object" : "Unknown mover candidate"} ${
                mover.match_name || mover.object_id
              }${isPredicted ? " (Predicted position)" : ""}`}
              className={`relative flex items-center justify-center transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none cursor-pointer ${
                isSelected ? "scale-125 z-30" : "hover:scale-110 z-10"
              }`}
            >
              {/* Outer NASA Eyes Targeting Brackets [ + ] on selected/hover */}
              <div
                className={`absolute -inset-2.5 pointer-events-none transition-opacity duration-200 ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {/* 4 corner bracket ticks */}
                <span
                  className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${
                    isKnown ? "border-cyan-400" : "border-amber-400"
                  }`}
                />
                <span
                  className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${
                    isKnown ? "border-cyan-400" : "border-amber-400"
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${
                    isKnown ? "border-cyan-400" : "border-amber-400"
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${
                    isKnown ? "border-cyan-400" : "border-amber-400"
                  }`}
                />
              </div>

              {/* Core Reticle: Circle for Known vs Diamond for Unknown */}
              {isKnown ? (
                /* Circle for Known Asteroid / Comet */
                <div
                  className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isPredicted
                      ? "border-dashed border-cyan-400/50 bg-cyan-950/40 opacity-70"
                      : "border-cyan-400 bg-cyan-950/80 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  } ${isSelected ? "ring-2 ring-white shadow-[0_0_16px_rgba(6,182,212,0.9)]" : ""}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                </div>
              ) : (
                /* Diamond for Unknown Candidate / Planet X */
                <div
                  className={`h-6 w-6 rotate-45 border-2 flex items-center justify-center transition-all ${
                    isPredicted
                      ? "border-dashed border-amber-400/50 bg-amber-950/40 opacity-70"
                      : "border-amber-400 bg-amber-950/80 shadow-[0_0_14px_rgba(245,158,11,0.7)] animate-pulse"
                  } ${isSelected ? "ring-2 ring-white shadow-[0_0_18px_rgba(245,158,11,0.9)]" : ""}`}
                >
                  <span className="h-1.5 w-1.5 bg-amber-300 -rotate-45" />
                </div>
              )}

              {/* Synthetic TEST Badge */}
              {mover.is_synthetic && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[7px] font-mono font-bold bg-slate-900/90 text-slate-300 border border-slate-700 leading-none tracking-widest shadow-sm">
                  TEST
                </span>
              )}

              {/* Floating NASA Eyes Telemetry HUD Card on Hover / Selection */}
              <div
                className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-left bg-black/85 backdrop-blur-md border transition-all duration-150 pointer-events-none shadow-2xl space-y-1 min-w-[170px] ${
                  isKnown
                    ? "border-cyan-500/40 text-cyan-200 shadow-cyan-950/50"
                    : "border-amber-500/40 text-amber-200 shadow-amber-950/50"
                } ${
                  isSelected
                    ? "opacity-100 scale-100 z-30"
                    : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 z-20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] leading-none">{isKnown ? "●" : "◆"}</span>
                    <span className="font-bold font-sans text-xs text-white">
                      {mover.match_name || mover.object_id}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-mono uppercase px-1 rounded ${
                      isKnown ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {mover.type}
                  </span>
                </div>

                <div className="space-y-0.5 text-[10px] font-mono text-white/70">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Rate:</span>
                    <span className="font-semibold text-white">
                      {totalRate.toFixed(1)}&quot;/d ({compass})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Confidence:</span>
                    <span className="font-semibold text-white">
                      {(mover.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {isPredicted && (
                    <div className="text-[9px] text-amber-400 font-semibold pt-0.5">
                      [PREDICTED] Position extrapolated
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

