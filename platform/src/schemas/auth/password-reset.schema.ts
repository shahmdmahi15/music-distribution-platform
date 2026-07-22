import { z } from "zod";

export const passwordResetSchema = z
  .object({
    token: z.string("Token must be a string").trim(),

    password: z
      .string("Password must be a string")
      .trim()
      .min(8, "Password must be at least 8 characters long")
      .max(64, "Password must be at most 64 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number or special character",
      ),

    confirmPassword: z.string("Confirm password must be a string").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetError = z.inferFlattenedErrors<
  typeof passwordResetSchema
>;
