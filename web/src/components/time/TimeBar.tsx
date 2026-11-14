"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import type { EpochInfo } from "@/types";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

export interface TimeBarProps {
  epochs: EpochInfo[];
  currentEpochIndex: number;
  onEpochChange: (index: number) => void;
  isSynthetic?: boolean;
  className?: string;
}

export function TimeBar({
  epochs,
  currentEpochIndex,
  onEpochChange,
  isSynthetic = true,
  className = "",
}: TimeBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per frame
  const [loop] = useState<boolean>(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const handlePrev = useCallback(() => {
    onEpochChange(Math.max(0, currentEpochIndex - 1));
  }, [currentEpochIndex, onEpochChange]);

  const handleNext = useCallback(() => {
    if (currentEpochIndex < epochs.length - 1) {
      onEpochChange(currentEpochIndex + 1);
    } else if (loop) {
      onEpochChange(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentEpochIndex, epochs.length, loop, onEpochChange]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion || epochs.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, playbackSpeed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, prefersReducedMotion, epochs.length, playbackSpeed, handleNext]);

  // Pause when document hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlaying]);

  // Keyboard Shortcuts (Space = Play/Pause, ArrowLeft/Right = Step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!prefersReducedMotion) {
          setIsPlaying((prev) => !prev);
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, prefersReducedMotion]);

  const currentEpoch = epochs[currentEpochIndex] || epochs[0];

  // Format epoch date for NASA Eyes header
  const dateObj = currentEpoch ? new Date(currentEpoch.date) : new Date();
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()
    : "MAR 01, 2026";
  const timeFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "00:00:00";

  // Compute uneven timestamp percentages across survey epochs
  const epochTimes = epochs.map((e) => new Date(e.date).getTime()).filter((t) => !isNaN(t));
  const minTime = epochTimes.length > 0 ? Math.min(...epochTimes) : 0;
  const maxTime = epochTimes.length > 0 ? Math.max(...epochTimes) : 1;
  const timeSpan = Math.max(1, maxTime - minTime);

  const getEpochPercent = (idx: number) => {
    if (epochs.length <= 1) return 0;
    const epTime = new Date(epochs[idx].date).getTime();
    if (isNaN(epTime) || minTime === maxTime) {
      return (idx / (epochs.length - 1)) * 100;
    }
    return ((epTime - minTime) / timeSpan) * 100;
  };

  const currentHandlePercent = getEpochPercent(currentEpochIndex);

  return (
    <div
      role="region"
      aria-label="Time-lapse and observation epoch controls"
      className={`bg-[rgba(20,20,22,0.85)] backdrop-blur-xl border border-white/[0.12] rounded-[3px] p-3 md:px-5 md:py-3 shadow-2xl flex flex-col gap-2.5 select-none text-white ${className}`}
    >
      {/* 1. Single Row Header (Like Reference B) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/[0.08] pb-2">
        {/* Left: Status Pill & Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSynthetic ? "bg-[#94A3B8]" : "bg-[#22D3EE]"
              } animate-pulse`}
            />
            <span className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-[#B8BCC4]">
              {isSynthetic ? "SYNTHETIC" : "OBSERVED"}
            </span>
          </div>
          <span className="font-sans font-light text-sm md:text-base text-white tracking-wide">
            {dateFormatted}
          </span>
        </div>

        {/* Center: Large Light-weight Uppercase Epoch Label */}
        <div className="font-sans font-light text-xs md:text-[13px] tracking-[0.24em] uppercase text-white/90">
          EPOCH {currentEpochIndex + 1} OF {Math.max(1, epochs.length)}
        </div>

        {/* Right: Time Readout & Controls */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[#7E8492] hidden sm:inline">
            {timeFormatted} UTC
          </span>

          {/* Stepper Buttons (Min 44px touch target) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentEpochIndex === 0 && !loop}
              aria-label="Previous observation epoch"
              className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {!prefersReducedMotion && (
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Pause Time-Lapse" : "Play Time-Lapse"}
                className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[2px] bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 border border-[#22D3EE]/50 text-[#22D3EE] flex items-center justify-center transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={currentEpochIndex === epochs.length - 1 && !loop}
              aria-label="Next observation epoch"
              className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white flex items-center justify-center disabled:opacity-30 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Presets */}
          <div className="hidden lg:flex items-center gap-1">
            {[
              { label: "0.5x", ms: 2000 },
              { label: "1x", ms: 1000 },
              { label: "2x", ms: 500 },
            ].map((spd) => (
              <button
                key={spd.label}
                type="button"
                onClick={() => setPlaybackSpeed(spd.ms)}
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono transition-colors cursor-pointer ${
                  playbackSpeed === spd.ms
                    ? "bg-[#22D3EE] text-black font-bold"
                    : "bg-white/[0.04] text-[#7E8492] hover:text-white"
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Thin Timeline Line with Dual-Ring 36px Circular Scrubber Handle */}
      <div className="relative w-full pt-3 pb-5 px-2">
        {/* Track Line */}
        <div className="relative w-full h-[2px] bg-white/20 rounded-none">
          {/* Active Progress Line */}
          <div
            className="h-full bg-[#22D3EE] transition-all"
            style={{ width: `${currentHandlePercent}%` }}
          />

          {/* Real Epoch Ticks with Uneven Spacing */}
          {epochs.map((ep, idx) => {
            const percent = getEpochPercent(idx);
            const isSelected = idx === currentEpochIndex;
            return (
              <div
                key={ep.epoch_id}
                onClick={() => onEpochChange(idx)}
                style={{ left: `${percent}%` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer group py-2"
                title={`${ep.epoch_id}: ${new Date(ep.date).toLocaleDateString()}`}
              >
                {/* Tick dot */}
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isSelected ? "bg-[#22D3EE] scale-125" : "bg-white/40 group-hover:bg-white"
                  }`}
                />

                {/* Tick label with epoch_id for tests & identification */}
                <span
                  className={`absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap transition-colors ${
                    isSelected ? "text-[#22D3EE] font-semibold" : "text-[#7E8492] group-hover:text-white"
                  }`}
                >
                  {ep.epoch_id}
                </span>
              </div>
            );
          })}

          {/* Circular 36px Dual-Ring Scrubber Handle (Spec 7: like reference orbit handle) */}
          <div
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, epochs.length - 1)}
            aria-valuenow={currentEpochIndex}
            aria-label="Observation epoch timeline scrubber"
            style={{ left: `${currentHandlePercent}%` }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#181a20] border-2 border-white/70 hover:border-white focus-visible:ring-2 focus-visible:ring-[#22D3EE] flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl transition-all pointer-events-auto"
          >
            {/* Inner Ring */}
            <div className="w-4 h-4 rounded-full border border-white/40 bg-black/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
