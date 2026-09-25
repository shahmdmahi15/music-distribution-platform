"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FolderLock,
  Save,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  Clock,
  ShieldAlert,
  Cloud,
  Database,
  Server,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WhiteLabelSsoConfig,
  WhiteLabelBranding,
  WhiteLabelSignupModel,
} from "@/types/whitelabel";
import {
  clientUpdateSsoAction,
  clientTestCredentialsAction,
} from "@/actions/client/whitelabel/client-sso.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientSsoViewProps {
  initialSso: WhiteLabelSsoConfig;
  branding: WhiteLabelBranding;
}

// 3 simple registration types strictly mapping WhiteLabelSignupModel
const SIGNUP_MODELS = [
  {
    id: WhiteLabelSignupModel.INVITE_ONLY,
    title: "Invite Only (Recommended)",
    description:
      "Only artists, producers, and managers explicitly invited by your team can register accounts.",
    badge: "Most Secure",
  },
  {
    id: WhiteLabelSignupModel.ADMIN_APPROVAL,
    title: "Admin Approval",
    description:
      "Creators can submit registration forms, but accounts remain pending until approved by staff in the console.",
    badge: "Curated Review",
  },
  {
    id: WhiteLabelSignupModel.OPEN_REGISTRATION,
    title: "Open Registration",
    description:
      "Anyone can visit your portal domain and create a creator account immediately.",
    badge: "Public Access",
  },
];

const AWS_REGIONS = [
  { id: "ap-southeast-1", label: "Asia Pacific (Singapore) ap-southeast-1" },
  { id: "ap-south-1", label: "Asia Pacific (Mumbai) ap-south-1" },
  { id: "us-east-1", label: "US East (N. Virginia) us-east-1" },
  { id: "us-west-2", label: "US West (Oregon) us-west-2" },
  { id: "eu-central-1", label: "Europe (Frankfurt) eu-central-1" },
  { id: "eu-west-1", label: "Europe (Ireland) eu-west-1" },
];

