import type { Config } from "tailwindcss";
import { DESIGN_TOKENS } from "./src/design/tokens";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NASA Eyes Authentic Minimalist Void & Surfaces
        eyes: {
          void: "#010206",
          panel: "rgba(20, 20, 22, 0.72)",
          card: "rgba(26, 28, 34, 0.72)",
          "card-hover": "rgba(38, 42, 50, 0.85)",
          "card-selected": "rgba(255, 255, 255, 0.14)",
          gold: "#E0A526",
          "gold-hover": "#F5B83D",
          cyan: "#22D3EE",
          secondary: "#B8BCC4",
          muted: "#7E8492",
          hairline: "rgba(255, 255, 255, 0.12)",
          "hairline-subtle": "rgba(255, 255, 255, 0.06)",
        },
        // Mapped Space & Semantic Palettes
        space: {
          950: "#010206", // Near-pure void black
          900: "#101217", // Primary HUD panel base
          850: "#141720",
          800: "#1a1e28",
          700: "#242a38",
          600: "#323b4e",
          500: "#22D3EE", // Electric cyan
          400: "#7E8492", // Muted telemetry labels
          300: "#B8BCC4", // Secondary text (WCAG AA > 10.5:1)
          200: "#E2E8F0",
          100: "#F1F5F9",
          50: "#FFFFFF",  // Crisp high-contrast titles
        },
        cyan: {
          300: "#67E8F9",
          400: "#22D3EE", // Ion cyan / known bodies
          500: "#06B6D4",
          600: "#0891B2",
          900: "#164E63",
          950: "#082F49",
        },
        amber: {
          300: "#FCD34D",
          400: "#E0A526", // Solar amber / warm gold unknown candidates
          500: "#F59E0B",
          600: "#D97706",
          900: "#78350F",
          950: "#451A03",
        },
        nasa: {
          gold: "#E0A526",
          "gold-light": "#F5B83D",
          "gold-dark": "#B47C11",
          panel: "rgba(20, 20, 22, 0.72)",
          card: "rgba(26, 28, 34, 0.72)",
          "card-hover": "rgba(38, 42, 50, 0.85)",
          border: "rgba(255, 255, 255, 0.12)",
        },
        orbit: {
          mars: "#D96B43",
          jupiter: "#CCA06A",
          earth: "#22D3EE",
          mercury: "#A278B5",
          venus: "#E8D5A3",
          parker: "#CBD5E1",
          psyche: "#E09F5A",
          biosentinel: "#4ECDC4",
          stereo: "#5DA5C5",
          voyager: "#D4A373",
        },
      },
      borderRadius: {
        eyes: "3px", // Spec: panels and cards nearly square (radius 2-4px)
        card: "3px",
        btn: "3px",
      },
      fontFamily: {
        sans: [
          "var(--font-barlow)",
          "Barlow",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "'JetBrains Mono'",
          "'IBM Plex Mono'",
          "ui-monospace",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        "eyes-wide": "0.22em",
        "eyes-wider": "0.26em",
        "eyes-widest": "0.3em",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
