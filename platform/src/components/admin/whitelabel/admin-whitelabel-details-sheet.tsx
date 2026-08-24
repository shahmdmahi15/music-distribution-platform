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
  Headphones,
  Camera,
  Lock,
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
  User,
  Upload,
  Trash2,
  Download,
  File,
  Palette,
  Save,
  Phone,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Separator } from "@/components/ui/separator";
import { WhiteLabel, WhiteLabelStatus, WhiteLabelDocument } from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { adminUpdateWhiteLabelStatusAction } from "@/actions/admin/whitelabel/admin-update-whitelabel-status.action";
import { adminRecordPaymentAction } from "@/actions/admin/whitelabel/admin-record-payment.action";
import { adminActivateWhiteLabelAction } from "@/actions/admin/whitelabel/admin-activate-whitelabel.action";
import { adminUploadDocumentAction } from "@/actions/admin/whitelabel/admin-upload-document.action";
import { adminDeleteDocumentAction } from "@/actions/admin/whitelabel/admin-delete-document.action";
import { adminDeletePaymentAction } from "@/actions/admin/whitelabel/admin-delete-payment.action";
import { adminSuspendWhiteLabelAction } from "@/actions/admin/whitelabel/admin-suspend-whitelabel.action";
import { adminUnsuspendWhiteLabelAction } from "@/actions/admin/whitelabel/admin-unsuspend-whitelabel.action";
import { adminUpdateBrandingAction } from "@/actions/admin/whitelabel/admin-update-branding.action";
import { adminUploadBrandingAssetAction } from "@/actions/admin/whitelabel/admin-upload-branding-asset.action";
import { adminDeleteBrandingAssetAction } from "@/actions/admin/whitelabel/admin-delete-branding-asset.action";

interface AdminWhiteLabelDetailsSheetProps {
  whiteLabel: WhiteLabel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

export function AdminWhiteLabelDetailsSheet({
  whiteLabel,
  open,
  onOpenChange,
  onRefresh,
}: AdminWhiteLabelDetailsSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "artists" | "documents" | "payments" | "branding">("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Status Update state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusReason, setStatusReason] = useState("");

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
  });

  // Document Upload Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("SIGNED_AGREEMENT");
  const [docTitle, setDocTitle] = useState("");

  // Activate state
  const [activateLoading, setActivateLoading] = useState(false);

