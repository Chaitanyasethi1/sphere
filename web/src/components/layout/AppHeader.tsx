"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TestDataBadge } from "@/components/ui/Badge";
import { CHALLENGE_TARGETS } from "@/data/targets";
import { Search, Share2, Menu } from "lucide-react";

export interface AppHeaderProps {
  isSynthetic?: boolean;
  beginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  candidateCount?: number;
  onOpenTour?: () => void;
  onOpenShare?: () => void;
  onOpenSearch?: () => void;
  onOpenMenu?: () => void;
  activeTargetName?: string;
  isDemo?: boolean;
  onToggleDemo?: () => void;
  onSelectTarget?: (target: { ra: number; dec: number; fov: number; name: string }) => void;
  mode3D?: boolean;
  onToggleMode3D?: () => void;
}

export function AppHeader({
  isSynthetic = false,
  onOpenShare,
  onOpenSearch,
  onOpenMenu,
  activeTargetName = "SPHEREx Deep Field North",
  onSelectTarget,
  mode3D = true,
  onToggleMode3D,
}: AppHeaderProps) {
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  return (
    <header className="absolute top-0 inset-x-0 h-14 px-4 md:px-8 bg-transparent bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between gap-4 shrink-0 z-30 select-none pointer-events-auto">
      {/* 1. Logo & NASA Eyes Wordmark: "EYES ON SPHEREX: SKY DIARY" */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-[#22D3EE] rounded-[2px] group"
          aria-label="Eyes on SPHEREx Sky Diary Home"
        >
          {/* Swappable Logo Asset at /brand/logo.svg */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.svg"
            alt="NASA Emblem"
            className="h-7 w-7 rounded-full shrink-0 group-hover:scale-105 transition-transform"
          />

          {/* NASA Eyes Style Wide-Tracked Uppercase Wordmark */}
          <span className="font-sans font-light text-xs md:text-sm tracking-[0.24em] text-white uppercase">
            EYES ON SPHEREX: SKY DIARY
          </span>
        </Link>

        {/* TEST DATA Badge (Always visible & small but unmistakable) */}
        {isSynthetic && (
          <div className="ml-1">
            <TestDataBadge />
          </div>
        )}

        {/* Mode Toggle: Plain uppercase text with thin cyan/gold indicator */}
        {onToggleMode3D && (
          <div className="hidden lg:flex items-center ml-3 pl-3 border-l border-white/10 gap-3 text-[11px] font-sans tracking-[0.2em] uppercase">
            <button
              type="button"
              onClick={() => !mode3D && onToggleMode3D()}
              className={`transition-colors cursor-pointer py-1 ${
                mode3D ? "text-[#22D3EE] border-b border-[#22D3EE] font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              3D UNIVERSE
            </button>
            <button
              type="button"
              onClick={() => mode3D && onToggleMode3D()}
              className={`transition-colors cursor-pointer py-1 ${
                !mode3D ? "text-[#E0A526] border-b border-[#E0A526] font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              2D SURVEY
            </button>
          </div>
        )}
      </div>

      {/* 2. Interactive Astronomical Target Selector (Center/Dropdown) */}
      <div className="relative hidden xl:block">
        <button
          type="button"
          onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1 rounded-[2px] bg-black/40 hover:bg-black/70 border border-white/10 text-xs font-mono text-white/70 hover:text-white transition-all cursor-pointer"
          aria-expanded={isTargetDropdownOpen}
          aria-label="Select astronomical target field"
        >
          <span className="text-[#22D3EE]">○</span>
          <span className="truncate max-w-xs">{activeTargetName}</span>
          <span className="text-[10px] text-white/40">▾</span>
        </button>

        {isTargetDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsTargetDropdownOpen(false)}
            />
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 rounded-[3px] bg-[rgba(20,20,22,0.95)] backdrop-blur-xl border border-white/[0.12] p-2 shadow-2xl z-50 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#7E8492] border-b border-white/[0.08]">
                Astronomical Fields
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
                className="w-full text-left px-2.5 py-2 rounded-[2px] hover:bg-white/10 transition-colors flex flex-col gap-0.5 cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-medium text-[#22D3EE]">
                  <span>SPHEREx Deep Field North</span>
                  <span className="text-[10px] font-mono text-[#22D3EE]/70">Benchmark</span>
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
                  className="w-full text-left px-2.5 py-2 rounded-[2px] hover:bg-white/10 transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-white">
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

      {/* 3. Right-hand Actions: Search, Share, Menu (Plain line icon + text, no filled buttons) */}
      <div className="flex items-center gap-4 md:gap-6 shrink-0 text-xs font-sans text-white/85">
        {/* Search */}
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 text-white/80 hover:text-white uppercase tracking-[0.2em] transition-colors cursor-pointer py-1"
            aria-label="Search celestial targets or coordinates"
            title="Search targets (Hotkey: /)"
          >
            <Search className="w-4 h-4 text-white/80" strokeWidth={1.5} />
            <span className="hidden sm:inline">Search</span>
          </button>
        )}

        {/* Share */}
        {onOpenShare && (
          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 text-white/80 hover:text-white uppercase tracking-[0.2em] transition-colors cursor-pointer py-1"
            aria-label="Share current sky view"
          >
            <Share2 className="w-4 h-4 text-white/80" strokeWidth={1.5} />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        {/* Menu */}
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex items-center gap-1.5 text-white/80 hover:text-white uppercase tracking-[0.2em] transition-colors cursor-pointer py-1"
            aria-label="Open mission console menu"
          >
            <Menu className="w-4 h-4 text-white/80" strokeWidth={1.5} />
            <span>Menu</span>
          </button>
        )}
      </div>
    </header>
  );
}
