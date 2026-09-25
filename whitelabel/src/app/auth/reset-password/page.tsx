"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { passwordResetAction } from "@/actions/auth/password-reset.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const tenant = useTenant();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("Missing or invalid password reset token in URL.");
      toast.error("Invalid password reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await passwordResetAction({ token, password });
      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      setSuccess(true);
      toast.success(res.message || "Password updated successfully!");
    });
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <Card className="shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <KeyRound className="h-3 w-3" />
            <span>Set New Password</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {tenant?.code || "Portal"}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Create New Password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Choose a secure, strong password for your portal account.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Password Changed Successfully!
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your password has been updated. You can now sign in with your new
              credentials.
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
        ) : (
          <>
            {!token && (
              <Alert variant="destructive" className="py-2 px-3 text-xs">
                <AlertDescription>
                  Password reset link is invalid or has expired. Please request
                  a new link.
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="py-2 px-3 text-xs">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-9 pr-9 text-xs h-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending || !token}
                className="w-full h-9 text-xs font-semibold gap-2 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {isPending ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-3 border-t border-border/50 flex flex-col items-center gap-2 bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-foreground hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
