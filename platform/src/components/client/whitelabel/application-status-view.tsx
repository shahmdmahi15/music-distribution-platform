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
  ExternalLink,
  FileCheck2,
  Globe,
  Lock,
  Mail,
  Music,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  DollarSign,
  FileText,
  Download,
  File,
  ChevronRight,
  Receipt,
  FileSignature,
  Upload,
  MessageSquare,
  PhoneCall,
  Headphones,
  FileCheck,
  AlertTriangle,
  Trash2,
  Layers,
  Radio,
  Disc3,
  Share2,
  Award,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhiteLabel, WhiteLabelStatus } from "@/types/whitelabel";
import { formatDate } from "@/lib/utils";
import { SubscriptionPayment } from "@/types/subscription";
import { clientGetContractPreviewAction } from "@/actions/client/whitelabel/client-get-contract-preview.action";
import { clientUploadDocumentAction } from "@/actions/client/whitelabel/client-upload-document.action";
import { clientDeleteDocumentAction } from "@/actions/client/whitelabel/client-delete-document.action";
import { clientGetDocumentPreviewAction } from "@/actions/client/whitelabel/client-get-document-preview.action";

const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  INCORPORATION_DOC: "Company Incorporation / Business Certificate",
  DISTRIBUTION_CONTRACT: "Distribution Agreement / Contract",
  CATALOG_RIGHTS: "Catalog Ownership / Rights Clearance Proof",
  IDENTITY_PROOF: "Government ID / Passport of Contact Person",
  TAX_DOCUMENT: "Tax Form (W-8 / W-9 / Tax ID Certificate)",
  SUPPLEMENTARY_DOCUMENT: "Other Supplementary Verification Document",
};

interface ApplicationStatusViewProps {
  whiteLabel: WhiteLabel;
  payments?: SubscriptionPayment[];
  onReapply?: () => void;
}

