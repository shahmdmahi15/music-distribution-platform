"use client";

import { useState, useEffect } from "react";
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
  Shield,
  ShieldCheck,
  UserPlus,
  Cloud,
  HardDrive,
  Cpu,
  RefreshCw,
  Terminal,
  Zap,
  AlertTriangle,
  Upload,
  Trash2,
  Image as ImageIcon,
  FileText,
  Layers,
  Radio,
  Share2,
  Disc,
  Network,
  Briefcase,
  Award,
  Headphones,
  Loader2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  WhiteLabelBranding,
  WhiteLabelSignupModel,
  WhiteLabelBusinessType,
  ProvisioningStatus,
} from "@/types/whitelabel";
import {
  clientSetupWhiteLabelAction,
  ClientSetupWhiteLabelInput,
} from "@/actions/client/whitelabel/client-setup-whitelabel.action";
import { clientUploadBrandingAssetAction } from "@/actions/client/whitelabel/client-upload-branding-asset.action";
import { clientCreateApiKeyAction } from "@/actions/client/whitelabel/client-api-keys.action";
import {
  clientValidateCloudCredentialsAction,
  clientStartCloudProvisioningAction,
  clientSaveCloudCredentialsAction,
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

const RADIUS_OPTIONS = [
  { id: "0.25rem", label: "Sharp (0.25rem)" },
  { id: "0.5rem", label: "Modern (0.5rem)" },
  { id: "0.75rem", label: "Smooth (0.75rem)" },
  { id: "1.25rem", label: "Pill / Round (1.25rem)" },
];

const AWS_IAM_LEAST_PRIVILEGE_POLICY = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RMITWhiteLabelProvisioning",
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "s3:*",
        "ses:*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}`;

export function ClientWhiteLabelSetupWizard({
  branding,
  user,
  latestKeyPrefix,
  onSuccess,
  onCancel,
}: ClientWhiteLabelSetupWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  const isAlreadyConfigured = Boolean(
    branding.isSetupComplete ||
      branding.isSetupCompleted ||
      branding.status === "ACTIVE",
  );
  const [showWizard, setShowWizard] = useState(!isAlreadyConfigured);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Form State - Brand name is permanent and immutable from the tenant contract
  const name = branding.name || "";
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

  // Dynamically inject Google Fonts for real-time live component preview
  useEffect(() => {
    const MASTER_LINK_ID = "whitelabel-wizard-google-fonts";
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

    if (typeof document !== "undefined" && themeFont) {
      const activeFontId = `google-font-active-${themeFont.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
      if (!document.getElementById(activeFontId)) {
        const link = document.createElement("link");
        link.id = activeFontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${themeFont.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [themeFont]);

  // Business Type Archetype (Record Label, Distributor/Aggregator, Music Publisher, Referrer)
  const [businessType, setBusinessType] = useState<WhiteLabelBusinessType>(
    branding.businessType || WhiteLabelBusinessType.RECORD_LABEL,
  );

  // Business Type Specific Operational Parameters
  // 1. Record Label
  const [isrcPrefix, setIsrcPrefix] = useState("QM");
  const [catalogPrefix, setCatalogPrefix] = useState(
    `${branding.code ? branding.code.slice(0, 4).toUpperCase() : "RM"}-CAT`,
  );
  const [pLineText, setPLineText] = useState(
    `℗ ${new Date().getFullYear()} ${branding.name || "Royal Music"}. All master recording rights reserved.`,
  );

  // 2. Distributor / Aggregator
  const [aggregationCapacity, setAggregationCapacity] = useState("unlimited");
  const [commissionRate, setCommissionRate] = useState("15");
  const [deliveryProtocol, setDeliveryProtocol] = useState("DDEX_ERN_38");

  // 3. Music Publisher
  const [ipiCaeNumber, setIpiCaeNumber] = useState("");
  const [primaryPro, setPrimaryPro] = useState("BMI");
  const [cLineText, setCLineText] = useState(
    `© ${new Date().getFullYear()} ${branding.name || "Royal Music"} Publishing. All composition rights reserved.`,
  );

  // 4. Referrer / Agency Partner
  const [referralNetworkCode, setReferralNetworkCode] = useState(
    `${branding.code ? branding.code.slice(0, 4).toUpperCase() : "AGY"}-SCOUT`,
  );
  const [attributionWindowDays, setAttributionWindowDays] = useState("60");
  const [commissionBounty, setCommissionBounty] = useState("10");

  // Registration Model
  const [signupModel, setSignupModel] = useState<WhiteLabelSignupModel>(
    branding.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
  );

  // Brand Assets & S3 Uploading State
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl || "");
  const [logoDarkUrl, setLogoDarkUrl] = useState(branding.logoDarkUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(branding.faviconUrl || "");
  const [bannerUrl, setBannerUrl] = useState(branding.bannerUrl || "");
  const [assetImgErrors, setAssetImgErrors] = useState<Record<string, boolean>>({});
  const [assetCacheBuster, setAssetCacheBuster] = useState<number>(() => Date.now());

  // Comprehensive Social Links & Online Presence
  const [instagram, setInstagram] = useState(branding.socialInstagram || "");
  const [twitter, setTwitter] = useState(branding.socialTwitter || "");
  const [youtube, setYoutube] = useState(branding.socialYoutube || "");
  const [spotify, setSpotify] = useState(branding.socialSpotify || "");
  const [tiktok, setTiktok] = useState(branding.socialTiktok || "");
  const [facebook, setFacebook] = useState(branding.socialFacebook || "");
  const [linkedin, setLinkedin] = useState(branding.socialLinkedin || "");
  const [website, setWebsite] = useState(branding.companyWebsite || "");

  // S3 Asset Upload Handler with Strict File Type & Capacity Enforcement (up to 100MB)
  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_EXTENSIONS: Record<string, string[]> = {
      logo: [".png", ".svg", ".webp", ".jpg", ".jpeg"],
      logoDark: [".png", ".svg", ".webp", ".jpg", ".jpeg"],
      favicon: [".ico", ".png", ".svg", ".webp"],
      banner: [".jpg", ".jpeg", ".png", ".webp", ".svg"],
    };

    const ALLOWED_MIME_TYPES: Record<string, string[]> = {
      logo: ["image/png", "image/svg+xml", "image/webp", "image/jpeg", "image/jpg"],
      logoDark: ["image/png", "image/svg+xml", "image/webp", "image/jpeg", "image/jpg"],
      favicon: ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml", "image/webp"],
      banner: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"],
    };

    const MAX_SIZES_BYTES: Record<string, number> = {
      logo: 25 * 1024 * 1024, // 25MB
      logoDark: 25 * 1024 * 1024, // 25MB
      favicon: 5 * 1024 * 1024, // 5MB
      banner: 100 * 1024 * 1024, // 100MB
    };

    const allowedMimes = ALLOWED_MIME_TYPES[assetType] || ALLOWED_MIME_TYPES.logo;
    const allowedExts = ALLOWED_EXTENSIONS[assetType] || ALLOWED_EXTENSIONS.logo;
    const fileExt = "." + (file.name.split(".").pop() || "").toLowerCase();
    const fileMime = (file.type || "").toLowerCase();

    const isMimeValid = allowedMimes.includes(fileMime);
    const isExtValid = allowedExts.includes(fileExt);

    if (!isMimeValid && !isExtValid) {
      toast.error(
        `Invalid file format for ${assetType}. Allowed types: ${allowedExts.join(", ")}`,
      );
      e.target.value = "";
      return;
    }

    const maxAllowed = MAX_SIZES_BYTES[assetType] || 100 * 1024 * 1024;
    if (file.size > maxAllowed) {
      const maxMb = Math.round(maxAllowed / (1024 * 1024));
      toast.error(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds limit of ${maxMb}MB for ${assetType}.`,
      );
      e.target.value = "";
      return;
    }

    setUploadingAsset(assetType);
    const toastId = toast.loading(`Uploading ${assetType} to S3 storage...`);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("assetType", assetType);

      const res = await clientUploadBrandingAssetAction(uploadFormData);
      if (res.success && res.assetUrl) {
        toast.success(
          res.message || `${assetType} uploaded to S3 successfully!`,
          { id: toastId },
        );
        const newBuster = Date.now();
        setAssetCacheBuster(newBuster);
        setAssetImgErrors((p) => ({ ...p, [assetType]: false }));
        if (assetType === "logo") setLogoUrl(res.assetUrl);
        else if (assetType === "logoDark") setLogoDarkUrl(res.assetUrl);
        else if (assetType === "favicon") setFaviconUrl(res.assetUrl);
        else if (assetType === "banner") setBannerUrl(res.assetUrl);
      } else {
        toast.error(res.message || `Failed to upload ${assetType}.`, {
          id: toastId,
        });
      }
    } catch {
      toast.error(`Error uploading ${assetType} to S3.`, { id: toastId });
    } finally {
      setUploadingAsset(null);
      e.target.value = "";
    }
  };

  // Owner Account Creation
  const [ownerFirstName, setOwnerFirstName] = useState(user.firstName || "");
  const [ownerLastName, setOwnerLastName] = useState(user.lastName || "");
  const [ownerEmail, setOwnerEmail] = useState(user.email || "");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 6: Production API Key Provisioning
  const [generatedRawApiKey, setGeneratedRawApiKey] = useState<string | null>(
    null,
  );
  const [currentKeyPrefix, setCurrentKeyPrefix] = useState<string | undefined>(
    latestKeyPrefix,
  );
  const [apiKeyLabel, setApiKeyLabel] = useState("Production Portal Key");
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIamPolicy, setCopiedIamPolicy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchSuccess, setLaunchSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const hasExistingOwner = branding.hasOwner ?? false;
  const isBusinessTypeLocked = Boolean(branding.businessType);

  const portalHost = branding.customDomain
    ? `https://${branding.customDomain}`
    : branding.subdomain
      ? `https://${branding.subdomain}.platform.royalmotionit.com`
      : "https://platform.royalmotionit.com";

  const displayApiKey =
    generatedRawApiKey ||
    (currentKeyPrefix
      ? `${currentKeyPrefix}...`
      : "<Will auto-generate on activation>");

  const envSnippet = `# WhiteLabel Portal (.env)
API_BASE_URL="https://api.royalmotionit.com"
API_KEY="${displayApiKey}"
INTERNAL_API_SECRET="rmit_internal_${branding.code.toLowerCase().replace(/[^a-z0-9]/g, "_")}_live"
PORT=3000
NODE_ENV=production`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedSnippet(true);
    toast.success("Hosting environment snippet copied to clipboard");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleGenerateWizardApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await clientCreateApiKeyAction({
        name: apiKeyLabel.trim() || "Production Portal Key",
        scopes: [
          "tenant:read",
          "releases:write",
          "users:manage",
          "royalties:read",
        ],
      });
      if (res.success && res.secretKey) {
        setGeneratedRawApiKey(res.secretKey);
        setCurrentKeyPrefix(res.key?.prefix || res.secretKey.slice(0, 14));
        toast.success(
          "Production API Key generated! Copy and store it securely.",
        );
      } else {
        toast.error(res.message || "Failed to generate API key.");
      }
    } catch {
      toast.error("Error generating API key.");
    } finally {
      setIsGeneratingKey(false);
    }
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
  const [awsAccessKeyId, setAwsAccessKeyId] = useState(
    branding.awsAccessKeyId || "",
  );
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState(
    branding.awsSecretAccessKey || "",
  );
  const [awsRegion, setAwsRegion] = useState(
    branding.awsRegion || "ap-southeast-1",
  );
  const [instanceType, setInstanceType] = useState(
    branding.awsInstanceType || "t4g.medium",
  );
  const [bucketName, setBucketName] = useState(
    branding.bucketName ||
      `rmit-music-${branding.code.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
  );
  const [senderEmail, setSenderEmail] = useState(
    branding.senderEmail ||
      (branding.cloudflareBaseDomain
        ? `noreply@mail.${branding.cloudflareBaseDomain.toLowerCase()}`
        : "noreply@mail.yourdomain.com"),
  );
  const [elasticIpv4, setElasticIpv4] = useState(
    branding.awsElasticIp || branding.elasticIpv4 || "",
  );
  const [showAwsSecret, setShowAwsSecret] = useState(false);

  const [cloudflareApiToken, setCloudflareApiToken] = useState(
    branding.cloudflareApiToken || "",
  );
  const [cloudflareZoneId, setCloudflareZoneId] = useState(
    branding.cloudflareZoneId || "",
  );
  const [cloudflareBaseDomain, setCloudflareBaseDomain] = useState(
    branding.cloudflareBaseDomain || "",
  );
  const [cloudflareOriginCert, setCloudflareOriginCert] = useState(
    branding.cloudflareOriginCert || "",
  );
  const [cloudflareOriginKey, setCloudflareOriginKey] = useState(
    branding.cloudflareOriginKey || "",
  );
  const [showOriginCertInputs, setShowOriginCertInputs] = useState(
    Boolean(branding.cloudflareOriginCert && branding.cloudflareOriginKey),
  );
  const [recreateInstance, setRecreateInstance] = useState(false);
  // Subdomain is permanently locked to "backstage"
  const portalSubdomain = "backstage";
  const [showCfToken, setShowCfToken] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const handleBaseDomainChange = (val: string) => {
    const clean = val.trim().toLowerCase();
    setCloudflareBaseDomain(clean);
    if (!senderEmail || senderEmail.includes("@mail.")) {
      setSenderEmail(`noreply@mail.${clean || "yourdomain.com"}`);
    }
  };

  const handleSaveCloudCredentials = async () => {
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

    setIsSavingCredentials(true);
    try {
      const res = await clientSaveCloudCredentialsAction({
        awsAccessKeyId: awsAccessKeyId.trim(),
        awsSecretAccessKey: awsSecretAccessKey.trim(),
        awsRegion,
        instanceType,
        bucketName: bucketName.trim() || undefined,
        senderEmail: senderEmail.trim() || undefined,
        cloudflareApiToken: cloudflareApiToken.trim(),
        cloudflareZoneId: cloudflareZoneId.trim(),
        cloudflareBaseDomain: cloudflareBaseDomain.trim().toLowerCase(),
        subdomain: "backstage",
        elasticIpv4: elasticIpv4.trim() || undefined,
        cloudflareOriginCert: cloudflareOriginCert.trim() || undefined,
        cloudflareOriginKey: cloudflareOriginKey.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          "AWS and Cloudflare credentials saved securely to your tenant profile!",
        );
      } else {
        toast.error(res.message || "Failed to save cloud credentials.");
      }
    } catch (err: any) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save credentials.",
      );
    } finally {
      setIsSavingCredentials(false);
    }
  };

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
        bucketName: bucketName.trim() || undefined,
        senderEmail: senderEmail.trim() || undefined,
        cloudflareApiToken: cloudflareApiToken.trim(),
        cloudflareZoneId: cloudflareZoneId.trim(),
        cloudflareBaseDomain: cloudflareBaseDomain.trim().toLowerCase(),
        subdomain: "backstage",
        elasticIpv4: elasticIpv4.trim() || undefined,
        cloudflareOriginCert: cloudflareOriginCert.trim() || undefined,
        cloudflareOriginKey: cloudflareOriginKey.trim() || undefined,
        recreateInstance,
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
      if (!supportPhone.trim()) {
        toast.error("Please enter a valid Support Phone number.");
        return;
      }
    }

    if (step === 4) {
      if (!logoUrl.trim()) {
        toast.error("Light Mode Brand Logo is mandatory. Please upload your brand logo.");
        return;
      }
      if (!logoDarkUrl.trim()) {
        toast.error("Dark Mode Brand Logo is mandatory. Please upload your dark mode brand logo.");
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
    if (!logoUrl.trim()) {
      toast.error("Light Mode Brand Logo is mandatory. Please upload your logo in Step 4.");
      setStep(4);
      return;
    }
    if (!logoDarkUrl.trim()) {
      toast.error("Dark Mode Brand Logo is mandatory. Please upload your dark mode logo in Step 4.");
      setStep(4);
      return;
    }

    setIsSubmitting(true);
    try {
      const computedCustomDomain =
        deployedDomain ||
        (cloudflareBaseDomain.trim()
          ? `${portalSubdomain.trim() || "backstage"}.${cloudflareBaseDomain.trim().toLowerCase()}`
          : undefined);

      const payload: ClientSetupWhiteLabelInput = {
        name: name.trim(),
        businessType,
        companyWebsite: website.trim() || undefined,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
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
        socialTiktok: tiktok.trim() || undefined,
        socialFacebook: facebook.trim() || undefined,
        socialLinkedin: linkedin.trim() || undefined,
        customDomain: computedCustomDomain,
        bucketName: bucketName.trim() || undefined,
        elasticIpv4: elasticIpv4.trim() || undefined,
        cloudflareZoneId: cloudflareZoneId.trim() || undefined,
        cloudflareBaseDomain: cloudflareBaseDomain.trim().toLowerCase() || undefined,
        cloudflareApiToken: cloudflareApiToken.trim() || undefined,
        awsRegion: awsRegion || undefined,
        awsAccessKeyId: awsAccessKeyId.trim() || undefined,
        awsSecretAccessKey: awsSecretAccessKey.trim() || undefined,
        awsInstanceType: instanceType || undefined,
        senderEmail: senderEmail.trim() || undefined,
        onboardingDetails: {
          businessModel: businessType,
          ...(businessType === WhiteLabelBusinessType.RECORD_LABEL && {
            isrcPrefix: isrcPrefix.trim(),
            catalogPrefix: catalogPrefix.trim(),
            pLineText: pLineText.trim(),
          }),
          ...(businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && {
            aggregationCapacity,
            commissionRate: parseFloat(commissionRate) || 15,
            deliveryProtocol,
          }),
          ...(businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && {
            ipiCaeNumber: ipiCaeNumber.trim(),
            primaryPro,
            cLineText: cLineText.trim(),
          }),
          ...(businessType === WhiteLabelBusinessType.REFERRER && {
            referralNetworkCode: referralNetworkCode.trim(),
            attributionWindowDays: parseInt(attributionWindowDays) || 60,
            commissionBounty: parseFloat(commissionBounty) || 10,
          }),
        },
      };

      const res = await clientSetupWhiteLabelAction(payload);

      if (!res.success) {
        toast.error(res.message || "Failed to complete setup.");
        setIsSubmitting(false);
        return;
      }

      if (res.generatedApiKey) {
        setGeneratedRawApiKey(res.generatedApiKey);
      }

      setLaunchSuccess(true);
      setShowWizard(false);
      toast.success(
        "WhiteLabel setup completed! Full WhiteLabel Command Center unlocked.",
      );

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1800);
      } else {
        setTimeout(() => {
          router.push("/whitelabel");
          router.refresh();
        }, 1800);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsSubmitting(false);
    }
  };

  const WIZARD_STEPS = [
    { num: 1, short: "Identity", title: "Brand Identity & Contacts" },
    { num: 2, short: "Theme", title: "Visual Theme & Dual Mode" },
    { num: 3, short: "Access", title: "Registration Policy" },
    { num: 4, short: "Assets", title: "Brand Assets & SEO" },
    { num: 5, short: "Owner", title: "WhiteLabel Super Admin" },
    { num: 6, short: "API Keys", title: "API Keys & Engine Auth" },
    { num: 7, short: "AWS & Cloudflare", title: "AWS & Cloudflare Deployment" },
    { num: 8, short: "Launch", title: "Review & Unlock Console" },
  ];

  if (!showWizard && isAlreadyConfigured) {
    const activeCustomDomain =
      branding.customDomain ||
      (cloudflareBaseDomain
        ? `backstage.${cloudflareBaseDomain.toLowerCase()}`
        : "");
    const baseDomain =
      cloudflareBaseDomain ||
      branding.cloudflareBaseDomain ||
      (activeCustomDomain
        ? activeCustomDomain.replace(/^backstage\./, "")
        : "");
    const portalUrl = activeCustomDomain
      ? activeCustomDomain.startsWith("http")
        ? activeCustomDomain
        : `https://${activeCustomDomain}`
      : baseDomain
      ? `https://backstage.${baseDomain}`
      : "https://backstage.platform.royalmotionit.com";

    const mailDomain = baseDomain
      ? `mail.${baseDomain}`
      : activeCustomDomain
      ? `mail.${activeCustomDomain.replace(/^backstage\./, "")}`
      : "mail.royalmusic.io";
    const mailSender =
      senderEmail || branding.senderEmail || `noreply@${mailDomain}`;
    const activeBucket =
      bucketName || branding.bucketName || "rmit-mother-platform-vault";
    const activeRegion = awsRegion || branding.awsRegion || "ap-southeast-1";
    const activeZone =
      baseDomain ||
      (activeCustomDomain
        ? activeCustomDomain.replace(/^backstage\./, "")
        : "royalmusic.io");
    const businessLabel =
      businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
        ? "Distributor / Aggregator"
        : businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER
        ? "Music Publisher"
        : businessType === WhiteLabelBusinessType.REFERRER
        ? "Referrer / Agency Partner"
        : "Record Label";

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* 1. Hero Status & Confirmation Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-background p-6 sm:p-8 shadow-lg">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Production • Fully Configured &amp; Active
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-border bg-background/50">
                  {businessLabel}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-border bg-background/50">
                  {branding.code || "RMIT-WL"}
                </Badge>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                  <span>{name}</span>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 inline" />
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Your WhiteLabel distribution infrastructure is fully operational. Multi-cloud AWS resources, Cloudflare edge DNS routing, dedicated SES email identities, and your custom Backstage artist portal are active and live.
                </p>
              </div>

              <div className="pt-1 flex items-center gap-2 flex-wrap">
                {portalUrl && (
                  <Button
                    render={
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 gap-2 shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Open Live Backstage Portal
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </Button>
                )}

                <Button
                  render={<Link href="/whitelabel" />}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-3 gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Console Overview
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWizard(true)}
                  className="text-xs h-9 text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-run Setup Wizard
                </Button>
              </div>
            </div>

            {/* Quick Brand Stamp Preview */}
            <div className="hidden lg:flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-background/60 backdrop-blur-sm min-w-[200px] text-center space-y-2">
              <div className="h-14 w-full flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl || branding.logoUrl || ""}
                  alt={name}
                  crossOrigin="anonymous"
                  className="max-h-full max-w-[160px] object-contain"
                />
              </div>
              <div className="text-[11px] font-semibold text-foreground truncate max-w-[160px]">
                {name}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {themeFont} &bull; {themeMode.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Connected Multi-Cloud Architecture & Live Endpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-primary" />
              Live Connected Infrastructure Endpoints
            </h2>
            <span className="text-[11px] text-emerald-500 font-mono flex items-center gap-1">
              <Check className="w-3 h-3" />
              All 4 Systems Interconnected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Portal Endpoint */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Backstage Portal</span>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-mono">SSL Active</Badge>
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate" title={portalUrl}>
                  {portalUrl.replace(/^https?:\/\//, "")}
                </div>
                <p className="text-[10px] text-muted-foreground">Primary artist login &amp; catalog distribution workspace</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(portalUrl, "Portal URL")}
                  className="text-[10px] h-6 px-2 gap-1 flex-1 font-mono"
                >
                  <Copy className="w-2.5 h-2.5" />
                  {copiedField === "Portal URL" ? "Copied" : "Copy URL"}
                </Button>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  title="Open Portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 2. Amazon SES Mailing */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Amazon SES Mail</span>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] font-mono">DKIM Wired</Badge>
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate" title={mailDomain}>
                  {mailDomain}
                </div>
                <p className="text-[10px] text-muted-foreground">Automated invites, artist verification &amp; statements</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(mailSender, "Sender Email")}
                  className="text-[10px] h-6 px-2 gap-1 flex-1 font-mono truncate"
                >
                  <Mail className="w-2.5 h-2.5" />
                  {copiedField === "Sender Email" ? "Copied" : mailSender}
                </Button>
              </div>
            </div>

            {/* 3. S3 Audio Vault */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">S3 Media Vault</span>
                  <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[9px] font-mono">CORS Online</Badge>
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate" title={activeBucket}>
                  {activeBucket}
                </div>
                <p className="text-[10px] text-muted-foreground">{activeRegion} &bull; Direct master audio &amp; brand assets</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyText(activeBucket, "S3 Bucket")}
                  className="text-[10px] h-6 px-2 gap-1 flex-1 font-mono"
                >
                  <Copy className="w-2.5 h-2.5" />
                  {copiedField === "S3 Bucket" ? "Copied" : "Copy Bucket"}
                </Button>
              </div>
            </div>

            {/* 4. Cloudflare Edge DNS */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">Cloudflare Edge</span>
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-mono">DDoS Protected</Badge>
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate" title={activeZone}>
                  {activeZone}
                </div>
                <p className="text-[10px] text-muted-foreground">Universal SSL edge proxy &amp; CNAME propagation</p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  render={<Link href="/whitelabel/domain" />}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-6 px-2 gap-1 flex-1 font-mono"
                >
                  <Globe className="w-2.5 h-2.5" />
                  DNS Records &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Direct Customization Directory (Pointing to Left Sidebar Menu) */}
        <div className="space-y-3 pt-2">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Customize &amp; Manage Your Platform from the Menu
            </h2>
            <p className="text-xs text-muted-foreground">
              Your console is fully unlocked. You can fine-tune every subsystem anytime using the left navigation menu or these direct shortcuts:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* A. Identity & Branding */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Palette className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Branding
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Identity &amp; Brand Assets</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Update primary &amp; dark mode logos, browser favicon, onboarding hero banner, support contact phone/email, and official social channels.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/branding" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Customize Branding</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* B. Theme Customizer */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Theme
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Theme &amp; Typography</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tailor primary and accent colors, select from 16 curated Google font presets, set component border radius, card style, and dark mode defaults.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/theme" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Customize Theme</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* C. Domain & DNS */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Domain &amp; DNS
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Domain &amp; DNS Management</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitor custom domain bindings, verify DKIM/SPF mail records, manage Cloudflare DNS zones, and run automated health checks.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/domain" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Manage Domains &amp; DNS</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* D. Credentials & SSO */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Credentials &amp; SSO
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Authentication &amp; Security</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure Google and GitHub OAuth credentials, enforce mandatory 2FA across all artist portals, and tune session timeouts.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/sso" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Configure SSO &amp; Security</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* E. API Keys */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; API Keys
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Production API Keys</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generate scoped API keys for automated music deliveries, DDEX ingestion engines, and external microservice integrations.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/api-keys" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Manage API Keys</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* F. Webhooks */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Radio className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Webhooks
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Webhooks &amp; Events</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Subscribe to real-time event notifications for audio uploads, DDEX delivery updates, metadata validations, and royalty payouts.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/webhooks" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Configure Webhooks</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* G. Portal Users */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all flex flex-col justify-between space-y-3 group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Menu &bull; Users
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Portal Users &amp; Team</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manage your internal staff, invite A&amp;R managers and label admins, audit active artist accounts, and control permissions.
                </p>
              </div>
              <Button
                render={<Link href="/whitelabel/users" />}
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 justify-between font-semibold group-hover:border-primary/50 group-hover:text-primary"
              >
                <span>Manage Users</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* H. Re-Run Wizard Card */}
            <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all flex flex-col justify-between space-y-3 group md:col-span-2 lg:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">
                    Full Re-Configuration
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">Re-run Full Setup Wizard</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Need to step through all 8 guided setup stages again, test alternative AWS/Cloudflare credentials, or re-run automated provisioning from scratch?
                </p>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setShowWizard(true);
                }}
                className="w-full sm:w-auto text-xs h-8 gap-2 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Launch 8-Step Setup Wizard Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Re-Configuration Back Banner */}
      {isAlreadyConfigured && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-foreground">WhiteLabel Platform Is Already Configured &amp; Active.</span>{" "}
              <span className="text-muted-foreground">You are currently in re-configuration mode.</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowWizard(false)}
            className="text-xs h-7 px-3 gap-1.5 self-start sm:self-auto font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            Return to System Status Hub
          </Button>
        </div>
      )}
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-foreground">
                Guided WhiteLabel Production &amp; Cloud Deployment Wizard
              </h1>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                8-Step End-to-End Setup
              </Badge>
              {!branding.isSetupComplete && !branding.isSetupCompleted && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                  Required to Unlock Console
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete this step-by-step guided setup for Brand Identity, Super
              Admin, Production API Keys, and Automated AWS + Cloudflare
              Deployment to unlock your full WhiteLabel console.
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

      {/* Interactive 8-Step Progress Stepper */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {WIZARD_STEPS.map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  if (item.num <= step) setStep(item.num);
                }}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-2xs"
                    : isCompleted
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer"
                      : "border-border/60 bg-card/50 opacity-70 cursor-default"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isActive
                        ? "text-primary"
                        : isCompleted
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    0{item.num}
                  </span>
                  {isCompleted && (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-foreground truncate mt-0.5">
                  {item.short}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Step {step} of {totalSteps}:{" "}
            {WIZARD_STEPS.find((s) => s.num === step)?.title}
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
          {/* STEP 1: Brand Identity & Business Model */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  Step 1: Business Model &amp; Brand Identity
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Select Business Archetype &amp; Portal Brand
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose your organization&apos;s music operating model according to global industry standards (IFPI, DDEX, CISAC). The portal will dynamically tailor its workflows, ISRC/catalog pipelines, and rights systems.
                </p>
              </div>

              {/* 4 Business Types Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Music Business Operating Model</span>
                  </Label>
                  {isBusinessTypeLocked ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-muted/60 text-muted-foreground font-mono flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      Permanent • Locked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      Permanent Once Activated
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Archetype 1: Record Label */}
                  <div
                    onClick={() => {
                      if (isBusinessTypeLocked) {
                        if (businessType !== WhiteLabelBusinessType.RECORD_LABEL) {
                          toast.info("Business operating model is permanently registered to your tenant contract and cannot be modified.");
                        }
                        return;
                      }
                      setBusinessType(WhiteLabelBusinessType.RECORD_LABEL);
                    }}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 relative flex flex-col justify-between ${
                      businessType === WhiteLabelBusinessType.RECORD_LABEL
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs cursor-default"
                        : isBusinessTypeLocked
                          ? "border-border/40 bg-muted/20 opacity-40 cursor-not-allowed"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                          <Disc className="w-4 h-4" />
                        </div>
                        {businessType === WhiteLabelBusinessType.RECORD_LABEL && (
                          <div className="flex items-center gap-1">
                            {isBusinessTypeLocked && <Lock className="w-3 h-3 text-primary" />}
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Record Label</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Master recordings, artist contracts, release schedules &amp; IFPI ISRC pipelines.
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] w-fit font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                      IFPI / RIAA Standard
                    </Badge>
                  </div>

                  {/* Archetype 2: Distributor / Aggregator */}
                  <div
                    onClick={() => {
                      if (isBusinessTypeLocked) {
                        if (businessType !== WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR) {
                          toast.info("Business operating model is permanently registered to your tenant contract and cannot be modified.");
                        }
                        return;
                      }
                      setBusinessType(WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR);
                    }}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 relative flex flex-col justify-between ${
                      businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs cursor-default"
                        : isBusinessTypeLocked
                          ? "border-border/40 bg-muted/20 opacity-40 cursor-not-allowed"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                          <Network className="w-4 h-4" />
                        </div>
                        {businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && (
                          <div className="flex items-center gap-1">
                            {isBusinessTypeLocked && <Lock className="w-3 h-3 text-primary" />}
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Distributor / Aggregator</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Multi-tenant DSP delivery, DDEX ERN batch pipelines &amp; aggregated accounting.
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] w-fit font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      DDEX ERN 3.8 / 4.2
                    </Badge>
                  </div>

                  {/* Archetype 3: Music Publisher */}
                  <div
                    onClick={() => {
                      if (isBusinessTypeLocked) {
                        if (businessType !== WhiteLabelBusinessType.MUSIC_PUBLISHER) {
                          toast.info("Business operating model is permanently registered to your tenant contract and cannot be modified.");
                        }
                        return;
                      }
                      setBusinessType(WhiteLabelBusinessType.MUSIC_PUBLISHER);
                    }}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 relative flex flex-col justify-between ${
                      businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs cursor-default"
                        : isBusinessTypeLocked
                          ? "border-border/40 bg-muted/20 opacity-40 cursor-not-allowed"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center">
                          <Headphones className="w-4 h-4" />
                        </div>
                        {businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && (
                          <div className="flex items-center gap-1">
                            {isBusinessTypeLocked && <Lock className="w-3 h-3 text-primary" />}
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Music Publisher</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          Composition rights, CWR catalog, mechanical sync licensing &amp; PRO collection.
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] w-fit font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                      CISAC / PRO / CWR
                    </Badge>
                  </div>

                  {/* Archetype 4: Referrer / Agency */}
                  <div
                    onClick={() => {
                      if (isBusinessTypeLocked) {
                        if (businessType !== WhiteLabelBusinessType.REFERRER) {
                          toast.info("Business operating model is permanently registered to your tenant contract and cannot be modified.");
                        }
                        return;
                      }
                      setBusinessType(WhiteLabelBusinessType.REFERRER);
                    }}
                    className={`p-4 rounded-xl border transition-all space-y-2.5 relative flex flex-col justify-between ${
                      businessType === WhiteLabelBusinessType.REFERRER
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs cursor-default"
                        : isBusinessTypeLocked
                          ? "border-border/40 bg-muted/20 opacity-40 cursor-not-allowed"
                          : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40 cursor-pointer"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        {businessType === WhiteLabelBusinessType.REFERRER && (
                          <div className="flex items-center gap-1">
                            {isBusinessTypeLocked && <Lock className="w-3 h-3 text-primary" />}
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">Referrer / Partner</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          A&amp;R talent scout networks, partner onboarding attribution &amp; revenue share bounties.
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] w-fit font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                      Agency Bounty Network
                    </Badge>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  {isBusinessTypeLocked
                    ? "Business operating model is permanently registered to your tenant contract and cannot be modified."
                    : "Note: Your selected operating model sets the foundational catalog, rights, and distribution architecture. It becomes permanent upon setup completion."}
                </p>
              </div>

              {/* Dynamic Standards & Industry Parameters based on Business Type */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {businessType === WhiteLabelBusinessType.RECORD_LABEL && "Record Label Standards (IFPI & Master Rights)"}
                      {businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && "Distributor & Aggregation Infrastructure (DDEX / DSP)"}
                      {businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && "Publishing & Composition Rights Standards (CISAC / PRO)"}
                      {businessType === WhiteLabelBusinessType.REFERRER && "Partner Referral & Scout Network Configuration"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Auto-Configured Protocol
                  </Badge>
                </div>

                {/* 1. Record Label Fields */}
                {businessType === WhiteLabelBusinessType.RECORD_LABEL && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="isrcPrefix" className="text-[11px] font-medium">
                        ISRC Registrant Prefix (2-5 Chars)
                      </Label>
                      <Input
                        id="isrcPrefix"
                        value={isrcPrefix}
                        onChange={(e) => setIsrcPrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. QM or US-S1Z"
                        className="text-xs h-8 font-mono uppercase bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">National ISRC Agency assigned code</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="catalogPrefix" className="text-[11px] font-medium">
                        Catalog Number Prefix
                      </Label>
                      <Input
                        id="catalogPrefix"
                        value={catalogPrefix}
                        onChange={(e) => setCatalogPrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. RM-CAT"
                        className="text-xs h-8 font-mono uppercase bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Master release catalog index prefix</p>
                    </div>

                    <div className="space-y-1 md:col-span-1">
                      <Label htmlFor="pLineText" className="text-[11px] font-medium">
                        Default P-Line Master Copyright
                      </Label>
                      <Input
                        id="pLineText"
                        value={pLineText}
                        onChange={(e) => setPLineText(e.target.value)}
                        placeholder={`℗ ${new Date().getFullYear()} ${name}. All rights reserved.`}
                        className="text-xs h-8 bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Phonogram / Master Sound recording notice</p>
                    </div>
                  </div>
                )}

                {/* 2. Distributor Fields */}
                {businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="deliveryProtocol" className="text-[11px] font-medium">
                        DDEX ERN Delivery Protocol
                      </Label>
                      <select
                        id="deliveryProtocol"
                        value={deliveryProtocol}
                        onChange={(e) => setDeliveryProtocol(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 h-8 text-xs text-foreground font-medium"
                      >
                        <option value="DDEX_ERN_38">DDEX ERN 3.8.2 (Global DSP Universal)</option>
                        <option value="DDEX_ERN_42">DDEX ERN 4.2 (Next-Gen Hi-Res & Spatial)</option>
                        <option value="SFTP_DIRECT">Direct SFTP / Cloud Storage Ingestion</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">Standardized electronic release notice</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="aggregationCapacity" className="text-[11px] font-medium">
                        Catalog Scale &amp; Ingestion Capacity
                      </Label>
                      <select
                        id="aggregationCapacity"
                        value={aggregationCapacity}
                        onChange={(e) => setAggregationCapacity(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 h-8 text-xs text-foreground font-medium"
                      >
                        <option value="starter_10k">Tier 1: Up to 10,000 Catalog Tracks</option>
                        <option value="pro_100k">Tier 2: Up to 100,000 Catalog Tracks</option>
                        <option value="unlimited">Tier 3: Unlimited Enterprise Scale</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">High-throughput distribution buffer</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="commissionRate" className="text-[11px] font-medium">
                        Standard Distribution Fee / Commission (%)
                      </Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="15"
                        className="text-xs h-8 bg-background font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">Default distributor cut deducted on royalties</p>
                    </div>
                  </div>
                )}

                {/* 3. Music Publisher Fields */}
                {businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="primaryPro" className="text-[11px] font-medium">
                        Primary PRO Affiliation (Global Standard)
                      </Label>
                      <select
                        id="primaryPro"
                        value={primaryPro}
                        onChange={(e) => setPrimaryPro(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 h-8 text-xs text-foreground font-medium"
                      >
                        <option value="BMI">BMI (Broadcast Music, Inc. - USA)</option>
                        <option value="ASCAP">ASCAP (USA)</option>
                        <option value="SESAC">SESAC (USA)</option>
                        <option value="PRS">PRS for Music / MCPS (UK)</option>
                        <option value="SACEM">SACEM (France)</option>
                        <option value="GEMA">GEMA (Germany)</option>
                        <option value="SOCAN">SOCAN (Canada)</option>
                        <option value="APRA_AMCOS">APRA AMCOS (Australia / NZ)</option>
                        <option value="OTHER">Other National Society</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">Performance rights collecting society</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="ipiCaeNumber" className="text-[11px] font-medium">
                        IPI / CAE Number (9-11 Digits)
                      </Label>
                      <Input
                        id="ipiCaeNumber"
                        value={ipiCaeNumber}
                        onChange={(e) => setIpiCaeNumber(e.target.value)}
                        placeholder="e.g. 00123456789"
                        className="text-xs h-8 font-mono bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">CISAC Interested Parties Information</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="cLineText" className="text-[11px] font-medium">
                        Default C-Line Publishing Notice
                      </Label>
                      <Input
                        id="cLineText"
                        value={cLineText}
                        onChange={(e) => setCLineText(e.target.value)}
                        placeholder={`© ${new Date().getFullYear()} ${name} Publishing. All rights reserved.`}
                        className="text-xs h-8 bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Composition &amp; lyrical copyright line</p>
                    </div>
                  </div>
                )}

                {/* 4. Referrer Fields */}
                {businessType === WhiteLabelBusinessType.REFERRER && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="referralNetworkCode" className="text-[11px] font-medium">
                        Agency Scout / Partner Network Code
                      </Label>
                      <Input
                        id="referralNetworkCode"
                        value={referralNetworkCode}
                        onChange={(e) => setReferralNetworkCode(e.target.value.toUpperCase())}
                        placeholder="e.g. AGY-SCOUT"
                        className="text-xs h-8 font-mono uppercase bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground">Identifies recruited labels and catalogs</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="attributionWindowDays" className="text-[11px] font-medium">
                        Attribution Tracking Window
                      </Label>
                      <select
                        id="attributionWindowDays"
                        value={attributionWindowDays}
                        onChange={(e) => setAttributionWindowDays(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2 h-8 text-xs text-foreground font-medium"
                      >
                        <option value="30">30 Days Attribution</option>
                        <option value="60">60 Days Attribution (Industry Standard)</option>
                        <option value="90">90 Days Extended Attribution</option>
                        <option value="365">365 Days Annual Tracking</option>
                        <option value="lifetime">Lifetime / Perpetual Catalog Attribution</option>
                      </select>
                      <p className="text-[10px] text-muted-foreground">Cookie &amp; account referral tracking duration</p>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="commissionBounty" className="text-[11px] font-medium">
                        Referral Revenue Bounty Split (%)
                      </Label>
                      <Input
                        id="commissionBounty"
                        type="number"
                        min="0"
                        max="100"
                        value={commissionBounty}
                        onChange={(e) => setCommissionBounty(e.target.value)}
                        placeholder="10"
                        className="text-xs h-8 bg-background font-mono"
                      />
                      <p className="text-[10px] text-muted-foreground">Partner bounty earned per successful payout</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Brand Information & Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
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
                    id="brandName"
                    value={branding.name || name}
                    disabled
                    readOnly
                    className="text-xs h-9 bg-muted/50 cursor-not-allowed opacity-90 font-medium font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Brand name is permanently registered to your tenant contract and cannot be modified.
                  </p>
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
                    Support Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="supportPhone"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs h-9"
                    required
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
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Font Family</Label>
                        <span
                          className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20 transition-all truncate max-w-[130px]"
                          style={{ fontFamily: `"${themeFont}", sans-serif` }}
                        >
                          Aa • {themeFont}
                        </span>
                      </div>
                      <select
                        value={themeFont}
                        onChange={(e) => setThemeFont(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground font-medium"
                        style={{ fontFamily: `"${themeFont}", sans-serif` }}
                      >
                        {FONT_OPTIONS.map((f) => (
                          <option
                            key={f.id}
                            value={f.id}
                            style={{ fontFamily: `"${f.id}", sans-serif` }}
                          >
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
                      className="p-4 rounded-xl border border-border/70 shadow-sm space-y-3 transition-all whitelabel-preview-root"
                      style={{
                        borderRadius: themeRadius,
                        backgroundColor:
                          themeMode === "light" ? "#ffffff" : "#0d1117",
                        color: themeMode === "light" ? "#09090b" : "#f4f4f5",
                        fontFamily: `"${themeFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
                      }}
                    >
                      <style>{`
                        .whitelabel-preview-root,
                        .whitelabel-preview-root * {
                          font-family: "${themeFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                        }
                      `}</style>
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

          {/* STEP 4: Brand Assets & Global Online Presence */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                  <Globe className="w-3.5 h-3.5" />
                  Step 4: Brand Assets &amp; Global Online Presence
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Direct S3 Bucket Media Assets &amp; Social Channels
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upload your brand logos, favicon, and portal hero banner directly to the platform&apos;s dedicated AWS S3 bucket. Connect your official social profiles and streaming channels to display across release footers, smart links, and artist portals.
                </p>
              </div>

              {/* S3 Media Asset Uploader Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Brand Media Assets (Direct S3 Bucket Storage)</span>
                  </Label>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono">
                    Direct S3 Upload Enabled
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Light Mode Logo */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <span>Light Mode Brand Logo</span>
                          <span className="text-destructive font-bold">*</span>
                        </Label>
                        {logoUrl ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
                            S3 Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[9px] font-bold">
                            Mandatory *
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        High-contrast dark/colored logo for light backgrounds (PNG, SVG, WEBP, JPEG &bull; Max 25MB).
                      </p>
                    </div>

                    <input
                      id="upload-asset-logo"
                      type="file"
                      accept=".png,.svg,.webp,.jpg,.jpeg,image/png,image/svg+xml,image/webp,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logo")}
                    />

                    {logoUrl ? (
                      <div className="space-y-2">
                        <div className="h-20 w-full rounded-lg border border-border/80 bg-white p-2 flex items-center justify-center overflow-hidden relative">
                          {assetImgErrors.logo ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 text-center p-2">
                              <span className="text-[11px] text-destructive font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Preview failed to load
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAssetImgErrors((p) => ({ ...p, logo: false }));
                                  setAssetCacheBuster(Date.now());
                                }}
                                className="text-[10px] h-6 px-2.5 gap-1 text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                Reload Preview
                              </Button>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={`logo-${assetCacheBuster}`}
                              src={
                                logoUrl.includes("?")
                                  ? `${logoUrl}&t=${assetCacheBuster}`
                                  : `${logoUrl}?t=${assetCacheBuster}`
                              }
                              alt="Light Logo Preview"
                              crossOrigin="anonymous"
                              className="max-h-full max-w-full object-contain"
                              onError={() =>
                                setAssetImgErrors((p) => ({ ...p, logo: true }))
                              }
                              onLoad={() =>
                                setAssetImgErrors((p) => ({ ...p, logo: false }))
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("upload-asset-logo")?.click()}
                            disabled={uploadingAsset === "logo"}
                            className="text-xs h-7 gap-1 flex-1"
                          >
                            {uploadingAsset === "logo" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Replace File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoUrl("");
                              setAssetImgErrors((p) => ({ ...p, logo: false }));
                            }}
                            className="text-xs h-7 text-destructive hover:text-destructive px-2"
                            title="Remove Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById("upload-asset-logo")?.click()}
                        disabled={uploadingAsset === "logo"}
                        className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/40 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                      >
                        {uploadingAsset === "logo" ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingAsset === "logo" ? "Uploading to S3..." : "Upload Light Logo to S3"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click to browse or drop file</span>
                      </button>
                    )}

                    <div className="pt-1">
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Or direct URL: https://..."
                        className="text-[11px] h-7 font-mono bg-muted/30"
                      />
                    </div>
                  </div>

                  {/* 2. Dark Mode Logo */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                          <span>Dark Mode Brand Logo</span>
                          <span className="text-destructive font-bold">*</span>
                        </Label>
                        {logoDarkUrl ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-border border-emerald-500/30 text-[9px] font-mono">
                            S3 Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[9px] font-bold">
                            Mandatory *
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        White or light mark for dark mode navigation and backdrops (PNG, SVG, WEBP, JPEG &bull; Max 25MB).
                      </p>
                    </div>

                    <input
                      id="upload-asset-logoDark"
                      type="file"
                      accept=".png,.svg,.webp,.jpg,.jpeg,image/png,image/svg+xml,image/webp,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "logoDark")}
                    />

                    {logoDarkUrl ? (
                      <div className="space-y-2">
                        <div className="h-20 w-full rounded-lg border border-border/80 bg-zinc-950 p-2 flex items-center justify-center overflow-hidden relative">
                          {assetImgErrors.logoDark ? (
                            <div className="flex flex-col items-center justify-center gap-1.5 text-center p-2">
                              <span className="text-[11px] text-destructive font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Preview failed to load
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAssetImgErrors((p) => ({ ...p, logoDark: false }));
                                  setAssetCacheBuster(Date.now());
                                }}
                                className="text-[10px] h-6 px-2.5 gap-1 text-zinc-100 border-zinc-700 hover:bg-zinc-800"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                Reload Preview
                              </Button>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={`logoDark-${assetCacheBuster}`}
                              src={
                                logoDarkUrl.includes("?")
                                  ? `${logoDarkUrl}&t=${assetCacheBuster}`
                                  : `${logoDarkUrl}?t=${assetCacheBuster}`
                              }
                              alt="Dark Logo Preview"
                              crossOrigin="anonymous"
                              className="max-h-full max-w-full object-contain"
                              onError={() =>
                                setAssetImgErrors((p) => ({ ...p, logoDark: true }))
                              }
                              onLoad={() =>
                                setAssetImgErrors((p) => ({ ...p, logoDark: false }))
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("upload-asset-logoDark")?.click()}
                            disabled={uploadingAsset === "logoDark"}
                            className="text-xs h-7 gap-1 flex-1"
                          >
                            {uploadingAsset === "logoDark" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Replace File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoDarkUrl("");
                              setAssetImgErrors((p) => ({ ...p, logoDark: false }));
                            }}
                            className="text-xs h-7 text-destructive hover:text-destructive px-2"
                            title="Remove Dark Logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById("upload-asset-logoDark")?.click()}
                        disabled={uploadingAsset === "logoDark"}
                        className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/40 rounded-lg p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center"
                      >
                        {uploadingAsset === "logoDark" ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingAsset === "logoDark" ? "Uploading to S3..." : "Upload Dark Logo to S3"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Click to browse or drop file</span>
                      </button>
                    )}

                    <div className="pt-1">
                      <Input
                        value={logoDarkUrl}
                        onChange={(e) => setLogoDarkUrl(e.target.value)}
                        placeholder="Or direct URL: https://..."
                        className="text-[11px] h-7 font-mono bg-muted/30"
                      />
                    </div>
                  </div>

                  {/* 3. Browser Favicon */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-foreground">
                          Browser Favicon (.ico / .png)
                        </Label>
                        {faviconUrl ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
                            S3 Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Browser tab icon and bookmark icon (.ico, .png, .svg, .webp &bull; Max 5MB).
                      </p>
                    </div>

                    <input
                      id="upload-asset-favicon"
                      type="file"
                      accept=".ico,.png,.svg,.webp,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "favicon")}
                    />

                    {faviconUrl ? (
                      <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg border border-border/80 bg-muted/30 p-2 flex items-center justify-center overflow-hidden relative">
                          {assetImgErrors.favicon ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-center p-1">
                              <span className="text-[10px] text-destructive font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Failed
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAssetImgErrors((p) => ({ ...p, favicon: false }));
                                  setAssetCacheBuster(Date.now());
                                }}
                                className="text-[9px] h-5 px-1.5 gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Retry
                              </Button>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={`favicon-${assetCacheBuster}`}
                              src={
                                faviconUrl.includes("?")
                                  ? `${faviconUrl}&t=${assetCacheBuster}`
                                  : `${faviconUrl}?t=${assetCacheBuster}`
                              }
                              alt="Favicon Preview"
                              crossOrigin="anonymous"
                              className="w-8 h-8 object-contain"
                              onError={() =>
                                setAssetImgErrors((p) => ({ ...p, favicon: true }))
                              }
                              onLoad={() =>
                                setAssetImgErrors((p) => ({ ...p, favicon: false }))
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("upload-asset-favicon")?.click()}
                            disabled={uploadingAsset === "favicon"}
                            className="text-xs h-7 gap-1 flex-1"
                          >
                            {uploadingAsset === "favicon" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Replace File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFaviconUrl("");
                              setAssetImgErrors((p) => ({ ...p, favicon: false }));
                            }}
                            className="text-xs h-7 text-destructive hover:text-destructive px-2"
                            title="Remove Favicon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById("upload-asset-favicon")?.click()}
                        disabled={uploadingAsset === "favicon"}
                        className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                      >
                        {uploadingAsset === "favicon" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingAsset === "favicon" ? "Uploading..." : "Upload Favicon (.ico / .png)"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Square icon 32x32px or 64x64px</span>
                      </button>
                    )}

                    <div className="pt-1">
                      <Input
                        value={faviconUrl}
                        onChange={(e) => setFaviconUrl(e.target.value)}
                        placeholder="Or direct URL: https://..."
                        className="text-[11px] h-7 font-mono bg-muted/30"
                      />
                    </div>
                  </div>

                  {/* 4. Hero / Portal Banner */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs font-semibold text-foreground">
                          Hero Portal Banner
                        </Label>
                        {bannerUrl ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono">
                            S3 Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-muted-foreground">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Wide landscape banner for login screen and artist home (JPG, PNG, WEBP, SVG &bull; Max 100MB).
                      </p>
                    </div>

                    <input
                      id="upload-asset-banner"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(e, "banner")}
                    />

                    {bannerUrl ? (
                      <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg border border-border/80 bg-muted/30 overflow-hidden relative">
                          {assetImgErrors.banner ? (
                            <div className="h-full flex flex-col items-center justify-center gap-1 text-center p-1">
                              <span className="text-[10px] text-destructive font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Failed to load preview
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAssetImgErrors((p) => ({ ...p, banner: false }));
                                  setAssetCacheBuster(Date.now());
                                }}
                                className="text-[9px] h-5 px-1.5 gap-1"
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Retry
                              </Button>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={`banner-${assetCacheBuster}`}
                              src={
                                bannerUrl.includes("?")
                                  ? `${bannerUrl}&t=${assetCacheBuster}`
                                  : `${bannerUrl}?t=${assetCacheBuster}`
                              }
                              alt="Banner Preview"
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                              onError={() =>
                                setAssetImgErrors((p) => ({ ...p, banner: true }))
                              }
                              onLoad={() =>
                                setAssetImgErrors((p) => ({ ...p, banner: false }))
                              }
                            />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("upload-asset-banner")?.click()}
                            disabled={uploadingAsset === "banner"}
                            className="text-xs h-7 gap-1 flex-1"
                          >
                            {uploadingAsset === "banner" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Replace File
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBannerUrl("");
                              setAssetImgErrors((p) => ({ ...p, banner: false }));
                            }}
                            className="text-xs h-7 text-destructive hover:text-destructive px-2"
                            title="Remove Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => document.getElementById("upload-asset-banner")?.click()}
                        disabled={uploadingAsset === "banner"}
                        className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/40 rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                      >
                        {uploadingAsset === "banner" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-foreground">
                          {uploadingAsset === "banner" ? "Uploading..." : "Upload Hero Banner"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">1920x600px wide landscape</span>
                      </button>
                    )}

                    <div className="pt-1">
                      <Input
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="Or direct URL: https://..."
                        className="text-[11px] h-7 font-mono bg-muted/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Social Media & Online Presence Grid */}
              <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-xs font-bold text-foreground">
                        Global Online Presence &amp; Social Links
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Embedded in public landing pages, artist portals, release smartlinks, and email receipts.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    8 Channels Supported
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Official Website */}
                  <div className="space-y-1">
                    <Label htmlFor="website" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Globe className="w-3 h-3 text-primary" /> Official Website
                    </Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourlabel.com"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 2. Instagram */}
                  <div className="space-y-1">
                    <Label htmlFor="instagram" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Share2 className="w-3 h-3 text-pink-500" /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/yourlabel"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 3. Twitter / X */}
                  <div className="space-y-1">
                    <Label htmlFor="twitter" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Share2 className="w-3 h-3 text-sky-500" /> Twitter / X
                    </Label>
                    <Input
                      id="twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/yourlabel"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 4. YouTube */}
                  <div className="space-y-1">
                    <Label htmlFor="youtube" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Radio className="w-3 h-3 text-red-500" /> YouTube Channel
                    </Label>
                    <Input
                      id="youtube"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="https://youtube.com/@yourlabel"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 5. Spotify */}
                  <div className="space-y-1">
                    <Label htmlFor="spotify" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Music className="w-3 h-3 text-emerald-500" /> Spotify Profile
                    </Label>
                    <Input
                      id="spotify"
                      value={spotify}
                      onChange={(e) => setSpotify(e.target.value)}
                      placeholder="https://open.spotify.com/user/..."
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 6. TikTok */}
                  <div className="space-y-1">
                    <Label htmlFor="tiktok" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Music className="w-3 h-3 text-purple-500" /> TikTok
                    </Label>
                    <Input
                      id="tiktok"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@yourlabel"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 7. Facebook */}
                  <div className="space-y-1">
                    <Label htmlFor="facebook" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Globe className="w-3 h-3 text-blue-500" /> Facebook Page
                    </Label>
                    <Input
                      id="facebook"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/yourlabel"
                      className="text-xs h-8"
                    />
                  </div>

                  {/* 8. LinkedIn */}
                  <div className="space-y-1">
                    <Label htmlFor="linkedin" className="text-[11px] font-medium flex items-center gap-1 text-foreground">
                      <Briefcase className="w-3 h-3 text-blue-600" /> LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      className="text-xs h-8"
                    />
                  </div>
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

          {/* STEP 6: Production API Keys & Distribution Engine Authentication */}
          {step === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <KeyRound className="w-3.5 h-3.5" />
                  Step 6: Production API Keys &amp; Engine Authentication
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Generate Your Production API Key (`rmit_live_...`)
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your WhiteLabel portal communicates with the{" "}
                  <strong>RoyalMotionIT Distribution Engine (`https://api.royalmotionit.com`)</strong>{" "}
                  using a cryptographically hashed Tenant API Key (`x-api-key`).
                  Generate your key now or let the wizard auto-generate one upon
                  activation.
                </p>
              </div>

              {/* Interactive API Key Generator Card */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-500" />
                      <span>Tenant API Key Provisioning</span>
                      {(generatedRawApiKey || currentKeyPrefix) && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                          Active Key Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Used by your EC2 instance or self-hosted runtime to fetch
                      tenant branding, themes, and artist catalog data.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={apiKeyLabel}
                      onChange={(e) => setApiKeyLabel(e.target.value)}
                      placeholder="Production Portal Key"
                      className="h-8 text-xs w-44 font-medium"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateWizardApiKey}
                      disabled={isGeneratingKey}
                      className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5 shrink-0"
                    >
                      {isGeneratingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          {generatedRawApiKey || currentKeyPrefix
                            ? "Rotate / New Key"
                            : "Generate API Key"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {generatedRawApiKey ? (
                  <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Save Your Raw Production API Key (Shown Only Once!)
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedRawApiKey);
                          setCopiedKey(true);
                          toast.success("Raw API Key copied to clipboard!");
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="h-7 text-xs gap-1 font-mono"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy Key
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background/90 border border-emerald-500/30 font-mono text-xs text-foreground break-all select-all">
                      {generatedRawApiKey}
                    </div>
                  </div>
                ) : currentKeyPrefix ? (
                  <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">
                        Active Production Key Detected
                      </span>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Prefix: {currentKeyPrefix}...
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-500 text-[10px]"
                    >
                      SHA-256 Indexed in Redis
                    </Badge>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-muted-foreground">
                    Click <strong>&quot;Generate API Key&quot;</strong> above to
                    create your production key now, or proceed and the wizard
                    will automatically provision one when you click{" "}
                    <strong>Activate</strong> in Step 8.
                  </div>
                )}

                {/* Ready-to-Use .env Preview */}
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Generated Portal `.env` Configuration (`api.royalmotionit.com`)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyEnvSnippet}
                      className="text-xs h-7 gap-1 font-mono"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied .env
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy .env Bundle
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto text-foreground">
                    <pre className="text-[11px] leading-relaxed">
                      {envSnippet}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Guided AWS Console & Cloudflare Dashboard Deployment */}
          {step === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  Step 7: Guided AWS Console &amp; Cloudflare Dashboard Setup
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Automated Multi-Cloud Infrastructure &amp; DNS Deployment
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Follow the step-by-step console instructions below for{" "}
                  <strong>AWS Console</strong> and{" "}
                  <strong>Cloudflare Dashboard</strong> to automatically launch
                  your dedicated EC2 server, S3 Audio Vault, SES Email DKIM, and
                  Cloudflare SSL routing—or deploy using your pre-active managed
                  subdomain{" "}
                  <code className="text-primary font-mono">
                    https://{branding.subdomain}.platform.royalmotionit.com
                  </code>
                  .
                </p>
              </div>

              {/* Dual Console Step-by-Step Interactive Walkthrough Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Guide Card 1: AWS Console Step-by-Step */}
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                          Part A: AWS Console Guide
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          IAM User + EC2 + S3 Audio Vault + SES Email
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://console.aws.amazon.com/iam/home#/users"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Open AWS IAM
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                    <li>
                      Sign in to <strong>AWS Console</strong> &rarr;{" "}
                      <strong>IAM &rarr; Users &rarr; Create user</strong>{" "}
                      (name: <code className="text-foreground">rmit-whitelabel-deployer</code>).
                    </li>
                    <li>
                      Select <strong>Attach policies directly</strong> and attach:{" "}
                      <code className="text-foreground font-semibold">AmazonEC2FullAccess</code>,{" "}
                      <code className="text-foreground font-semibold">AmazonS3FullAccess</code>, and{" "}
                      <code className="text-foreground font-semibold">AmazonSESFullAccess</code>{" "}
                      (or copy the JSON policy below).
                    </li>
                    <li>
                      Open the user &rarr;{" "}
                      <strong>Security credentials &rarr; Create access key</strong>{" "}
                      &rarr; Select <strong>Application running outside AWS</strong>.
                    </li>
                    <li>
                      Copy the <strong>Access key ID (`AKIA...`)</strong> and{" "}
                      <strong>Secret access key</strong> into the form below.
                    </li>
                  </ol>

                  <div className="pt-1 flex items-center justify-between border-t border-amber-500/20">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Least-Privilege IAM JSON Policy
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          AWS_IAM_LEAST_PRIVILEGE_POLICY,
                        );
                        setCopiedIamPolicy(true);
                        toast.success(
                          "AWS IAM JSON Policy copied to clipboard!",
                        );
                        setTimeout(() => setCopiedIamPolicy(false), 2000);
                      }}
                      className="h-6 text-[10px] px-2 gap-1 font-mono"
                    >
                      {copiedIamPolicy ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          Copied JSON
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy IAM JSON
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Guide Card 2: Cloudflare Dashboard Step-by-Step */}
                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wide">
                          Part B: Cloudflare Console &amp; SSL Guide
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          Zone ID + API Token (DNS &amp; SSL Permissions) + Origin Certificate
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://dash.cloudflare.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Open Cloudflare
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ol className="text-[11px] text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
                    <li>
                      Your managed subdomain{" "}
                      <code className="text-primary font-semibold">
                        {branding.subdomain}.platform.royalmotionit.com
                      </code>{" "}
                      is <strong>already active</strong> on RoyalMotionIT DNS!
                    </li>
                    <li>
                      For your custom domain (e.g.{" "}
                      <code className="text-foreground">backstage.yourdomain.com</code>):
                      select your domain in <strong>Cloudflare Dashboard</strong>.
                    </li>
                    <li>
                      On the domain <strong>Overview</strong> page (bottom-right <strong>API</strong> section), copy your <strong>32-character Zone ID</strong>.
                    </li>
                    <li>
                      <strong>API Token Creation (with SSL &amp; DNS Permissions):</strong>
                      <div className="pl-4 mt-1 space-y-1 text-[10px] bg-background/60 p-2.5 rounded-lg border border-border/60">
                        <div>&bull; Click <strong>Get your API token &rarr; Create Token &rarr; Create Custom Token</strong> (or choose <em>Edit zone DNS</em> and click add more permissions).</div>
                        <div className="font-semibold text-foreground">&bull; Add TWO permissions:</div>
                        <div className="pl-2 font-mono text-sky-600 dark:text-sky-400">1. Zone &rarr; DNS &rarr; Edit <span className="text-muted-foreground">(for A, CNAME, DKIM, MX, SPF, DMARC records)</span></div>
                        <div className="pl-2 font-mono text-emerald-600 dark:text-emerald-400">2. Zone &rarr; SSL and Certificates &rarr; Edit <span className="text-muted-foreground">(for Origin CA certificate &amp; Full Strict SSL synchronization)</span></div>
                        <div>&bull; Under <strong>Zone Resources</strong>, select <strong>Include &rarr; Specific zone &rarr; [yourdomain.com]</strong>.</div>
                        <div>&bull; Click <strong>Continue to summary &rarr; Create Token</strong> and copy the token into the input below.</div>
                      </div>
                    </li>
                    <li>
                      <strong>Direct Origin Certificate (15-Year Zero-521 Setup):</strong> In Cloudflare Dashboard, go to <strong>SSL/TLS &rarr; Origin Server &rarr; Create Certificate</strong> (15-Year validity). You can paste the generated Origin Certificate &amp; Private Key into the optional <em>Origin SSL Certificate</em> section below for 100% strict SSL.
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-sky-500/20 text-[10px] text-muted-foreground">
                    <span>Cloudflare SSL/TLS Encryption Mode:</span>
                    <span className="font-mono font-bold text-foreground">
                      Full (Strict) + Proxied Orange Cloud
                    </span>
                  </div>
                </div>
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
                      Automated AWS + Cloudflare Deployment
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                      Full Automation
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    Automatically provisions EC2 Ubuntu 24.04, Elastic IP, S3
                    Audio Vault with CORS &amp; Glacier lifecycle, SES DKIM
                    records, and Cloudflare DNS.
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
                      Managed Subdomain (`{branding.subdomain}.platform.royalmotionit.com`) / Self-Host
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Instant Ready
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    Use your pre-provisioned{" "}
                    <code>{branding.subdomain}.platform.royalmotionit.com</code>{" "}
                    routing immediately or deploy via the 3-variable `.env`
                    bundle on any server.
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
                          AWS &amp; Cloudflare Credentials (Secure Pre-Flight &amp; Auto-Provisioning)
                        </span>
                      </div>

                      {/* AWS Credentials */}
                      <div className="space-y-3">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                          <span>1. AWS Infrastructure Credentials (EC2, S3, SES)</span>
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
                              <option value="ap-southeast-1">
                                ap-southeast-1 (Asia Pacific, Singapore)
                              </option>
                              <option value="us-east-1">
                                us-east-1 (US East, N. Virginia)
                              </option>
                              <option value="us-west-2">
                                us-west-2 (US West, Oregon)
                              </option>
                              <option value="eu-west-1">
                                eu-west-1 (Europe, Ireland)
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

                          <div className="space-y-1">
                            <Label
                              htmlFor="bucketName"
                              className="text-xs font-medium"
                            >
                              S3 Audio Vault Bucket Name
                            </Label>
                            <Input
                              id="bucketName"
                              value={bucketName}
                              onChange={(e) => setBucketName(e.target.value)}
                              placeholder="rmit-music-royal-music"
                              className="text-xs h-9 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="elasticIpv4"
                              className="text-xs font-medium"
                            >
                              Existing Elastic IPv4 (Optional)
                            </Label>
                            <Input
                              id="elasticIpv4"
                              value={elasticIpv4}
                              onChange={(e) => setElasticIpv4(e.target.value)}
                              placeholder="Auto-allocated if left blank"
                              className="text-xs h-9 font-mono"
                            />
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
                                handleBaseDomainChange(e.target.value)
                              }
                              placeholder="royalmusic.com"
                              className="text-xs h-9 font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Your apex domain registered or active in Cloudflare.
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="portalSubdomain"
                                className="text-xs font-medium"
                              >
                                Portal Subdomain Prefix
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-muted/80 text-muted-foreground border-border font-mono gap-1"
                              >
                                <Lock className="w-2.5 h-2.5" />
                                Locked &bull; backstage
                              </Badge>
                            </div>
                            <Input
                              id="portalSubdomain"
                              value="backstage"
                              disabled
                              readOnly
                              className="text-xs h-9 font-mono bg-muted/60 cursor-not-allowed opacity-90 font-medium"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              Target Portal:{" "}
                              <code className="text-primary font-mono font-semibold">
                                https://backstage.
                                {cloudflareBaseDomain || "yourdomain.com"}
                              </code>{" "}
                              (Permanently locked).
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="sesMailingDomain"
                                className="text-xs font-medium"
                              >
                                SES Mailing Domain
                              </Label>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] font-mono gap-1">
                                <Mail className="w-2.5 h-2.5" />
                                mail.{cloudflareBaseDomain || "customdomain"}
                              </Badge>
                            </div>
                            <Input
                              id="sesMailingDomain"
                              value={`mail.${cloudflareBaseDomain || "yourdomain.com"}`}
                              disabled
                              readOnly
                              className="text-xs h-9 font-mono bg-muted/60 cursor-not-allowed opacity-90 font-medium"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              SES identity auto-wires 3 DKIM CNAMEs, SPF TXT, MX feedback routing, and DMARC for{" "}
                              <code className="text-emerald-500 font-mono font-semibold">
                                mail.{cloudflareBaseDomain || "yourdomain.com"}
                              </code>
                              .
                            </p>
                          </div>

                          <div className="space-y-1">
                            <Label
                              htmlFor="senderEmail"
                              className="text-xs font-medium"
                            >
                              Notification Sender Email (SES)
                            </Label>
                            <Input
                              id="senderEmail"
                              type="email"
                              value={senderEmail}
                              onChange={(e) => setSenderEmail(e.target.value)}
                              placeholder={`noreply@mail.${cloudflareBaseDomain || "yourdomain.com"}`}
                              className="text-xs h-9 font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground">
                              From address for artist invites, royalty statements, and transactional alerts.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 3. Cloudflare Origin SSL / TLS Certificate (Optional / Recommended) */}
                      <div className="space-y-3 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowOriginCertInputs(!showOriginCertInputs)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors text-left"
                          >
                            <Shield className="w-3.5 h-3.5 text-emerald-500" />
                            <span>3. Cloudflare Origin SSL Certificate</span>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            >
                              Recommended &bull; Full (Strict) SSL
                            </Badge>
                            {showOriginCertInputs ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                            )}
                          </button>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            Optional (Auto-generated if omitted)
                          </span>
                        </div>

                        {showOriginCertInputs && (
                          <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-3">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Paste your 15-year Cloudflare Origin Certificate and Private Key from{" "}
                              <strong>Cloudflare Dashboard &rarr; SSL/TLS &rarr; Origin Server &rarr; Create Certificate</strong>.
                              This installs directly to your EC2 Nginx (<code>/etc/ssl/certs/whitelabel_origin.crt</code>)
                              to eliminate Cloudflare Error 521 / 526 forever.
                            </p>

                            <div className="space-y-2">
                              <div className="space-y-1">
                                <Label htmlFor="originCert" className="text-xs font-medium">
                                  Cloudflare Origin Certificate (PEM)
                                </Label>
                                <textarea
                                  id="originCert"
                                  rows={4}
                                  value={cloudflareOriginCert}
                                  onChange={(e) => setCloudflareOriginCert(e.target.value)}
                                  placeholder="-----BEGIN CERTIFICATE-----&#10;MIID...&#10;-----END CERTIFICATE-----"
                                  className="w-full text-[10px] font-mono rounded-md border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor="originKey" className="text-xs font-medium">
                                  Cloudflare Origin Private Key (PEM)
                                </Label>
                                <textarea
                                  id="originKey"
                                  rows={4}
                                  value={cloudflareOriginKey}
                                  onChange={(e) => setCloudflareOriginKey(e.target.value)}
                                  placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIE...&#10;-----END PRIVATE KEY-----"
                                  className="w-full text-[10px] font-mono rounded-md border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. EC2 Lifecycle & Deployment Options */}
                      <div className="space-y-2 pt-3 border-t border-border/60">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-blue-500" />
                          <span>4. EC2 Compute Deployment Mode</span>
                        </div>

                        <label className="flex items-start gap-3 p-3 rounded-lg border border-border/80 bg-background hover:bg-muted/40 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={recreateInstance}
                            onChange={(e) => setRecreateInstance(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                          />
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                              <span>Fresh EC2 Deployment (Recreate Instance)</span>
                              {recreateInstance && (
                                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px]">
                                  Clean Bootstrap
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Terminate previously allocated EC2 instance and launch a brand new Ubuntu 24.04 instance with fresh cloud-init bootstrap, Git clone, and Next.js production build on Port 3000. (Leave unchecked to reuse existing active instance).
                            </p>
                          </div>
                        </label>
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
                        <div className="flex flex-wrap items-center gap-2">
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
                                Pre-Flight Validate Credentials
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveCloudCredentials}
                            disabled={isSavingCredentials}
                            className="text-xs h-9 gap-1.5 font-medium"
                          >
                            {isSavingCredentials ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Saving Credentials...
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5 text-foreground" />
                                Save Credentials
                              </>
                            )}
                          </Button>
                        </div>

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

              {/* MANUAL / MANAGED SUBDOMAIN SECTION */}
              {deploymentMode === "manual" && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <KeyRound className="w-4 h-4 text-primary" />
                      WhiteLabel Hosting Environment (`.env` for `{branding.subdomain}.platform.royalmotionit.com`)
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
                    Your subdomain{" "}
                    <code className="text-primary font-mono">
                      https://{branding.subdomain}.platform.royalmotionit.com
                    </code>{" "}
                    is pre-routed. You can also configure custom AWS/Cloudflare
                    resources at any time after unlocking your console.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: Final Production Readiness Verification & Unlock Console */}
          {step === 8 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Step 8: Final Readiness &amp; Console Unlock
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Review &amp; Unlock Your Full WhiteLabel Command Center
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Verify your complete configuration below. Clicking{" "}
                  <strong>&quot;Complete Setup &amp; Unlock WhiteLabel Console&quot;</strong>{" "}
                  saves your identity, theme, Super Admin account, and cloud
                  settings, provisions your Production API Key if not yet
                  generated, and unlocks all 9 management modules in your
                  sidebar.
                </p>
              </div>

              {/* Summary Box */}
              <div className="p-5 rounded-xl border border-border bg-muted/40 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Brand Name:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {name || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business Archetype:</span>
                    <div className="font-semibold text-primary mt-0.5 flex items-center gap-1">
                      {businessType === WhiteLabelBusinessType.RECORD_LABEL && "Record Label (IFPI)"}
                      {businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && "Distributor (DDEX)"}
                      {businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && "Music Publisher (PRO)"}
                      {businessType === WhiteLabelBusinessType.REFERRER && "Referrer Network"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Industry Metadata:</span>
                    <div className="font-mono text-[11px] text-foreground mt-0.5 truncate">
                      {businessType === WhiteLabelBusinessType.RECORD_LABEL && `ISRC: ${isrcPrefix || "QM"} • Cat: ${catalogPrefix || "RM-CAT"}`}
                      {businessType === WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && `${deliveryProtocol} • Cut: ${commissionRate}%`}
                      {businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER && `PRO: ${primaryPro} • IPI: ${ipiCaeNumber || "Assigned"}`}
                      {businessType === WhiteLabelBusinessType.REFERRER && `Code: ${referralNetworkCode} • Bounty: ${commissionBounty}%`}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">S3 Brand Assets:</span>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {[logoUrl, logoDarkUrl, faviconUrl, bannerUrl].filter(Boolean).length} / 4 S3 Assets Ready
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Social Presence:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {[website, instagram, twitter, youtube, spotify, tiktok, facebook, linkedin].filter(Boolean).length} Channels Active
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Support Email:
                    </span>
                    <div className="font-semibold text-foreground mt-0.5 truncate">
                      {supportEmail}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Support Phone:
                    </span>
                    <div className="font-semibold text-foreground mt-0.5 truncate">
                      {supportPhone}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registration:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {signupModel}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Theme &amp; Font:</span>
                    <div className="font-semibold text-foreground mt-0.5 capitalize">
                      {themeMode} &bull; {themeFont} ({primaryColor})
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Super Admin:</span>
                    <div className="font-semibold text-foreground mt-0.5 truncate">
                      {hasExistingOwner
                        ? "Existing Owner"
                        : ownerEmail || "Configured"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">API Key Auth:</span>
                    <div className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      {generatedRawApiKey || currentKeyPrefix
                        ? "Provisioned (Active)"
                        : "Auto-Generate on Save"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deployment:</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {deploymentMode === "automated"
                        ? "AWS + Cloudflare"
                        : "Managed Subdomain"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Managed Subdomain:
                    </span>
                    <div className="font-mono font-semibold text-primary mt-0.5 truncate">
                      {branding.subdomain}.platform.royalmotionit.com
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/80 text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>Portal Endpoint:</span>
                    <span className="font-mono text-primary font-semibold">
                      {cloudflareBaseDomain ? `https://backstage.${cloudflareBaseDomain}` : (deployedDomain ? `https://${deployedDomain}` : portalHost)}
                    </span>
                  </div>
                  {cloudflareBaseDomain && (
                    <div className="flex items-center gap-1.5">
                      <span>SES Mail Domain:</span>
                      <span className="font-mono text-emerald-500 font-semibold">
                        mail.{cloudflareBaseDomain}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {generatedRawApiKey && (
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Your Production API Key (`x-api-key`):
                  </div>
                  <div className="font-mono text-xs text-foreground break-all select-all p-2 rounded bg-background/80 border border-emerald-500/20">
                    {generatedRawApiKey}
                  </div>
                </div>
              )}

              {launchSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3 className="text-base font-bold text-foreground">
                    WhiteLabel Setup Complete &amp; Full Console Unlocked!
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Redirecting to your unlocked WhiteLabel Command Center...
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
                className="text-xs h-10 px-5 text-white font-bold gap-1.5 shadow-sm hover:opacity-90"
              >
                {isSubmitting ? (
                  "Saving & Unlocking Console..."
                ) : launchSuccess ? (
                  "Unlocked! Redirecting..."
                ) : (
                  <>
                    Complete Setup &amp; Unlock WhiteLabel Console
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
