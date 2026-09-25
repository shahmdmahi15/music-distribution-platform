"use client";

import { useForm } from "@tanstack/react-form";
import {
  ResendVerificationInput,
  resendVerificationSchema,
} from "@/schemas/auth/resend-verification.schema";
import { resendVerificationAction } from "@/actions/auth/resend-verification.action";
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
import { useRouter } from "next/navigation";

export function ResendVerificationForm() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: resendVerificationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await resendVerificationAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof ResendVerificationInput;

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
        console.log("[Component.Auth.ResendVerification] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="glass-card shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
          Resend Verification
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-1">
          Enter your email to receive a new account verification link.
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent className="px-4 sm:px-5 py-0">
              <form
                id="resend-verification-form"
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
                            className="text-[11px] font-medium"
                          >
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
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-2 sm:pt-2.5 flex flex-col gap-2">
              <Button
                type="submit"
                form="resend-verification-form"
                className="w-full cursor-pointer h-8.5 sm:h-9 text-xs sm:text-sm active:scale-[0.98] font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Email"
                )}
              </Button>

              <div className="text-center text-[11px] text-muted-foreground">
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
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
