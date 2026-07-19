import { z } from "zod";

export const verifySchema = z.object({
  token: z.string("Token must be a string").trim(),
});

export type VerifyType = z.infer<typeof verifySchema>;
