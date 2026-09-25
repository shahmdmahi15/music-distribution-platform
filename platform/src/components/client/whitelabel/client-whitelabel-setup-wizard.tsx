"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Palette,
  UserCheck,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Server,
  Lock,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Laptop,
  Check,
  Copy,
  ExternalLink,
  Music,
  ShieldCheck,
  UserPlus,
  Cloud,
  HardDrive,
  Cpu,
  RefreshCw,
  Terminal,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  WhiteLabelBranding,
  WhiteLabelSignupModel,
  ProvisioningStatus,
} from "@/types/whitelabel";
import { clientSetupWhiteLabelAction } from "@/actions/client/whitelabel/client-setup-whitelabel.action";
import {
  clientValidateCloudCredentialsAction,
  clientStartCloudProvisioningAction,
} from "@/actions/client/whitelabel/client-cloud-provisioning.action";
import { ClientCloudProvisioningTerminal } from "./client-cloud-provisioning-terminal";
import Link from "next/link";

interface ClientWhiteLabelSetupWizardProps {
  branding: WhiteLabelBranding;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  latestKeyPrefix?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRESET_PRIMARY_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Sky", hex: "#0284c7" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Zinc", hex: "#71717a" },
];

const PRESET_ACCENT_COLORS = [
  { name: "Pink", hex: "#ec4899" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Orange", hex: "#f97316" },
  { name: "White", hex: "#ffffff" },
];

const FONT_OPTIONS = [
  { id: "Inter", label: "Inter (Modern Tech)" },
  { id: "Outfit", label: "Outfit (Creative & Bold)" },
  { id: "Poppins", label: "Poppins (Clean & Friendly)" },
  { id: "Roboto", label: "Roboto (Neutral & Crisp)" },
  { id: "Plus Jakarta Sans", label: "Plus Jakarta (Premium Sans)" },
];

const RADIUS_OPTIONS = [
  { id: "0.25rem", label: "Sharp (0.25rem)" },
  { id: "0.5rem", label: "Modern (0.5rem)" },
  { id: "0.75rem", label: "Smooth (0.75rem)" },
  { id: "1.25rem", label: "Pill / Round (1.25rem)" },
];

export function ClientWhiteLabelSetupWizard({
  branding,
  user,
  latestKeyPrefix,
  onSuccess,
  onCancel,
}: ClientWhiteLabelSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Form State
  const [name, setName] = useState(branding.name || "");
  const [tagline, setTagline] = useState(branding.tagline || "");
  const [description, setDescription] = useState(branding.description || "");
  const [supportEmail, setSupportEmail] = useState(
    branding.supportEmail || user.email || "",
  );
  const [supportPhone, setSupportPhone] = useState(branding.supportPhone || "");
  const [copyrightText, setCopyrightText] = useState(
    branding.copyrightText || "",
  );

  // Theme & Styling
  const [themeMode, setThemeMode] = useState(branding.themeMode || "dark");
  const [primaryColor, setPrimaryColor] = useState(
    branding.primaryColor || "#6366f1",
  );
  const [accentColor, setAccentColor] = useState(
    branding.accentColor || "#ec4899",
  );
  const [themeRadius, setThemeRadius] = useState(
    branding.themeRadius || "0.5rem",
  );
  const [themeFont, setThemeFont] = useState(branding.themeFont || "Inter");
  const [cardStyle, setCardStyle] = useState(branding.cardStyle || "modern");

  // Registration Model
  const [signupModel, setSignupModel] = useState<WhiteLabelSignupModel>(
    branding.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
  );

  // Brand Assets & SEO
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");
  const [logoDarkUrl, setLogoDarkUrl] = useState(branding.logoDarkUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(branding.faviconUrl || "");
  const [bannerUrl, setBannerUrl] = useState(branding.bannerUrl || "");

  // Social Links
  const [instagram, setInstagram] = useState(branding.socialInstagram || "");
  const [twitter, setTwitter] = useState(branding.socialTwitter || "");
  const [spotify, setSpotify] = useState(branding.socialSpotify || "");
  const [youtube, setYoutube] = useState(branding.socialYoutube || "");

  // Owner Account Creation
  const [ownerFirstName, setOwnerFirstName] = useState(user.firstName || "");
  const [ownerLastName, setOwnerLastName] = useState(user.lastName || "");
  const [ownerEmail, setOwnerEmail] = useState(user.email || "");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const hasExistingOwner = branding.hasOwner ?? false;

  const portalHost = branding.customDomain
    ? `https://${branding.customDomain}`
    : branding.subdomain
      ? `https://${branding.subdomain}.platform.royalmotionit.com`
      : "http://localhost:3001";

  const envSnippet = `# WhiteLabel Portal (.env)
# Only 3 environment variables required:
API_BASE_URL="http://localhost:5000"
API_KEY="${latestKeyPrefix ? latestKeyPrefix.replace("...", "xxxx") : "rmit_live_your_generated_api_key"}"
INTERNAL_API_SECRET="your_32_character_internal_api_secret"`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedSnippet(true);
    toast.success("Hosting environment snippet copied to clipboard");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleAutofillOwner = () => {
    setOwnerFirstName(user.firstName || "");
    setOwnerLastName(user.lastName || "");
    setOwnerEmail(user.email || "");
    toast.info("Populated owner fields with your platform account profile.");
  };

  // Cloud Infrastructure Provisioning State
  const [deploymentMode, setDeploymentMode] = useState<"automated" | "manual">(
    "automated",
  );
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [instanceType, setInstanceType] = useState("t4g.medium");
  const [showAwsSecret, setShowAwsSecret] = useState(false);

  const [cloudflareApiToken, setCloudflareApiToken] = useState("");
  const [cloudflareZoneId, setCloudflareZoneId] = useState(
    branding.cloudflareZoneId || "",
  );
  const [cloudflareBaseDomain, setCloudflareBaseDomain] = useState(
    branding.cloudflareBaseDomain || "",
  );
  const [portalSubdomain, setPortalSubdomain] = useState(
    branding.subdomain || "backstage",
  );
  const [showCfToken, setShowCfToken] = useState(false);

  const [isValidatingCloud, setIsValidatingCloud] = useState(false);
  const [cloudValidationResult, setCloudValidationResult] = useState<{
    isValid: boolean;
    aws?: boolean;
    cloudflare?: boolean;
    details?: string[];
    error?: string;
  } | null>(null);

  const [isProvisioningActive, setIsProvisioningActive] = useState(
    branding.provisioningStatus === ProvisioningStatus.DEPLOYING_APPLICATION ||
      branding.provisioningStatus === ProvisioningStatus.EC2_LAUNCHING ||
      branding.provisioningStatus === ProvisioningStatus.DNS_CONFIGURED ||
      branding.provisioningStatus === ProvisioningStatus.STORAGE_PROVISIONED,
  );
  const [isProvisioningDone, setIsProvisioningDone] = useState(
    branding.provisioningStatus === ProvisioningStatus.ACTIVE ||
      (branding.provisioningProgress ?? 0) === 100,
  );
  const [deployedDomain, setDeployedDomain] = useState<string | null>(
    branding.customDomain || null,
  );

  const handleValidateCloudCredentials = async () => {
    if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim()) {
      toast.error("Please enter both AWS Access Key ID and Secret Access Key.");
      return;
    }
    if (
      !cloudflareApiToken.trim() ||
      !cloudflareZoneId.trim() ||
      !cloudflareBaseDomain.trim()
    ) {
      toast.error(
        "Please enter Cloudflare API Token, Zone ID, and Base Domain.",
      );
      return;
    }

    setIsValidatingCloud(true);
    setCloudValidationResult(null);
    try {
      const res = await clientValidateCloudCredentialsAction({
        awsAccessKeyId: awsAccessKeyId.trim(),
        awsSecretAccessKey: awsSecretAccessKey.trim(),
        awsRegion,
        cloudflareApiToken: cloudflareApiToken.trim(),
        cloudflareZoneId: cloudflareZoneId.trim(),
        cloudflareBaseDomain: cloudflareBaseDomain.trim().toLowerCase(),
      });

      if (res.success && res.checks?.aws && res.checks?.cloudflare) {
        setCloudValidationResult({
          isValid: true,
          aws: res.checks.aws,
          cloudflare: res.checks.cloudflare,
          details: res.checks.details,
        });
        toast.success(
          "AWS STS and Cloudflare Zone credentials successfully verified!",
        );
      } else {
        const errorMsg = res.message || "Credential verification failed.";
        setCloudValidationResult({
          isValid: false,
          aws: res.checks?.aws,
          cloudflare: res.checks?.cloudflare,
          details: res.checks?.details,
          error: errorMsg,
        });
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Validation request failed.";
      setCloudValidationResult({ isValid: false, error: errorMsg });
      toast.error(errorMsg);
    } finally {
      setIsValidatingCloud(false);
    }
  };

  const handleStartCloudProvisioning = async () => {
    if (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim()) {
      toast.error(
        "AWS credentials are required for automated cloud deployment.",
      );
      return;
    }
    if (
      !cloudflareApiToken.trim() ||
      !cloudflareZoneId.trim() ||
      !cloudflareBaseDomain.trim()
    ) {
      toast.error(
        "Cloudflare credentials are required for automated DNS routing.",
      );
      return;
    }

    try {
      const res = await clientStartCloudProvisioningAction({
        awsAccessKeyId: awsAccessKeyId.trim(),
        awsSecretAccessKey: awsSecretAccessKey.trim(),
        awsRegion,
        instanceType,
        cloudflareApiToken: cloudflareApiToken.trim(),
        cloudflareZoneId: cloudflareZoneId.trim(),
        cloudflareBaseDomain: cloudflareBaseDomain.trim().toLowerCase(),
        subdomain: portalSubdomain.trim().toLowerCase() || "backstage",
      });

      if (res.success) {
        setIsProvisioningActive(true);
        toast.success(
          "Multi-cloud provisioning pipeline started! Real-time telemetry connected.",
        );
      } else {
        toast.error(res.message || "Failed to start cloud provisioning.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to initiate provisioning.",
      );
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        toast.error("Please enter a Brand / Portal Name.");
        return;
      }
      if (!supportEmail.trim() || !supportEmail.includes("@")) {
        toast.error("Please enter a valid Support Email address.");
        return;
      }
    }

    if (step === 5 && !hasExistingOwner) {
      if (!ownerEmail.trim() || !ownerPassword.trim()) {
        toast.error("Please configure the Owner account email and password.");
        return;
      }
      if (ownerPassword.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }
      if (ownerPassword !== ownerPasswordConfirm) {
        toast.error("Passwords do not match. Please verify.");
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim() || undefined,
        copyrightText: copyrightText.trim() || undefined,
        primaryColor,
        accentColor,
        themeMode,
        themeRadius,
        themeFont,
        cardStyle,
        navbarStyle: "glass",
        userSignupModel: signupModel,
        logoUrl: logoUrl.trim() || undefined,
        logoDarkUrl: logoDarkUrl.trim() || undefined,
        faviconUrl: faviconUrl.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        ownerFirstName: !hasExistingOwner ? ownerFirstName.trim() : undefined,
        ownerLastName: !hasExistingOwner ? ownerLastName.trim() : undefined,
        ownerEmail: !hasExistingOwner ? ownerEmail.trim() : undefined,
        ownerPassword: !hasExistingOwner ? ownerPassword : undefined,
        socialInstagram: instagram.trim() || undefined,
        socialTwitter: twitter.trim() || undefined,
        socialSpotify: spotify.trim() || undefined,
        socialYoutube: youtube.trim() || undefined,
      };

      const res = await clientSetupWhiteLabelAction(payload);

      if (!res.success) {
        toast.error(res.message || "Failed to complete setup.");
        setIsSubmitting(false);
        return;
      }

      setLaunchSuccess(true);
      toast.success("WhiteLabel setup saved to database and portal activated!");

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      } else {
        setTimeout(() => {
          router.push("/whitelabel");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">
                WhiteLabel Setup &amp; Onboarding Wizard
              </h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                Guided 7 Steps
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure branding, dual-theme styling, registration policies, and
              the portal Owner account.
            </p>
          </div>
        </div>

        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Step {step} of {totalSteps}:{" "}
            {step === 1 && "Brand Identity & Contacts"}
            {step === 2 && "Visual Theme & Dual Mode"}
            {step === 3 && "Registration Policy"}
            {step === 4 && "Brand Assets & SEO"}
            {step === 5 && "WhiteLabel Super Admin"}
            {step === 6 && "Cloud Infrastructure & Deployment"}
            {step === 7 && "Review & Portal Activation"}
          </span>
          <span className="font-mono text-primary font-bold">
            {Math.round((step / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${(step / totalSteps) * 100}%`,
              backgroundColor: primaryColor,
            }}
          />
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <Card className="border-border/80 shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Brand Identity & Contacts */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  Step 1: Brand Identity
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Define Your Portal Brand &amp; Public Identity
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your label or distributor brand name, public support
                  contacts, and copyright information. All data is persisted to
                  the database and automatically reflected on your portal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="brandName" className="text-xs font-medium">
                    Portal / Brand Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="brandName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Music Distribution"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="tagline" className="text-xs font-medium">
                    Tagline
                  </Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Premier Independent Music Distribution & Rights"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description" className="text-xs font-medium">
                    Portal Description / Mission
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your music enterprise"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supportEmail" className="text-xs font-medium">
                    Support Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="support@yourlabel.com"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="supportPhone" className="text-xs font-medium">
                    Support Phone (Optional)
                  </Label>
                  <Input
                    id="supportPhone"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label
                    htmlFor="copyrightText"
                    className="text-xs font-medium"
                  >
                    Copyright Notice
                  </Label>
                  <Input
                    id="copyrightText"
                    value={copyrightText}
                    onChange={(e) => setCopyrightText(e.target.value)}
                    placeholder={`© ${new Date().getFullYear()} ${name || "Your Company"}. All rights reserved.`}
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Theme Customization (Dual Light/Dark Mode) */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  <Palette className="w-3.5 h-3.5" />
                  Step 2: Visual Styling &amp; Dual Mode
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Custom Colors, Typography &amp; UI Radius
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tailor your brand palette. The portal dynamically inherits
                  these tokens across navigation, buttons, and release forms.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Default Theme Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Default Theme Mode
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeMode("dark")}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                          themeMode === "dark"
                            ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" /> Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("light")}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                          themeMode === "light"
                            ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" /> Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("system")}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                          themeMode === "system"
                            ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" /> System
                      </button>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center justify-between">
                      <span>Primary Brand Color</span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {primaryColor}
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {PRESET_PRIMARY_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setPrimaryColor(c.hex)}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                            primaryColor === c.hex
                              ? "border-foreground scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {primaryColor === c.hex && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                        title="Custom Color"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center justify-between">
                      <span>Accent Color</span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        {accentColor}
                      </span>
                    </Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {PRESET_ACCENT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setAccentColor(c.hex)}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                            accentColor === c.hex
                              ? "border-foreground scale-110 shadow-md"
                              : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {accentColor === c.hex && (
                            <Check className="w-3.5 h-3.5 text-zinc-950" />
                          )}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                        title="Custom Accent Color"
                      />
                    </div>
                  </div>

                  {/* Corner Radius & Font */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Border Radius
                      </Label>
                      <select
                        value={themeRadius}
                        onChange={(e) => setThemeRadius(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground"
                      >
                        {RADIUS_OPTIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Font Family</Label>
                      <select
                        value={themeFont}
                        onChange={(e) => setThemeFont(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground"
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Interactive Preview Card */}
                <div className="p-5 rounded-2xl border border-border/80 bg-muted/30 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/70 pb-2">
                      <span className="font-semibold text-foreground">
                        Live Component Preview
                      </span>
                      <span className="font-mono text-[11px]">
                        {themeFont} &bull; {themeRadius}
                      </span>
                    </div>

                    <div
                      className="p-4 rounded-xl border border-border/70 shadow-sm space-y-3 transition-all"
                      style={{
                        borderRadius: themeRadius,
                        backgroundColor:
                          themeMode === "light" ? "#ffffff" : "#0d1117",
                        color: themeMode === "light" ? "#09090b" : "#f4f4f5",
                        fontFamily: themeFont,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{
                              backgroundColor: primaryColor,
                              borderRadius: themeRadius,
                            }}
                          >
                            <Music className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-tight">
                              {name || "Your Brand Portal"}
                            </div>
                            <div className="text-[10px] opacity-60">
                              Catalog Release v2.4
                            </div>
                          </div>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-full"
                          style={{
                            backgroundColor: `${primaryColor}20`,
                            color: primaryColor,
                          }}
                        >
                          Active
                        </span>
                      </div>

                      <p className="text-xs opacity-80 leading-relaxed">
                        Artists and partners will experience this custom design
                        palette on their personal portal dashboards.
                      </p>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                          style={{
                            backgroundColor: primaryColor,
                            borderRadius: themeRadius,
                          }}
                        >
                          Primary Action
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold border"
                          style={{
                            borderRadius: themeRadius,
                            borderColor:
                              themeMode === "light" ? "#e4e4e7" : "#27272a",
                            color: accentColor,
                          }}
                        >
                          Accent Action
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground pt-3">
                    Tokens sync automatically through CSS variables without
                    modifying source files.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Registration Policy */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  Step 3: Registration Policy
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Creator &amp; Artist Onboarding Control
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose how independent artists, labels, and creators register
                  on your portal domain.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Invite Only */}
                <div
                  onClick={() =>
                    setSignupModel(WhiteLabelSignupModel.INVITE_ONLY)
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative ${
                    signupModel === WhiteLabelSignupModel.INVITE_ONLY
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    {signupModel === WhiteLabelSignupModel.INVITE_ONLY && (
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Invite Only
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Only administrators can generate and issue private signup
                      invites. Public registration is disabled.
                    </p>
                  </div>
                  <Badge className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30">
                    Recommended for Labels
                  </Badge>
                </div>

                {/* 2. Admin Approval */}
                <div
                  onClick={() =>
                    setSignupModel(WhiteLabelSignupModel.ADMIN_APPROVAL)
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative ${
                    signupModel === WhiteLabelSignupModel.ADMIN_APPROVAL
                      ? "border-blue-500 bg-blue-500/10 shadow-sm"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    {signupModel === WhiteLabelSignupModel.ADMIN_APPROVAL && (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Admin Approval
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Creators can register, but accounts remain locked pending
                      verification and approval by staff.
                    </p>
                  </div>
                  <Badge className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30">
                    Best for Vetting
                  </Badge>
                </div>

                {/* 3. Open Registration */}
                <div
                  onClick={() =>
                    setSignupModel(WhiteLabelSignupModel.OPEN_REGISTRATION)
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition-all space-y-3 relative ${
                    signupModel === WhiteLabelSignupModel.OPEN_REGISTRATION
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    {signupModel ===
                      WhiteLabelSignupModel.OPEN_REGISTRATION && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Open Registration
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Any creator can register, confirm their email, and
                      immediately upload tracks and view analytics.
                    </p>
                  </div>
                  <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30">
                    Self-Serve Platform
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Brand Assets & SEO */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  Step 4: Brand Assets &amp; SEO
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Logos, Favicons &amp; Social Links
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Provide asset URLs. If you prefer to upload files directly,
                  you can also use the Branding asset uploader in the Platform
                  Console after setup.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-xs font-medium">
                    Light Mode Logo URL
                  </Label>
                  <Input
                    id="logoUrl"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://cdn.example.com/logo-light.png"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logoDarkUrl" className="text-xs font-medium">
                    Dark Mode Logo URL
                  </Label>
                  <Input
                    id="logoDarkUrl"
                    value={logoDarkUrl}
                    onChange={(e) => setLogoDarkUrl(e.target.value)}
                    placeholder="https://cdn.example.com/logo-dark.png"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="faviconUrl" className="text-xs font-medium">
                    Favicon URL (.ico / .png)
                  </Label>
                  <Input
                    id="faviconUrl"
                    value={faviconUrl}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://cdn.example.com/favicon.ico"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bannerUrl" className="text-xs font-medium">
                    Hero Banner URL (Optional)
                  </Label>
                  <Input
                    id="bannerUrl"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://cdn.example.com/banner.jpg"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-xs font-medium">
                    Instagram Handle / URL
                  </Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/yourlabel"
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="twitter" className="text-xs font-medium">
                    Twitter / X Handle / URL
                  </Label>
                  <Input
                    id="twitter"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://x.com/yourlabel"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: WhiteLabel Super Admin / Owner Creation */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Step 5: Super Admin Account
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Create Your WhiteLabel Portal Owner
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every WhiteLabel portal requires a designated Super Admin user
                  (role: OWNER) in the portal database to manage artists,
                  releases, staff roles, and catalog contracts.
                </p>
              </div>

              {hasExistingOwner ? (
                <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-foreground">
                      Owner Account Already Provisioned
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An Owner user is already registered for this WhiteLabel in
                    the database. You can proceed directly to the next step.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="text-xs text-foreground font-medium">
                      Convenience Auto-Fill:
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutofillOwner}
                      className="text-xs h-7 gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Use My Platform Profile
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ownerFirstName"
                        className="text-xs font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="ownerFirstName"
                        value={ownerFirstName}
                        onChange={(e) => setOwnerFirstName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ownerLastName"
                        className="text-xs font-medium"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="ownerLastName"
                        value={ownerLastName}
                        onChange={(e) => setOwnerLastName(e.target.value)}
                        placeholder="e.g. Rivera"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <Label
                        htmlFor="ownerEmail"
                        className="text-xs font-medium"
                      >
                        Owner Login Email{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="admin@yourbrand.com"
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ownerPassword"
                        className="text-xs font-medium"
                      >
                        Password (Min 8 chars){" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="ownerPassword"
                          type={showPassword ? "text" : "password"}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="••••••••"
                          className="text-xs h-9 pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="ownerPasswordConfirm"
                        className="text-xs font-medium"
                      >
                        Confirm Password{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ownerPasswordConfirm"
                        type={showPassword ? "text" : "password"}
                        value={ownerPasswordConfirm}
                        onChange={(e) =>
                          setOwnerPasswordConfirm(e.target.value)
                        }
                        placeholder="••••••••"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: Cloud Infrastructure & Deployment */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  Step 6: Cloud Infrastructure &amp; Deployment
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Deploy Your WhiteLabel Portal
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose between automated multi-cloud provisioning (AWS EC2 +
                  Elastic IP + S3 + SES + Cloudflare) or self-hosting via
                  minimal environment variables.
                </p>
              </div>

              {/* Deployment Strategy Switcher */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeploymentMode("automated")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    deploymentMode === "automated"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-border/80 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Automated Cloud Provisioning
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                      Recommended
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    Zero manual DevOps. Automatically launches an EC2 instance,
                    allocates an Elastic IP, creates S3 Audio Vault, registers
                    SES DKIM DNS records, and sets up Cloudflare Edge SSL.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeploymentMode("manual")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    deploymentMode === "manual"
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                      : "border-border/80 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Server className="w-4 h-4 text-blue-500" />
                      Self-Hosted / Manual Bundle
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Advanced
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    Host on your own VPS, Docker container, or Vercel server.
                    Requires only 3 environment variables with all database
                    loading handled dynamically.
                  </p>
                </button>
              </div>

              {/* AUTOMATED CLOUD PROVISIONING SECTION */}
              {deploymentMode === "automated" && (
                <div className="space-y-4">
                  {isProvisioningActive ? (
                    <div className="space-y-3">
                      <ClientCloudProvisioningTerminal
                        onSuccess={(domain) => {
                          setDeployedDomain(domain);
                          setIsProvisioningDone(true);
                          toast.success(
                            `Infrastructure live at https://${domain}`,
                          );
                        }}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsProvisioningActive(false)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Modify Credentials
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-border bg-card space-y-5">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                        <Cpu className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          AWS &amp; Cloudflare Credentials (Secure Pre-flight)
                        </span>
                      </div>

                      {/* AWS Credentials */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                          <span>1. AWS Infrastructure Credentials</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label
                              htmlFor="awsAccessKeyId"
                              className="text-xs font-medium"
                            >
                              AWS Access Key ID{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="awsAccessKeyId"
                              value={awsAccessKeyId}
                              onChange={(e) =>
                                setAwsAccessKeyId(e.target.value)
                              }
                              placeholder="AKIAIOSFODNN7EXAMPLE"
                              className="text-xs h-9 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="awsSecretAccessKey"
                              className="text-xs font-medium"
                            >
                              AWS Secret Access Key{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="awsSecretAccessKey"
                                type={showAwsSecret ? "text" : "password"}
                                value={awsSecretAccessKey}
                                onChange={(e) =>
                                  setAwsSecretAccessKey(e.target.value)
                                }
                                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                                className="text-xs h-9 font-mono pr-9"
                              />
                              <button
                                type="button"
                                onClick={() => setShowAwsSecret(!showAwsSecret)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showAwsSecret ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="awsRegion"
                              className="text-xs font-medium"
                            >
                              AWS Deployment Region
                            </Label>
                            <select
                              id="awsRegion"
                              value={awsRegion}
                              onChange={(e) => setAwsRegion(e.target.value)}
                              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="us-east-1">
                                us-east-1 (US East, N. Virginia)
                              </option>
                              <option value="us-west-2">
                                us-west-2 (US West, Oregon)
                              </option>
                              <option value="eu-west-1">
                                eu-west-1 (Europe, Ireland)
                              </option>
                              <option value="ap-southeast-1">
                                ap-southeast-1 (Asia Pacific, Singapore)
                              </option>
                              <option value="ap-south-1">
                                ap-south-1 (Asia Pacific, Mumbai)
                              </option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="instanceType"
                              className="text-xs font-medium"
                            >
                              EC2 Compute Profile
                            </Label>
                            <select
                              id="instanceType"
                              value={instanceType}
                              onChange={(e) => setInstanceType(e.target.value)}
                              className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="t4g.medium">
                                t4g.medium (ARM64 Graviton - Recommended, 2
                                vCPU, 4GB RAM)
                              </option>
                              <option value="t4g.large">
                                t4g.large (ARM64 Graviton - High Performance, 2
                                vCPU, 8GB RAM)
                              </option>
                              <option value="t3.medium">
                                t3.medium (x86_64 Intel, 2 vCPU, 4GB RAM)
                              </option>
                              <option value="t3.large">
                                t3.large (x86_64 Intel, 2 vCPU, 8GB RAM)
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Cloudflare Authoritative DNS */}
                      <div className="space-y-3 pt-3 border-t border-border/60">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-amber-500" />
                          <span>2. Cloudflare Authoritative DNS</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label
                              htmlFor="cloudflareApiToken"
                              className="text-xs font-medium"
                            >
                              Cloudflare API Token{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="cloudflareApiToken"
                                type={showCfToken ? "text" : "password"}
                                value={cloudflareApiToken}
                                onChange={(e) =>
                                  setCloudflareApiToken(e.target.value)
                                }
                                placeholder="Edit Zone DNS API Token"
                                className="text-xs h-9 font-mono pr-9"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCfToken(!showCfToken)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showCfToken ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="cloudflareZoneId"
                              className="text-xs font-medium"
                            >
                              Cloudflare Zone ID{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="cloudflareZoneId"
                              value={cloudflareZoneId}
                              onChange={(e) =>
                                setCloudflareZoneId(e.target.value)
                              }
                              placeholder="32 hex character Zone ID"
                              className="text-xs h-9 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="cloudflareBaseDomain"
                              className="text-xs font-medium"
                            >
                              Base Domain{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="cloudflareBaseDomain"
                              value={cloudflareBaseDomain}
                              onChange={(e) =>
                                setCloudflareBaseDomain(e.target.value)
                              }
                              placeholder="royalmotionit.com"
                              className="text-xs h-9 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="portalSubdomain"
                              className="text-xs font-medium"
                            >
                              Portal Subdomain Prefix
                            </Label>
                            <Input
                              id="portalSubdomain"
                              value={portalSubdomain}
                              onChange={(e) =>
                                setPortalSubdomain(e.target.value)
                              }
                              placeholder="backstage"
                              className="text-xs h-9 font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Target: {portalSubdomain || "backstage"}.
                              {cloudflareBaseDomain || "yourdomain.com"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Validation Banner */}
                      {cloudValidationResult && (
                        <div
                          className={`p-3.5 rounded-lg border text-xs leading-relaxed space-y-1.5 ${
                            cloudValidationResult.isValid
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }`}
                        >
                          <div className="flex items-center gap-2 font-bold">
                            {cloudValidationResult.isValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                            )}
                            <span>
                              {cloudValidationResult.isValid
                                ? "Credentials Validated Successfully"
                                : "Credentials Verification Failed"}
                            </span>
                          </div>
                          {cloudValidationResult.isValid ? (
                            <div className="text-[11px] text-muted-foreground font-mono space-y-0.5">
                              <div>AWS STS IAM: Verified &amp; Active</div>
                              <div>Cloudflare Zone: Verified &amp; Active</div>
                              {cloudValidationResult.details?.map(
                                (detail, idx) => (
                                  <div key={idx}>• {detail}</div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] font-sans">
                              {cloudValidationResult.error}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleValidateCloudCredentials}
                          disabled={isValidatingCloud}
                          className="text-xs h-9 gap-1.5"
                        >
                          {isValidatingCloud ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Validating IAM &amp; Cloudflare...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                              Pre-flight Validate Credentials
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleStartCloudProvisioning}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Launch Automated Cloud Infrastructure
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MANUAL SELF-HOSTED SECTION */}
              {deploymentMode === "manual" && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <KeyRound className="w-4 h-4 text-primary" />
                      WhiteLabel Hosting Environment (.env)
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyEnvSnippet}
                      className="text-xs h-7 gap-1 font-mono"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy .env
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto text-foreground">
                    <pre className="text-[11px] leading-relaxed">
                      {envSnippet}
                    </pre>
                  </div>

                  <div className="text-[11px] text-muted-foreground leading-normal">
                    Paste these 3 variables into your WhiteLabel frontend{" "}
                    <code className="text-foreground">.env</code>. Once
                    activated, the frontend communicates with the platform
                    database and unlocks the portal automatically.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Review & Portal Activation */}
          {step === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Step 7: Launch &amp; Activation
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Review &amp; Activate Your WhiteLabel Portal
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Review your settings below. Clicking &quot;Save Configuration
                  &amp; Activate WhiteLabel&quot; will persist all
                  configurations into the database, create the Owner user, and
                  unlock your live portal.
                </p>
              </div>

              {/* Summary Box */}
              <div className="p-5 rounded-xl border border-border bg-muted/40 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Brand Name:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {name || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Support Email:
                    </span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {supportEmail}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registration:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {signupModel}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Theme Mode:</span>
                    <div className="font-semibold text-foreground mt-0.5 capitalize">
                      {themeMode}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Primary Color:
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="font-mono text-foreground">
                        {primaryColor}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Super Admin:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {hasExistingOwner
                        ? "Existing Owner"
                        : ownerEmail || "Configured"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deployment:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {deploymentMode === "automated"
                        ? "AWS + Cloudflare (Automated)"
                        : "Self-Hosted Bundle"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Infrastructure:
                    </span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {deploymentMode === "automated"
                        ? `EC2 (${instanceType}) + EIP + S3`
                        : "Custom Server"}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/80 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Portal Host Target:</span>
                  <span className="font-mono text-primary font-semibold">
                    {deployedDomain ? `https://${deployedDomain}` : portalHost}
                  </span>
                </div>
              </div>

              {launchSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-foreground">
                    WhiteLabel Setup Complete &amp; Portal Active!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All configuration has been stored in your platform database.
                    Redirecting to overview...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-border/70 flex items-center justify-between">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                disabled={isSubmitting || launchSuccess}
                className="text-xs h-9 gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                size="sm"
                onClick={handleNext}
                style={{ backgroundColor: primaryColor }}
                className="text-xs h-9 text-white font-semibold gap-1.5 shadow-sm hover:opacity-90"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || launchSuccess}
                style={{ backgroundColor: primaryColor }}
                className="text-xs h-9 text-white font-semibold gap-1.5 shadow-sm hover:opacity-90"
              >
                {isSubmitting ? (
                  "Saving Configuration..."
                ) : launchSuccess ? (
                  "Activated!"
                ) : (
                  <>
                    Save Configuration &amp; Activate WhiteLabel
                    <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
