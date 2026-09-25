"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { LoginInput, loginSchema } from "@/schemas/auth/login.schema";
import { loginAction } from "@/actions/auth/login.action";
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
import { Eye, EyeOff, ShieldCheck, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await loginAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof LoginInput;

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

        if (result.requireMfa) {
          toast.info(result.message);
          router.replace("/auth/verify-mfa");
          return;
        }

        toast.success(result.message);
        router.replace(result.redirectUrl || "/");
      } catch (error) {
        console.log("[Component.Auth.Login] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="glass-card shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <ShieldCheck className="h-3 w-3" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            Portal Access
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-1">
          Sign in to access your distribution dashboard and streaming analytics.
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent className="px-4 sm:px-5 py-0">
              <form
                id="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="gap-2.5 sm:gap-3">
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
                            Email Address
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="name@royalmotionit.com"
                            autoComplete="email"
                            type="email"
                            disabled={isSubmitting}
                            className="h-8.5 sm:h-9 text-xs sm:text-sm"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Password Field */}
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
                            <Link
                              href="/auth/request-password-reset"
                              className="text-[11px] text-primary hover:underline transition-colors font-medium"
                            >
                              Forgot password?
                            </Link>
                          </div>
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
                              placeholder="••••••••"
                              autoComplete="current-password"
                              type={showPassword ? "text" : "password"}
                              disabled={isSubmitting}
                              className="pr-9 h-8.5 sm:h-9 text-xs sm:text-sm"
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
                form="login-form"
                className="w-full cursor-pointer h-8.5 sm:h-9 text-xs sm:text-sm font-semibold active:scale-[0.98] shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="flex flex-col items-center justify-center gap-1.5 w-full text-center text-xs text-muted-foreground">
                <div className="text-[11px]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary hover:underline font-semibold"
                  >
                    Create an account
                  </Link>
                </div>
                <div className="text-[10px] text-muted-foreground/80">
                  Need email verification?{" "}
                  <Link
                    href="/auth/resend-verification"
                    className="text-primary hover:underline font-medium"
                  >
                    Resend link
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
