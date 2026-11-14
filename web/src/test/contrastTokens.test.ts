import { describe, it, expect } from "vitest";
import { DESIGN_TOKENS } from "@/design/tokens";

/**
 * Computes the relative luminance of an sRGB hex color according to W3C WCAG 2.1 specifications.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "").trim();
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG AA Contrast Ratios for NASA Eyes Tokens", () => {
  const bgVoid = DESIGN_TOKENS.colors.background; // #010206
  const bgPanel = DESIGN_TOKENS.colors.panelSolid; // #141416

  it("verifies primary white text meets WCAG AAA (> 7:1) on void black", () => {
    const ratio = getContrastRatio(DESIGN_TOKENS.colors.textPrimary, bgVoid);
    expect(ratio).toBeGreaterThanOrEqual(15.0); // Extreme high contrast > 18:1
  });

  it("verifies secondary text (#B8BCC4) meets WCAG AA body requirement (>= 4.5:1) on void and panels", () => {
    const ratioOnVoid = getContrastRatio(DESIGN_TOKENS.colors.textSecondary, bgVoid);
    const ratioOnPanel = getContrastRatio(DESIGN_TOKENS.colors.textSecondary, bgPanel);

    expect(ratioOnVoid).toBeGreaterThanOrEqual(4.5);
    expect(ratioOnPanel).toBeGreaterThanOrEqual(4.5);
  });

  it("verifies warm gold caption accent (#E0A526) meets WCAG AA (>= 4.5:1) on near-pure black space", () => {
    const ratio = getContrastRatio(DESIGN_TOKENS.colors.accent.unknown, bgVoid);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    // In fact #E0A526 on #010206 has contrast ~9.6:1
    expect(ratio).toBeGreaterThan(8.0);
  });

  it("verifies cyan known accent (#22D3EE) meets WCAG AA (>= 4.5:1) on void", () => {
    const ratio = getContrastRatio(DESIGN_TOKENS.colors.accent.known, bgVoid);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(10.0);
  });

  it("verifies synthetic test data badge slate color meets WCAG AA large/graphics requirement (>= 3.0:1)", () => {
    const ratio = getContrastRatio(DESIGN_TOKENS.colors.accent.synthetic, bgVoid);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

