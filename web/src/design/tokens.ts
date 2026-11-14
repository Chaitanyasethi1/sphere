/**
 * SPHEREx Sky Diary - Design Tokens & Visual Hierarchy
 *
 * Modeled on NASA's "Eyes on the Solar System" visual language:
 * - Cinematic near-pure black space canvas (#010206)
 * - Semi-transparent dark grey panels (rgba(20, 20, 22, 0.72)) with 1px hairlines
 * - Minimal square corners (radius 2-4px), reserving round pills exclusively for status and scrubber handles
 * - Clean light-weight typography (Barlow 300) with wide-tracked uppercase labels (0.2-0.26em)
 * - Warm gold/amber (#E0A526) for captions & unknown candidates, cyan (#22D3EE) for known bodies & highlights
 * - High-contrast WCAG AA compliant text pairs (> 4.5:1 body, > 3:1 large text)
 */

export const DESIGN_TOKENS = {
  // 1. Color Palette
  colors: {
    // Canvas & void
    background: "#010206",      // Near-pure astronomical black void (#000 to #02040A)
    backgroundAlt: "#080a10",   // Subtle elevated void

    // Translucent NASA Eyes panels & surfaces
    panel: "rgba(20, 20, 22, 0.72)",          // Reference dark translucent grey
    panelSolid: "#141416",
    panelBorder: "rgba(255, 255, 255, 0.12)",  // 1px hairline border
    panelBorderSubtle: "rgba(255, 255, 255, 0.06)",
    panelBackdropBlur: "16px",

    // Card containers (nearly square, subtle left-to-right gradient)
    card: "rgba(26, 28, 34, 0.72)",
    cardHover: "rgba(38, 42, 50, 0.85)",
    cardSelected: "rgba(255, 255, 255, 0.14)", // Reference selected lighter grey
    cardSelectedBorderCyan: "#22D3EE",
    cardSelectedBorderGold: "#E0A526",

    // Editorial text colors
    textPrimary: "#FFFFFF",
    textSecondary: "#B8BCC4",   // High-contrast secondary grey (WCAG AA > 10.5:1 on black)
    textMuted: "#7E8492",       // Hairline annotations & labels

    // Semantic Accents (WCAG AA verified against black)
    accent: {
      unknown: "#E0A526",       // Warm gold/amber for captions & UNKNOWN candidates (contrast 9.6:1)
      unknownHover: "#F5B83D",
      unknownBg: "rgba(224, 165, 38, 0.12)",
      known: "#22D3EE",         // Cyan/teal for KNOWN catalog matches & orbit highlight (contrast 12.2:1)
      knownHover: "#38BDF8",
      knownBg: "rgba(34, 211, 238, 0.12)",
      synthetic: "#94A3B8",     // Slate 400 for synthetic test data honesty indicator
      syntheticDark: "#1E293B",
      syntheticBg: "rgba(148, 163, 184, 0.14)",
      goldCaption: "#E0A526",   // Warm gold accent caption
    },

    // Reference Planetary and Spacecraft Orbit Hairlines (1px thin lines)
    orbits: {
      mercury: "#A278B5",       // Lavender
      venus: "#E8D5A3",         // Champagne soft gold
      earth: "#22D3EE",         // Cyan electric
      mars: "#D96B43",          // Rust terracotta
      ceres: "#E0A526",         // Asteroid belt gold
      jupiter: "#CCA06A",       // Warm tan
      voyager: "#D4A373",       // Gold sand
      clipper: "#68A8CF",       // Pale sky
      roman: "#A278B5",         // Lavender
      parker: "#CBD5E1",        // Silver titanium
    },
  },

  // Deterministic orbital palette for candidates
  orbitPalette: [
    "#E0A526", // Gold
    "#22D3EE", // Cyan
    "#D96B43", // Mars rust
    "#A278B5", // Lavender
    "#CCA06A", // Jupiter tan
    "#E8D5A3", // Venus champagne
    "#CBD5E1", // Titanium silver
    "#68A8CF", // Ice cyan
    "#D4A373", // Golden sand
    "#4ECDC4", // Mint
  ],

  // 2. Typography Specification
  typography: {
    // Font families
    fontFamily: {
      // Primary: Barlow 300 (fallback: Inter, system-ui)
      // TODO(VERIFY): Exact NASA font used in Eyes on the Solar System (Barlow vs NASA proprietary face)
      sans: "'Barlow', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', Consolas, monospace",
    },

    // Standard Type Scale
    scale: {
      display: {
        fontSize: "32px",
        fontWeight: 300,
        lineHeight: "1.05",
        letterSpacing: "-0.01em",
      },
      title: {
        fontSize: "26px",
        fontWeight: 300,
        lineHeight: "1.1",
        letterSpacing: "0",
      },
      cardTitle: {
        fontSize: "22px",
        fontWeight: 300,
        lineHeight: "1.12",
        letterSpacing: "0",
      },
      cardTitleLarge: {
        fontSize: "28px",
        fontWeight: 300,
        lineHeight: "1.08",
        letterSpacing: "0",
      },
      label: {
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: "1.2",
        letterSpacing: "0.22em",
        textTransform: "uppercase" as const,
      },
      caption: {
        fontSize: "11px",
        fontWeight: 500,
        lineHeight: "1.2",
        letterSpacing: "0.24em",
        textTransform: "uppercase" as const,
      },
      mono: {
        fontSize: "11px",
        fontWeight: 400,
        lineHeight: "1.3",
        letterSpacing: "0.04em",
      },
    },
  },

  // 3. Geometry & Corner Radii
  // Per spec: panels and cards nearly square (radius 2-4px).
  // Full roundness reserved ONLY for LIVE status pill and time handle.
  radii: {
    square: "3px",              // Panels, cards, buttons, dialogs
    card: "3px",
    input: "3px",
    badge: "2px",
    pill: "9999px",             // Reserved ONLY for status indicator and scrubber handle
  },

  // 4. Hairline Borders & Shadows
  borders: {
    hairline: "1px solid rgba(255, 255, 255, 0.12)",
    hairlineSubtle: "1px solid rgba(255, 255, 255, 0.06)",
    hairlineActive: "1px solid rgba(34, 211, 238, 0.6)",
    hairlineGold: "1px solid rgba(224, 165, 38, 0.6)",
  },

  // 5. Right-Hand Control Rail
  rail: {
    buttonSize: 42,             // 42px square icon buttons
    touchTargetMin: 44,         // WCAG 44px min touch target
    iconStrokeWidth: 1.5,       // Thin-stroke 1.5px icons
    defaultOpacity: 0.85,
    hoverOpacity: 1.0,
    activeColor: "#22D3EE",
  },

  // 6. Bottom Time Bar
  timeBar: {
    height: 48,
    scrubberHandleSize: 36,     // 36px dual-ring handle
    trackHeight: 2,
    activeColor: "#22D3EE",
  },

  // 7. Motion & Transitions (Respects prefers-reduced-motion)
  motion: {
    duration: "250ms",
    easing: "cubic-bezier(0.16, 1, 0.3, 1)", // Smooth easeOutCubic
  },

  // 8. Accessibility Standards
  a11y: {
    minTouchTargetPx: 44,
    focusRing: "focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:outline-none",
    maxBlinkHz: 3.0,
    defaultBlinkHz: 1.5,
  },

  // 9. Field of View Presets
  fov: {
    min: 0.02,
    max: 5.0,
    default: 0.2,
    coverageLimitDeg: 2.0,
    presets: [0.05, 0.2, 1.0, 3.5] as readonly number[],
  },

  // 10. Surveys
  surveys: {
    defaultSurveyId: "P/allWISE/color",
    opticalFallbackId: "P/DSS2/color",
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
