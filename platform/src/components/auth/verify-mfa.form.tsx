"use client";

import { useForm } from "@tanstack/react-form";
import {
  VerifyMfaInput,
  verifyMfaSchema,
} from "@/schemas/auth/verify-mfa.schema";
import { verifyMfaAction } from "@/actions/auth/verify-mfa.action";
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
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function VerifyMfaForm({ userId }: { userId: string }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      userId: userId,
      code: "",
    },
    validators: {
      onSubmit: verifyMfaSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await verifyMfaAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof VerifyMfaInput;

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
        router.replace(result.redirectUrl || "/");
      } catch (error) {
        console.log("[Component.Auth.VerifyMfa] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1.5 pb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          MFA Verification
        </CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app to complete
          sign in
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent>
              <form
                id="verify-mfa-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="gap-4">
                  {/* User Id Field (Hidden) */}
                  <form.Field name="userId">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid} className="hidden">
                          <FieldLabel htmlFor={field.name} hidden>
                            User Id
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="User Id"
                            autoComplete="off"
                            type="text"
                            hidden
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>

                  {/* Code Field */}
                  <form.Field name="code">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel
                            htmlFor={field.name}
                            className="font-medium"
                          >
                            Verification Code
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter 6-digit code"
                            autoComplete="one-time-code"
                            type="text"
                            disabled={isSubmitting}
                            className="text-center tracking-widest font-mono text-lg"
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
                form="verify-mfa-form"
                className="w-full cursor-pointer h-10 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
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
