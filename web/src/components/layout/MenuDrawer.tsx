"use client";

import React, { useEffect, useRef } from "react";
import { X, HelpCircle, Compass, Keyboard, Database, Info, ExternalLink } from "lucide-react";

export interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  beginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  onOpenTour?: () => void;
  onOpenShortcuts?: () => void;
  isSynthetic?: boolean;
}

export function MenuDrawer({
  isOpen,
  onClose,
  beginnerMode,
  onToggleBeginnerMode,
  onOpenTour,
  isSynthetic = true,
}: MenuDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap & Escape listener
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      drawerRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation and mission information menu"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Right-side Full-Height Slide-over Panel */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        className="relative w-full max-w-md h-full bg-[rgba(16,18,24,0.92)] backdrop-blur-2xl border-l border-white/[0.12] text-white flex flex-col shadow-2xl z-10 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.08]">
          <div className="flex flex-col">
            <span className="font-sans text-[11px] font-semibold tracking-[0.24em] uppercase text-[#E0A526]">
              MISSION CONSOLE
            </span>
            <h2 className="font-sans font-light text-xl text-white tracking-wide">
              Eyes on SPHEREx
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 rounded-[3px] border border-white/10 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* 1. About the SPHEREx Mission */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-[#E0A526]">
              <Info className="w-3.5 h-3.5" />
              <span>About SPHEREx Sky Diary</span>
            </div>
            <p className="text-xs text-[#B8BCC4] leading-relaxed font-light">
              SPHEREx (Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer)
              is a NASA Astrophysics mission surveying the entire sky every six months in 102 near-infrared bands (0.75 to 5.0 µm).
              Sky Diary tracks moving solar system bodies, unknown transient candidates, and water-ice faculae.
            </p>
          </section>

          {/* 2. Interactive Guidance & Tours */}
          <section className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-white/90">
              <Compass className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Explorer Modes</span>
            </div>

            {/* Beginner Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-[3px] bg-white/[0.03] border border-white/[0.08]">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-white">Beginner Science Tour Guide</span>
                <span className="text-[11px] text-[#B8BCC4] font-light">
                  Displays inline glossary tooltips & plain-language hints
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={beginnerMode}
                onClick={onToggleBeginnerMode}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  beginnerMode ? "bg-[#22D3EE]" : "bg-white/20"
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                    beginnerMode ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Interactive Guided Tour */}
            {onOpenTour && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTour();
                }}
                className="w-full flex items-center justify-between p-3 rounded-[3px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#E0A526]" />
                  <span className="text-xs text-white group-hover:text-white">Start Interactive Guided Tour</span>
                </div>
                <span className="text-xs text-white/40 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            )}
          </section>

          {/* 3. Keyboard Shortcuts */}
          <section className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-white/90">
              <Keyboard className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Keyboard Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-[3px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="text-[#B8BCC4]">Play / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Space</kbd>
              </div>
              <div className="p-2 rounded-[3px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="text-[#B8BCC4]">Prev / Next Epoch</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">← / →</kbd>
              </div>
              <div className="p-2 rounded-[3px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="text-[#B8BCC4]">Search Target</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">/</kbd>
              </div>
              <div className="p-2 rounded-[3px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="text-[#B8BCC4]">Close Panel / Dialog</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Esc</kbd>
              </div>
            </div>
          </section>

          {/* 4. Data & Attributions */}
          <section className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.22em] uppercase text-[#E0A526]">
              <Database className="w-3.5 h-3.5" />
              <span>Data Provenance & Attribution</span>
            </div>
            <p className="text-[11px] text-[#B8BCC4] leading-relaxed font-light">
              This application was created for the NASA Space Apps Challenge 2026. Scientific all-sky infrared data products
              are facilitated by NASA IPAC / Caltech IRSA and IMCCE SkyBoT ephemerides service.
            </p>
            {isSynthetic && (
              <div className="p-2.5 rounded-[3px] bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-300">
                <span className="font-semibold text-slate-200">Test Data Notice: </span>
                Multi-epoch difference images, light curves, and linked tracklets are simulated test products generated in
                full schema v1.0 compliance.
              </div>
            )}
            <div className="pt-1 flex flex-col gap-1 text-[11px]">
              <a
                href="https://spherex.caltech.edu"
                target="_blank"
                rel="noreferrer"
                className="text-[#22D3EE] hover:underline flex items-center gap-1"
              >
                <span>NASA SPHEREx Mission at Caltech</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://eyes.nasa.gov"
                target="_blank"
                rel="noreferrer"
                className="text-[#22D3EE] hover:underline flex items-center gap-1"
              >
                <span>NASA Eyes on the Solar System Reference</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] text-[10px] font-mono text-[#7E8492] flex items-center justify-between">
          <span>SPHEREx Sky Diary v1.0.0</span>
          <span>NASA Space Apps 2026</span>
        </div>
      </aside>
    </div>
  );
}
