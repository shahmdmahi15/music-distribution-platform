"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth/register.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WhiteLabelSignupModel } from "@/types/user";

export default function RegisterPage() {
  const tenant = useTenant();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isInviteOnly =
    tenant?.userSignupModel === WhiteLabelSignupModel.INVITE_ONLY ||
    tenant?.userSignupModel === "INVITE_ONLY";

  const isAdminApproval =
    tenant?.userSignupModel === WhiteLabelSignupModel.ADMIN_APPROVAL ||
    tenant?.userSignupModel === "ADMIN_APPROVAL";

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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

    if (!acceptedTerms) {
      setErrorMessage("You must accept the terms and privacy policy.");
      toast.error("Please accept the terms and conditions.");
      return;
    }

    startTransition(async () => {
      const res = await registerAction({
        firstName,
        lastName,
        email,
        password,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      setSuccess(true);
      toast.success(res.message || "Registration successful!");
    });
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <Card className="shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <Sparkles className="h-3 w-3" />
            <span>
              {isAdminApproval
                ? "Curated Review (Admin Approval)"
                : "Artist & Roster Registration"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {tenant?.code || "Portal"}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {isAdminApproval ? "Apply for an Account" : "Create an Account"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {isAdminApproval
            ? `Submit your profile to request access to ${tenant?.name || "this portal"}. Applications are reviewed before access is activated.`
            : `Join ${tenant?.name || "Music Portal"} distribution and royalty network.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {isInviteOnly ? (
          <div className="space-y-4 py-3">
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-xs font-semibold">
                Invitation Required
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                Public self-registration is disabled for{" "}
                {tenant?.name || "this portal"}. Membership is strictly managed
                by invitation. If you are a signed artist
                or distribution partner, please check your email invitation link
                or reach out to the label administrator.
              </AlertDescription>
            </Alert>

            {tenant?.supportEmail && (
              <p className="text-xs text-center text-muted-foreground">
                Inquiries:{" "}
                <a
                  href={`mailto:${tenant.supportEmail}`}
                  className="font-medium text-foreground underline underline-offset-2"
                >
                  {tenant.supportEmail}
                </a>
              </p>
            )}

            <Button
              render={<Link href="/auth/login" />}
              className="w-full h-9 text-xs font-semibold gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <span>Back to Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : success ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {isAdminApproval
                ? "Application Received!"
                : "Registration Completed!"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {isAdminApproval ? (
                <>
                  Your registration for{" "}
                  <span className="font-semibold text-foreground">
                    {email}
                  </span>{" "}
                  has been submitted for label administrator review. You will be
                  notified once your account is approved and activated.
                </>
              ) : (
                <>
                  Your portal account has been created. A verification email has
                  been dispatched to{" "}
                  <span className="font-semibold text-foreground">
                    {email}
                  </span>
                  .
                </>
              )}
            </p>
            <div className="pt-3">
              <Button
                render={<Link href="/auth/login" />}
                className="w-full h-9 text-xs font-semibold gap-1.5"
                style={{ backgroundColor: primaryColor }}
              >
                <span>Return to Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <Alert variant="destructive" className="py-2 px-3 text-xs">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="pl-8 text-xs h-8.5"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="pl-8 text-xs h-8.5"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@label.com"
                    className="pl-8 text-xs h-8.5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="pl-8 pr-8 text-xs h-8.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-8 pr-8 text-xs h-8.5"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                />
                <label
                  htmlFor="terms"
                  className="text-[11px] text-muted-foreground leading-snug cursor-pointer select-none"
                >
                  I agree to the Terms of Service, Privacy Policy, and catalog
                  delivery guidelines.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-9 text-xs font-semibold gap-1.5 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {isPending ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Portal Account</span>
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
          Already registered?{" "}
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
