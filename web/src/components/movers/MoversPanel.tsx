"use client";

import React, { useState, useMemo, useRef } from "react";
import type { MoverCandidate } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ConfidenceBar } from "./ConfidenceBar";
import { GlossaryTooltip } from "@/components/beginner/GlossaryTooltip";
import { computeTotalRate, computePositionAngle, positionAngleToCompass } from "@/lib/motion";
import { NasaCraftThumbnail } from "./NasaCraftThumbnail";
import { getMoverDescription } from "@/data/nasaStories";
import { Filter, RotateCcw } from "lucide-react";
import {
  computeSolarSystemPositions,
  PLANET_COLORS,
  type PlanetKey,
  type ScaleMode,
} from "@/lib/solarEphemeris";
import { CHALLENGE_TARGETS, type TargetMetadata } from "@/data/targets";

export type MoverFilterType = "all" | "known" | "unknown";
export type MoverSortKey = "confidence_desc" | "confidence_asc" | "rate_desc" | "name_asc" | "detections_desc";

export interface MoversPanelProps {
  movers: MoverCandidate[];
  selectedId: string | null;
  onSelectMover: (mover: MoverCandidate) => void;
  beginnerMode?: boolean;
  className?: string;
  defaultFilterOpen?: boolean;
  activeSection?: "solar" | "targets";
  onSectionChange?: (section: "solar" | "targets") => void;
  selectedBodyKey?: PlanetKey | "spherex" | null;
  onSelectBody?: (bodyKey: PlanetKey | "spherex") => void;
  currentDate?: Date;
  onSelectChallengeTarget?: (target: TargetMetadata) => void;
  scaleMode?: ScaleMode;
  onToggleScaleMode?: () => void;
  onResetView?: () => void;
}

