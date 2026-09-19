import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    API_BASE_URL: z.string().url(),
    API_KEY: z.string().min(1),
    INTERNAL_API_SECRET: z.string().min(32),
    DEFAULT_WHITELABEL_SUBDOMAIN: z.string().optional().default(""),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    DEFAULT_WHITELABEL_SUBDOMAIN: process.env.DEFAULT_WHITELABEL_SUBDOMAIN,
  },
});
