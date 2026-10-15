import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(3000),
    API_BASE_URL: z
      .string()
      .url()
      .transform((val) => val.replace(/\/+$/, "")),
    API_KEY: z.string().min(1),
    INTERNAL_API_SECRET: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    PORT: process.env.PORT,
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
