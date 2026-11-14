"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { MoverCandidate } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ConfidenceBar } from "./ConfidenceBar";
import { Filmstrip } from "./Filmstrip";
import { SpectrumChart } from "./SpectrumChart";
import { GlossaryTooltip } from "@/components/beginner/GlossaryTooltip";
import { ShareModal } from "@/components/share/ShareModal";
import {
  computeTotalRate,
  computePositionAngle,
  positionAngleToCompass,
  formatSexagesimalCoords,
} from "@/lib/motion";
import { getMoverDescription } from "@/data/nasaStories";
import { NasaCraftThumbnail } from "./NasaCraftThumbnail";

export interface ObjectDetailProps {
  mover: MoverCandidate | null;
  onClose: () => void;
  onSelectEpoch?: (epochId: string) => void;
  selectedEpochId?: string | null;
  beginnerMode?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  regionName?: string;
  className?: string;
}

export const ObjectDetail: React.FC<ObjectDetailProps> = ({
  mover,
  onClose,
  onSelectEpoch,
  selectedEpochId,
  beginnerMode = false,
  onNext,
  onPrevious,
  hasPrevious = false,
  hasNext = false,
  regionName = "SPHEREx Deep Field",
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"cutouts" | "spectrum" | "json">("cutouts");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Derived motion values
  const { totalRate, compass, sexagesimal, timeSpanStr } = useMemo(() => {
    if (!mover) {
      return { totalRate: 0, compass: "N", sexagesimal: "", timeSpanStr: "" };
    }

    const rate = computeTotalRate(
      mover.motion?.ra_rate_arcsec_per_day ?? 0,
      mover.motion?.dec_rate_arcsec_per_day ?? 0
    );
    const pa = computePositionAngle(
      mover.motion?.ra_rate_arcsec_per_day ?? 0,
      mover.motion?.dec_rate_arcsec_per_day ?? 0
    );
    const comp = positionAngleToCompass(pa);
    const coordsStr = formatSexagesimalCoords(mover.ra, mover.dec).combined;

    let span = "Single observation";
    if (mover.detections && mover.detections.length > 1) {
      const dates = mover.detections
        .map((d) => new Date(d.date).getTime())
        .filter((t) => !isNaN(t));
      if (dates.length >= 2) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const days = Math.max(0.1, (maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24));
        span = `${minDate.toISOString().slice(0, 10)} to ${maxDate.toISOString().slice(0, 10)} (${days.toFixed(1)} days)`;
      }
    }

    return {
      totalRate: rate,
      compass: comp,
      sexagesimal: coordsStr,
      timeSpanStr: span,
    };
  }, [mover]);

  const description = useMemo(() => (mover ? getMoverDescription(mover) : null), [mover]);

  if (!mover) return null;

  const isKnown = mover.type === "known";

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(mover, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <>
      {/* Desktop side drawer / Mobile bottom sheet container */}
      <section
        role="region"
        aria-label={`Detailed dossier for ${mover.object_id}`}
        className={`flex flex-col bg-[#0a0c12]/95 backdrop-blur-2xl border border-white/[0.08] text-slate-100 rounded-xl overflow-hidden shadow-2xl h-full ${className}`}
      >
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasPrevious}
              onClick={onPrevious}
              aria-label="Prev mover candidate"
              className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              ← Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasNext}
              onClick={onNext}
              aria-label="Next mover candidate"
              className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30"
            >
              Next →
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              className="text-xs gap-1 border-white/10 hover:border-[#c59b6d] py-1"
            >
              <span>🔗</span>
              <span>Share</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close detail view"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c59b6d]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Header Block with NASA Eyes typography & 3D Thumbnail */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#0e1219]/90">
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-light font-sans text-white tracking-normal truncate">
              {mover.object_id}
            </h2>
            {mover.match_name ? (
              <div className="text-sm font-medium text-[#c59b6d] truncate">
                {mover.match_name}
              </div>
            ) : (
              <div className="text-xs text-[#c59b6d] font-mono">
                Unmatched Solar System Candidate
              </div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <GlossaryTooltip
                termKey={isKnown ? "known" : "unknown"}
                beginnerMode={beginnerMode}
              >
                <Badge variant={isKnown ? "known" : "unknown"} size="sm">
                  {isKnown ? "✓ Known Object" : "⚠ Unknown Mover"}
                </Badge>
              </GlossaryTooltip>

              {mover.is_synthetic && (
                <GlossaryTooltip termKey="testData" beginnerMode={beginnerMode}>
                  <Badge variant="test-data" size="sm">
                    TEST DATA
                  </Badge>
                </GlossaryTooltip>
              )}
            </div>
          </div>

          {/* 3D Craft / Body Artwork Thumbnail */}
          {description && (
            <NasaCraftThumbnail
              type={description.craftType}
              size={68}
              className="shrink-0 bg-black/60 rounded-xl p-1 border border-white/10"
            />
          )}
        </div>

        {/* NASA Eyes "WHAT IS IT?" and "WHAT IS IT DOING?" In-depth Dossier */}
        {description && (
          <div className="p-4 border-b border-white/[0.08] flex flex-col gap-3 bg-[#0a0c12]/80">
            {/* 1. WHAT IS IT? */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-[10px] font-sans font-bold tracking-[0.24em] uppercase text-[#c59b6d] flex items-center gap-1.5">
                <span>🔭</span>
                <span>WHAT IS IT?</span>
              </div>
              <p className="text-xs md:text-[13px] font-sans text-white/90 leading-relaxed font-light">
                {description.whatIsIt}
              </p>
            </div>

            {/* 2. WHAT IS IT DOING? */}
            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-[10px] font-sans font-bold tracking-[0.24em] uppercase text-[#c59b6d] flex items-center gap-1.5">
                <span>⚡</span>
                <span>WHAT IS IT DOING?</span>
              </div>
              <p className="text-xs md:text-[13px] font-sans text-white/90 leading-relaxed font-light">
                {description.whatIsItDoing}
              </p>
            </div>
          </div>
        )}

        {/* Honest Label Note for Unknowns */}
        {!isKnown && (
          <div className="px-4 py-3 border-b border-amber-900/40 bg-amber-950/30 text-xs text-amber-200 flex items-start gap-2">
            <span className="text-amber-400 text-sm mt-0.5">ℹ</span>
            <p className="leading-relaxed">
              <span className="font-semibold text-amber-300">Honest Science Label: </span>
              No catalog match, candidate for follow-up. Not matched to asteroid or comet catalogs queried (IMCCE SkyBoT / JPL Horizons).
              This does <em>not</em> guarantee a new discovery; it could be an uncatalogued asteroid, an imaging artifact, or a variable star residual.
            </p>
          </div>
        )}

        {/* Key Facts Block (Metric Grid) */}
        <div className="p-4 border-b border-white/[0.08] grid grid-cols-2 gap-3 text-xs bg-black/40">
          {/* Coordinates */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#c59b6d] flex items-center gap-1">
              Coordinates (J2000)
              <GlossaryTooltip termKey="fov" beginnerMode={beginnerMode} />
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              RA {mover.ra.toFixed(4)}°, Dec {mover.dec.toFixed(4)}°
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {sexagesimal}
            </span>
          </div>

          {/* Proper Motion */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#c59b6d] flex items-center gap-1">
              Motion Rate
              <GlossaryTooltip termKey="motionTrail" beginnerMode={beginnerMode} />
            </span>
            <span className="font-mono text-white font-semibold">
              {totalRate.toFixed(2)} &quot;/day ({compass})
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              µα* {mover.motion?.ra_rate_arcsec_per_day?.toFixed(2)} &quot;/d, µδ {mover.motion?.dec_rate_arcsec_per_day?.toFixed(2)} &quot;/d
            </span>
          </div>

          {/* Detections & Epoch Count */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#c59b6d] flex items-center gap-1">
              Observations
              <GlossaryTooltip termKey="epoch" beginnerMode={beginnerMode} />
            </span>
            <span className="font-mono text-slate-200 font-semibold">
              {mover.detections?.length || 0} detections
            </span>
            <span className="text-[10px] font-mono text-slate-400 truncate" title={timeSpanStr}>
              {timeSpanStr}
            </span>
          </div>

          {/* Confidence Score */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#c59b6d] flex items-center gap-1">
              Confidence Score
              <GlossaryTooltip termKey="confidence" beginnerMode={beginnerMode} />
            </span>
            <ConfidenceBar value={mover.confidence} size="md" />
          </div>
        </div>

        {/* Content Tabs (Filmstrip / Spectrum / JSON) */}
        <div
          role="tablist"
          aria-label="Object details sections"
          className="flex border-b border-white/[0.08] bg-black/60 px-4 pt-1 gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cutouts"}
            onClick={() => setActiveTab("cutouts")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#c59b6d] ${
              activeTab === "cutouts"
                ? "border-[#c59b6d] text-[#c59b6d]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Cutout Filmstrip ({mover.detections?.length || 0})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "spectrum"}
            onClick={() => setActiveTab("spectrum")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#c59b6d] ${
              activeTab === "spectrum"
                ? "border-[#c59b6d] text-[#c59b6d]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Spectrum (SED)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "json"}
            onClick={() => setActiveTab("json")}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#c59b6d] ${
              activeTab === "json"
                ? "border-[#c59b6d] text-[#c59b6d]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Raw Contract JSON
          </button>
        </div>

        {/* Scrollable Tab Panels Body */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {activeTab === "cutouts" && (
            <ErrorBoundary fallbackTitle="Filmstrip Error">
              <Filmstrip
                mover={mover}
                selectedEpochId={selectedEpochId}
                onSelectEpoch={onSelectEpoch}
              />
            </ErrorBoundary>
          )}

          {activeTab === "spectrum" && (
            <ErrorBoundary fallbackTitle="Spectrophotometry Chart Error">
              <SpectrumChart mover={mover} />
            </ErrorBoundary>
          )}

          {activeTab === "json" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Schema v1.0 Mover Object
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopyJson} className="text-xs">
                  {copiedJson ? "✓ Copied" : "Copy JSON"}
                </Button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(mover, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* Share Dialog */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        mover={mover}
        regionName={regionName}
      />
    </>
  );
};
