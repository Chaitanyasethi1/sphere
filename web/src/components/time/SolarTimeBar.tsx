"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";

export type PlaybackRate = "real" | "1d" | "10d" | "1y";

export interface SolarTimeBarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

// Timeline range bounds (default: 2024-01-01 to 2028-12-31)
const TIMELINE_MIN_MS = new Date("2024-01-01T00:00:00Z").getTime();
const TIMELINE_MAX_MS = new Date("2028-12-31T23:59:59Z").getTime();
const TIMELINE_SPAN_MS = TIMELINE_MAX_MS - TIMELINE_MIN_MS;

export function SolarTimeBar({
  currentDate,
  onDateChange,
  className = "",
}: SolarTimeBarProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rate, setRate] = useState<PlaybackRate>("1d");
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const currentDateRef = useRef<Date>(currentDate);

  useEffect(() => {
    currentDateRef.current = currentDate;
  }, [currentDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Time advancement per tick based on selected rate
  const stepForward = useCallback(
    (customDays?: number) => {
      onDateChange(
        new Date(currentDate.getTime() + (customDays ?? 1) * 86400 * 1000)
      );
    },
    [currentDate, onDateChange]
  );

  const stepBackward = useCallback(
    (customDays?: number) => {
      onDateChange(
        new Date(currentDate.getTime() - (customDays ?? 1) * 86400 * 1000)
      );
    },
    [currentDate, onDateChange]
  );

  // Playback loop
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let intervalMs = 1000;
    let deltaMs = 1000; // default real rate: 1s per 1s

    switch (rate) {
      case "real":
        intervalMs = 1000;
        deltaMs = 1000;
        break;
      case "1d":
        // 1 day per second, updated 10 times a second
        intervalMs = 100;
        deltaMs = (86400 * 1000) / 10;
        break;
      case "10d":
        // 10 days per second, updated 10 times a second
        intervalMs = 100;
        deltaMs = (10 * 86400 * 1000) / 10;
        break;
      case "1y":
        // 1 year (365.25 days) per second, updated 10 times a second
        intervalMs = 100;
        deltaMs = (365.25 * 86400 * 1000) / 10;
        break;
    }

    // Precise continuous timer
    let lastTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      const dt = time - lastTime;
      if (dt >= intervalMs) {
        lastTime = time;
        const curMs = currentDateRef.current.getTime();
        let nextMs = curMs + deltaMs;
        if (nextMs > TIMELINE_MAX_MS) {
          nextMs = TIMELINE_MIN_MS;
        }
        onDateChange(new Date(nextMs));
      }
      if (isPlaying) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, rate, prefersReducedMotion, onDateChange]);

  // Keyboard navigation: Space = Play/Pause, ArrowLeft/Right = Step
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
        stepBackward(e.shiftKey ? 10 : 1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward(e.shiftKey ? 10 : 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepBackward, stepForward, prefersReducedMotion]);

  // Slider scrub math
  const currentMs = currentDate.getTime();
  const clampedMs = Math.max(TIMELINE_MIN_MS, Math.min(TIMELINE_MAX_MS, currentMs));
  const percent = ((clampedMs - TIMELINE_MIN_MS) / TIMELINE_SPAN_MS) * 100;

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetMs = TIMELINE_MIN_MS + ratio * TIMELINE_SPAN_MS;
    onDateChange(new Date(targetMs));
  };

  const handlePointerDown = () => {
    setIsScrubbing(true);
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const moveX = moveEvt.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, moveX / rect.width));
      const targetMs = TIMELINE_MIN_MS + ratio * TIMELINE_SPAN_MS;
      onDateChange(new Date(targetMs));
    };

    const onPointerUp = () => {
      setIsScrubbing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Status pill label
  const statusLabel = isScrubbing
    ? "SCRUB"
    : isPlaying
    ? rate === "real"
      ? "REAL RATE"
      : rate === "1d"
      ? "1 DAY/S"
      : rate === "10d"
      ? "10 DAYS/S"
      : "1 YEAR/S"
    : "PAUSED";

  const dateFormatted = currentDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase();

  const timeFormatted = currentDate.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      role="region"
      aria-label="Solar system time controls and planetary timeline"
      className={`bg-[rgba(20,20,22,0.85)] backdrop-blur-xl border border-white/[0.12] rounded-[3px] p-3 md:px-5 md:py-3 shadow-2xl flex flex-col gap-2.5 select-none text-white ${className}`}
    >
      {/* 1. Header: Status Pill, Date, Time & Stepper Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/[0.08] pb-2">
        {/* Left: Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPlaying
                  ? "bg-[#22D3EE] animate-pulse"
                  : isScrubbing
                  ? "bg-[#E0A526] animate-ping"
                  : "bg-white/40"
              }`}
            />
            <span className="text-[10px] font-sans font-medium tracking-[0.2em] uppercase text-[#B8BCC4]">
              {statusLabel}
            </span>
          </div>

          {/* Date formatted in clean NASA Barlow style */}
          <span className="font-sans font-light text-sm md:text-base text-white tracking-wide">
            {dateFormatted}
          </span>
        </div>

        {/* Center: Real Rate Display */}
        <div className="font-sans font-light text-xs md:text-[13px] tracking-[0.24em] uppercase text-white/90 hidden sm:block">
          {isPlaying ? rate.toUpperCase() : "SOLAR EPHEMERIS"}
        </div>

        {/* Right: Time Readout & Controls */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#7E8492] hidden md:inline">
            {timeFormatted} UTC
          </span>

          {/* Reset to Today */}
          <button
            type="button"
            onClick={() => onDateChange(new Date())}
            title="Jump to Today / Live"
            aria-label="Jump to today"
            className="px-2 py-1 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-[10px] font-sans tracking-[0.16em] uppercase text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Live
          </button>

          {/* Step Backward */}
          <button
            type="button"
            onClick={() => stepBackward(1)}
            aria-label="Step 1 day backward"
            title="Step 1 day backward (ArrowLeft)"
            className="w-[32px] h-[32px] rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          {!prefersReducedMotion && (
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause timeline" : "Play timeline"}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              className="w-[32px] h-[32px] rounded-[2px] bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 border border-[#22D3EE]/50 text-[#22D3EE] flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Step Forward */}
          <button
            type="button"
            onClick={() => stepForward(1)}
            aria-label="Step 1 day forward"
            title="Step 1 day forward (ArrowRight)"
            className="w-[32px] h-[32px] rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Presets */}
          <div className="flex items-center rounded-[2px] bg-black/60 border border-white/10 p-0.5 ml-1">
            {(["real", "1d", "10d", "1y"] as PlaybackRate[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRate(r)}
                aria-pressed={rate === r}
                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono tracking-wider transition-colors ${
                  rate === r
                    ? "bg-[#22D3EE]/30 text-[#22D3EE] font-semibold"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {r === "real" ? "1x" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. NASA Eyes Scrub Timeline Bar (1px hairline + round grey handle) */}
      <div
        ref={sliderRef}
        onClick={handleSliderClick}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label="Planetary epoch timeline scrub"
        aria-valuemin={TIMELINE_MIN_MS}
        aria-valuemax={TIMELINE_MAX_MS}
        aria-valuenow={clampedMs}
        aria-valuetext={dateFormatted}
        tabIndex={0}
        className="relative h-6 flex items-center cursor-pointer group py-1"
      >
        {/* Track Line: 1px hairline rgba(255,255,255,0.18) */}
        <div className="w-full h-[2px] bg-white/[0.16] group-hover:bg-white/[0.3] rounded-full relative overflow-visible transition-colors">
          {/* Active elapsed fill */}
          <div
            className="h-full bg-gradient-to-r from-white/20 to-[#22D3EE]/60"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Round Grey Handle (NASA Eyes Reference B style) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#4A4E58] border-2 border-white/80 shadow-md group-hover:scale-110 transition-transform pointer-events-none"
          style={{ left: `${percent}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 m-auto mt-0.5" />
        </div>
      </div>

      {/* 3. Footer: Honesty Warning & Timeline Tick Marks */}
      <div className="flex items-center justify-between text-[10px] text-[#7E8492] font-mono px-0.5">
        <span>2024</span>
        <span className="text-amber-400/90 font-sans tracking-wider uppercase text-[9px] flex items-center gap-1">
          <span>⚠</span>
          <span>NOT LIVE SPHEREx DATA · Ephemeris via VSOP87 analytical model</span>
        </span>
        <span>2028</span>
      </div>
    </div>
  );
}