  // Admin Branding Manager State
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingUploading, setBrandingUploading] = useState<string | null>(null);
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

  if (!whiteLabel) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const res = await adminUpdateWhiteLabelStatusAction(whiteLabel.id, {
        status: newStatus,
        statusReason: statusReason || undefined,
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
      const res = await adminSuspendWhiteLabelAction(whiteLabel.id, suspendReason);
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
    let ends = new Date(now);
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
        // Keep current dates and values for fully custom entry
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
      const res = await adminDeleteBrandingAssetAction(whiteLabel.id, assetType);
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

  const statusBadges = {
    [WhiteLabelStatus.PENDING]: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    [WhiteLabelStatus.UNDER_REVIEW]: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    [WhiteLabelStatus.APPROVED]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    [WhiteLabelStatus.REJECTED]: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    [WhiteLabelStatus.SUSPENDED]: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[720px] overflow-y-auto p-0 flex flex-col">
          {/* Header Banner */}
          <div className="p-6 pb-4 border-b border-border/60 bg-muted/20 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SheetTitle className="text-xl font-bold truncate">
                    {whiteLabel.name}
                  </SheetTitle>
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
                </div>
                <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{whiteLabel.businessType.replace("_", " ")}</span>
                  {whiteLabel.country && <span>• {whiteLabel.country}</span>}
                </SheetDescription>
              </div>

              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-1 font-semibold capitalize shrink-0 ${
                  (statusBadges as Record<string, string>)[whiteLabel.status] ||
                  "border-border"
                }`}
              >
                {String(whiteLabel.status).replace("_", " ").toLowerCase()}
              </Badge>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {whiteLabel.status !== WhiteLabelStatus.APPROVED &&
                whiteLabel.status !== WhiteLabelStatus.SUSPENDED && (
                  <Button
                    size="sm"
                    onClick={handleActivate}
                    disabled={activateLoading}
                    className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Activate WhiteLabel
                  </Button>
                )}

              {whiteLabel.status === WhiteLabelStatus.SUSPENDED ? (
                <Button
                  size="sm"
                  onClick={handleUnsuspend}
                  disabled={suspendLoading}
                  className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Unsuspend / Reactivate
                </Button>
              ) : (
                whiteLabel.status === WhiteLabelStatus.APPROVED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSuspendModal(true)}
                    className="h-8 text-xs font-semibold gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Suspend WhiteLabel
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="h-8 text-xs font-semibold gap-1.5 border-border/80"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Record Payment / Plan
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocModal(true)}
                className="h-8 text-xs font-semibold gap-1.5 border-border/80"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload PDF Agreement
              </Button>

              {/* Status Switcher Select */}
              <div className="flex items-center gap-1.5 ml-auto">
                <Select
                  value={whiteLabel.status}
                  onValueChange={(val) => {
                    if (val) handleUpdateStatus(val);
                  }}
                  disabled={statusLoading}
                >
                  <SelectTrigger className="h-8 text-xs w-[145px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WhiteLabelStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={WhiteLabelStatus.UNDER_REVIEW}>Under Review</SelectItem>
                    <SelectItem value={WhiteLabelStatus.APPROVED}>Approved</SelectItem>
                    <SelectItem value={WhiteLabelStatus.REJECTED}>Rejected</SelectItem>
                    <SelectItem value={WhiteLabelStatus.SUSPENDED}>Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/40 text-xs pt-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile & Operations
              </button>
              <button
                onClick={() => setActiveTab("artists")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "artists"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Top Artists ({whiteLabel.artists?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "documents"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Documents & Agreements ({whiteLabel.documents?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("payments")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "payments"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Subscription & Payments
              </button>
              <button
                onClick={() => setActiveTab("branding")}
                className={`pb-2 px-3 font-semibold transition-colors border-b-2 shrink-0 ${
                  activeTab === "branding"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Identity & Branding
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1 text-xs">
            {/* TAB 1: Profile & Operations */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Contact Person */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Primary Decision Maker & Contact
                  </h4>
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Full Name</span>
                      <p className="font-semibold text-foreground">
                        {whiteLabel.contactFirstName} {whiteLabel.contactLastName}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[11px] block">Work Email</span>
                      <p className="font-mono text-foreground">{whiteLabel.contactEmail}</p>
                    </div>

                    {whiteLabel.contactLinkedIn && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground text-[11px] block">LinkedIn Profile</span>
                        <a
                          href={whiteLabel.contactLinkedIn}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {whiteLabel.contactLinkedIn}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Catalog & Distribution Telemetry */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Catalog & Financial Telemetry
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">Catalog Tracks</span>
                      <p className="font-bold text-base text-foreground">
                        {whiteLabel.catalogTrackCount.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">Monthly Delivery</span>
                      <p className="font-bold text-base text-foreground">
                        {whiteLabel.monthlyTrackDelivery.toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-center">
                      <span className="text-muted-foreground text-[10px] block">Monthly Revenue</span>
                      <p className="font-bold text-base text-foreground">
                        ${Number(whiteLabel.monthlyRevenueUsd || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Operations & Compliance Flags */}
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Operations, Direct Deals & Agreements
                  </h4>
                  <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Direct Deals:</span>
                        <span className="font-bold text-foreground">
                          {whiteLabel.hasDirectDeals ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Catalog Migration:</span>
                        <span className="font-bold text-foreground">
                          {whiteLabel.wantsCatalogMigration ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Sample Covers:</span>
                        <span className="font-bold text-foreground">
                          {whiteLabel.hasSampleBasedCovers ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Signup Model:</span>
                        <span className="font-bold text-foreground">
                          {whiteLabel.userSignupModel}
                        </span>
                      </div>
                    </div>

                    {whiteLabel.incorporationDocUrl && (
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Incorporation Document:</span>
                        <a
                          href={whiteLabel.incorporationDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Top Roster Artists */}
            {activeTab === "artists" && (
              <div className="space-y-4">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Top Roster Artists Submitted for Verification
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
                          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                            {artist.code}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
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
                  <p className="text-muted-foreground">No roster artists provided.</p>
                )}
              </div>
            )}

            {/* TAB 3: Documents & Signed Agreements */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    S3 Stored Legal Agreements & Documents
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setShowDocModal(true)}
                    className="h-7 text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Upload Agreement
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
                              <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0">
                                {doc.code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="capitalize">
                                {doc.type.replace(/_/g, " ").toLowerCase()}
                              </span>
                              {doc.fileSizeBytes && (
                                <span>• {(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                              )}
                              <span>• {formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {doc.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              render={<a href={doc.fileUrl} target="_blank" rel="noreferrer" />}
                            >
                              <Download className="h-3 w-3" />
                              View PDF
                            </Button>
                          )}
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
                    <p className="text-xs font-semibold">No agreements uploaded yet</p>
                    <p className="text-[11px]">
                      Upload signed distribution contracts, incorporation documents, or tax forms.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Subscription & Payments */}
            {activeTab === "payments" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Subscription & Recorded Payments
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Subscription Code
                      </span>
                      <code className="font-mono font-bold text-foreground text-xs">
                        {whiteLabel.subscription?.code || whiteLabel.subscriptionId}
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
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {whiteLabel.subscription?.subscriber?.code || whiteLabel.contactEmail}
                      </span>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">
                        Total Recorded Payments
                      </span>
                      <p className="font-bold text-base text-foreground">
                        {(whiteLabel.subscription?.payments || whiteLabel.payments || []).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recorded Payments List */}
                <div className="space-y-3">
                  <h5 className="font-bold text-foreground text-xs">Payment Ledger & Receipts</h5>
                  {((whiteLabel.subscription?.payments || whiteLabel.payments || []).length > 0) ? (
                    <div className="space-y-2.5">
                      {(whiteLabel.subscription?.payments || whiteLabel.payments || []).map((pay, idx) => (
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
                                <Badge variant="secondary" className="text-[10px] text-muted-foreground">
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
                              <span className="block text-[10px] text-muted-foreground">Start Date:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(pay.startsAt)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-muted-foreground">Expiration / Ends:</span>
                              <span className="font-medium text-foreground">
                                {formatDate(pay.endsAt)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-muted-foreground">Recorded On:</span>
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
                      <p className="text-xs font-semibold">No payments recorded yet</p>
                      <p className="text-[11px]">
                        Click &quot;Record Payment&quot; above to log an offline wire transfer or subscription transaction.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Identity & Branding */}
            {activeTab === "branding" && (
              <div className="space-y-6">
                {/* Branding Actions Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/20">
                  <div>
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      WhiteLabel Brand Configuration
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Configure custom domains, brand palette, and visual identity assets for this tenant.
                    </p>
                  </div>
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
                        <p className="text-[10px] text-muted-foreground">No logo</p>
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
                        {brandingUploading === "logo" ? "Uploading..." : "Upload Logo"}
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
                        <p className="text-[10px] text-zinc-500">No dark logo</p>
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
                        {brandingUploading === "logoDark" ? "Uploading..." : "Upload Dark Logo"}
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
                        <img src={whiteLabel.faviconUrl} alt="Favicon" className="h-6 w-6 object-contain" />
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
                        {brandingUploading === "favicon" ? "Uploading..." : "Upload Favicon"}
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
                        <img src={whiteLabel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Default gradient</p>
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
                        {brandingUploading === "banner" ? "Uploading..." : "Upload Banner"}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Subdomain & Custom Domain (Stacked to avoid collision) */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Network & Custom Domains
                  </h5>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Managed Subdomain</Label>
                    <div className="flex items-center">
                      <Input
                        placeholder="labelhandle"
                        value={brandingForm.subdomain}
                        onChange={(e) =>
                          setBrandingForm((prev) => ({
                            ...prev,
                            subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
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
                    <Label className="text-xs font-semibold">Custom FQDN Domain</Label>
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
                      <Label className="text-xs font-semibold">Primary Color</Label>
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
                      <Label className="text-xs font-semibold">Accent Color</Label>
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
                      <Label className="text-xs font-semibold">Tagline / Slogan</Label>
                      <Input
                        value={brandingForm.tagline}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, tagline: e.target.value }))}
                        placeholder="e.g. Independent Sound Platform"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Description / Bio</Label>
                      <Textarea
                        value={brandingForm.description}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Brand mission and catalog bio..."
                        className="text-xs min-h-[70px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Support Email</Label>
                        <Input
                          value={brandingForm.supportEmail}
                          onChange={(e) => setBrandingForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
                          placeholder="support@label.com"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Support Phone</Label>
                        <Input
                          value={brandingForm.supportPhone}
                          onChange={(e) => setBrandingForm((prev) => ({ ...prev, supportPhone: e.target.value }))}
                          placeholder="+1 555-019-2834"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Copyright Text</Label>
                      <Input
                        value={brandingForm.copyrightText}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, copyrightText: e.target.value }))}
                        placeholder="© 2026 Record Label. All rights reserved."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                    Social Ecosystem Handles
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Instagram URL</Label>
                      <Input
                        value={brandingForm.socialInstagram}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, socialInstagram: e.target.value }))}
                        placeholder="https://instagram.com/..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">X / Twitter URL</Label>
                      <Input
                        value={brandingForm.socialTwitter}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, socialTwitter: e.target.value }))}
                        placeholder="https://x.com/..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">YouTube URL</Label>
                      <Input
                        value={brandingForm.socialYoutube}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, socialYoutube: e.target.value }))}
                        placeholder="https://youtube.com/..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Spotify URL</Label>
                      <Input
                        value={brandingForm.socialSpotify}
                        onChange={(e) => setBrandingForm((prev) => ({ ...prev, socialSpotify: e.target.value }))}
                        placeholder="https://open.spotify.com/..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Record Offline Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Record Offline / Manual Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a bank transfer, direct deposit, or offline cash payment to activate this WhiteLabel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Package Preset Quick Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Billing Plan Package Preset</Label>
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
                <Label className="text-xs font-semibold">Discount ($ USD)</Label>
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
                <Label className="text-xs font-semibold">End Date (Expiration)</Label>
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

      {/* Suspend Confirmation Modal */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Suspend WhiteLabel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Suspending this WhiteLabel will immediately lock the client portal and restrict menu access until reactivated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Suspension Reason / Internal Notes</Label>
              <Input
                placeholder="e.g. Agreement breach, non-payment, or catalog audit"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
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
              className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {suspendLoading ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document / Agreement Modal */}
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Agreement to S3 Storage
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload signed PDF contracts, distribution agreements, or incorporation documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document File (PDF / DOC) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setDocFile(e.target.files[0]);
                    if (!docTitle) setDocTitle(e.target.files[0].name);
                  }
                }}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Document Title</Label>
              <Input
                placeholder="e.g. Master Distribution Agreement 2026"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Document Type</Label>
              <Select value={docType} onValueChange={(val) => val && setDocType(val)}>
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIGNED_AGREEMENT">Signed Agreement</SelectItem>
                  <SelectItem value="DISTRIBUTION_CONTRACT">Distribution Contract</SelectItem>
                  <SelectItem value="INCORPORATION_DOC">Incorporation Document</SelectItem>
                  <SelectItem value="TAX_DOCUMENT">Tax Document (W8/W9)</SelectItem>
                  <SelectItem value="OTHER">Other Agreement</SelectItem>
                </SelectContent>
              </Select>
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
              {docLoading ? "Uploading to S3..." : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
