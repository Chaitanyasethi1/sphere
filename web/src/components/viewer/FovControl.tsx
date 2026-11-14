"use client";

import React, { useState } from "react";
import { DESIGN_TOKENS } from "@/design/tokens";

export interface FovControlProps {
  fov: number;
  onFovChange: (newFov: number) => void;
  coverageLimitDeg?: number;
  className?: string;
}

export function FovControl({
  fov,
  onFovChange,
  coverageLimitDeg = DESIGN_TOKENS.fov.coverageLimitDeg,
  className = "",
}: FovControlProps) {
  const [customInput, setCustomInput] = useState<string>(String(fov));
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const presets = DESIGN_TOKENS.fov.presets;
  const isOverCoverage = fov > coverageLimitDeg;

  const clampFov = (val: number): number => {
    return Math.max(DESIGN_TOKENS.fov.min, Math.min(DESIGN_TOKENS.fov.max, val));
  };

  const handlePresetSelect = (presetVal: number) => {
    setIsEditingCustom(false);
    setCustomInput(String(presetVal));
    onFovChange(presetVal);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(customInput);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = clampFov(parsed);
      setCustomInput(String(clamped));
      onFovChange(clamped);
      setIsEditingCustom(false);
    }
  };

  return (
    <div
      className={`glass-panel px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 select-none shadow-2xl ${className}`}
    >
      <span className="text-[10px] uppercase tracking-widest text-white/50 font-mono font-semibold">
        FOV
      </span>
      <span className="text-xs font-mono font-bold text-cyan-300">
        {fov.toFixed(2)}°
      </span>

      <div className="h-3 w-px bg-white/10 mx-0.5" />

      {/* Preset Buttons */}
      <div className="flex items-center gap-1">
        {presets.map((preset) => {
          const isSelected = Math.abs(fov - preset) < 0.001;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`min-h-[26px] px-2 py-0.5 text-[10px] font-mono rounded-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                isSelected
                  ? "bg-cyan-500 text-space-950 font-bold shadow-sm shadow-cyan-500/30"
                  : "bg-white/5 hover:bg-white/15 text-white/70 border border-white/5"
              }`}
            >
              {preset}°
            </button>
          );
        })}

        {/* Custom FoV Input Toggle */}
        {!isEditingCustom ? (
          <button
            type="button"
            onClick={() => setIsEditingCustom(true)}
            className="min-h-[26px] px-2 py-0.5 text-[10px] font-mono rounded-md bg-white/5 hover:bg-white/15 text-white/50 hover:text-white border border-white/5 cursor-pointer"
          >
            Custom
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1">
            <input
              type="number"
              step="0.05"
              min="0.02"
              max="5.0"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-14 min-h-[26px] px-1.5 py-0 text-[10px] font-mono rounded bg-black border border-cyan-400 text-white"
              autoFocus
            />
            <button
              type="submit"
              className="min-h-[26px] px-2 py-0 text-[10px] font-mono rounded bg-cyan-500 text-space-950 font-bold cursor-pointer"
            >
              Set
            </button>
          </form>
        )}
      </div>

      {/* Coverage Indicator Dot */}
      {isOverCoverage && (
        <span
          className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 shrink-0 ml-1"
          title={`No precomputed data beyond ${coverageLimitDeg}°. Showing sky background only.`}
        />
      )}
    </div>
  );
}

