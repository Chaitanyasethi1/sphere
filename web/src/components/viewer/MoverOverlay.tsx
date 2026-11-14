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
            const lineColor = isKnown ? "#22D3EE" : "#E0A526";

            // Collect historical detections up to current epoch
            const pastDetections = (mover.detections || []).slice(0, currentEpochIndex + 1);
            if (pastDetections.length < 2) return null;

            const points = pastDetections.map((det) => skyToPixel(det.ra, det.dec));
            const pathData = points
              .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
              .join(" ");

            return (
              <g key={`trail-group-${mover.object_id}`}>
                {/* Thin 1px trajectory path without heavy glows */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={isSelected ? 1.5 : 1.0}
                  strokeDasharray={isKnown ? "none" : "3 2"}
                  strokeOpacity={isSelected ? 0.95 : 0.65}
                />
                {/* Numbered epoch node dots along trajectory */}
                {points.map((pt, pIdx) => (
                  <circle
                    key={`node-${mover.object_id}-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={pIdx === currentEpochIndex ? 2 : 1.2}
                    fill={pIdx === currentEpochIndex ? "#ffffff" : lineColor}
                    stroke="#010206"
                    strokeWidth={0.5}
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
              className={`relative flex items-center gap-2 transition-all duration-200 focus-visible:ring-1 focus-visible:ring-[#22D3EE] focus-visible:outline-none cursor-pointer ${
                isSelected ? "z-30 scale-105" : "hover:scale-105 z-10"
              }`}
            >
              {/* Outer targeting indicator on hover/select */}
              <div
                className={`absolute -inset-1.5 pointer-events-none transition-opacity duration-150 ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span
                  className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${
                    isKnown ? "border-[#22D3EE]" : "border-[#E0A526]"
                  }`}
                />
                <span
                  className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r ${
                    isKnown ? "border-[#22D3EE]" : "border-[#E0A526]"
                  }`}
                />
                <span
                  className={`absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l ${
                    isKnown ? "border-[#22D3EE]" : "border-[#E0A526]"
                  }`}
                />
                <span
                  className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${
                    isKnown ? "border-[#22D3EE]" : "border-[#E0A526]"
                  }`}
                />
              </div>

              {/* Core Ring Marker: Cyan Circle for Known vs Gold Diamond for Unknown */}
              {isKnown ? (
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                    isPredicted
                      ? "border-dashed border-[#22D3EE]/50 bg-black/40"
                      : "border-[#22D3EE] bg-black/60 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                  } ${isSelected ? "ring-1 ring-white" : ""}`}
                >
                  <span className="h-1 w-1 rounded-full bg-[#22D3EE]" />
                </div>
              ) : (
                <div
                  className={`h-3.5 w-3.5 rotate-45 border flex items-center justify-center transition-all ${
                    isPredicted
                      ? "border-dashed border-[#E0A526]/50 bg-black/40"
                      : "border-[#E0A526] bg-black/60 shadow-[0_0_8px_rgba(224,165,38,0.5)]"
                  } ${isSelected ? "ring-1 ring-white" : ""}`}
                >
                  <span className="h-1 w-1 bg-[#E0A526] -rotate-45" />
                </div>
              )}

              {/* Object label: wide-tracked uppercase white text */}
              <span className="text-[11px] font-sans font-normal uppercase tracking-[0.22em] text-white select-none whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {mover.match_name || mover.object_id}
              </span>

              {/* Synthetic TEST Badge */}
              {mover.is_synthetic && (
                <span className="px-1 py-0.2 rounded-[2px] text-[7px] font-mono font-medium bg-black/80 text-[#B8BCC4] border border-white/20 tracking-wider">
                  TEST
                </span>
              )}

              {/* Floating Telemetry HUD on Hover / Select */}
              <div
                className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 p-2.5 rounded-[3px] text-left bg-[rgba(20,20,22,0.95)] backdrop-blur-md border border-white/[0.12] transition-all duration-150 pointer-events-none shadow-2xl space-y-1 min-w-[170px] ${
                  isSelected
                    ? "opacity-100 scale-100 z-30"
                    : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 z-20"
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] leading-none text-[#E0A526]">{isKnown ? "●" : "◆"}</span>
                    <span className="font-light text-xs text-white uppercase tracking-wider">
                      {mover.match_name || mover.object_id}
                    </span>
                  </div>
                  <span
                    className={`text-[8px] font-mono uppercase px-1 rounded-[2px] ${
                      isKnown ? "bg-[#22D3EE]/20 text-[#22D3EE]" : "bg-[#E0A526]/20 text-[#E0A526]"
                    }`}
                  >
                    {mover.type}
                  </span>
                </div>

                <div className="space-y-0.5 text-[10px] font-mono text-[#B8BCC4]">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Rate:</span>
                    <span className="text-white font-mono">
                      {totalRate.toFixed(1)}&quot;/d ({compass})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Confidence:</span>
                    <span className="text-white font-mono">
                      {(mover.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {isPredicted && (
                    <div className="text-[9px] text-[#E0A526] font-mono pt-0.5">
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

