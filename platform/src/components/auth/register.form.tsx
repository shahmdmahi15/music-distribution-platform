"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { RegisterInput, registerSchema } from "@/schemas/auth/register.schema";
import { registerAction, lookupReferralCodeAction } from "@/actions/auth/register.action";
import { toast } from "sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Lock,
  Mail,
  User,
  ShieldAlert,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const urlRefCode = useMemo(() => {
    return (
      searchParams.get("ref") ||
      searchParams.get("referrer") ||
      searchParams.get("referral") ||
      ""
    ).trim().toUpperCase();
  }, [searchParams]);

  const [verifiedReferrer, setVerifiedReferrer] = useState<{
    status: "idle" | "checking" | "valid" | "invalid";
    name?: string;
    code?: string;
    message?: string;
    referrerStatus?: string;
  }>({ status: "idle" });

  const verifyCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setVerifiedReferrer({ status: "idle" });
      return;
    }
    setVerifiedReferrer((prev) => ({ ...prev, status: "checking" }));
    const res = await lookupReferralCodeAction(clean);
    if (res.success && res.valid) {
      setVerifiedReferrer({
        status: "valid",
        name: res.referrerName,
        code: res.referralCode,
        referrerStatus: res.status,
      });
    } else {
      setVerifiedReferrer({
        status: "invalid",
        message: res.message || "Partner referral code not found or inactive",
        referrerStatus: res.status,
      });
    }
  };

  // Real-time password criteria assessment
  const passwordCriteria = useMemo(() => {
    const hasMinLen = passwordValue.length >= 8;
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasSpecialOrNumber = /[\d\W]/.test(passwordValue);

    const score = [hasMinLen, hasUpper, hasLower, hasSpecialOrNumber].filter(
      Boolean,
    ).length;

    return {
      hasMinLen,
      hasUpper,
      hasLower,
      hasSpecialOrNumber,
      score,
      strengthLabel:
        score === 0
          ? ""
          : score <= 2
            ? "Weak"
            : score === 3
              ? "Good"
              : "Strong & Secure",
      strengthColor:
        score <= 2
          ? "bg-rose-500"
          : score === 3
            ? "bg-amber-500"
            : "bg-emerald-500",
      textColor:
        score <= 2
          ? "text-rose-500"
          : score === 3
            ? "text-amber-500"
            : "text-emerald-500",
    };
  }, [passwordValue]);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralCode: urlRefCode || "",
    } as RegisterInput,
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        if (value.referralCode && value.referralCode.trim()) {
          if (verifiedReferrer.status === "invalid") {
            toast.error(
              verifiedReferrer.message ||
                "The partner referral code is invalid or not active. Please clear it or enter an active code.",
            );
            return;
          }
          if (verifiedReferrer.status === "checking") {
            toast.info("Verifying partner code, please try again in a moment.");
            return;
          }
        }

        const result = await registerAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof RegisterInput;

                  formApi.setFieldMeta(fieldName, (prev) => ({
                    ...prev,
                    errorMap: {
                      ...prev.errorMap,
                      onSubmit: errorMessages.join(", "),
                    },
                  }));
                }
              },
            );
          }
          return;
        }

        toast.success(result.message);
        router.replace("/auth/login");
      } catch (error) {
        console.log("[Component.Auth.Register] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  useEffect(() => {
    if (urlRefCode) {
      form.setFieldValue("referralCode", urlRefCode);
      verifyCode(urlRefCode);
    }
  }, [urlRefCode]);

  return (
    <Card className="glass-card shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-start">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <ShieldCheck className="h-3 w-3" />
            <span>Secure Registration</span>
          </div>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Create distributor account
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-1">
          Direct DSP ingestion, WhiteLabel features, and global royalties.
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent className="px-4 sm:px-5 py-0">
              <form
                id="register-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="gap-2 sm:gap-2.5">
                  {/* First & Last Name Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {/* First Name Field */}
                    <form.Field name="firstName">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel
                              htmlFor={field.name}
                              className="text-[11px] font-medium text-foreground flex items-center gap-1"
                            >
                              <User className="h-2.5 w-2.5 text-muted-foreground" />
                              First Name
                            </FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="Alex"
                              autoComplete="given-name"
                              type="text"
                              disabled={isSubmitting}
                              className="h-8 sm:h-8.5 text-xs"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    </form.Field>

                    {/* Last Name Field */}
                    <form.Field name="lastName">
                      {(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel
                              htmlFor={field.name}
                              className="text-[11px] font-medium text-foreground flex items-center gap-1"
                            >
                              <User className="h-2.5 w-2.5 text-muted-foreground" />
                              Last Name
                            </FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="Vance"
                              autoComplete="family-name"
                              type="text"
                              disabled={isSubmitting}
                              className="h-8 sm:h-8.5 text-xs"
                            />
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </div>

                  {/* Email Field */}
                  <form.Field name="email">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-[11px] font-medium text-foreground flex items-center gap-1"
                          >
                            <Mail className="h-2.5 w-2.5 text-muted-foreground" />
                            Work / Business Email
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="label@royalmotionit.com"
                            autoComplete="email"
                            type="email"
                            disabled={isSubmitting}
                            className="h-8 sm:h-8.5 text-xs"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Password Field with Strength Meter */}
                  <form.Field name="password">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <div className="flex items-center justify-between">
                            <FieldLabel
                              htmlFor={field.name}
                              className="text-[11px] font-medium text-foreground flex items-center gap-1"
                            >
                              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                              Password
                            </FieldLabel>
                            {passwordCriteria.strengthLabel && (
                              <span
                                className={`text-[10px] font-semibold ${passwordCriteria.textColor}`}
                              >
                                {passwordCriteria.strengthLabel}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                field.handleChange(e.target.value);
                                setPasswordValue(e.target.value);
                              }}
                              aria-invalid={isInvalid}
                              placeholder="Create a strong password"
                              autoComplete="new-password"
                              type={showPassword ? "text" : "password"}
                              disabled={isSubmitting}
                              className="pr-9 h-8 sm:h-8.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              disabled={isSubmitting}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Visual Password Strength Bars & Compact Inline Check */}
                          {passwordValue.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="grid grid-cols-4 gap-1 h-0.5 w-full">
                                {[1, 2, 3, 4].map((seg) => (
                                  <div
                                    key={seg}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      passwordCriteria.score >= seg
                                        ? passwordCriteria.strengthColor
                                        : "bg-muted"
                                    }`}
                                  />
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span
                                  className={
                                    passwordCriteria.hasMinLen
                                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                      : ""
                                  }
                                >
                                  8+ chars
                                </span>
                                <span>•</span>
                                <span
                                  className={
                                    passwordCriteria.hasUpper &&
                                    passwordCriteria.hasLower
                                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                      : ""
                                  }
                                >
                                  Upper & lowercase
                                </span>
                                <span>•</span>
                                <span
                                  className={
                                    passwordCriteria.hasSpecialOrNumber
                                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                      : ""
                                  }
                                >
                                  Number / symbol
                                </span>
                              </div>
                            </div>
                          )}

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Confirm Password Field */}
                  <form.Field name="confirmPassword">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-[11px] font-medium text-foreground flex items-center gap-1"
                          >
                            <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                            Confirm Password
                          </FieldLabel>
                          <div className="relative">
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              type={showConfirmPassword ? "text" : "password"}
                              disabled={isSubmitting}
                              className="pr-9 h-8 sm:h-8.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              disabled={isSubmitting}
                              aria-label={
                                showConfirmPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Partner Referral Attribution Code (Optional, auto-populates from URL query or manual entry) */}
                  <form.Field name="referralCode">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid} className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <FieldLabel
                              htmlFor={field.name}
                              className="text-[11px] font-medium text-foreground flex items-center gap-1.5"
                            >
                              <HeartHandshake className="h-3 w-3 text-amber-500" />
                              <span>Partner Referral Code</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                (Optional)
                              </span>
                            </FieldLabel>
                            {field.state.value && (
                              <button
                                type="button"
                                onClick={() => {
                                  field.handleChange("");
                                  setVerifiedReferrer({ status: "idle" });
                                }}
                                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <Input
                              id={field.name}
                              name={field.name}
                              type="text"
                              autoComplete="off"
                              spellCheck={false}
                              disabled={isSubmitting}
                              placeholder="e.g. TECH-AGENCY (or leave blank)"
                              value={field.state.value || ""}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                field.handleChange(val);
                                verifyCode(val);
                              }}
                              className="h-8 sm:h-8.5 text-xs font-mono uppercase tracking-wider pr-8"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                              {verifiedReferrer.status === "checking" && (
                                <Spinner className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                              )}
                              {verifiedReferrer.status === "valid" && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              {verifiedReferrer.status === "invalid" && (
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                          </div>

                          {/* Verification State Banner / Helper */}
                          {verifiedReferrer.status === "valid" && (
                            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                Referred by <strong>{verifiedReferrer.name}</strong> ({verifiedReferrer.code})
                              </span>
                            </div>
                          )}

                          {verifiedReferrer.status === "invalid" && (
                            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-600 dark:text-rose-400">
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <p className="font-medium">
                                  {verifiedReferrer.message || "Invalid or inactive partner referral code."}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Only active partner codes can be applied. You may clear this field if you do not have an active partner code.
                                </p>
                              </div>
                            </div>
                          )}

                          {verifiedReferrer.status === "idle" && !field.state.value && (
                            <p className="text-[10px] text-muted-foreground">
                              Joining via an affiliate link? Your code auto-populates here, or you can enter it manually.
                            </p>
                          )}

                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-2 sm:pt-2.5 flex flex-col gap-2">
              <Button
                type="submit"
                form="register-form"
                className="w-full cursor-pointer h-8.5 sm:h-9 text-xs sm:text-sm font-semibold active:scale-[0.98] shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p className="text-[10px] text-muted-foreground/80 leading-tight">
                  By registering, you agree to our Terms of Service & Privacy
                  Policy.
                </p>
                <div className="text-[11px]">
                  Already registered?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </CardFooter>
          </>
        )}
      </form.Subscribe>
    </Card>
  );
}
