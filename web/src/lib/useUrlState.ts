/**
 * SPHEREx Sky Diary - URL State Management & Deep Linking.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export type AppViewMode = "solar" | "survey" | "viewer" | "blink";

export interface ViewerUrlState {
  ra: number;
  dec: number;
  fov: number;
  epoch: number;
  object: string | null;
  trails: boolean;
  mode: AppViewMode;
  embed: boolean;
  demo: boolean;
  fallbackNotice: string | null;
}

export const DEFAULT_VIEWER_STATE: ViewerUrlState = {
  ra: 269.452,
  dec: 66.561,
  fov: 0.2,
  epoch: 0,
  object: null,
  trails: true,
  mode: "solar",
  embed: false,
  demo: false,
  fallbackNotice: null,
};

export function parseUrlParams(search: string): ViewerUrlState {
  const cleanSearch = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(cleanSearch);

  let fallbackNotice: string | null = null;

  // RA
  let ra = DEFAULT_VIEWER_STATE.ra;
  if (params.has("ra")) {
    const parsedRa = parseFloat(params.get("ra") || "");
    if (!isNaN(parsedRa) && parsedRa >= 0 && parsedRa <= 360) {
      ra = parsedRa;
    } else {
      fallbackNotice = "Right Ascension out of bounds, reverted to default.";
    }
  }

  // Dec
  let dec = DEFAULT_VIEWER_STATE.dec;
  if (params.has("dec")) {
    const parsedDec = parseFloat(params.get("dec") || "");
    if (!isNaN(parsedDec) && parsedDec >= -90 && parsedDec <= 90) {
      dec = parsedDec;
    } else {
      fallbackNotice = "Declination out of bounds, reverted to default.";
    }
  }

  // FOV
  let fov = DEFAULT_VIEWER_STATE.fov;
  if (params.has("fov")) {
    const parsedFov = parseFloat(params.get("fov") || "");
    if (!isNaN(parsedFov) && parsedFov > 0 && parsedFov <= 10.0) {
      fov = parsedFov;
    } else {
      fallbackNotice = "Field of View invalid, reverted to default.";
    }
  }

  // Epoch
  let epoch = DEFAULT_VIEWER_STATE.epoch;
  if (params.has("epoch")) {
    const parsedEpoch = parseInt(params.get("epoch") || "", 10);
    if (!isNaN(parsedEpoch) && parsedEpoch >= 0) {
      epoch = parsedEpoch;
    } else {
      epoch = 0;
      fallbackNotice = "Epoch index invalid, reverted to 0.";
    }
  }

  // Object
  const object = params.get("object") || null;

  // Trails
  let trails = DEFAULT_VIEWER_STATE.trails;
  if (params.has("trails")) {
    const tVal = params.get("trails");
    trails = tVal === "1" || tVal === "true";
  }

  // Mode: "solar" | "survey" | "viewer" | "blink"
  const mVal = params.get("mode");
  let mode: AppViewMode = DEFAULT_VIEWER_STATE.mode;
  if (mVal === "solar" || mVal === "survey" || mVal === "viewer" || mVal === "blink") {
    mode = mVal;
  }

  // Embed
  const eVal = params.get("embed");
  const embed = eVal === "1" || eVal === "true";

  // Demo
  const dVal = params.get("demo");
  const demo = dVal === "1" || dVal === "true";

  return {
    ra,
    dec,
    fov,
    epoch,
    object,
    trails,
    mode,
    embed,
    demo,
    fallbackNotice,
  };
}

export function serializeUrlState(state: Partial<ViewerUrlState>): string {
  const params = new URLSearchParams();

  if (state.ra !== undefined) params.set("ra", state.ra.toFixed(4));
  if (state.dec !== undefined) params.set("dec", state.dec.toFixed(4));
  if (state.fov !== undefined) params.set("fov", state.fov.toFixed(2));
  if (state.epoch !== undefined && state.epoch > 0) params.set("epoch", state.epoch.toString());
  if (state.object) params.set("object", state.object);
  if (state.trails !== undefined) params.set("trails", state.trails ? "1" : "0");
  if (state.mode) params.set("mode", state.mode);
  if (state.embed) params.set("embed", "1");
  if (state.demo) params.set("demo", "1");

  return params.toString();
}

export function useUrlState(): [
  ViewerUrlState,
  (updater: Partial<ViewerUrlState> | ((prev: ViewerUrlState) => Partial<ViewerUrlState>)) => void
] {
  const [state, setState] = useState<ViewerUrlState>(() => {
    if (typeof window !== "undefined") {
      return parseUrlParams(window.location.search);
    }
    return DEFAULT_VIEWER_STATE;
  });

  useEffect(() => {
    const handlePopState = () => {
      setState(parseUrlParams(window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const updateUrlState = useCallback(
    (updater: Partial<ViewerUrlState> | ((prev: ViewerUrlState) => Partial<ViewerUrlState>)) => {
      setState((prev) => {
        const nextPartial = typeof updater === "function" ? updater(prev) : updater;
        const nextState = { ...prev, ...nextPartial };

        if (typeof window !== "undefined") {
          const qs = serializeUrlState(nextState);
          const newUrl = qs ? `?${qs}` : window.location.pathname;
          window.history.replaceState(null, "", newUrl);
        }

        return nextState;
      });
    },
    []
  );

  return [state, updateUrlState];
}
