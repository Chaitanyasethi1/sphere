"use client";

import React, { useState } from "react";
import type { UniverseLayers } from "./types";

interface LayerControls3DProps {
  layers: UniverseLayers;
  onToggleLayer: (layer: keyof UniverseLayers) => void;
  onResetCamera: () => void;
  className?: string;
}

export function LayerControls3D({
  layers,
  onToggleLayer,
  onResetCamera,
  className = "",
}: LayerControls3DProps) {
  const [isOpen, setIsOpen] = useState(false);

  const layerItems: Array<{
    id: keyof UniverseLayers;
    label: string;
    icon: string;
    active: boolean;
  }> = [
    { id: "solarOrbits", label: "Solar System Orbits", icon: "🪐", active: layers.solarOrbits },
    { id: "trajectories", label: "Mover Trajectories", icon: "〰️", active: layers.trajectories },
    { id: "grid", label: "Celestial Grid", icon: "🌐", active: layers.grid },
    { id: "nebula", label: "Cosmic Nebula", icon: "🌌", active: layers.nebula },
    { id: "stars", label: "Starfield", icon: "✨", active: layers.stars },
    { id: "labels", label: "Labels & HUD", icon: "🏷️", active: layers.labels },
    { id: "footprint", label: "Survey Footprint", icon: "🔭", active: layers.footprint },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Collapsed / Expanded NASA Eyes Layer Dock */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
            isOpen
              ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
          aria-expanded={isOpen}
          aria-label="Toggle 3D visual layers menu"
        >
          <span className="text-xs">☷</span>
          <span className="text-[10px] uppercase tracking-widest font-sans font-semibold">
            LAYERS
          </span>
          <span className="text-[9px] font-mono px-1 rounded bg-white/15">
            {Object.values(layers).filter(Boolean).length}/7
          </span>
        </button>

        {/* Quick Reset Camera View Button */}
        <button
          type="button"
          onClick={onResetCamera}
          className="px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
          title="Reset 3D Camera View"
        >
          <span>↺</span>
          <span className="hidden sm:inline">RESET</span>
        </button>
      </div>

      {/* Layer Toggle Floating Drawer */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-56 p-2 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-1 z-50">
          <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-white/40 border-b border-white/10">
            3D Visualisation Layers
          </div>

          {layerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleLayer(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                item.active
                  ? "bg-white/10 text-cyan-300 font-semibold"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{item.icon}</span>
                <span className="text-[11px] font-sans">{item.label}</span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  item.active ? "bg-cyan-400 shadow-sm shadow-cyan-400" : "bg-white/20"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
