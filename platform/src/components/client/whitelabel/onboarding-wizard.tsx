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
  Plus,
  Trash2,
  Edit3,
  Clock,
  Briefcase,
  Phone,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientApplyWhiteLabelAction } from "@/actions/client/whitelabel/client-apply-whitelabel.action";
import { clientApplyReferrerAction } from "@/actions/client/referrer/client-apply-referrer.action";
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

export type OnboardingTrack = "DISTRIBUTOR" | "REFERRER";

export const ONBOARDING_TRACKS = [
  {
    id: "DISTRIBUTOR" as OnboardingTrack,
    label: "Distributor / Aggregator",
    badge: "Distribution Platform",
    description:
      "High-volume catalog ingestion, multi-tenant sub-labels, DDEX ERN 4.3 feeds, and automated anti-fraud QC.",
    icon: Layers,
  },
  {
    id: "REFERRER" as OnboardingTrack,
    label: "Referrer Partner",
    badge: "Bounty Program",
    description:
      "Refer Distribution Aggregator accounts to earn 15% commission of gross selling price (Min deal: ৳60,000 BDT). Managed at /referrer.",
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

const CATALOG_LANGUAGE_OPTIONS = [
  "English",
  "Bengali",
  "Multi-Language",
  "Hindi / Urdu",
  "Spanish",
  "Arabic",
  "French",
  "Portuguese",
  "Instrumental",
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

const DDEX_PROTOCOLS = [
  { id: "DDEX_ERN_4_3", label: "DDEX ERN 4.3 (Modern XML & Cloud Delivery)" },
  { id: "DDEX_ERN_3_8", label: "DDEX ERN 3.8.2 (Industry Standard)" },
  { id: "S3_DIRECT", label: "Amazon S3 Direct Cloud Feed" },
  { id: "SFTP_BATCH", label: "Automated SFTP Batch Ingestion" },
];

const SCOUT_CATEGORIES = [
  { id: "talent_scout", label: "A&R / Independent Talent Scout" },
  { id: "recording_studio", label: "Recording Studio / Audio Production House" },
  { id: "music_attorney", label: "Music Attorney / Legal Counsel" },
  { id: "management_agency", label: "Artist & Producer Management Agency" },
  { id: "industry_influencer", label: "Industry Creator / Community Leader" },
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
  { name: "Slate", hex: "#334155" },
  { name: "Crimson", hex: "#dc2626" },
];

const ACCENT_COLOR_PRESETS = [
  { name: "Pink / Fuchsia", hex: "#ec4899" },
  { name: "Cyan / Sky", hex: "#06b6d4" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Amber / Gold", hex: "#f59e0b" },
  { name: "Violet / Purple", hex: "#8b5cf6" },
  { name: "Indigo", hex: "#6366f1" },
];

const GENRE_OPTIONS = [
  "Multi-Genre / All Genres",
  "Electronic / Dance / EDM",
  "Hip-Hop / Rap / Trap",
  "Pop / Commercial",
  "R&B / Soul / Urban",
  "Rock / Alternative / Metal",
  "Classical / Cinematic / Instrumental",
  "Traditional / Folk / World",
  "Devotional / Spiritual",
  "Jazz / Blues / Acoustic",
];

const EXECUTIVE_ROLES = [
  "CEO / Founder",
  "Managing Director",
  "Head of Operations",
  "VP of A&R / Ingestion",
  "General Counsel / Legal",
  "Catalog Delivery Manager",
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
  track?: OnboardingTrack;
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
  accentColor?: string;
  tagline?: string;
  description?: string;
  estimatedLaunchTimeline?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactLinkedIn?: string;
  supportEmail?: string;
  supportPhone?: string;
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
    // Account Track: "DISTRIBUTOR" | "REFERRER"
    track: (((initialDraft as any)?.track ||
      ((initialDraft as any)?.businessType === "REFERRER"
        ? "REFERRER"
        : "DISTRIBUTOR")) as OnboardingTrack),
    // Step 1: Corporate Profile
    name: initialDraft?.name || "",
    businessType: WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR,
    companyWebsite: initialDraft?.companyWebsite || "",
    country: initialDraft?.country || "",
    yearsInBusiness: initialDraft?.yearsInBusiness ?? 1,
    isIncorporated: initialDraft?.isIncorporated ?? false,
    incorporationDocUrl: initialDraft?.incorporationDocUrl || "",

    // Step 2: Branding & Subdomain
    desiredSubdomain:
      initialDraft?.desiredSubdomain || initialDraft?.subdomain || "",
    primaryColor: initialDraft?.primaryColor || "#6366f1",
    accentColor: initialDraft?.accentColor || "#ec4899",
    tagline: initialDraft?.tagline || "",
    description: initialDraft?.description || "",
    estimatedLaunchTimeline:
      initialDraft?.estimatedLaunchTimeline || "Immediate",

    // Step 3: Contact Person
    contactFirstName: initialDraft?.contactFirstName || user.firstName || "",
    contactLastName: initialDraft?.contactLastName || user.lastName || "",
    contactEmail: initialDraft?.contactEmail || user.email || "",
    contactWhatsApp: initialDraft?.contactWhatsApp || "",
    contactLinkedIn: initialDraft?.contactLinkedIn || "",
    supportEmail: initialDraft?.supportEmail || "",
    supportPhone: initialDraft?.supportPhone || "",

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
      // Distributor / Aggregator Fields ONLY
      primaryGenre: "Multi-Genre / All Genres",
      subLabelsCount: 5,
      independentArtistsRepresented: 40,
      ingestionProtocol: "DDEX_ERN_4_3",
      hasDedicatedQcTeam: true,
      antiFraudInspectionRequired: true,
      directDspAgreements: ["Spotify Direct", "Apple Music Direct"],
      bulkBarcodePoolNeeded: true,

      // Referrer Partner Fields ONLY (strictly no genre, no catalog, no music distribution fields)
      referralNetworkCode: "",
      payoutMethod: "BKASH",
      payoutBankName: "",
      payoutAccountName: "",
      payoutAccountHolderName: "",
      payoutAccountNumber: "",
      payoutWalletNumber: "",
      payoutBranchDistrict: "",
      payoutBankBranch: "",
      payoutBankRouting: "",
      payoutSwiftCode: "",
      minimumAccountSellingPriceBdt: 60000,
      commissionPercentage: 15,
      simulatedDealPriceBdt: 60000,
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
    if (formData.track === "REFERRER") {
      setFormData((prev) => ({
        ...prev,
        name,
        desiredSubdomain: "",
      }));
      setSubdomainStatus({ checking: false, available: undefined });
      return;
    }

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
    if (formData.track === "REFERRER") {
      setSubdomainStatus({ checking: false, available: undefined });
      return;
    }

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

  const handleAddArtist = () => {
    if (formData.topArtists.length >= 5) {
      toast.info("Maximum 5 representative sub-labels allowed during onboarding.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      topArtists: [
        ...prev.topArtists,
        {
          artistName: "",
          instagramHandle: "",
          spotifyProfileUrl: "",
          youtubeChannelUrl: "",
          monthlyListeners: 0,
          orderIndex: prev.topArtists.length + 1,
        },
      ],
    }));
  };

  const handleRemoveArtist = (index: number) => {
    if (formData.topArtists.length <= 1) {
      toast.error("At least 1 representative sub-label or brand partner is required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      topArtists: prev.topArtists
        .filter((_, idx) => idx !== index)
        .map((a, idx) => ({ ...a, orderIndex: idx + 1 })),
    }));
  };

  const isReferrer = formData.track === "REFERRER";
  const maxSteps = isReferrer ? 4 : 6;

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error(
          isReferrer
            ? "Please enter your Partner / Agency Name."
            : "Please enter your Company / Organization Name.",
        );
        return false;
      }
      if (!formData.country.trim()) {
        toast.error("Please enter your country / territory.");
        return false;
      }
    }

    if (isReferrer) {
      if (step === 2) {
        if (
          !formData.contactFirstName.trim() ||
          !formData.contactLastName.trim()
        ) {
          toast.error("Please provide the partner representative name.");
          return false;
        }
        if (
          !formData.contactEmail.trim() ||
          !formData.contactEmail.includes("@")
        ) {
          toast.error("Please provide a valid work email.");
          return false;
        }
        if (!formData.contactWhatsApp.trim()) {
          toast.error("Please provide a WhatsApp number for the key contact.");
          return false;
        }
      }
      if (step === 3) {
        const payoutMethod =
          formData.onboardingDetails?.payoutMethod || "BKASH";
        if (payoutMethod === "BANK_TRANSFER") {
          const bankName = formData.onboardingDetails?.payoutBankName?.trim();
          const accountName = (
            formData.onboardingDetails?.payoutAccountName ||
            formData.onboardingDetails?.payoutAccountHolderName
          )?.trim();
          const accountNo =
            formData.onboardingDetails?.payoutAccountNumber?.trim();
          const branchDistrict =
            formData.onboardingDetails?.payoutBranchDistrict?.trim();
          const branchName =
            formData.onboardingDetails?.payoutBankBranch?.trim();
          const routingNumber =
            formData.onboardingDetails?.payoutBankRouting?.trim();
          const swiftCode =
            formData.onboardingDetails?.payoutSwiftCode?.trim();

          if (!bankName) {
            toast.error("Please enter the Bank Name.");
            return false;
          }
          if (!accountName) {
            toast.error("Please enter the Account Name.");
            return false;
          }
          if (!accountNo) {
            toast.error("Please enter the Bank Account Number.");
            return false;
          }
          if (!branchDistrict) {
            toast.error("Please enter the Branch District.");
            return false;
          }
          if (!branchName) {
            toast.error("Please enter the Branch Name.");
            return false;
          }
          if (!routingNumber) {
            toast.error("Please enter the Routing Number.");
            return false;
          }
          if (!swiftCode) {
            toast.error("Please enter the Swift Code.");
            return false;
          }
        } else {
          // MFS: bKash, Nagad, Rocket
          const walletNumber = (
            formData.onboardingDetails?.payoutWalletNumber ||
            formData.onboardingDetails?.payoutAccountNumber
          )?.trim();
          if (!walletNumber) {
            toast.error(
              `Please enter your ${
                payoutMethod === "BKASH"
                  ? "bKash"
                  : payoutMethod === "NAGAD"
                    ? "Nagad"
                    : "Rocket"
              } wallet number.`,
            );
            return false;
          }
        }
      }
      if (step === 4) {
        if (!formData.privacyPolicyAccepted) {
          toast.error(
            "You must agree to the 15% partner terms to submit your application.",
          );
          return false;
        }
      }
    } else {
      // Distributor Aggregator
      if (step === 2) {
        if (!formData.desiredSubdomain || !formData.desiredSubdomain.trim()) {
          toast.error("Please enter your desired platform subdomain.");
          return false;
        }
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
        if (!formData.contactWhatsApp.trim()) {
          toast.error("Please provide your WhatsApp number.");
          return false;
        }
      }
      if (step === 5) {
        const firstItem = formData.topArtists[0];
        if (!firstItem?.artistName?.trim()) {
          toast.error(
            "Please provide at least 1 representative sub-label or catalog brand.",
          );
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
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(maxSteps, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(maxSteps)) return;

    setIsSubmitting(true);
    try {
      const validArtists = isReferrer
        ? []
        : formData.topArtists.filter((a: RosterArtist) =>
            Boolean(a.artistName && a.artistName.trim().length > 0),
          );

      let res;
      if (isReferrer) {
        const payoutMethod =
          formData.onboardingDetails?.payoutMethod || "BANK_TRANSFER";
        const accountHolderName = (
          formData.onboardingDetails?.payoutAccountName ||
          formData.onboardingDetails?.payoutAccountHolderName ||
          `${formData.contactFirstName} ${formData.contactLastName}`
        ).trim();

        res = await clientApplyReferrerAction({
          name: formData.name,
          referralCode: formData.onboardingDetails?.referralNetworkCode || undefined,
          companyWebsite: formData.companyWebsite || undefined,
          country: formData.country.trim(),
          yearsInBusiness: formData.yearsInBusiness || 0,
          isIncorporated: formData.isIncorporated || false,
          incorporationDocUrl: formData.incorporationDocUrl || undefined,
          contactFirstName: formData.contactFirstName,
          contactLastName: formData.contactLastName,
          contactEmail: formData.contactEmail,
          contactPhone:
            (formData.onboardingDetails as any)?.contactPhone || undefined,
          contactWhatsApp: formData.contactWhatsApp.trim(),
          contactLinkedIn: formData.contactLinkedIn || undefined,
          payoutMethod,
          bankName: formData.onboardingDetails?.payoutBankName?.trim() || undefined,
          accountName: accountHolderName || undefined,
          accountNumber:
            formData.onboardingDetails?.payoutAccountNumber?.trim() || undefined,
          branchDistrict:
            formData.onboardingDetails?.payoutBranchDistrict?.trim() || undefined,
          branchName:
            formData.onboardingDetails?.payoutBankBranch?.trim() || undefined,
          routingNumber:
            formData.onboardingDetails?.payoutBankRouting?.trim() || undefined,
          swiftCode: (
            formData.onboardingDetails?.payoutSwiftCode || ""
          )
            .trim()
            .toUpperCase() || undefined,
          walletNumber:
            formData.onboardingDetails?.payoutWalletNumber?.trim() || undefined,
          onboardingDetails: {
            commissionPercentage: 15,
            minimumAccountSellingPriceBdt: 60000,
            simulatedDealPriceBdt:
              formData.onboardingDetails?.simulatedDealPriceBdt || 60000,
            ...formData.onboardingDetails,
          },
        });
      } else {
        const { track, estimatedLaunchTimeline, ...cleanWhiteLabelData } = formData;
        res = await clientApplyWhiteLabelAction({
          ...cleanWhiteLabelData,
          country: formData.country.trim(),
          contactWhatsApp: formData.contactWhatsApp.trim(),
          desiredSubdomain: formData.desiredSubdomain,
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
          tagline: formData.tagline?.trim() || undefined,
          description: formData.description?.trim() || undefined,
          supportEmail: formData.supportEmail?.trim() || undefined,
          supportPhone: formData.supportPhone?.trim() || undefined,
          topArtists: validArtists,
          catalogTrackCount: formData.catalogTrackCount,
          monthlyTrackDelivery: formData.monthlyTrackDelivery,
          monthlyRevenueUsd: formData.monthlyRevenueUsd,
          hasDirectDeals: formData.hasDirectDeals,
          currentDistributors: formData.currentDistributors,
          royaltySolutions: formData.royaltySolutions,
          wantsCatalogMigration: formData.wantsCatalogMigration,
          hasSampleBasedCovers: formData.hasSampleBasedCovers,
          userSignupModel: formData.userSignupModel,
          onboardingDetails: {
            ...formData.onboardingDetails,
            estimatedLaunchTimeline: formData.estimatedLaunchTimeline,
          },
        });
      }

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

  const stepsList = isReferrer
    ? [
        { num: 1, title: "Partner Profile" },
        { num: 2, title: "Key Contact" },
        { num: 3, title: "Remittance Setup" },
        { num: 4, title: "Terms & Submit" },
      ]
    : [
        { num: 1, title: "Entity Profile" },
        { num: 2, title: "Branding & URL" },
        { num: 3, title: "Key Contact" },
        { num: 4, title: "Operations" },
        { num: 5, title: "Sub-Labels" },
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
        <div
          className={`grid ${
            isReferrer ? "grid-cols-4" : "grid-cols-6"
          } gap-1 text-center`}
        >
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
            style={{ width: `${(currentStep / maxSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Corporate Profile */}
      {currentStep === 1 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Building2 className="h-4 w-4" />
              {isReferrer
                ? "Step 1 of 4: Partner Entity & Identity"
                : "Step 1 of 6: Business Entity & Identity"}
            </div>
            <CardTitle className="text-xl font-bold">
              {isReferrer
                ? "Partner & Agency Profile"
                : "Business & Corporate Profile"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isReferrer
                ? "Provide your commercial agency or partner profile to join the distribution partner network."
                : "Select your business model according to global music industry standards."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Account Model / Track Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Select Your Onboarding Track
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ONBOARDING_TRACKS.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.track === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          track: type.id,
                          ...(type.id === "REFERRER"
                            ? { desiredSubdomain: "" }
                            : {}),
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
                  {isReferrer ? "Partner / Agency Name" : "Company / Organization Name"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder={
                    isReferrer
                      ? "e.g. Metro Talent Scout Agency"
                      : "e.g. Velocity Media Ingestion Group"
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
                  Primary Country / Jurisdiction <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  placeholder="e.g. United States, United Kingdom, Canada, France, Bangladesh"
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
                  {ONBOARDING_TRACKS.find((t) => t.id === formData.track)
                    ?.label || "Your Entity"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isReferrer
                    ? "Earn a fixed 15% commission on the gross selling value of referred Distribution Aggregator accounts (Min deal: ৳60,000 BDT). Managed at platform.royalmotionit.com/referrer."
                    : "Your platform will activate DDEX ERN batch delivery, multi-tenant sub-labels, automated anti-fraud screening, and tiered commission accounting."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2 (Distributor Aggregator Only): Branding & Subdomain */}
      {!isReferrer && currentStep === 2 && (
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
              Choose your dedicated WhiteLabel portal address and brand color scheme.
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

                {/* Subdomain Holding Architecture Information Banner */}
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-start gap-3 text-xs">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <span>Subdomain Holding Active</span>
                      {formData.desiredSubdomain && (
                        <span className="font-mono text-primary font-bold">
                          ({formData.desiredSubdomain}.platform.royalmotionit.com)
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Your platform address is held immediately upon application submission and routed to the RoyalMotionIT holding view. When your application is approved and setup is provisioned, <strong className="text-foreground">backstage.&lt;customdomain&gt;</strong> will point to your dedicated AWS Elastic IP as an A-record, and your platform subdomain will automatically point to <strong className="text-foreground">backstage.&lt;customdomain&gt;</strong> as a CNAME.
                    </p>
                  </div>
                </div>

                {/* Brand Tagline & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="brandTagline" className="text-xs font-semibold">
                      Brand Tagline / Slogan
                    </Label>
                    <Input
                      id="brandTagline"
                      placeholder="e.g. Next-Generation DDEX Music Distribution & Ingestion"
                      value={formData.tagline}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tagline: e.target.value,
                        }))
                      }
                      className="h-9.5 text-xs font-medium"
                      maxLength={128}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="brandDescription" className="text-xs font-semibold">
                      Aggregator Overview / Description
                    </Label>
                    <Input
                      id="brandDescription"
                      placeholder="e.g. Global digital music aggregator delivering to 150+ DSPs."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="h-9.5 text-xs font-medium"
                      maxLength={512}
                    />
                  </div>
                </div>

                {/* Brand Colors: Primary & Accent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-primary" />
                        Primary Brand Color
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {formData.primaryColor}
                      </span>
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
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
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                            formData.primaryColor === color.hex
                              ? "border-foreground ring-2 ring-primary/40 shadow-xs bg-background"
                              : "border-border/60 hover:border-border bg-card"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                        Secondary Accent Color
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase">
                        {formData.accentColor}
                      </span>
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {ACCENT_COLOR_PRESETS.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              accentColor: color.hex,
                            }))
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                            formData.accentColor === color.hex
                              ? "border-foreground ring-2 ring-pink-500/40 shadow-xs bg-background"
                              : "border-border/60 hover:border-border bg-card"
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>
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

      {/* Key Contact Step: Referrer Step 2 OR Distributor Step 3 */}
      {((isReferrer && currentStep === 2) || (!isReferrer && currentStep === 3)) && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Users className="h-4 w-4" />
              {isReferrer
                ? "Step 2 of 4: Key Partner Representative"
                : "Step 3 of 6: Executive Representative"}
            </div>
            <CardTitle className="text-xl font-bold">
              {isReferrer
                ? "Partner Representative & Contact"
                : "Account Administrator & Executive Contact"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isReferrer
                ? "Who will be the primary contact for referral deal tracking, bounties, and remittance notices?"
                : "Who will be managing contracts, DSP legal notices, and royalty statements?"}
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
                  htmlFor="contactWhatsApp"
                  className="text-xs font-semibold"
                >
                  WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactWhatsApp"
                  placeholder="e.g. +1 234 567 8900 or +880 1712 345678"
                  value={formData.contactWhatsApp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contactWhatsApp: e.target.value,
                    }))
                  }
                  className="h-9.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="executiveRole" className="text-xs font-semibold flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Executive Role / Designation</span>
                </Label>
                <Select
                  items={EXECUTIVE_ROLES}
                  value={
                    formData.onboardingDetails?.executiveRole ||
                    "Managing Director"
                  }
                  onValueChange={(val) =>
                    updateOnboardingDetail(
                      "executiveRole",
                      val || "Managing Director",
                    )
                  }
                >
                  <SelectTrigger className="w-full h-9.5 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTIVE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactLinkedIn" className="text-xs font-semibold">
                  LinkedIn Profile (Optional)
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

            {!isReferrer && (
              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Public Client Support Routing (Optional)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Defaults to contact details if left blank
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="supportEmail" className="text-xs font-semibold">
                      Public Support Email
                    </Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      placeholder={formData.contactEmail || "support@yourbrand.com"}
                      value={formData.supportEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          supportEmail: e.target.value,
                        }))
                      }
                      className="h-9.5 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="supportPhone" className="text-xs font-semibold">
                      Public Support Phone / Hotline
                    </Label>
                    <Input
                      id="supportPhone"
                      placeholder={formData.contactWhatsApp || "+1 800 123 4567"}
                      value={formData.supportPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          supportPhone: e.target.value,
                        }))
                      }
                      className="h-9.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3 (Referrer Only): Remittance Setup & Attribution Code */}
      {isReferrer && currentStep === 3 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <DollarSign className="h-4 w-4" />
              Step 3 of 4: Attribution &amp; Remittance Setup
            </div>
            <CardTitle className="text-xl font-bold">
              Partner Referral Hub &amp; Payout Remittance
            </CardTitle>
            <CardDescription className="text-xs">
              Configure your partner referral link code and payout details. As a Referrer, you operate inside platform.royalmotionit.com/referrer — no website, DNS, or server required!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Platform-Hosted Hub Info Banner */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  100% Platform-Hosted Referrer Dashboard
                </span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold">
                  Zero Server Maintenance
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                You do not need a custom domain, Elastic IP (EIP), or web server. You will manage your referral tracking links, track referred accounts, view 15% commissions, and request payouts directly at:
              </p>
              <div className="p-2.5 rounded-lg bg-background/80 border border-primary/20 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">
                  https://platform.royalmotionit.com/referrer
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono font-medium">
                  Alias: /refferer
                </Badge>
              </div>
            </div>

            {/* Custom Partner Referral Code */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-card">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="referralCodeInput"
                  className="text-xs font-bold flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5 text-primary" />
                  <span>Custom Partner Referral Code Prefix</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-muted-foreground"
                >
                  Attribution Tracking
                </Badge>
              </div>

              <div className="flex items-center rounded-lg border border-border overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/40">
                <input
                  id="referralCodeInput"
                  type="text"
                  placeholder="e.g. AGY-SCOUT"
                  value={
                    formData.onboardingDetails?.referralNetworkCode ||
                    formData.onboardingDetails?.scoutAffiliateCodePrefix ||
                    ""
                  }
                  onChange={(e) => {
                    const clean = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, "")
                      .slice(0, 20);
                    updateOnboardingDetail("referralNetworkCode", clean);
                    updateOnboardingDetail("scoutAffiliateCodePrefix", clean);
                  }}
                  className="px-3 py-2 text-xs font-mono font-bold bg-transparent outline-none flex-1 min-w-0 uppercase"
                />
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Your direct referral link will be:{" "}
                <strong className="text-foreground font-mono">
                  https://platform.royalmotionit.com/auth/register?ref=
                  {formData.onboardingDetails?.referralNetworkCode ||
                    formData.onboardingDetails?.scoutAffiliateCodePrefix ||
                    (formData.name ? formData.name.toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 15) : "YOUR-CODE")}
                </strong>
              </p>
            </div>

            {/* Payout & Remittance Preference (Required) */}
            <div className="space-y-3 p-4 rounded-xl border border-border/70 bg-card">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Commission Payout Method</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Required
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "BKASH", name: "bKash (MFS)" },
                  { id: "NAGAD", name: "Nagad (MFS)" },
                  { id: "ROCKET", name: "Rocket (MFS)" },
                  { id: "BANK_TRANSFER", name: "Bank Transfer" },
                ].map((method) => {
                  const currentMethod =
                    formData.onboardingDetails?.payoutMethod || "BKASH";
                  const isSelected = currentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        updateOnboardingDetail("payoutMethod", method.id)
                      }
                      className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold"
                          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {method.name}
                    </button>
                  );
                })}
              </div>

              {formData.onboardingDetails?.payoutMethod === "BANK_TRANSFER" ? (
                <div className="pt-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutBankName"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Bank Name</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutBankName"
                        placeholder="e.g. Dutch-Bangla Bank"
                        value={
                          formData.onboardingDetails?.payoutBankName || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutBankName",
                            e.target.value,
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutAccountName"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Account Name</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutAccountName"
                        placeholder="e.g. Shah Md. Mahi"
                        value={
                          formData.onboardingDetails?.payoutAccountName ||
                          formData.onboardingDetails
                            ?.payoutAccountHolderName ||
                          ""
                        }
                        onChange={(e) => {
                          updateOnboardingDetail(
                            "payoutAccountName",
                            e.target.value,
                          );
                          updateOnboardingDetail(
                            "payoutAccountHolderName",
                            e.target.value,
                          );
                        }}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutAccountNumber"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Account Number</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutAccountNumber"
                        placeholder="e.g. 2050XXXXXXXXXXXXX"
                        value={
                          formData.onboardingDetails
                            ?.payoutAccountNumber || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutAccountNumber",
                            e.target.value.trim(),
                          )
                        }
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutBranchDistrict"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Branch District</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutBranchDistrict"
                        placeholder="e.g. Dhaka"
                        value={
                          formData.onboardingDetails
                            ?.payoutBranchDistrict || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutBranchDistrict",
                            e.target.value,
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutBankBranch"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Branch Name</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutBankBranch"
                        placeholder="e.g. Dhanmondi Branch"
                        value={
                          formData.onboardingDetails?.payoutBankBranch || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutBankBranch",
                            e.target.value,
                          )
                        }
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutBankRouting"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Routing Number</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutBankRouting"
                        placeholder="e.g. 090260123"
                        value={
                          formData.onboardingDetails?.payoutBankRouting || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutBankRouting",
                            e.target.value.trim(),
                          )
                        }
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="payoutSwiftCode"
                        className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <span>Swift Code</span>
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="payoutSwiftCode"
                        placeholder="e.g. DBBLBDDH"
                        value={
                          formData.onboardingDetails?.payoutSwiftCode || ""
                        }
                        onChange={(e) =>
                          updateOnboardingDetail(
                            "payoutSwiftCode",
                            e.target.value.toUpperCase().trim(),
                          )
                        }
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2 space-y-1">
                  <Label
                    htmlFor="payoutWalletNumber"
                    className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"
                  >
                    <span>
                      {formData.onboardingDetails?.payoutMethod === "NAGAD"
                        ? "Nagad Wallet Number"
                        : formData.onboardingDetails?.payoutMethod ===
                            "ROCKET"
                          ? "Rocket Wallet Number"
                          : "bKash Wallet Number"}
                    </span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="payoutWalletNumber"
                    placeholder="e.g. 017XXXXXXXX / 018XXXXXXXX"
                    value={
                      formData.onboardingDetails?.payoutWalletNumber ||
                      formData.onboardingDetails?.payoutAccountNumber ||
                      ""
                    }
                    onChange={(e) => {
                      updateOnboardingDetail(
                        "payoutWalletNumber",
                        e.target.value.trim(),
                      );
                      updateOnboardingDetail(
                        "payoutAccountNumber",
                        e.target.value.trim(),
                      );
                    }}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 (Referrer Only): Commercial Framework, Simulator & Agreement */}
      {isReferrer && currentStep === 4 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <ShieldCheck className="h-4 w-4" />
              Step 4 of 4: Commercial Framework &amp; Submission
            </div>
            <CardTitle className="text-xl font-bold">
              15% Referral Commercial Policy &amp; Agreement
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm your partner commercial terms, simulate closing bounties, and submit your partner application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Distribution Aggregator Referral Terms Banner */}
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Distribution Aggregator Referral Standard: 15% Fixed Share
                </span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-mono text-[10px] font-bold">
                  Min ৳60,000 BDT Deal
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Referrers earn strictly <strong className="text-foreground">15% of the total gross selling price</strong> for every Distribution Aggregator WhiteLabel account referred. The minimum baseline selling price is <strong className="text-foreground">৳60,000 BDT</strong> (earning you at least ৳9,000 BDT per deal), with no maximum ceiling — you earn 15% on whatever deal value you negotiate and close!
              </p>

              {/* Interactive Simulation */}
              <div className="pt-2 border-t border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-[11px] text-muted-foreground">
                  <span>Simulate deal closing value:</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">৳</span>
                    <Input
                      type="number"
                      min={60000}
                      step={5000}
                      value={formData.onboardingDetails?.simulatedDealPriceBdt ?? 60000}
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "simulatedDealPriceBdt",
                          Math.max(60000, Number(e.target.value) || 60000)
                        )
                      }
                      className="w-28 h-7 text-xs font-mono font-bold bg-background text-right"
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                    Your 15% Cut: ৳{Math.round(((formData.onboardingDetails?.simulatedDealPriceBdt ?? 60000) * 0.15)).toLocaleString()} BDT
                  </div>
                </div>
              </div>
            </div>

            {/* Application Dossier Summary */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Partner Application Summary
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
                    Partner / Agency
                  </span>
                  <strong className="text-foreground">
                    {formData.name || "N/A"}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Referral Portal
                  </span>
                  <strong className="text-foreground font-mono text-[11px]">
                    platform.royalmotionit.com/referrer
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Business Type
                  </span>
                  <strong className="text-foreground">
                    Referrer Partner (Affiliate)
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Attribution Code
                  </span>
                  <strong className="text-foreground font-mono">
                    {formData.onboardingDetails?.referralNetworkCode ||
                      formData.onboardingDetails?.scoutAffiliateCodePrefix ||
                      (formData.name ? formData.name.toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 15) : "AGY-SCOUT")}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Commission Terms
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    15% Fixed Share (Min ৳60K BDT)
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Remittance Profile
                  </span>
                  <strong className="text-foreground truncate block">
                    {formData.onboardingDetails?.payoutMethod === "BANK_TRANSFER"
                      ? `${formData.onboardingDetails?.payoutBankName || "Bank"} (${formData.onboardingDetails?.payoutAccountNumber || ""})`
                      : `${formData.onboardingDetails?.payoutMethod || "bKash"}: ${formData.onboardingDetails?.payoutWalletNumber || formData.onboardingDetails?.payoutAccountNumber || ""}`}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Partner Representative
                  </span>
                  <strong className="text-foreground truncate block">
                    {formData.contactFirstName} {formData.contactLastName}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    WhatsApp Number
                  </span>
                  <strong className="text-foreground truncate block font-mono">
                    {formData.contactWhatsApp || "N/A"}
                  </strong>
                </div>

                <div>
                  <span className="text-muted-foreground text-[10px] block">
                    Work Email
                  </span>
                  <strong className="text-foreground truncate block font-mono">
                    {formData.contactEmail}
                  </strong>
                </div>
              </div>
            </div>

            {/* Compliance & Terms Agreement */}
            <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="privacyPolicyReferrer"
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
                  htmlFor="privacyPolicyReferrer"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I certify that all referral partner representations and commercial terms comply with the Partner Terms and 15% revenue share policy. I agree to the{" "}
                  <span className="text-primary underline">
                    RoyalMotionIT Partner Agreement
                  </span>{" "}
                  and{" "}
                  <span className="text-primary underline">Privacy Policy</span>.
                </label>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="marketingConsentReferrer"
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
                  htmlFor="marketingConsentReferrer"
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                >
                  I consent to receiving referral updates, pipeline conversion alerts, and remittance confirmation notices from the partner desk.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 (Distributor Aggregator Only): Aggregator Operations */}
      {!isReferrer && currentStep === 4 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
              <Music className="h-4 w-4" />
              Step 4 of 6: Operational Infrastructure
            </div>
            <CardTitle className="text-xl font-bold">
              Aggregator Ingestion &amp; Sub-Tenant Operations
            </CardTitle>
            <CardDescription className="text-xs">
              Configure telemetry according to global music industry operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-5">
                {/* Catalog Scale & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="catalogTrackCount" className="text-xs font-semibold">
                      Existing Catalog Size (Tracks)
                    </Label>
                    <Input
                      id="catalogTrackCount"
                      type="number"
                      min={0}
                      value={formData.catalogTrackCount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          catalogTrackCount: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="h-9.5 text-xs font-semibold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="monthlyTrackDelivery" className="text-xs font-semibold">
                      Monthly Ingestion Capacity (Tracks)
                    </Label>
                    <Input
                      id="monthlyTrackDelivery"
                      type="number"
                      min={0}
                      value={formData.monthlyTrackDelivery}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthlyTrackDelivery: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="h-9.5 text-xs font-semibold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="monthlyRevenueUsd" className="text-xs font-semibold">
                      Average Monthly Catalog Revenue ($ USD)
                    </Label>
                    <Input
                      id="monthlyRevenueUsd"
                      type="number"
                      min={0}
                      step={500}
                      value={formData.monthlyRevenueUsd}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthlyRevenueUsd: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="h-9.5 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subLabelsCount" className="text-xs font-semibold">
                      Sub-Labels Represented
                    </Label>
                    <Input
                      id="subLabelsCount"
                      type="number"
                      min={1}
                      value={formData.onboardingDetails?.subLabelsCount ?? 5}
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "subLabelsCount",
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="h-9.5 text-xs font-semibold font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="independentArtistsRepresented" className="text-xs font-semibold">
                      Independent Artists Represented
                    </Label>
                    <Input
                      id="independentArtistsRepresented"
                      type="number"
                      min={1}
                      value={
                        formData.onboardingDetails
                          ?.independentArtistsRepresented ?? 40
                      }
                      onChange={(e) =>
                        updateOnboardingDetail(
                          "independentArtistsRepresented",
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                      className="h-9.5 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* Standards & Metadata: Protocol, Language, Genre */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Automated Ingestion Protocol
                    </Label>
                    <Select
                      items={DDEX_PROTOCOLS.map((p) => ({
                        value: p.id,
                        label: p.label,
                      }))}
                      value={
                        formData.onboardingDetails?.ingestionProtocol ||
                        "DDEX_ERN_4_3"
                      }
                      onValueChange={(val) =>
                        updateOnboardingDetail(
                          "ingestionProtocol",
                          val || "DDEX_ERN_4_3",
                        )
                      }
                    >
                      <SelectTrigger className="w-full h-9.5 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DDEX_PROTOCOLS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Primary Catalog Language
                    </Label>
                    <Select
                      items={CATALOG_LANGUAGE_OPTIONS}
                      value={formData.primaryCatalogLanguage || "English"}
                      onValueChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryCatalogLanguage: val || "English",
                        }))
                      }
                    >
                      <SelectTrigger className="w-full h-9.5 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATALOG_LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Primary Genre Focus
                    </Label>
                    <Select
                      items={GENRE_OPTIONS}
                      value={
                        formData.onboardingDetails?.primaryGenre ||
                        "Multi-Genre / All Genres"
                      }
                      onValueChange={(val) =>
                        updateOnboardingDetail(
                          "primaryGenre",
                          val || "Multi-Genre / All Genres",
                        )
                      }
                    >
                      <SelectTrigger className="w-full h-9.5 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRE_OPTIONS.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Direct DSP Pipelines */}
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

                {/* Operational QC Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Direct DSP Deals
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
                      Existing bilateral contracts with Spotify, Apple, etc.
                    </p>
                  </div>
                </div>

                {/* Catalog Migration & Samples */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Catalog Migration Assistance
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
                      Assistance migrating existing ISRCs, UPCs, and audio from prior distributors.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Sample-Based Works &amp; Covers
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
                      Catalog includes cleared sample-based recordings or mechanical cover licenses.
                    </p>
                  </div>
                </div>

                {/* Creator Signup Model on WhiteLabel Portal */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Label className="text-xs font-semibold">
                    Client Onboarding &amp; Creator Signup Model on Your WhiteLabel Portal
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

                {/* Distribution & Royalty Accounting Tools */}
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
              </div>
            </CardContent>
          </Card>
        )}

      {/* STEP 5 (Distributor Aggregator Only): Sub-Labels & Catalogs */}
      {!isReferrer && currentStep === 5 && (
        <Card className="border-border/70 shadow-sm animate-in fade-in-50 duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Headphones className="h-4 w-4" />
                  Step 5 of 6: Portfolio &amp; Roster Highlights
                </div>
                <CardTitle className="text-xl font-bold">
                  Representative Sub-Labels &amp; Catalogs
                </CardTitle>
                <CardDescription className="text-xs">
                  Highlight 1 to 5 flagship sub-labels or catalog brands your aggregator will distribute.
                </CardDescription>
              </div>

              {formData.topArtists.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddArtist}
                  className="text-xs gap-1.5 h-8 font-semibold shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Add Sub-Label
                </Button>
              )}
            </div>
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
                      {idx + 1} of {formData.topArtists.length}
                    </Badge>
                    <span>Sub-Label Partner #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && (
                      <span className="text-[10px] text-destructive font-semibold">
                        * Required
                      </span>
                    )}
                    {formData.topArtists.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveArtist(idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">
                      Sub-Label / Brand Name {idx === 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      placeholder="e.g. Hyperion Electronic Records"
                      value={item.artistName}
                      onChange={(e) =>
                        handleArtistChange(idx, "artistName", e.target.value)
                      }
                      className="h-8.5 text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Globe className="h-3 w-3 text-blue-500" />
                      Sub-Label Country / Territory
                    </Label>
                    <Input
                      placeholder="e.g. United Kingdom"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-emerald-500" />
                      Website or Catalog Link
                    </Label>
                    <Input
                      placeholder="https://hyperionrecords.com"
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
                      <Music className="h-3 w-3 text-rose-500" />
                      Primary Genre Focus
                    </Label>
                    <Input
                      placeholder="e.g. Electronic / Dance"
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

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Headphones className="h-3 w-3 text-indigo-500" />
                      Monthly Streams / Listeners
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 50000"
                      value={item.monthlyListeners || ""}
                      onChange={(e) =>
                        handleArtistChange(
                          idx,
                          "monthlyListeners",
                          Math.max(0, Number(e.target.value) || 0),
                        )
                      }
                      className="h-8.5 text-xs font-mono"
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
            {/* Distributor Aggregator Comprehensive Application Summary Dossier */}
            <div className="space-y-4">
              {/* Architecture Holding Notice */}
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-start gap-3 text-xs">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    Subdomain Reservation &amp; Holding Active
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Upon submission, your platform address{" "}
                    <strong className="text-foreground font-mono">
                      {formData.desiredSubdomain}.platform.royalmotionit.com
                    </strong>{" "}
                    will be held and routed to the platform holding page. During automated provisioning after approval, your custom domain{" "}
                    <strong className="text-foreground font-mono">backstage.&lt;customdomain&gt;</strong> will point to your dedicated AWS Elastic IP (A-record), and your platform subdomain will point to{" "}
                    <strong className="text-foreground font-mono">backstage.&lt;customdomain&gt;</strong> (CNAME).
                  </p>
                </div>
              </div>

              {/* 5-Section Detailed Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Entity & Corporate Profile */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      1. Corporate Profile
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Company Name</span>
                      <strong className="text-foreground font-medium">{formData.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Country</span>
                      <strong className="text-foreground font-medium">{formData.country}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Industry Experience</span>
                      <strong className="text-foreground font-medium">{formData.yearsInBusiness} years</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Incorporation</span>
                      <strong className="text-foreground font-medium">
                        {formData.isIncorporated ? "Incorporated LLC/Corp" : "Sole Proprietor"}
                      </strong>
                    </div>
                    {formData.companyWebsite && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground block">Website</span>
                        <strong className="text-foreground font-mono text-[11px] truncate block">
                          {formData.companyWebsite}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Platform Identity & Branding */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      2. Platform Identity &amp; Colors
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground block">Platform Address</span>
                      <strong className="text-primary font-mono text-[11px] font-bold">
                        {formData.desiredSubdomain}.platform.royalmotionit.com
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Brand Colors</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: formData.primaryColor }}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: formData.accentColor }}
                        />
                        <span className="font-mono text-[10px] text-muted-foreground uppercase">
                          {formData.primaryColor}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Launch Target</span>
                      <strong className="text-foreground font-medium">
                        {formData.estimatedLaunchTimeline}
                      </strong>
                    </div>
                    {formData.tagline && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground block">Tagline</span>
                        <strong className="text-foreground text-[11px] line-clamp-1 block">
                          "{formData.tagline}"
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Executive Representative */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      3. Key Representative
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(3)}
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Primary Contact</span>
                      <strong className="text-foreground font-medium truncate block">
                        {formData.contactFirstName} {formData.contactLastName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Executive Role</span>
                      <strong className="text-foreground font-medium truncate block">
                        {formData.onboardingDetails?.executiveRole || "Executive Contact"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Work Email</span>
                      <strong className="text-foreground font-mono text-[11px] truncate block">
                        {formData.contactEmail}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">WhatsApp Number</span>
                      <strong className="text-foreground font-mono text-[11px] truncate block">
                        {formData.contactWhatsApp}
                      </strong>
                    </div>
                    {formData.supportEmail && (
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Support Routing</span>
                        <strong className="text-foreground font-mono text-[11px] truncate block">
                          {formData.supportEmail}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Operations & Ingestion Telemetry */}
                <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Music className="h-3.5 w-3.5 text-primary" />
                      4. Ingestion &amp; Operations
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(4)}
                      className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Ingestion Protocol</span>
                      <strong className="text-foreground font-medium">
                        {formData.onboardingDetails?.ingestionProtocol || "DDEX ERN 4.3"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Client Signup Model</span>
                      <strong className="text-foreground font-medium">
                        {formData.userSignupModel === "INVITE_ONLY"
                          ? "Invite Only"
                          : formData.userSignupModel === "ADMIN_APPROVAL"
                            ? "Admin Approval"
                            : "Open Registration"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Catalog / Monthly Tracks</span>
                      <strong className="text-foreground font-mono font-medium">
                        {formData.catalogTrackCount.toLocaleString()} / {formData.monthlyTrackDelivery.toLocaleString()} mo
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Monthly Revenue</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                        ${formData.monthlyRevenueUsd.toLocaleString()} USD
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Genre &amp; Language</span>
                      <strong className="text-foreground font-medium truncate block">
                        {formData.onboardingDetails?.primaryGenre || "Multi-Genre"} ({formData.primaryCatalogLanguage})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">QC &amp; Anti-Fraud</span>
                      <strong className="text-foreground font-medium">
                        {formData.onboardingDetails?.hasDedicatedQcTeam ? "QC Team Active" : "Automated QC"} •{" "}
                        {formData.onboardingDetails?.antiFraudInspectionRequired ? "Fraud Shield" : "Standard"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Sub-Labels & Roster Partners */}
              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-primary" />
                    5. Representative Sub-Labels &amp; Roster Partners ({formData.topArtists.filter(a => a.artistName.trim()).length} Declared)
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(5)}
                    className="h-6 px-2 text-[10px] text-primary hover:text-primary gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {formData.topArtists.map((artist, i) => (
                    artist.artistName.trim() ? (
                      <div key={i} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground truncate block">
                            {artist.artistName}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                            #{i + 1}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {artist.instagramHandle || "Global"} {artist.youtubeChannelUrl ? `• ${artist.youtubeChannelUrl}` : ""}
                        </p>
                        {artist.monthlyListeners ? (
                          <p className="text-[10px] text-indigo-500 font-mono">
                            {artist.monthlyListeners.toLocaleString()} monthly streams
                          </p>
                        ) : null}
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance & Terms Agreement */}
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
                  I certify that all represented sub-labels have executed valid digital distribution licenses and our ingestion pipeline strictly complies with anti-fraud streaming policies. I agree to the{" "}
                  <span className="text-primary underline">
                    RoyalMotionIT Distribution Agreement
                  </span>{" "}
                  and{" "}
                  <span className="text-primary underline">Privacy Policy</span>.
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

        {currentStep < maxSteps ? (
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
