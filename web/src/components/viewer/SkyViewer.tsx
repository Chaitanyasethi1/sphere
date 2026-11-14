/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { DESIGN_TOKENS } from "@/design/tokens";
import { MoverOverlay } from "./MoverOverlay";
import { EpochFrames } from "./EpochFrames";
import type { MoverCandidate, EpochInfo } from "@/types";

export interface SkyViewerProps {
  ra: number;
  dec: number;
  fov: number;
  onMove?: (ra: number, dec: number, fov: number) => void;
  movers: MoverCandidate[];
  selectedObjectId?: string | null;
  epochIndex: number;
  epochs: EpochInfo[];
  onSelect: (objectId: string) => void;
  showTrails?: boolean;
  surveyId?: string;
  isDemo?: boolean;
  className?: string;
}

export function SkyViewer({
  ra,
  dec,
  fov,
  onMove,
  movers,
  selectedObjectId,
  epochIndex,
  epochs,
  onSelect,
  showTrails = true,
  surveyId = DESIGN_TOKENS.surveys.defaultSurveyId,
  isDemo = false,
  className = "",
}: SkyViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const aladinDivId = useId().replace(/:/g, "_");

  const [aladinError, setAladinError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [useCanvasFallback, setUseCanvasFallback] = useState<boolean>(() => {
    if (isDemo) return true;
    if (typeof navigator !== "undefined" && !navigator.onLine) return true;
    return false;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; ra: number; dec: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Deterministic realistic star field for canvas/offline/demo mode (1,200+ stars)
  const starsRef = useRef<
    Array<{ ra: number; dec: number; mag: number; color: string; spike: boolean; phase: number }>
  >([]);
  if (starsRef.current.length === 0) {
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    // Spectral colors: O/B blue, A white, F yellow-white, G yellow, K orange, M red
    const spectralColors = [
      "#ffffff",
      "#f8fafc",
      "#e0f2fe",
      "#bae6fd",
      "#7dd3fc",
      "#fef08a",
      "#fde047",
      "#fed7aa",
      "#fca5a5",
    ];

    for (let i = 0; i < 1200; i++) {
      const magRaw = rand();
      // Power law distribution: vastly more faint stars than bright stars
      const mag = 0.5 + Math.pow(magRaw, 2.2) * 5.5;
      const isBright = mag < 2.0;

      starsRef.current.push({
        ra: 269.452 + (rand() - 0.5) * 8.0,
        dec: 66.561 + (rand() - 0.5) * 8.0,
        mag,
        color: spectralColors[Math.floor(rand() * spectralColors.length)],
        spike: isBright || (mag < 3.0 && rand() > 0.6),
        phase: rand() * Math.PI * 2,
      });
    }
  }

  const aladinInstanceRef = useRef<any>(null);
  const isUpdatingFromProps = useRef(false);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // ResizeObserver to track container dimensions for accurate marker projection
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(300, entry.contentRect.height),
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update canvas fallback if isDemo changes
  useEffect(() => {
    if (isDemo) {
      setUseCanvasFallback(true);
    }
  }, [isDemo]);

  // Smooth mouse wheel zoom in and zoom out listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Zoom factor: 0.88 for zoom in, 1.14 for zoom out
      const factor = e.deltaY < 0 ? 0.88 : 1.14;
      const newFov = Math.max(0.01, Math.min(10.0, +(fov * factor).toFixed(4)));

      if (newFov !== fov) {
        onMoveRef.current?.(ra, dec, newFov);
        if (aladinInstanceRef.current && typeof aladinInstanceRef.current.setFov === "function") {
          aladinInstanceRef.current.setFov(newFov);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [fov, ra, dec]);

  // Render dynamic starfield canvas when in offline/demo/canvas mode with smooth animation
  useEffect(() => {
    if (!useCanvasFallback || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    const startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) * 0.001; // seconds
      const width = dimensions.width;
      const height = dimensions.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Cosmic deep space gradient with subtle infrared nebular clouds
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "rgba(8, 20, 48, 1)");
      bgGrad.addColorStop(0.4, "rgba(5, 12, 28, 1)");
      bgGrad.addColorStop(1, "rgba(2, 4, 10, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle diffuse nebular dust patch (JWST/SPHEREx simulated IR glow)
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.42,
        height * 0.48,
        20,
        width * 0.42,
        height * 0.48,
        width * 0.55
      );
      nebulaGrad.addColorStop(0, "rgba(6, 182, 212, 0.04)");
      nebulaGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.025)");
      nebulaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. High-precision J2000 Celestial Coordinate Grid
      const cosDec = Math.cos((dec * Math.PI) / 180);
      const halfFov = fov / 2.0;

      // Adaptive grid line spacing in degrees based on FOV
      let gridStepDeg = 0.5;
      if (fov < 0.15) gridStepDeg = 0.02;
      else if (fov < 0.4) gridStepDeg = 0.05;
      else if (fov < 1.0) gridStepDeg = 0.1;
      else if (fov < 2.5) gridStepDeg = 0.25;

      const raMin = ra - halfFov / (cosDec || 1);
      const raMax = ra + halfFov / (cosDec || 1);
      const decMin = dec - halfFov;
      const decMax = dec + halfFov;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";

      // Declination parallels (Horizontal lines)
      const startDec = Math.floor(decMin / gridStepDeg) * gridStepDeg;
      for (let d = startDec; d <= decMax + gridStepDeg; d += gridStepDeg) {
        const dDec = d - dec;
        const py = height / 2 - (dDec / halfFov) * (height / 2);
        if (py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(width, py);
          ctx.stroke();

          // Declination label on right edge
          const sign = d >= 0 ? "+" : "";
          const dLabel = `${sign}${d.toFixed(2)}°`;
          ctx.fillText(dLabel, 8, py - 3);
        }
      }

      // Right Ascension meridians (Vertical lines)
      const startRa = Math.floor(raMin / gridStepDeg) * gridStepDeg;
      for (let r = startRa; r <= raMax + gridStepDeg; r += gridStepDeg) {
        const dRa = (r - ra) * cosDec;
        // East is Left (-x)
        const px = width / 2 - (dRa / halfFov) * (width / 2);
        if (px >= 0 && px <= width) {
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, height);
          ctx.stroke();

          // RA label on bottom edge
          const raHours = (r / 15).toFixed(2);
          ctx.fillText(`${raHours}h`, px + 4, height - 10);
        }
      }

      // 3. Render 1,200+ multi-spectral stars with diffraction spikes and twinkling
      starsRef.current.forEach((star) => {
        const dRa = (star.ra - ra) * cosDec;
        const dDec = star.dec - dec;

        const sx = width / 2 - (dRa / halfFov) * (width / 2);
        const sy = height / 2 - (dDec / halfFov) * (height / 2);

        if (sx >= -20 && sx <= width + 20 && sy >= -20 && sy <= height + 20) {
          // Subtle twinkle factor (sinusoidal modulation)
          const twinkle = 0.85 + 0.3 * Math.sin(elapsed * 2.5 + star.phase);
          const baseRadius = Math.max(0.6, Math.min(3.8, star.mag * (0.2 / fov) * 0.7 * twinkle));

          // Soft Gaussian outer glow for bright stars
          if (star.mag > 2.5) {
            ctx.fillStyle = star.color;
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.arc(sx, sy, baseRadius * 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Star Core
          ctx.globalAlpha = Math.min(1.0, 0.7 + twinkle * 0.3);
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(sx, sy, baseRadius, 0, Math.PI * 2);
          ctx.fill();

          // 4-Point Space Telescope Diffraction Spikes for bright reference stars
          if (star.spike && baseRadius > 1.4) {
            const spikeLen = baseRadius * 4.5 * twinkle;
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.35 * twinkle;

            ctx.beginPath();
            // Horizontal spike
            ctx.moveTo(sx - spikeLen, sy);
            ctx.lineTo(sx + spikeLen, sy);
            // Vertical spike
            ctx.moveTo(sx, sy - spikeLen);
            ctx.lineTo(sx, sy + spikeLen);
            ctx.stroke();
          }
        }
      });

      ctx.globalAlpha = 1.0;
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameId);
  }, [ra, dec, fov, dimensions, useCanvasFallback]);

  // Aladin Lite initialization & StrictMode cleanup
  useEffect(() => {
    if (useCanvasFallback || typeof window === "undefined") {
      return;
    }

    let isCancelled = false;
    let aladinInstance: any = null;

    // Shield against unhandled promise rejections from Aladin Lite network requests (e.g. CDS unreachable)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonStr = String(reason?.message || reason || "");
      const stackStr = String(reason?.stack || "");
      const isFetchOrAladin =
        reasonStr.includes("fetch") ||
        reasonStr.includes("HiPS") ||
        reasonStr.includes("NetworkError") ||
        reasonStr.includes("Failed to fetch") ||
        reasonStr.includes("Load failed") ||
        reasonStr.includes("properties") ||
        stackStr.includes("aladin") ||
        stackStr.includes("SkyViewer");

      if (isFetchOrAladin) {
        // Prevent Next.js development overlay and browser uncaught error banner
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!isCancelled) {
          console.warn("Aladin Lite network request failed; falling back to offline star-field canvas:", reason);
          setAladinError("Sky survey network connection unavailable. Operating in offline sky view.");
          setUseCanvasFallback(true);
        }
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = String(event.message || "");
      if (
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("HiPS") ||
        msg.includes("aladin")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!isCancelled) {
          console.warn("Aladin error intercepted; falling back to offline canvas:", msg);
          setAladinError("Sky survey network connection unavailable. Operating in offline sky view.");
          setUseCanvasFallback(true);
        }
      }
    };

    // Safe fetch wrapper: gracefully handles CDS / HiPS network errors when offline
    const originalFetch = window.fetch;
    const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      try {
        return await originalFetch(input, init);
      } catch (err) {
        const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
        if (
          urlStr.includes("cds.unistra.fr") ||
          urlStr.includes("u-strasbg.fr") ||
          urlStr.includes("aladin") ||
          urlStr.includes("hips")
        ) {
          if (urlStr.includes("MocServer") || urlStr.includes("fmt=json") || urlStr.endsWith(".json")) {
            return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (urlStr.includes("properties")) {
            return new Response(
              "creator_did = ivo://CDS/P/allWISE/color\nhips_order = 9\nhips_frame = equatorial\nhips_tile_format = jpeg\n",
              { status: 200, headers: { "Content-Type": "text/plain" } }
            );
          }
          // Transparent 1x1 GIF fallback tile
          const emptyGif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          return new Response(Uint8Array.from(atob(emptyGif), (c) => c.charCodeAt(0)), {
            status: 200,
            headers: { "Content-Type": "image/gif" },
          });
        }
        throw err;
      }
    };
    window.fetch = safeFetch;

    window.addEventListener("unhandledrejection", handleRejection, true);
    window.addEventListener("error", handleError, true);

    const initAladin = async () => {
      try {
        const aladinModule = await import("aladin-lite");
        const A = (aladinModule as any).default || aladinModule;

        if (isCancelled) return;

        // Ensure target container exists
        const targetElement = document.getElementById(aladinDivId);
        if (!targetElement) return;

        // Clean any existing children in container to prevent duplicate WebGL canvases
        targetElement.innerHTML = "";

        // Wait for library ready (WebGL2 verification)
        if (A.init && typeof A.init.then === "function") {
          await A.init;
        }

        if (isCancelled) return;

        // Initialize Aladin Lite v3 with target element directly
        aladinInstance = A.aladin(targetElement, {
          survey: surveyId,
          fov: fov,
          target: `${ra} ${dec}`,
          showCooGrid: true,
          showCooGridControl: false,
          showFullscreenControl: false,
          showLayersControl: false,
          showGotoControl: false,
          showShareControl: false,
          showSimbadPointerControl: false,
          cooFrame: "equatorial",
        });

        aladinInstanceRef.current = aladinInstance;

        // Listen for pan and zoom events
        if (aladinInstance && typeof aladinInstance.on === "function") {
          aladinInstance.on("positionChanged", () => {
            if (isUpdatingFromProps.current || !onMoveRef.current) return;
            const [curRa, curDec] = aladinInstance.getRaDec();
            const curFov = aladinInstance.getFov()[0];
            onMoveRef.current(curRa, curDec, curFov);
          });

          aladinInstance.on("zoomChanged", (newFov: any) => {
            if (isUpdatingFromProps.current || !onMoveRef.current) return;
            const [curRa, curDec] = aladinInstance.getRaDec();
            onMoveRef.current(curRa, curDec, newFov);
          });
        }

        setAladinError(null);
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Aladin Lite initialization failed";
          setAladinError(msg);
          setUseCanvasFallback(true); // Fallback to offline canvas
        }
      }
    };

    initAladin().catch(() => {
      if (!isCancelled) {
        setUseCanvasFallback(true);
      }
    });

    // Cleanup on unmount (React Strict Mode safe)
    return () => {
      isCancelled = true;
      window.fetch = originalFetch;
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
      if (aladinInstanceRef.current) {
        try {
          if (typeof aladinInstanceRef.current.destroy === "function") {
            aladinInstanceRef.current.destroy();
          }
        } catch {
          // ignore
        }
        aladinInstanceRef.current = null;
      }
      const el = document.getElementById(aladinDivId);
      if (el) el.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aladinDivId, surveyId, useCanvasFallback]);

  // Synchronize incoming RA, Dec, FoV props to Aladin instance without loops
  useEffect(() => {
    const inst = aladinInstanceRef.current;
    if (!inst) return;

    try {
      isUpdatingFromProps.current = true;
      inst.gotoRaDec(ra, dec);
      inst.setFov(fov);
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 50);
    }
  }, [ra, dec, fov]);

  const currentEpoch = epochs[epochIndex] || null;

  // Pointer drag-to-pan hand relocation handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if ((e.target as HTMLElement)?.closest("button, a, input, [role='button']")) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ra,
      dec,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

    const cosDec = Math.cos((dragStartRef.current.dec * Math.PI) / 180);
    // East is Left (-X): dragging cursor right (+dx) brings Eastern sky into view -> RA increases
    const raDelta = (dx / dimensions.width) * (fov / (cosDec || 1));
    // North is Up (-Y): dragging cursor down (+dy) brings Northern sky into view -> Dec increases
    const decDelta = (dy / dimensions.height) * fov;

    let newRa = (dragStartRef.current.ra + raDelta) % 360;
    if (newRa < 0) newRa += 360;
    const newDec = Math.max(-89.9, Math.min(89.9, dragStartRef.current.dec + decDelta));

    onMoveRef.current?.(newRa, newDec, fov);

    if (aladinInstanceRef.current && typeof aladinInstanceRef.current.gotoRaDec === "function") {
      aladinInstanceRef.current.gotoRaDec(newRa, newDec);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragStartRef.current = null;
    }
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement)?.closest("button, a, input, [role='button']")) return;
    const factor = e.shiftKey ? 1.5 : 0.65;
    const newFov = Math.max(0.01, Math.min(10.0, +(fov * factor).toFixed(4)));
    onMoveRef.current?.(ra, dec, newFov);
    if (aladinInstanceRef.current && typeof aladinInstanceRef.current.setFov === "function") {
      aladinInstanceRef.current.setFov(newFov);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full bg-space-950 overflow-hidden select-none touch-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      role="region"
      aria-label="Celestial sky view and multi-epoch observation player"
    >
      {/* Dynamic Hand & Pan Cursor Styling Injection for Aladin WebGL Canvas */}
      <style>{`
        #${aladinDivId}, #${aladinDivId} canvas {
          cursor: ${isDragging ? "grabbing" : "grab"} !important;
        }
      `}</style>

      {/* 1. Aladin Lite WebGL Canvas Mount Container */}
      {!useCanvasFallback && (
        <div
          id={aladinDivId}
          className="absolute inset-0 w-full h-full z-0"
          style={{ width: "100%", height: "100%" }}
        />
      )}

      {/* 2. Offline Fallback Plain Star-Field Canvas (Used in Demo mode or when Aladin fails) */}
      {useCanvasFallback && (
        <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center bg-space-950 pointer-events-none">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0 w-full h-full"
          />

          {/* NASA Eyes Style Celestial Target Reticle */}
          <div className="relative h-64 w-64 sm:h-80 sm:w-80 rounded-full border border-cyan-500/25 flex items-center justify-center shadow-2xl shadow-cyan-950/30 pointer-events-none">
            <div className="absolute inset-12 rounded-full border border-dashed border-white/10" />
            <div className="absolute h-full w-px bg-white/10" />
            <div className="absolute w-full h-px bg-white/10" />
            <div className="h-4 w-4 rounded-full border border-cyan-400/40 flex items-center justify-center">
              <span className="h-1 w-1 rounded-full bg-cyan-400" />
            </div>
            <span className="absolute top-2 text-[9px] font-mono font-semibold text-cyan-300/60 tracking-wider">+N</span>
            <span className="absolute bottom-2 text-[9px] font-mono font-semibold text-cyan-300/60 tracking-wider">-S</span>
            <span className="absolute left-2 text-[9px] font-mono font-semibold text-cyan-300/60 tracking-wider">+E</span>
            <span className="absolute right-2 text-[9px] font-mono font-semibold text-cyan-300/60 tracking-wider">-W</span>
          </div>
        </div>
      )}

      {/* 3. Display-Ready SPHEREx Epoch Frame Overlay (Synchronously Georeferenced & Feathered) */}
      <EpochFrames
        epochIndex={epochIndex}
        opacity={0.82}
        isDemo={isDemo}
        centerRa={ra}
        centerDec={dec}
        fovDeg={fov}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
        className="absolute inset-0 z-10 pointer-events-none"
      />

      {/* 4. Moving Object Markers & Trails Layer */}
      <MoverOverlay
        movers={movers}
        currentEpoch={currentEpoch}
        currentEpochIndex={epochIndex}
        selectedObjectId={selectedObjectId}
        onSelect={onSelect}
        showTrails={showTrails}
        centerRa={ra}
        centerDec={dec}
        fovDeg={fov}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
        className="z-20"
      />

      {/* 5. Sky Coordinates Overlay Badge (NASA Eyes HUD Telemetry) */}
      <div className="absolute top-3 right-3 z-30 px-3 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-right text-xs font-mono pointer-events-none space-y-1 shadow-2xl">
        <div className="text-[9px] uppercase tracking-widest text-white/50 font-sans font-semibold">
          POINTING (J2000)
        </div>
        <div className="text-cyan-300 font-bold tracking-tight text-xs md:text-sm">
          RA {ra.toFixed(4)}° • Dec {dec >= 0 ? `+${dec.toFixed(4)}` : dec.toFixed(4)}°
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] text-white/60">
          <span>FoV: {fov.toFixed(2)}° ({(fov * 60).toFixed(1)}&apos;)</span>
          <span className="text-white/20">•</span>
          {isDemo ? (
            <span className="px-2 py-0.5 rounded-full border bg-amber-500/20 border-amber-500/40 text-amber-300">
              Offline Demo Mode
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setUseCanvasFallback((prev) => !prev)}
              className={`cursor-pointer px-2 py-0.5 rounded-full border transition-all ${
                useCanvasFallback
                  ? "bg-amber-500/15 border-amber-400/40 text-amber-300 hover:bg-amber-500/25"
                  : "bg-cyan-500/15 border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/25"
              }`}
              title="Click to toggle between Aladin Lite CDS HiPS tiles and offline canvas"
            >
              {useCanvasFallback ? "📊 BENCHMARK CANVAS" : "🔭 ALADIN LITE"}
            </button>
          )}
        </div>
      </div>

      {/* Offline / Connection Notice Toast */}
      {aladinError && !isDemo && (
        <div className="absolute bottom-3 left-3 z-30 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[11px] font-mono shadow-xl flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{aladinError}</span>
        </div>
      )}
    </div>
  );
}
