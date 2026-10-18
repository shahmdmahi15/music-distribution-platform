import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

interface WebAppManifest {
  id?: string;
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  scope?: string;
  display: string;
  display_override?: string[];
  background_color: string;
  theme_color: string;
  orientation?: string;
  icons: ManifestIcon[];
  categories?: string[];
  shortcuts?: Array<{
    name: string;
    url: string;
    icons?: ManifestIcon[];
  }>;
}

describe("PWA Manifest & Service Worker Quality Gate", () => {
  const wlManifestPath = path.resolve(
    __dirname,
    "../../../public/manifest.json",
  );
  const platformManifestPath = path.resolve(
    __dirname,
    "../../../../platform/public/manifest.json",
  );
  const swPath = path.resolve(__dirname, "../../../public/sw.js");

  describe("WhiteLabel Manifest Verification (whitelabel/public/manifest.json)", () => {
    it("manifest file exists and is valid JSON", () => {
      expect(fs.existsSync(wlManifestPath)).toBe(true);
      const raw = fs.readFileSync(wlManifestPath, "utf-8");
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it("verifies start_url and display standalone mode", () => {
      const manifest: WebAppManifest = JSON.parse(
        fs.readFileSync(wlManifestPath, "utf-8"),
      );
      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.theme_color).toMatch(/^#([0-9a-fA-F]{3,8})$/);
      expect(manifest.background_color).toMatch(/^#([0-9a-fA-F]{3,8})$/);
    });

    it("verifies manifest id or unique app identity", () => {
      const manifest: WebAppManifest = JSON.parse(
        fs.readFileSync(wlManifestPath, "utf-8"),
      );
      // Valid PWA manifest has an id property or falls back to start_url
      const id = manifest.id || manifest.start_url;
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
    });

    it("verifies display_override configuration", () => {
      const manifest: WebAppManifest = JSON.parse(
        fs.readFileSync(wlManifestPath, "utf-8"),
      );
      if (manifest.display_override) {
        expect(Array.isArray(manifest.display_override)).toBe(true);
        expect(manifest.display_override).toContain("window-controls-overlay");
      } else {
        expect(manifest.display).toBe("standalone");
      }
    });

    it("verifies icon coverage (192, 512, and maskable purpose)", () => {
      const manifest: WebAppManifest = JSON.parse(
        fs.readFileSync(wlManifestPath, "utf-8"),
      );
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);

      const has192 = manifest.icons.some(
        (icon) => icon.sizes === "192x192" || icon.sizes === "any",
      );
      const has512 = manifest.icons.some(
        (icon) => icon.sizes === "512x512" || icon.sizes === "any",
      );
      const hasMaskable = manifest.icons.some(
        (icon) => icon.purpose && icon.purpose.includes("maskable"),
      );

      expect(has192).toBe(true);
      expect(has512).toBe(true);
      expect(hasMaskable).toBe(true);
    });
  });

  describe("Platform Core Manifest Verification (platform/public/manifest.json)", () => {
    it("platform manifest exists and contains standard PWA attributes", () => {
      expect(fs.existsSync(platformManifestPath)).toBe(true);
      const raw = fs.readFileSync(platformManifestPath, "utf-8");
      const manifest: WebAppManifest = JSON.parse(raw);

      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.theme_color).toBe("#4f46e5");
      expect(manifest.background_color).toBe("#030712");

      // Verify platform icons array
      const has192 = manifest.icons.some(
        (icon) => icon.sizes === "192x192" || icon.sizes === "any",
      );
      const has512 = manifest.icons.some(
        (icon) => icon.sizes === "512x512" || icon.sizes === "any",
      );
      const hasMaskable = manifest.icons.some(
        (icon) => icon.purpose && icon.purpose.includes("maskable"),
      );

      expect(has192).toBe(true);
      expect(has512).toBe(true);
      expect(hasMaskable).toBe(true);
    });
  });

  describe("Service Worker Contract Verification (whitelabel/public/sw.js)", () => {
    it("sw.js exists and implements caching & offline strategies", () => {
      expect(fs.existsSync(swPath)).toBe(true);
      const swContent = fs.readFileSync(swPath, "utf-8");

      // Verify lifecycle listeners
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain("addEventListener('activate'");
      expect(swContent).toContain("addEventListener('fetch'");

      // Verify immediate activation
      expect(swContent).toContain("self.skipWaiting()");
      expect(swContent).toContain("self.clients.claim()");

      // Verify cache naming and offline HTML fallback
      expect(swContent).toContain("CACHE_NAME = 'rmit-whitelabel-pwa-v1'");
      expect(swContent).toContain("OFFLINE_HTML");
      expect(swContent).toContain("You are currently offline");
    });
  });
});