/**
 * SPHEREx Sky Diary - Target Name Resolver (Offline Dictionary & CDS Sesame).
 */

import { CHALLENGE_TARGETS } from "@/data/targets";

export interface ResolveOptions {
  isDemo?: boolean;
  timeoutMs?: number;
}

export interface ResolvedTarget {
  name: string;
  ra: number;
  dec: number;
  source: string;
  fov?: number;
}

/**
 * Resolves an astronomical object name to J2000 celestial coordinates.
 * First queries the local offline challenge dictionary, and falls back to CDS Sesame API.
 */
export async function resolveObjectName(
  name: string,
  options: ResolveOptions = {}
): Promise<ResolvedTarget> {
  const query = name.trim().toLowerCase();

  // 1. Check offline dictionary first (guaranteed zero-network response)
  const offlineMatch = CHALLENGE_TARGETS.find((target) => {
    if (target.name.toLowerCase() === query) return true;
    return target.aliases.some((alias) => alias.toLowerCase() === query);
  });

  if (offlineMatch) {
    return {
      name: offlineMatch.name,
      ra: offlineMatch.ra,
      dec: offlineMatch.dec,
      source: "Offline Challenge Targets",
      fov: offlineMatch.fovDefault,
    };
  }

  // If in demo mode or offline, do not attempt network requests
  if (options.isDemo || (typeof navigator !== "undefined" && !navigator.onLine)) {
    throw new Error(`Target "${name}" not found in offline dictionary. (Demo/Offline mode active)`);
  }

  // 2. Query CDS Sesame Name Resolver
  const timeoutMs = options.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNVA?${encodeURIComponent(name)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CDS Sesame service returned HTTP ${response.status}`);
    }

    const text = await response.text();

    // Parse <jradeg> and <jdedeg> tags from XML
    const raMatch = text.match(/<jradeg>([\d.]+)<\/jradeg>/);
    const decMatch = text.match(/<jdedeg>([+-]?[\d.]+)<\/jdedeg>/);

    if (raMatch && decMatch) {
      const ra = parseFloat(raMatch[1]);
      const dec = parseFloat(decMatch[1]);
      return {
        name,
        ra,
        dec,
        source: "CDS Sesame Service",
      };
    }

    throw new Error(`No celestial coordinates found for target "${name}" in CDS databases.`);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Target resolution timed out for "${name}".`);
    }
    throw err;
  }
}
