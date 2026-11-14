"use client";

import React, { useEffect, useState } from "react";

export interface FrameManifestItem {
  epoch_id: string;
  date: string;
  image_path: string;
  bounds: {
    ra_min: number;
    ra_max: number;
    dec_min: number;
    dec_max: number;
    ra_center: number;
    dec_center: number;
    fov_deg: number;
  };
  is_synthetic: boolean;
}

export interface FramesManifest {
  schema_version: string;
  is_synthetic: boolean;
  bounds: FrameManifestItem["bounds"];
  frames: FrameManifestItem[];
}

export interface EpochFramesProps {
  epochIndex: number;
  manifestUrl?: string;
  opacity?: number;
  onManifestLoaded?: (manifest: FramesManifest) => void;
  isDemo?: boolean;
  centerRa?: number;
  centerDec?: number;
  fovDeg?: number;
  containerWidth?: number;
  containerHeight?: number;
  className?: string;
}

export function EpochFrames({
  epochIndex,
  manifestUrl = "/data/frames_manifest.json",
  opacity = 0.85,
  onManifestLoaded,
  isDemo = false,
  centerRa,
  centerDec,
  fovDeg,
  containerWidth,
  containerHeight,
  className = "",
}: EpochFramesProps) {
  const [manifest, setManifest] = useState<FramesManifest | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let isCancelled = false;

    fetch(manifestUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} loading frames manifest`);
        return res.json();
      })
      .then((data: FramesManifest) => {
        if (isCancelled) return;
        setManifest(data);
        onManifestLoaded?.(data);

        // Preload all frames for smooth time-lapse playback
        const frames = data.frames || [];
        if (frames.length === 0) {
          setLoading(false);
          return;
        }

        let loadedCount = 0;
        frames.forEach((frame) => {
          const img = new window.Image();
          img.src = `/${frame.image_path}`;
          img.onload = img.onerror = () => {
            if (isCancelled) return;
            loadedCount++;
            setPreloadProgress(Math.round((loadedCount / frames.length) * 100));
            if (loadedCount >= frames.length) {
              setLoading(false);
            }
          };
        });
      })
      .catch((err: Error) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load epoch frames");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [manifestUrl, onManifestLoaded, isDemo]);

  const activeFrame = manifest?.frames?.[epochIndex] || manifest?.frames?.[0];

  if (error || !activeFrame) {
    return null;
  }

  return (
    <div className={`relative pointer-events-none ${className}`}>
      {/* Loading Progress Bar (briefly visible during frame preloading) */}
      {loading && (
        <div className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded bg-space-950/90 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          Preloading Frames: {preloadProgress}%
        </div>
      )}

      {/* Georeferenced & Feathered SPHEREx Epoch Frame Overlay */}
      {(() => {
        const hasProjection =
          typeof centerRa === "number" &&
          typeof centerDec === "number" &&
          typeof fovDeg === "number" &&
          typeof containerWidth === "number" &&
          typeof containerHeight === "number" &&
          containerWidth > 0 &&
          containerHeight > 0 &&
          fovDeg > 0;

        if (hasProjection && activeFrame.bounds) {
          const cosDec = Math.cos((centerDec * Math.PI) / 180);
          const halfFov = fovDeg / 2.0;
          const dRa = (activeFrame.bounds.ra_center - centerRa) * cosDec;
          const dDec = activeFrame.bounds.dec_center - centerDec;

          // Standard astronomy display: East is Left (-x), North is Up (-y)
          const px = containerWidth / 2 - (dRa / halfFov) * (containerWidth / 2);
          const py = containerHeight / 2 - (dDec / halfFov) * (containerHeight / 2);

          const frameFov = activeFrame.bounds.fov_deg || 1.0;
          const frameWidthPx = (frameFov / fovDeg) * containerWidth;
          const frameHeightPx = (frameFov / fovDeg) * containerHeight;

          return (
            <div
              className="absolute pointer-events-none transition-opacity duration-150"
              style={{
                left: `${px}px`,
                top: `${py}px`,
                width: `${frameWidthPx}px`,
                height: `${frameHeightPx}px`,
                transform: "translate(-50%, -50%)",
                opacity,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/${activeFrame.image_path}`}
                alt={`SPHEREx field for ${activeFrame.epoch_id}`}
                className="w-full h-full object-cover filter contrast-125 select-none"
                style={{
                  maskImage:
                    "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0) 90%)",
                  WebkitMaskImage:
                    "radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0.85) 65%, rgba(0,0,0,0) 90%)",
                }}
              />
            </div>
          );
        }

        return (
          <div
            className="w-full h-full flex items-center justify-center transition-opacity duration-200"
            style={{ opacity }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/${activeFrame.image_path}`}
              alt={`SPHEREx field for ${activeFrame.epoch_id}`}
              className="max-h-full max-w-full object-contain filter contrast-125 select-none"
              style={{
                maskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0) 95%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0) 95%)",
              }}
            />
          </div>
        );
      })()}
    </div>
  );
}
