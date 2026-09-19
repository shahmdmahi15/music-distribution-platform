import { z } from "zod";

export const verifyMfaSchema = z.object({
  code: z
    .string("Code must be a string")
    .length(6, "The 2FA code must be exactly 6 digits"),
});

export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;
export type VerifyMfaError = z.inferFlattenedErrors<typeof verifyMfaSchema>;
