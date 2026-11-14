"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TestDataBadge } from "@/components/ui";
import { CHALLENGE_TARGETS } from "@/data/targets";

export interface AppHeaderProps {
  isSynthetic?: boolean;
  beginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  candidateCount?: number;
  onOpenTour?: () => void;
  onOpenShare?: () => void;
  onOpenSearch?: () => void;
  activeTargetName?: string;
  isDemo?: boolean;
  onToggleDemo?: () => void;
  onSelectTarget?: (target: { ra: number; dec: number; fov: number; name: string }) => void;
  mode3D?: boolean;
  onToggleMode3D?: () => void;
}

export function AppHeader({
  isSynthetic = false,
  beginnerMode,
  onToggleBeginnerMode,
  onOpenTour,
  onOpenShare,
  onOpenSearch,
  activeTargetName = "SPHEREx Deep Field North",
  isDemo = false,
  onToggleDemo,
  onSelectTarget,
  mode3D = true,
  onToggleMode3D,
}: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  return (
    <>
      <header className="h-14 px-6 md:px-8 border-b border-white/5 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between gap-4 shrink-0 z-30 select-none">
        {/* 1. NASA Meatball & EYES / SPHEREx Title (Identical to NASA Eyes) */}
        <div className="flex items-center gap-3.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg group"
            aria-label="SPHEREx Sky Diary Home"
          >
            {/* NASA Meatball Insignia Vector */}
            <div className="h-8 w-8 rounded-full bg-[#0b3d91] relative overflow-hidden flex items-center justify-center border border-blue-400/30 group-hover:scale-105 transition-transform shrink-0">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="25" cy="30" r="1.5" fill="white" opacity="0.9" />
                <circle cx="75" cy="28" r="1.2" fill="white" opacity="0.8" />
                <circle cx="35" cy="72" r="1.5" fill="white" opacity="0.7" />
                <circle cx="68" cy="68" r="1" fill="white" opacity="0.9" />
                <circle cx="50" cy="20" r="1.3" fill="white" opacity="0.8" />
                <circle cx="82" cy="50" r="1.2" fill="white" opacity="0.8" />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="42"
                  ry="18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeOpacity="0.8"
                  transform="rotate(-25 50 50)"
                />
                <path d="M18 68 L50 22 L65 52 L54 52 L48 38 L30 68 Z" fill="#fc3d21" />
              </svg>
              <span className="relative z-10 text-[8px] font-black tracking-tighter text-white font-sans drop-shadow-md">
                NASA
              </span>
            </div>

            {/* Title styled like EYES ON THE SOLAR SYSTEM */}
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs md:text-sm font-semibold tracking-widest text-white/90 uppercase">
                Eyes on SPHEREx: Sky Diary
              </span>
            </div>
          </Link>

          {/* Minimal TEST DATA Indicator */}
          {isSynthetic && (
            <div className="ml-1">
              <TestDataBadge />
            </div>
          )}
        </div>

        {/* 2. Interactive Target Quick-Pick Popover */}
        <div className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-all cursor-pointer"
            aria-expanded={isTargetDropdownOpen}
            aria-label="Select astronomical target"
          >
            <span className="text-cyan-400">○</span>
            <span className="truncate max-w-xs">{activeTargetName}</span>
            <svg
              className={`w-3 h-3 text-white/40 transition-transform ${isTargetDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Floating Dropdown List of Challenge Targets */}
          {isTargetDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTargetDropdownOpen(false)}
              />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 p-2 shadow-2xl z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/10">
                  Challenge Targets &amp; Fields
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTarget?.({
                      ra: 269.452,
                      dec: 66.561,
                      fov: 0.2,
                      name: "SPHEREx Deep Field North",
                    });
                    setIsTargetDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
                    <span>SPHEREx Deep Field North</span>
                    <span className="text-[10px] font-mono text-cyan-400/70">Benchmark</span>
                  </div>
                  <span className="text-[10px] text-white/50 font-mono">
                    RA 269.4520° • Dec +66.5610° (4 epochs multi-cutouts)
                  </span>
                </button>
                {CHALLENGE_TARGETS.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      onSelectTarget?.({
                        ra: t.ra,
                        dec: t.dec,
                        fov: t.fovDefault,
                        name: t.name,
                      });
                      setIsTargetDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors flex flex-col gap-0.5 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>{t.name}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-white/60">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">
                      RA {t.ra.toFixed(4)}° • Dec {t.dec >= 0 ? `+${t.dec.toFixed(4)}` : t.dec.toFixed(4)}°
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 3. Right Minimal NASA Eyes Actions: 3D/2D Mode, Search, Share, Menu */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0 text-xs font-sans text-white/80">
          {/* Mode Switcher Pill: 3D Universe vs 2D Sky Survey */}
          {onToggleMode3D && (
            <div className="flex items-center p-0.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md">
              <button
                type="button"
                onClick={() => !mode3D && onToggleMode3D()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-mono transition-all cursor-pointer ${
                  mode3D
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md shadow-cyan-500/30"
                    : "text-white/60 hover:text-white"
                }`}
                aria-pressed={mode3D}
                title="Interactive 3D Celestial Universe"
              >
                <span>🌌</span>
                <span className="font-semibold uppercase tracking-wider">3D UNIVERSE</span>
              </button>
              <button
                type="button"
                onClick={() => mode3D && onToggleMode3D()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-mono transition-all cursor-pointer ${
                  !mode3D
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold shadow-md shadow-amber-500/30"
                    : "text-white/60 hover:text-white"
                }`}
                aria-pressed={!mode3D}
                title="Scientific 2D Aladin Lite Sky Survey"
              >
                <span>🔭</span>
                <span className="font-semibold uppercase tracking-wider">2D SURVEY</span>
              </button>
            </div>
          )}

          {/* Quick Search Icon Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5 py-1 px-1.5 cursor-pointer"
            aria-label="Search celestial targets or coordinates"
            title="Search (Hotkey: /)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Share */}
          {onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5 py-1 cursor-pointer tracking-wider"
              aria-label="Share current sky view"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white/70 hover:text-white transition-colors flex items-center gap-1.5 py-1 cursor-pointer tracking-wider"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Slide-out NASA Eyes Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#0a0f1d]/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#0b3d91] flex items-center justify-center text-[7px] font-black text-white">
                    NASA
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white font-semibold">
                    Menu &amp; Settings
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white/40 hover:text-white text-lg font-mono px-2"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Navigation</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenTour?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white flex items-center justify-between transition-colors"
                >
                  <span>🧭 Guided Walkthrough Tour</span>
                  <span className="text-cyan-400 font-mono text-[10px]">4 steps</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleBeginnerMode();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white flex items-center justify-between transition-colors"
                >
                  <span>Beginner Explanations</span>
                  <span className={`font-mono text-[10px] ${beginnerMode ? "text-cyan-400" : "text-white/40"}`}>
                    {beginnerMode ? "ON" : "OFF"}
                  </span>
                </button>

                {onToggleDemo && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleDemo();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white flex items-center justify-between transition-colors"
                  >
                    <span>Offline Demo Mode</span>
                    <span className={`font-mono text-[10px] ${isDemo ? "text-amber-400" : "text-white/40"}`}>
                      {isDemo ? "OFFLINE" : "ONLINE"}
                    </span>
                  </button>
                )}

                <Link
                  href="/design"
                  className="block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-space-300 hover:text-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  🎨 Design System Tokens
                </Link>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-[10px] uppercase font-mono tracking-widest text-white/40">Challenge Context</p>
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/60 space-y-1">
                  <p className="font-semibold text-white/80">NASA Space Apps Challenge 2026</p>
                  <p>Planet X and SPHEREx: Exploring Unknown Moving Objects across 102 infrared spectral channels.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-center text-[10px] text-white/30 font-mono">
              SPHEREx Sky Diary v1.0 · NASA Space Apps
            </div>
          </div>
        </div>
      )}
    </>
  );
}
