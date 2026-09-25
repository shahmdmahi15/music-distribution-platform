"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyAction } from "@/actions/auth/verify.action";
import { resendVerificationAction } from "@/actions/auth/resend-verification.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
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

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const tenant = useTenant();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  const handleVerify = () => {
    if (!token) return;
    setErrorMessage(null);

    startTransition(async () => {
      const res = await verifyAction(token);
      if (res.success) {
        setVerified(true);
        toast.success(res.message);
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    });
  };

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await resendVerificationAction(resendEmail);
      if (res.success) {
        setResendSent(true);
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
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-1">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Email Verification
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {token
            ? "Confirm your email address to activate your distribution access."
            : "Request a new account verification link."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="py-2 px-3 text-xs">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {verified ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Email Verified Successfully!
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your account has been activated. You can now sign in to your
              dashboard.
            </p>
            <div className="pt-3">
              <Button
                render={<Link href="/auth/login" />}
                className="w-full h-9 text-xs font-semibold gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : token ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the button below to verify your email and complete your
              roster onboarding.
            </p>
            <Button
              type="button"
              onClick={handleVerify}
              disabled={isPending}
              className="w-full h-9 text-xs font-semibold gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  <span>Verifying email...</span>
                </>
              ) : (
                <>
                  <span>Verify Email Address</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        ) : resendSent ? (
          <div className="text-center py-5 space-y-3">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Verification Link Sent
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              If an account with{" "}
              <span className="font-semibold text-foreground">
                {resendEmail}
              </span>{" "}
              exists, we have sent a new verification link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResend} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="artist@label.com"
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs font-semibold gap-2 mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  <span>Sending link...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Resend Verification Link</span>
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-3 border-t border-border/50 flex flex-col items-center gap-2 bg-muted/20">
        <div className="text-xs text-muted-foreground">
          <Link
            href="/auth/login"
            className="font-semibold text-foreground hover:underline"
          >
            ← Back to Sign In
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
