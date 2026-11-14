"use client";

import React, { useState, useMemo, useRef } from "react";
import type { MoverCandidate } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { ConfidenceBar } from "./ConfidenceBar";
import { GlossaryTooltip } from "@/components/beginner/GlossaryTooltip";
import { computeTotalRate, computePositionAngle, positionAngleToCompass } from "@/lib/motion";
import { getOrbitColor } from "@/design/tokens";

function formatCardDate(dateStr?: string, fallback = "NOVEMBER 14TH, 2026"): string {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    const month = d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
    const day = d.getDate();
    const year = d.getFullYear();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "ST"
        : day % 10 === 2 && day !== 12
        ? "ND"
        : day % 10 === 3 && day !== 13
        ? "RD"
        : "TH";
    return `${month} ${day}${suffix}, ${year}`;
  } catch {
    return fallback;
  }
}

export type MoverFilterType = "all" | "known" | "unknown";
export type MoverSortKey = "confidence_desc" | "confidence_asc" | "rate_desc" | "name_asc" | "detections_desc";

export interface MoversPanelProps {
  movers: MoverCandidate[];
  selectedId: string | null;
  onSelectMover: (mover: MoverCandidate) => void;
  beginnerMode?: boolean;
  className?: string;
}

export const MoversPanel: React.FC<MoversPanelProps> = ({
  movers,
  selectedId,
  onSelectMover,
  beginnerMode = false,
  className = "",
}) => {
  const [filterType, setFilterType] = useState<MoverFilterType>("all");
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortKey, setSortKey] = useState<MoverSortKey>("confidence_desc");

  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort candidates
  const filteredMovers = useMemo(() => {
    return movers
      .filter((m) => {
        // Classification filter
        if (filterType === "known" && m.type !== "known") return false;
        if (filterType === "unknown" && m.type !== "unknown") return false;

        // Confidence filter
        if (m.confidence < minConfidence) return false;

        // Search query
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

  // Reset filters helper
  const handleResetFilters = () => {
    setFilterType("all");
    setMinConfidence(0);
    setSearchQuery("");
    setSortKey("confidence_desc");
  };

  // Keyboard navigation across cards
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

  return (
    <div className={`flex flex-col h-full bg-[#0a0c12]/92 backdrop-blur-2xl border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl text-slate-100 ${className}`}>
      {/* Minimal Header Controls (NASA Eyes Style) */}
      <div className="p-3.5 border-b border-white/[0.08] bg-black/30 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#c59b6d] border border-white/[0.08] font-semibold tracking-wider"
            >
              {filteredMovers.length} of {movers.length}
            </span>
            <GlossaryTooltip termKey="motionTrail" beginnerMode={beginnerMode} />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center rounded-lg bg-black/60 border border-white/10 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              aria-pressed={filterType === "all"}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filterType === "all" ? "bg-white/15 text-white font-medium" : "text-white/40 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("known")}
              aria-pressed={filterType === "known"}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filterType === "known" ? "bg-[#68a8cf]/25 text-[#68a8cf] font-medium border border-[#68a8cf]/30" : "text-white/40 hover:text-white"
              }`}
            >
              Known
            </button>
            <button
              type="button"
              onClick={() => setFilterType("unknown")}
              aria-pressed={filterType === "unknown"}
              className={`px-2.5 py-0.5 rounded text-xs transition-colors ${
                filterType === "unknown" ? "bg-[#d96b43]/25 text-[#d96b43] font-medium border border-[#d96b43]/30" : "text-white/40 hover:text-white"
              }`}
            >
              Unknown
            </button>
          </div>
        </div>

        {/* Minimal Search & Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID or name..."
              aria-label="Filter movers by ID or name"
              className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c59b6d] focus:ring-1 focus:ring-[#c59b6d]/40 transition-colors"
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
            className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/80 focus:outline-none focus:border-[#c59b6d] focus:ring-1 focus:ring-[#c59b6d]/40 transition-colors"
          >
            <option value="confidence_desc">Confidence (High)</option>
            <option value="confidence_asc">Confidence (Low)</option>
            <option value="rate_desc">Speed (Fastest)</option>
            <option value="detections_desc">Detections (Most)</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>

        {/* Minimum Confidence Slider */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#c59b6d]">
              Min Confidence: {Math.round(minConfidence * 100)}%
              <GlossaryTooltip termKey="confidence" beginnerMode={beginnerMode} />
            </span>
            {minConfidence > 0 && (
              <button
                type="button"
                onClick={() => setMinConfidence(0)}
                className="text-[10px] text-[#c59b6d] hover:underline"
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

      {/* Movers List or Empty State */}
      <div
        ref={listRef}
        role="feed"
        aria-label="List of detected moving candidates"
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 focus:outline-none"
      >
        {filteredMovers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="text-3xl mb-2">🔭</div>
            <p className="text-sm font-semibold text-slate-300">No movers match the current filters</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try lowering the confidence threshold or clearing the search query.
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
            const orbitColor = getOrbitColor(m.object_id, idx);

            const totalRate = computeTotalRate(
              m.motion?.ra_rate_arcsec_per_day ?? 0,
              m.motion?.dec_rate_arcsec_per_day ?? 0
            );
            const pa = computePositionAngle(
              m.motion?.ra_rate_arcsec_per_day ?? 0,
              m.motion?.dec_rate_arcsec_per_day ?? 0
            );
            const compass = positionAngleToCompass(pa);
            const eventDateStr = formatCardDate(firstDet?.date, isKnown ? "OCTOBER 15TH, 2026" : "NOVEMBER 14TH, 2026");

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
                className={`group relative flex items-center justify-between gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c59b6d] select-none ${
                  isSelected
                    ? "border-[#c59b6d] bg-[#1a1714]/95 shadow-xl shadow-[#c59b6d]/15 ring-1 ring-[#c59b6d]/60"
                    : "border-white/[0.08] bg-[#10131a]/85 hover:bg-[#181c26]/90 hover:border-white/20"
                }`}
              >
                {/* Left Card Info with NASA Eyes editorial typography */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      {/* NASA Eyes clean, elegant light-to-regular title */}
                      <span className="font-sans font-light md:font-normal text-base md:text-[17px] text-white tracking-normal leading-snug truncate group-hover:text-white">
                        {m.object_id}
                      </span>
                      <span className="text-xs text-[#c59b6d] font-medium truncate">
                        {m.match_name || "Catalog-Unmatched Candidate"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
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

                  {/* NASA Eyes signature warm golden bronze uppercase subtitle / date */}
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-[10.5px] tracking-[0.22em] uppercase text-[#c59b6d]">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: orbitColor }}
                      title={`Orbit Color: ${orbitColor}`}
                    />
                    <span className="truncate">{eventDateStr}</span>
                  </div>

                  {/* Secondary metadata with individual orbit styling */}
                  <div className="text-[10px] font-mono tracking-wider uppercase text-white/60 flex flex-wrap items-center gap-2">
                    <span className={isKnown ? "text-[#68a8cf] font-semibold" : "text-[#d96b43] font-semibold"}>
                      {isKnown ? "CATALOG MATCH" : "NEW CANDIDATE"}
                    </span>
                    <span className="text-white/20">·</span>
                    <span>{totalRate.toFixed(1)}&quot;/D {compass}</span>
                    <span className="text-white/20">·</span>
                    <span>{m.detections?.length || 0} EPOCHS</span>
                  </div>

                  <ConfidenceBar value={m.confidence} size="sm" showLabel={true} />
                </div>

                {/* Right Thumbnail Cutout styled like NASA Eyes spacecraft previews */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg bg-black/90 overflow-hidden border border-white/10 flex items-center justify-center shadow-inner group-hover:border-[#c59b6d]/40 transition-colors">
                  {rawCutout ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cutoutSrc}
                      alt={`Thumbnail for ${m.object_id}`}
                      className="w-full h-full object-cover filter contrast-125 brightness-110"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-2xl">☄️</span>
                  )}

                  {/* Motion direction vector overlay tinted with distinct orbit color */}
                  <div
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center pointer-events-none border border-white/15"
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
                        color: orbitColor,
                      }}
                    >
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
