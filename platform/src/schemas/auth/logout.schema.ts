import { z } from "zod";

export const logoutSchema = z.object({
  token: z.string("Token must be a string").trim(),
});

export type LogoutType = z.infer<typeof logoutSchema>;
