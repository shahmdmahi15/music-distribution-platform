"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Disc3,
  Globe,
  User,
  DollarSign,
  Music,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Headphones,
  Layers,
  ExternalLink,
  Camera,
  Video,
  Palette,
  AlertCircle,
  Lock,
  Server,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { clientApplyWhiteLabelAction } from "@/actions/client/whitelabel/client-apply-whitelabel.action";
import { clientCheckSubdomainAction } from "@/actions/client/whitelabel/client-subdomain-check.action";
import { clientSuggestSubdomainAction } from "@/actions/client/whitelabel/client-domain.action";
import {
  clientSaveOnboardingDraftAction,
  clientClearOnboardingDraftAction,
} from "@/actions/client/whitelabel/client-onboarding-draft.action";
import {
  WhiteLabelBusinessType,
  WhiteLabelSignupModel,
} from "@/types/whitelabel";

const BUSINESS_TYPES = [
  {
    id: WhiteLabelBusinessType.RECORD_LABEL,
    label: "Record Label",
    description:
      "Manage multiple artists, releases, contracts, and master rights.",
    icon: Disc3,
  },
  {
    id: WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR,
    label: "Distributor / Aggregator",
    description:
      "Distribute music catalogs for third-party labels and independent creators.",
    icon: Layers,
  },
  {
    id: WhiteLabelBusinessType.MUSIC_PUBLISHER,
    label: "Music Publisher",
    description:
      "Administer compositions, publishing royalties, mechanicals, and sync.",
    icon: Building2,
  },
  {
    id: WhiteLabelBusinessType.REFERRER,
    label: "Referrer",
    description:
      "Referral partner, affiliate network, or scout bringing talent and labels to the platform.",
    icon: Users,
  },
];

const SIGNUP_MODELS = [
  {
    id: WhiteLabelSignupModel.INVITE_ONLY,
    label: "Invite Only (Recommended)",
    description:
      "Only administrators can send private invitation links to onboard creators.",
  },
  {
    id: WhiteLabelSignupModel.ADMIN_APPROVAL,
    label: "Admin Approval",
    description:
      "Creators can submit registration forms, but accounts remain pending until approved by staff.",
  },
  {
    id: WhiteLabelSignupModel.OPEN_REGISTRATION,
    label: "Open Registration",
    description:
      "Instant access for any user to sign up, verify email, and start distributing immediately.",
  },
];

const DISTRIBUTOR_OPTIONS = [
  "The Orchard",
  "FUGA",
  "Believe",
  "DistroKid",
  "TuneCore",
  "CD Baby",
  "Symphonic",
  "ADA / Warner",
  "Ingrooves / Virgin",
  "SoundCloud for Artists",
  "Custom Direct Feeds",
];

const ROYALTY_OPTIONS = [
  "Curve Royalty Systems",
  "Revelator",
  "SoundCredit",
  "Exactis",
  "Excel / Custom In-House",
  "None / Manual",
];

const BRAND_COLOR_PRESETS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
];

export interface RosterArtist {
  artistName: string;
  instagramHandle?: string;
  spotifyProfileUrl?: string;
  youtubeChannelUrl?: string;
  monthlyListeners?: number;
  orderIndex?: number;
}

export interface OnboardingDraftData {
  name?: string;
  businessType?: WhiteLabelBusinessType;
  companyWebsite?: string;
  country?: string;
  yearsInBusiness?: number;
  isIncorporated?: boolean;
  incorporationDocUrl?: string;
  desiredSubdomain?: string;
  subdomain?: string;
  elasticIpv4?: string;
  primaryColor?: string;
  estimatedLaunchTimeline?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactLinkedIn?: string;
  catalogTrackCount?: number;
  monthlyTrackDelivery?: number;
  monthlyRevenueUsd?: number;
  hasDirectDeals?: boolean;
  currentDistributors?: string[];
  royaltySolutions?: string[];
  primaryCatalogLanguage?: string;
  wantsCatalogMigration?: boolean;
  hasSampleBasedCovers?: boolean;
  userSignupModel?: WhiteLabelSignupModel;
  privacyPolicyAccepted?: boolean;
  marketingConsent?: boolean;
  topArtists?: RosterArtist[];
}

