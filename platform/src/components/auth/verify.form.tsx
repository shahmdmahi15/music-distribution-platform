"use client";

import { useForm } from "@tanstack/react-form";
import { VerifyInput, verifySchema } from "@/schemas/auth/verify.schema";
import { verifyAction } from "@/actions/auth/verify.action";
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
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function VerifyForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      token: token,
    },
    validators: {
      onSubmit: verifySchema,
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const result = await verifyAction(value);

        if (!result.success) {
          toast.error(result.message);

          if (result.error && result.error.fieldErrors) {
            Object.entries(result.error.fieldErrors).forEach(
              ([field, messages]) => {
                const errorMessages = messages as string[] | undefined;

                if (errorMessages && errorMessages.length > 0) {
                  const fieldName = field as keyof VerifyInput;

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
        console.log("[Component.Auth.Verify] Error: ", error);
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="glass-card shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mb-1">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
          Verify Account
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-1">
          Click below to confirm and verify your email address.
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent className="px-4 sm:px-5 py-0">
              <form
                id="verify-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="hidden">
                  {/* Token Field */}
                  <form.Field name="token">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name} hidden>
                            Token
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Token"
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
                </FieldGroup>
              </form>
            </CardContent>

            <CardFooter className="p-4 sm:p-5 pt-2 sm:pt-2.5 flex flex-col gap-2">
              <Button
                type="submit"
                form="verify-form"
                className="w-full cursor-pointer h-8.5 sm:h-9 text-xs sm:text-sm active:scale-[0.98] font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email Address"
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
