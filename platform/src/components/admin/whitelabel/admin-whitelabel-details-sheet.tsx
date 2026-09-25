"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Disc3,
  ExternalLink,
  FileCheck2,
  Globe,
  Camera,
  Mail,
  Music,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  DollarSign,
  Layers,
  FileText,
  CreditCard,
  Plus,
  Play,
  Calendar,
  AlertTriangle,
  Upload,
  Trash2,
  Download,
  File,
  Palette,
  Save,
  Share2,
  Image as ImageIcon,
  FileSignature,
  Server,
  Edit3,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WhiteLabel,
  WhiteLabelBusinessType,
  WhiteLabelSignupModel,
  WhiteLabelStatus,
  WhiteLabelDocument,
} from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { adminUpdateWhiteLabelStatusAction } from "@/actions/admin/whitelabel/admin-update-whitelabel-status.action";
import { adminRecordPaymentAction } from "@/actions/admin/whitelabel/admin-record-payment.action";
import { adminActivateWhiteLabelAction } from "@/actions/admin/whitelabel/admin-activate-whitelabel.action";
import { adminUploadContractAction } from "@/actions/admin/whitelabel/admin-upload-contract.action";
import { adminGetContractPreviewAction } from "@/actions/admin/whitelabel/admin-get-contract-preview.action";
import { adminUploadDocumentAction } from "@/actions/admin/whitelabel/admin-upload-document.action";
import { adminDeleteDocumentAction } from "@/actions/admin/whitelabel/admin-delete-document.action";
import { adminGetDocumentPreviewAction } from "@/actions/admin/whitelabel/admin-get-document-preview.action";
import { adminDeletePaymentAction } from "@/actions/admin/whitelabel/admin-delete-payment.action";
import { adminSuspendWhiteLabelAction } from "@/actions/admin/whitelabel/admin-suspend-whitelabel.action";
import { adminUnsuspendWhiteLabelAction } from "@/actions/admin/whitelabel/admin-unsuspend-whitelabel.action";
import { adminUpdateBrandingAction } from "@/actions/admin/whitelabel/admin-update-branding.action";
import { adminUploadBrandingAssetAction } from "@/actions/admin/whitelabel/admin-upload-branding-asset.action";
import { adminDeleteBrandingAssetAction } from "@/actions/admin/whitelabel/admin-delete-branding-asset.action";
import { adminUpdateWhiteLabelApplicationAction } from "@/actions/admin/whitelabel/admin-update-whitelabel-application.action";
import { adminSyncWhiteLabelDnsAction } from "@/actions/admin/whitelabel/admin-sync-whitelabel-dns.action";

const paymentMethodLabels: Record<string, string> = {
  HAND_TO_HAND: "Hand-to-Hand (Cash / Direct)",
  BANK_TRANSFER: "Direct Bank Wire / ACH",
  CASH: "In-Person Cash",
  INVOICE: "Corporate Invoice / PO",
};

const adminDocTypeLabels: Record<string, string> = {
  SIGNED_AGREEMENT: "Signed Agreement",
  DISTRIBUTION_CONTRACT: "Distribution Contract",
  INCORPORATION_DOC: "Incorporation Document",
  TAX_DOCUMENT: "Tax Document (W8/W9)",
  OTHER: "Other Agreement",
};

const GLOBAL_GENRE_OPTIONS = [
  "Multi-Genre / All Genres",
  "Pop / Contemporary",
  "South Asian / Bangla / Desi",
  "Hip-Hop / R&B",
  "Electronic / Dance / EDM",
  "Rock / Alternative / Indie",
  "World / Regional / Folk",
  "Classical / Instrumental",
  "Gospel / Devotional / Islamic",
  "Latin / Reggaeton / Urbano",
  "Afrobeats / African",
  "Jazz / Blues / Soul",
];

const CATALOG_LANGUAGE_OPTIONS = [
  "English",
  "Bengali / Bangla",
  "Hindi / Urdu",
  "Spanish",
  "Arabic",
  "Portuguese",
  "French",
  "Multi-Language / Global",
];

const LIFECYCLE_STEPS = [
  { status: WhiteLabelStatus.PENDING, label: "1. Submitted", short: "Pending" },
  {
    status: WhiteLabelStatus.UNDER_REVIEW,
    label: "2. Under Review",
    short: "Review",
  },
  {
    status: WhiteLabelStatus.PROCESSING,
    label: "3. Processing",
    short: "Processing",
  },
  {
    status: WhiteLabelStatus.CONTRACTED,
    label: "4. Contracted",
    short: "Contracted",
  },
  { status: WhiteLabelStatus.PAID, label: "5. Paid", short: "Paid" },
  {
    status: WhiteLabelStatus.ACTIVE,
    label: "6. Active Live",
    short: "Active",
  },
];

