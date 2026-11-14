"use client";

import React, { useState, useEffect } from "react";
import type { MoverCandidate } from "@/types";
import { MoversPanel } from "@/components/movers/MoversPanel";
import { ObjectDetail } from "@/components/movers/ObjectDetail";
import { Badge } from "@/components/ui/Badge";

export interface SidePanelProps {
  movers: MoverCandidate[];
  selectedMover: MoverCandidate | null;
  onSelectMover: (mover: MoverCandidate | null) => void;
  beginnerMode: boolean;
  selectedEpochId?: string | null;
  onSelectEpoch?: (epochId: string) => void;
  regionName?: string;
}

export function SidePanel({
  movers,
  selectedMover,
  onSelectMover,
  beginnerMode,
  selectedEpochId,
  onSelectEpoch,
  regionName = "SPHEREx Deep Field",
}: SidePanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(false);

  // Auto-expand drawer when an object is selected
  useEffect(() => {
    if (selectedMover) {
      setMobileExpanded(true);
      setDesktopCollapsed(false);
    }
  }, [selectedMover]);

  const currentIndex = selectedMover
    ? movers.findIndex((m) => m.object_id === selectedMover.object_id)
    : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < movers.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onSelectMover(movers[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectMover(movers[currentIndex + 1]);
    }
  };

  // Re-open tab when collapsed
  if (desktopCollapsed) {
    return (
      <div className="fixed top-16 left-3 z-40 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            setDesktopCollapsed(false);
            setMobileExpanded(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-[3px] bg-[rgba(20,20,22,0.85)] hover:bg-[rgba(30,32,40,0.95)] backdrop-blur-md border border-white/[0.12] hover:border-[#22D3EE]/50 text-white shadow-2xl transition-all cursor-pointer group"
          title="Open Featured Movers and Targets"
          aria-label="Open Featured Movers and Targets"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E0A526] shadow-sm shadow-[#E0A526] animate-pulse" />
          <span className="text-[11px] font-sans tracking-[0.2em] uppercase font-medium text-[#E0A526]">
            MOVERS ({movers.length})
          </span>
          <span className="text-xs font-mono text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-transform">
            »
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`nasa-eyes-panel border-t md:border-t-0 md:border-r border-white/[0.12] flex flex-col transition-all duration-250 z-30 ${
        mobileExpanded
          ? "fixed inset-x-0 bottom-0 h-[85vh] md:relative md:h-full md:w-[440px]"
          : "fixed inset-x-0 bottom-0 h-16 md:relative md:h-full md:w-[440px]"
      }`}
    >
      {/* 1. Header Row (Desktop): Plain grey title text in sentence case + square collapse button « */}
      <div className="hidden md:flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] shrink-0 bg-black/40">
        <span className="text-sm font-sans font-light text-[#B8BCC4] tracking-wide">
          {selectedMover ? "Mission Telemetry & Dossier" : "Featured Movers and Targets"}
        </span>
        <button
          type="button"
          onClick={() => {
            setDesktopCollapsed(true);
            setMobileExpanded(false);
          }}
          className="w-7 h-7 rounded-[3px] border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] hover:border-white/25 text-white/70 hover:text-white transition-colors flex items-center justify-center text-xs font-mono cursor-pointer"
          title="Collapse Panel"
          aria-label="Collapse panel"
        >
          «
        </button>
      </div>

      {/* Mobile drag handle & toggle bar (Min 44px touch target) */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-2 bg-[rgba(20,20,22,0.95)] border-b border-white/10 cursor-pointer select-none shrink-0 min-h-[44px]"
        onClick={() => setMobileExpanded(!mobileExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-white/20 rounded-full mx-auto" />
          <span className="text-xs font-mono font-medium text-white">
            {selectedMover
              ? selectedMover.match_name || selectedMover.object_id
              : `${movers.length} Movers Detected`}
          </span>
          {selectedMover && (
            <Badge variant={selectedMover.type === "known" ? "known" : "unknown"} size="sm">
              {selectedMover.type}
            </Badge>
          )}
        </div>
        <button
          type="button"
          aria-label={mobileExpanded ? "Collapse mover panel" : "Expand mover panel"}
          className="text-xs font-mono text-[#22D3EE] min-h-[44px] px-2 flex items-center"
        >
          {mobileExpanded ? "▼ Minimize" : "▲ Expand"}
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden p-2 md:p-3 ${!mobileExpanded ? "hidden md:flex" : "flex"}`}>
        {selectedMover ? (
          <ObjectDetail
            mover={selectedMover}
            onClose={() => onSelectMover(null)}
            onSelectEpoch={onSelectEpoch}
            selectedEpochId={selectedEpochId}
            beginnerMode={beginnerMode}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={handlePrevious}
            onNext={handleNext}
            regionName={regionName}
            className="h-full"
          />
        ) : (
          <MoversPanel
            movers={movers}
            selectedId={null}
            onSelectMover={(mover) => onSelectMover(mover)}
            beginnerMode={beginnerMode}
            className="h-full"
          />
        )}
      </div>
    </aside>
  );
}