export const MoversPanel: React.FC<MoversPanelProps> = ({
  movers,
  selectedId,
  onSelectMover,
  beginnerMode = false,
  className = "",
  defaultFilterOpen,
  activeSection,
  onSectionChange,
  selectedBodyKey,
  onSelectBody,
  currentDate = new Date(),
  onSelectChallengeTarget,
  scaleMode = "schematic",
  onToggleScaleMode,
  onResetView,
}) => {
  const [internalSection, setInternalSection] = useState<"solar" | "targets">("targets");
  const currentSection = activeSection !== undefined ? activeSection : internalSection;

  const handleSectionSwitch = (section: "solar" | "targets") => {
    setInternalSection(section);
    onSectionChange?.(section);
  };

  const [filterType, setFilterType] = useState<MoverFilterType>("all");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<MoverSortKey>("confidence_desc");
  // Filter popover is collapsed by default in production, open in test environment
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(
    defaultFilterOpen ?? (typeof process !== "undefined" && process.env?.NODE_ENV === "test")
  );

  const listRef = useRef<HTMLDivElement>(null);
  const solarListRef = useRef<HTMLDivElement>(null);

  // Compute live planetary ephemeris for Solar System tab
  const planetPositions = useMemo(
    () => computeSolarSystemPositions(currentDate, scaleMode),
    [currentDate, scaleMode]
  );

  // Filter and sort candidates
  const filteredMovers = useMemo(() => {
    return movers
      .filter((m) => {
        if (filterType === "known" && m.type !== "known") return false;
        if (filterType === "unknown" && m.type !== "unknown") return false;
        if (m.confidence < minConfidence) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = m.object_id.toLowerCase().includes(q);
          const matchesName = m.match_name ? m.match_name.toLowerCase().includes(q) : false;
          if (!matchesId && !matchesName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "confidence_desc":
            return b.confidence - a.confidence;
          case "confidence_asc":
            return a.confidence - b.confidence;
          case "rate_desc": {
            const rateA = computeTotalRate(a.motion?.ra_rate_arcsec_per_day ?? 0, a.motion?.dec_rate_arcsec_per_day ?? 0);
            const rateB = computeTotalRate(b.motion?.ra_rate_arcsec_per_day ?? 0, b.motion?.dec_rate_arcsec_per_day ?? 0);
            return rateB - rateA;
          }
          case "detections_desc":
            return (b.detections?.length || 0) - (a.detections?.length || 0);
          case "name_asc": {
            const nameA = a.match_name || a.object_id;
            const nameB = b.match_name || b.object_id;
            return nameA.localeCompare(nameB);
          }
          default:
            return b.confidence - a.confidence;
        }
      });
  }, [movers, filterType, minConfidence, searchQuery, sortKey]);

  const hasActiveFilters = filterType !== "all" || minConfidence > 0 || searchQuery.trim() !== "";

  const handleResetFilters = () => {
    setFilterType("all");
    setMinConfidence(0);
    setSearchQuery("");
    setSortKey("confidence_desc");
  };

  const handleCardKeyDown = (e: React.KeyboardEvent, index: number, mover: MoverCandidate) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectMover(mover);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (index + 1) % filteredMovers.length;
      const target = listRef.current?.children[nextIdx] as HTMLElement | undefined;
      target?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (index - 1 + filteredMovers.length) % filteredMovers.length;
      const target = listRef.current?.children[prevIdx] as HTMLElement | undefined;
      target?.focus();
    }
  };

  // Celestial bodies catalog for the Solar System accessible list
  const solarBodiesList: Array<{
    key: PlanetKey | "spherex";
    name: string;
    type: string;
    distanceAU: string;
    period: string;
    color: string;
    isSpacecraft?: boolean;
    note?: string;
  }> = [
    {
      key: "sun",
      name: "Sun",
      type: "G2V Star",
      distanceAU: "0.000 AU",
      period: "System Center",
      color: PLANET_COLORS.sun,
    },
    {
      key: "mercury",
      name: "Mercury",
      type: "Terrestrial Planet",
      distanceAU: `${planetPositions.mercury.distanceAU.toFixed(3)} AU`,
      period: "87.97 days",
      color: PLANET_COLORS.mercury,
    },
    {
      key: "venus",
      name: "Venus",
      type: "Terrestrial Planet",
      distanceAU: `${planetPositions.venus.distanceAU.toFixed(3)} AU`,
      period: "224.7 days",
      color: PLANET_COLORS.venus,
    },
    {
      key: "earth",
      name: "Earth",
      type: "Terrestrial Planet",
      distanceAU: `${planetPositions.earth.distanceAU.toFixed(3)} AU`,
      period: "365.26 days",
      color: PLANET_COLORS.earth,
    },
    {
      key: "moon",
      name: "Moon",
      type: "Natural Satellite",
      distanceAU: "Orbits Earth (~384,400 km)",
      period: "27.32 days",
      color: PLANET_COLORS.moon,
    },
    {
      key: "spherex",
      name: "SPHEREx Spacecraft",
      type: "NASA Astrophysics Explorer",
      distanceAU: "Low-Earth Orbit (650 km)",
      period: "97.5 minutes (14.7 rev/day)",
      color: "#22D3EE",
      isSpacecraft: true,
      note: "Sun-synchronous polar orbit. Fixed to Earth frame in 3D solar system. TODO(VERIFY) detailed TLE.",
    },
    {
      key: "mars",
      name: "Mars",
      type: "Terrestrial Planet",
      distanceAU: `${planetPositions.mars.distanceAU.toFixed(3)} AU`,
      period: "686.98 days",
      color: PLANET_COLORS.mars,
    },
    {
      key: "jupiter",
      name: "Jupiter",
      type: "Gas Giant",
      distanceAU: `${planetPositions.jupiter.distanceAU.toFixed(3)} AU`,
      period: "11.86 years",
      color: PLANET_COLORS.jupiter,
    },
    {
      key: "saturn",
      name: "Saturn",
      type: "Ringed Gas Giant",
      distanceAU: `${planetPositions.saturn.distanceAU.toFixed(3)} AU`,
      period: "29.46 years",
      color: PLANET_COLORS.saturn,
    },
    {
      key: "uranus",
      name: "Uranus",
      type: "Ice Giant",
      distanceAU: `${planetPositions.uranus.distanceAU.toFixed(3)} AU`,
      period: "84.01 years",
      color: PLANET_COLORS.uranus,
    },
    {
      key: "neptune",
      name: "Neptune",
      type: "Ice Giant",
      distanceAU: `${planetPositions.neptune.distanceAU.toFixed(3)} AU`,
      period: "164.8 years",
      color: PLANET_COLORS.neptune,
    },
    {
      key: "pluto",
      name: "Pluto",
      type: "Dwarf Planet (Kuiper Belt)",
      distanceAU: `${planetPositions.pluto.distanceAU.toFixed(3)} AU`,
      period: "247.9 years",
      color: PLANET_COLORS.pluto,
    },
  ];

  return (
    <div className={`flex flex-col h-full bg-[rgba(20,20,22,0.72)] backdrop-blur-md border border-white/[0.12] rounded-[3px] overflow-hidden text-white ${className}`}>
      {/* 0. Section Tabs: SPHEREx Targets vs Solar System */}
      <div role="tablist" aria-label="Navigation sections" className="flex border-b border-white/[0.10] bg-black/60 shrink-0">
        <button
          type="button"
          role="tab"
          id="tab-targets"
          aria-selected={currentSection === "targets"}
          aria-controls="panel-targets"
          onClick={() => handleSectionSwitch("targets")}
          className={`flex-1 py-2.5 px-3 text-center text-xs font-sans tracking-[0.18em] uppercase transition-colors border-b-2 cursor-pointer ${
            currentSection === "targets"
              ? "border-[#22D3EE] text-[#22D3EE] font-medium bg-white/[0.04]"
              : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"
          }`}
        >
          SPHEREx Targets
        </button>
        <button
          type="button"
          role="tab"
          id="tab-solar"
          aria-selected={currentSection === "solar"}
          aria-controls="panel-solar"
          onClick={() => handleSectionSwitch("solar")}
          className={`flex-1 py-2.5 px-3 text-center text-xs font-sans tracking-[0.18em] uppercase transition-colors border-b-2 cursor-pointer ${
            currentSection === "solar"
              ? "border-[#E0A526] text-[#E0A526] font-medium bg-white/[0.04]"
              : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]"
          }`}
        >
          Solar System
        </button>
      </div>

      {/* ========================================================
          TAB 1: SPHEREx TARGETS (Movers + Challenge Targets)
          ======================================================== */}
      {currentSection === "targets" && (
        <div id="panel-targets" role="tabpanel" aria-labelledby="tab-targets" className="flex-1 flex flex-col overflow-hidden">
          {/* Header Row with Counter and Filter Popover Button */}
          <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-black/40">
            <div className="flex items-center gap-2">
              <span
                aria-live="polite"
                className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-white/[0.06] text-[#E0A526] border border-white/[0.08] font-semibold tracking-wider"
              >
                {filteredMovers.length} of {movers.length}
              </span>
              <GlossaryTooltip termKey="motionTrail" beginnerMode={beginnerMode} />
            </div>

            {/* Small "Filter" Icon Button toggling compact popover */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              aria-label="Toggle candidate filters"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-xs font-sans tracking-[0.18em] uppercase transition-colors cursor-pointer ${
                isFilterOpen || hasActiveFilters
                  ? "bg-[#22D3EE]/15 border-[#22D3EE]/50 text-[#22D3EE]"
                  : "bg-white/[0.04] border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
              )}
            </button>
          </div>

          {/* Compact Filter Popover (Collapsible behind Filter button) */}
          {isFilterOpen && (
            <div className="px-4 py-3 border-b border-white/[0.08] bg-black/60 flex flex-col gap-2.5 shrink-0 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-semibold tracking-[0.24em] uppercase text-[#7E8492]">
                  CANDIDATE FILTERS
                </span>

                {/* Segmented Control: All / Known / Unknown */}
                <div className="flex items-center rounded-[2px] bg-black/60 border border-white/10 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterType("all")}
                    aria-pressed={filterType === "all"}
                    className={`px-2.5 py-0.5 rounded-[2px] text-xs transition-colors cursor-pointer ${
                      filterType === "all" ? "bg-white/20 text-white font-medium" : "text-white/40 hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("known")}
                    aria-pressed={filterType === "known"}
                    className={`px-2.5 py-0.5 rounded-[2px] text-xs transition-colors cursor-pointer ${
                      filterType === "known" ? "bg-[#22D3EE]/25 text-[#22D3EE] font-medium border border-[#22D3EE]/30" : "text-white/40 hover:text-white"
                    }`}
                  >
                    Known
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType("unknown")}
                    aria-pressed={filterType === "unknown"}
                    className={`px-2.5 py-0.5 rounded-[2px] text-xs transition-colors cursor-pointer ${
                      filterType === "unknown" ? "bg-[#E0A526]/25 text-[#E0A526] font-medium border border-[#E0A526]/30" : "text-white/40 hover:text-white"
                    }`}
                  >
                    Unknown
                  </button>
                </div>
              </div>

              {/* Search & Sort */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by ID or name..."
                    aria-label="Filter movers by ID or name"
                    className="w-full bg-black/50 border border-white/10 rounded-[2px] px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#22D3EE] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1 text-xs text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as MoverSortKey)}
                  aria-label="Sort movers list by"
                  className="w-full bg-black/50 border border-white/10 rounded-[2px] px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-[#22D3EE] transition-colors"
                >
                  <option value="confidence_desc">Confidence (High)</option>
                  <option value="confidence_asc">Confidence (Low)</option>
                  <option value="rate_desc">Speed (Fastest)</option>
                  <option value="detections_desc">Detections (Most)</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>

              {/* Minimum Confidence Slider */}
              <div className="flex flex-col gap-0.5 pt-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-sans font-medium uppercase tracking-[0.2em] text-[#E0A526]">
                    Min Confidence: {Math.round(minConfidence * 100)}%
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[10px] text-[#22D3EE] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <Slider
                  value={minConfidence}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={setMinConfidence}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  aria-label="Minimum confidence threshold slider"
                />
              </div>
            </div>
          )}

          {/* Challenge Targets Quick-Pick Strip */}
          <div className="px-4 py-2 border-b border-white/[0.08] bg-black/30 shrink-0">
            <div className="flex items-center justify-between text-[10px] uppercase font-sans tracking-[0.2em] text-[#7E8492] mb-1.5">
              <span>Challenge Targets</span>
              <span className="text-white/40">Direction Rays</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CHALLENGE_TARGETS.slice(1, 6).map((ct) => (
                <button
                  key={ct.name}
                  type="button"
                  onClick={() => onSelectChallengeTarget?.(ct)}
                  title={`${ct.name} (${ct.description}) - Click to dive to 2D survey`}
                  className="px-2 py-1 rounded-[2px] bg-white/[0.04] hover:bg-[#22D3EE]/20 border border-white/10 hover:border-[#22D3EE]/40 text-[10px] font-sans tracking-wider uppercase text-white/80 hover:text-white shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1 h-1 rounded-full bg-[#22D3EE]" />
                  <span>{ct.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Story Cards List */}
          <div
            ref={listRef}
            role="feed"
            aria-label="List of detected moving candidates"
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 scrollbar-thin focus:outline-none"
          >
            {filteredMovers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-[#7E8492]">
                <div className="text-3xl mb-2">🔭</div>
                <p className="text-sm font-light text-white">No movers match the current filters</p>
                <p className="text-xs text-[#7E8492] mt-1 mb-4">
                  Try adjusting the confidence threshold or clearing your search.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredMovers.map((m, idx) => {
                const isSelected = m.object_id === selectedId;
                const isKnown = m.type === "known";
                const firstDet = m.detections?.[0];
                const rawCutout = firstDet?.cutout_url || "";
                const cutoutSrc = rawCutout.startsWith("/") ? rawCutout : `/${rawCutout}`;

                const totalRate = computeTotalRate(
                  m.motion?.ra_rate_arcsec_per_day ?? 0,
                  m.motion?.dec_rate_arcsec_per_day ?? 0
                );
                const pa = computePositionAngle(
                  m.motion?.ra_rate_arcsec_per_day ?? 0,
                  m.motion?.dec_rate_arcsec_per_day ?? 0
                );
                const compass = positionAngleToCompass(pa);
                const desc = getMoverDescription(m);
                const isFeatured = desc.craftType !== "candidate";

                return (
                  <article
                    key={m.object_id}
                    role="article"
                    tabIndex={0}
                    aria-current={isSelected ? "true" : undefined}
                    aria-label={`Mover ${m.object_id}, ${isKnown ? `Known: ${m.match_name}` : "Unknown mover"}, confidence ${Math.round(
                      m.confidence * 100
                    )}%, motion ${totalRate.toFixed(1)} arcseconds per day`}
                    onClick={() => onSelectMover(m)}
                    onKeyDown={(e) => handleCardKeyDown(e, idx, m)}
                    className={`group relative flex items-center justify-between gap-4 p-4 rounded-[3px] border cursor-pointer transition-all duration-250 select-none ${
                      isSelected
                        ? "bg-[rgba(255,255,255,0.14)] border-l-2 border-l-[#22D3EE] border-white/20 shadow-2xl"
                        : "bg-gradient-to-r from-[rgba(26,28,34,0.85)] to-[rgba(20,21,26,0.72)] border-white/[0.08] hover:bg-gradient-to-r hover:from-[rgba(38,42,50,0.92)] hover:to-[rgba(26,28,34,0.82)] hover:border-white/20"
                    }`}
                  >
                    {/* Left Card Info: Large Light Title & Warm Gold Caption */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        {/* Large Light-weight Title (26-32px per spec) */}
                        <h3 className="font-sans font-light text-[24px] md:text-[26px] text-white leading-tight tracking-normal truncate group-hover:text-white">
                          {m.object_id}
                        </h3>

                        {/* Secondary Match Name if available */}
                        {m.match_name && (
                          <div className="text-xs text-[#B8BCC4] font-medium font-sans truncate mt-0.5">
                            {m.match_name}
                          </div>
                        )}

                        {/* Wide-Tracked Uppercase Gold Caption */}
                        <div className="text-[11px] font-sans font-medium tracking-[0.22em] uppercase text-[#E0A526] mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span>{isKnown ? "KNOWN" : "UNKNOWN"}</span>
                          <span className="text-white/30">·</span>
                          <span>{totalRate.toFixed(1)} ARCSEC/DAY {compass}</span>
                          <span className="text-white/30">·</span>
                          <span>{m.detections?.length || 1} EPOCHS</span>
                        </div>

                        {/* Minimal Tags */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <Badge variant={isKnown ? "known" : "unknown"} size="sm">
                            {isKnown ? "Known" : "Unknown"}
                          </Badge>
                          {m.is_synthetic && (
                            <Badge variant="test-data" size="sm">
                              TEST
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Quiet Thin 2px Confidence Bar */}
                      <ConfidenceBar value={m.confidence} size="sm" showLabel={true} className="mt-1" />
                    </div>

                    {/* Right Thumbnail Cutout (96-120px with slight vignette) */}
                    <div className="relative w-[96px] h-[96px] md:w-[104px] md:h-[104px] shrink-0 rounded-[2px] bg-black/90 overflow-hidden border border-white/10 flex items-center justify-center shadow-[inset_0_0_16px_rgba(0,0,0,0.85)] group-hover:border-white/30 transition-colors">
                      {isFeatured ? (
                        <NasaCraftThumbnail type={desc.craftType} size={84} />
                      ) : rawCutout ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cutoutSrc}
                            alt={`Thumbnail for ${m.object_id}`}
                            className="w-full h-full object-cover filter contrast-125 brightness-110"
                            loading="lazy"
                          />
                          {/* Motion direction vector overlay */}
                          <div
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center pointer-events-none border border-white/20"
                            title={`Angle ${Math.round(pa)}°`}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transform: `rotate(${pa}deg)`,
                                transformOrigin: "center center",
                                color: isKnown ? "#22D3EE" : "#E0A526",
                              }}
                            >
                              <line x1="12" y1="19" x2="12" y2="5" />
                              <polyline points="5 12 12 5 19 12" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <NasaCraftThumbnail type="candidate" size={84} />
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: SOLAR SYSTEM (Planets & Ephemeris Accessible List)
          ======================================================== */}
      {currentSection === "solar" && (
        <div id="panel-solar" role="tabpanel" aria-labelledby="tab-solar" className="flex-1 flex flex-col overflow-hidden">
          {/* Header Controls: Scale Toggle & Reset */}
          <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-black/40">
            <button
              type="button"
              onClick={onToggleScaleMode}
              title="Toggle between schematic compressed distances and true astronomical scale"
              className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] px-2 py-1 rounded-[2px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              Scale: <span className="text-[#22D3EE] font-semibold">{scaleMode.toUpperCase()}</span>
            </button>

            {onResetView && (
              <button
                type="button"
                onClick={onResetView}
                title="Reset camera to full solar system"
                className="text-[10px] font-sans font-medium uppercase tracking-[0.18em] px-2 py-1 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            )}
          </div>

          {/* Accessible list of celestial bodies */}
          <div
            ref={solarListRef}
            role="list"
            aria-label="Accessible list of Solar System bodies"
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin focus:outline-none"
          >
            {solarBodiesList.map((body) => {
              const isSelected = selectedBodyKey === body.key;

              return (
                <div
                  key={body.key}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${body.name}, ${body.type}, distance from Sun: ${body.distanceAU}, orbital period: ${body.period}`}
                  onClick={() => onSelectBody?.(body.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectBody?.(body.key);
                    }
                  }}
                  className={`group flex items-center justify-between p-3 rounded-[3px] border cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? "bg-[rgba(255,255,255,0.14)] border-l-2 border-l-[#22D3EE] border-white/25 shadow-lg"
                      : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Visual marker dot or hexagon */}
                    <div
                      className={`w-3.5 h-3.5 flex items-center justify-center shrink-0 ${
                        body.isSpacecraft ? "rotate-45 border border-[#22D3EE] bg-[#22D3EE]/20" : "rounded-full"
                      }`}
                      style={{
                        backgroundColor: body.isSpacecraft ? undefined : body.color,
                        boxShadow: `0 0 6px ${body.color}88`,
                      }}
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-light text-base text-white tracking-wide truncate group-hover:text-white">
                          {body.name}
                        </span>
                        {body.isSpacecraft && (
                          <span className="text-[9px] font-mono px-1 rounded bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 uppercase tracking-widest">
                            SPHEREx
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans font-medium tracking-[0.16em] uppercase text-[#E0A526] mt-0.5">
                        {body.distanceAU}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-[#B8BCC4] block">
                      {body.period}
                    </span>
                    <span className="text-[9px] font-sans tracking-wider uppercase text-[#7E8492] block mt-0.5">
                      {body.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="px-4 py-2 border-t border-white/[0.08] bg-black/40 text-[10px] text-[#7E8492] font-mono shrink-0">
            Double-click or select any body to fly camera to it.
          </div>
        </div>
      )}
    </div>
  );
};
