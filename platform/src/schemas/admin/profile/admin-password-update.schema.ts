import { z } from "zod";

export const adminPasswordUpdateSchema = z
  .object({
    currentPassword: z
      .string("Current password must be a string")
      .trim()
      .min(8, "Current password must be at least 8 characters long")
      .max(64, "Current password must be at most 64 characters long"),

    newPassword: z
      .string("New password must be a string")
      .trim()
      .min(8, "New password must be at least 8 characters long")
      .max(64, "New password must be at most 64 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number or special character",
      ),

    confirmNewPassword: z
      .string("Confirm new password must be a string")
      .trim(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type AdminPasswordUpdateInput = z.infer<
  typeof adminPasswordUpdateSchema
>;
export type AdminPasswordUpdateError = z.inferFlattenedErrors<
  typeof adminPasswordUpdateSchema
>;
