import { z } from "zod";

export const verifyMfaSchema = z.object({
  userId: z.string("User id must be a string").trim(),

  code: z
    .string("Code must be a string")
    .length(6, "The 2FA code must be exactly 6 digits"),
});

export type VerifyMfaType = z.infer<typeof verifyMfaSchema>;
