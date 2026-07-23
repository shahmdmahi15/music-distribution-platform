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
    <Card className="shadow-xl">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Resend Verification
        </CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a new link to verify
          your account
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent>
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
                            className="font-medium"
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
                            placeholder="name@example.com"
                            autoComplete="email"
                            type="email"
                            disabled={isSubmitting}
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

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                form="resend-verification-form"
                className="w-full cursor-pointer h-10 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Verification Email"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground mt-2">
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
