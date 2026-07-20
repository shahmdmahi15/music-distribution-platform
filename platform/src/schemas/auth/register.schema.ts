import { z } from "zod";

export const registerSchema = z
  .object({
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

    email: z.email("Email must be valid"),

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
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterError = z.inferFlattenedErrors<typeof registerSchema>;
