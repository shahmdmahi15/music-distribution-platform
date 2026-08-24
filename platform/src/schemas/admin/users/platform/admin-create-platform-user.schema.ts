import { z } from "zod";
import { Role } from "@/types/user";

export const adminCreatePlatformUserSchema = z.object({
  firstName: z
    .string("First name must be a string")
    .trim()
    .min(2, "First name must be at least 2 characters long")
    .max(64, "First name must be at most 64 characters long"),

  lastName: z
    .string("Last name must be a string")
    .trim()
    .min(2, "Last name must be at least 2 characters long")
    .max(64, "Last name must be at most 64 characters long"),

  email: z.email("Email must be a valid email address"),

  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),

  role: z.enum(Role, {
    message: "Please select a valid role for this user",
  }),

  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

export type AdminCreatePlatformUserInput = z.infer<
  typeof adminCreatePlatformUserSchema
>;
export type AdminCreatePlatformUserError = z.inferFlattenedErrors<
  typeof adminCreatePlatformUserSchema
>;
