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
  KeyRound,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WhiteLabelSsoConfig,
  WhiteLabelBranding,
  WhiteLabelSignupModel,
} from "@/types/whitelabel";
import { clientUpdateSsoAction } from "@/actions/client/whitelabel/client-sso.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientSsoViewProps {
  initialSso: WhiteLabelSsoConfig;
  branding: WhiteLabelBranding;
}

const SIGNUP_MODELS = [
  {
    id: WhiteLabelSignupModel.INVITE_ONLY,
    title: "Invite Only (Recommended)",
    description: "Only artists and managers invited by your team can register accounts.",
    badge: "Most Secure",
  },
  {
    id: WhiteLabelSignupModel.OPEN_PUBLIC,
    title: "Open Registration",
    description: "Anyone can visit your portal and create a creator account immediately.",
    badge: "High Growth",
  },
  {
    id: WhiteLabelSignupModel.VETTED_APPLICATION,
    title: "Vetted Application",
    description: "Creators submit application demos that require review before onboarding.",
    badge: "Curated",
  },
];

export function ClientSsoView({ initialSso, branding }: ClientSsoViewProps) {
  const [sso, setSso] = useState<WhiteLabelSsoConfig>(initialSso);
  const [googleSecret, setGoogleSecret] = useState("");
  const [githubSecret, setGithubSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const portalHost = branding.customDomain || `${branding.subdomain || "brand"}.royalmotionit.com`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Callback URL copied");
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
      });

      if (res.success) {
        toast.success(res.message);
        if (res.sso) setSso(res.sso);
        setGoogleSecret("");
        setGithubSecret("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to update SSO settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <WhiteLabelSubNav
        tenantName={branding.name}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      <div className="space-y-6 max-w-5xl">
        {/* Signup Model Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">User Onboarding & Signup Model</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Determine how new artists, producers, and label partners access your WhiteLabel portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SIGNUP_MODELS.map((model) => {
                const isSelected = sso.userSignupModel === model.id;
                return (
                  <button
                    type="button"
                    key={model.id}
                    onClick={() =>
                      setSso((prev) => ({ ...prev, userSignupModel: model.id }))
                    }
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge
                        variant={isSelected ? "default" : "outline"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {model.badge}
                      </Badge>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="text-xs font-bold text-foreground mt-2">{model.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {model.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* OAuth SSO Providers */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FolderLock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">OAuth Single Sign-On (SSO)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Allow your users to log in with their external credentials via Google or GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google OAuth */}
            <div className="p-4 rounded-xl border border-border/70 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Google OAuth 2.0</div>
                    <div className="text-[11px] text-muted-foreground">
                      Let users authenticate using their Google workspace or personal accounts.
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
                          setSso((prev) => ({ ...prev, googleClientId: e.target.value }))
                        }
                        placeholder="xxxx.apps.googleusercontent.com"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Google Client Secret</Label>
                      <Input
                        type="password"
                        value={googleSecret}
                        onChange={(e) => setGoogleSecret(e.target.value)}
                        placeholder={sso.googleClientSecretMasked || "Enter new secret..."}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-muted-foreground">Authorized Redirect URI</span>
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
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
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
                  <div className="h-8 w-8 rounded-lg bg-slate-500/10 text-foreground flex items-center justify-center font-bold text-xs">
                    GH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">GitHub OAuth</div>
                    <div className="text-[11px] text-muted-foreground">
                      Enable authentication via developer and organization GitHub credentials.
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
                          setSso((prev) => ({ ...prev, githubClientId: e.target.value }))
                        }
                        placeholder="Iv1.xxxx"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">GitHub Client Secret</Label>
                      <Input
                        type="password"
                        value={githubSecret}
                        onChange={(e) => setGithubSecret(e.target.value)}
                        placeholder={sso.githubClientSecretMasked || "Enter new secret..."}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-muted-foreground">Authorized Callback URL</span>
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
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
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

        {/* Security Policies */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Security & Session Policies</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Enforce multi-factor verification and session lifetime rules for your portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/70">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">
                  Enforce Two-Factor Authentication (2FA)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Require all users to enter a one-time passcode on login.
                </div>
              </div>
              <Switch
                checked={sso.enforce2fa}
                onCheckedChange={(checked) =>
                  setSso((prev) => ({ ...prev, enforce2fa: checked }))
                }
              />
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    Session Inactivity Timeout
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Automatic logout duration after period of inactive device usage.
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {sso.sessionTimeoutHours} Hours
                </Badge>
              </div>
              <div className="flex gap-2 pt-1">
                {[24, 72, 168, 720].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setSso((prev) => ({ ...prev, sessionTimeoutHours: hrs }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      sso.sessionTimeoutHours === hrs
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {hrs === 720 ? "30 Days" : hrs === 168 ? "7 Days" : `${hrs}h`}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Policies..." : "Save Auth Settings"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
