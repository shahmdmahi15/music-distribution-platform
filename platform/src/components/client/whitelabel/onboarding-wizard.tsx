"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Disc3,
  Globe,
  Mail,
  User,
  FileText,
  DollarSign,
  Music,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Headphones,
  Upload,
  Radio,
  Layers,
  HelpCircle,
  ExternalLink,
  Camera,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { clientApplyWhiteLabelAction } from "@/actions/client/whitelabel/client-apply-whitelabel.action";
import { WhiteLabelBusinessType, WhiteLabelSignupModel } from "@/types/whitelabel";

const BUSINESS_TYPES = [
  {
    id: WhiteLabelBusinessType.RECORD_LABEL,
    label: "Record Label",
    description: "Manage multiple artists, releases, contracts, and master rights.",
    icon: Disc3,
  },
  {
    id: WhiteLabelBusinessType.DISTRIBUTOR_AGGREGATOR,
    label: "Distributor / Aggregator",
    description: "Distribute music catalogs for third-party labels and independent creators.",
    icon: Layers,
  },
  {
    id: WhiteLabelBusinessType.MUSIC_PUBLISHER,
    label: "Music Publisher",
    description: "Administer compositions, publishing royalties, mechanicals, and sync.",
    icon: Building2,
  },
  {
    id: WhiteLabelBusinessType.OTHER,
    label: "Other Enterprise",
    description: "Media network, management agency, collective, or custom music business.",
    icon: Sparkles,
  },
];

