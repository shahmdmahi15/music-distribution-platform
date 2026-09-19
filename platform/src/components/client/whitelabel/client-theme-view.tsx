"use client";

import { useState } from "react";
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
  Layers,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { WhiteLabelTheme, WhiteLabelBranding } from "@/types/whitelabel";
import { clientUpdateThemeAction } from "@/actions/client/whitelabel/client-theme.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

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

const FONT_OPTIONS = [
  { id: "Inter", label: "Inter (Clean & Modern)" },
  { id: "Outfit", label: "Outfit (Dynamic & Sleek)" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta Sans (High-End Tech)" },
  { id: "Geist", label: "Geist (Minimalist Precision)" },
];

export function ClientThemeView({ initialTheme, branding }: ClientThemeViewProps) {
  const [theme, setTheme] = useState<WhiteLabelTheme>(initialTheme);
  const [saving, setSaving] = useState(false);

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
    <div className="space-y-6">
      <WhiteLabelSubNav
        tenantName={branding.name}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Palette Presets Card */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">Color Themes & Palettes</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider">
                  Presets
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Pick a harmonious curated color palette or enter custom hex codes for your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_PALETTES.map((preset) => {
                  const isSelected =
                    theme.primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                    theme.accentColor.toLowerCase() === preset.accent.toLowerCase();
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
                  <Label className="text-xs font-medium">Primary Brand Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, primaryColor: e.target.value }))
                      }
                      className="text-xs font-mono uppercase"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Accent / Highlight Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, accentColor: e.target.value }))
                      }
                      className="h-9 w-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                    />
                    <Input
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, accentColor: e.target.value }))
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
                <CardTitle className="text-base font-semibold">Border Radius & Geometry</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Control the curvature of cards, inputs, buttons, and modal dialogs across your portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Curvature Scale</span>
                <span className="font-mono text-primary font-bold">{theme.radius}</span>
              </div>
              <Slider
                value={[radiusNumber * 16]}
                min={0}
                max={20}
                step={2}
                onValueChange={(vals: any) => {
                  const val = Array.isArray(vals) ? vals[0] : typeof vals === "number" ? vals : 8;
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
                <CardTitle className="text-base font-semibold">Typography & Surface</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Select your portal's typographic voice and visual backdrop elevation.
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
                      onClick={() => setTheme((prev) => ({ ...prev, fontFamily: f.id }))}
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
                          onClick={() =>
                            setTheme((prev) => ({ ...prev, mode: m.id as any }))
                          }
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
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "modern", label: "Glass" },
                      { id: "bordered", label: "Bordered" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setTheme((prev) => ({ ...prev, cardStyle: c.id as any }))
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
              </div>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Reset</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs gap-1.5 font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving Changes..." : "Publish Theme"}</span>
            </Button>
          </div>
        </div>

        {/* Live Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <Card className="border-border/80 shadow-lg overflow-hidden bg-card/90 backdrop-blur-xl">
              <CardHeader className="pb-3 border-b border-border/60 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Live Portal Mockup</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono"
                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                  >
                    Interactive
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Real-time preview of how your WhiteLabel portal will look to your artists and partners.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Mock Portal Container */}
                <div
                  className="p-4 rounded-xl border transition-all duration-200"
                  style={{
                    backgroundColor: theme.mode === "light" ? "#ffffff" : "#090d16",
                    borderColor: `${theme.primaryColor}33`,
                    borderRadius: theme.radius,
                  }}
                >
                  {/* Mock Navbar */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-white text-[11px] shadow-sm"
                        style={{
                          backgroundColor: theme.primaryColor,
                          borderRadius: theme.radius,
                        }}
                      >
                        {branding.name?.slice(0, 1) || "W"}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {branding.name || "My Music Label"}
                      </span>
                    </div>
                    <div
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                      style={{
                        backgroundColor: `${theme.accentColor}20`,
                        color: theme.accentColor,
                      }}
                    >
                      Portal
                    </div>
                  </div>

                  {/* Mock Dashboard Widget */}
                  <div className="mt-4 space-y-3">
                    <div
                      className="p-3 border transition-all"
                      style={{
                        backgroundColor: theme.mode === "light" ? "#f8fafc" : "#111827",
                        borderRadius: theme.radius,
                        borderColor: `${theme.primaryColor}22`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Monthly Streams
                        </span>
                        <Sparkles className="h-3 w-3" style={{ color: theme.accentColor }} />
                      </div>
                      <div className="text-lg font-bold mt-1 text-foreground">
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
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="flex-1 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95"
                        style={{
                          backgroundColor: theme.primaryColor,
                          borderRadius: theme.radius,
                        }}
                      >
                        Upload Release
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold border transition-all"
                        style={{
                          borderColor: `${theme.accentColor}66`,
                          color: theme.accentColor,
                          borderRadius: theme.radius,
                        }}
                      >
                        Analytics
                      </button>
                    </div>

                    {/* Mock Input */}
                    <div className="pt-2">
                      <div
                        className="w-full px-2.5 py-1.5 text-[11px] border text-muted-foreground"
                        style={{
                          borderRadius: theme.radius,
                          backgroundColor: theme.mode === "light" ? "#f1f5f9" : "#1e293b",
                          borderColor: "rgba(255,255,255,0.1)",
                        }}
                      >
                        search catalog...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Scheme Summary */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <span className="font-mono text-[11px] text-foreground">
                      {theme.primaryColor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                    <span className="font-mono text-[11px] text-foreground">
                      {theme.accentColor}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
