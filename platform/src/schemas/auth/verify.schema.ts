import { z } from "zod";

export const verifySchema = z.object({
  token: z.string("Token must be a string").trim(),
});

export type VerifyInput = z.infer<typeof verifySchema>;
export type VerifyError = z.inferFlattenedErrors<typeof verifySchema>;
