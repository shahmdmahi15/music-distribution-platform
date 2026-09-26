"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Layers,
  Upload,
  Trash2,
  Save,
  Image as ImageIcon,
  FileText,
  Share2,
  Shield,
  Building2,
  User,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhiteLabelBranding, WhiteLabelBusinessType } from "@/types/whitelabel";
import { clientUpdateBrandingAction } from "@/actions/client/whitelabel/client-update-branding.action";
import { clientUploadBrandingAssetAction } from "@/actions/client/whitelabel/client-upload-branding-asset.action";
import { clientDeleteBrandingAssetAction } from "@/actions/client/whitelabel/client-delete-branding-asset.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientBrandingViewProps {
  initialBranding: WhiteLabelBranding;
}

const BUSINESS_TYPE_OPTIONS = [
  { value: WhiteLabelBusinessType.RECORD_LABEL, label: "Record Label" },
  {
    value: WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR,
    label: "Distributor / Aggregator",
  },
  { value: WhiteLabelBusinessType.MUSIC_PUBLISHER, label: "Music Publisher" },
  { value: WhiteLabelBusinessType.REFERRER, label: "Referrer" },
];

export function ClientBrandingView({
  initialBranding,
}: ClientBrandingViewProps) {
  const router = useRouter();
  const [branding, setBranding] = useState<WhiteLabelBranding>(initialBranding);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);

  // Form State strictly mapping all WhiteLabel database model fields
  const [formData, setFormData] = useState({
    // Identity & Profile
    name: initialBranding.name || "",
    tagline: initialBranding.tagline || "",
    description: initialBranding.description || "",

    // Corporate Profile
    businessType:
      initialBranding.businessType || WhiteLabelBusinessType.RECORD_LABEL,
    companyWebsite: initialBranding.companyWebsite || "",
    country: initialBranding.country || "",
    yearsInBusiness: initialBranding.yearsInBusiness ?? 0,
    isIncorporated: initialBranding.isIncorporated ?? false,

    // Primary Account & Contact Representative
    contactFirstName: initialBranding.contactFirstName || "",
    contactLastName: initialBranding.contactLastName || "",
    contactEmail: initialBranding.contactEmail || "",
    contactLinkedIn: initialBranding.contactLinkedIn || "",

    // Support Contacts & Legal Notices
    supportEmail: initialBranding.supportEmail || "",
    supportPhone: initialBranding.supportPhone || "",
    copyrightText:
      initialBranding.copyrightText ||
      `© ${new Date().getFullYear()} ${initialBranding.name || "WhiteLabel"}. All rights reserved.`,

    // Social Channels
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

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size must be less than 8MB.");
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
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Identity &amp; Brand Assets</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your visual brand assets, corporate entity details, support
              contacts, and legal notices.
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
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {/* 1. Visual Brand Assets (Logos, Favicon & Banner) */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Brand Visual Assets
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Upload SVG, PNG, or WebP assets rendered across your client
              portal, login screens, and headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Logo (Light Mode) */}
              <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Primary Logo (Light)
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      PNG / SVG
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Rendered on light backgrounds and automated emails.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center bg-background p-3 relative overflow-hidden">
                  {branding.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.logoUrl}
                      alt="Primary Logo"
                      crossOrigin="anonymous"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      No Logo Uploaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1 text-xs h-8 cursor-pointer gap-1.5",
                      uploadingAsset === "logo" &&
                        "pointer-events-none opacity-50",
                    )}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logo")}
                      disabled={uploadingAsset === "logo"}
                    />
                    <Upload className="h-3 w-3" />
                    <span>
                      {uploadingAsset === "logo"
                        ? "Uploading..."
                        : "Upload Logo"}
                    </span>
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
                    <span className="text-[10px] text-muted-foreground font-mono">
                      PNG / SVG
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Rendered in dark portal navigation headers.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center bg-zinc-950 p-3 relative overflow-hidden">
                  {branding.logoDarkUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.logoDarkUrl}
                      alt="Dark Mode Logo"
                      crossOrigin="anonymous"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-zinc-500 text-xs">
                      No Dark Logo Uploaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1 text-xs h-8 cursor-pointer gap-1.5",
                      uploadingAsset === "logoDark" &&
                        "pointer-events-none opacity-50",
                    )}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logoDark")}
                      disabled={uploadingAsset === "logoDark"}
                    />
                    <Upload className="h-3 w-3" />
                    <span>
                      {uploadingAsset === "logoDark"
                        ? "Uploading..."
                        : "Upload Dark Logo"}
                    </span>
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
                    <span className="text-[10px] text-muted-foreground font-mono">
                      32x32 / ICO
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Browser tab icon for your custom portal domain.
                  </p>
                </div>

                <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center bg-background p-3 relative overflow-hidden">
                  {branding.faviconUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={branding.faviconUrl}
                      alt="Favicon"
                      crossOrigin="anonymous"
                      className="h-10 w-10 object-contain rounded"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      No Favicon Uploaded
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1 text-xs h-8 cursor-pointer gap-1.5",
                      uploadingAsset === "favicon" &&
                        "pointer-events-none opacity-50",
                    )}
                  >
                    <input
                      type="file"
                      accept=".ico,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "favicon")}
                      disabled={uploadingAsset === "favicon"}
                    />
                    <Upload className="h-3 w-3" />
                    <span>
                      {uploadingAsset === "favicon"
                        ? "Uploading..."
                        : "Upload Favicon"}
                    </span>
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

            {/* Portal Banner / Hero Header Image */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Platform Hero Banner
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Wide banner image displayed at the top of artist onboarding
                    and welcome headers (Recommended: 1920x400px).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "text-xs h-8 cursor-pointer gap-1.5",
                      uploadingAsset === "banner" &&
                        "pointer-events-none opacity-50",
                    )}
                  >
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "banner")}
                      disabled={uploadingAsset === "banner"}
                    />
                    <Upload className="h-3 w-3" />
                    <span>
                      {uploadingAsset === "banner"
                        ? "Uploading..."
                        : "Upload Banner"}
                    </span>
                  </label>
                  {branding.bannerUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAsset("banner")}
                      className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-36 rounded-lg border border-dashed border-border flex items-center justify-center bg-background relative overflow-hidden">
                {branding.bannerUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={branding.bannerUrl}
                    alt="Platform Banner"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-muted-foreground text-xs">
                    No Platform Banner Uploaded (Using default gradient styling)
                  </div>
                )}
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
              Define the brand name, tenant code, and public bio displayed
              across artist portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    Portal / Brand Name
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted/60 text-muted-foreground font-mono"
                  >
                    Permanent • Locked
                  </Badge>
                </div>
                <Input
                  value={formData.name}
                  disabled
                  readOnly
                  className="text-xs bg-muted/50 cursor-not-allowed opacity-90 font-medium font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Brand name is permanently registered to your tenant and cannot
                  be modified.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    Tenant Code Identifier
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted/60 text-muted-foreground font-mono"
                  >
                    System Identifier
                  </Badge>
                </div>
                <Input
                  value={branding.code}
                  disabled
                  readOnly
                  className="text-xs bg-muted/50 cursor-not-allowed opacity-90 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  Unique immutable system code used for catalog exports,
                  webhooks, and billing records.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Brand Tagline</Label>
              <Input
                value={formData.tagline}
                onChange={(e) =>
                  setFormData({ ...formData, tagline: e.target.value })
                }
                placeholder="Global Music Distribution & Rights Management"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Brand Description</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief summary of your music label or distribution business for artists and record labels."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Corporate Profile & Entity Verification */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Corporate Profile &amp; Business Entity
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Entity structure and corporate verification attributes matching
              your platform registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    Business Model / Type
                  </Label>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted/60 text-muted-foreground font-mono"
                  >
                    Permanent • Locked
                  </Badge>
                </div>
                <Input
                  value={
                    BUSINESS_TYPE_OPTIONS.find(
                      (b) => b.value === formData.businessType,
                    )?.label ||
                    formData.businessType ||
                    "Record Label"
                  }
                  disabled
                  readOnly
                  className="text-xs bg-muted/50 cursor-not-allowed opacity-90 font-medium"
                />
                <p className="text-[10px] text-muted-foreground">
                  Business model is verified upon registration and cannot be
                  modified.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Company Website
                  </Label>
                  <Input
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        companyWebsite: e.target.value,
                      })
                    }
                    placeholder="https://yourcompany.com"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        Country / Territory
                      </Label>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-muted/60 text-muted-foreground font-mono"
                      >
                        Permanent • Locked
                      </Badge>
                    </div>
                    <Input
                      value={formData.country || "Not Specified"}
                      disabled
                      readOnly
                      className="text-xs bg-muted/50 cursor-not-allowed opacity-90 font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Operating territory is locked to your verified business
                      registration.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Years in Business
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.yearsInBusiness}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearsInBusiness: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Operational track record in music catalog administration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Incorporation Status & Doc (Locked) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    Registered Legal Entity
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-muted/60 text-muted-foreground font-mono"
                  >
                    Permanent • Locked
                  </Badge>
                  {formData.isIncorporated ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]"
                    >
                      Incorporated
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      Sole Proprietor / Unincorporated
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {formData.isIncorporated
                    ? "Verified registered corporate entity (LLC, Inc, Ltd, etc.). Status is locked to your onboarding filing."
                    : "Registered as an unincorporated entity or sole proprietorship. Status is locked to your onboarding filing."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {branding.incorporationDocUrl && (
                  <a
                    href={branding.incorporationDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Filing Document</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Primary Contact Representative */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Primary Account Representative
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Designated executive representative responsible for rights
              compliance, contracts, and tenant billing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">First Name</Label>
                <Input
                  value={formData.contactFirstName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactFirstName: e.target.value,
                    })
                  }
                  placeholder="Jane"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Last Name</Label>
                <Input
                  value={formData.contactLastName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactLastName: e.target.value,
                    })
                  }
                  placeholder="Doe"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Contact &amp; Escalation Email
                </Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="jane.doe@yourlabel.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Representative LinkedIn Profile
                </Label>
                <Input
                  value={formData.contactLinkedIn}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactLinkedIn: e.target.value,
                    })
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Support Contacts & Legal Notices */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Support Channels &amp; Legal Notices
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Public contact addresses and copyright notices displayed in
              customer footers and transactional notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Support Email</Label>
                <Input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, supportEmail: e.target.value })
                  }
                  placeholder="support@yourlabel.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Support Phone</Label>
                <Input
                  value={formData.supportPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, supportPhone: e.target.value })
                  }
                  placeholder="+1 (555) 019-2834"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Footer Copyright Statement
              </Label>
              <Input
                value={formData.copyrightText}
                onChange={(e) =>
                  setFormData({ ...formData, copyrightText: e.target.value })
                }
                placeholder="© 2026 Your Label Name. All rights reserved."
                className="text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* 6. Social Media Channels */}
        <Card className="border-border/70 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Social Media Channels
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Public social channels and Spotify links displayed in the footer
              and artist onboarding screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Instagram Handle
                </Label>
                <Input
                  value={formData.socialInstagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialInstagram: e.target.value,
                    })
                  }
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Twitter / X Handle
                </Label>
                <Input
                  value={formData.socialTwitter}
                  onChange={(e) =>
                    setFormData({ ...formData, socialTwitter: e.target.value })
                  }
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">YouTube URL</Label>
                <Input
                  value={formData.socialYoutube}
                  onChange={(e) =>
                    setFormData({ ...formData, socialYoutube: e.target.value })
                  }
                  placeholder="https://youtube.com/@yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Spotify Curated Profile URL
                </Label>
                <Input
                  value={formData.socialSpotify}
                  onChange={(e) =>
                    setFormData({ ...formData, socialSpotify: e.target.value })
                  }
                  placeholder="https://open.spotify.com/user/..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Facebook Page URL
                </Label>
                <Input
                  value={formData.socialFacebook}
                  onChange={(e) =>
                    setFormData({ ...formData, socialFacebook: e.target.value })
                  }
                  placeholder="https://facebook.com/yourlabel"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  LinkedIn Company URL
                </Label>
                <Input
                  value={formData.socialLinkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, socialLinkedin: e.target.value })
                  }
                  placeholder="https://linkedin.com/company/..."
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">TikTok Handle</Label>
                <Input
                  value={formData.socialTiktok}
                  onChange={(e) =>
                    setFormData({ ...formData, socialTiktok: e.target.value })
                  }
                  placeholder="@yourlabel"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Footer Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
