"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Button,
  Badge,
  TestDataBadge,
} from "@/components/ui";
import { ControlRail } from "@/components/layout/ControlRail";
import { TimeBar } from "@/components/time/TimeBar";

export default function DesignSystemPage() {
  const [timeEpoch, setTimeEpoch] = useState<number>(0);

  const mockEpochs = [
    { epoch_id: "EP-01", date: "2026-03-01T04:12:00Z", label: "Epoch 01", band_count: 102 },
    { epoch_id: "EP-02", date: "2026-03-08T06:30:00Z", label: "Epoch 02", band_count: 102 },
    { epoch_id: "EP-03", date: "2026-03-15T11:45:00Z", label: "Epoch 03", band_count: 102 },
    { epoch_id: "EP-04", date: "2026-03-24T18:20:00Z", label: "Epoch 04", band_count: 102 },
    { epoch_id: "EP-05", date: "2026-03-31T22:05:00Z", label: "Epoch 05", band_count: 102 },
  ];

  return (
    <div className="min-h-screen bg-[#010206] text-white p-6 md:p-12 max-w-7xl mx-auto space-y-12 select-none">
      {/* Header */}
      <header className="border-b border-white/[0.12] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-sans font-light text-xl md:text-2xl tracking-[0.24em] text-white uppercase">
              EYES ON SPHEREX: DESIGN SYSTEM
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40">
              NASA EYES SPEC
            </span>
            <TestDataBadge />
          </div>
          <p className="text-xs text-[#B8BCC4] font-mono">
            Single source of truth in <code className="text-[#22D3EE]">web/src/design/tokens.ts</code>. Near-pure black space, Barlow typography, 1px hairlines, and WCAG AA contrast.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              ← Return to Sky Diary App
            </Button>
          </Link>
        </div>
      </header>

      {/* 1. Design Tokens: Colors & WCAG AA Contrast Ratios */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          1. Color Tokens &amp; WCAG Contrast
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-[3px] bg-[#010206] border border-white/[0.12] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[#7E8492] uppercase">Space Void</span>
            <span className="font-mono text-xs text-white">#010206</span>
            <span className="text-[10px] text-[#22D3EE]">Base Canvas</span>
          </div>
          <div className="p-3.5 rounded-[3px] bg-[rgba(20,20,22,0.85)] border border-white/[0.12] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[#7E8492] uppercase">Panel Fill</span>
            <span className="font-mono text-xs text-white">rgba(20,20,22,0.72)</span>
            <span className="text-[10px] text-[#B8BCC4]">Backdrop Blur</span>
          </div>
          <div className="p-3.5 rounded-[3px] bg-[#010206] border border-[#22D3EE]/50 flex flex-col gap-1 text-[#22D3EE]">
            <span className="text-[10px] font-mono uppercase">Cyan (Known)</span>
            <span className="font-mono text-xs font-semibold">#22D3EE</span>
            <span className="text-[10px] text-white/70">12.2:1 (AAA)</span>
          </div>
          <div className="p-3.5 rounded-[3px] bg-[#010206] border border-[#E0A526]/50 flex flex-col gap-1 text-[#E0A526]">
            <span className="text-[10px] font-mono uppercase">Gold (Unknown)</span>
            <span className="font-mono text-xs font-semibold">#E0A526</span>
            <span className="text-[10px] text-white/70">9.6:1 (AAA)</span>
          </div>
          <div className="p-3.5 rounded-[3px] bg-[#010206] border border-white/[0.12] flex flex-col gap-1 text-[#B8BCC4]">
            <span className="text-[10px] font-mono uppercase">Secondary Grey</span>
            <span className="font-mono text-xs font-semibold">#B8BCC4</span>
            <span className="text-[10px] text-white/70">10.5:1 (AAA)</span>
          </div>
          <div className="p-3.5 rounded-[3px] bg-[#010206] border border-white/[0.12] flex flex-col gap-1 text-white">
            <span className="text-[10px] font-mono uppercase">Primary White</span>
            <span className="font-mono text-xs font-semibold">#FFFFFF</span>
            <span className="text-[10px] text-[#22D3EE]">18.4:1 (AAA)</span>
          </div>
        </div>
      </section>

      {/* 2. Type Scale */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          2. NASA Eyes Typography Scale (Barlow &amp; JetBrains Mono)
        </h2>
        <div className="p-5 rounded-[3px] bg-[rgba(20,20,22,0.72)] border border-white/[0.12] space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Display (36px, font-light, tracking-tight)</span>
            <div className="text-3xl md:text-4xl font-light text-white leading-tight font-sans">
              Voyager One Light-Day
            </div>
          </div>
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Title (26px, font-light)</span>
            <div className="text-2xl font-light text-white font-sans">
              SPX-MOV-0001 (Europa Clipper Flyby)
            </div>
          </div>
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Card Title (20px, font-light)</span>
            <div className="text-xl font-light text-white font-sans">
              Featured Movers and Targets
            </div>
          </div>
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Label (12px, font-medium, tracking-[0.24em], uppercase)</span>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-[#B8BCC4] font-sans">
              UNKNOWN · 35.7 ARCSEC/DAY NE · 4 EPOCHS
            </div>
          </div>
          <div className="border-b border-white/[0.08] pb-3">
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Caption (11px, font-normal, tracking-[0.2em], uppercase gold)</span>
            <div className="text-[11px] font-normal uppercase tracking-[0.2em] text-[#E0A526] font-sans">
              MISSION LAUNCH AUGUST 30TH, 2026
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#7E8492] block uppercase mb-1">Mono Telemetry (12px, JetBrains Mono)</span>
            <div className="text-xs font-mono text-[#22D3EE]">
              RA 269.4520° · DEC +66.5610° · FLUX 42.5 mJy · EPOCH 01/05
            </div>
          </div>
        </div>
      </section>

      {/* 3. Buttons (Min 44px Touch Targets, Square Radii) */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          3. Button Variants (Square Corners, 44px Touch)
        </h2>
        <div className="p-5 rounded-[3px] bg-[rgba(20,20,22,0.72)] border border-white/[0.12] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary (Cyan Accent)</Button>
            <Button variant="secondary">Secondary (Translucent)</Button>
            <Button variant="amber">Amber Action</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </div>
      </section>

      {/* 4. Badges (Non-color cues) */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          4. Badges (Non-Color Accessible Cues)
        </h2>
        <div className="p-5 rounded-[3px] bg-[rgba(20,20,22,0.72)] border border-white/[0.12] flex flex-wrap items-center gap-4">
          <Badge variant="known">● KNOWN ASTEROID</Badge>
          <Badge variant="unknown">◆ UNKNOWN CANDIDATE</Badge>
          <TestDataBadge />
          <Badge variant="neutral">■ SYNTHETIC DATASET</Badge>
          <Badge variant="success">● CALIBRATED</Badge>
        </div>
      </section>

      {/* 5. Control Rail */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          5. Vertical Control Rail (42px Square Icon Buttons)
        </h2>
        <div className="p-5 rounded-[3px] bg-[rgba(20,20,22,0.72)] border border-white/[0.12] flex items-center justify-start gap-8">
          <ControlRail
            onToggleInfo={() => {}}
            isInfoOpen={false}
            onToggleLayers={() => {}}
            isLayersOpen={true}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onToggleInvert={() => {}}
            onToggleFullscreen={() => {}}
            onResetView={() => {}}
          />
          <div className="text-xs text-[#B8BCC4] font-mono space-y-1 max-w-md">
            <p className="text-white font-semibold uppercase tracking-wider">Specifications:</p>
            <p>• 42px square icon buttons with 1px hairlines</p>
            <p>• 1.5px thin stroke icons (lucide-react)</p>
            <p>• Active toggle state uses cyan indicator</p>
            <p>• Includes Info, Layers, Zoom In/Out, Invert/Blink, Fullscreen, Reset</p>
          </div>
        </div>
      </section>

      {/* 6. Mover Story Card States (Default, Hover, Selected, TEST) */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          6. Mover Card States (Default, Hover, Selected, TEST)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default State */}
          <div className="p-4 rounded-[3px] bg-[rgba(20,20,22,0.72)] border border-white/[0.08] hover:border-white/[0.16] transition-all flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#7E8492]">State: Default</span>
              <h3 className="text-xl font-light text-white tracking-tight truncate">
                SPX-MOV-0001
              </h3>
              <p className="text-[11px] font-sans font-normal uppercase tracking-[0.2em] text-[#E0A526]">
                UNKNOWN · 35.7 ARCSEC/DAY NE · 4 EPOCHS
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="unknown" size="sm">◆ UNKNOWN</Badge>
                <TestDataBadge />
              </div>
            </div>
            <div className="w-20 h-20 bg-black/60 rounded-[2px] border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-[#7E8492] shrink-0">
              CUTOUT
            </div>
          </div>

          {/* Selected State */}
          <div className="p-4 rounded-[3px] bg-[rgba(255,255,255,0.08)] border-l-2 border-l-[#22D3EE] border-t border-r border-b border-white/[0.12] transition-all flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#22D3EE]">State: Selected</span>
              <h3 className="text-xl font-light text-white tracking-tight truncate">
                SPX-MOV-0002
              </h3>
              <p className="text-[11px] font-sans font-normal uppercase tracking-[0.2em] text-[#22D3EE]">
                KNOWN · 2024 YR4 · 5 EPOCHS
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="known" size="sm">● KNOWN</Badge>
                <span className="text-[10px] font-mono text-[#22D3EE]">98% CONFIDENCE</span>
              </div>
            </div>
            <div className="w-20 h-20 bg-black/60 rounded-[2px] border border-[#22D3EE]/40 flex items-center justify-center text-[10px] font-mono text-[#22D3EE] shrink-0">
              ACTIVE
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Time Bar */}
      <section className="space-y-4">
        <h2 className="text-sm font-sans font-light tracking-[0.24em] uppercase text-white flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22D3EE]" />
          7. NASA Eyes Bottom Time Bar (Scrubber Handle &amp; Uneven Ticks)
        </h2>
        <div className="p-4 rounded-[3px] bg-black/40 border border-white/[0.10]">
          <TimeBar
            epochs={mockEpochs}
            currentEpochIndex={timeEpoch}
            onEpochChange={(ep) => setTimeEpoch(ep)}
            isSynthetic={true}
          />
        </div>
      </section>
    </div>
  );
}
