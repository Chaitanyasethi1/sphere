"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "@/components/layout/AppHeader";
import { SidePanel } from "@/components/layout/SidePanel";
import { ControlRail } from "@/components/layout/ControlRail";
import { MenuDrawer } from "@/components/layout/MenuDrawer";
import { SearchBox, FovControl } from "@/components/viewer";
import { TimeBar, BlinkComparator, SolarTimeBar } from "@/components/time";
import { Button, Card, TestDataBadge, ErrorBoundary } from "@/components/ui";
import { BeginnerTour, DemoTourBar } from "@/components/beginner";
import { ShareModal } from "@/components/share";
import { useCandidateCatalog } from "@/lib/client";
import { useUrlState } from "@/lib/useUrlState";
import type { PlanetKey, ScaleMode } from "@/lib/solarEphemeris";
import { NASA_FEATURED_STORIES, storyToCandidate } from "@/data/nasaStories";
import { ArrowLeft } from "lucide-react";

// Dynamically import SkyViewer with ssr: false (Aladin Lite is browser-only)
const DynamicSkyViewer = dynamic(
  () => import("@/components/viewer/SkyViewer").then((mod) => mod.SkyViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-space-950 text-xs font-mono text-cyan-300">
        Initializing Celestial Viewport...
      </div>
    ),
  }
);

// Dynamically import 3D Universe Canvas with ssr: false (Three.js / WebGL is browser-only)
const DynamicUniverseCanvas = dynamic(
  () => import("@/components/universe3d").then((mod) => mod.UniverseCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black text-xs font-mono text-cyan-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="tracking-widest uppercase text-[11px] font-sans">
            Calibrating 3D Solar System Ephemeris...
          </span>
        </div>
      </div>
    ),
  }
);