export interface AdminWhiteLabelDetailsDialogProps {
  whiteLabel: WhiteLabel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export type AdminWhiteLabelDetailsSheetProps =
  AdminWhiteLabelDetailsDialogProps;

export function AdminWhiteLabelDetailsDialog({
  whiteLabel,
  open,
  onOpenChange,
  onRefresh,
}: AdminWhiteLabelDetailsDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "edit_dossier"
    | "artists"
    | "documents"
    | "payments"
    | "branding"
  >("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status Update state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Suspend Modal State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("1_YEAR");
  const [paymentForm, setPaymentForm] = useState({
    amount: 1200,
    discount: 0,
    startsAt: new Date().toISOString().split("T")[0],
    endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    status: "COMPLETED",
    paymentMethod: "HAND_TO_HAND",
    receiptReference: "",
    adminNotes: "",
  });

  // Contract Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractPreviewLoading, setContractPreviewLoading] = useState(false);

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("SIGNED_AGREEMENT");
  const [docTitle, setDocTitle] = useState("");
  const [previewingDocId, setPreviewingDocId] = useState<string | null>(null);

  // Activate & DNS Sync state
  const [activateLoading, setActivateLoading] = useState(false);
  const [dnsSyncLoading, setDnsSyncLoading] = useState(false);

  // Admin Branding Manager State
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingUploading, setBrandingUploading] = useState<string | null>(
    null,
  );
  const [brandingForm, setBrandingForm] = useState({
    name: whiteLabel?.name || "",
    subdomain: whiteLabel?.subdomain || "",
    customDomain: whiteLabel?.customDomain || "",
    tagline: whiteLabel?.tagline || "",
    description: whiteLabel?.description || "",
    primaryColor: whiteLabel?.primaryColor || "#6366f1",
    accentColor: whiteLabel?.accentColor || "#ec4899",
    supportEmail: whiteLabel?.supportEmail || "",
    supportPhone: whiteLabel?.supportPhone || "",
    copyrightText: whiteLabel?.copyrightText || "",
    socialInstagram: whiteLabel?.socialInstagram || "",
    socialTwitter: whiteLabel?.socialTwitter || "",
    socialYoutube: whiteLabel?.socialYoutube || "",
    socialSpotify: whiteLabel?.socialSpotify || "",
    socialFacebook: whiteLabel?.socialFacebook || "",
    socialLinkedin: whiteLabel?.socialLinkedin || "",
    socialTiktok: whiteLabel?.socialTiktok || "",
  });

  // Admin Full Application & Dossier Editor State
  const [dossierSaving, setDossierSaving] = useState(false);
  const [dossierForm, setDossierForm] = useState({
    name: whiteLabel?.name || "",
    businessType:
      whiteLabel?.businessType || WhiteLabelBusinessType.RECORD_LABEL,
    companyWebsite: whiteLabel?.companyWebsite || "",
    country: whiteLabel?.country || "",
    yearsInBusiness: whiteLabel?.yearsInBusiness ?? 1,
    isIncorporated: Boolean(whiteLabel?.isIncorporated),
    incorporationDocUrl: whiteLabel?.incorporationDocUrl || "",
    contactFirstName: whiteLabel?.contactFirstName || "",
    contactLastName: whiteLabel?.contactLastName || "",
    contactEmail: whiteLabel?.contactEmail || "",
    contactLinkedIn: whiteLabel?.contactLinkedIn || "",
    catalogTrackCount: whiteLabel?.catalogTrackCount ?? 0,
    monthlyTrackDelivery: whiteLabel?.monthlyTrackDelivery ?? 0,
    monthlyRevenueUsd: Number(whiteLabel?.monthlyRevenueUsd || 0),
    primaryCatalogLanguage: whiteLabel?.primaryCatalogLanguage || "English",
    userSignupModel:
      whiteLabel?.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
    subdomain: whiteLabel?.subdomain || "",
    customDomain: whiteLabel?.customDomain || "",
    elasticIpv4: whiteLabel?.elasticIpv4 || "",
    hasDirectDeals: Boolean(whiteLabel?.hasDirectDeals),
    wantsCatalogMigration: Boolean(whiteLabel?.wantsCatalogMigration),
    hasSampleBasedCovers: Boolean(whiteLabel?.hasSampleBasedCovers),
    // Onboarding Details
    primaryGenre:
      whiteLabel?.onboardingDetails?.primaryGenre ||
      "Multi-Genre / All Genres",
    labelType: whiteLabel?.onboardingDetails?.labelType || "independent",
    masterRoyaltySplitStandard:
      whiteLabel?.onboardingDetails?.masterRoyaltySplitStandard ||
      "70/30 (Artist 70% / Label 30%)",
    isrcRegistrantCode:
      whiteLabel?.onboardingDetails?.isrcRegistrantCode ||
      whiteLabel?.onboardingDetails?.isrcPrefix ||
      "",
    dolbyAtmosReady:
      whiteLabel?.onboardingDetails?.dolbyAtmosReady !== false,
    estimatedLaunchTimeline:
      whiteLabel?.onboardingDetails?.estimatedLaunchTimeline ||
      "Immediate (1 - 2 Weeks)",
    subLabelsCount: whiteLabel?.onboardingDetails?.subLabelsCount ?? 5,
    independentArtistsRepresented:
      whiteLabel?.onboardingDetails?.independentArtistsRepresented ?? 40,
    ingestionProtocol:
      whiteLabel?.onboardingDetails?.ingestionProtocol || "DDEX_ERN_4_3",
    antiFraudInspectionRequired:
      whiteLabel?.onboardingDetails?.antiFraudInspectionRequired !== false,
    publishingCompanyType:
      whiteLabel?.onboardingDetails?.publishingCompanyType || "co_publishing",
    primaryProAffiliation:
      whiteLabel?.onboardingDetails?.primaryProAffiliation ||
      "ASCAP (United States)",
    ipiCaeNumber: whiteLabel?.onboardingDetails?.ipiCaeNumber || "",
    theMlcMemberCode: whiteLabel?.onboardingDetails?.theMlcMemberCode || "",
    musicalWorksCount: whiteLabel?.onboardingDetails?.musicalWorksCount ?? 150,
    songwritersRepresentedCount:
      whiteLabel?.onboardingDetails?.songwritersRepresentedCount ?? 12,
    cwrExchangeEnabled:
      whiteLabel?.onboardingDetails?.cwrExchangeEnabled !== false,
    scoutNetworkCategory:
      whiteLabel?.onboardingDetails?.scoutNetworkCategory || "talent_scout",
    projectedAnnualReferrals:
      whiteLabel?.onboardingDetails?.projectedAnnualReferrals ?? 10,
    projectedPipelineCatalogSize:
      whiteLabel?.onboardingDetails?.projectedPipelineCatalogSize ?? 500,
    preferredCommissionStructure:
      whiteLabel?.onboardingDetails?.preferredCommissionStructure ||
      "lifetime_rev_share",
  });

  // Synchronize forms whenever selected WhiteLabel changes or updates
  const [prevSyncKey, setPrevSyncKey] = useState<string>("");
  const currentSyncKey = whiteLabel
    ? `${whiteLabel.id}-${whiteLabel.updatedAt}-${whiteLabel.status}`
    : "";
  if (whiteLabel && currentSyncKey !== prevSyncKey) {
    setPrevSyncKey(currentSyncKey);
    setBrandingForm({
      name: whiteLabel.name || "",
      subdomain: whiteLabel.subdomain || "",
      customDomain: whiteLabel.customDomain || "",
      tagline: whiteLabel.tagline || "",
      description: whiteLabel.description || "",
      primaryColor: whiteLabel.primaryColor || "#6366f1",
      accentColor: whiteLabel.accentColor || "#ec4899",
      supportEmail: whiteLabel.supportEmail || "",
      supportPhone: whiteLabel.supportPhone || "",
      copyrightText: whiteLabel.copyrightText || "",
      socialInstagram: whiteLabel.socialInstagram || "",
      socialTwitter: whiteLabel.socialTwitter || "",
      socialYoutube: whiteLabel.socialYoutube || "",
      socialSpotify: whiteLabel.socialSpotify || "",
      socialFacebook: whiteLabel.socialFacebook || "",
      socialLinkedin: whiteLabel.socialLinkedin || "",
      socialTiktok: whiteLabel.socialTiktok || "",
    });
    setDossierForm({
      name: whiteLabel.name || "",
      businessType:
        whiteLabel.businessType || WhiteLabelBusinessType.RECORD_LABEL,
      companyWebsite: whiteLabel.companyWebsite || "",
      country: whiteLabel.country || "",
      yearsInBusiness: whiteLabel.yearsInBusiness ?? 1,
      isIncorporated: Boolean(whiteLabel.isIncorporated),
      incorporationDocUrl: whiteLabel.incorporationDocUrl || "",
      contactFirstName: whiteLabel.contactFirstName || "",
      contactLastName: whiteLabel.contactLastName || "",
      contactEmail: whiteLabel.contactEmail || "",
      contactLinkedIn: whiteLabel.contactLinkedIn || "",
      catalogTrackCount: whiteLabel.catalogTrackCount ?? 0,
      monthlyTrackDelivery: whiteLabel.monthlyTrackDelivery ?? 0,
      monthlyRevenueUsd: Number(whiteLabel.monthlyRevenueUsd || 0),
      primaryCatalogLanguage: whiteLabel.primaryCatalogLanguage || "English",
      userSignupModel:
        whiteLabel.userSignupModel || WhiteLabelSignupModel.INVITE_ONLY,
      subdomain: whiteLabel.subdomain || "",
      customDomain: whiteLabel.customDomain || "",
      elasticIpv4: whiteLabel.elasticIpv4 || "",
      hasDirectDeals: Boolean(whiteLabel.hasDirectDeals),
      wantsCatalogMigration: Boolean(whiteLabel.wantsCatalogMigration),
      hasSampleBasedCovers: Boolean(whiteLabel.hasSampleBasedCovers),
      primaryGenre:
        whiteLabel.onboardingDetails?.primaryGenre ||
        "Multi-Genre / All Genres",
      labelType: whiteLabel.onboardingDetails?.labelType || "independent",
      masterRoyaltySplitStandard:
        whiteLabel.onboardingDetails?.masterRoyaltySplitStandard ||
        "70/30 (Artist 70% / Label 30%)",
      isrcRegistrantCode:
        whiteLabel.onboardingDetails?.isrcRegistrantCode ||
        whiteLabel.onboardingDetails?.isrcPrefix ||
        "",
      dolbyAtmosReady:
        whiteLabel.onboardingDetails?.dolbyAtmosReady !== false,
      estimatedLaunchTimeline:
        whiteLabel.onboardingDetails?.estimatedLaunchTimeline ||
        "Immediate (1 - 2 Weeks)",
      subLabelsCount: whiteLabel.onboardingDetails?.subLabelsCount ?? 5,
      independentArtistsRepresented:
        whiteLabel.onboardingDetails?.independentArtistsRepresented ?? 40,
      ingestionProtocol:
        whiteLabel.onboardingDetails?.ingestionProtocol || "DDEX_ERN_4_3",
      antiFraudInspectionRequired:
        whiteLabel.onboardingDetails?.antiFraudInspectionRequired !== false,
      publishingCompanyType:
        whiteLabel.onboardingDetails?.publishingCompanyType || "co_publishing",
      primaryProAffiliation:
        whiteLabel.onboardingDetails?.primaryProAffiliation ||
        "ASCAP (United States)",
      ipiCaeNumber: whiteLabel.onboardingDetails?.ipiCaeNumber || "",
      theMlcMemberCode: whiteLabel.onboardingDetails?.theMlcMemberCode || "",
      musicalWorksCount:
        whiteLabel.onboardingDetails?.musicalWorksCount ?? 150,
      songwritersRepresentedCount:
        whiteLabel.onboardingDetails?.songwritersRepresentedCount ?? 12,
      cwrExchangeEnabled:
        whiteLabel.onboardingDetails?.cwrExchangeEnabled !== false,
      scoutNetworkCategory:
        whiteLabel.onboardingDetails?.scoutNetworkCategory || "talent_scout",
      projectedAnnualReferrals:
        whiteLabel.onboardingDetails?.projectedAnnualReferrals ?? 10,
      projectedPipelineCatalogSize:
        whiteLabel.onboardingDetails?.projectedPipelineCatalogSize ?? 500,
      preferredCommissionStructure:
        whiteLabel.onboardingDetails?.preferredCommissionStructure ||
        "lifetime_rev_share",
    });
  }

  if (!whiteLabel) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Compliance & Enterprise Readiness Scorecard calculation
  const paymentsList =
    whiteLabel.subscription?.payments || whiteLabel.payments || [];
  const hasCompletedPayment = paymentsList.some(
    (p) => p.status === "COMPLETED",
  );
  const totalPaidUsd = paymentsList
    .filter((p) => p.status === "COMPLETED")
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const readinessChecks = [
    {
      label: "Corporate Identity & KYB",
      passed: Boolean(
        whiteLabel.name && whiteLabel.country && whiteLabel.contactEmail,
      ),
      detail: whiteLabel.isIncorporated
        ? "Incorporated Entity"
        : "Sole Prop / Unincorporated",
    },
    {
      label: "Catalog & Roster Verification",
      passed: Boolean(
        (whiteLabel.artists && whiteLabel.artists.length > 0) ||
          whiteLabel.catalogTrackCount > 0,
      ),
      detail: `${whiteLabel.artists?.length || 0} Roster • ${whiteLabel.catalogTrackCount.toLocaleString()} Tracks`,
    },
    {
      label: "Subdomain & Routing Architecture",
      passed: Boolean(whiteLabel.subdomain),
      detail: whiteLabel.subdomain
        ? `${whiteLabel.subdomain}.rmitdistribution.com`
        : "Missing Subdomain",
    },
    {
      label: "Executed Legal Contract PDF",
      passed: Boolean(whiteLabel.contractKey),
      detail: whiteLabel.contractFileName || "Pending PDF Upload",
    },
    {
      label: "Subscription Payment Ledger",
      passed: hasCompletedPayment,
      detail: hasCompletedPayment
        ? `$${totalPaidUsd.toLocaleString()} USD Verified`
        : "Awaiting Payment Record",
    },
    {
      label: "Tenant Portal Live Activation",
      passed: whiteLabel.status === WhiteLabelStatus.ACTIVE,
      detail:
        whiteLabel.status === WhiteLabelStatus.ACTIVE
          ? "Live & Provisioned"
          : `Current: ${whiteLabel.status}`,
    },
  ];

  const readinessScore = Math.round(
    (readinessChecks.filter((c) => c.passed).length / readinessChecks.length) *
      100,
  );

  const handleUpdateStatus = async (
    newStatus: string,
    reasonOverride?: string,
  ) => {
    setStatusLoading(true);
    try {
      const res = await adminUpdateWhiteLabelStatusAction(whiteLabel.id, {
        status: newStatus,
        statusReason:
          reasonOverride !== undefined
            ? reasonOverride
            : statusReason || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("A reason note is required when declining an application.");
      return;
    }
    await handleUpdateStatus(WhiteLabelStatus.REJECTED, declineReason.trim());
    setShowDeclineModal(false);
    setDeclineReason("");
  };

  const handleUploadContract = async () => {
    if (!contractFile) {
      toast.error("Please select a signed contract PDF file.");
      return;
    }

    if (contractFile.type !== "application/pdf") {
      toast.error("Contract must be a valid PDF document.");
      return;
    }

    setContractLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", contractFile);

      const res = await adminUploadContractAction(whiteLabel.id, formData);
      if (res.success) {
        toast.success(res.message);
        setShowContractModal(false);
        setContractFile(null);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload contract agreement.");
    } finally {
      setContractLoading(false);
    }
  };

  const handlePreviewContract = async () => {
    setContractPreviewLoading(true);
    try {
      const res = await adminGetContractPreviewAction(whiteLabel.id);
      if (res.success && res.contractUrl) {
        window.open(res.contractUrl, "_blank");
      } else {
        toast.error(res.message || "Contract file could not be loaded.");
      }
    } catch {
      toast.error("Failed to load contract preview.");
    } finally {
      setContractPreviewLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.startsAt || !paymentForm.endsAt) {
      toast.error("Please provide valid start and end dates.");
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await adminRecordPaymentAction(whiteLabel.id, {
        amount: Number(paymentForm.amount) || 0,
        discount: Number(paymentForm.discount) || 0,
        startsAt: new Date(paymentForm.startsAt).toISOString(),
        endsAt: new Date(paymentForm.endsAt).toISOString(),
        status: paymentForm.status,
        paymentMethod: paymentForm.paymentMethod,
        receiptReference: paymentForm.receiptReference,
        adminNotes: paymentForm.adminNotes,
      });

      if (res.success) {
        toast.success(res.message);
        setShowPaymentModal(false);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to record payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!docFile) {
      toast.error("Please select a PDF document file to upload.");
      return;
    }

    setDocLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("documentType", docType);
      if (docTitle.trim()) {
        formData.append("title", docTitle.trim());
      }

      const res = await adminUploadDocumentAction(whiteLabel.id, formData);
      if (res.success) {
        toast.success(res.message);
        setShowDocModal(false);
        setDocFile(null);
        setDocTitle("");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to upload document.");
    } finally {
      setDocLoading(false);
    }
  };

  const handlePreviewDocument = async (doc: WhiteLabelDocument) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
      return;
    }

    setPreviewingDocId(doc.id);
    try {
      const res = await adminGetDocumentPreviewAction(doc.id);
      if (res.success && res.fileUrl) {
        window.open(res.fileUrl, "_blank");
      } else {
        toast.error(res.message || "Failed to load document preview.");
      }
    } catch {
      toast.error("Failed to load document preview.");
    } finally {
      setPreviewingDocId(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await adminDeleteDocumentAction(docId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete document.");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const res = await adminDeletePaymentAction(paymentId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete payment record.");
    }
  };

  const handleSuspend = async () => {
    setSuspendLoading(true);
    try {
      const res = await adminSuspendWhiteLabelAction(
        whiteLabel.id,
        suspendReason,
      );
      if (res.success) {
        toast.success(res.message);
        setShowSuspendModal(false);
        setSuspendReason("");
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to suspend WhiteLabel.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setSuspendLoading(true);
    try {
      const res = await adminUnsuspendWhiteLabelAction(whiteLabel.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to unsuspend WhiteLabel.");
    } finally {
      setSuspendLoading(false);
    }
  };

  const applyPackagePreset = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();
    const ends = new Date(now);
    let amount = paymentForm.amount;
    let discount = paymentForm.discount;

    switch (preset) {
      case "14_DAY_TRIAL":
        ends.setDate(now.getDate() + 14);
        amount = 0;
        discount = 0;
        break;
      case "30_DAY_TRIAL":
        ends.setDate(now.getDate() + 30);
        amount = 0;
        discount = 0;
        break;
      case "1_MONTH":
        ends.setMonth(now.getMonth() + 1);
        amount = 149;
        discount = 0;
        break;
      case "3_MONTHS":
        ends.setMonth(now.getMonth() + 3);
        amount = 399;
        discount = 48;
        break;
      case "6_MONTHS":
        ends.setMonth(now.getMonth() + 6);
        amount = 749;
        discount = 145;
        break;
      case "1_YEAR":
        ends.setFullYear(now.getFullYear() + 1);
        amount = 1200;
        discount = 588;
        break;
      case "2_YEARS":
        ends.setFullYear(now.getFullYear() + 2);
        amount = 2200;
        discount = 1376;
        break;
      case "CUSTOM":
        break;
    }

    setPaymentForm((prev) => ({
      ...prev,
      startsAt: now.toISOString().split("T")[0],
      endsAt: ends.toISOString().split("T")[0],
      amount,
      discount,
    }));
  };

  const handleActivate = async () => {
    setActivateLoading(true);
    try {
      const res = await adminActivateWhiteLabelAction(whiteLabel.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to activate WhiteLabel.");
    } finally {
      setActivateLoading(false);
    }
  };

  const handleSyncCloudflareDns = async () => {
    setDnsSyncLoading(true);
    try {
      const res = await adminSyncWhiteLabelDnsAction(whiteLabel.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to synchronize Cloudflare DNS.");
    } finally {
      setDnsSyncLoading(false);
    }
  };

  const handleSaveDossier = async () => {
    setDossierSaving(true);
    try {
      const res = await adminUpdateWhiteLabelApplicationAction(whiteLabel.id, {
        name: dossierForm.name,
        businessType: dossierForm.businessType,
        companyWebsite: dossierForm.companyWebsite,
        country: dossierForm.country,
        yearsInBusiness: Number(dossierForm.yearsInBusiness) || 0,
        isIncorporated: Boolean(dossierForm.isIncorporated),
        incorporationDocUrl: dossierForm.incorporationDocUrl,
        contactFirstName: dossierForm.contactFirstName,
        contactLastName: dossierForm.contactLastName,
        contactEmail: dossierForm.contactEmail,
        contactLinkedIn: dossierForm.contactLinkedIn,
        catalogTrackCount: Number(dossierForm.catalogTrackCount) || 0,
        monthlyTrackDelivery: Number(dossierForm.monthlyTrackDelivery) || 0,
        monthlyRevenueUsd: Number(dossierForm.monthlyRevenueUsd) || 0,
        primaryCatalogLanguage: dossierForm.primaryCatalogLanguage,
        userSignupModel: dossierForm.userSignupModel,
        subdomain: dossierForm.subdomain,
        customDomain: dossierForm.customDomain,
        elasticIpv4: dossierForm.elasticIpv4,
        hasDirectDeals: Boolean(dossierForm.hasDirectDeals),
        wantsCatalogMigration: Boolean(dossierForm.wantsCatalogMigration),
        hasSampleBasedCovers: Boolean(dossierForm.hasSampleBasedCovers),
        onboardingDetails: {
          ...(whiteLabel.onboardingDetails || {}),
          primaryGenre: dossierForm.primaryGenre,
          labelType: dossierForm.labelType,
          masterRoyaltySplitStandard: dossierForm.masterRoyaltySplitStandard,
          isrcRegistrantCode: dossierForm.isrcRegistrantCode,
          isrcPrefix: dossierForm.isrcRegistrantCode,
          dolbyAtmosReady: dossierForm.dolbyAtmosReady,
          estimatedLaunchTimeline: dossierForm.estimatedLaunchTimeline,
          subLabelsCount: Number(dossierForm.subLabelsCount) || 0,
          independentArtistsRepresented:
            Number(dossierForm.independentArtistsRepresented) || 0,
          ingestionProtocol: dossierForm.ingestionProtocol,
          antiFraudInspectionRequired: dossierForm.antiFraudInspectionRequired,
          publishingCompanyType: dossierForm.publishingCompanyType,
          primaryProAffiliation: dossierForm.primaryProAffiliation,
          ipiCaeNumber: dossierForm.ipiCaeNumber,
          theMlcMemberCode: dossierForm.theMlcMemberCode,
          musicalWorksCount: Number(dossierForm.musicalWorksCount) || 0,
          songwritersRepresentedCount:
            Number(dossierForm.songwritersRepresentedCount) || 0,
          cwrExchangeEnabled: dossierForm.cwrExchangeEnabled,
          scoutNetworkCategory: dossierForm.scoutNetworkCategory,
          projectedAnnualReferrals:
            Number(dossierForm.projectedAnnualReferrals) || 0,
          projectedPipelineCatalogSize:
            Number(dossierForm.projectedPipelineCatalogSize) || 0,
          preferredCommissionStructure:
            dossierForm.preferredCommissionStructure,
        },
      });

      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
        setActiveTab("overview");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update application dossier.");
    } finally {
      setDossierSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    setBrandingSaving(true);
    try {
      const res = await adminUpdateBrandingAction(whiteLabel.id, brandingForm);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update branding.");
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleAdminAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "logoDark" | "favicon" | "banner",
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setBrandingUploading(assetType);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", assetType);

      const res = await adminUploadBrandingAssetAction(whiteLabel.id, formData);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to upload ${assetType}.`);
    } finally {
      setBrandingUploading(null);
    }
  };

  const handleAdminDeleteAsset = async (assetType: string) => {
    try {
      const res = await adminDeleteBrandingAssetAction(
        whiteLabel.id,
        assetType,
      );
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Failed to delete ${assetType}.`);
    }
  };

  const statusBadges: Record<string, string> = {
    [WhiteLabelStatus.PENDING]:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    [WhiteLabelStatus.UNDER_REVIEW]:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    [WhiteLabelStatus.PROCESSING]:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    [WhiteLabelStatus.CONTRACTED]:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    [WhiteLabelStatus.PAID]:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [WhiteLabelStatus.ACTIVE]:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [WhiteLabelStatus.REJECTED]:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    [WhiteLabelStatus.SUSPENDED]:
      "bg-destructive/10 text-destructive border-destructive/30",
  };

  const activeLifecycleIndex = LIFECYCLE_STEPS.findIndex(
    (s) => s.status === whiteLabel.status,
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl glass-panel border border-border/80 shadow-2xl">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 pb-3 border-b border-border/60 bg-muted/20 space-y-3.5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {whiteLabel.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={whiteLabel.logoUrl}
                    alt={whiteLabel.name}
                    className="h-11 w-11 rounded-xl object-contain border border-border/70 bg-background p-1 shrink-0"
                  />
                ) : (
                  <div
                    className="h-11 w-11 rounded-xl shrink-0 flex items-center justify-center text-white font-extrabold text-base shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${whiteLabel.primaryColor || "#6366f1"}, ${whiteLabel.accentColor || "#ec4899"})`,
                    }}
                  >
                    {whiteLabel.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl font-extrabold truncate">
                      {whiteLabel.name}
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                    >
                      {whiteLabel.code}
                    </Badge>
                    <button
                      onClick={() => copyToClipboard(whiteLabel.code, "Code")}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copy Code"
                    >
                      {copiedField === "Code" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      KYB Readiness: {readinessScore}%
                    </Badge>
                  </div>

                  <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground/80">
                      {whiteLabel.businessType.replace(/_/g, " ")}
                    </span>
                    {whiteLabel.country && <span>• {whiteLabel.country}</span>}
                    {whiteLabel.subdomain && (
                      <span className="font-mono text-primary">
                        • {whiteLabel.subdomain}.rmitdistribution.com
                      </span>
                    )}
                    <span>• Applied {formatDate(whiteLabel.createdAt)}</span>
                  </DialogDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs px-3 py-1 font-bold capitalize shrink-0 ${
                  statusBadges[whiteLabel.status] || "border-border"
                }`}
              >
                {String(whiteLabel.status).replace(/_/g, " ").toLowerCase()}
              </Badge>
            </div>

            {/* Interactive 6-Stage Sequential Lifecycle Pipeline Stepper */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-0.5">
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isCompleted =
                  whiteLabel.status === WhiteLabelStatus.ACTIVE ||
                  (activeLifecycleIndex !== -1 && idx < activeLifecycleIndex);
                const isCurrent = step.status === whiteLabel.status;
                return (
                  <div
                    key={step.status}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${
                      isCurrent
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : isCompleted
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <span className="truncate">{step.label}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Rejection Alert Banner if status is REJECTED */}
            {whiteLabel.status === WhiteLabelStatus.REJECTED && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Application Declined</span>
                </div>
                <div className="p-2 rounded-lg bg-background/80 border border-border/50 text-foreground font-mono text-[11px] leading-relaxed">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">
                    Decline Reason Note (Visible to Client):
                  </span>
                  {whiteLabel.statusReason ||
                    "No specific decline reason was provided."}
                </div>
              </div>
            )}

            {/* Strict Sequential Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Step 1: PENDING -> UNDER_REVIEW or REJECTED */}
                {whiteLabel.status === WhiteLabelStatus.PENDING && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(WhiteLabelStatus.UNDER_REVIEW)
                      }
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Begin KYB Review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 2: UNDER_REVIEW -> PROCESSING or REJECTED */}
                {whiteLabel.status === WhiteLabelStatus.UNDER_REVIEW && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(WhiteLabelStatus.PROCESSING)
                      }
                      disabled={statusLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve KYB & Mark Processing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 3: PROCESSING -> CONTRACTED */}
                {whiteLabel.status === WhiteLabelStatus.PROCESSING && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowContractModal(true)}
                      className="h-8 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      Upload Signed Contract PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeclineReason("");
                        setShowDeclineModal(true);
                      }}
                      disabled={statusLoading}
                      className="h-8 text-xs font-semibold gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
                    >
                      Decline Application
                    </Button>
                  </>
                )}

                {/* Step 4: CONTRACTED -> PAID */}
                {whiteLabel.status === WhiteLabelStatus.CONTRACTED && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Record Offline / Wire Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviewContract}
                      disabled={contractPreviewLoading}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {contractPreviewLoading
                        ? "Loading..."
                        : "Preview Contract"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowContractModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Replace Contract
                    </Button>
                  </>
                )}

                {/* Step 5: PAID -> ACTIVE */}
                {whiteLabel.status === WhiteLabelStatus.PAID && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleActivate}
                      disabled={activateLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      {activateLoading
                        ? "Provisioning Cloudflare DNS..."
                        : "Activate WhiteLabel (Cloudflare Auto-DNS)"}
                    </Button>
                    {whiteLabel.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Add Payment
                    </Button>
                  </>
                )}

                {/* Step 6: ACTIVE -> SUSPENDED */}
                {whiteLabel.status === WhiteLabelStatus.ACTIVE && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuspendModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Suspend Instance
                    </Button>
                    {whiteLabel.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Extend Subscription
                    </Button>
                  </>
                )}

                {/* SUSPENDED -> ACTIVE */}
                {whiteLabel.status === WhiteLabelStatus.SUSPENDED && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleUnsuspend}
                      disabled={suspendLoading}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Unsuspend & Restore Portal
                    </Button>
                    {whiteLabel.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Preview Contract
                      </Button>
                    )}
                  </>
                )}

                {/* REJECTED -> UNDER_REVIEW */}
                {whiteLabel.status === WhiteLabelStatus.REJECTED && (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(WhiteLabelStatus.UNDER_REVIEW)
                    }
                    disabled={statusLoading}
                    className="h-8 text-xs font-semibold gap-1.5 bg-muted text-foreground border border-border/70"
                  >
                    Re-open Application for Review
                  </Button>
                )}
              </div>

              {/* Right Quick Utility Buttons */}
              <div className="flex items-center gap-1.5">
                {whiteLabel.subdomain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCloudflareDns}
                    disabled={dnsSyncLoading}
                    className="h-8 text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                    title="Provision or Re-sync Cloudflare Subdomain DNS"
                  >
                    <Globe
                      className={`h-3.5 w-3.5 ${dnsSyncLoading ? "animate-spin" : ""}`}
                    />
                    {dnsSyncLoading ? "Syncing DNS..." : "Sync DNS"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("edit_dossier")}
                  className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                >
                  <Edit3 className="h-3.5 w-3.5 text-primary" />
                  Edit Dossier
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocModal(true)}
                  className="h-8 text-xs font-semibold gap-1.5 border-border/80"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Doc
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/40 text-xs pt-1 overflow-x-auto no-scrollbar gap-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile & Dossier
              </button>
              <button
                onClick={() => setActiveTab("edit_dossier")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 flex items-center gap-1 ${
                  activeTab === "edit_dossier"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="h-3 w-3" />
                Edit Dossier & Operations
              </button>
              <button
                onClick={() => setActiveTab("artists")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "artists"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                  ? `Sub-Labels (${whiteLabel.artists?.length || 0})`
                  : whiteLabel.businessType === "MUSIC_PUBLISHER"
                    ? `Songwriters (${whiteLabel.artists?.length || 0})`
                    : whiteLabel.businessType === "REFERRER"
                      ? `Pipeline (${whiteLabel.artists?.length || 0})`
                      : `Top Artists (${whiteLabel.artists?.length || 0})`}
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "documents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Legal & Agreements (
                {(whiteLabel.documents?.length || 0) +
                  (whiteLabel.contractKey ? 1 : 0)}
                )
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "payments"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Billing & Ledger ({paymentsList.length})
              </button>
              <button
                onClick={() => setActiveTab("branding")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "branding"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Branding & Cloud DNS
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar text-xs">
            {/* TAB 1: Profile & Operations Dossier */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Automated KYB & Readiness Scorecard */}
                <div className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                      Enterprise KYB & Activation Readiness Checklist
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-bold border-primary/40 bg-primary/10 text-primary"
                    >
                      {readinessScore}% Complete
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {readinessChecks.map((check) => (
                      <div
                        key={check.label}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                          check.passed
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-amber-500/30 bg-amber-500/5"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            check.passed
                              ? "text-emerald-500"
                              : "text-amber-500 opacity-60"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-[11px] truncate">
                            {check.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {check.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Contact & Corporate Registration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Primary Decision Maker & Contact
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Full Name
                        </span>
                        <p className="font-bold text-foreground">
                          {whiteLabel.contactFirstName}{" "}
                          {whiteLabel.contactLastName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Work Email
                        </span>
                        <a
                          href={`mailto:${whiteLabel.contactEmail}`}
                          className="font-mono text-primary hover:underline break-all"
                        >
                          {whiteLabel.contactEmail}
                        </a>
                      </div>
                      {whiteLabel.contactLinkedIn && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-[10px] block">
                            LinkedIn Executive Profile
                          </span>
                          <a
                            href={whiteLabel.contactLinkedIn}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {whiteLabel.contactLinkedIn}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Corporate Entity & Domain Routing
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Country & Tenure
                        </span>
                        <p className="font-bold text-foreground">
                          {whiteLabel.country || "Global"} •{" "}
                          {whiteLabel.yearsInBusiness || 1} yr(s)
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Legal Incorporation
                        </span>
                        <p className="font-bold text-foreground">
                          {whiteLabel.isIncorporated
                            ? "Incorporated Entity"
                            : "Sole Proprietorship"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Managed Subdomain
                        </span>
                        <p className="font-mono font-bold text-primary truncate">
                          {whiteLabel.subdomain
                            ? `${whiteLabel.subdomain}.rmitdistribution.com`
                            : "Not Set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          Dedicated Elastic IPv4
                        </span>
                        <p className="font-mono font-bold text-foreground">
                          {whiteLabel.elasticIpv4 || "Cloudflare Shared Proxy"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Catalog & Distribution Telemetry */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Catalog & Financial Telemetry
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">
                        Catalog Tracks
                      </span>
                      <p className="font-bold text-base text-foreground">
                        {whiteLabel.catalogTrackCount.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">
                        Monthly Delivery
                      </span>
                      <p className="font-bold text-base text-foreground">
                        {whiteLabel.monthlyTrackDelivery.toLocaleString()} / mo
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">
                        Monthly Revenue
                      </span>
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        $
                        {Number(
                          whiteLabel.monthlyRevenueUsd || 0,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">
                        Portal Signup Model
                      </span>
                      <p className="font-bold text-sm text-foreground">
                        {whiteLabel.userSignupModel.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Domain Architecture Dossier */}
                {whiteLabel.onboardingDetails && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        Domain Architecture & Onboarding Dossier
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-primary/30 text-primary"
                      >
                        {whiteLabel.businessType.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                      {whiteLabel.businessType === "RECORD_LABEL" && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Label Category
                            </span>
                            <span className="font-bold text-foreground capitalize">
                              {(
                                whiteLabel.onboardingDetails.labelType ||
                                "independent"
                              ).replace(/_/g, " ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Primary Genre
                            </span>
                            <span className="font-bold text-foreground">
                              {whiteLabel.onboardingDetails.primaryGenre ||
                                "Multi-Genre / All Genres"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Artist Royalty Split
                            </span>
                            <span className="font-bold text-foreground">
                              {whiteLabel.onboardingDetails
                                .masterRoyaltySplitStandard ||
                                "70/30 (Artist 70% / Label 30%)"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              ISRC Prefix
                            </span>
                            <span className="font-bold text-foreground font-mono">
                              {whiteLabel.onboardingDetails
                                .isrcRegistrantCode ||
                                whiteLabel.onboardingDetails.isrcPrefix ||
                                "Platform Delegated"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Spatial Audio / Atmos
                            </span>
                            <span className="font-bold text-foreground">
                              {whiteLabel.onboardingDetails.dolbyAtmosReady !==
                              false
                                ? "ADM BWF WAV Ready"
                                : "Standard Stereo WAV"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Server Routing
                            </span>
                            <span className="font-bold text-foreground font-mono">
                              {whiteLabel.elasticIpv4
                                ? `Elastic IP (${whiteLabel.elasticIpv4})`
                                : "Cloudflare Managed"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Launch Timeline
                            </span>
                            <span className="font-bold text-foreground">
                              {whiteLabel.onboardingDetails
                                .estimatedLaunchTimeline || "Immediate"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-[10px] block">
                              Primary Language
                            </span>
                            <span className="font-bold text-foreground">
                              {whiteLabel.primaryCatalogLanguage || "English"}
                            </span>
                          </div>
                        </div>
                      )}

                      {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR" && (
                        <div className="space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Managed Sub-Labels
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails.subLabelsCount ??
                                  5}{" "}
                                sub-labels
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Independent Creators
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .independentArtistsRepresented ?? 40}{" "}
                                artists
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Ingestion Protocol
                              </span>
                              <span className="font-bold text-foreground font-mono">
                                {(
                                  whiteLabel.onboardingDetails
                                    .ingestionProtocol ||
                                  whiteLabel.onboardingDetails
                                    .ingestionStandard ||
                                  "DDEX_ERN_4_3"
                                ).replace(/_/g, " ")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                QC & Anti-Fraud
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .antiFraudInspectionRequired !== false
                                  ? "Active Fingerprinting"
                                  : "Standard"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {whiteLabel.businessType === "MUSIC_PUBLISHER" && (
                        <div className="space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Musical Works
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .musicalWorksCount ?? 150}{" "}
                                works
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Songwriters Count
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .songwritersRepresentedCount ?? 12}{" "}
                                writers
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Primary PRO / CMO
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .primaryProAffiliation ||
                                  "ASCAP (United States)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Publisher IPI / CAE
                              </span>
                              <span className="font-bold text-foreground font-mono">
                                {whiteLabel.onboardingDetails.ipiCaeNumber ||
                                  whiteLabel.onboardingDetails.caeIpiNumber ||
                                  "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {whiteLabel.businessType === "REFERRER" && (
                        <div className="space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Scout Category
                              </span>
                              <span className="font-bold text-foreground capitalize">
                                {(
                                  whiteLabel.onboardingDetails
                                    .scoutNetworkCategory || "talent_scout"
                                ).replace(/_/g, " ")}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Annual Referrals
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .projectedAnnualReferrals ?? 10}{" "}
                                partners / yr
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Pipeline Catalog
                              </span>
                              <span className="font-bold text-foreground">
                                {whiteLabel.onboardingDetails
                                  .projectedPipelineCatalogSize ?? 500}{" "}
                                tracks
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] block">
                                Commission Structure
                              </span>
                              <span className="font-bold text-foreground capitalize">
                                {(
                                  whiteLabel.onboardingDetails
                                    .preferredCommissionStructure ||
                                  "lifetime_rev_share"
                                ).replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Edit Dossier & Operations (Full Admin Override Editor) */}
            {activeTab === "edit_dossier" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/30 bg-primary/5">
                  <div>
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 className="h-4 w-4 text-primary" />
                      Admin Dossier & Operations Override Editor
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Directly modify corporate details, catalog metrics,
                      primary genre, routing infrastructure, and compliance
                      flags.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveDossier}
                    disabled={dossierSaving}
                    className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {dossierSaving ? "Saving Changes..." : "Save All Changes"}
                  </Button>
                </div>

                {/* Section 1: Corporate & Contact */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    1. Corporate Entity & Representative
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Company / Label Name
                      </Label>
                      <Input
                        value={dossierForm.name}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            name: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Business Model
                      </Label>
                      <Select
                        value={dossierForm.businessType}
                        onValueChange={(val) =>
                          setDossierForm((p) => ({
                            ...p,
                            businessType: val as WhiteLabelBusinessType,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RECORD_LABEL">
                            Record Label
                          </SelectItem>
                          <SelectItem value="DISTRIBUTOR_AGGREGATOR">
                            Distributor / Aggregator
                          </SelectItem>
                          <SelectItem value="MUSIC_PUBLISHER">
                            Music Publisher
                          </SelectItem>
                          <SelectItem value="REFERRER">
                            Referrer / Scout
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Country</Label>
                      <Input
                        value={dossierForm.country}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            country: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Contact First Name
                      </Label>
                      <Input
                        value={dossierForm.contactFirstName}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            contactFirstName: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Contact Last Name
                      </Label>
                      <Input
                        value={dossierForm.contactLastName}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            contactLastName: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Work Email
                      </Label>
                      <Input
                        value={dossierForm.contactEmail}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            contactEmail: e.target.value,
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Catalog, Genre & Portal Signup */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    2. Catalog Telemetry, Genre & Portal Architecture
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Primary Genre Focus
                      </Label>
                      <Select
                        value={dossierForm.primaryGenre}
                        onValueChange={(val) =>
                          setDossierForm((p) => ({
                            ...p,
                            primaryGenre: val || "Multi-Genre / All Genres",
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GLOBAL_GENRE_OPTIONS.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Primary Catalog Language
                      </Label>
                      <Select
                        value={dossierForm.primaryCatalogLanguage}
                        onValueChange={(val) =>
                          setDossierForm((p) => ({
                            ...p,
                            primaryCatalogLanguage: val || "English",
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
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

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Creator Signup Model
                      </Label>
                      <Select
                        value={dossierForm.userSignupModel}
                        onValueChange={(val) =>
                          setDossierForm((p) => ({
                            ...p,
                            userSignupModel: val as WhiteLabelSignupModel,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INVITE_ONLY">
                            Invite Only
                          </SelectItem>
                          <SelectItem value="ADMIN_APPROVAL">
                            Admin Approval
                          </SelectItem>
                          <SelectItem value="OPEN_REGISTRATION">
                            Open Registration
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Total Catalog Tracks
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={dossierForm.catalogTrackCount}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            catalogTrackCount: Number(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Monthly Release Velocity
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={dossierForm.monthlyTrackDelivery}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            monthlyTrackDelivery: Number(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Monthly Revenue ($ USD)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={dossierForm.monthlyRevenueUsd}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            monthlyRevenueUsd: Number(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Domain, Elastic IP & Compliance Switches */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    3. Network Routing & Compliance Switches
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Managed Subdomain
                      </Label>
                      <Input
                        value={dossierForm.subdomain}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            subdomain: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          }))
                        }
                        placeholder="labelname"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Custom Domain (Optional)
                      </Label>
                      <Input
                        value={dossierForm.customDomain}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            customDomain: e.target.value.toLowerCase().trim(),
                          }))
                        }
                        placeholder="portal.label.com"
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Dedicated Elastic IPv4 (Optional)
                      </Label>
                      <Input
                        value={dossierForm.elasticIpv4}
                        onChange={(e) =>
                          setDossierForm((p) => ({
                            ...p,
                            elasticIpv4: e.target.value.trim(),
                          }))
                        }
                        placeholder="e.g. 52.220.193.225"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <span className="text-[11px] font-medium">
                        Incorporated
                      </span>
                      <Switch
                        checked={dossierForm.isIncorporated}
                        onCheckedChange={(v) =>
                          setDossierForm((p) => ({ ...p, isIncorporated: v }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <span className="text-[11px] font-medium">
                        Direct Deals
                      </span>
                      <Switch
                        checked={dossierForm.hasDirectDeals}
                        onCheckedChange={(v) =>
                          setDossierForm((p) => ({ ...p, hasDirectDeals: v }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <span className="text-[11px] font-medium">
                        Catalog Migration
                      </span>
                      <Switch
                        checked={dossierForm.wantsCatalogMigration}
                        onCheckedChange={(v) =>
                          setDossierForm((p) => ({
                            ...p,
                            wantsCatalogMigration: v,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <span className="text-[11px] font-medium">
                        Sample / Covers
                      </span>
                      <Switch
                        checked={dossierForm.hasSampleBasedCovers}
                        onCheckedChange={(v) =>
                          setDossierForm((p) => ({
                            ...p,
                            hasSampleBasedCovers: v,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Top Roster Artists / Entities */}
            {activeTab === "artists" && (
              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                    ? "Sub-Labels & Ingestion Catalogs Submitted for Verification"
                    : whiteLabel.businessType === "MUSIC_PUBLISHER"
                      ? "Songwriters & Musical Works Submitted for Verification"
                      : whiteLabel.businessType === "REFERRER"
                        ? "Client & Talent Pipeline Prospects Submitted for Verification"
                        : "Top Roster Artists Submitted for Verification"}
                </h4>
                {whiteLabel.artists && whiteLabel.artists.length > 0 ? (
                  <div className="space-y-3">
                    {whiteLabel.artists.map((artist, idx) => (
                      <div
                        key={artist.id || idx}
                        className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground">
                            {artist.artistName}
                          </span>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] px-1.5 py-0"
                          >
                            {artist.code}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-muted-foreground pt-1">
                          {artist.monthlyListeners !== null &&
                            artist.monthlyListeners !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Music className="h-3.5 w-3.5 text-primary" />
                                <span className="font-semibold text-foreground">
                                  {artist.monthlyListeners.toLocaleString()}{" "}
                                  listeners
                                </span>
                              </div>
                            )}
                          {artist.instagramHandle && (
                            <div className="flex items-center gap-1.5">
                              <Camera className="h-3.5 w-3.5 text-pink-500" />
                              <span>{artist.instagramHandle}</span>
                            </div>
                          )}
                          {artist.spotifyProfileUrl && (
                            <a
                              href={artist.spotifyProfileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Spotify Profile
                            </a>
                          )}
                          {artist.youtubeChannelUrl && (
                            <a
                              href={artist.youtubeChannelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <Video className="h-3.5 w-3.5" />
                              YouTube Channel
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No roster artists provided.
                  </p>
                )}
              </div>
            )}

            {/* TAB 4: Documents & Signed Agreements */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                {/* Primary Executed Contract Card */}
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <h5 className="font-bold text-xs uppercase tracking-wider text-foreground">
                        Primary Executed Partnership Contract
                      </h5>
                    </div>
                    {whiteLabel.contractKey ? (
                      <p className="text-xs text-muted-foreground">
                        Uploaded:{" "}
                        <strong className="text-foreground">
                          {whiteLabel.contractFileName || "contract.pdf"}
                        </strong>{" "}
                        {whiteLabel.contractUploadedAt &&
                          `on ${formatDate(whiteLabel.contractUploadedAt)}`}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No primary executed contract PDF uploaded yet.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {whiteLabel.contractKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewContract}
                        disabled={contractPreviewLoading}
                        className="h-7 text-xs gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Preview PDF
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setShowContractModal(true)}
                      className="h-7 text-xs gap-1 bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <Upload className="h-3 w-3" />
                      {whiteLabel.contractKey
                        ? "Replace Contract"
                        : "Upload Contract PDF"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    S3 Stored Legal Agreements & Supplementary Documents
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setShowDocModal(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Document
                  </Button>
                </div>

                {whiteLabel.documents && whiteLabel.documents.length > 0 ? (
                  <div className="space-y-2.5">
                    {whiteLabel.documents.map((doc: WhiteLabelDocument) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-xs truncate">
                                {doc.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="font-mono text-[9px] px-1.5 py-0"
                              >
                                {doc.code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="capitalize">
                                {doc.type.replace(/_/g, " ").toLowerCase()}
                              </span>
                              {doc.fileSizeBytes && (
                                <span>
                                  • {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                                </span>
                              )}
                              <span>• {formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 font-semibold text-primary border-primary/30 hover:bg-primary/5"
                            onClick={() => handlePreviewDocument(doc)}
                            disabled={previewingDocId === doc.id}
                            title="Preview Document"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {previewingDocId === doc.id
                              ? "Opening..."
                              : "Preview"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Delete document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed rounded-xl space-y-2 text-muted-foreground">
                    <File className="h-8 w-8 mx-auto opacity-50" />
                    <p className="text-xs font-semibold">
                      No supplementary documents uploaded yet
                    </p>
                    <p className="text-[11px]">
                      Upload signed distribution contracts, incorporation
                      documents, or tax forms (W8/W9).
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Subscription & Payments */}
            {activeTab === "payments" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Subscription & Recorded Payments Ledger
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                    className="h-7 text-xs gap-1 bg-primary text-primary-foreground font-semibold"
                  >
                    <Plus className="h-3 w-3" />
                    Record Payment
                  </Button>
                </div>

                {/* Subscription Details Card */}
                <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Subscription Code
                      </span>
                      <code className="font-mono font-bold text-foreground text-xs">
                        {whiteLabel.subscription?.code ||
                          whiteLabel.subscriptionId}
                      </code>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Subscriber
                      </span>
                      <p className="font-semibold text-foreground text-xs">
                        {whiteLabel.subscription?.subscriber?.firstName
                          ? `${whiteLabel.subscription.subscriber.firstName} ${whiteLabel.subscription.subscriber.lastName}`
                          : `${whiteLabel.contactFirstName} ${whiteLabel.contactLastName}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Total Recorded Payments
                      </span>
                      <p className="font-bold text-base text-foreground">
                        {paymentsList.length}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Verified Lifetime Value (LTV)
                      </span>
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        ${totalPaidUsd.toLocaleString()} USD
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recorded Payments List */}
                <div className="space-y-3">
                  <h5 className="font-bold text-foreground text-xs">
                    Payment Ledger & Receipts
                  </h5>
                  {paymentsList.length > 0 ? (
                    <div className="space-y-2.5">
                      {paymentsList.map((pay: any, idx: number) => (
                        <div
                          key={pay.id || idx}
                          className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] font-bold border-primary/40 bg-primary/10 text-primary"
                              >
                                {pay.code || `PAY-#${idx + 1}`}
                              </Badge>
                              <span className="font-extrabold text-sm text-foreground">
                                ${(pay.amount || 0).toLocaleString()} USD
                              </span>
                              {pay.discount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] text-muted-foreground"
                                >
                                  ${pay.discount} discount
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 font-bold uppercase ${
                                  pay.status === "COMPLETED"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}
                              >
                                {pay.status}
                              </Badge>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePayment(pay.id)}
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                title="Delete payment entry"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                            <div>
                              <span className="block text-[10px] text-muted-foreground">
                                Start Date:
                              </span>
                              <span className="font-medium text-foreground">
                                {formatDate(pay.startsAt)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-muted-foreground">
                                Expiration / Ends:
                              </span>
                              <span className="font-medium text-foreground">
                                {formatDate(pay.endsAt)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-muted-foreground">
                                Recorded On:
                              </span>
                              <span className="font-medium text-foreground">
                                {formatDate(pay.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed rounded-xl space-y-2 text-muted-foreground">
                      <CreditCard className="h-8 w-8 mx-auto opacity-50" />
                      <p className="text-xs font-semibold">
                        No payments recorded yet
                      </p>
                      <p className="text-[11px]">
                        Click &quot;Record Payment&quot; above to log an offline
                        wire transfer or subscription transaction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: Identity, Branding & Cloud DNS */}
            {activeTab === "branding" && (
              <div className="space-y-6">
                {/* Branding Actions Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
                  <div>
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      WhiteLabel Brand & Cloud DNS Configuration
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Configure custom domains, Cloudflare Auto-DNS routing, and
                      visual identity assets for this tenant.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {brandingForm.subdomain && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncCloudflareDns}
                        disabled={dnsSyncLoading}
                        className="text-xs font-semibold gap-1.5"
                      >
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        {dnsSyncLoading ? "Syncing DNS..." : "Sync Cloudflare DNS"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveBranding}
                      disabled={brandingSaving}
                      className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {brandingSaving ? "Saving..." : "Save Branding"}
                    </Button>
                  </div>
                </div>

                {/* Visual Asset Uploaders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Primary Logo */}
                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Primary Logo
                      </Label>
                      {whiteLabel.logoUrl && (
                        <button
                          onClick={() => handleAdminDeleteAsset("logo")}
                          className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="h-20 rounded-lg border border-dashed border-border/80 bg-muted/20 flex items-center justify-center p-2">
                      {whiteLabel.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={whiteLabel.logoUrl}
                          alt="Logo"
                          className="max-h-14 max-w-[120px] object-contain"
                        />
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          No logo
                        </p>
                      )}
                    </div>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAdminAssetUpload(e, "logo")}
                        disabled={brandingUploading === "logo"}
                        className="hidden"
                      />
                      <div className="h-7 w-full rounded-md border border-border/80 hover:bg-muted/40 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors">
                        <Upload className="h-3 w-3 text-primary" />
                        {brandingUploading === "logo"
                          ? "Uploading..."
                          : "Upload Logo"}
                      </div>
                    </label>
                  </div>

                  {/* Dark Mode Logo */}
                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Dark Mode Logo
                      </Label>
                      {whiteLabel.logoDarkUrl && (
                        <button
                          onClick={() => handleAdminDeleteAsset("logoDark")}
                          className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="h-20 rounded-lg border border-dashed border-border/80 bg-zinc-900 flex items-center justify-center p-2">
                      {whiteLabel.logoDarkUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={whiteLabel.logoDarkUrl}
                          alt="Dark Logo"
                          className="max-h-14 max-w-[120px] object-contain"
                        />
                      ) : (
                        <p className="text-[10px] text-zinc-500">
                          No dark logo
                        </p>
                      )}
                    </div>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAdminAssetUpload(e, "logoDark")}
                        disabled={brandingUploading === "logoDark"}
                        className="hidden"
                      />
                      <div className="h-7 w-full rounded-md border border-border/80 hover:bg-muted/40 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors">
                        <Upload className="h-3 w-3 text-primary" />
                        {brandingUploading === "logoDark"
                          ? "Uploading..."
                          : "Upload Dark Logo"}
                      </div>
                    </label>
                  </div>

                  {/* Favicon */}
                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        Favicon (32x32)
                      </Label>
                      {whiteLabel.faviconUrl && (
                        <button
                          onClick={() => handleAdminDeleteAsset("favicon")}
                          className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="h-16 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-center p-2">
                      {whiteLabel.faviconUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={whiteLabel.faviconUrl}
                          alt="Favicon"
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAdminAssetUpload(e, "favicon")}
                        disabled={brandingUploading === "favicon"}
                        className="hidden"
                      />
                      <div className="h-7 w-full rounded-md border border-border/80 hover:bg-muted/40 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors">
                        <Upload className="h-3 w-3 text-primary" />
                        {brandingUploading === "favicon"
                          ? "Uploading..."
                          : "Upload Favicon"}
                      </div>
                    </label>
                  </div>

                  {/* Banner */}
                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        Header Banner
                      </Label>
                      {whiteLabel.bannerUrl && (
                        <button
                          onClick={() => handleAdminDeleteAsset("banner")}
                          className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                    <div className="h-16 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-center relative overflow-hidden">
                      {whiteLabel.bannerUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={whiteLabel.bannerUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <p className="text-[10px] text-muted-foreground">
                          Default gradient
                        </p>
                      )}
                    </div>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAdminAssetUpload(e, "banner")}
                        disabled={brandingUploading === "banner"}
                        className="hidden"
                      />
                      <div className="h-7 w-full rounded-md border border-border/80 hover:bg-muted/40 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors">
                        <Upload className="h-3 w-3 text-primary" />
                        {brandingUploading === "banner"
                          ? "Uploading..."
                          : "Upload Banner"}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Subdomain & Custom Domain */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Network & Custom Domains
                  </h5>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Managed Subdomain
                    </Label>
                    <div className="flex items-center">
                      <Input
                        placeholder="labelhandle"
                        value={brandingForm.subdomain}
                        onChange={(e) =>
                          setBrandingForm((prev) => ({
                            ...prev,
                            subdomain: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          }))
                        }
                        className="h-8 text-xs font-mono rounded-r-none border-r-0 min-w-0"
                      />
                      <span className="h-8 px-2 bg-muted/80 border border-l-0 rounded-r-md text-[11px] font-mono flex items-center text-muted-foreground shrink-0 select-none">
                        .rmitdistribution.com
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Custom FQDN Domain
                    </Label>
                    <Input
                      placeholder="music.mylabel.com"
                      value={brandingForm.customDomain}
                      onChange={(e) =>
                        setBrandingForm((prev) => ({
                          ...prev,
                          customDomain: e.target.value.toLowerCase().trim(),
                        }))
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Color Palette */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-primary" />
                    Brand Color Palette
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Primary Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandingForm.primaryColor}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              primaryColor: e.target.value,
                            }))
                          }
                          className="h-8 w-10 shrink-0 rounded cursor-pointer border bg-transparent p-0.5"
                        />
                        <Input
                          value={brandingForm.primaryColor}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              primaryColor: e.target.value,
                            }))
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Accent Color
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={brandingForm.accentColor}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              accentColor: e.target.value,
                            }))
                          }
                          className="h-8 w-10 shrink-0 rounded cursor-pointer border bg-transparent p-0.5"
                        />
                        <Input
                          value={brandingForm.accentColor}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              accentColor: e.target.value,
                            }))
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Brand Voice & Support Details */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Profile & Support
                  </h5>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Tagline / Slogan
                      </Label>
                      <Input
                        value={brandingForm.tagline}
                        onChange={(e) =>
                          setBrandingForm((prev) => ({
                            ...prev,
                            tagline: e.target.value,
                          }))
                        }
                        placeholder="e.g. Independent Sound Platform"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Description / Bio
                      </Label>
                      <Textarea
                        value={brandingForm.description}
                        onChange={(e) =>
                          setBrandingForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Brand mission and catalog bio..."
                        className="text-xs min-h-[70px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Support Email
                        </Label>
                        <Input
                          value={brandingForm.supportEmail}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              supportEmail: e.target.value,
                            }))
                          }
                          placeholder="support@label.com"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Support Phone
                        </Label>
                        <Input
                          value={brandingForm.supportPhone}
                          onChange={(e) =>
                            setBrandingForm((prev) => ({
                              ...prev,
                              supportPhone: e.target.value,
                            }))
                          }
                          placeholder="+880 18 588 92007"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Offline Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[480px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Record Offline / Manual Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a bank transfer, direct deposit, or offline cash payment to
              activate or extend this WhiteLabel subscription.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Package Preset Quick Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Billing Plan Package Preset
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "14_DAY_TRIAL", label: "14d Trial ($0)" },
                  { id: "30_DAY_TRIAL", label: "30d Trial ($0)" },
                  { id: "1_MONTH", label: "1 Month ($149)" },
                  { id: "3_MONTHS", label: "3 Months ($399)" },
                  { id: "6_MONTHS", label: "6 Months ($749)" },
                  { id: "1_YEAR", label: "1 Year ($1,200)" },
                  { id: "2_YEARS", label: "2 Years ($2,200)" },
                  { id: "CUSTOM", label: "Custom Deal" },
                ].map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => applyPackagePreset(pkg.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-center ${
                      selectedPreset === pkg.id
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                        : "border-border/60 hover:border-border hover:bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Amount ($ USD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      amount: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Discount ($ USD)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={paymentForm.discount}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      discount: Number(e.target.value) || 0,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={paymentForm.startsAt}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      startsAt: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  End Date (Expiration)
                </Label>
                <Input
                  type="date"
                  value={paymentForm.endsAt}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      endsAt: e.target.value,
                    }))
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Payment Method & Receipt Reference */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(val) => {
                    if (val) {
                      setPaymentForm((prev) => ({
                        ...prev,
                        paymentMethod: val,
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="Select method">
                      {(val) =>
                        paymentMethodLabels[val as string] ||
                        val ||
                        "Select method"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HAND_TO_HAND">
                      Hand-to-Hand (Cash / Direct)
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      Direct Bank Wire / ACH
                    </SelectItem>
                    <SelectItem value="CASH">In-Person Cash</SelectItem>
                    <SelectItem value="INVOICE">
                      Corporate Invoice / PO
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Receipt / Reference ID
                </Label>
                <Input
                  placeholder="e.g. REC-2026-081 or Wire Ref"
                  value={paymentForm.receiptReference}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      receiptReference: e.target.value,
                    }))
                  }
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Admin Notes / Receipt Details
              </Label>
              <Input
                placeholder="e.g. Received $1,200 hand-to-hand signed by representative"
                value={paymentForm.adminNotes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    adminNotes: e.target.value,
                  }))
                }
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRecordPayment}
              disabled={paymentLoading}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {paymentLoading ? "Recording..." : "Confirm & Save Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Executed Contract Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="sm:max-w-[480px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <FileSignature className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Upload Executed Contract Agreement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload the signed mutual partnership agreement PDF between
              RoyalMotionIT and {whiteLabel.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Signed Contract PDF File{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setContractFile(e.target.files[0]);
                  }
                }}
                className="h-9 text-xs cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowContractModal(false);
                setContractFile(null);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadContract}
              disabled={contractLoading || !contractFile}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
            >
              {contractLoading ? "Uploading PDF..." : "Upload & Save Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Application Reason Modal */}
      <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
        <DialogContent className="sm:max-w-[460px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Decline WhiteLabel Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide a clear explanation for why this application is being
              declined. This note will be displayed to the applicant so they can
              amend and resubmit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold">
              Decline Reason Note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="e.g. Please provide valid corporate registration documents and verifiable links to your primary roster catalog..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="text-xs min-h-[100px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeclineModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDecline}
              disabled={statusLoading || !declineReason.trim()}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
            >
              {statusLoading ? "Declining..." : "Confirm Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend WhiteLabel Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="sm:max-w-[460px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Suspend WhiteLabel Tenant Instance
            </DialogTitle>
            <DialogDescription className="text-xs">
              Suspending this WhiteLabel will restrict tenant portal access
              until unsuspended.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold">
              Suspension Reason Note
            </Label>
            <Textarea
              placeholder="e.g. Subscription invoice past due or DMCA compliance review..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="text-xs min-h-[90px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuspendModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSuspend}
              disabled={suspendLoading}
              className="text-xs font-bold bg-destructive text-destructive-foreground"
            >
              {suspendLoading ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Supplementary Document Modal */}
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent className="sm:max-w-[460px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Legal or KYB Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Store signed agreements, incorporation certificates, or tax forms
              in the S3 vault.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Document Category</Label>
              <Select
                value={docType}
                onValueChange={(v) => v && setDocType(v)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue>
                    {(val) =>
                      adminDocTypeLabels[val as string] ||
                      val ||
                      "Select Document Type"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGNED_AGREEMENT">
                    Signed Agreement
                  </SelectItem>
                  <SelectItem value="DISTRIBUTION_CONTRACT">
                    Distribution Contract
                  </SelectItem>
                  <SelectItem value="INCORPORATION_DOC">
                    Incorporation Document
                  </SelectItem>
                  <SelectItem value="TAX_DOCUMENT">
                    Tax Document (W8/W9)
                  </SelectItem>
                  <SelectItem value="OTHER">Other Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document Title (Optional)
              </Label>
              <Input
                placeholder="e.g. 2026 Master Distribution Addendum"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document File <span className="text-destructive">*</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                  }
                }}
                className="h-9 text-xs cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadDocument}
              disabled={docLoading || !docFile}
              className="text-xs font-bold bg-primary text-primary-foreground"
            >
              {docLoading ? "Uploading..." : "Upload to S3 Vault"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