const SIGNUP_MODELS = [
  {
    id: WhiteLabelSignupModel.INVITE_ONLY,
    label: "Invite-Only (Recommended)",
    description: "Only administrators can send private invitation links to onboard creators.",
  },
  {
    id: WhiteLabelSignupModel.VETTED_APPLICATION,
    label: "Vetted Application",
    description: "Public registration form where creators must be manually approved by your team.",
  },
  {
    id: WhiteLabelSignupModel.MANUAL_APPROVAL,
    label: "Manual Approval",
    description: "Signups allowed publicly, but streaming distribution is gated until verified.",
  },
  {
    id: WhiteLabelSignupModel.OPEN_PUBLIC,
    label: "Open Public Signup",
    description: "Instant access for any user to sign up and start uploading immediately.",
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

interface OnboardingWizardProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onSuccess?: () => void;
}

export function WhiteLabelOnboardingWizard({
  user,
  onSuccess,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Corporate Profile
    name: "",
    businessType: WhiteLabelBusinessType.RECORD_LABEL,
    companyWebsite: "",
    country: "",
    yearsInBusiness: 1,
    isIncorporated: false,
    incorporationDocUrl: "",

    // Step 2: Contact Person
    contactFirstName: user.firstName || "",
    contactLastName: user.lastName || "",
    contactEmail: user.email || "",
    contactLinkedIn: "",

    // Step 3: Catalog & Distribution Operations
    catalogTrackCount: 50,
    monthlyTrackDelivery: 10,
    monthlyRevenueUsd: 1000,
    hasDirectDeals: false,
    currentDistributors: ["The Orchard"],
    royaltySolutions: ["Curve Royalty Systems"],
    primaryCatalogLanguage: "English",
    wantsCatalogMigration: false,
    hasSampleBasedCovers: false,

    // Step 4: Top 3 Artists in Roster
    topArtists: [
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

    // Step 5: Access Model & Compliance
    userSignupModel: WhiteLabelSignupModel.INVITE_ONLY,
    privacyPolicyAccepted: true,
    marketingConsent: false,
  });

  const toggleDistributor = (dist: string) => {
    setFormData((prev) => {
      const exists = prev.currentDistributors.includes(dist);
      return {
        ...prev,
        currentDistributors: exists
          ? prev.currentDistributors.filter((d) => d !== dist)
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
          ? prev.royaltySolutions.filter((s) => s !== sol)
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
      if (!formData.contactFirstName.trim() || !formData.contactLastName.trim()) {
        toast.error("Please provide your contact name.");
        return false;
      }
      if (!formData.contactEmail.trim() || !formData.contactEmail.includes("@")) {
        toast.error("Please provide a valid contact email.");
        return false;
      }
    }
    if (step === 4) {
      const firstArtist = formData.topArtists[0];
      if (!firstArtist.artistName.trim()) {
        toast.error("Please provide details for at least 1 top roster artist.");
        return false;
      }
    }
    if (step === 5) {
      if (!formData.privacyPolicyAccepted) {
        toast.error("You must accept the Privacy Policy to submit your application.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      // Clean top artists (only include artists with names)
      const validArtists = formData.topArtists.filter(
        (a) => a.artistName && a.artistName.trim().length > 0,
      );

      const res = await clientApplyWhiteLabelAction({
        ...formData,
        topArtists: validArtists,
      });

      if (res.success) {
        toast.success(res.message);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("An unexpected error occurred while submitting your application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <Badge
          variant="outline"
          className="px-3 py-1 font-semibold text-xs border-primary/30 bg-primary/10 text-primary gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Enterprise WhiteLabel Onboarding
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Launch Your Branded Music Distribution Platform
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          Complete our application to provision your dedicated WhiteLabel instance, custom domain, royalty accounting, and catalog ingestion tools.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span className={currentStep >= 1 ? "text-primary font-bold" : ""}>
            1. Corporate
          </span>
          <span className={currentStep >= 2 ? "text-primary font-bold" : ""}>
            2. Contact
          </span>
          <span className={currentStep >= 3 ? "text-primary font-bold" : ""}>
            3. Operations
          </span>
          <span className={currentStep >= 4 ? "text-primary font-bold" : ""}>
            4. Artists (3/3)
          </span>
          <span className={currentStep >= 5 ? "text-primary font-bold" : ""}>
            5. Finalize
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Corporate Profile */}
      {currentStep === 1 && (
        <Card className="border-border/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <Building2 className="h-4 w-4" />
              Step 1 of 5
            </div>
            <CardTitle className="text-xl font-bold">Business & Entity Profile</CardTitle>
            <CardDescription className="text-xs">
              Tell us about your organization and legal business entity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Type Cards */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold">Business Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.businessType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, businessType: type.id }))
                      }
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 bg-card hover:border-border"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
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
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Royal Motion Records"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyWebsite" className="text-xs font-semibold">
                  Company Website
                </Label>
                <Input
                  id="companyWebsite"
                  placeholder="https://yourlabel.com"
                  value={formData.companyWebsite}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))
                  }
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs font-semibold">
                  Country / Region
                </Label>
                <Input
                  id="country"
                  placeholder="e.g. United States, United Kingdom"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, country: e.target.value }))
                  }
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yearsInBusiness" className="text-xs font-semibold">
                  How many years are you in this business?
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
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Incorporation Switch & Documents */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">
                    Is your business incorporated?
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    LLC, Corporation, GmbH, Ltd, or registered commercial entity.
                  </p>
                </div>
                <Switch
                  checked={formData.isIncorporated}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isIncorporated: checked }))
                  }
                />
              </div>

              {formData.isIncorporated && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label htmlFor="incorporationDoc" className="text-xs font-semibold">
                    Incorporation Document Link / Storage Key
                  </Label>
                  <Input
                    id="incorporationDoc"
                    placeholder="https://drive.google.com/... or uploaded document link"
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
                    You may also provide this document directly to your onboarding specialist during agreement verification.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Key Contact Person */}
      {currentStep === 2 && (
        <Card className="border-border/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <User className="h-4 w-4" />
              Step 2 of 5
            </div>
            <CardTitle className="text-xl font-bold">Key Contact & Decision Maker</CardTitle>
            <CardDescription className="text-xs">
              Provide contact details for the platform contract owner and administrative representative.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactFirstName" className="text-xs font-semibold">
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
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactLastName" className="text-xs font-semibold">
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
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail" className="text-xs font-semibold">
                  Work Email <span className="text-destructive">*</span>
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
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactLinkedIn" className="text-xs font-semibold">
                  Your LinkedIn Profile / Handle
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
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Catalog & Distribution Operations */}
      {currentStep === 3 && (
        <Card className="border-border/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <Music className="h-4 w-4" />
              Step 3 of 5
            </div>
            <CardTitle className="text-xl font-bold">Catalog & Distribution Telemetry</CardTitle>
            <CardDescription className="text-xs">
              Tell us about your distribution volume, revenue, existing partners, and migration needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metric Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tracks in your catalog
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
                  className="h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Monthly track delivery
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
                  className="h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Avg monthly revenue ($ USD)
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                    className="h-10 pl-9 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Direct Deals & Migration & Sample Covers Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Direct Deals?
                  </span>
                  <Switch
                    checked={formData.hasDirectDeals}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, hasDirectDeals: checked }))
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Direct contracts with Spotify, Apple Music, YouTube, etc.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
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
                <p className="text-[11px] text-muted-foreground">
                  Yes, we would like to migrate our existing catalog.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Sample-based Covers?
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
                <p className="text-[11px] text-muted-foreground">
                  Catalog contains uncleared or cleared sample derivatives.
                </p>
              </div>
            </div>

            {/* Primary Language */}
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
                className="h-10 text-xs"
              />
            </div>

            {/* Multi-Select: Current Distributors */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold">
                Distributor(s) you are currently using:
              </Label>
              <div className="flex flex-wrap gap-2">
                {DISTRIBUTOR_OPTIONS.map((dist) => {
                  const isSelected = formData.currentDistributors.includes(dist);
                  return (
                    <Badge
                      key={dist}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleDistributor(dist)}
                      className={`cursor-pointer px-3 py-1 text-xs font-medium transition-all ${
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

            {/* Multi-Select: Royalty Solutions */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold">
                Existing royalty solution(s):
              </Label>
              <div className="flex flex-wrap gap-2">
                {ROYALTY_OPTIONS.map((sol) => {
                  const isSelected = formData.royaltySolutions.includes(sol);
                  return (
                    <Badge
                      key={sol}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleRoyalty(sol)}
                      className={`cursor-pointer px-3 py-1 text-xs font-medium transition-all ${
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

      {/* STEP 4: Top 3 Artists in Roster */}
      {currentStep === 4 && (
        <Card className="border-border/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <Headphones className="h-4 w-4" />
              Step 4 of 5
            </div>
            <CardTitle className="text-xl font-bold">Top Artists in Your Roster</CardTitle>
            <CardDescription className="text-xs">
              Tell us more about your top artists so our team can prepare your streaming profiles and direct DSP integrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.topArtists.map((artist, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 font-bold"
                    >
                      {idx + 1} / 3
                    </Badge>
                    <span>Top Artist #{idx + 1}</span>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] text-destructive font-semibold">
                      * Required
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
                      className="h-9 text-xs"
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
                        handleArtistChange(idx, "instagramHandle", e.target.value)
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-emerald-500" />
                      Link to Spotify Artist Profile
                    </Label>
                    <Input
                      placeholder="https://open.spotify.com/artist/..."
                      value={artist.spotifyProfileUrl}
                      onChange={(e) =>
                        handleArtistChange(idx, "spotifyProfileUrl", e.target.value)
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold flex items-center gap-1">
                      <Video className="h-3 w-3 text-rose-500" />
                      Link to YouTube Channel
                    </Label>
                    <Input
                      placeholder="https://youtube.com/@channel"
                      value={artist.youtubeChannelUrl}
                      onChange={(e) =>
                        handleArtistChange(idx, "youtubeChannelUrl", e.target.value)
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Access Model & Compliance */}
      {currentStep === 5 && (
        <Card className="border-border/60 shadow-sm animate-in fade-in-50 duration-300">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-sm mb-1">
              <ShieldCheck className="h-4 w-4" />
              Step 5 of 5
            </div>
            <CardTitle className="text-xl font-bold">Access Model & Compliance</CardTitle>
            <CardDescription className="text-xs">
              Configure how users join your platform and review compliance agreements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Signup Model Radio */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold">
                How will users sign up to your business?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SIGNUP_MODELS.map((model) => {
                  const isSelected = formData.userSignupModel === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, userSignupModel: model.id }))
                      }
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
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

            {/* Summary Review Card */}
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Application Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1">
                <div>
                  <span className="font-medium text-foreground">Company:</span>{" "}
                  {formData.name || "N/A"}
                </div>
                <div>
                  <span className="font-medium text-foreground">Type:</span>{" "}
                  {formData.businessType}
                </div>
                <div>
                  <span className="font-medium text-foreground">Catalog:</span>{" "}
                  {formData.catalogTrackCount} tracks
                </div>
                <div>
                  <span className="font-medium text-foreground">Monthly Delivery:</span>{" "}
                  {formData.monthlyTrackDelivery} tracks
                </div>
                <div>
                  <span className="font-medium text-foreground">Revenue:</span> $
                  {formData.monthlyRevenueUsd?.toLocaleString() || "0"} / mo
                </div>
                <div>
                  <span className="font-medium text-foreground">Direct Deals:</span>{" "}
                  {formData.hasDirectDeals ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Privacy Policy & Consent */}
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
                  <strong className="text-foreground">RoyalMotionIT</strong> needs the contact information you provide to us to contact you about our products and services. You may unsubscribe from these communications at any time. For information on how to unsubscribe, check out our{" "}
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
                  I agree to receive product updates, DSP integration alerts, and platform insights from RoyalMotionIT.
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Action Buttons */}
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

        {currentStep < 5 ? (
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