export function ClientSsoView({ initialSso, branding }: ClientSsoViewProps) {
  const [sso, setSso] = useState<WhiteLabelSsoConfig>(initialSso);

  // Local secret input states (empty initially, only submitted if user types new values)
  const [googleSecret, setGoogleSecret] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [redisUrl, setRedisUrl] = useState("");
  const [cloudflareToken, setCloudflareToken] = useState("");

  // Show/Hide password toggles
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showGithubSecret, setShowGithubSecret] = useState(false);
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [showDatabaseUrl, setShowDatabaseUrl] = useState(false);
  const [showRedisUrl, setShowRedisUrl] = useState(false);
  const [showCloudflareToken, setShowCloudflareToken] = useState(false);

  // Actions & status
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string } | null>
  >({});

  const portalHost =
    branding.customDomain ||
    `${branding.subdomain || "brand"}.platform.royalmotionit.com`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await clientUpdateSsoAction({
        userSignupModel: sso.userSignupModel,
        googleEnabled: sso.googleEnabled,
        googleClientId: sso.googleClientId,
        googleClientSecret: googleSecret || undefined,
        githubEnabled: sso.githubEnabled,
        githubClientId: sso.githubClientId,
        githubClientSecret: githubSecret || undefined,
        enforce2fa: sso.enforce2fa,
        sessionTimeoutHours: sso.sessionTimeoutHours,

        // Infrastructure credentials
        awsRegion: sso.awsRegion || "",
        awsAccessKeyId: sso.awsAccessKeyId || "",
        awsSecretAccessKey: awsSecretKey || undefined,
        bucketName: sso.bucketName || "",
        senderEmail: sso.senderEmail || "",
        databaseUrl: databaseUrl || undefined,
        redisUrl: redisUrl || undefined,
        cloudflareApiToken: cloudflareToken || undefined,
        cloudflareZoneId: sso.cloudflareZoneId || "",
        cloudflareBaseDomain: sso.cloudflareBaseDomain || "",
      });

      if (res.success) {
        toast.success(res.message);
        if (res.sso) setSso(res.sso);
        setGoogleSecret("");
        setGithubSecret("");
        setAwsSecretKey("");
        setDatabaseUrl("");
        setRedisUrl("");
        setCloudflareToken("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update credentials & SSO configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestService = async (
    type: "aws_s3" | "aws_ses" | "database" | "redis" | "cloudflare",
  ) => {
    setTestingService(type);
    try {
      const res = await clientTestCredentialsAction(type);
      setTestResults((prev) => ({ ...prev, [type]: res }));
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(`Verification test failed for ${type}.`);
      setTestResults((prev) => ({
        ...prev,
        [type]: {
          success: false,
          message: "Network error occurred while contacting verification backend.",
        },
      }));
    } finally {
      setTestingService(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/70 bg-card shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>SSO &amp; Infrastructure Credentials</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  Multi-Tenant
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage dedicated cloud storage, data backends, Cloudflare edge routing, and SSO authentication for {branding.name}.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9 px-4 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save All Changes"}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. AWS Cloud Storage & Transactional Email (S3 & SES)                     */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    AWS Cloud Storage &amp; Email Delivery (S3 &amp; SES)
                    {sso.bucketName && sso.hasAwsSecretAccessKey ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Dedicated AWS Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Platform Fallback Mode
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your dedicated Amazon Web Services S3 bucket for audio/cover art assets and SES for transactional email.
                  </CardDescription>
                </div>
              </div>

              {/* AWS Test Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingService === "aws_s3"}
                  onClick={() => handleTestService("aws_s3")}
                  className="h-8 text-xs gap-1.5"
                >
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{testingService === "aws_s3" ? "Checking S3..." : "Test S3 Bucket"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingService === "aws_ses"}
                  onClick={() => handleTestService("aws_ses")}
                  className="h-8 text-xs gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{testingService === "aws_ses" ? "Checking SES..." : "Test Sender Email"}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Inline Test Result alerts if any */}
            {testResults.aws_s3 && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResults.aws_s3.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {testResults.aws_s3.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResults.aws_s3.message}</span>
              </div>
            )}
            {testResults.aws_ses && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResults.aws_ses.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {testResults.aws_ses.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResults.aws_ses.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AWS Region */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">AWS Region</Label>
                  <span className="text-[11px] text-muted-foreground">e.g. ap-southeast-1</span>
                </div>
                <Input
                  value={sso.awsRegion || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, awsRegion: e.target.value }))
                  }
                  placeholder="ap-southeast-1"
                  className="text-xs font-mono"
                />
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {AWS_REGIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSso((prev) => ({ ...prev, awsRegion: r.id }))}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        sso.awsRegion === r.id
                          ? "bg-primary text-primary-foreground border-primary font-bold"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {r.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* S3 Bucket Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">S3 Bucket Name</Label>
                  <span className="text-[11px] text-muted-foreground">Unique bucket name</span>
                </div>
                <Input
                  value={sso.bucketName || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, bucketName: e.target.value }))
                  }
                  placeholder="mylabel-media-bucket"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Stores original WAV/FLAC audio masters and hi-res artwork packages.
                </p>
              </div>

              {/* AWS Access Key ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">AWS Access Key ID</Label>
                  <span className="text-[11px] text-muted-foreground">IAM User or Role</span>
                </div>
                <Input
                  value={sso.awsAccessKeyId || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, awsAccessKeyId: e.target.value }))
                  }
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="text-xs font-mono"
                />
              </div>

              {/* AWS Secret Access Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">AWS Secret Access Key</Label>
                  {sso.hasAwsSecretAccessKey && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      Encrypted in Vault
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showAwsSecret ? "text" : "password"}
                    value={awsSecretKey}
                    onChange={(e) => setAwsSecretKey(e.target.value)}
                    placeholder={
                      sso.awsSecretAccessKeyMasked || "Enter AWS secret access key..."
                    }
                    className="text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAwsSecret(!showAwsSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAwsSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to retain currently encrypted key. Entering a new value replaces it.
                </p>
              </div>

              {/* Sender Email (SES) */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Transactional Sender Email</Label>
                  <span className="text-[11px] text-muted-foreground">AWS SES Verified Identity</span>
                </div>
                <Input
                  type="email"
                  value={sso.senderEmail || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, senderEmail: e.target.value }))
                  }
                  placeholder="releases@yourbrand.com"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Outbound sender address for onboarding invites, payout receipts, and automated distribution alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 2. Dedicated Data Backends (PostgreSQL & Redis)                           */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Dedicated Data Stores (PostgreSQL &amp; Redis)
                    {sso.hasDatabaseUrl ? (
                      <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
                        Dedicated DB Isolated
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Shared Platform DB
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Enterprise tenants can connect dedicated PostgreSQL databases and Redis clusters for private catalog storage and session isolation.
                  </CardDescription>
                </div>
              </div>

              {/* Data Store Test Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingService === "database"}
                  onClick={() => handleTestService("database")}
                  className="h-8 text-xs gap-1.5"
                >
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{testingService === "database" ? "Verifying DB..." : "Test Database"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingService === "redis"}
                  onClick={() => handleTestService("redis")}
                  className="h-8 text-xs gap-1.5"
                >
                  <Server className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{testingService === "redis" ? "Verifying Redis..." : "Test Redis"}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Inline Test Result alerts */}
            {testResults.database && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResults.database.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {testResults.database.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResults.database.message}</span>
              </div>
            )}
            {testResults.redis && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResults.redis.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {testResults.redis.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResults.redis.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {/* Dedicated Database URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Dedicated Database URL (PostgreSQL)</Label>
                  {sso.hasDatabaseUrl && (
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30">
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showDatabaseUrl ? "text" : "password"}
                    value={databaseUrl}
                    onChange={(e) => setDatabaseUrl(e.target.value)}
                    placeholder={
                      sso.databaseUrlMasked ||
                      "postgresql://user:password@host:5432/whitelabel_db?sslmode=require"
                    }
                    className="text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDatabaseUrl(!showDatabaseUrl)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showDatabaseUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  PostgreSQL URI for tenant catalog, track releases, user accounts, and financial ledgers.
                </p>
              </div>

              {/* Dedicated Redis URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Dedicated Redis URL (Cache &amp; Sessions)</Label>
                  {sso.hasRedisUrl && (
                    <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/30">
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showRedisUrl ? "text" : "password"}
                    value={redisUrl}
                    onChange={(e) => setRedisUrl(e.target.value)}
                    placeholder={
                      sso.redisUrlMasked ||
                      "rediss://default:password@host:6379"
                    }
                    className="text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRedisUrl(!showRedisUrl)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showRedisUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Redis URI for lightning-fast user session storage, token revoking, and real-time telemetry caching.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 3. Edge Routing & DNS (Cloudflare API)                                    */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Edge DNS &amp; Routing Automation (Cloudflare)
                    {sso.hasCloudflareApiToken && sso.cloudflareZoneId ? (
                      <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px]">
                        Cloudflare Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Optional
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automate SSL cert provisioning, edge routing, and CNAME record propagation via your Cloudflare account.
                  </CardDescription>
                </div>
              </div>

              {/* Cloudflare Test Button */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={testingService === "cloudflare"}
                  onClick={() => handleTestService("cloudflare")}
                  className="h-8 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${testingService === "cloudflare" ? "animate-spin" : ""}`} />
                  <span>{testingService === "cloudflare" ? "Verifying..." : "Verify Cloudflare Zone"}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {testResults.cloudflare && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResults.cloudflare.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {testResults.cloudflare.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{testResults.cloudflare.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cloudflare API Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cloudflare API Token</Label>
                  {sso.hasCloudflareApiToken && (
                    <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-500 border-orange-500/30">
                      Token Stored
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showCloudflareToken ? "text" : "password"}
                    value={cloudflareToken}
                    onChange={(e) => setCloudflareToken(e.target.value)}
                    placeholder={
                      sso.cloudflareApiTokenMasked || "cfut_xxxxxxxxxxxxxxxx"
                    }
                    className="text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCloudflareToken(!showCloudflareToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCloudflareToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Requires Zone:DNS:Edit permissions.</p>
              </div>

              {/* Cloudflare Zone ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cloudflare Zone ID</Label>
                  <span className="text-[11px] text-muted-foreground">32-char hex</span>
                </div>
                <Input
                  value={sso.cloudflareZoneId || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, cloudflareZoneId: e.target.value }))
                  }
                  placeholder="3b5ae0f533b73c5fcfca616d74ae7aca"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Found on your Cloudflare Domain Overview page.</p>
              </div>

              {/* Cloudflare Base Domain */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Cloudflare Base Domain</Label>
                  <span className="text-[11px] text-muted-foreground">e.g. mylabel.com</span>
                </div>
                <Input
                  value={sso.cloudflareBaseDomain || ""}
                  onChange={(e) =>
                    setSso((prev) => ({ ...prev, cloudflareBaseDomain: e.target.value }))
                  }
                  placeholder="mylabel.com"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">Target apex zone for subdomains &amp; DNS routing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 4. User Onboarding & Registration Model                                   */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                User Onboarding &amp; Registration Model
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select how new artists, producers, and label managers access your WhiteLabel portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {SIGNUP_MODELS.map((model) => {
                const isSelected = sso.userSignupModel === model.id;
                return (
                  <button
                    type="button"
                    key={model.id}
                    onClick={() =>
                      setSso((prev) => ({ ...prev, userSignupModel: model.id }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="text-[10px] uppercase font-bold px-2 py-0.5"
                        >
                          {model.badge}
                        </Badge>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="text-xs font-bold text-foreground mt-2">
                        {model.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {model.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 5. OAuth SSO Providers (Google & GitHub)                                  */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FolderLock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                OAuth Single Sign-On (SSO) Providers
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Allow creators and staff to authenticate using external Google or GitHub OAuth credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-6">
            {/* Google OAuth */}
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Google OAuth 2.0
                      </span>
                      {sso.googleEnabled ? (
                        sso.googleClientId ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]"
                          >
                            Active &amp; Configured
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]"
                          >
                            Credentials Needed
                          </Badge>
                        )
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Allow users to authenticate using their Google Workspace or personal Google accounts.
                    </div>
                  </div>
                </div>
                <Switch
                  checked={sso.googleEnabled}
                  onCheckedChange={(checked) =>
                    setSso((prev) => ({ ...prev, googleEnabled: checked }))
                  }
                />
              </div>

              {sso.googleEnabled && (
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Google Client ID</Label>
                      <Input
                        value={sso.googleClientId}
                        onChange={(e) =>
                          setSso((prev) => ({
                            ...prev,
                            googleClientId: e.target.value,
                          }))
                        }
                        placeholder="xxxx.apps.googleusercontent.com"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Google Client Secret</Label>
                      <div className="relative">
                        <Input
                          type={showGoogleSecret ? "text" : "password"}
                          value={googleSecret}
                          onChange={(e) => setGoogleSecret(e.target.value)}
                          placeholder={
                            sso.googleClientSecretMasked || "Enter new secret..."
                          }
                          className="text-xs font-mono pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Authorized Redirect URI
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/60 font-mono text-xs">
                      <span className="truncate mr-2">{`https://${portalHost}/api/auth/callback/google`}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `https://${portalHost}/api/auth/callback/google`,
                            "google-callback",
                          )
                        }
                        className="text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer"
                      >
                        {copiedKey === "google-callback" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* GitHub OAuth */}
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-500/10 text-foreground flex items-center justify-center font-bold text-xs">
                    GH
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        GitHub OAuth
                      </span>
                      {sso.githubEnabled ? (
                        sso.githubClientId ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]"
                          >
                            Active &amp; Configured
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-[10px]"
                          >
                            Credentials Needed
                          </Badge>
                        )
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Enable authentication via developer and GitHub organization credentials.
                    </div>
                  </div>
                </div>
                <Switch
                  checked={sso.githubEnabled}
                  onCheckedChange={(checked) =>
                    setSso((prev) => ({ ...prev, githubEnabled: checked }))
                  }
                />
              </div>

              {sso.githubEnabled && (
                <div className="space-y-3 pt-3 border-t border-border/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">GitHub Client ID</Label>
                      <Input
                        value={sso.githubClientId}
                        onChange={(e) =>
                          setSso((prev) => ({
                            ...prev,
                            githubClientId: e.target.value,
                          }))
                        }
                        placeholder="Iv1.xxxx"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">GitHub Client Secret</Label>
                      <div className="relative">
                        <Input
                          type={showGithubSecret ? "text" : "password"}
                          value={githubSecret}
                          onChange={(e) => setGithubSecret(e.target.value)}
                          placeholder={
                            sso.githubClientSecretMasked || "Enter new secret..."
                          }
                          className="text-xs font-mono pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGithubSecret(!showGithubSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showGithubSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Authorized Callback URL
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/60 font-mono text-xs">
                      <span className="truncate mr-2">{`https://${portalHost}/api/auth/callback/github`}</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `https://${portalHost}/api/auth/callback/github`,
                            "github-callback",
                          )
                        }
                        className="text-muted-foreground hover:text-foreground flex-shrink-0 cursor-pointer"
                      >
                        {copiedKey === "github-callback" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 6. Security Policies & Session Lifetime                                   */}
        {/* ========================================================================= */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Security &amp; Session Management Policies
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Enforce two-factor verification and session lifetime rules across your portal instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* 2FA Enforcement */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/70">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  <span>Enforce Two-Factor Authentication (2FA)</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Mandate an authenticator app (TOTP) or email verification passcode for every user login.
                </div>
              </div>
              <Switch
                checked={sso.enforce2fa}
                onCheckedChange={(checked) =>
                  setSso((prev) => ({ ...prev, enforce2fa: checked }))
                }
              />
            </div>

            {/* Session Lifetime */}
            <div className="p-4 rounded-xl bg-card border border-border/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Session Inactivity Lifetime</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Automatic logout duration after inactive device usage (between 1 and 720 hours).
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={sso.sessionTimeoutHours}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 72;
                      setSso((prev) => ({
                        ...prev,
                        sessionTimeoutHours: Math.min(720, Math.max(1, val)),
                      }));
                    }}
                    className="w-24 text-xs font-mono h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground">hours</span>
                </div>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {[24, 72, 168, 720].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() =>
                      setSso((prev) => ({ ...prev, sessionTimeoutHours: hrs }))
                    }
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      sso.sessionTimeoutHours === hrs
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {hrs === 720
                      ? "30 Days (720h)"
                      : hrs === 168
                        ? "7 Days (168h)"
                        : hrs === 72
                          ? "3 Days (72h)"
                          : "24 Hours (24h)"}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Footer Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9 px-5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving All Changes..." : "Save All Changes"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
