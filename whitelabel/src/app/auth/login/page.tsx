"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAction } from "@/actions/auth/login.action";
import { verifyMfaAction } from "@/actions/auth/verify-mfa.action";
import { useTenant } from "@/components/tenant-theme-provider";
import { Music, Shield, ArrowRight, Lock, Mail, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const tenant = useTenant();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        toast.info("Please enter the 6-digit verification code sent to your email.");
        return;
      }

      toast.success("Welcome back!");
      router.push(redirectUrl);
      router.refresh();
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
      router.push(redirectUrl);
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        {/* Card Header & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-12 w-auto object-contain rounded-lg"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
              >
                <Music className="w-7 h-7" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {requireMfa ? "Two-Factor Verification" : `Sign in to ${tenant?.name || "Music Portal"}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {requireMfa
              ? "Enter the 6-digit security code sent to your email"
              : tenant?.tagline || "Enter your credentials to access your dashboard"}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <span className="font-semibold">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {!requireMfa ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@label.com"
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-semibold text-sm text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 mt-2"
                style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMfa} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                  6-Digit Security Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-3 text-center text-xl tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || mfaCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-semibold text-sm text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Sign In
                    <Shield className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRequireMfa(false)}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to standard login
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-foreground hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

