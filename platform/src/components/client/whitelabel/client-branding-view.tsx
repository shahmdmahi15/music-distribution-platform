"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Layers,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Mail,
  Phone,
  FileText,
  Share2,
  ExternalLink,
  ArrowRight,
  Globe,
  Palette,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhiteLabelBranding } from "@/types/whitelabel";
import { clientUpdateBrandingAction } from "@/actions/client/whitelabel/client-update-branding.action";
import { clientUploadBrandingAssetAction } from "@/actions/client/whitelabel/client-upload-branding-asset.action";
import { clientDeleteBrandingAssetAction } from "@/actions/client/whitelabel/client-delete-branding-asset.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";
import Link from "next/link";

interface ClientBrandingViewProps {
  initialBranding: WhiteLabelBranding;
}

export function ClientBrandingView({ initialBranding }: ClientBrandingViewProps) {
  const router = useRouter();
  const [branding, setBranding] = useState<WhiteLabelBranding>(initialBranding);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  // Form State - Identity & Brand Assets Only (Single Source of Truth)
  const [formData, setFormData] = useState({
    name: initialBranding.name || "",
    tagline: initialBranding.tagline || "",
    description: initialBranding.description || "",
    supportEmail: initialBranding.supportEmail || "",
    supportPhone: initialBranding.supportPhone || "",
    copyrightText:
      initialBranding.copyrightText ||
      `© ${new Date().getFullYear()} ${initialBranding.name || "WhiteLabel"}. All rights reserved.`,
    socialInstagram: initialBranding.socialInstagram || "",
    socialTwitter: initialBranding.socialTwitter || "",
    socialYoutube: initialBranding.socialYoutube || "",
    socialSpotify: initialBranding.socialSpotify || "",
    socialFacebook: initialBranding.socialFacebook || "",
    socialLinkedin: initialBranding.socialLinkedin || "",
    socialTiktok: initialBranding.socialTiktok || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Brand name is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await clientUpdateBrandingAction(formData);
      if (res.success) {
        toast.success(res.message || "Branding identity saved successfully.");
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

  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setUploadingAsset(assetType);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("assetType", assetType);

      const res = await clientUploadBrandingAssetAction(uploadFormData);
      if (res.success) {
        toast.success(res.message);
        const fieldKey =
          assetType === "logo"
            ? "logoUrl"
            : assetType === "logoDark"
              ? "logoDarkUrl"
              : assetType === "favicon"
                ? "faviconUrl"
                : "bannerUrl";
        if (res.assetUrl) {
          setBranding((prev) => ({ ...prev, [fieldKey]: res.assetUrl }));
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to upload ${assetType}.`);
    } finally {
      setUploadingAsset(null);
      e.target.value = "";
    }
  };

  const handleDeleteAsset = async (
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    if (!confirm(`Are you sure you want to remove this ${assetType}?`)) return;

    setUploadingAsset(assetType);
    try {
      const res = await clientDeleteBrandingAssetAction(assetType);
      if (res.success) {
        toast.success(res.message);
        const fieldKey =
          assetType === "logo"
            ? "logoUrl"
            : assetType === "logoDark"
              ? "logoDarkUrl"
              : assetType === "favicon"
                ? "faviconUrl"
                : "bannerUrl";
        setBranding((prev) => ({ ...prev, [fieldKey]: null }));
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to remove ${assetType}.`);
    } finally {
      setUploadingAsset(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Top Actions & Notification Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Identity &amp; Brand Assets
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your company name, logo assets, support contacts, and legal notices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs font-semibold gap-1.5 h-9"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving Changes..." : "Save Branding"}</span>
            </Button>
          </div>
        </div>

        {/* 1. Visual Brand Assets (Logos & Favicon) */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Brand Visual Assets
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Upload SVG or high-resolution PNG assets for your WhiteLabel portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Logo (Light Mode) */}
              <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Primary Logo (Light)
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">PNG / SVG</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Displayed on light backgrounds and email templates.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center bg-background p-3 relative overflow-hidden">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Primary Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      No Logo Uploaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logo")}
                      disabled={uploadingAsset === "logo"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 cursor-pointer"
                      disabled={uploadingAsset === "logo"}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadingAsset === "logo" ? "Uploading..." : "Upload Logo"}
                    </Button>
                  </label>
                  {branding.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteAsset("logo")}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Dark Mode Logo */}
              <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Dark Mode Logo
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">PNG / SVG</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Rendered in dark portal navigation bars.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-950 p-3 relative overflow-hidden">
                  {branding.logoDarkUrl ? (
                    <img
                      src={branding.logoDarkUrl}
                      alt="Dark Mode Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-zinc-500 text-xs">
                      No Dark Logo Uploaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logoDark")}
                      disabled={uploadingAsset === "logoDark"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 cursor-pointer"
                      disabled={uploadingAsset === "logoDark"}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadingAsset === "logoDark" ? "Uploading..." : "Upload Dark Logo"}
                    </Button>
                  </label>
                  {branding.logoDarkUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteAsset("logoDark")}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Browser Favicon
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">32x32 / ICO</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Browser tab icon for your custom portal domain.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center bg-background p-3 relative overflow-hidden">
                  {branding.faviconUrl ? (
                    <img
                      src={branding.faviconUrl}
                      alt="Favicon"
                      className="h-10 w-10 object-contain rounded"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      No Favicon
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "favicon")}
                      disabled={uploadingAsset === "favicon"}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8 cursor-pointer"
                      disabled={uploadingAsset === "favicon"}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadingAsset === "favicon" ? "Uploading..." : "Upload Favicon"}
                    </Button>
                  </label>
                  {branding.faviconUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteAsset("favicon")}
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Brand Identity & Profile */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Organization &amp; Brand Profile
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Define the brand name and public bio displayed across artist onboarding and portal headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Portal / Brand Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Royal Music Distribution"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Brand Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Global Music Distribution & Rights Management"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Brand Description</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of your music label or distribution business for artists and record labels."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Support Contacts & Legal Notices */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Support Channels &amp; Legal Notices
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Contact addresses and copyright statements shown in portal footers and outgoing notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Support Email</Label>
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  placeholder="support@yourlabel.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Support Phone</Label>
                <Input
                  value={formData.supportPhone}
                  onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Footer Copyright Statement</Label>
              <Input
                value={formData.copyrightText}
                onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                placeholder="© 2026 Your Label Name. All rights reserved."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Social Media Channels */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Social Media Channels
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Optional links to your public social channels displayed in the portal footer.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Instagram Handle</Label>
                <Input
                  value={formData.socialInstagram}
                  onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Twitter / X Handle</Label>
                <Input
                  value={formData.socialTwitter}
                  onChange={(e) => setFormData({ ...formData, socialTwitter: e.target.value })}
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">YouTube URL</Label>
                <Input
                  value={formData.socialYoutube}
                  onChange={(e) => setFormData({ ...formData, socialYoutube: e.target.value })}
                  placeholder="https://youtube.com/@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Spotify Curated URL</Label>
                <Input
                  value={formData.socialSpotify}
                  onChange={(e) => setFormData({ ...formData, socialSpotify: e.target.value })}
                  placeholder="https://open.spotify.com/user/..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">LinkedIn Company URL</Label>
                <Input
                  value={formData.socialLinkedin}
                  onChange={(e) => setFormData({ ...formData, socialLinkedin: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">TikTok Handle</Label>
                <Input
                  value={formData.socialTiktok}
                  onChange={(e) => setFormData({ ...formData, socialTiktok: e.target.value })}
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Banner linking to Domain & Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/70 shadow-xs bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Domain &amp; Routing</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Configure your platform subdomain (*.platform.royalmotionit.com) or verify a custom domain.
                </p>
              </div>
              <Link href="/whitelabel/domain">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  Configure &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-xs bg-muted/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  <span>Theme &amp; Styling</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Customize your brand accent colors, dark/light styling, and UI typography.
                </p>
              </div>
              <Link href="/whitelabel/theme">
                <Button variant="outline" size="sm" className="text-xs h-8">
                  Customize &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Save Footer Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Branding Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
