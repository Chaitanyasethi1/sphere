/**
 * SPHEREx Sky Diary - Design Tokens & Visual Hierarchy.
 *
 * Implements cosmic dark space palette, semantic color tokens, WCAG AA contrast rules,
 * and background survey identifiers for Aladin Lite sky visualization.
 */

export const DESIGN_TOKENS = {
  colors: {
    // NASA Eyes 3D Universe Sophisticated Palette
    palette: {
      cosmicBlack: "#050816",
      deepIndigo: "#101B46",
      nebulaViolet: "#39216F",
      cosmicBlue: "#087EAC",
      ionCyan: "#27D9D0",
      solarAmber: "#F5A742",
    },
    // Cosmic Deep Space Canvas
    space: {
      950: "#050816", // Deepest cosmic black/navy (>15:1 contrast against white)
      900: "#101B46", // Deep indigo surface
      850: "#182457", // Elevated glass panel base
      800: "#223275", // Card active / hover border
      700: "#2d4294", // Subtle borders
      600: "#39216F", // Nebula violet accent
      400: "#087EAC", // Cosmic blue telemetry
      300: "#a9b9f3", // Light text
      200: "#cfd9fa", // Soft foreground
      50: "#f6f8ff",  // Crisp high-contrast white text
    },
    // Ion Cyan: Catalog-Matched Known Asteroids / Comets
    known: {
      primary: "#27D9D0",
      light: "#5ce5dc",
      hover: "#8af0e9",
      dark: "#0b4d49",
      glow: "rgba(39, 217, 208, 0.45)",
    },
    // Solar Amber: Unknown Movers & Planet X Candidates
    unknown: {
      primary: "#F5A742",
      light: "#f7ba68",
      hover: "#f9cd8e",
      dark: "#5e380b",
      glow: "rgba(245, 167, 66, 0.45)",
    },
    // Minimal Slate: Test Data & Synthetic Provenance (no neon / rose)
    synthetic: {
      primary: "#94a3b8", // Slate 400
      light: "#cbd5e1",   // Slate 300
      dark: "#1e293b",    // Slate 800
      glow: "rgba(148, 163, 184, 0.15)",
    },
    // NASA Eyes on the Solar System Authentic Palette
    nasaEyes: {
      gold: "#c59b6d",         // Signature warm golden bronze / desert sand
      goldLight: "#d4a373",    // Slightly lighter warm amber
      goldDark: "#946f48",     // Deeper bronze
      goldGlow: "rgba(197, 155, 109, 0.35)",
      panelBg: "rgba(10, 12, 18, 0.88)",
      cardBg: "rgba(16, 18, 24, 0.82)",
      cardHover: "rgba(24, 27, 36, 0.9)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
      cardBorderSelected: "#c59b6d",
      textPrimary: "#ffffff",
      textSecondary: "#c59b6d",
      textMuted: "#8e95a5",
    },
    // Distinct orbital colors for different bodies & trajectories (from NASA Eyes)
    orbits: {
      mars: "#d96b43",         // Rust terracotta
      jupiter: "#cca06a",      // Warm tan amber
      earth: "#68a8cf",        // Soft ice/electric cyan
      mercury: "#a278b5",      // Lavender lilac
      venus: "#e8d5a3",        // Champagne soft gold
      parker: "#cbd5e1",       // Silver titanium
      psyche: "#e09f5a",       // Warm ochre bronze
      biosentinel: "#4ecdc4",  // Mint teal
      stereo: "#5da5c5",       // Steel cyan
      voyager: "#d4a373",      // Warm gold sand
    },
  },

  // Orbital palette array for deterministic assigning across candidate movers
  orbitPalette: [
    "#d96b43", // Mars rust
    "#cca06a", // Jupiter warm amber
    "#68a8cf", // Earth pale cyan
    "#a278b5", // Mercury soft lavender
    "#e8d5a3", // Venus champagne
    "#cbd5e1", // Parker silver slate
    "#e09f5a", // Psyche warm bronze
    "#4ecdc4", // BioSentinel mint teal
    "#5da5c5", // STEREO steel cyan
    "#d4a373", // Voyager golden sand
    "#e0683b", // Solar coral
    "#9d7bb0", // Deep lilac
  ],

  // Aladin Lite Survey Defaults
  surveys: {
    // TODO(VERIFY): Best all-sky infrared survey for SPHEREx 0.75-5.0um cross-comparison.
    // Defaulting to allWISE mid-infrared color composite (W1/W2/W4).
    defaultSurveyId: "P/allWISE/color",
    fallbackSurveyId: "P/2MASS/color",
    opticalSurveyId: "P/DSS2/color",
  },

  // Field of View Presets (degrees)
  fov: {
    min: 0.02,
    max: 5.0,
    default: 0.2,
    presets: [0.1, 0.2, 0.5, 1.0],
    coverageLimitDeg: 0.25, // Maximum extent covered by precomputed SPHEREx test data
  },

  // Touch and Accessibility Standards
  a11y: {
    minTouchTargetPx: 44,
    focusRing: "focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none",
    maxBlinkHz: 3.0, // Strict photo-sensitivity cap: <= 3 flashes per second
    defaultBlinkHz: 1.5,
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;

/**
 * Deterministically assigns a distinct authentic NASA Eyes orbit color to a mover.
 */
export function getOrbitColor(identifier: string | number, index?: number): string {
  const palette = DESIGN_TOKENS.orbitPalette;
  if (typeof index === "number" && index >= 0) {
    return palette[index % palette.length];
  }
  if (typeof identifier === "number") {
    return palette[Math.abs(identifier) % palette.length];
  }
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}


