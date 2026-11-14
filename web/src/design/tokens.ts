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
  },

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

