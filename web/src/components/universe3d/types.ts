import type { MoverCandidate, EpochInfo } from "@/types";

export interface UniverseLayers {
  stars: boolean;
  nebula: boolean;
  grid: boolean;
  trajectories: boolean;
  labels: boolean;
  footprint: boolean;
}

export interface Universe3DProps {
  movers: MoverCandidate[];
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
  epochIndex: number;
  epochs: EpochInfo[];
  centerRa?: number;
  centerDec?: number;
  showTrails?: boolean;
  isDemo?: boolean;
  onSwitchTo2D?: () => void;
}
