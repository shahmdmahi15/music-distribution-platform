/**
 * Theme Contrast & Relative Luminance Utility (WCAG 2.1 Standard)
 *
 * Implements official W3C WCAG 2.1 formulas for:
 * 1. Relative luminance: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * 2. Contrast ratio: (L1 + 0.05) / (L2 + 0.05)
 * 3. Dynamic WCAG AA/AAA compliant foreground selection (Emerald -> Black, Rose -> White, etc.)
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses 3-digit or 6-digit hex color strings into RGB channels (0-255).
 * Robust against leading #, uppercase/lowercase, and whitespace.
 */
export function parseHexColor(color: string): RGB {
  if (!color || typeof color !== "string") {
    return { r: 0, g: 0, b: 0 };
  }

  const cleanHex = color.replace(/^#/, "").trim();

  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b,
    };
  }

  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b,
    };
  }

  return { r: 0, g: 0, b: 0 };
}

/**
 * Computes linearized sRGB channel value according to WCAG 2.1 specification.
 */
export function linearizeColorChannel(channel8Bit: number): number {
  const c = Math.max(0, Math.min(255, channel8Bit)) / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.1 relative luminance for a given hex color.
 * Returns a value between 0.0 (pure black) and 1.0 (pure white).
 */
export function getRelativeLuminance(color: string): number {
  const { r, g, b } = parseHexColor(color);
  const R = linearizeColorChannel(r);
  const G = linearizeColorChannel(g);
  const B = linearizeColorChannel(b);
  const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return Math.round(lum * 100000) / 100000;
}

/**
 * Calculates the WCAG 2.1 contrast ratio between two colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is the lighter color.
 * Returns ratio rounded to 2 decimal places (e.g. 5.56, 4.70).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Determines whether two colors satisfy WCAG contrast compliance.
 * AA Normal: >= 4.5:1
 * AA Large:  >= 3.0:1
 * AAA Normal: >= 7.0:1
 * AAA Large:  >= 4.5:1
 */
export function isWCAGCompliant(
  foreground: string,
  background: string,
  options?: { level?: "AA" | "AAA"; isLargeText?: boolean }
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const level = options?.level || "AA";
  const isLarge = options?.isLargeText || false;

  if (level === "AAA") {
    return isLarge ? ratio >= 4.5 : ratio >= 7.0;
  }
  return isLarge ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Selects the optimal foreground color (#000000 or #ffffff) for a given background
 * to guarantee WCAG AA compliance (ratio >= 4.5:1) whenever possible.
 */
export function getWCAGForeground(
  backgroundHex: string,
  options?: {
    blackHex?: string;
    whiteHex?: string;
    minRatio?: number;
  }
): string {
  const black = options?.blackHex || "#000000";
  const white = options?.whiteHex || "#ffffff";
  const minRatio = options?.minRatio || 4.5;

  const ratioBlack = getContrastRatio(backgroundHex, black);
  const ratioWhite = getContrastRatio(backgroundHex, white);

  const blackPasses = ratioBlack >= minRatio;
  const whitePasses = ratioWhite >= minRatio;

  if (blackPasses && !whitePasses) return black;
  if (whitePasses && !blackPasses) return white;

  // If both pass or both fail, choose the one with the higher contrast ratio
  return ratioBlack >= ratioWhite ? black : white;
}

export const getWCAGContrastForeground = getWCAGForeground;

