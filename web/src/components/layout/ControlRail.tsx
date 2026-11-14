"use client";

import React, { useState } from "react";
import {
  Info,
  Layers,
  ZoomIn,
  ZoomOut,
  SunMedium,
  Maximize2,
  Minimize2,
  Sliders,
  Globe2,
  RotateCcw,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { DESIGN_TOKENS } from "@/design/tokens";

export interface ControlRailProps {
  onToggleInfo?: () => void;
  isInfoOpen?: boolean;
  onToggleLayers?: () => void;
  isLayersOpen?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onToggleInvert?: () => void;
  isInverted?: boolean;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  mode3D?: boolean;
  onToggleMode3D?: () => void;
  onResetView?: () => void;
  className?: string;
}

export function ControlRail({
  onToggleInfo,
  isInfoOpen = false,
  onToggleLayers,
  isLayersOpen = false,
  onZoomIn,
  onZoomOut,
  onToggleInvert,
  isInverted = false,
  onToggleFullscreen,
  isFullscreen = false,
  mode3D = true,
  onToggleMode3D,
  onResetView,
  className = "",
}: ControlRailProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <aside
      aria-label="Viewport controls"
      className={`fixed right-3 md:right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-auto ${className}`}
    >
      {/* Vertical Stack of Square Icon Buttons (42x42px, min 44px touch) */}
      <div className="flex flex-col bg-[rgba(20,20,22,0.72)] backdrop-blur-md border border-white/[0.12] rounded-[3px] overflow-hidden shadow-2xl divide-y divide-white/[0.12]">
        {/* 1. Mode 3D Universe / 2D Survey Toggle */}
        {onToggleMode3D && (
          <Tooltip content={mode3D ? "SWITCH TO 2D SKY SURVEY" : "SWITCH TO 3D UNIVERSE"} position="left">
            <button
              type="button"
              onClick={onToggleMode3D}
              aria-label={mode3D ? "Switch to 2D scientific survey" : "Switch to 3D celestial universe"}
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer group ${
                DESIGN_TOKENS.a11y.focusRing
              } ${mode3D ? "text-[#22D3EE] bg-white/[0.04]" : "text-white/85 hover:text-white hover:bg-white/[0.08]"}`}
            >
              <Globe2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 2. Mission Info */}
        {onToggleInfo && (
          <Tooltip content="MISSION INFORMATION" position="left">
            <button
              type="button"
              onClick={onToggleInfo}
              aria-label="Toggle mission information"
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              } ${isInfoOpen ? "text-[#22D3EE] bg-white/[0.04]" : "text-white/85 hover:text-white hover:bg-white/[0.08]"}`}
            >
              <Info className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 3. Layers */}
        {onToggleLayers && (
          <Tooltip content="CELESTIAL LAYERS" position="left">
            <button
              type="button"
              onClick={onToggleLayers}
              aria-label="Toggle celestial layers"
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              } ${isLayersOpen ? "text-[#22D3EE] bg-white/[0.04]" : "text-white/85 hover:text-white hover:bg-white/[0.08]"}`}
            >
              <Layers className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 4. Zoom In */}
        {onZoomIn && (
          <Tooltip content="ZOOM IN" position="left">
            <button
              type="button"
              onClick={onZoomIn}
              aria-label="Zoom in"
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center text-white/85 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              }`}
            >
              <ZoomIn className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 5. Zoom Out */}
        {onZoomOut && (
          <Tooltip content="ZOOM OUT" position="left">
            <button
              type="button"
              onClick={onZoomOut}
              aria-label="Zoom out"
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center text-white/85 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              }`}
            >
              <ZoomOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 6. Contrast / Brightness */}
        {onToggleInvert && (
          <Tooltip content="CONTRAST / INVERT" position="left">
            <button
              type="button"
              onClick={onToggleInvert}
              aria-label="Toggle color contrast and image inversion"
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              } ${isInverted ? "text-[#22D3EE] bg-white/[0.04]" : "text-white/85 hover:text-white hover:bg-white/[0.08]"}`}
            >
              <SunMedium className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* 7. Fullscreen */}
        {onToggleFullscreen && (
          <Tooltip content={isFullscreen ? "EXIT FULLSCREEN" : "ENTER FULLSCREEN"} position="left">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center text-white/85 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
              ) : (
                <Maximize2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
              )}
            </button>
          </Tooltip>
        )}

        {/* 8. Settings & Reset Popover */}
        <div className="relative">
          <Tooltip content="SETTINGS & RESET" position="left">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              aria-label="Settings and camera reset options"
              aria-expanded={isSettingsOpen}
              className={`w-[42px] h-[42px] min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                DESIGN_TOKENS.a11y.focusRing
              } ${isSettingsOpen ? "text-[#22D3EE] bg-white/[0.04]" : "text-white/85 hover:text-white hover:bg-white/[0.08]"}`}
            >
              <Sliders className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </Tooltip>

          {/* Settings Compact Flyout */}
          {isSettingsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSettingsOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-52 rounded-[3px] bg-[rgba(20,20,22,0.95)] backdrop-blur-xl border border-white/[0.12] p-2 shadow-2xl z-50 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#7E8492] border-b border-white/[0.08]">
                  SETTINGS &amp; CONTROLS
                </div>
                {onResetView && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetView();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[2px] text-left hover:bg-white/[0.08] text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span className="font-sans text-xs">Reset View to Sun</span>
                  </button>
                )}
                {onToggleMode3D && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMode3D();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-[2px] text-left hover:bg-white/[0.08] text-white transition-colors cursor-pointer"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-[#E0A526]" />
                    <span className="font-sans text-xs">
                      {mode3D ? "Switch to 2D Survey" : "Switch to 3D Universe"}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