export default function SkyDiaryApp() {
  const [urlState, setUrlState] = useUrlState();
  const [beginnerMode, setBeginnerMode] = useState<boolean>(true);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);
  const [isGlobalShareOpen, setIsGlobalShareOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Solar system ephemeris state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [scaleMode, setScaleMode] = useState<ScaleMode>("schematic");
  const [selectedBodyKey, setSelectedBodyKey] = useState<PlanetKey | "spherex" | null>(null);
  const [sidePanelSection, setSidePanelSection] = useState<"solar" | "targets">("solar");

  // Determine active view mode (Solar System 3D vs 2D Survey)
  const isSolarMode = urlState.mode === "solar";
  const is2DSurvey = urlState.mode === "survey" || urlState.mode === "viewer";

  // Keyboard shortcut '/' to trigger search dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load curated offline demo data in demo mode, or master dataset
  const dataUrl = urlState.demo ? "/demo/candidates.json" : "/data/candidates.json";
  const { data: catalog, loading, error, isSynthetic, reload } = useCandidateCatalog(dataUrl);

  const epochs = catalog?.epochs || [];
  const movers = React.useMemo(() => {
    const catalogMovers = catalog?.movers || [];
    const featured = NASA_FEATURED_STORIES.map(storyToCandidate);
    const existing = new Set(catalogMovers.map((m) => m.object_id.toLowerCase()));
    const additionalStories = featured.filter((s) => !existing.has(s.object_id.toLowerCase()));
    return [...additionalStories, ...catalogMovers];
  }, [catalog?.movers]);

  // Find selected mover from URL state or null
  const selectedMover = urlState.object
    ? movers.find((m) => m.object_id === urlState.object) || null
    : null;

  const handleSelectObjectId = (objectId: string | null) => {
    if (!objectId || objectId === urlState.object) {
      setUrlState({ object: null });
    } else {
      const match = movers.find((m) => m.object_id === objectId);
      setUrlState({
        object: objectId,
        ...(match ? { ra: match.ra, dec: match.dec } : {}),
      });
    }
  };

  const handleSearchCoordinate = (coords: { ra: number; dec: number; fov?: number }) => {
    setUrlState({
      ra: coords.ra,
      dec: coords.dec,
      ...(coords.fov ? { fov: coords.fov } : {}),
      mode: "survey",
    });
  };

  // Dive from 3D solar system into 2D survey
  const handleDiveToSurvey = useCallback(
    (coords: { ra: number; dec: number; objectId?: string | null }) => {
      setUrlState({
        mode: "survey",
        ra: coords.ra,
        dec: coords.dec,
        object: coords.objectId || null,
      });
      setSidePanelSection("targets");
    },
    [setUrlState]
  );

  // Return to 3D Solar System from 2D Survey
  const handleBackToSolar = useCallback(() => {
    setUrlState({
      mode: "solar",
    });
    setSidePanelSection("solar");
  }, [setUrlState]);

  /* =========================================================
     LOADING STATE
     ========================================================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-amber-500/20 border-b-amber-400 animate-spin [animation-direction:reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-light text-white font-sans tracking-wide">
            EYES ON SPHEREx: SKY DIARY
          </h2>
          <p className="text-xs text-white/50 font-mono">
            Computing planetary ephemeris, orbital samples, and multi-epoch candidate catalogs...
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     ERROR STATE
     ========================================================= */
  if (error || !catalog) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full border-white/10 p-6 space-y-4 bg-[rgba(20,20,22,0.95)]">
          <div className="h-12 w-12 rounded-full bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center text-amber-400 text-xl font-medium">
            !
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-light text-white font-sans tracking-wide">
              Data Pipeline Error
            </h2>
            <p className="text-xs text-white/50 font-mono">
              {error || "Could not load candidate data catalog"}
            </p>
          </div>

          <p className="text-xs text-white/40">
            Verify that candidate data exists in public/data or run the mock generator.
          </p>

          <Button variant="primary" onClick={reload} className="w-full">
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  /* =========================================================
     EMBED MODE (embed=1: Minimal chrome for iframes)
     ========================================================= */
  if (urlState.embed) {
    return (
      <div className="h-screen w-screen relative overflow-hidden bg-black">
        {isSynthetic && (
          <div className="absolute top-3 left-3 z-30">
            <TestDataBadge />
          </div>
        )}

        <ErrorBoundary fallbackTitle="Embedded Viewer Error">
          <DynamicSkyViewer
            ra={urlState.ra}
            dec={urlState.dec}
            fov={urlState.fov}
            onMove={(ra, dec, fov) => setUrlState({ ra, dec, fov })}
            movers={movers}
            selectedObjectId={urlState.object}
            epochIndex={urlState.epoch}
            epochs={epochs}
            onSelect={handleSelectObjectId}
            showTrails={urlState.trails}
            isDemo={urlState.demo}
          />
        </ErrorBoundary>

        <div className="absolute bottom-3 inset-x-3 z-30">
          <TimeBar
            epochs={epochs}
            currentEpochIndex={urlState.epoch}
            onEpochChange={(epoch) => setUrlState({ epoch })}
          />
        </div>
      </div>
    );
  }

  /* =========================================================
     FULL APPLICATION SHELL (NASA Eyes Minimalist Visual Language)
     ========================================================= */
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-black text-white select-none relative font-sans">
      {/* 1. NASA Eyes Top Minimalist Header */}
      <AppHeader
        isSynthetic={isSynthetic}
        beginnerMode={beginnerMode}
        onToggleBeginnerMode={() => setBeginnerMode(!beginnerMode)}
        candidateCount={catalog.movers.length}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenShare={() => setIsGlobalShareOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        activeTargetName={catalog?.region?.name || "SPHEREx Deep Field North"}
        isDemo={urlState.demo}
        onToggleDemo={() => setUrlState({ demo: !urlState.demo })}
        mode3D={isSolarMode}
        onToggleMode3D={() =>
          setUrlState({
            mode: isSolarMode ? "survey" : "solar",
          })
        }
        onSelectTarget={(target) => {
          setUrlState({
            ra: target.ra,
            dec: target.dec,
            fov: target.fov,
            mode: "survey",
          });
        }}
      />

      {/* Demo Mode Honesty Banner (Slim & Unobtrusive) */}
      {urlState.demo && (
        <div className="w-full bg-amber-950/70 border-b border-amber-500/20 py-1 px-6 text-center text-[11px] font-mono text-amber-200/90 flex items-center justify-between gap-2 z-40 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400">⚠</span>
            <span className="truncate">
              DEMO BENCHMARK: SPHEREx Deep Field North (Synthetic Dataset).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDemoTourOpen(true)}
            className="text-[10px] uppercase tracking-wider text-amber-300 hover:text-white px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/20 shrink-0 font-sans cursor-pointer"
          >
            ▶ Pitch Tour
          </button>
        </div>
      )}

      {/* 2. Main NASA Eyes Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Floating SidePanel (NASA Eyes layout) */}
        <ErrorBoundary fallbackTitle="Movers Panel Error">
          <SidePanel
            movers={movers}
            selectedMover={selectedMover}
            onSelectMover={(mover) => {
              if (mover) {
                setUrlState({
                  object: mover.object_id,
                  ra: mover.ra,
                  dec: mover.dec,
                });
              } else {
                setUrlState({ object: null });
              }
            }}
            beginnerMode={beginnerMode}
            selectedEpochId={epochs[urlState.epoch]?.epoch_id}
            onSelectEpoch={(epochId) => {
              const idx = epochs.findIndex((e) => e.epoch_id === epochId);
              if (idx !== -1) {
                setUrlState({ epoch: idx });
              }
            }}
            regionName={catalog?.region?.name}
            activeSection={sidePanelSection}
            onSectionChange={setSidePanelSection}
            selectedBodyKey={selectedBodyKey}
            onSelectBody={(bodyKey) => {
              setSelectedBodyKey(bodyKey);
            }}
            currentDate={currentDate}
            onSelectChallengeTarget={(target) => {
              handleDiveToSurvey({
                ra: target.ra,
                dec: target.dec,
              });
            }}
            scaleMode={scaleMode}
            onToggleScaleMode={() => setScaleMode((s) => (s === "schematic" ? "true" : "schematic"))}
            onResetView={() => setSelectedBodyKey(null)}
          />
        </ErrorBoundary>

        {/* Center / Full-Bleed Sky Canvas & HUD Overlays */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Fallback Notice Banner if URL params were invalid */}
          {urlState.fallbackNotice && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-[11px] font-mono text-amber-200 shadow-xl">
              {urlState.fallbackNotice}
            </div>
          )}

          {/* Mode Switch Floating Pill (When in 2D survey, one-click back to 3D Solar System) */}
          {is2DSurvey && (
            <div className="absolute top-4 left-4 z-30 pointer-events-auto">
              <button
                type="button"
                onClick={handleBackToSolar}
                className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] bg-[rgba(20,20,22,0.92)] hover:bg-[rgba(30,32,40,0.98)] backdrop-blur-md border border-white/[0.16] hover:border-[#22D3EE]/60 text-white shadow-2xl transition-all cursor-pointer group"
                title="Return to 3D Solar System"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#22D3EE] group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[11px] font-sans font-medium tracking-[0.18em] uppercase text-white/90">
                  Solar System
                </span>
              </button>
            </div>
          )}

          {/* Interactive Celestial Sky Canvas: 3D Solar System vs 2D Survey */}
          <div className="flex-1 relative w-full h-full overflow-hidden">
            {isSolarMode ? (
              <ErrorBoundary fallbackTitle="3D Solar System Error">
                <DynamicUniverseCanvas
                  currentDate={currentDate}
                  movers={movers}
                  selectedObjectId={urlState.object}
                  onSelectObject={handleSelectObjectId}
                  onDiveToSurvey={handleDiveToSurvey}
                  scaleMode={scaleMode}
                  onToggleScaleMode={() => setScaleMode((s) => (s === "schematic" ? "true" : "schematic"))}
                  showTrails={urlState.trails}
                  isDemo={urlState.demo}
                />
              </ErrorBoundary>
            ) : (
              <ErrorBoundary fallbackTitle="2D Sky Survey Error">
                <DynamicSkyViewer
                  ra={urlState.ra}
                  dec={urlState.dec}
                  fov={urlState.fov}
                  onMove={(ra, dec, fov) => setUrlState({ ra, dec, fov })}
                  movers={movers}
                  selectedObjectId={urlState.object}
                  epochIndex={urlState.epoch}
                  epochs={epochs}
                  onSelect={handleSelectObjectId}
                  showTrails={urlState.trails}
                  isDemo={urlState.demo}
                />
              </ErrorBoundary>
            )}

            {/* Field of View Floating Preset Overlay (in 2D survey mode) */}
            {is2DSurvey && (
              <div className="absolute top-4 right-20 z-30 max-w-xs">
                <FovControl
                  fov={urlState.fov}
                  onFovChange={(newFov) => setUrlState({ fov: newFov })}
                />
              </div>
            )}

            {/* 3. Right-Hand Control Rail (NASA Eyes Vertical Rail) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
              <ControlRail
                onToggleInfo={() => {
                  if (selectedMover) {
                    setUrlState({ object: null });
                  } else if (movers.length > 0) {
                    setUrlState({ object: movers[0].object_id });
                  }
                }}
                isInfoOpen={Boolean(selectedMover)}
                onToggleLayers={() => setUrlState({ trails: !urlState.trails })}
                isLayersOpen={Boolean(urlState.trails)}
                onZoomIn={() => setUrlState({ fov: Math.max(0.02, +(urlState.fov * 0.7).toFixed(3)) })}
                onZoomOut={() => setUrlState({ fov: Math.min(5.0, +(urlState.fov * 1.4).toFixed(3)) })}
                onToggleInvert={() => setUrlState({ mode: urlState.mode === "viewer" ? "blink" : "viewer" })}
                isInverted={urlState.mode === "blink"}
                onToggleFullscreen={() => {
                  if (typeof document !== "undefined") {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
                    } else {
                      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
                    }
                  }
                }}
                isFullscreen={isFullscreen}
                mode3D={isSolarMode}
                onToggleMode3D={() =>
                  setUrlState({
                    mode: isSolarMode ? "survey" : "solar",
                  })
                }
                onResetView={() => {
                  if (isSolarMode) {
                    setSelectedBodyKey(null);
                  } else {
                    setUrlState({ ra: 269.45, dec: 66.6, fov: 0.8, object: null });
                  }
                }}
              />
            </div>

            {/* 4. Bottom-Center Time Bar (NASA Eyes layout) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94vw] max-w-2xl pointer-events-auto">
              {isSolarMode ? (
                <SolarTimeBar
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                />
              ) : urlState.mode === "blink" ? (
                <BlinkComparator
                  epochs={epochs}
                  currentEpochIndex={urlState.epoch}
                  onEpochChange={(epoch) => setUrlState({ epoch })}
                />
              ) : (
                <TimeBar
                  epochs={epochs}
                  currentEpochIndex={urlState.epoch}
                  onEpochChange={(epoch) => setUrlState({ epoch })}
                  isSynthetic={isSynthetic}
                />
              )}
            </div>

            {/* 5. Visible Build Stamp in Footer Corner (Requirement: verify latest build) */}
            <div
              className="absolute bottom-1 right-2 z-20 pointer-events-none text-[10px] font-mono text-white/30 tracking-widest uppercase select-none"
              title="SPHEREx Sky Diary - NASA Eyes Solar System Landing. Press Ctrl+F5 for hard refresh."
            >
              v0.1.0 · BUILD 2026-11-14 · EYES ON SOLAR SYSTEM
            </div>
          </div>
        </div>
      </main>

      {/* Inline / Spotlight Search Expansion (NASA Eyes style) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/75 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl p-4 rounded-[3px] bg-[rgba(20,20,22,0.96)] border border-white/[0.12] shadow-2xl z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.10] pb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#B8BCC4] font-medium font-sans">
                Search Targets &amp; Celestial Coordinates
              </span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[#B8BCC4] hover:text-white font-mono text-xs px-2 cursor-pointer"
              >
                ESC
              </button>
            </div>
            <SearchBox
              onCoordinateSelect={(coords) => {
                handleSearchCoordinate(coords);
                setIsSearchOpen(false);
              }}
              isDemo={urlState.demo}
            />
          </div>
        </div>
      )}

      {/* NASA Eyes Full-Height Menu Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        beginnerMode={beginnerMode}
        onToggleBeginnerMode={() => setBeginnerMode(!beginnerMode)}
        onOpenTour={() => {
          setIsMenuOpen(false);
          setIsTourOpen(true);
        }}
        isSynthetic={isSynthetic}
      />

      {/* Guided Tour Walkthrough Dialog */}
      <BeginnerTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />

      {/* 3-Minute Demo Pitch Automated Tour Bar */}
      <DemoTourBar
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onApplyState={(newState) => setUrlState(newState)}
      />

      {/* Global Share Dialog */}
      <ShareModal
        isOpen={isGlobalShareOpen}
        onClose={() => setIsGlobalShareOpen(false)}
        mover={selectedMover}
        regionName={catalog?.region?.name}
      />
    </div>
  );
}
