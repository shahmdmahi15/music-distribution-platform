"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth/login.action";
import { verifyMfaAction } from "@/actions/auth/verify-mfa.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Shield,
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const tenant = useTenant();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // MFA State
  const [requireMfa, setRequireMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      if (res.requireMfa) {
        setRequireMfa(true);
        toast.info(
          "Please enter the 6-digit security code sent to your email.",
        );
        return;
      }

      toast.success(res.message || "Welcome back!");
      window.location.href = redirectUrl;
    });
  };

  const handleVerifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await verifyMfaAction({ code: mfaCode });
      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      toast.success("Two-factor authentication verified!");
      window.location.href = redirectUrl;
    });
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <Card className="shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <ShieldCheck className="h-3 w-3" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {requireMfa ? "MFA Security" : "Portal Access"}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {requireMfa
            ? "Two-Factor Verification"
            : `Sign in to ${tenant?.name || "Music Portal"}`}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {requireMfa
            ? "Enter the 6-digit authentication code sent to your email."
            : tenant?.tagline ||
              "Sign in to access your catalog dashboard and release pipelines."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="py-2 px-3 text-xs">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!requireMfa ? (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@label.com"
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div className="space-y-2 text-center">
              <Label className="text-xs font-semibold text-foreground">
                6-Digit Verification Code
              </Label>
              <div className="relative max-w-xs mx-auto">
                <KeyRound className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="123456"
                  className="pl-9 text-center font-mono text-lg tracking-[0.3em] h-11"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Security code expires in 10 minutes.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending || mfaCode.length !== 6}
              className="w-full h-9 text-xs font-semibold gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Security Code</span>
                  <Shield className="h-3.5 w-3.5" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setRequireMfa(false)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              ← Back to standard login
            </button>
          </form>
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-3 border-t border-border/50 flex flex-col items-center gap-2 bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-foreground hover:underline"
          >
            Create an account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
