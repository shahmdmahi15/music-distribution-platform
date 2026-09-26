"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Palette,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Eye,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { WhiteLabelTheme, WhiteLabelBranding } from "@/types/whitelabel";
import { clientUpdateThemeAction } from "@/actions/client/whitelabel/client-theme.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import { cn } from "@/lib/utils";

interface ClientThemeViewProps {
  initialTheme: WhiteLabelTheme;
  branding: WhiteLabelBranding;
}

const PRESET_PALETTES = [
  { name: "Royal Indigo", primary: "#6366f1", accent: "#ec4899" },
  { name: "Cyber Emerald", primary: "#10b981", accent: "#06b6d4" },
  { name: "Electric Violet", primary: "#8b5cf6", accent: "#f43f5e" },
  { name: "Sunset Crimson", primary: "#f43f5e", accent: "#f59e0b" },
  { name: "Ocean Breeze", primary: "#0ea5e9", accent: "#3b82f6" },
  { name: "Golden Amber", primary: "#f59e0b", accent: "#ef4444" },
];

export const FONT_OPTIONS = [
  { id: "Inter", label: "Inter (Modern Tech & Neutral)", category: "Sans-Serif" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans (High-End SaaS & Clean)", category: "Sans-Serif" },
  { id: "Outfit", label: "Outfit (Creative, Modern & Sleek)", category: "Sans-Serif" },
  { id: "Poppins", label: "Poppins (Geometric, Bold & Friendly)", category: "Sans-Serif" },
  { id: "DM Sans", label: "DM Sans (Minimalist & Geometric)", category: "Sans-Serif" },
  { id: "Manrope", label: "Manrope (Semi-Geometric Precision)", category: "Sans-Serif" },
  { id: "Lexend", label: "Lexend (Ultra-Legible & Streamlined)", category: "Sans-Serif" },
  { id: "Montserrat", label: "Montserrat (Urban, Heavy & Commercial)", category: "Sans-Serif" },
  { id: "Urbanist", label: "Urbanist (Contemporary Digital & Hip-Hop)", category: "Sans-Serif" },
  { id: "Space Grotesk", label: "Space Grotesk (Cutting-Edge & Future)", category: "Display" },
  { id: "Sora", label: "Sora (Futuristic Electronic & Crisp)", category: "Sans-Serif" },
  { id: "Raleway", label: "Raleway (Elegant, Artistic & Expressive)", category: "Sans-Serif" },
  { id: "Syne", label: "Syne (Avant-Garde & High Fashion)", category: "Display" },
  { id: "Oswald", label: "Oswald (Condensed & High Stature)", category: "Display" },
  { id: "Bebas Neue", label: "Bebas Neue (Punchy & Headline Impact)", category: "Display" },
  { id: "Epilogue", label: "Epilogue (Expressive Contemporary Editorial)", category: "Sans-Serif" },
  { id: "Playfair Display", label: "Playfair Display (Luxury & Classical Serif)", category: "Serif" },
  { id: "Cinzel", label: "Cinzel (Regal & Cinematic Trajan)", category: "Serif" },
  { id: "Roboto", label: "Roboto (Neutral & Crisp Standard)", category: "Sans-Serif" },
];

export function ClientThemeView({
  initialTheme,
  branding,
}: ClientThemeViewProps) {
  const [theme, setTheme] = useState<WhiteLabelTheme>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">(
    initialTheme.mode === "light" ? "light" : "dark",
  );

  // Dynamically inject Google Fonts for real-time live preview
  useEffect(() => {
    const MASTER_LINK_ID = "whitelabel-theme-google-fonts";
    if (typeof document !== "undefined" && !document.getElementById(MASTER_LINK_ID)) {
      const link = document.createElement("link");
      link.id = MASTER_LINK_ID;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?" +
        [
          "Bebas+Neue",
          "Cinzel:wght@400;600;700",
          "DM+Sans:wght@400;500;600;700",
          "Epilogue:wght@400;600;700",
          "Inter:wght@400;500;600;700",
          "Lexend:wght@400;500;600;700",
          "Manrope:wght@400;500;600;700",
          "Montserrat:wght@400;500;600;700",
          "Oswald:wght@400;500;600;700",
          "Outfit:wght@400;500;600;700",
          "Playfair+Display:wght@400;600;700",
          "Plus+Jakarta+Sans:wght@400;500;600;700;800",
          "Poppins:wght@400;500;600;700",
          "Raleway:wght@400;500;600;700",
          "Roboto:wght@400;500;700",
          "Sora:wght@400;500;600;700",
          "Space+Grotesk:wght@400;500;600;700",
          "Syne:wght@500;600;700;800",
          "Urbanist:wght@400;500;600;700",
        ]
          .map((f) => `family=${f}`)
          .join("&") +
        "&display=swap";
      document.head.appendChild(link);
    }

    if (typeof document !== "undefined" && theme.fontFamily) {
      const activeFontId = `google-font-active-${theme.fontFamily.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
      if (!document.getElementById(activeFontId)) {
        const link = document.createElement("link");
        link.id = activeFontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [theme.fontFamily]);

  const activeLogoUrl =
    previewMode === "dark"
      ? branding.logoDarkUrl || branding.logoUrl
      : branding.logoUrl || branding.logoDarkUrl;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await clientUpdateThemeAction(theme);
      if (res.success) {
        toast.success(res.message);
        if (res.theme) setTheme(res.theme);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save theme settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(initialTheme);
    toast.info("Theme settings reset to last saved state.");
  };

  const radiusNumber = parseFloat(theme.radius) || 0.5;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Top Actions & Notification Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Theme Customizer &amp; Styling</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize your brand color palettes, typography, UI radius, and
            light/dark modes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={saving}
            className="text-xs gap-1.5 h-9"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Palette Presets Card */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Color Themes & Palettes
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium uppercase tracking-wider"
                >
                  Presets
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Pick a harmonious curated color palette or enter custom hex
                codes for your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_PALETTES.map((preset) => {
                  const isSelected =
                    theme.primaryColor.toLowerCase() ===
                      preset.primary.toLowerCase() &&
                    theme.accentColor.toLowerCase() ===
                      preset.accent.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() =>
                        setTheme((prev) => ({
                          ...prev,
                          primaryColor: preset.primary,
                          accentColor: preset.accent,
                        }))
                      }
                      className={`flex flex-col p-2.5 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div
                          className="h-4 w-4 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="h-4 w-4 rounded-full shadow-inner ring-1 ring-black/10"
                          style={{ backgroundColor: preset.accent }}
                        />
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Primary Brand Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="text-xs font-mono uppercase"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Accent / Highlight Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                    <Input
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="text-xs font-mono uppercase"
                      placeholder="#ec4899"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Border Radius & Geometry */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Border Radius & Geometry
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Control the curvature of cards, inputs, buttons, and modal
                dialogs across your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Curvature Scale</span>
                <span className="font-mono text-primary font-bold">
                  {theme.radius}
                </span>
              </div>
              <Slider
                value={[radiusNumber * 16]}
                min={0}
                max={20}
                step={2}
                onValueChange={(vals: number | readonly number[]) => {
                  const val = Array.isArray(vals)
                    ? vals[0]
                    : typeof vals === "number"
                      ? vals
                      : 8;
                  const rem = (val / 16).toFixed(2);
                  setTheme((prev) => ({ ...prev, radius: `${rem}rem` }));
                }}
              />

              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0rem (Sharp)</span>
                <span>0.5rem (Subtle)</span>
                <span>0.75rem (Smooth)</span>
                <span>1.25rem (Curved)</span>
              </div>
            </CardContent>
          </Card>

          {/* Typography & Surface Style */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Typography & Surface
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select your portal&apos;s typographic voice and visual backdrop
                elevation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Font Family</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        setTheme((prev) => ({ ...prev, fontFamily: f.id }))
                      }
                      style={{ fontFamily: `"${f.id}", sans-serif` }}
                      className={`px-3 py-2.5 rounded-lg border text-left text-xs transition-all ${
                        theme.fontFamily === f.id
                          ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/20"
                          : "border-border hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Default Mode</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "light", label: "Light", icon: Sun },
                      { id: "system", label: "System", icon: Laptop },
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSel = theme.mode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setTheme((prev) => ({
                              ...prev,
                              mode: m.id as "light" | "dark" | "system",
                            }));
                            if (m.id === "light" || m.id === "dark") {
                              setPreviewMode(m.id);
                            }
                          }}
                          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs transition-all ${
                            isSel
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Card Finish</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: "modern", label: "Modern" },
                      { id: "glass", label: "Glass" },
                      { id: "flat", label: "Flat" },
                      { id: "bordered", label: "Bordered" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setTheme((prev) => ({
                            ...prev,
                            cardStyle: c.id as
                              "modern" | "glass" | "flat" | "bordered",
                          }))
                        }
                        className={`py-2 rounded-lg border text-xs text-center transition-all ${
                          theme.cardStyle === c.id
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-border/60">
                  <Label className="text-xs font-medium">
                    Navigation Bar Style
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "glass", label: "Glassmorphism" },
                      { id: "solid", label: "Solid Color" },
                      { id: "floating", label: "Floating Nav" },
                    ].map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() =>
                          setTheme((prev) => ({
                            ...prev,
                            navbarStyle: n.id as "solid" | "glass" | "floating",
                          }))
                        }
                        className={`py-2 rounded-lg border text-xs text-center transition-all ${
                          theme.navbarStyle === n.id
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <Card className="border-border/80 shadow-lg overflow-hidden bg-card/90 backdrop-blur-xl">
              <CardHeader className="pb-3 border-b border-border/60 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">
                      Live Portal Mockup
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 bg-background p-0.5 rounded-lg border border-border/60 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("light")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all",
                        previewMode === "light"
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Preview in Light Theme"
                    >
                      <Sun className="h-2.5 w-2.5" />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("dark")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all",
                        previewMode === "dark"
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Preview in Dark Theme"
                    >
                      <Moon className="h-2.5 w-2.5" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  Real-time preview of your brand logos, colors, and curvature
                  in{" "}
                  <strong className="text-foreground capitalize">
                    {previewMode} Mode
                  </strong>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Mock Portal Container with Browser Chrome */}
                <div
                  className="rounded-xl border shadow-sm transition-all duration-200 overflow-hidden whitelabel-theme-preview-root"
                  style={{
                    backgroundColor:
                      previewMode === "light" ? "#ffffff" : "#090d16",
                    borderColor: `${theme.primaryColor}33`,
                    borderRadius: theme.radius,
                    fontFamily: `"${theme.fontFamily || "Inter"}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
                  }}
                >
                  <style>{`
                    .whitelabel-theme-preview-root,
                    .whitelabel-theme-preview-root * {
                      font-family: "${theme.fontFamily || "Inter"}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                    }
                  `}</style>
                  {/* Browser Chrome Header with Favicon */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border/40 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500/70" />
                      <div className="w-2 h-2 rounded-full bg-amber-500/70" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-background/80 border border-border/40 text-[10px] font-mono text-foreground truncate max-w-[200px]">
                      {branding.faviconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={branding.faviconUrl}
                          alt="Favicon"
                          className="h-2.5 w-2.5 object-contain"
                        />
                      ) : (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      )}
                      <span className="truncate">
                        {branding.customDomain ||
                          (branding.subdomain
                            ? `${branding.subdomain}.yourmusicportal.com`
                            : "portal.yourbrand.com")}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {previewMode}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-3">
                    {/* Mock Hero Banner if uploaded */}
                    {branding.bannerUrl && (
                      <div
                        className="h-14 w-full rounded-md overflow-hidden border border-border/30 relative"
                        style={{ borderRadius: `calc(${theme.radius} * 0.75)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={branding.bannerUrl}
                          alt="Hero Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Mock Navbar with Dual-Theme Brand Logo */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        {activeLogoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={activeLogoUrl}
                            alt={branding.name || "Brand Logo"}
                            className="h-6 w-auto max-h-6 object-contain rounded"
                          />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-white text-[10px] shadow-xs"
                            style={{
                              backgroundColor: theme.primaryColor,
                              borderRadius: `calc(${theme.radius} * 0.75)`,
                            }}
                          >
                            {branding.name?.slice(0, 1) || "W"}
                          </div>
                        )}
                        <span
                          className="text-xs font-bold truncate max-w-[130px]"
                          style={{
                            color:
                              previewMode === "light" ? "#0f172a" : "#f8fafc",
                          }}
                        >
                          {branding.name || "My Music Label"}
                        </span>
                      </div>
                      <div
                        className="px-2 py-0.5 text-[9px] font-medium rounded-full"
                        style={{
                          backgroundColor: `${theme.accentColor}20`,
                          color: theme.accentColor,
                        }}
                      >
                        Portal
                      </div>
                    </div>

                    {/* Mock Dashboard Widget */}
                    <div
                      className="p-3 border transition-all"
                      style={{
                        backgroundColor:
                          previewMode === "light" ? "#f8fafc" : "#111827",
                        borderRadius: `calc(${theme.radius} * 0.75)`,
                        borderColor: `${theme.primaryColor}22`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color:
                              previewMode === "light" ? "#64748b" : "#94a3b8",
                          }}
                        >
                          Monthly Streams
                        </span>
                        <Sparkles
                          className="h-3 w-3"
                          style={{ color: theme.accentColor }}
                        />
                      </div>
                      <div
                        className="text-base font-bold mt-1"
                        style={{
                          color:
                            previewMode === "light" ? "#0f172a" : "#f8fafc",
                        }}
                      >
                        2,840,192
                      </div>
                      <div
                        className="text-[10px] font-medium mt-0.5"
                        style={{ color: theme.primaryColor }}
                      >
                        +18.4% from previous cycle
                      </div>
                    </div>

                    {/* Mock Buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        className="flex-1 py-1 text-[11px] font-semibold text-white shadow-xs transition-all hover:opacity-95"
                        style={{
                          backgroundColor: theme.primaryColor,
                          borderRadius: `calc(${theme.radius} * 0.75)`,
                        }}
                      >
                        Upload Release
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[11px] font-semibold border transition-all"
                        style={{
                          borderColor: `${theme.accentColor}66`,
                          color: theme.accentColor,
                          borderRadius: `calc(${theme.radius} * 0.75)`,
                        }}
                      >
                        Analytics
                      </button>
                    </div>

                    {/* Mock Input */}
                    <div className="pt-0.5">
                      <div
                        className="w-full px-2.5 py-1 text-[10px] border truncate"
                        style={{
                          borderRadius: `calc(${theme.radius} * 0.75)`,
                          backgroundColor:
                            previewMode === "light" ? "#f1f5f9" : "#1e293b",
                          borderColor:
                            previewMode === "light"
                              ? "#e2e8f0"
                              : "rgba(255,255,255,0.1)",
                          color:
                            previewMode === "light" ? "#64748b" : "#94a3b8",
                        }}
                      >
                        Search catalog &amp; artists...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dual-Theme Asset Status & Color Summary */}
                <div className="space-y-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Active Logo Asset:
                    </span>
                    <span className="font-semibold text-foreground">
                      {previewMode === "dark"
                        ? branding.logoDarkUrl
                          ? "Dark Mode Logo (Uploaded)"
                          : branding.logoUrl
                            ? "Primary Logo (Light fallback)"
                            : "Brand Initials (No logo)"
                        : branding.logoUrl
                          ? "Primary Light Logo (Uploaded)"
                          : branding.logoDarkUrl
                            ? "Dark Logo (Fallback)"
                            : "Brand Initials (No logo)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-full shadow-inner"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <span className="font-mono text-[10px]">
                        {theme.primaryColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-full shadow-inner"
                        style={{ backgroundColor: theme.accentColor }}
                      />
                      <span className="font-mono text-[10px]">
                        {theme.accentColor}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={saving}
          className="text-xs gap-1.5 h-9"
        >
          <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Reset</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs gap-1.5 font-semibold h-9"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
        </Button>
      </div>
    </div>
  );
}