export function WhiteLabelApplicationStatusView({
  whiteLabel,
  payments = [],
  onReapply,
}: ApplicationStatusViewProps) {
  const router = useRouter();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewingContract, setIsPreviewingContract] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("INCORPORATION_DOC");
  const [isDeletingDocId, setIsDeletingDocId] = useState<string | null>(null);
  const [previewingDocId, setPreviewingDocId] = useState<string | null>(null);

  const handlePreviewDocument = async (doc: any) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank");
      return;
    }
    setPreviewingDocId(doc.id);
    try {
      const res = await clientGetDocumentPreviewAction(doc.id);
      if (res.success && res.fileUrl) {
        window.open(res.fileUrl, "_blank");
      } else {
        toast.error(res.message || "Unable to open document preview.");
      }
    } catch {
      toast.error("Failed to load document preview link.");
    } finally {
      setPreviewingDocId(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    if (docFile.size > 25 * 1024 * 1024) {
      toast.error("File size cannot exceed 25MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", docFile);
    formData.append("name", docTitle.trim() || docFile.name);
    formData.append("type", docType);

    setIsUploadingDoc(true);
    const toastId = toast.loading("Uploading document to secure storage...");

    try {
      const res = await clientUploadDocumentAction(formData);
      if (res.success) {
        toast.success("Document uploaded successfully.", { id: toastId });
        setShowUploadModal(false);
        setDocFile(null);
        setDocTitle("");
        setDocType("INCORPORATION_DOC");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to upload document.", {
          id: toastId,
        });
      }
    } catch {
      toast.error("An error occurred during file upload.", { id: toastId });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    setIsDeletingDocId(docId);
    try {
      const res = await clientDeleteDocumentAction(docId);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to delete document.");
    } finally {
      setIsDeletingDocId(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Status updated.");
    }, 600);
  };

  const handlePreviewContract = async () => {
    setIsPreviewingContract(true);
    try {
      const res = await clientGetContractPreviewAction();
      if (res.success && res.contractUrl) {
        window.open(res.contractUrl, "_blank");
      } else {
        toast.error(res.message || "Contract file could not be loaded.");
      }
    } catch {
      toast.error("Failed to fetch contract preview.");
    } finally {
      setIsPreviewingContract(false);
    }
  };

  const statusConfig: Record<
    WhiteLabelStatus,
    {
      label: string;
      color: string;
      description: string;
      stepIndex: number;
    }
  > = {
    [WhiteLabelStatus.PENDING]: {
      label: "Application Pending Review",
      color:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      description:
        "Your WhiteLabel application has been safely received. Platform administrators will review your credentials and reach out directly.",
      stepIndex: 1,
    },
    [WhiteLabelStatus.UNDER_REVIEW]: {
      label: "Under Review & Direct Contact",
      color:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      description:
        "A platform administrator is currently reviewing your catalog details and reaching out to finalize partnership terms.",
      stepIndex: 2,
    },
    [WhiteLabelStatus.PROCESSING]: {
      label: "Review Complete • Contract Preparation",
      color:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      description:
        "Review is complete! The formal partnership agreement is being drafted and prepared for mutual execution.",
      stepIndex: 3,
    },
    [WhiteLabelStatus.CONTRACTED]: {
      label: "Agreement Executed (Contract Signed)",
      color:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      description:
        "The signed agreement has been uploaded by the platform administrator. You can preview the agreement below. Next step is hand-to-hand / offline payment registration.",
      stepIndex: 4,
    },
    [WhiteLabelStatus.PAID]: {
      label: "Payment Verified • Pending Final Activation",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description:
        "Payment has been registered and verified by administrators. Cloudflare DNS provisioning and final account activation are being finalized.",
      stepIndex: 5,
    },
    [WhiteLabelStatus.ACTIVE]: {
      label: "WhiteLabel Active & Operational",
      color:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      description:
        "Your WhiteLabel instance is live! Subdomain routing is automated via Cloudflare, and full console navigation is unlocked.",
      stepIndex: 6,
    },
    [WhiteLabelStatus.REJECTED]: {
      label: "Application Declined • Administrative Review",
      color:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description: whiteLabel.statusReason
        ? `Reviewer Reason Note: "${whiteLabel.statusReason}"`
        : "Your application was reviewed and could not be approved at this time. Please see the reviewer details below.",
      stepIndex: 2,
    },
    [WhiteLabelStatus.SUSPENDED]: {
      label: "WhiteLabel Suspended",
      color:
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
      description:
        whiteLabel.statusReason ||
        "Your WhiteLabel instance has been suspended due to subscription expiration or administrative action.",
      stepIndex: 6,
    },
  };

  const currentCfg =
    statusConfig[whiteLabel.status] || statusConfig[WhiteLabelStatus.PENDING];
  const stepIdx = currentCfg.stepIndex;

  const latestPayment =
    payments[0] || (whiteLabel.payments && whiteLabel.payments[0]);
  const hasVerifiedPayment =
    whiteLabel.status === WhiteLabelStatus.PAID ||
    whiteLabel.status === WhiteLabelStatus.ACTIVE ||
    Boolean(latestPayment && latestPayment.status === "COMPLETED");
  const hasSignedContract =
    whiteLabel.status === WhiteLabelStatus.CONTRACTED ||
    hasVerifiedPayment ||
    Boolean(whiteLabel.contractKey);

  const steps = [
    {
      num: 1,
      id: "pending",
      title: "1. Submitted",
      desc: "Application received & logged",
      isDone: stepIdx >= 1,
      isActive: false,
    },
    {
      num: 2,
      id: "review",
      title: "2. Under Review",
      desc: "Admin catalog verification & contact",
      isDone: stepIdx >= 3 || hasSignedContract,
      isActive:
        whiteLabel.status === WhiteLabelStatus.PENDING ||
        whiteLabel.status === WhiteLabelStatus.UNDER_REVIEW,
    },
    {
      num: 3,
      id: "processing",
      title: "3. Processing",
      desc: "Review complete, agreement drafting",
      isDone: stepIdx >= 4 || hasSignedContract,
      isActive: whiteLabel.status === WhiteLabelStatus.PROCESSING,
    },
    {
      num: 4,
      id: "contracted",
      title: "4. Contracted",
      desc: "Signed agreement uploaded & verified",
      isDone: hasSignedContract,
      isActive: false,
    },
    {
      num: 5,
      id: "paid",
      title: "5. Paid",
      desc: hasVerifiedPayment
        ? "Payment registered & verified"
        : "Hand-to-hand / offline payment",
      isDone: hasVerifiedPayment,
      isActive:
        whiteLabel.status === WhiteLabelStatus.CONTRACTED &&
        !hasVerifiedPayment,
    },
    {
      num: 6,
      id: "active",
      title: "6. Active",
      desc:
        whiteLabel.status === WhiteLabelStatus.PAID
          ? "Pending final DNS activation"
          : "Cloudflare DNS live & console unlocked",
      isDone: whiteLabel.status === WhiteLabelStatus.ACTIVE,
      isActive: whiteLabel.status === WhiteLabelStatus.PAID,
    },
  ];

  const completedStepsCount = steps.filter((s) => s.isDone).length;
  const isLive = whiteLabel.status === WhiteLabelStatus.ACTIVE;

  return (
    <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
      {/* Header Card */}
      <Card className="overflow-hidden border-border/80 shadow-md glass-card">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {whiteLabel.name}
                </h1>
                <Badge
                  variant="outline"
                  className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                >
                  {whiteLabel.code}
                </Badge>
                <button
                  onClick={() =>
                    copyToClipboard(whiteLabel.code, "WhiteLabel Code")
                  }
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy WhiteLabel Code"
                >
                  {copiedField === "WhiteLabel Code" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {whiteLabel.subdomain && (
                  <Badge
                    variant="secondary"
                    onClick={() =>
                      copyToClipboard(
                        `${whiteLabel.subdomain}.platform.royalmotionit.com`,
                        "Subdomain URL",
                      )
                    }
                    className="font-mono text-[11px] px-2.5 py-0.5 cursor-pointer hover:bg-muted gap-1.5"
                    title="Click to copy reserved subdomain"
                  >
                    <Globe className="h-3 w-3 text-primary" />
                    {whiteLabel.subdomain}.platform.royalmotionit.com
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground/90">
                  {whiteLabel.businessType.replace(/_/g, " ")}
                </span>
                {whiteLabel.country && <span>• {whiteLabel.country}</span>}
                {whiteLabel.companyWebsite && (
                  <>
                    <span>•</span>
                    <a
                      href={
                        whiteLabel.companyWebsite.startsWith("http")
                          ? whiteLabel.companyWebsite
                          : `https://${whiteLabel.companyWebsite}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      {whiteLabel.companyWebsite}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
                {whiteLabel.createdAt && (
                  <span suppressHydrationWarning>
                    • Submitted {formatDate(whiteLabel.createdAt)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onReapply &&
                (whiteLabel.status === WhiteLabelStatus.PENDING ||
                  whiteLabel.status === WhiteLabelStatus.REJECTED) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onReapply}
                    className="h-8 text-xs gap-1.5 font-semibold"
                  >
                    <FileSignature className="h-3.5 w-3.5" />
                    Edit Application
                  </Button>
                )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh Status
              </Button>
            </div>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${currentCfg.color}`}
          >
            <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">{currentCfg.label}</p>
              <p className="text-xs opacity-90 leading-relaxed">
                {currentCfg.description}
              </p>
            </div>
          </div>
        </div>

        {/* 6-Step Milestone Progression Stepper */}
        <Separator />
        <div className="p-6 bg-muted/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Onboarding & Activation Flow
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              {whiteLabel.status === WhiteLabelStatus.ACTIVE
                ? "Completed (6 of 6)"
                : `${completedStepsCount} of 6 Milestones Verified`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                  s.isDone
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : s.isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs"
                      : "border-border/40 bg-card/40 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      s.isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : s.isActive
                          ? "text-primary font-extrabold"
                          : "text-muted-foreground"
                    }`}
                  >
                    STEP {s.num}
                  </span>
                  {s.isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : s.isActive &&
                    whiteLabel.status === WhiteLabelStatus.REJECTED ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  ) : s.isActive ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-primary/40"></span>
                      <Clock className="h-3.5 w-3.5 text-primary relative" />
                    </div>
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
                <p className="font-bold text-xs text-foreground leading-tight">
                  {s.title}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Rejected / Declined Alert Card with Administrative Reason */}
      {whiteLabel.status === WhiteLabelStatus.REJECTED && (
        <Card className="border-rose-500/50 bg-rose-500/5 shadow-md overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className="border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wide"
                  >
                    Action Required • Application Declined
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Admin Review Update
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  Your WhiteLabel Application Requires Updates
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  During catalog and operational verification, platform
                  administration requested changes or additional verification
                  documents before contract execution.
                </p>
              </div>
            </div>

            {/* Decline Reason Note Box */}
            <div className="rounded-xl border border-rose-500/30 bg-background/80 dark:bg-card/80 p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                <MessageSquare className="h-4 w-4" />
                Reviewer Note / Decline Reason:
              </div>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium p-3 bg-rose-500/5 rounded-lg border border-rose-500/20">
                {whiteLabel.statusReason ||
                  "No detailed note provided. Please upload additional business documentation below or contact the enterprise onboarding desk."}
              </div>
            </div>

            {/* Resolution Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-500/20">
              <p className="text-xs text-muted-foreground">
                You can upload requested documents in the{" "}
                <strong>Verification Vault</strong> below, or modify your
                application.
              </p>
              <div className="flex items-center gap-2">
                {onReapply && (
                  <Button
                    size="sm"
                    onClick={onReapply}
                    className="h-8 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
                  >
                    Edit & Re-Submit Application
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  className="h-8 text-xs font-semibold gap-1.5 border-rose-500/30 hover:bg-rose-500/10 text-foreground"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Requested Document
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Active WhiteLabel Live Gateway */}
      {isLive && (
        <Card
          className={
            whiteLabel.isSetupComplete ||
            (whiteLabel as { isSetupCompleted?: boolean }).isSetupCompleted
              ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
              : "border-amber-500/50 bg-linear-to-r from-amber-500/10 via-primary/5 to-transparent shadow-sm"
          }
        >
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {whiteLabel.isSetupComplete ||
                (whiteLabel as { isSetupCompleted?: boolean })
                  .isSetupCompleted ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] font-bold">
                    ACTIVE &amp; OPERATIONAL
                  </Badge>
                ) : (
                  <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-[11px] font-bold">
                    ACTION REQUIRED • INITIAL SETUP &amp; CLOUD DEPLOYMENT
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  Cloudflare Automated DNS Active
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {whiteLabel.isSetupComplete ||
                (whiteLabel as { isSetupCompleted?: boolean }).isSetupCompleted
                  ? "Your WhiteLabel instance is fully configured, provisioned, and live for your clients."
                  : "Your WhiteLabel license is activated! Complete the Guided Setup Wizard to configure your Brand Identity, API Keys, and Automated AWS + Cloudflare Deployment to unlock your full console."}
              </p>
              {whiteLabel.subdomain && (
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  https://{whiteLabel.subdomain}.platform.royalmotionit.com
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {whiteLabel.isSetupComplete ||
              (whiteLabel as { isSetupCompleted?: boolean })
                .isSetupCompleted ? (
                <>
                  {whiteLabel.subdomain && (
                    <a
                      href={`https://${whiteLabel.customDomain || `${whiteLabel.subdomain}.platform.royalmotionit.com`}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-xs font-medium gap-1.5 h-9 px-3 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit Live Portal
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => router.push("/whitelabel")}
                    className="gap-1.5 text-xs h-9 bg-primary text-primary-foreground font-semibold"
                  >
                    Open WhiteLabel Console
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push("/whitelabel/setup")}
                  className="gap-1.5 text-xs h-10 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
                >
                  Launch Guided Setup Wizard
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Agreement Section */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" />
              Partnership Contract Agreement
            </CardTitle>
            <CardDescription className="text-xs">
              The official executed agreement governing your WhiteLabel
              licensing and service level terms.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {whiteLabel.contractKey ? (
            <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {whiteLabel.contractFileName ||
                        "Executed_Contract_Agreement.pdf"}
                    </p>
                    <Badge
                      variant="outline"
                      className="font-mono text-[9px] px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    >
                      SIGNED & VERIFIED
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {whiteLabel.contractFileSize && (
                      <span>
                        {(whiteLabel.contractFileSize / 1024).toFixed(1)} KB
                      </span>
                    )}
                    {whiteLabel.contractUploadedAt && (
                      <span suppressHydrationWarning>
                        • Uploaded {formatDate(whiteLabel.contractUploadedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewContract}
                disabled={isPreviewingContract}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                {isPreviewingContract ? "Loading..." : "Preview / Download PDF"}
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-xl space-y-2 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">
                Contract Agreement Not Yet Uploaded
              </p>
              <p className="text-[11px] max-w-sm mx-auto">
                Once the initial catalog review is marked complete, your
                platform administrator will upload the signed contract agreement
                here for your records.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information Section */}
      {(latestPayment ||
        whiteLabel.status === WhiteLabelStatus.PAID ||
        isLive) && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                Recorded Payment & Subscription Status
              </CardTitle>
              <CardDescription className="text-xs">
                Offline, wire, or hand-to-hand payment registered and verified
                by platform administrators.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {latestPayment ? (
              <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      ${latestPayment.amount.toLocaleString()} USD
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                    >
                      {latestPayment.status}
                    </Badge>
                    {latestPayment.code && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        #{latestPayment.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span suppressHydrationWarning>
                      Valid: {formatDate(latestPayment.startsAt)} –{" "}
                      {formatDate(latestPayment.endsAt)}
                    </span>
                  </p>
                </div>

                <div className="text-xs text-muted-foreground font-mono bg-background/80 px-3 py-1.5 rounded-lg border border-border/50">
                  Payment Confirmed by Admin
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border bg-muted/20 text-xs text-muted-foreground">
                Payment verified. Subscription active.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suspension Alert Banner */}
      {whiteLabel.status === WhiteLabelStatus.SUSPENDED && (
        <div className="p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-3 shadow-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Account Temporarily Suspended</h4>
            <p className="text-xs text-muted-foreground">
              {whiteLabel.statusReason ||
                "Your WhiteLabel account has been suspended by platform administrators. Please contact RMIT support to resolve."}
            </p>
          </div>
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Corporate Info */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Corporate & Contact Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
              <span className="text-muted-foreground text-[11px] block">
                Primary Executive Representative
              </span>
              <p className="font-semibold text-foreground text-sm">
                {whiteLabel.contactFirstName} {whiteLabel.contactLastName}
              </p>
              <a
                href={`mailto:${whiteLabel.contactEmail}`}
                className="text-muted-foreground hover:text-primary font-mono inline-flex items-center gap-1"
              >
                <Mail className="h-3 w-3 text-primary" />
                {whiteLabel.contactEmail}
              </a>
              {whiteLabel.contactLinkedIn && (
                <div className="pt-0.5">
                  <a
                    href={
                      whiteLabel.contactLinkedIn.startsWith("http")
                        ? whiteLabel.contactLinkedIn
                        : `https://${whiteLabel.contactLinkedIn}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full font-mono"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{whiteLabel.contactLinkedIn}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">
                  Incorporated Entity
                </span>
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="font-bold text-foreground">
                    {whiteLabel.isIncorporated ? "Yes (Registered)" : "No (Independent)"}
                  </span>
                  {whiteLabel.incorporationDocUrl && (
                    <a
                      href={
                        whiteLabel.incorporationDocUrl.startsWith("http")
                          ? whiteLabel.incorporationDocUrl
                          : `https://${whiteLabel.incorporationDocUrl}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 font-semibold"
                    >
                      Filing <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">
                  Years in Business
                </span>
                <span className="font-bold text-foreground block pt-0.5">
                  {whiteLabel.yearsInBusiness}{" "}
                  {whiteLabel.yearsInBusiness === 1 ? "year" : "years"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">
                  Reserved Subdomain
                </span>
                <span className="font-bold text-foreground font-mono text-[10.5px] truncate block pt-0.5">
                  {whiteLabel.subdomain
                    ? `${whiteLabel.subdomain}.platform.royalmotionit.com`
                    : "Pending Allocation"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">
                  Creator Access Model
                </span>
                <span className="font-bold text-foreground capitalize block pt-0.5">
                  {(whiteLabel.userSignupModel || "INVITE_ONLY")
                    .replace(/_/g, " ")
                    .toLowerCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catalog & Distribution Telemetry */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              Catalog Telemetry & Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">
                  Master Catalog
                </span>
                <span className="font-bold text-sm text-foreground">
                  {Number(whiteLabel.catalogTrackCount || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  tracks
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">
                  Monthly Volume
                </span>
                <span className="font-bold text-sm text-foreground">
                  {Number(whiteLabel.monthlyTrackDelivery || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  tracks / mo
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground text-[10px] block">
                  Est. Revenue
                </span>
                <span className="font-bold text-sm text-foreground">
                  ${Number(whiteLabel.monthlyRevenueUsd || 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  USD / mo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10.5px]">
              <div className="p-2 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">Direct Deals</span>
                <span className="font-bold text-foreground">
                  {whiteLabel.hasDirectDeals ? "Yes (Direct)" : "Via Aggregator"}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">Migration</span>
                <span className="font-bold text-foreground">
                  {whiteLabel.wantsCatalogMigration ? "Requested" : "New Ingestion"}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-border/50 bg-muted/20">
                <span className="text-muted-foreground block">Language</span>
                <span className="font-bold text-foreground">
                  {whiteLabel.primaryCatalogLanguage || "English"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] block font-medium">
                  Current / Past Distributors:
                </span>
                <div className="flex flex-wrap gap-1">
                  {whiteLabel.currentDistributors &&
                  whiteLabel.currentDistributors.length > 0 ? (
                    whiteLabel.currentDistributors.map((d) => (
                      <Badge
                        key={d}
                        variant="secondary"
                        className="text-[10px] py-0 px-2 font-normal"
                      >
                        {d}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Direct / None Specified
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px] block font-medium">
                  Royalty Accounting Systems:
                </span>
                <div className="flex flex-wrap gap-1">
                  {whiteLabel.royaltySolutions &&
                  whiteLabel.royaltySolutions.length > 0 ? (
                    whiteLabel.royaltySolutions.map((r) => (
                      <Badge
                        key={r}
                        variant="outline"
                        className="text-[10px] py-0 px-2 font-normal border-primary/30 text-primary bg-primary/5"
                      >
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Platform Native Ledger
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tailored Business Architecture & Domain Specifications */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Tailored Domain Architecture & Verification Dossier
              </CardTitle>
              <CardDescription className="text-xs">
                Industry-standard parameters submitted for enterprise verification and automated infrastructure provisioning.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary font-mono text-[11px] font-bold"
            >
              {whiteLabel.businessType.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 text-xs space-y-4">
          {whiteLabel.businessType === "RECORD_LABEL" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Label Category
                </span>
                <p className="font-bold text-foreground capitalize text-sm pt-0.5">
                  {(
                    whiteLabel.onboardingDetails?.labelType || "independent"
                  ).replace(/_/g, " ")}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Primary Genre
                </span>
                <p className="font-bold text-foreground text-sm pt-0.5">
                  {whiteLabel.onboardingDetails?.primaryGenre ||
                    "Multi-Genre / All Genres"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Artist Royalty Split
                </span>
                <p className="font-bold text-foreground text-xs pt-0.5">
                  {whiteLabel.onboardingDetails?.masterRoyaltySplitStandard ||
                    "70/30 (Artist 70% / Label 30%)"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  ISRC Registrant Prefix
                </span>
                <p className="font-bold text-foreground font-mono text-sm pt-0.5">
                  {whiteLabel.onboardingDetails?.isrcRegistrantCode ||
                    whiteLabel.onboardingDetails?.isrcPrefix ||
                    "Platform Delegated"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Spatial Audio / Atmos
                </span>
                <p className="font-bold text-foreground text-xs pt-0.5">
                  {whiteLabel.onboardingDetails?.dolbyAtmosReady !== false
                    ? "ADM BWF WAV Enabled"
                    : "Standard Stereo WAV"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Hosted Server Routing
                </span>
                <p className="font-bold text-foreground font-mono text-xs pt-0.5">
                  {whiteLabel.elasticIpv4
                    ? `Elastic IP (${whiteLabel.elasticIpv4})`
                    : "Cloudflare Managed Proxy"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Launch Timeline
                </span>
                <p className="font-bold text-foreground text-xs pt-0.5">
                  {whiteLabel.onboardingDetails?.estimatedLaunchTimeline ||
                    "Immediate"}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                  Brand Accent Theme
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                    style={{
                      backgroundColor: whiteLabel.primaryColor || "#6366f1",
                    }}
                  />
                  <span className="font-bold text-foreground font-mono text-xs uppercase">
                    {whiteLabel.primaryColor || "#6366f1"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Managed Sub-Labels
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {whiteLabel.onboardingDetails?.subLabelsCount ?? 5} sub-labels
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Independent Creators
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {whiteLabel.onboardingDetails
                      ?.independentArtistsRepresented ?? 40}{" "}
                    artists
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Ingestion Protocol
                  </span>
                  <p className="font-bold text-foreground font-mono text-xs pt-0.5">
                    {(
                      whiteLabel.onboardingDetails?.ingestionProtocol ||
                      whiteLabel.onboardingDetails?.ingestionStandard ||
                      "DDEX_ERN_4_3"
                    ).replace(/_/g, " ")}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    QC & Anti-Fraud
                  </span>
                  <p className="font-bold text-foreground text-xs pt-0.5">
                    {whiteLabel.onboardingDetails
                      ?.antiFraudInspectionRequired !== false
                      ? "Fingerprinting + QC Active"
                      : "Standard Verification"}
                  </p>
                </div>
              </div>

              {whiteLabel.onboardingDetails?.directDspAgreements &&
                whiteLabel.onboardingDetails.directDspAgreements.length > 0 && (
                  <div className="p-3 rounded-xl border border-border/50 bg-muted/10 space-y-1.5">
                    <span className="text-muted-foreground text-[11px] font-semibold block">
                      Active Direct DSP Delivery Pipelines:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {whiteLabel.onboardingDetails.directDspAgreements.map(
                        (feed: string) => (
                          <Badge
                            key={feed}
                            variant="outline"
                            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5"
                          >
                            {feed}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {whiteLabel.businessType === "MUSIC_PUBLISHER" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Musical Works Catalog
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {(
                      whiteLabel.onboardingDetails?.musicalWorksCount ?? 150
                    ).toLocaleString()}{" "}
                    works
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Songwriters Represented
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {whiteLabel.onboardingDetails
                      ?.songwritersRepresentedCount ?? 12}{" "}
                    writers
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Primary PRO / CMO
                  </span>
                  <p className="font-bold text-foreground text-xs pt-0.5">
                    {whiteLabel.onboardingDetails?.primaryProAffiliation ||
                      "ASCAP (United States)"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Publisher IPI / CAE
                  </span>
                  <p className="font-bold text-foreground font-mono text-sm pt-0.5">
                    {whiteLabel.onboardingDetails?.ipiCaeNumber ||
                      whiteLabel.onboardingDetails?.caeIpiNumber ||
                      "Pending Registration"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    CWR Exchange Feed
                  </span>
                  <p className="font-bold text-foreground text-xs pt-0.5">
                    {whiteLabel.onboardingDetails?.cwrExchangeEnabled !== false
                      ? "Enabled (CWR v2.1)"
                      : "Standard Ingestion"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Mechanical Royalties
                  </span>
                  <p className="font-bold text-foreground text-xs pt-0.5">
                    {whiteLabel.onboardingDetails?.collectsMechanicals !== false
                      ? "MLC / HFA / MCPS Active"
                      : "Self-Administered"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20 col-span-2">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Sync Licensing Catalog Vault
                  </span>
                  <p className="font-bold text-foreground text-xs pt-0.5">
                    {(whiteLabel.onboardingDetails?.syncLicensingCatalogSize ??
                      50) > 0
                      ? `Active Pitch Vault (${whiteLabel.onboardingDetails?.syncLicensingCatalogSize ?? 50} cleared works)`
                      : "Standard Administration Only"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {whiteLabel.businessType === "REFERRER" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Scout Category
                  </span>
                  <p className="font-bold text-foreground capitalize text-xs pt-0.5">
                    {(
                      whiteLabel.onboardingDetails?.scoutNetworkCategory ||
                      "talent_scout"
                    ).replace(/_/g, " ")}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Annual Referrals Target
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {whiteLabel.onboardingDetails?.projectedAnnualReferrals ??
                      10}{" "}
                    partners / yr
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Pipeline Aggregate Size
                  </span>
                  <p className="font-bold text-foreground text-sm pt-0.5">
                    {(
                      whiteLabel.onboardingDetails
                        ?.projectedPipelineCatalogSize ??
                      whiteLabel.onboardingDetails?.scoutingPipelineSize ??
                      500
                    ).toLocaleString()}{" "}
                    tracks
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <span className="text-muted-foreground text-[10px] block uppercase tracking-wider font-semibold">
                    Commission Structure
                  </span>
                  <p className="font-bold text-foreground capitalize text-xs pt-0.5">
                    {(
                      whiteLabel.onboardingDetails
                        ?.preferredCommissionStructure || "lifetime_rev_share"
                    ).replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              {whiteLabel.onboardingDetails?.discoveryChannels &&
                whiteLabel.onboardingDetails.discoveryChannels.length > 0 && (
                  <div className="p-3 rounded-xl border border-border/50 bg-muted/10 space-y-1.5">
                    <span className="text-muted-foreground text-[11px] font-semibold block">
                      Primary Talent Discovery Channels:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {whiteLabel.onboardingDetails.discoveryChannels.map(
                        (ch: string) => (
                          <Badge
                            key={ch}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {ch}
                          </Badge>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submitted Portfolio / Roster Entities */}
      {whiteLabel.artists && whiteLabel.artists.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR" ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : whiteLabel.businessType === "MUSIC_PUBLISHER" ? (
                  <Disc3 className="h-4 w-4 text-primary" />
                ) : whiteLabel.businessType === "REFERRER" ? (
                  <Share2 className="h-4 w-4 text-primary" />
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
                {whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                  ? "Submitted Sub-Labels & Ingestion Catalogs"
                  : whiteLabel.businessType === "MUSIC_PUBLISHER"
                    ? "Represented Songwriters & Catalog Works"
                    : whiteLabel.businessType === "REFERRER"
                      ? "Client & Talent Pipeline Prospects"
                      : "Verified Roster Artists"}
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {whiteLabel.artists.length}{" "}
                {whiteLabel.artists.length === 1 ? "Entity" : "Entities"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Portfolio submitted during application for background vetting and
              rights clearance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {whiteLabel.artists.map((item, idx) => {
                const igLabel =
                  whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                    ? "Territory:"
                    : whiteLabel.businessType === "MUSIC_PUBLISHER"
                      ? "PRO Affiliation:"
                      : whiteLabel.businessType === "REFERRER"
                        ? "Status:"
                        : "Instagram:";
                const spotifyLabel =
                  whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                    ? "Sub-Label Website / Catalog"
                    : whiteLabel.businessType === "MUSIC_PUBLISHER"
                      ? "Top Composition / ISWC"
                      : whiteLabel.businessType === "REFERRER"
                        ? "Portfolio / Music Link"
                        : "Spotify Artist Profile";
                const youtubeLabel =
                  whiteLabel.businessType === "DISTRIBUTOR_AGGREGATOR"
                    ? "Genre Focus:"
                    : whiteLabel.businessType === "MUSIC_PUBLISHER"
                      ? "Ownership Split:"
                      : whiteLabel.businessType === "REFERRER"
                        ? "Category:"
                        : "YouTube Channel";

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground truncate">
                        {item.artistName}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[9px] px-1.5 py-0"
                      >
                        #{idx + 1}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 text-muted-foreground text-[11px]">
                      {item.monthlyListeners ? (
                        <div className="flex items-center justify-between">
                          <span>Monthly Listeners:</span>
                          <span className="font-bold text-foreground">
                            {item.monthlyListeners.toLocaleString()}
                          </span>
                        </div>
                      ) : null}
                      {item.instagramHandle && (
                        <div className="flex items-center justify-between gap-2 truncate">
                          <span>{igLabel}</span>
                          {whiteLabel.businessType === "RECORD_LABEL" ? (
                            <a
                              href={`https://instagram.com/${item.instagramHandle.replace(/^@/, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-foreground hover:text-primary hover:underline truncate"
                            >
                              {item.instagramHandle.startsWith("@")
                                ? item.instagramHandle
                                : `@${item.instagramHandle}`}
                            </a>
                          ) : (
                            <span className="font-mono text-foreground truncate">
                              {item.instagramHandle}
                            </span>
                          )}
                        </div>
                      )}
                      {item.spotifyProfileUrl && (
                        <div className="pt-0.5">
                          {whiteLabel.businessType === "MUSIC_PUBLISHER" &&
                          !item.spotifyProfileUrl.startsWith("http") ? (
                            <div className="flex items-center justify-between gap-2 truncate">
                              <span>Work / ISWC:</span>
                              <span className="font-mono text-foreground truncate">
                                {item.spotifyProfileUrl}
                              </span>
                            </div>
                          ) : (
                            <a
                              href={
                                item.spotifyProfileUrl.startsWith("http")
                                  ? item.spotifyProfileUrl
                                  : `https://${item.spotifyProfileUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 font-mono text-[10.5px] truncate"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="truncate">{spotifyLabel}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {item.youtubeChannelUrl && (
                        <div className="pt-0.5">
                          {whiteLabel.businessType === "RECORD_LABEL" ||
                          item.youtubeChannelUrl.startsWith("http") ? (
                            <a
                              href={
                                item.youtubeChannelUrl.startsWith("http")
                                  ? item.youtubeChannelUrl
                                  : `https://${item.youtubeChannelUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-500 hover:underline flex items-center gap-1 font-mono text-[10.5px] truncate"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="truncate">{youtubeLabel}</span>
                            </a>
                          ) : (
                            <div className="flex items-center justify-between gap-2 truncate">
                              <span>{youtubeLabel}</span>
                              <span className="font-mono text-foreground truncate">
                                {item.youtubeChannelUrl}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dedicated Onboarding Partner Desk & Verification Vault */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dedicated Support Partner Desk */}
        <Card className="border-border/60 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary" />
                Dedicated Onboarding Partner Desk
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary bg-primary/5"
              >
                SLA: &lt; 24h Turnaround
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Direct access to our senior enterprise onboarding desk for
              expedited review or technical queries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[11px]">
                  Assigned Partner Specialist
                </span>
                <span className="font-semibold text-foreground text-xs">
                  RoyalMotionIT Enterprise Desk
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground text-[11px]">
                  VIP Support Email
                </span>
                <a
                  href="mailto:support@royalmotionit.com"
                  className="font-mono text-primary hover:underline text-xs"
                >
                  support@royalmotionit.com
                </a>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground text-[11px]">
                  Emergency Ingestion Hotline
                </span>
                <a
                  href="tel:+8801858892007"
                  className="font-mono text-xs text-foreground hover:text-primary hover:underline"
                >
                  +880 18 588 92007
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 gap-1.5"
                onClick={() => {
                  window.location.href = `mailto:support@royalmotionit.com?subject=Inquiry for WhiteLabel Application [${whiteLabel.code}] - ${whiteLabel.name}`;
                }}
              >
                <Mail className="h-3.5 w-3.5" />
                Contact Onboarding Officer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 gap-1.5"
                onClick={() => {
                  window.location.href = "tel:+8801858892007";
                }}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Call +880 18 588 92007
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supplementary Documents Vault */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Verification Vault & Documents
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="h-7 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
              >
                <Upload className="h-3 w-3" />
                Upload Document
              </Button>
            </div>
            <CardDescription className="text-xs">
              Upload company registration, tax certificates, catalog CSVs, or
              master distribution agreements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {whiteLabel.documents && whiteLabel.documents.length > 0 ? (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {whiteLabel.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-foreground text-xs truncate">
                            {doc.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 font-mono capitalize border-primary/30 text-primary bg-primary/5"
                          >
                            {doc.type.replace(/_/g, " ").toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
                          {doc.fileSizeBytes
                            ? `${(doc.fileSizeBytes / 1024).toFixed(1)} KB`
                            : ""}
                          {doc.createdAt && ` • ${formatDate(doc.createdAt)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewDocument(doc)}
                        disabled={previewingDocId === doc.id}
                        className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        title="Preview Document"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {previewingDocId === doc.id ? "Opening..." : "Preview"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={isDeletingDocId === doc.id}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Remove Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center border border-dashed rounded-xl space-y-1.5 text-muted-foreground">
                <File className="h-6 w-6 mx-auto opacity-40 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">
                  No Additional Documents Uploaded
                </p>
                <p className="text-[11px]">
                  Need to send corporate validation documents? Click
                  &quot;Upload Document&quot; above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Document Upload Dialog Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[480px] z-[60]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Upload className="h-4 w-4 text-primary" />
              Upload Verification Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload requested business certificates, incorporation papers,
              distribution agreements, or catalog rights documents for
              administrative review.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleUploadDocumentSubmit}
            className="space-y-4 py-2 text-xs"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Select File <span className="text-destructive">*</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.zip,.docx,.doc"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setDocFile(f);
                    if (!docTitle.trim()) {
                      setDocTitle(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }
                }}
                className="h-9 text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Accepted formats: PDF, PNG, JPG, DOCX, ZIP (Max 25MB)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document Title / Name
              </Label>
              <Input
                placeholder="e.g. Master Distribution Contract - FUGA"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Document Type / Category
              </Label>
              <Select
                value={docType}
                onValueChange={(val) => {
                  if (val) setDocType(val);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select document type">
                    {(val) =>
                      DOCUMENT_CATEGORY_LABELS[val as string] ||
                      val ||
                      "Select document type"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="INCORPORATION_DOC">
                    Company Incorporation / Business Certificate
                  </SelectItem>
                  <SelectItem value="DISTRIBUTION_CONTRACT">
                    Distribution Agreement / Contract
                  </SelectItem>
                  <SelectItem value="CATALOG_RIGHTS">
                    Catalog Ownership / Rights Clearance Proof
                  </SelectItem>
                  <SelectItem value="IDENTITY_PROOF">
                    Government ID / Passport of Contact Person
                  </SelectItem>
                  <SelectItem value="TAX_DOCUMENT">
                    Tax Form (W-8 / W-9 / Tax ID Certificate)
                  </SelectItem>
                  <SelectItem value="SUPPLEMENTARY_DOCUMENT">
                    Other Supplementary Verification Document
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploadingDoc}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUploadingDoc || !docFile}
                className="text-xs font-bold bg-primary text-primary-foreground gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                {isUploadingDoc ? "Uploading to Storage..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
