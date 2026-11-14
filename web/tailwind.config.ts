import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // NASA Eyes 3D Universe Sophisticated Palette
        cosmic: {
          black: "#050816",
          indigo: "#101B46",
          violet: "#39216F",
          blue: "#087EAC",
          cyan: "#27D9D0",
          amber: "#F5A742",
        },
        space: {
          950: "#050816", // Deepest astronomical void black
          900: "#101B46", // Primary HUD panel background / deep indigo
          850: "#15204e", // Glass panel surface
          800: "#1d2b63", // Active borders / elevated cards
          700: "#27387a", // Subtle borders
          600: "#39216F", // Accent lines / nebula violet
          500: "#087EAC", // Cosmic blue
          400: "#7084cc", // Muted telemetry labels
          300: "#9fb0eb", // Secondary text
          200: "#cad5fa", // Primary body text
          100: "#e8eeff",
          50: "#f8fafc",  // Crisp high-contrast titles
        },
        cyan: {
          300: "#67e8f9",
          400: "#27D9D0", // Ion cyan
          500: "#06b6d4",
          600: "#0891b2",
          900: "#164e63",
          950: "#082f49",
        },
        amber: {
          300: "#fcd34d",
          400: "#F5A742", // Solar amber
          500: "#f59e0b",
          600: "#d97706",
          900: "#78350f",
          950: "#451a03",
        },
        nasa: {
          gold: "#c59b6d",         // Signature warm golden bronze / desert sand from NASA Eyes
          "gold-light": "#d4a373",
          "gold-dark": "#946f48",
          panel: "rgba(10, 12, 18, 0.88)",
          card: "rgba(16, 18, 24, 0.82)",
          "card-hover": "rgba(24, 27, 36, 0.9)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        orbit: {
          mars: "#d96b43",
          jupiter: "#cca06a",
          earth: "#68a8cf",
          mercury: "#a278b5",
          venus: "#e8d5a3",
          parker: "#cbd5e1",
          psyche: "#e09f5a",
          biosentinel: "#4ecdc4",
          stereo: "#5da5c5",
          voyager: "#d4a373",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'SF Pro Display'",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "'SF Mono'",
          "'JetBrains Mono'",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace",
        ],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      boxShadow: {
        glass: "0 16px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "glow-cyan": "0 0 25px -4px rgba(56, 189, 248, 0.35)",
        "glow-amber": "0 0 25px -4px rgba(251, 191, 36, 0.35)",
        hud: "0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
