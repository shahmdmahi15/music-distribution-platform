"use client";

import React, { useState, useTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resendVerificationAction } from "@/actions/auth/resend-verification.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  Mail,
  MailCheck,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResendVerificationForm() {
  const tenant = useTenant();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Update email if query param changes
  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  // Handle countdown timer for rate limiting/anti-spam UX
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await resendVerificationAction(email);
      if (res.success) {
        setSubmitted(true);
        setCooldown(60);
        toast.success(res.message);
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    });
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <Card className="shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <MailCheck className="h-3 w-3" />
            <span>Account Activation</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {tenant?.code || "Portal"}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Resend Verification Email
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your registered email address to receive a fresh activation link.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-1 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Verification Link Dispatched!
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              If an account with{" "}
              <span className="font-semibold text-foreground font-mono">{email}</span>{" "}
              exists and is awaiting activation, a new link has been dispatched to your inbox.
            </p>
            <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto">
              Please check your inbox as well as your Spam/Junk folder. Activation links remain valid for 24 hours.
            </p>

            <div className="pt-3 space-y-2">
              <Button
                render={<Link href="/auth/login" />}
                className="w-full h-9 text-xs font-semibold gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isPending || cooldown > 0}
                onClick={handleSubmit}
                className="w-full h-9 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {cooldown > 0 ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                    <span>Resend available in {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                    <span>Send Another Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" className="py-2 px-3 text-xs">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@artistlabel.com"
                  className="pl-9 h-9 text-xs"
                  disabled={isPending}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                We will send an encrypted, one-click verification link to this address.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending || !email.trim() || cooldown > 0}
              className="w-full h-9 text-xs font-semibold gap-2 mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  <span>Dispatching link...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span>Wait {cooldown}s to resend</span>
                </>
              ) : (
                <>
                  <span>Send Verification Email</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-3 border-t border-border/50 flex flex-col items-center gap-2 bg-muted/20">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <Link
            href="/auth/login"
            className="hover:text-foreground font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Sign In</span>
          </Link>

          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <ResendVerificationForm />
    </Suspense>
  );
}
