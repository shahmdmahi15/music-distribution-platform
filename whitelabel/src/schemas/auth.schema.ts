import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /((?=.*\d)|(?=.*\W+))(?=.*[a-z])(?=.*[A-Z]).*$/,
      "Password must include uppercase, lowercase, and a number or symbol",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyMfaSchema = z.object({
  code: z.string().length(6, "Code must be exactly 6 digits"),
});

export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;

export const requestResetSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type RequestResetInput = z.infer<typeof requestResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /((?=.*\d)|(?=.*\W+))(?=.*[a-z])(?=.*[A-Z]).*$/,
      "Password must include uppercase, lowercase, and a number or symbol",
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
