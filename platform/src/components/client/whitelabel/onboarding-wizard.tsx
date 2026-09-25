"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Disc3,
  Globe,
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
  FileText,
  BookOpen,
  Share2,
  Award,
  TrendingUp,
  Radio,
  Database,
  Network,
  BadgeCheck,
  Check,
  Hash,
  ShieldAlert,
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
      "Manage master rights, artist rosters, release schedules, and recoupment splits.",
    icon: Disc3,
  },
  {
    id: WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR,
    label: "Distributor / Aggregator",
    description:
      "High-volume catalog ingestion, sub-labels, DDEX feeds, and anti-fraud QC.",
    icon: Layers,
  },
  {
    id: WhiteLabelBusinessType.MUSIC_PUBLISHER,
    label: "Music Publisher",
    description:
      "Administer musical works, PRO affiliations, mechanicals, and sync licensing.",
    icon: Building2,
  },
  {
    id: WhiteLabelBusinessType.REFERRER,
    label: "Referrer",
    description:
      "Talent scout network, A&R pipeline, label referrals, and tiered residual rev-share.",
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

const RECORD_LABEL_TYPES = [
  { id: "independent", label: "Independent Label" },
  { id: "major_distributed", label: "Major Distributed" },
  { id: "boutique", label: "Boutique / Imprint" },
  { id: "genre_specialist", label: "Genre Specialist" },
];

const SPLIT_STANDARDS = [
  "50/50 Profit Share",
  "70/30 (Artist 70% / Label 30%)",
  "80/20 Standard Indie",
  "85/15 Net Receipts",
  "100% Distribution Service Fee",
];

const DDEX_PROTOCOLS = [
  { id: "DDEX_ERN_4_3", label: "DDEX ERN 4.3 (Modern XML & Cloud Delivery)" },
  { id: "DDEX_ERN_3_8", label: "DDEX ERN 3.8.2 (Industry Standard)" },
  { id: "S3_DIRECT", label: "Amazon S3 Direct Cloud Feed" },
  { id: "SFTP_BATCH", label: "Automated SFTP Batch Ingestion" },
];

const DSP_DIRECT_FEEDS = [
  "Spotify Direct",
  "Apple Music Direct",
  "Amazon Music Direct",
  "YouTube Content ID",
  "TikTok Sound Library",
  "Meta / Instagram",
  "Tidal Direct",
  "Deezer Direct",
];

const PUBLISHING_PROS = [
  "ASCAP (United States)",
  "BMI (United States)",
  "SESAC (United States)",
  "PRS for Music (United Kingdom)",
  "GEMA (Germany)",
  "SACEM (France)",
  "SOCAN (Canada)",
  "APRA / AMCOS (Australia)",
  "Other / Unaffiliated",
];

const SCOUT_CATEGORIES = [
  { id: "talent_scout", label: "A&R / Independent Talent Scout" },
  { id: "recording_studio", label: "Recording Studio / Audio Production House" },
  { id: "music_attorney", label: "Music Attorney / Legal Counsel" },
  { id: "management_agency", label: "Artist & Producer Management Agency" },
  { id: "industry_influencer", label: "Industry Creator / Community Leader" },
];

const COMMISSION_PREFERENCES = [
  { id: "lifetime_rev_share", label: "Lifetime % Net Revenue Share (Residual)" },
  { id: "upfront_bounty", label: "Upfront Bounty Per Activated Client" },
  { id: "hybrid_tiered", label: "Hybrid Tiered Performance (Bounty + Rev Share)" },
];

const TERRITORY_OPTIONS = [
  "Global Worldwide",
  "North America (US & Canada)",
  "United Kingdom & Europe",
  "Latin America (LATAM)",
  "Asia-Pacific & Australasia",
  "Sub-Saharan Africa & Middle East",
];

const DISCOVERY_CHANNELS = [
  "Studio Sessions & Productions",
  "Live Showcases & Tours",
  "Digital & Streaming Playlists",
  "Agency & Legal Client Network",
  "Direct Referral & Word of Mouth",
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
  onboardingDetails?: Record<string, any>;
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

    // Step 5: Portfolio / Roster Highlights (3 items)
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

    // Dynamic Type-Specific Onboarding Payload
    onboardingDetails: initialDraft?.onboardingDetails || {
      // Record Label Fields
      labelType: "independent",
      isrcCountryCode: "US",
      isrcRegistrantCode: "",
      primaryGenre: "Hip-Hop / R&B",
      masterRoyaltySplitStandard: "70/30 (Artist 70% / Label 30%)",
      physicalDistributionNeeded: false,
      dolbyAtmosReady: true,

      // Distributor / Aggregator Fields
      subLabelsCount: 5,
      independentArtistsRepresented: 40,
      ingestionProtocol: "DDEX_ERN_4_3",
      hasDedicatedQcTeam: true,
      antiFraudInspectionRequired: true,
      directDspAgreements: ["Spotify Direct", "Apple Music Direct"],
      bulkBarcodePoolNeeded: true,

      // Music Publisher Fields
      publishingCompanyType: "administration",
      primaryProAffiliation: "ASCAP (United States)",
      ipiCaeNumber: "",
      theMlcMemberCode: "",
      musicalWorksCount: 150,
      songwritersRepresentedCount: 12,
      cwrExchangeEnabled: true,
      collectsMechanicals: true,
      syncLicensingCatalogSize: 50,

      // Referrer / Scout Fields
      scoutNetworkCategory: "talent_scout",
      projectedAnnualReferrals: 10,
      projectedPipelineCatalogSize: 500,
      targetTerritories: ["North America (US & Canada)"],
      preferredCommissionStructure: "lifetime_rev_share",
      discoveryChannels: [
        "Studio Sessions & Productions",
        "Live Showcases & Tours",
      ],
      primaryGenresScouted: ["Hip-Hop / Urban", "Electronic / Dance"],
    },
  });

  const updateOnboardingDetail = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      onboardingDetails: {
        ...prev.onboardingDetails,
        [key]: value,
      },
    }));
  };

  // Auto-slugify company name to unique subdomain via Cloudflare check
  const debounceNameRef = useRef<NodeJS.Timeout | null>(null);
  const handleNameChange = (name: string) => {
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

  const toggleDspFeed = (feed: string) => {
    const current =
      formData.onboardingDetails?.directDspAgreements || [];
    const exists = current.includes(feed);
    const updated = exists
      ? current.filter((f: string) => f !== feed)
      : [...current, feed];
    updateOnboardingDetail("directDspAgreements", updated);
  };

  const toggleDiscoveryChannel = (ch: string) => {
    const current =
      formData.onboardingDetails?.discoveryChannels || [];
    const exists = current.includes(ch);
    const updated = exists
      ? current.filter((c: string) => c !== ch)
      : [...current, ch];
    updateOnboardingDetail("discoveryChannels", updated);
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
      const trimmedIp = formData.elasticIpv4?.trim() || "";
      if (trimmedIp.length > 0) {
        const ipv4Regex =
          /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
        if (!ipv4Regex.test(trimmedIp)) {
          toast.error("Must be a valid IPv4 address (e.g. 54.210.12.34)");
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
      const firstItem = formData.topArtists[0];
      if (!firstItem.artistName.trim()) {
        if (formData.businessType === WhiteLabelBusinessType.RECORD_LABEL) {
          toast.error("Please provide at least 1 top signed roster artist name.");
        } else if (
          formData.businessType ===
          WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
        ) {
          toast.error("Please provide at least 1 representative sub-label or catalog brand.");
        } else if (
          formData.businessType === WhiteLabelBusinessType.MUSIC_PUBLISHER
        ) {
          toast.error("Please provide at least 1 key songwriter or top composition title.");
        } else {
          toast.error("Please provide at least 1 prospective referral client or partner target.");
        }
        return false;
      }
    }
    if (step === 6) {
      if (!formData.privacyPolicyAccepted) {
        toast.error(
          "You must accept the terms & certifications to submit your application.",
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
      const cleanedElasticIpv4 = formData.elasticIpv4?.trim();

      const res = await clientApplyWhiteLabelAction({
        ...formData,
        elasticIpv4: cleanedElasticIpv4 ? cleanedElasticIpv4 : undefined,
        topArtists: validArtists,
        onboardingDetails: formData.onboardingDetails,
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

  const getStep5Title = () => {
    switch (formData.businessType) {
      case WhiteLabelBusinessType.RECORD_LABEL:
        return "Signed Artists";
      case WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR:
        return "Sub-Labels";
      case WhiteLabelBusinessType.MUSIC_PUBLISHER:
        return "Top Works";
      case WhiteLabelBusinessType.REFERRER:
        return "Prospects";
      default:
        return "Portfolio";
    }
  };

  const stepsList = [
    { num: 1, title: "Entity Profile" },
    { num: 2, title: "Branding & URL" },
    { num: 3, title: "Key Contact" },
    { num: 4, title: "Operations" },
    { num: 5, title: getStep5Title() },
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
              RoyalMotionIT Enterprise Onboarding
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
            <div
              key={s.num}
              onClick={() => {
                if (s.num < currentStep) setCurrentStep(s.num);
              }}
              className={`cursor-pointer transition-all ${
                s.num === currentStep
                  ? "text-primary font-bold"
                  : s.num < currentStep
                    ? "text-foreground font-medium"
                    : "text-muted-foreground opacity-60"
              }`}
            >
              <span className="text-[10px] uppercase font-mono block">
                Step {s.num}
              </span>
              <span className="text-xs truncate block">{s.title}</span>
            </div>
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
              Step 1 of 6: Business Entity & Identity
            </div>
            <CardTitle className="text-xl font-bold">
              Business & Corporate Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Select your business model according to global music industry
              standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Business Type Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Select Your Business Type
              </Label>
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
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs"
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
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-foreground">
                            {type.label}
                          </p>
                          {isSelected && (
                            <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </div>
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
                  placeholder={
                    formData.businessType === WhiteLabelBusinessType.RECORD_LABEL
                      ? "e.g. Royal Motion Records"
                      : formData.businessType ===
                          WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                        ? "e.g. Velocity Media Ingestion Group"
                        : formData.businessType ===
                            WhiteLabelBusinessType.MUSIC_PUBLISHER
                          ? "e.g. Sovereign Song Rights Publishing"
                          : "e.g. Metro Talent Scout Agency"
                  }
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyWebsite"
                  className="text-xs font-semibold"
                >
                  Official Website
                </Label>
                <Input
                  id="companyWebsite"
                  placeholder="https://yourbrand.com"
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
                  Primary Country / Jurisdiction
                </Label>
                <Input
                  id="country"
                  placeholder="e.g. United States, United Kingdom, Canada, France"
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
                  Years in Music Industry
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
                  className="h-9.5 text-xs font-mono"
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
                    placeholder="https://drive.google.com/... or verified document link"
                    value={formData.incorporationDocUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        incorporationDocUrl: e.target.value,
                      }))
                    }
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    You can also upload verification documents directly to your
                    status portal once your application is submitted.
                  </p>
                </div>
              )}
            </div>

            {/* Business Type Contextual Meta Badge Card */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-foreground">
                  Configured for{" "}
                  {BUSINESS_TYPES.find((t) => t.id === formData.businessType)
                    ?.label || "Your Entity"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {formData.businessType === WhiteLabelBusinessType.RECORD_LABEL &&
                    "Your platform will activate Master rights ledgers, ISRC allocations, artist roster dashboards, and automated producer split recoupment."}
                  {formData.businessType ===
                    WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                    "Your platform will activate DDEX ERN batch delivery, multi-tenant sub-labels, automated anti-fraud screening, and tiered commission accounting."}
                  {formData.businessType ===
                    WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                    "Your platform will activate Common Works Registration (CWR), PRO/CMO writer administration, mechanical royalty ledgers, and sync licensing."}
                  {formData.businessType === WhiteLabelBusinessType.REFERRER &&
                    "Your platform will activate custom referral links, live affiliate conversion analytics, tiered client residual tracking, and white-glove onboarding passes."}
                </p>
              </div>
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
                  className="text-[10px] font-mono text-muted-foreground"
                >
                  Auto-Verified DNS
                </Badge>
              </div>

              <div className="flex items-center rounded-lg border border-border overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/40">
                <input
                  id="subdomain"
                  type="text"
                  placeholder="yourbrand"
                  value={formData.desiredSubdomain}
                  onChange={(e) => {
                    const clean = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                      .slice(0, 30);
                    setFormData((prev) => ({
                      ...prev,
                      desiredSubdomain: clean,
                    }));
                  }}
                  className="px-3 py-2 text-xs font-mono font-bold bg-transparent outline-none flex-1 min-w-0"
                />
                <span className="px-3 py-2 text-xs font-mono text-muted-foreground bg-muted/40 border-l border-border shrink-0 select-none">
                  .platform.royalmotionit.com
                </span>
              </div>

              {formData.desiredSubdomain && (
                <div className="pt-1">
                  {subdomainStatus.checking ? (
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      Checking Cloudflare availability...
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
                and verified unique in Cloudflare DNS.
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
                your platform subdomain directly to this address.
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
                    className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                      formData.estimatedLaunchTimeline === t
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:border-border"
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
              <Users className="h-4 w-4" />
              Step 3 of 6: Executive Representative
            </div>
            <CardTitle className="text-xl font-bold">
              Account Administrator & Executive Contact
            </CardTitle>
            <CardDescription className="text-xs">
              Who will be managing contracts, DSP legal notices, and royalty
              statements?
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
                  className="h-9.5 text-xs font-medium"
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
                  className="h-9.5 text-xs font-medium"
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
                  placeholder="john@yourbrand.com"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactEmail: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs font-mono"
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
                  className="h-9.5 text-xs font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: DYNAMIC OPERATIONS BY BUSINESS TYPE */}
      {currentStep === 4 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Music className="h-4 w-4" />
              Step 4 of 6: Operational Infrastructure
            </div>
            <CardTitle className="text-xl font-bold">
              {formData.businessType === WhiteLabelBusinessType.RECORD_LABEL &&
                "Master Catalog & Release Operations"}
              {formData.businessType ===
                WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                "Aggregator Ingestion & Sub-Tenant Operations"}
              {formData.businessType ===
                WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                "Publishing Works & Rights Administration"}
              {formData.businessType === WhiteLabelBusinessType.REFERRER &&
                "Scout Network & Pipeline Operations"}
            </CardTitle>
            <CardDescription className="text-xs">
              Configure telemetry according to global music industry operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 1. RECORD LABEL VIEW */}
            {formData.businessType === WhiteLabelBusinessType.RECORD_LABEL && (
              <div className="space-y-5">
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
                      Avg Monthly Master Revenue ($ USD)
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Label Category
                    </Label>
                    <select
                      value={formData.onboardingDetails?.labelType || "independent"}
                      onChange={(e) =>
                        updateOnboardingDetail("labelType", e.target.value)
                      }
                      className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                    >
                      {RECORD_LABEL_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      ISRC Registrant Prefix (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. US-XX1"
                      value={formData.onboardingDetails?.isrcRegistrantCode || ""}
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "isrcRegistrantCode",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className="h-9.5 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Standard Artist Royalty Split Model
                  </Label>
                  <select
                    value={
                      formData.onboardingDetails?.masterRoyaltySplitStandard ||
                      SPLIT_STANDARDS[1]
                    }
                    onChange={(e) =>
                      updateOnboardingDetail(
                        "masterRoyaltySplitStandard",
                        e.target.value,
                      )
                    }
                    className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {SPLIT_STANDARDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
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
                      Direct contract feeds with Spotify, Apple, YouTube.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Dolby Atmos?
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails?.dolbyAtmosReady ?? true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail("dolbyAtmosReady", checked)
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Spatial Audio ADM BWF WAV audio delivery.
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
                      Import existing ISRC / UPC catalogs automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DISTRIBUTOR / AGGREGATOR VIEW */}
            {formData.businessType ===
              WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Sub-Labels Represented
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.onboardingDetails?.subLabelsCount ?? 5}
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "subLabelsCount",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Independent Creators Represented
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={
                        formData.onboardingDetails
                          ?.independentArtistsRepresented ?? 50
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "independentArtistsRepresented",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Monthly Ingestion Capacity (Tracks)
                    </Label>
                    <Input
                      type="number"
                      min={100}
                      value={formData.monthlyTrackDelivery || 500}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthlyTrackDelivery: Number(e.target.value) || 500,
                        }))
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Automated Ingestion & Batch Protocol
                  </Label>
                  <select
                    value={
                      formData.onboardingDetails?.ingestionProtocol ||
                      "DDEX_ERN_4_3"
                    }
                    onChange={(e) =>
                      updateOnboardingDetail("ingestionProtocol", e.target.value)
                    }
                    className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                  >
                    {DDEX_PROTOCOLS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Direct DSP Delivery Pipelines Active:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DSP_DIRECT_FEEDS.map((feed) => {
                      const isSelected = (
                        formData.onboardingDetails?.directDspAgreements || []
                      ).includes(feed);
                      return (
                        <Badge
                          key={feed}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => toggleDspFeed(feed)}
                          className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {feed}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Dedicated QC Team?
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails?.hasDedicatedQcTeam ?? true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail("hasDedicatedQcTeam", checked)
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      In-house review staff for artwork & audio quality.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Anti-Fraud Screening
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails
                            ?.antiFraudInspectionRequired ?? true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail(
                            "antiFraudInspectionRequired",
                            checked,
                          )
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Automated artificial streaming detection & audio fingerprinting.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Barcode Pool Needed
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails?.bulkBarcodePoolNeeded ??
                          true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail(
                            "bulkBarcodePoolNeeded",
                            checked,
                          )
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Automated UPC/EAN allocation for sub-labels.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Client Onboarding & Signup Model on WhiteLabel
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SIGNUP_MODELS.map((model) => (
                      <div
                        key={model.id}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            userSignupModel: model.id,
                          }))
                        }
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.userSignupModel === model.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-semibold text-primary"
                            : "border-border/60 hover:border-border text-muted-foreground"
                        }`}
                      >
                        <p className="text-xs font-bold text-foreground">
                          {model.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {model.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MUSIC PUBLISHER VIEW */}
            {formData.businessType ===
              WhiteLabelBusinessType.MUSIC_PUBLISHER && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Registered Musical Works in Catalog
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={
                        formData.onboardingDetails?.musicalWorksCount ?? 150
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "musicalWorksCount",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Songwriters & Composers Represented
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={
                        formData.onboardingDetails
                          ?.songwritersRepresentedCount ?? 15
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "songwritersRepresentedCount",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Primary PRO / CMO Affiliation
                    </Label>
                    <select
                      value={
                        formData.onboardingDetails?.primaryProAffiliation ||
                        PUBLISHING_PROS[0]
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "primaryProAffiliation",
                          e.target.value,
                        )
                      }
                      className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                    >
                      {PUBLISHING_PROS.map((pro) => (
                        <option key={pro} value={pro}>
                          {pro}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Publisher IPI / CAE Number (9 Digits)
                    </Label>
                    <Input
                      placeholder="e.g. 00812345678"
                      value={formData.onboardingDetails?.ipiCaeNumber || ""}
                      onChange={(e) =>
                        updateOnboardingDetail("ipiCaeNumber", e.target.value)
                      }
                      className="h-9.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        CWR Integration
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails?.cwrExchangeEnabled ?? true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail("cwrExchangeEnabled", checked)
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Common Works Registration format export for global PROs.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Mechanicals
                      </span>
                      <Switch
                        checked={
                          formData.onboardingDetails?.collectsMechanicals ??
                          true
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail("collectsMechanicals", checked)
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Direct collection from The MLC, Harry Fox Agency, and MCPS.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Sync Pitch Vault
                      </span>
                      <Switch
                        checked={
                          (formData.onboardingDetails
                            ?.syncLicensingCatalogSize ?? 50) > 0
                        }
                        onCheckedChange={(checked) =>
                          updateOnboardingDetail(
                            "syncLicensingCatalogSize",
                            checked ? 50 : 0,
                          )
                        }
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Metadata tagging for film, TV, and gaming sync licensing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. REFERRER / SCOUT VIEW */}
            {formData.businessType === WhiteLabelBusinessType.REFERRER && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Scout Network Practice Category
                    </Label>
                    <select
                      value={
                        formData.onboardingDetails?.scoutNetworkCategory ||
                        "talent_scout"
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "scoutNetworkCategory",
                          e.target.value,
                        )
                      }
                      className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                    >
                      {SCOUT_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Projected Annual Partner Referrals
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={
                        formData.onboardingDetails?.projectedAnnualReferrals ??
                        15
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "projectedAnnualReferrals",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Estimated Pipeline Aggregate Tracks
                    </Label>
                    <Input
                      type="number"
                      min={50}
                      value={
                        formData.onboardingDetails
                          ?.projectedPipelineCatalogSize ?? 1000
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "projectedPipelineCatalogSize",
                          Number(e.target.value) || 50,
                        )
                      }
                      className="h-9.5 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Preferred Commission Incentive Model
                    </Label>
                    <select
                      value={
                        formData.onboardingDetails
                          ?.preferredCommissionStructure || "lifetime_rev_share"
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "preferredCommissionStructure",
                          e.target.value,
                        )
                      }
                      className="w-full h-9.5 rounded-lg border border-border bg-background px-3 text-xs"
                    >
                      {COMMISSION_PREFERENCES.map((pref) => (
                        <option key={pref.id} value={pref.id}>
                          {pref.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Primary Talent Discovery Channels:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DISCOVERY_CHANNELS.map((ch) => {
                      const isSelected = (
                        formData.onboardingDetails?.discoveryChannels || []
                      ).includes(ch);
                      return (
                        <Badge
                          key={ch}
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => toggleDiscoveryChannel(ch)}
                          className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {ch}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Universal Distribution & Royalty Tools for Labels & Aggregators */}
            {formData.businessType !== WhiteLabelBusinessType.REFERRER && (
              <div className="space-y-4 pt-3 border-t border-border/50">
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

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Existing Royalty Accounting Software:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROYALTY_OPTIONS.map((sol) => {
                      const isSelected =
                        formData.royaltySolutions.includes(sol);
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 5: DYNAMIC PORTFOLIO / ROSTER HIGHLIGHTS */}
      {currentStep === 5 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Headphones className="h-4 w-4" />
              Step 5 of 6: Portfolio &amp; Roster Highlights
            </div>
            <CardTitle className="text-xl font-bold">
              {formData.businessType === WhiteLabelBusinessType.RECORD_LABEL &&
                "Top Signed Roster Artists"}
              {formData.businessType ===
                WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                "Representative Sub-Labels & Catalogs"}
              {formData.businessType ===
                WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                "Key Songwriters & Top Compositions"}
              {formData.businessType === WhiteLabelBusinessType.REFERRER &&
                "Pipeline Referral Prospects & Target Clients"}
            </CardTitle>
            <CardDescription className="text-xs">
              {formData.businessType === WhiteLabelBusinessType.RECORD_LABEL &&
                "Provide 1 to 3 key artists so our team can verify streaming DSP profile mappings."}
              {formData.businessType ===
                WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                "Highlight 1 to 3 flagship sub-labels or catalog brands your aggregator will distribute."}
              {formData.businessType ===
                WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                "List 1 to 3 key songwriters or compositions in your publishing administration."}
              {formData.businessType === WhiteLabelBusinessType.REFERRER &&
                "Provide 1 to 3 flagship prospect partners or labels in your active onboarding pipeline."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.topArtists.map((item: RosterArtist, idx: number) => (
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
                    <span>
                      {formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL &&
                        `Signed Artist #${idx + 1}`}
                      {formData.businessType ===
                        WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                        `Sub-Label Partner #${idx + 1}`}
                      {formData.businessType ===
                        WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                        `Songwriter / Work #${idx + 1}`}
                      {formData.businessType ===
                        WhiteLabelBusinessType.REFERRER &&
                        `Pipeline Prospect #${idx + 1}`}
                    </span>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] text-destructive font-semibold">
                      * At least 1 entry required
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      {formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL &&
                        "Artist / Band Name"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                        "Sub-Label / Brand Name"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                        "Songwriter / Composer Name"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.REFERRER &&
                        "Prospect Entity / Artist Name"}
                    </Label>
                    <Input
                      placeholder={
                        formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL
                          ? "e.g. Nova Eclipse"
                          : formData.businessType ===
                              WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                            ? "e.g. Hyperion Electronic Records"
                            : formData.businessType ===
                                WhiteLabelBusinessType.MUSIC_PUBLISHER
                              ? "e.g. Marcus Vance"
                              : "e.g. Zenith Wave Studios"
                      }
                      value={item.artistName}
                      onChange={(e) =>
                        handleArtistChange(idx, "artistName", e.target.value)
                      }
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      {formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL && (
                        <>
                          <Camera className="h-3 w-3 text-pink-500" />
                          Instagram Handle
                        </>
                      )}
                      {formData.businessType ===
                        WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR && (
                        <>
                          <Globe className="h-3 w-3 text-blue-500" />
                          Sub-Label Country / Territory
                        </>
                      )}
                      {formData.businessType ===
                        WhiteLabelBusinessType.MUSIC_PUBLISHER && (
                        <>
                          <Building2 className="h-3 w-3 text-indigo-500" />
                          Writer PRO Affiliation
                        </>
                      )}
                      {formData.businessType ===
                        WhiteLabelBusinessType.REFERRER && (
                        <>
                          <Network className="h-3 w-3 text-emerald-500" />
                          Current Distribution Status
                        </>
                      )}
                    </Label>
                    <Input
                      placeholder={
                        formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL
                          ? "@artisthandle"
                          : formData.businessType ===
                              WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                            ? "e.g. United Kingdom"
                            : formData.businessType ===
                                WhiteLabelBusinessType.MUSIC_PUBLISHER
                              ? "e.g. ASCAP or BMI"
                              : "e.g. Self-releasing or DistroKid"
                      }
                      value={item.instagramHandle}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "instagramHandle",
                          e.target.value,
                        )
                      }
                      className="h-8.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-emerald-500" />
                      {formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL &&
                        "Spotify Profile Link"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                        "Sub-Label Website or Catalog Link"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                        "Top Composition Title / ISWC Code"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.REFERRER &&
                        "Music / Portfolio Link"}
                    </Label>
                    <Input
                      placeholder={
                        formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL
                          ? "https://open.spotify.com/artist/..."
                          : formData.businessType ===
                              WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                            ? "https://hyperionrecords.com"
                            : formData.businessType ===
                                WhiteLabelBusinessType.MUSIC_PUBLISHER
                              ? "e.g. Midnight Horizon (ISWC: T-034523829-1)"
                              : "https://soundcloud.com/prospect"
                      }
                      value={item.spotifyProfileUrl}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "spotifyProfileUrl",
                          e.target.value,
                        )
                      }
                      className="h-8.5 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Video className="h-3 w-3 text-rose-500" />
                      {formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL &&
                        "YouTube Channel URL"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                        "Primary Genre Focus"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                        "Publisher Ownership Split (%)"}
                      {formData.businessType ===
                        WhiteLabelBusinessType.REFERRER &&
                        "Prospect Category (Label / Artist)"}
                    </Label>
                    <Input
                      placeholder={
                        formData.businessType ===
                        WhiteLabelBusinessType.RECORD_LABEL
                          ? "https://youtube.com/@artist"
                          : formData.businessType ===
                              WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR
                            ? "e.g. Electronic / Dance"
                            : formData.businessType ===
                                WhiteLabelBusinessType.MUSIC_PUBLISHER
                              ? "e.g. 50% Publisher / 50% Writer"
                              : "e.g. Independent Record Label"
                      }
                      value={item.youtubeChannelUrl}
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

      {/* STEP 6: DYNAMIC REVIEW & COMPLIANCE */}
      {currentStep === 6 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <ShieldCheck className="h-4 w-4" />
              Step 6 of 6: Review Application &amp; Legal Terms
            </div>
            <CardTitle className="text-xl font-bold">
              Review Application &amp; Confirm Terms
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your operational profile and accept the distribution
              platform agreements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Dynamic Application Summary Dossier */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Application Dossier Summary
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                >
                  Ready for Submission
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Organization
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
                    Business Entity
                  </span>
                  <strong className="text-foreground">
                    {BUSINESS_TYPES.find(
                      (t) => t.id === formData.businessType,
                    )?.label || formData.businessType}
                  </strong>
                </div>

                {/* Specific Metric 1 */}
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    {formData.businessType ===
                      WhiteLabelBusinessType.RECORD_LABEL && "Master Catalog"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                      "Sub-Labels Represented"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                      "Musical Works"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.REFERRER &&
                      "Network Category"}
                  </span>
                  <strong className="text-foreground">
                    {formData.businessType ===
                      WhiteLabelBusinessType.RECORD_LABEL &&
                      `${formData.catalogTrackCount} tracks`}
                    {formData.businessType ===
                      WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                      `${formData.onboardingDetails?.subLabelsCount || 5} labels`}
                    {formData.businessType ===
                      WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                      `${formData.onboardingDetails?.musicalWorksCount || 150} works`}
                    {formData.businessType ===
                      WhiteLabelBusinessType.REFERRER &&
                      (formData.onboardingDetails?.scoutNetworkCategory?.replace(
                        /_/g,
                        " ",
                      ) || "Talent Scout")}
                  </strong>
                </div>

                {/* Specific Metric 2 */}
                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    {formData.businessType ===
                      WhiteLabelBusinessType.RECORD_LABEL && "Monthly Releases"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                      "Ingestion Protocol"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                      "Primary PRO"}
                    {formData.businessType ===
                      WhiteLabelBusinessType.REFERRER &&
                      "Projected Pipeline"}
                  </span>
                  <strong className="text-foreground">
                    {formData.businessType ===
                      WhiteLabelBusinessType.RECORD_LABEL &&
                      `${formData.monthlyTrackDelivery} tracks / mo`}
                    {formData.businessType ===
                      WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                      (formData.onboardingDetails?.ingestionProtocol ||
                        "DDEX ERN 4.3")}
                    {formData.businessType ===
                      WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                      (formData.onboardingDetails?.primaryProAffiliation?.split(
                        " ",
                      )[0] || "ASCAP")}
                    {formData.businessType ===
                      WhiteLabelBusinessType.REFERRER &&
                      `${formData.onboardingDetails?.projectedAnnualReferrals || 15} referrals / yr`}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Primary Representative
                  </span>
                  <strong className="text-foreground truncate block">
                    {formData.contactFirstName} {formData.contactLastName}
                  </strong>
                </div>
              </div>
            </div>

            {/* Dynamic Compliance & Terms Agreement */}
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
                  {formData.businessType ===
                    WhiteLabelBusinessType.RECORD_LABEL &&
                    "I certify that our organization holds master sound recording rights or exclusive digital distribution rights for all submitted catalogs. I agree to the "}
                  {formData.businessType ===
                    WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR &&
                    "I certify that all represented sub-labels have executed valid digital distribution licenses and our ingestion pipeline strictly complies with anti-fraud streaming policies. I agree to the "}
                  {formData.businessType ===
                    WhiteLabelBusinessType.MUSIC_PUBLISHER &&
                    "I certify that our publishing administration holds valid composition rights and accurate PRO/CMO writer splits. I agree to the "}
                  {formData.businessType === WhiteLabelBusinessType.REFERRER &&
                    "I certify that all referral partner representations, discovery channels, and affiliate terms comply with the Partner Code of Conduct. I agree to the "}
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
                  pipeline telemetry alerts, and agreement drafting notices from
                  the enterprise onboarding desk.
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
