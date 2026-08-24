"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Globe,
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Share2,
  Save,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Shield,
  Layers,
  FileText,
  Mail,
  Phone,
  Music,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhiteLabelBranding } from "@/types/whitelabel";
import { clientUpdateBrandingAction } from "@/actions/client/whitelabel/client-update-branding.action";
import { clientUploadBrandingAssetAction } from "@/actions/client/whitelabel/client-upload-branding-asset.action";
import { clientDeleteBrandingAssetAction } from "@/actions/client/whitelabel/client-delete-branding-asset.action";

interface ClientBrandingViewProps {
  initialBranding: WhiteLabelBranding;
}

const COLOR_PRESETS = [
  { name: "Royal Indigo", primary: "#6366f1", accent: "#ec4899" },
  { name: "Neon Emerald", primary: "#10b981", accent: "#06b6d4" },
  { name: "Sunset Amber", primary: "#f59e0b", accent: "#ef4444" },
  { name: "Electric Violet", primary: "#8b5cf6", accent: "#f43f5e" },
  { name: "Ocean Breeze", primary: "#0ea5e9", accent: "#3b82f6" },
  { name: "Rose Gold", primary: "#f43f5e", accent: "#fbbf24" },
];

export function ClientBrandingView({ initialBranding }: ClientBrandingViewProps) {
  const router = useRouter();
  const [branding, setBranding] = useState<WhiteLabelBranding>(initialBranding);
  const [activeTab, setActiveTab] = useState<"visuals" | "colors" | "domains" | "profile" | "social">("visuals");
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: initialBranding.name || "",
    subdomain: initialBranding.subdomain || "",
    customDomain: initialBranding.customDomain || "",
    tagline: initialBranding.tagline || "",
    description: initialBranding.description || "",
    primaryColor: initialBranding.primaryColor || "#6366f1",
    accentColor: initialBranding.accentColor || "#ec4899",
    supportEmail: initialBranding.supportEmail || "",
    supportPhone: initialBranding.supportPhone || "",
    copyrightText:
      initialBranding.copyrightText ||
      `© ${new Date().getFullYear()} ${initialBranding.name}. All rights reserved.`,
    socialInstagram: initialBranding.socialInstagram || "",
    socialTwitter: initialBranding.socialTwitter || "",
    socialYoutube: initialBranding.socialYoutube || "",
    socialSpotify: initialBranding.socialSpotify || "",
    socialFacebook: initialBranding.socialFacebook || "",
    socialLinkedin: initialBranding.socialLinkedin || "",
    socialTiktok: initialBranding.socialTiktok || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await clientUpdateBrandingAction(formData);
      if (res.success) {
        toast.success(res.message);
        if (res.branding) {
          setBranding(res.branding);
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save branding changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setUploadingAsset(assetType);
    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("assetType", assetType);

      const res = await clientUploadBrandingAssetAction(payload);
      if (res.success) {
        toast.success(res.message);
        setBranding((prev) => ({
          ...prev,
          [`${assetType}Url`]: res.assetUrl,
        }));
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to upload ${assetType}.`);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleDeleteAsset = async (
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    try {
      const res = await clientDeleteBrandingAssetAction(assetType);
      if (res.success) {
        toast.success(res.message);
        setBranding((prev) => ({
          ...prev,
          [`${assetType}Url`]: null,
        }));
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to delete ${assetType}.`);
    }
  };

  const previewDomain = formData.customDomain
    ? `https://${formData.customDomain}`
    : formData.subdomain
    ? `https://${formData.subdomain}.rmitdistribution.com`
    : `https://${branding.code.toLowerCase()}.rmitdistribution.com`;

  const copyDomain = () => {
    navigator.clipboard.writeText(previewDomain);
    setCopiedUrl(true);
    toast.success("Domain URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>WhiteLabel</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Identity & Branding</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Identity & Custom Branding
            </h1>
            <Badge variant="outline" className="font-mono text-xs font-semibold border-primary/30 bg-primary/10 text-primary">
              {branding.code}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure visual assets, color themes, and custom domain routing for your record label portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm h-8 px-4"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving Changes..." : "Save Branding"}
          </Button>
        </div>
      </div>

      {/* Modern WhiteLabel Identity Overview Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${formData.primaryColor} 0%, ${formData.accentColor} 100%)`,
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl bg-muted/30 border-2 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs transition-colors"
              style={{ borderColor: formData.primaryColor }}
            >
              {branding.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Music className="h-7 w-7 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">
                  {formData.name || "My Record Label"}
                </h3>
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] font-semibold border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live Portal
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                {formData.tagline || "Independent Music Distribution Platform"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/40 border border-border/60 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border shadow-2xs"
                  style={{ backgroundColor: formData.primaryColor }}
                />
                <span className="font-mono text-[11px] font-semibold">{formData.primaryColor}</span>
              </div>
              <span className="text-muted-foreground">/</span>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border shadow-2xs"
                  style={{ backgroundColor: formData.accentColor }}
                />
                <span className="font-mono text-[11px] font-semibold">{formData.accentColor}</span>
              </div>
            </div>

            <button
              onClick={copyDomain}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/60 text-xs font-mono text-foreground transition-colors cursor-pointer"
              title="Click to copy live endpoint"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="text-[11px] font-semibold">{previewDomain.replace("https://", "")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-px text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("visuals")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "visuals"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Brand Logos & Assets
        </button>
        <button
          onClick={() => setActiveTab("colors")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "colors"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="h-4 w-4" />
          Color Palette & Theme
        </button>
        <button
          onClick={() => setActiveTab("domains")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "domains"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-4 w-4" />
          Subdomain & Custom Domain
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "profile"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Brand Voice & Support
        </button>
        <button
          onClick={() => setActiveTab("social")}
          className={`px-4 py-2.5 font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === "social"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Share2 className="h-4 w-4" />
          Social Channels
        </button>
      </div>

      {/* TAB 1: Brand Logos & Visual Assets */}
      {activeTab === "visuals" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Logo */}
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Primary Brand Logo
                </span>
                {branding.logoUrl && (
                  <button
                    onClick={() => handleDeleteAsset("logo")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-normal"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                Main logo for light mode navigation and headers (PNG, SVG, or WEBP).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <label className="block w-full cursor-pointer group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleFileUpload(e, "logo")}
                  disabled={uploadingAsset === "logo"}
                  className="hidden"
                />
                <div className="h-28 rounded-xl border-2 border-dashed border-border/80 group-hover:border-primary/50 group-hover:bg-muted/30 bg-muted/10 transition-all flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {branding.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.logoUrl}
                      alt="Primary Logo"
                      className="max-h-20 max-w-[160px] object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center space-y-1">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto group-hover:text-primary transition-colors" />
                      <p className="text-xs font-semibold">
                        {uploadingAsset === "logo" ? "Uploading to S3..." : "Click to upload primary logo"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Transparent PNG or SVG recommended (512x512)</p>
                    </div>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Dark Mode Logo */}
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Dark Mode Alternative Logo
                </span>
                {branding.logoDarkUrl && (
                  <button
                    onClick={() => handleDeleteAsset("logoDark")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-normal"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                Inverted light-colored logo rendered in dark mode themes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <label className="block w-full cursor-pointer group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleFileUpload(e, "logoDark")}
                  disabled={uploadingAsset === "logoDark"}
                  className="hidden"
                />
                <div className="h-28 rounded-xl border-2 border-dashed border-border/80 group-hover:border-primary/50 bg-zinc-950 transition-all flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  {branding.logoDarkUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.logoDarkUrl}
                      alt="Dark Logo"
                      className="max-h-20 max-w-[160px] object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center space-y-1 text-zinc-400">
                      <Upload className="h-5 w-5 mx-auto group-hover:text-white transition-colors" />
                      <p className="text-xs font-semibold">
                        {uploadingAsset === "logoDark" ? "Uploading to S3..." : "Click to upload dark logo"}
                      </p>
                      <p className="text-[10px] text-zinc-500">Falls back to primary logo if omitted</p>
                    </div>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Favicon Icon */}
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Browser Favicon (32x32)
                </span>
                {branding.faviconUrl && (
                  <button
                    onClick={() => handleDeleteAsset("favicon")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-normal"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                Icon displayed in browser tabs and bookmarks bar (ICO or PNG).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <label className="block w-full cursor-pointer group">
                <input
                  type="file"
                  accept="image/x-icon,image/png"
                  onChange={(e) => handleFileUpload(e, "favicon")}
                  disabled={uploadingAsset === "favicon"}
                  className="hidden"
                />
                <div className="h-24 rounded-xl border border-dashed border-border/80 group-hover:border-primary/50 bg-muted/10 transition-all flex items-center justify-center gap-3 p-3">
                  <div className="h-10 w-10 rounded-lg border bg-card shadow-xs flex items-center justify-center p-1.5">
                    {branding.faviconUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={branding.faviconUrl} alt="Favicon" className="h-7 w-7 object-contain" />
                    ) : (
                      <Globe className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-left space-y-0.5">
                    <p className="text-xs font-semibold">
                      {branding.faviconUrl ? "Click to replace favicon" : "Click to upload favicon"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">ICO or PNG up to 1MB (32x32 or 64x64)</p>
                  </div>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Hero Banner Image */}
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Portal Cover Banner (1920x400)
                </span>
                {branding.bannerUrl && (
                  <button
                    onClick={() => handleDeleteAsset("banner")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-1 font-normal"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                Top cover image for dashboards and portal headers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              <label className="block w-full cursor-pointer group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileUpload(e, "banner")}
                  disabled={uploadingAsset === "banner"}
                  className="hidden"
                />
                <div className="h-24 rounded-xl border border-dashed border-border/80 group-hover:border-primary/50 bg-muted/10 transition-all flex items-center justify-center relative overflow-hidden p-3">
                  {branding.bannerUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={branding.bannerUrl} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center space-y-1">
                      <Upload className="h-5 w-5 text-muted-foreground mx-auto group-hover:text-primary transition-colors" />
                      <p className="text-xs font-semibold">Click to upload custom banner</p>
                      <p className="text-[10px] text-muted-foreground">Recommended 1920x400 JPG or PNG</p>
                    </div>
                  )}
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Color Palette & Theme */}
      {activeTab === "colors" && (
        <div className="space-y-5">
          <Card className="border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-primary" />
                Designer Color Themes
              </CardTitle>
              <CardDescription className="text-[11px]">
                Quickly apply tailored color schemes optimized for music streaming and record labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-left space-y-1.5 transition-all hover:scale-[1.02] cursor-pointer ${
                      formData.primaryColor === preset.primary && formData.accentColor === preset.accent
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div
                      className="h-6 w-full rounded-md shadow-inner"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.accent} 100%)`,
                      }}
                    />
                    <div>
                      <p className="text-[11px] font-bold truncate">{preset.name}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{preset.primary}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary Color Picker */}
            <Card className="border-border/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold">Primary Brand Color</CardTitle>
                <CardDescription className="text-[11px]">
                  Applied to active links, primary buttons, badges, and accent highlights.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="h-9 w-12 shrink-0 rounded-lg cursor-pointer border bg-transparent p-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label className="text-[11px] font-semibold">Hex Code</Label>
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryColor: e.target.value,
                        }))
                      }
                      className="h-8 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accent Color Picker */}
            <Card className="border-border/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold">Secondary Accent Color</CardTitle>
                <CardDescription className="text-[11px]">
                  Used for gradient endpoints, chart lines, and secondary visual accents.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        accentColor: e.target.value,
                      }))
                    }
                    className="h-9 w-12 shrink-0 rounded-lg cursor-pointer border bg-transparent p-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label className="text-[11px] font-semibold">Hex Code</Label>
                    <Input
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accentColor: e.target.value,
                        }))
                      }
                      className="h-8 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: Subdomain & Custom Domain */}
      {activeTab === "domains" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Managed Subdomain */}
            <Card className="border-border/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Managed Platform Subdomain
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Instant SSL-enabled domain hosted on RMIT high-speed distribution edge.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Subdomain Handle</Label>
                  <div className="flex items-center">
                    <Input
                      placeholder="myrecordlabel"
                      value={formData.subdomain}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        }))
                      }
                      className="h-8 text-xs font-mono rounded-r-none border-r-0 min-w-0"
                    />
                    <span className="h-8 px-2.5 bg-muted/60 border border-l-0 rounded-r-md text-[11px] font-mono flex items-center text-muted-foreground shrink-0 select-none">
                      .rmitdistribution.com
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Custom Domain (CNAME) */}
            <Card className="border-border/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Custom FQDN Domain
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Map your own domain name (e.g. <span className="font-mono text-foreground">music.mylabel.com</span>).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Domain Name</Label>
                  <Input
                    placeholder="music.myrecordlabel.com"
                    value={formData.customDomain}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customDomain: e.target.value.toLowerCase().trim(),
                      }))
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1 text-foreground">
                    <HelpCircle className="h-3 w-3 text-primary" /> DNS CNAME Record
                  </p>
                  <div className="font-mono text-[10px] bg-card p-1.5 rounded border flex justify-between">
                    <span>Host: <strong className="text-foreground">music</strong></span>
                    <span>Target: <strong className="text-foreground">cname.rmitdistribution.com</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: Brand Voice & Support */}
      {activeTab === "profile" && (
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold">Brand Information & Support Details</CardTitle>
            <CardDescription className="text-[11px]">
              Surfaced in portal footers, notification emails, and automated statements.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Brand Display Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tagline / Slogan</Label>
                <Input
                  placeholder="e.g. Next-Generation Sound & Distribution"
                  value={formData.tagline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">About / Brand Biography</Label>
              <Textarea
                placeholder="Describe your record label, roster highlights, or mission statement..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  Public Support Email
                </Label>
                <Input
                  type="email"
                  placeholder="support@myrecordlabel.com"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supportEmail: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  Support Phone / Hotline
                </Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={formData.supportPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, supportPhone: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Legal & Copyright Notice</Label>
              <Input
                placeholder="© 2026 My Record Label. All rights reserved."
                value={formData.copyrightText}
                onChange={(e) => setFormData((prev) => ({ ...prev, copyrightText: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Social Channels */}
      {activeTab === "social" && (
        <Card className="border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold">Social Media Profiles</CardTitle>
            <CardDescription className="text-[11px]">
              Link your official artist roster and label social ecosystem.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instagram URL</Label>
                <Input
                  placeholder="https://instagram.com/myrecordlabel"
                  value={formData.socialInstagram}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialInstagram: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">X / Twitter URL</Label>
                <Input
                  placeholder="https://x.com/myrecordlabel"
                  value={formData.socialTwitter}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialTwitter: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">YouTube Channel URL</Label>
                <Input
                  placeholder="https://youtube.com/@myrecordlabel"
                  value={formData.socialYoutube}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialYoutube: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Spotify Label Profile</Label>
                <Input
                  placeholder="https://open.spotify.com/user/myrecordlabel"
                  value={formData.socialSpotify}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialSpotify: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">TikTok Profile</Label>
                <Input
                  placeholder="https://tiktok.com/@myrecordlabel"
                  value={formData.socialTiktok}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialTiktok: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">LinkedIn Page</Label>
                <Input
                  placeholder="https://linkedin.com/company/myrecordlabel"
                  value={formData.socialLinkedin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialLinkedin: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clean Bottom Footer Bar */}
      <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>All saved changes reflect dynamically across your WhiteLabel portal.</span>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm px-5 h-8"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save Branding Settings"}
        </Button>
      </div>
    </div>
  );
}
