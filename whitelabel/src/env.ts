import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    API_BASE_URL: z.string().url(),
    API_KEY: z.string().min(1),
    INTERNAL_API_SECRET: z.string().min(32),
  },
  client: {},
  runtimeEnv: {
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
  },
});
