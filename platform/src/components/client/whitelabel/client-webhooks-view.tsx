"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Webhook, Send, Save, Copy, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  WhiteLabelWebhookConfig,
  WhiteLabelWebhookLog,
  WhiteLabelBranding,
} from "@/types/whitelabel";
import {
  clientUpdateWebhooksAction,
  clientTestWebhookAction,
} from "@/actions/client/whitelabel/client-webhooks.action";
import { WhiteLabelSubNav } from "./whitelabel-subnav";

interface ClientWebhooksViewProps {
  initialConfig: WhiteLabelWebhookConfig;
  initialLogs: WhiteLabelWebhookLog[];
  branding: WhiteLabelBranding;
}

const AVAILABLE_EVENTS = [
  {
    id: "release.published",
    name: "release.published",
    description:
      "Triggered whenever a release is approved and distributed to streaming platforms.",
  },
  {
    id: "user.registered",
    name: "user.registered",
    description:
      "Triggered when an artist, producer, or team member creates an account.",
  },
  {
    id: "royalty.processed",
    name: "royalty.processed",
    description:
      "Triggered when monthly DSP earnings statements are finalized.",
  },
  {
    id: "payout.completed",
    name: "payout.completed",
    description: "Triggered when an artist payout request is settled.",
  },
];

export function ClientWebhooksView({
  initialConfig,
  initialLogs,
  branding,
}: ClientWebhooksViewProps) {
  const [config, setConfig] = useState<WhiteLabelWebhookConfig>(initialConfig);
  const [logs, setLogs] = useState<WhiteLabelWebhookLog[]>(initialLogs);
  const [urlInput, setUrlInput] = useState(initialConfig.url || "");
  const [isActive, setIsActive] = useState(initialConfig.isActive ?? true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    initialConfig.events || ["release.published", "user.registered"],
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId],
    );
  };

  const handleSave = async () => {
    if (!urlInput.trim()) {
      toast.error("Please provide a valid webhook endpoint URL.");
      return;
    }

    setSaving(true);
    try {
      const res = await clientUpdateWebhooksAction({
        url: urlInput.trim(),
        events: selectedEvents,
        isActive,
      });

      if (res.success && res.webhook) {
        toast.success(res.message);
        setConfig(res.webhook);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to save webhook settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestPing = async (eventType?: string) => {
    if (!urlInput.trim()) {
      toast.error("Save a webhook URL before triggering a test ping.");
      return;
    }

    setTesting(true);
    try {
      const res = await clientTestWebhookAction(eventType || "test.ping");
      if (res.success && res.log) {
        toast.success(res.message);
        setLogs((prev) => [res.log!, ...prev]);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to trigger webhook test.");
    } finally {
      setTesting(false);
    }
  };

  const copySecret = () => {
    if (!config.signingSecretMasked) return;
    navigator.clipboard.writeText(config.signingSecretMasked);
    setCopiedKey(true);
    toast.success("Copied secret mask");
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
            <Webhook className="h-4 w-4 text-primary" />
            <span>Webhook Event Notifications</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure HTTP POST webhooks to stream real-time platform events to
            your backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTestPing("test.ping")}
            disabled={testing || !urlInput.trim()}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Send className="h-3.5 w-3.5 text-primary" />
            <span>{testing ? "Simulating..." : "Send Test Ping"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold gap-1.5 h-9"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Endpoint Configuration Card */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Webhook Endpoint
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
            <CardDescription className="text-xs">
              Receive real-time HTTP POST notifications whenever critical events
              occur in your WhiteLabel instance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Endpoint URL</Label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://api.yourcompany.com/v1/whitelabel/webhook"
                className="text-xs font-mono"
              />
            </div>

            {config.signingSecretMasked && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Webhook Signing Secret
                </Label>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border font-mono text-xs">
                  <span>{config.signingSecretMasked}</span>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Used to verify the HMAC-SHA256 signature in the{" "}
                  <span className="font-mono text-foreground">
                    x-whitelabel-signature
                  </span>{" "}
                  header.
                </p>
              </div>
            )}

            {/* Event Subscriptions */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label className="text-xs font-medium">Subscribed Events</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVAILABLE_EVENTS.map((event) => {
                  const isChecked = selectedEvents.includes(event.id);
                  return (
                    <div
                      key={event.id}
                      onClick={() => toggleEvent(event.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <div className="text-xs font-mono font-bold text-foreground">
                          {event.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {event.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestPing("test.ping")}
                disabled={testing || !urlInput.trim()}
                className="text-xs font-semibold gap-1.5 h-9"
              >
                <Send className="h-3.5 w-3.5 text-primary" />
                <span>{testing ? "Simulating..." : "Send Test Ping"}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-semibold gap-1.5 h-9"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Logs */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Delivery Event Logs
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {logs.length} Recent {logs.length === 1 ? "Event" : "Events"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Recent dispatch attempts and HTTP response status codes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No webhook deliveries recorded yet. Click &quot;Send Test
                Ping&quot; to test your integration.
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/60">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {log.event}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            log.success
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20 font-mono text-[10px]"
                          }
                        >
                          HTTP {log.statusCode}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate max-w-md">
                        {log.responseSummary}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground whitespace-nowrap self-end sm:self-center">
                      {new Date(log.deliveredAt).toLocaleTimeString()} ·{" "}
                      {new Date(log.deliveredAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