interface OnboardingWizardProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  initialDraft?: OnboardingDraftData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WhiteLabelOnboardingWizard({
  user,
  initialDraft,
  onSuccess,
  onCancel,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Subdomain checker state
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available?: boolean;
    reason?: string;
  }>({ checking: false });

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Corporate Profile
    name: initialDraft?.name || "",
    businessType:
      initialDraft?.businessType || WhiteLabelBusinessType.RECORD_LABEL,
    companyWebsite: initialDraft?.companyWebsite || "",
    country: initialDraft?.country || "",
    yearsInBusiness: initialDraft?.yearsInBusiness ?? 1,
    isIncorporated: initialDraft?.isIncorporated ?? false,
    incorporationDocUrl: initialDraft?.incorporationDocUrl || "",

    // Step 2: Branding & Subdomain
    desiredSubdomain:
      initialDraft?.desiredSubdomain || initialDraft?.subdomain || "",
    elasticIpv4: initialDraft?.elasticIpv4 || "",
    primaryColor: initialDraft?.primaryColor || "#6366f1",
    estimatedLaunchTimeline:
      initialDraft?.estimatedLaunchTimeline || "Immediate",

    // Step 3: Contact Person
    contactFirstName: initialDraft?.contactFirstName || user.firstName || "",
    contactLastName: initialDraft?.contactLastName || user.lastName || "",
    contactEmail: initialDraft?.contactEmail || user.email || "",
    contactLinkedIn: initialDraft?.contactLinkedIn || "",

    // Step 4: Catalog & Distribution Operations
    catalogTrackCount: initialDraft?.catalogTrackCount ?? 50,
    monthlyTrackDelivery: initialDraft?.monthlyTrackDelivery ?? 10,
    monthlyRevenueUsd: initialDraft?.monthlyRevenueUsd ?? 1000,
    hasDirectDeals: initialDraft?.hasDirectDeals ?? false,
    currentDistributors: initialDraft?.currentDistributors || ["The Orchard"],
    royaltySolutions: initialDraft?.royaltySolutions || [
      "Curve Royalty Systems",
    ],
    primaryCatalogLanguage: initialDraft?.primaryCatalogLanguage || "English",
    wantsCatalogMigration: initialDraft?.wantsCatalogMigration ?? false,
    hasSampleBasedCovers: initialDraft?.hasSampleBasedCovers ?? false,

    // Step 5: Top 3 Artists in Roster
    topArtists: initialDraft?.topArtists || [
      {
        artistName: "",
        instagramHandle: "",
        spotifyProfileUrl: "",
        youtubeChannelUrl: "",
        monthlyListeners: 0,
        orderIndex: 1,
      },
      {
        artistName: "",
        instagramHandle: "",
        spotifyProfileUrl: "",
        youtubeChannelUrl: "",
        monthlyListeners: 0,
        orderIndex: 2,
      },
      {
        artistName: "",
        instagramHandle: "",
        spotifyProfileUrl: "",
        youtubeChannelUrl: "",
        monthlyListeners: 0,
        orderIndex: 3,
      },
    ],

    // Step 6: Access Model & Compliance
    userSignupModel:
      initialDraft?.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
    privacyPolicyAccepted: initialDraft?.privacyPolicyAccepted ?? true,
    marketingConsent: initialDraft?.marketingConsent ?? false,
  });

  // Auto-slugify company name to unique subdomain via Cloudflare check
  const debounceNameRef = useRef<NodeJS.Timeout | null>(null);
  const handleNameChange = (name: string) => {
    // Immediate clean local slug
    const localSlug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);

    setFormData((prev) => ({
      ...prev,
      name,
      desiredSubdomain: localSlug || prev.desiredSubdomain,
    }));

    if (!name.trim() || name.trim().length < 2) return;

    setSubdomainStatus({ checking: true });
    if (debounceNameRef.current) clearTimeout(debounceNameRef.current);
    debounceNameRef.current = setTimeout(async () => {
      try {
        const res = await clientSuggestSubdomainAction(name);
        if (res.success && res.subdomain) {
          setFormData((prev) => ({
            ...prev,
            desiredSubdomain: res.subdomain!,
          }));
          setSubdomainStatus({
            checking: false,
            available: true,
            reason: "Verified unique in Cloudflare DNS & database.",
          });
        }
      } catch {
        setSubdomainStatus({ checking: false });
      }
    }, 400);
  };

  // Subdomain live checker with debounce
  const debounceSubdomainRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const sub = formData.desiredSubdomain?.trim().toLowerCase();
    if (debounceSubdomainRef.current)
      clearTimeout(debounceSubdomainRef.current);

    if (!sub || sub.length < 3) {
      debounceSubdomainRef.current = setTimeout(() => {
        setSubdomainStatus((prev) =>
          prev.checking ? { checking: false } : prev,
        );
      }, 0);
      return () => {
        if (debounceSubdomainRef.current)
          clearTimeout(debounceSubdomainRef.current);
      };
    }

    // If matches the existing registered subdomain from the re-editing session, mark available immediately
    const existingRegisteredSub = (
      initialDraft?.desiredSubdomain || initialDraft?.subdomain
    )
      ?.trim()
      .toLowerCase();

    if (existingRegisteredSub && sub === existingRegisteredSub) {
      debounceSubdomainRef.current = setTimeout(() => {
        setSubdomainStatus({
          checking: false,
          available: true,
          reason: "Your registered subdomain (preserved)",
        });
      }, 0);
      return () => {
        if (debounceSubdomainRef.current)
          clearTimeout(debounceSubdomainRef.current);
      };
    }

    debounceSubdomainRef.current = setTimeout(async () => {
      setSubdomainStatus({ checking: true });
      try {
        const res = await clientCheckSubdomainAction(sub);
        setSubdomainStatus({
          checking: false,
          available: res.available,
          reason: res.reason,
        });
      } catch {
        setSubdomainStatus({ checking: false });
      }
    }, 450);

    return () => {
      if (debounceSubdomainRef.current)
        clearTimeout(debounceSubdomainRef.current);
    };
  }, [
    formData.desiredSubdomain,
    initialDraft?.desiredSubdomain,
    initialDraft?.subdomain,
  ]);

  // Auto-Save Draft to LocalStorage and API (debounced 1.5s)
  const debounceDraftRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceDraftRef.current) clearTimeout(debounceDraftRef.current);

    debounceDraftRef.current = setTimeout(() => {
      try {
        localStorage.setItem("rmit_onboarding_draft", JSON.stringify(formData));
        clientSaveOnboardingDraftAction(formData);
        const timeStr = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        setLastSavedTime(timeStr);
      } catch (err) {
        console.error("Failed to auto-save draft:", err);
      }
    }, 1500);

    return () => {
      if (debounceDraftRef.current) clearTimeout(debounceDraftRef.current);
    };
  }, [formData]);

  const toggleDistributor = (dist: string) => {
    setFormData((prev) => {
      const exists = prev.currentDistributors.includes(dist);
      return {
        ...prev,
        currentDistributors: exists
          ? prev.currentDistributors.filter((d: string) => d !== dist)
          : [...prev.currentDistributors, dist],
      };
    });
  };

  const toggleRoyalty = (sol: string) => {
    setFormData((prev) => {
      const exists = prev.royaltySolutions.includes(sol);
      return {
        ...prev,
        royaltySolutions: exists
          ? prev.royaltySolutions.filter((s: string) => s !== sol)
          : [...prev.royaltySolutions, sol],
      };
    });
  };

  const handleArtistChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const updated = [...prev.topArtists];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, topArtists: updated };
    });
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error("Please enter your Company / Organization Name.");
        return false;
      }
    }
    if (step === 2) {
      if (formData.desiredSubdomain) {
        const sub = formData.desiredSubdomain.trim().toLowerCase();
        if (sub.length < 3 || sub.length > 30) {
          toast.error("Subdomain must be between 3 and 30 characters.");
          return false;
        }
        if (subdomainStatus.available === false) {
          toast.error(
            subdomainStatus.reason || "This subdomain is not available.",
          );
          return false;
        }
      }
    }
    if (step === 3) {
      if (
        !formData.contactFirstName.trim() ||
        !formData.contactLastName.trim()
      ) {
        toast.error("Please provide your contact name.");
        return false;
      }
      if (
        !formData.contactEmail.trim() ||
        !formData.contactEmail.includes("@")
      ) {
        toast.error("Please provide a valid contact email.");
        return false;
      }
    }
    if (step === 5) {
      const firstArtist = formData.topArtists[0];
      if (!firstArtist.artistName.trim()) {
        toast.error("Please provide details for at least 1 top roster artist.");
        return false;
      }
    }
    if (step === 6) {
      if (!formData.privacyPolicyAccepted) {
        toast.error(
          "You must accept the Privacy Policy to submit your application.",
        );
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    try {
      const validArtists = formData.topArtists.filter((a: RosterArtist) =>
        Boolean(a.artistName && a.artistName.trim().length > 0),
      );

      const res = await clientApplyWhiteLabelAction({
        ...formData,
        topArtists: validArtists,
      });

      if (res.success) {
        toast.success(res.message);
        localStorage.removeItem("rmit_onboarding_draft");
        await clientClearOnboardingDraftAction();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(
        "An unexpected error occurred while submitting your application.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: "Entity Profile" },
    { num: 2, title: "Branding & URL" },
    { num: 3, title: "Key Contact" },
    { num: 4, title: "Operations" },
    { num: 5, title: "Top Artists" },
    { num: 6, title: "Review & Submit" },
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Bar with Cancel and Auto-Save Status */}
      <div className="flex items-center justify-between">
        {onCancel ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Overview
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Disc3 className="h-4 w-4 text-primary animate-spin-slow" />
            <span className="font-semibold text-foreground">
              RoyalMotionIT Onboarding
            </span>
          </div>
        )}

        {lastSavedTime && (
          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-muted/30 px-2.5 py-1 rounded-full border border-border/60">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span>Draft saved {lastSavedTime}</span>
          </div>
        )}
      </div>

      {/* Progress Stepper Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3">
        <div className="grid grid-cols-6 gap-1 text-center">
          {stepsList.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num);
              }}
              disabled={s.num > currentStep}
              className={`text-[11px] font-semibold truncate transition-colors ${
                currentStep === s.num
                  ? "text-primary font-bold"
                  : currentStep > s.num
                    ? "text-foreground hover:text-primary cursor-pointer"
                    : "text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {s.num}. {s.title}
            </button>
          ))}
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Corporate Profile */}
      {currentStep === 1 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Building2 className="h-4 w-4" />
              Step 1 of 6: Business Entity
            </div>
            <CardTitle className="text-xl font-bold">
              Business & Corporate Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Tell us about your organization and legal business entity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Business Type Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Business Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.businessType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          businessType: type.id,
                        }))
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 bg-card hover:border-border"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-xs text-foreground">
                          {type.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold">
                  Company / Organization Name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Royal Motion Records"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-9.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyWebsite"
                  className="text-xs font-semibold"
                >
                  Company Website
                </Label>
                <Input
                  id="companyWebsite"
                  placeholder="https://yourlabel.com"
                  value={formData.companyWebsite}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyWebsite: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-semibold">
                  Country / Region of Operation
                </Label>
                <Input
                  id="country"
                  placeholder="e.g. United States, United Kingdom, Germany"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="yearsInBusiness"
                  className="text-xs font-semibold"
                >
                  Years in the Music Business
                </Label>
                <Input
                  id="yearsInBusiness"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.yearsInBusiness}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      yearsInBusiness: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>
            </div>

            {/* Incorporation Switch */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">
                    Is your business incorporated?
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Registered LLC, Corporation, GmbH, Ltd, or commercial
                    entity.
                  </p>
                </div>
                <Switch
                  checked={formData.isIncorporated}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isIncorporated: checked,
                    }))
                  }
                />
              </div>

              {formData.isIncorporated && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label
                    htmlFor="incorporationDoc"
                    className="text-xs font-semibold"
                  >
                    Incorporation Document Link or Cloud Storage URL (Optional)
                  </Label>
                  <Input
                    id="incorporationDoc"
                    placeholder="https://drive.google.com/... or cloud document link"
                    value={formData.incorporationDocUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incorporationDocUrl: e.target.value,
                      }))
                    }
                    className="h-9 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    You can also upload verification documents directly to your
                    status portal once your application is submitted.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Branding & Subdomain */}
      {currentStep === 2 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Globe className="h-4 w-4" />
              Step 2 of 6: Identity & Subdomain
            </div>
            <CardTitle className="text-xl font-bold">
              Platform Identity & Subdomain Claim
            </CardTitle>
            <CardDescription className="text-xs">
              Choose your dedicated WhiteLabel portal address and brand color
              scheme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subdomain Input with Real-time Checker (Locked & Auto-derived) */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-card">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="subdomain"
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Platform Subdomain</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-muted font-mono text-muted-foreground"
                >
                  Auto-Slugified • Immutable
                </Badge>
              </div>
              <div className="flex items-center rounded-lg border border-border bg-muted/40 overflow-hidden">
                <Input
                  id="subdomain"
                  readOnly
                  disabled
                  value={
                    formData.desiredSubdomain ||
                    "Auto-generating from brand name..."
                  }
                  className="border-0 focus-visible:ring-0 h-10 text-xs font-mono font-semibold bg-transparent cursor-not-allowed text-foreground opacity-90"
                />
                <span className="text-xs font-mono text-muted-foreground px-3 bg-muted/70 border-l border-border h-10 flex items-center shrink-0">
                  .platform.royalmotionit.com
                </span>
              </div>

              {/* Real-time Status Badge */}
              {formData.desiredSubdomain && (
                <div className="pt-1 flex items-center gap-2 text-xs">
                  {subdomainStatus.checking ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                      Verifying uniqueness in Cloudflare DNS...
                    </span>
                  ) : subdomainStatus.available ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {subdomainStatus.reason ||
                        "Available & unique! Reserved for your brand."}
                    </span>
                  ) : subdomainStatus.available === false ? (
                    <span className="text-destructive font-semibold flex items-center gap-1 text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      {subdomainStatus.reason || "Subdomain is unavailable."}
                    </span>
                  ) : null}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground pt-1">
                Your subdomain is automatically slugified from your brand name
                and verified unique in Cloudflare DNS. It cannot be altered once
                registered.
              </p>
            </div>

            {/* Hosted Server Elastic IPv4 Input (Optional) */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-card">
              <Label
                htmlFor="elasticIpv4"
                className="text-xs font-bold flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-indigo-500" />
                  Hosted Server Elastic IPv4 Address (Optional)
                </span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  AWS / Cloud Server IP
                </span>
              </Label>
              <Input
                id="elasticIpv4"
                placeholder="54.210.12.34"
                value={formData.elasticIpv4}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    elasticIpv4: e.target.value.trim(),
                  }))
                }
                className="h-10 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                If your cloud server is already running, enter its Elastic IPv4.
                Cloudflare DNS will automatically create an A-record routing
                your platform subdomain directly to this address. (You can also
                configure this later in Domain settings).
              </p>
            </div>

            {/* Brand Accent Color */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" />
                Primary Brand Accent Color
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                {BRAND_COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryColor: color.hex,
                      }))
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      formData.primaryColor === color.hex
                        ? "border-foreground ring-2 ring-primary/40 shadow-xs"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Timeline */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Estimated Launch Timeline
              </Label>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {["Immediate", "Within 30 Days", "1-3 Months"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedLaunchTimeline: t,
                      }))
                    }
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      formData.estimatedLaunchTimeline === t
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30 font-bold text-foreground"
                        : "border-border/60 hover:border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Key Contact Person */}
      {currentStep === 3 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <User className="h-4 w-4" />
              Step 3 of 6: Representative
            </div>
            <CardTitle className="text-xl font-bold">
              Key Contact & Authorized Representative
            </CardTitle>
            <CardDescription className="text-xs">
              Provide the primary administrative contact for partnership
              agreements and billing notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="contactFirstName"
                  className="text-xs font-semibold"
                >
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactFirstName"
                  placeholder="e.g. John"
                  value={formData.contactFirstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactFirstName: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="contactLastName"
                  className="text-xs font-semibold"
                >
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactLastName"
                  placeholder="e.g. Doe"
                  value={formData.contactLastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactLastName: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs font-semibold">
                  Work / Executive Email{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@yourlabel.com"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="contactLinkedIn"
                  className="text-xs font-semibold"
                >
                  LinkedIn Profile / Representative Handle
                </Label>
                <Input
                  id="contactLinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.contactLinkedIn}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactLinkedIn: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Catalog Operations */}
      {currentStep === 4 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Music className="h-4 w-4" />
              Step 4 of 6: Operations
            </div>
            <CardTitle className="text-xl font-bold">
              Catalog & Distribution Operations
            </CardTitle>
            <CardDescription className="text-xs">
              Tell us about your distribution volume, revenue, and existing
              systems.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tracks in Master Catalog
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.catalogTrackCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      catalogTrackCount: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Estimated Monthly Releases
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.monthlyTrackDelivery}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyTrackDelivery: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Avg Monthly Revenue ($ USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    value={formData.monthlyRevenueUsd}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        monthlyRevenueUsd: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-9.5 pl-8 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Direct Deals?
                  </span>
                  <Switch
                    checked={formData.hasDirectDeals}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        hasDirectDeals: checked,
                      }))
                    }
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Direct contracts with Spotify, Apple, YouTube, etc.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Catalog Migration?
                  </span>
                  <Switch
                    checked={formData.wantsCatalogMigration}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        wantsCatalogMigration: checked,
                      }))
                    }
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Migrate existing ISRC / UPC catalogs to your instance.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Sample Covers?
                  </span>
                  <Switch
                    checked={formData.hasSampleBasedCovers}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        hasSampleBasedCovers: checked,
                      }))
                    }
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Catalog contains sample-based works or cover versions.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Primary Catalog Language
              </Label>
              <Input
                placeholder="e.g. English, Spanish, French, Hindi"
                value={formData.primaryCatalogLanguage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryCatalogLanguage: e.target.value,
                  }))
                }
                className="h-9.5 text-xs"
              />
            </div>

            {/* Current Distributors */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Current or Past Distribution Partners:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {DISTRIBUTOR_OPTIONS.map((dist) => {
                  const isSelected =
                    formData.currentDistributors.includes(dist);
                  return (
                    <Badge
                      key={dist}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleDistributor(dist)}
                      className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {dist}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Royalty Solutions */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Existing Royalty Solutions:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ROYALTY_OPTIONS.map((sol) => {
                  const isSelected = formData.royaltySolutions.includes(sol);
                  return (
                    <Badge
                      key={sol}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleRoyalty(sol)}
                      className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {sol}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Top 3 Artists */}
      {currentStep === 5 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Headphones className="h-4 w-4" />
              Step 5 of 6: Top Roster Artists
            </div>
            <CardTitle className="text-xl font-bold">
              Top Roster Showcase
            </CardTitle>
            <CardDescription className="text-xs">
              Provide 1 to 3 key artists so our team can prepare direct DSP
              artist mapping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {formData.topArtists.map((artist: RosterArtist, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 font-bold"
                    >
                      {idx + 1} of 3
                    </Badge>
                    <span>Top Artist #{idx + 1}</span>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] text-destructive font-semibold">
                      * At least 1 artist required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      Artist / Band Name
                    </Label>
                    <Input
                      placeholder="e.g. Nova Eclipse"
                      value={artist.artistName}
                      onChange={(e) =>
                        handleArtistChange(idx, "artistName", e.target.value)
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Camera className="h-3 w-3 text-pink-500" />
                      Instagram Handle
                    </Label>
                    <Input
                      placeholder="@artistname"
                      value={artist.instagramHandle}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "instagramHandle",
                          e.target.value,
                        )
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-emerald-500" />
                      Spotify Artist Profile URL
                    </Label>
                    <Input
                      placeholder="https://open.spotify.com/artist/..."
                      value={artist.spotifyProfileUrl}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "spotifyProfileUrl",
                          e.target.value,
                        )
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Video className="h-3 w-3 text-rose-500" />
                      YouTube Channel URL
                    </Label>
                    <Input
                      placeholder="https://youtube.com/@channel"
                      value={artist.youtubeChannelUrl}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "youtubeChannelUrl",
                          e.target.value,
                        )
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* STEP 6: Review Summary & Compliance */}
      {currentStep === 6 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <ShieldCheck className="h-4 w-4" />
              Step 6 of 6: Review & Finalize
            </div>
            <CardTitle className="text-xl font-bold">
              Review Application & Terms
            </CardTitle>
            <CardDescription className="text-xs">
              Verify your information before submission to our platform
              onboarding desk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Signup Model */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                How will users sign up to your WhiteLabel platform?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SIGNUP_MODELS.map((model) => {
                  const isSelected = formData.userSignupModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          userSignupModel: model.id,
                        }))
                      }
                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-0.5 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 bg-card hover:border-border"
                      }`}
                    >
                      <p className="font-bold text-xs text-foreground">
                        {model.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {model.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Summary Dossier */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Application Dossier Summary
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Ready for Review
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Company
                  </span>
                  <strong className="text-foreground">
                    {formData.name || "N/A"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Reserved Subdomain
                  </span>
                  <strong className="text-foreground font-mono text-[11px]">
                    {formData.desiredSubdomain
                      ? `${formData.desiredSubdomain}.platform.royalmotionit.com`
                      : "Pending"}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Business Model
                  </span>
                  <strong className="text-foreground">
                    {BUSINESS_TYPES.find(
                      (t) => t.id === formData.businessType,
                    )?.label || formData.businessType}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Catalog Tracks
                  </span>
                  <strong className="text-foreground">
                    {formData.catalogTrackCount} tracks
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Monthly Ingestion
                  </span>
                  <strong className="text-foreground">
                    {formData.monthlyTrackDelivery} tracks / mo
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Primary Contact
                  </span>
                  <strong className="text-foreground">
                    {formData.contactFirstName} {formData.contactLastName}
                  </strong>
                </div>
              </div>
            </div>

            {/* Privacy Policy & Terms */}
            <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="privacyPolicy"
                  checked={formData.privacyPolicyAccepted}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacyPolicyAccepted: Boolean(checked),
                    }))
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="privacyPolicy"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I certify that the catalog sizing, contact, and legal
                  information provided is accurate. I agree to the{" "}
                  <span className="text-primary underline">
                    RoyalMotionIT Distribution Agreement
                  </span>{" "}
                  and{" "}
                  <span className="text-primary underline">Privacy Policy</span>
                  .
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="marketingConsent"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      marketingConsent: Boolean(checked),
                    }))
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="marketingConsent"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I consent to receiving direct onboarding communications, DSP
                  pipeline status alerts, and agreement drafting notices.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="gap-2 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="gap-2 text-xs font-semibold px-6 shadow-sm"
          >
            Next Step
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 text-xs font-bold px-8 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
          >
            {isSubmitting ? (
              <>Submitting Application...</>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Submit Enterprise Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
