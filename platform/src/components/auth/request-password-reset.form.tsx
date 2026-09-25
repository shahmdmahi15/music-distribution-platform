"use client";

import { useForm } from "@tanstack/react-form";
import {
  RequestPasswordResetInput,
  requestPasswordResetSchema,
} from "@/schemas/auth/request-password-reset.schema";
import { requestPasswordResetAction } from "@/actions/auth/request-password-reset.action";
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
import Link from "next/link";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function RequestPasswordResetForm() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: requestPasswordResetSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await requestPasswordResetAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof RequestPasswordResetInput;

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
        console.log("[Component.Auth.RequestPasswordReset] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="glass-card shadow-2xl border-border/80 relative overflow-hidden bg-card/90 backdrop-blur-xl">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary mb-0.5 shadow-sm">
          <KeyRound className="h-4.5 w-4.5" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-2">
          Enter your registered email address and we&apos;ll send you an
          encrypted recovery link.
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent className="px-4 sm:px-5 py-0">
              <form
                id="request-password-reset-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup>
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
                            Email Address
                          </FieldLabel>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              placeholder="name@royalmotionit.com"
                              autoComplete="email"
                              type="email"
                              disabled={isSubmitting}
                              className="pl-9 h-8.5 sm:h-9 text-xs sm:text-sm"
                            />
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
                form="request-password-reset-form"
                className="w-full cursor-pointer h-8.5 sm:h-9 text-xs sm:text-sm active:scale-[0.98] font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  "Send Encrypted Reset Link"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1.5 text-[11px]"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
              </div>
            </CardFooter>
          </>
        )}
      </form.Subscribe>
    </Card>
  );
}
