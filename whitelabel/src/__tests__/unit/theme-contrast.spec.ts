import { describe, it, expect } from "vitest";
import {
  parseHexColor,
  getRelativeLuminance,
  getContrastRatio,
  getWCAGForeground,
  isWCAGCompliant,
} from "@/lib/theme-contrast";

describe("Theme Contrast & WCAG 2.1 Theming Suite", () => {
  describe("Hex Parsing", () => {
    it("correctly parses 6-digit hex colors with or without #", () => {
      expect(parseHexColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexColor("000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexColor("#6366f1")).toEqual({ r: 99, g: 102, b: 241 });
      expect(parseHexColor("#059669")).toEqual({ r: 5, g: 150, b: 105 });
      expect(parseHexColor("#e11d48")).toEqual({ r: 225, g: 29, b: 72 });
    });

    it("correctly expands 3-digit hex shorthand", () => {
      expect(parseHexColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexColor("#000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexColor("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("falls back gracefully on invalid inputs", () => {
      expect(parseHexColor("invalid")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexColor("")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexColor(null as any)).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe("Relative Luminance Calculation", () => {
    it("computes exact relative luminance for pure white (#ffffff = 1.0)", () => {
      expect(getRelativeLuminance("#ffffff")).toBe(1.0);
      expect(getRelativeLuminance("#fff")).toBe(1.0);
    });

    it("computes exact relative luminance for pure black (#000000 = 0.0)", () => {
      expect(getRelativeLuminance("#000000")).toBe(0.0);
      expect(getRelativeLuminance("#000")).toBe(0.0);
    });

    it("computes relative luminance for Indigo (#6366f1)", () => {
      const lum = getRelativeLuminance("#6366f1");
      expect(lum).toBeGreaterThan(0.18);
      expect(lum).toBeLessThan(0.19);
      expect(lum).toBeCloseTo(0.185, 2);
    });

    it("computes relative luminance for Rose (#e11d48)", () => {
      const lum = getRelativeLuminance("#e11d48");
      expect(lum).toBeGreaterThan(0.17);
      expect(lum).toBeLessThan(0.18);
      expect(lum).toBeCloseTo(0.173, 2);
    });

    it("computes relative luminance for Emerald (#059669)", () => {
      const lum = getRelativeLuminance("#059669");
      expect(lum).toBeGreaterThan(0.22);
      expect(lum).toBeLessThan(0.23);
      expect(lum).toBeCloseTo(0.228, 2);
    });
  });

  describe("WCAG AA Contrast Foreground Selection", () => {
    it("verifies Emerald (#059669) selects Black (#000000) with ratio 5.56:1 > 4.5:1", () => {
      const contrastBlack = getContrastRatio("#059669", "#000000");
      const contrastWhite = getContrastRatio("#059669", "#ffffff");

      expect(contrastBlack).toBeCloseTo(5.56, 1);
      expect(contrastBlack).toBeGreaterThanOrEqual(4.5);
      expect(contrastWhite).toBe(3.77);
      expect(contrastWhite).toBeLessThan(4.5);

      const fg = getWCAGForeground("#059669");
      expect(fg).toBe("#000000");
    });

    it("verifies Rose (#e11d48) selects White (#ffffff) with ratio 4.70:1 > 4.5:1", () => {
      const contrastWhite = getContrastRatio("#e11d48", "#ffffff");
      const contrastBlack = getContrastRatio("#e11d48", "#000000");

      expect(contrastWhite).toBe(4.7);
      expect(contrastWhite).toBeGreaterThanOrEqual(4.5);
      expect(contrastBlack).toBe(4.47);
      expect(contrastBlack).toBeLessThan(4.5);

      const fg = getWCAGForeground("#e11d48");
      expect(fg).toBe("#ffffff");
    });

    it("verifies Indigo (#6366f1) contrast handling", () => {
      const contrastBlack = getContrastRatio("#6366f1", "#000000");
      const contrastWhite = getContrastRatio("#6366f1", "#ffffff");

      expect(contrastBlack).toBe(4.7);
      expect(contrastBlack).toBeGreaterThanOrEqual(4.5);
      expect(contrastWhite).toBe(4.47);

      const fg = getWCAGForeground("#6366f1");
      expect(fg).toBe("#000000");
    });

    it("correctly evaluates WCAG AA compliance flag", () => {
      expect(isWCAGCompliant("#000000", "#059669")).toBe(true);
      expect(isWCAGCompliant("#ffffff", "#059669")).toBe(false);
      expect(isWCAGCompliant("#ffffff", "#e11d48")).toBe(true);
      expect(isWCAGCompliant("#000000", "#e11d48")).toBe(false);
    });
  });

  describe("Dark Mode Text Contrast Ratios", () => {
    const darkBgZinc = "#09090b"; // Standard zinc-950 dark background
    const darkBgSlate = "#0f172a"; // Standard slate-900 dark background

    it("verifies dark mode pure white text (#ffffff) exceeds WCAG AAA (7.0:1) on zinc-950", () => {
      const ratio = getContrastRatio("#ffffff", darkBgZinc);
      expect(ratio).toBeGreaterThan(18.0);
      expect(isWCAGCompliant("#ffffff", darkBgZinc, { level: "AAA" })).toBe(true);
    });

    it("verifies dark mode high-contrast foreground text (#fafafa) exceeds WCAG AAA (7.0:1) on zinc-950", () => {
      const ratio = getContrastRatio("#fafafa", darkBgZinc);
      expect(ratio).toBeGreaterThan(18.0);
      expect(isWCAGCompliant("#fafafa", darkBgZinc, { level: "AAA" })).toBe(true);
    });

    it("verifies dark mode muted text (#a1a1aa) satisfies WCAG AA (>= 4.5:1) and AAA on zinc-950", () => {
      const ratio = getContrastRatio("#a1a1aa", darkBgZinc);
      expect(ratio).toBeGreaterThanOrEqual(7.0);
      expect(isWCAGCompliant("#a1a1aa", darkBgZinc, { level: "AA" })).toBe(true);
    });

    it("verifies dark mode text on slate-900 background", () => {
      const textRatio = getContrastRatio("#f8fafc", darkBgSlate);
      expect(textRatio).toBeGreaterThan(15.0);
      expect(isWCAGCompliant("#f8fafc", darkBgSlate, { level: "AAA" })).toBe(true);

      const mutedRatio = getContrastRatio("#94a3b8", darkBgSlate);
      expect(mutedRatio).toBeGreaterThanOrEqual(4.5);
      expect(isWCAGCompliant("#94a3b8", darkBgSlate, { level: "AA" })).toBe(true);
    });
  });
});
