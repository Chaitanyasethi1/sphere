/**
 * SPHEREx Sky Diary - Client Catalog Loader & Utilities.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { CandidateCatalog } from "@/types";

export interface UseCandidateCatalogResult {
  data: CandidateCatalog | null;
  loading: boolean;
  error: string | null;
  isSynthetic: boolean;
  reload: () => Promise<void>;
}

export function useCandidateCatalog(url: string = "/data/candidates.json"): UseCandidateCatalogResult {
  const [data, setData] = useState<CandidateCatalog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load catalog: ${response.status} ${response.statusText}`);
      }
      const json: CandidateCatalog = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error loading candidate catalog.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isSynthetic = data?.movers?.some((m) => m.is_synthetic) ?? true;

  return {
    data,
    loading,
    error,
    isSynthetic,
    reload: loadData,
  };
}

/**
 * Formats coordinates into standard RA/Dec representation for display.
 */
export function formatCoordinates(ra: number, dec: number): string {
  const decSign = dec >= 0 ? `+${dec.toFixed(4)}` : dec.toFixed(4);
  return `RA ${ra.toFixed(4)}°, Dec ${decSign}°`;
}
