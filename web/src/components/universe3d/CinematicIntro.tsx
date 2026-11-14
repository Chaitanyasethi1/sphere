"use client";

import React, { useState, useEffect } from "react";

interface CinematicIntroProps {
  onComplete: () => void;
  autoPlayDurationMs?: number;
}

export function CinematicIntro({
  onComplete,
  autoPlayDurationMs = 3800,
}: CinematicIntroProps) {
  const [stage, setStage] = useState<"init" | "reveal" | "fadeout">("init");

  useEffect(() => {
    // Stage 1: Reveal title after initial cosmic darkness (300ms)
    const t1 = setTimeout(() => setStage("reveal"), 300);

    // Stage 2: Begin fadeout into the 3D world (autoPlayDurationMs - 800ms)
    const t2 = setTimeout(() => setStage("fadeout"), autoPlayDurationMs - 800);

    // Stage 3: Complete and unmount intro overlay
    const t3 = setTimeout(() => onComplete(), autoPlayDurationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [autoPlayDurationMs, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050816] transition-opacity duration-700 select-none ${
        stage === "fadeout" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background radial cosmic glow */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(circle at center, rgba(57, 33, 111, 0.45) 0%, rgba(16, 27, 70, 0.6) 45%, rgba(5, 8, 22, 1) 90%)",
        }}
      />

      {/* Center Cinematic Mission Title Card */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 max-w-xl transition-all duration-1000 transform ${
          stage === "reveal"
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-6 opacity-0 scale-95"
        }`}
      >
        {/* Mission Badge Tag */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-cyan-400/30 text-cyan-300 text-[10px] md:text-xs font-mono uppercase tracking-widest shadow-lg shadow-cyan-950/50 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>NASA Space Apps Challenge 2026 · Planet X &amp; SPHEREx</span>
        </div>

        {/* Main Title with Cosmic Gradient Text */}
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 drop-shadow-2xl">
          SPHEREx Sky Diary
        </h1>

        <p className="mt-2 text-xs md:text-sm text-cyan-200/70 font-mono tracking-wide max-w-md">
          All-Sky Near-Infrared Spectral Survey &amp; Moving Object Discovery Universe
        </p>

        {/* Subtitle Telemetry line */}
        <div className="mt-6 flex items-center gap-3 text-[10px] font-mono text-white/40">
          <span>0.75 - 5.0 µm</span>
          <span>•</span>
          <span>102 Spectral Channels</span>
          <span>•</span>
          <span>Kinematic Astrometry</span>
        </div>

        {/* Loading Progress Bar */}
        <div className="mt-8 w-48 h-1 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-amber-400 rounded-full animate-[progress_3.5s_ease-out_forwards]"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Skip Button (Bottom Right) */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-6 right-6 z-20 px-4 py-1.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white/70 hover:text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center gap-1.5 group"
      >
        <span>Skip Intro</span>
        <span className="group-hover:translate-x-0.5 transition-transform">»</span>
      </button>
    </div>
  );
}
