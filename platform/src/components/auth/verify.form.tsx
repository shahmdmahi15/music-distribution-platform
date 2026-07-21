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
        console.log("[Component.Auth.Verify] Error: ", { error });
        toast.error("Internal Form Error");
      }
    },
  });

  return (
    <Card className="shadow-xl">
      <CardHeader className="space-y-1.5 pb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verify Account
        </CardTitle>
        <CardDescription>
          Click the button below to confirm and verify your email address
        </CardDescription>
      </CardHeader>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <>
            <CardContent>
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

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                form="verify-form"
                className="w-full cursor-pointer h-10 active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email Address"
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
