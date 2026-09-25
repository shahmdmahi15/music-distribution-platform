"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Terminal,
  AlertTriangle,
  Code,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WhiteLabelApiKey, WhiteLabelBranding } from "@/types/whitelabel";
import {
  clientCreateApiKeyAction,
  clientRevokeApiKeyAction,
} from "@/actions/client/whitelabel/client-api-keys.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientApiKeysViewProps {
  initialKeys: WhiteLabelApiKey[];
  branding: WhiteLabelBranding;
}

const AVAILABLE_SCOPES = [
  {
    id: "*",
    name: "Full WhiteLabel Permission (Unrestricted)",
    description:
      "Full read & write access to catalog, artists, authentication, branding, and analytics.",
  },
];

export function ClientApiKeysView({
  initialKeys,
  branding,
}: ClientApiKeysViewProps) {
  const [keys, setKeys] = useState<WhiteLabelApiKey[]>(initialKeys);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["*"]);
  const [generating, setGenerating] = useState(false);

  // One-time key reveal dialog
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId)
        ? prev.filter((s) => s !== scopeId)
        : [...prev, scopeId],
    );
  };

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      toast.error("Please provide a name for this API key.");
      return;
    }

    setGenerating(true);
    try {
      const res = await clientCreateApiKeyAction({
        name: keyName.trim(),
        scopes: selectedScopes,
      });

      if (res.success && res.key && res.secretKey) {
        toast.success(res.message);
        setKeys((prev) => [res.key!, ...prev]);
        setGenerateOpen(false);
        setRevealedKey(res.secretKey);
        setKeyName("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to generate API key.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently revoke this API key?")) {
      return;
    }

    try {
      const res = await clientRevokeApiKeyAction(keyId);
      if (res.success) {
        toast.success(res.message);
        setKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to revoke API key.");
    }
  };

  const copySecret = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopiedKey(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WhiteLabelSubNav
        tenantName={branding.name}
        tenantCode={branding.code}
        subdomain={branding.subdomain}
        customDomain={branding.customDomain}
      />

      {/* Top Actions & Notification Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>API Keys &amp; Developer Tokens</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Securely authenticate your self-hosted WhiteLabel bundle and
            automate catalog queries via REST API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setGenerateOpen(true)}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Generate New Key</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Keys Table / Empty State */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Active API Keys
                </CardTitle>
                <CardDescription className="text-xs">
                  All keys authorized to interact with your WhiteLabel tenant
                  endpoints.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {keys.length} {keys.length === 1 ? "Key" : "Keys"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {keys.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border/70 rounded-xl">
                <KeyRound className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <div className="text-xs font-bold text-foreground">
                  No API Keys Generated
                </div>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Create an API key to allow external scripts, distribution
                  connectors, or internal microservices to query your WhiteLabel
                  catalog.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGenerateOpen(true)}
                  className="text-xs font-semibold"
                >
                  Generate First Key
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 bg-card flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {k.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-semibold"
                        >
                          {k.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                          {k.prefix}
                        </span>
                        <span
                          className="text-[11px] text-muted-foreground"
                          suppressHydrationWarning
                        >
                          Created {new Date(k.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {k.scopes.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(k.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 px-2.5"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhiteLabel Portal Connection Guide */}
        <Card className="border-primary/30 shadow-sm bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold text-foreground">
                WhiteLabel Portal Deployment Connection
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Every API key grants <strong>Full Tenant Permission</strong> to
              your WhiteLabel instance. Paste your generated key into your
              WhiteLabel frontend{" "}
              <span className="font-mono text-foreground">.env</span> file to
              automatically fetch branding, theme customizer colors, domains,
              and authentication policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-xl bg-muted/80 border border-border/80 font-mono text-xs overflow-x-auto text-foreground">
              <pre className="text-[11px] leading-relaxed">
                {`# WhiteLabel Portal (.env) - Only 3 variables needed!
API_BASE_URL="https://api.royalmotionit.com"
API_KEY="${keys[0]?.prefix ? `${keys[0].prefix}...` : "<Generate an API key above first>"}"
INTERNAL_API_SECRET="<Configure in Credentials & SSO tab>"`}
              </pre>
            </div>
            <p className="text-[11px] text-muted-foreground">
              When your WhiteLabel portal starts, it uses this API key to
              securely retrieve your complete configuration from the backend
              API.
            </p>
          </CardContent>
        </Card>

        {/* Code Example Card */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                API Authentication Quickstart
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Pass your API key in the{" "}
              <span className="font-mono text-foreground">x-api-key</span>{" "}
              header with every request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-xl bg-muted/70 border border-border/70 font-mono text-xs overflow-x-auto text-foreground">
              <code>{`curl -X GET "https://api.royalmotionit.com/whitelabel/tenant" \\
  -H "x-api-key: ${keys[0]?.prefix ? `${keys[0].prefix}...` : "<YOUR_API_KEY>"}"`}</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate API Key Modal Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Generate New API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a descriptive name and choose permission scopes for this
              credential.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Key Name / Identifier
              </Label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Catalog Sync Service"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Permission Scopes</Label>
              <div className="space-y-2">
                {AVAILABLE_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.id);
                  return (
                    <div
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleScope(scope.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {scope.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {scope.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGenerateOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs font-semibold"
            >
              {generating ? "Creating Key..." : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* One-Time Key Reveal Modal */}
      <Dialog open={!!revealedKey} onOpenChange={() => setRevealedKey(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold text-foreground">
                Save Your API Key
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Make sure to copy your API key right now. For security purposes,
              you will not be able to view this full secret key again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border font-mono text-xs">
              <span className="truncate flex-1 text-foreground font-semibold">
                {revealedKey}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copySecret}
                className="h-8 text-xs font-semibold gap-1"
              >
                {copiedKey ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => setRevealedKey(null)}
              className="text-xs font-semibold"
            >
              I Have Stored This Key Safely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
